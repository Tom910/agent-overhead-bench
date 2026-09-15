# S3 — DeepSWE calibration runner

> This is an S3 calibration utility, not an S7 launcher. It must never turn a
> provisional task or a partial run into publication data.

## Goal

Provide one reproducible command for bounded real calibration runs against the
selected DeepSWE revision. The command prepares the requested task IDs before
the timed matrix, runs the requested included CLIs with the pinned model through
the normal proxy/Docker path, preserves the generated source manifest beside
the results, and stops on the explicit spend cap.

## Scope and invariants

- Preparation happens before the runner starts its first cell; hidden tests and
  reference patches remain in the isolated verifier image.
- Defaults are one repetition, the two current calibration CLIs (`codex,hermes`),
  `z-ai/glm-5.3-flash`, OpenRouter, and a conservative `$0.05` per-cell
  estimate. All are overridable explicitly for diagnostics.
- The launcher always passes `--conditions pinned` and `--mode docker`.
- The launcher is intentionally not accepted by S7 preflight and does not alter
  any source review flags. Its output is diagnostic until the maintainer review,
  verifier polarity, two-CLI calibration, and composition gates are complete.
- Only `OPENROUTER_API_KEY` is read from `.env`; arbitrary shell code is never
  sourced and the value is never printed.
- No new runtime dependency is needed.

## Interface

```text
scripts/s3-deepswe-calibration.sh DEEPSWE_CHECKOUT OUTPUT_ROOT TASK_ID...
```

Environment overrides:

```text
AOB_CALIBRATION_TOOLS=codex,hermes
AOB_CALIBRATION_REPS=1
AOB_CALIBRATION_MODEL=z-ai/glm-5.3-flash
AOB_CALIBRATION_PRICE_BOOK=openrouter-2026-08-27
AOB_CALIBRATION_CAP_USD=0.25
AOB_CALIBRATION_ESTIMATE_CELL_USD=0.05
AOB_CALIBRATION_REGIME=short
AOB_CALIBRATION_TIMEOUT_S=300
AOB_CALIBRATION_EXPECTED_MINUTES_FILE=/path/to/task-duration-ranges.json
AOB_CALIBRATION_UPSTREAM=https://openrouter.ai/api
```

For a separate long-horizon diagnostic only, set
`AOB_CALIBRATION_REGIME=long` and `AOB_CALIBRATION_TIMEOUT_S` to a value from
301 through 900. The duration-map file supplies a reviewed range per selected
task; long entries must fit `[6, 15]`. The launcher never turns this into
short-regime or S7 evidence.

The output contains the normal runner `state.json` and `results/`, plus the
prepared `deepswe-source-manifest.json` copied after execution. A nonzero runner
status is preserved even when diagnostic artifacts were written.

## Acceptance tests

- `--help` is zero-spend and documents that the command is diagnostic only.
- The script rejects no task IDs, nonpositive caps/estimates, nonpositive reps,
  missing `.env` credentials for the remote upstream, and output paths that are
  symlinks or nonempty.
- The script invokes the existing preparation command, passes task directories
  to the existing runner, uses pinned Docker execution, and copies the source
  manifest after the runner exits.
- Shell syntax, the script contract test, the full workspace tests, typecheck,
  lint, and the existing zero-spend image/preflight checks pass.

## Out of scope

Official S7 approval, changing task selection, changing C1–C4, automatically
marking review flags true, or publishing calibration results.

## Latest diagnostic record (2026-09-01)

The user-approved one-task GLM Flash long-regime run selected
`cattrs-partial-structuring-recovery` with Hermes and Codex, a 900-second cell
bound, and a `$2` diagnostic cap. Block randomization scheduled Hermes first;
it timed out with an unavailable final provider-attempt spend, so the runner
failed closed before starting Codex. The retained state records `$0` spend and
the Hermes timeout. This is diagnostic evidence only and is not a two-CLI
calibration pass.
