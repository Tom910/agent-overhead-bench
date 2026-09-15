# S7 — Long-horizon release path

**Status (2026-08-30):** Implemented; real long-regime matrix remains gated on
source review, calibration, and maintainer sign-off.

## Goal

Make the selected DeepSWE long-horizon regime runnable as a real, bounded
matrix while keeping it structurally separate from the short 1–5 minute
comparison. The same C1–C4 measurement model, Docker isolation, spend guard,
and report derivation are used; only the task-regime gate and release wording
change.

## Scope and invariants

- `short` remains the default and continues to enforce expected maximum ≤5
  minutes and timeout ≤300 seconds.
- An explicit `AOB_RUN_REGIME=long` opt-in accepts only long task metadata:
  expected range `[6, 15]` minutes and timeout 301–900 seconds.
- The runner still requires a reviewed public source, pinned model, pinned
  condition, the declared official tool scope (currently five tools), contiguous
  repetitions, and the same $1,500 recorded-spend cap for a release-scale run.
  No long result may be pooled with short
  result sections.
- C4 already records `task_regime`; report section keys and archive identity
  checks must continue to include it. The report positioning must name the
  actual regime rather than claiming every result is short.
- No change to timing equations, visibility rules, pricing, or task verifier
  semantics. No provider request occurs in tests.

## Implementation order (TDD)

1. [x] Add no-spend shell tests for the default short gate, explicit long opt-in,
   invalid regime values, and regime/timeout validation.
2. [x] Add the explicit regime input to `run-all.sh` and pass it into S7 preflight.
3. [x] Make S7 preflight validate selected task metadata against the selected
   regime, with clear short/long failure messages.
4. [x] Add report tests and implementation so positioning identifies each regime
   and cannot describe a long-only report as a short comparison.
5. [x] Update operational plans and launch wording to describe DeepSWE long as a
   separate release regime; retain short as a separate, still-gated option.
6. [x] Run one carefully capped real long calibration after the path is verified;
   retain it as evidence only until task review and the full matrix are done.

The implementation and diagnostic execution are complete. The diagnostic is
intentionally not represented as a passing calibration gate.

## Acceptance

- `run-all.sh` defaults to short and rejects long tasks unless
  `AOB_RUN_REGIME=long` is explicit.
- Explicit long mode reaches the same preflight and runner with no hidden
  bypasses, and a mismatched task pack is rejected before execution.
- Report output for a long-only tree says `long-horizon`/`long` and never opens
  with the short-only positioning statement; a mixed tree has separate
  sections and an explicit mixed-regime limitation.
- Focused tests, full tests, strict typecheck, lint, and shell checks pass.
- A real calibration is bounded by an explicit per-cell estimate and recorded-spend cap;
  its outcome is documented without treating it as approval or publication.

## Diagnostic execution (2026-08-29)

`psd-tools-blend-range-api` was run with one Codex cell, pinned to
`z-ai/glm-5.3-flash`, in explicit long mode with `timeout_s: 900`, a `$1`
per-cell estimate, and a `$2` recorded-spend cap. The first attempt timed out after 38
proxy events; the runner performed its one permitted retry, which also timed
out after 13 events. The final C4 artifact retained `task_regime: "long"`,
`tool_visibility: "partial"`, and `outcome: "timeout"`; no verifier pass was
claimed. State and attempt artifacts reconcile to `$0.04838149` total spend.
This confirms the real long path and spend accounting, but DeepSWE task
calibration and source approval remain open.

### Two-CLI Flash control (2026-08-30)

`anko-default-function-arguments` was then run with Codex and Hermes, one
planned attempt per CLI, `z-ai/glm-5.3-flash`, `timeout_s: 900`, a `$1`
conservative cell estimate, and a `$2` recorded-spend cap. Both initial attempts timed
out. Codex produced a schema-valid long C4 timeout at `$0.02771733`; Hermes
produced a retry-archived timeout at `$0.00282104`. The subsequent retry was
stopped fail-closed because terminal usage was unavailable under the cap. The
persisted state total is `$0.030538365`; no verifier pass was claimed and no
official result was created. This confirms that the long execution path,
timeout cleanup, and unavailable-spend guard work, but it is not calibration
evidence for release.

### Corrected Git-boundary control (2026-09-01)

`cattrs-partial-structuring-recovery` was rerun with the corrected immutable
base/model-patch capture path, Codex and Hermes, one planned attempt per CLI,
`z-ai/glm-5.3-flash`, `timeout_s: 900`, and a `$2` recorded-spend cap. The
five source-owned reference polarity replays passed before the paid cells.
Hermes timed out initially with `$0.01333927` known spend; Codex timed out with
`$0.050563705`; and the one Hermes retry ended with unavailable terminal usage.
The runner retained the final C4 records and retry evidence, then stopped with
the expected unavailable-spend budget refusal. State reconciles to
`$0.063902975`. No verifier pass was observed, so this is diagnostic evidence
only and does not qualify DeepSWE/Flash for release calibration.

## Out of scope

Task maintainer sign-off, the full selected-task × five-tool × N≥4 run, anomaly review,
OpenRouter export review, archive tagging, and human publication actions. Those
remain release gates after this execution path works.

## Risks

| Risk | Mitigation |
|---|---|
| Long results are accidentally compared with short results | Regime is part of C4 identity, report section key, preflight validation, and positioning text |
| A long timeout burns provider spend unexpectedly | Explicit opt-in, positive per-cell estimate, recorded-spend cap, sequential runner |
| A long run is mistaken for capability evidence | Docs call it an overhead measurement regime and preserve native verifier outcomes separately |
