# S2 GPT-6 Luna subscription feasibility

Reviewed September 22, 2026. The maintainer selected **only `gpt-6-luna`**, across
all five native harnesses if supported, using Codex account allowance. Earlier
Sol/Astra proposals are superseded for this request.

## Finding

The exact model is documented for native Codex, subject to account access. No
documented raw-model interface using Codex subscription allowance was established
for all five native harnesses. Codex app-server executes the Codex agent;
wrapping it would change the system being measured. The official GitHub Action's
Responses proxy requires an API key. An undocumented bridge is not a qualified
benchmark backend.

Sources: [Codex models](https://learn.chatgpt.com/docs/models),
[authentication](https://learn.chatgpt.com/docs/auth),
[app-server](https://learn.chatgpt.com/docs/app-server),
[GitHub Action](https://learn.chatgpt.com/docs/github-action).

## Supported alternative and remaining work

The separately billed model API is a possible alternative, not an automatic
fallback. Luna supports Responses function calling; Chat Completions function
calling requires `reasoning_effort=none`. A future profile must qualify every
pinned adapter and explicitly declare any reasoning-setting contrast. Do not
quietly disable reasoning to make an adapter run.

Sources: [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna),
[API authentication](https://developers.openai.com/api/reference/overview#authentication).

Keep raw tokens as the baseline. Subscription credits, included allowance and
USD reference estimates are different quantities. The existing three-rate
formula does not describe every cache-write/context/service-tier API charge.
A future Luna price book needs a separate accounting review. Missing Luna data
must stay missing, without a DeepSeek or zero-cost substitution.

Sources: [Codex pricing](https://learn.chatgpt.com/docs/pricing),
[API pricing](https://developers.openai.com/api/docs/pricing).

## Local readiness observations

- Linux host `/home/tom` has no host Codex authentication/configuration cache at
  the standard paths inspected. Benchmark Docker Codex is a separate install.
- Local host CLI reports 0.149.0. Account inspection is blocked by an existing
  user configuration type error; global configuration was not changed.
- The local cached catalog did not contain the exact Luna slug. A stale cache
  does not prove that the account lacks access. Use an authenticated, compatible
  client's `model/list` before any future run.
- No inference, credential copying, quota consumption or new model profile was
  performed. No fallback to separately billed API usage is authorized here.

Status: feasibility review complete; all-five subscription execution remains
unqualified pending a supported raw-model interface. The reporting work can
support model-specific campaigns independently of this backend limitation.
