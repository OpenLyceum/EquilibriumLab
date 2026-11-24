import { ICE_PROBLEM_SETTINGS } from "../../EquilibriumLabConstants.js";
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
import type { Reaction, Species } from "../../common/model/Reaction.js";
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
function roundSignificant(value: number, digits: number = ICE_PROBLEM_SETTINGS.DEFAULT_DIGITS): number {
  if (value === 0 || !Number.isFinite(value)) {
    return value;
  }
  const scale = 10 ** (digits - 1 - Math.floor(Math.log10(Math.abs(value))));
  return Math.round(value * scale) / scale;
}

function concentrationAt(concentrations: readonly number[], index: number, species: Species): number {
  const concentration = concentrations[index];
  if (concentration === undefined) {
    throw new Error(`Missing concentration for ${species.id}.`);
  }
  return concentration;
}

/** Kc of a set of equilibrium concentrations. */
export function kFromConcentrations(reaction: Reaction, concentrations: readonly number[]): number {
  if (concentrations.length !== reaction.species.length) {
    throw new Error("A concentration must be supplied for each reaction species.");
  }
  return reaction.species.reduce(
    (product, species, i) => product * concentrationAt(concentrations, i, species) ** species.nu,
    1,
  );
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
  const anyProducts = random.nextDouble() < ICE_PROBLEM_SETTINGS.PRODUCT_PRESENT_PROBABILITY;
  const initialRows = base.species.map((species) => {
    if (species.nu < 0 || anyProducts) {
      const fraction =
        species.nu < 0
          ? random.nextDoubleBetween(
              ICE_PROBLEM_SETTINGS.REACTANT_FRACTION_MIN,
              ICE_PROBLEM_SETTINGS.REACTANT_FRACTION_MAX,
            )
          : random.nextDoubleBetween(
              ICE_PROBLEM_SETTINGS.PRODUCT_FRACTION_MIN,
              ICE_PROBLEM_SETTINGS.PRODUCT_FRACTION_MAX,
            );
      return { species, concentration: roundSignificant(fraction * largest, 2) };
    }
    return { species, concentration: 0 };
  });
  const initial = initialRows.map(({ concentration }) => concentration);
  const amounts = initial.map((c) => c * volume);

  if (mode === "findEquilibrium") {
    const kShown = roundSignificant(Math.exp(lnTarget), ICE_PROBLEM_SETTINGS.GIVEN_SIGNIFICANT_FIGURES);
    const reaction = withKc(base, temperature, kShown);
    const x = solveEquilibriumExtent(reaction, amounts, volume, Math.log(kShown)) / volume;
    const equilibrium = initialRows.map(({ species, concentration }) => concentration + species.nu * x);
    return { mode, reaction, temperature, initial, givenIndex: null, givenValue: null, x, equilibrium, k: kShown };
  }

  // findK: give the equilibrium concentration of the first product (rounded), and derive K.
  const trueX = solveEquilibriumExtent(base, amounts, volume, lnTarget) / volume;
  const givenIndex = initialRows.findIndex(({ species }) => species.nu > 0);
  const givenRow = initialRows[givenIndex];
  if (givenRow === undefined) {
    throw new Error("A find K problem requires a product concentration to give.");
  }
  const givenCoefficient = givenRow.species.nu;
  const givenValue = roundSignificant(
    givenRow.concentration + givenCoefficient * trueX,
    ICE_PROBLEM_SETTINGS.GIVEN_SIGNIFICANT_FIGURES,
  );
  let x = (givenValue - givenRow.concentration) / givenCoefficient;
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
const ANSWER_TOLERANCE: number = ICE_PROBLEM_SETTINGS.ANSWER_TOLERANCE;

/**
 * Whether `coefficients` (the change row, in multiples of x) is right: each is the stoichiometric
 * coefficient times one common sign. Returns that sign (+1 or −1), or 0 if the row is wrong.
 */
export function changeRowSign(
  rows: readonly { readonly species: Pick<Species, "nu">; readonly coefficient: number }[],
): 1 | -1 | 0 {
  for (const sign of [1, -1] as const) {
    if (rows.every(({ species, coefficient }) => coefficient === sign * species.nu)) {
      return sign;
    }
  }
  return 0;
}

/** Whether `entered` matches `expected` within ANSWER_TOLERANCE (relative). */
export function matches(entered: number, expected: number): boolean {
  if (expected === 0) {
    return Math.abs(entered) < ICE_PROBLEM_SETTINGS.ZERO_ANSWER_TOLERANCE;
  }
  return Math.abs(entered - expected) <= ANSWER_TOLERANCE * Math.abs(expected);
}

/**
 * The small-x test: x as a percentage of the smallest nonzero initial reactant concentration
 * consumed, and which species that is. Null when no reactant is consumed from a nonzero start.
 */
export function smallXPercent(problem: ICEProblem): { percent: number; index: number } | null {
  let best: { percent: number; index: number } | null = null;
  problem.reaction.species.forEach((species, i) => {
    const c0 = concentrationAt(problem.initial, i, species);
    const consumed = -species.nu * problem.x;
    if (c0 > 0 && consumed > 0) {
      const percent = (100 * consumed) / c0;
      if (!best || percent > best.percent) {
        best = { percent, index: i };
      }
    }
  });
  return best;
}
