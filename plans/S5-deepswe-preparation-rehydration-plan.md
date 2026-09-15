# S5 — Rehydrate the prepared DeepSWE Git base

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve the exact deterministic sanitized Git base revision when the runner copies a prepared DeepSWE task for a cell, so the source-owned native verifier can compare the agent patch without exposing upstream Git metadata.

**Architecture:** DeepSWE preparation already creates a fresh local Git repository and records its commit as `task.source.base_revision`. The local task source adapter will recreate that repository after copying public task files, using the same branch, identity, timestamp, hook, and commit message as preparation. It will verify `HEAD` equals the recorded revision and fail with `ConfigError` if deterministic rehydration cannot be proven. No upstream `.git` directory is copied and no C1–C4 measurement rule changes.

**Tech Stack:** TypeScript strict, Node.js `child_process` built-ins, existing Vitest tests, existing shell preparation path; no new dependency.

**Spec:** `/Users/tom910/dev/visa-case/agent-overhead-benchmark-design.md` §4.0 and §4.4, `/Users/tom910/dev/visa-case/agent-overhead-benchmark-implementation-roadmap.md` S3/S5, and `plans/S3-deepswe-reference-boundary-plan.md`.

## Global Constraints

- The measured workspace contains the pinned sanitized base and a fresh local Git base commit; upstream `.git`, hidden tests, solution patches, and verifier inputs remain outside it.
- `task.source.base_revision` is an immutable provenance binding, not a value to rewrite after copying.
- A source-owned verifier remains authoritative; the adapter must not replace or weaken it.
- Typed `ConfigError` failures only; no bare throws.
- No derived metrics in `run.json`, no new npm dependency, no provider calls in tests, and no change to C1–C4 timing or cost semantics.

## Files

- Modify: `packages/tasks/src/source.ts` — add deterministic Git-base rehydration after the security-filtered workspace copy.
- Modify: `packages/tasks/src/source.test.ts` — prove exact base identity, verifier-compatible diff behavior, and fail-closed drift handling.
- Modify: `plans/README.md` — index the completed stage after verification.
- Modify: `plans/CURRENT-REVIEW-AND-NEXT.md` — record the root cause, fix, and required real rerun.

## Interfaces

- Consumes: `C2TaskYaml.source.base_revision` and the copied `workspace` directory produced by `LocalTaskSourceAdapter.prepareTask()`.
- Produces: a prepared workspace whose `HEAD` is exactly `base_revision`, with no upstream Git objects or private reference material copied.

## Tasks

### Task 1: Add a failing rehydration regression

**Files:**

- Modify: `packages/tasks/src/source.test.ts`

- [x] **Step 1: Write the failing test.**

  Create a temporary prepared-task fixture with a public workspace file, a deterministic local Git base using the same preparation metadata, a `task.yaml` containing that base revision, and a native verifier descriptor. Run `LocalTaskSourceAdapter.prepareTask()`, assert the destination workspace has `HEAD === source.base_revision`, edit a tracked file, and assert `git diff --binary <base_revision> HEAD` succeeds. Add a second assertion that a deliberately wrong base revision rejects with `ConfigError`.

- [x] **Step 2: Run the focused test and verify RED.**

  Run `npm run test --workspace @aob/tasks -- src/source.test.ts`.

  Expected: the new test fails because the copied workspace has no `.git` repository and no exact recorded base commit.

### Task 2: Implement deterministic Git-base rehydration

**Files:**

- Modify: `packages/tasks/src/source.ts`

- [x] **Step 1: Add the minimal typed helper.**

  After `copyPublicTree(taskDir, target, taskDir)`, when `task.source.base_revision` exists, initialize only `target/workspace` with a fresh repository, set branch `main`, configure `user.name=aob-preparation`, `user.email=aob-preparation@example.invalid`, and `core.hooksPath=/dev/null`, add all files, and create the commit with author and committer date `2000-01-01T00:00:00Z` and message `DeepSWE sanitized upstream base`. Use `execFileSync` with an explicit argument array and a bounded environment; do not invoke a shell or copy any source `.git` directory. Verify `git rev-parse HEAD` equals the declared base revision and throw `ConfigError` on any command failure or mismatch.

- [x] **Step 2: Run the focused test and verify GREEN.**

  Run `npm run test --workspace @aob/tasks -- src/source.test.ts` and then `npm run typecheck --workspace @aob/tasks`.

  Expected: the exact-base and verifier-diff tests pass, and malformed provenance fails closed.

### Task 3: Record and verify the boundary fix

**Files:**

- Modify: `plans/README.md`
- Modify: `plans/CURRENT-REVIEW-AND-NEXT.md`

- [x] **Step 1: Document the actual root cause and evidence.**

  State that the runner’s second preparation pass previously stripped `.git` while retaining `base_revision`, causing native verifier failures or agent time spent reconstructing history. Record that rehydration is deterministic, source `.git` remains excluded, and the interrupted paid diagnostic must be rerun after the fix.

- [x] **Step 2: Run the complete no-spend gate.**

  Run:

  ```text
  npm test
  npm run typecheck
  npm run lint --silent
  sh -n scripts/*.sh images/*.sh
  git diff --check
  ```

- [x] **Step 3: Commit.**

  Commit with `fix: rehydrate prepared DeepSWE git bases`.

## Acceptance

- A prepared DeepSWE task’s second local preparation pass produces `HEAD` exactly equal to its recorded `source.base_revision`.
- `git diff --binary <base_revision> HEAD` works after a model edit, matching the source-owned verifier’s required boundary.
- Upstream `.git` metadata and private task-root `reference/` material remain absent from the measured workspace.
- Wrong or unreproducible base provenance fails closed with `ConfigError`.
- Focused and full no-spend gates pass; no provider call is made by tests.

## Out of scope

- Changing DeepSWE prompts, tests, solution patches, or native verifier semantics.
- Changing task selection, short/long regime bounds, C1–C4, visibility, pricing, or official review flags.
- Treating the interrupted diagnostic or any subsequent calibration as release approval.

## Risk table

| Risk | Mitigation |
|---|---|
| Commit bytes differ from the preparation pass | Use identical tree, branch, identity, hook, timestamp, and message; compare the resulting full SHA and fail closed. |
| Rehydration accidentally copies private or upstream Git data | Rehydrate only after `copyPublicTree`; initialize a new repository and add only the copied public workspace. |
| Untrusted task content reaches a shell | Invoke `git` with `execFileSync` argument arrays and no shell interpolation. |
| A real run still fails for model/task reasons | Rerun one bounded diagnostic only after checking the C4/verifier logs; retain it as diagnostic evidence. |

**Status (2026-08-31):** Implemented and verified. The local adapter now
recreates the exact sanitized DeepSWE base commit after its second preparation
pass. Focused tests, the full workspace/script suite, typecheck, lint, shell
syntax, diff checks, and stale-container cleanup all passed. The interrupted
paid control must be rerun separately; this fix does not qualify calibration.

The corrected real diagnostic for `prometheus-typed-label-sorting` reached the
native verifier boundary with `HEAD` equal to the declared base revision
`f9fe074abb2b527d83ea2d7c52fbc914e0b3a3d0`. Hermes then timed out at 900
seconds after a final unpriced request; the capped runner stopped before Codex
and recorded no spend. The artifact is boundary evidence only, not a
calibration pass.
