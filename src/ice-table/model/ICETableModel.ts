import { ICE_TABLE_MODEL_SETTINGS } from "../../EquilibriumLabConstants.js";
/**
 * ICETableModel.ts
 *
 * The ICE Table screen: generated problems that the student works through an ICE table. They write
 * the change row as multiples of x, enter x (and, in "find K" problems, K), and check. "Run it"
 * then starts the real mixture from the initial row, so the student can watch it settle on the
 * equilibrium row they wrote.
 */

import { Emitter, NumberProperty, Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Random, Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import type { ReactionId, Species } from "../../common/model/Reaction.js";
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
const CHANGE_COEFFICIENT_RANGE = new Range(
  ICE_TABLE_MODEL_SETTINGS.CHANGE_COEFFICIENT_RANGE_MIN,
  ICE_TABLE_MODEL_SETTINGS.CHANGE_COEFFICIENT_RANGE_MAX,
);

/** Seed for problem generation, so a fresh screen always offers the same first problems. */
const PROBLEM_SEED: number = ICE_TABLE_MODEL_SETTINGS.PROBLEM_SEED;

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

type ICESpeciesRow = {
  readonly species: Species;
  readonly initial: number;
  readonly coefficientProperty: NumberProperty;
};

export class ICETableModel implements TModel {
  public readonly modeProperty = new Property<ICEMode>("findEquilibrium", {
    validValues: ["findEquilibrium", "findK"],
  });
  public readonly reactionIdProperty = new Property<ReactionId>("dinitrogenTetroxide", {
    validValues: ICE_REACTION_IDS,
  });
  public readonly problemProperty: TReadOnlyProperty<ICEProblem>;

  /** Fires after the new problem and its rows are available. */
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

  private readonly currentProblemProperty: Property<ICEProblem>;
  private rows: readonly ICESpeciesRow[] = [];
  private readonly random = new Random({ seed: PROBLEM_SEED });

  /**
   * When true, mode/reaction listeners skip the rebuild — used by reset() so a single
   * newProblem() runs after both Properties settle, instead of one per reset Property.
   */
  private suppressProblemRefresh = false;

  public constructor() {
    const problem = this.generate();
    this.currentProblemProperty = new Property(problem);
    this.problemProperty = this.currentProblemProperty;
    this.scene = new ReactionSceneModel(problem.reaction);
    this.applyProblem(problem);

    // Synchronous on purpose: the mode, reaction and problem must never disagree (showSolution or
    // a check in between would grade the wrong problem). applyProblem() orders the teardown so
    // the view releases the old row before its Properties are disposed.
    const refresh = () => {
      if (!this.suppressProblemRefresh) {
        this.newProblem();
      }
    };
    this.modeProperty.lazyLink(refresh);
    this.reactionIdProperty.lazyLink(refresh);
    const clearCheck = () => {
      this.checkProperty.value = null;
    };
    this.xEntryProperty.lazyLink(clearCheck);
    this.kEntryProperty.lazyLink(clearCheck);
  }

  public get problem(): ICEProblem {
    return this.problemProperty.value;
  }

  /** One editable coefficient of x per species, paired with its initial concentration. */
  public get speciesRows(): readonly ICESpeciesRow[] {
    return this.rows;
  }

  /** The equilibrium row the student's entries give (M), or null until x is entered. */
  public getEnteredEquilibrium(): number[] | null {
    const x = this.xEntryProperty.value;
    if (x === null) {
      return null;
    }
    return this.rows.map(({ initial, coefficientProperty }) => initial + coefficientProperty.value * x);
  }

  public newProblem(): void {
    this.applyProblem(this.generate());
  }

  public check(): void {
    const problem = this.problem;
    const sign = changeRowSign(
      this.rows.map(({ species, coefficientProperty }) => ({ species, coefficient: coefficientProperty.value })),
    );
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
    for (const { species, coefficientProperty } of this.rows) {
      coefficientProperty.value = species.nu;
    }
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
    this.scene.restart(this.rows.map(({ initial }) => initial * volume));
    this.scene.timer.isPlayingProperty.value = true;
  }

  /** K from the student's equilibrium row, for "find K" feedback. */
  public kFromEntries(): number | null {
    const equilibrium = this.getEnteredEquilibrium();
    return equilibrium ? kFromConcentrations(this.problem.reaction, equilibrium) : null;
  }

  public reset(): void {
    this.suppressProblemRefresh = true;
    this.modeProperty.reset();
    this.reactionIdProperty.reset();
    this.suppressProblemRefresh = false;
    this.scene.reset();
    this.newProblem();
  }

  public step(dt: number): void {
    this.scene.step(dt);
  }

  private generate(): ICEProblem {
    return createProblem(getReaction(this.reactionIdProperty.value), this.modeProperty.value, this.random);
  }

  /**
   * Clears the entries and sets the mixture to the new problem's initial row, paused.
   *
   * Coefficient Properties are swapped before the view rebuilds, and the old ones are disposed
   * only after Multilinks/NumberPickers have released them. Setting x/k to null before that
   * disposal used to notify Multilinks still wired to disposed dependencies (?ea asserts).
   */
  private applyProblem(problem: ICEProblem): void {
    if (problem.initial.length !== problem.reaction.species.length) {
      throw new Error("An ICE problem must provide one initial concentration per species.");
    }
    const initialRows = problem.reaction.species.map((species, index) => {
      const initial = problem.initial[index];
      if (initial === undefined) {
        throw new Error(`An ICE problem is missing the initial concentration for ${species.id}.`);
      }
      return { species, initial };
    });
    const oldRows = this.rows;
    this.rows = initialRows.map(({ species, initial }) => {
      const coefficientProperty = new NumberProperty(0, { range: CHANGE_COEFFICIENT_RANGE, numberType: "Integer" });
      coefficientProperty.lazyLink(() => {
        this.checkProperty.value = null;
      });
      return { species, initial, coefficientProperty };
    });
    this.currentProblemProperty.value = problem;

    // View drops Multilinks/pickers on the old row and binds to the new Properties.
    this.changeRowRebuiltEmitter.emit();

    for (const { coefficientProperty } of oldRows) {
      coefficientProperty.dispose();
    }

    this.xEntryProperty.value = null;
    this.kEntryProperty.value = null;
    this.checkProperty.value = null;
    this.solutionShownProperty.value = false;
    const volume = problem.reaction.definition.defaultVolume;
    this.scene.setReaction(
      problem.reaction,
      this.rows.map(({ initial }) => initial * volume),
    );
    this.scene.mixture.temperatureProperty.value = problem.temperature;
    this.scene.timer.isPlayingProperty.value = false;
  }
}
