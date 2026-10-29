# Equilibrium Lab

[![CI](../../actions/workflows/ci.yml/badge.svg)](../../actions/workflows/ci.yml)

Chemical equilibrium for introductory (General) chemistry. Watch a mixture react until the
reaction quotient Q reaches K and the forward and reverse rates are equal; work ICE tables
against a live simulation; push a mixture at equilibrium and see whether the stress moved Q or K;
and find ΔH° and ΔS° from a van 't Hoff plot. Built with [SceneryStack](https://scenerystack.org/);
runs offline as a Progressive Web App.

## Features

- **Approach.** Choose a reaction and its starting concentrations, then play. Molecules react in a
  particle box driven by an exact rate-law model; charts show each concentration and the forward
  and reverse rates converging; a logarithmic gauge slides Q toward K and says which way the
  mixture must shift. Event counters keep counting at equilibrium: it is dynamic. Q and K can be
  written with concentrations (Kc) or partial pressures (Kp). Generic reactions (A ⇌ B,
  A + B ⇌ C, 2A ⇌ B) let you set K and the rate constant.
- **ICE Table.** Generated problems: find the equilibrium concentrations from K, or find K from one
  equilibrium concentration. Set the change row with pickers, enter x (and K) on a keypad, and
  check; feedback covers the change row, x, K and the 5 % small-x test. Run it plays the real
  mixture from the I row against dashed lines at your E row.
- **Le Chatelier.** Start at equilibrium, then add or remove a species, compress the gas with the
  piston or dilute the solution, add argon at fixed volume or fixed pressure, heat or cool, or add
  a catalyst. Each stress is marked on the concentration chart, and a panel explains whether it
  changed Q or K. An optional mode asks for a prediction before each stress and scores it.
- **Van 't Hoff.** Set a temperature, wait for equilibrium, and measure K; repeat and fit ln K
  against 1/T to get ΔH° from the slope and ΔS° from the intercept, with ΔG° against T and the
  temperature where it changes sign. Two unknown reactions hide their answers until revealed.
- Reactions: N₂O₄ ⇌ 2NO₂, H₂ + I₂ ⇌ 2HI, the Haber process, the water-gas shift, iron(III)
  thiocyanate and cobalt(II) chloride (with their colours), and three generic reactions. Gas data
  from OpenStax *Chemistry 2e* Appendix G; sources and assumptions in [`doc/model.md`](doc/model.md).
- **Accessible:** every control is keyboard-operable, including the piston; reaching equilibrium,
  each stress, each check and each measurement are announced; live screen summaries;
  keyboard-help dialogs.
- English, French and Spanish; default and projector colour profiles; installable PWA.
  Preferences start gases in the Kp form and turn the reaction flashes on or off.

## Quick Start

```bash
npm install
npm run icons    # generate PNG icons from public/icons/icon.svg
npm start        # dev server → http://localhost:5173
```

## Scripts

| Command | Description |
|---|---|
| `npm start` / `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build → `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run Vitest unit tests (includes memory-leak suite) |
| `npm run test:fuzz` | Optional Playwright fuzz smoke: pointer (`?fuzz`) + keyboard (`?fuzzBoard`), with `?ea`, 30s each |
| `npm run test:fuzz -- 90` | Same fuzz for 90 seconds (`--duration 90` or `FUZZ_DURATION=90` also work) |
| `npm run test:fuzz:quick` | Shorter fuzz smoke (10s) |
| `npm run test:fuzz:long` | Longer fuzz smoke (300s) |
| `npm run check` | TypeScript type check |
| `npm run lint` | Biome lint check |
| `npm run format` | Auto-format all files |
| `npm run fix` | Lint + auto-fix |
| `npm run icons` | Regenerate PNG icons from `public/icons/icon.svg` |
| `npm run release` | `check && lint && build && test`, then version patch + push tags |
| `npm run clean` | Remove `dist/` |

New sims start at `version: "0.0.0"` in `package.json`. Bump only when cutting a release (for example `npm version patch` and a matching git tag). Keep `name` in kebab-case; it is separate from the SceneryStack sim identifier in `src/init.ts`, which reads its `version` from `package.json`.

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| [SceneryStack](https://scenerystack.org/) | ^3.0.0 | Simulation framework |
| [Vite](https://vitejs.dev/) | ^8 | Build tool + dev server |
| [TypeScript](https://www.typescriptlang.org/) | ^7 | Type-safe JavaScript |
| [Biome](https://biomejs.dev/) | ^2.5 | Linting + formatting |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | ^2 | PWA + service worker |

## License

GNU Affero General Public License v3.0 — see [OpenLyceum org license](https://github.com/OpenLyceum/.github/blob/main/LICENSE).

## Contributing

See [OpenLyceum contributing guidelines](https://github.com/OpenLyceum/.github/blob/main/CONTRIBUTING.md).
Report bugs via GitHub Issues; use org issue templates.
