/**
 * Reactions.ts
 *
 * The reactions the screens offer. Gas-phase ΔH° and ΔS° are computed from the standard enthalpies
 * of formation and standard entropies in OpenStax Chemistry 2e, Appendix G (298.15 K, 1 bar):
 *
 *   N₂O₄ ⇌ 2NO₂            ΔH° = 2(33.2) − 9.16 = +57.24 kJ;      ΔS° = 2(240.1) − 304.4 = +175.8 J/K
 *   H₂ + I₂(g) ⇌ 2HI        ΔH° = 2(26.48) − 62.438 = −9.48 kJ;    ΔS° = 2(206.6) − 130.7 − 260.69 = +21.8 J/K
 *   N₂ + 3H₂ ⇌ 2NH₃         ΔH° = 2(−45.9) = −91.8 kJ;             ΔS° = 2(192.8) − 191.6 − 3(130.7) = −198.1 J/K
 *   CO + H₂O(g) ⇌ CO₂ + H₂  ΔH° = −393.5 + 110.5 + 241.8 = −41.2 kJ; ΔS° = 213.8 + 130.7 − 197.7 − 188.8 = −42.0 J/K
 *
 * The two aqueous colour equilibria use representative teaching values: their measured K and ΔH°
 * depend strongly on ionic strength and on the acid medium (see doc/model.md).
 *
 *   Fe³⁺ + SCN⁻ ⇌ FeSCN²⁺                   K(298 K) ≈ 138, mildly exothermic (heating fades the red)
 *   Co(H₂O)₆²⁺ + 4Cl⁻ ⇌ CoCl₄²⁻ + 6H₂O(l)   K(298 K) ≈ 3 × 10⁻³, endothermic (heating turns it blue)
 *
 * Rate constants and activation energies are illustrative (see Reaction.ts).
 */

import { Range } from "scenerystack/dot";
import { STANDARD_TEMPERATURE } from "../../EquilibriumLabConstants.js";
import { Reaction, type ReactionDefinition, type ReactionId } from "./Reaction.js";

const KJ = 1000;

const DEFINITIONS: readonly ReactionDefinition[] = [
  {
    id: "dinitrogenTetroxide",
    family: "gas",
    phase: "gas",
    species: [
      { id: "N2O4", formula: "N<sub>2</sub>O<sub>4</sub>", nu: -1, molarMass: 92.01 },
      { id: "NO2", formula: "NO<sub>2</sub>", nu: 2, molarMass: 46.01 },
    ],
    deltaH: 57.24 * KJ,
    deltaS: 175.8,
    forwardRateConstant: 0.05,
    referenceTemperature: STANDARD_TEMPERATURE,
    activationEnergy: 57 * KJ,
    temperatureRange: new Range(273, 373),
    defaultTemperature: STANDARD_TEMPERATURE,
    volumeRange: new Range(0.25, 2),
    defaultVolume: 1,
    defaultAmounts: [0.04, 0],
    maxAmount: 0.08,
    particlesPerMole: 2000,
  },
  {
    id: "hydrogenIodide",
    family: "gas",
    phase: "gas",
    species: [
      { id: "H2", formula: "H<sub>2</sub>", nu: -1, molarMass: 2.016 },
      { id: "I2", formula: "I<sub>2</sub>", nu: -1, molarMass: 253.8 },
      { id: "HI", formula: "HI", nu: 2, molarMass: 127.9 },
    ],
    deltaH: -9.48 * KJ,
    deltaS: 21.8,
    forwardRateConstant: 20,
    referenceTemperature: 700,
    activationEnergy: 165 * KJ,
    temperatureRange: new Range(500, 800),
    defaultTemperature: 700,
    volumeRange: new Range(0.25, 2),
    defaultVolume: 1,
    defaultAmounts: [0.02, 0.02, 0],
    maxAmount: 0.05,
    particlesPerMole: 2500,
  },
  {
    id: "haber",
    family: "gas",
    phase: "gas",
    species: [
      { id: "N2", formula: "N<sub>2</sub>", nu: -1, molarMass: 28.01 },
      { id: "H2", formula: "H<sub>2</sub>", nu: -3, molarMass: 2.016 },
      { id: "NH3", formula: "NH<sub>3</sub>", nu: 2, molarMass: 17.03 },
    ],
    deltaH: -91.8 * KJ,
    deltaS: -198.1,
    forwardRateConstant: 5,
    referenceTemperature: 600,
    activationEnergy: 100 * KJ,
    temperatureRange: new Range(450, 800),
    defaultTemperature: 600,
    volumeRange: new Range(0.25, 2),
    defaultVolume: 1,
    defaultAmounts: [0.1, 0.3, 0],
    maxAmount: 0.4,
    particlesPerMole: 250,
  },
  {
    id: "waterGasShift",
    family: "gas",
    phase: "gas",
    species: [
      { id: "CO", formula: "CO", nu: -1, molarMass: 28.01 },
      { id: "H2O", formula: "H<sub>2</sub>O", nu: -1, molarMass: 18.02 },
      { id: "CO2", formula: "CO<sub>2</sub>", nu: 1, molarMass: 44.01 },
      { id: "H2", formula: "H<sub>2</sub>", nu: 1, molarMass: 2.016 },
    ],
    deltaH: -41.2 * KJ,
    deltaS: -42.0,
    forwardRateConstant: 5,
    referenceTemperature: 900,
    activationEnergy: 80 * KJ,
    temperatureRange: new Range(600, 1200),
    defaultTemperature: 900,
    volumeRange: new Range(0.25, 2),
    defaultVolume: 1,
    defaultAmounts: [0.05, 0.05, 0, 0],
    maxAmount: 0.1,
    particlesPerMole: 1000,
  },
  {
    id: "thiocyanatoiron",
    family: "aqueous",
    phase: "aqueous",
    species: [
      { id: "Fe", formula: "Fe<sup>3+</sup>", nu: -1, molarMass: 55.85 },
      { id: "SCN", formula: "SCN<sup>−</sup>", nu: -1, molarMass: 58.08 },
      { id: "FeSCN", formula: "FeSCN<sup>2+</sup>", nu: 1, molarMass: 113.9 },
    ],
    deltaH: -10 * KJ,
    deltaS: Reaction.entropyForK(138, -10 * KJ),
    forwardRateConstant: 25,
    referenceTemperature: STANDARD_TEMPERATURE,
    activationEnergy: 40 * KJ,
    temperatureRange: new Range(278, 348),
    defaultTemperature: STANDARD_TEMPERATURE,
    volumeRange: new Range(0.05, 0.25),
    defaultVolume: 0.1,
    defaultAmounts: [0.001, 0.0003, 0],
    maxAmount: 0.002,
    particlesPerMole: 100000,
  },
  {
    id: "cobaltChloride",
    family: "aqueous",
    phase: "aqueous",
    species: [
      { id: "CoH2O", formula: "Co(H<sub>2</sub>O)<sub>6</sub><sup>2+</sup>", nu: -1, molarMass: 167.0 },
      { id: "Cl", formula: "Cl<sup>−</sup>", nu: -4, molarMass: 35.45, bulk: true },
      { id: "CoCl4", formula: "CoCl<sub>4</sub><sup>2−</sup>", nu: 1, molarMass: 200.7 },
    ],
    extraProducts: "6H<sub>2</sub>O(l)",
    deltaH: 50 * KJ,
    deltaS: Reaction.entropyForK(3e-3, 50 * KJ),
    forwardRateConstant: 0.0008,
    referenceTemperature: STANDARD_TEMPERATURE,
    activationEnergy: 60 * KJ,
    temperatureRange: new Range(278, 363),
    defaultTemperature: STANDARD_TEMPERATURE,
    volumeRange: new Range(0.05, 0.25),
    defaultVolume: 0.1,
    defaultAmounts: [0.005, 0.4, 0],
    maxAmount: 1.2,
    particlesPerMole: 12000,
  },
  {
    id: "genericIsomer",
    family: "generic",
    phase: "aqueous",
    species: [
      { id: "A", formula: "A", nu: -1, molarMass: 40 },
      { id: "B", formula: "B", nu: 1, molarMass: 40 },
    ],
    deltaH: 0,
    deltaS: Reaction.entropyForK(2, 0),
    forwardRateConstant: 0.2,
    referenceTemperature: STANDARD_TEMPERATURE,
    activationEnergy: 50 * KJ,
    temperatureRange: new Range(273, 373),
    defaultTemperature: STANDARD_TEMPERATURE,
    volumeRange: new Range(0.5, 2),
    defaultVolume: 1,
    defaultAmounts: [1, 0],
    maxAmount: 2,
    particlesPerMole: 60,
  },
  {
    id: "genericCombination",
    family: "generic",
    phase: "aqueous",
    species: [
      { id: "A", formula: "A", nu: -1, molarMass: 40 },
      { id: "B", formula: "B", nu: -1, molarMass: 40 },
      { id: "C", formula: "C", nu: 1, molarMass: 80 },
    ],
    deltaH: 0,
    deltaS: Reaction.entropyForK(2, 0),
    forwardRateConstant: 0.2,
    referenceTemperature: STANDARD_TEMPERATURE,
    activationEnergy: 50 * KJ,
    temperatureRange: new Range(273, 373),
    defaultTemperature: STANDARD_TEMPERATURE,
    volumeRange: new Range(0.5, 2),
    defaultVolume: 1,
    defaultAmounts: [1, 1, 0],
    maxAmount: 2,
    particlesPerMole: 50,
  },
  {
    id: "genericDimer",
    family: "generic",
    phase: "aqueous",
    species: [
      { id: "A", formula: "A", nu: -2, molarMass: 40 },
      { id: "B", formula: "B", nu: 1, molarMass: 80 },
    ],
    deltaH: 0,
    deltaS: Reaction.entropyForK(2, 0),
    forwardRateConstant: 0.2,
    referenceTemperature: STANDARD_TEMPERATURE,
    activationEnergy: 50 * KJ,
    temperatureRange: new Range(273, 373),
    defaultTemperature: STANDARD_TEMPERATURE,
    volumeRange: new Range(0.5, 2),
    defaultVolume: 1,
    defaultAmounts: [1.5, 0],
    maxAmount: 2,
    particlesPerMole: 50,
  },
];

/** Every reaction id, in menu order. */
export const REACTION_IDS: readonly ReactionId[] = DEFINITIONS.map((d) => d.id);

/** The reaction with `id`. Reactions are immutable, so one instance can be shared. */
export function getReaction(id: ReactionId): Reaction {
  const definition = DEFINITIONS.find((d) => d.id === id);
  if (!definition) {
    throw new Error(`Unknown reaction: ${id}`);
  }
  return new Reaction(definition);
}

/** All reactions, or those whose ids are listed, in menu order. */
export function getReactions(ids: readonly ReactionId[] = REACTION_IDS): Reaction[] {
  return ids.map(getReaction);
}
