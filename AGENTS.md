# AGENTS.md — EquilibriumLab

Sim-specific context for AI assistants. General SceneryStack guidance: [OpenLyceum/.github/AGENTS.md](https://github.com/OpenLyceum/.github/blob/main/AGENTS.md).

## Project

Chemical equilibrium for **introductory (General) chemistry**, the equilibrium chapter of Gen Chem 2
(OpenStax *Chemistry 2e*, chapter 13). It sits with LightAndAtoms, PeriodicTrends, TitrationLab,
Electrochemistry and CalorimetryLab in the Gen Chem set and fills a gap: PhET has no quantitative
equilibrium simulation. Four screens:

| Screen | Folder | Content |
|---|---|---|
| Approach | `src/approach/` | Pick a reaction and starting concentrations; watch Q approach K on a log gauge while the forward and reverse rates converge; event counters show dynamic equilibrium; Kc/Kp forms; generic reactions with adjustable K and kf |
| ICE Table | `src/ice-table/` | Generated "find the equilibrium row" and "find K" problems; change-row pickers, keypad entry of x and K, feedback with the small-x (5 %) test, Show solution, and Run it against dashed lines at the student's E row |
| Le Chatelier | `src/le-chatelier/` | Start at equilibrium; add/remove species, piston or dilution, argon at fixed V or P, temperature, catalyst; each stress marked on the chart; "What changed?" says whether Q or K moved; optional predict-first mode |
| Van 't Hoff | `src/vant-hoff/` | Set T, wait for equilibrium (catalysed), measure K°; ln K against 1000/T with least-squares ΔH° and ΔS°; ΔG° against T with its zero crossing; two unknown reactions |

Chemistry, data sources and assumptions: [`doc/model.md`](doc/model.md). Architecture and design
decisions: [`doc/implementation-notes.md`](doc/implementation-notes.md).

### Things to know first

- **One reaction model for every screen.** `common/model/ReactionMixture.ts` holds amounts (mol),
  volume (L), temperature (K), catalyst and inert gas. It integrates the extent ξ with RK4 in
  substeps of at most half the local relaxation time, so atoms are conserved exactly; a mixture
  that relaxes much faster than a frame is placed at equilibrium by the solver instead.
- **Kinetics are illustrative, thermodynamics are not.** Each reaction is one elementary step with
  kr = kf/Kc, so it always settles exactly at K. ΔH° and ΔS° (from OpenStax Appendix G for the
  gases) set K(T); the rate constants and the low activation energies (29–40 kJ/mol) are chosen so
  every temperature settles in seconds. The two aqueous reactions use representative teaching
  values (see `doc/model.md`).
- **Standard states.** Gases: K° = Kp (bar), Kc = Kp/(RT)^Δn. Solutions: K° = Kc (M). Pure water in
  the cobalt equilibrium never enters Q. Species in large excess (`bulk`, Cl⁻) take no part in
  particle events and are left off the concentration chart; their concentration is a readout.
- **The particle box replays the model.** `ParticleSystem` turns the mixture's cumulative forward
  and reverse flows into individual events (capped per frame) and corrects any drift against the
  net extent, so counts match the amounts to within a few particles and molecules keep forming and
  breaking apart at equilibrium.
- **`equilibriumSolver.ts`** bisects ln Qc(ξ) − ln Kc between the extents where a product or a
  reactant runs out. It starts mixtures at equilibrium, checks ICE problems and draws the
  equilibrium reference lines.
- **ICE problems are self-consistent.** The K shown is rounded to three figures and the reaction's
  ΔS° is shifted so that value is exact; in "find K" problems the given concentration is rounded
  first and K computed from it. Answers are accepted within 2 %, and a change row with every sign
  flipped is accepted with a negated x.
- **Le Chatelier verdicts compare ln Qc and ln Kc** before and after the stress
  (`LeChatelierModel.endStress`). `ReactionSceneModel.beginStress` holds reaction time (including
  Step Forward) until release and records the pre-stress state; `endStress` records the post-stress
  state at the same time. The play/pause selection is preserved. A drag or slider press that ends
  where it began is not a stress; repeats of one stress within a second share a chart marker.
- **Van 't Hoff slopes.** The fit stores the slope against 1/T; the graph and its slope readout
  use 1000/T, dividing that slope by `INVERSE_TEMPERATURE_SCALE`. The displayed enthalpy formula
  includes the factor of 1000. Keep the axis, title, slope readout and formula consistent.
- **Chart axes:** `TimeChartNode.applyAxis` widens the tick spacing before the range (or narrows the
  range before the spacing). The other order momentarily asks bamboo for millions of grid lines
  and crashes the page.

## Key files

| File | Purpose |
|---|---|
| `src/EquilibriumLabConstants.ts` | Gas constants, kinetics and integration limits, time scales, record sizes, particle box, stress steps, layout |
| `src/EquilibriumLabColors.ts` | All `ProfileColorProperty` instances: chrome, charts, gauge, vessels, every species |
| `src/common/model/Reaction.ts` | Species, ΔH°/ΔS°, K°/Kc/Kp, Arrhenius kf, kr = kf/Kc |
| `src/common/model/Reactions.ts` | The nine reactions and their data, ranges and defaults |
| `src/common/model/ReactionMixture.ts` | State, stresses, mass-action integration, gross flows |
| `src/common/model/equilibriumSolver.ts` | ln Qc/ln Qp, extent bounds, equilibrium extent |
| `src/common/model/ParticleSystem.ts` | Particle box that replays the flows as events |
| `src/common/model/ReactionSceneModel.ts` | Mixture + particles + records + clock + Kc/Kp form, composed by three screens |
| `src/common/model/TimeRecord.ts` | Sampled traces and stress markers |
| `src/common/model/vantHoffFit.ts` | Least-squares ln K against 1/T → ΔH°, ΔS°, R² |
| `src/common/view/ParticleBoxNode.ts` | Cylinder with draggable piston or beaker; canvas particles, tint, flashes |
| `src/common/view/QKGaugeNode.ts` | Logarithmic Q/K gauge with the shift caption |
| `src/common/view/TimeChartNode.ts` | Self-fitting chart for a TimeRecord with markers and reference lines |
| `src/ice-table/model/ICEProblem.ts` | Problem generation, change-row sign check, small-x test |
| `src/le-chatelier/view/StressExplanationNode.ts` | "What changed?" text and prediction verdict |
| `src/vant-hoff/view/XYPlotNode.ts` | Scatter plot with a fitted line (ln K and ΔG° plots) |

## Accessibility

- Every screen has a live summary: reaction, which way the mixture is shifting, Q and K (Approach,
  Le Chatelier); the problem and task (ICE Table); reaction, temperature, number of measurements and
  the fitted ΔH° and ΔS° (Van 't Hoff).
- Announced: reaching equilibrium and restarting (Approach); each stress's explanation (Le
  Chatelier); the check or solution feedback (ICE Table); each measurement (Van 't Hoff).
- The piston is a keyboard-draggable handle (arrow keys; Shift for fine steps). The change-row
  pickers are spinners; x and K are typed on the keypad dialog. Keyboard-help dialogs list the
  slider, spinner, drag, combo-box and time-control keys per screen.
- The particle box is decorative; what it shows is in the readouts, gauge and summaries.

## Compliance carve-outs

None: every colour is in `EquilibriumLabColors.ts`. The vessel tint is mixed at paint time from the
species' profile colours.

## Testing

| Path | Purpose |
|---|---|
| `tests/common/Reactions.test.ts` | K(298 K) against tabulated values (N₂O₄ ≈ 0.15, Haber ≈ 6 × 10⁵, WGS ≈ 10⁵), Kc = Kp/(RT)^Δn, temperature rule, defaults |
| `tests/common/ReactionMixture.test.ts` | Textbook ICE answers (N₂O₄, HI), same equilibrium from either side, settle times, atom balance, rates equal at equilibrium, each Le Chatelier stress's direction |
| `tests/common/ParticleSystem.test.ts` | Particle counts follow the amounts; events in both directions at equilibrium; van 't Hoff fit recovers ΔH° and ΔS° |
| `tests/ice-table/ICETable.test.ts` | Generated problems satisfy K in both modes for every reaction; sign conventions; checking; Run it lands on the E row |
| `tests/le-chatelier/LeChatelierModel.test.ts` | Q vs K verdicts per stress, no-op drags, argon, dilution, catalyst, predict-first gating |
| `tests/vant-hoff/VantHoffModel.test.ts` | ΔH° recovered for every choice; no measurement before equilibrium; scatter with error |
| `tests/browser/review-regressions.spec.ts` | Held temperature/piston keyboard gestures, chart discontinuities, and the plotted fit slope and formula in all three locales |
| `tests/memory-leak.test.ts`, `tests/helpers/`, `tests/fuzz/` | Template-owned harness; the leak suite covers the mixture, particles, scene and the shared view nodes |

## PWA

After `npm run build`, the sim is installable offline via Workbox (`dist/manifest.webmanifest`).
