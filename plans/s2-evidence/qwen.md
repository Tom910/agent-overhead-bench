# S2 evidence: qwen

```
date: 2026-08-26
host: macos-docker-desktop
cli_version: 0.22.2 (image aob-qwen:s2; not installed on the Mac)
exact_argv: HOME=<isolated> qwen -p "<prompt>" --yolo -m openai/gpt-4.1-mini -o json
stdin: closed
env_for_proxy: OPENAI_API_KEY=$OPENROUTER_API_KEY ; OPENAI_BASE_URL=http://127.0.0.1:$PORT/v1 ; HOME with .qwen/settings.json selectedType=openai
auth_headless: api_key
ori: not_tried
ori_writes: failed
proxy_chain: cli→proxy→openrouter
protocol: openai_chat
fixture: packages/contracts/fixtures/http/qwen-stream.json
exits_on_complete: yes
exit_codes: 1 (no auth type); 0 (isolated HOME openai auth)
tool_visibility: partial
tool_log_source: JSON stdout generation stats; HTTP chat completions
subagent_inherits_proxy: n/a
chatter_on_proxy: none extra paths (4× POST /v1/chat/completions)
decision: keep
default_exclusion: pinned_only
drop_reason: n/a
```

## Commands actually run

All inside Docker (`scripts/s2-docker-probe.sh qwen`). Host PATH still has no `qwen`.

1. `qwen -p … --yolo -m openai/gpt-4.1-mini` with OpenAI env. Exit 1 in 2s: `No auth type is selected`. Captures 0.
2. Isolated `HOME` + `.qwen/settings.json` `{"security":{"auth":{"selectedType":"openai"}}}` plus the same env. Exit 0 in 7s. 4× streamed `POST /v1/chat/completions` 200 for `openai/gpt-4.1-mini`.

## Notes

Fairness: `--yolo`; isolated HOME so host `~/.qwen` is never read. Do not npm-install on the Mac.

### Requested-model Docker retest

`AOB_S2_SKIP_BUILD=1 AOB_MODEL=z-ai/glm-5.3-flash scripts/s2-docker-probe.sh qwen`
exited 0 with 3 streamed `POST /v1/chat/completions` captures. The model in
the model-bearing output was `z-ai/glm-5.3-flash`, and the sanitized capture
contained no credential-shaped value.
