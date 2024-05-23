import { inject as service } from "@ember/service";
import Modifier from "ember-modifier";

export default class DrawPixelsModifier extends Modifier {
  @service drawingState;

  // (element, positional-args-array, named-args-bject)
  modify(element, [scale], options) {
    const width = options.width || 16;
    const ctx = element.getContext("2d");
    element.width = width * scale;
    element.height = width * scale;

    for (let i = 0; i < this.drawingState.pixels.length; i += 4) {
      const pixels = this.drawingState.pixels;
      const y = i === 0 ? 0 : Math.floor(i / (width * 4));
      const x = (i % (width * 4)) / 4;
      const rgb = {
        r: pixels[i],
        g: pixels[i + 1],
        b: pixels[i + 2],
        a: pixels[i + 3],
      };
      if (rgb.a === 0) {
        ctx.clearRect(x * scale, y * scale, scale, scale);
      } else {
        ctx.fillStyle =
          "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + "," + rgb.a + ")";
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
    if (options.setDataURL) {
      this.drawingState.dataURL = element.toDataURL();
    }
  }
}
