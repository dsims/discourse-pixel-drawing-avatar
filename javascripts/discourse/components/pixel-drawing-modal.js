import Component from "@glimmer/component";
import { tracked } from "@glimmer/tracking";
import { A } from "@ember/array";
import { action } from "@ember/object";
import { service } from "@ember/service";
import { htmlSafe } from "@ember/template";
import { helperContext } from "discourse-common/lib/helpers";

function relMouseCoords(event, scale) {
  let canvasX = event.offsetX;
  let canvasY = event.offsetY;
  return { x: Math.floor(canvasX / scale), y: Math.floor(canvasY / scale) };
}

export default class PixelDrawingModal extends Component {
  @service drawingState;
  @tracked versions = A([]);
  @tracked selectedButton = "paint";
  @tracked selectedColor = { h: 360, s: 100, l: 50, a: 1 };
  @tracked isDrawing = false;
  @tracked
  maxAvatarSize =
    helperContext()
      .siteSettings["avatar_sizes"].split("|")
      .map((s) => parseInt(s, 10))
      .sort((a, b) => b - a)[0] / 16;
  scale = 32;
  paletteScale = 28;

  constructor() {
    super(...arguments);
    this.drawingState.loadAvatar();
  }

  get selectedColorStyle() {
    return htmlSafe(
      `width:16px;max-width:16px;min-height:16px;background-color: hsl(${this.selectedColor.h},${this.selectedColor.s}%,${this.selectedColor.l}%)`
    );
  }

  @action
  canvasClick(e) {
    const coords = relMouseCoords(e, this.scale);
    if (this.selectedButton === "fill") {
      this.versions.push(this.drawingState.pixels.slice());
      this.drawingState.floodFill(coords.x, coords.y, this.selectedColor);
      this.isDrawing = false;
    } else if (this.selectedButton === "dropper") {
      let color = this.drawingState.pixelGetHSL(coords.x, coords.y);
      if (color.a !== 0) {
        this.selectedColor = color;
        this.drawingState.paletteSelect(0, this.selectedColor);
      }
    } else {
      let drawColor = { ...this.selectedColor };
      if (this.selectedButton === "eraser") {
        drawColor = { h: 0, s: 0, l: 0, a: 0 };
      }
      this.versions.push(this.drawingState.pixels.slice());
      this.isDrawing = true;
      this.drawingState.pixelSet(coords.x, coords.y, drawColor);
    }
  }

  @action
  canvasMove(e) {
    if (this.isDrawing) {
      let drawColor = { ...this.selectedColor };
      if (this.selectedButton === "eraser") {
        drawColor = { h: 0, s: 0, l: 0, a: 0 };
      }
      const coords = relMouseCoords(e, this.scale);
      this.drawingState.pixelSet(coords.x, coords.y, drawColor);
    }
  }

  @action
  canvasEnter(e) {
    let element = e.target;
    const paintbrush = `data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' style='transform: rotate(0.25turn);stroke:black;stroke-width: 4;' fill='hsl(${this.selectedColor.h},${this.selectedColor.s}%,${this.selectedColor.l}%)' viewBox='0 0 576 512'%3e%3cpath d='M339.3 367.1c27.3-3.9 51.9-19.4 67.2-42.9L568.2 74.1c12.6-19.5 9.4-45.3-7.6-61.2S517.7-4.4 499.1 9.6L262.4 187.2c-24 18-38.2 46.1-38.4 76.1L339.3 367.1zm-19.6 25.4l-116-104.4C143.9 290.3 96 339.6 96 400c0 3.9 .2 7.8 .6 11.6C98.4 429.1 86.4 448 68.8 448H64c-17.7 0-32 14.3-32 32s14.3 32 32 32H208c61.9 0 112-50.1 112-112c0-2.5-.1-5-.2-7.5z'/%3e%3c/svg%3e`;
    const dropper = `data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' style='transform: rotate(0.25turn);stroke:black;stroke-width: 4;' viewBox='0 0 512 512'%3e%3cpath d='M341.6 29.2L240.1 130.8l-9.4-9.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-9.4-9.4L482.8 170.4c39-39 39-102.2 0-141.1s-102.2-39-141.1 0zM55.4 323.3c-15 15-23.4 35.4-23.4 56.6v42.4L5.4 462.2c-8.5 12.7-6.8 29.6 4 40.4s27.7 12.5 40.4 4L89.7 480h42.4c21.2 0 41.6-8.4 56.6-23.4L309.4 335.9l-45.3-45.3L143.4 411.3c-3 3-7.1 4.7-11.3 4.7H96V379.9c0-4.2 1.7-8.3 4.7-11.3L221.4 247.9l-45.3-45.3L55.4 323.3z'/%3e%3c/svg%3e`;
    const fill = `data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' style='stroke:black;stroke-width: 4;' fill='hsl(${this.selectedColor.h},${this.selectedColor.s}%,${this.selectedColor.l}%)' viewBox='0 0 576 512'%3e%3cpath d='M86.6 9.4C74.1-3.1 53.9-3.1 41.4 9.4s-12.5 32.8 0 45.3L122.7 136 30.6 228.1c-37.5 37.5-37.5 98.3 0 135.8L148.1 481.4c37.5 37.5 98.3 37.5 135.8 0L474.3 290.9c28.1-28.1 28.1-73.7 0-101.8L322.9 37.7c-28.1-28.1-73.7-28.1-101.8 0L168 90.7 86.6 9.4zM168 181.3l49.4 49.4c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L213.3 136l53.1-53.1c3.1-3.1 8.2-3.1 11.3 0L429.1 234.3c3.1 3.1 3.1 8.2 0 11.3L386.7 288H67.5c1.4-5.4 4.2-10.4 8.4-14.6L168 181.3z'/%3e%3c/svg%3e`;
    const eraser = `data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' style='transform: rotate(0.25turn);stroke:black;stroke-width: 4;' viewBox='0 0 576 512'%3e%3cpath d='M290.7 57.4L57.4 290.7c-25 25-25 65.5 0 90.5l80 80c12 12 28.3 18.7 45.3 18.7H288h9.4H512c17.7 0 32-14.3 32-32s-14.3-32-32-32H387.9L518.6 285.3c25-25 25-65.5 0-90.5L381.3 57.4c-25-25-65.5-25-90.5 0zM297.4 416H288l-105.4 0-80-80L227.3 211.3 364.7 348.7 297.4 416z'/%3e%3c/svg%3e`;
    let img = paintbrush;
    if (this.selectedButton === "dropper") {
      img = dropper;
    }
    if (this.selectedButton === "fill") {
      img = fill;
    }
    if (this.selectedButton === "eraser") {
      img = eraser;
    }
    element.style.cursor = 'url("' + img + '"), auto';
  }

  @action
  canvasLeave(e) {
    let element = e.target;
    element.style.cursor = "default";
    this.canvasStopDraw();
  }

  @action
  canvasStopDraw() {
    this.isDrawing = false;
  }
  @action
  selectButton(buttonId) {
    this.selectedButton = buttonId;
  }
  @action
  clickUndo() {
    if (this.versions.length > 1) {
      this.drawingState.pixels = this.versions.pop().slice();
    }
    if (this.versions.length === 1) {
      this.drawingState.pixels = this.versions[0].slice();
    }
  }

  @action
  paletteClick(e) {
    const coords = relMouseCoords(e, this.paletteScale);
    if (coords.x === 0) {
      this.selectedColor = this.drawingState.colorsHue[coords.y];
      this.drawingState.paletteSelect(0, this.selectedColor);
    }
    if (coords.x === 1) {
      this.selectedColor = this.drawingState.colorsSaturation[coords.y];
      this.drawingState.paletteSelect(1, this.selectedColor);
    }
    if (coords.x === 2) {
      this.selectedColor = this.drawingState.colorsLightness[coords.y];
    }
    if (!this.selectedColor) {
      return;
    }
  }

  @action
  save() {
    if (this.drawingState.dataURL) {
      this.args.save(this.drawingState.dataURL);
      this.close();
    } else {
      this.close();
    }
  }

  @action
  close() {
    this.args.closeModal();
  }
}
