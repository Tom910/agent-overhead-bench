# S5/S6 Runtime-Integrity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep runtime C4 artifacts, budget accounting, and report aggregates faithful for invalid verification results, unpriced default runs, and all-failed cells.

**Architecture:** Tighten the C4 runtime validator to match its JSON Schema. Default-condition cells remain a diagnostic control with no pinned model or price book; only pinned cells receive rates for spend accounting. Report aggregation represents the absence of valid timing data as unavailable rather than manufacturing zero milliseconds.

**Tech Stack:** TypeScript strict, Node.js, Vitest, JSON Schema.

**Spec:** C4/S5/S6 in `/Users/tom910/dev/visa-case/agent-overhead-benchmark-implementation-roadmap.md` and the measurement model in `/Users/tom910/dev/visa-case/agent-overhead-benchmark-design.md`.

## Global Constraints

- No new npm dependency and no network or provider spend in tests.
- Preserve raw-only `run.json`; derived report values stay in S6.
- Keep pinned/default conditions separate and never price an unknown default model with pinned rates.
- Use typed `ContractViolation`/`ConfigError` errors and monotonic timing already established by the repository.

## Files and interfaces

- Modify `packages/contracts/src/validate.ts` and `packages/contracts/src/validate.test.ts` for C4 verification exit validation.
- Modify `packages/runner/src/cell.ts`, `packages/runner/src/matrix.ts`, and `packages/runner/src/runner.test.ts` for default pricing boundaries.
- Modify `packages/report/src/from-results.ts`, `packages/report/src/aggregate.ts`, `packages/report/src/render.ts`, and report tests for unavailable timing aggregates.
- Modify `plans/README.md` and this plan to record the stage.

## Tasks

### Task 1: Align runtime C4 validation with the schema

- [x] Add tests rejecting fractional and negative `verification.exit` values through `validateC4Run`.
- [x] Run `npm test --workspace=@aob/contracts -- validate.test.ts` and observe the tests fail against the current `reqNumber` check.
- [x] Use `reqNonnegativeInteger` for `verification.exit` and retain nonnegative duration validation.
- [x] Rerun the focused test and contracts typecheck.

### Task 2: Prevent default-condition pinned pricing

- [x] Add a runner test that runs a default cell with nonzero supplied pinned rates and asserts measured usage produces `spend_usd_estimate: null`.
- [x] Run the focused runner test and observe the current numeric spend failure.
- [x] Apply rates only when `condition` is `pinned` in matrix cell construction and in both host/Docker C4 spend calculations; interrupted default cells remain unpriced.
- [x] Update the existing default-cell expectation and rerun runner tests/typecheck.

### Task 3: Preserve unavailable timing when no valid cells remain

- [x] Add a report fixture with only failed or unreconciled repetitions and assert the headline timing fields render unavailable markers rather than `0ms`.
- [x] Run the focused report test and observe the current empty median path returns zeros.
- [x] Make the report return an explicit unavailable representation for an empty valid set, then render the no-valid-cell row consistently without sorting/ranking it.
- [x] Rerun report tests and typecheck.

### Task 4: Verify and record

- [x] Run all workspace tests, strict typechecks, lint, shell syntax, and `git diff --check`.
- [x] Run the zero-spend dry-run and report generation checks.
- [x] Mark this plan complete only after the latest committed tree passes all checks.

## Out of scope

- Native/default behavior approval or official default-condition runs.
- Changes to C1 timing, usage extraction, task-source selection, or the measurement equations.
- Fabricating prices for provider-selected models.

**Status (2026-08-27):** Implemented and verified; default-condition pricing remains intentionally unavailable until native/default behavior is evidenced.
