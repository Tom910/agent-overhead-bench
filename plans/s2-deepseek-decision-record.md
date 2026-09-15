# S2 DeepSeek V4.1 Flash decision record

date: 2026-09-10
host: macos-docker-desktop
pinned_model: deepseek/deepseek-v4.1-flash
upstream: https://openrouter.ai/api
only_provider: deepseek
allow_fallbacks: false
ignored_providers: relace
pinning_path: key_base_url_uniform
price_book: deepseek-v41-low-2026-09-10
maintainer_signoff: user-directed model selection and readiness work, 2026-09-10

The maintainer selected this model/provider and instructed completion of final
run preparation. All six official CLIs passed actual Docker file-editing smoke
tests, native verification and provider-spend reconciliation. The machine-readable
summary is `plans/s2-evidence/deepseek-v41-smoke-summary.json`; detailed diagnostic
results are in `plans/S2-deepseek-v41-provider-diagnostic-plan.md`.

Approved scope: Claude Code, Cline, Codex, Hermes, Pi and Qwen, pinned condition
only. Native/default model identity and native/default pricing are not approved.
The existing adapter parameters, prepared task sources, verifier gates and
fairness boundaries remain in effect. Smoke approval establishes protocol
eligibility; full-task calibration and validation remain separate prerequisites.

The low-price tier is an explicit scheduling condition. Every cell must fit
wholly inside a confirmed matching price interval; the guard must defer starting
when its full timeout plus cleanup margin would cross a price change. Pricing
snapshots and interval evidence must be retained. Unknown/new pricing blocks
execution. Original GLM records and profiles remain unchanged.
