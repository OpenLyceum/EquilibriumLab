/**
 * VantHoffScreenView.ts
 *
 * Van 't Hoff screen layout: the equation and the particle box on the left, with the readouts, the
 * equilibrium status and the time controls under them; the ln K against 1000/T plot and the ΔG°
 * against T plot in the middle; and the reaction, measurement and fit panels on the right.
 */

import { DerivedProperty, Multilink, type TReadOnlyProperty } from "scenerystack/axon";
import { Range, Vector2 } from "scenerystack/dot";
import { optionize } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, Node, RichText, VBox } from "scenerystack/scenery";
import { PhetFont, ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/EquilibriumLabButtonOptions.js";
import { EquilibriumLabPanel } from "../../common/EquilibriumLabPanel.js";
import { EquilibriumForm } from "../../common/model/EquilibriumForm.js";
import { checkbox, comboBox, heading, note, numberControl, pushButton } from "../../common/view/ControlFactory.js";
import { createTimeControl } from "../../common/view/createTimeControl.js";
import { disposeChildren } from "../../common/view/disposeChildren.js";
import { fixed, scientificFromLn } from "../../common/view/formatValues.js";
import { MixtureReadoutsNode } from "../../common/view/MixtureReadoutsNode.js";
import { ParticleBoxNode } from "../../common/view/ParticleBoxNode.js";
import { ReactionEquationNode } from "../../common/view/ReactionEquationNode.js";
import EquilibriumLabColors from "../../EquilibriumLabColors.js";
import {
  FONT_SIZE,
  GAS_CONSTANT,
  INVERSE_TEMPERATURE_SCALE,
  PANEL_SPACING,
  SCREEN_VIEW_MARGIN,
  SIDE_COLUMN_WIDTH,
} from "../../EquilibriumLabConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { isUnknown, VANT_HOFF_CHOICE_IDS, type VantHoffChoiceId, type VantHoffModel } from "../model/VantHoffModel.js";
import { VantHoffResultsNode } from "./VantHoffResultsNode.js";
import { VantHoffScreenSummaryContent } from "./VantHoffScreenSummaryContent.js";
import { XYPlotNode } from "./XYPlotNode.js";

type SelfOptions = {
  /** Preferences: ring each molecule as it forms. */
  showReactionFlashesProperty: TReadOnlyProperty<boolean>;
};

export type VantHoffScreenViewOptions = SelfOptions & ScreenViewOptions;

const BOX_WIDTH_PX = 220;
const LEFT_X = SCREEN_VIEW_MARGIN + 14;
const PARTICLE_BOX_Y = 64;
const PLOT_LEFT = 372;
const PLOT_WIDTH = 340;
const LN_PLOT_TOP = 78;
const LN_PLOT_HEIGHT = 180;
const GIBBS_PLOT_TOP = 340;
const GIBBS_PLOT_HEIGHT = 140;
const SIDE_CONTENT_WIDTH = SIDE_COLUMN_WIDTH - 24;
const KJ = 1000;

/** Extra room around the expected data, as a fraction of its span (measurement error, margins). */
const RANGE_PADDING = 0.12;

/** Seconds between refreshes of the K readout. */
const READOUT_INTERVAL = 0.25;

export class VantHoffScreenView extends ScreenView {
  private readonly particleBox: ParticleBoxNode;
  private readonly readouts: MixtureReadoutsNode;
  private readonly updateKReadout: () => void;
  private sinceReadout = 0;

  public constructor(model: VantHoffModel, providedOptions: VantHoffScreenViewOptions) {
    const options = optionize<VantHoffScreenViewOptions, SelfOptions, ScreenViewOptions>()(
      { screenSummaryContent: new VantHoffScreenSummaryContent(model) },
      providedOptions,
    );
    super(options);

    const strings = StringManager.getInstance().getVantHoffStrings();
    const common = StringManager.getInstance().getCommonStrings();
    const a11y = StringManager.getInstance().getVantHoffA11yStrings();
    const scene = model.scene;
    const mixture = scene.mixture;
    const listParent = new Node();

    // ── Equation, particle box, readouts ────────────────────────────────────────
    // K° is Kp for gases and Kc for solutions, so the equation shows that form.
    const standardFormProperty = new DerivedProperty([mixture.reactionProperty], (reaction) =>
      reaction.isGas ? EquilibriumForm.KP : EquilibriumForm.KC,
    );
    const equation = new ReactionEquationNode(mixture.reactionProperty, standardFormProperty, 680);
    equation.left = SCREEN_VIEW_MARGIN;
    equation.top = SCREEN_VIEW_MARGIN - 6;

    this.particleBox = new ParticleBoxNode(mixture, scene.particles, BOX_WIDTH_PX, {
      showFlashesProperty: options.showReactionFlashesProperty,
    });
    this.particleBox.x = LEFT_X;
    this.particleBox.y = PARTICLE_BOX_Y;

    this.readouts = new MixtureReadoutsNode(mixture, scene.particles, 300);
    this.readouts.left = SCREEN_VIEW_MARGIN;
    this.readouts.top = this.particleBox.bottom + 8;

    const status = new RichText("", { font: new PhetFont({ size: FONT_SIZE.control, weight: "bold" }), maxWidth: 300 });
    const kReadout = new RichText("", {
      font: new PhetFont(FONT_SIZE.readout),
      fill: EquilibriumLabColors.textColorProperty,
      maxWidth: 300,
    });
    this.updateKReadout = () => {
      const symbols = mixture.reaction.isGas ? common.kpSymbols : common.kcSymbols;
      const ready = model.atEquilibriumProperty.value;
      kReadout.string = StringUtils.fillIn(strings.kReadoutPatternStringProperty.value, {
        k: (ready ? symbols.kStringProperty : symbols.qStringProperty).value,
        value: scientificFromLn(mixture.lnStandardQ, 3),
      });
      status.string = (ready ? strings.readyStringProperty : strings.waitingStringProperty).value;
      status.fill = ready ? EquilibriumLabColors.goodColorProperty : EquilibriumLabColors.mutedTextColorProperty;
    };
    Multilink.multilinkAny(
      [
        model.atEquilibriumProperty,
        mixture.reactionProperty,
        strings.readyStringProperty,
        strings.waitingStringProperty,
      ],
      this.updateKReadout,
    );
    const catalystNote = note(strings.catalystNoteStringProperty, 300);
    const statusBox = new VBox({ align: "left", spacing: 6, children: [kReadout, status, catalystNote] });
    statusBox.left = SCREEN_VIEW_MARGIN;
    statusBox.top = this.readouts.bottom + 12;

    const timeControl = createTimeControl(scene.timer.isPlayingProperty, scene.timeSpeedProperty, () =>
      scene.advance(1 / 30),
    );
    timeControl.left = SCREEN_VIEW_MARGIN;
    timeControl.bottom = this.layoutBounds.maxY - SCREEN_VIEW_MARGIN;

    // ── Plots ───────────────────────────────────────────────────────────────────
    const lnPlot = new XYPlotNode(
      {
        title: strings.lnPlot.titleStringProperty,
        xAxis: strings.lnPlot.xAxisStringProperty,
        yAxis: strings.lnPlot.yAxisStringProperty,
      },
      PLOT_WIDTH,
      LN_PLOT_HEIGHT,
      false,
      EquilibriumLabColors.dataPointColorProperty,
    );
    lnPlot.x = PLOT_LEFT;
    lnPlot.y = LN_PLOT_TOP;
    const gibbsPlot = new XYPlotNode(
      {
        title: strings.gibbsPlot.titleStringProperty,
        xAxis: strings.gibbsPlot.xAxisStringProperty,
        yAxis: strings.gibbsPlot.yAxisStringProperty,
      },
      PLOT_WIDTH,
      GIBBS_PLOT_HEIGHT,
      true,
      EquilibriumLabColors.dataPointColorProperty,
    );
    gibbsPlot.x = PLOT_LEFT;
    gibbsPlot.y = GIBBS_PLOT_TOP;

    // Axis ranges come from the reaction's own ln K and ΔG° over its temperature range.
    const padded = (a: number, b: number, alsoInclude: number[] = []) => {
      const low = Math.min(a, b, ...alsoInclude);
      const high = Math.max(a, b, ...alsoInclude);
      const pad = Math.max(RANGE_PADDING * (high - low), 0.3);
      return new Range(low - pad, high + pad);
    };
    mixture.reactionProperty.link((reaction) => {
      const t = reaction.definition.temperatureRange;
      lnPlot.setRanges(
        padded(INVERSE_TEMPERATURE_SCALE / t.max, INVERSE_TEMPERATURE_SCALE / t.min),
        padded(reaction.lnStandardK(t.min), reaction.lnStandardK(t.max)),
      );
      gibbsPlot.setRanges(padded(t.min, t.max), padded(reaction.deltaG(t.min) / KJ, reaction.deltaG(t.max) / KJ, [0]));
    });
    Multilink.multilink([model.pointsProperty, model.fitProperty], (points, fit) => {
      lnPlot.setData(
        points.map((p) => new Vector2(INVERSE_TEMPERATURE_SCALE / p.temperature, p.lnK)),
        fit ? { slope: fit.slope / INVERSE_TEMPERATURE_SCALE, intercept: fit.intercept } : null,
      );
      // ΔG° = −RT ln K at each point; the fit gives the line ΔH° − TΔS°.
      gibbsPlot.setData(
        points.map((p) => new Vector2(p.temperature, (-GAS_CONSTANT * p.temperature * p.lnK) / KJ)),
        fit ? { slope: -fit.deltaS / KJ, intercept: fit.deltaH / KJ } : null,
      );
    });

    // ── Reaction panel ──────────────────────────────────────────────────────────
    const names = common.reactionNames;
    const choiceName = (id: VantHoffChoiceId) =>
      id === "unknown1"
        ? strings.choices.unknown1StringProperty
        : id === "unknown2"
          ? strings.choices.unknown2StringProperty
          : names[`${id}StringProperty`];
    const reactionMenu = comboBox(
      model.choiceProperty,
      VANT_HOFF_CHOICE_IDS.map((id) => ({ value: id, label: choiceName(id) })),
      listParent,
      common.a11y.reactionMenuStringProperty,
      SIDE_CONTENT_WIDTH,
    );
    const reactionPanel = new EquilibriumLabPanel(
      new VBox({
        align: "left",
        spacing: 8,
        children: [heading(common.reactionHeadingStringProperty, SIDE_CONTENT_WIDTH), reactionMenu],
      }),
      { minWidth: SIDE_COLUMN_WIDTH, maxWidth: SIDE_COLUMN_WIDTH },
    );

    // ── Measurement panel ───────────────────────────────────────────────────────
    const temperatureParent = new Node();
    mixture.reactionProperty.link((reaction) => {
      disposeChildren(temperatureParent);
      temperatureParent.addChild(
        numberControl(
          strings.temperatureStringProperty,
          mixture.temperatureProperty,
          reaction.definition.temperatureRange,
          { delta: 1, decimalPlaces: 0, valuePattern: common.kelvinPatternStringProperty },
          SIDE_CONTENT_WIDTH,
        ),
      );
    });
    const measureButton = pushButton(strings.measureKStringProperty, () => {
      model.measure();
      const point = model.pointsProperty.value[model.pointsProperty.value.length - 1];
      if (point) {
        this.addAccessibleResponse(
          StringUtils.fillIn(a11y.measuredPatternStringProperty.value, {
            value: fixed(point.lnK, 2),
            temperature: fixed(point.temperature, 0),
          }),
        );
      }
    });
    measureButton.enabledProperty = model.atEquilibriumProperty;
    const hasPointsProperty = new DerivedProperty([model.pointsProperty], (points) => points.length > 0);
    const removeButton = pushButton(strings.removeLastStringProperty, () => model.removeLastPoint());
    const clearButton = pushButton(strings.clearAllStringProperty, () => model.clearPoints());
    removeButton.enabledProperty = hasPointsProperty;
    clearButton.enabledProperty = hasPointsProperty;
    const errorCheckbox = checkbox(
      model.measurementErrorProperty,
      strings.measurementErrorStringProperty,
      SIDE_CONTENT_WIDTH,
    );
    const revealCheckbox = checkbox(model.revealProperty, strings.revealStringProperty, SIDE_CONTENT_WIDTH);
    revealCheckbox.visibleProperty = new DerivedProperty([model.choiceProperty], (id) => isUnknown(id));
    const measurePanel = new EquilibriumLabPanel(
      new VBox({
        align: "left",
        spacing: 8,
        children: [
          heading(strings.measureHeadingStringProperty, SIDE_CONTENT_WIDTH),
          temperatureParent,
          measureButton,
          new HBox({ spacing: 6, children: [removeButton, clearButton] }),
          errorCheckbox,
          revealCheckbox,
        ],
      }),
      { minWidth: SIDE_COLUMN_WIDTH, maxWidth: SIDE_COLUMN_WIDTH },
    );

    // ── Results panel ───────────────────────────────────────────────────────────
    const results = new VantHoffResultsNode(model, SIDE_CONTENT_WIDTH);
    const resultsPanel = new EquilibriumLabPanel(
      new VBox({
        align: "left",
        spacing: 6,
        children: [heading(strings.resultsHeadingStringProperty, SIDE_CONTENT_WIDTH), results],
      }),
      { minWidth: SIDE_COLUMN_WIDTH, maxWidth: SIDE_COLUMN_WIDTH },
    );

    const sideColumn = new VBox({
      align: "center",
      spacing: PANEL_SPACING,
      children: [reactionPanel, measurePanel, resultsPanel],
    });
    sideColumn.boundsProperty.link(() => {
      sideColumn.right = this.layoutBounds.maxX - SCREEN_VIEW_MARGIN;
      sideColumn.top = SCREEN_VIEW_MARGIN;
    });

    const resetAllButton = new ResetAllButton({
      ...FLAT_RESET_ALL_BUTTON_OPTIONS,
      listener: () => {
        model.reset();
        this.reset();
      },
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      bottom: this.layoutBounds.maxY - SCREEN_VIEW_MARGIN,
    });

    this.children = [
      equation,
      this.particleBox,
      this.readouts,
      statusBox,
      lnPlot,
      gibbsPlot,
      sideColumn,
      timeControl,
      resetAllButton,
      listParent,
    ];
    this.addChild(
      new Node({
        pdomOrder: [
          reactionMenu,
          temperatureParent,
          measureButton,
          removeButton,
          clearButton,
          errorCheckbox,
          revealCheckbox,
          timeControl,
          resetAllButton,
        ],
      }),
    );
  }

  public reset(): void {
    // No view-only state.
  }

  public override step(dt: number): void {
    this.particleBox.step();
    this.readouts.step(dt);
    this.sinceReadout += dt;
    if (this.sinceReadout >= READOUT_INTERVAL) {
      this.sinceReadout = 0;
      this.updateKReadout();
    }
  }
}
