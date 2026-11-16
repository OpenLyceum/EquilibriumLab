import { APPROACH_SCREEN_VIEW_SETTINGS } from "../../EquilibriumLabConstants.js";
/**
 * ApproachScreenView.ts
 *
 * Approach screen layout: the equation and the particle box on the left with the Q/K gauge and
 * the readouts under them, the concentration and rate charts in the middle, and the reaction,
 * starting-concentration and generic-reaction controls on the right with the time controls.
 */

import { BooleanProperty, DerivedProperty, Multilink, type TReadOnlyProperty } from "scenerystack/axon";
import { optionize } from "scenerystack/phet-core";
import { HBox, Node, VBox } from "scenerystack/scenery";
import { NumberControl, ResetAllButton } from "scenerystack/scenery-phet";
import { ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/EquilibriumLabButtonOptions.js";
import { EQUILIBRIUM_LAB_NUMBER_CONTROL_OPTIONS } from "../../common/EquilibriumLabControlOptions.js";
import { EquilibriumLabPanel } from "../../common/EquilibriumLabPanel.js";
import { EquilibriumForm } from "../../common/model/EquilibriumForm.js";
import { REACTION_IDS } from "../../common/model/Reactions.js";
import { type ShiftDirection, shiftDirection } from "../../common/model/shiftDirection.js";
import { CONTROL_FONT, checkbox, comboBox, heading, pushButton, radioGroup } from "../../common/view/ControlFactory.js";
import { createTimeControl } from "../../common/view/createTimeControl.js";
import { scientific, significant } from "../../common/view/formatValues.js";
import { MixtureReadoutsNode } from "../../common/view/MixtureReadoutsNode.js";
import { ParticleBoxNode } from "../../common/view/ParticleBoxNode.js";
import { QKGaugeNode } from "../../common/view/QKGaugeNode.js";
import { QuotientSummaryContent } from "../../common/view/QuotientSummaryContent.js";
import { ReactionEquationNode } from "../../common/view/ReactionEquationNode.js";
import { reactionChoices } from "../../common/view/reactionChoices.js";
import { speciesStyleIn } from "../../common/view/speciesStyles.js";
import { type ChartTrace, TimeChartNode } from "../../common/view/TimeChartNode.js";
import EquilibriumLabColors from "../../EquilibriumLabColors.js";
import { PANEL_SPACING, SCREEN_VIEW_MARGIN, SIDE_COLUMN_WIDTH } from "../../EquilibriumLabConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { ApproachModel } from "../model/ApproachModel.js";
import { StartingConcentrationsNode } from "./StartingConcentrationsNode.js";

type SelfOptions = {
  /** Preferences: ring each molecule as it forms. */
  showReactionFlashesProperty: TReadOnlyProperty<boolean>;
};

export type ApproachScreenViewOptions = SelfOptions & ScreenViewOptions;

const BOX_WIDTH_PX: number = APPROACH_SCREEN_VIEW_SETTINGS.BOX_WIDTH_PX;
const LEFT_X = SCREEN_VIEW_MARGIN + 14;
const PARTICLE_BOX_Y: number = APPROACH_SCREEN_VIEW_SETTINGS.PARTICLE_BOX_Y;
const CHART_LEFT: number = APPROACH_SCREEN_VIEW_SETTINGS.CHART_LEFT;
const CHART_WIDTH: number = APPROACH_SCREEN_VIEW_SETTINGS.CHART_WIDTH;
const CONCENTRATION_CHART_TOP: number = APPROACH_SCREEN_VIEW_SETTINGS.CONCENTRATION_CHART_TOP;
const CONCENTRATION_CHART_HEIGHT: number = APPROACH_SCREEN_VIEW_SETTINGS.CONCENTRATION_CHART_HEIGHT;
const RATE_CHART_TOP: number = APPROACH_SCREEN_VIEW_SETTINGS.RATE_CHART_TOP;
const RATE_CHART_HEIGHT: number = APPROACH_SCREEN_VIEW_SETTINGS.RATE_CHART_HEIGHT;
const SIDE_CONTENT_WIDTH = SIDE_COLUMN_WIDTH - 24;

export class ApproachScreenView extends ScreenView {
  private readonly particleBox: ParticleBoxNode;
  private readonly readouts: MixtureReadoutsNode;
  private readonly showEquilibriumProperty = new BooleanProperty(false);

  public constructor(model: ApproachModel, providedOptions: ApproachScreenViewOptions) {
    const options = optionize<ApproachScreenViewOptions, SelfOptions, ScreenViewOptions>()(
      {
        screenSummaryContent: new QuotientSummaryContent(
          model.scene,
          StringManager.getInstance().getApproachA11yStrings(),
        ),
      },
      providedOptions,
    );
    super(options);

    const strings = StringManager.getInstance().getApproachStrings();
    const common = StringManager.getInstance().getCommonStrings();
    const a11y = StringManager.getInstance().getApproachA11yStrings();
    const scene = model.scene;
    const mixture = scene.mixture;
    const listParent = new Node();

    // ── Equation, particle box, gauge ───────────────────────────────────────────
    const equation = new ReactionEquationNode(mixture.reactionProperty, scene.formProperty, 680);
    equation.left = SCREEN_VIEW_MARGIN;
    equation.top = SCREEN_VIEW_MARGIN - APPROACH_SCREEN_VIEW_SETTINGS.CONSTRUCTOR_TOP_OFFSET;

    this.particleBox = new ParticleBoxNode(mixture, scene.particles, BOX_WIDTH_PX, {
      showFlashesProperty: options.showReactionFlashesProperty,
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

    // ── Charts ──────────────────────────────────────────────────────────────────
    const speciesTraces = (): ChartTrace[] =>
      model.reaction.species.map((s, i) => ({
        color: speciesStyleIn(model.reaction, i).color,
        label: `[${s.formula}]`,
        visible: !s.bulk,
      }));
    const concentrationChart = new TimeChartNode(
      scene.concentrationRecord,
      speciesTraces(),
      {
        title: common.concentrationChart.titleStringProperty,
        xAxis: common.concentrationChart.xAxisStringProperty,
        yAxis: common.concentrationChart.yAxisStringProperty,
      },
      CHART_WIDTH,
      CONCENTRATION_CHART_HEIGHT,
    );
    concentrationChart.x = CHART_LEFT;
    concentrationChart.y = CONCENTRATION_CHART_TOP;
    const rateChart = new TimeChartNode(
      scene.rateRecord,
      [
        { color: EquilibriumLabColors.forwardRateColorProperty, label: common.rateChart.forwardStringProperty },
        { color: EquilibriumLabColors.reverseRateColorProperty, label: common.rateChart.reverseStringProperty },
      ],
      {
        title: common.rateChart.titleStringProperty,
        xAxis: common.rateChart.xAxisStringProperty,
        yAxis: common.rateChart.yAxisStringProperty,
      },
      CHART_WIDTH,
      RATE_CHART_HEIGHT,
    );
    rateChart.x = CHART_LEFT;
    rateChart.y = RATE_CHART_TOP;

    const updateEquilibriumLines = () => {
      concentrationChart.setReferenceValues(
        this.showEquilibriumProperty.value
          ? mixture.getEquilibriumAmounts().map((n, i) => (model.reaction.species[i]?.bulk ? null : n / mixture.volume))
          : [],
      );
    };
    mixture.reactionProperty.lazyLink(() => concentrationChart.setTraces(speciesTraces()));
    mixture.resetEmitter.addListener(updateEquilibriumLines);
    Multilink.multilinkAny([this.showEquilibriumProperty, mixture.reactionProperty], updateEquilibriumLines);
    const showEquilibriumCheckbox = checkbox(
      this.showEquilibriumProperty,
      common.showEquilibriumStringProperty,
      APPROACH_SCREEN_VIEW_SETTINGS.SHOW_EQUILIBRIUM_CHECKBOX_MAX_WIDTH,
    );
    showEquilibriumCheckbox.left = CHART_LEFT;
    showEquilibriumCheckbox.top = CONCENTRATION_CHART_TOP + CONCENTRATION_CHART_HEIGHT + 38;

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
    const formBox = new VBox({
      align: "left",
      spacing: APPROACH_SCREEN_VIEW_SETTINGS.FORM_BOX_SPACING,
      children: [heading(common.formHeadingStringProperty, SIDE_CONTENT_WIDTH), formRadio],
      visibleProperty: isGasProperty,
    });
    const reactionPanel = new EquilibriumLabPanel(
      new VBox({
        align: "left",
        spacing: APPROACH_SCREEN_VIEW_SETTINGS.REACTION_PANEL_SPACING,
        children: [heading(common.reactionHeadingStringProperty, SIDE_CONTENT_WIDTH), reactionMenu, formBox],
      }),
      { minWidth: SIDE_COLUMN_WIDTH, maxWidth: SIDE_COLUMN_WIDTH },
    );

    // ── Starting concentrations ─────────────────────────────────────────────────
    const concentrations = new StartingConcentrationsNode(model, SIDE_CONTENT_WIDTH);
    const restarted = () => this.addAccessibleResponse(a11y.responses.restartedStringProperty.value);
    const reactantsButton = pushButton(strings.reactantsOnlyStringProperty, () => {
      model.startFrom("reactants");
      restarted();
    });
    const productsButton = pushButton(strings.productsOnlyStringProperty, () => {
      model.startFrom("products");
      restarted();
    });
    const randomButton = pushButton(strings.randomMixtureStringProperty, () => {
      model.startFrom("random");
      restarted();
    });

    // Generic reactions: K and kf.
    const logKControl = new NumberControl(
      strings.equilibriumConstantStringProperty,
      model.genericLogKProperty,
      model.genericLogKProperty.range,
      {
        ...EQUILIBRIUM_LAB_NUMBER_CONTROL_OPTIONS,
        delta: APPROACH_SCREEN_VIEW_SETTINGS.LOG_K_CONTROL_DELTA,
        titleNodeOptions: {
          font: CONTROL_FONT,
          fill: EquilibriumLabColors.textColorProperty,
          maxWidth: APPROACH_SCREEN_VIEW_SETTINGS.LOG_K_CONTROL_MAX_WIDTH,
        },
        numberDisplayOptions: {
          numberFormatter: (value: number) =>
            scientific(10 ** value, APPROACH_SCREEN_VIEW_SETTINGS.LOG_K_CONTROL_DIGITS),
          useRichText: true,
        },
        sliderOptions: {
          ...EQUILIBRIUM_LAB_NUMBER_CONTROL_OPTIONS.sliderOptions,
          keyboardStep: APPROACH_SCREEN_VIEW_SETTINGS.LOG_K_CONTROL_KEYBOARD_STEP,
          shiftKeyboardStep: APPROACH_SCREEN_VIEW_SETTINGS.LOG_K_CONTROL_SHIFT_KEYBOARD_STEP,
          pageKeyboardStep: 1,
        },
        accessibleName: strings.equilibriumConstantStringProperty,
      },
    );
    const kfControl = new NumberControl(
      strings.forwardRateConstantStringProperty,
      model.genericForwardRateProperty,
      model.genericForwardRateProperty.range,
      {
        ...EQUILIBRIUM_LAB_NUMBER_CONTROL_OPTIONS,
        delta: APPROACH_SCREEN_VIEW_SETTINGS.KF_CONTROL_DELTA,
        titleNodeOptions: {
          font: CONTROL_FONT,
          fill: EquilibriumLabColors.textColorProperty,
          maxWidth: APPROACH_SCREEN_VIEW_SETTINGS.KF_CONTROL_MAX_WIDTH,
        },
        numberDisplayOptions: {
          numberFormatter: (value: number) => significant(value, APPROACH_SCREEN_VIEW_SETTINGS.KF_CONTROL_DIGITS),
        },
        sliderOptions: {
          ...EQUILIBRIUM_LAB_NUMBER_CONTROL_OPTIONS.sliderOptions,
          keyboardStep: APPROACH_SCREEN_VIEW_SETTINGS.KF_CONTROL_KEYBOARD_STEP,
          shiftKeyboardStep: APPROACH_SCREEN_VIEW_SETTINGS.KF_CONTROL_SHIFT_KEYBOARD_STEP,
          pageKeyboardStep: APPROACH_SCREEN_VIEW_SETTINGS.KF_CONTROL_PAGE_KEYBOARD_STEP,
        },
        accessibleName: strings.forwardRateConstantStringProperty,
      },
    );
    const isGenericProperty = new DerivedProperty(
      [mixture.reactionProperty],
      (reaction) => reaction.family === "generic",
    );
    const genericBox = new VBox({
      align: "left",
      spacing: APPROACH_SCREEN_VIEW_SETTINGS.GENERIC_BOX_SPACING,
      children: [heading(strings.genericHeadingStringProperty, SIDE_CONTENT_WIDTH), logKControl, kfControl],
      visibleProperty: isGenericProperty,
    });

    const startPanel = new EquilibriumLabPanel(
      new VBox({
        align: "left",
        spacing: APPROACH_SCREEN_VIEW_SETTINGS.START_PANEL_SPACING,
        children: [
          heading(strings.startingHeadingStringProperty, SIDE_CONTENT_WIDTH),
          concentrations,
          new HBox({
            spacing: APPROACH_SCREEN_VIEW_SETTINGS.START_PANEL_ITEM_3_SPACING,
            children: [reactantsButton, productsButton],
          }),
          randomButton,
          genericBox,
        ],
      }),
      { minWidth: SIDE_COLUMN_WIDTH, maxWidth: SIDE_COLUMN_WIDTH },
    );
    const sideColumn = new VBox({
      align: "center",
      spacing: PANEL_SPACING,
      children: [reactionPanel, startPanel],
      right: this.layoutBounds.maxX - SCREEN_VIEW_MARGIN,
      top: SCREEN_VIEW_MARGIN,
    });
    sideColumn.boundsProperty.lazyLink(() => {
      sideColumn.right = this.layoutBounds.maxX - SCREEN_VIEW_MARGIN;
      sideColumn.top = SCREEN_VIEW_MARGIN;
    });

    const timeControl = createTimeControl(scene.timer.isPlayingProperty, scene.timeSpeedProperty, () =>
      scene.advance(1 / 30),
    );
    timeControl.centerX = CHART_LEFT + CHART_WIDTH / 2;
    timeControl.bottom = this.layoutBounds.maxY - SCREEN_VIEW_MARGIN;

    // Announce equilibrium once each time the mixture gets there.
    let lastDirection: ShiftDirection = shiftDirection(mixture.lnQOverK);
    mixture.changedEmitter.addListener(() => {
      const direction = shiftDirection(mixture.lnQOverK);
      if (direction === "none" && lastDirection !== "none") {
        this.addAccessibleResponse(common.a11y.reachedEquilibriumStringProperty.value);
      }
      lastDirection = direction;
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
      concentrationChart,
      rateChart,
      showEquilibriumCheckbox,
      sideColumn,
      timeControl,
      resetAllButton,
      listParent,
    ];
    this.addChild(
      new Node({
        pdomOrder: [
          reactionMenu,
          formRadio,
          concentrations,
          reactantsButton,
          productsButton,
          randomButton,
          logKControl,
          kfControl,
          showEquilibriumCheckbox,
          timeControl,
          resetAllButton,
        ],
      }),
    );
  }

  public reset(): void {
    this.showEquilibriumProperty.reset();
  }

  public override step(dt: number): void {
    this.particleBox.step();
    this.readouts.step(dt);
  }
}
