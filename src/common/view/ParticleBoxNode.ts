/**
 * ParticleBoxNode.ts
 *
 * The vessel and its molecules. Gas reactions sit in a cylinder closed by a piston whose height
 * follows the volume (and, when `volumeAdjustable`, sets it when dragged); aqueous reactions sit
 * in a beaker whose liquid level follows the volume. The particles are painted on a CanvasNode
 * each frame, over a tint that follows the concentration of the coloured species (brown NO₂,
 * violet I₂, red FeSCN²⁺, pink and blue cobalt). Newly formed particles flash briefly, so
 * individual reaction events stay visible at equilibrium.
 */

import { Multilink, type TReadOnlyProperty } from "scenerystack/axon";
import { Bounds2, Random } from "scenerystack/dot";
import { Shape } from "scenerystack/kite";
import { optionize } from "scenerystack/phet-core";
import {
  CanvasNode,
  Color,
  Line,
  Node,
  type NodeOptions,
  Path,
  Rectangle,
  RichDragListener,
} from "scenerystack/scenery";
import EquilibriumLabColors from "../../EquilibriumLabColors.js";
import { BOX_MAX_HEIGHT, BOX_WIDTH, MAX_BULK_DOTS, PARTICLE_SEED } from "../../EquilibriumLabConstants.js";
import { StringManager } from "../../i18n/StringManager.js";
import type { ParticleSystem } from "../model/ParticleSystem.js";
import type { ReactionMixture } from "../model/ReactionMixture.js";
import { speciesStyleIn } from "./speciesStyles.js";

/** Sprite sizes in speciesStyles.ts are for a box this wide (px). */
const REFERENCE_WIDTH = 260;

/** Seconds a newly formed particle is ringed. */
const FLASH_TIME = 0.5;

/** Wall thickness of the vessel (px). */
const WALL = 4;

/** Piston plate thickness and handle size (px). */
const PISTON_THICKNESS = 10;
const HANDLE_WIDTH = 46;
const HANDLE_HEIGHT = 14;

/** Volume change per keyboard press, as a fraction of the largest volume. */
const KEYBOARD_VOLUME_FRACTION = 0.02;

/** Inert-gas particles drawn per mole of argon, relative to the reaction's particles per mole. */
const INERT_DOTS_CAP = 120;

type SelfOptions = {
  /** Whether newly formed particles are ringed. */
  showFlashesProperty?: TReadOnlyProperty<boolean> | null;
  /** Whether dragging the piston (gas) changes the volume. */
  volumeAdjustable?: boolean;
  /** Called after the piston sets a new volume, e.g. to mark the stress on the charts. */
  onVolumeDragEnd?: (oldVolume: number, newVolume: number) => void;
};

export type ParticleBoxNodeOptions = SelfOptions & NodeOptions;

export class ParticleBoxNode extends Node {
  private readonly canvas: ParticleCanvasNode;

  /** The focusable piston handle, for the screen's traversal order (null when not adjustable). */
  public readonly pistonHandle: Node | null;

  private readonly disposeParticleBoxNode: () => void;

  public constructor(
    mixture: ReactionMixture,
    particles: ParticleSystem,
    width: number,
    providedOptions?: ParticleBoxNodeOptions,
  ) {
    const options = optionize<ParticleBoxNodeOptions, SelfOptions, NodeOptions>()(
      { showFlashesProperty: null, volumeAdjustable: false, onVolumeDragEnd: () => undefined },
      providedOptions,
    );
    super();
    const strings = StringManager.getInstance().getCommonStrings();
    const scale = width / BOX_WIDTH;
    const maxHeight = BOX_MAX_HEIGHT * scale;
    const headroom = HANDLE_HEIGHT + 22;
    const bottom = headroom + maxHeight;

    this.canvas = new ParticleCanvasNode(mixture, particles, width, maxHeight, headroom, options.showFlashesProperty);

    // ── Gas cylinder and piston ─────────────────────────────────────────────────
    const cylinder = new Path(
      new Shape()
        .moveTo(-WALL / 2, headroom - 6)
        .lineTo(-WALL / 2, bottom + WALL / 2)
        .lineTo(width + WALL / 2, bottom + WALL / 2)
        .lineTo(width + WALL / 2, headroom - 6),
      { stroke: EquilibriumLabColors.glassColorProperty, lineWidth: WALL, lineJoin: "round" },
    );
    const plate = new Rectangle(0, -PISTON_THICKNESS, width, PISTON_THICKNESS, {
      fill: EquilibriumLabColors.pistonColorProperty,
      stroke: EquilibriumLabColors.pistonDarkColorProperty,
    });
    const rod = new Line(width / 2, -PISTON_THICKNESS, width / 2, -PISTON_THICKNESS - maxHeight, {
      stroke: EquilibriumLabColors.pistonDarkColorProperty,
      lineWidth: 5,
    });
    const handle = new Rectangle(-HANDLE_WIDTH / 2, -HANDLE_HEIGHT / 2, HANDLE_WIDTH, HANDLE_HEIGHT, 4, 4, {
      fill: EquilibriumLabColors.pistonColorProperty,
      stroke: EquilibriumLabColors.pistonDarkColorProperty,
      lineWidth: 1.5,
    });
    const handleRoot = new Node({ children: [handle], cursor: "ns-resize" });
    const piston = new Node({ children: [rod, plate, handleRoot] });
    const gasVessel = new Node({ children: [piston, cylinder] });

    // ── Beaker ──────────────────────────────────────────────────────────────────
    const beaker = new Path(
      new Shape()
        .moveTo(-WALL / 2 - 6, headroom - 6)
        .lineTo(-WALL / 2, headroom)
        .lineTo(-WALL / 2, bottom + WALL / 2)
        .lineTo(width + WALL / 2, bottom + WALL / 2)
        .lineTo(width + WALL / 2, headroom - 6),
      { stroke: EquilibriumLabColors.glassColorProperty, lineWidth: WALL, lineJoin: "round" },
    );

    this.children = [this.canvas, gasVessel, beaker];

    const multilink = Multilink.multilink([mixture.reactionProperty, mixture.volumeProperty], (reaction, volume) => {
      gasVessel.visible = reaction.isGas;
      beaker.visible = !reaction.isGas;
      const height = particles.heightFor(volume) * scale;
      piston.y = bottom - height;
      handleRoot.y = -PISTON_THICKNESS - (headroom - 10) - (maxHeight - height);
      handleRoot.x = width / 2;
      rod.setLine(width / 2, -PISTON_THICKNESS, width / 2, handleRoot.y);
    });

    // ── Dragging the piston ─────────────────────────────────────────────────────
    let dragStartVolume = mixture.volume;
    const setVolumeBy = (dy: number) => {
      const range = mixture.reaction.definition.volumeRange;
      const volume = mixture.volume - (dy / maxHeight) * range.max;
      mixture.volumeProperty.value = range.constrainValue(volume);
    };
    const keyboardStep = KEYBOARD_VOLUME_FRACTION * maxHeight;
    const drag = new RichDragListener({
      start: () => {
        dragStartVolume = mixture.volume;
      },
      drag: (_event, listener) => setVolumeBy(listener.modelDelta.y),
      end: () => options.onVolumeDragEnd(dragStartVolume, mixture.volume),
      keyboardDragListenerOptions: { dragDelta: keyboardStep, shiftDragDelta: keyboardStep / 4 },
    });
    if (options.volumeAdjustable) {
      handleRoot.tagName = "div";
      handleRoot.focusable = true;
      handleRoot.accessibleName = strings.a11y.pistonStringProperty;
      handleRoot.accessibleHelpText = strings.a11y.pistonHelpStringProperty;
      handleRoot.addInputListener(drag);
    } else {
      handleRoot.pickable = false;
      handle.visible = false;
    }

    this.pistonHandle = options.volumeAdjustable ? handleRoot : null;
    this.mutate(options);

    this.disposeParticleBoxNode = () => {
      multilink.dispose();
      if (options.volumeAdjustable) {
        handleRoot.removeInputListener(drag);
      }
      drag.dispose();
    };
  }

  /** Repaints the particles; call every frame. */
  public step(): void {
    this.canvas.invalidatePaint();
  }

  public override dispose(): void {
    this.disposeParticleBoxNode();
    super.dispose();
  }
}

/** Paints the tint, bulk and inert dots, and the particles of the box. */
class ParticleCanvasNode extends CanvasNode {
  private readonly mixture: ReactionMixture;
  private readonly particles: ParticleSystem;
  private readonly boxWidth: number;
  private readonly boxMaxHeight: number;
  private readonly boxTop: number;
  private readonly pixelsPerUnit: number;
  private readonly showFlashesProperty: TReadOnlyProperty<boolean> | null;

  /** Fixed scatter positions (fractions of the box) for bulk and inert dots, so they don't flicker. */
  private readonly scatter: { x: number; y: number }[];

  public constructor(
    mixture: ReactionMixture,
    particles: ParticleSystem,
    width: number,
    maxHeight: number,
    top: number,
    showFlashesProperty: TReadOnlyProperty<boolean> | null,
  ) {
    super({ canvasBounds: new Bounds2(-2, top - 2, width + 2, top + maxHeight + 2) });
    this.mixture = mixture;
    this.particles = particles;
    this.boxWidth = width;
    this.boxMaxHeight = maxHeight;
    this.boxTop = top;
    this.pixelsPerUnit = width / BOX_WIDTH;
    this.showFlashesProperty = showFlashesProperty;
    const random = new Random({ seed: PARTICLE_SEED });
    this.scatter = Array.from({ length: Math.max(MAX_BULK_DOTS, INERT_DOTS_CAP) * 2 }, () => ({
      x: random.nextDouble(),
      y: random.nextDouble(),
    }));
  }

  public override paintCanvas(context: CanvasRenderingContext2D): void {
    const mixture = this.mixture;
    const reaction = mixture.reaction;
    const bottom = this.boxTop + this.boxMaxHeight;
    const height = this.particles.getHeight() * this.pixelsPerUnit;
    const spriteScale = this.boxWidth / REFERENCE_WIDTH;

    // Interior, then the tint of the coloured species.
    context.fillStyle = (
      reaction.isGas ? EquilibriumLabColors.vesselInteriorColorProperty : EquilibriumLabColors.solutionColorProperty
    ).value.toCSS();
    context.fillRect(0, bottom - height, this.boxWidth, height);
    const concentrations = mixture.getConcentrations();
    let r = 0;
    let g = 0;
    let b = 0;
    let weight = 0;
    reaction.species.forEach((_s, i) => {
      const style = speciesStyleIn(reaction, i);
      if (style.tintConcentration) {
        const w = Math.min(1, (concentrations[i] ?? 0) / style.tintConcentration);
        const color = style.color.value;
        r += color.red * w;
        g += color.green * w;
        b += color.blue * w;
        weight += w;
      }
    });
    if (weight > 0) {
      const alpha = 0.75 * Math.min(1, weight);
      context.fillStyle = new Color(r / weight, g / weight, b / weight, alpha).toCSS();
      context.fillRect(0, bottom - height, this.boxWidth, height);
    }

    // Species in large excess, and inert gas, as faint fixed dots.
    const dot = (fraction: { x: number; y: number }, radius: number) => {
      context.beginPath();
      context.arc(fraction.x * this.boxWidth, bottom - fraction.y * height, radius, 0, 2 * Math.PI);
      context.fill();
    };
    reaction.species.forEach((s, i) => {
      if (s.bulk) {
        const count = Math.min(MAX_BULK_DOTS, Math.round((concentrations[i] ?? 0) * 30 * (height / this.boxMaxHeight)));
        context.fillStyle = speciesStyleIn(reaction, i).color.value.withAlpha(0.55).toCSS();
        for (let k = 0; k < count; k++) {
          const fraction = this.scatter[k];
          if (fraction) {
            dot(fraction, 1.8 * spriteScale);
          }
        }
      }
    });
    const inert = Math.min(INERT_DOTS_CAP, Math.round(mixture.getInertAmount() * reaction.definition.particlesPerMole));
    context.fillStyle = EquilibriumLabColors.inertGasColorProperty.value.toCSS();
    for (let k = 0; k < inert; k++) {
      const fraction = this.scatter[this.scatter.length - 1 - k];
      if (fraction) {
        dot(fraction, 2.5 * spriteScale);
      }
    }

    // Particles.
    const styles = reaction.species.map((_s, i) => speciesStyleIn(reaction, i));
    const fills = styles.map((style) => style.color.value.toCSS());
    const edges = styles.map((style) => style.color.value.darkerColor(0.6).toCSS());
    const flash = EquilibriumLabColors.reactionFlashColorProperty.value;
    const showFlashes = this.showFlashesProperty?.value ?? true;
    context.lineWidth = 1;
    for (const p of this.particles.particles) {
      const style = styles[p.species];
      if (!style) {
        continue;
      }
      const x = p.x * this.pixelsPerUnit;
      const y = bottom - p.y * this.pixelsPerUnit;
      context.fillStyle = fills[p.species] ?? "white";
      context.strokeStyle = edges[p.species] ?? "black";
      for (const atom of style.atoms) {
        context.beginPath();
        context.arc(x + atom.dx * spriteScale, y + atom.dy * spriteScale, atom.r * spriteScale, 0, 2 * Math.PI);
        context.fill();
        context.stroke();
      }
      if (showFlashes && p.age < FLASH_TIME) {
        context.strokeStyle = flash.withAlpha(1 - p.age / FLASH_TIME).toCSS();
        context.beginPath();
        context.arc(x, y, 11 * spriteScale, 0, 2 * Math.PI);
        context.stroke();
      }
    }
  }
}
