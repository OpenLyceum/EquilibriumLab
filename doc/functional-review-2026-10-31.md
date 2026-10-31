# EquilibriumLab functional review — 2026-10-31

Reviewed `main` at `a192236460b3b86d95a49a1584caaf6cc73388b4` in WSL Ubuntu-24.04
(Ubuntu 26.04.1), with Node v26.13.0, satisfying the repository's Node >=26 requirement.

Scope: all four screens, the shared equilibrium/kinetics and recording models, ICE generation
and grading, stress controls and prediction feedback, and Van 't Hoff measurement and fitting.
Applied Baton’s `scenerystack-code-review` skill and functional-review reference. This is a
targeted functional review, not a release sign-off. The initial review left application sources
unchanged. All three findings below are now resolved; see the resolution section for fixes and
validation. Locations and reproductions below refer to the reviewed revision.

## Findings

### 1. [P2] Grade a continuous stress before its chemical response erases the shift

Location: `src/le-chatelier/model/LeChatelierModel.ts:112–124`; temperature and piston
controls call `beginStress` at interaction start and `endStress` at release.

`endStress` uses the live, already-reacted mixture to decide the direction and whether Q
changed. The simulation continues advancing while a slider/piston interaction is active.
Consequently, the same final temperature can receive different feedback depending on how
long the student holds the control.

Browser reproduction, assertions enabled:

1. Start the default nitrogen-dioxide equilibrium in Le Chatelier.
2. Enable prediction mode and predict toward products.
3. Focus Temperature and hold ArrowRight: T changes from 298.15 K to 308 K. Immediately,
   ln(Q/K) = -0.705939, correctly indicating a shift toward products.
4. While the key remains down, allow the mixture to settle; release afterward. The probe
   advanced 300 normal-speed frames of 1/30 s through `scene.advance`, equivalent to 20
   simulated seconds.
5. The result is `direction: "none"`, with the original prediction `"right"`. The displayed
   explanation is “Q = K still: no shift.” The verdict says “You predicted: toward products.
   The mixture shifts: no shift.”

The calculation also attributes the intervening reaction's concentration changes to the
stress (`qChanged: true`). Slow pointer drags follow the same path. Preserve the composition
needed to evaluate the imposed stress independently of its subsequent reaction, or suspend
reaction advancement during the gesture. Add regressions for temperature and piston gestures
that remain active while time advances.

### 2. [P2] Record the actual pre-stress state before changing the mixture

Location: `src/le-chatelier/model/LeChatelierModel.ts:118` and `:134–136`;
`src/common/model/ReactionSceneModel.ts:83–89`.

`ReactionSceneModel.markStress` records before and after its callback to draw an instantaneous
vertical jump. Its caller has already applied the stress and passes an empty callback, so
both forced samples contain the post-stress state. The chart joins its previous sampled
point to the new concentration with a sloping segment, showing a change before the stress
marker instead of the correct discontinuity. This becomes more apparent when a long run
has thinned its samples.

Browser/model reproduction: pause Le Chatelier at equilibrium, advance by 0.02 real seconds
(0.04 simulated seconds, before the next ordinary sample), then add N2O4. The trace was:

```text
before: (0, 0.030558852847192054)
after:  (0, 0.030558852847192054)
        (0.04, 0.04055885284719205)
        (0.04, 0.04055885284719205)
```

The missing point is `(0.04, 0.030558852847192054)`. Pass the mutation through
`markStress` for instantaneous actions, and record/mark continuous gestures at the appropriate
start/update times. Verify both concentration and rate records have the correct values on
each side of an instantaneous stress.

### 3. [P2] Explain the factor of 1000 between the plotted and reported fit slopes

Location: `src/vant-hoff/view/VantHoffScreenView.ts:183–186`;
`src/vant-hoff/view/VantHoffResultsNode.ts:50–54`; `src/i18n/strings_en.json:160–175`
(also French and Spanish).

The horizontal axis is `1000/T`, and the displayed line uses `fit.slope / 1000`. The adjacent
Fit panel simply labels the unscaled `fit.slope` as “slope,” while the chart title says
“ln K against 1/T.” The conversion is never identified. A student calculating rise/run from
the visible graph gets a result 1000 times smaller than the advertised slope; applying the
displayed `ΔH° = -R × slope` directly to that graph slope gives the wrong enthalpy.

Browser reproduction: turn measurement error off and measure the default reaction at
298.15 K and 350 K. The points are `(1000/T, ln K) = (3.354016, -1.946476)` and
`(2.857143, 1.474195)`, giving a plotted slope of approximately -6.88439 K. The panel reports
“slope = -6884 K.” The internal enthalpy calculation itself correctly returns +57.24 kJ/mol.

Align the axis, chart title, slope label, and teaching formula: explicitly distinguish the
slope with respect to 1/T from the scaled graph slope, or report the plotted slope and show
the corresponding factor in the enthalpy calculation. Keep the explanation consistent in
all three locales and add a display-level regression.

## Initial review validation

- `npm run lint`: passed, 95 files checked.
- `npm run check`: passed app, scripts, and test type checks.
- `npm test`: passed 81 tests across 8 files, including the real-object memory-leak suite.
- `npm run build`: passed production and PWA build.
- `bash Baton/scripts/check-repo-compliance.sh EquilibriumLab`: passed from the fleet root.
- `bash Baton/scripts/check-template-drift.sh EquilibriumLab`: passed from the fleet root.
- `FUZZ_PORT=5201 npm run test:fuzz:quick`: pointer and keyboard fuzz passed, 10 seconds each.
- Chromium browser probes with `?ea`: all four screens launched; all available reaction
  choices and Reset All exercised in English, French, and Spanish without page errors.
- Native keyboard Step Forward advanced each paused screen by 1/15 simulated second and
  preserved the paused state.
- Inspected screenshots of all four English screens, the held-temperature verdict, and the
  two-point Van 't Hoff fit. Source and browser state confirmed all three findings above.

The initial review made no application changes or external issues. Browser probes
ran against the development server; built output was compiled but not separately browser-tested.
Manual assistive-technology sign-off, heap snapshots, and a full release/performance audit were
outside this review's scope.

## Resolution — all three findings addressed

1. **Held-control grading:** the scene now holds reaction, particle and chart time between
   `beginStress` and `endStress`, including direct Step Forward calls. Grading therefore uses
   the imposed temperature/volume before its chemical response. Release resumes advancement
   with the student's play/pause selection preserved. No-op gestures release the hold; restart,
   reset and reaction selection cancel it and clear the snapshot so late releases are ignored.
2. **Stress chart endpoints:** beginning the stress records the actual pre-stress concentration
   and rate values; ending it records the post-stress values and marker at the same simulation
   time. Instantaneous buttons use the same lifecycle. The empty mutation callback was removed.
3. **Van 't Hoff scale:** the chart title now says 1000/T in English, French and Spanish.
   The Fit panel shows the graph slope (approximately -6.884 K for the two-point example),
   and the enthalpy formula explicitly includes -1000R. Both plot and readout share
   `INVERSE_TEMPERATURE_SCALE`; the underlying thermodynamic fit and +57.24 kJ/mol result
   remain correct. Model documentation and implementation guidance explain the conversion.

Added seven model regressions covering held temperature and volume gestures, pre/post
concentration and rate endpoints, no-op release, reset and restart. Five of those regressions
failed against the original code before the fix. Added six browser regressions exercising
the actual temperature and piston keyboard targets, an actual Add button press, and fit
readouts compared with independent rise/run calculations in all three locales.

Final validation with Node v26.13.0:

- `npm run lint` and `npm run check`: passed, no lint findings.
- `npm test`: **88 passed** across 8 files, including all 25 memory-leak checks.
- `npm run build`: passed production and PWA build.
- `FUZZ_PORT=5200 npx playwright test tests/browser`: **6 passed**.
- `FUZZ_PORT=5201 npm run test:fuzz:quick`: **2 passed**, pointer and keyboard.
- Fleet compliance and template drift checks for `EquilibriumLab`: both passed.
- Inspected updated French and Spanish fit screenshots and the correct held-temperature
  prediction verdict; the new labels and formula fit their panels.
- `git diff --check`: passed. No template-owned files were changed.
