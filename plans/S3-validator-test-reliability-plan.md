# S3 Validator Test Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task.

**Goal:** Make the S3 validator test budget reflect its deterministic local subprocess work so the suite does not fail on normal host load.

**Architecture:** Keep validator behavior and its 60-second verifier execution limit unchanged. Increase only the Vitest timeout for the one test that runs five pristine verifications across all eight local fixtures; this is a test-runner budget, not a task or measurement timeout.

**Tech Stack:** TypeScript/Vitest, existing task verifier scripts.

**Spec:** `plans/S3-tasks-plan.md` and the project verification requirement.

## Global Constraints

- No production validator behavior changes.
- No task timeout or benchmark regime changes.
- No new dependency and no provider request.
- Preserve the five-run stable-exit-code assertion.

## Task 1: Raise the test-only budget for the full pristine fixture check

**Files:**
- Modify: `packages/tasks/src/validate.test.ts`
- Modify: `plans/README.md`

**Interfaces:**
- Consumes: `validatePristine(suiteDir)` and the existing eight local fixture directories.
- Produces: the same assertions with a 15-second Vitest test timeout.

- [x] **Step 1: Reproduce the failure**

  Run `npm run test --workspace @aob/tasks -- src/validate.test.ts` under the normal workspace load. The existing `every original task has structure and pristine verify fails` test can exceed the default 5-second Vitest limit while the function itself is still deterministic.

- [x] **Step 2: Apply the test-only timeout**

  Change that test declaration to `it("every original task has structure and pristine verify fails", () => { ... }, 15_000);`. Do not change `runVerify`’s 60-second subprocess timeout or any task metadata.

- [x] **Step 3: Verify the focused test**

  Run `npm run test --workspace @aob/tasks -- src/validate.test.ts` and require all 12 tests to pass.

- [x] **Step 4: Commit**

  Run `git diff --check`, then commit with `test: allow full pristine task validation budget`.

## Verification gate

Run the focused task test, then the full workspace test/typecheck/lint/shell/diff gate. This change is complete only if the validator test passes without changing task or cell timeouts.

**Status (2026-08-27):** Implemented and verified. The full workspace gate
passes with the validator test using a 15-second test-only budget; task and
cell timeouts are unchanged.
