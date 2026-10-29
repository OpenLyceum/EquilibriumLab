/**
 * EquilibriumLabColors.ts
 *
 * Defines all dynamic colors for the simulation using ProfileColorProperty.
 *
 * Each color has two profiles:
 *   - "default"   — used in standard (dark) mode
 *   - "projector" — used when the user enables Projector Mode in Preferences
 *
 * SceneryStack switches profiles automatically; no manual toggling is needed.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 * Import EquilibriumLabColors and pass properties directly to Node's fillProperty or
 * strokeProperty options:
 *
 *   import EquilibriumLabColors from "../../EquilibriumLabColors.js";
 *
 *   new Rectangle( 0, 0, 100, 50, {
 *     fillProperty: EquilibriumLabColors.backgroundColorProperty,
 *   });
 *
 * ── How to add a color ────────────────────────────────────────────────────────
 * Add a new ProfileColorProperty entry to the EquilibriumLabColors object below.
 * Always provide both "default" and "projector" values.
 */
import { ProfileColorProperty } from "scenerystack/scenery";
import EquilibriumLabNamespace from "./EquilibriumLabNamespace.js";

const EquilibriumLabColors = {
  /**
   * Background color for the simulation screen.
   * Deep navy in default mode; white in projector mode.
   */
  backgroundColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "background", {
    default: "#1a1a2e",
    projector: "#ffffff",
  }),

  /**
   * Primary accent color for highlights, selected items, and key UI elements.
   * Sky blue in default mode; dark navy in projector mode.
   */
  accentColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "accent", {
    default: "#4fc3f7",
    projector: "#1a1a2e",
  }),

  /**
   * Background fill for control panels and dialogs.
   * Deep blue in default mode; light gray in projector mode.
   */
  panelBackgroundColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "panelBackground", {
    default: "#16213e",
    projector: "#f5f5f5",
  }),

  /**
   * Border/stroke color for control panels and dialogs.
   * Teal-navy in default mode; medium gray in projector mode.
   */
  panelBorderColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "panelBorder", {
    default: "#0f3460",
    projector: "#999999",
  }),

  /**
   * Text color for labels, readouts, and general UI text.
   * Near-white in default mode; near-black in projector mode.
   */
  textColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "text", {
    default: "#e0e0e0",
    projector: "#1a1a1a",
  }),

  // ── Light control surfaces ───────────────────────────────────────────────────
  // White chrome (combo boxes, flat push buttons, editable input fields) stays light
  // in both profiles; its text stays dark. Same values in default and projector mode,
  // but defined here so every color lives in one themeable place.

  /** Fill of light control surfaces: combo-box button/list, editable input fields. */
  controlSurfaceColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "controlSurface", {
    default: "#ffffff",
    projector: "#ffffff",
  }),

  /** Fill of a disabled control surface (grayed-out editable input field). */
  controlSurfaceDisabledColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "controlSurfaceDisabled", {
    default: "#cccccc",
    projector: "#cccccc",
  }),

  /** Text on light control surfaces: combo items, flat-button labels, field values, preferences. */
  controlSurfaceTextColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "controlSurfaceText", {
    default: "#1a1a1a",
    projector: "#1a1a1a",
  }),

  // ── Text, charts ──────────────────────────────────────────────────────────────

  /** Secondary text: units, captions, hints. */
  mutedTextColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "mutedText", {
    default: "#9aa4b8",
    projector: "#555555",
  }),

  /** Chart plotting area. */
  chartBackgroundColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "chartBackground", {
    default: "#10182e",
    projector: "#ffffff",
  }),

  /** Chart frame and tick marks. */
  chartAxisColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "chartAxis", {
    default: "#8a96b0",
    projector: "#333333",
  }),

  /** Chart grid lines. */
  chartGridColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "chartGrid", {
    default: "#26324f",
    projector: "#dddddd",
  }),

  /** Vertical stress markers on the time charts, and their labels. */
  markerColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "marker", {
    default: "#e0e0e0",
    projector: "#333333",
  }),

  /** Forward rate trace and event counter. */
  forwardRateColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "forwardRate", {
    default: "#81c784",
    projector: "#1b7d32",
  }),

  /** Reverse rate trace and event counter. */
  reverseRateColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "reverseRate", {
    default: "#ff8a65",
    projector: "#c0392b",
  }),

  /** A correct answer; agreement with the accepted value. */
  goodColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "good", {
    default: "#81c784",
    projector: "#1b7d32",
  }),

  /** A wrong answer; disagreement with the accepted value. */
  poorColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "poor", {
    default: "#ff8a80",
    projector: "#c62828",
  }),

  /** Fitted line on the van 't Hoff plot. */
  fitLineColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "fitLine", {
    default: "#ffd54f",
    projector: "#b26a00",
  }),

  /** Measured points on the van 't Hoff plot. */
  dataPointColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "dataPoint", {
    default: "#4fc3f7",
    projector: "#0b5fa5",
  }),

  // ── Q/K gauge ─────────────────────────────────────────────────────────────────

  /** Track of the logarithmic Q/K gauge. */
  gaugeTrackColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "gaugeTrack", {
    default: "#26324f",
    projector: "#e3e7ee",
  }),

  /** The K marker on the gauge. */
  kMarkerColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "kMarker", {
    default: "#ffd54f",
    projector: "#b26a00",
  }),

  /** The Q pointer on the gauge. */
  qPointerColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "qPointer", {
    default: "#4fc3f7",
    projector: "#0b5fa5",
  }),

  /** Q < K: the mixture shifts toward products (right). */
  towardProductsColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "towardProducts", {
    default: "#81c784",
    projector: "#1b7d32",
  }),

  /** Q > K: the mixture shifts toward reactants (left). */
  towardReactantsColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "towardReactants", {
    default: "#ff8a65",
    projector: "#c0392b",
  }),

  // ── Vessels ───────────────────────────────────────────────────────────────────

  /** Vessel walls and the beaker outline. */
  glassColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "glass", {
    default: "#b8c7dc",
    projector: "#5a6a80",
  }),

  /** Inside of the gas vessel before any tint. */
  vesselInteriorColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "vesselInterior", {
    default: "#0d1326",
    projector: "#fbfcfe",
  }),

  /** Colourless solution in the beaker. */
  solutionColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "solution", {
    default: "#1d3350",
    projector: "#e8f3fb",
  }),

  /** The piston that sets the gas volume. */
  pistonColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "piston", {
    default: "#9aa7b4",
    projector: "#8a96a3",
  }),

  /** Piston shading, rod and handle outline. */
  pistonDarkColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "pistonDark", {
    default: "#5f6b78",
    projector: "#56616c",
  }),

  /** Inert gas (argon) particles. */
  inertGasColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "inertGas", {
    default: "#6f7a92",
    projector: "#a0a8b6",
  }),

  /** Ring flashed around a newly formed particle. */
  reactionFlashColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "reactionFlash", {
    default: "#ffffff",
    projector: "#333333",
  }),

  /** Background of digital readouts. */
  readoutBackgroundColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "readoutBackground", {
    default: "#0d1326",
    projector: "#ffffff",
  }),

  // ── Species (particle colours and solution tints) ─────────────────────────────

  /** N₂O₄: colourless. */
  speciesN2O4ColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "speciesN2O4", {
    default: "#d9dde4",
    projector: "#a9afb8",
  }),

  /** NO₂: brown. */
  speciesNO2ColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "speciesNO2", {
    default: "#c8662a",
    projector: "#a0461a",
  }),

  /** H₂. */
  speciesH2ColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "speciesH2", {
    default: "#f5f5f5",
    projector: "#c4c4c4",
  }),

  /** I₂ vapour: violet. */
  speciesI2ColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "speciesI2", {
    default: "#a05cd6",
    projector: "#6a1b9a",
  }),

  /** HI. */
  speciesHIColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "speciesHI", {
    default: "#80cbc4",
    projector: "#00897b",
  }),

  /** N₂. */
  speciesN2ColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "speciesN2", {
    default: "#64b5f6",
    projector: "#1565c0",
  }),

  /** NH₃. */
  speciesNH3ColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "speciesNH3", {
    default: "#aed581",
    projector: "#558b2f",
  }),

  /** CO. */
  speciesCOColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "speciesCO", {
    default: "#ffb74d",
    projector: "#e65100",
  }),

  /** H₂O vapour. */
  speciesH2OColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "speciesH2O", {
    default: "#4fc3f7",
    projector: "#0277bd",
  }),

  /** CO₂. */
  speciesCO2ColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "speciesCO2", {
    default: "#90a4ae",
    projector: "#455a64",
  }),

  /** Fe³⁺(aq): pale yellow. */
  speciesFeColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "speciesFe", {
    default: "#ffd27f",
    projector: "#d18a00",
  }),

  /** SCN⁻(aq): colourless. */
  speciesSCNColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "speciesSCN", {
    default: "#b0bec5",
    projector: "#607d8b",
  }),

  /** FeSCN²⁺(aq): blood red. */
  speciesFeSCNColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "speciesFeSCN", {
    default: "#e53935",
    projector: "#b71c1c",
  }),

  /** Co(H₂O)₆²⁺(aq): pink. */
  speciesCoH2OColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "speciesCoH2O", {
    default: "#f48fb1",
    projector: "#d81b60",
  }),

  /** Cl⁻(aq). */
  speciesClColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "speciesCl", {
    default: "#a5d6a7",
    projector: "#2e7d32",
  }),

  /** CoCl₄²⁻(aq): blue. */
  speciesCoCl4ColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "speciesCoCl4", {
    default: "#5c7cff",
    projector: "#1a3bb3",
  }),

  /** Generic species A. */
  speciesAColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "speciesA", {
    default: "#4fc3f7",
    projector: "#0277bd",
  }),

  /** Generic species B. */
  speciesBColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "speciesB", {
    default: "#ffb74d",
    projector: "#e65100",
  }),

  /** Generic species C. */
  speciesCColorProperty: new ProfileColorProperty(EquilibriumLabNamespace, "speciesC", {
    default: "#ba68c8",
    projector: "#7b1fa2",
  }),
};

export default EquilibriumLabColors;
