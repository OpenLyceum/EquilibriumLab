/**
 * LeChatelierModel.ts
 *
 * The Le Chatelier screen: a mixture that starts at equilibrium, and the stresses a student can
 * apply to it: add or remove a species, compress or expand the gas (or dilute the solution), add
 * argon at fixed volume or at fixed pressure, heat or cool, and add a catalyst. Each stress is
 * marked on the concentration chart, and the model records what it did: whether it moved Q, moved
 * K, or neither, and which way the mixture must now shift.
 *
 * In "predict first" mode the student must choose a direction before each stress, and the model
 * scores the prediction against the shift that follows.
 */

import { BooleanProperty, Property } from "scenerystack/axon";
import type { TModel } from "scenerystack/joist";
import type { EquilibriumForm } from "../../common/model/EquilibriumForm.js";
import type { ReactionId } from "../../common/model/Reaction.js";
import { ReactionSceneModel } from "../../common/model/ReactionSceneModel.js";
import { getReaction, REACTION_IDS } from "../../common/model/Reactions.js";
import { type ShiftDirection, shiftDirection } from "../../common/model/shiftDirection.js";
import { ARGON_STEP_FRACTION, DILUTION_STEP_FRACTION, SPECIES_STEP_FRACTION } from "../../EquilibriumLabConstants.js";

export type StressKind = "add" | "remove" | "volume" | "inertVolume" | "inertPressure" | "temperature" | "catalyst";

/** What the last stress did. */
export type StressResult = {
  readonly kind: StressKind;
  /** Whether Q (in the Kc form) changed, and whether K changed. */
  readonly qChanged: boolean;
  readonly kChanged: boolean;
  /** Which way the mixture must shift after the stress. */
  readonly direction: ShiftDirection;
  /** The student's prediction, in predict-first mode. */
  readonly prediction: ShiftDirection | null;
};

/** Relative change in ln Q or ln K below which it counts as unchanged. */
const CHANGE_TOLERANCE = 1e-9;

export class LeChatelierModel implements TModel {
  public readonly reactionIdProperty: Property<ReactionId>;
  public readonly scene: ReactionSceneModel;

  /** The student must predict the shift before each stress. */
  public readonly predictFirstProperty = new BooleanProperty(false);

  /** The prediction for the next stress (predict-first mode), or null before one is chosen. */
  public readonly predictionProperty = new Property<ShiftDirection | null>(null);

  /** What the last stress did, or null since the mixture was (re)started. */
  public readonly lastStressProperty = new Property<StressResult | null>(null);

  /** The state when the current stress began. */
  private before: { lnQ: number; lnK: number; volume: number; temperature: number } | null = null;

  public constructor(initialForm?: EquilibriumForm) {
    this.reactionIdProperty = new Property<ReactionId>("dinitrogenTetroxide", { validValues: REACTION_IDS });
    this.scene = new ReactionSceneModel(getReaction(this.reactionIdProperty.value), initialForm);
    this.startAtEquilibrium();
    this.reactionIdProperty.lazyLink((id) => {
      this.scene.setReaction(getReaction(id));
      this.startAtEquilibrium();
    });
  }

  public get mixture() {
    return this.scene.mixture;
  }

  /** Whether stresses may be applied now (in predict-first mode, only once a prediction is chosen). */
  public get canStress(): boolean {
    return !this.predictFirstProperty.value || this.predictionProperty.value !== null;
  }

  /** Moles added or removed per press for species `index`. */
  public speciesStep(index: number): number {
    const reaction = this.mixture.reaction;
    const d = reaction.definition;
    const species = reaction.species[index];
    if (species?.bulk) {
      return SPECIES_STEP_FRACTION * (d.defaultAmounts[index] ?? 0);
    }
    const largest = Math.max(...d.defaultAmounts.filter((_n, i) => !reaction.species[i]?.bulk));
    return SPECIES_STEP_FRACTION * largest;
  }

  /** Restarts from the reaction's default mixture, already at equilibrium. */
  public startAtEquilibrium(): void {
    this.before = null;
    this.scene.restart(this.mixture.reaction.definition.defaultAmounts);
    this.mixture.equilibrate();
    this.scene.restart(this.mixture.getAmounts());
    this.lastStressProperty.value = null;
    this.predictionProperty.value = null;
  }

  /** Starts a stress that unfolds over time (piston drag, temperature slider). */
  public beginStress(): void {
    if (this.before) {
      return;
    }
    this.before = this.snapshot();
    this.scene.beginStress();
  }

  /** Ends a stress begun with beginStress(), marking it on the charts. */
  public endStress(kind: StressKind, label: string): void {
    const before = this.before;
    if (!before) {
      return; // Ignore a late release after Reset All, restart or reaction selection.
    }
    this.before = null;
    // A drag that ended where it began is not a stress.
    if (
      (kind === "volume" && before.volume === this.mixture.volume) ||
      (kind === "temperature" && before.temperature === this.mixture.temperature)
    ) {
      this.scene.endStress();
      return;
    }
    const lnQ = this.mixture.lnQc;
    const lnK = this.mixture.lnKc;
    const changed = (a: number, b: number) =>
      !(a === b || Math.abs(a - b) <= CHANGE_TOLERANCE * Math.max(1, Math.abs(a), Math.abs(b)));
    const qChanged = changed(before.lnQ, lnQ);
    const kChanged = changed(before.lnK, lnK);
    this.scene.endStress(label);
    this.lastStressProperty.value = {
      kind,
      qChanged,
      kChanged,
      direction: shiftDirection(this.mixture.lnQOverK),
      prediction: this.predictFirstProperty.value ? this.predictionProperty.value : null,
    };
    this.predictionProperty.value = null;
  }

  /** Applies an instantaneous stress. */
  public applyStress(kind: StressKind, label: string, apply: () => void): void {
    if (!this.canStress) {
      return;
    }
    this.beginStress();
    apply();
    this.endStress(kind, label);
  }

  public addSpecies(index: number, label: string): void {
    this.applyStress("add", label, () => this.mixture.addAmount(index, this.speciesStep(index)));
  }

  public removeSpecies(index: number, label: string): void {
    this.applyStress("remove", label, () => this.mixture.addAmount(index, -this.speciesStep(index)));
  }

  /** Adds water: the solution's volume grows by a fixed fraction of the largest volume. */
  public dilute(label: string): void {
    const range = this.mixture.reaction.definition.volumeRange;
    this.applyStress("volume", label, () => {
      this.mixture.volumeProperty.value = range.constrainValue(
        this.mixture.volume + DILUTION_STEP_FRACTION * range.max,
      );
    });
  }

  /**
   * Adds argon. At fixed pressure the vessel expands, but never past its largest volume, so the
   * amount added is cut short near the top.
   */
  public addArgon(constantPressure: boolean, label: string): void {
    const mixture = this.mixture;
    const gasMoles = mixture.getAmounts().reduce((sum, n) => sum + n, 0) + mixture.getInertAmount();
    let moles = ARGON_STEP_FRACTION * gasMoles;
    if (constantPressure) {
      const room = gasMoles * (mixture.reaction.definition.volumeRange.max / mixture.volume - 1);
      moles = Math.min(moles, Math.max(0, room));
    }
    if (moles <= 0) {
      return;
    }
    this.applyStress(constantPressure ? "inertPressure" : "inertVolume", label, () =>
      mixture.addInertGas(moles, constantPressure),
    );
  }

  public setCatalyst(on: boolean, label: string): void {
    this.applyStress("catalyst", label, () => {
      this.mixture.catalystProperty.value = on;
    });
  }

  /** Whether the fixed-pressure argon button can still expand the vessel. */
  public get canAddArgonAtConstantPressure(): boolean {
    return this.mixture.volume < this.mixture.reaction.definition.volumeRange.max * (1 - 1e-6);
  }

  private snapshot(): { lnQ: number; lnK: number; volume: number; temperature: number } {
    const mixture = this.mixture;
    return { lnQ: mixture.lnQc, lnK: mixture.lnKc, volume: mixture.volume, temperature: mixture.temperature };
  }

  public reset(): void {
    this.predictFirstProperty.reset();
    this.reactionIdProperty.reset();
    this.scene.reset();
    this.scene.setReaction(getReaction(this.reactionIdProperty.value));
    this.startAtEquilibrium();
  }

  public step(dt: number): void {
    this.scene.step(dt);
  }
}
