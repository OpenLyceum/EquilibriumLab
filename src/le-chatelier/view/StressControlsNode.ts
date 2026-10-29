/**
 * StressControlsNode.ts
 *
 * The stresses a student can apply to the current reaction: add or remove each species, set the
 * temperature, and add argon (gases) or water (solutions). Rebuilt whenever the reaction changes,
 * since the species and the temperature range change with it.
 */

import { DerivedProperty, type TReadOnlyProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, Node, VBox } from "scenerystack/scenery";
import { heading, label, numberControl, pushButton } from "../../common/view/ControlFactory.js";
import { disposeChildren } from "../../common/view/disposeChildren.js";
import { speciesName } from "../../common/view/reactionChoices.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { LeChatelierModel } from "../model/LeChatelierModel.js";

/** Width of the formula column in a species row (px). */
const FORMULA_WIDTH = 96;

type Disposable = { dispose: () => void };

export class StressControlsNode extends VBox {
  private readonly model: LeChatelierModel;
  private readonly rebuild: () => void;
  private owned: Disposable[] = [];

  public constructor(
    model: LeChatelierModel,
    enabledProperty: TReadOnlyProperty<boolean>,
    width: number,
    respond: () => void,
  ) {
    super({ align: "left", spacing: 8 });
    this.model = model;
    const strings = StringManager.getInstance().getLeChatelierStrings();
    const common = StringManager.getInstance().getCommonStrings();
    const a11y = StringManager.getInstance().getLeChatelierA11yStrings();
    const markers = strings.markers;
    const mixture = model.mixture;

    this.rebuild = () => {
      disposeChildren(this);
      for (const item of this.owned) {
        item.dispose();
      }
      this.owned = [];
      const reaction = mixture.reaction;

      const rows = reaction.species.map((s, i) => {
        const name = speciesName(s.id);
        const addName = new DerivedProperty([a11y.addPatternStringProperty, name], (pattern, n) =>
          StringUtils.fillIn(pattern, { name: n }),
        );
        const removeName = new DerivedProperty([a11y.removePatternStringProperty, name], (pattern, n) =>
          StringUtils.fillIn(pattern, { name: n }),
        );
        this.owned.push(addName, removeName);
        const addButton = pushButton(
          strings.addButtonStringProperty,
          () => {
            model.addSpecies(i, StringUtils.fillIn(markers.addPatternStringProperty.value, { formula: s.formula }));
            respond();
          },
          addName,
        );
        const removeButton = pushButton(
          strings.removeButtonStringProperty,
          () => {
            model.removeSpecies(
              i,
              StringUtils.fillIn(markers.removePatternStringProperty.value, { formula: s.formula }),
            );
            respond();
          },
          removeName,
        );
        addButton.enabledProperty = enabledProperty;
        removeButton.enabledProperty = enabledProperty;
        const formula = label(s.formula, FORMULA_WIDTH);
        return new HBox({
          spacing: 6,
          children: [
            new Node({ children: [formula], localBounds: formula.localBounds.withMaxX(FORMULA_WIDTH) }),
            addButton,
            removeButton,
          ],
        });
      });

      // Temperature: the stress is marked when the drag or arrow press ends.
      let startTemperature = mixture.temperature;
      const range = reaction.definition.temperatureRange;
      const temperatureControl = numberControl(
        strings.temperatureStringProperty,
        mixture.temperatureProperty,
        range,
        {
          delta: 1,
          decimalPlaces: 0,
          valuePattern: common.kelvinPatternStringProperty,
          startCallback: () => {
            startTemperature = mixture.temperature;
            model.beginStress();
          },
          endCallback: () => {
            const up = mixture.temperature > startTemperature;
            model.endStress("temperature", (up ? markers.heatStringProperty : markers.coolStringProperty).value);
            respond();
          },
        },
        width,
      );
      temperatureControl.enabledProperty = enabledProperty;

      const extras: Node[] = [];
      if (reaction.isGas) {
        const argonVolume = pushButton(strings.argonConstantVolumeStringProperty, () => {
          model.addArgon(false, markers.argonStringProperty.value);
          respond();
        });
        const argonPressure = pushButton(strings.argonConstantPressureStringProperty, () => {
          model.addArgon(true, markers.argonStringProperty.value);
          respond();
        });
        const argonPressureEnabled = new DerivedProperty(
          [enabledProperty, mixture.volumeProperty],
          (enabled) => enabled && model.canAddArgonAtConstantPressure,
        );
        this.owned.push(argonPressureEnabled);
        argonVolume.enabledProperty = enabledProperty;
        argonPressure.enabledProperty = argonPressureEnabled;
        extras.push(new HBox({ spacing: 6, children: [argonVolume, argonPressure] }));
      } else {
        const water = pushButton(strings.diluteStringProperty, () => {
          model.dilute(markers.waterStringProperty.value);
          respond();
        });
        const waterEnabled = new DerivedProperty(
          [enabledProperty, mixture.volumeProperty],
          (enabled, volume) => enabled && volume < reaction.definition.volumeRange.max,
        );
        this.owned.push(waterEnabled);
        water.enabledProperty = waterEnabled;
        extras.push(water);
      }

      this.children = [heading(strings.speciesHeadingStringProperty, width), ...rows, temperatureControl, ...extras];
    };
    mixture.reactionProperty.link(this.rebuild);
  }

  public override dispose(): void {
    this.model.mixture.reactionProperty.unlink(this.rebuild);
    for (const item of this.owned) {
      item.dispose();
    }
    super.dispose();
  }
}
