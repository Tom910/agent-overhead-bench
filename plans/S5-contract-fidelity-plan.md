# S5 — Runner and contract fidelity hardening

> **For agentic workers:** Use this plan for the narrowly scoped follow-up that
> keeps the implemented runner aligned with the frozen C4/default-condition
> contract. Do not change timing, cost, or measurement semantics.

**Goal:** Ensure default-condition cells do not claim or inject the pinned model,
and make the C4 JSON Schema agree with the strict runtime validator.

**Constraints:** TypeScript strict; no new dependencies; typed contract errors;
no API keys or token spend in tests; preserve the existing C1–C4 field meanings.

## Task 1: Preserve the empty default-condition model

- [x] Add regression coverage for matrix-to-cell propagation and OpenCode's
  default config.
- [x] Pass `opts.model` only to pinned cells; serialize `model: ""` for default
  C4 records.
- [x] Keep default adapter invocations free of model flags and explicit model
  config.

## Task 2: Align the C4 schema with runtime validation

- [x] Require `task_environment` in the C4 schema.
- [x] Require integer, nonnegative verification exit codes in the C4 schema.
- [x] Add schema-validation regression tests for both discrepancies.

## Verification

- [x] Focused adapter, runner, and contract tests.
- [x] Full workspace tests, strict typecheck, lint, diff check, and shell syntax.

**Status (2026-08-27):** Implemented and verified. This hardening does not make
the official run eligible: source composition, human review, calibration, and
the S7 data window remain separate gates.
