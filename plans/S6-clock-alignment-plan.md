# S6 — Cross-process clock provenance follow-up

## Goal

Make cross-process timing provenance fail closed. Every adapter result must
carry the wall/monotonic anchor captured by the process that measured its
`tStart`/`tEnd`; the runner must never synthesize an anchor after the run.
Add a no-spend handshake calibration that measures the projection error between
two Node processes and records evidence for S7 preflight.

## Scope and invariants

- Require `C3AdapterResult.anchor` in the TypeScript contract, runtime
  validator, and JSON Schema.
- Keep all duration arithmetic monotonic and within one process clock. The
  calibration measures only the error bound of projecting one process's
  timestamp onto another process's relative clock.
- Remove the runner's post-hoc fallback anchor. A missing anchor becomes a
  typed adapter/contract failure and cannot become a plausible C4 run.
- The calibration is zero-spend, dependency-free, bounded, and emits a
  machine-readable report outside `run.json`; it does not add derived metrics
  to C1–C4. Its acceptance bound uses the minimum-round-trip exchange's
  midpoint residual plus half its round trip (Cristian-style projection); the
  all-sample maximum remains diagnostic so scheduler pauses are not mistaken
  for clock skew.
- Do not fabricate `toolEvents` or claim full visibility. Harness-share
  availability remains a separate adapter/product gate.

## TDD tasks

1. Add failing contract and runner tests for a missing anchor.
2. Make the C3 anchor required in types, validator, schema, and runner paths;
   update only fixtures that intentionally represent valid C3 results.
3. Implement the two-process calibration and a script/plan record. Gate S7 on
   a conservative measured projection bound of at most 10 ms, alongside the
   existing proxy latency calibration.
4. Run the focused tests, full workspace tests, typecheck, lint, shell syntax,
   and no-spend calibration checks.

## Acceptance

- A C3 result without an anchor is rejected by runtime validation and schema.
- Every host and Docker adapter path emits an anchor from its measured timing
  process; no runner fallback remains.
- The calibration report is reproducible, bounded, contains sample count,
  best/max round-trip, residual, minimum-RTT projection bound, diagnostic
  maximum bound, and `provider_requests=0`.
- S7 preflight refuses a missing/over-limit clock calibration report.
- Existing C1–C4 fields and S6 equations remain unchanged.

**Status (2026-08-28):** Implemented and locally verified. C3 anchors are now
required by the type, runtime validator, and JSON Schema; the runner no longer
creates a post-hoc anchor, and C4 rejects conflicting duplicate anchors. The
two-process calibration produces 20 samples with a minimum-RTT residual-plus-
half-round-trip bound and zero provider requests. S7 writes the fresh report to
`scratch/s7-clock-calibration.txt` (or `AOB_CLOCK_CALIBRATION_REPORT`) and still
requires rerunning this gate immediately before its official window.

## Out of scope

Task selection, paid calibration, tool-event instrumentation, changing the
headline metric, and official S7/S8 execution.
