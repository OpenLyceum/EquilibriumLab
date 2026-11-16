import { NUMBER_ENTRY_NODE_SETTINGS } from "../../EquilibriumLabConstants.js";
/**
 * NumberEntryNode.ts
 *
 * A field showing an entered number (or "?" before one is entered). Pressing it opens the shared
 * keypad dialog; the value typed there is written to `valueProperty` when the student presses
 * Enter.
 */

import { Multilink, type Property, type TReadOnlyProperty } from "scenerystack/axon";
import type { Range } from "scenerystack/dot";
import { RichText } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import type { KeypadDialog } from "scenerystack/sim";
import { RectangularPushButton } from "scenerystack/sun";
import { FLAT_PANEL_PUSH_BUTTON_OPTIONS, LIGHT_SURFACE_TEXT_FILL } from "../../common/EquilibriumLabButtonOptions.js";
import { scientific } from "../../common/view/formatValues.js";
import { FONT_SIZE } from "../../EquilibriumLabConstants.js";
import { StringManager } from "../../i18n/StringManager.js";

export class NumberEntryNode extends RectangularPushButton {
  private readonly multilink: { dispose: () => void };

  public constructor(
    valueProperty: Property<number | null>,
    range: () => Range,
    keypadDialog: KeypadDialog,
    accessibleName: TReadOnlyProperty<string>,
    width: number,
  ) {
    const strings = StringManager.getInstance().getICETableStrings();
    const text = new RichText("", {
      font: new PhetFont(FONT_SIZE.readout),
      fill: LIGHT_SURFACE_TEXT_FILL,
      maxWidth: width - NUMBER_ENTRY_NODE_SETTINGS.TEXT_MAX_WIDTH_OFFSET,
    });
    super({
      ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
      content: text,
      minWidth: width,
      xMargin: NUMBER_ENTRY_NODE_SETTINGS.CONSTRUCTOR_X_MARGIN,
      yMargin: NUMBER_ENTRY_NODE_SETTINGS.CONSTRUCTOR_Y_MARGIN,
      accessibleName,
      listener: () => {
        keypadDialog.beginEdit(
          (value: number) => {
            valueProperty.value = value;
          },
          range(),
          strings.keypadRangePatternStringProperty,
          () => undefined,
        );
      },
    });
    this.multilink = Multilink.multilink([valueProperty, strings.unknownStringProperty], (value, unknown) => {
      text.string = value === null ? unknown : scientific(value, NUMBER_ENTRY_NODE_SETTINGS.TEXT_DIGITS);
    });
  }

  public override dispose(): void {
    this.multilink.dispose();
    super.dispose();
  }
}
