/**
 * reactionChoices.ts
 *
 * Menu choices for the reactions a screen offers, named from the string files.
 */

import { StringManager } from "../../i18n/StringManager.js";
import type { ReactionId } from "../model/Reaction.js";
import type { ComboChoice } from "./ControlFactory.js";

export function reactionChoices(ids: readonly ReactionId[]): ComboChoice<ReactionId>[] {
  const names = StringManager.getInstance().getCommonStrings().reactionNames;
  return ids.map((id) => ({ value: id, label: names[`${id}StringProperty`] }));
}
