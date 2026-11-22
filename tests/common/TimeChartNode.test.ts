/**
 * TimeChartNode.test.ts
 *
 * The charts paint their traces with bamboo's CanvasLinePlot (a Path per trace rebuilt its Shape
 * every sample). Guards the parts the canvas plots must keep from the old LinePlot nodes: hidden
 * (bulk) traces stay hidden, profile-colour changes repaint the stroke, and the colour links are
 * released on setTraces and dispose.
 */

import { Property } from "scenerystack/axon";
import { ChartCanvasNode } from "scenerystack/bamboo";
import { Color, type Node } from "scenerystack/scenery";
import { describe, expect, it } from "vitest";
import { TimeRecord } from "../../src/common/model/TimeRecord.js";
import { TimeChartNode } from "../../src/common/view/TimeChartNode.js";
import { listenerCount } from "../helpers/memoryLeak.js";

const labels = {
  title: new Property("title"),
  xAxis: new Property("x"),
  yAxis: new Property("y"),
};

function chartCanvasOf(node: Node): ChartCanvasNode {
  const found: ChartCanvasNode[] = [];
  const visit = (n: Node): void => {
    if (n instanceof ChartCanvasNode) {
      found.push(n);
    }
    n.children.forEach(visit);
  };
  visit(node);
  expect(found).toHaveLength(1);
  return found[0] as ChartCanvasNode;
}

/** The stroke a painter would use, read through a stub 2D context. */
function strokeOf(canvas: ChartCanvasNode, index: number): unknown {
  const context = {
    strokeStyle: "" as unknown,
    lineWidth: 0,
    beginPath: () => undefined,
    setLineDash: () => undefined,
    moveTo: () => undefined,
    lineTo: () => undefined,
    stroke: () => undefined,
  };
  const painter = canvas.painters[index] as unknown as { paintCanvas(c: unknown): void };
  painter.paintCanvas(context);
  return context.strokeStyle;
}

describe("TimeChartNode canvas plots", () => {
  it("keeps traces with visible: false hidden", () => {
    const record = new TimeRecord(2);
    record.record(0, [0.1, 0.2], true);
    const chart = new TimeChartNode(
      record,
      [
        { color: "red", label: "A" },
        { color: "blue", label: "B", visible: false },
      ],
      labels,
      200,
      100,
    );
    const canvas = chartCanvasOf(chart);
    expect(canvas.painters.map((painter) => painter.visible)).toEqual([true, false]);
    chart.dispose();
  });

  it("repaints on a colour change and unlinks colours on setTraces and dispose", () => {
    const record = new TimeRecord(1);
    record.record(0, [0.1], true);
    record.record(1, [0.2], true);
    const colorProperty = new Property(new Color(255, 0, 0));
    const before = listenerCount(colorProperty);
    const chart = new TimeChartNode(record, [{ color: colorProperty, label: "A" }], labels, 200, 100);
    expect(listenerCount(colorProperty)).toBeGreaterThan(before);
    expect(strokeOf(chartCanvasOf(chart), 0)).toBe(new Color(255, 0, 0).toCSS());

    colorProperty.value = new Color(0, 0, 255);
    expect(strokeOf(chartCanvasOf(chart), 0)).toBe(new Color(0, 0, 255).toCSS());

    chart.setTraces([{ color: "green", label: "A" }]);
    expect(listenerCount(colorProperty)).toBe(before);

    chart.setTraces([{ color: colorProperty, label: "A" }]);
    chart.dispose();
    expect(listenerCount(colorProperty)).toBe(before);
  });
});
