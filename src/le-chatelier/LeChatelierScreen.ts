/**
 * LeChatelierScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createLeChatelierIcon() in src/common/EquilibriumLabScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createLeChatelierIcon } from "../common/EquilibriumLabScreenIcons.js";
import EquilibriumLabColors from "../EquilibriumLabColors.js";
import { LeChatelierModel } from "./model/LeChatelierModel.js";
import { LeChatelierKeyboardHelpContent } from "./view/LeChatelierKeyboardHelpContent.js";
import { LeChatelierScreenView } from "./view/LeChatelierScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type LeChatelierScreenOptions = ScreenOptions & { tandem: Tandem };

export class LeChatelierScreen extends Screen<LeChatelierModel, LeChatelierScreenView> {
  public constructor(options: LeChatelierScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new LeChatelierModel(),
      // View factory — receives the model instance
      (model) =>
        new LeChatelierScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<LeChatelierScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: EquilibriumLabColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new LeChatelierKeyboardHelpContent(),
          homeScreenIcon: createLeChatelierIcon(),
          navigationBarIcon: createLeChatelierIcon(),
        },
        options,
      ),
    );
  }
}
