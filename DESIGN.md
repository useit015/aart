# Design

## Visual Theme

Glyph Studio uses a dark orbital product interface inspired by Starlink hardware and mission-control software. The scene is a creator at a dim desk, looking at a large preview while making precise export decisions. The interface should feel engineered, quiet, and high trust.

## Color Palette

Use OKLCH tokens. The strategy is restrained: deep tinted neutrals dominate, with ion cyan reserved for active controls, focus, selected states, and export actions. Small warm amber and red semantic colors are allowed for warning and destructive feedback.

- Background: `oklch(0.115 0.012 235)`
- Lower surface: `oklch(0.15 0.013 235)`
- Raised surface: `oklch(0.195 0.014 235)`
- Control surface: `oklch(0.235 0.014 235)`
- Border: `oklch(0.34 0.018 235)`
- Text: `oklch(0.92 0.01 220)`
- Muted text: `oklch(0.69 0.014 225)`
- Primary accent: `oklch(0.77 0.12 205)`
- Success: `oklch(0.72 0.11 165)`
- Warning: `oklch(0.78 0.13 75)`
- Error: `oklch(0.68 0.16 28)`

## Typography

Use Geist Variable as the single family. Product UI uses a fixed rem scale with tabular numbers for telemetry, export values, and counts. Labels should be compact and clear. Headings use weight and spacing, not oversized display type.

## Layout

The desktop layout is a two-column command surface: large live preview on the left, sequenced control rail on the right. The control rail follows the creative flow: Source, Signal, Motion, Finish. Mobile stacks the preview first, then controls, with large tap targets and no reliance on hover.

## Components

Controls should read like calibrated instruments: compact segmented tabs, crisp sliders, structured toggles, small telemetry badges, and exact icon buttons. Use panels for primary work areas, not nested card grids. Preserve clear default, hover, focus, active, disabled, loading, and sent states.

## Motion

Motion is functional only. Use 150 to 250 ms transitions with exponential easing for hover, reveal, tab content, and status changes. Respect reduced motion by disabling spatial transitions while preserving opacity feedback.

## UX Copy

Use direct production language: Load source, tune signal, shape motion, export. Avoid vague labels like OK or Submit. Error and status messages should say what happened and what to try next.
