/**
 * ICETableScreenSummaryContent.ts
 *
 * Screen summary for the ICE Table screen. The current-details paragraph names the reaction, what
 * the problem gives, and the task, and follows each new problem.
 */

import { DerivedProperty } from "scenerystack/axon";
import { localeProperty } from "scenerystack/joist";
import { StringUtils } from "scenerystack/phetcommon";
import { ScreenSummaryContent } from "scenerystack/sim";
import { scientific, significant } from "../../common/view/formatValues.js";
import { plainFormula } from "../../common/view/speciesStyles.js";
import { StringManager } from "../../i18n/StringManager.js";
import { markupToSpeech } from "../../le-chatelier/view/StressExplanationNode.js";
import type { ICETableModel } from "../model/ICETableModel.js";

export class ICETableScreenSummaryContent extends ScreenSummaryContent {
  public constructor(model: ICETableModel) {
    const a11y = StringManager.getInstance().getICETableA11yStrings();
    const strings = StringManager.getInstance().getICETableStrings();
    const common = StringManager.getInstance().getCommonStrings();

    // Lives as long as the screen, which is never disposed.
    const currentDetailsProperty = new DerivedProperty([model.problemProperty, localeProperty], (problem) => {
      const given =
        problem.mode === "findEquilibrium"
          ? StringUtils.fillIn(strings.givenKPatternStringProperty.value, {
              k: "Kc",
              value: scientific(problem.k, 3),
              temperature: significant(problem.temperature, 3),
            })
          : StringUtils.fillIn(strings.givenEquilibriumPatternStringProperty.value, {
              formula: plainFormula(problem.reaction.species[problem.givenIndex ?? 0]?.formula ?? ""),
              value: significant(problem.givenValue ?? 0, 3),
              temperature: significant(problem.temperature, 3),
            });
      const task = (
        problem.mode === "findEquilibrium" ? strings.taskFindEquilibriumStringProperty : strings.taskFindKStringProperty
      ).value;
      return markupToSpeech(
        StringUtils.fillIn(a11y.currentDetailsPatternStringProperty.value, {
          reaction: common.reactionNames[`${problem.reaction.id}StringProperty`].value,
          given,
          task,
        }),
      );
    });

    super({
      playAreaContent: a11y.screenSummary.playAreaStringProperty,
      controlAreaContent: a11y.screenSummary.controlAreaStringProperty,
      currentDetailsContent: currentDetailsProperty,
      interactionHintContent: a11y.screenSummary.interactionHintStringProperty,
    });
  }
}
