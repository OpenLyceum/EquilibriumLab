/**
 * reactionChoices.ts
 *
 * Menu choices for the reactions a screen offers, and spoken species names, from the string files.
 */

import type { TReadOnlyProperty } from "scenerystack/axon";
import { StringManager } from "../../i18n/StringManager.js";
import type { ReactionId, SpeciesId } from "../model/Reaction.js";
import type { ComboChoice } from "./ControlFactory.js";

export function reactionChoices(ids: readonly ReactionId[]): ComboChoice<ReactionId>[] {
  const names = StringManager.getInstance().getCommonStrings().reactionNames;
  return ids.map((id) => ({ value: id, label: names[`${id}StringProperty`] }));
}

/** The spoken name of a species, e.g. "nitrogen dioxide" for NO2. */
export function speciesName(id: SpeciesId): TReadOnlyProperty<string> {
  const names = StringManager.getInstance().getCommonStrings().speciesNames;
  return names[`${id}StringProperty`];
}
