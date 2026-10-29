/**
 * ICEFeedbackNode.ts
 *
 * The verdict on the last check, line by line: the change row, x, K (in "find K" problems), and the
 * small-x test once x is right.
 */

import { Multilink, type TReadOnlyProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import type { TColor } from "scenerystack/scenery";
import { fixed, scientific } from "../../common/view/formatValues.js";
import { RichTextLines } from "../../common/view/RichTextLines.js";
import EquilibriumLabColors from "../../EquilibriumLabColors.js";
import { StringManager } from "../../i18n/StringManager.js";
import { smallXPercent } from "../model/ICEProblem.js";
import type { ICETableModel } from "../model/ICETableModel.js";

/** The small-x approximation holds when the change is under this percentage of the start. */
const SMALL_X_LIMIT_PERCENT = 5;

/** The feedback lines (markup) and their colours for the model's current check. */
export function feedbackLines(model: ICETableModel): { texts: string[]; fills: TColor[] } {
  const strings = StringManager.getInstance().getICETableStrings();
  const check = model.checkProperty.value;
  const problem = model.problem;
  const good = EquilibriumLabColors.goodColorProperty;
  const poor = EquilibriumLabColors.poorColorProperty;
  const muted = EquilibriumLabColors.mutedTextColorProperty;
  if (!check) {
    return { texts: [strings.startPromptStringProperty.value], fills: [muted] };
  }
  const texts: string[] = [];
  const fills: TColor[] = [];
  const add = (text: TReadOnlyProperty<string> | string, fill: TColor) => {
    texts.push(typeof text === "string" ? text : text.value);
    fills.push(fill);
  };
  add(
    check.sign !== 0 ? strings.changeRowRightStringProperty : strings.changeRowWrongStringProperty,
    check.sign ? good : poor,
  );
  if (!check.xEntered) {
    add(strings.xMissingStringProperty, muted);
  } else if (check.xCorrect) {
    add(
      StringUtils.fillIn(strings.xRightStringProperty.value, { value: scientific(model.xEntryProperty.value ?? 0, 3) }),
      good,
    );
  } else if (check.sign !== 0) {
    add(problem.mode === "findK" ? strings.xWrongFindKStringProperty : strings.xWrongStringProperty, poor);
  }
  if (problem.mode === "findK") {
    if (!check.kEntered) {
      add(strings.kMissingStringProperty, muted);
    } else {
      add(
        check.kCorrect
          ? StringUtils.fillIn(strings.kRightStringProperty.value, {
              value: scientific(model.kEntryProperty.value ?? 0, 3),
            })
          : strings.kWrongStringProperty,
        check.kCorrect ? good : poor,
      );
    }
  }
  const smallX = smallXPercent(problem);
  if (problem.mode === "findEquilibrium" && check.xCorrect && smallX) {
    const pattern =
      smallX.percent < SMALL_X_LIMIT_PERCENT ? strings.smallXValidStringProperty : strings.smallXInvalidStringProperty;
    add(
      StringUtils.fillIn(pattern.value, {
        formula: problem.reaction.species[smallX.index]?.formula ?? "",
        percent: fixed(smallX.percent, 1),
      }),
      EquilibriumLabColors.textColorProperty,
    );
  }
  return { texts, fills };
}

export class ICEFeedbackNode extends RichTextLines {
  private readonly multilink: { dispose: () => void };

  public constructor(model: ICETableModel, width: number) {
    super(4, width, true);
    const strings = StringManager.getInstance().getICETableStrings();
    this.multilink = Multilink.multilinkAny(
      [
        model.checkProperty,
        model.problemProperty,
        strings.startPromptStringProperty,
        strings.changeRowRightStringProperty,
        strings.changeRowWrongStringProperty,
        strings.xMissingStringProperty,
        strings.xRightStringProperty,
        strings.xWrongStringProperty,
        strings.xWrongFindKStringProperty,
        strings.kMissingStringProperty,
        strings.kRightStringProperty,
        strings.kWrongStringProperty,
        strings.smallXValidStringProperty,
        strings.smallXInvalidStringProperty,
      ],
      () => {
        const { texts, fills } = feedbackLines(model);
        this.setLines(texts, fills);
      },
    );
  }

  public override dispose(): void {
    this.multilink.dispose();
    super.dispose();
  }
}
