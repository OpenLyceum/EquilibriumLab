import { QK_GAUGE_NODE_SETTINGS } from "../../EquilibriumLabConstants.js";
/**
 * QKGaugeNode.ts
 *
 * A logarithmic scale comparing the reaction quotient with the equilibrium constant. K is a fixed
 * gold marker at the centre of an eight-decade window; Q is a pointer that slides toward it as
 * the mixture reacts. The caption says which way the mixture must shift: Q < K, toward products;
 * Q > K, toward reactants; Q = K, at equilibrium. When Q is off the scale, the pointer waits at the
 * edge with an arrow.
 */

import { Multilink, type TReadOnlyProperty } from "scenerystack/axon";
import { Shape } from "scenerystack/kite";
import { StringUtils } from "scenerystack/phetcommon";
import { Line, Node, Path, Rectangle, RichText, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import EquilibriumLabColors from "../../EquilibriumLabColors.js";
import { FONT_SIZE } from "../../EquilibriumLabConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { EquilibriumForm } from "../model/EquilibriumForm.js";
import type { ReactionMixture } from "../model/ReactionMixture.js";
import { shiftDirection } from "../model/shiftDirection.js";
import { disposeChildren } from "./disposeChildren.js";
import { scientificFromLn } from "./formatValues.js";

/** Decades shown on each side of K. */
const HALF_SPAN_DECADES: number = QK_GAUGE_NODE_SETTINGS.HALF_SPAN_DECADES;

const TRACK_HEIGHT: number = QK_GAUGE_NODE_SETTINGS.TRACK_HEIGHT;

export class QKGaugeNode extends Node {
  private readonly disposeQKGaugeNode: () => void;
  private readonly refresh: () => void;

  public constructor(mixture: ReactionMixture, formProperty: TReadOnlyProperty<EquilibriumForm>, width: number) {
    super();
    const strings = StringManager.getInstance().getCommonStrings();
    const font = new PhetFont(FONT_SIZE.small);
    const tinyFont = new PhetFont(FONT_SIZE.tiny);

    const track = new Rectangle(
      0,
      0,
      width,
      TRACK_HEIGHT,
      QK_GAUGE_NODE_SETTINGS.TRACK_CORNER_X,
      QK_GAUGE_NODE_SETTINGS.TRACK_CORNER_Y,
      {
        fill: EquilibriumLabColors.gaugeTrackColorProperty,
        stroke: EquilibriumLabColors.chartAxisColorProperty,
      },
    );
    const tickLayer = new Node();
    const kMarker = new Line(width / 2, QK_GAUGE_NODE_SETTINGS.K_MARKER_START_Y, width / 2, TRACK_HEIGHT + 6, {
      stroke: EquilibriumLabColors.kMarkerColorProperty,
      lineWidth: QK_GAUGE_NODE_SETTINGS.K_MARKER_LINE_WIDTH,
    });
    const kLabel = new RichText("", {
      font,
      fill: EquilibriumLabColors.kMarkerColorProperty,
      maxWidth: QK_GAUGE_NODE_SETTINGS.K_LABEL_MAX_WIDTH,
    });
    const pointerShape = new Shape()
      .moveTo(0, 0)
      .lineTo(QK_GAUGE_NODE_SETTINGS.POINTER_SHAPE_X, QK_GAUGE_NODE_SETTINGS.POINTER_SHAPE_Y)
      .lineTo(QK_GAUGE_NODE_SETTINGS.POINTER_SHAPE_X_SEGMENT_2, QK_GAUGE_NODE_SETTINGS.POINTER_SHAPE_Y)
      .close();
    const pointer = new Path(pointerShape, {
      fill: EquilibriumLabColors.qPointerColorProperty,
      stroke: EquilibriumLabColors.backgroundColorProperty,
    });
    const offScaleArrow = new Path(null, { fill: EquilibriumLabColors.qPointerColorProperty });
    const qLabel = new RichText("", {
      font,
      fill: EquilibriumLabColors.qPointerColorProperty,
      maxWidth: QK_GAUGE_NODE_SETTINGS.Q_LABEL_MAX_WIDTH,
    });

    const readout = new RichText("", { font, fill: EquilibriumLabColors.textColorProperty, maxWidth: width });
    const caption = new RichText("", {
      font: new PhetFont({ size: FONT_SIZE.small, weight: "bold" }),
      maxWidth: width,
    });
    const scale = new Node({ children: [track, tickLayer, kMarker, kLabel, offScaleArrow, pointer, qLabel] });
    const column = new VBox({
      align: "left",
      spacing: QK_GAUGE_NODE_SETTINGS.COLUMN_SPACING,
      children: [scale, readout, caption],
    });
    this.children = [column];

    let tickCenter = Number.NaN;
    const drawTicks = (centerDecade: number) => {
      if (centerDecade === tickCenter) {
        return;
      }
      tickCenter = centerDecade;
      disposeChildren(tickLayer);
      const children: Node[] = [];
      for (let d = -HALF_SPAN_DECADES; d <= HALF_SPAN_DECADES; d++) {
        const x = ((d + HALF_SPAN_DECADES) / (2 * HALF_SPAN_DECADES)) * width;
        children.push(
          new Line(x, TRACK_HEIGHT, x, TRACK_HEIGHT + 4, { stroke: EquilibriumLabColors.chartAxisColorProperty }),
        );
        if (d % 2 === 0) {
          children.push(
            new RichText(`10<sup>${(centerDecade + d).toString().replace("-", "−")}</sup>`, {
              font: tinyFont,
              fill: EquilibriumLabColors.mutedTextColorProperty,
              centerX: x,
              top: TRACK_HEIGHT + QK_GAUGE_NODE_SETTINGS.DRAW_TICKS_TOP_OFFSET,
              maxWidth: QK_GAUGE_NODE_SETTINGS.DRAW_TICKS_MAX_WIDTH,
            }),
          );
        }
      }
      tickLayer.children = children;
    };

    this.refresh = () => {
      const kp = formProperty.value === EquilibriumForm.KP && mixture.reaction.isGas;
      const lnK = kp ? mixture.lnKp : mixture.lnKc;
      const lnQ = kp ? mixture.lnQp : mixture.lnQc;
      const symbols = kp ? strings.kpSymbols : strings.kcSymbols;
      const log10K = lnK / Math.LN10;
      const centerDecade = Math.round(log10K);
      drawTicks(centerDecade);
      const toX = (log10: number) => ((log10 - centerDecade + HALF_SPAN_DECADES) / (2 * HALF_SPAN_DECADES)) * width;

      kMarker.x = toX(log10K) - width / 2;
      kLabel.string = symbols.kStringProperty.value;
      kLabel.left = toX(log10K) + QK_GAUGE_NODE_SETTINGS.CONSTRUCTOR_LEFT_OFFSET;
      kLabel.bottom = QK_GAUGE_NODE_SETTINGS.BOTTOM_BOTTOM;

      const log10Q = lnQ / Math.LN10;
      const known = !Number.isNaN(log10Q);
      const x = known ? toX(log10Q) : width / 2;
      const clamped = Math.min(width, Math.max(0, x));
      pointer.visible = known;
      qLabel.visible = known;
      pointer.x = clamped;
      pointer.y = QK_GAUGE_NODE_SETTINGS.Y_Y;
      qLabel.string = symbols.qStringProperty.value;
      qLabel.centerX = clamped;
      qLabel.bottom = Math.min(pointer.top, kLabel.top) - 1;
      offScaleArrow.visible = known && (x < 0 || x > width);
      offScaleArrow.shape =
        x < 0
          ? new Shape()
              .moveTo(QK_GAUGE_NODE_SETTINGS.SHAPE_X, TRACK_HEIGHT / 2)
              .lineTo(QK_GAUGE_NODE_SETTINGS.OFF_SCALE_ARROW_X, -1)
              .lineTo(QK_GAUGE_NODE_SETTINGS.OFF_SCALE_ARROW_X, TRACK_HEIGHT + 1)
              .close()
          : new Shape()
              .moveTo(width + 12, TRACK_HEIGHT / 2)
              .lineTo(width + 4, -1)
              .lineTo(width + 4, TRACK_HEIGHT + 1)
              .close();

      readout.string = StringUtils.fillIn(strings.quotientReadoutPatternStringProperty.value, {
        q: symbols.qStringProperty.value,
        qValue: scientificFromLn(lnQ),
        k: symbols.kStringProperty.value,
        kValue: scientificFromLn(lnK),
      });
      const direction = shiftDirection(mixture.lnQOverK);
      caption.string = {
        right: strings.shiftRightStringProperty,
        left: strings.shiftLeftStringProperty,
        none: strings.atEquilibriumStringProperty,
        stuck: strings.cannotReactStringProperty,
      }[direction].value;
      caption.fill = {
        right: EquilibriumLabColors.towardProductsColorProperty,
        left: EquilibriumLabColors.towardReactantsColorProperty,
        none: EquilibriumLabColors.goodColorProperty,
        stuck: EquilibriumLabColors.mutedTextColorProperty,
      }[direction];
    };

    mixture.changedEmitter.addListener(this.refresh);
    const multilink = Multilink.multilinkAny(
      [
        formProperty,
        mixture.reactionProperty,
        strings.quotientReadoutPatternStringProperty,
        strings.shiftRightStringProperty,
        strings.shiftLeftStringProperty,
        strings.atEquilibriumStringProperty,
        strings.cannotReactStringProperty,
        strings.kcSymbols.qStringProperty,
        strings.kpSymbols.qStringProperty,
      ],
      this.refresh,
    );
    this.disposeQKGaugeNode = () => {
      mixture.changedEmitter.removeListener(this.refresh);
      multilink.dispose();
    };
  }

  public override dispose(): void {
    this.disposeQKGaugeNode();
    super.dispose();
  }
}
