/**
 * ICEProblem.ts
 *
 * An ICE-table problem and its solution. Two kinds:
 *  - "findEquilibrium": given the initial concentrations and K, find x and the equilibrium row;
 *  - "findK": given the initial concentrations and one equilibrium concentration, find x and K.
 *
 * x is the extent of reaction per litre toward products, so the equilibrium row is
 * [X]ₑ = [X]₀ + νₓ·x. A student may write the change row with the opposite sign convention
 * (every coefficient negated); then their x is the negative of this one.
 *
 * The K given in a problem is rounded to three significant figures, and the reaction's ΔS° is
 * adjusted so that it holds exactly; likewise a given equilibrium concentration is rounded and K is
 * computed from it, so the answer follows from the numbers on the screen.
 */

import type { Random } from "scenerystack/dot";
import { amountsAtExtent, extentBounds, solveEquilibriumExtent } from "../../common/model/equilibriumSolver.js";
import type { Reaction } from "../../common/model/Reaction.js";
import { GAS_CONSTANT } from "../../EquilibriumLabConstants.js";

export type ICEMode = "findEquilibrium" | "findK";

export type ICEProblem = {
  readonly mode: ICEMode;
  /** The reaction, with ΔS° adjusted so its Kc at `temperature` is exactly the rounded `k`. */
  readonly reaction: Reaction;
  readonly temperature: number;
  /** Initial concentrations (M). */
  readonly initial: readonly number[];
  /** findK: the species whose equilibrium concentration is given, and that concentration (M). */
  readonly givenIndex: number | null;
  readonly givenValue: number | null;
  /** The solution: x (M, toward products), the equilibrium row (M) and Kc. */
  readonly x: number;
  readonly equilibrium: readonly number[];
  readonly k: number;
};

/** Rounds to `digits` significant figures. */
export function roundSignificant(value: number, digits = 3): number {
  if (value === 0 || !Number.isFinite(value)) {
    return value;
  }
  const scale = 10 ** (digits - 1 - Math.floor(Math.log10(Math.abs(value))));
  return Math.round(value * scale) / scale;
}

/** Kc of a set of equilibrium concentrations. */
export function kFromConcentrations(reaction: Reaction, concentrations: readonly number[]): number {
  return reaction.species.reduce((product, s, i) => product * (concentrations[i] ?? 0) ** s.nu, 1);
}

/** Generic reactions: K values that make tidy problems. */
const GENERIC_K_VALUES = [0.25, 0.5, 2, 4, 10, 25];

/** Creates a problem for `reaction` (at its default temperature) using `random`. */
export function createProblem(base: Reaction, mode: ICEMode, random: Random): ICEProblem {
  const d = base.definition;
  const temperature = d.defaultTemperature;
  const volume = d.defaultVolume;

  // Generic reactions get a random tidy K; the others use their own K at the default temperature.
  const lnTarget =
    base.family === "generic"
      ? Math.log(GENERIC_K_VALUES[random.nextInt(GENERIC_K_VALUES.length)] ?? 2)
      : base.lnKc(temperature);

  // Initial concentrations: reactants between 30 % and 90 % of the largest default amount,
  // products usually absent (sometimes present, so the reaction may run either way).
  const largest = Math.max(...d.defaultAmounts) / volume;
  const anyProducts = random.nextDouble() < 0.3;
  const initial = base.species.map((s) => {
    if (s.nu < 0 || anyProducts) {
      const fraction = s.nu < 0 ? random.nextDoubleBetween(0.3, 0.9) : random.nextDoubleBetween(0.1, 0.5);
      return roundSignificant(fraction * largest, 2);
    }
    return 0;
  });
  const amounts = initial.map((c) => c * volume);

  if (mode === "findEquilibrium") {
    const kShown = roundSignificant(Math.exp(lnTarget), 3);
    const reaction = withKc(base, temperature, kShown);
    const x = solveEquilibriumExtent(reaction, amounts, volume, Math.log(kShown)) / volume;
    const equilibrium = initial.map((c, i) => c + (base.species[i]?.nu ?? 0) * x);
    return { mode, reaction, temperature, initial, givenIndex: null, givenValue: null, x, equilibrium, k: kShown };
  }

  // findK: give the equilibrium concentration of the first product (rounded), and derive K.
  const trueX = solveEquilibriumExtent(base, amounts, volume, lnTarget) / volume;
  const givenIndex = base.productIndices[0] ?? 0;
  const nu = base.species[givenIndex]?.nu ?? 1;
  const givenValue = roundSignificant((initial[givenIndex] ?? 0) + nu * trueX, 3);
  let x = (givenValue - (initial[givenIndex] ?? 0)) / nu;
  const { min, max } = extentBounds(base, amounts);
  x = Math.min(max / volume, Math.max(min / volume, x));
  const equilibrium = amountsAtExtent(base, amounts, x * volume).map((n) => n / volume);
  const k = kFromConcentrations(base, equilibrium);
  const reaction = withKc(base, temperature, k);
  return { mode, reaction, temperature, initial, givenIndex, givenValue, x, equilibrium, k };
}

/** A copy of `reaction` whose Kc at `temperature` is exactly `k`. */
function withKc(reaction: Reaction, temperature: number, k: number): Reaction {
  const shift = Math.log(k) - reaction.lnKc(temperature);
  return reaction.withParameters({ deltaS: reaction.deltaS + GAS_CONSTANT * shift });
}

/** Relative tolerance for an entered x or K. */
export const ANSWER_TOLERANCE = 0.02;

/**
 * Whether `coefficients` (the change row, in multiples of x) is right: each is the stoichiometric
 * coefficient times one common sign. Returns that sign (+1 or −1), or 0 if the row is wrong.
 */
export function changeRowSign(reaction: Reaction, coefficients: readonly number[]): 1 | -1 | 0 {
  for (const sign of [1, -1] as const) {
    if (reaction.species.every((s, i) => coefficients[i] === sign * s.nu)) {
      return sign;
    }
  }
  return 0;
}

/** Whether `entered` matches `expected` within ANSWER_TOLERANCE (relative). */
export function matches(entered: number, expected: number): boolean {
  if (expected === 0) {
    return Math.abs(entered) < 1e-9;
  }
  return Math.abs(entered - expected) <= ANSWER_TOLERANCE * Math.abs(expected);
}

/**
 * The small-x test: x as a percentage of the smallest nonzero initial reactant concentration
 * consumed, and which species that is. Null when no reactant is consumed from a nonzero start.
 */
export function smallXPercent(problem: ICEProblem): { percent: number; index: number } | null {
  let best: { percent: number; index: number } | null = null;
  problem.reaction.species.forEach((s, i) => {
    const c0 = problem.initial[i] ?? 0;
    const consumed = -s.nu * problem.x;
    if (c0 > 0 && consumed > 0) {
      const percent = (100 * consumed) / c0;
      if (!best || percent > best.percent) {
        best = { percent, index: i };
      }
    }
  });
  return best;
}
