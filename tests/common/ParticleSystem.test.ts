/**
 * ParticleSystem.test.ts
 *
 * The particle box stays matched to the exact model, and the van 't Hoff fit recovers ΔH° and ΔS°.
 */

import { describe, expect, it } from "vitest";
import { ParticleSystem } from "../../src/common/model/ParticleSystem.js";
import { ReactionMixture } from "../../src/common/model/ReactionMixture.js";
import { getReaction, getReactions } from "../../src/common/model/Reactions.js";
import { fitVantHoff } from "../../src/common/model/vantHoffFit.js";

const DT = 1 / 30;

/** Steps mixture and particles together for `seconds` of simulated time. */
function run(mixture: ReactionMixture, particles: ParticleSystem, seconds: number): void {
  for (let t = 0; t < seconds; t += DT) {
    mixture.step(DT);
    particles.step(DT, DT);
  }
}

describe("ParticleSystem", () => {
  it("particle counts follow the amounts for every reaction", () => {
    for (const reaction of getReactions()) {
      const mixture = new ReactionMixture(reaction);
      const particles = new ParticleSystem(mixture);
      run(mixture, particles, 40);
      const ppm = reaction.definition.particlesPerMole;
      const counts = particles.getCounts();
      reaction.species.forEach((s, i) => {
        if (!s.bulk) {
          // Within a few particles (one event moves up to |ν| of each).
          expect(Math.abs((counts[i] ?? 0) - mixture.getAmount(i) * ppm), `${reaction.id} ${s.id}`).toBeLessThanOrEqual(
            4,
          );
        }
      });
      particles.dispose();
      mixture.dispose();
    }
  });

  it("keeps reacting in both directions at equilibrium", () => {
    const mixture = new ReactionMixture(getReaction("dinitrogenTetroxide"));
    const particles = new ParticleSystem(mixture);
    mixture.equilibrate();
    run(mixture, particles, 5);
    const rates = particles.getEventRates();
    expect(rates.forward).toBeGreaterThan(0);
    expect(rates.reverse).toBeGreaterThan(0);
    particles.dispose();
    mixture.dispose();
  });

  it("follows a jump to equilibrium and added material", () => {
    const mixture = new ReactionMixture(getReaction("haber"));
    const particles = new ParticleSystem(mixture);
    mixture.equilibrate();
    mixture.addAmount(0, 0.04);
    run(mixture, particles, 30);
    const ppm = mixture.reaction.definition.particlesPerMole;
    particles.getCounts().forEach((count, i) => {
      expect(Math.abs(count - mixture.getAmount(i) * ppm)).toBeLessThanOrEqual(4);
    });
    particles.dispose();
    mixture.dispose();
  });

  it("keeps every particle inside the box when the volume shrinks", () => {
    const mixture = new ReactionMixture(getReaction("dinitrogenTetroxide"));
    const particles = new ParticleSystem(mixture);
    mixture.volumeProperty.value = 0.25;
    run(mixture, particles, 3);
    const height = particles.getHeight();
    expect(particles.particles.every((p) => p.y >= 0 && p.y <= height + 1e-9 && p.x >= 0 && p.x <= 1)).toBe(true);
    particles.dispose();
    mixture.dispose();
  });
});

describe("vantHoffFit", () => {
  it("recovers ΔH° and ΔS° from exact K values", () => {
    const reaction = getReaction("haber");
    const points = [500, 550, 600, 650, 700].map((temperature) => ({
      temperature,
      lnK: reaction.lnStandardK(temperature),
    }));
    const fit = fitVantHoff(points);
    expect(fit).not.toBeNull();
    expect(fit?.deltaH).toBeCloseTo(reaction.deltaH, 3);
    expect(fit?.deltaS).toBeCloseTo(reaction.deltaS, 6);
    expect(fit?.rSquared).toBeCloseTo(1, 12);
  });

  it("needs two distinct temperatures", () => {
    expect(fitVantHoff([{ temperature: 300, lnK: 1 }])).toBeNull();
    expect(
      fitVantHoff([
        { temperature: 300, lnK: 1 },
        { temperature: 300, lnK: 2 },
      ]),
    ).toBeNull();
  });
});
