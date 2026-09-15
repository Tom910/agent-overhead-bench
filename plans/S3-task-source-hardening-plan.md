# S3 Task-Source Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the public task-pack and S7 selection gates fail closed on composition, public provenance, review coverage, and deterministic native verification without changing C2 or run.json measurement semantics.

**Architecture:** Keep generic task manifests permissive enough for focused local fixtures, and expose an explicit official-selection validator for the roadmap's 8–10 task composition. Preserve the source-owned native verifier descriptor through preparation, require stable verification outcomes, and bind prepared task metadata to the pinned source provenance. Public reference material remains outside the agent-visible workspace.

**Tech Stack:** TypeScript strict, Node.js built-ins, Vitest, shell preflight scripts, Docker native verifier descriptors.

**Spec:** `plans/S3-tasks-plan.md`, `plans/S3-provenance-environment-plan.md`, and the implementation roadmap/design documents referenced by `plans/README.md`.

## Global Constraints

- Implement one stage at a time and do not invent a second measurement model.
- No derived metrics in `run.json`; this stage changes validation only.
- No new npm dependency; use existing Node.js and Vitest facilities.
- TypeScript strict, typed `ConfigError` failures, and no network/package installation during an agent cell.
- Native verifier descriptors are source-owned; preparation must not generate shortcut verifiers.
- The agent-visible workspace must not contain private reference material.
- CI must not require API keys or spend model tokens.

### Task 1: Add explicit official task-pack composition and public URL gates

**Files:**
- Modify: `packages/tasks/src/source.ts`
- Test: `packages/tasks/src/source.test.ts`
- Modify: `scripts/s7-preflight.sh` only if the existing preflight needs to call the new exported gate
- Test: `scripts/s7-preflight.sh` through existing shell/preflight fixtures where applicable

**Interfaces:**
- Consumes: validated `GitTaskPackManifest` and a selected task-id array.
- Produces: `validateOfficialTaskPackSelection(manifest, selectedIds): void`, throwing `ConfigError` when the selected public set violates the S7 composition.

- [x] **Step 1: Write failing tests**

Add tests that reject a selected set unless it has 8–10 unique manifest IDs, exactly four Python and four TypeScript tasks, at least two small and two medium tasks, and includes `bugfix`, `feature`, and `refactor` shapes. Add a test that rejects a non-HTTPS repository URL in the official-selection gate and a passing test using the existing public HTTPS fixture. Test errors using `toThrow(ConfigError)` and assert the message names the violated field.

- [x] **Step 2: Run the focused tests**

Run: `npm test --workspace=@aob/tasks -- source.test.ts`

Expected: the new tests fail because the official composition function and public URL restriction do not yet exist.

- [x] **Step 3: Implement the minimal gates**

Require `repository.startsWith("https://")` in `validateOfficialTaskPackSelection`. Implement it using the manifest entries selected by `selectedIds`; reject unknown IDs, duplicates, counts outside 8–10, language counts other than four/four, fewer than two of either size, and missing required shapes. Keep `validateGitTaskPackManifest` focused on structural validity so one-task unit fixtures using local Git repositories remain valid.

- [x] **Step 4: Run focused and type checks**

Run: `npm test --workspace=@aob/tasks -- source.test.ts && npm run typecheck --workspace=@aob/tasks`

Expected: all task-source tests and the package typecheck pass.

### Task 2: Allow reviewed source manifests to prepare a reviewed subset safely

**Files:**
- Modify: `packages/tasks/src/source.ts`
- Test: `packages/tasks/src/source.test.ts`

**Interfaces:**
- Consumes: `TaskSourceReview.reviewed_task_ids` and materialized task IDs.
- Produces: review validation that requires every materialized task to be covered by the immutable source review record, while retaining duplicate and empty-ID checks.

- [x] **Step 1: Write a failing subset test**

Create a valid Git task-pack fixture whose review record covers two tasks, prepare only one task, load the resulting local manifest, and assert preparation succeeds and the selected task remains covered by `source_provenance.review.reviewed_task_ids`.

- [x] **Step 2: Run the focused test**

Run: `npm test --workspace=@aob/tasks -- source.test.ts`

Expected: the test fails with the current exact-match review error.

- [x] **Step 3: Implement coverage validation**

Change the manifest-to-review check to reject only when a materialized task ID is absent from `reviewed_task_ids`. Keep the source manifest validator requiring its own complete task list to be covered. Do not rewrite or synthesize review evidence.

- [x] **Step 4: Run focused tests and typecheck**

Run: `npm test --workspace=@aob/tasks -- source.test.ts && npm run typecheck --workspace=@aob/tasks`

Expected: the subset test and all existing review-integrity tests pass.

### Task 3: Require deterministic native verifier outcomes

**Files:**
- Modify: `packages/tasks/src/validate.ts`
- Test: `packages/tasks/src/validate.test.ts`

**Interfaces:**
- Consumes: five verifier exit codes from pristine and reference validation.
- Produces: validation that requires all pristine repetitions to share one identical non-zero exit code, and all reference repetitions to share exit code zero.

- [x] **Step 1: Write failing determinism tests**

Add a fixture verifier that alternates exit codes across invocations and assert both `validatePristine` and `validateWithReference` return `ok: false` with a detail naming unstable exit codes. Retain the existing stable non-zero pristine and stable zero reference assertions.

- [x] **Step 2: Run the focused tests**

Run: `npm test --workspace=@aob/tasks -- validate.test.ts`

Expected: the alternating verifier test fails because current validation only checks zero versus non-zero.

- [x] **Step 3: Implement stable-exit validation**

Add a small local helper that accepts a code array and expected predicate, rejects an empty array, rejects any code that violates the predicate, and rejects arrays whose values are not all equal. Use it in both validation paths and preserve typed `ConfigError` handling.

- [x] **Step 4: Run focused tests and typecheck**

Run: `npm test --workspace=@aob/tasks -- validate.test.ts && npm run typecheck --workspace=@aob/tasks`

Expected: all validation tests pass.

### Task 4: Bind prepared public tasks to their pinned provenance

**Files:**
- Modify: `packages/tasks/src/source.ts`
- Test: `packages/tasks/src/source.test.ts`
- Modify: `packages/tasks/src/cli.ts` only if the existing local-manifest validator is wired there

**Interfaces:**
- Consumes: `LocalTaskManifest.source_provenance`, each prepared C2 task source, and the Git task-pack manifest entry.
- Produces: rejection of a public prepared task whose source kind, repository, revision, task ID, or license notes do not match the pinned task-pack entry/provenance.

- [x] **Step 1: Write failing provenance tests**

Prepare a valid task, then mutate each of its source repository, revision, task ID, and license notes before local-manifest validation. Assert each mutation is rejected with a provenance-specific `ConfigError`.

- [x] **Step 2: Run focused tests**

Run: `npm test --workspace=@aob/tasks -- source.test.ts`

Expected: at least one mutation currently passes because local-manifest checks do not bind the C2 source fields to the selected Git task-pack entry.

- [x] **Step 3: Implement the binding**

During public task-pack preparation, validate that the loaded C2 source has the public task-pack kind, the pinned repository/revision/license notes, and the manifest entry's `source_task_id`. During local-manifest validation, re-check the same binding from materialized task YAML and provenance without reading private reference directories.

- [x] **Step 4: Run the complete repository verification**

Run: `npm test && npm run typecheck && npm run lint && git diff --check && for f in scripts/*.sh; do sh -n "$f"; done`

Expected: all workspace tests, strict typechecks, lint, diff checks, and shell syntax checks pass.

### Task 5: Exclude private reference material from pristine validation

**Files:**
- Modify: `packages/tasks/src/validate.ts`
- Test: `packages/tasks/src/validate.test.ts`

**Interfaces:**
- Consumes: a materialized task directory that may contain a local-only `reference/` overlay.
- Produces: pristine verification in a temporary directory containing only public task inputs; reference validation remains the explicit `validateWithReference` path.

- [x] **Step 1: Write the failing regression test**

Create a task whose verifier exits zero only when `reference/solution.txt` exists. Put that file only under the task's private `reference/` directory and assert `validatePristineTasks` reports `ok: false` with a pristine-failure diagnostic. This proves a verifier cannot accidentally use held-out material during the pristine check.

- [x] **Step 2: Run the focused test**

Run: `npm test --workspace=@aob/tasks -- validate.test.ts`

Expected: the test fails because the current temporary copy includes `reference/`.

- [x] **Step 3: Implement a public-only temporary copy**

Copy the task tree into the temporary directory with a Node filesystem filter that keeps the task root but excludes every directory named `reference`; retain the existing symlink and structure checks. Do not alter `validateWithReference`, which intentionally overlays the local reference into a separate validation copy.

- [x] **Step 4: Run focused tests and typecheck**

Run: `npm test --workspace=@aob/tasks -- validate.test.ts && npm run typecheck --workspace=@aob/tasks`

Expected: the regression and all existing pristine/reference validation tests pass.

## Self-review and handoff

- The official selection gate deliberately rejects the current candidate until a source with the required composition is reviewed; this plan does not fabricate source approval, calibration, or maintainer sign-off.
- Native verifier asset packaging and reference-overlay execution remain a separate source-selection/runtime-boundary decision; this plan only hardens the already-supported descriptor path.
- No task in this plan changes timing fields, usage fields, cost derivation, or the C1–C4 measurement model.

**Status (2026-08-27):** implemented. Focused task-source/validator tests, strict typecheck, full workspace tests, lint, shell syntax, archive freeze, and archive verification pass.
