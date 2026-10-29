/**
 * ICETableModel.ts
 *
 * The ICE Table screen: generated problems that the student works through an ICE table. They write
 * the change row as multiples of x, enter x (and, in "find K" problems, K), and check. "Run it"
 * then starts the real mixture from the initial row, so the student can watch it settle on the
 * equilibrium row they wrote.
 */

import { Emitter, NumberProperty, Property } from "scenerystack/axon";
import { Random, Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import type { ReactionId } from "../../common/model/Reaction.js";
import { ReactionSceneModel } from "../../common/model/ReactionSceneModel.js";
import { getReaction } from "../../common/model/Reactions.js";
import {
  changeRowSign,
  createProblem,
  type ICEMode,
  type ICEProblem,
  kFromConcentrations,
  matches,
} from "./ICEProblem.js";

/** Reactions whose ICE problems can be solved by hand (at most a quadratic in x). */
export const ICE_REACTION_IDS: readonly ReactionId[] = [
  "dinitrogenTetroxide",
  "hydrogenIodide",
  "waterGasShift",
  "thiocyanatoiron",
  "genericIsomer",
  "genericCombination",
  "genericDimer",
];

/** Range of each change-row coefficient (multiples of x). */
export const CHANGE_COEFFICIENT_RANGE = new Range(-4, 4);

/** Seed for problem generation, so a fresh screen always offers the same first problems. */
const PROBLEM_SEED = 18;

export type ICECheck = {
  /** +1 or −1 if the change row is right (its sign convention), 0 if not. */
  readonly sign: 1 | -1 | 0;
  /** Whether x was entered, and whether it is right (for the student's sign convention). */
  readonly xEntered: boolean;
  readonly xCorrect: boolean;
  /** findK problems: whether K was entered and is right. */
  readonly kEntered: boolean;
  readonly kCorrect: boolean;
};

export class ICETableModel implements TModel {
  public readonly modeProperty = new Property<ICEMode>("findEquilibrium", {
    validValues: ["findEquilibrium", "findK"],
  });
  public readonly reactionIdProperty = new Property<ReactionId>("dinitrogenTetroxide", {
    validValues: ICE_REACTION_IDS,
  });
  public readonly problemProperty: Property<ICEProblem>;

  /** The change row, one coefficient of x per species; rebuilt with each problem. */
  public changeCoefficientProperties: NumberProperty[] = [];

  /** Fires after changeCoefficientProperties is rebuilt. */
  public readonly changeRowRebuiltEmitter = new Emitter();

  /** The x and K the student entered (null until entered). */
  public readonly xEntryProperty = new Property<number | null>(null);
  public readonly kEntryProperty = new Property<number | null>(null);

  /** The result of the last check, or null since the entries last changed. */
  public readonly checkProperty = new Property<ICECheck | null>(null);

  /** Whether the solution is shown. */
  public readonly solutionShownProperty = new Property<boolean>(false);

  /** The mixture "Run it" plays from the initial row. */
  public readonly scene: ReactionSceneModel;

  private readonly random = new Random({ seed: PROBLEM_SEED });

  public constructor() {
    this.problemProperty = new Property(this.generate());
    this.scene = new ReactionSceneModel(this.problemProperty.value.reaction);
    this.scene.timer.isPlayingProperty.value = false;
    this.applyProblem();

    this.modeProperty.lazyLink(() => this.newProblem());
    this.reactionIdProperty.lazyLink(() => this.newProblem());
    const clearCheck = () => {
      this.checkProperty.value = null;
    };
    this.xEntryProperty.lazyLink(clearCheck);
    this.kEntryProperty.lazyLink(clearCheck);
  }

  public get problem(): ICEProblem {
    return this.problemProperty.value;
  }

  /** The change row as entered. */
  public getChangeCoefficients(): number[] {
    return this.changeCoefficientProperties.map((p) => p.value);
  }

  /** The equilibrium row the student's entries give (M), or null until x is entered. */
  public getEnteredEquilibrium(): number[] | null {
    const x = this.xEntryProperty.value;
    if (x === null) {
      return null;
    }
    return this.problem.initial.map((c, i) => c + (this.changeCoefficientProperties[i]?.value ?? 0) * x);
  }

  public newProblem(): void {
    this.problemProperty.value = this.generate();
    this.applyProblem();
  }

  public check(): void {
    const problem = this.problem;
    const sign = changeRowSign(problem.reaction, this.getChangeCoefficients());
    const x = this.xEntryProperty.value;
    const k = this.kEntryProperty.value;
    const expectedX = problem.x * (sign === 0 ? 1 : sign);
    const xCorrect = sign !== 0 && x !== null && matches(x, expectedX);
    const kCorrect = k !== null && matches(k, problem.k);
    this.checkProperty.value = { sign, xEntered: x !== null, xCorrect, kEntered: k !== null, kCorrect };
  }

  /** Fills in the change row and x (and K) with the solution. */
  public showSolution(): void {
    const problem = this.problem;
    this.changeCoefficientProperties.forEach((property, i) => {
      property.value = problem.reaction.species[i]?.nu ?? 0;
    });
    this.xEntryProperty.value = problem.x;
    if (problem.mode === "findK") {
      this.kEntryProperty.value = problem.k;
    }
    this.solutionShownProperty.value = true;
    this.check();
  }

  /** Starts the mixture from the initial row and plays it. */
  public runIt(): void {
    const problem = this.problem;
    const volume = problem.reaction.definition.defaultVolume;
    this.scene.restart(problem.initial.map((c) => c * volume));
    this.scene.timer.isPlayingProperty.value = true;
  }

  /** K from the student's equilibrium row, for "find K" feedback. */
  public kFromEntries(): number | null {
    const equilibrium = this.getEnteredEquilibrium();
    return equilibrium ? kFromConcentrations(this.problem.reaction, equilibrium) : null;
  }

  public reset(): void {
    this.modeProperty.reset();
    this.reactionIdProperty.reset();
    this.scene.reset();
    this.newProblem();
  }

  public step(dt: number): void {
    this.scene.step(dt);
  }

  private generate(): ICEProblem {
    return createProblem(getReaction(this.reactionIdProperty.value), this.modeProperty.value, this.random);
  }

  /** Clears the entries and sets the mixture to the new problem's initial row, paused. */
  private applyProblem(): void {
    const problem = this.problem;
    for (const property of this.changeCoefficientProperties) {
      property.dispose();
    }
    this.changeCoefficientProperties = problem.reaction.species.map(
      () => new NumberProperty(0, { range: CHANGE_COEFFICIENT_RANGE, numberType: "Integer" }),
    );
    for (const property of this.changeCoefficientProperties) {
      property.lazyLink(() => {
        this.checkProperty.value = null;
      });
    }
    this.xEntryProperty.value = null;
    this.kEntryProperty.value = null;
    this.checkProperty.value = null;
    this.solutionShownProperty.value = false;
    const volume = problem.reaction.definition.defaultVolume;
    this.scene.setReaction(
      problem.reaction,
      problem.initial.map((c) => c * volume),
    );
    this.scene.mixture.temperatureProperty.value = problem.temperature;
    this.scene.timer.isPlayingProperty.value = false;
    this.changeRowRebuiltEmitter.emit();
  }
}
