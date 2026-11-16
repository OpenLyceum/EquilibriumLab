import { MIXTURE_READOUTS_NODE_SETTINGS } from "../../EquilibriumLabConstants.js";
/**
 * MixtureReadoutsNode.ts
 *
 * Readouts under the particle box: the temperature and volume (and, for gases, the total pressure),
 * and how many forward and reverse reaction events the box showed in the last second. The event
 * counts make dynamic equilibrium visible: at equilibrium both keep coming, at equal rates.
 */

import { Multilink } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, RichText, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import EquilibriumLabColors from "../../EquilibriumLabColors.js";
import { FONT_SIZE } from "../../EquilibriumLabConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { ParticleSystem } from "../model/ParticleSystem.js";
import type { ReactionMixture } from "../model/ReactionMixture.js";
import { fixed, significant } from "./formatValues.js";

/** Seconds between refreshes of the readouts, so the numbers stay legible. */
const REFRESH_INTERVAL: number = MIXTURE_READOUTS_NODE_SETTINGS.REFRESH_INTERVAL;

export class MixtureReadoutsNode extends VBox {
  private readonly update: () => void;
  private readonly multilink: { dispose: () => void };
  private sinceRefresh = 0;

  public constructor(mixture: ReactionMixture, particles: ParticleSystem, width: number) {
    const strings = StringManager.getInstance().getCommonStrings();
    const font = new PhetFont(FONT_SIZE.small);
    const conditions = new RichText("", { font, fill: EquilibriumLabColors.textColorProperty, maxWidth: width });
    const heading = new Text(strings.eventsHeadingStringProperty, {
      font,
      fill: EquilibriumLabColors.mutedTextColorProperty,
      maxWidth: width,
    });
    const forward = new Text("", { font, fill: EquilibriumLabColors.forwardRateColorProperty, maxWidth: width / 2 });
    const reverse = new Text("", { font, fill: EquilibriumLabColors.reverseRateColorProperty, maxWidth: width / 2 });
    super({
      align: "left",
      spacing: MIXTURE_READOUTS_NODE_SETTINGS.CONSTRUCTOR_SPACING,
      children: [
        conditions,
        heading,
        new HBox({ spacing: MIXTURE_READOUTS_NODE_SETTINGS.ITEM_3_SPACING, children: [forward, reverse] }),
      ],
    });

    this.update = () => {
      let text = StringUtils.fillIn(strings.conditionsPatternStringProperty.value, {
        temperature: fixed(mixture.temperature, 0),
        volume: significant(mixture.volume, MIXTURE_READOUTS_NODE_SETTINGS.VOLUME_SIGNIFICANT_DIGITS),
      });
      if (mixture.reaction.isGas) {
        text += `    ${StringUtils.fillIn(strings.totalPressurePatternStringProperty.value, {
          value: significant(mixture.getTotalPressure(), MIXTURE_READOUTS_NODE_SETTINGS.SIGNIFICANT_DIGITS),
        })}`;
      }
      mixture.reaction.species.forEach((s, i) => {
        if (s.bulk) {
          text += `<br>${StringUtils.fillIn(strings.excessPatternStringProperty.value, {
            formula: s.formula,
            value: significant(mixture.getConcentrations()[i] ?? 0, MIXTURE_READOUTS_NODE_SETTINGS.SIGNIFICANT_DIGITS),
          })}`;
        }
      });
      conditions.string = text;
      const rates = particles.getEventRates();
      forward.string = StringUtils.fillIn(strings.forwardEventsPatternStringProperty.value, { value: rates.forward });
      reverse.string = StringUtils.fillIn(strings.reverseEventsPatternStringProperty.value, { value: rates.reverse });
    };
    this.multilink = Multilink.multilinkAny(
      [
        mixture.temperatureProperty,
        mixture.volumeProperty,
        mixture.reactionProperty,
        strings.conditionsPatternStringProperty,
        strings.totalPressurePatternStringProperty,
        strings.excessPatternStringProperty,
        strings.forwardEventsPatternStringProperty,
        strings.reverseEventsPatternStringProperty,
      ],
      this.update,
    );
  }

  public step(dt: number): void {
    this.sinceRefresh += dt;
    if (this.sinceRefresh >= REFRESH_INTERVAL) {
      this.sinceRefresh = 0;
      this.update();
    }
  }

  public override dispose(): void {
    this.multilink.dispose();
    super.dispose();
  }
}
