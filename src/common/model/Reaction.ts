/**
 * Reaction.ts
 *
 * One reversible reaction: its species with signed stoichiometric coefficients (negative for
 * reactants), its standard enthalpy and entropy, and the illustrative kinetics that carry a
 * mixture to equilibrium.
 *
 * Thermodynamics. K° comes from ΔG° = ΔH° − TΔS° = −RT ln K°, with ΔH° and ΔS° taken as constant
 * over the reaction's temperature range (the van 't Hoff approximation). Gas reactions use a 1 bar
 * standard state, so K° is Kp in bar^Δn and Kc = Kp / (RT)^Δn. Aqueous reactions use a 1 M
 * standard state, so K° is Kc. Pure liquids (the water in the cobalt chloride equilibrium) never
 * appear in Q or K.
 *
 * Kinetics. Each reaction is treated as one elementary step: forward rate kf·Π[reactant]^|ν| and
 * reverse rate kr·Π[product]^ν, with kr = kf / Kc so that the net rate vanishes exactly at K. The
 * rate constants are chosen so a mixture settles in tens of seconds of simulated time; they are
 * not the real mechanisms or rates.
 */

import type { Range } from "scenerystack/dot";
import { GAS_CONSTANT, GAS_CONSTANT_L_BAR, STANDARD_TEMPERATURE } from "../../EquilibriumLabConstants.js";

export type Phase = "gas" | "aqueous";

/** The family a reaction belongs to, which groups it in the reaction menus. */
export type ReactionFamily = "gas" | "aqueous" | "generic";

export type ReactionId =
  | "dinitrogenTetroxide"
  | "hydrogenIodide"
  | "haber"
  | "waterGasShift"
  | "thiocyanatoiron"
  | "cobaltChloride"
  | "genericIsomer"
  | "genericCombination"
  | "genericDimer";

export type Species = {
  /** Identifier used for colours, particle sprites and string lookups (e.g. "NO2"). */
  readonly id: string;
  /** Formula as RichText markup, without phase or coefficient (e.g. "NO<sub>2</sub>"). */
  readonly formula: string;
  /** Signed stoichiometric coefficient: negative for reactants, positive for products. */
  readonly nu: number;
  /** Molar mass (g/mol); heavier particles move more slowly in the particle box. */
  readonly molarMass: number;
  /**
   * A species present in large excess (Cl⁻ in the cobalt equilibrium) is drawn as a background
   * density rather than tracked particle by particle.
   */
  readonly bulk?: boolean;
};

export type ReactionDefinition = {
  readonly id: ReactionId;
  readonly family: ReactionFamily;
  readonly phase: Phase;
  readonly species: readonly Species[];
  /** RichText markup for spectator terms written in the equation but absent from Q, e.g. "6H<sub>2</sub>O(l)". */
  readonly extraProducts?: string;
  /** Standard enthalpy of reaction (J/mol). */
  readonly deltaH: number;
  /** Standard entropy of reaction (J/(mol·K)). */
  readonly deltaS: number;
  /** Forward rate constant at `referenceTemperature`, in M^(1−order)/s. */
  readonly forwardRateConstant: number;
  /** Temperature at which `forwardRateConstant` applies (K). */
  readonly referenceTemperature: number;
  /** Activation energy of the forward step (J/mol). */
  readonly activationEnergy: number;
  /** Temperatures the reaction can be run at (K). */
  readonly temperatureRange: Range;
  readonly defaultTemperature: number;
  /** Volumes the vessel can take (L). */
  readonly volumeRange: Range;
  readonly defaultVolume: number;
  /** Starting amounts, one per species (mol). */
  readonly defaultAmounts: readonly number[];
  /** Largest amount of any one species the controls allow (mol). */
  readonly maxAmount: number;
  /** Particles drawn per mole, so the default mixture shows roughly 50–150 particles. */
  readonly particlesPerMole: number;
};

export class Reaction {
  public readonly id: ReactionId;
  public readonly family: ReactionFamily;
  public readonly phase: Phase;
  public readonly species: readonly Species[];
  public readonly extraProducts: string;
  public readonly deltaH: number;
  public readonly deltaS: number;
  public readonly definition: ReactionDefinition;

  /** Change in moles of gas per mole of reaction (0 for aqueous reactions). */
  public readonly deltaNGas: number;

  public constructor(definition: ReactionDefinition) {
    this.definition = definition;
    this.id = definition.id;
    this.family = definition.family;
    this.phase = definition.phase;
    this.species = definition.species;
    this.extraProducts = definition.extraProducts ?? "";
    this.deltaH = definition.deltaH;
    this.deltaS = definition.deltaS;
    this.deltaNGas = definition.phase === "gas" ? definition.species.reduce((sum, s) => sum + s.nu, 0) : 0;
  }

  public get isGas(): boolean {
    return this.phase === "gas";
  }

  /** Indices of the reactants (ν < 0). */
  public get reactantIndices(): number[] {
    return this.species.flatMap((s, i) => (s.nu < 0 ? [i] : []));
  }

  /** Indices of the products (ν > 0). */
  public get productIndices(): number[] {
    return this.species.flatMap((s, i) => (s.nu > 0 ? [i] : []));
  }

  /** ΔG° at `temperature` (J/mol). */
  public deltaG(temperature: number): number {
    return this.deltaH - temperature * this.deltaS;
  }

  /** ln K° at `temperature` (K). */
  public lnStandardK(temperature: number): number {
    return -this.deltaG(temperature) / (GAS_CONSTANT * temperature);
  }

  /** ln Kc (concentrations in M). */
  public lnKc(temperature: number): number {
    return this.lnStandardK(temperature) - this.deltaNGas * Math.log(GAS_CONSTANT_L_BAR * temperature);
  }

  /** ln Kp (partial pressures in bar); equal to ln K° for gases. Meaningful only for gas reactions. */
  public lnKp(temperature: number): number {
    return this.lnStandardK(temperature);
  }

  /** Forward rate constant at `temperature`, from the Arrhenius equation. */
  public forwardRateConstant(temperature: number): number {
    const d = this.definition;
    return (
      d.forwardRateConstant *
      Math.exp((-d.activationEnergy / GAS_CONSTANT) * (1 / temperature - 1 / d.referenceTemperature))
    );
  }

  /** Reverse rate constant at `temperature`, kr = kf / Kc. */
  public reverseRateConstant(temperature: number): number {
    return this.forwardRateConstant(temperature) / Math.exp(this.lnKc(temperature));
  }

  /** A copy of this reaction with some parameters replaced (used by the generic reactions). */
  public withParameters(
    changes: Partial<Pick<ReactionDefinition, "deltaH" | "deltaS" | "forwardRateConstant">>,
  ): Reaction {
    return new Reaction({ ...this.definition, ...changes });
  }

  /** ΔS° that makes K° equal `k` at the standard temperature, for a given ΔH°. */
  public static entropyForK(k: number, deltaH: number): number {
    return GAS_CONSTANT * Math.log(k) + deltaH / STANDARD_TEMPERATURE;
  }
}
