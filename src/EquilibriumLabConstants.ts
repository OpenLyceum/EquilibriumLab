/**
 * EquilibriumLabConstants.ts
 *
 * Central repository for every named numeric constant used across the
 * simulation. Bare numbers that carry semantic meaning (sizes, margins,
 * physics defaults, ranges) belong here rather than inline in model or view
 * code, so they are named, documented, and changed in one place.
 *
 * Conventions
 * ───────────
 *  - Chemistry values use the units a student reads in the lab rather than strict
 *    SI: amounts in mol, volumes in L, concentrations in mol/L (M), pressures in bar,
 *    temperatures in K, energies in J/mol, time in s. Note the unit in a comment on
 *    each value.
 *  - Layout / chrome values are in screen pixels.
 *  - Colour strings live in EquilibriumLabColors.ts, not here.
 *  - Computed expressions (e.g. `2 * Math.PI`) may stay inline.
 *  - Per-reaction data (ΔH°, ΔS°, ranges, defaults) live in common/model/Reactions.ts.
 */

import type { TimeScale } from "./common/model/timeScale.js";
import EquilibriumLabNamespace from "./EquilibriumLabNamespace.js";

// ── Layout / chrome (screen pixels) ───────────────────────────────────────────

/** Margin between the screen edge and edge-anchored controls (e.g. Reset All). */
export const SCREEN_VIEW_MARGIN = 20;

/** Corner radius shared by control panels and dialogs. */
export const PANEL_CORNER_RADIUS = 6;

/** Vertical gap between stacked panels. */
export const PANEL_SPACING = 10;

/** Width of the right-hand control column on every screen. */
export const SIDE_COLUMN_WIDTH = 236;

/** Font sizes (px). */
export const FONT_SIZE = {
  tiny: 11,
  small: 12,
  control: 13,
  label: 14,
  readout: 16,
} as const;

// ── Physical constants ────────────────────────────────────────────────────────

/** Molar gas constant (J/(mol·K)), CODATA 2018 exact value. */
export const GAS_CONSTANT = 8.314462618;

/** Molar gas constant in L·bar/(mol·K), for Kp = Kc(RT)^Δn and p = cRT. */
export const GAS_CONSTANT_L_BAR = 0.08314462618;

/** Standard temperature for tabulated thermodynamic data (K). */
export const STANDARD_TEMPERATURE = 298.15;

/** Offset between kelvin and degrees Celsius. */
export const CELSIUS_OFFSET = 273.15;

// ── Kinetics and integration ──────────────────────────────────────────────────

/** A catalyst multiplies both rate constants by this factor. */
export const CATALYST_FACTOR = 8;

/** Most RK4 substeps per frame before the mixture is placed at equilibrium instead. */
export const MAX_SUBSTEPS = 400;

/** Each substep is at most this fraction of the local relaxation time 1/|d(flux)/dξ|. */
export const SUBSTEP_RELAXATION_FRACTION = 0.5;

/** Simulated seconds per real second at slow / normal / fast speed. */
export const REACTION_TIME_SCALE: TimeScale = { slow: 0.5, normal: 2, fast: 8 };

/** ln(Q/K) within this of zero counts as "at equilibrium" in messages. */
export const EQUILIBRIUM_LN_TOLERANCE = 0.01;

// ── Records ───────────────────────────────────────────────────────────────────

/** Simulated seconds between recorded samples. */
export const RECORD_INTERVAL = 0.1;

/** A record keeps at most this many samples; later samples are thinned. */
export const RECORD_CAPACITY = 2400;

// ── Particle box ──────────────────────────────────────────────────────────────

/** Particle box width in box units; the height is the volume over the reference volume. */
export const BOX_WIDTH = 1;

/** Speed of a 30 g/mol particle at 298 K (box units per real second); scales as √(T/M). */
export const PARTICLE_REFERENCE_SPEED = 0.18;

/** Molar mass the reference speed applies to (g/mol). */
export const PARTICLE_REFERENCE_MASS = 30;

/** Most particles drawn at once; amounts beyond this are not drawn. */
export const MAX_PARTICLES = 400;

/** Most background dots drawn for a species in large excess. */
export const MAX_BULK_DOTS = 160;

/** Seed for the particle box's random numbers, so runs replay identically. */
export const PARTICLE_SEED = 2026;

EquilibriumLabNamespace.register("EquilibriumLabConstants", {
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
  PANEL_SPACING,
  SIDE_COLUMN_WIDTH,
  GAS_CONSTANT,
  GAS_CONSTANT_L_BAR,
  CATALYST_FACTOR,
});
