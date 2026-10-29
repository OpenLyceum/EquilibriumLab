/**
 * LeChatelierScreenView.ts
 *
 * Le Chatelier screen layout: the equation and the particle box on the left (the piston sets the
 * gas volume) with the readouts and Q/K gauge under them; the concentration chart in the middle
 * with the "What changed?" explanation and the prediction panel under it; and the reaction and
 * stress controls and the time controls on the right.
 */

import { BooleanProperty, DerivedProperty, stepTimer, type TReadOnlyProperty } from "scenerystack/axon";
import { optionize } from "scenerystack/phet-core";
import { Node, VBox } from "scenerystack/scenery";
import { ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/EquilibriumLabButtonOptions.js";
import { EquilibriumLabPanel } from "../../common/EquilibriumLabPanel.js";
import { EquilibriumForm } from "../../common/model/EquilibriumForm.js";
import { REACTION_IDS } from "../../common/model/Reactions.js";
import type { ShiftDirection } from "../../common/model/shiftDirection.js";
import { checkbox, comboBox, heading, note, pushButton, radioGroup } from "../../common/view/ControlFactory.js";
import { createTimeControl } from "../../common/view/createTimeControl.js";
import { MixtureReadoutsNode } from "../../common/view/MixtureReadoutsNode.js";
import { ParticleBoxNode } from "../../common/view/ParticleBoxNode.js";
import { QKGaugeNode } from "../../common/view/QKGaugeNode.js";
import { QuotientSummaryContent } from "../../common/view/QuotientSummaryContent.js";
import { ReactionEquationNode } from "../../common/view/ReactionEquationNode.js";
import { reactionChoices } from "../../common/view/reactionChoices.js";
import { speciesStyleIn } from "../../common/view/speciesStyles.js";
import { type ChartTrace, TimeChartNode } from "../../common/view/TimeChartNode.js";
import { PANEL_SPACING, SCREEN_VIEW_MARGIN, SIDE_COLUMN_WIDTH } from "../../EquilibriumLabConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { LeChatelierModel } from "../model/LeChatelierModel.js";
import { StressControlsNode } from "./StressControlsNode.js";
import { explainStress, markupToSpeech, StressExplanationNode } from "./StressExplanationNode.js";

type SelfOptions = {
  /** Preferences: ring each molecule as it forms. */
  showReactionFlashesProperty: TReadOnlyProperty<boolean>;
};

export type LeChatelierScreenViewOptions = SelfOptions & ScreenViewOptions;

const BOX_WIDTH_PX = 236;
const LEFT_X = SCREEN_VIEW_MARGIN + 14;
const PARTICLE_BOX_Y = 64;
const CHART_LEFT = 372;
const CHART_WIDTH = 350;
const CHART_TOP = 104;
const CHART_HEIGHT = 196;
const MIDDLE_PANEL_WIDTH = 398;
const SIDE_CONTENT_WIDTH = SIDE_COLUMN_WIDTH - 24;

export class LeChatelierScreenView extends ScreenView {
  private readonly particleBox: ParticleBoxNode;
  private readonly readouts: MixtureReadoutsNode;

  public constructor(model: LeChatelierModel, providedOptions: LeChatelierScreenViewOptions) {
    const options = optionize<LeChatelierScreenViewOptions, SelfOptions, ScreenViewOptions>()(
      {
        screenSummaryContent: new QuotientSummaryContent(
          model.scene,
          StringManager.getInstance().getLeChatelierA11yStrings(),
        ),
      },
      providedOptions,
    );
    super(options);

    const strings = StringManager.getInstance().getLeChatelierStrings();
    const common = StringManager.getInstance().getCommonStrings();
    const a11y = StringManager.getInstance().getLeChatelierA11yStrings();
    const scene = model.scene;
    const mixture = scene.mixture;
    const listParent = new Node();

    // Stresses are allowed unless predict-first mode is waiting for a prediction.
    // Applied on the next tick: ending a stress clears the prediction, and disabling a slider or the
    // piston from inside its own end callback would interrupt an input that is already finishing.
    const stressAllowedProperty = new DerivedProperty(
      [model.predictFirstProperty, model.predictionProperty],
      (predictFirst, prediction) => !predictFirst || prediction !== null,
    );
    const stressEnabledProperty = new BooleanProperty(stressAllowedProperty.value);
    stressAllowedProperty.lazyLink((allowed) => {
      stepTimer.setTimeout(() => {
        stressEnabledProperty.value = stressAllowedProperty.value;
      }, 0);
      if (allowed) {
        stressEnabledProperty.value = true;
      }
    });
    const respond = () =>
      this.addAccessibleResponse(
        markupToSpeech(explainStress(model.lastStressProperty.value, mixture.reaction, scene.formProperty.value)),
      );

    // ── Equation, particle box, gauge ───────────────────────────────────────────
    const equation = new ReactionEquationNode(mixture.reactionProperty, scene.formProperty, 680);
    equation.left = SCREEN_VIEW_MARGIN;
    equation.top = SCREEN_VIEW_MARGIN - 6;

    this.particleBox = new ParticleBoxNode(mixture, scene.particles, BOX_WIDTH_PX, {
      showFlashesProperty: options.showReactionFlashesProperty,
      volumeAdjustable: true,
      pistonEnabledProperty: stressEnabledProperty,
      onVolumeDragStart: () => model.beginStress(),
      onVolumeDragEnd: (oldVolume, newVolume) => {
        const markers = strings.markers;
        model.endStress(
          "volume",
          (newVolume < oldVolume ? markers.compressStringProperty : markers.expandStringProperty).value,
        );
        respond();
      },
    });
    // Positioned by its origin, not its bounds, which change as the piston moves.
    this.particleBox.x = LEFT_X;
    this.particleBox.y = PARTICLE_BOX_Y;

    this.readouts = new MixtureReadoutsNode(mixture, scene.particles, 300);
    this.readouts.left = SCREEN_VIEW_MARGIN;
    this.readouts.top = this.particleBox.bottom + 8;

    const gauge = new QKGaugeNode(mixture, scene.formProperty, 280);
    gauge.left = LEFT_X;
    gauge.top = this.readouts.bottom + 14;

    const timeControl = createTimeControl(scene.timer.isPlayingProperty, scene.timeSpeedProperty, () =>
      scene.advance(1 / 30),
    );

    // ── Chart ───────────────────────────────────────────────────────────────────
    const speciesTraces = (): ChartTrace[] =>
      mixture.reaction.species.map((s, i) => ({
        color: speciesStyleIn(mixture.reaction, i).color,
        label: `[${s.formula}]`,
        visible: !s.bulk,
      }));
    const chart = new TimeChartNode(
      scene.concentrationRecord,
      speciesTraces(),
      {
        title: common.concentrationChart.titleStringProperty,
        xAxis: common.concentrationChart.xAxisStringProperty,
        yAxis: common.concentrationChart.yAxisStringProperty,
      },
      CHART_WIDTH,
      CHART_HEIGHT,
      60,
    );
    chart.x = CHART_LEFT;
    chart.y = CHART_TOP;
    mixture.reactionProperty.lazyLink(() => chart.setTraces(speciesTraces()));

    // ── Explanation and prediction ──────────────────────────────────────────────
    const explanation = new StressExplanationNode(model, MIDDLE_PANEL_WIDTH - 24);
    const explanationPanel = new EquilibriumLabPanel(
      new VBox({
        align: "left",
        spacing: 6,
        children: [heading(strings.explanationHeadingStringProperty, 300), explanation],
      }),
      { minWidth: MIDDLE_PANEL_WIDTH, maxWidth: MIDDLE_PANEL_WIDTH },
    );
    const predictCheckbox = checkbox(model.predictFirstProperty, strings.predictFirstStringProperty, 300);
    const predictionRadio = radioGroup<ShiftDirection | null>(
      model.predictionProperty,
      [
        { value: "left", label: strings.predictLeftStringProperty },
        { value: "none", label: strings.predictNoneStringProperty },
        { value: "right", label: strings.predictRightStringProperty },
      ],
      a11y.predictionRadioStringProperty,
      110,
      "horizontal",
    );
    const waitingProperty = new DerivedProperty(
      [model.predictFirstProperty, model.predictionProperty],
      (predictFirst, prediction) => predictFirst && prediction === null,
    );
    const predictionBox = new VBox({
      align: "left",
      spacing: 6,
      children: [
        heading(strings.predictionHeadingStringProperty, 300),
        predictionRadio,
        new Node({ children: [note(strings.predictPromptStringProperty, 340)], visibleProperty: waitingProperty }),
      ],
      visibleProperty: model.predictFirstProperty,
    });
    const predictionPanel = new EquilibriumLabPanel(
      new VBox({ align: "left", spacing: 8, children: [predictCheckbox, predictionBox] }),
      { minWidth: MIDDLE_PANEL_WIDTH, maxWidth: MIDDLE_PANEL_WIDTH },
    );
    const middleColumn = new VBox({
      align: "left",
      spacing: PANEL_SPACING,
      children: [explanationPanel, predictionPanel],
    });
    middleColumn.boundsProperty.link(() => {
      middleColumn.left = CHART_LEFT - 44;
      middleColumn.top = CHART_TOP + CHART_HEIGHT + 42;
    });

    // ── Reaction panel ──────────────────────────────────────────────────────────
    const reactionMenu = comboBox(
      model.reactionIdProperty,
      reactionChoices(REACTION_IDS),
      listParent,
      common.a11y.reactionMenuStringProperty,
      SIDE_CONTENT_WIDTH,
    );
    const formRadio = radioGroup(
      scene.formProperty,
      [
        { value: EquilibriumForm.KC, label: common.formKcPlainStringProperty, display: common.formKcStringProperty },
        { value: EquilibriumForm.KP, label: common.formKpPlainStringProperty, display: common.formKpStringProperty },
      ],
      common.a11y.formRadioStringProperty,
      SIDE_CONTENT_WIDTH,
    );
    const isGasProperty = new DerivedProperty([mixture.reactionProperty], (reaction) => reaction.isGas);
    const reactionPanel = new EquilibriumLabPanel(
      new VBox({
        align: "left",
        spacing: 8,
        children: [
          heading(common.reactionHeadingStringProperty, SIDE_CONTENT_WIDTH),
          reactionMenu,
          new VBox({
            align: "left",
            spacing: 4,
            children: [heading(common.formHeadingStringProperty, SIDE_CONTENT_WIDTH), formRadio],
            visibleProperty: isGasProperty,
          }),
        ],
      }),
      { minWidth: SIDE_COLUMN_WIDTH, maxWidth: SIDE_COLUMN_WIDTH },
    );

    // ── Stresses ────────────────────────────────────────────────────────────────
    const stressControls = new StressControlsNode(model, stressEnabledProperty, SIDE_CONTENT_WIDTH, respond);

    // The checkbox drives a view-side copy, so turning the catalyst on or off goes through the model
    // as a stress, while Reset and new reactions (which clear it directly) are not marked.
    const catalystCheckboxProperty = new BooleanProperty(mixture.catalystProperty.value);
    let syncing = false;
    mixture.catalystProperty.link((on) => {
      syncing = true;
      catalystCheckboxProperty.value = on;
      syncing = false;
    });
    catalystCheckboxProperty.lazyLink((on) => {
      if (!syncing) {
        const markers = strings.markers;
        model.setCatalyst(on, (on ? markers.catalystOnStringProperty : markers.catalystOffStringProperty).value);
        respond();
      }
    });
    const catalystCheckbox = checkbox(catalystCheckboxProperty, strings.catalystStringProperty, SIDE_CONTENT_WIDTH);
    catalystCheckbox.enabledProperty = stressEnabledProperty;
    const restartButton = pushButton(strings.restartStringProperty, () => {
      model.startAtEquilibrium();
      this.addAccessibleResponse(a11y.restartedStringProperty.value);
    });
    const stressPanel = new EquilibriumLabPanel(
      new VBox({
        align: "left",
        spacing: 8,
        children: [
          heading(strings.stressesHeadingStringProperty, SIDE_CONTENT_WIDTH),
          stressControls,
          catalystCheckbox,
          restartButton,
        ],
      }),
      { minWidth: SIDE_COLUMN_WIDTH, maxWidth: SIDE_COLUMN_WIDTH },
    );
    const sideColumn = new VBox({
      align: "center",
      spacing: PANEL_SPACING,
      children: [reactionPanel, stressPanel, timeControl],
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
      gauge,
      chart,
      middleColumn,
      sideColumn,
      resetAllButton,
      listParent,
    ];
    this.addChild(
      new Node({
        pdomOrder: [
          reactionMenu,
          formRadio,
          predictCheckbox,
          predictionRadio,
          stressControls,
          ...(this.particleBox.pistonHandle ? [this.particleBox.pistonHandle] : []),
          catalystCheckbox,
          restartButton,
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
  }
}
