# S7 Container Clock Calibration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task.

**Goal:** Measure and gate the Docker-container epoch clock against the host clock before an official run can accept OpenCode timing evidence.

**Architecture:** A no-spend shell entrypoint delegates to a dependency-free Node process that runs a digest-pinned local base image with a read-only, network-disabled container and performs five interactive stdio pings per sample. Each ping estimates the container-host epoch offset at the host midpoint; the minimum round-trip ping is retained so Docker Desktop transport delay is not mistaken for clock skew. The Node process uses deadline-bounded stream reads and process-tree termination, so a stalled Docker/FIFO path cannot hang preflight. It records sample offsets, a conservative bound (`|offset| + ceil(RTT/2)`), round-trip bound, image identity, and provider-request count in a text report. S7 preflight requires the report's sample count, conservative bound ≤10 ms, and retained round-trip ≤20 ms; the OpenCode parser independently rejects events that map before the adapter anchor. The no-spend fake-Docker unit case uses one sample to avoid turning incidental local subprocess scheduling into a flaky assertion; official preflight retains its configured multi-sample gate.

**Tech Stack:** POSIX shell wrapper, Node child-process streams, Docker CLI, existing S7 preflight.

**Spec:** `/Users/tom910/dev/visa-case/agent-overhead-benchmark-implementation-roadmap.md` §2.1 and S7; `/Users/tom910/dev/visa-case/agent-overhead-benchmark-design.md` §3–§4.

## Global Constraints

- No provider calls, API keys, or new npm dependencies.
- Use `--pull=never`, the local `aob-base:s2` image, `--network none`, read-only mode, and dropped capabilities.
- Do not infer or rewrite model/tool timing; this is only a preflight eligibility measurement.
- Keep all recorded times as integer epoch milliseconds in the calibration report; C1/C3/C4 remain unchanged.
- A missing, malformed, stale, or over-bound report must fail S7 preflight before measured cells start.

## Files and interfaces

- Create `scripts/s7-container-clock-calibrate.sh` and `scripts/s7-container-clock-calibrate.mjs`: `OUTPUT [--samples N] [--max-offset-ms N] [--timeout-ms N]`; write a key/value report and exit nonzero on invalid samples, timeout, or conservative-bound failure.
- Create `scripts/s7-container-clock-calibrate.test.mjs`: uses a fake Docker executable to test successful calibration, offset failure, malformed output, and pull/network flags without Docker or provider access.
- Modify `scripts/s7-preflight.sh`: invoke the calibration after local images are validated and reject reports that do not prove the expected sample count, image, method, and bound.
- Modify `packages/runner/src/s2-docker-probe.test.ts` or a script test only if the preflight invocation needs a static no-spend assertion.
- Modify `plans/README.md`, `plans/S7-runs-protocol.md`, `plans/CURRENT-REVIEW-AND-NEXT.md`, and `METHODOLOGY.md` to record the gate and its limitations.

## Tasks

### Task 1: Add the no-spend calibration command

- [x] Write tests first for a fake Docker that returns a container timestamp within the bound, then run `node --test scripts/s7-container-clock-calibrate.test.mjs` and observe the missing-command failure.
- [x] Implement explicit argument parsing, deadline-bounded five-ping minimum-RTT offset calculation, conservative uncertainty bound, and a report containing `method=container-host-epoch-ms`, `samples`, `max_abs_offset_ms`, `max_conservative_bound_ms`, `max_round_trip_ms`, `image=aob-base:s2`, and `provider_requests=0`.
- [x] Make malformed timestamps, Docker failures, missing samples, and an absolute offset above the selected bound exit nonzero without printing secrets.
- [x] Run the focused test and `sh -n scripts/s7-container-clock-calibrate.sh`.

### Task 2: Bind the report to S7 preflight

- [x] Add a no-spend preflight source assertion and a fake-Docker calibration test covering the expected method, sample count, image, and `max_abs_offset_ms <= 10`.
- [x] Invoke the script after `s5-build-images.sh --check`, defaulting to `scratch/s7-container-clock-calibration.txt`, with `AOB_S7_CONTAINER_CLOCK_SAMPLES` and `AOB_S7_CONTAINER_CLOCK_MAX_OFFSET_MS` overrides bounded to positive values and 10 ms maximum.
- [x] Reject missing, stale-format, wrong-image, provider-request, over-bound, high-round-trip, or timeout-invalid reports before measured cells start.
- [x] Run the focused preflight tests and confirm no provider command is reachable from this gate.

### Task 3: Document and verify

- [x] Record that the gate measures Docker VM/host clock agreement at preflight time and does not prove zero drift during a multi-hour run or child-session completeness.
- [x] Update the stage index and current handoff with the implementation status while keeping OpenCode visibility `partial`.
- [x] Run `npm test`, `npm run typecheck`, `npm run lint --silent`, `sh -n scripts/*.sh images/*.sh`, `git diff --check`, and the live no-spend Docker calibration.
- [x] Commit the completed stage as `feat: gate container clock alignment`; the later conservative-bound/timeout hardening is included in the next report commit.

## Acceptance

The calibration command must be deterministic under the fake Docker test, use no network or provider credentials, fail closed on malformed/over-bound evidence, and be required by S7 preflight after image validation. The implementation must not promote any adapter to full visibility or alter the C1–C4 measurement equations.

## Out of scope

- Runtime clock correction or changing OpenCode event timestamps.
- Child-session completeness and full tool visibility.
- Official source approval, human sign-off, paid calibration, or the S7 matrix.
