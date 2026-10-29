/**
 * shiftDirection.ts
 *
 * Which way a mixture must react to reach equilibrium, from ln(Q/K).
 */

import { EQUILIBRIUM_LN_TOLERANCE } from "../../EquilibriumLabConstants.js";

/** "right": toward products (Q < K); "left": toward reactants (Q > K); "stuck": nothing can react. */
export type ShiftDirection = "right" | "left" | "none" | "stuck";

export function shiftDirection(lnQOverK: number): ShiftDirection {
  if (Number.isNaN(lnQOverK)) {
    return "stuck";
  }
  if (Math.abs(lnQOverK) < EQUILIBRIUM_LN_TOLERANCE) {
    return "none";
  }
  return lnQOverK < 0 ? "right" : "left";
}
