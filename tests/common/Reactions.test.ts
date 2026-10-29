/**
 * Reactions.test.ts
 *
 * Thermodynamic data against tabulated equilibrium constants, and the Kc/Kp relation.
 */

import { describe, expect, it } from "vitest";
import { getReaction, getReactions } from "../../src/common/model/Reactions.js";
import { GAS_CONSTANT_L_BAR, STANDARD_TEMPERATURE } from "../../src/EquilibriumLabConstants.js";

describe("Reactions", () => {
  it("N₂O₄ ⇌ 2NO₂ has Kp ≈ 0.15 at 298 K", () => {
    const k = Math.exp(getReaction("dinitrogenTetroxide").lnKp(STANDARD_TEMPERATURE));
    expect(k).toBeGreaterThan(0.13);
    expect(k).toBeLessThan(0.16);
  });

  it("N₂ + 3H₂ ⇌ 2NH₃ has Kp ≈ 6 × 10⁵ at 298 K", () => {
    const k = Math.exp(getReaction("haber").lnKp(STANDARD_TEMPERATURE));
    expect(k).toBeGreaterThan(4e5);
    expect(k).toBeLessThan(8e5);
  });

  it("CO + H₂O ⇌ CO₂ + H₂ has K ≈ 1 × 10⁵ at 298 K and K near 1 around 1000 K", () => {
    const reaction = getReaction("waterGasShift");
    expect(Math.exp(reaction.lnKp(STANDARD_TEMPERATURE))).toBeGreaterThan(5e4);
    expect(Math.exp(reaction.lnKp(STANDARD_TEMPERATURE))).toBeLessThan(2e5);
    expect(Math.exp(reaction.lnKp(1000))).toBeGreaterThan(0.5);
    expect(Math.exp(reaction.lnKp(1000))).toBeLessThan(2);
  });

  it("H₂ + I₂ ⇌ 2HI has K of order 50–100 near 700 K", () => {
    const k = Math.exp(getReaction("hydrogenIodide").lnKc(700));
    expect(k).toBeGreaterThan(40);
    expect(k).toBeLessThan(100);
  });

  it("the aqueous reactions reproduce their teaching values at 298 K", () => {
    expect(Math.exp(getReaction("thiocyanatoiron").lnKc(STANDARD_TEMPERATURE))).toBeCloseTo(138, 6);
    expect(Math.exp(getReaction("cobaltChloride").lnKc(STANDARD_TEMPERATURE))).toBeCloseTo(3e-3, 9);
  });

  it("Kc = Kp / (RT)^Δn for every gas reaction, and Kc = K° otherwise", () => {
    for (const reaction of getReactions()) {
      const t = reaction.definition.defaultTemperature;
      const expected = reaction.lnKp(t) - reaction.deltaNGas * Math.log(GAS_CONSTANT_L_BAR * t);
      expect(reaction.lnKc(t)).toBeCloseTo(expected, 10);
      if (!reaction.isGas) {
        expect(reaction.deltaNGas).toBe(0);
        expect(reaction.lnKc(t)).toBeCloseTo(reaction.lnStandardK(t), 12);
      }
    }
  });

  it("Le Chatelier's temperature rule: K rises with T exactly when ΔH° > 0", () => {
    for (const reaction of getReactions()) {
      const range = reaction.definition.temperatureRange;
      const rises = reaction.lnStandardK(range.max) > reaction.lnStandardK(range.min);
      if (reaction.deltaH !== 0) {
        expect(rises).toBe(reaction.deltaH > 0);
      }
    }
  });

  it("every reaction's defaults are consistent", () => {
    for (const reaction of getReactions()) {
      const d = reaction.definition;
      expect(d.defaultAmounts).toHaveLength(d.species.length);
      expect(d.temperatureRange.contains(d.defaultTemperature)).toBe(true);
      expect(d.volumeRange.contains(d.defaultVolume)).toBe(true);
      expect(reaction.reactantIndices.length).toBeGreaterThan(0);
      expect(reaction.productIndices.length).toBeGreaterThan(0);
    }
  });
});
