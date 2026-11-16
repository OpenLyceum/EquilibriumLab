import { EQUILIBRIUM_LAB_PREFERENCES_NODE_SETTINGS } from "../EquilibriumLabConstants.js";
/**
 * EquilibriumLabPreferencesNode.ts
 *
 * Custom preferences UI shown in Preferences → Simulation. Controls are bound
 * to EquilibriumLabPreferencesModel Properties (whose initial values come from
 * equilibriumLabQueryParameters).
 */

import type { BooleanProperty, TReadOnlyProperty } from "scenerystack/axon";
import { Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { Checkbox } from "scenerystack/sun";
import type { Tandem } from "scenerystack/tandem";
import EquilibriumLabColors from "../EquilibriumLabColors.js";
import EquilibriumLabNamespace from "../EquilibriumLabNamespace.js";
import { StringManager } from "../i18n/StringManager.js";
import type { EquilibriumLabPreferencesModel } from "./EquilibriumLabPreferencesModel.js";

export class EquilibriumLabPreferencesNode extends VBox {
  public constructor(preferencesModel: EquilibriumLabPreferencesModel, tandem?: Tandem) {
    const prefStrings = StringManager.getInstance().getPreferences();

    // The Preferences dialog is always white, so use the dark "light control surface"
    // colors (readable on white in both default and projector profiles), not textColorProperty
    // (which is near-white in default mode and would be invisible on the white dialog).
    const header = new Text(prefStrings.titleStringProperty, {
      font: new PhetFont({ size: EQUILIBRIUM_LAB_PREFERENCES_NODE_SETTINGS.HEADER_FONT_SIZE, weight: "bold" }),
      fill: EquilibriumLabColors.controlSurfaceTextColorProperty,
    });

    const preferenceCheckbox = (property: BooleanProperty, label: TReadOnlyProperty<string>, name: string) =>
      new Checkbox(
        property,
        new Text(label, {
          font: new PhetFont(EQUILIBRIUM_LAB_PREFERENCES_NODE_SETTINGS.PREFERENCE_CHECKBOX_FONT_SIZE),
          fill: EquilibriumLabColors.controlSurfaceTextColorProperty,
          maxWidth: EQUILIBRIUM_LAB_PREFERENCES_NODE_SETTINGS.PREFERENCE_CHECKBOX_MAX_WIDTH,
        }),
        {
          checkboxColor: EquilibriumLabColors.controlSurfaceTextColorProperty,
          checkboxColorBackground: EquilibriumLabColors.controlSurfaceColorProperty,
          spacing: EQUILIBRIUM_LAB_PREFERENCES_NODE_SETTINGS.PREFERENCE_CHECKBOX_SPACING,
          accessibleName: label,
          ...(tandem && { tandem: tandem.createTandem(name) }),
        },
      );

    super({
      align: "left",
      spacing: EQUILIBRIUM_LAB_PREFERENCES_NODE_SETTINGS.CONSTRUCTOR_SPACING,
      children: [
        header,
        preferenceCheckbox(
          preferencesModel.startWithKpProperty,
          prefStrings.startWithKpStringProperty,
          "startWithKpCheckbox",
        ),
        preferenceCheckbox(
          preferencesModel.showReactionFlashesProperty,
          prefStrings.showReactionFlashesStringProperty,
          "showReactionFlashesCheckbox",
        ),
      ],
    });
  }
}

EquilibriumLabNamespace.register("EquilibriumLabPreferencesNode", EquilibriumLabPreferencesNode);
