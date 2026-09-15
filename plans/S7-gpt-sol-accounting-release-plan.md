# S7 GPT Sol Accounting and Release Resolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or **superpowers:executing-plans** to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the verified release-integrity defects found by the independent GPT Sol review without changing the benchmark measurement equations.

**Architecture:** Keep runner state, C4 artifacts, and release reports as separate layers. The runner will reconcile every retained numeric C4 spend exactly once and will reject a failed artifact whose full measurement identity does not match its matrix cell. S7 freeze will resolve reviewed anomaly replacements into the published results tree while preserving the original and replacement evidence under provenance. Script tests will use checked-in synthetic evidence so CI does not depend on ignored local runs.

**Tech Stack:** TypeScript strict, Node.js test runner, existing `@aob/contracts` and report freeze helpers, POSIX shell; no new npm dependencies.

**Spec:** `/Users/tom910/dev/visa-case/agent-overhead-benchmark-design.md`, `/Users/tom910/dev/visa-case/agent-overhead-benchmark-implementation-roadmap.md`, and `plans/S7-gpt-sol-follow-up-plan.md`.

## Global Constraints

- Do not change the measurement equations or add derived metrics to `run.json`.
- Keep C4 spend and runner `state.json` exactly reconcilable, including retained over-cap evidence.
- Use the complete existing C4 measurement identity for retry and cell matching.
- Preserve original anomaly evidence and replacement evidence in the archive provenance.
- CI and tests must not hold API keys or spend provider money.
- Use checked-in synthetic fixtures for script tests; never depend on `scratch/`.
- No new npm dependency.

---

### Task 1: Make runner retention accounting exact

**Files:**
- Modify: `packages/runner/src/matrix.ts`
- Test: `packages/runner/src/runner.test.ts`

**Interfaces:**
- `reconcilePersistedArtifact` rejects a valid failed C4 whose identity does not match the current matrix cell.
- A returned numeric C4 spend is added to persisted state before an over-cap `BudgetExceeded` is rethrown.

- [x] **Step 1: Write failing tests** for an over-cap numeric C4 asserting `state.spentUsd` equals the retained C4 spend, and for a foreign failed C4 asserting resume fails with a cell-identity error.
- [x] **Step 2: Run the focused runner tests** and observe the accounting/identity failures.
- [x] **Step 3: Implement the smallest matrix changes**: validate `run_id`, tool, task, source/revisions/regime, condition, repetition, model, and price book in the failed-artifact branch; persist the numeric spend before throwing; leave the cell terminally failed so a second resume cannot charge it again.
- [x] **Step 4: Run `npm test --workspace=@aob/runner`** and confirm all runner tests pass.

### Task 2: Remove ignored-artifact dependencies from script tests

**Files:**
- Create: `scripts/test-fixtures/cap-pinned-opencode/{run.json,events.jsonl,stdout.log,stderr.log,verify.log}`
- Create: `scripts/test-fixtures/default-mock/{run.json,events.jsonl,stdout.log,stderr.log,verify.log}`
- Modify: `scripts/official-cap.test.mjs`
- Modify: `scripts/s7-freeze-retry.test.mjs`

**Interfaces:**
- Script tests copy only committed, schema-valid synthetic cells from `scripts/test-fixtures`.
- Fixture artifacts use relative sibling paths and contain no prompt, solution, credential, or provider data.

- [x] **Step 1: Add minimal schema-valid fixtures** with one priced pinned cell and one unpriced default cell, including matching C1 events and declared logs.
- [x] **Step 2: Replace every `../scratch/...` test input** with the committed fixture paths.
- [x] **Step 3: Verify with `rg -n "scratch" scripts/*test.mjs`** that script tests no longer read ignored artifacts.
- [x] **Step 4: Run all Node script tests** and confirm they pass without `scratch/` inputs.

### Task 3: Publish anomaly replacements as the resolved dataset

**Files:**
- Modify: `packages/report/src/freeze.ts`
- Modify: `packages/report/src/freeze-cli.ts`
- Modify: `scripts/s7-freeze.sh`
- Modify: `scripts/s7-freeze-retry.test.mjs`

**Interfaces:**
- `copySanitizedResults(resultsDir, destinationDir, replacements?)` copies current cells, replacing a reviewed logical cell with the validated replacement result while retaining the replacement run ID in C4.
- `freeze-cli.ts` accepts an optional replacement manifest path and passes it to the sanitizer.
- S7 freeze validates that every replacement is identity-compatible and non-anomalous, archives both original and replacement evidence, and generates the report from the replacement-resolved results tree.

- [x] **Step 1: Add a failing freeze test** asserting a reviewed replacement changes the published result identity while the archive still contains original evidence under provenance.
- [x] **Step 2: Run the focused freeze test** and observe that the report currently uses the original result.
- [x] **Step 3: Implement a typed replacement map** keyed by original `run_id`; copy the replacement cell into the original relative cell path only for the report-facing results tree.
- [x] **Step 4: Pass the replacement map from `s7-freeze.sh`** after the existing review and anomaly checks, while keeping the original `results` tree and all rerun files in provenance.
- [x] **Step 5: Run `node --test scripts/s7-freeze-retry.test.mjs`** and the report tests.

### Task 4: Verify, document, and review

**Files:**
- Modify: `plans/README.md`
- Modify: `plans/S7-gpt-sol-accounting-release-plan.md`

- [x] **Step 1: Run `npm test`, `npm run typecheck`, `npm run lint --silent`, `sh -n scripts/*.sh images/*.sh`, and `git diff --check`.**
- [x] **Step 2: Verify script tests with `scratch/` unavailable by checking that no script test references it and running the complete script suite.**
- [x] **Step 3: Update the plan/index only with verified outcomes and record remaining GPT Sol findings as separate follow-up stages.**
- [x] **Step 4: Request fresh no-spend GPT Sol reviews of the changed code and integrate only verified findings.**

### Task 5: Preserve anomaly provenance and state mapping

**Files:**
- Modify: `packages/report/src/freeze.ts`
- Modify: `packages/report/src/freeze-cli.ts`
- Modify: `scripts/s7-freeze.sh`
- Modify: `scripts/s7-verify-archive.sh`
- Test: `scripts/s7-freeze-retry.test.mjs`

**Interfaces:**
- `copySanitizedProvenance` accepts the reviewed original-to-replacement map and writes displaced original cells under `provenance/anomalies/`.
- The release package contains `provenance/resolved-replacements.json`, mapping each runner-state cell ID to the published replacement run ID.
- Archive verification accepts a replacement run ID only when this mapping binds it to the corresponding runner-state cell and the published result occupies that logical cell path.

- [x] **Step 1: Add a failing archive test** requiring the displaced original under `provenance/anomalies/` and a replacement mapping artifact.
- [x] **Step 2: Run the focused archive test** and observe the missing provenance/mapping failure.
- [x] **Step 3: Copy only displaced original evidence with the existing sanitizer** and write the deterministic mapping artifact.
- [x] **Step 4: Extend archive verification** to validate the mapping and retain the existing checksum gate.
- [x] **Step 5: Run the focused archive tests.**

### Task 6: Separate retained spend from future retry budget

**Files:**
- Modify: `packages/runner/src/matrix.ts`
- Test: `packages/runner/src/runner.test.ts`

**Interfaces:**
- A valid failed C4 already represented in `state.spentUsd` is treated as reconciled evidence; it is not added again and does not cause `assertBudget` to add the same spend a second time.
- The runner still rejects a capped resume when the already-recorded total is at or above the cap, and it permits a retry only when the recorded total leaves room for the next conservative estimate.

- [x] **Step 1: Add a failing test** for a failed C4 whose spend is already included in state and whose retry estimate fits the remaining cap.
- [x] **Step 2: Run the focused runner test** and observe the incorrect cap decision.
- [x] **Step 3: Use persisted state as the reconciliation boundary** so the cap check uses only the current total plus the next estimate.
- [x] **Step 4: Run the full runner suite and verify no spend is charged twice.**

## Acceptance

- Numeric over-cap C4 evidence remains on disk and its exact spend is persisted once in runner state.
- A foreign valid failed C4 cannot block or masquerade as a current matrix cell.
- No script test reads `scratch/` or another ignored path.
- A reviewed, completed, non-anomalous replacement is the result used to generate the release report, while original and replacement evidence remain auditable.
- Full tests, strict typecheck, lint, shell syntax, and diff checks pass.

## Explicit follow-ups

- Activity Export scoping to a reviewed time window and results digest remains a separate release-provenance stage.
- Same-host identity and contiguous-window checks remain a separate S7 operational stage.
- Transient provider-failure success policy remains a measurement-policy review, not an implicit behavior change in this plan.
- DeepSWE source review, two-CLI calibration, image preparation, and maintainer sign-off remain external release gates.

**Status:** Implemented and locally verified. Remaining activity-window binding, host/window identity, provider-failure policy, DeepSWE approval, and tool-visibility items are separate release stages.
