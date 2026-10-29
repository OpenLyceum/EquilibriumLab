/**
 * ICETableScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createICETableIcon() in src/common/EquilibriumLabScreenIcons.ts.
 */
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createICETableIcon } from "../common/EquilibriumLabScreenIcons.js";
import EquilibriumLabColors from "../EquilibriumLabColors.js";
import { ICETableModel } from "./model/ICETableModel.js";
import { ICETableKeyboardHelpContent } from "./view/ICETableKeyboardHelpContent.js";
import { ICETableScreenView } from "./view/ICETableScreenView.js";

// Require tandem to be explicit — accidental omission would break PhET-iO.
type ICETableScreenOptions = ScreenOptions & { tandem: Tandem };

export class ICETableScreen extends Screen<ICETableModel, ICETableScreenView> {
  public constructor(options: ICETableScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => new ICETableModel(),
      // View factory — receives the model instance
      (model) =>
        new ICETableScreenView(model, {
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<ICETableScreenOptions, EmptySelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: EquilibriumLabColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new ICETableKeyboardHelpContent(),
          homeScreenIcon: createICETableIcon(),
          navigationBarIcon: createICETableIcon(),
        },
        options,
      ),
    );
  }
}
