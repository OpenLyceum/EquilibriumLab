/**
 * EquilibriumForm.ts
 *
 * Whether Q and K are written with concentrations (Kc) or, for gas reactions, partial pressures
 * (Kp). Kp = Kc(RT)^Δn, so both forms always agree on the direction of shift.
 */

import { Enumeration, EnumerationValue } from "scenerystack/phet-core";

export class EquilibriumForm extends EnumerationValue {
  public static readonly KC = new EquilibriumForm();
  public static readonly KP = new EquilibriumForm();

  public static readonly enumeration = new Enumeration(EquilibriumForm);
}
