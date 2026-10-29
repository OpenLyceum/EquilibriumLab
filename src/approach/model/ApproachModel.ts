/**
 * ApproachModel.ts
 *
 * The Approach screen: pick a reaction and its starting concentrations, then watch the mixture
 * react until Q reaches K and the forward and reverse rates are equal. Changing a starting
 * concentration restarts the run from the new mixture. The generic reactions also let the student
 * set K (at 298 K) and the forward rate constant.
 */

import { Emitter, NumberProperty, Property } from "scenerystack/axon";
import { dotRandom, Range } from "scenerystack/dot";
import type { TModel } from "scenerystack/joist";
import { EquilibriumForm } from "../../common/model/EquilibriumForm.js";
import { Reaction, type ReactionId } from "../../common/model/Reaction.js";
import { ReactionSceneModel } from "../../common/model/ReactionSceneModel.js";
import { getReaction, REACTION_IDS } from "../../common/model/Reactions.js";

/** log₁₀ of the generic reactions' K at 298 K. */
export const GENERIC_LOG_K_RANGE = new Range(-2, 2);

/** The generic reactions' forward rate constant (M^(1−order)/s). */
export const GENERIC_FORWARD_RATE_RANGE = new Range(0.02, 1);

export type StartingMixture = "reactants" | "products" | "random";

export class ApproachModel implements TModel {
  public readonly reactionIdProperty: Property<ReactionId>;
  public readonly scene: ReactionSceneModel;

  /** Starting concentration of each species (M); rebuilt when the reaction changes. */
  public initialConcentrationProperties: NumberProperty[] = [];

  /** Fires after initialConcentrationProperties is rebuilt for a new reaction. */
  public readonly initialConcentrationsRebuiltEmitter = new Emitter();

  public readonly genericLogKProperty = new NumberProperty(Math.log10(2), { range: GENERIC_LOG_K_RANGE });
  public readonly genericForwardRateProperty = new NumberProperty(0.2, { range: GENERIC_FORWARD_RATE_RANGE });

  /** True while the model itself writes the starting concentrations, so they don't each restart the run. */
  private settingConcentrations = false;

  public constructor(startWithKp = false) {
    this.reactionIdProperty = new Property<ReactionId>("dinitrogenTetroxide", { validValues: REACTION_IDS });
    this.scene = new ReactionSceneModel(
      getReaction(this.reactionIdProperty.value),
      startWithKp ? EquilibriumForm.KP : EquilibriumForm.KC,
    );
    this.rebuildInitialConcentrations();

    this.reactionIdProperty.lazyLink((id) => {
      this.scene.setReaction(this.parameterizedReaction(getReaction(id)));
      this.rebuildInitialConcentrations();
    });
    const updateGeneric = () => {
      const reaction = this.scene.reaction;
      if (reaction.family === "generic") {
        this.scene.mixture.replaceReaction(this.parameterizedReaction(reaction));
      }
    };
    this.genericLogKProperty.lazyLink(updateGeneric);
    this.genericForwardRateProperty.lazyLink(updateGeneric);
  }

  public get reaction(): Reaction {
    return this.scene.reaction;
  }

  /** Sets the starting concentrations for a standard mixture and restarts the run. */
  public startFrom(kind: StartingMixture): void {
    const reaction = this.reaction;
    const d = reaction.definition;
    const defaults = d.defaultAmounts;
    let amounts: number[];
    if (kind === "reactants") {
      amounts = [...defaults];
    } else if (kind === "products") {
      // The products the default reactants would make if they reacted completely.
      const extent = Math.min(
        ...reaction.reactantIndices.map((i) => (defaults[i] ?? 0) / -(reaction.species[i]?.nu ?? 1)),
      );
      amounts = reaction.species.map((s) => (s.nu > 0 ? s.nu * extent : 0));
    } else {
      amounts = reaction.species.map((s) => (s.bulk ? (defaults[reaction.species.indexOf(s)] ?? 0) : 0));
      reaction.species.forEach((s, i) => {
        if (!s.bulk) {
          amounts[i] = dotRandom.nextDoubleBetween(0.1, 0.6) * reaction.maxAmountOf(i);
        }
      });
    }
    this.settingConcentrations = true;
    this.initialConcentrationProperties.forEach((property, i) => {
      property.value = property.range.constrainValue((amounts[i] ?? 0) / d.defaultVolume);
    });
    this.settingConcentrations = false;
    this.restart();
  }

  /** Restarts the run from the starting concentrations. */
  public restart(): void {
    const volume = this.reaction.definition.defaultVolume;
    this.scene.mixture.volumeProperty.value = volume;
    this.scene.restart(this.initialConcentrationProperties.map((p) => p.value * volume));
  }

  public reset(): void {
    this.genericLogKProperty.reset();
    this.genericForwardRateProperty.reset();
    this.reactionIdProperty.reset();
    this.scene.reset();
    this.scene.setReaction(this.parameterizedReaction(getReaction(this.reactionIdProperty.value)));
    this.rebuildInitialConcentrations();
  }

  public step(dt: number): void {
    this.scene.step(dt);
  }

  /** The generic reactions with the student's K and kf; other reactions unchanged. */
  private parameterizedReaction(reaction: Reaction): Reaction {
    if (reaction.family !== "generic") {
      return reaction;
    }
    const k = 10 ** this.genericLogKProperty.value;
    return reaction.withParameters({
      deltaS: Reaction.entropyForK(k, reaction.deltaH),
      forwardRateConstant: this.genericForwardRateProperty.value,
    });
  }

  private rebuildInitialConcentrations(): void {
    for (const property of this.initialConcentrationProperties) {
      property.dispose();
    }
    const d = this.reaction.definition;
    this.initialConcentrationProperties = d.species.map(
      (_s, i) =>
        new NumberProperty((d.defaultAmounts[i] ?? 0) / d.defaultVolume, {
          range: new Range(0, this.reaction.maxAmountOf(i) / d.defaultVolume),
          units: "mol/L",
        }),
    );
    for (const property of this.initialConcentrationProperties) {
      property.lazyLink(() => {
        if (!this.settingConcentrations) {
          this.restart();
        }
      });
    }
    this.initialConcentrationsRebuiltEmitter.emit();
  }
}
