/**
 * ICETableNode.ts
 *
 * The ICE table: a column per species and three rows. I gives the initial concentrations; C holds a
 * picker per species for its change in multiples of x; E is written out as "I + Cx" and, once x is
 * entered, evaluated. In "find K" problems the given equilibrium concentration is shown in its E
 * cell. Rebuilt with each new problem.
 */

import { DerivedProperty, Multilink, Property, type TReadOnlyProperty } from "scenerystack/axon";
import { StringUtils } from "scenerystack/phetcommon";
import { HBox, Line, Node, RichText, Text, VBox } from "scenerystack/scenery";
import { PhetFont } from "scenerystack/scenery-phet";
import { NumberPicker } from "scenerystack/sun";
import { disposeChildren } from "../../common/view/disposeChildren.js";
import { fixed, scientific, significant } from "../../common/view/formatValues.js";
import { speciesName } from "../../common/view/reactionChoices.js";
import EquilibriumLabColors from "../../EquilibriumLabColors.js";
import { FONT_SIZE } from "../../EquilibriumLabConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import { CHANGE_COEFFICIENT_RANGE, type ICETableModel } from "../model/ICETableModel.js";

/** Width of the row-label column and of each species column (px). */
const LABEL_WIDTH = 132;
const ROW_HEIGHT = 50;

/** "0.100 − 2x", "2x", "0.0400". */
export function changeExpression(initial: number, coefficient: number): string {
  const c0 = initial === 0 ? "" : significant(initial, 3);
  if (coefficient === 0) {
    return c0 || "0";
  }
  const magnitude = Math.abs(coefficient) === 1 ? "x" : `${Math.abs(coefficient)}x`;
  if (!c0) {
    return coefficient < 0 ? `−${magnitude}` : magnitude;
  }
  return `${c0} ${coefficient < 0 ? "−" : "+"} ${magnitude}`;
}

export class ICETableNode extends Node {
  private readonly model: ICETableModel;
  private readonly rebuild: () => void;
  private owned: { dispose: () => void }[] = [];

  public constructor(model: ICETableModel, width: number) {
    super();
    this.model = model;
    const strings = StringManager.getInstance().getICETableStrings();
    const a11y = StringManager.getInstance().getICETableA11yStrings();
    const font = new PhetFont(FONT_SIZE.readout);
    const smallFont = new PhetFont(FONT_SIZE.small);
    const text = (value: string | TReadOnlyProperty<string>, maxWidth: number, bold = false) =>
      new RichText(value, {
        font: bold ? new PhetFont({ size: FONT_SIZE.readout, weight: "bold" }) : font,
        fill: EquilibriumLabColors.textColorProperty,
        maxWidth,
      });

    this.rebuild = () => {
      disposeChildren(this);
      for (const item of this.owned) {
        item.dispose();
      }
      this.owned = [];
      const problem = model.problem;
      const reaction = problem.reaction;
      const count = reaction.species.length;
      const columnWidth = (width - LABEL_WIDTH) / count;
      const columnX = (i: number) => LABEL_WIDTH + (i + 0.5) * columnWidth;
      const rowY = (row: number) => (row + 0.5) * ROW_HEIGHT;
      const children: Node[] = [];

      // Row labels.
      const rowLabels: [TReadOnlyProperty<string>, TReadOnlyProperty<string>][] = [
        [strings.rowInitialStringProperty, strings.rowInitialNameStringProperty],
        [strings.rowChangeStringProperty, strings.rowChangeNameStringProperty],
        [strings.rowEquilibriumStringProperty, strings.rowEquilibriumNameStringProperty],
      ];
      rowLabels.forEach(([letter, name], row) => {
        const label = new HBox({
          spacing: 6,
          children: [
            text(letter, 20, true),
            new Text(name, {
              font: smallFont,
              fill: EquilibriumLabColors.mutedTextColorProperty,
              maxWidth: LABEL_WIDTH - 34,
            }),
          ],
        });
        label.left = 0;
        label.centerY = rowY(row + 1);
        children.push(label);
      });

      // Grid lines.
      for (let row = 1; row <= 3; row++) {
        children.push(
          new Line(0, row * ROW_HEIGHT, width, row * ROW_HEIGHT, {
            stroke: EquilibriumLabColors.chartGridColorProperty,
          }),
        );
      }
      children.push(
        new Line(LABEL_WIDTH - 8, 0, LABEL_WIDTH - 8, 4 * ROW_HEIGHT, {
          stroke: EquilibriumLabColors.chartGridColorProperty,
        }),
      );

      reaction.species.forEach((s, i) => {
        // Header and initial row.
        const header = text(`[${s.formula}]`, columnWidth - 8, true);
        header.centerX = columnX(i);
        header.centerY = rowY(0);
        const initial = text(significant(problem.initial[i] ?? 0, 3), columnWidth - 8);
        initial.centerX = columnX(i);
        initial.centerY = rowY(1);

        // Change row: picker × x.
        const coefficient = model.changeCoefficientProperties[i] ?? new Property(0);
        const pickerName = new DerivedProperty(
          [a11y.changePickerPatternStringProperty, speciesName(s.id)],
          (pattern, name) => StringUtils.fillIn(pattern, { name }),
        );
        this.owned.push(pickerName);
        const picker = new NumberPicker(coefficient, new Property(CHANGE_COEFFICIENT_RANGE), {
          font: new PhetFont(FONT_SIZE.readout),
          color: EquilibriumLabColors.accentColorProperty,
          backgroundStroke: EquilibriumLabColors.panelBorderColorProperty,
          xMargin: 6,
          yMargin: 1,
          formatValue: (n: number) => (n > 0 ? `+${n}` : fixed(n, 0)),
          accessibleName: pickerName,
        });
        this.owned.push(picker);
        const change = new HBox({ spacing: 3, children: [picker, text("x", 20)] });
        change.centerX = columnX(i);
        change.centerY = rowY(2);

        // Equilibrium row.
        const expression = text("", columnWidth - 8);
        const value = new RichText("", {
          font: smallFont,
          fill: EquilibriumLabColors.mutedTextColorProperty,
          maxWidth: columnWidth - 8,
        });
        const cell = new VBox({ spacing: 1, children: [expression, value] });
        const multilink = Multilink.multilink([coefficient, model.xEntryProperty], (c, x) => {
          expression.string = changeExpression(problem.initial[i] ?? 0, c);
          const given = problem.givenIndex === i ? problem.givenValue : null;
          value.string =
            given !== null
              ? `= ${significant(given, 3)}`
              : x === null
                ? ""
                : `= ${scientific((problem.initial[i] ?? 0) + c * x, 3)}`;
          // A negative concentration cannot be: flag it.
          const negative = given === null && x !== null && (problem.initial[i] ?? 0) + c * x < 0;
          value.fill =
            given !== null
              ? EquilibriumLabColors.kMarkerColorProperty
              : negative
                ? EquilibriumLabColors.poorColorProperty
                : EquilibriumLabColors.mutedTextColorProperty;
          cell.centerX = columnX(i);
          cell.centerY = rowY(3);
        });
        this.owned.push(multilink);

        children.push(header, initial, change, cell);
      });
      this.children = children;
    };
    model.changeRowRebuiltEmitter.addListener(this.rebuild);
    this.rebuild();
  }

  public override dispose(): void {
    this.model.changeRowRebuiltEmitter.removeListener(this.rebuild);
    for (const item of this.owned) {
      item.dispose();
    }
    super.dispose();
  }
}
