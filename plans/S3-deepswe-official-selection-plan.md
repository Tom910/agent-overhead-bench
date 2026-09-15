# S3 DeepSWE Official Selection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task.

**Goal:** Make the selected DeepSWE source eligible for the official composition gate without falsifying its native task categories.

**Architecture:** Preserve DeepSWE's original `category` in the source manifest as `source_category`. Map only the common C2 `shape` field required by the runner (`bugfix` remains `bugfix`; `feature_request` and `enhancement` normalize to the common `feature` shape), while retaining the native category for provenance and reporting. Add a DeepSWE-specific validator requiring 8–10 tasks, at least four Python and four TypeScript tasks, and at least two small and two medium repositories. Native category balance is reported, not imposed, because the audited source's language slice is not category-balanced.

**Tech Stack:** TypeScript strict, Node.js/Bash built-ins, Vitest, existing DeepSWE preparation script.

**Spec:** `/Users/tom910/dev/visa-case/agent-overhead-benchmark-design.md` §4.3, `/Users/tom910/dev/visa-case/agent-overhead-benchmark-implementation-roadmap.md` S3, and `plans/S3-tasks-plan.md` DeepSWE audit.

## Global Constraints

- Preserve source task semantics and metadata; never relabel a native category as `refactor` or `test-fix`. The source-task checksum covers `task.toml`, and preflight additionally binds the materialized YAML and verifier identity to the source manifest.
- Do not change C1–C4 measurement semantics or add derived metrics to `run.json`.
- No new npm dependency; use existing parsers and Node APIs.
- Keep the official generic task-pack validator unchanged for sources that actually provide its common shape taxonomy.
- Official selection remains pinned to one source, 8–10 tasks, at least four Python and four TypeScript tasks, and at least two small and two medium tasks. Native categories remain immutable provenance and are reported for the selected subset; they are not silently balanced or relabelled.
- Source review, two-CLI calibration, verifier polarity, and maintainer sign-off remain separate gates; this change does not approve a dataset.

## Contracts consumed / produced

- Consumes: DeepSWE `task.toml` native `category`, validated `DeepSWEManifest`, and selected task IDs.
- Produces: `DeepSWEManifest.tasks[*].source_category`, pinned environment/verifier image identities, a validated native-category selection function, and preflight enforcement for DeepSWE source manifests.
- C2 continues to expose only the common `shape` union; native category is provenance/selection metadata, not a new derived measurement.

## Out of scope

- Paid calibration runs, verifier/image preparation, or maintainer approval.
- Adding Go, Rust, or JavaScript to the C2 language union; the official DeepSWE subset remains the audited Python/TypeScript slice.
- Reclassifying any DeepSWE task or pretending its categories include refactor/test-fix.
- Changing the generic `git-taskpack` composition contract.

## Human review

The maintainer must review the native-category normalization note, selected task IDs, source and upstream licenses, and the final calibration evidence before the DeepSWE manifest review flags can become true.

## Tasks

### Task 1: Add failing native-category contract tests

**Files:**
- Modify: `packages/tasks/src/source.test.ts`
- Modify: `packages/tasks/src/source.ts` only after RED is observed

**Interfaces:**
- Consumes: `DeepSWEManifest` and the new `validateOfficialDeepSWESelection(manifest, selectedIds): void` interface.
- Produces: tests requiring native categories and rejecting a selection that lacks
  a valid native category or source-to-C2 shape mapping, without imposing an
  artificial category distribution.

- [x] **Step 1: Write the failing tests**

  Add `source_category` to the existing valid DeepSWE fixture. Add an eight-task DeepSWE manifest fixture with four Python/four TypeScript tasks and two small/two medium tasks; assert `validateOfficialDeepSWESelection` accepts both a mixed-category selection and an all-`feature_request` selection. Keep the separate source-manifest test that rejects a shape inconsistent with the native category.

- [x] **Step 2: Run the focused test and verify RED**

  Run `npm run test --workspace @aob/tasks -- src/source.test.ts`.

  Expected: the test fails because `source_category` is not yet accepted and the DeepSWE selection validator is not yet implemented.

### Task 2: Implement source-category preservation and selection validation

**Files:**
- Modify: `packages/tasks/src/source.ts`
- Modify: `scripts/prepare-deepswe-calibration.sh`
- Modify: `scripts/s7-preflight.sh`
- Test: `packages/tasks/src/source.test.ts`

**Interfaces:**
- Consumes: native DeepSWE category values and validated source manifests.
- Produces: `DeepSWEManifest.tasks[*].source_category: "bugfix" | "enhancement" | "feature_request"`; `validateOfficialDeepSWESelection(manifest, selectedIds): void`.

- [x] **Step 1: Preserve native category in the source manifest**

  Extend the DeepSWE task entry type and validator with `source_category` plus the pulled environment image and digest. Accept exactly `bugfix`, `enhancement`, or `feature_request`; enforce the only permitted common-shape mapping (`bugfix` → `bugfix`, the other native categories → `feature`). Keep C2 `shape` as the common mapping and include all fields in the source-manifest checksum.

- [x] **Step 2: Emit the native category during preparation**

  Read `category` from each selected DeepSWE `task.toml`, validate it against the three allowed native values, map `bugfix` to C2 `bugfix` and the other two categories to C2 `feature`, and write `source_category` into the original source manifest entry. Build the task-specific `environment/Dockerfile` at the pinned upstream base revision, record its immutable Docker image ID alongside the verifier image ID, and copy DeepSWE's `solution/solution.patch` into the verifier image only so maintainer polarity checks can exercise the reference without exposing it to the measured agent. The verifier applies a bounded pytest compatibility pin (`pytest<9`) when Python is present because DeepSWE task requirements are open-ended and pytest 9 turns legacy collection warnings into errors. The `task.yaml` must retain the common C2 shape only and its provenance text must state that the native category remains in the source manifest. Count newline-separated upstream files consistently in both shell preparation and the generated source manifest.

- [x] **Step 3: Add the DeepSWE official validator**

  Validate HTTPS provenance, unique selected IDs, 8–10 count, at least four Python and four TypeScript tasks, and at least two small and two medium tasks. Preserve and validate each entry's native category, but do not require a category distribution that the source cannot provide evenly in the audited language slice. Keep `validateOfficialTaskPackSelection` and its common shape requirements unchanged.

- [x] **Step 4: Enforce the correct validator in S7 preflight**

  After loading and validating the original source manifest, dispatch to `validateOfficialDeepSWESelection` when `source_adapter === "deepswe"`; otherwise retain the generic public task-pack validator. For DeepSWE, also require the selected materialized task's language, shape, size, timeout, expected-minute range, and Docker verifier image/digest to equal the bound source entry. This must happen before any official run can start.

- [x] **Step 5: Run focused tests and typecheck**

  Run `npm run test --workspace @aob/tasks -- src/source.test.ts && npm run typecheck --workspace @aob/tasks && sh -n scripts/s7-preflight.sh scripts/prepare-deepswe-calibration.sh`.

### Task 3: Record the policy boundary and commit

**Files:**
- Modify: `plans/S3-tasks-plan.md`
- Modify: `plans/S7-runs-protocol.md`
- Modify: `plans/README.md`

**Interfaces:**
- Consumes: the native-category validator and preflight dispatch from Task 2.
- Produces: auditable documentation that DeepSWE is source-native-category coverage, not a four-shape recategorization.

- [x] **Step 1: Update stage records**

  Replace the current statement that DeepSWE can only be calibration-only because of missing refactor/test-fix categories with the precise conditional status: the source can satisfy the revised native-category composition only after selecting 4+4 Python/TypeScript tasks with two small/two medium repositories and completing review/calibration; no task is relabelled.

- [x] **Step 2: Run the full local gate**

  Run `node --test scripts/command-timeout.test.mjs && npm run test --workspaces --if-present && npm run typecheck && npm run lint --silent && sh -n scripts/*.sh images/*.sh && git diff --check`.

- [x] **Step 3: Commit**

  Commit with `feat: preserve DeepSWE native task categories`.

## Verification gate

This plan is complete only if a valid DeepSWE fixture passes the native-category selection validator, a missing native category fails closed, generic task-pack behavior remains unchanged, the preparation script emits the native category and pinned environment identity, repository-size metadata is consistent, and the full local gate passes. It does not make review flags true or authorize paid S7 runs.

**Status (2026-08-27):** Implemented and locally verified. The source manifest
preserves native categories, preparation maps them transparently to C2, and S7
preflight applies the DeepSWE-specific composition gate. Review, calibration,
and maintainer sign-off remain intentionally pending.
