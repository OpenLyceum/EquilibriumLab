/**
 * ControlFactory.ts
 *
 * Themed builders for panel controls (copied from Electrochemistry). `accessibleName` is a required
 * argument, so a control without one is a compile error rather than a silent gap.
 */

import type { PhetioProperty, Property, TReadOnlyProperty } from "scenerystack/axon";
import type { Range } from "scenerystack/dot";
import { HBox, Node, RichText, Text, VBox } from "scenerystack/scenery";
import { NumberControl, PhetFont } from "scenerystack/scenery-phet";
import { AquaRadioButtonGroup, Checkbox, ComboBox, type ComboBoxItem, TextPushButton } from "scenerystack/sun";
import EquilibriumLabColors from "../../EquilibriumLabColors.js";
import {
  EQUILIBRIUM_LAB_COMBO_BOX_OPTIONS,
  FLAT_PANEL_PUSH_BUTTON_OPTIONS,
  LIGHT_SURFACE_TEXT_FILL,
} from "../EquilibriumLabButtonOptions.js";
import {
  EQUILIBRIUM_LAB_CHECKBOX_OPTIONS,
  EQUILIBRIUM_LAB_NUMBER_CONTROL_OPTIONS,
} from "../EquilibriumLabControlOptions.js";

export const CONTROL_FONT = new PhetFont(13);
export const SMALL_FONT = new PhetFont(12);
export const HEADING_FONT = new PhetFont({ size: 14, weight: "bold" });

export function heading(text: TReadOnlyProperty<string>, maxWidth: number): Text {
  return new Text(text, { font: HEADING_FONT, fill: EquilibriumLabColors.textColorProperty, maxWidth });
}

/** A panel label; RichText so labels can carry markup such as Z<sub>eff</sub>. */
export function label(text: TReadOnlyProperty<string> | string, maxWidth: number): RichText {
  return new RichText(text, { font: CONTROL_FONT, fill: EquilibriumLabColors.textColorProperty, maxWidth });
}

/** A wrapped paragraph of muted explanatory text. */
export function note(text: TReadOnlyProperty<string>, width: number): RichText {
  return new RichText(text, {
    font: SMALL_FONT,
    fill: EquilibriumLabColors.mutedTextColorProperty,
    lineWrap: width,
  });
}

/**
 * A menu or radio choice. `label` is plain text and names the item for screen readers; `display`,
 * if given, is RichText shown instead (e.g. a name with its chemical formula).
 */
export type ComboChoice<T> = {
  readonly value: T;
  readonly label: TReadOnlyProperty<string>;
  readonly display?: TReadOnlyProperty<string>;
};

export function comboBox<T>(
  property: PhetioProperty<T>,
  choices: readonly ComboChoice<T>[],
  listParent: Node,
  accessibleName: TReadOnlyProperty<string>,
  maxWidth: number,
): ComboBox<T> {
  const items: ComboBoxItem<T>[] = choices.map((choice) => ({
    value: choice.value,
    createNode: () =>
      new RichText(choice.display ?? choice.label, {
        font: CONTROL_FONT,
        fill: LIGHT_SURFACE_TEXT_FILL,
        maxWidth: maxWidth - 40,
      }),
    accessibleName: choice.label,
  }));
  return new ComboBox(property, items, listParent, {
    ...EQUILIBRIUM_LAB_COMBO_BOX_OPTIONS,
    xMargin: 8,
    yMargin: 3,
    cornerRadius: 4,
    accessibleName,
  });
}

/** A label above a control, left-aligned. */
export function labeled(text: TReadOnlyProperty<string>, control: Node, maxWidth: number): VBox {
  return new VBox({ align: "left", spacing: 3, children: [label(text, maxWidth), control] });
}

export function checkbox(
  property: Property<boolean>,
  text: TReadOnlyProperty<string>,
  maxWidth: number,
  accessibleName = text,
): Checkbox {
  return new Checkbox(property, label(text, maxWidth), {
    ...EQUILIBRIUM_LAB_CHECKBOX_OPTIONS,
    accessibleName,
  });
}

export function pushButton(
  text: TReadOnlyProperty<string>,
  listener: () => void,
  accessibleName = text,
): TextPushButton {
  return new TextPushButton(text, {
    ...FLAT_PANEL_PUSH_BUTTON_OPTIONS,
    font: CONTROL_FONT,
    textFill: LIGHT_SURFACE_TEXT_FILL,
    xMargin: 8,
    yMargin: 4,
    maxTextWidth: 180,
    listener,
    accessibleName,
  });
}

export function radioGroup<T>(
  property: PhetioProperty<T>,
  choices: readonly ComboChoice<T>[],
  accessibleName: TReadOnlyProperty<string>,
  maxWidth: number,
  orientation: "vertical" | "horizontal" = "vertical",
): AquaRadioButtonGroup<T> {
  return new AquaRadioButtonGroup(
    property,
    choices.map((choice) => ({
      value: choice.value,
      createNode: () => label(choice.display ?? choice.label, maxWidth),
      options: { accessibleName: choice.label },
    })),
    {
      orientation,
      spacing: orientation === "vertical" ? 4 : 10,
      radioButtonOptions: { radius: 6, selectedColor: EquilibriumLabColors.accentColorProperty },
      accessibleName,
    },
  );
}

/** Two checkboxes side by side (or one) for compact panels. */
export function pairRow(left: Node, right: Node | null, columnWidth: number): HBox {
  return new HBox({
    spacing: 8,
    align: "center",
    children: right ? [sized(left, columnWidth), right] : [left],
  });
}

function sized(node: Node, width: number): Node {
  return new Node({ children: [node], localBounds: node.localBounds.withMaxX(Math.max(node.localBounds.maxX, width)) });
}

export type NumberControlChoice = {
  readonly delta: number;
  readonly decimalPlaces: number;
  /** Readout pattern with a {{value}} placeholder, e.g. "{{value}} M". */
  readonly valuePattern?: TReadOnlyProperty<string>;
  readonly accessibleName?: TReadOnlyProperty<string>;
};

/** A themed NumberControl whose keyboard steps match its arrow buttons. */
export function numberControl(
  title: TReadOnlyProperty<string>,
  property: Property<number>,
  range: Range,
  choice: NumberControlChoice,
  maxWidth: number,
): NumberControl {
  return new NumberControl(title, property, range, {
    ...EQUILIBRIUM_LAB_NUMBER_CONTROL_OPTIONS,
    delta: choice.delta,
    titleNodeOptions: { font: CONTROL_FONT, fill: EquilibriumLabColors.textColorProperty, maxWidth: maxWidth - 70 },
    numberDisplayOptions: {
      decimalPlaces: choice.decimalPlaces,
      ...(choice.valuePattern && { valuePattern: choice.valuePattern }),
    },
    sliderOptions: {
      ...EQUILIBRIUM_LAB_NUMBER_CONTROL_OPTIONS.sliderOptions,
      keyboardStep: choice.delta * 10,
      shiftKeyboardStep: choice.delta,
      pageKeyboardStep: choice.delta * 50,
    },
    accessibleName: choice.accessibleName ?? title,
  });
}
