/**
 * RichTextLines.ts
 *
 * A column of RichText lines for worked calculations, all the same font and width. Screens set the
 * strings each time their data or locale changes; an empty string hides its line.
 */

import type { TColor } from "scenerystack/scenery";
import { RichText, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import EquilibriumLabColors from "../../EquilibriumLabColors.js";
import { FONT_SIZE } from "../../EquilibriumLabConstants.js";

export class RichTextLines extends VBox {
  private readonly lines: RichText[];

  public constructor(count: number, maxWidth: number) {
    const lines = Array.from(
      { length: count },
      () =>
        new RichText("", {
          font: new PhetFont(FONT_SIZE.control),
          fill: EquilibriumLabColors.textColorProperty,
          maxWidth,
        }),
    );
    super({ align: "left", spacing: 4, children: lines });
    this.lines = lines;
  }

  /** Sets each line's text (missing entries clear the line) and optional colours. */
  public setLines(texts: readonly string[], fills: readonly (TColor | undefined)[] = []): void {
    this.lines.forEach((line, i) => {
      const text = texts[i] ?? "";
      line.string = text;
      line.visible = text !== "";
      line.fill = fills[i] ?? EquilibriumLabColors.textColorProperty;
    });
  }
}
