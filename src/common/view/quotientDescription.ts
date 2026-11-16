import { QUOTIENT_DESCRIPTION_SETTINGS } from "../../EquilibriumLabConstants.js";
/**
 * quotientDescription.ts
 *
 * Plain-text descriptions of a mixture for screen readers: which way it is shifting, and Q and K
 * in the chosen form with Unicode superscripts.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { StringManager } from "../../i18n/StringManager.js";
import { EquilibriumForm } from "../model/EquilibriumForm.js";
import type { ReactionMixture } from "../model/ReactionMixture.js";
import { shiftDirection } from "../model/shiftDirection.js";
import { scientificFromLn, toPlainSuperscript } from "./formatValues.js";

export type QuotientDescription = {
  /** "Q is less than K, so the mixture shifts toward products", … */
  readonly direction: string;
  readonly q: string;
  readonly k: string;
};

export function describeQuotient(
  mixture: ReactionMixture,
  formProperty: TReadOnlyProperty<EquilibriumForm>,
): QuotientDescription {
  const a11y = StringManager.getInstance().getCommonStrings().a11y;
  const kp = formProperty.value === EquilibriumForm.KP && mixture.reaction.isGas;
  const direction = {
    right: a11y.shiftRightStringProperty,
    left: a11y.shiftLeftStringProperty,
    none: a11y.atEquilibriumStringProperty,
    stuck: a11y.cannotReactStringProperty,
  }[shiftDirection(mixture.lnQOverK)].value;
  return {
    direction,
    q: toPlainSuperscript(
      scientificFromLn(kp ? mixture.lnQp : mixture.lnQc, QUOTIENT_DESCRIPTION_SETTINGS.DESCRIBE_QUOTIENT_DIGITS),
    ),
    k: toPlainSuperscript(
      scientificFromLn(kp ? mixture.lnKp : mixture.lnKc, QUOTIENT_DESCRIPTION_SETTINGS.DESCRIBE_QUOTIENT_DIGITS),
    ),
  };
}
