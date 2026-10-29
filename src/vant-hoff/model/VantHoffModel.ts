/**
 * VantHoffModel.ts
 *
 * The Van 't Hoff screen: measure K at several temperatures and fit ln K against 1/T. With ΔH° and
 * ΔS° constant, ln K = −(ΔH°/R)(1/T) + ΔS°/R, so the slope gives ΔH° and the intercept ΔS°.
 *
 * The student sets the temperature, waits while the mixture re-equilibrates (the particle box
 * shows it; a catalyst keeps the wait short), then measures. K is read from the equilibrium mixture: Kp for gases, Kc for
 * solutions, i.e. K° in either case. An optional measurement error scatters the points as a real
 * experiment would. Two unknown reactions hide their ΔH° and ΔS° until revealed.
 */

import { BooleanProperty, DerivedProperty, Property, type TReadOnlyProperty } from "scenerystack/axon";
import { Random } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { Reaction } from "../../common/model/Reaction.js";
import { ReactionSceneModel } from "../../common/model/ReactionSceneModel.js";
import { getReaction } from "../../common/model/Reactions.js";
import { fitVantHoff, type VantHoffFit, type VantHoffPoint } from "../../common/model/vantHoffFit.js";
import { MEASUREMENT_LN_SPREAD, MEASUREMENT_LN_TOLERANCE } from "../../EquilibriumLabConstants.js";

export type VantHoffChoiceId =
  | "dinitrogenTetroxide"
  | "hydrogenIodide"
  | "haber"
  | "waterGasShift"
  | "thiocyanatoiron"
  | "cobaltChloride"
  | "unknown1"
  | "unknown2";

export const VANT_HOFF_CHOICE_IDS: readonly VantHoffChoiceId[] = [
  "dinitrogenTetroxide",
  "hydrogenIodide",
  "haber",
  "waterGasShift",
  "thiocyanatoiron",
  "cobaltChloride",
  "unknown1",
  "unknown2",
];

const KJ = 1000;

/** The reaction behind a choice; the unknowns are generic reactions with hidden ΔH° and K. */
export function reactionForChoice(id: VantHoffChoiceId): Reaction {
  if (id === "unknown1") {
    const base = getReaction("genericCombination");
    return base.withParameters({ deltaH: -35 * KJ, deltaS: Reaction.entropyForK(40, -35 * KJ) });
  }
  if (id === "unknown2") {
    const base = getReaction("genericIsomer");
    return base.withParameters({ deltaH: 48 * KJ, deltaS: Reaction.entropyForK(0.05, 48 * KJ) });
  }
  return getReaction(id);
}

export function isUnknown(id: VantHoffChoiceId): boolean {
  return id === "unknown1" || id === "unknown2";
}

/** Seed for the measurement errors, so a fresh screen replays the same scatter. */
const NOISE_SEED = 42;

export class VantHoffModel implements TModel {
  public readonly choiceProperty = new Property<VantHoffChoiceId>("dinitrogenTetroxide", {
    validValues: VANT_HOFF_CHOICE_IDS,
  });
  public readonly scene: ReactionSceneModel;

  /** Measured points (temperature, ln K°). */
  public readonly pointsProperty = new Property<readonly VantHoffPoint[]>([]);

  /** Whether measurements carry a small random error. */
  public readonly measurementErrorProperty = new BooleanProperty(true);

  /** Whether an unknown reaction's ΔH° and ΔS° are shown. */
  public readonly revealProperty = new BooleanProperty(false);

  /** Whether the mixture has settled at the current temperature, so K can be measured. */
  public readonly atEquilibriumProperty = new BooleanProperty(true);

  /** The least-squares fit of the points, or null with fewer than two temperatures. */
  public readonly fitProperty: TReadOnlyProperty<VantHoffFit | null>;

  private readonly random = new Random({ seed: NOISE_SEED });

  public constructor() {
    this.scene = new ReactionSceneModel(reactionForChoice(this.choiceProperty.value));
    this.startMixture();
    this.fitProperty = new DerivedProperty([this.pointsProperty], (points) => fitVantHoff(points));
    this.choiceProperty.lazyLink((id) => {
      this.scene.setReaction(reactionForChoice(id));
      this.startMixture();
      this.pointsProperty.value = [];
      this.revealProperty.value = false;
    });
    this.scene.mixture.changedEmitter.addListener(() => {
      this.atEquilibriumProperty.value = Math.abs(this.scene.mixture.lnQOverK) < MEASUREMENT_LN_TOLERANCE;
    });
  }

  public get reaction(): Reaction {
    return this.scene.reaction;
  }

  public get isUnknown(): boolean {
    return isUnknown(this.choiceProperty.value);
  }

  /** Records ln K at the current temperature, read from the mixture (with error if enabled). */
  public measure(): void {
    if (!this.atEquilibriumProperty.value) {
      return;
    }
    const mixture = this.scene.mixture;
    const error = this.measurementErrorProperty.value ? MEASUREMENT_LN_SPREAD * this.random.nextGaussian() : 0;
    this.pointsProperty.value = [
      ...this.pointsProperty.value,
      { temperature: mixture.temperature, lnK: mixture.lnStandardQ + error },
    ];
  }

  public removeLastPoint(): void {
    this.pointsProperty.value = this.pointsProperty.value.slice(0, -1);
  }

  public clearPoints(): void {
    this.pointsProperty.value = [];
  }

  public reset(): void {
    this.measurementErrorProperty.reset();
    this.choiceProperty.reset();
    this.scene.reset();
    this.scene.setReaction(reactionForChoice(this.choiceProperty.value));
    this.startMixture();
    this.pointsProperty.reset();
    this.revealProperty.reset();
  }

  /**
   * Starts the mixture at equilibrium with the catalyst in, so that after each temperature change
   * it settles in seconds rather than minutes.
   */
  private startMixture(): void {
    this.scene.mixture.catalystProperty.value = true;
    this.scene.mixture.equilibrate();
  }

  public step(dt: number): void {
    this.scene.step(dt);
  }
}
