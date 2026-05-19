# Quality Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Look-tab Quality Presets (`Soft`, `Balanced`, `Detailed`, `Poster`, `Custom`) that apply real renderer settings and mark manual quality edits as custom.

**Architecture:** Preset definitions and pure helpers live in `src/ascii.js` so behavior is unit-testable outside React. `src/App.jsx` renders a compact preset strip in Look -> Intensity, calls the pure helpers when a preset is selected, and routes quality-owned manual controls through a custom-marking update path.

**Tech Stack:** React, Vite, Vitest, Testing Library, shadcn/Radix UI controls.

---

### Task 1: Renderer Preset Contract

**Files:**
- Modify: `src/ascii.js`
- Test: `tests/ascii.test.js`

- [ ] **Step 1: Write the failing tests**

Add imports:

```js
import {
  QUALITY_PRESET_ORDER,
  QUALITY_PRESETS,
  QUALITY_PRESET_SETTING_KEYS,
  applyQualityPreset,
  matchesQualityPreset
} from "../src/ascii.js";
```

Add tests:

```js
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
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm run test -- tests/ascii.test.js`

Expected: FAIL because `QUALITY_PRESET_ORDER`, `QUALITY_PRESETS`, `QUALITY_PRESET_SETTING_KEYS`, `applyQualityPreset`, and `matchesQualityPreset` are not exported yet.

- [ ] **Step 3: Implement the preset helpers**

Add exports in `src/ascii.js` near `CHAR_SETS` and `createDefaultSettings()`:

```js
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

export function applyQualityPreset(settings, presetId) {
  const preset = QUALITY_PRESETS[presetId];
  if (!preset) return { ...settings, qualityPreset: "custom" };
  return { ...settings, ...preset.settings, qualityPreset: presetId };
}

export function matchesQualityPreset(settings, presetId) {
  const preset = QUALITY_PRESETS[presetId];
  if (!preset) return false;
  return QUALITY_PRESET_SETTING_KEYS.every((key) => settings[key] === preset.settings[key]);
}
```

Add `qualityPreset: "balanced"` to `createDefaultSettings()`.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `npm run test -- tests/ascii.test.js`

Expected: PASS.

### Task 2: React Preset UI

**Files:**
- Modify: `src/App.jsx`
- Test: `tests/app.test.jsx`

- [ ] **Step 1: Write the failing UI test**

Add `CHAR_SETS` import from `../src/ascii.js`.

Add a test:

```js
it("applies quality presets and marks manual quality edits as custom", async () => {
  render(<App />);

  await userEvent.click(screen.getByRole("tab", { name: "Look" }));
  expect(screen.getByText("Quality Presets")).toBeInTheDocument();
  expect(screen.getByText("Active quality preset: Balanced")).toBeInTheDocument();

  await userEvent.click(screen.getByRole("button", { name: "Detailed" }));
  expect(screen.getByText("Active quality preset: Detailed")).toBeInTheDocument();
  expect(screen.getByLabelText("Chars")).toHaveValue(CHAR_SETS.detailed);
  expect(screen.getByText("145%")).toBeInTheDocument();

  fireEvent.change(screen.getByLabelText("Chars"), { target: { value: "@@" } });
  expect(screen.getByText("Active quality preset: Custom")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused app test and verify it fails**

Run: `npm run test -- tests/app.test.jsx -t "quality presets"`

Expected: FAIL because the UI does not render Quality Presets yet.

- [ ] **Step 3: Wire preset helpers into React**

In `src/App.jsx` import:

```js
QUALITY_PRESET_ORDER,
QUALITY_PRESETS,
applyQualityPreset
```

Add helpers in `App()`:

```js
const selectQualityPreset = useCallback((presetId) => {
  if (presetId === "custom") {
    setSettings((current) => ({ ...current, qualityPreset: "custom" }));
    return;
  }
  trackEvent("quality_preset_change", { preset: presetId });
  setSettings((current) => applyQualityPreset(current, presetId));
  setStatus(`${QUALITY_PRESETS[presetId]?.label || "Custom"} quality preset applied`);
}, [trackEvent]);

const updateQualitySetting = useCallback((key, value) => {
  trackEvent("setting_change", { key, value, qualityPreset: "custom" });
  setSettings((current) => ({ ...current, [key]: value, qualityPreset: "custom" }));
}, [trackEvent]);

const updateCharacterSet = useCallback((value) => {
  trackEvent("setting_change", { key: "characterSet", value, qualityPreset: "custom" });
  setSettings((current) => ({
    ...current,
    characterSet: value,
    characters: value === "custom" ? current.characters : CHAR_SETS[value],
    qualityPreset: "custom"
  }));
}, [trackEvent]);
```

In the Intensity `ControlCard`, add a compact button row before sliders:

```jsx
<div className="flex flex-col gap-2">
  <div className="flex items-center justify-between gap-2">
    <Label className="text-xs text-muted-foreground">Quality Presets</Label>
    <Badge variant="outline" className="shrink-0">
      Active quality preset: {QUALITY_PRESETS[settings.qualityPreset]?.label || "Custom"}
    </Badge>
  </div>
  <div className="grid grid-cols-5 gap-2">
    {[...QUALITY_PRESET_ORDER, "custom"].map((presetId) => {
      const label = QUALITY_PRESETS[presetId]?.label || "Custom";
      return (
        <Button
          key={presetId}
          type="button"
          size="sm"
          variant={settings.qualityPreset === presetId ? "secondary" : "outline"}
          onClick={() => selectQualityPreset(presetId)}
        >
          {label}
        </Button>
      );
    })}
  </div>
</div>
```

Route quality-owned controls through `updateQualitySetting` and route character set changes through `updateCharacterSet`.

Change the Contrast slider to `min={0}` and `max={200}` because preset values use `100` as neutral and may exceed neutral.

- [ ] **Step 4: Run focused app test and verify it passes**

Run: `npm run test -- tests/app.test.jsx -t "quality presets"`

Expected: PASS.

### Task 3: Full Verification

**Files:**
- No source files beyond Task 1 and Task 2.

- [ ] **Step 1: Run all automated checks**

Run:

```bash
npm run test
npm run build
git diff --check
```

Expected: all pass.

- [ ] **Step 2: Browser QA**

Use the in-app Browser on `http://localhost:5174/`.

Required checks:

- Page identity is Glyph Studio.
- DOM snapshot is not blank.
- No Vite/framework overlay is visible.
- Console warnings/errors are empty.
- Open Look tab.
- Select `Soft`, `Detailed`, and `Poster`.
- Confirm the active preset badge updates.
- Change `Chars` and confirm the badge updates to `Custom`.
- Capture desktop and mobile screenshots outside the repo.

- [ ] **Step 3: Commit implementation**

Run:

```bash
git add src/ascii.js src/App.jsx tests/ascii.test.js tests/app.test.jsx
git commit -m "feat: add quality presets"
```

Expected: commit succeeds and worktree is clean except any intentionally ignored local artifacts.

## Self-Review

- Spec coverage: preset strip, real renderer settings, custom state, ownership boundaries, tests, and browser QA are covered.
- Placeholder scan: no incomplete markers are present.
- Scope check: this plan does not include auto-enhance, thumbnail previews, creative look packs, export changes, or image analysis.
