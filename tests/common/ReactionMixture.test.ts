/**
 * ReactionMixture.test.ts
 *
 * The solver against textbook ICE problems, conservation and convergence of the kinetics, and
 * the direction of the shift after each Le Chatelier stress.
 */

import { describe, expect, it } from "vitest";
import { equilibriumAmounts, lnQc, solveEquilibriumExtent } from "../../src/common/model/equilibriumSolver.js";
import { Reaction } from "../../src/common/model/Reaction.js";
import { ReactionMixture } from "../../src/common/model/ReactionMixture.js";
import { getReaction, getReactions } from "../../src/common/model/Reactions.js";

/** Runs a mixture until |ln(Q/K)| is tiny, returning the simulated time it took. */
function settle(mixture: ReactionMixture, limit = 600): number {
  const dt = 1 / 30;
  let time = 0;
  while (time < limit && !(Math.abs(mixture.lnQOverK) < 1e-3)) {
    mixture.step(dt);
    time += dt;
  }
  return time;
}

/** Moles of each element, from the species formulas' stoichiometry (by species id). */
function nitrogenAtoms(amounts: readonly number[]): number {
  // N₂, H₂, NH₃
  return 2 * (amounts[0] ?? 0) + (amounts[2] ?? 0);
}

describe("equilibriumSolver", () => {
  it("solves the textbook N₂O₄ problem: 0.0400 M with Kc = 4.64 × 10⁻³", () => {
    const base = getReaction("dinitrogenTetroxide");
    // Choose ΔS° so Kc at 298.15 K is exactly 4.64 × 10⁻³.
    const target = Math.log(4.64e-3);
    const shift = target - base.lnKc(298.15);
    const reaction = base.withParameters({ deltaS: base.deltaS + 8.314462618 * shift });
    const x = solveEquilibriumExtent(reaction, [0.04, 0], 1, reaction.lnKc(298.15));
    // (2x)² / (0.0400 − x) = 4.64 × 10⁻³  →  4x² + 4.64 × 10⁻³ x − 1.856 × 10⁻⁴ = 0  →  x = 0.006256
    expect(x).toBeCloseTo(0.006256, 5);
  });

  it("solves H₂ + I₂ ⇌ 2HI with K = 50.5 from 1.00 M each: x = 0.780", () => {
    const base = getReaction("hydrogenIodide");
    const reaction = base.withParameters({ deltaS: Reaction.entropyForK(50.5, base.deltaH) });
    const x = solveEquilibriumExtent(reaction, [1, 1, 0], 1, Math.log(50.5));
    expect(x).toBeCloseTo(0.7804, 4);
  });

  it("reaches the same equilibrium from reactants and from products", () => {
    const reaction = getReaction("haber");
    const t = reaction.definition.defaultTemperature;
    const fromReactants = equilibriumAmounts(reaction, [0.1, 0.3, 0], 1, t);
    const fromProducts = equilibriumAmounts(reaction, [0, 0, 0.2], 1, t);
    fromReactants.forEach((n, i) => {
      expect(fromProducts[i]).toBeCloseTo(n, 9);
    });
    expect(lnQc(reaction, fromReactants, 1)).toBeCloseTo(reaction.lnKc(t), 6);
  });
});

describe("ReactionMixture", () => {
  it("every reaction settles at K from its default start in a reasonable time", () => {
    for (const reaction of getReactions()) {
      const mixture = new ReactionMixture(reaction);
      const time = settle(mixture);
      expect(time, reaction.id).toBeGreaterThan(3);
      expect(time, reaction.id).toBeLessThan(120);
      mixture.dispose();
    }
  });

  it("approaches K from the product side too", () => {
    const mixture = new ReactionMixture(getReaction("dinitrogenTetroxide"));
    mixture.setAmounts([0, 0.08]);
    expect(mixture.lnQOverK).toBe(Number.POSITIVE_INFINITY);
    settle(mixture);
    expect(Math.abs(mixture.lnQOverK)).toBeLessThan(1e-3);
    expect(mixture.getAmount(0)).toBeGreaterThan(0);
    mixture.dispose();
  });

  it("conserves atoms while it reacts", () => {
    const mixture = new ReactionMixture(getReaction("haber"));
    const before = nitrogenAtoms(mixture.getAmounts());
    for (let i = 0; i < 300; i++) {
      mixture.step(1 / 30);
    }
    expect(nitrogenAtoms(mixture.getAmounts())).toBeCloseTo(before, 12);
    mixture.dispose();
  });

  it("forward and reverse rates become equal at equilibrium", () => {
    const mixture = new ReactionMixture(getReaction("hydrogenIodide"));
    mixture.equilibrate();
    const { forward, reverse } = mixture.getRates();
    expect(forward).toBeGreaterThan(0);
    expect(reverse / forward).toBeCloseTo(1, 6);
    mixture.dispose();
  });

  it("gross flows differ by exactly the net extent", () => {
    const mixture = new ReactionMixture(getReaction("dinitrogenTetroxide"));
    for (let i = 0; i < 200; i++) {
      mixture.step(1 / 30);
    }
    const { forward, reverse } = mixture.getFlows();
    expect(forward - reverse).toBeCloseTo(mixture.getTotalExtent(), 12);
    expect(reverse).toBeGreaterThan(0);
    mixture.dispose();
  });

  it("stays stable when a catalysed reaction relaxes faster than a frame", () => {
    const mixture = new ReactionMixture(getReaction("thiocyanatoiron"));
    mixture.catalystProperty.value = true;
    mixture.temperatureProperty.value = 348;
    mixture.step(1);
    expect(Math.abs(mixture.lnQOverK)).toBeLessThan(1e-3);
    expect(mixture.getAmounts().every((n) => n >= 0 && Number.isFinite(n))).toBe(true);
    mixture.dispose();
  });
});

describe("Le Chatelier stresses", () => {
  /** A mixture of `reaction` at equilibrium. */
  function atEquilibrium(id: Parameters<typeof getReaction>[0]): ReactionMixture {
    const mixture = new ReactionMixture(getReaction(id));
    mixture.equilibrate();
    return mixture;
  }

  it("adding a reactant makes Q < K (shift right); adding a product makes Q > K (shift left)", () => {
    const mixture = atEquilibrium("haber");
    mixture.addAmount(0, 0.05);
    expect(mixture.lnQOverK).toBeLessThan(0);
    mixture.equilibrate();
    mixture.addAmount(2, 0.05);
    expect(mixture.lnQOverK).toBeGreaterThan(0);
    mixture.dispose();
  });

  it("compressing shifts toward fewer moles of gas; Δn = 0 does not shift", () => {
    const n2o4 = atEquilibrium("dinitrogenTetroxide");
    n2o4.volumeProperty.value = 0.5;
    expect(n2o4.lnQOverK).toBeGreaterThan(0); // toward N₂O₄
    n2o4.dispose();

    const haber = atEquilibrium("haber");
    haber.volumeProperty.value = 0.5;
    expect(haber.lnQOverK).toBeLessThan(0); // toward NH₃
    haber.dispose();

    const hi = atEquilibrium("hydrogenIodide");
    hi.volumeProperty.value = 0.5;
    expect(Math.abs(hi.lnQOverK)).toBeLessThan(1e-9);
    hi.dispose();
  });

  it("inert gas: no shift at constant volume, a shift at constant pressure", () => {
    const fixedVolume = atEquilibrium("haber");
    const pressure = fixedVolume.getTotalPressure();
    fixedVolume.addInertGas(0.2, false);
    expect(Math.abs(fixedVolume.lnQOverK)).toBeLessThan(1e-9);
    expect(fixedVolume.getTotalPressure()).toBeGreaterThan(pressure);
    fixedVolume.dispose();

    const fixedPressure = atEquilibrium("haber");
    const before = fixedPressure.getTotalPressure();
    fixedPressure.addInertGas(0.2, true);
    expect(fixedPressure.getTotalPressure()).toBeCloseTo(before, 9);
    expect(fixedPressure.lnQOverK).toBeGreaterThan(0); // diluted: toward more moles of gas
    fixedPressure.dispose();
  });

  it("heating an exothermic reaction lowers K so the mixture shifts left", () => {
    const mixture = atEquilibrium("haber");
    mixture.temperatureProperty.value = 700;
    expect(mixture.lnQOverK).toBeGreaterThan(0);
    mixture.dispose();
  });

  it("heating the cobalt chloride equilibrium shifts it toward blue CoCl₄²⁻", () => {
    const mixture = atEquilibrium("cobaltChloride");
    const before = mixture.getAmount(2);
    mixture.temperatureProperty.value = 353;
    expect(mixture.lnQOverK).toBeLessThan(0);
    mixture.equilibrate();
    expect(mixture.getAmount(2)).toBeGreaterThan(before);
    mixture.dispose();
  });

  it("a catalyst changes neither Q nor K", () => {
    const mixture = atEquilibrium("waterGasShift");
    mixture.catalystProperty.value = true;
    expect(Math.abs(mixture.lnQOverK)).toBeLessThan(1e-9);
    mixture.dispose();
  });
});
