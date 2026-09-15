# S2 evidence: aider

```
date: 2026-08-26
host: macos-docker-desktop
cli_version: aider 0.86.2 (image aob-aider:s2; not installed on the Mac)
exact_argv: aider --yes-always --no-git --openai-api-base http://127.0.0.1:$PORT/v1 --model openai/gpt-4.1-mini hello.ts --message "<prompt>"
stdin: closed
env_for_proxy: OPENAI_API_KEY=$OPENROUTER_API_KEY ; OPENAI_API_BASE=http://127.0.0.1:$PORT/v1 ; do not set OPENROUTER_API_KEY (LiteLLM then bypasses the proxy)
auth_headless: api_key
ori: not_tried
ori_writes: failed
proxy_chain: cli→proxy→openrouter
protocol: openai_chat
fixture: packages/contracts/fixtures/http/aider-stream.json
exits_on_complete: yes
exit_codes: 0
tool_visibility: none
tool_log_source: aider prints SEARCH/REPLACE in stdout; no separate tool timeline
subagent_inherits_proxy: n/a
chatter_on_proxy: none (single POST /v1/chat/completions)
decision: keep
default_exclusion: pinned_only
drop_reason: n/a
```

## Commands actually run

All inside Docker (`scripts/s2-docker-probe.sh aider`). Host PATH still has no `aider`.

1. First try `--model openrouter/openai/gpt-4.1-mini` with `OPENAI_API_BASE` at the dump proxy. Exit 0 in 7s, **0 captures**. Aider billed OpenRouter directly (~$0.001). LiteLLM `openrouter/` prefix bypasses the local base URL.
2. Second try: unset `OPENROUTER_API_KEY`, `--openai-api-base http://127.0.0.1:$PORT/v1 --model openai/gpt-4.1-mini hello.ts --message …`. Exit 0 in 5s. 1× streamed `POST /v1/chat/completions` 200. Applied edit to `hello.ts`.

## Notes

Fairness deviations: `--yes-always --no-git`; must pass the file path or aider asks which file. Official cells must use the OpenAI-compatible model id plus `--openai-api-base`, not `openrouter/…`. Image only; do not pip-install on the Mac.

### Requested-model Docker retest

`AOB_S2_SKIP_BUILD=1 AOB_MODEL=z-ai/glm-5.3-flash scripts/s2-docker-probe.sh aider`
initially exited 0 without a request because LiteLLM requires an explicit
provider prefix for this model ID. The probe and adapter now pass
`openai/z-ai/glm-5.3-flash` while the OpenAI-compatible request body retains
the requested model ID. The corrected retest exited 0 with 1 streamed
`POST /v1/chat/completions` capture; the sanitized capture contained no
credential-shaped value.
