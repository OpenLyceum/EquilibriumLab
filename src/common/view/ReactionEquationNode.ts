/**
 * ReactionEquationNode.ts
 *
 * The balanced equation of the current reaction and, under it, its reaction-quotient expression
 * in the chosen Kc or Kp form.
 */

import { Multilink, type TReadOnlyProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { RichText, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import EquilibriumLabColors from "../../EquilibriumLabColors.js";
import { FONT_SIZE } from "../../EquilibriumLabConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { EquilibriumForm } from "../model/EquilibriumForm.js";
import type { Reaction } from "../model/Reaction.js";
import { equationMarkup, quotientMarkup } from "./reactionMarkup.js";

export class ReactionEquationNode extends VBox {
  private readonly multilink: { dispose: () => void };

  public constructor(
    reactionProperty: TReadOnlyProperty<Reaction>,
    formProperty: TReadOnlyProperty<EquilibriumForm>,
    maxWidth: number,
  ) {
    const strings = StringManager.getInstance().getCommonStrings();
    const equation = new RichText("", {
      font: new PhetFont({ size: 20 }),
      fill: EquilibriumLabColors.textColorProperty,
      maxWidth,
    });
    const quotient = new RichText("", {
      font: new PhetFont(FONT_SIZE.readout),
      fill: EquilibriumLabColors.textColorProperty,
      maxWidth,
    });
    super({ align: "left", spacing: 4, children: [equation, quotient] });

    this.multilink = Multilink.multilink(
      [
        reactionProperty,
        formProperty,
        strings.quotientExpressionPatternStringProperty,
        strings.kcSymbols.qStringProperty,
        strings.kpSymbols.qStringProperty,
      ],
      (reaction, form) => {
        const pressure = form === EquilibriumForm.KP && reaction.isGas;
        equation.string = equationMarkup(reaction);
        quotient.string = StringUtils.fillIn(strings.quotientExpressionPatternStringProperty.value, {
          q: (pressure ? strings.kpSymbols : strings.kcSymbols).qStringProperty.value,
          expression: quotientMarkup(reaction, pressure),
        });
      },
    );
  }

  public override dispose(): void {
    this.multilink.dispose();
    super.dispose();
  }
}
