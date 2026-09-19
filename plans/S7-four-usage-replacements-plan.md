# S7 — Four user-authorized usage replacements

On 19 September the maintainer explicitly requests rerunning the four Linux
attempts with incomplete accounting/usage, superseding the no-rerun instruction
only for these slots. Preserve all originals and their spend; no other retries.

- Codex / superjson-error-stack-serialization / rep 1: incomplete accounting.
- Hermes / textual-richlog-follow-state / rep 4: incomplete accounting.
- Hermes / tomlkit-toml-table-converters / rep 4: incomplete usage.
- Pi / textual-richlog-follow-state / rep 0: incomplete accounting.

Use the existing physical Linux host, pinned model/provider, restored task images,
CLI versions, task definitions and extended regime. A new isolated append-only
queue runs these four once, sequentially, with fixed-price admission, account
high-water guard and no automatic retries. Bound new account spend to a $2 allowance
plus the guard's $0.10 reserve, also constrained by the existing $92 lifetime
ceiling, actual credit and key limits; per-cell allowance $1 plus reserve.

Before launching: verify selected old C4/C1 hashes; no-spend preflight; confirm
exactly these four unique slots and no Claude CLI. Retain originals independently.
A replacement may enter the selected 200 only if its evidence validates and usage
and accounting are complete, irrespective of verification pass/fail. Never choose
by favorable outcome. Otherwise retain the old slot and disclose missing data.

Record selected replacement mappings and excluded original costs as additional
execution spend, separate from the selected benchmark total. No derived run.json
fields, new dependencies or official release freeze.

## Guarded restart after instrumentation repair

Codex completed with complete accounting ($0.060797376 reference estimate).
Hermes textual startup was interrupted after the guard found missing requested
model metadata; served model remained correct. S1-full-request-model-metadata-plan.md
fixes the proven 64 KiB prefix capture limitation without relaxing guards. The
interrupted job remains terminal and retained; one fresh corrected Hermes job is
appended manually. Pending jobs resume, Codex is not repeated, and the original
$2 allowance/ceiling stays unchanged. `selection-jobs.json` names exactly four
replacement jobs; the extra interrupted startup is excluded but disclosed.

An offline local watcher waits for those selected jobs, exports validated raw
pairs, and uses a pinned isolated worktree to publish only if all four replacements
have complete accounting. All 196 other attempts must remain identical. Original
four costs and the interrupted startup are disclosed outside selected benchmark
costs. A failed check or non-fast-forward push stops publication; no model retries.
