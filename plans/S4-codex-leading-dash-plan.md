# S4 — Codex prompt option-termination follow-up

## Goal

Ensure every valid task prompt is passed to Codex as data, including prompts
whose first character is `-`, rather than being parsed as a CLI option.

## Scope and invariants

- Add the standard `--` option terminator immediately before the positional
  Codex prompt in both host and fresh-container invocation descriptors.
- Keep the S2 model, provider, sandbox, and headless flags unchanged.
- Do not alter prompt contents, timing, proxy routing, or the measurement model.
- Add a no-spend regression test using a leading-dash prompt.

## Acceptance

- Host and Docker Codex argv contain `--` immediately before the prompt.
- The leading-dash prompt reaches the CLI as one positional value.
- Adapter tests, typecheck, lint, and the real bounded DeepSWE retry pass the
  argument-parsing boundary before any further calibration is considered.

## Status (2026-08-28)

The real DeepSWE `ink-grid-box-layout` diagnostic exposed this issue. The fix
adds the option terminator to both host and Docker argv and the regression
test passes. A bounded real retry reached Codex successfully and produced
normal Responses usage events, confirming that the leading-dash prompt now
crosses the adapter boundary. The cell still exhausted the 300-second task
timeout and was quarantined after `$0.020453895` total slice spend, so it is
not calibration evidence and the task remains unsuitable for the short regime
until a separate, justified task/timeout decision is made.

The implementation acceptance is complete; the task-calibration gate is not.
