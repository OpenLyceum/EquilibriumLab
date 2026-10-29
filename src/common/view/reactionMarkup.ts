/**
 * reactionMarkup.ts
 *
 * RichText for a reaction's balanced equation and for its reaction-quotient expression, in the
 * concentration (Qc) or pressure (Qp) form. Chemical formulas are the same in every language, so
 * these are built from the species data rather than from the string files.
 */

import type { Reaction } from "../model/Reaction.js";
import { plainFormula } from "./speciesStyles.js";

/** "N<sub>2</sub>O<sub>4</sub>(g) ⇌ 2NO<sub>2</sub>(g)". */
export function equationMarkup(reaction: Reaction): string {
  const phase = reaction.isGas ? "(g)" : "(aq)";
  const side = (indices: number[]) =>
    indices
      .map((i) => {
        const s = reaction.species[i];
        if (!s) {
          return "";
        }
        const coefficient = Math.abs(s.nu) === 1 ? "" : `${Math.abs(s.nu)}`;
        return `${coefficient}${s.formula}${reaction.family === "generic" ? "" : phase}`;
      })
      .join(" + ");
  const extra = reaction.extraProducts ? ` + ${reaction.extraProducts}` : "";
  return `${side(reaction.reactantIndices)} ⇌ ${side(reaction.productIndices)}${extra}`;
}

/** One factor of Q: "[NO<sub>2</sub>]<sup>2</sup>" or "P<sub>NO₂</sub><sup>2</sup>". */
function factor(reaction: Reaction, index: number, pressure: boolean): string {
  const s = reaction.species[index];
  if (!s) {
    return "";
  }
  const power = Math.abs(s.nu) === 1 ? "" : `<sup>${Math.abs(s.nu)}</sup>`;
  return pressure ? `P<sub>${plainFormula(s.formula)}</sub>${power}` : `[${s.formula}]${power}`;
}

/** The quotient's right-hand side: "[NO<sub>2</sub>]<sup>2</sup> / [N<sub>2</sub>O<sub>4</sub>]". */
export function quotientMarkup(reaction: Reaction, pressure: boolean): string {
  const top = reaction.productIndices.map((i) => factor(reaction, i, pressure)).join(" ");
  const bottom = reaction.reactantIndices.map((i) => factor(reaction, i, pressure)).join(" ");
  const denominator = reaction.reactantIndices.length > 1 ? `(${bottom})` : bottom;
  return `${top} / ${denominator}`;
}
