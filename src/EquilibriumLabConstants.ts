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

// ── Le Chatelier stresses ─────────────────────────────────────────────────────

/** Each add or remove press changes a species by this fraction of the largest default amount. */
export const SPECIES_STEP_FRACTION = 0.25;

/** Each "add water" press grows the solution by this fraction of its largest volume. */
export const DILUTION_STEP_FRACTION = 0.15;

/** Each argon press adds this fraction of the moles of gas already in the vessel. */
export const ARGON_STEP_FRACTION = 0.5;

// ── Van 't Hoff ───────────────────────────────────────────────────────────────

/** Plot inverse temperature as 1000/T; the graph slope is the 1/T slope divided by this scale. */
export const INVERSE_TEMPERATURE_SCALE = 1000;

/**
 * K can be measured once ln(Q/K) is within this of zero: tighter than "at equilibrium" in messages,
 * so a reaction with a small ΔH° still gives a straight van 't Hoff line.
 */
export const MEASUREMENT_LN_TOLERANCE = 0.002;

/** Standard deviation of a measured ln K when measurement error is on (about ±4 % in K). */
export const MEASUREMENT_LN_SPREAD = 0.04;

// ── Records ───────────────────────────────────────────────────────────────────

/** Simulated seconds between recorded samples. */
export const RECORD_INTERVAL = 0.1;

/** Repeats of the same stress within this many simulated seconds share one chart marker. */
export const MARKER_MERGE_TIME = 1;

/** A record keeps at most this many samples; later samples are thinned. */
export const RECORD_CAPACITY = 2400;

// ── Particle box ──────────────────────────────────────────────────────────────

/** Particle box width in box units. */
export const BOX_WIDTH = 1;

/** Particle box height at the reaction's largest volume (box units); it scales with the volume. */
export const BOX_MAX_HEIGHT = 1.1;

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

/** Settings for approach/model/ApproachModel.ts. */
export const APPROACH_MODEL_SETTINGS = {
  /** Minimum randomized initial amount fraction (dimensionless). */
  INITIAL_FRACTION_MIN: 0.1,
  /** Maximum randomized initial amount fraction (dimensionless). */
  INITIAL_FRACTION_MAX: 0.6,
  /** Generic log k range min (dimensionless). */
  GENERIC_LOG_K_RANGE_MIN: -2,
  /** Generic log k range max (dimensionless). */
  GENERIC_LOG_K_RANGE_MAX: 2,
  /** Generic forward rate range min ((mol/L)^(1−reaction order)/s). */
  GENERIC_FORWARD_RATE_RANGE_MIN: 0.02,
  /** Generic forward rate default ((mol/L)^(1−reaction order)/s). */
  GENERIC_FORWARD_RATE_DEFAULT: 0.2,
} as const;

/** Settings for approach/view/ApproachScreenView.ts. */
export const APPROACH_SCREEN_VIEW_SETTINGS = {
  CONSTRUCTOR_TOP_OFFSET: 6, // px

  SHOW_EQUILIBRIUM_CHECKBOX_MAX_WIDTH: 300, // px
  LOG_K_CONTROL_DIGITS: 2, // digits
  KF_CONTROL_DIGITS: 2, // digits
  START_PANEL_ITEM_3_SPACING: 6, // px

  /** Box width px (px). */
  BOX_WIDTH_PX: 236,
  /** Particle box y (px). */
  PARTICLE_BOX_Y: 64,
  /** Chart left (px). */
  CHART_LEFT: 372,
  /** Chart width (px). */
  CHART_WIDTH: 350,
  /** Concentration chart top (px). */
  CONCENTRATION_CHART_TOP: 104,
  /** Concentration chart height (px). */
  CONCENTRATION_CHART_HEIGHT: 168,
  /** Rate chart top (px). */
  RATE_CHART_TOP: 388,
  /** Rate chart height (px). */
  RATE_CHART_HEIGHT: 112,
  /** Form box spacing (px). */
  FORM_BOX_SPACING: 4,
  /** Reaction panel spacing (px). */
  REACTION_PANEL_SPACING: 8,
  /** Log k control delta (control/model units). */
  LOG_K_CONTROL_DELTA: 0.05,
  /** Log k control max width (px). */
  LOG_K_CONTROL_MAX_WIDTH: 120,
  /** Log k control keyboard step (control/model units). */
  LOG_K_CONTROL_KEYBOARD_STEP: 0.25,
  /** Log k control shift keyboard step (control/model units). */
  LOG_K_CONTROL_SHIFT_KEYBOARD_STEP: 0.05,
  /** Kf control delta (control/model units). */
  KF_CONTROL_DELTA: 0.01,
  /** Kf control max width (px). */
  KF_CONTROL_MAX_WIDTH: 140,
  /** Kf control keyboard step (control/model units). */
  KF_CONTROL_KEYBOARD_STEP: 0.05,
  /** Kf control shift keyboard step (control/model units). */
  KF_CONTROL_SHIFT_KEYBOARD_STEP: 0.01,
  /** Kf control page keyboard step (control/model units). */
  KF_CONTROL_PAGE_KEYBOARD_STEP: 0.2,
  /** Generic box spacing (px). */
  GENERIC_BOX_SPACING: 6,
  /** Start panel spacing (px). */
  START_PANEL_SPACING: 8,
} as const;

/** Settings for approach/view/StartingConcentrationsNode.ts. */
export const STARTING_CONCENTRATIONS_NODE_SETTINGS = {
  /** Constructor spacing (px). */
  CONSTRUCTOR_SPACING: 6,
} as const;

/** Settings for common/EquilibriumLabControlOptions.ts. */
export const EQUILIBRIUM_LAB_CONTROL_OPTIONS_SETTINGS = {
  /** Slider thumb size width (px). */
  SLIDER_THUMB_SIZE_WIDTH: 12,
  /** Slider thumb size height (px). */
  SLIDER_THUMB_SIZE_HEIGHT: 22,
  /** Standalone slider track size width (px). */
  STANDALONE_SLIDER_TRACK_SIZE_WIDTH: 150,
  /** Standalone slider track size height (px). */
  STANDALONE_SLIDER_TRACK_SIZE_HEIGHT: 3,
  /** Number control slider track size width (px). */
  NUMBER_CONTROL_SLIDER_TRACK_SIZE_WIDTH: 110,
  /** Number control slider track size height (px). */
  NUMBER_CONTROL_SLIDER_TRACK_SIZE_HEIGHT: 3,
  /** Checkbox box width (px). */
  CHECKBOX_BOX_WIDTH: 16,
  /** Equilibrium lab number control options scale (dimensionless). */
  EQUILIBRIUM_LAB_NUMBER_CONTROL_OPTIONS_SCALE: 0.75,
  /** Equilibrium lab number control options slider padding (px). */
  EQUILIBRIUM_LAB_NUMBER_CONTROL_OPTIONS_SLIDER_PADDING: 4,
  /** Equilibrium lab number control options arrow button spacing (px). */
  EQUILIBRIUM_LAB_NUMBER_CONTROL_OPTIONS_ARROW_BUTTON_SPACING: 3,
  /** Equilibrium lab number control options vertical spacing (px). */
  EQUILIBRIUM_LAB_NUMBER_CONTROL_OPTIONS_VERTICAL_SPACING: 4,
  /** Equilibrium lab checkbox options spacing (px). */
  EQUILIBRIUM_LAB_CHECKBOX_OPTIONS_SPACING: 4,
} as const;

/** Settings for common/EquilibriumLabPanel.ts. */
export const EQUILIBRIUM_LAB_PANEL_SETTINGS = {
  /** Options x margin (px). */
  OPTIONS_X_MARGIN: 12,
  /** Options y margin (px). */
  OPTIONS_Y_MARGIN: 10,
} as const;

/** Settings for common/EquilibriumLabScreenIcons.ts. */
export const EQUILIBRIUM_LAB_SCREEN_ICONS_SETTINGS = {
  CREATE_ICE_TABLE_ICON_CENTER_X_OFFSET: 1.5, // px
  CREATE_ICE_TABLE_ICON_MAX_WIDTH_OFFSET: 12, // px
  MARKER_LINE_DASH_DASH: 12, // px
  CREATE_LE_CHATELIER_ICON_MARKER_LINE_DASH_DASH: 10, // px

  CHART_WIDTH: 230, // px
  CHART_HEIGHT: 240, // px
  CHART_WIDTH_SEGMENT_2: 430, // px
  CHART_HEIGHT_SEGMENT_2: 270, // px
  BEFORE_Y_SEGMENT_2: 110, // px
  CHART_HEIGHT_SEGMENT_3: 290, // px

  /** Frame line width (px). */
  FRAME_LINE_WIDTH: 4,
  /** Vessel x (px). */
  VESSEL_X: 40,
  /** Vessel y (px). */
  VESSEL_Y: 70,
  /** Vessel width (px). */
  VESSEL_WIDTH: 190,
  /** Vessel height (px). */
  VESSEL_HEIGHT: 240,
  /** Vessel line width (px). */
  VESSEL_LINE_WIDTH: 8,
  /** Tint x (px). */
  TINT_X: 44,
  /** Tint y (px). */
  TINT_Y: 74,
  /** Tint width (px). */
  TINT_WIDTH: 182,
  /** Tint height (px). */
  TINT_HEIGHT: 232,
  /** Tint opacity (dimensionless). */
  TINT_OPACITY: 0.35,
  /** Falling line width (px). */
  FALLING_LINE_WIDTH: 8,
  /** Rising line width (px). */
  RISING_LINE_WIDTH: 8,
  /** Left (px). */
  LEFT: 70,
  /** Top (px). */
  TOP: 50,
  /** Create ice table icon line width (px). */
  CREATE_ICE_TABLE_ICON_LINE_WIDTH: 4,
  /** Font size (px). */
  FONT_SIZE: 64,
  /** Value font size (px). */
  VALUE_FONT_SIZE: 46,
  /** Marker start y (px). */
  MARKER_START_Y: 54,
  /** Marker end y (px). */
  MARKER_END_Y: 316,
  /** Marker line width (px). */
  MARKER_LINE_WIDTH: 4,
  /** Before x (px). */
  BEFORE_X: 64,
  /** Before y (px). */
  BEFORE_Y: 230,
  /** Added line width (px). */
  ADDED_LINE_WIDTH: 8,
  /** Relaxing line width (px). */
  RELAXING_LINE_WIDTH: 8,
  /** Product x (px). */
  PRODUCT_X: 64,
  /** Product y (px). */
  PRODUCT_Y: 280,
  /** Product line width (px). */
  PRODUCT_LINE_WIDTH: 8,
  /** Line start x (px). */
  LINE_START_X: 80,
  /** Line start y (px). */
  LINE_START_Y: 300,
  /** Line end x (px). */
  LINE_END_X: 470,
  /** Line end y (px). */
  LINE_END_Y: 70,
  /** Line line width (px). */
  LINE_LINE_WIDTH: 8,
  /** Points radius (px). */
  POINTS_RADIUS: 15,
} as const;

/** Settings for common/model/ParticleSystem.ts. */
export const PARTICLE_SYSTEM_SETTINGS = {
  /** Most events replayed per frame in each direction; a faster backlog is skipped, not queued. */
  MAX_EVENTS_PER_STEP: 12,
} as const;

/** Settings for common/model/equilibriumSolver.ts. */
export const EQUILIBRIUM_SOLVER_SETTINGS = {
  /** Bisection steps: each halves the bracket, so 200 reaches machine precision for any bracket. */
  BISECTION_STEPS: 200,
} as const;

/** Settings for common/view/ControlFactory.ts. */
export const CONTROL_FACTORY_SETTINGS = {
  ITEMS_MAX_WIDTH_OFFSET: 40, // px
  RADIO_GROUP_SPACING: 4, // px
  NUMBER_CONTROL_MAX_WIDTH_OFFSET: 70, // px

  /** Control font size (px). */
  CONTROL_FONT_SIZE: 13,
  /** Small font size (px). */
  SMALL_FONT_SIZE: 12,
  /** Heading font size (px). */
  HEADING_FONT_SIZE: 14,
  /** Combo box x margin (px). */
  COMBO_BOX_X_MARGIN: 8,
  /** Combo box y margin (px). */
  COMBO_BOX_Y_MARGIN: 3,
  /** Combo box corner radius (px). */
  COMBO_BOX_CORNER_RADIUS: 4,
  /** Push button x margin (px). */
  PUSH_BUTTON_X_MARGIN: 8,
  /** Push button y margin (px). */
  PUSH_BUTTON_Y_MARGIN: 4,
  /** Radio group radius (px). */
  RADIO_GROUP_RADIUS: 6,
} as const;

/** Settings for common/view/MixtureReadoutsNode.ts. */
export const MIXTURE_READOUTS_NODE_SETTINGS = {
  ITEM_3_SPACING: 16, // px
  VOLUME_SIGNIFICANT_DIGITS: 3, // digits
  SIGNIFICANT_DIGITS: 3, // digits

  /** Seconds between refreshes of the readouts, so the numbers stay legible. */
  REFRESH_INTERVAL: 0.25,
  /** Constructor spacing (px). */
  CONSTRUCTOR_SPACING: 4,
} as const;

/** Settings for common/view/ParticleBoxNode.ts. */
export const PARTICLE_BOX_NODE_SETTINGS = {
  /** Sprite sizes in speciesStyles.ts are for a box this wide (px). */
  REFERENCE_WIDTH: 260,
  /** Seconds a newly formed particle is ringed. */
  FLASH_TIME: 0.5,
  /** Above this many reaction events per second the rings fade in proportion. */
  FLASH_RATE_LIMIT: 24,
  /** Wall thickness of the vessel (px). */
  WALL: 4,
  /** Piston plate thickness and handle size (px). */
  PISTON_THICKNESS: 10,
  /** Handle width (px). */
  HANDLE_WIDTH: 46,
  /** Handle height (px). */
  HANDLE_HEIGHT: 14,
  /** Length of the piston rod between the plate and the handle (px). */
  ROD_LENGTH: 18,
  /** Volume change per keyboard press, as a fraction of the largest volume. */
  KEYBOARD_VOLUME_FRACTION: 0.02,
  /** Inert-gas particles drawn per mole of argon, relative to the reaction's particles per mole. */
  INERT_DOTS_CAP: 120,
  /** Rod line width (px). */
  ROD_LINE_WIDTH: 5,
  /** Handle corner x (px). */
  HANDLE_CORNER_X: 4,
  /** Handle corner y (px). */
  HANDLE_CORNER_Y: 4,
  /** Handle line width (px). */
  HANDLE_LINE_WIDTH: 1.5,
  /** Constructor min x (px). */
  CONSTRUCTOR_MIN_X: -2,
} as const;

/** Settings for common/view/QKGaugeNode.ts. */
export const QK_GAUGE_NODE_SETTINGS = {
  DRAW_TICKS_TOP_OFFSET: 5, // px
  CONSTRUCTOR_LEFT_OFFSET: 8, // px

  POINTER_SHAPE_X_SEGMENT_2: 7, // px
  OFF_SCALE_ARROW_X: -4, // px

  /** Decades shown on each side of K. */
  HALF_SPAN_DECADES: 4,
  /** Track height (px). */
  TRACK_HEIGHT: 8,
  /** Track corner x (px). */
  TRACK_CORNER_X: 4,
  /** Track corner y (px). */
  TRACK_CORNER_Y: 4,
  /** K marker start y (px). */
  K_MARKER_START_Y: -6,
  /** K marker line width (px). */
  K_MARKER_LINE_WIDTH: 3,
  /** K label max width (px). */
  K_LABEL_MAX_WIDTH: 40,
  /** Pointer shape x (px). */
  POINTER_SHAPE_X: -7,
  /** Pointer shape y (px). */
  POINTER_SHAPE_Y: -11,
  /** Q label max width (px). */
  Q_LABEL_MAX_WIDTH: 40,
  /** Column spacing (px). */
  COLUMN_SPACING: 8,
  /** Draw ticks max width (px). */
  DRAW_TICKS_MAX_WIDTH: 34,
  /** K label bottom inset (px). */
  K_LABEL_BOTTOM: -2,
  /** Q pointer y (px). */
  POINTER_Y: -2,
  /** Shape x (px). */
  SHAPE_X: -12,
} as const;

/** Settings for common/view/ReactionEquationNode.ts. */
export const REACTION_EQUATION_NODE_SETTINGS = {
  /** Equation font size (px). */
  EQUATION_FONT_SIZE: 20,
  /** Constructor spacing (px). */
  CONSTRUCTOR_SPACING: 4,
} as const;

/** Settings for common/view/RichTextLines.ts. */
export const RICH_TEXT_LINES_SETTINGS = {
  /** Constructor spacing (px). */
  CONSTRUCTOR_SPACING: 4,
} as const;

/** Settings for common/view/TimeChartNode.ts. */
export const TIME_CHART_NODE_SETTINGS = {
  CONSTRUCTOR_TOP_OFFSET: 18, // px
  TITLE_MAX_WIDTH_FACTOR: 0.4, // dimensionless
  CONSTRUCTOR_MAX_WIDTH_FACTOR: 0.58, // dimensionless
  REDRAW_LINE_DASH_DASH: 5, // px
  REDRAW_LEFT_OFFSET: 3, // px

  ITEM_1_LINE_WIDTH: 1.2, // px
  ITEM_1_OPACITY: 0.7, // dimensionless
  ITEM_2_MAX_WIDTH: 70, // px

  /** Smallest y range shown, so an all-zero record still has sensible axes. */
  MIN_Y_SPAN: 1e-6,
  /** Default minimum time window (s). */
  DEFAULT_MIN_TIME: 30,
  /** Plot x (px). */
  PLOT_X: -6,
  /** Plot y (px). */
  PLOT_Y: -6,
  /** Y-axis title right inset (px). */
  Y_TITLE_RIGHT: -42,
  /** Chart title bottom inset (px). */
  TITLE_BOTTOM: -8,
  /** Legend spacing (px). */
  LEGEND_SPACING: 10,
  /** Plots line width (px). */
  PLOTS_LINE_WIDTH: 2,
  /** Dots radius (px). */
  DOTS_RADIUS: 3.5,
  /** Children spacing (px). */
  CHILDREN_SPACING: 4,
  /** Children end x (px). */
  CHILDREN_END_X: 14,
  /** Children line width (px). */
  CHILDREN_LINE_WIDTH: 2,
  /** Children max width (px). */
  CHILDREN_MAX_WIDTH: 90,
  /** Children opacity (dimensionless). */
  CHILDREN_OPACITY: 0.8,
  /** Children top (px). */
  CHILDREN_TOP: 3,
} as const;

/** Settings for common/view/formatValues.ts. */
export const FORMAT_VALUES_SETTINGS = {
  /** Default digits (digits). */
  DEFAULT_DIGITS: 3,
} as const;

/** Settings for ice-table/model/ICEProblem.ts. */
export const ICE_PROBLEM_SETTINGS = {
  /** Probability of including products in an initial mixture (dimensionless). */
  PRODUCT_PRESENT_PROBABILITY: 0.3,
  /** Minimum initial reactant fraction of its maximum amount (dimensionless). */
  REACTANT_FRACTION_MIN: 0.3,
  /** Maximum initial reactant fraction (dimensionless). */
  REACTANT_FRACTION_MAX: 0.9,
  /** Minimum initial product fraction (dimensionless). */
  PRODUCT_FRACTION_MIN: 0.1,
  /** Maximum initial product fraction (dimensionless). */
  PRODUCT_FRACTION_MAX: 0.5,
  /** Significant figures shown in generated givens (digits). */
  GIVEN_SIGNIFICANT_FIGURES: 3,
  /** Absolute tolerance for an entered zero concentration change (mol/L). */
  ZERO_ANSWER_TOLERANCE: 1e-9,
  /** Default digits (digits). */
  DEFAULT_DIGITS: 3,
  /** Relative tolerance for an entered x or K. */
  ANSWER_TOLERANCE: 0.02,
} as const;

/** Settings for ice-table/model/ICETableModel.ts. */
export const ICE_TABLE_MODEL_SETTINGS = {
  /** Change coefficient range min (dimensionless). */
  CHANGE_COEFFICIENT_RANGE_MIN: -4,
  /** Change coefficient range max (dimensionless). */
  CHANGE_COEFFICIENT_RANGE_MAX: 4,
  /** Seed for problem generation, so a fresh screen always offers the same first problems. */
  PROBLEM_SEED: 18,
} as const;

/** Settings for ice-table/view/ICEFeedbackNode.ts. */
export const ICE_FEEDBACK_NODE_SETTINGS = {
  FEEDBACK_LINES_DIGITS: 3, // digits

  /** The small-x approximation holds when the change is under this percentage of the start. */
  SMALL_X_LIMIT_PERCENT: 5,
} as const;

/** Settings for ice-table/view/ICETableNode.ts. */
export const ICE_TABLE_NODE_SETTINGS = {
  LABEL_MAX_WIDTH_OFFSET: 34, // px
  VALUE_MAX_WIDTH_OFFSET: 8, // px
  MULTILINK_CENTER_Y: 3, // px

  C0_DIGITS: 3, // digits
  EVALUATE_CELL_DIGITS: 3, // digits
  LABEL_MAX_WIDTH: 20, // px
  INITIAL_DIGITS: 3, // digits
  X_TEXT_MAX_WIDTH: 20, // px

  /** Width of the row-label column and of each species column (px). */
  LABEL_WIDTH: 132,
  /** Row height (px). */
  ROW_HEIGHT: 50,
  /** Label spacing (px). */
  LABEL_SPACING: 6,
  /** Picker x margin (px). */
  PICKER_X_MARGIN: 6,
  /** Change spacing (px). */
  CHANGE_SPACING: 3,
} as const;

/** Settings for ice-table/view/ICETableScreenView.ts. */
export const ICE_TABLE_SCREEN_VIEW_SETTINGS = {
  CONSTRUCTOR_TOP_OFFSET: 6, // px
  CONSTRUCTOR_LEFT_OFFSET: 44, // px

  K_SCIENTIFIC_DIGITS: 3, // digits
  TEMPERATURE_SIGNIFICANT_DIGITS: 3, // digits
  GIVEN_DIGITS: 3, // digits
  K_LABEL_MAX_WIDTH: 40, // px
  EQUALS_LABEL_MAX_WIDTH: 20, // px
  ENTRIES_ITEM_1_SPACING: 6, // px
  X_LABEL_LABEL_MAX_WIDTH: 40, // px
  M_LABEL_MAX_WIDTH: 20, // px
  FEEDBACK_HEADING_HEADING_MAX_WIDTH: 300, // px

  /** Left width (px). */
  LEFT_WIDTH: 620,
  /** Table top (px). */
  TABLE_TOP: 118,
  /** Chart left (px). */
  CHART_LEFT: 708,
  /** Chart width (px). */
  CHART_WIDTH: 292,
  /** Chart top (px). */
  CHART_TOP: 300,
  /** Chart height (px). */
  CHART_HEIGHT: 140,
  /** Largest |x| and K the keypad accepts. */
  X_ENTRY_LIMIT: 10,
  /** K entry limit (px). */
  K_ENTRY_LIMIT: 1e7,
  /** Statement spacing (px). */
  STATEMENT_SPACING: 6,
  /** K entry row spacing (px). */
  K_ENTRY_ROW_SPACING: 6,
  /** Entries spacing (px). */
  ENTRIES_SPACING: 24,
  /** Buttons spacing (px). */
  BUTTONS_SPACING: 10,
  /** Work spacing (px). */
  WORK_SPACING: 14,
  /** Feedback panel spacing (px). */
  FEEDBACK_PANEL_SPACING: 6,
  /** Problem panel spacing (px). */
  PROBLEM_PANEL_SPACING: 8,
} as const;

/** Settings for ice-table/view/NumberEntryNode.ts. */
export const NUMBER_ENTRY_NODE_SETTINGS = {
  TEXT_MAX_WIDTH_OFFSET: 16, // px

  TEXT_DIGITS: 3, // digits

  /** Constructor x margin (px). */
  CONSTRUCTOR_X_MARGIN: 8,
  /** Constructor y margin (px). */
  CONSTRUCTOR_Y_MARGIN: 4,
} as const;

/** Settings for le-chatelier/model/LeChatelierModel.ts. */
export const LE_CHATELIER_MODEL_SETTINGS = {
  /** Relative tolerance at the allowed volume limit (dimensionless). */
  VOLUME_LIMIT_TOLERANCE: 1e-6,
  /** Relative change in ln Q or ln K below which it counts as unchanged. */
  CHANGE_TOLERANCE: 1e-9,
} as const;

/** Settings for le-chatelier/view/LeChatelierScreenView.ts. */
export const LE_CHATELIER_SCREEN_VIEW_SETTINGS = {
  CONSTRUCTOR_TOP_OFFSET: 6, // px
  CONSTRUCTOR_LEFT_OFFSET: 44, // px

  EXPLANATION_HEADING_HEADING_MAX_WIDTH: 300, // px
  PREDICT_FIRST_CHECKBOX_MAX_WIDTH: 300, // px
  PREDICTION_RADIO_GROUP_MAX_WIDTH: 110, // px
  PREDICTION_HEADING_HEADING_MAX_WIDTH: 300, // px
  PREDICT_PROMPT_NOTE_WIDTH: 340, // px
  REACTION_PANEL_ITEM_3_SPACING: 4, // px

  /** Box width px (px). */
  BOX_WIDTH_PX: 236,
  /** Particle box y (px). */
  PARTICLE_BOX_Y: 64,
  /** Chart left (px). */
  CHART_LEFT: 372,
  /** Chart width (px). */
  CHART_WIDTH: 350,
  /** Chart top (px). */
  CHART_TOP: 104,
  /** Chart height (px). */
  CHART_HEIGHT: 196,
  /** Middle panel width (px). */
  MIDDLE_PANEL_WIDTH: 398,
  /** Explanation panel spacing (px). */
  EXPLANATION_PANEL_SPACING: 6,
  /** Prediction box spacing (px). */
  PREDICTION_BOX_SPACING: 6,
  /** Prediction panel spacing (px). */
  PREDICTION_PANEL_SPACING: 8,
  /** Reaction panel spacing (px). */
  REACTION_PANEL_SPACING: 8,
  /** Stress panel spacing (px). */
  STRESS_PANEL_SPACING: 8,
} as const;

/** Settings for le-chatelier/view/StressControlsNode.ts. */
export const STRESS_CONTROLS_NODE_SETTINGS = {
  /** Width of the formula column in a species row (px). */
  FORMULA_WIDTH: 96,
  /** Constructor spacing (px). */
  CONSTRUCTOR_SPACING: 8,
  /** Rows spacing (px). */
  ROWS_SPACING: 6,
  /** Rebuild spacing (px). */
  REBUILD_SPACING: 6,
} as const;

/** Settings for le-chatelier/view/StressExplanationNode.ts. */
export const STRESS_EXPLANATION_NODE_SETTINGS = {
  /** Constructor spacing (px). */
  CONSTRUCTOR_SPACING: 6,
} as const;

/** Settings for preferences/EquilibriumLabPreferencesNode.ts. */
export const EQUILIBRIUM_LAB_PREFERENCES_NODE_SETTINGS = {
  /** Header font size (px). */
  HEADER_FONT_SIZE: 18,
  /** Preference checkbox font size (px). */
  PREFERENCE_CHECKBOX_FONT_SIZE: 14,
  /** Preference checkbox max width (px). */
  PREFERENCE_CHECKBOX_MAX_WIDTH: 420,
  /** Preference checkbox spacing (px). */
  PREFERENCE_CHECKBOX_SPACING: 8,
  /** Constructor spacing (px). */
  CONSTRUCTOR_SPACING: 12,
} as const;

/** Settings for vant-hoff/model/VantHoffModel.ts. */
export const VANT_HOFF_MODEL_SETTINGS = {
  /** Joules per kilojoule (J/kJ). */
  KJ: 1000,
  /** Seed for the measurement errors, so a fresh screen replays the same scatter. */
  NOISE_SEED: 42,
} as const;

/** Settings for vant-hoff/view/VantHoffResultsNode.ts. */
export const VANT_HOFF_RESULTS_NODE_SETTINGS = {
  TEXTS_DECIMALS: 3, // digits
  TEXTS_DECIMALS_SEGMENT_2: 2, // digits
  R_SQUARED_FIXED_DECIMALS: 4, // digits
  SIGNIFICANT_DIGITS: 3, // digits

  /** Joules per kilojoule (J/kJ). */
  KJ: 1000,
} as const;

/** Settings for vant-hoff/view/VantHoffScreenView.ts. */
export const VANT_HOFF_SCREEN_VIEW_SETTINGS = {
  CONSTRUCTOR_TOP_OFFSET: 6, // px

  LN_STANDARD_Q_SCIENTIFIC_FROM_LN_DIGITS: 3, // digits
  CATALYST_NOTE_NOTE_WIDTH: 300, // px
  MEASURE_BUTTON_DECIMALS: 2, // digits
  MEASURE_PANEL_ITEM_4_SPACING: 6, // px

  /** Box width px (px). */
  BOX_WIDTH_PX: 220,
  /** Particle box y (px). */
  PARTICLE_BOX_Y: 64,
  /** Plot left (px). */
  PLOT_LEFT: 372,
  /** Plot width (px). */
  PLOT_WIDTH: 340,
  /** Ln plot top (px). */
  LN_PLOT_TOP: 78,
  /** Ln plot height (px). */
  LN_PLOT_HEIGHT: 180,
  /** Gibbs plot top (px). */
  GIBBS_PLOT_TOP: 340,
  /** Gibbs plot height (px). */
  GIBBS_PLOT_HEIGHT: 140,
  /** Joules per kilojoule (J/kJ). */
  KJ: 1000,
  /** Extra room around the expected data, as a fraction of its span (measurement error, margins). */
  RANGE_PADDING: 0.12,
  /** Seconds between refreshes of the K readout. */
  READOUT_INTERVAL: 0.25,
  /** Status max width (px). */
  STATUS_MAX_WIDTH: 300,
  /** K readout max width (px). */
  K_READOUT_MAX_WIDTH: 300,
  /** Status box spacing (px). */
  STATUS_BOX_SPACING: 6,
  /** Reaction panel spacing (px). */
  REACTION_PANEL_SPACING: 8,
  /** Measure panel spacing (px). */
  MEASURE_PANEL_SPACING: 8,
  /** Results panel spacing (px). */
  RESULTS_PANEL_SPACING: 6,
} as const;

/** Settings for vant-hoff/view/XYPlotNode.ts. */
export const XY_PLOT_NODE_SETTINGS = {
  CONSTRUCTOR_LINE_DASH_DASH: 4, // px
  CONSTRUCTOR_TOP_OFFSET: 18, // px

  /** A spacing wider than any range, used while the ranges change. */
  COARSE_SPACING: 1e15,
  /** Fit line line width (px). */
  FIT_LINE_LINE_WIDTH: 2,
  /** Plot x (px). */
  PLOT_X: -6,
  /** Plot y (px). */
  PLOT_Y: -6,
  /** Y-axis title right inset (px). */
  Y_TITLE_RIGHT: -38,
  /** Chart title bottom inset (px). */
  TITLE_BOTTOM: -8,
  /** Children radius (px). */
  CHILDREN_RADIUS: 4,
} as const;

/** Component dimensions in px; ratios and control steps are dimensionless; precision counts digits. */
export const ICE_TABLE_SCREEN_SUMMARY_CONTENT_SETTINGS = {
  K_SCIENTIFIC_DIGITS: 3, // digits
  TEMPERATURE_SIGNIFICANT_DIGITS: 3, // digits
  GIVEN_DIGITS: 3, // digits
} as const;

/** Component dimensions in px; ratios and control steps are dimensionless; precision counts digits. */
export const QUOTIENT_DESCRIPTION_SETTINGS = {
  DESCRIBE_QUOTIENT_DIGITS: 2, // digits
} as const;

/** Settings for common/model/ReactionMixture.ts; units are documented per value. */
export const REACTION_MIXTURE_NUMERICS = {
  /** Minimum finite-difference extent (mol). */
  MIN_EXTENT_DIFFERENCE: 1e-12,
  /** Finite-difference interval as a fraction of available extent (dimensionless). */
  RELATIVE_EXTENT_DIFFERENCE: 1e-6,
  /** Positive floor on the relaxation rate (1/s). */
  MIN_RELAXATION_RATE: 1e-9,
} as const;

/** Settings for common/model/TimeRecord.ts; units are documented per value. */
export const TIME_RECORD_NUMERICS = {
  /** Tolerance for reaching a record boundary (s). */
  SAMPLE_TIME_TOLERANCE: 1e-9,
} as const;

/** Settings for common/model/vantHoffFit.ts; units are documented per value. */
export const VANT_HOFF_FIT_NUMERICS = {
  /** Minimum sum of squared inverse-temperature deviations (1/K²). */
  MIN_TEMPERATURE_VARIANCE: 1e-18,
} as const;

EquilibriumLabNamespace.register("EquilibriumLabConstants", {
  SCREEN_VIEW_MARGIN,
  PANEL_CORNER_RADIUS,
  PANEL_SPACING,
  SIDE_COLUMN_WIDTH,
  GAS_CONSTANT,
  GAS_CONSTANT_L_BAR,
  CATALYST_FACTOR,
});
