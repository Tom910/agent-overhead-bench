# S4 — Fairness recipe fidelity follow-up

**Status (2026-08-31):** implemented and verified, including the S2 probe
recipe that had retained the old throttling flags.

## Goal

Keep the required headless/approval flags while removing adapter-specific
quality, reasoning, or spend throttles that change model work. The Docker
boundary remains the measurement sandbox; it is not a model-setting.

## Scope

- Remove Claude Code `--effort low` and `--max-budget-usd 0.5` from host and
  container invocations.
- Remove Codex `model_reasoning_effort = "low"` from host and container
  configuration.
- Preserve pinned model selection, base-URL/key routing, and the minimum
  noninteractive approval flags.
- Update the S2 evidence and adapter documentation to distinguish retained
  headless flags from removed quality/budget settings.
- Disable Codex's optional web-search/server-tool surface for OpenRouter
  compatibility; the benchmark tasks require only the shell/edit loop, and
  leaving this enabled causes Codex 0.149.1 requests to fail before inference.
- Set Codex reasoning effort to `high` for GLM 5.3 Flash because Codex's local
  metadata fallback sends `none`, which the model rejects. This is recorded as
  a compatibility deviation and is not a budget throttle.

No new dependency is needed.

## Acceptance

- Adapter tests assert the exact revised host/container recipes.
- Pinned and default conditions still differ only in model selection/config.
- The full test suite, strict typecheck, and lint pass.
- The methodology records the remaining execution-boundary differences and
  does not claim a native/default calibration that was not run.
- Codex host and Docker invocations both contain `web_search = "disabled"` and
  the adapter tests lock the setting.
- Codex host and Docker invocations both contain
  `model_reasoning_effort = "high"` and the adapter tests lock the setting.

## Out of scope

Tool-event extraction, task-source approval, official paid runs, and changing
the C1–C4 measurement model.
