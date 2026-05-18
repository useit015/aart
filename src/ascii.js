export const CHAR_SETS = {
  standard: "@#S08Xx+=-;:,.",
  detailed: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
  minimal: "@%#*+=-:. "
};

export const STYLE_LABELS = {
  characters: "Characters",
  "block-chars": "Block Characters",
  dots: "Dots",
  lines: "Lines",
  diagonal: "Diagonal",
  cross: "Cross",
  diamond: "Diamond",
  mixed: "Mixed",
  pixel: "Pixel Art",
  lego: "LEGO",
  mosaic: "Mosaic",
  braille: "Braille",
  "3d": "Cube",
  disco: "Disco ✨"
};

export function createDefaultSettings() {
  return {
    exportFormat: "png",
    exportScale: 2,
    backgroundMode: "blur",
    backgroundBlur: 8,
    backgroundOpacity: 90,
    style: "characters",
    tileShape: "square",
    fontSize: 11,
    characterSet: "standard",
    characters: CHAR_SETS.standard,
    blendMode: "source-over",
    charOpacity: 100,
    invert: false,
    dotGrid: false,
    randomize: false,
    coverage: 85,
    edgeEmphasis: 60,
    density: 30,
    brightness: 0,
    contrast: 100,
    animated: false,
    animationStyle: "wave",
    animationSpeed: 3000,
    animationIntensity: 60,
    animationRandomness: 50,
    lights: false,
    mask: false,
    maskTool: "freehand",
    brushSize: 30,
    showMaskOverlay: true,
    invertMask: false,
    effects: {
      colorOverlay: false,
      color: "#ff2a7f",
      colorOpacity: 30,
      colorBlend: "multiply",
      vignette: false,
      scanLines: false,
      crt: false,
      chromatic: false,
      bloom: false,
      charBloom: false,
      charChromatic: false,
      filmGrain: false,
      glitch: false,
      rgbSplit: false,
      blur: false,
      pixelate: false,
      halftone: false,
      filmDust: false,
      sparkles: false
    }
  };
}

export function resolveCharacters(settings) {
  if (settings.characterSet === "custom") {
    return settings.characters || CHAR_SETS.standard;
  }
  return CHAR_SETS[settings.characterSet] || settings.characters || CHAR_SETS.standard;
}

export function luminanceToGlyph(luminance, settings = createDefaultSettings()) {
  const chars = resolveCharacters(settings);
  const normalized = Math.max(0, Math.min(255, luminance)) / 255;
  const mapped = settings.invert ? 1 - normalized : normalized;
  const index = Math.max(0, Math.min(chars.length - 1, Math.round(mapped * (chars.length - 1))));
  return chars[index] || " ";
}

export function adjustLuminance(r, g, b, settings) {
  const brightness = Number(settings.brightness || 0);
  const contrast = Number(settings.contrast || 100) / 100;
  const weighted = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const contrasted = (weighted - 128) * contrast + 128 + brightness;
  return Math.max(0, Math.min(255, contrasted));
}

export function buildAsciiCells(imageData, width, height, settings = createDefaultSettings()) {
  const fontSize = Number(settings.fontSize || 11);
  const cellW = Math.max(3, Math.round(fontSize * 0.62));
  const cellH = Math.max(5, Math.round(fontSize * 1.02));
  const coverage = Number(settings.coverage || 100) / 100;
  const density = Number(settings.density || 0) / 100;
  const cells = [];

  for (let y = 0; y < height; y += cellH) {
    for (let x = 0; x < width; x += cellW) {
      const sampleX = Math.min(width - 1, x + Math.floor(cellW / 2));
      const sampleY = Math.min(height - 1, y + Math.floor(cellH / 2));
      const i = (sampleY * width + sampleX) * 4;
      const r = imageData.data[i] ?? 0;
      const g = imageData.data[i + 1] ?? 0;
      const b = imageData.data[i + 2] ?? 0;
      const a = imageData.data[i + 3] ?? 255;
      const luminance = adjustLuminance(r, g, b, settings);
      const threshold = 255 * (1 - coverage) + density * 45;

      if (a > 8 && luminance <= 255 - threshold) {
        cells.push({
          x,
          y,
          w: cellW,
          h: cellH,
          luminance,
          color: `rgb(${r}, ${g}, ${b})`,
          glyph: luminanceToGlyph(luminance, settings)
        });
      }
    }
  }

  return cells;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value)));
}
