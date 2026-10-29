/**
 * StressExplanationNode.ts
 *
 * "What changed?": after each stress, whether it moved Q or K (or neither) and which way the
 * mixture must now shift, plus the verdict on the student's prediction in predict-first mode.
 */

import { Multilink, type TReadOnlyProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { RichText, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { EquilibriumForm } from "../../common/model/EquilibriumForm.js";
import type { Reaction } from "../../common/model/Reaction.js";
import EquilibriumLabColors from "../../EquilibriumLabColors.js";
import { FONT_SIZE } from "../../EquilibriumLabConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { LeChatelierModel, StressResult } from "../model/LeChatelierModel.js";

/** RichText markup to plain text for screen-reader responses. */
export function markupToSpeech(markup: string): string {
  return markup
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** The explanation of `result` (markup). */
export function explainStress(result: StressResult | null, reaction: Reaction, form: EquilibriumForm): string {
  const strings = StringManager.getInstance().getLeChatelierStrings();
  const e = strings.explanations;
  if (!result) {
    return strings.startPromptStringProperty.value;
  }
  const byDirection = (right: TReadOnlyProperty<string>, left: TReadOnlyProperty<string>) =>
    (result.direction === "right" ? right : result.direction === "left" ? left : e.noShiftStringProperty).value;
  if (result.kind === "catalyst") {
    return e.catalystStringProperty.value;
  }
  if (result.kind === "inertVolume") {
    return e.inertVolumeStringProperty.value;
  }
  if (result.kChanged) {
    const text = byDirection(e.kRightStringProperty, e.kLeftStringProperty);
    const kp = form === EquilibriumForm.KP && reaction.isGas && reaction.deltaNGas !== 0;
    return kp ? `${text} ${e.kpNoteStringProperty.value}` : text;
  }
  if (result.qChanged) {
    return byDirection(e.qRightStringProperty, e.qLeftStringProperty);
  }
  if (result.kind === "volume" || result.kind === "inertPressure") {
    return e.volumeNoChangeStringProperty.value;
  }
  return e.noShiftStringProperty.value;
}

/** The verdict on a prediction (markup), or "" when none was made. */
export function judgePrediction(result: StressResult | null): string {
  if (!result?.prediction) {
    return "";
  }
  const strings = StringManager.getInstance().getLeChatelierStrings();
  const names = strings.directionNames;
  const name = (direction: StressResult["direction"]) =>
    ({
      right: names.rightStringProperty,
      left: names.leftStringProperty,
      none: names.noneStringProperty,
      stuck: names.stuckStringProperty,
    })[direction].value;
  return result.prediction === result.direction
    ? StringUtils.fillIn(strings.predictionCorrectStringProperty.value, { prediction: name(result.prediction) })
    : StringUtils.fillIn(strings.predictionWrongStringProperty.value, {
        prediction: name(result.prediction),
        actual: name(result.direction),
      });
}

export class StressExplanationNode extends VBox {
  private readonly multilink: { dispose: () => void };

  public constructor(model: LeChatelierModel, width: number) {
    const strings = StringManager.getInstance().getLeChatelierStrings();
    const explanation = new RichText("", {
      font: new PhetFont(FONT_SIZE.control),
      fill: EquilibriumLabColors.textColorProperty,
      lineWrap: width,
    });
    const verdict = new RichText("", {
      font: new PhetFont({ size: FONT_SIZE.control, weight: "bold" }),
      lineWrap: width,
    });
    super({ align: "left", spacing: 6, children: [explanation, verdict] });

    const e = strings.explanations;
    this.multilink = Multilink.multilinkAny(
      [
        model.lastStressProperty,
        model.scene.formProperty,
        model.mixture.reactionProperty,
        strings.startPromptStringProperty,
        e.qRightStringProperty,
        e.qLeftStringProperty,
        e.kRightStringProperty,
        e.kLeftStringProperty,
        e.volumeNoChangeStringProperty,
        e.inertVolumeStringProperty,
        e.catalystStringProperty,
        e.noShiftStringProperty,
        e.kpNoteStringProperty,
        strings.predictionCorrectStringProperty,
        strings.predictionWrongStringProperty,
      ],
      () => {
        const result = model.lastStressProperty.value;
        explanation.string = explainStress(result, model.mixture.reaction, model.scene.formProperty.value);
        verdict.string = judgePrediction(result);
        verdict.visible = verdict.string !== "";
        verdict.fill =
          result?.prediction === result?.direction
            ? EquilibriumLabColors.goodColorProperty
            : EquilibriumLabColors.poorColorProperty;
      },
    );
  }

  public override dispose(): void {
    this.multilink.dispose();
    super.dispose();
  }
}
