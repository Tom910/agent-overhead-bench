# S2 evidence: opencode

```
date: 2026-08-26
host: macos-docker-desktop
cli_version: opencode 1.18.23 (image aob-opencode:s2; not installed on the Mac)
exact_argv: opencode run --model openai/gpt-4.1-mini "<prompt>"
stdin: closed
env_for_proxy: OPENAI_API_KEY=$OPENROUTER_API_KEY ; OPENAI_BASE_URL=http://127.0.0.1:$PORT/v1 ; OPENROUTER_API_KEY set
auth_headless: api_key
ori: not_tried
ori_writes: failed
proxy_chain: cli→proxy→openrouter
protocol: openai_responses
fixture: packages/contracts/fixtures/http/opencode-stream.json
exits_on_complete: yes
exit_codes: 0
tool_visibility: partial
tool_log_source: stderr/stdout tool traces (Glob/Read/Write)
subagent_inherits_proxy: n/a
chatter_on_proxy: first Responses call used model gpt-5.4-nano (not the requested id), then gpt-4.1-mini
decision: keep
default_exclusion: pinned_only
drop_reason: n/a
```

## Commands actually run

All inside Docker (`scripts/s2-docker-probe.sh opencode`). Host PATH still has no `opencode`.

`opencode run --model openai/gpt-4.1-mini "<prompt>"` with OpenAI env pointing at the in-container dump proxy. Exit 0 in 14s. 6× streamed `POST /v1/responses` 200. Wrote `returnTwo()` in `hello.ts`.

### Requested-model Docker retest

`AOB_S2_SKIP_BUILD=1 AOB_MODEL=z-ai/glm-5.3-flash scripts/s2-docker-probe.sh opencode`
initially exited 1 before a request because OpenCode could not resolve the
unregistered model. The adapter and probe now create an isolated OpenCode
config declaring the OpenAI-provider model and pass
`openai/z-ai/glm-5.3-flash`. The corrected retest exited 0 with 5 streamed
`POST /v1/responses` captures; model-bearing requests used the requested model
and the sanitized capture contained no credential-shaped value.

## Notes

`opencode --help` exists; non-interactive form that worked is `opencode run`. First captured model was `gpt-5.4-nano` then `gpt-4.1-mini` — record in METHODOLOGY if this tool ships pinned. Do not npm-install on the Mac.
