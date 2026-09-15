# S4 Codex structured tool-events implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or **superpowers:executing-plans** to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture timestamped Codex tool-call intervals from its structured JSONL output on both host and Docker execution paths, promoting visibility only after live evidence proves complete, measurable timing.

**Architecture:** Codex runs with `codex exec --json`. A pure parser pairs `item.started` and `item.completed` records for tool-bearing item types by item ID. The shared host and Docker process runners timestamp stdout chunks with their own monotonic clock, preserve a redacted raw structured log, and return C3 tool events. C4 may report Codex as `full` only after a completed smoke demonstrates complete pairing with positive-duration intervals; incomplete or unmeasurable streams fail closed rather than becoming `full` evidence.

**Tech Stack:** TypeScript strict, Node.js child-process streams, existing C3 contract, Vitest; no new dependency.

**Spec:** `/Users/tom910/dev/visa-case/agent-overhead-benchmark-implementation-roadmap.md` §2.4 and S4, plus the north-star design §3–§4.2.

## Global Constraints

- Do not change the measurement equations or add derived metrics to `run.json`.
- Use monotonic `performance.now()` timestamps from the process collecting the stream.
- Preserve stdout/stderr redaction and never publish prompts, keys, or bodies.
- Tool events must be inside the adapter interval and must use stable start/end pairs.
- Unknown non-tool Codex lifecycle records may be retained in the raw log but must not become tool intervals.
- An unmatched or malformed tool record cannot promote visibility to `full`.
- No new npm dependency and no provider spend in tests.

## Files

- Create `packages/adapters/src/codex-events.ts` with a pure incremental JSONL parser.
- Modify `packages/adapters/src/types.ts` and `packages/adapters/src/spawn.ts` for optional structured stream capture.
- Modify `packages/adapters/src/codex.ts` to request JSONL and declare the capture format.
- Modify `packages/runner/src/docker.ts` to timestamp Docker stdout chunks and return parsed events/raw log.
- Modify `packages/runner/src/cell.ts` to carry host/Docker tool events and raw logs into the cell artifact.
- Modify `packages/contracts/src/validate.ts` only if the focused contract tests expose a missing invariant; do not relax validation.
- Add parser, host-capture, Docker-capture, and C3 propagation tests in the existing package test files.
- Update `plans/README.md` and this plan with verified status only after the full gate.

## Tasks

### Task 1: Specify the parser with failing tests

- [x] Add sanitized JSONL fixtures covering a command execution pair, file-change pair, interleaving, split input chunks, unknown lifecycle records, malformed JSON, and unmatched IDs.
- [x] Add tests requiring `{ tStart, tEnd, kind }` intervals, stable ID pairing, monotonic intervals, and fail-closed diagnostics for malformed/unmatched tool records.
- [x] Run the focused adapter tests and observe RED before implementing the parser.

### Task 2: Implement the incremental Codex parser

- [x] Implement `createCodexToolEventParser()` with `feed(chunk, observedAt)` and `finish(observedAt)` methods.
- [x] Recognize `item.started` and `item.completed` for `command_execution`, `file_change`, and `mcp_tool_call`; ignore thread/turn/message lifecycle records.
- [x] Pair by item ID, preserve first observed start and completion timestamps, reject duplicate starts/completions and malformed tool records, and report unmatched records as incomplete.
- [x] Run focused parser tests and typecheck.

### Task 3: Wire live host and Docker capture

- [x] Add an optional structured-stream parser hook to host `spawnAdapter`; feed stdout chunks with `performance.now()`, write a redacted `tool-events.jsonl`, and return parsed C3 events.
- [x] Add a serializable `toolEventFormat: "codex-json"` invocation marker and equivalent timestamped stdout capture in `runDockerCommand`.
- [x] Keep Codex at `partial` until real capture completeness is independently demonstrated.
- [x] Add no-provider fake-process/fake-Docker tests for split chunks, raw-log redaction, and timestamp bounds.

### Task 4: Propagate C3 artifacts through cells

- [x] Copy host structured logs into the cell directory and preserve Docker structured logs beside stdout/stderr.
- [x] Include `toolEvents` and `artifacts.toolLogPath` in C3 adapter results when capture is available; retain valid partial results for timed-out runs without inventing missing intervals.
- [x] Add regression tests proving C4 validation and report loading preserve the events without adding derived fields to `run.json`.

### Task 5: Real smoke and visibility decision

- [x] Run one bounded Codex Docker smoke through the local proxy using the approved model and inspect the raw structured stream for complete tool pairs.
- [x] Run a completed real Docker smoke through the local proxy using the approved model and inspect complete tool-item pairing.
- [x] Keep Codex at `partial`: the smoke's pairs arrived in one stdout batch and had zero measurable duration, so harness-share derivation remains disabled.
- [x] Update adapter documentation and METHODOLOGY with the observed result; do not rank harness share on zero-duration evidence.

### Task 6: Verify and commit

- [x] Run focused tests, workspace tests, typecheck, lint, shell syntax, and `git diff --check`.
- [x] Commit with `feat: capture Codex structured tool events` only after all applicable acceptance gates pass.

Implementation status: Tasks 1–4 are complete; Task 5 has a negative visibility
decision. The completed local Docker smoke used GLM Flash, passed the verifier,
and recorded complete command/file pairs with no dangling starts, but all
intervals were zero-length because start/completion records arrived in one
stdout batch. Codex remains `partial`; timeout, malformed, or unmeasurable
streams fail closed.

## Acceptance

Codex structured output is captured live on host and Docker paths, parsed into
validated C3 intervals, retained as a redacted raw artifact, and covered by
split/interleaved/malformed/unmatched tests. A completed real smoke determines
whether timing is measurable; parser existence or zero-duration pairs does not
establish `full`.
