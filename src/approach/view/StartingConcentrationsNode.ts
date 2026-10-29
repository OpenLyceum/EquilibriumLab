/**
 * StartingConcentrationsNode.ts
 *
 * One slider per species for its starting concentration, rebuilt whenever the reaction (and so the
 * species list) changes.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { Node, VBox } from "scenerystack/scenery";
import { numberControl } from "../../common/view/ControlFactory.js";
import { disposeChildren } from "../../common/view/disposeChildren.js";
import { plainFormula } from "../../common/view/speciesStyles.js";
import { decimalsFor, niceStep } from "../../common/view/TimeChartNode.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { ApproachModel } from "../model/ApproachModel.js";

export class StartingConcentrationsNode extends VBox {
  private titles: (TReadOnlyProperty<string> & { dispose: () => void })[] = [];
  private readonly rebuild: () => void;
  private readonly model: ApproachModel;

  public constructor(model: ApproachModel, width: number) {
    super({ align: "left", spacing: 6 });
    this.model = model;
    const strings = StringManager.getInstance().getApproachStrings();
    const common = StringManager.getInstance().getCommonStrings();

    this.rebuild = () => {
      disposeChildren(this);
      for (const title of this.titles) {
        title.dispose();
      }
      const reaction = model.reaction;
      this.titles = reaction.species.map((s) => {
        const formula = plainFormula(s.formula);
        return new DerivedProperty([strings.initialPatternStringProperty], (pattern) =>
          StringUtils.fillIn(pattern, { formula }),
        );
      });
      this.children = model.initialConcentrationProperties.map((property, i) => {
        const step = niceStep(property.range.max, 100);
        const title = this.titles[i];
        return title
          ? numberControl(
              title,
              property,
              property.range,
              { delta: step, decimalPlaces: decimalsFor(step), valuePattern: common.molarPatternStringProperty },
              width,
            )
          : new Node();
      });
    };
    model.initialConcentrationsRebuiltEmitter.addListener(this.rebuild);
    this.rebuild();
  }

  public override dispose(): void {
    this.model.initialConcentrationsRebuiltEmitter.removeListener(this.rebuild);
    for (const title of this.titles) {
      title.dispose();
    }
    super.dispose();
  }
}
