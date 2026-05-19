export const CHAR_SETS = {
  standard: "@#S08Xx+=-;:,.",
  detailed: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
  minimal: "@%#*+=-:. "
};

export const GRID_QUALITY_PRESETS = {
  soft: { label: "Soft", columns: 96, fontSize: 14 },
  balanced: { label: "Balanced", columns: 144, fontSize: 11 },
  detailed: { label: "Detailed", columns: 192, fontSize: 8 },
  ultra: { label: "Ultra", columns: 240, fontSize: 7 }
};

export const GRID_QUALITY_ORDER = ["soft", "balanced", "detailed", "ultra"];

export const PALETTE_MODES = [
  { id: "source", label: "Source", swatch: "linear-gradient(135deg, #ff2a7f, #21d4fd)" },
  { id: "graphite", label: "Graphite", swatch: "#70767c" },
  { id: "mint", label: "Mint", swatch: "#7dc495" },
  { id: "amber", label: "Amber", swatch: "#e1b35a" },
  { id: "duotone", label: "Duotone", swatch: "linear-gradient(135deg, #17303d, #f4eed2)" },
  { id: "mono", label: "Mono", swatch: "#ffffff" }
];

export const CHARSET_PRESETS = [
  { id: "standard", label: "Standard", value: CHAR_SETS.standard },
  { id: "detailed", label: "Detailed", value: CHAR_SETS.detailed },
  { id: "blocks", label: "Blocks", value: " ░▒▓█" },
  { id: "dots", label: "Dots", value: " .·•●" },
  { id: "geometric", label: "Geometric", value: " ▏▎▍▌▋▊▉█" }
];

const DEFAULT_CELL_ASPECT = 1.8;
const GRAPHITE_PALETTE = ["#0f1112", "#232729", "#3d4347", "#70767c", "#b8c0c8", "#edf2f6"];
const MINT_PALETTE = ["#07100b", "#11331f", "#1f5d39", "#3e9061", "#7dc495", "#dff5e4"];
const AMBER_PALETTE = ["#110a03", "#392112", "#72401d", "#b86d28", "#e1b35a", "#fff1c4"];
const DUOTONE_PALETTE = ["#081015", "#17303d", "#2d5967", "#5c8d8f", "#b8c9b1", "#f4eed2"];
const MONO_PALETTE = ["#101214", "#2f3438", "#5f676f", "#97a1ab", "#d7dfe8", "#ffffff"];

export const QUALITY_PRESET_SETTING_KEYS = [
  "fontSize",
  "characterSet",
  "characters",
  "coverage",
  "edgeEmphasis",
  "density",
  "brightness",
  "contrast",
  "gamma"
];

export const QUALITY_PRESET_ORDER = ["soft", "balanced", "detailed", "poster"];

export const QUALITY_PRESETS = {
  soft: {
    label: "Soft",
    settings: {
      fontSize: 14,
      characterSet: "standard",
      characters: CHAR_SETS.standard,
      coverage: 78,
      edgeEmphasis: 25,
      density: 12,
      brightness: 4,
      contrast: 88,
      gamma: 95
    }
  },
  balanced: {
    label: "Balanced",
    settings: {
      fontSize: 11,
      characterSet: "standard",
      characters: CHAR_SETS.standard,
      coverage: 85,
      edgeEmphasis: 60,
      density: 30,
      brightness: 0,
      contrast: 100,
      gamma: 100
    }
  },
  detailed: {
    label: "Detailed",
    settings: {
      fontSize: 8,
      characterSet: "detailed",
      characters: CHAR_SETS.detailed,
      coverage: 94,
      edgeEmphasis: 82,
      density: 26,
      brightness: 0,
      contrast: 112,
      gamma: 145
    }
  },
  poster: {
    label: "Poster",
    settings: {
      fontSize: 12,
      characterSet: "minimal",
      characters: CHAR_SETS.minimal,
      coverage: 92,
      edgeEmphasis: 55,
      density: 58,
      brightness: 6,
      contrast: 150,
      gamma: 120
    }
  }
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
    cubeCellSize: 12,
    cubeHSpacing: 100,
    cubeVSpacing: 100,
    cubeTopShade: 1.35,
    cubeLightSide: 1,
    cubeDarkSide: 0.55,
    cubeOutline: 0,
    cubeFlipLight: false,
    discoUniformity: 80,
    discoRandomize: true,
    discoSeed: 0,
    qualityPreset: "balanced",
    gridQuality: "balanced",
    gridColumns: GRID_QUALITY_PRESETS.balanced.columns,
    paletteMode: "source",
    charsetPreset: "standard",
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
    gamma: 100,
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

export function applyQualityPreset(settings, presetId) {
  const preset = QUALITY_PRESETS[presetId];
  if (!preset) {
    return { ...settings, qualityPreset: "custom" };
  }

  return {
    ...settings,
    ...preset.settings,
    qualityPreset: presetId
  };
}

export function matchesQualityPreset(settings, presetId) {
  const preset = QUALITY_PRESETS[presetId];
  if (!preset) return false;

  return QUALITY_PRESET_SETTING_KEYS.every((key) => settings[key] === preset.settings[key]);
}

export function resolveCharacters(settings) {
  if (settings.characterSet === "custom") {
    return settings.characters || CHAR_SETS.standard;
  }
  return CHAR_SETS[settings.characterSet] || settings.characters || CHAR_SETS.standard;
}

export function luminanceToGlyph(luminance, settings = createDefaultSettings()) {
  const chars = resolveCharacters(settings);
  const gamma = clamp(Number(settings.gamma || 100) / 100, 0.2, 4);
  const normalized = Math.max(0, Math.min(255, luminance)) / 255;
  const toned = Math.pow(normalized, 1 / gamma);
  const mapped = settings.invert ? 1 - toned : toned;
  const index = Math.max(0, Math.min(chars.length - 1, Math.round(mapped * (chars.length - 1))));
  return chars[index] || " ";
}

export function adjustLuminance(r, g, b, settings) {
  const weighted = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return Math.max(0, Math.min(255, weighted));
}

export function correctedRows(sourceWidth, sourceHeight, cols, cellAspect = DEFAULT_CELL_ASPECT) {
  if (sourceWidth <= 0 || sourceHeight <= 0 || cols <= 0 || cellAspect <= 0) return 1;
  return Math.max(1, roundTiesToEven((sourceHeight / sourceWidth) * cols / cellAspect));
}

export function rgbToLuminance(red, green, blue) {
  return roundTiesToEven(0.2126 * red + 0.7152 * green + 0.0722 * blue);
}

export function packRgb565(red, green, blue) {
  const r = roundRatioTiesEven(red * 31, 255);
  const g = roundRatioTiesEven(green * 63, 255);
  const b = roundRatioTiesEven(blue * 31, 255);
  return (r << 11) | (g << 5) | b;
}

export function applyToneCurve(luminance, settings = createDefaultSettings()) {
  const brightness = Number(settings.brightness || 0);
  const contrast = Number(settings.contrast || 0);
  const gammaValue = Number(settings.gamma ?? 100);
  const gamma = clamp(gammaValue > 10 ? gammaValue / 100 : gammaValue, 0.2, 4);
  let normalized = clamp(luminance, 0, 255) / 255;
  normalized = clamp(normalized + brightness / 100, 0, 1);
  normalized = clamp((normalized - 0.5) * (1 + contrast / 100) + 0.5, 0, 1);
  normalized = clamp(Math.pow(normalized, 1 / gamma), 0, 1);
  if (settings.invert) normalized = 1 - normalized;
  return Math.round(normalized * 255);
}

export function paletteColorFromRgb(color, tonedLuminance, paletteMode = "source") {
  if (paletteMode === "source") {
    return `rgb(${clamp(Math.round(color.r || 0), 0, 255)}, ${clamp(Math.round(color.g || 0), 0, 255)}, ${clamp(Math.round(color.b || 0), 0, 255)})`;
  }

  const normalized = clamp(tonedLuminance, 0, 255) / 255;
  if (paletteMode === "graphite") return samplePalette(GRAPHITE_PALETTE, normalized);
  if (paletteMode === "mint") return samplePalette(MINT_PALETTE, normalized);
  if (paletteMode === "amber") return samplePalette(AMBER_PALETTE, normalized);
  if (paletteMode === "duotone") return samplePalette(DUOTONE_PALETTE, normalized);
  if (paletteMode === "mono") return samplePalette(MONO_PALETTE, normalized);
  return paletteColorFromRgb(color, tonedLuminance, "source");
}

export function sampleAsciiGrid(imageData, width, height, settings = createDefaultSettings()) {
  const targetCols = clampInteger(settings.gridColumns || width, 1, Math.max(1, width));
  const targetRows = clampInteger(
    settings.gridRows || (targetCols === width ? height : correctedRows(width, height, targetCols)),
    1,
    Math.max(1, height)
  );
  const cells = [];

  for (let row = 0; row < targetRows; row += 1) {
    for (let col = 0; col < targetCols; col += 1) {
      cells[row * targetCols + col] = sampleGridCell(imageData, width, height, col, row, targetCols, targetRows);
    }
  }

  for (let row = 0; row < targetRows; row += 1) {
    for (let col = 0; col < targetCols; col += 1) {
      const index = row * targetCols + col;
      const sample = cells[index];
      const right = cells[row * targetCols + Math.min(targetCols - 1, col + 1)] || sample;
      const down = cells[Math.min(targetRows - 1, row + 1) * targetCols + col] || sample;
      const left = cells[row * targetCols + Math.max(0, col - 1)] || sample;
      const up = cells[Math.max(0, row - 1) * targetCols + col] || sample;
      cells[index] = {
        ...sample,
        edge: Math.max(
          Math.abs(sample.luma - right.luma),
          Math.abs(sample.luma - down.luma),
          Math.abs(sample.luma - left.luma),
          Math.abs(sample.luma - up.luma)
        )
      };
    }
  }

  return {
    cols: targetCols,
    rows: targetRows,
    width,
    height,
    cells
  };
}

export function decodeAsciiGrid(grid, settings = createDefaultSettings()) {
  if (!grid?.cells?.length || !grid.cols || !grid.rows) return [];
  const coverage = Number(settings.coverage || 100) / 100;
  const density = Number(settings.density || 0) / 100;
  const edgeEmphasis = Number(settings.edgeEmphasis || 0) / 100;
  const threshold = 255 * (1 - coverage) + density * 45;
  const toneSettings = {
    ...settings,
    contrast: Number(settings.contrast ?? 100) - 100
  };
  const cells = [];

  grid.cells.forEach((sample, index) => {
    const toned = applyToneCurve(sample.luma, toneSettings);
    const luminance = clamp(toned - (sample.edge || 0) * edgeEmphasis, 0, 255);
    if (sample.a <= 8 || luminance > 255 - threshold) return;

    const col = index % grid.cols;
    const row = Math.floor(index / grid.cols);
    cells.push({
      x: col / grid.cols,
      y: row / grid.rows,
      w: 1 / grid.cols,
      h: 1 / grid.rows,
      luminance,
      color: paletteColorFromRgb(sample, luminance, settings.paletteMode || "source"),
      glyph: glyphFromTonedLuminance(luminance, settings)
    });
  });

  return cells;
}

export function adjustColorChannel(value, settings) {
  const brightness = Number(settings.brightness || 0);
  const contrast = Number(settings.contrast || 100) / 100;
  return Math.max(0, Math.min(255, Math.round((value - 128) * contrast + 128 + brightness)));
}

export function resolveCellMetrics(settings) {
  const fontSize = Number(settings.fontSize || 11);
  if (settings.style === "3d") {
    const cellSize = Number(settings.cubeCellSize || 12);
    return {
      cellW: Math.max(4, Math.round(cellSize * (Number(settings.cubeHSpacing || 100) / 100))),
      cellH: Math.max(4, Math.round(cellSize * 0.88 * (Number(settings.cubeVSpacing || 100) / 100)))
    };
  }

  if (settings.style === "mosaic") {
    const shape = settings.tileShape || "square";
    return {
      cellW: Math.max(3, Math.round(fontSize * (shape === "wide" ? 1.25 : shape === "tall" ? 0.58 : 0.82))),
      cellH: Math.max(5, Math.round(fontSize * (shape === "wide" ? 0.72 : shape === "tall" ? 1.34 : 0.94)))
    };
  }

  if (["pixel", "lego", "disco"].includes(settings.style)) {
    return {
      cellW: Math.max(4, Math.round(fontSize * 0.95)),
      cellH: Math.max(4, Math.round(fontSize * 0.95))
    };
  }

  return {
    cellW: Math.max(3, Math.round(fontSize * 0.62)),
    cellH: Math.max(5, Math.round(fontSize * 1.02))
  };
}

export function buildAsciiCells(imageData, width, height, settings = createDefaultSettings()) {
  const { cellW, cellH } = resolveCellMetrics(settings);
  const coverage = Number(settings.coverage || 100) / 100;
  const density = Number(settings.density || 0) / 100;
  const edgeEmphasis = Number(settings.edgeEmphasis || 0) / 100;
  const cols = Math.ceil(width / cellW);
  const rows = Math.ceil(height / cellH);
  const samples = [];
  const cells = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      samples[row * cols + col] = sampleAsciiCell(imageData, width, height, col * cellW, row * cellH, cellW, cellH, settings);
    }
  }

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const sample = samples[row * cols + col];
      const right = samples[row * cols + Math.min(cols - 1, col + 1)] || sample;
      const down = samples[Math.min(rows - 1, row + 1) * cols + col] || sample;
      const left = samples[row * cols + Math.max(0, col - 1)] || sample;
      const up = samples[Math.max(0, row - 1) * cols + col] || sample;
      const edgeX = Math.max(Math.abs(sample.luminance - right.luminance), Math.abs(sample.luminance - left.luminance));
      const edgeY = Math.max(Math.abs(sample.luminance - down.luminance), Math.abs(sample.luminance - up.luminance));
      const edgeBoost = Math.max(edgeX, edgeY) * edgeEmphasis;
      const luminance = Math.max(0, Math.min(255, sample.luminance - edgeBoost));
      const threshold = 255 * (1 - coverage) + density * 45;
      const adjustedR = adjustColorChannel(sample.r, settings);
      const adjustedG = adjustColorChannel(sample.g, settings);
      const adjustedB = adjustColorChannel(sample.b, settings);

      if (sample.a > 8 && luminance <= 255 - threshold) {
        cells.push({
          x: col * cellW,
          y: row * cellH,
          w: cellW,
          h: cellH,
          luminance,
          color: `rgb(${adjustedR}, ${adjustedG}, ${adjustedB})`,
          glyph: luminanceToGlyph(luminance, settings)
        });
      }
    }
  }

  return cells;
}

function sampleAsciiCell(imageData, width, height, x, y, cellW, cellH, settings) {
  const xEnd = Math.min(width, x + cellW);
  const yEnd = Math.min(height, y + cellH);
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumA = 0;
  let sumLuminance = 0;
  let weight = 0;
  let count = 0;

  for (let sampleY = y; sampleY < yEnd; sampleY += 1) {
    for (let sampleX = x; sampleX < xEnd; sampleX += 1) {
      const i = (sampleY * width + sampleX) * 4;
      const r = imageData.data[i] ?? 0;
      const g = imageData.data[i + 1] ?? 0;
      const b = imageData.data[i + 2] ?? 0;
      const a = imageData.data[i + 3] ?? 255;
      const alpha = a / 255;
      sumR += r * alpha;
      sumG += g * alpha;
      sumB += b * alpha;
      sumA += a;
      sumLuminance += adjustLuminance(r, g, b, settings) * alpha;
      weight += alpha;
      count += 1;
    }
  }

  const divisor = weight || count || 1;
  return {
    r: Math.round(sumR / divisor),
    g: Math.round(sumG / divisor),
    b: Math.round(sumB / divisor),
    a: count ? sumA / count : 0,
    luminance: sumLuminance / divisor
  };
}

function sampleGridCell(imageData, width, height, col, row, cols, rows) {
  const xStart = Math.floor((col / cols) * width);
  const xEnd = Math.max(xStart + 1, Math.ceil(((col + 1) / cols) * width));
  const yStart = Math.floor((row / rows) * height);
  const yEnd = Math.max(yStart + 1, Math.ceil(((row + 1) / rows) * height));
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumA = 0;
  let weight = 0;
  let count = 0;

  for (let y = yStart; y < Math.min(height, yEnd); y += 1) {
    for (let x = xStart; x < Math.min(width, xEnd); x += 1) {
      const index = (y * width + x) * 4;
      const alphaByte = imageData.data[index + 3] ?? 255;
      const alpha = alphaByte / 255;
      sumR += (imageData.data[index] ?? 0) * alpha;
      sumG += (imageData.data[index + 1] ?? 0) * alpha;
      sumB += (imageData.data[index + 2] ?? 0) * alpha;
      sumA += alphaByte;
      weight += alpha;
      count += 1;
    }
  }

  const divisor = weight || count || 1;
  const r = Math.round(sumR / divisor);
  const g = Math.round(sumG / divisor);
  const b = Math.round(sumB / divisor);

  return {
    r,
    g,
    b,
    a: count ? Math.round(sumA / count) : 0,
    luma: rgbToLuminance(r, g, b),
    rgb565: packRgb565(r, g, b),
    edge: 0
  };
}

function glyphFromTonedLuminance(luminance, settings) {
  const chars = resolveCharacters(settings);
  if (chars.length === 1) return chars[0] || " ";
  const index = Math.max(0, Math.min(chars.length - 1, Math.round((clamp(luminance, 0, 255) / 255) * (chars.length - 1))));
  return chars[index] || chars[chars.length - 1] || " ";
}

function samplePalette(palette, normalized) {
  const index = Math.round(clamp(normalized, 0, 1) * (palette.length - 1));
  return palette[index] || palette[palette.length - 1] || "#ffffff";
}

function clampInteger(value, min, max) {
  return Math.max(min, Math.min(max, Math.round(Number(value) || 0)));
}

function roundTiesToEven(value) {
  const floor = Math.floor(value);
  const fraction = value - floor;
  const epsilon = 1e-12;
  if (Math.abs(fraction - 0.5) <= epsilon) {
    return floor % 2 === 0 ? floor : floor + 1;
  }
  return fraction < 0.5 ? floor : floor + 1;
}

function roundRatioTiesEven(numerator, denominator) {
  const quotient = Math.floor(numerator / denominator);
  const remainder = numerator % denominator;
  const doubled = remainder * 2;
  if (doubled > denominator) return quotient + 1;
  if (doubled < denominator || quotient % 2 === 0) return quotient;
  return quotient + 1;
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value)));
}

export function resolveBackgroundBlurFrame(width, height, blur = 0) {
  const pad = Math.max(0, Number(blur || 0)) * 2;
  const offset = pad === 0 ? 0 : -pad;
  return {
    x: offset,
    y: offset,
    width: width + pad * 2,
    height: height + pad * 2
  };
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
