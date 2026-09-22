# S2 GPT-6 Luna subscription feasibility

Later September 22 update: the [bounded live qualification](s2-evidence/codex-bridge/live-qualification/README.md)
completed all five native loops using subscription credentials, with complete C1
accounting for four and preserved unknown Codex metadata. The feasibility review
below records the earlier offline-only finding; it is superseded on live access.

Reviewed September 22, 2026. The maintainer selected **only `gpt-6-luna`**,
using Codex account allowance across Cline, Codex, Hermes, Pi and Qwen. Each
harness must retain its own agent loop and tool execution.

## Finding and correction

A reusable open-source raw-model bridge exists: qualify
[CLIProxyAPI at `2430354330af80b645f9ffb1a51e1e7c72c4cc8e`](https://github.com/router-for-me/CLIProxyAPI/tree/2430354330af80b645f9ffb1a51e1e7c72c4cc8e).
Its Codex OAuth executor serves both Responses and Chat Completions, translates
streamed function calls and usage, and its catalog contains exact `gpt-6-luna`.
It calls the raw model backend, not the Codex coding agent. This supplies a
concrete technical route for all five native harnesses.

The earlier official-documentation-only review was insufficient: lack of a
publicly documented subscription API does not establish technical infeasibility.
This finding supersedes that conclusion. Open-source implementation support,
OpenAI's documented product support, account entitlement and tested benchmark
compatibility remain separate evidence. All five pinned clients subsequently passed a basic Linux tool-call smoke
through a local fake API-key backend. No live OAuth/account access is claimed.

Sources: [routes](https://github.com/router-for-me/CLIProxyAPI/blob/2430354330af80b645f9ffb1a51e1e7c72c4cc8e/internal/api/server_routes.go),
[executor](https://github.com/router-for-me/CLIProxyAPI/blob/2430354330af80b645f9ffb1a51e1e7c72c4cc8e/internal/runtime/executor/codex_executor_execute.go),
[model catalog](https://github.com/router-for-me/CLIProxyAPI/blob/2430354330af80b645f9ffb1a51e1e7c72c4cc8e/internal/registry/models/codex_client_models.json),
[Codex authentication](https://learn.chatgpt.com/docs/auth).

## Proposed route

| Harness | Existing adapter protocol | Shared transport |
|---|---|---|
| Codex 0.149.1 | Responses | Existing C1 proxy → CLIProxyAPI → Codex model backend |
| Cline 3.0.61 | Chat Completions | Same, with bridge Chat-to-Responses translation |
| Hermes 0.20.5 | Chat Completions | Same |
| Pi 0.73.1 | Chat Completions | Same |
| Qwen 0.22.2 | Chat Completions | Same |

Keep OAuth credentials in the host-held bridge, outside task containers. The
bridge uses a flat credential record, so pointing its auth directory at Codex's
nested `auth.json` is insufficient. A reviewed importer or the bridge's own
login must establish a single refresh owner. Do not run concurrent refreshers
against copies of the same refresh token. No real credential has been copied.

Reuse the existing C1–C4 measurement model. Bridge translation/network time is
part of this route's observed model-request interval; do not subtract an invented
constant. Record bridge identity and effective forwarded settings separately.

## Required qualification

- Pin source/build identity. Bind loopback, one account, local API key, no raw
  body logging or management panel, no model/account fallback or hidden inference
  retries. Exact Luna must fail closed when unavailable.
- Test streamed tool calls/results, multiple calls, cancellation, errors and
  input/output/cache/reasoning usage using an isolated fake backend first.
- Record dropped sampling/token-limit settings and forced parallel-tool behavior.
  Codex currently requests high effort; absent Chat effort becomes medium in the
  bridge. Normalize deliberately or disclose this difference.
- Resolve or disclose reasoning continuity: Chat conversion does not currently
  preserve encrypted reasoning items across tool turns as Responses can. A
  successful tool call alone does not prove equivalent model conditions.
- Validate actual pinned native clients, then account-specific Luna availability.
  Only a bounded live smoke can establish end-to-end operation and allowance use.
  No paid API fallback or full benchmark rerun is implied by this investigation.

Sources: [request conversion](https://github.com/router-for-me/CLIProxyAPI/blob/2430354330af80b645f9ffb1a51e1e7c72c4cc8e/internal/translator/codex/openai/chat-completions/codex_openai_request.go),
[response conversion](https://github.com/router-for-me/CLIProxyAPI/blob/2430354330af80b645f9ffb1a51e1e7c72c4cc8e/internal/translator/codex/openai/chat-completions/codex_openai_response.go).

## Accounting and readiness

Raw tokens remain the baseline. Subscription allowance and credits are not a
per-token USD invoice; actual allocation stays unknown unless established.
Reference API prices may be labeled counterfactual estimates, never fabricated
subscription spend. Preserve separate DeepSeek/Luna campaign conditions.

Linux has no host Codex auth cache at the standard path last inspected. Local
account inspection previously encountered an unrelated global configuration
error; that configuration was left unchanged. Stale local model caches do not
prove entitlement or denial. No inference, credential copying or quota
consumption has occurred during this review.

Status: **private setup implemented; all-five native tool loops passed offline.
Live OAuth/account access, C1 route accounting and matched reasoning remain
unqualified.** See [native evidence](s2-evidence/codex-bridge/native-smoke/review.md).
