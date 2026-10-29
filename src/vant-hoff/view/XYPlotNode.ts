/**
 * XYPlotNode.ts
 *
 * A scatter plot with an optional straight line through it and an optional horizontal zero line,
 * for the van 't Hoff plot (ln K against 1000/T) and the ΔG° against T plot. The axis ranges are set
 * by the caller for each reaction, so they stay put while points are added.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { ChartRectangle, ChartTransform, GridLineSet, LinePlot, TickLabelSet, TickMarkSet } from "scenerystack/bamboo";
import { Range, Vector2 } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Orientation } from "scenerystack/phet-core";
import { Circle, Line, Node, RichText, type TColor, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { disposeChildren } from "../../common/view/disposeChildren.js";
import { fixed } from "../../common/view/formatValues.js";
import { decimalsFor, niceStep } from "../../common/view/TimeChartNode.js";
import EquilibriumLabColors from "../../EquilibriumLabColors.js";
import { FONT_SIZE } from "../../EquilibriumLabConstants.js";

/** A spacing wider than any range, used while the ranges change. */
const COARSE_SPACING = 1e15;

export type PlotLabels = {
  readonly title: TReadOnlyProperty<string>;
  readonly xAxis: TReadOnlyProperty<string>;
  readonly yAxis: TReadOnlyProperty<string>;
};

/** A straight line y = slope·x + intercept. */
export type PlotLine = { readonly slope: number; readonly intercept: number };

export class XYPlotNode extends Node {
  private readonly chartTransform: ChartTransform;
  private readonly sets: {
    x: (GridLineSet | TickMarkSet | TickLabelSet)[];
    y: (GridLineSet | TickMarkSet | TickLabelSet)[];
  };
  private readonly labelsX: TickLabelSet;
  private readonly labelsY: TickLabelSet;
  private readonly pointLayer = new Node();
  private readonly fitLine: LinePlot;
  private readonly zeroLine: Line;
  private readonly plotWidth: number;
  private xStep = 1;
  private yStep = 1;
  private readonly pointColor: TColor;

  public constructor(labels: PlotLabels, width: number, height: number, showZeroLine: boolean, pointColor: TColor) {
    super();
    this.plotWidth = width;
    this.pointColor = pointColor;
    this.chartTransform = new ChartTransform({
      viewWidth: width,
      viewHeight: height,
      modelXRange: new Range(0, 1),
      modelYRange: new Range(0, 1),
    });
    const transform = this.chartTransform;
    const grid = { stroke: EquilibriumLabColors.chartGridColorProperty };
    const ticks = { edge: "min" as const, stroke: EquilibriumLabColors.chartAxisColorProperty };
    const tickLabel = (value: number, step: number) =>
      new Text(fixed(value, decimalsFor(step)), {
        font: new PhetFont(FONT_SIZE.tiny),
        fill: EquilibriumLabColors.textColorProperty,
      });
    const gridX = new GridLineSet(transform, Orientation.HORIZONTAL, 1, grid);
    const gridY = new GridLineSet(transform, Orientation.VERTICAL, 1, grid);
    const ticksX = new TickMarkSet(transform, Orientation.HORIZONTAL, 1, ticks);
    const ticksY = new TickMarkSet(transform, Orientation.VERTICAL, 1, ticks);
    this.labelsX = new TickLabelSet(transform, Orientation.HORIZONTAL, 1, {
      edge: "min",
      createLabel: (value) => tickLabel(value, this.xStep),
    });
    this.labelsY = new TickLabelSet(transform, Orientation.VERTICAL, 1, {
      edge: "min",
      createLabel: (value) => tickLabel(value, this.yStep),
    });
    this.sets = { x: [gridX, ticksX, this.labelsX], y: [gridY, ticksY, this.labelsY] };

    this.fitLine = new LinePlot(transform, [], { stroke: EquilibriumLabColors.fitLineColorProperty, lineWidth: 2 });
    this.zeroLine = new Line(0, 0, width, 0, {
      stroke: EquilibriumLabColors.markerColorProperty,
      lineDash: [4, 3],
      visible: showZeroLine,
    });
    const plot = new Node({
      children: [this.zeroLine, this.fitLine, this.pointLayer],
      clipArea: Shape.rect(-6, -6, width + 12, height + 12),
    });

    const titleFont = new PhetFont(FONT_SIZE.small);
    const xTitle = new RichText(labels.xAxis, {
      font: titleFont,
      fill: EquilibriumLabColors.mutedTextColorProperty,
      maxWidth: width,
    });
    xTitle.boundsProperty.link(() => {
      xTitle.centerX = width / 2;
      xTitle.top = height + 18;
    });
    const yTitle = new RichText(labels.yAxis, {
      font: titleFont,
      fill: EquilibriumLabColors.mutedTextColorProperty,
      rotation: -Math.PI / 2,
      maxWidth: height,
    });
    yTitle.boundsProperty.link(() => {
      yTitle.right = -38;
      yTitle.centerY = height / 2;
    });
    const title = new RichText(labels.title, {
      font: new PhetFont({ size: FONT_SIZE.label, weight: "bold" }),
      fill: EquilibriumLabColors.textColorProperty,
      maxWidth: width,
    });
    title.boundsProperty.link(() => {
      title.left = 0;
      title.bottom = -8;
    });

    this.children = [
      new ChartRectangle(transform, {
        fill: EquilibriumLabColors.chartBackgroundColorProperty,
        stroke: EquilibriumLabColors.chartAxisColorProperty,
      }),
      gridX,
      gridY,
      plot,
      ticksX,
      ticksY,
      this.labelsX,
      this.labelsY,
      xTitle,
      yTitle,
      title,
    ];
  }

  /** Sets the axis ranges (padded to nice tick values). */
  public setRanges(x: Range, y: Range): void {
    // Narrow everything first so no set ever pairs a wide range with a fine spacing.
    const xStep = niceStep(x.getLength(), 5);
    const yStep = niceStep(y.getLength(), 4);
    const xRange = new Range(Math.floor(x.min / xStep) * xStep, Math.ceil(x.max / xStep) * xStep);
    const yRange = new Range(Math.floor(y.min / yStep) * yStep, Math.ceil(y.max / yStep) * yStep);
    for (const set of [...this.sets.x, ...this.sets.y]) {
      set.setSpacing(COARSE_SPACING);
    }
    this.chartTransform.setModelXRange(xRange);
    this.chartTransform.setModelYRange(yRange);
    this.xStep = xStep;
    this.yStep = yStep;
    for (const set of this.sets.x) {
      set.setSpacing(xStep);
    }
    for (const set of this.sets.y) {
      set.setSpacing(yStep);
    }
    this.labelsX.setCreateLabel(
      (value) =>
        new Text(fixed(value, decimalsFor(xStep)), {
          font: new PhetFont(FONT_SIZE.tiny),
          fill: EquilibriumLabColors.textColorProperty,
        }),
    );
    this.labelsY.setCreateLabel(
      (value) =>
        new Text(fixed(value, decimalsFor(yStep)), {
          font: new PhetFont(FONT_SIZE.tiny),
          fill: EquilibriumLabColors.textColorProperty,
        }),
    );
    const zeroY = this.chartTransform.modelToViewY(0);
    this.zeroLine.setLine(0, zeroY, this.plotWidth, zeroY);
  }

  /** Shows `points` and, if given, `line` across the whole x range. */
  public setData(points: readonly Vector2[], line: PlotLine | null): void {
    disposeChildren(this.pointLayer);
    this.pointLayer.children = points.map(
      (p) =>
        new Circle(4, {
          fill: this.pointColor,
          stroke: EquilibriumLabColors.backgroundColorProperty,
          center: this.chartTransform.modelToViewPosition(p),
        }),
    );
    const x = this.chartTransform.modelXRange;
    this.fitLine.setDataSet(
      line
        ? [
            new Vector2(x.min, line.slope * x.min + line.intercept),
            new Vector2(x.max, line.slope * x.max + line.intercept),
          ]
        : [],
    );
  }
}
