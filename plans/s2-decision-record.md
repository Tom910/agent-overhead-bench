# S2 decision record

date: 2026-08-27
host: macos-docker-desktop
pinned_model: z-ai/glm-5.3-flash
requested_pinned_model: z-ai/glm-5.3-flash
price_book: openrouter-2026-08-27
price_source: https://openrouter.ai/z-ai/glm-5.3-flash (checked 2026-08-27)
pinning_path: key_base_url_uniform
v1_tools:
  - claude-code   # host PATH (already present)
  - codex         # host PATH (already present)
  - hermes        # host PATH (already present)
  - aider         # Docker image aob-aider:s2 only
  - opencode      # Docker image aob-opencode:s2 only
  - qwen          # Docker image aob-qwen:s2 only
excluded:
  - gemini → native Gemini generateContent; OpenRouter 404; cannot pin
  - grok → headless `-p` completed on native xAI; proxy captures 0
  - goose → image drafted, not probed yet
  - pi → image drafted, not probed yet
  - prime-agent → no image yet
  - dsh → no image yet
default_exclusion:
  - claude-code → pinned_only (native/default credentials, model identity, and pricing were not evidenced)
  - codex → pinned_only (native/default credentials, model identity, and pricing were not evidenced)
  - hermes → pinned_only (native/default credentials, model identity, and pricing were not evidenced)
  - aider → pinned_only (native/default credentials, model identity, and pricing were not evidenced)
  - opencode → pinned_only (native/default credentials, model identity, and pricing were not evidenced)
  - qwen → pinned_only (native/default credentials, model identity, and pricing were not evidenced)
ori_vs_native: not run (`command -v ori` failed; do not brew-install ori on the Mac)
protocol_dialects_required_for_S1:
  - anthropic_messages (claude-code, streamed)
  - openai_responses (codex, opencode, streamed)
  - openai_chat (hermes, aider, qwen, streamed; also the in-repo mock)
contract_status: development_unfrozen (release freeze deferred)
contract_amendments:
  - C4 raw tool_visibility and prepared task-environment image provenance were
    included in the current working contract; they are not derived metrics.
future_contract_changes: allowed before final release; record the final release version and rationale when the contract is frozen
fairness_followup: removed Claude effort/budget throttles and Codex low-reasoning setting; retained only headless approval flags and the outer Docker sandbox
maintainer_signoff: user-directed approval recorded 2026-08-27

## Pinning path

`ori` is not installed. Mixed Ori/non-Ori is forbidden, so the only legal path from this spike is **key + base-URL override, uniform**. Revisit if Ori is installed and a headless `ori login` exists.

## Pinned model

Tried on 2026-08-26:

| Model id | Result |
|---|---|
| `openai/gpt-4.1-mini` | Smoke curl 200. Codex Responses 200. Hermes chat 200. **Not tried** on Claude Code. |
| `anthropic/claude-3.5-haiku` | OpenRouter: no endpoints (404). |
| `anthropic/claude-haiku-4.5` | Claude Code Anthropic skin 200. **Not tried** on Codex or Hermes. |
| `stealth/ox-alpha` | Live OpenRouter model lookup returned HTTP 404 on 2026-08-26; it was absent from the current public model catalog. A one-cell OpenCode Docker smoke reached the CLI but produced no proxy event and recorded `adapter_error` at zero spend. **Not available for pinning.** |
| `z-ai/glm-5.3-flash` | Catalog-listed (HTTP 200 on 2026-08-26). All six keep-tool Docker probes now have exit-0 requested-model evidence with streamed proxy captures and no credential-shaped values; Aider/OpenCode use an explicit OpenAI provider prefix and Claude Code uses a non-root runtime uid for bypass mode. Approved for this run by the maintainer instruction recorded above. |

The requested model has now been observed on every **keep** tool. The user’s
2026-08-27 instruction to change the model records the maintainer approval for
this run.

Default-condition support is not approved by omission. The current adapter
paths omit the pinned model flag but still route through OpenRouter; that is not
evidence of each CLI's native default model or native price book. A future S2
follow-up must record those identities and prices before the S7 default guard
can be removed.

## Feasibility matrix

| Tool | PATH | Headless | Auth no browser | Proxy chain | Protocol | Decision |
|---|---|---|---|---|---|---|
| aider | Docker 0.86.2 | yes | api_key | cli→proxy→openrouter | openai_chat SSE | keep |
| opencode | Docker 1.18.23 | yes | api_key | cli→proxy→openrouter | openai_responses SSE | keep |
| claude-code | yes 2.1.246 | yes | api_key | cli→proxy→openrouter | anthropic_messages SSE | keep |
| codex | yes 0.149.1 | yes | api_key | cli→proxy→openrouter | openai_responses SSE | keep |
| gemini | yes 0.29.5 | yes (exits) | failed / gemini-api-key | failed (404 generateContent) | gemini_generate_content | drop |
| goose | image drafted | untested | untested | untested | untested | pending |
| qwen | Docker 0.22.2 | yes | api_key | cli→proxy→openrouter | openai_chat SSE | keep |
| grok | yes 1.0.5 | yes | vendor_login_file | failed (0 captures) | failed | drop |
| hermes | yes v0.20.5 | yes | api_key | cli→proxy→openrouter | openai_chat SSE | keep |
| pi | no | failed | failed | failed | failed | drop |
| prime-agent | no | failed | failed | failed | failed | drop |
| dsh | no | failed | failed | failed | failed | drop |

Keep set is **6 tools** (target 5–7). Aider, OpenCode, and Qwen were installed **only in Docker**, never on the Mac PATH. Growing further (goose, pi) uses `scripts/s2-docker-probe.sh`, not host pip/npm.

## Fixtures

Sanitized streamed captures (no Authorization, no prompt bodies):

- `packages/contracts/fixtures/http/claude-code-stream.json`
- `packages/contracts/fixtures/http/codex-stream.json`
- `packages/contracts/fixtures/http/hermes-stream.json`
- `packages/contracts/fixtures/http/aider-stream.json`
- `packages/contracts/fixtures/http/opencode-stream.json`
- `packages/contracts/fixtures/http/qwen-stream.json`

Non-streamed variants: untested (all three keep tools defaulted to SSE).

## Spend note

Working cap remains $1,500. This spike used OpenRouter for smoke + Claude + Codex + Hermes. Claude haiku was the expensive cell (~$0.15–$0.38 per run because of Claude Code cache writes). Gemini/Grok OpenRouter spend was ~0 (Gemini 404 HTML; Grok billed native xAI). Exact OpenRouter invoice is the Activity Export, not this file.
