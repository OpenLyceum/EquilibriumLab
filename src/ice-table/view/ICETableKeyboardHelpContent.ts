/**
 * ICETableKeyboardHelpContent.ts
 *
 * Keyboard-help dialog for the ICE Table screen: the change-row pickers (spinners) and the time
 * controls on the left; the problem menu, buttons, keypad and radio buttons on the right.
 */

import {
  BasicActionsKeyboardHelpSection,
  ComboBoxKeyboardHelpSection,
  SpinnerControlsKeyboardHelpSection,
  TimeControlsKeyboardHelpSection,
  TwoColumnKeyboardHelpContent,
} from "scenerystack/scenery-phet";

export class ICETableKeyboardHelpContent extends TwoColumnKeyboardHelpContent {
  public constructor() {
    super(
      [new SpinnerControlsKeyboardHelpSection(), new TimeControlsKeyboardHelpSection()],
      [new ComboBoxKeyboardHelpSection(), new BasicActionsKeyboardHelpSection()],
    );
  }
}
