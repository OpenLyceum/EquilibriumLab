/**
 * TimeRecord.ts
 *
 * Values a run has recorded against time, for the charts: one list of (time, value) points per
 * trace, sampled every RECORD_INTERVAL of simulated time, plus markers at the moments a stress was
 * applied. When a long run fills the record, every other point is dropped and the interval
 * doubles, so the whole run always fits. Adapted from CalorimetryLab's TemperatureRecord.
 */

import { Emitter } from "scenerystack/axon";
import { Vector2 } from "scenerystack/dot";
import { RECORD_CAPACITY, RECORD_INTERVAL } from "../../EquilibriumLabConstants.js";

export type TimeMarker = {
  readonly time: number;
  /** Short label drawn at the marker, e.g. "+N₂" or "T↑". */
  readonly label: string;
};

export class TimeRecord {
  /** One list of points (x = time in s, y = value) per trace. */
  public readonly traces: Vector2[][] = [];

  public readonly markers: TimeMarker[] = [];

  /** Fires after points or markers are added or the record is cleared. */
  public readonly changedEmitter = new Emitter();

  private interval = RECORD_INTERVAL;
  private lastTime = Number.NEGATIVE_INFINITY;

  public constructor(traceCount: number) {
    this.setTraceCount(traceCount);
  }

  /** Clears the record and gives it `count` empty traces. */
  public setTraceCount(count: number): void {
    this.traces.length = 0;
    for (let i = 0; i < count; i++) {
      this.traces.push([]);
    }
    this.clear();
  }

  /**
   * Records `values` at `time` if a sampling interval has passed since the last point, or always
   * when `force` is set (right after a stress, so the jump is drawn sharply).
   */
  public record(time: number, values: readonly number[], force = false): void {
    if (!force && time - this.lastTime < this.interval - 1e-9) {
      return;
    }
    this.lastTime = time;
    this.traces.forEach((trace, i) => {
      const value = values[i] ?? 0;
      trace.push(new Vector2(time, Number.isFinite(value) ? value : Number.NaN));
    });
    if ((this.traces[0]?.length ?? 0) > RECORD_CAPACITY) {
      for (const trace of this.traces) {
        const kept = trace.filter((_point, index) => index % 2 === 0 || index === trace.length - 1);
        trace.length = 0;
        trace.push(...kept);
      }
      this.interval *= 2;
    }
    this.changedEmitter.emit();
  }

  /**
   * Adds a marker, unless the latest one has the same label and is less than `mergeTime` seconds
   * old (repeated presses of the same stress read as one).
   */
  public addMarker(time: number, label: string, mergeTime = 0): void {
    const last = this.markers[this.markers.length - 1];
    if (last && last.label === label && time - last.time < mergeTime) {
      return;
    }
    this.markers.push({ time, label });
    this.changedEmitter.emit();
  }

  /** Time of the latest point (s), or 0 for an empty record. */
  public get lastRecordedTime(): number {
    return Math.max(0, ...this.traces.map((trace) => trace[trace.length - 1]?.x ?? 0));
  }

  public clear(): void {
    for (const trace of this.traces) {
      trace.length = 0;
    }
    this.markers.length = 0;
    this.interval = RECORD_INTERVAL;
    this.lastTime = Number.NEGATIVE_INFINITY;
    this.changedEmitter.emit();
  }

  public dispose(): void {
    this.changedEmitter.dispose();
  }
}
