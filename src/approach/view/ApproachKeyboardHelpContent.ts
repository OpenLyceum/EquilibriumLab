/**
 * ApproachKeyboardHelpContent.ts
 *
 * Keyboard-help dialog for the Approach screen: the concentration and generic-reaction sliders and
 * the time controls on the left; the reaction menu, buttons, radio buttons and checkbox on the right.
 */

import {
  BasicActionsKeyboardHelpSection,
  ComboBoxKeyboardHelpSection,
  SliderControlsKeyboardHelpSection,
  TimeControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";

export class ApproachKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    super(
      [new SliderControlsKeyboardHelpSection(), new TimeControlsKeyboardHelpSection()],
      [new ComboBoxKeyboardHelpSection(), new BasicActionsKeyboardHelpSection({ withCheckboxContent: true })],
    );
  }
}
