/**
 * ReactionSceneModel.ts
 *
 * What the Approach, ICE Table and Le Chatelier screens share: a reacting mixture, the particle
 * box that replays it, records of concentration and of the forward and reverse rates against
 * time, the clock and its speed, and whether Q and K are shown in the Kc or Kp form.
 *
 * Screen models compose one of these rather than extending it.
 */

import { EnumerationProperty, NumberProperty } from "scenerystack/axon";
import { TimeSpeed } from "scenerystack/scenery-phet";
import { MARKER_MERGE_TIME, REACTION_TIME_SCALE } from "../../EquilibriumLabConstants.js";
import { TimeModel } from "../TimeModel.js";
import { EquilibriumForm } from "./EquilibriumForm.js";
import { ParticleSystem } from "./ParticleSystem.js";
import type { Reaction } from "./Reaction.js";
import { ReactionMixture } from "./ReactionMixture.js";
import { TimeRecord } from "./TimeRecord.js";
import { timeScaleFor } from "./timeScale.js";

export class ReactionSceneModel {
  public readonly mixture: ReactionMixture;
  public readonly particles: ParticleSystem;

  /** One trace per species: concentration (M) against time (s). */
  public readonly concentrationRecord: TimeRecord;

  /** Two traces: forward and reverse rate (M/s) against time (s). */
  public readonly rateRecord = new TimeRecord(2);

  public readonly timer = new TimeModel(true);
  public readonly timeSpeedProperty = new EnumerationProperty(TimeSpeed.NORMAL);

  /** Simulated time since the run started (s). */
  public readonly elapsedTimeProperty = new NumberProperty(0, { units: "s" });

  public readonly formProperty: EnumerationProperty<EquilibriumForm>;
  private initialForm: EquilibriumForm;

  public constructor(reaction: Reaction, initialForm: EquilibriumForm = EquilibriumForm.KC) {
    this.mixture = new ReactionMixture(reaction);
    this.particles = new ParticleSystem(this.mixture);
    this.concentrationRecord = new TimeRecord(reaction.species.length);
    this.formProperty = new EnumerationProperty(initialForm);
    this.initialForm = initialForm;
    this.mixture.reactionProperty.lazyLink((newReaction, oldReaction) => {
      if (newReaction.species.length !== oldReaction.species.length || newReaction.id !== oldReaction.id) {
        this.concentrationRecord.setTraceCount(newReaction.species.length);
      }
    });
    this.recordNow(true);
  }

  /** Sets the form that Reset All returns to, and shows it now (the Kp preference changed). */
  public setInitialForm(kp: boolean): void {
    const form = kp ? EquilibriumForm.KP : EquilibriumForm.KC;
    this.formProperty.value = form;
    this.initialForm = form;
  }

  public get reaction(): Reaction {
    return this.mixture.reaction;
  }

  /** Starts a new run from `amounts` (mol): clears the records and the clock. */
  public restart(amounts: readonly number[]): void {
    this.mixture.setAmounts(amounts);
    this.clearRecords();
  }

  /** Switches reaction, with its default conditions and amounts. */
  public setReaction(reaction: Reaction, amounts?: readonly number[]): void {
    this.mixture.setReaction(reaction, amounts);
    this.clearRecords();
  }

  /** Marks a stress on the charts at the current time, recording the state on both sides of it. */
  public markStress(label: string, applyStress: () => void): void {
    this.recordNow(true);
    applyStress();
    this.recordNow(true);
    this.concentrationRecord.addMarker(this.elapsedTimeProperty.value, label, MARKER_MERGE_TIME);
    this.rateRecord.addMarker(this.elapsedTimeProperty.value, label, MARKER_MERGE_TIME);
  }

  public step(dt: number): void {
    if (this.timer.isPlayingProperty.value) {
      this.advance(dt);
    }
  }

  /** Advances by `dt` real seconds at the chosen speed, playing or not (step button). */
  public advance(dt: number): void {
    const simulatedDt = dt * timeScaleFor(this.timeSpeedProperty.value, REACTION_TIME_SCALE);
    this.mixture.step(simulatedDt);
    this.particles.step(dt, simulatedDt);
    this.elapsedTimeProperty.value += simulatedDt;
    this.recordNow(false);
  }

  public reset(): void {
    this.timer.reset();
    this.timeSpeedProperty.reset();
    this.formProperty.value = this.initialForm;
    this.mixture.reset();
    this.clearRecords();
  }

  public dispose(): void {
    this.particles.dispose();
    this.mixture.dispose();
    this.concentrationRecord.dispose();
    this.rateRecord.dispose();
    this.timer.dispose();
    this.timeSpeedProperty.dispose();
    this.elapsedTimeProperty.dispose();
    this.formProperty.dispose();
  }

  private clearRecords(): void {
    this.elapsedTimeProperty.value = 0;
    this.concentrationRecord.clear();
    this.rateRecord.clear();
    this.recordNow(true);
  }

  private recordNow(force: boolean): void {
    const time = this.elapsedTimeProperty.value;
    const rates = this.mixture.getRates();
    this.concentrationRecord.record(time, this.mixture.getConcentrations(), force);
    this.rateRecord.record(time, [rates.forward, rates.reverse], force);
  }
}
