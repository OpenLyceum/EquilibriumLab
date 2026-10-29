/**
 * VantHoffResultsNode.ts
 *
 * The fit: slope, intercept and R², then ΔH° and ΔS° worked out from them, compared with the
 * accepted values (hidden for the unknown reactions until revealed), and the temperature at which
 * ΔG° changes sign.
 */

import { Multilink } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import type { TColor } from "scenerystack/scenery";
import { fixed, percentError, signed, significant } from "../../common/view/formatValues.js";
import { RichTextLines } from "../../common/view/RichTextLines.js";
import EquilibriumLabColors from "../../EquilibriumLabColors.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { VantHoffModel } from "../model/VantHoffModel.js";

const KJ = 1000;

export class VantHoffResultsNode extends RichTextLines {
  private readonly multilink: { dispose: () => void };

  public constructor(model: VantHoffModel, width: number) {
    super(9, width);
    const strings = StringManager.getInstance().getVantHoffStrings();
    this.multilink = Multilink.multilinkAny(
      [
        model.fitProperty,
        model.revealProperty,
        model.choiceProperty,
        strings.needTwoStringProperty,
        strings.slopePatternStringProperty,
        strings.interceptPatternStringProperty,
        strings.rSquaredPatternStringProperty,
        strings.deltaHPatternStringProperty,
        strings.deltaSPatternStringProperty,
        strings.acceptedPatternStringProperty,
        strings.crossoverPatternStringProperty,
        strings.noCrossoverStringProperty,
      ],
      () => {
        const fit = model.fitProperty.value;
        if (!fit) {
          this.setLines([strings.needTwoStringProperty.value], [EquilibriumLabColors.mutedTextColorProperty]);
          return;
        }
        const reaction = model.reaction;
        const showAccepted = !model.isUnknown || model.revealProperty.value;
        const muted = EquilibriumLabColors.mutedTextColorProperty;
        const texts: string[] = [
          StringUtils.fillIn(strings.slopePatternStringProperty.value, { value: signed(fit.slope, 0) }),
          StringUtils.fillIn(strings.interceptPatternStringProperty.value, { value: fixed(fit.intercept, 2) }),
          StringUtils.fillIn(strings.rSquaredPatternStringProperty.value, { value: fixed(fit.rSquared, 4) }),
          StringUtils.fillIn(strings.deltaHPatternStringProperty.value, { value: signed(fit.deltaH / KJ, 1) }),
        ];
        const fills: TColor[] = [muted, muted, muted, EquilibriumLabColors.textColorProperty];
        if (showAccepted) {
          texts.push(
            StringUtils.fillIn(strings.acceptedPatternStringProperty.value, {
              value: `${signed(reaction.deltaH / KJ, 1)} kJ/mol`,
              error: percentError(fit.deltaH, reaction.deltaH),
            }),
          );
          fills.push(muted);
        }
        texts.push(StringUtils.fillIn(strings.deltaSPatternStringProperty.value, { value: signed(fit.deltaS, 1) }));
        fills.push(EquilibriumLabColors.textColorProperty);
        if (showAccepted) {
          texts.push(
            StringUtils.fillIn(strings.acceptedPatternStringProperty.value, {
              value: `${signed(reaction.deltaS, 1)} J/K`,
              error: percentError(fit.deltaS, reaction.deltaS),
            }),
          );
          fills.push(muted);
        }
        const crossover = fit.deltaH / fit.deltaS;
        texts.push(
          crossover > 0 && Number.isFinite(crossover)
            ? StringUtils.fillIn(strings.crossoverPatternStringProperty.value, { value: significant(crossover, 3) })
            : strings.noCrossoverStringProperty.value,
        );
        fills.push(EquilibriumLabColors.kMarkerColorProperty);
        this.setLines(texts, fills);
      },
    );
  }

  public override dispose(): void {
    this.multilink.dispose();
    super.dispose();
  }
}
