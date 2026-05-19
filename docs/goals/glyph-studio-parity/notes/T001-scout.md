# T001 Scout Receipt

## Public Glyph Studio Feature Inventory

Evidence sources:

- `public reference site` page text and live DOM snapshot.
- `public reference changelog` public changelog.
- Live browser inspection of controls, selects, inputs, media/canvas elements, and default values.

Core workflows:

- Drag/drop upload target with copy: "Drop an image or video here" and "or click to browse / paste from clipboard".
- Upload button supports image/video input.
- Paste from clipboard is advertised as a first-class source path.
- Inspire Me loads a random tuned demo.
- Demo/gallery assets include 31 curated images and 3 videos per changelog, plus background gallery attribution to background source.
- Canvas-based live preview; live DOM had 4 canvases and hidden video/img elements after demo preload.

Export/source controls:

- Export formats: PNG, JPG, GIF (Animated), MP4 (Video), MP4 (Animation).
- Export resolution: 1x, 2x, 3x, 4x.
- Export progress surface: "Exporting... 0%".
- Animated export controls: duration 3, 5, 10, 15 seconds; frame rate 15, 20, 24, 30, 60 fps.
- Changelog says GIF export, MP4 animation export, MP4 video export, H.264 fallback handling, safe resolution dropdown, and export failure handling exist.

Video/playback:

- Video support with real-time ASCII rendering.
- Playback controls: Play, Stop, Seek, Speed 0.25x, 0.5x, 1x, 1.5x, 2x, FPS readout.
- Changelog says animated ASCII works on videos and video export should not freeze playback.

Crop and rotate:

- Crop / Rotate button opens full-screen crop editor.
- Editor includes 90 degree rotate left/right, cancel/save, original-image preview, 8 drag handles, rule-of-thirds grid, undo/redo per changelog.
- Crop transition and save animation are noted in public changelog.

Background:

- Modes: Blurred Image, Solid Black, Original Image, None (Transparent).
- Blur slider 0-60, default 8px.
- Opacity slider 0-100, default 90%.
- Backgrounds gallery swaps background image only; Inspire changes full parameters.

Character/render styles:

- Styles: Characters, Block Characters, Dots, Lines, Diagonal, Cross, Diamond, Mixed, Pixel Art, LEGO, Mosaic, Braille, Cube, Disco.
- Mosaic tile shape: Square, Wide, Tall.
- Cube controls: Cell Size 4-60, H. Spacing, V. Spacing, Top Shade, Light Side, Dark Side, Outline, Flip Light.
- Disco controls: Uniformity, Pattern Randomize, lens-flare behavior through Lights pad, Sparkles post-FX.
- Character controls: Font Size 3-48/default 11, Character Set Standard/Detailed/Minimal, custom chars textbox, Blend Mode Normal/Overlay/Color Dodge/Screen/Lighter, Char Opacity, Invert Mapping, Dot Grid Overlay, Randomize Characters.

Intensity:

- Coverage, Edge Emphasis, Density, Brightness, Contrast sliders.
- Changelog clarifies Coverage is dither, Density is brightness threshold, Brightness/Contrast affect color only.

Animation:

- Animated ASCII toggle.
- Animation styles: Wave, Cascade Left to Right, Cascade Right to Left, Cascade Top to Bottom, Reveal, Pulse.
- Speed 1-8 seconds, Intensity, Randomness.

Lights:

- Enable Lights.
- Place up to 4 lights on canvas.
- Light pad instructions: tap to add, drag dots to move, click dot to select.
- Per-light controls include Radius, Intensity, Blur, Rotation; delete active light button is present.
- Low-font-size performance note bumps font size to 12.

Mask:

- Enable Mask.
- Tools: Freehand, Rectangle, Ellipse.
- Brush Size.
- Show Overlay, Invert Mask, Clear Mask.
- Restricts ASCII art to the mask area while preserving background outside.

Post-processing:

- Color Overlay with color picker, opacity, blend modes Multiply, Overlay, Screen, Color, Hue, Saturation, Luminosity, Soft Light, Hard Light, Color Burn, Color Dodge.
- Stackable effects: Vignette, Scan Lines, CRT Curvature, Chromatic, Bloom, Character Bloom, Character Chromatic, Film Grain, Glitch, RGB Split, Blur, Pixelate, Halftone, Film Dust, Sparkles.
- Changelog says effect-specific inline intensity sliders appear when toggled.

Chrome, feedback, and auxiliary pages:

- Theme toggle: Light Mode / dark mode.
- Hamburger menu.
- Report a Bug modal with description textarea, technical details auto-capture, cancel/send states; changelog says sent/retry states.
- Suggest a Feature form is present from menu/footer.
- About modal with product description, project credit, social links, animated hero per changelog.
- Changelog page at `/changelog`.
- External links: background source, Instagram, X.

Responsive/accessibility:

- Changelog explicitly claims mobile responsive layout.
- Local recreation needs desktop and mobile checks.

## Local Repo Map

- Repository root: `/Users/oussmustaine/Documents/a-art`.
- Current branch: `master`.
- Current tracked app code: none found.
- Current files are only GoalBuddy control files under `docs/goals/glyph-studio-parity/`.
- `rg --files` returned only `goal.md` and `state.yaml`.
- No `package.json`, README, source directory, or tests exist yet.
- `git status --short` showed `?? docs/`.
- One read-only probe using unescaped globs failed with `zsh: no matches found: vite.config.*`; this is not a project failure, only a shell glob issue.

## Verification Commands Available

Because no app exists yet, verification commands must be introduced by the first Worker slice. Recommended baseline:

- `npm install` after scaffolding package metadata.
- `npm run build`.
- `npm run test` if tests are added.
- Browser smoke checks against local dev/static server.
- Canvas-pixel check for nonblank preview after generated test image upload or demo generation.
- Export smoke checks for PNG/JPG data URLs or downloads. GIF/MP4 can be staged after static image parity unless the first Worker implements encoders.

## Candidate Implementation Slices

1. Scaffold a production web app and implement the core static-image ASCII editor vertical slice: upload/paste/demo generation, canvas rendering, the full control-panel surface, character/style/background/intensity/post-FX controls, PNG/JPG export, light/dark mode, menu/about/feedback/changelog shells, responsive layout, and smoke tests. This is the largest safe first slice because the repo is empty and most later parity work depends on the editor foundation.
2. Add advanced style parity: Cube, Disco, Mosaic/Braille/LEGO/raster styles, lights pad, mask drawing, crop/rotate modal, and richer post-FX sliders.
3. Add video/GIF/MP4 parity: video upload/playback/seek/speed/FPS, animated ASCII over video/static images, GIF export, MP4 animation/video export with progress and graceful fallback.
4. Harden parity: demo gallery/background gallery, failure/retry states, accessibility polish, responsive mobile QA, and final feature inventory coverage audit.
