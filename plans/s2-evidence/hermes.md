# S2 evidence: hermes

```
date: 2026-08-26
host: macos-docker-desktop
cli_version: Hermes Agent v0.20.5 (2026.8.19)
exact_argv: hermes -z "<prompt>" --provider openrouter -m openai/gpt-4.1-mini --yolo --in <ws>
stdin: closed
env_for_proxy: OPENROUTER_API_KEY set ; OPENROUTER_BASE_URL=http://127.0.0.1:$PORT/v1 ; CI=1
auth_headless: api_key
ori: not_tried
ori_writes: failed
proxy_chain: cli→proxy→openrouter
protocol: openai_chat
fixture: packages/contracts/fixtures/http/hermes-stream.json
exits_on_complete: yes
exit_codes: 0
tool_visibility: partial
tool_log_source: OpenAI chat tools in POST /v1/chat/completions ; --usage-file JSON
subagent_inherits_proxy: n/a
chatter_on_proxy: GET /api/v1/models 404 ; GET /api/tags 404 ; GET /v1/props 404 ; GET /props 200 ; GET /version 200 ; GET /v1/models 200
decision: keep
default_exclusion: pinned_only
drop_reason: n/a
```

## Commands actually run

1. `hermes --version` → `Hermes Agent v0.20.5 (2026.8.19)`
2. `hermes -z "<prompt>" --provider openrouter -m openai/gpt-4.1-mini --yolo --in <ws>` with `OPENROUTER_BASE_URL` at the dump proxy. Exit 0 in 10.3s. Two streamed `POST /v1/chat/completions` 200. `--usage-file` reported ~$0.009, 2 api_calls, model `openai/gpt-4.1-mini`, provider `openrouter`. Agent asked which directory to write to; `hello.ts` unchanged.
3. `command -v ori` → failed.

### Requested-model retest

1. `AOB_S2_SKIP_BUILD=1 AOB_MODEL=z-ai/glm-5.3-flash scripts/s2-docker-probe.sh hermes` → exit 0; reused `aob-hermes:s2` only after S5 image validation.
2. Inside the image: `hermes -z "<prompt>" --provider openrouter -m z-ai/glm-5.3-flash --yolo --in /work` → exit 0. The sanitized dump captured 9 requests, including streamed `POST /v1/chat/completions` 200 requests; every model-bearing request named `z-ai/glm-5.3-flash`.
3. The captured output contained no credential-shaped value. This is a Hermes/Codex-requested-model smoke, not a full S2 keep-set approval.
4. Repeated through the hardened single-key env wrapper with the same exact model → exit 0; 9 proxy captures, including streamed `POST /v1/chat/completions` 200 requests, all model-bearing bodies named `z-ai/glm-5.3-flash`.

5. After rebuilding `aob-hermes:s2` with SHA-256-verified Python artifacts and
   `pip --require-hashes`, the same requested-model probe → exit 0; 9 captures,
   all model-bearing bodies named `z-ai/glm-5.3-flash`, with no credential-shaped
   value in the sanitized capture.

## Notes

`--yolo` is a fairness deviation (approvals bypassed). `--in` did not make it edit `hello.ts` on this prompt. Non-streamed capture untested (`stream: true` with `stream_options.include_usage`). Chatter GETs must not be counted as model intervals.

## 2026-08-27 runtime revalidation

The benchmark descriptor now supplies an isolated `~/.hermes/config.yaml`
with `terminal.oneshot_completion_wait_seconds: 0`, disabling Hermes' long
one-shot completion linger for benchmark cells. A zero-spend Docker run
against the local mock accepted the configuration and exited without the
previous 600-second linger; the mock's intentionally incomplete stream still
caused an adapter error. A real-model validation remains diagnostic only.
