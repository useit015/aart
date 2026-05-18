import { describe, expect, it } from "vitest";
import {
  CHAR_SETS,
  computeAnimationTransform,
  createDefaultSettings,
  luminanceToGlyph,
  resolvePostProcessingPlan
} from "../src/ascii.js";

describe("ASCII renderer primitives", () => {
  it("maps bright pixels to light glyphs and dark pixels to dense glyphs", () => {
    const settings = createDefaultSettings();

    expect(settings.characterSet).toBe("standard");
    expect(CHAR_SETS.standard).toContain("@");
    expect(luminanceToGlyph(0, settings)).toBe("@");
    expect(luminanceToGlyph(255, settings)).toBe(".");
  });

  it("supports inverted custom character mapping", () => {
    const settings = {
      ...createDefaultSettings(),
      characters: "ABC",
      characterSet: "custom",
      invert: true
    };

    expect(luminanceToGlyph(0, settings)).toBe("C");
    expect(luminanceToGlyph(255, settings)).toBe("A");
  });

  it("keeps public animation styles visually distinct", () => {
    const cell = { x: 180, y: 90, w: 8, h: 12, luminance: 96 };
    const baseSettings = {
      ...createDefaultSettings(),
      animated: true,
      animationIntensity: 70,
      animationRandomness: 40,
      animationSpeed: 2600
    };
    const styles = ["wave", "cascade-lr", "cascade-rl", "cascade-tb", "reveal", "pulse"];
    const signatures = new Set(styles.map((animationStyle) => (
      JSON.stringify(computeAnimationTransform(cell, { ...baseSettings, animationStyle }, 1350, 1100, 620))
    )));

    expect(signatures.size).toBe(styles.length);
    expect(computeAnimationTransform(cell, { ...baseSettings, animationStyle: "reveal" }, 250, 1100, 620).alpha).toBeLessThan(1);
  });

  it("maps every public post-processing toggle to a render pass", () => {
    const settings = createDefaultSettings();
    Object.entries(settings.effects).forEach(([key, value]) => {
      if (typeof value === "boolean") settings.effects[key] = true;
    });

    expect(resolvePostProcessingPlan(settings.effects)).toEqual([
      "color-overlay",
      "vignette",
      "scan-lines",
      "crt",
      "chromatic",
      "bloom",
      "char-bloom",
      "char-chromatic",
      "film-grain",
      "glitch",
      "rgb-split",
      "blur",
      "pixelate",
      "halftone",
      "film-dust",
      "sparkles"
    ]);
  });
});
