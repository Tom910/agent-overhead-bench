# S2 evidence: codex

```
date: 2026-08-26
host: macos-docker-desktop
cli_version: codex-cli 0.149.1
exact_argv: CODEX_HOME=<isolated> codex exec --disable apps --disable browser_use --disable browser_use_external --disable computer_use --disable image_generation --disable tool_search --skip-git-repo-check --ephemeral --sandbox workspace-write -C <ws> -m openai/gpt-4.1-mini "<prompt>"
stdin: closed
env_for_proxy: CODEX_HOME points at a throwaway config.toml with model_provider=openrouter, model=openai/gpt-4.1-mini, web_search=disabled, [model_providers.openrouter] base_url=http://127.0.0.1:$PORT/v1 env_key=OPENROUTER_API_KEY wire_api=responses ; OPENROUTER_API_KEY set ; CI=1
auth_headless: api_key
ori: not_tried
ori_writes: failed
proxy_chain: cli→proxy→openrouter
protocol: openai_responses
fixture: packages/contracts/fixtures/http/codex-stream.json
exits_on_complete: yes
exit_codes: 1 (first try used --ignore-user-config and hit api.openai.com 401); 0 (isolated CODEX_HOME without --ignore-user-config)
tool_visibility: partial
tool_log_source: stderr exec traces (shell commands); HTTP is Responses API tool calls
subagent_inherits_proxy: n/a
chatter_on_proxy: none (all 8 captures were POST /v1/responses)
decision: keep
default_exclusion: pinned_only
drop_reason: n/a
```

## Commands actually run

1. `codex --version` → `codex-cli 0.149.1`
2. First try: `--ignore-user-config` plus isolated `CODEX_HOME`. Provider stayed `openai`. WebSocket then HTTPS to `api.openai.com/v1/responses` → 401. Proxy captures = 0.
3. Second try: same isolated `CODEX_HOME` **without** `--ignore-user-config`. Exit 0 in 12.7s. 8× streamed `POST /v1/responses` 200 through the dump proxy. `hello.ts` gained `two()`. Reported `tokens used 11469`.
4. `command -v ori` → failed.

### Requested-model retest

1. `AOB_S2_SKIP_BUILD=1 AOB_MODEL=z-ai/glm-5.3-flash scripts/s2-docker-probe.sh codex` → exit 0; reused `aob-codex:s2` only after S5 image validation.
2. Inside the image: `codex exec --skip-git-repo-check --ephemeral --sandbox workspace-write -C /work -m z-ai/glm-5.3-flash "<prompt>"` → exit 0 in 32s. The sanitized dump captured 4 streamed `POST /v1/responses` 200 requests; every request body named `z-ai/glm-5.3-flash`.
3. The captured output contained no credential-shaped value. This is a Codex/Hermes-requested-model smoke, not a full S2 keep-set approval.
4. Repeated through the hardened single-key env wrapper with the same exact model → exit 0; 6 streamed `POST /v1/responses` 200 requests, all model-bearing bodies named `z-ai/glm-5.3-flash`.

## Notes

Do not use `--ignore-user-config` if the OpenRouter provider lives in `$CODEX_HOME/config.toml`. Official S4/S5 cells must inject that toml (or equivalent `-c` overrides) rather than editing the user's `~/.codex`. `--full-auto` from the plan guess is not a flag on 0.149.1; `workspace-write` + isolated home was enough. Non-streamed capture untested (`stream: true`).

The current benchmark recipe adds `model_reasoning_effort = "high"` because
Codex 0.149.1 otherwise sends no reasoning setting on this route and the GLM
endpoint rejects the request. It also disables `web_search` and optional Codex
server features that OpenRouter rejects. These are follow-up compatibility
settings for the current pinned route, not historical claims about the original
S2 capture.

## 2026-08-27 runtime revalidation

The Docker descriptor now exposes the pinned image's bundled bubblewrap
resource directory on `PATH`. Before this, Codex could reach OpenRouter but
failed when it tried to create its nested workspace-write sandbox. The
descriptor test asserts this path, and a capped Docker run with the exact
requested model showed the warning about user namespaces but no sandbox mount
error. The run made successful Responses requests with usage; it timed out
before producing a valid task result, so this is runtime-path evidence, not a
claim that Codex is publication-ready.

## 2026-08-27 hardened-container correction

The shared S5 Docker boundary drops all capabilities and enables
`no-new-privileges`; the Codex nested bubblewrap sandbox therefore cannot
create its user/mount namespace. The Docker-only descriptor now uses
`--dangerously-bypass-approvals-and-sandbox`, with the read-only,
capability-dropped, network-isolated S5 container as the outer sandbox. The
host diagnostic recipe remains `--sandbox workspace-write`. This deviation is
covered by the adapter and runner tests and does not relax the shared Docker
security profile.

## 2026-08-29 structured-output smoke

The adapter now requests `codex exec --json` and records a redacted
`tool-events.jsonl` artifact. A real Docker diagnostic on the prepared
`cattrs-partial-structuring-recovery` task used the pinned
`z-ai/glm-5.3-flash` model and a 900-second `$2` cap. It produced 100 valid
structured records containing 43 complete command/file/MCP item pairs and 47
proxy events (45 with usage). The task timed out and the hard cap rejected
finalization because not every provider attempt had usable usage; the known
usage-bearing portion was approximately `$0.0686`. Since timeout streams are
not emitted as complete C3 `toolEvents`, Codex remains `partial` and is not
eligible for harness-share ranking. This is diagnostic evidence, not an S7
result.

## 2026-08-29 completed visibility smoke

A fresh Docker cell ran the checked-in `py-small-bugfix-1` validation task
through the local proxy with `z-ai/glm-5.3-flash`. Codex exited 0, the task
verifier exited 0, and the redacted structured stream produced four complete
command/file tool pairs with no dangling starts. All pairs had zero measurable
duration because the start and completion records arrived in one stdout batch;
the result therefore remains `tool_visibility: partial` and produces no
harness-share ranking. The cell spent `$0.001436765`. This is visibility
diagnostic evidence only: the task is local-development and cannot be used as
official S7 data.

## 2026-08-29 extended-regime diagnostic

The explicit long-regime path ran one Codex cell on
`psd-tools-blend-range-api` with `z-ai/glm-5.3-flash`, timeout 900 seconds, and
a `$2` hard cap. The adapter produced 54 successful Responses requests and
the redacted structured stream contained 50 complete tool-item pairs, 22 with
positive measured duration. The source-owned verifier returned `verify_error`
because the submitted patch added files that the verifier patch also adds;
this is a task/verifier incompatibility, not a passing result. The preserved
C4 artifact records `$0.045040735` and `task_regime: long`. No retry was
started after the runner's cap guard rejected its estimate. This is diagnostic
evidence only; the task does not qualify for short-regime calibration, long
regime composition, or S7, and Codex remains `partial`.
