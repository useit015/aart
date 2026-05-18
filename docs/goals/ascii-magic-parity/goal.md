# Recreate ASCII Magic With Full Feature Parity

## Objective

Recreate the public `https://www.ascii-magic.com/` experience locally with full user-visible feature parity, including the workflows, controls, conversion behavior, export/copy paths, responsive UI, and relevant error/empty states discovered from the live site during `/goal`.

## Original Request

`recreate https://www.ascii-magic.com/, full deature parity`

## Intake Summary

- Input shape: `specific`
- Audience: users who want the ASCII Magic experience recreated locally
- Authority: `requested`
- Proof type: `demo`
- Completion proof: a final audit demonstrates every public workflow discovered from ascii-magic.com working locally, with tests or browser checks for conversion, controls, exports/copy paths, and responsive UI parity.
- Likely misfire: building a visually similar page while missing conversion options, exports, output quality, edge cases, or interaction details from the public site.
- Blind spots considered: the source site must be inspected during `/goal`, not goal-prep; public feature parity may require UI behavior, image/text processing, output formats, responsiveness, accessibility, and error states; the current repo architecture and verification commands are unknown until Scout maps them.
- Existing plan facts: user selected a local live GoalBuddy board. Project instruction: always commit in small batches.

## Goal Kind

`specific`

## Current Tranche

Discover the public feature inventory and local repo shape, choose the largest safe implementation slice, implement successive verified vertical slices, and keep advancing until the full public ASCII Magic user experience is recreated locally.

This is not a one-slice goal. After each verified Worker package, the PM should continue to the next safe local work package unless a phase, risk, ambiguity, rejected-verification, or final-completion review is due.

## Non-Negotiable Constraints

- During `/goal`, inspect the public ASCII Magic site and record the observed feature inventory before implementing.
- Do not treat a lookalike static page as complete if conversion behavior, controls, exports, copy/download paths, responsive layout, or error states are missing.
- Respect the repo's existing architecture, dependency choices, design system, and verification commands once Scout identifies them.
- Follow the project instruction: always commit in small batches when commits are made.
- Keep implementation slices bounded, explicit, verified, and reversible.
- Do not claim completion without a final Judge or PM audit mapping verification evidence back to the discovered public feature inventory.

## Stop Rule

Stop only when a final audit proves the full original outcome is complete.

Do not stop after planning, discovery, or Judge selection if the user asked for working software and a safe Worker task can be activated.

Do not stop after a single verified Worker package when the broader owner outcome still has safe local follow-up work. Advance the board to the next highest-leverage safe Worker package and continue unless a phase, risk, rejected-verification, ambiguity, or final-completion review is due.

Do not create one Worker/Judge pair per repeated file, component, helper, or control. Put repeated same-shape work into one Worker package and review the package as a whole.

Do not stop because a slice needs owner input, credentials, production access, destructive operations, or policy decisions. Mark that exact slice blocked with a receipt, create the smallest safe follow-up or workaround task, and continue all local, non-destructive work that can still move the goal toward the full outcome.

## Slice Sizing

Safe means bounded, explicit, verified, and reversible. It does not mean tiny.

A good task is the largest safe useful slice.

Small is not the goal. Useful is the goal.

A Worker should finish the whole assigned slice. A Judge should judge the whole assigned slice. A PM should reorient the board when tasks are safe but not moving the outcome.

Tiny tasks are allowed when the failure is isolated, the risk is high, the scope is unknown, or the tiny task unlocks a larger slice. Tiny tasks are bad when they keep happening, do not change behavior, only add wrappers/contracts/proof files, or avoid the real milestone.

Do not stop because a slice needs owner input, credentials, production access, destructive operations, or policy decisions. Mark that exact slice blocked with a receipt, create the smallest safe follow-up or workaround task, and continue.

## Canonical Board

Machine truth lives at:

`docs/goals/ascii-magic-parity/state.yaml`

If this charter and `state.yaml` disagree, `state.yaml` wins for task status, active task, receipts, verification freshness, and completion truth.

## Run Command

```text
/goal Follow docs/goals/ascii-magic-parity/goal.md.
```

## PM Loop

On every `/goal` continuation:

1. Read this charter.
2. Read `state.yaml`.
3. Run the bundled GoalBuddy update checker when available and mention a newer version without blocking.
4. Re-check the intake: original request, input shape, authority, proof, blind spots, existing plan facts, and likely misfire.
5. Work only on the active board task.
6. Assign Scout, Judge, Worker, or PM according to the task.
7. Write a compact task receipt.
8. Update the board.
9. If safe local work remains, choose the next largest reversible Worker package and continue unless blocked.
10. If a problem, suggestion, or follow-up should become a repo artifact, create an approved issue/PR or ask the operator whether to create one.
11. Review at phase, risk, rejected-verification, ambiguity, or final-completion boundaries; do not review every small Worker by habit.
12. Finish only with a Judge/PM audit receipt that maps receipts and verification back to the original user outcome and records `full_outcome_complete: true`.
