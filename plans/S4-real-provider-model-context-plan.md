# S4 — Real-provider model and context compatibility

**Status:** Implemented and verified (2026-08-31)

## Goal

Make the pinned OpenRouter model usable by the installed Claude Code and Aider
recipes on a real prepared DeepSWE workspace, without changing the C1–C4
measurement model or hiding adapter failures.

## Evidence

The one-task all-tool diagnostic reached the proxy and Docker relay. Claude
Code exited before a model request because `--model z-ai/glm-5.3-flash` is
validated as a native Claude model and its session-title request returned 404.
The installed CLI supports provider remapping through
`ANTHROPIC_DEFAULT_*_MODEL`. Aider sent every prepared repository file and
requested about 1.88M input tokens against a 1.31M endpoint limit.

## Scope

- Remove the provider model ID from Claude Code's native `--model` argument in
  the pinned OpenRouter path; retain the requested ID through the supported
  `ANTHROPIC_DEFAULT_*_MODEL` environment mapping.
- Make Aider's staged file list deterministic and bounded before invocation so
  normal source work fits the provider context window. Preserve task files and
  prioritize source/config/test files; fail with a typed adapter error when the
  workspace cannot fit the minimum useful set.
- Add unit coverage for the exact invocations, model mapping, deterministic
  selection, and fail-closed overflow behavior.
- Rebuild affected images and rerun only Claude Code and Aider against the
  already selected diagnostic task.

## Non-goals

- Do not add `--max-budget-usd` or any other per-tool spend throttle.
- Do not claim a DeepSWE calibration pass from this diagnostic.
- Do not alter model-time, visibility, clock, cost, or verifier derivation.
- Do not add an npm dependency.

## Acceptance

- [x] Claude pinned invocation has no native `--model z-ai/...` argument and
  still exports the exact requested provider model to all relevant model-family
  environment variables.
- [x] Aider never sends a workspace larger than its configured context budget;
  selection is stable and excludes generated/runtime metadata.
- [x] All affected adapter tests and the full local test/type/lint/shell gates
  pass.
- [x] The targeted real rerun records a concrete provider result or a clear
  provider-side failure, with no silent fallback and no publication approval.

## Result

The local transport capture proved that Claude now emits the exact provider
model ID through the Anthropic Messages request. The real OpenRouter rerun
returned a 404 `unrecognized_model` for that model on the Anthropic protocol,
so Claude is protocol-ineligible for this pinned model unless the provider
exposes an Anthropic-compatible route. Aider passed context admission after
the 3 MB source/config filter but timed out on the DeepSWE task; it no longer
fails because of an oversized prompt. Neither result is calibration evidence.
