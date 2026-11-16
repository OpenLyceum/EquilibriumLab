import { ICE_TABLE_SCREEN_VIEW_SETTINGS } from "../../EquilibriumLabConstants.js";
/**
 * ICETableScreenView.ts
 *
 * ICE Table screen layout: the equation, what is given and the task at the top left; the ICE table
 * under them with the x (and K) entries, the Check / Show solution / Run it buttons and the
 * feedback; and on the right the problem controls, the concentration chart that Run it fills, and
 * the time controls.
 */

import { DerivedProperty, Multilink, Property } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { type EmptySelfOptions, optionize } from "scenerystack/phet-core";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, Node, RichText, VBox } from "scenerystack/scenery";
import { Keypad, PhetFont, ResetAllButton } from "scenerystack/scenery-phet";
import { KeypadDialog, ScreenView, type ScreenViewOptions } from "scenerystack/sim";
import { FLAT_RESET_ALL_BUTTON_OPTIONS } from "../../common/EquilibriumLabButtonOptions.js";
import { EquilibriumLabPanel } from "../../common/EquilibriumLabPanel.js";
import { EquilibriumForm } from "../../common/model/EquilibriumForm.js";
import { comboBox, heading, label, note, pushButton, radioGroup } from "../../common/view/ControlFactory.js";
import { createTimeControl } from "../../common/view/createTimeControl.js";
import { scientific, significant } from "../../common/view/formatValues.js";
import { markupToSpeech } from "../../common/view/markupToSpeech.js";
import { ReactionEquationNode } from "../../common/view/ReactionEquationNode.js";
import { reactionChoices } from "../../common/view/reactionChoices.js";
import { speciesStyleIn } from "../../common/view/speciesStyles.js";
import { type ChartTrace, TimeChartNode } from "../../common/view/TimeChartNode.js";
import EquilibriumLabColors from "../../EquilibriumLabColors.js";
import { FONT_SIZE, SCREEN_VIEW_MARGIN, SIDE_COLUMN_WIDTH } from "../../EquilibriumLabConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { ICE_REACTION_IDS, type ICETableModel } from "../model/ICETableModel.js";
import { feedbackLines, ICEFeedbackNode } from "./ICEFeedbackNode.js";
import { ICETableNode } from "./ICETableNode.js";
import { ICETableScreenSummaryContent } from "./ICETableScreenSummaryContent.js";
import { NumberEntryNode } from "./NumberEntryNode.js";

export type ICETableScreenViewOptions = ScreenViewOptions;

const LEFT_WIDTH: number = ICE_TABLE_SCREEN_VIEW_SETTINGS.LEFT_WIDTH;
const TABLE_TOP: number = ICE_TABLE_SCREEN_VIEW_SETTINGS.TABLE_TOP;
const CHART_LEFT: number = ICE_TABLE_SCREEN_VIEW_SETTINGS.CHART_LEFT;
const CHART_WIDTH: number = ICE_TABLE_SCREEN_VIEW_SETTINGS.CHART_WIDTH;
const CHART_TOP: number = ICE_TABLE_SCREEN_VIEW_SETTINGS.CHART_TOP;
const CHART_HEIGHT: number = ICE_TABLE_SCREEN_VIEW_SETTINGS.CHART_HEIGHT;
const SIDE_CONTENT_WIDTH = SIDE_COLUMN_WIDTH - 24;

/** Largest |x| and K the keypad accepts. */
const X_ENTRY_LIMIT: number = ICE_TABLE_SCREEN_VIEW_SETTINGS.X_ENTRY_LIMIT;
const K_ENTRY_LIMIT: number = ICE_TABLE_SCREEN_VIEW_SETTINGS.K_ENTRY_LIMIT;

export class ICETableScreenView extends ScreenView {
  public constructor(model: ICETableModel, providedOptions?: ICETableScreenViewOptions) {
    const options = optionize<ICETableScreenViewOptions, EmptySelfOptions, ScreenViewOptions>()(
      { screenSummaryContent: new ICETableScreenSummaryContent(model) },
      providedOptions,
    );
    super(options);

    const strings = StringManager.getInstance().getICETableStrings();
    const common = StringManager.getInstance().getCommonStrings();
    const a11y = StringManager.getInstance().getICETableA11yStrings();
    const scene = model.scene;
    const mixture = scene.mixture;
    const listParent = new Node();

    // ── Problem statement ───────────────────────────────────────────────────────
    // ICE problems are always in Kc: the table holds concentrations.
    const kcProperty = new Property(EquilibriumForm.KC);
    const equation = new ReactionEquationNode(mixture.reactionProperty, kcProperty, LEFT_WIDTH);
    equation.left = SCREEN_VIEW_MARGIN;
    equation.top = SCREEN_VIEW_MARGIN - ICE_TABLE_SCREEN_VIEW_SETTINGS.CONSTRUCTOR_TOP_OFFSET;
    const given = new RichText("", {
      font: new PhetFont({ size: FONT_SIZE.readout, weight: "bold" }),
      fill: EquilibriumLabColors.kMarkerColorProperty,
      maxWidth: LEFT_WIDTH,
    });
    const task = new RichText("", {
      font: new PhetFont(FONT_SIZE.control),
      fill: EquilibriumLabColors.mutedTextColorProperty,
      lineWrap: LEFT_WIDTH,
    });
    Multilink.multilinkAny(
      [
        model.problemProperty,
        strings.givenKPatternStringProperty,
        strings.givenEquilibriumPatternStringProperty,
        strings.taskFindEquilibriumStringProperty,
        strings.taskFindKStringProperty,
        common.kcSymbols.kStringProperty,
      ],
      () => {
        const problem = model.problem;
        given.string =
          problem.mode === "findEquilibrium"
            ? StringUtils.fillIn(strings.givenKPatternStringProperty.value, {
                k: common.kcSymbols.kStringProperty.value,
                value: scientific(problem.k, ICE_TABLE_SCREEN_VIEW_SETTINGS.K_SCIENTIFIC_DIGITS),
                temperature: significant(
                  problem.temperature,
                  ICE_TABLE_SCREEN_VIEW_SETTINGS.TEMPERATURE_SIGNIFICANT_DIGITS,
                ),
              })
            : StringUtils.fillIn(strings.givenEquilibriumPatternStringProperty.value, {
                formula: problem.reaction.species[problem.givenIndex ?? 0]?.formula ?? "",
                value: significant(problem.givenValue ?? 0, ICE_TABLE_SCREEN_VIEW_SETTINGS.GIVEN_DIGITS),
                temperature: significant(
                  problem.temperature,
                  ICE_TABLE_SCREEN_VIEW_SETTINGS.TEMPERATURE_SIGNIFICANT_DIGITS,
                ),
              });
        task.string = (
          problem.mode === "findEquilibrium"
            ? strings.taskFindEquilibriumStringProperty
            : strings.taskFindKStringProperty
        ).value;
      },
    );
    const statement = new VBox({
      align: "left",
      spacing: ICE_TABLE_SCREEN_VIEW_SETTINGS.STATEMENT_SPACING,
      children: [given, task],
    });
    statement.left = SCREEN_VIEW_MARGIN;
    statement.top = equation.bottom + 8;

    // ── Table, entries, buttons, feedback ───────────────────────────────────────
    const table = new ICETableNode(model, LEFT_WIDTH);
    table.left = SCREEN_VIEW_MARGIN;
    table.top = TABLE_TOP;

    const keypadDialog = new KeypadDialog({
      keypadLayout: Keypad.PositiveAndNegativeFloatingPointLayout,
      keypadOptions: { accumulatorOptions: { maxDigits: 9, maxDigitsRightOfMantissa: 7 } },
    });
    const xEntry = new NumberEntryNode(
      model.xEntryProperty,
      () => new Range(-X_ENTRY_LIMIT, X_ENTRY_LIMIT),
      keypadDialog,
      a11y.xEntryStringProperty,
      130,
    );
    const kEntry = new NumberEntryNode(
      model.kEntryProperty,
      () => new Range(0, K_ENTRY_LIMIT),
      keypadDialog,
      a11y.kEntryStringProperty,
      130,
    );
    const findKProperty = new DerivedProperty([model.problemProperty], (problem) => problem.mode === "findK");
    const kEntryRow = new HBox({
      spacing: ICE_TABLE_SCREEN_VIEW_SETTINGS.K_ENTRY_ROW_SPACING,
      children: [
        label(common.kcSymbols.kStringProperty, ICE_TABLE_SCREEN_VIEW_SETTINGS.K_LABEL_MAX_WIDTH),
        label("=", ICE_TABLE_SCREEN_VIEW_SETTINGS.EQUALS_LABEL_MAX_WIDTH),
        kEntry,
      ],
      visibleProperty: findKProperty,
    });
    const entries = new HBox({
      spacing: ICE_TABLE_SCREEN_VIEW_SETTINGS.ENTRIES_SPACING,
      children: [
        new HBox({
          spacing: ICE_TABLE_SCREEN_VIEW_SETTINGS.ENTRIES_ITEM_1_SPACING,
          children: [
            label(strings.xLabelStringProperty, ICE_TABLE_SCREEN_VIEW_SETTINGS.X_LABEL_LABEL_MAX_WIDTH),
            xEntry,
            label("M", ICE_TABLE_SCREEN_VIEW_SETTINGS.M_LABEL_MAX_WIDTH),
          ],
        }),
        kEntryRow,
      ],
    });

    const feedback = new ICEFeedbackNode(model, LEFT_WIDTH - 24);
    const checkButton = pushButton(strings.checkStringProperty, () => {
      model.check();
      this.addAccessibleResponse(markupToSpeech(feedbackLines(model).texts.join(" ")));
    });
    const solutionButton = pushButton(strings.showSolutionStringProperty, () => {
      model.showSolution();
      this.addAccessibleResponse(markupToSpeech(feedbackLines(model).texts.join(" ")));
    });
    const runButton = pushButton(strings.runItStringProperty, () => model.runIt());
    const buttons = new HBox({
      spacing: ICE_TABLE_SCREEN_VIEW_SETTINGS.BUTTONS_SPACING,
      children: [checkButton, solutionButton, runButton],
    });
    const work = new VBox({
      align: "left",
      spacing: ICE_TABLE_SCREEN_VIEW_SETTINGS.WORK_SPACING,
      children: [entries, buttons],
    });
    work.left = SCREEN_VIEW_MARGIN;
    work.top = TABLE_TOP + 214;

    const feedbackPanel = new EquilibriumLabPanel(
      new VBox({
        align: "left",
        spacing: ICE_TABLE_SCREEN_VIEW_SETTINGS.FEEDBACK_PANEL_SPACING,
        children: [
          heading(
            strings.feedbackHeadingStringProperty,
            ICE_TABLE_SCREEN_VIEW_SETTINGS.FEEDBACK_HEADING_HEADING_MAX_WIDTH,
          ),
          feedback,
        ],
      }),
      { minWidth: LEFT_WIDTH, maxWidth: LEFT_WIDTH },
    );
    feedbackPanel.left = SCREEN_VIEW_MARGIN;
    feedbackPanel.top = work.bottom + 16;

    // ── Problem controls ────────────────────────────────────────────────────────
    const modeRadio = radioGroup(
      model.modeProperty,
      [
        { value: "findEquilibrium" as const, label: strings.findEquilibriumStringProperty },
        { value: "findK" as const, label: strings.findKStringProperty },
      ],
      a11y.modeRadioStringProperty,
      SIDE_CONTENT_WIDTH,
    );
    const reactionMenu = comboBox(
      model.reactionIdProperty,
      reactionChoices(ICE_REACTION_IDS),
      listParent,
      common.a11y.reactionMenuStringProperty,
      SIDE_CONTENT_WIDTH,
    );
    const newProblemButton = pushButton(strings.newProblemStringProperty, () => model.newProblem());
    const problemPanel = new EquilibriumLabPanel(
      new VBox({
        align: "left",
        spacing: ICE_TABLE_SCREEN_VIEW_SETTINGS.PROBLEM_PANEL_SPACING,
        children: [
          heading(strings.problemHeadingStringProperty, SIDE_CONTENT_WIDTH),
          modeRadio,
          heading(common.reactionHeadingStringProperty, SIDE_CONTENT_WIDTH),
          reactionMenu,
          newProblemButton,
        ],
      }),
      { minWidth: SIDE_COLUMN_WIDTH, maxWidth: SIDE_COLUMN_WIDTH },
    );
    problemPanel.right = this.layoutBounds.maxX - SCREEN_VIEW_MARGIN;
    problemPanel.top = SCREEN_VIEW_MARGIN;

    // ── Run-it chart ────────────────────────────────────────────────────────────
    const speciesTraces = (): ChartTrace[] =>
      mixture.reaction.species.map((s, i) => ({
        color: speciesStyleIn(mixture.reaction, i).color,
        label: `[${s.formula}]`,
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
    );
    chart.x = CHART_LEFT;
    chart.y = CHART_TOP;
    mixture.reactionProperty.lazyLink(() => chart.setTraces(speciesTraces()));
    const updateReferences = () => chart.setReferenceValues(model.getEnteredEquilibrium() ?? []);
    model.xEntryProperty.link(updateReferences);
    model.changeRowRebuiltEmitter.addListener(() => {
      for (const property of model.changeCoefficientProperties) {
        property.link(updateReferences);
      }
      updateReferences();
    });
    for (const property of model.changeCoefficientProperties) {
      property.link(updateReferences);
    }
    const runHint = note(strings.runHintStringProperty, CHART_WIDTH + 40);
    runHint.left = CHART_LEFT - ICE_TABLE_SCREEN_VIEW_SETTINGS.CONSTRUCTOR_LEFT_OFFSET;
    runHint.top = CHART_TOP + CHART_HEIGHT + 40;

    const timeControl = createTimeControl(scene.timer.isPlayingProperty, scene.timeSpeedProperty, () =>
      scene.advance(1 / 30),
    );
    timeControl.left = CHART_LEFT - 30;
    timeControl.bottom = this.layoutBounds.maxY - SCREEN_VIEW_MARGIN;

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
      statement,
      table,
      work,
      feedbackPanel,
      problemPanel,
      chart,
      runHint,
      timeControl,
      resetAllButton,
      listParent,
    ];
    this.addChild(
      new Node({
        pdomOrder: [
          table,
          xEntry,
          kEntry,
          checkButton,
          solutionButton,
          runButton,
          modeRadio,
          reactionMenu,
          newProblemButton,
          timeControl,
          resetAllButton,
        ],
      }),
    );
  }

  public reset(): void {
    // No view-only state.
  }
}
