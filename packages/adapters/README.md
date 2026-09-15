# Agent adapters

These adapters are thin invocation recipes for the S2 keep set. They do not
interpret agent output or compute benchmark metrics. The runner owns timing,
timeouts, verification, and result contracts.

## Fairness and execution record

| Adapter | Invocation | Environment route | Visibility | Execution |
|---|---|---|---|---|
| `claude-code` | `claude -p --output-format json --permission-mode bypassPermissions -- <prompt>` | Anthropic-compatible proxy base URL; Docker receives a sentinel credential and the host proxy owns the real key | `partial` | Docker image `aob-claude-code:s2` (host PATH only for diagnostics) |
| `codex` | host: `codex exec --json --disable apps --disable browser_use --disable browser_use_external --disable computer_use --disable image_generation --disable tool_search --skip-git-repo-check --ephemeral --sandbox workspace-write -C <workspace> [-m <model>] -- <prompt>`; Docker: same with `--dangerously-bypass-approvals-and-sandbox` | OpenAI Responses proxy base URL; Docker receives a sentinel credential and the host proxy owns the real key | `partial` | Docker image `aob-codex:s2` (host PATH only for diagnostics) |
| `hermes` | `hermes -z <prompt> --provider openrouter [-m <model>] --yolo --in <workspace>` | OpenAI Chat proxy base URL; Docker receives a sentinel credential and the host proxy owns the real key | `partial` | Docker image `aob-hermes:s2` (host PATH only for diagnostics) |
| `aider` | `aider --yes-always --no-git --openai-api-base <proxy>/v1 [--model <model>] <files> --message <prompt>` | OpenAI Chat proxy base URL; Docker receives a sentinel credential and the host proxy owns the real key | `none` | Docker image `aob-aider:s2` |
| `opencode` | `opencode run --format json [--model <model>] -- <prompt>` | OpenAI Responses proxy base URL; Docker receives a sentinel credential and the host proxy owns the real key | `partial` | Docker image `aob-opencode:s2` |
| `qwen` | `qwen --prompt=<prompt> --yolo [-m <model>] -o json` | OpenAI Chat proxy base URL; Docker receives a sentinel credential and the host proxy owns the real key; isolated Qwen config | `partial` | Docker image `aob-qwen:s2` |

For OpenAI-compatible CLIs, a non-`openai/` model id is passed to the CLI as
`openai/<model-id>` so LiteLLM/OpenCode select the OpenAI-compatible transport;
the upstream request still names the requested model id. Claude Code's Docker
recipe runs as a non-root uid:gid because its bypass-permission mode rejects
root. The Docker Codex descriptor uses the outer S5 container as its sandbox;
the host diagnostic path retains Codex's nested `workspace-write` sandbox.
Pinned model flags are present only for the `pinned` condition. The `default`
condition omits those flags and is not considered evidenced until S2 records a
native/default path. Official cells use the five fresh-container descriptors
declared by the S7 scope; the sixth retained candidate is excluded by its
protocol eligibility record;
the host implementations remain available only for local diagnostics, while
the three Docker-only adapters reject host execution. No adapter sets a low
quality/effort mode or an adapter-local spend ceiling; those would alter model
work and are outside the headless minimum. Codex's pinned
`model_reasoning_effort=high` is a documented request-shape compatibility
setting for the selected OpenRouter route, not a quality throttle.

The `partial` and `none` visibility labels are intentional: their harness-side
tool activity cannot support a full `tool_time`/`harness_time` decomposition.
Codex's JSONL tool records are timestamped and retained as a redacted
`tool-events.jsonl` artifact on both execution paths. A real smoke verified
pairing, but the records arrived in one stdout batch and had zero measurable
duration, so Codex remains `partial` and cannot contribute to harness-share
derivation; the other adapters remain gated as well.

The exact versions, protocol dialects, and deviations are recorded in
`plans/s2-evidence/`. The pinned model approval is recorded in
`plans/s2-decision-record.md`; source review and the official run remain open.
This document does not assert an official provider run.
