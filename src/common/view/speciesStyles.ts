/**
 * speciesStyles.ts
 *
 * How each species is drawn: its colour, the atoms of its particle sprite, and, for coloured
 * species, the concentration at which it tints the vessel fully. Also converts formula markup to
 * plain Unicode for labels that cannot hold RichText.
 */

import type { ProfileColorProperty } from "scenerystack/scenery";
import EquilibriumLabColors from "../../EquilibriumLabColors.js";
import type { Reaction } from "../model/Reaction.js";

/** One atom of a sprite: offset and radius in px at the particle box's reference scale. */
export type SpriteAtom = { readonly dx: number; readonly dy: number; readonly r: number };

export type SpeciesStyle = {
  readonly color: ProfileColorProperty;
  readonly atoms: readonly SpriteAtom[];
  /** Concentration (M) at which the species gives the vessel its full tint; absent = colourless. */
  readonly tintConcentration?: number;
};

const single = (r: number): SpriteAtom[] => [{ dx: 0, dy: 0, r }];
const pair = (r1: number, r2: number): SpriteAtom[] => [
  { dx: -r1 * 0.7, dy: 0, r: r1 },
  { dx: r2 * 0.7, dy: 0, r: r2 },
];
const linear3 = (r: number): SpriteAtom[] => [
  { dx: -r * 1.4, dy: 0, r },
  { dx: 0, dy: 0, r },
  { dx: r * 1.4, dy: 0, r },
];

const STYLES: Record<string, SpeciesStyle> = {
  N2O4: {
    color: EquilibriumLabColors.speciesN2O4ColorProperty,
    atoms: [
      { dx: -3, dy: 0, r: 3.4 },
      { dx: 3, dy: 0, r: 3.4 },
      { dx: -6.5, dy: -3, r: 2.5 },
      { dx: -6.5, dy: 3, r: 2.5 },
      { dx: 6.5, dy: -3, r: 2.5 },
      { dx: 6.5, dy: 3, r: 2.5 },
    ],
  },
  NO2: {
    color: EquilibriumLabColors.speciesNO2ColorProperty,
    atoms: [
      { dx: 0, dy: 0, r: 4 },
      { dx: -4, dy: 3, r: 3 },
      { dx: 4, dy: 3, r: 3 },
    ],
    tintConcentration: 0.05,
  },
  H2: { color: EquilibriumLabColors.speciesH2ColorProperty, atoms: pair(2.5, 2.5) },
  I2: { color: EquilibriumLabColors.speciesI2ColorProperty, atoms: pair(5, 5), tintConcentration: 0.025 },
  HI: { color: EquilibriumLabColors.speciesHIColorProperty, atoms: pair(2.5, 5) },
  N2: { color: EquilibriumLabColors.speciesN2ColorProperty, atoms: pair(3.5, 3.5) },
  NH3: {
    color: EquilibriumLabColors.speciesNH3ColorProperty,
    atoms: [
      { dx: 0, dy: 0, r: 4 },
      { dx: -4, dy: 3, r: 2.2 },
      { dx: 4, dy: 3, r: 2.2 },
      { dx: 0, dy: -4.5, r: 2.2 },
    ],
  },
  CO: { color: EquilibriumLabColors.speciesCOColorProperty, atoms: pair(3.5, 3.2) },
  H2O: {
    color: EquilibriumLabColors.speciesH2OColorProperty,
    atoms: [
      { dx: 0, dy: 0, r: 3.5 },
      { dx: -3.5, dy: 2.5, r: 2.2 },
      { dx: 3.5, dy: 2.5, r: 2.2 },
    ],
  },
  CO2: { color: EquilibriumLabColors.speciesCO2ColorProperty, atoms: linear3(3.2) },
  Fe: { color: EquilibriumLabColors.speciesFeColorProperty, atoms: single(5) },
  SCN: { color: EquilibriumLabColors.speciesSCNColorProperty, atoms: linear3(2.6) },
  FeSCN: {
    color: EquilibriumLabColors.speciesFeSCNColorProperty,
    atoms: [
      { dx: -5, dy: 0, r: 5 },
      { dx: 2, dy: 0, r: 2.6 },
      { dx: 6, dy: 0, r: 2.6 },
      { dx: 10, dy: 0, r: 2.6 },
    ],
    tintConcentration: 0.003,
  },
  CoH2O: {
    color: EquilibriumLabColors.speciesCoH2OColorProperty,
    atoms: [
      { dx: 0, dy: 0, r: 5 },
      { dx: -7, dy: 0, r: 2.2 },
      { dx: 7, dy: 0, r: 2.2 },
      { dx: 0, dy: -7, r: 2.2 },
      { dx: 0, dy: 7, r: 2.2 },
    ],
    tintConcentration: 0.05,
  },
  Cl: { color: EquilibriumLabColors.speciesClColorProperty, atoms: single(2) },
  CoCl4: {
    color: EquilibriumLabColors.speciesCoCl4ColorProperty,
    atoms: [
      { dx: 0, dy: 0, r: 5 },
      { dx: -6, dy: -4, r: 3 },
      { dx: 6, dy: -4, r: 3 },
      { dx: -6, dy: 4, r: 3 },
      { dx: 6, dy: 4, r: 3 },
    ],
    tintConcentration: 0.05,
  },
  A: { color: EquilibriumLabColors.speciesAColorProperty, atoms: single(5) },
  B: { color: EquilibriumLabColors.speciesBColorProperty, atoms: single(5) },
  C: { color: EquilibriumLabColors.speciesCColorProperty, atoms: pair(5, 5) },
};

/** Style for a species id; generic dimers reuse their monomer's colour. */
export function speciesStyle(id: string): SpeciesStyle {
  const style = STYLES[id];
  if (!style) {
    throw new Error(`No style for species ${id}`);
  }
  return style;
}

/**
 * Style for species `index` of `reaction`. In the generic 2A ⇌ B dimerization B is drawn as two
 * joined A-sized spheres.
 */
export function speciesStyleIn(reaction: Reaction, index: number): SpeciesStyle {
  const species = reaction.species[index];
  if (!species) {
    throw new Error(`No species ${index} in ${reaction.id}`);
  }
  if (reaction.id === "genericDimer" && species.id === "B") {
    return { ...speciesStyle("B"), atoms: pair(5, 5) };
  }
  return speciesStyle(species.id);
}

const SUBSCRIPTS: Record<string, string> = {
  "0": "₀",
  "1": "₁",
  "2": "₂",
  "3": "₃",
  "4": "₄",
  "5": "₅",
  "6": "₆",
  "7": "₇",
  "8": "₈",
  "9": "₉",
};
const SUPERSCRIPTS: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "+": "⁺",
  "−": "⁻",
  "-": "⁻",
};

/** "N<sub>2</sub>O<sub>4</sub>" → "N₂O₄", "Fe<sup>3+</sup>" → "Fe³⁺". */
export function plainFormula(markup: string): string {
  return markup
    .replace(/<sub>(.*?)<\/sub>/g, (_m, text: string) => [...text].map((ch) => SUBSCRIPTS[ch] ?? ch).join(""))
    .replace(/<sup>(.*?)<\/sup>/g, (_m, text: string) => [...text].map((ch) => SUPERSCRIPTS[ch] ?? ch).join(""));
}
