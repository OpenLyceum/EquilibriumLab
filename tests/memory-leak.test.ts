/**
 * Memory-leak regression suite (fleet standard).
 *
 * List every model/view object that links Properties, adds listeners, or owns child
 * nodes, with a factory that builds a fresh instance. The shared harness in
 * tests/helpers/memoryLeak.ts (template-owned) checks that each one is garbage
 * collected after dispose() and leaves no survivors across repeated cycles
 * (idempotentDispose: true also checks a second dispose()). Add sim-specific leak
 * tests below using forceGC().
 *
 * Screen models and views live for the whole sim. What is created and thrown away at runtime:
 * the starting-concentration controls, the Le Chatelier stress controls, the ICE table and the
 * Van 't Hoff temperature control are rebuilt with each reaction or problem, and the chart
 * markers, reference lines and points are rebuilt as data arrive. The parts below link to the
 * mixture, to string Properties or to profile colours.
 */

import { Property } from "scenerystack/axon";
import { Range } from "scenerystack/dot";
import { RichText } from "scenerystack/scenery";
import type { KeypadDialog } from "scenerystack/sim";
import { EquilibriumForm } from "../src/common/model/EquilibriumForm.js";
import { ParticleSystem } from "../src/common/model/ParticleSystem.js";
import { ReactionMixture } from "../src/common/model/ReactionMixture.js";
import { ReactionSceneModel } from "../src/common/model/ReactionSceneModel.js";
import { getReaction } from "../src/common/model/Reactions.js";
import { TimeRecord } from "../src/common/model/TimeRecord.js";
import { TimeModel } from "../src/common/TimeModel.js";
import { MixtureReadoutsNode } from "../src/common/view/MixtureReadoutsNode.js";
import { ParticleBoxNode } from "../src/common/view/ParticleBoxNode.js";
import { QKGaugeNode } from "../src/common/view/QKGaugeNode.js";
import { ReactionEquationNode } from "../src/common/view/ReactionEquationNode.js";
import EquilibriumLabColors from "../src/EquilibriumLabColors.js";
import { ICETableModel } from "../src/ice-table/model/ICETableModel.js";
import { ICEFeedbackNode } from "../src/ice-table/view/ICEFeedbackNode.js";
import { ICETableNode } from "../src/ice-table/view/ICETableNode.js";
import { NumberEntryNode } from "../src/ice-table/view/NumberEntryNode.js";
import { LeChatelierModel } from "../src/le-chatelier/model/LeChatelierModel.js";
import { StressExplanationNode } from "../src/le-chatelier/view/StressExplanationNode.js";
import { VantHoffModel } from "../src/vant-hoff/model/VantHoffModel.js";
import { VantHoffResultsNode } from "../src/vant-hoff/view/VantHoffResultsNode.js";
import { describeDisposalLeaks } from "./helpers/memoryLeak.js";

const mixture = () => new ReactionMixture(getReaction("dinitrogenTetroxide"));

/** Outlive view cases so a missed unlink against the model fails collection. */
const iceTableModel = new ICETableModel();
const leChatelierModel = new LeChatelierModel();
const vantHoffModel = new VantHoffModel();
const numberEntryValueProperty = new Property<number | null>(null);
const numberEntryNameProperty = new Property("x");
/** Keypad is only opened on press; dispose never touches it. */
const keypadStub = { beginEdit: () => undefined } as unknown as KeypadDialog;

describeDisposalLeaks([
  { name: "TimeModel", create: () => new TimeModel(), idempotentDispose: true },
  { name: "TimeRecord", create: () => new TimeRecord(2), idempotentDispose: true },
  { name: "ReactionMixture", create: mixture },
  { name: "ParticleSystem", create: () => new ParticleSystem(mixture()) },
  { name: "ReactionSceneModel", create: () => new ReactionSceneModel(getReaction("haber")) },
  { name: "ParticleBoxNode", create: () => new ParticleBoxNode(mixture(), new ParticleSystem(mixture()), 200) },
  { name: "QKGaugeNode", create: () => new QKGaugeNode(mixture(), new Property(EquilibriumForm.KC), 200) },
  {
    name: "ReactionEquationNode",
    create: () => new ReactionEquationNode(new Property(getReaction("haber")), new Property(EquilibriumForm.KP), 400),
  },
  { name: "MixtureReadoutsNode", create: () => new MixtureReadoutsNode(mixture(), new ParticleSystem(mixture()), 200) },
  {
    name: "chart marker label",
    create: () => new RichText("+N<sub>2</sub>", { fill: EquilibriumLabColors.markerColorProperty }),
    idempotentDispose: true,
  },
  {
    name: "ICEFeedbackNode",
    create: () => new ICEFeedbackNode(iceTableModel, 280),
    keepAlive: () => [iceTableModel],
  },
  {
    name: "ICETableNode",
    create: () => new ICETableNode(iceTableModel, 280),
    keepAlive: () => [iceTableModel],
  },
  {
    name: "NumberEntryNode",
    create: () =>
      new NumberEntryNode(numberEntryValueProperty, () => new Range(0, 10), keypadStub, numberEntryNameProperty, 120),
    keepAlive: () => [numberEntryValueProperty, numberEntryNameProperty],
  },
  {
    name: "StressExplanationNode",
    create: () => new StressExplanationNode(leChatelierModel, 280),
    keepAlive: () => [leChatelierModel],
  },
  {
    name: "VantHoffResultsNode",
    create: () => new VantHoffResultsNode(vantHoffModel, 280),
    keepAlive: () => [vantHoffModel],
  },
]);
