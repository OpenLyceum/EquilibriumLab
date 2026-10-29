/**
 * VantHoffScreenSummaryContent.ts
 *
 * Screen summary for the Van 't Hoff screen. The current-details paragraph names the reaction and
 * temperature, counts the measurements, and gives ΔH° and ΔS° from the fit once there is one.
 */

import { DerivedProperty } from "scenerystack/axon";
import { localeProperty } from "scenerystack/joist";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { fixed, signed } from "../../common/view/formatValues.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { VantHoffModel } from "../model/VantHoffModel.js";

export class VantHoffScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: VantHoffModel) {
    const a11y = StringManager.getInstance().getVantHoffA11yStrings();
    const strings = StringManager.getInstance().getVantHoffStrings();
    const names = StringManager.getInstance().getCommonStrings().reactionNames;

    // Lives as long as the screen, which is never disposed.
    const currentDetailsProperty = new DerivedProperty(
      [
        model.choiceProperty,
        model.scene.mixture.temperatureProperty,
        model.pointsProperty,
        model.fitProperty,
        localeProperty,
      ],
      (id, temperature, points, fit) => {
        const reaction =
          id === "unknown1"
            ? strings.choices.unknown1StringProperty.value
            : id === "unknown2"
              ? strings.choices.unknown2StringProperty.value
              : names[`${id}StringProperty`].value;
        return StringUtils.fillIn(a11y.currentDetailsPatternStringProperty.value, {
          reaction,
          temperature: fixed(temperature, 0),
          count: points.length,
          fit: fit
            ? StringUtils.fillIn(a11y.fitPatternStringProperty.value, {
                deltaH: signed(fit.deltaH / 1000, 1),
                deltaS: signed(fit.deltaS, 1),
              })
            : strings.needTwoStringProperty.value,
        });
      },
    );

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: currentDetailsProperty,
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
