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

export const POST_PROCESSING_PASS_KEYS = [
  ["colorOverlay", "color-overlay"],
  ["vignette", "vignette"],
  ["scanLines", "scan-lines"],
  ["crt", "crt"],
  ["chromatic", "chromatic"],
  ["bloom", "bloom"],
  ["charBloom", "char-bloom"],
  ["charChromatic", "char-chromatic"],
  ["filmGrain", "film-grain"],
  ["glitch", "glitch"],
  ["rgbSplit", "rgb-split"],
  ["blur", "blur"],
  ["pixelate", "pixelate"],
  ["halftone", "halftone"],
  ["filmDust", "film-dust"],
  ["sparkles", "sparkles"]
];

export function createDefaultSettings() {
  return {
    exportFormat: "png",
    exportScale: 2,
    exportDuration: 3,
    exportFps: 30,
    backgroundMode: "blur",
    backgroundBlur: 8,
    backgroundOpacity: 90,
    style: "characters",
    tileShape: "square",
    cubeCellSize: 16,
    cubeHSpacing: 4,
    cubeVSpacing: 4,
    cubeTopShade: 74,
    cubeLightSide: 62,
    cubeDarkSide: 36,
    cubeOutline: true,
    cubeFlipLight: false,
    discoUniformity: 68,
    discoRandomize: true,
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
      vignetteAmount: 62,
      scanLines: false,
      scanLinesAmount: 45,
      crt: false,
      crtAmount: 58,
      chromatic: false,
      chromaticAmount: 45,
      bloom: false,
      bloomAmount: 42,
      charBloom: false,
      charBloomAmount: 55,
      charChromatic: false,
      charChromaticAmount: 46,
      filmGrain: false,
      filmGrainAmount: 38,
      glitch: false,
      glitchAmount: 48,
      rgbSplit: false,
      rgbSplitAmount: 52,
      blur: false,
      blurAmount: 36,
      pixelate: false,
      pixelateAmount: 52,
      halftone: false,
      halftoneAmount: 48,
      filmDust: false,
      filmDustAmount: 42,
      sparkles: false,
      sparklesAmount: 40
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

export function resolvePostProcessingPlan(effects = {}) {
  return POST_PROCESSING_PASS_KEYS
    .filter(([key]) => Boolean(effects[key]))
    .map(([, pass]) => pass);
}

export function computeAnimationTransform(cell, settings = createDefaultSettings(), tick = 0, width = 1, height = 1) {
  if (!settings.animated) return { x: 0, y: 0, scale: 1, alpha: 1 };

  const speed = Math.max(1, Number(settings.animationSpeed || 3000));
  const progress = ((tick % speed) + speed) % speed / speed;
  const intensity = Number(settings.animationIntensity || 0) / 100;
  const randomness = Number(settings.animationRandomness || 0) / 100;
  const jitter = Math.sin(cell.x * 12.9898 + cell.y * 78.233) * randomness;
  const phase = progress * Math.PI * 2;
  const normalizedX = clamp(cell.x / Math.max(1, width), 0, 1);
  const normalizedY = clamp(cell.y / Math.max(1, height), 0, 1);

  if (settings.animationStyle === "cascade-lr") {
    const local = progress - normalizedX * 0.85;
    return {
      x: Math.sin((local + jitter * 0.08) * Math.PI) * 16 * intensity,
      y: 0,
      scale: 0.92 + clamp(local, 0, 1) * 0.12,
      alpha: clamp(local * 2.2, 0.12, 1)
    };
  }

  if (settings.animationStyle === "cascade-rl") {
    const local = progress - (1 - normalizedX) * 0.85;
    return {
      x: -Math.sin((local + jitter * 0.08) * Math.PI) * 16 * intensity,
      y: 0,
      scale: 0.9 + clamp(local, 0, 1) * 0.14,
      alpha: clamp(local * 2.1, 0.12, 1)
    };
  }

  if (settings.animationStyle === "cascade-tb") {
    const local = progress - normalizedY * 0.85;
    return {
      x: 0,
      y: Math.sin((local + jitter * 0.08) * Math.PI) * 18 * intensity,
      scale: 0.9 + clamp(local, 0, 1) * 0.16,
      alpha: clamp(local * 2.15, 0.1, 1)
    };
  }

  if (settings.animationStyle === "reveal") {
    const threshold = progress * 1.25;
    const local = threshold - (normalizedX * 0.58 + normalizedY * 0.42);
    return {
      x: 0,
      y: (1 - clamp(local * 3, 0, 1)) * 18 * intensity,
      scale: 0.86 + clamp(local * 2.2, 0, 1) * 0.14,
      alpha: clamp(local * 3.5, 0.08, 1)
    };
  }

  if (settings.animationStyle === "pulse") {
    const pulse = Math.sin(phase + (cell.luminance / 255) * Math.PI + jitter) * intensity;
    return {
      x: 0,
      y: 0,
      scale: 1 + pulse * 0.16,
      alpha: clamp(0.72 + pulse * 0.28, 0.34, 1)
    };
  }

  return {
    x: Math.cos(phase + cell.y * 0.018 + jitter) * 4 * intensity,
    y: Math.sin(phase + cell.x * 0.025 + cell.y * 0.018 + jitter) * 22 * intensity,
    scale: 1,
    alpha: 1
  };
}
