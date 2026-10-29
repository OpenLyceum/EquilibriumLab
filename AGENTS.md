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
  (`LeChatelierModel.endStress`). A drag or slider press that ends where it began is not a stress;
  repeats of one stress within a second share a chart marker.
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

### Template-owned files (drift-checked)

Infrastructure files are owned by this template and must stay byte-identical in every sim
(after substituting the sim's own name). `Baton/scripts/check-template-drift.sh <Sim>` compares a
sim against this repo using `Baton/config/template-manifest.json`, which lists the exact files,
the required `package.json` scripts, and the few keys a sim may extend (extra `biome.json`
ignores, extra tsconfig `types`, CSP/Permissions additions).

To diverge on purpose, add a bullet to the sim's own `## Compliance carve-outs` section naming
the file in backticks and the reason, e.g. ``- `tests/setup.ts`: adds a WebGPU mock``. The drift
checker treats a file named there as approved. Fix template-owned files **here first**, then
propagate — never hand-edit one in a single sim.

### `package.json` overrides

JSON cannot carry comments, so the rationale for forced transitive pins lives here. Prefer
**tilde (`~`) or exact** versions — caret (`^`) lets minors drift under what is meant to be a
hard pin. Dependabot ignores these three names (see `.github/dependabot.yml`) so it does not
open PRs that fight the overrides. Revisit when SceneryStack drops or re-pins them upstream.

| Override | Pin | Why |
|---|---|---|
| `lodash` | `~4.18.1` | SceneryStack declares `~4.17.12`. Bump clears Dependabot/npm advisories patched in 4.18.x (e.g. GHSA-r5fr-rjxr-66jc, GHSA-f23m-r3pf-42rh). |
| `three` | `~0.125.2` | SceneryStack declares `^0.104.0`. Floor is 0.125.0 for GHSA-fq6p-x6j3-cmmq (ReDoS). Staying on the 0.125 line avoids a larger API jump; **0.125.x still has open CVEs** (e.g. XSS GHSA-7vvq-7r29-5vg3, fixed only in ≥0.137.0). Remove this override if/when SceneryStack stops depending on `three` or pins a patched line itself. |
| `brace-expansion` | `~5.0.12` | Transitive via `vite-plugin-pwa` / Workbox. Clears npm audit (originally GHSA-mh99-v99m-4gvg; keep ≥5.0.9 for GHSA-rgw5-rvv9-x895; ≥5.0.12 for the CPU-DoS advisory). |

## Testing

| Path | Purpose |
|---|---|
| `tests/common/Reactions.test.ts` | K(298 K) against tabulated values (N₂O₄ ≈ 0.15, Haber ≈ 6 × 10⁵, WGS ≈ 10⁵), Kc = Kp/(RT)^Δn, temperature rule, defaults |
| `tests/common/ReactionMixture.test.ts` | Textbook ICE answers (N₂O₄, HI), same equilibrium from either side, settle times, atom balance, rates equal at equilibrium, each Le Chatelier stress's direction |
| `tests/common/ParticleSystem.test.ts` | Particle counts follow the amounts; events in both directions at equilibrium; van 't Hoff fit recovers ΔH° and ΔS° |
| `tests/ice-table/ICETable.test.ts` | Generated problems satisfy K in both modes for every reaction; sign conventions; checking; Run it lands on the E row |
| `tests/le-chatelier/LeChatelierModel.test.ts` | Q vs K verdicts per stress, no-op drags, argon, dilution, catalyst, predict-first gating |
| `tests/vant-hoff/VantHoffModel.test.ts` | ΔH° recovered for every choice; no measurement before equilibrium; scatter with error |
| `tests/memory-leak.test.ts`, `tests/helpers/`, `tests/fuzz/` | Template-owned harness; the leak suite covers the mixture, particles, scene and the shared view nodes |

- Unit tests live only under root `tests/`, mirroring `src/`.
- Optional: `npm run test:fuzz` / `test:fuzz:quick` / `test:fuzz:long` (not part of default CI).

## Commands

```bash
npm run lint && npm run check && npm run build && npm test
```

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run build:single` | Single-file build mode |
| `npm run check` | TypeScript (`tsc --noEmit` on app, scripts, and tests) |
| `npm run lint` / `npm run fix` | Biome check / auto-fix |
| `npm test` | Vitest unit tests |
| `npm run test:fuzz` | Playwright fuzz smoke (pointer + keyboard, `?ea`, 30s each; `npm run test:fuzz -- 90` to change) |
| `npm run test:fuzz:quick` | 10s fuzz |
| `npm run test:fuzz:long` | 300s fuzz |
| `npm run icons` | Regenerate PWA icons; seed missing screenshots, preserve existing ones |
| `npm run release` | `check && lint && build && test`, then version patch + push tags |

`src/init.ts` reads `version` from `package.json`, so the patch bump shows up in the About dialog
without a second edit.

## PWA

After `npm run build`, the sim is installable offline via Workbox (`dist/manifest.webmanifest`).
