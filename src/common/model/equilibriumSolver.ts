/**
 * equilibriumSolver.ts
 *
 * The reaction quotient of a mixture, and the extent of reaction ξ at which a mixture reaches
 * equilibrium. A mixture with starting amounts n⁰ (mol) holds nᵢ = n⁰ᵢ + νᵢ ξ after reacting by
 * ξ moles; ln Qc(ξ) rises monotonically with ξ, from −∞ where a product runs out to +∞ where a
 * reactant runs out, so the equilibrium extent is the single root of ln Qc(ξ) − ln Kc, found by
 * bisection.
 */

import { GAS_CONSTANT_L_BAR } from "../../EquilibriumLabConstants.js";
import type { Reaction } from "./Reaction.js";

/** Bisection steps: each halves the bracket, so 200 reaches machine precision for any bracket. */
const BISECTION_STEPS = 200;

/** The extents a mixture can reach before some species runs out (mol). */
export function extentBounds(reaction: Reaction, amounts: readonly number[]): { min: number; max: number } {
  let min = Number.NEGATIVE_INFINITY;
  let max = Number.POSITIVE_INFINITY;
  reaction.species.forEach((s, i) => {
    const n = Math.max(0, amounts[i] ?? 0);
    if (s.nu < 0) {
      max = Math.min(max, n / -s.nu);
    } else {
      min = Math.max(min, -n / s.nu);
    }
  });
  return { min, max };
}

/** Amounts after reacting by `extent` moles. */
export function amountsAtExtent(reaction: Reaction, amounts: readonly number[], extent: number): number[] {
  return reaction.species.map((s, i) => Math.max(0, (amounts[i] ?? 0) + s.nu * extent));
}

/**
 * ln Q from per-species activities (concentrations in M, or pressures in bar): +∞ when a reactant
 * is absent, −∞ when a product is absent, NaN when both are.
 */
function lnQuotient(reaction: Reaction, activities: readonly number[]): number {
  let reactantMissing = false;
  let productMissing = false;
  let sum = 0;
  reaction.species.forEach((s, i) => {
    const a = activities[i] ?? 0;
    if (a <= 0) {
      if (s.nu < 0) {
        reactantMissing = true;
      } else {
        productMissing = true;
      }
    } else {
      sum += s.nu * Math.log(a);
    }
  });
  if (reactantMissing && productMissing) {
    return Number.NaN;
  }
  return reactantMissing ? Number.POSITIVE_INFINITY : productMissing ? Number.NEGATIVE_INFINITY : sum;
}

/** ln Qc of `amounts` (mol) in `volume` (L). */
export function lnQc(reaction: Reaction, amounts: readonly number[], volume: number): number {
  return lnQuotient(
    reaction,
    amounts.map((n) => n / volume),
  );
}

/** ln Qp of a gas mixture, from partial pressures pᵢ = cᵢRT in bar. */
export function lnQp(reaction: Reaction, amounts: readonly number[], volume: number, temperature: number): number {
  return lnQuotient(
    reaction,
    amounts.map((n) => (n / volume) * GAS_CONSTANT_L_BAR * temperature),
  );
}

/**
 * The extent (mol) at which `amounts` in `volume` reaches ln Qc = `lnKc`. Returns 0 when the
 * mixture cannot react in either direction (a reactant and a product are both absent).
 */
export function solveEquilibriumExtent(
  reaction: Reaction,
  amounts: readonly number[],
  volume: number,
  lnKc: number,
): number {
  const { min, max } = extentBounds(reaction, amounts);
  if (!(max > min)) {
    return 0;
  }
  let low = min;
  let high = max;
  for (let i = 0; i < BISECTION_STEPS && high - low > 0; i++) {
    const middle = (low + high) / 2;
    if (middle === low || middle === high) {
      break;
    }
    const g = lnQc(reaction, amountsAtExtent(reaction, amounts, middle), volume) - lnKc;
    if (g > 0) {
      high = middle;
    } else {
      low = middle;
    }
  }
  return (low + high) / 2;
}

/** The equilibrium amounts reached from `amounts` at `temperature`. */
export function equilibriumAmounts(
  reaction: Reaction,
  amounts: readonly number[],
  volume: number,
  temperature: number,
): number[] {
  const extent = solveEquilibriumExtent(reaction, amounts, volume, reaction.lnKc(temperature));
  return amountsAtExtent(reaction, amounts, extent);
}
