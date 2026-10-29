/**
 * LeChatelierKeyboardHelpContent.ts
 *
 * Keyboard-help dialog for the Le Chatelier screen: the piston, the temperature slider and the
 * time controls on the left; the reaction menu, buttons, radio buttons and checkboxes on the right.
 */

import {
  BasicActionsKeyboardHelpSection,
  ComboBoxKeyboardHelpSection,
  MoveDraggableItemsKeyboardHelpSection,
  SliderControlsKeyboardHelpSection,
  TimeControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";

export class LeChatelierKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    super(
      [
        new MoveDraggableItemsKeyboardHelpSection(),
        new SliderControlsKeyboardHelpSection(),
        new TimeControlsKeyboardHelpSection(),
      ],
      [new ComboBoxKeyboardHelpSection(), new BasicActionsKeyboardHelpSection({ withCheckboxContent: true })],
    );
  }
}
