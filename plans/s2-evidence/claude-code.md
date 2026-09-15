# S2 evidence: claude-code

```
date: 2026-08-26
host: macos-docker-desktop
cli_version: 2.1.246 (Claude Code)
exact_argv: claude -p "<prompt>" --output-format json --permission-mode bypassPermissions --model <pinned-model>
stdin: closed
env_for_proxy: ANTHROPIC_BASE_URL=http://127.0.0.1:$PORT ; ANTHROPIC_AUTH_TOKEN=$OPENROUTER_API_KEY ; ANTHROPIC_API_KEY="" ; ANTHROPIC_DEFAULT_SONNET_MODEL=anthropic/claude-haiku-4.5 ; ANTHROPIC_DEFAULT_HAIKU_MODEL=anthropic/claude-haiku-4.5 ; ANTHROPIC_DEFAULT_OPUS_MODEL=anthropic/claude-haiku-4.5 ; CLAUDE_CODE_SUBAGENT_MODEL=anthropic/claude-haiku-4.5 ; CI=1
auth_headless: api_key
ori: not_tried
ori_writes: failed
proxy_chain: cli→proxy→openrouter
protocol: anthropic_messages
fixture: packages/contracts/fixtures/http/claude-code-stream.json
exits_on_complete: yes
exit_codes: 0 (with bypassPermissions); 1 (model-not-found on anthropic/claude-3.5-haiku)
tool_visibility: partial
tool_log_source: Anthropic tool_use blocks in POST /v1/messages SSE; local file edit observed
subagent_inherits_proxy: n/a
chatter_on_proxy: HEAD /api/hello → 404
decision: keep
default_exclusion: pinned_only
drop_reason: n/a
```

## Commands actually run

1. `claude --version` → `2.1.246 (Claude Code)`
2. First OpenRouter chain with `--model anthropic/claude-3.5-haiku` and `--permission-mode dontAsk` → exit 1 in 1.2s. Proxy captured `POST /v1/messages` 404 `No endpoints found for anthropic/claude-3.5-haiku` plus `HEAD /api/hello` 404. Chaining itself worked.
3. Retry `--model anthropic/claude-haiku-4.5 --permission-mode dontAsk` → exit 0 in 15s, 5 model SSE calls, cost about $0.38. Result asked for write permission; `hello.ts` unchanged.
4. Working argv: `--permission-mode bypassPermissions --model anthropic/claude-haiku-4.5` → exit 0 in 11.6s, 4× `POST /v1/messages` SSE 200, cost about $0.15. `hello.ts` gained `two()`. `subagent_stats.spawned` = 0.
5. `command -v ori` → failed. Ori-vs-native not run.

## Notes

Fairness deviation: `--permission-mode bypassPermissions` is the headless minimum (the interactive `dontAsk` mode exits without writing). OpenRouter slugs are supplied through `ANTHROPIC_DEFAULT_*_MODEL`. Claude Code logs an unrecognized-model diagnostic for OpenRouter ids but still sends them. Dump proxy must strip `content-encoding` after fetch decompression or Claude hits ZlibError. Non-streamed capture is untested (the CLI defaulted to `stream: true`). No effort or adapter-local budget limit is set.

### Requested-model Docker retest

1. `AOB_S2_SKIP_BUILD=1 AOB_MODEL=z-ai/glm-5.3-flash scripts/s2-docker-probe.sh claude-code` → the image/version gate passed, but the CLI exited 1 before a model request because Claude Code refuses bypass-permission mode under the image's root user (`--dangerously-skip-permissions cannot be used with root/sudo privileges for security reasons`).
2. The dump captured only one non-model `HEAD /api/hello` request and no model-bearing request. This is a recorded failure, not evidence that the requested model works on Claude Code; Codex/Hermes evidence remains separately recorded.

### Corrected requested-model Docker retest

The probe now runs Claude Code as the invoking host's non-root uid:gid and uses
an isolated writable HOME. This is required because Claude Code rejects
`bypassPermissions` under root; the image remains otherwise unchanged. The
corrected `AOB_S2_SKIP_BUILD=1 AOB_MODEL=z-ai/glm-5.3-flash
scripts/s2-docker-probe.sh claude-code` retest exited 0 with 5 streamed
`POST /v1/messages` captures, and the sanitized capture contained no
credential-shaped value.

The sanitized capture contains 5 records, including 4 model-bearing request
bodies. Every model-bearing request named exactly `z-ai/glm-5.3-flash`; no
credential-shaped value was present.
