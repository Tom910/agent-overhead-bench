# S2 evidence: grok

```
date: 2026-08-26
host: macos-docker-desktop
cli_version: grok 1.0.5 (5115b46bc909) [stable]
exact_argv: grok -p "<prompt>" --always-approve --output-format json --cwd <ws>
stdin: closed
env_for_proxy: first try --xai-api-base-url (rejected: flag is on `grok agent`, not `grok -p`) ; second try XAI_API_KEY / XAI_API_BASE_URL / OPENAI_BASE_URL pointing at dump proxy
auth_headless: vendor_login_file
ori: not_tried
ori_writes: failed
proxy_chain: failed
protocol: failed
fixture: failed
exits_on_complete: yes
exit_codes: 2 (bad flag) ; 0 (native xAI, proxy captures 0)
tool_visibility: failed
tool_log_source: failed
subagent_inherits_proxy: n/a
chatter_on_proxy: none (never hit the proxy)
decision: drop
default_exclusion: drop
drop_reason: Headless `-p` completed against native xAI; dump proxy saw zero requests. Cannot produce harness_time on OpenRouter pin.
```

## Commands actually run

1. `grok --version` → `grok 1.0.5 (5115b46bc909) [stable]`
2. `grok -p ... --xai-api-base-url http://127.0.0.1:$PORT` → exit 2 immediately: unexpected argument (flag belongs to `grok agent`).
3. `grok -p ...` with `XAI_API_BASE_URL` / `OPENAI_BASE_URL` at the proxy → exit 0 in 15.4s, JSON result, `hello.ts` edited, `total_cost_usd` ~0.015, model usage named a grok-4.6 build id. Proxy captures = 0.

## Notes

`--always-approve` is a fairness deviation. Chaining via `grok agent --xai-api-base-url` was not a third attempt (plan: stop after two failures). Re-open only with a captured `cli→proxy→openrouter` hop.
