# S5 Kill/Resume Smoke Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task.

**Goal:** Make the S5 kill/resume smoke wait long enough for its runner child to publish initial state on a loaded host while retaining a finite failure bound.

**Architecture:** Keep the runner and persisted-state protocol unchanged. Extend only the shell smoke script’s initial polling window from 250 ms to 5 seconds before it reads `state.json`; a missing state after that bounded window remains a failure.

**Tech Stack:** POSIX shell, Node.js runner CLI, existing Vitest integration test.

**Spec:** `plans/S5-runner-plan.md` and the project verification requirement.

## Global Constraints

- No changes to runner lifecycle, matrix ordering, or C4 artifacts.
- The smoke test remains bounded and still kills a live first attempt.
- No provider request, Docker container, or new dependency.
- Preserve the interrupted-state assertion and the final eight-artifact assertion.

## Task 1: Extend only the initial state polling window

**Files:**
- Modify: `scripts/s5-kill-resume.sh`
- Modify: `plans/README.md`

**Interfaces:**
- Consumes: the existing `OUT/state.json` publication by `packages/runner/src/cli.ts`.
- Produces: the same kill/resume smoke with up to 100 polls at 50 ms each.

- [x] **Step 1: Reproduce the race**

  Run the runner workspace test under the normal workspace load. The smoke can kill its child before the first state file is published because its current five-poll, 50 ms window is only 250 ms.

- [x] **Step 2: Apply the bounded polling change**

  Change `for _ in 1 2 3 4 5; do` to `for _ in $(seq 1 100); do`. Leave the 150 ms post-state delay, `kill -KILL`, and all state assertions unchanged.

- [x] **Step 3: Verify the focused runner test**

  Run `npm run test --workspace @aob/runner -- src/runner.test.ts` and require the complete runner test file to pass.

- [x] **Step 4: Commit**

  Run `git diff --check`, then commit with `test: make kill resume smoke startup bounded`.

## Verification gate

Run the focused runner test, then the full workspace test/typecheck/lint/shell/diff gate. This change is complete only if the polling remains finite and the kill/resume assertions still observe an interrupted first attempt.

**Status (2026-08-27):** Implemented and verified. The full workspace gate
passes with the kill/resume smoke allowing at most five seconds for initial
state publication; the kill and persisted-state assertions are unchanged.
