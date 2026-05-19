import { describe, expect, it } from "vitest";
import {
  CHAR_SETS,
  buildAsciiCells,
  computeAnimationTransform,
  createDefaultSettings,
  luminanceToGlyph,
  resolveBackgroundBlurFrame,
  resolveCellMetrics,
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

  it("keeps brightness and contrast as color controls while edge emphasis affects cell mapping", () => {
    const width = 6;
    const height = 6;
    const data = new Uint8ClampedArray(width * height * 4).fill(255);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;
        const value = x < 3 ? 24 : 232;
        data[index] = value;
        data[index + 1] = value;
        data[index + 2] = value;
      }
    }

    const cells = buildAsciiCells({ data }, width, height, {
      ...createDefaultSettings(),
      fontSize: 3,
      coverage: 100,
      edgeEmphasis: 100,
      brightness: 40,
      contrast: 140
    });

    expect(cells.some((cell) => cell.luminance < 24)).toBe(true);
    expect(cells[0].color).not.toBe("rgb(24, 24, 24)");
  });

  it("uses style-specific cell metrics for mosaic and cube controls", () => {
    expect(resolveCellMetrics({ ...createDefaultSettings(), style: "mosaic", tileShape: "wide" }).cellW)
      .toBeGreaterThan(resolveCellMetrics({ ...createDefaultSettings(), style: "mosaic", tileShape: "tall" }).cellW);
    expect(resolveCellMetrics({ ...createDefaultSettings(), style: "3d", cubeCellSize: 20 }).cellW).toBe(20);
  });

  it("keeps the blurred background expansion centered as blur changes", () => {
    expect(resolveBackgroundBlurFrame(1100, 720, 0)).toEqual({
      x: 0,
      y: 0,
      width: 1100,
      height: 720
    });
    expect(resolveBackgroundBlurFrame(1100, 720, 8)).toEqual({
      x: -16,
      y: -16,
      width: 1132,
      height: 752
    });
    expect(resolveBackgroundBlurFrame(1100, 720, 60)).toEqual({
      x: -120,
      y: -120,
      width: 1340,
      height: 960
    });
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
