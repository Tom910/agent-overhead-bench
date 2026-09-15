# S2 evidence: gemini

```
date: 2026-08-26
host: macos-docker-desktop
cli_version: 0.29.5
exact_argv: gemini -p "<prompt>" -y -m gemini-2.5-flash -o json
stdin: closed
env_for_proxy: first try OPENROUTER_API_KEY + OPENAI_BASE_URL + GOOGLE_GEMINI_BASE_URL ; second try isolated HOME + GEMINI_API_KEY + GOOGLE_GEMINI_BASE_URL=http://127.0.0.1:$PORT
auth_headless: failed
ori: not_tried
ori_writes: failed
proxy_chain: failed
protocol: gemini_generate_content
fixture: failed
exits_on_complete: yes
exit_codes: 1, 1
tool_visibility: failed
tool_log_source: failed
subagent_inherits_proxy: n/a
chatter_on_proxy: n/a (first try) ; second try POST /v1beta/models/gemini-2.5-flash:streamGenerateContent
decision: drop
default_exclusion: drop
drop_reason: Native Gemini generateContent protocol is not an OpenRouter Anthropic/OpenAI surface; first try used cached Google OAuth and never chained
```

## Commands actually run

1. `gemini --version` → `0.29.5`
2. First try with OpenRouter/OpenAI env still loaded cached Google credentials → `IneligibleTierError` (Gemini Code Assist individuals unsupported; migrate to Antigravity). Proxy captures = 0. Exit 1 in 4.8s.
3. Second try: isolated `HOME` + `settings.json` `selectedType=gemini-api-key` + `GOOGLE_GEMINI_BASE_URL` at dump proxy. One capture: `POST /v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse` → OpenRouter 404 HTML. Exit 1 in 2.1s. Stopped (two failures).

## Notes

Cannot pin Gemini CLI through OpenRouter without a Gemini-protocol translator. Default-condition Google auth is a separate later path, not v1 pinned. Dump proxy originally logged `x-goog-api-key`; sanitizer now redacts it. Scratch logs were rewritten; file is gitignored.
