# Interactive Motion Design

## Goal

Bring the best interactive motion ideas from `/Users/oussmustaine/Documents/vparticle` into Glyph Studio without adding a second renderer or changing export behavior in this slice.

## User Outcome

The preview canvas should feel responsive while editing. Users can turn on interaction, move the pointer over the preview, and see ASCII cells react with a clear motion style. They can also choose a quiet idle behavior and trigger a burst/reset moment without digging through duplicate animation controls.

## Borrowed Ideas

Use these concepts from the particle visualizer:

- Pointer modes: repel, attract, and vortex.
- Idle modes: drift, breathe, and orbit.
- Triggerable burst and reset actions.
- A small number of expressive controls instead of many physics internals.

Do not port the particle canvas, playlist morphing, source sampling, or particle drawing layer.

## UX Model

Add one **Interactive Motion** card in the existing Motion tab.

Controls:

- Enable Interaction
- Pointer: Off, Repel, Attract, Vortex
- Idle: Still, Drift, Breathe, Orbit
- Force
- Radius
- Motion Amount
- Burst
- Reset Motion

This card sits before the current animated ASCII controls because it changes preview interaction, while the existing **Animation** card remains the place for timed ASCII animation/export-style movement.

## Rendering Model

Add deterministic helpers in `src/ascii.js`:

- `computeInteractiveMotionTransform(cell, settings, pointer, tick, width, height)`
- `isInteractiveMotionActive(settings, pointer, burst)`

The helper returns `{ x, y, scale, alpha }`, matching the existing animation transform shape so `drawStyledCell` can compose the two transforms.

The preview should redraw while interaction is enabled, when a pointer is inside the canvas, when idle motion is active, or while a burst is decaying. It should not redraw continuously when interaction is off and no existing animation requires it.

## State Model

Settings added to `createDefaultSettings()`:

- `interactiveMotion: false`
- `pointerMode: "repel"`
- `idleMotion: "still"`
- `motionForce: 55`
- `motionRadius: 26`
- `motionAmount: 45`

App-only refs:

- pointer position and active state
- burst start time and active state
- motion reset token if needed for redraw/status

Pointer movement should not interfere with mask drawing or light placement. When the canvas tool is mask or light, those tools continue to own pointer down/move behavior.

## Accessibility And Performance

Respect `prefers-reduced-motion`. Reduced-motion users get no continuous idle, pointer, or burst transforms, even if controls are enabled.

Transforms should use simple math only. No per-cell persistent physics arrays are introduced in this slice, because the current ASCII renderer already rebuilds/draws cells directly.

## Testing

Unit tests in `tests/ascii.test.js`:

- Pointer modes produce distinct offsets.
- Radius limits pointer influence.
- Idle modes produce distinct transforms.
- Reduced/off settings return identity.

App tests in `tests/app.test.jsx`:

- Motion tab exposes the new Interactive Motion controls.
- Enable Interaction makes pointer controls available.
- Burst and Reset Motion are reachable without replacing mask/light workflows.

Verification:

- `npm run test`
- `npm run build`
- `git diff --check`

Browser QA should be attempted after implementation. If localhost navigation is blocked by app policy again, record that limitation.

## Out Of Scope

- Exporting pointer interaction into GIF/MP4.
- Adding a particle overlay.
- Adding a morph playlist.
- Replacing the existing Animation card.
- Renaming the existing quality or style controls.

## Spec Self-Review

- No open gaps remain.
- The UX adds one card and does not duplicate existing animation export controls.
- The architecture keeps interactive math testable in `src/ascii.js`.
- Pointer tools, masks, lights, and reduced-motion behavior are explicitly constrained.
