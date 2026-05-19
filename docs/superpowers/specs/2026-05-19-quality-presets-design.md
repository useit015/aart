# Quality Presets Design

## Summary

Add a compact **Quality Presets** control to the Look tab so users can quickly improve output quality without manually tuning every renderer slider.

The first release uses clear, user-facing presets:

- `Soft`
- `Balanced`
- `Detailed`
- `Poster`
- `Custom`

This feature builds on the recent renderer improvements: full-cell sampling and gamma-based glyph mapping.

## Goals

- Make better output accessible in one click.
- Keep presets predictable and reversible.
- Apply presets to real renderer settings, not just labels.
- Preserve all unrelated workflows: source loading, backgrounds, export settings, lights, masks, animation, post-processing, crop, and feedback.

## Non-Goals

- No image analysis or automatic recommendation in this slice.
- No large visual preset cards or thumbnail previews yet.
- No changes to export file formats or source media handling.
- No creative look packs that bundle animation/effects/post-processing.

## User Experience

Place **Quality Presets** at the top of the existing Look -> Intensity card.

The control should be a compact row or segmented group with:

- `Soft`
- `Balanced`
- `Detailed`
- `Poster`
- `Custom`

The active preset should be visually clear. Selecting a preset should immediately update the preview and the affected sliders.

When the user manually edits any quality-owned slider after choosing a preset, the active preset becomes `Custom`. This avoids lying about the current state while still letting users start from a preset.

## Preset Behavior

Only these settings are owned by quality presets:

- `fontSize`
- `characterSet`
- `characters`
- `coverage`
- `edgeEmphasis`
- `density`
- `brightness`
- `contrast`
- `gamma`

Suggested values:

| Preset | Intent | Settings |
|---|---|---|
| `Soft` | Smooth low-noise output | Larger font size, lower edge emphasis, lower density, gentle contrast, neutral gamma |
| `Balanced` | Reliable default | Current baseline-style settings with standard characters |
| `Detailed` | More readable fine structure | Smaller font size, detailed characters, higher coverage, stronger edge emphasis, higher gamma |
| `Poster` | Bold graphic output | Moderate font size, minimal or standard characters, high contrast, higher density, punchier gamma |
| `Custom` | User-tuned state | Never directly applies values; appears after manual edits |

Exact numeric values can be tuned during implementation, but tests must prove each preset changes the intended owned settings and does not touch unrelated settings.

## Architecture

Add preset definitions near renderer settings in `src/ascii.js`, so the preset contract is testable outside React.

Expected exports:

- `QUALITY_PRESETS`
- `QUALITY_PRESET_ORDER`
- `applyQualityPreset(settings, presetId)`
- `matchesQualityPreset(settings, presetId)` or equivalent helper

`createDefaultSettings()` should include a quality preset state, likely `qualityPreset: "balanced"`.

React should use the helper instead of duplicating preset values in `src/App.jsx`.

Manual updates to quality-owned controls should set `qualityPreset` to `custom`. Other controls should leave `qualityPreset` unchanged.

## Testing

Unit tests:

- Applying each preset updates the owned quality settings.
- Applying a preset preserves unrelated settings such as export format, background mode, lights, mask, animation, and effects.
- Manual quality slider changes mark the preset as `custom`.

App tests:

- The Look tab renders the Quality Presets control.
- Selecting `Detailed` updates visible controls, including `Gamma` and character settings.
- Editing a quality-owned slider shows `Custom`.

Browser QA:

- Load the app at `http://127.0.0.1:5176/`.
- Open Look -> Intensity.
- Select each preset and confirm the preview remains nonblank and no console errors appear.
- Verify desktop and mobile layouts have no horizontal overflow.

## Self-Review

- Spec scan passed for incomplete markers.
- Scope is limited to quality presets.
- Preset ownership is explicit.
- The design avoids hidden changes to export, source, animation, lights, masks, crop, and post-processing.
