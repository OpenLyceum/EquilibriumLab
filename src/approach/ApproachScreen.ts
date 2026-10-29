/**
 * ApproachScreen.ts
 *
 * The top-level Screen component. It wires together the model and view
 * factories and passes screen-level options (name, background color, tandem)
 * to the parent Screen class.
 *
 * Registered in the screens array in src/main.ts. Its home-screen and navigation-bar
 * icons come from createApproachIcon() in src/common/EquilibriumLabScreenIcons.ts.
 */
import type { BooleanProperty } from "scenerystack/axon";
import { optionize } from "scenerystack/phet-core";
import type { ScreenOptions } from "scenerystack/sim";
import { Screen } from "scenerystack/sim";
import type { Tandem } from "scenerystack/tandem";
import { createApproachIcon } from "../common/EquilibriumLabScreenIcons.js";
import EquilibriumLabColors from "../EquilibriumLabColors.js";
import { ApproachModel } from "./model/ApproachModel.js";
import { ApproachKeyboardHelpContent } from "./view/ApproachKeyboardHelpContent.js";
import { ApproachScreenView } from "./view/ApproachScreenView.js";

type SelfOptions = {
  /** Preferences: gas reactions start in the Kp form. */
  startWithKpProperty: BooleanProperty;
  /** Preferences: ring each molecule as it forms. */
  showReactionFlashesProperty: BooleanProperty;
};

// Require tandem to be explicit — accidental omission would break PhET-iO.
type ApproachScreenOptions = SelfOptions & ScreenOptions & { tandem: Tandem };

export class ApproachScreen extends Screen<ApproachModel, ApproachScreenView> {
  public constructor(options: ApproachScreenOptions) {
    super(
      // Model factory — called once when the screen is first shown
      () => {
        const model = new ApproachModel(options.startWithKpProperty.value);
        options.startWithKpProperty.link((kp) => model.scene.setInitialForm(kp));
        return model;
      },
      // View factory — receives the model instance
      (model) =>
        new ApproachScreenView(model, {
          showReactionFlashesProperty: options.showReactionFlashesProperty,
          tandem: options.tandem.createTandem("view"),
        }),
      optionize<ApproachScreenOptions, SelfOptions, ScreenOptions>()(
        {
          backgroundColorProperty: EquilibriumLabColors.backgroundColorProperty,
          createKeyboardHelpNode: () => new ApproachKeyboardHelpContent(),
          homeScreenIcon: createApproachIcon(),
          navigationBarIcon: createApproachIcon(),
        },
        options,
      ),
    );
  }
}
