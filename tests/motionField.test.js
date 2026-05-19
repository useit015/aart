import { describe, expect, it } from "vitest";
import {
  createMotionParticle,
  isMotionFieldActive,
  stepMotionField,
  syncMotionField
} from "../src/motionField.js";

const baseCell = {
  x: 100,
  y: 80,
  w: 10,
  h: 14,
  luminance: 96,
  color: "rgb(255, 255, 255)",
  glyph: "@"
};

const baseSettings = {
  interactiveMotion: true,
  pointerMode: "repel",
  idleMotion: "still",
  motionForce: 70,
  motionRadius: 35,
  motionAmount: 80,
  motionSpring: 70,
  motionDamping: 88,
  motionTurbulence: 0,
  motionTrail: 0
};

describe("organic motion field", () => {
  it("creates anchored particles from ascii cells", () => {
    const particle = createMotionParticle(baseCell, 0);

    expect(particle.key).toBe("100:80:10:14");
    expect(particle.anchorX).toBe(105);
    expect(particle.anchorY).toBe(87);
    expect(particle.x).toBe(105);
    expect(particle.y).toBe(87);
    expect(particle.vx).toBe(0);
    expect(particle.vy).toBe(0);
  });

  it("preserves velocity when syncing matching cells", () => {
    const previous = syncMotionField([baseCell], null, 400, 300);
    previous.particles[0].vx = 3;
    previous.particles[0].vy = -2;

    const next = syncMotionField([{ ...baseCell, color: "rgb(0, 0, 0)" }], previous, 400, 300);

    expect(next.particles).toHaveLength(1);
    expect(next.particles[0].vx).toBe(3);
    expect(next.particles[0].vy).toBe(-2);
    expect(next.particles[0].cell.color).toBe("rgb(0, 0, 0)");
  });

  it("applies distinct pointer forces for repel attract and vortex", () => {
    const pointer = { active: true, x: 106, y: 87, pressed: false };
    const modes = ["repel", "attract", "vortex"];
    const velocities = modes.map((pointerMode) => {
      const field = syncMotionField([baseCell], null, 400, 300);
      stepMotionField(field, { ...baseSettings, pointerMode }, pointer, { active: false }, 16, 400, 300);
      return {
        x: Math.round(field.particles[0].vx * 1000) / 1000,
        y: Math.round(field.particles[0].vy * 1000) / 1000
      };
    });

    expect(velocities[0].x).toBeLessThan(0);
    expect(velocities[1].x).toBeGreaterThan(0);
    expect(Math.abs(velocities[2].y)).toBeGreaterThan(0);
    expect(new Set(velocities.map((velocity) => JSON.stringify(velocity))).size).toBe(3);
  });

  it("springs particles back toward their anchors while damping velocity", () => {
    const field = syncMotionField([baseCell], null, 400, 300);
    const particle = field.particles[0];
    particle.x += 50;
    particle.vx = 10;

    stepMotionField(field, { ...baseSettings, pointerMode: "off", motionDamping: 70 }, { active: false }, { active: false }, 16, 400, 300);

    expect(particle.vx).toBeLessThan(10);
    expect(particle.vx).toBeLessThan(0);
    expect(Math.abs(particle.x - particle.anchorX)).toBeLessThan(50);
  });

  it("uses deterministic turbulence for matching inputs", () => {
    const first = syncMotionField([baseCell], null, 400, 300);
    const second = syncMotionField([baseCell], null, 400, 300);
    const settings = { ...baseSettings, pointerMode: "off", motionTurbulence: 65 };

    stepMotionField(first, settings, { active: false }, { active: false }, 16, 400, 300);
    stepMotionField(second, settings, { active: false }, { active: false }, 16, 400, 300);

    expect(first.particles[0].vx).toBeCloseTo(second.particles[0].vx, 8);
    expect(first.particles[0].vy).toBeCloseTo(second.particles[0].vy, 8);
  });

  it("injects and decays burst energy", () => {
    const field = syncMotionField([baseCell], null, 400, 300);
    const burst = { active: true, elapsed: 0 };

    stepMotionField(field, { ...baseSettings, pointerMode: "off" }, { active: false }, burst, 16, 400, 300);
    const speedAfterBurst = Math.hypot(field.particles[0].vx, field.particles[0].vy);
    stepMotionField(field, { ...baseSettings, pointerMode: "off" }, { active: false }, burst, 1400, 400, 300);

    expect(speedAfterBurst).toBeGreaterThan(0);
    expect(burst.active).toBe(false);
    expect(field.particles[0].energy).toBeLessThan(speedAfterBurst);
  });

  it("anchors particles when reduced motion is requested", () => {
    const field = syncMotionField([baseCell], null, 400, 300);
    field.particles[0].x += 30;
    field.particles[0].vx = 12;

    stepMotionField(field, { ...baseSettings, reducedMotion: true }, { active: true, x: 100, y: 80 }, { active: true }, 16, 400, 300);

    expect(field.particles[0].x).toBe(field.particles[0].anchorX);
    expect(field.particles[0].y).toBe(field.particles[0].anchorY);
    expect(field.particles[0].vx).toBe(0);
    expect(isMotionFieldActive({ ...baseSettings, reducedMotion: true }, { active: true }, { active: true }, field)).toBe(false);
  });
});
