/**
 * ParticleSystem.ts
 *
 * The molecules in the particle box. The box never runs its own chemistry: it replays the
 * mixture's forward and reverse flows (mol of reaction) as individual events at `particlesPerMole`
 * particles per mole, so its composition always matches the exact model to within a particle.
 * At equilibrium the flows keep coming in equal measure, so molecules still form and break apart
 * in pairs: dynamic equilibrium, visible.
 *
 * A forward event takes one particle of the first reactant, gathers the nearest particles of the
 * other reactants it needs, and replaces them with the products at their centroid; a reverse event
 * does the same from the products' side. Species in large excess (`bulk`) take no part in events;
 * the view draws them as a background density instead.
 *
 * Positions are in box units: x in [0, BOX_WIDTH], y in [0, height] with y = 0 at the bottom. The
 * height is proportional to the volume, so compressing the gas squeezes the particles together.
 */

import { Random } from "scenerystack/dot";
import {
  BOX_MAX_HEIGHT,
  BOX_WIDTH,
  MAX_PARTICLES,
  PARTICLE_REFERENCE_MASS,
  PARTICLE_REFERENCE_SPEED,
  PARTICLE_SEED,
  STANDARD_TEMPERATURE,
} from "../../EquilibriumLabConstants.js";
import type { Reaction } from "./Reaction.js";
import type { ReactionMixture } from "./ReactionMixture.js";

/** Most events replayed per frame in each direction; a faster backlog is skipped, not queued. */
const MAX_EVENTS_PER_STEP = 12;

export type Particle = {
  /** Index of the species in the reaction. */
  species: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Seconds since the particle was formed by a reaction event (the view flashes new ones). */
  age: number;
};

export class ParticleSystem {
  public readonly particles: Particle[] = [];

  private readonly mixture: ReactionMixture;
  private readonly random = new Random({ seed: PARTICLE_SEED });
  private height = BOX_MAX_HEIGHT;

  /** Gross events replayed so far in each direction, against the mixture's flows. */
  private forwardDone = 0;
  private reverseDone = 0;

  /** Net events that actually happened (forward minus reverse). */
  private netDone = 0;

  /** Forward and reverse events in the last second, for the event-rate readouts. */
  private readonly recentEvents: { time: number; forward: boolean }[] = [];
  private clock = 0;

  private readonly disposeParticleSystem: () => void;

  public constructor(mixture: ReactionMixture) {
    this.mixture = mixture;
    const rebuild = () => this.rebuild();
    const added = (index: number, moles: number) => this.addParticles(index, moles);
    const volumeChanged = (volume: number) => this.setHeight(this.heightFor(volume));
    const temperatureChanged = (temperature: number, oldTemperature: number | null) => {
      if (oldTemperature) {
        this.scaleSpeeds(Math.sqrt(temperature / oldTemperature));
      }
    };
    mixture.resetEmitter.addListener(rebuild);
    mixture.amountAddedEmitter.addListener(added);
    mixture.volumeProperty.link(volumeChanged);
    mixture.temperatureProperty.lazyLink(temperatureChanged);
    this.disposeParticleSystem = () => {
      mixture.resetEmitter.removeListener(rebuild);
      mixture.amountAddedEmitter.removeListener(added);
      mixture.volumeProperty.unlink(volumeChanged);
      mixture.temperatureProperty.unlink(temperatureChanged);
    };
    this.rebuild();
  }

  private get reaction(): Reaction {
    return this.mixture.reaction;
  }

  /** Box height (box units) for `volume`: proportional to it, BOX_MAX_HEIGHT at the largest volume. */
  public heightFor(volume: number): number {
    return (BOX_MAX_HEIGHT * volume) / this.reaction.definition.volumeRange.max;
  }

  public getHeight(): number {
    return this.height;
  }

  /** Number of particles of each species currently drawn. */
  public getCounts(): number[] {
    const counts = this.reaction.species.map(() => 0);
    for (const p of this.particles) {
      counts[p.species] = (counts[p.species] ?? 0) + 1;
    }
    return counts;
  }

  /** Forward and reverse events per second of simulated time, over the last second. */
  public getEventRates(): { forward: number; reverse: number } {
    const forward = this.recentEvents.filter((e) => e.forward).length;
    return { forward, reverse: this.recentEvents.length - forward };
  }

  /** Starts over from the mixture's current amounts. */
  public rebuild(): void {
    this.particles.length = 0;
    this.recentEvents.length = 0;
    this.height = this.heightFor(this.mixture.volume);
    const ppm = this.reaction.definition.particlesPerMole;
    this.reaction.species.forEach((s, i) => {
      if (!s.bulk) {
        const count = Math.round(this.mixture.getAmount(i) * ppm);
        for (let k = 0; k < count && this.particles.length < MAX_PARTICLES; k++) {
          this.particles.push(
            this.createParticle(i, this.random.nextDouble() * BOX_WIDTH, this.random.nextDouble() * this.height, 1),
          );
        }
      }
    });
    const flows = this.mixture.getFlows();
    this.forwardDone = Math.floor(flows.forward * ppm);
    this.reverseDone = Math.floor(flows.reverse * ppm);
    this.netDone = Math.round(this.mixture.getTotalExtent() * ppm);
  }

  /** Replays the mixture's reaction since the last step, then moves the particles. */
  public step(dt: number, simulatedDt: number): void {
    this.clock += simulatedDt;
    this.replayEvents();
    this.move(dt);
    while (this.recentEvents.length > 0 && (this.recentEvents[0]?.time ?? 0) < this.clock - 1) {
      this.recentEvents.shift();
    }
  }

  /** Moves the particles by `dt` real seconds, bouncing off the walls. */
  public move(dt: number): void {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.x < 0) {
        p.x = -p.x;
        p.vx = Math.abs(p.vx);
      } else if (p.x > BOX_WIDTH) {
        p.x = 2 * BOX_WIDTH - p.x;
        p.vx = -Math.abs(p.vx);
      }
      if (p.y < 0) {
        p.y = -p.y;
        p.vy = Math.abs(p.vy);
      } else if (p.y > this.height) {
        p.y = Math.max(0, 2 * this.height - p.y);
        p.vy = -Math.abs(p.vy);
      }
      p.age += dt;
    }
  }

  public dispose(): void {
    this.disposeParticleSystem();
  }

  private replayEvents(): void {
    const ppm = this.reaction.definition.particlesPerMole;
    const flows = this.mixture.getFlows();
    const forwardTarget = Math.floor(flows.forward * ppm);
    const reverseTarget = Math.floor(flows.reverse * ppm);
    const forwardCount = Math.min(MAX_EVENTS_PER_STEP, Math.max(0, forwardTarget - this.forwardDone));
    const reverseCount = Math.min(MAX_EVENTS_PER_STEP, Math.max(0, reverseTarget - this.reverseDone));
    for (let i = 0; i < Math.max(forwardCount, reverseCount); i++) {
      if (i < forwardCount && this.react(true)) {
        this.netDone++;
      }
      if (i < reverseCount && this.react(false)) {
        this.netDone--;
      }
    }
    // A backlog beyond what one frame shows is dropped; the net correction below keeps the count.
    this.forwardDone = Math.max(this.forwardDone + forwardCount, forwardTarget - MAX_EVENTS_PER_STEP);
    this.reverseDone = Math.max(this.reverseDone + reverseCount, reverseTarget - MAX_EVENTS_PER_STEP);

    // Keep the composition matched to the net extent (equilibrate() and dropped backlogs move it
    // without gross flows).
    const netTarget = Math.round(this.mixture.getTotalExtent() * ppm);
    for (let i = 0; i < MAX_EVENTS_PER_STEP && this.netDone !== netTarget; i++) {
      const forward = netTarget > this.netDone;
      if (!this.react(forward)) {
        break;
      }
      this.netDone += forward ? 1 : -1;
    }
  }

  /** One reaction event in the given direction; false if the needed particles are not there. */
  private react(forward: boolean): boolean {
    const species = this.reaction.species;
    const consumed = species.flatMap((s, i) => (!s.bulk && (forward ? s.nu < 0 : s.nu > 0) ? [i] : []));
    const produced = species.flatMap((s, i) => (!s.bulk && (forward ? s.nu > 0 : s.nu < 0) ? [i] : []));
    const first = consumed[0];
    if (first === undefined) {
      return false;
    }
    const candidates = this.particles.filter((p) => p.species === first);
    const seed = candidates[this.random.nextInt(candidates.length)];
    if (!seed) {
      return false;
    }
    const taken: Particle[] = [seed];
    for (const index of consumed) {
      const needed = Math.abs(species[index]?.nu ?? 0) - (index === first ? 1 : 0);
      const nearest = this.particles
        .filter((p) => p.species === index && !taken.includes(p))
        .sort((a, b) => distanceSquared(a, seed) - distanceSquared(b, seed))
        .slice(0, needed);
      if (nearest.length < needed) {
        return false;
      }
      taken.push(...nearest);
    }
    const cx = taken.reduce((sum, p) => sum + p.x, 0) / taken.length;
    const cy = taken.reduce((sum, p) => sum + p.y, 0) / taken.length;
    for (const p of taken) {
      this.particles.splice(this.particles.indexOf(p), 1);
    }
    for (const index of produced) {
      const count = Math.abs(species[index]?.nu ?? 0);
      for (let k = 0; k < count && this.particles.length < MAX_PARTICLES; k++) {
        const offset = count > 1 ? 0.02 * (k - (count - 1) / 2) : 0;
        this.particles.push(this.createParticle(index, cx + offset, cy, 0));
      }
    }
    this.recentEvents.push({ time: this.clock, forward });
    return true;
  }

  private addParticles(index: number, moles: number): void {
    if (this.reaction.species[index]?.bulk) {
      return;
    }
    const count = Math.round(Math.abs(moles) * this.reaction.definition.particlesPerMole);
    if (moles > 0) {
      for (let k = 0; k < count && this.particles.length < MAX_PARTICLES; k++) {
        // Added material enters at the top of the box.
        const y = this.height * (1 - 0.15 * this.random.nextDouble());
        this.particles.push(this.createParticle(index, this.random.nextDouble() * BOX_WIDTH, y, 1));
      }
    } else {
      for (let k = 0; k < count; k++) {
        const candidates = this.particles.filter((p) => p.species === index);
        const victim = candidates[this.random.nextInt(candidates.length)];
        if (!victim) {
          break;
        }
        this.particles.splice(this.particles.indexOf(victim), 1);
      }
    }
  }

  /** Squeezes or stretches the particles vertically when the volume changes. */
  private setHeight(height: number): void {
    if (height > 0 && this.height > 0) {
      const scale = height / this.height;
      for (const p of this.particles) {
        p.y *= scale;
      }
    }
    this.height = height;
  }

  /** Particles speed up as √T when the mixture is heated. */
  private scaleSpeeds(factor: number): void {
    for (const p of this.particles) {
      p.vx *= factor;
      p.vy *= factor;
    }
  }

  private createParticle(species: number, x: number, y: number, age: number): Particle {
    const mass = this.reaction.species[species]?.molarMass ?? PARTICLE_REFERENCE_MASS;
    const speedFactor = Math.sqrt((this.mixture.temperature / STANDARD_TEMPERATURE) * (PARTICLE_REFERENCE_MASS / mass));
    const speed =
      PARTICLE_REFERENCE_SPEED * Math.min(2.5, Math.max(0.4, speedFactor)) * (0.7 + 0.6 * this.random.nextDouble());
    const angle = 2 * Math.PI * this.random.nextDouble();
    return {
      species,
      x: Math.min(BOX_WIDTH, Math.max(0, x)),
      y: Math.min(this.height, Math.max(0, y)),
      vx: speed * Math.cos(angle),
      vy: speed * Math.sin(angle),
      age,
    };
  }
}

function distanceSquared(a: Particle, b: Particle): number {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}
