# Interactive Motion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add interactive preview motion inspired by the particle visualizer while keeping export behavior and existing animation controls stable.

**Architecture:** Put deterministic motion math in `src/ascii.js` so unit tests can prove pointer, idle, and burst behavior. Keep React changes in `src/App.jsx`: controls, pointer refs, burst/reset actions, and transform composition during drawing.

**Tech Stack:** React 19, Vite, canvas 2D, Vitest, Testing Library, existing shadcn/ui controls.

---

## File Structure

- Modify `src/ascii.js`: default interactive settings, public pointer/idle option data, transform helper, active-state helper.
- Modify `src/App.jsx`: import helpers/options, track pointer/burst refs, compose transforms in `drawStyledCell`, add Interactive Motion card and pointer handlers.
- Modify `tests/ascii.test.js`: TDD coverage for deterministic motion helpers.
- Modify `tests/app.test.jsx`: TDD coverage for the new Motion tab controls and workflow preservation.

## Task 1: Motion Math

**Files:**
- Modify: `tests/ascii.test.js`
- Modify: `src/ascii.js`

- [ ] **Step 1: Write the failing unit tests**

Add tests that import `computeInteractiveMotionTransform` and `isInteractiveMotionActive`, then assert identity/off behavior, radius cutoff, distinct pointer modes, and distinct idle modes.

- [ ] **Step 2: Run the focused unit tests to verify RED**

Run: `npm run test -- tests/ascii.test.js`

Expected: FAIL because the new helpers are not exported yet.

- [ ] **Step 3: Implement minimal motion helpers**

Add default settings and helpers in `src/ascii.js`. Use normalized pointer coordinates, clamp force/radius/amount, return the same transform shape as `computeAnimationTransform`, and short-circuit when reduced motion is true.

- [ ] **Step 4: Run focused tests to verify GREEN**

Run: `npm run test -- tests/ascii.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/ascii.js tests/ascii.test.js
git commit -m "feat: add interactive motion math"
```

## Task 2: App Integration

**Files:**
- Modify: `tests/app.test.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Write the failing app tests**

Add a Motion tab test that expects **Interactive Motion**, `Enable Interaction`, `Pointer`, `Idle`, `Force`, `Radius`, `Motion Amount`, `Burst`, and `Reset Motion`. Also assert `Place Lights` and `Draw Mask` remain present.

- [ ] **Step 2: Run the focused app tests to verify RED**

Run: `npm run test -- tests/app.test.jsx`

Expected: FAIL because the new card is not rendered yet.

- [ ] **Step 3: Add controls and pointer state**

Update `src/App.jsx` to import motion helpers/options, add refs for pointer and burst, add pointer enter/move/leave handling that does not block mask/light tools, and add the Interactive Motion card before Animation.

- [ ] **Step 4: Compose transforms in rendering**

Update `drawStyledCell` call sites so interactive transforms compose with existing animation transforms. Update the redraw loop condition so interaction, idle motion, pointer active state, and burst can animate the preview.

- [ ] **Step 5: Run focused app tests to verify GREEN**

Run: `npm run test -- tests/app.test.jsx`

Expected: PASS.

- [ ] **Step 6: Commit**

Run:

```bash
git add src/App.jsx tests/app.test.jsx
git commit -m "feat: add interactive preview motion"
```

## Task 3: Final Verification

**Files:**
- Verify only unless a test exposes a defect.

- [ ] **Step 1: Run full automated verification**

Run:

```bash
npm run test
npm run build
git diff --check
```

Expected: all commands pass.

- [ ] **Step 2: Attempt browser QA**

Open the known local app URL in the in-app browser if policy allows it. Check that Motion controls render, pointer movement does not break mask/light controls, and no local navigation policy blocks the page.

- [ ] **Step 3: Commit any verification fixes**

Only commit if verification required code or test fixes.

## Plan Self-Review

- Spec coverage: pointer modes, idle modes, burst/reset, reduced-motion math, UI controls, and verification are covered.
- Completeness scan: every step has a concrete action and expected result.
- Type consistency: settings and helper names match the design spec.
