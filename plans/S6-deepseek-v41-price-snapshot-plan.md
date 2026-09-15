# S6 — DeepSeek fixed-tier price snapshot

Status: Implemented (2026-09-10).

Add immutable `deepseek-v41-low-2026-09-10.json` with the existing input,
cached-input and output rate fields. Retain the provider's complete UTC pricing
schedule as provenance. The selected tier costs $0.15/M input, $0.003/M cached
input and $0.60/M output tokens. Do not change the cost formula or raw C4 schema.

Execution must use the following S5 fixed-price interval guard: live provider
rates must match this snapshot for the entire cell timeout plus cleanup margin.
A cell cannot silently use this book during the provider's higher-price hours.
Report/Activity crosschecks still recompute the same existing estimate. No new
dependencies, extra metrics or historical price-book edits.
