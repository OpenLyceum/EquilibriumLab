import { expect, type Page, test } from "@playwright/test";
import type { Node, RichText } from "scenerystack/scenery";
import type { ScreenView } from "scenerystack/sim";
import type { LeChatelierModel } from "../../src/le-chatelier/model/LeChatelierModel.js";
import type { VantHoffModel } from "../../src/vant-hoff/model/VantHoffModel.js";

type SimulationWindow<Model> = {
  phet: {
    joist: {
      sim: {
        selectedScreenProperty: { value: { model: Model; view: ScreenView } };
        display: { updateDisplay(): void };
      };
    };
  };
};

async function ready(page: Page, screen: number, locale = "en") {
  await page.goto(`/?screens=${screen}&ea&locale=${locale}`);
  await page.locator("h1").first().waitFor();
}

for (const control of ["temperature", "piston"] as const) {
  test(`held ${control} keyboard gesture keeps a correct prediction and resumes on release`, async ({ page }) => {
    await ready(page, 3);
    const before = await page.evaluate(() => {
      const model = (window as unknown as SimulationWindow<LeChatelierModel>).phet.joist.sim.selectedScreenProperty
        .value.model;
      model.scene.timer.isPlayingProperty.value = false;
      model.predictFirstProperty.value = true;
      model.predictionProperty.value = "right";
      return { amounts: model.mixture.getAmounts(), time: model.scene.elapsedTimeProperty.value };
    });
    const key = control === "temperature" ? "ArrowRight" : "ArrowUp";
    const target =
      control === "temperature"
        ? page.getByRole("slider", { name: "Temperature", exact: true })
        : page.getByText("Piston", { exact: true });
    await target.focus();
    await page.keyboard.down(key);
    await page.waitForFunction((kind) => {
      const model = (window as unknown as SimulationWindow<LeChatelierModel>).phet.joist.sim.selectedScreenProperty
        .value.model;
      return kind === "temperature" ? model.mixture.temperature > 300 : model.mixture.volume > 1.01;
    }, control);
    const held = await page.evaluate(() => {
      const model = (window as unknown as SimulationWindow<LeChatelierModel>).phet.joist.sim.selectedScreenProperty
        .value.model;
      // Reproduce a long hold without depending on wall-clock scheduling.
      for (let i = 0; i < 600; i++) {
        model.scene.advance(1 / 30);
      }
      return { amounts: model.mixture.getAmounts(), time: model.scene.elapsedTimeProperty.value };
    });
    expect(held).toEqual(before);
    await page.keyboard.up(key);
    const released = await page.evaluate(() => {
      const screen = (window as unknown as SimulationWindow<LeChatelierModel>).phet.joist.sim.selectedScreenProperty
        .value;
      const result = screen.model.lastStressProperty.value;
      screen.model.scene.advance(1 / 30);
      const strings: string[] = [];
      const visit = (node: Node) => {
        if (node.constructor.name === "RichText") {
          strings.push((node as RichText).string);
        }
        node.children.forEach(visit);
      };
      visit(screen.view);
      return {
        result,
        strings,
        time: screen.model.scene.elapsedTimeProperty.value,
        playing: screen.model.scene.timer.isPlayingProperty.value,
      };
    });
    expect(released.result).toMatchObject({ direction: "right", prediction: "right" });
    expect(released.strings.some((text) => text.includes("Correct"))).toBe(true);
    expect(released.time).toBeGreaterThan(before.time);
    expect(released.playing).toBe(false);
  });
}

test("a native add press records a vertical concentration jump at the stress marker", async ({ page }) => {
  await ready(page, 3);
  const before = await page.evaluate(() => {
    const model = (window as unknown as SimulationWindow<LeChatelierModel>).phet.joist.sim.selectedScreenProperty.value
      .model;
    model.scene.timer.isPlayingProperty.value = false;
    model.startAtEquilibrium();
    model.scene.advance(0.02);
    return { concentration: model.mixture.getConcentrations()[0]!, time: model.scene.elapsedTimeProperty.value };
  });
  await page.getByRole("button", { name: "Add dinitrogen tetroxide", exact: true }).press("Enter");
  const result = await page.evaluate(() => {
    const model = (window as unknown as SimulationWindow<LeChatelierModel>).phet.joist.sim.selectedScreenProperty.value
      .model;
    return {
      points: model.scene.concentrationRecord.traces[0]!.slice(-2).map((point) => ({ time: point.x, value: point.y })),
      markerTime: model.scene.concentrationRecord.markers.at(-1)?.time,
      concentration: model.mixture.getConcentrations()[0]!,
    };
  });
  expect(result.points).toEqual([
    { time: before.time, value: before.concentration },
    { time: before.time, value: result.concentration },
  ]);
  expect(result.concentration).toBeGreaterThan(before.concentration);
  expect(result.markerTime).toBe(before.time);
});

for (const [locale, title, slopeLabel] of [
  ["en", "ln K against 1000/T", "graph slope"],
  ["fr", "ln K en fonction de 1000/T", "pente du graphe"],
  ["es", "ln K frente a 1000/T", "pendiente del gráfico"],
]) {
  test(`Van 't Hoff shows the plotted slope and conversion in ${locale}`, async ({ page }) => {
    await ready(page, 4, locale);
    const result = await page.evaluate(() => {
      const screen = (window as unknown as SimulationWindow<VantHoffModel>).phet.joist.sim.selectedScreenProperty.value;
      const model = screen.model;
      model.scene.timer.isPlayingProperty.value = false;
      model.measurementErrorProperty.value = false;
      model.measure();
      model.scene.mixture.temperatureProperty.value = 350;
      model.scene.mixture.equilibrate();
      model.measure();
      const points = model.pointsProperty.value;
      // Independent rise/run on the actual displayed coordinates, rather than fit.slope.
      const slope = (points[1]!.lnK - points[0]!.lnK) / (1000 / points[1]!.temperature - 1000 / points[0]!.temperature);
      const strings: string[] = [];
      const visit = (node: Node) => {
        if (node.constructor.name === "RichText") {
          strings.push((node as RichText).string);
        }
        node.children.forEach(visit);
      };
      visit(screen.view);
      return { slope, strings, enthalpy: model.fitProperty.value!.deltaH };
    });
    expect(result.strings).toContain(title);
    const slopeText = result.strings.find((text) => text.startsWith(`${slopeLabel} = `));
    expect(slopeText).toBeDefined();
    const displayedSlope = Number(slopeText!.split(" = ")[1]!.replace(" K", "").replace("−", "-"));
    expect(displayedSlope).toBeCloseTo(result.slope, 3);
    expect(result.strings.some((text) => text.startsWith("ΔH° = −1000R ×"))).toBe(true);
    expect(result.enthalpy).toBeCloseTo(57240, 4);
  });
}
