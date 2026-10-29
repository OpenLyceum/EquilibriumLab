/**
 * vantHoffFit.ts
 *
 * Least-squares fit of ln K against 1/T. With ΔH° and ΔS° constant, the van 't Hoff equation
 * ln K = −(ΔH°/R)(1/T) + ΔS°/R is a straight line, so the slope gives ΔH° = −R·slope and the
 * intercept gives ΔS° = R·intercept.
 */

import { GAS_CONSTANT } from "../../EquilibriumLabConstants.js";

export type VantHoffPoint = {
  /** Temperature (K). */
  readonly temperature: number;
  /** ln K measured at that temperature. */
  readonly lnK: number;
};

export type VantHoffFit = {
  /** Slope of ln K against 1/T (K). */
  readonly slope: number;
  readonly intercept: number;
  /** Coefficient of determination. */
  readonly rSquared: number;
  /** ΔH° from the slope (J/mol). */
  readonly deltaH: number;
  /** ΔS° from the intercept (J/(mol·K)). */
  readonly deltaS: number;
};

/** The fit, or null with fewer than two distinct temperatures. */
export function fitVantHoff(points: readonly VantHoffPoint[]): VantHoffFit | null {
  const xs = points.map((p) => 1 / p.temperature);
  const ys = points.map((p) => p.lnK);
  const n = points.length;
  if (n < 2) {
    return null;
  }
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = (xs[i] ?? 0) - meanX;
    const dy = (ys[i] ?? 0) - meanY;
    sxx += dx * dx;
    sxy += dx * dy;
    syy += dy * dy;
  }
  if (sxx <= 1e-18) {
    return null;
  }
  const slope = sxy / sxx;
  const intercept = meanY - slope * meanX;
  const rSquared = syy > 0 ? (sxy * sxy) / (sxx * syy) : 1;
  return {
    slope,
    intercept,
    rSquared,
    deltaH: -GAS_CONSTANT * slope,
    deltaS: GAS_CONSTANT * intercept,
  };
}
