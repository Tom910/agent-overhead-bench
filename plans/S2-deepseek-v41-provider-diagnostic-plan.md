# S2 — DeepSeek V4.1 Flash provider diagnostic

Status: Diagnostic completed, explicitly requested by the maintainer on 2026-09-10.

Scope: Test `deepseek/deepseek-v4.1-flash` using only the `deepseek` OpenRouter provider, with fallback disabled. Preserve the stopped GLM campaign unchanged. This diagnostic does not satisfy public-task calibration or count as a final repetition.

Steps:
1. Archive the exact endpoint catalog, including scheduled pricing.
2. Run five sequential streaming protocol probes (three Messages, one Chat Completions, one Responses) through the existing measurement proxy. Require correct requested/served identity, complete usage and successful status. Retain generation IDs and check provider-side generation records.
3. Run the six existing Docker harness adapters sequentially on one original local file-editing fixture. Require adapter success, native verifier success, correct model identity, complete accounting and retained raw C1/C4. Stop on a measurement defect and investigate before further paid work.
4. Use the existing shared $22.40 authorization and lifetime stop $29.903752101; do not reset authorization. Use a 180-second harness timeout and monitor provider account usage during execution. The short diagnostic budget is $0.50 total, within that shared authorization.
5. Record outcomes and limitations. A full campaign with this model requires a new, bound model/pricing definition and calibration; do not mix model conditions. If the diagnostic reproduces evidence failures, address them in a subsequent stage plan with offline regression coverage.

No new dependencies, changes to the measurement model, derived metrics in run.json, external messages, or model calls in CI. Diagnostic scripts and raw artifacts live under scratch/deepseek-v41-provider-check-20260910.

Pricing: the endpoint catalog includes time-dependent rates. The diagnostic snapshots and checks the selected current rates before each harness; do not extrapolate those rates to a campaign spanning price windows.

## Results — 2026-09-10

Five direct streaming probes passed (Messages ×3, Chat Completions, Responses).
All six real CLI file-editing smokes passed after the S1/S5 fixes:

| CLI | Model attempts | Known rejected attempts | C4 estimate (USD) |
|---|---:|---:|---:|
| Claude Code | 6 | 1 | 0.015861192 |
| Cline | 6 | 0 | 0.002034780 |
| Codex | 4 | 0 | 0.001778862 |
| Hermes | 6 | 0 | 0.003138702 |
| Pi | 4 | 0 | 0.000606408 |
| Qwen | 4 | 0 | 0.004070118 |

Every adapter and native verifier exited zero. The 29 successful generation
records confirm provider `DeepSeek` and canonical model
`deepseek/deepseek-v4.1-flash-20260910`. Final-smoke C4 estimates, provider costs
and settled account delta all equal **$0.027490062**. The known unsupported
JSON-schema title rejection has no generation record (HTTP 404) and no account
residual. Total diagnostic account delta, including original probes and earlier
attempts, is **$0.065459994**, below the $0.50 diagnostic ceiling.

Private evidence: `scratch/deepseek-v41-provider-check-20260910/`;
final six-tool records are in `accounting-fix-empty-tools/harnesses/`, summary
and provider crosscheck beside that directory. Earlier failure/preflight
artifacts remain intact. No paid subprocess or task container remains running.

The observed blocker was Claude Code's background JSON-schema title request,
which DeepSeek rejects before inference. It sends an explicit empty `tools`
array, confirmed with an offline native CLI request-structure diagnostic.
S1 retains redacted provider evidence and identifies only this known rejection;
S5 prices successful usage without inventing token counts for failed requests;
S7 consumes the same classification at native-outcome and campaign gates.

This establishes smoke-level protocol/accounting compatibility. It is not a
completed public-task calibration or final benchmark campaign. Scheduled pricing
must be bound to any new campaign definition; the stopped GLM evidence has not
been relabeled or combined with DeepSeek.
