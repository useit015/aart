import { describe, expect, it } from "vitest";
import {
  CHAR_SETS,
  CHARSET_PRESETS,
  GRID_QUALITY_PRESETS,
  QUALITY_PRESET_ORDER,
  QUALITY_PRESETS,
  QUALITY_PRESET_SETTING_KEYS,
  adjustColorChannel,
  applyToneCurve,
  applyQualityPreset,
  buildAsciiCells,
  computeAnimationTransform,
  correctedRows,
  createDefaultSettings,
  decodeAsciiGrid,
  luminanceToGlyph,
  matchesQualityPreset,
  packRgb565,
  resolveBackgroundBlurFrame,
  resolveCellMetrics,
  resolvePostProcessingPlan,
  rgbToLuminance,
  sampleAsciiGrid
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

  it("samples the full cell area so one bright pixel does not wash out detail", () => {
    const width = 4;
    const height = 4;
    const data = new Uint8ClampedArray(width * height * 4).fill(0);
    for (let pixel = 0; pixel < width * height; pixel += 1) {
      data[pixel * 4 + 3] = 255;
    }
    const brightCenter = (2 * width + 2) * 4;
    data[brightCenter] = 255;
    data[brightCenter + 1] = 255;
    data[brightCenter + 2] = 255;

    const cells = buildAsciiCells({ data }, width, height, {
      ...createDefaultSettings(),
      style: "pixel",
      fontSize: 4,
      coverage: 100,
      edgeEmphasis: 0,
      density: 0
    });

    expect(cells).toHaveLength(1);
    expect(cells[0].luminance).toBeLessThan(40);
    expect(cells[0].color).toBe("rgb(16, 16, 16)");
  });

  it("applies gamma to glyph selection without changing source color", () => {
    const settings = {
      ...createDefaultSettings(),
      gamma: 200
    };

    expect(luminanceToGlyph(64, settings)).toBe("+");
    expect(adjustColorChannel(64, settings)).toBe(64);
  });

  it("corrects sampled grid rows using source aspect and cell aspect", () => {
    expect(correctedRows(1920, 1080, 144)).toBe(45);
    expect(correctedRows(1080, 1920, 96)).toBe(95);
    expect(correctedRows(0, 1920, 96)).toBe(1);
    expect(correctedRows(1920, 1080, Number.NaN)).toBe(1);
    expect(correctedRows(Number.POSITIVE_INFINITY, 1080, 96)).toBe(1);
  });

  it("matches locked luminance and rgb565 packing values", () => {
    expect(rgbToLuminance(0, 0, 0)).toBe(0);
    expect(rgbToLuminance(255, 255, 255)).toBe(255);
    expect(rgbToLuminance(255, 0, 0)).toBe(54);
    expect(rgbToLuminance(0, 255, 0)).toBe(182);
    expect(rgbToLuminance(0, 0, 255)).toBe(18);
    expect(packRgb565(255, 0, 0)).toBe(0xf800);
    expect(packRgb565(0, 255, 0)).toBe(0x07e0);
    expect(packRgb565(0, 0, 255)).toBe(0x001f);
  });

  it("applies tone curve in brightness contrast gamma invert order", () => {
    expect(applyToneCurve(128, { brightness: 10, contrast: 50, gamma: 100, invert: false })).toBe(166);
    expect(applyToneCurve(128, { brightness: 10, contrast: 50, gamma: 200, invert: false })).toBe(206);
    expect(applyToneCurve(128, { brightness: 10, contrast: 50, gamma: 100, invert: true })).toBe(89);
  });

  it("samples and decodes still-image ascii grids without mutating sampled data", () => {
    const imageData = {
      data: new Uint8ClampedArray([
        255, 0, 0, 255, 0, 255, 0, 255,
        0, 0, 255, 255, 255, 255, 255, 255
      ])
    };
    const settings = {
      ...createDefaultSettings(),
      gridQuality: "balanced",
      gridColumns: 2,
      characters: " .#",
      characterSet: "custom",
      coverage: 100,
      density: 0,
      edgeEmphasis: 0,
      brightness: 0,
      contrast: 100,
      gamma: 100
    };
    const grid = sampleAsciiGrid(imageData, 2, 2, settings);
    const before = JSON.stringify(grid.cells);
    const decoded = decodeAsciiGrid(grid, settings);

    expect(Object.keys(GRID_QUALITY_PRESETS)).toEqual(["soft", "balanced", "detailed", "ultra"]);
    expect(CHARSET_PRESETS.map((preset) => preset.id)).toEqual(["standard", "detailed", "blocks", "dots", "geometric"]);
    expect(grid.cols).toBe(2);
    expect(grid.rows).toBe(2);
    expect(grid.cells[0]).toMatchObject({ r: 255, g: 0, b: 0, a: 255, luma: 54 });
    expect(decoded).toHaveLength(4);
    expect(decoded[0]).toMatchObject({ glyph: " ", color: "rgb(255, 0, 0)" });
    expect(JSON.stringify(grid.cells)).toBe(before);
  });

  it("applies quality presets without touching unrelated settings", () => {
    const base = {
      ...createDefaultSettings(),
      exportFormat: "gif",
      backgroundMode: "none",
      lights: true,
      mask: true,
      animated: true,
      effects: { ...createDefaultSettings().effects, bloom: true }
    };

    const detailed = applyQualityPreset(base, "detailed");

    expect(detailed.qualityPreset).toBe("detailed");
    expect(detailed.characterSet).toBe("detailed");
    expect(detailed.characters).toBe(CHAR_SETS.detailed);
    expect(detailed.fontSize).toBeLessThan(base.fontSize);
    expect(detailed.gamma).toBeGreaterThan(base.gamma);
    expect(detailed.exportFormat).toBe("gif");
    expect(detailed.backgroundMode).toBe("none");
    expect(detailed.lights).toBe(true);
    expect(detailed.mask).toBe(true);
    expect(detailed.animated).toBe(true);
    expect(detailed.effects.bloom).toBe(true);
    expect(matchesQualityPreset(detailed, "detailed")).toBe(true);
  });

  it("defines the expected user-facing quality presets", () => {
    expect(QUALITY_PRESET_ORDER).toEqual(["soft", "balanced", "detailed", "poster"]);
    expect(Object.keys(QUALITY_PRESETS)).toEqual(QUALITY_PRESET_ORDER);
    expect(QUALITY_PRESET_SETTING_KEYS).toEqual([
      "fontSize",
      "characterSet",
      "characters",
      "coverage",
      "edgeEmphasis",
      "density",
      "brightness",
      "contrast",
      "gamma"
    ]);
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
