/**
 * VantHoffModel.test.ts
 *
 * Measuring K at several temperatures recovers ΔH° and ΔS°; measurements wait for equilibrium.
 */

import { describe, expect, it } from "vitest";
import { reactionForChoice, VANT_HOFF_CHOICE_IDS, VantHoffModel } from "../../src/vant-hoff/model/VantHoffModel.js";

/** Sets the temperature and runs until the mixture settles. */
function settleAt(model: VantHoffModel, temperature: number): void {
  model.scene.mixture.temperatureProperty.value = temperature;
  for (let i = 0; i < 30 * 120 && !model.atEquilibriumProperty.value; i++) {
    model.step(1 / 30);
  }
}

describe("VantHoffModel", () => {
  it("recovers ΔH° and ΔS° from error-free measurements for every choice", () => {
    for (const id of VANT_HOFF_CHOICE_IDS) {
      const model = new VantHoffModel();
      model.choiceProperty.value = id;
      model.measurementErrorProperty.value = false;
      const range = model.reaction.definition.temperatureRange;
      for (const fraction of [0.1, 0.4, 0.7, 0.95]) {
        settleAt(model, range.min + fraction * range.getLength());
        expect(model.atEquilibriumProperty.value, id).toBe(true);
        model.measure();
      }
      const fit = model.fitProperty.value;
      const reaction = reactionForChoice(id);
      // Measured within the equilibrium tolerance, so ΔH° to within about a percent.
      expect(Math.abs((fit?.deltaH ?? 0) - reaction.deltaH), id).toBeLessThan(0.02 * Math.abs(reaction.deltaH) + 500);
      expect(fit?.rSquared, id).toBeGreaterThan(0.999);
    }
  });

  it("refuses to measure before the mixture has settled", () => {
    const model = new VantHoffModel();
    model.scene.mixture.temperatureProperty.value = 350;
    model.step(1 / 30);
    expect(model.atEquilibriumProperty.value).toBe(false);
    model.measure();
    expect(model.pointsProperty.value).toHaveLength(0);
  });

  it("measurement error scatters the points but the fit stays close", () => {
    const model = new VantHoffModel();
    for (const t of [280, 300, 320, 340, 360]) {
      settleAt(model, t);
      model.measure();
    }
    const fit = model.fitProperty.value;
    expect(fit?.rSquared).toBeLessThan(1);
    expect(Math.abs((fit?.deltaH ?? 0) - model.reaction.deltaH)).toBeLessThan(0.25 * model.reaction.deltaH);
  });

  it("a new reaction clears the points and hides the answer", () => {
    const model = new VantHoffModel();
    model.measure();
    model.revealProperty.value = true;
    model.choiceProperty.value = "unknown1";
    expect(model.pointsProperty.value).toHaveLength(0);
    expect(model.revealProperty.value).toBe(false);
    expect(model.isUnknown).toBe(true);
  });
});
