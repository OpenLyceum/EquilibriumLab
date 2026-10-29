/**
 * QuotientSummaryContent.ts
 *
 * Screen summary for the screens built around one reacting mixture. The current-details paragraph
 * is live: the reaction, which way the mixture is shifting, and Q and K to two significant figures.
 * It is rewritten only when its text changes, so a screen reader is not flooded while the mixture
 * settles.
 */

import { Multilink, StringProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { localeProperty } from "scenerystack/joist";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { StringManager } from "../../i18n/StringManager.js";
import type { ReactionSceneModel } from "../model/ReactionSceneModel.js";
import { describeQuotient } from "./quotientDescription.js";

export type QuotientSummaryStrings = {
  readonly screenSummary: {
    readonly playAreaStringProperty: TReadOnlyProperty<string>;
    readonly controlAreaStringProperty: TReadOnlyProperty<string>;
    readonly interactionHintStringProperty: TReadOnlyProperty<string>;
  };
  /** Pattern with {{reaction}}, {{direction}}, {{q}} and {{k}}. */
  readonly currentDetailsPatternStringProperty: TReadOnlyProperty<string>;
};

export class QuotientSummaryContent extends ScreenSummaryContent {
  public constructor(scene: ReactionSceneModel, strings: QuotientSummaryStrings) {
    const names = StringManager.getInstance().getCommonStrings().reactionNames;
    const mixture = scene.mixture;

    // Lives as long as the screen, which is never disposed.
    const currentDetailsProperty = new StringProperty("");
    const update = () => {
      currentDetailsProperty.value = StringUtils.fillIn(strings.currentDetailsPatternStringProperty.value, {
        reaction: names[`${mixture.reaction.id}StringProperty`].value,
        ...describeQuotient(mixture, scene.formProperty),
      });
    };
    mixture.changedEmitter.addListener(update);
    Multilink.multilinkAny([scene.formProperty, mixture.reactionProperty, localeProperty], update);

    super({
      playAreaContent: strings.screenSummary.playAreaStringProperty,
      controlAreaContent: strings.screenSummary.controlAreaStringProperty,
      currentDetailsContent: currentDetailsProperty,
      interactionHintContent: strings.screenSummary.interactionHintStringProperty,
    });
  }
}
