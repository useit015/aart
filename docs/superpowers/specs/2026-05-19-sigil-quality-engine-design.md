# Sigil-Inspired Still Image Quality Engine Design

## Goal

Improve still-image ASCII output quality by borrowing the best-fitting ideas from `~/workspace/sigil`: a source-aware sampled grid, corrected aspect rows, cleaner tone and palette decoding, richer charset presets, and a redraw path that can reuse sampled data for visual tuning.

This design intentionally targets still images first. Uploaded video playback and export behavior stay on the current rendering path until a later video-specific upgrade.

## User Outcome

Users should get sharper, cleaner still-image output with fewer muddy midtones, better aspect preservation, and more polished color looks. The controls should make the quality model clear:

- Grid quality changes how much source detail is sampled.
- Palette, charset, tone, and gamma change how the sampled grid is decoded and rendered.
- Manual tuning remains available without breaking upload, background, crop, mask, light, animation, or export workflows.

## Source Ideas From Sigil

Useful Sigil concepts:

- Conversion quality presets based on grid columns (`tiny`, `light`, `balanced`, `sharp`, `ultra`).
- Corrected row calculation from source aspect ratio and cell aspect.
- Separate sampled source data from decode-time look controls.
- Palette modes such as source color, graphite, mint, amber, duotone, and mono.
- Charset presets beyond one default ramp.
- Tone curve order: brightness, contrast, gamma, invert.
- Compact stored per-cell color/luma data that can be redrawn without re-reading source pixels.

Not in scope:

- Rust exporter integration.
- Server-side jobs, dataset storage, chunking, or share flows.
- Full reusable package extraction.
- WebGL effects.

## Rendering Model

The app will add a two-stage still-image path:

1. **Sample stage**
   - Draw the cropped still image into an offscreen sampling canvas.
   - Resolve grid columns from selected quality.
   - Calculate rows from source/crop aspect and a cell aspect constant.
   - Sample each grid cell into compact data:
     - average RGB composited over black
     - alpha
     - luminance
     - neighboring edge strength
   - Cache this grid while the source, crop, lights-before-sampling inputs, or grid quality are unchanged.

2. **Decode stage**
   - Apply tone controls in this order: brightness, contrast, gamma, invert.
   - Apply coverage, density, and edge emphasis.
   - Map toned luminance to glyphs through the active charset.
   - Resolve color through palette mode:
     - source color uses sampled RGB
     - graphite/mint/amber/duotone/mono map toned luminance into fixed palettes

3. **Render stage**
   - Draw decoded cells to the visible canvas using the existing style renderer where possible.
   - Preserve existing backgrounds, masks, light markers, post-processing effects, and exports.

The visible canvas can remain the current fixed preview/export canvas size. The quality grid controls source sampling density inside that canvas, not merely the font size.

## Controls

Add a compact **Output Quality** section in the Look tab.

### Grid Quality

Presets:

- Soft: lower grid density, calmer output.
- Balanced: default, readable and fast.
- Detailed: sharper still images.
- Ultra: highest still-image detail, with a clear performance note in status copy if needed.

Grid quality updates sampled grid density. Existing quality presets can continue to set font size, coverage, edge, density, contrast, and gamma, but this new grid setting becomes the primary detail control.

### Palette Mode

Modes:

- Source
- Graphite
- Mint
- Amber
- Duotone
- Mono

Palette mode changes should redraw from cached sampled data.

### Charset Presets

Presets:

- Standard
- Detailed
- Blocks
- Dots
- Geometric
- Custom

Selecting a charset preset updates the character ramp and marks the active quality preset as custom when it diverges from a preset.

### Tone

Keep brightness, contrast, gamma, coverage, density, edge emphasis, and invert mapping. The underlying math changes to the Sigil-style tone order for consistency.

## Data And APIs

Add renderer helpers in `src/ascii.js`:

- `correctedRows(sourceWidth, sourceHeight, cols, cellAspect)`
- `rgbToLuminance(red, green, blue)`
- `packRgb565(red, green, blue)` if useful for compact tests and future reuse
- `sampleAsciiGrid(imageData, width, height, settings)`
- `decodeAsciiGrid(grid, settings)`
- `paletteColorFromRgb(color, tonedLuma, paletteMode)`
- `applyToneCurve(luma, settings)`

The grid result should be plain JavaScript data so tests can inspect it without a browser canvas.

`src/App.jsx` keeps ownership of canvas orchestration:

- Decide when the cached still-image grid is stale.
- Build the grid for still images.
- Decode and draw cells.
- Fall back to the current immediate path for video.

## Cache Invalidation

Rebuild the sampled grid when any of these change:

- source image
- crop rectangle or rotation
- output grid quality
- source canvas dimensions
- pre-sampling light contribution, if lights are applied before sampling

Do not rebuild the sampled grid for:

- palette mode
- charset
- brightness/contrast/gamma/invert
- coverage/density/edge emphasis
- background mode
- mask overlay
- post-processing effects

Those controls should decode/redraw from cached grid data.

## Error Handling

- If the browser cannot provide a 2D canvas context, keep the existing no-op behavior and show a concise status message when possible.
- Clamp invalid quality values to Balanced.
- Clamp tone and palette inputs to valid ranges.
- If the cached grid is missing or stale, rebuild synchronously from the current source before drawing.

## Testing

Unit tests in `tests/ascii.test.js`:

- corrected rows preserve source aspect.
- RGB luminance matches locked values.
- tone curve applies brightness, contrast, gamma, invert in order.
- palette modes return expected source and remapped colors.
- sampled grid stores averaged RGB/luma/alpha.
- decode grid maps glyphs and palette colors without mutating grid data.

App tests in `tests/app.test.jsx`:

- Output Quality controls appear in the Look tab.
- Grid quality buttons update active state.
- Palette mode buttons appear and can be selected.
- Charset preset selection updates the Chars input.
- Upload/video controls remain present and demo controls remain absent.

Verification:

- `npm run test`
- `npm run build`
- `git diff --check`

Browser QA should be attempted in the in-app browser if localhost access is available. If the browser policy blocks local access again, record that limitation and rely on automated tests.

## Implementation Batches

Commit in small batches:

1. Renderer math and unit tests.
2. App integration and cache path.
3. Look-tab controls and app tests.
4. Verification cleanup.

## Open Decisions

Chosen defaults:

- Still images use the new quality grid.
- Videos keep the existing direct render path.
- Balanced remains the default quality.
- Palette default is Source.
- Ultra is allowed in preview and export, but should be bounded to avoid runaway canvas work.

No unresolved decisions remain for implementation planning.
