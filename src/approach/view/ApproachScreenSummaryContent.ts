/**
 * ApproachScreenSummaryContent.ts
 *
 * Screen summary for the Approach screen. The current-details paragraph is live: the reaction,
 * which way the mixture is shifting, and Q and K to two significant figures. It is rewritten only
 * when its text changes, so a screen reader is not flooded while the mixture settles.
 */

import { Multilink, StringProperty } from "scenerystack/axon";
import { localeProperty } from "scenerystack/joist";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { describeQuotient } from "../../common/view/quotientDescription.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { ApproachModel } from "../model/ApproachModel.js";

export class ApproachScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: ApproachModel) {
    const a11y = StringManager.getInstance().getApproachA11yStrings();
    const names = StringManager.getInstance().getCommonStrings().reactionNames;
    const mixture = model.scene.mixture;

    // Lives as long as the screen, which is never disposed.
    const currentDetailsProperty = new StringProperty("");
    const update = () => {
      const description = describeQuotient(mixture, model.scene.formProperty);
      currentDetailsProperty.value = StringUtils.fillIn(a11y.currentDetailsPatternStringProperty.value, {
        reaction: names[`${mixture.reaction.id}StringProperty`].value,
        ...description,
      });
    };
    mixture.changedEmitter.addListener(update);
    Multilink.multilinkAny([model.scene.formProperty, mixture.reactionProperty, localeProperty], update);

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: currentDetailsProperty,
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
