/**
 * formatValues.ts
 *
 * Number formats shared by the screens: a true minus sign, explicit signs for changes,
 * significant figures, and scientific notation as RichText (5.76 × 10<sup>−3</sup>) for the
 * equilibrium constants and quotients that span many orders of magnitude.
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

/** `value` to `digits` significant figures in plain decimals ("0.0138", "57.2", "1450"). */
export function significant(value: number, digits = 3): string {
  if (value === 0 || !Number.isFinite(value)) {
    return Number.isFinite(value) ? "0" : "∞";
  }
  const decimals = Math.max(0, digits - 1 - Math.floor(Math.log10(Math.abs(value))));
  return fixed(value, Math.min(decimals, 10));
}

/**
 * RichText for `value` to `digits` significant figures: plain decimals between 0.01 and 10000,
 * scientific notation outside that ("5.76 × 10<sup>−3</sup>"), "∞" for infinity.
 */
export function scientific(value: number, digits = 3): string {
  if (!Number.isFinite(value)) {
    return Number.isNaN(value) ? "—" : value > 0 ? "∞" : `${MINUS}∞`;
  }
  const magnitude = Math.abs(value);
  if (magnitude === 0 || (magnitude >= 0.01 && magnitude < 10000)) {
    return significant(value, digits);
  }
  let exponent = Math.floor(Math.log10(magnitude));
  let mantissa = value / 10 ** exponent;
  if (Math.abs(Number(toFixed(mantissa, digits - 1))) >= 10) {
    exponent += 1;
    mantissa /= 10;
  }
  return `${fixed(mantissa, digits - 1)} × 10<sup>${fixed(exponent, 0)}</sup>`;
}

/** Scientific notation from a natural logarithm, so values beyond double range still print. */
export function scientificFromLn(lnValue: number, digits = 3): string {
  if (!Number.isFinite(lnValue)) {
    return Number.isNaN(lnValue) ? "—" : lnValue > 0 ? "∞" : "0";
  }
  const log10 = lnValue / Math.LN10;
  if (Math.abs(log10) < 300) {
    return scientific(Math.exp(lnValue), digits);
  }
  const exponent = Math.floor(log10);
  return `${fixed(10 ** (log10 - exponent), digits - 1)} × 10<sup>${fixed(exponent, 0)}</sup>`;
}

/** The same value as `scientific`, with Unicode superscripts for plain-text and spoken contexts. */
export function scientificPlain(value: number, digits = 3): string {
  return toPlainSuperscript(scientific(value, digits));
}

const SUPERSCRIPT_DIGITS: Record<string, string> = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹",
  "−": "⁻",
};

/** Replaces <sup>…</sup> with Unicode superscripts. */
export function toPlainSuperscript(markup: string): string {
  return markup.replace(/<sup>(.*?)<\/sup>/g, (_m, text: string) =>
    [...text].map((ch) => SUPERSCRIPT_DIGITS[ch] ?? ch).join(""),
  );
}

/** Concentration in M to three significant figures. */
export function formatConcentration(molar: number): string {
  return significant(molar, 3);
}

/** Percentage error of `measured` against `accepted`, one decimal, signed. */
export function percentError(measured: number, accepted: number): string {
  return signed(((measured - accepted) / Math.abs(accepted)) * 100, 1);
}
