# Sigil Quality Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Follow-up UX note:** Palette Mode was removed after implementation because it added a confusing parallel control. The current product surface uses **Detail** for sampled grid density and **Glyph Set** for character ramps. Historical palette-related steps below are obsolete and must not be reintroduced from this plan.

**Goal:** Implement the Sigil-inspired still-image quality engine with sampled grids, corrected aspect rows, improved tone/charset controls, cached redraws, tests, verification, and small-batch commits.

**Architecture:** `src/ascii.js` owns renderer math and plain-data grid helpers. `src/App.jsx` owns canvas orchestration, still-image grid cache invalidation, and UI controls. Video keeps the existing direct rendering path.

**Tech Stack:** Vite, React, Canvas 2D, Vitest, Testing Library, existing shadcn-style controls.

---

## File Map

- Modify `src/ascii.js`
  - Add grid quality constants, palette constants, charset preset constants.
  - Add `correctedRows`, `rgbToLuminance`, `packRgb565`, `applyToneCurve`, `paletteColorFromRgb`, `sampleAsciiGrid`, and `decodeAsciiGrid`.
  - Route existing `buildAsciiCells` through the new helpers where safe.
- Modify `src/App.jsx`
  - Add refs for sampled still-image grid cache and offscreen source canvas reuse.
  - Use the new grid path for still images.
  - Keep the existing immediate source sampling path for video.
  - Add Output Quality controls in the Look tab.
- Modify `tests/ascii.test.js`
  - Add unit coverage for row correction, luma, RGB565 packing, tone curve, palette modes, grid sampling, and grid decoding.
- Modify `tests/app.test.jsx`
  - Add UI coverage for Output Quality, grid quality, palette modes, charset presets, upload controls, and no demos.

---

### Task 1: Renderer Math And Failing Tests

**Files:**
- Modify: `tests/ascii.test.js`
- Modify: `src/ascii.js`

- [ ] **Step 1: Write failing renderer tests**

Add imports:

```js
  GRID_QUALITY_PRESETS,
  PALETTE_MODES,
  CHARSET_PRESETS,
  applyToneCurve,
  correctedRows,
  decodeAsciiGrid,
  packRgb565,
  paletteColorFromRgb,
  rgbToLuminance,
  sampleAsciiGrid,
```

Add tests near the existing renderer primitive tests:

```js
  it("corrects sampled grid rows using source aspect and cell aspect", () => {
    expect(correctedRows(1920, 1080, 144)).toBe(45);
    expect(correctedRows(1080, 1920, 96)).toBe(95);
    expect(correctedRows(0, 1920, 96)).toBe(1);
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

  it("maps palette modes from source color or toned luminance", () => {
    expect(PALETTE_MODES.map((mode) => mode.id)).toEqual(["source", "graphite", "mint", "amber", "duotone", "mono"]);
    expect(paletteColorFromRgb({ r: 12, g: 34, b: 56 }, 128, "source")).toBe("rgb(12, 34, 56)");
    expect(paletteColorFromRgb({ r: 12, g: 34, b: 56 }, 255, "mono")).toBe("#ffffff");
    expect(paletteColorFromRgb({ r: 12, g: 34, b: 56 }, 0, "graphite")).toBe("#0f1112");
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
      paletteMode: "source",
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

    expect(grid.cols).toBe(2);
    expect(grid.rows).toBe(2);
    expect(grid.cells[0]).toMatchObject({ r: 255, g: 0, b: 0, a: 255, luma: 54 });
    expect(decoded).toHaveLength(4);
    expect(decoded[0]).toMatchObject({ glyph: " ", color: "rgb(255, 0, 0)" });
    expect(JSON.stringify(grid.cells)).toBe(before);
  });
```

- [ ] **Step 2: Run failing test**

Run:

```bash
npm run test -- tests/ascii.test.js
```

Expected: fails because the new exports do not exist.

- [ ] **Step 3: Implement renderer helpers**

Add constants and helpers in `src/ascii.js` after `CHAR_SETS`:

```js
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
```

Add default settings:

```js
gridQuality: "balanced",
gridColumns: GRID_QUALITY_PRESETS.balanced.columns,
paletteMode: "source",
charsetPreset: "standard",
```

Add helper functions:

```js
const DEFAULT_CELL_ASPECT = 1.8;

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
```

Implement `applyToneCurve`, `paletteColorFromRgb`, `sampleAsciiGrid`, and `decodeAsciiGrid` with plain data arrays. Use existing `clamp`, `resolveCharacters`, `luminanceToGlyph`, and `adjustColorChannel` patterns where possible, but make `decodeAsciiGrid` operate from cached `grid.cells`.

- [ ] **Step 4: Pass renderer tests**

Run:

```bash
npm run test -- tests/ascii.test.js
```

Expected: all `tests/ascii.test.js` tests pass.

- [ ] **Step 5: Commit renderer batch**

Run:

```bash
git add src/ascii.js tests/ascii.test.js
git commit -m "feat: add still image quality grid"
```

---

### Task 2: Still Image Cache Integration

**Files:**
- Modify: `src/App.jsx`
- Modify: `tests/app.test.jsx`

- [ ] **Step 1: Add a failing app smoke assertion**

Extend the Look-tab quality test to expect grid quality controls:

```js
expect(screen.getByText("Output Quality")).toBeInTheDocument();
expect(screen.getByRole("button", { name: "Ultra" })).toBeInTheDocument();
```

Run:

```bash
npm run test -- tests/app.test.jsx -t "quality presets"
```

Expected: fails because `Output Quality` is not in the UI yet.

- [ ] **Step 2: Add cache refs and imports**

Import:

```js
  CHARSET_PRESETS,
  GRID_QUALITY_ORDER,
  GRID_QUALITY_PRESETS,
  PALETTE_MODES,
  correctedRows,
  decodeAsciiGrid,
  sampleAsciiGrid,
```

Add refs:

```js
const stillGridCacheRef = useRef({ key: "", grid: null });
const sourceCanvasRef = useRef(null);
```

- [ ] **Step 3: Integrate grid path in `draw`**

For `sourceKind !== "video"`:

```js
const cols = Number(settings.gridColumns || GRID_QUALITY_PRESETS[settings.gridQuality]?.columns || GRID_QUALITY_PRESETS.balanced.columns);
const rows = correctedRows(width, height, cols);
const sourceCanvas = sourceCanvasRef.current || document.createElement("canvas");
sourceCanvasRef.current = sourceCanvas;
sourceCanvas.width = cols;
sourceCanvas.height = rows;
const sourceGridCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
sourceGridCtx.imageSmoothingEnabled = true;
drawCroppedSource(sourceGridCtx, source, naturalWidth, naturalHeight, cols, rows, crop);
const gridKey = JSON.stringify({ sourceUrl, crop, cols, rows, lights: settings.lights ? lights : [] });
if (stillGridCacheRef.current.key !== gridKey) {
  stillGridCacheRef.current = {
    key: gridKey,
    grid: sampleAsciiGrid(sourceGridCtx.getImageData(0, 0, cols, rows), cols, rows, settings)
  };
}
const scaleDecodedCell = (cell) => ({
  ...cell,
  x: cell.x * width,
  y: cell.y * height,
  w: cell.w * width,
  h: cell.h * height
});
decodeAsciiGrid(stillGridCacheRef.current.grid, settings).forEach((cell) => {
  drawStyledCell(ctx, scaleDecodedCell(cell), settings, tick, width, height);
});
```

Keep the existing `sourceCtx.getImageData(...); buildAsciiCells(...);` path for video.

- [ ] **Step 4: Ensure stale cache resets on new source**

In `loadSource`, after `setSourceStats(null)`, add:

```js
stillGridCacheRef.current = { key: "", grid: null };
```

- [ ] **Step 5: Run app tests**

Run:

```bash
npm run test -- tests/app.test.jsx
```

Expected: tests pass after UI is added in Task 3; if run before Task 3, only the intentional Output Quality assertion fails.

- [ ] **Step 6: Commit cache integration after Task 3 tests pass**

Run:

```bash
git add src/App.jsx tests/app.test.jsx
git commit -m "feat: use cached still image grid"
```

---

### Task 3: Look-Tab Controls And App Tests

**Files:**
- Modify: `src/App.jsx`
- Modify: `tests/app.test.jsx`

- [ ] **Step 1: Add app tests for controls**

Add a new app test:

```js
  it("exposes sigil-inspired output quality controls", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("tab", { name: "Look" }));
    expect(screen.getByText("Output Quality")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Ultra" }));
    expect(screen.getByText("Grid quality: Ultra")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Amber" }));
    expect(screen.getByText("Palette mode: Amber")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Blocks" }));
    expect(screen.getByLabelText("Chars")).toHaveValue(" ░▒▓█");
    expect(screen.queryByRole("button", { name: "Random Demo" })).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run failing app test**

Run:

```bash
npm run test -- tests/app.test.jsx -t "sigil-inspired output quality"
```

Expected: fails because controls do not exist.

- [ ] **Step 3: Add control callbacks**

In `App`, add:

```js
const selectGridQuality = useCallback((qualityId) => {
  const preset = GRID_QUALITY_PRESETS[qualityId] || GRID_QUALITY_PRESETS.balanced;
  trackEvent("grid_quality_change", { quality: qualityId });
  stillGridCacheRef.current = { key: "", grid: null };
  setSettings((current) => ({
    ...current,
    gridQuality: qualityId,
    gridColumns: preset.columns,
    fontSize: preset.fontSize,
    qualityPreset: "custom"
  }));
  setStatus(`Grid quality: ${preset.label}`);
}, [trackEvent]);

const selectPaletteMode = useCallback((paletteMode) => {
  const label = PALETTE_MODES.find((mode) => mode.id === paletteMode)?.label || "Source";
  trackEvent("palette_mode_change", { paletteMode });
  setSettings((current) => ({ ...current, paletteMode }));
  setStatus(`Palette mode: ${label}`);
}, [trackEvent]);

const selectCharsetPreset = useCallback((presetId) => {
  const preset = CHARSET_PRESETS.find((item) => item.id === presetId);
  if (!preset) return;
  trackEvent("charset_preset_change", { preset: presetId });
  setSettings((current) => ({
    ...current,
    charsetPreset: presetId,
    characterSet: presetId === "standard" || presetId === "detailed" ? presetId : "custom",
    characters: preset.value,
    qualityPreset: "custom"
  }));
}, [trackEvent]);
```

- [ ] **Step 4: Add Output Quality UI**

Place this before the existing `Quality Presets` block in the Intensity card:

```jsx
<div className="flex flex-col gap-2">
  <div className="flex flex-wrap items-center justify-between gap-2">
    <Label className="text-xs text-muted-foreground">Output Quality</Label>
    <Badge variant="outline">Grid quality: {GRID_QUALITY_PRESETS[settings.gridQuality]?.label || "Balanced"}</Badge>
  </div>
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
    {GRID_QUALITY_ORDER.map((qualityId) => (
      <Button key={qualityId} type="button" size="sm" variant={settings.gridQuality === qualityId ? "secondary" : "outline"} onClick={() => selectGridQuality(qualityId)}>
        {GRID_QUALITY_PRESETS[qualityId].label}
      </Button>
    ))}
  </div>
</div>
```

Add palette and charset controls in the Render Style card near Character Set:

```jsx
<div className="flex flex-col gap-2">
  <div className="flex flex-wrap items-center justify-between gap-2">
    <Label className="text-xs text-muted-foreground">Palette Mode</Label>
    <Badge variant="outline">Palette mode: {PALETTE_MODES.find((mode) => mode.id === settings.paletteMode)?.label || "Source"}</Badge>
  </div>
  <div className="grid grid-cols-2 gap-2">
    {PALETTE_MODES.map((mode) => (
      <Button key={mode.id} type="button" size="sm" variant={settings.paletteMode === mode.id ? "secondary" : "outline"} onClick={() => selectPaletteMode(mode.id)}>
        <span aria-hidden="true" className="size-4 rounded-sm border" style={{ background: mode.swatch }} />
        {mode.label}
      </Button>
    ))}
  </div>
</div>
<div className="flex flex-col gap-2">
  <Label className="text-xs text-muted-foreground">Charset Presets</Label>
  <div className="flex flex-wrap gap-2">
    {CHARSET_PRESETS.map((preset) => (
      <Button key={preset.id} type="button" size="sm" variant={settings.charsetPreset === preset.id ? "secondary" : "outline"} onClick={() => selectCharsetPreset(preset.id)}>
        {preset.label}
      </Button>
    ))}
  </div>
</div>
```

- [ ] **Step 5: Pass app tests**

Run:

```bash
npm run test -- tests/app.test.jsx
```

Expected: all app tests pass.

- [ ] **Step 6: Commit control batch**

Run:

```bash
git add src/App.jsx tests/app.test.jsx
git commit -m "feat: add output quality controls"
```

---

### Task 4: Full Verification And Goal Audit

**Files:**
- Modify: only files needed for final polish.

- [ ] **Step 1: Search for regressions**

Run:

```bash
rg -n "demo|Demo|video-demo|Random Demo|Inspire" src tests
```

Expected: only tests that assert demos are absent, or no output from `src`.

- [ ] **Step 2: Full automated verification**

Run:

```bash
npm run test
npm run build
git diff --check
```

Expected: all pass.

- [ ] **Step 3: Browser QA attempt**

Use the in-app Browser plugin at the current localhost URL if permitted:

- Open or reload the app.
- Click Look.
- Verify Output Quality, Palette Mode, Charset Presets, and existing Quality Presets are visible.
- Click Ultra, Amber, and Blocks.
- Confirm no console errors and no horizontal overflow.

If the browser policy blocks localhost again, record that limitation in the final report and rely on the automated tests.

- [ ] **Step 4: Commit any final cleanup**

If files changed during final polish:

```bash
git add src/App.jsx src/ascii.js tests/app.test.jsx tests/ascii.test.js
git commit -m "fix: polish quality engine"
```

- [ ] **Step 5: Completion audit**

Verify these requirements against current files and command output:

- sampled quality grid exists and is used for still images
- corrected aspect rows are tested
- tone, palette, and charset controls exist
- cached redraw path exists and is invalidated only by source/grid-affecting changes
- video path remains intact
- demos remain removed
- tests/build/diff check pass
- small-batch commits exist

Only mark the goal complete after every item is proven by current evidence.
