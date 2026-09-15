# S3 — DeepSWE extended-regime diagnostic

**Status (2026-08-29):** Implemented and verified; one controlled diagnostic
complete, no short-regime calibration pass.

## Goal

Provide an explicit, bounded diagnostic for deciding whether a DeepSWE task is
blocked by the 1–5 minute timeout or by the pinned model/tool path. The default
calibration command remains short-regime (`300s` and `[1, 5]` minutes). An
operator must opt into the separate long regime, which records `long` in the
task contract and is never accepted as short-regime or S7 evidence.

## Scope and invariants

- Add `AOB_CALIBRATION_REGIME=short|long` and
  `AOB_CALIBRATION_TIMEOUT_S=positive integer`; default is `short`/`300`.
- Require `AOB_CALIBRATION_EXPECTED_MINUTES_FILE`, a reviewed per-task JSON
  duration map; the selected regime validates each range rather than assigning
  one range globally.
- Long diagnostics are capped at `900` seconds and require ranges within
  `[6, 15]`. The runner still uses the normal proxy,
  Docker isolation, C1–C4 artifacts, and spend guard.
- The model, tool set, and spend cap remain explicit. This change does not
  change derivation, source provenance, verifier inputs, or S7 acceptance.
- The generated source manifest and C4 records preserve the long task regime;
  report sections cannot silently pool it with short tasks.
- No provider request occurs in tests.

## Implementation order (TDD)

1. Add a no-spend launcher contract test for the opt-in variables, default, and
   900-second ceiling.
2. Validate the variables in the launcher and pass them to DeepSWE preparation.
3. Make preparation emit matching timeout and expected-minute metadata only for
   the explicit diagnostic regime.
4. Add a short-default S7 preflight gate plus an explicit long-regime path for
   release-scale runs.
5. [x] Run one Flash task with one selected CLI under a `$2` cap, preserve the
   result as diagnostic evidence, and do not alter review flags.
6. [x] Run focused/full verification and obtain an independent review.

## Acceptance

- Default `--help` and execution path remain short-regime and unchanged.
- Invalid, missing, or inconsistent regime/timeout combinations fail before
  source preparation or provider startup.
- An explicit long run emits `task_regime: "long"` and `timeout_s: 900` (or the
  selected bounded value) in its prepared task/C4 provenance.
- The default S7 preflight rejects any selected task whose expected maximum
  exceeds five minutes or whose timeout exceeds 300 seconds. Explicit long
  mode accepts only the `[6, 15]` minute / 301–900 second range and still
  requires all other review gates.
- The experiment’s outcome is documented as diagnostic only; it cannot satisfy
  the two-CLI short-regime calibration or S7 gates.

## Diagnostic result (2026-08-29)

`psd-tools-blend-range-api` was run once with Codex and
`z-ai/glm-5.3-flash` at the explicit long timeout of 900 seconds. The adapter
completed with 54 successful provider responses and 50 structured tool-item
pairs, including 22 positive-duration intervals. The DeepSWE native verifier
returned `verify_error`: the submitted patch added files that the source
verifier patch also attempts to add, so the verifier could not apply it. The
runner preserved the C4 failure artifact and charged `$0.045040735`; it did not
start a retry after the spend guard rejected the retry estimate. This confirms
the extended runner and capture path, but it is not task calibration, does not
approve the task, and does not promote Codex to `full` visibility.

## Corrected short-regime diagnostic (2026-08-29)

After the source-boundary and verifier-sandbox fixes, the same `psd-tools`
task was prepared from the sanitized eight-task pack and run once through
Codex and Hermes with `z-ai/glm-5.3-flash` and the 300-second short-regime
bound. Both adapters timed out. Codex produced 14 proxy events and Hermes 18;
the runner-recorded spend estimate was `$0.016292145`. One Hermes response had
unavailable usage, so the hard-cap guard refused to start a retry rather than
guessing its cost. No verifier result or calibration pass was claimed. The
run confirms that the corrected workspace boundary and read-only verifier
container work under real model traffic, but DeepSWE still has no short-regime
calibration pass.

## Follow-up long diagnostic (2026-08-30)

Two selected tasks were prepared for Hermes and Codex at the pinned
`z-ai/glm-5.3-flash` model with a 900-second timeout and a `$2` recorded-spend
cap. The first Hermes cell, `cattrs-partial-structuring-recovery`, reached the
real OpenRouter route and recorded 18 identifiable model attempts: 16
successful responses with usage, one successful response without usage, and
one aborted request. The known, usage-bearing portion prices to `$0.01305391`;
the complete cell spend is unavailable because the successful response and
the aborted request lack usage. The runner therefore stopped before starting the
remaining three cells and left the matrix pending, rather than guessing a
total or charging an incomplete cell. No verifier pass or calibration pass
was claimed. This confirms the fail-closed spend boundary and the endpoint
timing path for `model_requested: null`; it is diagnostic evidence only.

**Post-fix preservation confirmation (2026-08-30):** the same task was run
once through Hermes after the capped-run evidence fix. It produced 13
identifiable model attempts, 10 usage-bearing responses, and three responses
without usable usage; five oversized requests had a null requested model but
the pinned served model. The adapter timed out at 900 seconds, and the known
usage-bearing portion prices to `$0.006511385`; complete spend remained
unavailable. Unlike the earlier run, the runner retained `run.json` with
`spend_usd_estimate: null`, marked the cell `failed`, and refused a capped
resume before re-execution. This validates the evidence-preservation fix but
does not create calibration or approval evidence.

## Follow-up long diagnostic (2026-08-30, Codex only)

The selected `cattrs-partial-structuring-recovery` task was run with Flash at
the explicit 900-second long-regime bound under a `$2` cap. The first attempt
timed out with 63 successful provider responses and `$0.052594875` recorded
spend; the single runner retry also timed out with 78 successful responses and
total recorded spend `$0.119788805`. The cell was quarantined, no verifier pass
occurred, and the evidence remains diagnostic only. This controlled result
does not provide a long-regime calibration pass for Flash within the bounded
900-second policy.

## Follow-up long diagnostic (2026-08-31, OpenCode only)

The same `cattrs-partial-structuring-recovery` task was run through OpenCode
with Flash at the explicit 900-second long-regime bound under a `$2` cap. The
cell reached the proxy and recorded 19 provider events: 18 successful
responses with usage and one final aborted response without usage. The runner
timed out the adapter and refused a retry because complete recorded spend was
not priceable; no verifier pass occurred. The run produced OpenCode structured
tool output, but this DeepSWE attempt is diagnostic only and does not establish
calibration or full tool visibility.

## Follow-up short diagnostic (2026-08-31, OpenCode bug-fix candidate)

The selected `happy-dom-abort-pending-body-reads` bug-fix task was run through
OpenCode with Flash under the 300-second short-regime bound and a `$2` cap.
Both the initial attempt and the runner's single retry timed out; the final
attempt recorded 13 successful provider responses, no verifier pass, and the
matrix quarantined the cell after total recorded spend of `$0.01764666`.
This candidate also does not qualify the short regime or establish a
calibration pass. No further candidate swaps should be made without changing
the model or the declared task regime.

## Out of scope

Approving DeepSWE, changing the official task subset, modifying the measurement
equations, or launching the S7 matrix.
