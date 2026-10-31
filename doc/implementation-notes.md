# Equilibrium Lab: implementation notes

How the code is organised and why. The chemistry is in [`model.md`](model.md).

## Layout of the code

```
src/
  common/model/      Reaction, Reactions, ReactionMixture, equilibriumSolver, ParticleSystem,
                     ReactionSceneModel, TimeRecord, vantHoffFit, EquilibriumForm, shiftDirection,
                     timeScale
  common/view/       ParticleBoxNode, TimeChartNode, QKGaugeNode, ReactionEquationNode,
                     MixtureReadoutsNode, QuotientSummaryContent, speciesStyles, reactionMarkup,
                     reactionChoices, quotientDescription, ControlFactory, RichTextLines,
                     formatValues, createTimeControl, disposeChildren
  approach/          ApproachModel; StartingConcentrationsNode, screen view, keyboard help
  ice-table/         ICEProblem, ICETableModel; ICETableNode, NumberEntryNode, ICEFeedbackNode, …
  le-chatelier/      LeChatelierModel; StressControlsNode, StressExplanationNode, screen view, …
  vant-hoff/         VantHoffModel; XYPlotNode, VantHoffResultsNode, screen view, …
```

Each screen's model composes a `ReactionSceneModel` (mixture, particles, records, clock, Kc/Kp
form) rather than extending a base class. The screens know nothing about each other.

## Decisions

- **One coordinate, the extent.** Integrating ξ rather than each amount makes atom balance exact by
  construction and gives the solver, the ICE problems and the particle box one shared quantity.
- **kr = kf/Kc.** Defining the reverse rate constant from K means the kinetics can be tuned freely
  (for pace on screen) without ever moving the equilibrium, which the tests check against the
  solver.
- **RK4 with a relaxation-time step, and a fallback.** The step is at most half the local
  relaxation time, estimated from a finite difference of the flux. Rather than an implicit method,
  a frame that would need more than 400 substeps finishes at the equilibrium extent: that only
  happens when the mixture relaxes far faster than a frame, where the result is the same.
- **Particles replay the model.** A stochastic particle simulation would wander away from the
  deterministic curves the charts draw. Replaying the mixture's gross flows keeps the picture, the
  charts and the gauge consistent, and still shows molecules reacting both ways at equilibrium.
  Events are capped per frame; a dropped backlog is made up by the net correction.
- **Immutable reactions.** `Reaction` is immutable; the generic reactions' K and kf, the ICE
  problems' rounded K, and the Van 't Hoff unknowns are new instances from `withParameters`.
  `ReactionMixture.replaceReaction` swaps parameters without restarting.
- **Bulk species.** A species flagged `bulk` (Cl⁻) is skipped by particle events and hidden on the
  concentration chart (`ChartTrace.visible`), and shown as a readout instead, so it neither swamps
  the box with particles nor flattens the other traces.
- **Stress verdicts in the model.** `LeChatelierModel` snapshots ln Qc, ln Kc, V and T at the start
  of a stress and compares at the end; drags and slider presses call `beginStress`/`endStress`
  through `onVolumeDragStart`/`onVolumeDragEnd` and `startCallback`/`endCallback`.
  `ReactionSceneModel` holds advancement during the gesture, including explicit Step Forward,
  so the verdict describes the stress before any chemical response. It records the old and new
  states at the same simulation instant, retaining the student's play/pause selection. Restart,
  reset and reaction changes clear the hold and ignore late releases. The catalyst
  checkbox drives a view-side copy so that Reset All and new reactions, which clear the catalyst
  directly, are not marked as stresses.
- **Scaled Van 't Hoff axis.** The fit uses 1/T internally. The plot and its displayed slope
  use `INVERSE_TEMPERATURE_SCALE / T` (1000/T), with the factor of 1000 shown in the enthalpy
  formula. ΔH° and ΔS° still come from the original unscaled fit.
- **Chart axis order.** bamboo redraws grid lines, ticks and labels on every spacing or range
  change. Applying a wide range while the old fine spacing is still set draws millions of lines and
  crashed the page; `TimeChartNode.applyAxis` widens the spacing before the range, or narrows the
  range before the spacing. `XYPlotNode.setRanges` coarsens the spacing first.
- **Keypad entry.** The ICE x and K fields open scenery-phet's `KeypadDialog` (accessible, keyboard
  and pointer); range checks there are deliberately loose so a wrong answer is judged by the
  feedback, not refused.
- **Strings.** Formulas are language-neutral and built from the species data
  (`reactionMarkup.ts`); everything else is in `strings_{en,fr,es}.json`. Plain-text and spoken
  formulas use Unicode sub- and superscripts (`plainFormula`, `toPlainSuperscript`).

## Testing

The model tests pin the thermodynamic data to tabulated constants, check the solver on textbook
ICE problems, and check every Le Chatelier stress's direction. View code is covered by the
memory-leak suite and by browser checks (screenshots, keypad and piston keyboard paths) during
development; `npm run test:fuzz` exercises every screen with random input.
