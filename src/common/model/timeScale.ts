/**
 * timeScale.ts
 *
 * Maps the time-control speed radio buttons to simulated seconds per real second.
 */

import { TimeSpeed } from "scenerystack/scenery-phet";

export type TimeScale = { readonly slow: number; readonly normal: number; readonly fast: number };

export function timeScaleFor(speed: TimeSpeed, scale: TimeScale): number {
  return speed === TimeSpeed.SLOW ? scale.slow : speed === TimeSpeed.FAST ? scale.fast : scale.normal;
}
