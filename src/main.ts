/**
 * main.ts
 *
 * Entry point for the simulation. Initializes SceneryStack, creates the
 * screens, and starts the main event loop.
 *
 * !! CRITICAL IMPORT ORDER !!
 * brand.js MUST be the first import. Each module imports the next, so the import nesting is
 *
 *   main → brand → splash → assert → init
 *
 * and therefore the actual EXECUTION order (deepest import runs first) is the reverse:
 *
 *   init → assert → splash → brand → main
 *
 * SceneryStack requires this exact load order. Never reorder these imports.
 */

// brand.js MUST be first; importing it runs the whole chain (init→assert→splash→brand) before main.
import "./brand.js";

import { onReadyToLaunch, PreferencesModel, Sim } from "scenerystack/sim";
import { Tandem } from "scenerystack/tandem";
import { ApproachScreen } from "./approach/ApproachScreen.js";
import EquilibriumLabColors from "./EquilibriumLabColors.js";
import { StringManager } from "./i18n/StringManager.js";
import { ICETableScreen } from "./ice-table/ICETableScreen.js";
import { LeChatelierScreen } from "./le-chatelier/LeChatelierScreen.js";
import { EquilibriumLabPreferencesModel } from "./preferences/EquilibriumLabPreferencesModel.js";
import { EquilibriumLabPreferencesNode } from "./preferences/EquilibriumLabPreferencesNode.js";
import { VantHoffScreen } from "./vant-hoff/VantHoffScreen.js";

onReadyToLaunch(() => {
  const stringManager = StringManager.getInstance();

  // Simulation-specific preferences; initial values come from equilibriumLabQueryParameters.
  const simPreferences = new EquilibriumLabPreferencesModel(Tandem.ROOT.createTandem("preferences"));

  const screens = [
    new ApproachScreen({
      name: stringManager.getScreenNames().approachStringProperty,
      startWithKpProperty: simPreferences.startWithKpProperty,
      showReactionFlashesProperty: simPreferences.showReactionFlashesProperty,
      tandem: Tandem.ROOT.createTandem("approachScreen"),
      backgroundColorProperty: EquilibriumLabColors.backgroundColorProperty,
    }),
    new ICETableScreen({
      name: stringManager.getScreenNames().iceTableStringProperty,
      tandem: Tandem.ROOT.createTandem("iceTableScreen"),
      backgroundColorProperty: EquilibriumLabColors.backgroundColorProperty,
    }),
    new LeChatelierScreen({
      name: stringManager.getScreenNames().leChatelierStringProperty,
      startWithKpProperty: simPreferences.startWithKpProperty,
      showReactionFlashesProperty: simPreferences.showReactionFlashesProperty,
      tandem: Tandem.ROOT.createTandem("leChatelierScreen"),
      backgroundColorProperty: EquilibriumLabColors.backgroundColorProperty,
    }),
    new VantHoffScreen({
      name: stringManager.getScreenNames().vantHoffStringProperty,
      tandem: Tandem.ROOT.createTandem("vantHoffScreen"),
      backgroundColorProperty: EquilibriumLabColors.backgroundColorProperty,
    }),
  ];

  const sim = new Sim(stringManager.getTitleStringProperty(), screens, {
    preferencesModel: new PreferencesModel({
      visualOptions: {
        // Adds a "Projector Mode" toggle in Preferences → Visual
        supportsProjectorMode: true,
        // Enables keyboard-navigation highlight outlines
        supportsInteractiveHighlights: true,
      },
      simulationOptions: {
        customPreferences: [
          {
            createContent: (tandem: Tandem) => new EquilibriumLabPreferencesNode(simPreferences, tandem),
          },
        ],
      },
      localizationOptions: {
        // Adds a language picker in Preferences → Language
        supportsDynamicLocale: true,
      },
    }),

    // Optional: fill in credits shown in Help → About
    credits: {
      leadDesign: "",
      softwareDevelopment: "",
      team: "",
      qualityAssurance: "",
    },
  });

  sim.start();
});
