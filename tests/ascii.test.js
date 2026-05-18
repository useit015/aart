import { describe, expect, it } from "vitest";
import { CHAR_SETS, createDefaultSettings, luminanceToGlyph } from "../src/ascii.js";

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
});
