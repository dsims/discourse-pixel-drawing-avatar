import { inject as service } from "@ember/service";
import Modifier from "ember-modifier";

export default class DrawPaletteModifier extends Modifier {
  @service drawingState;
  modify(element, [scale]) {
    const ctx = element.getContext("2d");
    element.width = 3 * scale;
    element.height = this.drawingState.numpal * scale;
    const hsl = [
      this.drawingState.colorsHue,
      this.drawingState.colorsSaturation,
      this.drawingState.colorsLightness,
    ];
    for (let c = 0; c < hsl.length; c += 1) {
      for (let i = 0; i < hsl[c].length; i += 1) {
        let color = hsl[c][i];
        ctx.fillStyle =
          "hsl(" + color.h + "," + color.s + "%," + color.l + "%)";
        ctx.fillRect(c * scale, i * scale, scale, scale);
      }
    }
  }
}
