/**
 * VantHoffScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createVantHoffIcon() in src/common/EquilibriumLabScreenIcons.ts
 * (see doc/multi-screen.md).
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createVantHoffIcon } from "../common/EquilibriumLabScreenIcons.js";
import EquilibriumLabColors from "../EquilibriumLabColors.js";
import { VantHoffModel } from "./model/VantHoffModel.js";
import { VantHoffKeyboardHelpContent } from "./view/VantHoffKeyboardHelpContent.js";
import { VantHoffScreenView } from "./view/VantHoffScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type VantHoffScreenOptions = ScreenOptions & { tandem: Tandem };

export class VantHoffScreen extends Screen<VantHoffModel, VantHoffScreenView> {
  public constructor(options: VantHoffScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new VantHoffModel(),
      // View factory — receives the model instance
      (model) =>
        new VantHoffScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<VantHoffScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: EquilibriumLabColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new VantHoffKeyboardHelpContent(),
          homeScreenIcon: createVantHoffIcon(),
          navigationBarIcon: createVantHoffIcon(),
        },
        options,
      ),
    );
  }
}
