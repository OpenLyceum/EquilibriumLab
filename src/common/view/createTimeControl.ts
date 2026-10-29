/**
 * createTimeControl.ts
 *
 * Play/pause, step and slow/normal/fast speed controls, themed for the dark panels.
 */

import type { BooleanProperty, EnumerationProperty } from "scenerystack/axon";
import { TimeControlNode, TimeSpeed } from "scenerystack/scenery-phet";
import { FLAT_BUTTON_APPEARANCE_OPTIONS, TIME_CONTROL_SPEED_RADIO_OPTIONS } from "../EquilibriumLabButtonOptions.js";

export function createTimeControl(
  isPlayingProperty: BooleanProperty,
  timeSpeedProperty: EnumerationProperty<TimeSpeed>,
  stepForward: () => void,
): TimeControlNode {
  return new TimeControlNode(isPlayingProperty, {
    timeSpeedProperty,
    timeSpeeds: [TimeSpeed.SLOW, TimeSpeed.NORMAL, TimeSpeed.FAST],
    ...TIME_CONTROL_SPEED_RADIO_OPTIONS,
    playPauseStepButtonOptions: {
      playPauseButtonOptions: FLAT_BUTTON_APPEARANCE_OPTIONS,
      stepBackwardButtonOptions: FLAT_BUTTON_APPEARANCE_OPTIONS,
      stepForwardButtonOptions: { ...FLAT_BUTTON_APPEARANCE_OPTIONS, listener: stepForward },
    },
  });
}
