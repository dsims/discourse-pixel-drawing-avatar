import { tracked } from "@glimmer/tracking";
import { A } from "@ember/array";
import { action } from "@ember/object";
import Service, { inject as service } from "@ember/service";
import { avatarUrl } from "discourse-common/lib/avatar-utils";

const PIXELS_WIDTH = 16;
const NUM_PALETTE = 18;

function setPaletteColors(c, baseHSL) {
  let colors = [];
  if (!baseHSL) {
    baseHSL = { h: 360, s: 100, l: 50 };
  }

  for (let i = 0; i < NUM_PALETTE; i++) {
    let h = baseHSL.h;
    let s = baseHSL.s;
    let l = baseHSL.l;
    if (c === "h") {
      h = 360 - Math.round(360 / NUM_PALETTE) * i;
    }
    if (c === "s") {
      s = 100 - Math.round(100 / (NUM_PALETTE - 2)) * i;
    }
    if (c === "l") {
      l = 100 - Math.round(100 / NUM_PALETTE) * i;
    }
    if (l < 0) {
      l = 0;
    }
    if (s < 0) {
      s = 0;
    }
    colors[i] = { h, s, l, a: 1 };
  }
  return colors;
}

function hue2rgb(p, q, t) {
  if (t < 0) {
    t += 1;
  }
  if (t > 1) {
    t -= 1;
  }
  if (t < 1 / 6) {
    return p + (q - p) * 6 * t;
  }
  if (t < 1 / 2) {
    return q;
  }
  if (t < 2 / 3) {
    return p + (q - p) * (2 / 3 - t) * 6;
  }
  return p;
}

function hslToRgb(hsl) {
  let h = hsl.h / 360;
  let s = hsl.s / 100;
  let l = hsl.l / 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    let p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    r: Math.floor(r * 255),
    g: Math.floor(g * 255),
    b: Math.floor(b * 255),
    a: hsl.a,
  };
}
function rgbToHsl(rgb) {
  let r = rgb.r;
  let g = rgb.g;
  let b = rgb.b;
  r /= 255;
  g /= 255;
  b /= 255;
  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.floor(h * 360),
    s: Math.floor(s * 100),
    l: Math.floor(l * 100),
    a: rgb.a,
  };
}

export default class DrawingState extends Service {
  @service CurrentUser;
  @tracked pixels = A(Array(PIXELS_WIDTH * PIXELS_WIDTH * 4).fill(0));
  @tracked colorsHue = A(setPaletteColors("h"));
  @tracked colorsSaturation = A(setPaletteColors("s"));
  @tracked colorsLightness = A(setPaletteColors("l"));
  @tracked isDrawing = false;
  @tracked numpal = NUM_PALETTE;
  @tracked dataURL;

  @action
  async loadAvatar() {
    if (!this.currentUser.custom_avatar_template) {
      return;
    }
    let img = new Image();
    img.src = avatarUrl(this.currentUser.custom_avatar_template, "huge");
    await img.decode();
    let initialCanvas = document.createElement("canvas");
    initialCanvas.width = img.width;
    initialCanvas.height = img.height;
    let ctx = initialCanvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    let imageData = ctx.getImageData(0, 0, img.width, img.height).data;
    let blockSize = img.width / 16;
    let p = [...this.pixels];
    for (let x = 0; x < img.width; x += blockSize) {
      for (let y = 0; y < img.height; y += blockSize) {
        const idx = (y * img.width + x) * 4;
        const pIdx =
          ((y / blockSize) * (img.width / blockSize) + x / blockSize) * 4;
        p.set(pIdx + 0, imageData[idx + 0]);
        p.set(pIdx + 1, imageData[idx + 1]);
        p.set(pIdx + 2, imageData[idx + 2]);
        p.set(pIdx + 3, imageData[idx + 3]);
      }
    }
    this.pixels = p;
  }

  @action
  pixelGet(x, y) {
    let index = (y * PIXELS_WIDTH + x) * 4;
    return {
      r: this.pixels[index],
      g: this.pixels[index + 1],
      b: this.pixels[index + 2],
      a: this.pixels[index + 3],
    };
  }

  @action
  pixelGetHSL(x, y) {
    let index = (y * PIXELS_WIDTH + x) * 4;
    return rgbToHsl({
      r: this.pixels[index],
      g: this.pixels[index + 1],
      b: this.pixels[index + 2],
      a: this.pixels[index + 3],
    });
  }

  @action
  pixelSet(x, y, rgb) {
    if (rgb.hasOwnProperty("h")) {
      rgb = hslToRgb(rgb);
    }
    let index = (y * PIXELS_WIDTH + x) * 4;
    let p = [...this.pixels];
    p.set(index, rgb.r);
    p.set(index + 1, rgb.g);
    p.set(index + 2, rgb.b);
    p.set(index + 3, rgb.a);
    this.pixels = p;
  }

  @action
  pixelEqual(x, y, rgb) {
    let p = this.pixelGet(x, y);
    return p.r === rgb.r && p.g === rgb.g && p.b === rgb.b;
  }

  @action
  floodFillRGB(x, y, fm, to) {
    if (x < 0 || x > 15 || y < 0 || y > 15) {
      return;
    }
    if (!this.pixelEqual(x, y, fm) || this.pixelEqual(x, y, to)) {
      return;
    }
    this.pixelSet(x, y, to);
    this.floodFillRGB(x - 1, y - 1, fm, to);
    this.floodFillRGB(x - 1, y, fm, to);
    this.floodFillRGB(x - 1, y + 1, fm, to);
    this.floodFillRGB(x, y - 1, fm, to);
    this.floodFillRGB(x, y + 1, fm, to);
    this.floodFillRGB(x + 1, y - 1, fm, to);
    this.floodFillRGB(x + 1, y, fm, to);
    this.floodFillRGB(x + 1, y + 1, fm, to);
  }

  @action
  floodFill(x, y, toColorHSL) {
    if (x < 0 || x > 15 || y < 0 || y > 15) {
      return;
    }
    const fm = this.pixelGet(x, y);
    const to = hslToRgb(toColorHSL);
    this.floodFillRGB(x, y, fm, to);
  }

  @action
  paletteSelect(x, colorHSL) {
    if (x === 0) {
      this.colorsSaturation = setPaletteColors("s", colorHSL);
      this.colorsLightness = setPaletteColors("l", colorHSL);
    }
    if (x === 1) {
      this.colorsLightness = setPaletteColors("l", colorHSL);
    }
  }
}
