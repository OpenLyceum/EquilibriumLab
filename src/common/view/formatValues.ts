/**
 * formatValues.ts
 *
 * Number formats shared by the screens: a true minus sign, explicit signs for changes, and the
 * precision each kind of quantity is read to in the lab.
 */

import { toFixed } from "scenerystack/dot";

const MINUS = "−";

/** Fixed decimals with a true minus sign (and never "−0.00"). */
export function fixed(value: number, decimals: number): string {
  const text = toFixed(value, decimals);
  return Number(text) === 0 ? text.replace("-", "") : text.replace("-", MINUS);
}

/** Fixed decimals with an explicit sign: "+6.67", "−1.46". */
export function signed(value: number, decimals: number): string {
  const text = fixed(value, decimals);
  return value > 0 && Number(toFixed(value, decimals)) !== 0 ? `+${text}` : text;
}

/** A heat in joules: whole joules, signed. */
export function formatJoules(joules: number): string {
  return signed(joules, 0);
}

/** A heat in kilojoules to 0.001 kJ, signed. */
export function formatKilojoules(kilojoules: number): string {
  return signed(kilojoules, 3);
}

/** An enthalpy in kJ or kJ/mol to 0.1 kJ, signed. */
export function formatEnthalpy(kilojoules: number): string {
  return signed(kilojoules, 1);
}

/** Moles to four significant figures. */
export function formatMoles(moles: number): string {
  if (moles <= 0) {
    return "0";
  }
  const decimals = Math.max(0, 3 - Math.floor(Math.log10(moles)));
  return fixed(moles, decimals);
}

/** Percentage error of `measured` against `accepted`, one decimal, signed. */
export function percentError(measured: number, accepted: number): string {
  return signed(((measured - accepted) / Math.abs(accepted)) * 100, 1);
}
