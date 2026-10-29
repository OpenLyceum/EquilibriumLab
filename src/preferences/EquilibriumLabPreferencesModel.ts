/**
 * EquilibriumLabPreferencesModel.ts
 *
 * Model for the simulation-specific preferences shown in Preferences →
 * Simulation. Each preference Property takes its initial value from the
 * corresponding query parameter in equilibriumLabQueryParameters.
 */

import { BooleanProperty } from "scenerystack/axon";
import type { Tandem } from "scenerystack/tandem";
import EquilibriumLabNamespace from "../EquilibriumLabNamespace.js";
import equilibriumLabQueryParameters from "./equilibriumLabQueryParameters.js";

export class EquilibriumLabPreferencesModel {
  /** Gas reactions start with Q and K in the Kp form. */
  public readonly startWithKpProperty: BooleanProperty;

  /** Newly formed molecules are ringed briefly in the particle box. */
  public readonly showReactionFlashesProperty: BooleanProperty;

  public constructor(tandem?: Tandem) {
    this.startWithKpProperty = new BooleanProperty(
      equilibriumLabQueryParameters.startWithKp,
      tandem ? { tandem: tandem.createTandem("startWithKpProperty") } : undefined,
    );
    this.showReactionFlashesProperty = new BooleanProperty(
      equilibriumLabQueryParameters.showReactionFlashes,
      tandem ? { tandem: tandem.createTandem("showReactionFlashesProperty") } : undefined,
    );
  }

  public reset(): void {
    this.startWithKpProperty.reset();
    this.showReactionFlashesProperty.reset();
  }
}

EquilibriumLabNamespace.register("EquilibriumLabPreferencesModel", EquilibriumLabPreferencesModel);
