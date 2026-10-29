/**
 * EquilibriumLabScreenIcons.ts
 *
 * Programmatic home-screen / navigation-bar icons for each screen.
 * Drawn on the standard PhET 548 × 373 canvas using EquilibriumLabColors.
 * Each icon is a simplified drawing of its screen: a vessel of NO₂ and N₂O₄ with two
 * concentrations levelling off, an ICE table, a concentration that jumps and relaxes after a
 * stress, and a van 't Hoff line through measured points.
 */

import { Shape } from "scenerystack/kite";
import { Circle, Line, Node, Path, Rectangle, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
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

/** A chart frame with its plotting area at (x, y, width, height). */
function frame(x: number, y: number, width: number, height: number): Rectangle {
  return new Rectangle(x, y, width, height, {
    fill: EquilibriumLabColors.chartBackgroundColorProperty,
    stroke: EquilibriumLabColors.chartAxisColorProperty,
    lineWidth: 4,
  });
}

/**
 * A curve approaching `end` from `start` exponentially across [x0, x1], continuing `shape` if given
 * (which must already end at (x0, start)).
 */
function relaxation(
  x0: number,
  x1: number,
  start: number,
  end: number,
  rate = 5,
  shape = new Shape().moveTo(x0, start),
): Shape {
  for (let i = 1; i <= 40; i++) {
    const f = i / 40;
    shape.lineTo(x0 + f * (x1 - x0), end + (start - end) * Math.exp(-rate * f));
  }
  return shape;
}

export function createApproachIcon(): ScreenIcon {
  const vessel = new Rectangle(40, 70, 190, 240, {
    fill: EquilibriumLabColors.vesselInteriorColorProperty,
    stroke: EquilibriumLabColors.glassColorProperty,
    lineWidth: 8,
  });
  const tint = new Rectangle(44, 74, 182, 232, { fill: EquilibriumLabColors.speciesNO2ColorProperty, opacity: 0.35 });
  const positions: [number, number][] = [
    [80, 110],
    [150, 130],
    [200, 100],
    [100, 190],
    [175, 210],
    [70, 270],
    [130, 260],
    [200, 280],
  ];
  const particles = positions.map(
    ([x, y], i) =>
      new Circle(i % 3 === 0 ? 16 : 12, {
        x,
        y,
        fill:
          i % 3 === 0 ? EquilibriumLabColors.speciesN2O4ColorProperty : EquilibriumLabColors.speciesNO2ColorProperty,
      }),
  );
  const chart = frame(280, 70, 230, 240);
  const falling = new Path(relaxation(290, 500, 110, 170), {
    stroke: EquilibriumLabColors.speciesN2O4ColorProperty,
    lineWidth: 8,
  });
  const rising = new Path(relaxation(290, 500, 300, 230), {
    stroke: EquilibriumLabColors.speciesNO2ColorProperty,
    lineWidth: 8,
  });
  return iconFrom(new Node({ children: [background(), vessel, tint, ...particles, chart, falling, rising] }));
}

export function createICETableIcon(): ScreenIcon {
  const left = 70;
  const top = 50;
  const cell = 136;
  const row = 90;
  const children: Node[] = [background()];
  for (let r = 0; r <= 3; r++) {
    children.push(
      new Line(left, top + r * row, left + 3 * cell, top + r * row, {
        stroke: EquilibriumLabColors.chartAxisColorProperty,
        lineWidth: 4,
      }),
    );
  }
  const font = new PhetFont({ size: 64, weight: "bold" });
  ["I", "C", "E"].forEach((letter, r) => {
    children.push(
      new Text(letter, {
        font,
        fill: EquilibriumLabColors.kMarkerColorProperty,
        centerX: left + cell / 2,
        centerY: top + (r + 0.5) * row,
      }),
    );
  });
  const valueFont = new PhetFont(46);
  const cells = [
    ["1.0", "0"],
    ["−x", "+2x"],
    ["1.0−x", "2x"],
  ];
  cells.forEach((values, r) => {
    values.forEach((value, c) => {
      children.push(
        new Text(value, {
          font: valueFont,
          fill: EquilibriumLabColors.textColorProperty,
          centerX: left + (c + 1.5) * cell,
          centerY: top + (r + 0.5) * row,
          maxWidth: cell - 12,
        }),
      );
    });
  });
  return iconFrom(new Node({ children }));
}

export function createLeChatelierIcon(): ScreenIcon {
  const chart = frame(60, 50, 430, 270);
  const stressX = 210;
  const marker = new Line(stressX, 54, stressX, 316, {
    stroke: EquilibriumLabColors.markerColorProperty,
    lineDash: [12, 10],
    lineWidth: 4,
  });
  const before = new Shape().moveTo(64, 230).lineTo(stressX, 230).lineTo(stressX, 110);
  const after = relaxation(stressX, 486, 110, 180, 4);
  const added = new Path(before, { stroke: EquilibriumLabColors.speciesN2ColorProperty, lineWidth: 8 });
  const relaxing = new Path(after, { stroke: EquilibriumLabColors.speciesN2ColorProperty, lineWidth: 8 });
  const product = new Path(relaxation(stressX, 486, 280, 245, 4, new Shape().moveTo(64, 280).lineTo(stressX, 280)), {
    stroke: EquilibriumLabColors.speciesNH3ColorProperty,
    lineWidth: 8,
  });
  return iconFrom(new Node({ children: [background(), chart, marker, added, relaxing, product] }));
}

export function createVantHoffIcon(): ScreenIcon {
  const chart = frame(60, 40, 430, 290);
  const line = new Line(80, 300, 470, 70, { stroke: EquilibriumLabColors.fitLineColorProperty, lineWidth: 8 });
  const points = [
    [130, 266],
    [210, 225],
    [290, 170],
    [370, 133],
    [440, 84],
  ].map(([x, y]) => new Circle(15, { x: x ?? 0, y: y ?? 0, fill: EquilibriumLabColors.dataPointColorProperty }));
  return iconFrom(new Node({ children: [background(), chart, line, ...points] }));
}
