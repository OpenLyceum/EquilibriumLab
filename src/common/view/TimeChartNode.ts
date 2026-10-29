/**
 * TimeChartNode.ts
 *
 * Values against time for a TimeRecord: one line per trace with a dot at its latest point, a
 * legend, dashed vertical markers where a stress was applied, and optional dashed horizontal
 * reference lines (the equilibrium concentrations). The y axis always starts at zero.
 *
 * The axes fit the content (adapted from CalorimetryLab's TemperatureChartNode): time always spans
 * at least `minTime`, and a range is kept until the content leaves it or fills less than a third
 * of it, so the axes don't twitch while the data grows.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { ChartRectangle, ChartTransform, GridLineSet, LinePlot, TickLabelSet, TickMarkSet } from "scenerystack/bamboo";
import { Range, toFixed } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { Orientation } from "scenerystack/phet-core";
import { Circle, HBox, Line, Node, type NodeOptions, RichText, type TColor, Text } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import EquilibriumLabColors from "../../EquilibriumLabColors.js";
import { FONT_SIZE } from "../../EquilibriumLabConstants.js";
import type { TimeRecord } from "../model/TimeRecord.js";
import { disposeChildren } from "./disposeChildren.js";
import { fixed } from "./formatValues.js";

/** A "nice" tick spacing (1, 2, 2.5 or 5 × 10ⁿ) giving about `count` intervals over `span`. */
export function niceStep(span: number, count: number): number {
  const raw = span / count;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const nice = [1, 2, 2.5, 5, 10].find((m) => m * magnitude >= raw) ?? 10;
  return nice * magnitude;
}

/** Decimals needed to write multiples of `step` exactly. */
export function decimalsFor(step: number): number {
  return [0, 1, 2, 3, 4, 5, 6, 7].find((d) => Math.abs(Number(toFixed(step, d)) - step) < step * 1e-6) ?? 7;
}

/** Smallest y range shown, so an all-zero record still has sensible axes. */
const MIN_Y_SPAN = 1e-6;

function tickLabel(value: number, step: number): Text {
  return new Text(fixed(value, decimalsFor(step)), {
    font: new PhetFont(FONT_SIZE.tiny),
    fill: EquilibriumLabColors.textColorProperty,
  });
}

export type ChartTrace = {
  readonly color: TColor;
  /** Legend text; RichText markup allowed. */
  readonly label: TReadOnlyProperty<string> | string;
  /** False to leave a recorded trace off the chart (a species in large excess would flatten the rest). */
  readonly visible?: boolean;
};

export type TimeChartLabels = {
  readonly title: TReadOnlyProperty<string>;
  readonly xAxis: TReadOnlyProperty<string>;
  readonly yAxis: TReadOnlyProperty<string>;
};

export class TimeChartNode extends Node {
  private readonly record: TimeRecord;
  private readonly chartTransform: ChartTransform;
  private readonly gridX: GridLineSet;
  private readonly gridY: GridLineSet;
  private readonly ticksX: TickMarkSet;
  private readonly ticksY: TickMarkSet;
  private readonly labelsX: TickLabelSet;
  private readonly labelsY: TickLabelSet;
  private readonly plotLayer = new Node();
  private readonly referenceLayer = new Node();
  private readonly markerLayer = new Node();
  private readonly legend: HBox;
  private readonly minTime: number;
  private readonly chartWidth: number;
  private readonly chartHeight: number;
  private plots: LinePlot[] = [];
  private dots: Circle[] = [];
  private traces: readonly ChartTrace[] = [];
  private referenceValues: readonly (number | null)[] = [];
  private xStep = 10;
  private yStep = 0.01;

  /** What the reference lines and markers were last drawn for, so they are rebuilt only on change. */
  private decorationKey = "";
  private readonly update: () => void;

  public constructor(
    record: TimeRecord,
    traces: readonly ChartTrace[],
    labels: TimeChartLabels,
    width: number,
    height: number,
    minTime = 30,
    providedOptions?: NodeOptions,
  ) {
    super();
    this.record = record;
    this.minTime = minTime;
    this.chartWidth = width;
    this.chartHeight = height;

    this.chartTransform = new ChartTransform({
      viewWidth: width,
      viewHeight: height,
      modelXRange: new Range(0, minTime),
      modelYRange: new Range(0, 1),
    });
    const transform = this.chartTransform;
    const grid = { stroke: EquilibriumLabColors.chartGridColorProperty };
    const ticks = { edge: "min" as const, stroke: EquilibriumLabColors.chartAxisColorProperty };
    this.gridX = new GridLineSet(transform, Orientation.HORIZONTAL, this.xStep, grid);
    this.gridY = new GridLineSet(transform, Orientation.VERTICAL, this.yStep, grid);
    this.ticksX = new TickMarkSet(transform, Orientation.HORIZONTAL, this.xStep, ticks);
    this.ticksY = new TickMarkSet(transform, Orientation.VERTICAL, this.yStep, ticks);
    this.labelsX = new TickLabelSet(transform, Orientation.HORIZONTAL, this.xStep, {
      edge: "min",
      createLabel: (value) => tickLabel(value, this.xStep),
    });
    this.labelsY = new TickLabelSet(transform, Orientation.VERTICAL, this.yStep, {
      edge: "min",
      createLabel: (value) => tickLabel(value, this.yStep),
    });

    const plot = new Node({
      children: [this.referenceLayer, this.markerLayer, this.plotLayer],
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
      yTitle.right = -42;
      yTitle.centerY = height / 2;
    });
    const title = new RichText(labels.title, {
      font: new PhetFont({ size: FONT_SIZE.label, weight: "bold" }),
      fill: EquilibriumLabColors.textColorProperty,
      maxWidth: width * 0.4,
    });
    title.boundsProperty.link(() => {
      title.left = 0;
      title.bottom = -8;
    });
    this.legend = new HBox({ spacing: 10, maxWidth: width * 0.58 });
    this.legend.boundsProperty.link(() => {
      this.legend.right = width;
      this.legend.bottom = -10;
    });

    this.children = [
      new ChartRectangle(transform, {
        fill: EquilibriumLabColors.chartBackgroundColorProperty,
        stroke: EquilibriumLabColors.chartAxisColorProperty,
      }),
      this.gridX,
      this.gridY,
      plot,
      this.ticksX,
      this.ticksY,
      this.labelsX,
      this.labelsY,
      xTitle,
      yTitle,
      title,
      this.legend,
    ];

    this.update = () => this.redraw();
    record.changedEmitter.addListener(this.update);
    this.setTraces(traces);
    this.mutate(providedOptions);
  }

  /** Replaces the traces (a new reaction has other species). */
  public setTraces(traces: readonly ChartTrace[]): void {
    this.traces = traces;
    disposeChildren(this.plotLayer);
    disposeChildren(this.legend);
    this.plots = traces.map((trace) => new LinePlot(this.chartTransform, [], { stroke: trace.color, lineWidth: 2 }));
    this.dots = traces.map((trace) => new Circle(3.5, { fill: trace.color, visible: false }));
    this.plots.forEach((plotNode, i) => {
      plotNode.visible = traces[i]?.visible !== false;
    });
    this.plotLayer.children = [...this.plots, ...this.dots];
    const font = new PhetFont(FONT_SIZE.tiny);
    this.legend.children = traces
      .filter((trace) => trace.visible !== false)
      .map(
        (trace) =>
          new HBox({
            spacing: 4,
            children: [
              new Line(0, 0, 14, 0, { stroke: trace.color, lineWidth: 2 }),
              new RichText(trace.label, { font, fill: EquilibriumLabColors.textColorProperty, maxWidth: 90 }),
            ],
          }),
      );
    this.referenceValues = [];
    this.decorationKey = "";
    this.redraw();
  }

  /** Dashed horizontal lines, one per trace (null for none), e.g. equilibrium concentrations. */
  public setReferenceValues(values: readonly (number | null)[]): void {
    this.referenceValues = values;
    this.redraw();
  }

  public override dispose(): void {
    this.record.changedEmitter.removeListener(this.update);
    super.dispose();
  }

  private redraw(): void {
    const transform = this.chartTransform;
    let lastTime = 0;
    let high = 0;
    for (const [i, trace] of this.record.traces.entries()) {
      for (const point of trace) {
        if (this.traces[i]?.visible !== false && Number.isFinite(point.y)) {
          high = Math.max(high, point.y);
        }
      }
      lastTime = Math.max(lastTime, trace[trace.length - 1]?.x ?? 0);
    }
    for (const value of this.referenceValues) {
      if (value !== null && Number.isFinite(value)) {
        high = Math.max(high, value);
      }
    }
    this.fitRanges(lastTime, high);

    this.record.traces.forEach((trace, i) => {
      this.plots[i]?.setDataSet(trace);
      const dot = this.dots[i];
      const last = trace[trace.length - 1];
      if (dot) {
        dot.visible = !!last && Number.isFinite(last.y) && this.traces[i]?.visible !== false;
        if (last && Number.isFinite(last.y)) {
          dot.translation = transform.modelToViewPosition(last);
        }
      }
    });

    const x = transform.modelXRange;
    const y = transform.modelYRange;
    const key = `${x.max}|${y.max}|${this.record.markers.length}|${this.referenceValues.join(",")}`;
    if (key === this.decorationKey) {
      return;
    }
    this.decorationKey = key;

    disposeChildren(this.referenceLayer);
    this.referenceLayer.children = this.referenceValues.flatMap((value, i) => {
      const trace = this.traces[i];
      if (value === null || !trace || !Number.isFinite(value)) {
        return [];
      }
      const lineY = transform.modelToViewY(value);
      return [
        new Line(0, lineY, this.chartWidth, lineY, {
          stroke: trace.color,
          lineDash: [5, 4],
          lineWidth: 1.2,
          opacity: 0.8,
        }),
      ];
    });

    disposeChildren(this.markerLayer);
    const font = new PhetFont(FONT_SIZE.tiny);
    this.markerLayer.children = this.record.markers.flatMap((marker) => {
      const markerX = transform.modelToViewX(marker.time);
      return [
        new Line(markerX, 0, markerX, this.chartHeight, {
          stroke: EquilibriumLabColors.markerColorProperty,
          lineDash: [3, 3],
          lineWidth: 1,
          opacity: 0.7,
        }),
        new RichText(marker.label, {
          font,
          fill: EquilibriumLabColors.markerColorProperty,
          left: markerX + 3,
          top: 3,
          maxWidth: 70,
        }),
      ];
    });
  }

  /**
   * Gives one axis a new tick spacing and range. The grid, ticks and labels redraw on each change,
   * so the order matters: a wide range with the old fine spacing would momentarily draw millions
   * of lines. Widen the spacing before the range, or narrow the range before the spacing.
   */
  private applyAxis(orientation: Orientation, step: number, range: Range): void {
    const horizontal = orientation === Orientation.HORIZONTAL;
    const sets = horizontal ? [this.gridX, this.ticksX, this.labelsX] : [this.gridY, this.ticksY, this.labelsY];
    const oldStep = horizontal ? this.xStep : this.yStep;
    const setSpacing = () => {
      for (const set of sets) {
        set.setSpacing(step);
      }
    };
    const setRange = () =>
      horizontal ? this.chartTransform.setModelXRange(range) : this.chartTransform.setModelYRange(range);
    if (step >= oldStep) {
      setSpacing();
      setRange();
    } else {
      setRange();
      setSpacing();
    }
    if (horizontal) {
      this.xStep = step;
    } else {
      this.yStep = step;
    }
    // Labels depend on the step's decimals; a new createLabel also clears the label cache.
    (horizontal ? this.labelsX : this.labelsY).setCreateLabel((value) => tickLabel(value, step));
  }

  /** Widens or narrows the axes to fit the run so far. */
  private fitRanges(lastTime: number, high: number): void {
    const xMax = Math.max(this.minTime, lastTime * 1.05);
    const x = this.chartTransform.modelXRange;
    if (!(x.max >= xMax && x.max <= 3 * xMax)) {
      const step = niceStep(xMax, 6);
      this.applyAxis(Orientation.HORIZONTAL, step, new Range(0, Math.ceil(xMax / step) * step));
    }

    const yMax = Math.max(high * 1.1, MIN_Y_SPAN);
    const y = this.chartTransform.modelYRange;
    if (!(y.max >= yMax && y.max <= 3 * yMax)) {
      const step = niceStep(yMax, 4);
      this.applyAxis(Orientation.VERTICAL, step, new Range(0, Math.ceil(yMax / step) * step));
    }
  }
}
