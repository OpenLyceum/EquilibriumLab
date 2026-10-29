/**
 * ReactionMixture.ts
 *
 * A reacting mixture in a closed vessel: the amount of each species (mol), the vessel volume (L),
 * the temperature (K), an optional catalyst and, for gases, an amount of inert gas. step(dt)
 * advances the reaction by mass-action kinetics (see Reaction.ts) and records the forward and
 * reverse flows, which the particle box replays as individual reaction events.
 *
 * Integration. The state moves along one coordinate, the extent ξ (mol), so every species changes
 * by νᵢ dξ and atoms are conserved exactly. dξ/dt = V (r_f − r_r) is integrated with RK4 in
 * substeps no longer than half the local relaxation time. A mixture that relaxes much faster than
 * a frame (a catalysed reaction at high temperature) is placed directly at equilibrium instead.
 */

import { BooleanProperty, Emitter, NumberProperty, Property } from "scenerystack/axon";
import {
  CATALYST_FACTOR,
  GAS_CONSTANT_L_BAR,
  MAX_SUBSTEPS,
  SUBSTEP_RELAXATION_FRACTION,
} from "../../EquilibriumLabConstants.js";
import {
  amountsAtExtent,
  equilibriumAmounts,
  extentBounds,
  lnQc,
  lnQp,
  solveEquilibriumExtent,
} from "./equilibriumSolver.js";
import type { Reaction } from "./Reaction.js";

export class ReactionMixture {
  public readonly reactionProperty: Property<Reaction>;

  /** Temperature (K). Controls clamp it to the reaction's temperature range. */
  public readonly temperatureProperty: NumberProperty;

  /** Vessel volume (L): the gas volume, or the volume of solution. */
  public readonly volumeProperty: NumberProperty;

  /** A catalyst speeds the forward and reverse steps equally and leaves K unchanged. */
  public readonly catalystProperty: BooleanProperty;

  /** Fires after any change of state: a step, a stress, or a new reaction. */
  public readonly changedEmitter = new Emitter();

  /** Fires when the mixture is replaced wholesale (new reaction or new starting amounts). */
  public readonly resetEmitter = new Emitter();

  /** Fires when moles of one species are added (positive) or removed (negative). */
  public readonly amountAddedEmitter = new Emitter<[number, number]>({
    parameters: [{ valueType: "number" }, { valueType: "number" }],
  });

  private amounts: number[];
  private inertAmount = 0;

  /** Net extent since the last reset (mol). */
  private totalExtent = 0;

  /** Cumulative forward and reverse flows since the last reset (mol of reaction). */
  private forwardFlow = 0;
  private reverseFlow = 0;

  public constructor(reaction: Reaction) {
    const d = reaction.definition;
    this.reactionProperty = new Property(reaction);
    this.temperatureProperty = new NumberProperty(d.defaultTemperature, { units: "K" });
    this.volumeProperty = new NumberProperty(d.defaultVolume, { units: "L" });
    this.catalystProperty = new BooleanProperty(false);
    this.amounts = [...d.defaultAmounts];

    const changed = () => this.changedEmitter.emit();
    this.temperatureProperty.lazyLink(changed);
    this.volumeProperty.lazyLink(changed);
    this.catalystProperty.lazyLink(changed);
  }

  public get reaction(): Reaction {
    return this.reactionProperty.value;
  }

  public get temperature(): number {
    return this.temperatureProperty.value;
  }

  public get volume(): number {
    return this.volumeProperty.value;
  }

  /** Amount of each species (mol). */
  public getAmounts(): readonly number[] {
    return this.amounts;
  }

  public getAmount(index: number): number {
    return this.amounts[index] ?? 0;
  }

  /** Concentration of each species (M). */
  public getConcentrations(): number[] {
    return this.amounts.map((n) => n / this.volume);
  }

  /** Partial pressure of each species (bar); meaningful for gas reactions. */
  public getPartialPressures(): number[] {
    return this.amounts.map((n) => (n / this.volume) * GAS_CONSTANT_L_BAR * this.temperature);
  }

  /** Moles of inert gas (argon) in the vessel. */
  public getInertAmount(): number {
    return this.inertAmount;
  }

  /** Total pressure of a gas mixture, inert gas included (bar). */
  public getTotalPressure(): number {
    const moles = this.amounts.reduce((sum, n) => sum + n, 0) + this.inertAmount;
    return (moles / this.volume) * GAS_CONSTANT_L_BAR * this.temperature;
  }

  public get lnKc(): number {
    return this.reaction.lnKc(this.temperature);
  }

  public get lnKp(): number {
    return this.reaction.lnKp(this.temperature);
  }

  public get lnQc(): number {
    return lnQc(this.reaction, this.amounts, this.volume);
  }

  public get lnQp(): number {
    return lnQp(this.reaction, this.amounts, this.volume, this.temperature);
  }

  /**
   * ln(Q/K): negative when the mixture will shift toward products, positive toward reactants, 0 at
   * equilibrium (NaN when the mixture cannot react). Kc and Kp forms give the same ratio.
   */
  public get lnQOverK(): number {
    return this.lnQc - this.lnKc;
  }

  /** Forward and reverse rates at the current state (M/s). */
  public getRates(): { forward: number; reverse: number } {
    return this.ratesFor(this.amounts);
  }

  /** Net extent since the last reset (mol). */
  public getTotalExtent(): number {
    return this.totalExtent;
  }

  /** Cumulative forward and reverse flows since the last reset (mol of reaction). */
  public getFlows(): { forward: number; reverse: number } {
    return { forward: this.forwardFlow, reverse: this.reverseFlow };
  }

  /** Switches to `reaction` with its default conditions, or with `amounts` if given. */
  public setReaction(reaction: Reaction, amounts: readonly number[] = reaction.definition.defaultAmounts): void {
    this.reactionProperty.value = reaction;
    this.temperatureProperty.value = reaction.definition.defaultTemperature;
    this.volumeProperty.value = reaction.definition.defaultVolume;
    this.catalystProperty.value = false;
    this.setAmounts(amounts);
  }

  /**
   * Replaces the reaction with one that has the same species but other parameters (the generic
   * reactions' K, kf or ΔH°), keeping the current state.
   */
  public replaceReaction(reaction: Reaction): void {
    this.reactionProperty.value = reaction;
    this.changedEmitter.emit();
  }

  /** Starts over from `amounts` (mol) with no inert gas. */
  public setAmounts(amounts: readonly number[]): void {
    this.amounts = this.reaction.species.map((_s, i) => Math.max(0, amounts[i] ?? 0));
    this.inertAmount = 0;
    this.totalExtent = 0;
    this.forwardFlow = 0;
    this.reverseFlow = 0;
    this.resetEmitter.emit();
    this.changedEmitter.emit();
  }

  /** Moves the mixture straight to equilibrium at the current conditions. */
  public equilibrate(): void {
    const extent = solveEquilibriumExtent(this.reaction, this.amounts, this.volume, this.lnKc);
    this.applyExtent(extent);
    this.changedEmitter.emit();
  }

  /** Adds `moles` of species `index` (negative removes, never below zero). Returns the change. */
  public addAmount(index: number, moles: number): number {
    const before = this.amounts[index] ?? 0;
    const after = Math.max(0, before + moles);
    this.amounts[index] = after;
    const change = after - before;
    if (change !== 0) {
      this.amountAddedEmitter.emit(index, change);
      this.changedEmitter.emit();
    }
    return change;
  }

  /**
   * Adds inert gas. At constant volume only the total pressure rises; at constant pressure the
   * vessel expands so the total pressure stays the same, which dilutes the reacting gases.
   */
  public addInertGas(moles: number, constantPressure: boolean): void {
    const before = this.amounts.reduce((sum, n) => sum + n, 0) + this.inertAmount;
    this.inertAmount = Math.max(0, this.inertAmount + moles);
    if (constantPressure && before > 0) {
      const after = this.amounts.reduce((sum, n) => sum + n, 0) + this.inertAmount;
      this.volumeProperty.value = (this.volume * after) / before;
    }
    this.changedEmitter.emit();
  }

  public reset(): void {
    this.temperatureProperty.reset();
    this.volumeProperty.reset();
    this.catalystProperty.reset();
    this.reactionProperty.reset();
    this.setReaction(this.reaction);
  }

  /** Advances the reaction by `dt` seconds of simulated time. */
  public step(dt: number): void {
    if (dt <= 0) {
      return;
    }
    const reaction = this.reaction;
    const start = [...this.amounts];
    const { min, max } = extentBounds(reaction, start);
    if (!(max > min)) {
      return;
    }
    const volume = this.volume;
    const flux = (xi: number): number => {
      const rates = this.ratesFor(amountsAtExtent(reaction, start, xi));
      return volume * (rates.forward - rates.reverse);
    };
    const clamp = (xi: number) => Math.min(max, Math.max(min, xi));

    let extent = 0;
    let remaining = dt;
    for (let i = 0; i < MAX_SUBSTEPS && remaining > 0; i++) {
      const h = Math.min(remaining, SUBSTEP_RELAXATION_FRACTION / this.relaxationRate(flux, extent, min, max));
      const k1 = flux(extent);
      const k2 = flux(clamp(extent + (h / 2) * k1));
      const k3 = flux(clamp(extent + (h / 2) * k2));
      const k4 = flux(clamp(extent + h * k3));
      const next = clamp(extent + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4));
      this.accumulateFlows(amountsAtExtent(reaction, start, extent), h, next - extent);
      extent = next;
      remaining -= h;
    }
    if (remaining > 0) {
      // Far faster than a frame: the rest of the step ends at equilibrium.
      const here = amountsAtExtent(reaction, start, extent);
      const target = extent + solveEquilibriumExtent(reaction, here, volume, this.lnKc);
      this.accumulateFlows(here, remaining, target - extent);
      extent = target;
    }
    this.applyExtent(extent, start);
    this.changedEmitter.emit();
  }

  /** The equilibrium amounts this mixture would reach at its current conditions. */
  public getEquilibriumAmounts(): number[] {
    return equilibriumAmounts(this.reaction, this.amounts, this.volume, this.temperature);
  }

  public dispose(): void {
    this.changedEmitter.dispose();
    this.resetEmitter.dispose();
    this.amountAddedEmitter.dispose();
    this.reactionProperty.dispose();
    this.temperatureProperty.dispose();
    this.volumeProperty.dispose();
    this.catalystProperty.dispose();
  }

  /** Forward and reverse rates (M/s) for `amounts` at the current conditions. */
  private ratesFor(amounts: readonly number[]): { forward: number; reverse: number } {
    const reaction = this.reaction;
    const temperature = this.temperature;
    const factor = this.catalystProperty.value ? CATALYST_FACTOR : 1;
    let forward = reaction.forwardRateConstant(temperature) * factor;
    let reverse = reaction.reverseRateConstant(temperature) * factor;
    reaction.species.forEach((s, i) => {
      const c = (amounts[i] ?? 0) / this.volume;
      if (s.nu < 0) {
        forward *= c ** -s.nu;
      } else {
        reverse *= c ** s.nu;
      }
    });
    return { forward, reverse };
  }

  /** |d(flux)/dξ| (1/s): how fast the mixture relaxes near `extent`. */
  private relaxationRate(flux: (extent: number) => number, extent: number, min: number, max: number): number {
    const delta = Math.max(1e-12, (max - min) * 1e-6);
    const low = Math.max(min, extent - delta);
    const high = Math.min(max, extent + delta);
    const rate = high > low ? Math.abs((flux(high) - flux(low)) / (high - low)) : 0;
    return Math.max(rate, 1e-9);
  }

  /**
   * Adds a substep's gross flows: the forward and reverse rates over `h`, corrected so their
   * difference equals the net change `netExtent` the integrator actually made.
   */
  private accumulateFlows(amounts: readonly number[], h: number, netExtent: number): void {
    const rates = this.ratesFor(amounts);
    let forward = rates.forward * this.volume * h;
    let reverse = rates.reverse * this.volume * h;
    const mismatch = netExtent - (forward - reverse);
    if (mismatch > 0) {
      forward += mismatch;
    } else {
      reverse -= mismatch;
    }
    this.forwardFlow += forward;
    this.reverseFlow += reverse;
  }

  /** Moves the amounts by `extent` from `start` (the current amounts by default). */
  private applyExtent(extent: number, start: readonly number[] = this.amounts): void {
    this.amounts = amountsAtExtent(this.reaction, start, extent);
    this.totalExtent += extent;
  }
}
