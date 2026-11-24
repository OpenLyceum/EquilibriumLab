/**
 * ICETable.test.ts
 *
 * Generated ICE problems are self-consistent, and the checker accepts the right answers under
 * either sign convention and rejects wrong ones.
 */

import { Random } from "scenerystack/dot";
import { describe, expect, it } from "vitest";
import { getReaction } from "../../src/common/model/Reactions.js";
import {
  changeRowSign,
  createProblem,
  type ICEProblem,
  kFromConcentrations,
  smallXPercent,
} from "../../src/ice-table/model/ICEProblem.js";
import { ICE_REACTION_IDS, ICETableModel } from "../../src/ice-table/model/ICETableModel.js";

describe("ICE problems", () => {
  it("the equilibrium row satisfies K for every reaction and both modes", () => {
    const random = new Random({ seed: 7 });
    for (const id of ICE_REACTION_IDS) {
      for (const mode of ["findEquilibrium", "findK"] as const) {
        for (let trial = 0; trial < 10; trial++) {
          const problem = createProblem(getReaction(id), mode, random);
          expect(problem.equilibrium.every((c) => c >= 0)).toBe(true);
          const k = kFromConcentrations(problem.reaction, problem.equilibrium);
          expect(k / problem.k, `${id} ${mode}`).toBeCloseTo(1, 4);
          expect(Math.exp(problem.reaction.lnKc(problem.temperature)) / problem.k).toBeCloseTo(1, 9);
          problem.equilibrium.forEach((c, i) => {
            expect(c).toBeCloseTo((problem.initial[i] ?? 0) + (problem.reaction.species[i]?.nu ?? 0) * problem.x, 12);
          });
          if (mode === "findK") {
            expect(problem.givenIndex).not.toBeNull();
            expect(problem.equilibrium[problem.givenIndex ?? 0]).toBeCloseTo(problem.givenValue ?? 0, 9);
          }
        }
      }
    }
  });

  it.each([
    [-1, -1, 2, 1],
    [1, 1, -2, -1],
    [-1, -1, 1, 0],
    [-1, 1, 2, 0],
  ])("checks change coefficients (%i, %i, %i) with sign %i", (hydrogen, iodine, product, sign) => {
    expect(
      changeRowSign([
        { species: { nu: -1 }, coefficient: hydrogen },
        { species: { nu: -1 }, coefficient: iodine },
        { species: { nu: 2 }, coefficient: product },
      ]),
    ).toBe(sign);
  });

  it("reports x as a percentage of the initial concentration it depletes", () => {
    const problem = createProblem(getReaction("dinitrogenTetroxide"), "findEquilibrium", new Random({ seed: 3 }));
    const result = smallXPercent(problem);
    expect(result?.index).toBe(0);
    expect(result?.percent).toBeCloseTo((100 * problem.x) / (problem.initial[0] ?? 1), 9);
  });

  it("rejects a missing concentration when calculating K", () => {
    expect(() => kFromConcentrations(getReaction("hydrogenIodide"), [1, 1])).toThrow(
      "A concentration must be supplied for each reaction species.",
    );
  });
});

describe("ICETableModel", () => {
  it("checks a correct answer, with either sign convention", () => {
    const model = new ICETableModel();
    const problem = model.problem;
    for (const { species, coefficientProperty } of model.speciesRows) {
      coefficientProperty.value = -species.nu;
    }
    model.xEntryProperty.value = -problem.x;
    model.check();
    expect(model.checkProperty.value).toMatchObject({ sign: -1, xCorrect: true });
  });

  it("rejects a wrong x and clears the verdict when an entry changes", () => {
    const model = new ICETableModel();
    model.showSolution();
    expect(model.checkProperty.value?.xCorrect).toBe(true);
    model.xEntryProperty.value = model.problem.x * 1.2;
    expect(model.checkProperty.value).toBeNull();
    model.check();
    expect(model.checkProperty.value?.xCorrect).toBe(false);
  });

  it("find-K problems check K", () => {
    const model = new ICETableModel();
    model.modeProperty.value = "findK";
    model.showSolution();
    expect(model.checkProperty.value).toMatchObject({ sign: 1, xCorrect: true, kCorrect: true });
    expect(model.kFromEntries()! / model.problem.k).toBeCloseTo(1, 6);
  });

  it("Run it settles on the solution's equilibrium row", () => {
    const model = new ICETableModel();
    model.runIt();
    for (let i = 0; i < 30 * 60; i++) {
      model.step(1 / 30);
    }
    const volume = model.problem.reaction.definition.defaultVolume;
    model.scene.mixture.getAmounts().forEach((n, i) => {
      expect(n / volume).toBeCloseTo(model.problem.equilibrium[i] ?? 0, 4);
    });
  });

  it("publishes matching rows and releases old coefficients after the views can rebind", () => {
    const model = new ICETableModel();
    model.showSolution();
    const oldRows = model.speciesRows;
    const observeProblem = (problem: ICEProblem) => {
      expect(model.speciesRows.map(({ species }) => species)).toEqual(problem.reaction.species);
      expect(model.speciesRows.map(({ initial }) => initial)).toEqual(problem.initial);
    };
    model.problemProperty.lazyLink(observeProblem);
    const checkRebuild = () => {
      expect(model.speciesRows).not.toBe(oldRows);
      expect(oldRows.every(({ coefficientProperty }) => !coefficientProperty.isDisposed)).toBe(true);
    };
    model.changeRowRebuiltEmitter.addListener(checkRebuild);
    model.reactionIdProperty.value = "waterGasShift";
    model.problemProperty.unlink(observeProblem);
    model.changeRowRebuiltEmitter.removeListener(checkRebuild);

    expect(model.problem.reaction.id).toBe("waterGasShift");
    expect(oldRows.every(({ coefficientProperty }) => coefficientProperty.isDisposed)).toBe(true);
    expect(model.speciesRows.map(({ coefficientProperty }) => coefficientProperty.value)).toEqual([0, 0, 0, 0]);
    expect(model.xEntryProperty.value).toBeNull();

    model.showSolution();
    expect(model.checkProperty.value).toMatchObject({ sign: 1, xCorrect: true });
    model.problem.equilibrium.forEach((expected, index) => {
      expect(model.getEnteredEquilibrium()?.[index]).toBeCloseTo(expected, 10);
    });
    model.reset();
    expect(model.problem.reaction.id).toBe("dinitrogenTetroxide");
    expect(model.speciesRows.map(({ coefficientProperty }) => coefficientProperty.value)).toEqual([0, 0]);
    expect(model.checkProperty.value).toBeNull();
  });
});
