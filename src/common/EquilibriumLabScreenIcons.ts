/**
 * EquilibriumLabScreenIcons.ts
 *
 * Programmatic home-screen / navigation-bar icons for each screen.
 * Drawn on the standard PhET 548 × 373 canvas using EquilibriumLabColors.
 * Replace the stub backgrounds with screen-specific motifs.
 */
import { Node, Rectangle } from "scenerystack/scenery";
import { ScreenIcon } from "scenerystack/sim";
import EquilibriumLabColors from "../EquilibriumLabColors.js";

const W = 548;
const H = 373;

function background(): Rectangle {
  return new Rectangle(0, 0, W, H, { fill: EquilibriumLabColors.backgroundColorProperty });
}

function iconFrom(content: Node): ScreenIcon {
  return new ScreenIcon(content, {
    maxIconWidthProportion: 1,
    maxIconHeightProportion: 1,
    fill: EquilibriumLabColors.backgroundColorProperty,
  });
}

export function createApproachIcon(): ScreenIcon {
  return iconFrom(
    new Node({
      children: [background()],
    }),
  );
}

export function createICETableIcon(): ScreenIcon {
  return iconFrom(
    new Node({
      children: [background()],
    }),
  );
}

export function createLeChatelierIcon(): ScreenIcon {
  return iconFrom(
    new Node({
      children: [background()],
    }),
  );
}

export function createVantHoffIcon(): ScreenIcon {
  return iconFrom(
    new Node({
      children: [background()],
    }),
  );
}
