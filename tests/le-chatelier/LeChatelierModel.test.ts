/**
 * LeChatelierModel.test.ts
 *
 * Each stress reports whether it moved Q or K and which way the mixture shifts, and the
 * predict-first mode scores predictions and blocks stresses until one is chosen.
 */

import { describe, expect, it } from "vitest";
import { LeChatelierModel } from "../../src/le-chatelier/model/LeChatelierModel.js";

describe("LeChatelierModel", () => {
  it("starts at equilibrium", () => {
    const model = new LeChatelierModel();
    expect(Math.abs(model.mixture.lnQOverK)).toBeLessThan(1e-6);
    expect(model.lastStressProperty.value).toBeNull();
  });

  it("adding a reactant moves Q, not K, and shifts right", () => {
    const model = new LeChatelierModel();
    model.reactionIdProperty.value = "haber";
    model.addSpecies(0, "+N₂");
    const result = model.lastStressProperty.value;
    expect(result).toMatchObject({ kind: "add", qChanged: true, kChanged: false, direction: "right" });
    expect(model.scene.concentrationRecord.markers).toHaveLength(1);
  });

  it("heating moves K, not Qc", () => {
    const model = new LeChatelierModel();
    model.beginStress();
    model.mixture.temperatureProperty.value = 330;
    model.endStress("temperature", "T↑");
    // N₂O₄ ⇌ 2NO₂ is endothermic: K rises, so Q < K and the mixture shifts right.
    expect(model.lastStressProperty.value).toMatchObject({ qChanged: false, kChanged: true, direction: "right" });
  });

  it("a drag that ends where it began is not marked", () => {
    const model = new LeChatelierModel();
    model.beginStress();
    model.endStress("volume", "V↓");
    expect(model.lastStressProperty.value).toBeNull();
    expect(model.scene.concentrationRecord.markers).toHaveLength(0);
  });

  it("argon at fixed volume changes neither Q nor K; at fixed pressure it dilutes the gases", () => {
    const model = new LeChatelierModel();
    model.addArgon(false, "+Ar");
    expect(model.lastStressProperty.value).toMatchObject({ qChanged: false, kChanged: false, direction: "none" });
    model.addArgon(true, "+Ar");
    // N₂O₄ ⇌ 2NO₂ has more moles of gas on the right, so dilution shifts right.
    expect(model.lastStressProperty.value).toMatchObject({ kind: "inertPressure", qChanged: true, direction: "right" });
    expect(model.mixture.volume).toBeLessThanOrEqual(model.mixture.reaction.definition.volumeRange.max + 1e-12);
  });

  it("diluting the cobalt equilibrium shifts it back toward pink Co(H₂O)₆²⁺", () => {
    const model = new LeChatelierModel();
    model.reactionIdProperty.value = "cobaltChloride";
    model.dilute("+H₂O");
    expect(model.lastStressProperty.value).toMatchObject({ qChanged: true, direction: "left" });
  });

  it("a catalyst changes neither Q nor K", () => {
    const model = new LeChatelierModel();
    model.setCatalyst(true, "cat.");
    expect(model.lastStressProperty.value).toMatchObject({ qChanged: false, kChanged: false, direction: "none" });
  });

  it("predict-first mode blocks stresses until a prediction is made, then scores it", () => {
    const model = new LeChatelierModel();
    model.predictFirstProperty.value = true;
    model.addSpecies(0, "+N₂O₄");
    expect(model.lastStressProperty.value).toBeNull();
    model.predictionProperty.value = "left";
    model.addSpecies(0, "+N₂O₄");
    expect(model.lastStressProperty.value).toMatchObject({ prediction: "left", direction: "right" });
    expect(model.predictionProperty.value).toBeNull();
  });

  it("the mixture returns to equilibrium after a stress", () => {
    const model = new LeChatelierModel();
    model.addSpecies(1, "+NO₂");
    for (let i = 0; i < 30 * 40; i++) {
      model.step(1 / 30);
    }
    expect(Math.abs(model.mixture.lnQOverK)).toBeLessThan(1e-3);
  });

  it("reset returns to the default reaction at equilibrium", () => {
    const model = new LeChatelierModel();
    model.reactionIdProperty.value = "haber";
    model.addSpecies(0, "+N₂");
    model.reset();
    expect(model.mixture.reaction.id).toBe("dinitrogenTetroxide");
    expect(Math.abs(model.mixture.lnQOverK)).toBeLessThan(1e-6);
    expect(model.lastStressProperty.value).toBeNull();
  });

  it.each(["temperature", "volume"] as const)(
    "holds reaction time during a %s gesture, then grades and resumes",
    (kind) => {
      const model = new LeChatelierModel();
      model.predictFirstProperty.value = true;
      model.predictionProperty.value = "right";
      const amounts = model.mixture.getAmounts();
      model.beginStress();
      if (kind === "temperature") {
        model.mixture.temperatureProperty.value = 308;
      } else {
        model.mixture.volumeProperty.value = 1.5;
      }
      for (let i = 0; i < 300; i++) {
        model.step(1 / 30);
        // Step Forward must not bypass the held gesture either.
        model.scene.advance(1 / 30);
      }
      expect(model.mixture.getAmounts()).toEqual(amounts);
      expect(model.scene.elapsedTimeProperty.value).toBe(0);
      expect(model.scene.timer.isPlayingProperty.value).toBe(true);
      model.endStress(kind, "stress");
      expect(model.lastStressProperty.value).toMatchObject({
        prediction: "right",
        direction: "right",
        qChanged: kind === "volume",
        kChanged: kind === "temperature",
      });
      model.step(1 / 30);
      expect(model.scene.elapsedTimeProperty.value).toBeGreaterThan(0);
      expect(model.mixture.getAmounts()).not.toEqual(amounts);
    },
  );

  it.each(["add", "volume"] as const)("records both sides of a %s stress at the same time", (kind) => {
    const model = new LeChatelierModel();
    model.scene.timer.isPlayingProperty.value = false;
    model.scene.advance(0.02); // Between ordinary samples.
    const time = model.scene.elapsedTimeProperty.value;
    const before = model.mixture.getConcentrations();
    const ratesBefore = model.mixture.getRates();
    if (kind === "add") {
      model.addSpecies(0, "+N₂O₄");
    } else {
      model.beginStress();
      model.mixture.volumeProperty.value = 1.5;
      model.endStress("volume", "V↑");
    }
    const after = model.mixture.getConcentrations();
    const ratesAfter = model.mixture.getRates();
    for (const [i, trace] of model.scene.concentrationRecord.traces.entries()) {
      expect(trace.at(-2)?.x).toBe(time);
      expect(trace.at(-2)?.y).toBeCloseTo(before[i]!, 12);
      expect(trace.at(-1)?.x).toBe(time);
      expect(trace.at(-1)?.y).toBeCloseTo(after[i]!, 12);
    }
    for (const [i, name] of (["forward", "reverse"] as const).entries()) {
      const trace = model.scene.rateRecord.traces[i]!;
      expect(trace.at(-2)?.x).toBe(time);
      expect(trace.at(-2)?.y).toBeCloseTo(ratesBefore[name], 12);
      expect(trace.at(-1)?.x).toBe(time);
      expect(trace.at(-1)?.y).toBeCloseTo(ratesAfter[name], 12);
    }
    expect(model.scene.concentrationRecord.markers).toEqual([{ time, label: kind === "add" ? "+N₂O₄" : "V↑" }]);
    expect(model.scene.timer.isPlayingProperty.value).toBe(false);
  });

  it("releases a no-op gesture without changing the paused state", () => {
    const model = new LeChatelierModel();
    model.scene.timer.isPlayingProperty.value = false;
    model.beginStress();
    model.endStress("temperature", "T↑");
    model.step(1 / 30);
    expect(model.scene.elapsedTimeProperty.value).toBe(0);
    model.scene.advance(1 / 30);
    expect(model.scene.elapsedTimeProperty.value).toBeGreaterThan(0);
    expect(model.scene.timer.isPlayingProperty.value).toBe(false);
    expect(model.lastStressProperty.value).toBeNull();
  });

  it.each(["reset", "startAtEquilibrium"] as const)(
    "%s cancels an active gesture and ignores its late release",
    (action) => {
      const model = new LeChatelierModel();
      model.beginStress();
      model.mixture.temperatureProperty.value = 330;
      model[action]();
      model.endStress("temperature", "T↑");
      expect(model.lastStressProperty.value).toBeNull();
      expect(model.scene.concentrationRecord.markers).toHaveLength(0);
      model.step(1 / 30);
      expect(model.scene.elapsedTimeProperty.value).toBeGreaterThan(0);
    },
  );
});
