# S2 Docker Probe Timeout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task.

**Goal:** Ensure an unavailable or wedged Docker daemon cannot leave the S2 probe wrapper running indefinitely.

**Architecture:** Add a small Node.js command wrapper that runs one child process with a finite timeout, forwards its standard streams, and returns a conventional timeout exit code after terminating the child. The Bash S2 probe invokes it only for the daemon-readiness check, defaulting to 10 seconds with a bounded test override; the existing Docker build/run lifecycle and cleanup traps remain unchanged.

**Tech Stack:** Bash, Node.js built-ins (`node:child_process`), Vitest.

**Spec:** `plans/S2-feasibility-checklist.md`, S2 no-secret/reproducibility requirements, and the observed stale `s2-docker-probe.sh` processes.

## Global Constraints

- CI never holds API keys or spends tokens.
- No new npm dependency; Node.js is already a project runtime requirement.
- The timeout must default to 10 seconds, remain finite when overridden for a test, and must not silently turn a daemon failure into a successful probe.
- Preserve the existing temporary-key cleanup traps and Docker `--pull=never` behavior.
- Do not change the benchmark measurement model or any C1–C4 contract.

### Contracts and boundaries

- Consumes: an executable path plus its argument vector from the caller; child stdout/stderr/stdin behavior.
- Produces: the child exit code on normal completion, or exit code `124` when the timeout expires; signal failures remain nonzero.
- The S2 shell probe consumes that result for `docker info`; it must stop before image builds or token-spending containers when Docker is unavailable.
- Out of scope: timeouts for measured agent cells, Docker builds, `docker run`, provider requests, or unrelated scripts.

## Tasks

### Task 1: Specify timeout behavior with failing tests

**Files:**
- Modify: `packages/runner/src/s2-docker-probe.test.ts`
- Create: `scripts/command-timeout.test.mjs`

**Interfaces:**
- Consumes: the command wrapper CLI defined by Task 2 as `node scripts/command-timeout.mjs <timeout-ms> <command> [args...]`.
- Produces: tests proving a fast command preserves exit code and a sleeping command is terminated and returns `124` within a bounded test window.

- [x] **Step 1: Add the failing helper tests**

  Add a Node test using `node:test` and `node:child_process` that invokes the not-yet-existing helper with `process.execPath -e "process.exit(7)"` and asserts exit `7`, then invokes it with `process.execPath -e "setTimeout(() => {}, 60000)"` and asserts exit `124` within 2 seconds. Keep the timeout test independent of Docker and credentials.

- [x] **Step 2: Add the probe integration expectation**

  Read `scripts/s2-docker-probe.sh` in the existing Vitest suite and assert its daemon check invokes `scripts/command-timeout.mjs` with a finite timeout and `docker info`.

- [x] **Step 3: Run the new tests and verify RED**

  Run `node --test scripts/command-timeout.test.mjs` and `npm run test --workspace @aob/runner -- src/s2-docker-probe.test.ts`.

  Expected: the helper test fails because `scripts/command-timeout.mjs` does not exist, and the source assertion fails because the shell script still calls unbounded `docker info`.

### Task 2: Implement the bounded command wrapper

**Files:**
- Create: `scripts/command-timeout.mjs`
- Test: `scripts/command-timeout.test.mjs`

**Interfaces:**
- Consumes: `timeout-ms` as a positive integer and at least one command argument.
- Produces: child stdout/stderr passthrough, normal child exit status, `124` on timeout, and a nonzero usage/configuration error without throwing an unhandled stack trace.

- [x] **Step 1: Implement minimal argument validation and spawning**

  Use `process.argv`, `spawn`, and `setTimeout`. Validate a finite positive integer timeout and a non-empty command. Spawn with `stdio: "inherit"`; on normal exit, return the child code (or `1` if it exited only by signal). On timeout, send `SIGTERM`, then `SIGKILL` after a short grace period if the child is still alive, and resolve with `124`.

- [x] **Step 2: Run the helper tests and verify GREEN**

  Run `node --test scripts/command-timeout.test.mjs`.

  Expected: both the normal-exit and timeout tests pass, with the timeout completing within the test bound.

### Task 3: Apply the wrapper to the Docker readiness check

**Files:**
- Modify: `scripts/s2-docker-probe.sh`
- Modify: `plans/README.md`
- Test: `packages/runner/src/s2-docker-probe.test.ts`

**Interfaces:**
- Consumes: `scripts/command-timeout.mjs` from Task 2.
- Produces: a finite 10-second Docker daemon check that exits `124` on a hung `docker info`; all later probe steps remain unchanged.

- [x] **Step 1: Replace only the unbounded daemon check**

  Change `docker info >/dev/null` to `DOCKER_INFO_TIMEOUT_MS="${AOB_S2_DOCKER_INFO_TIMEOUT_MS:-10000}"` followed by `node "$ROOT/scripts/command-timeout.mjs" "$DOCKER_INFO_TIMEOUT_MS" docker info >/dev/null`. Retain `set -euo pipefail`, existing env-file cleanup, and signal traps. Do not add a dependency or alter the Docker run command.

- [x] **Step 2: Run focused integration tests**

  Run `node --test scripts/command-timeout.test.mjs` and `npm run test --workspace @aob/runner -- src/s2-docker-probe.test.ts`.

  Expected: PASS; the source contract confirms the finite check and the interruption cleanup test still removes its temporary key file.

- [x] **Step 3: Update the stage index and record status**

  Add this plan to the S2 row in `plans/README.md` and append an implementation/status note naming the finite timeout and the no-spend test boundary.

- [x] **Step 4: Commit the isolated fix**

  Run `git diff --check`, then commit with `fix: bound Docker probe readiness check`.

## Verification gate

Before claiming this fix complete, run:

```bash
node --test scripts/command-timeout.test.mjs
npm run test --workspaces --if-present
npm run typecheck
npm run lint --silent
sh -n scripts/*.sh images/*.sh
git diff --check
```

The fix is complete only if the helper tests demonstrate both normal exit propagation and bounded timeout termination, the full workspace remains green, and no Docker containers or provider requests are started by the tests.

## Human review

Review that `124` is treated as a hard Docker readiness failure, that signal cleanup cannot remove the temporary key file prematurely, and that the default 10-second bound (with only a finite test override) is limited to the unmeasured S2 daemon probe rather than the benchmark cell timeout.

**Status (2026-08-27):** Implemented. The helper terminates the complete POSIX
process group, escalates from SIGTERM to SIGKILL, preserves normal exit codes,
and the shell integration test confirms timeout `124` plus temporary-key
cleanup. No provider request or Docker container is started by these tests. The
isolated implementation was committed before the later S7 readiness timeout
follow-up.
