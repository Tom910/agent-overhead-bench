# S3 — Is the model migration actually needed? (2026-09-03)

**Question put by the maintainer:** the prior session recommended migrating the
pinned model from `z-ai/glm-5.3-flash` to `openai/gpt-5.6-sol`. Is that
migration really needed, or is something else the constraint? The maintainer's
standing preference is cheap models (Flash-class, or an alternative such as a
DeepSeek Flash tier).

**Answer:** the migration is *not* the right fix, but not because Flash is
adequate for the current tasks. The evidence below shows the defect is a
**regime/source mismatch**: this project declares a 1–5 minute short regime,
and the selected source dataset contains no 1–5 minute tasks for any model.
Migrating the model buys just enough capability to squeeze one bottom-quartile
task in at 5.5 minutes — still outside the declared regime — at a price the
stated budget cannot absorb.

This document records no-spend evidence only. It changes no review flag,
approves no model, and authorizes no paid cell.

## Evidence 1 — the source dataset declares a 3-hour agent budget, uniformly

Every task in the pinned DeepSWE checkout (revision
`0b9fabbb63b9104d678fe965e1632f2dd9eaa2ea`, 113 tasks) declares the same
budgets in `task.toml`:

| Field | Value | Count |
|---|---|---|
| `[agent] timeout_sec` | `10800.0` (3 h) | 113/113 |
| `[verifier] timeout_sec` | `1800.0` (30 min) | 113/113 |
| `[verifier.collect] timeout_sec` | `300.0` | 113/113 |

There is **no per-task duration signal** in the source, and the one signal it
does carry says three hours. `plans/s3-deepswe-release-duration-map.json`
asserts `[1,5]` minutes for all eight selected tasks. That range is a
maintainer assertion with no upstream basis, and
`scripts/validate-duration-map.mjs` only checks that the asserted range is
in-regime — it never validates the assertion against evidence.

## Evidence 2 — the calibration probe task is one of the *easiest* in the set

Ranking all 113 tasks by solution-patch size (a difficulty proxy computed
no-spend from `solution/solution.patch`):

`n=113  min=12,710 B  p25=21,412 B  median=26,013 B  p75=32,970 B  max=53,707 B`

The eight selected release tasks rank (1 = smallest patch):

| Task | Patch bytes | Files | Rank / 113 |
|---|---|---|---|
| `ink-grid-box-layout` | 15,462 | 3 | 6 |
| `true-myth-iterable-collection-combinators` | 15,562 | 4 | 7 |
| `psd-tools-blend-range-api` | 18,829 | 4 | **15** |
| `tomlkit-toml-table-converters` | 21,412 | 4 | 28 |
| `superjson-error-stack-serialization` | 22,376 | 9 | 33 |
| `cattrs-partial-structuring-recovery` | 24,810 | 3 | 45 |
| `happy-dom-deterministic-intersectionobserver` | 25,378 | 8 | 49 |
| `textual-richlog-follow-state` | 31,716 | 3 | 76 |

`psd-tools-blend-range-api` — the task both GPT-5.6 Sol controls passed — sits
at the **13th percentile**. It is near the easy floor of the dataset, and the
strong model still needed ~329 s (Codex) and ~357 s (Hermes) and ~2.4 M input
tokens to solve it. The dataset's easiest task anywhere is a 12,710-byte patch
across 3 files. **DeepSWE has no 1–5 minute task to select.**

Half the selected suite sits above this task's difficulty. A model chosen to
just barely clear the 13th-percentile task will not clear the median one.

## Evidence 3 — the migration is budget-infeasible

Frozen price book `openrouter-2026-08-27` rates for `z-ai/glm-5.3-flash`:
input `$0.075/M`, cached input `$0.015/M`, output `$0.25/M`.

Applying those rates to the *observed* successful trajectory shape from the
GPT-5.6 Sol Codex control (2,398,346 input of which 2,312,288 cached; 21,210
output):

| | Flash rates on that shape | GPT-5.6 Sol actual |
|---|---|---|
| Uncached input | `$0.00645435` | — |
| Cached input | `$0.03468432` | — |
| Output | `$0.00530250` | — |
| **Per cell** | **`$0.04644117`** | **`$0.84667360`** |
| **× 160-cell official matrix** | **`≈ $7.43`** | **`≈ $135.47`** |

The migration is roughly **18× the per-cell cost**, and the official matrix
alone would cost about **13.5× the entire stated $10 budget** — before
retries, anomaly reruns, or the monthly re-runs the README promises. The two
GPT diagnostic controls already consumed `$1.724`, about 17% of the budget, for
two cells of one task.

## Evidence 4 — a capability ladder is the wrong instrument for this benchmark

`METHODOLOGY.md` states the measurement is
`end_to_end = startup + model_time + harness_time + tool_time` and explicitly
"not a capabilities leaderboard." Overhead decomposition requires cells that
*complete*, so per-CLI overhead is comparable. A task regime where the cheap
model times out and the expensive model barely finishes produces mostly
timeout cells, which carry no comparable overhead signal at all. Selecting the
model to clear a capability gate inverts the instrument: it makes model
capability, not harness overhead, the binding constraint on every cell.

## Conclusion

Three things are true at once, and the prior recommendation conflated them:

1. Flash is genuinely not solving *these* tasks (34/45 at 900 s on the
   13th-percentile task). That part of the prior finding stands.
2. GPT-5.6 Sol is not the fix. It clears one bottom-quartile task at 5.5 min —
   outside the declared 1–5 minute regime — and cannot clear the budget.
3. The actual defect is upstream of the model: **DeepSWE is a 3-hour-budget
   dataset being run as a 5-minute benchmark.** No model choice repairs that.

## Options (no paid work authorized by this document)

| Option | Keeps cheap model | Keeps 1–5 min claim | Cost at 160 cells | Assessment |
|---|---|---|---|---|
| **A. Replace/augment the task source** with genuinely short tasks | yes | yes | `≈ $7` | Recommended. Restores the instrument: high completion rate makes overhead comparable across CLIs. |
| **B. Re-declare the release regime as long** (6–15 min, 900 s) and keep DeepSWE | partly | **no** | `≈ $20–30` | Contradicts README/METHODOLOGY headline claim; Flash still only reached 34/45 at 900 s. |
| **C. Migrate to GPT-5.6 Sol** | **no** | **no** | `≈ $135` | Rejected: 13.5× budget, still out of regime, still fails the median task. |
| **D. Keep DeepSWE as a separate long-regime secondary suite** | yes | yes (primary) | additive | Viable later; does not unblock v1. |

Option A is the only one that satisfies both the declared regime and the stated
budget. Note that `plans/S3-polybench-replacement-plan.md` already contains a
reusable source-replacement contract (pinned revision, checksums, hidden test
patch, native verifier boundary) from the earlier SWE-PolyBench evaluation; the
mechanism exists even though that specific candidate was rejected on
composition grounds.

## Next no-spend step

Before any further paid cell, screen candidate sources for tasks whose
*declared* agent budget and solution size are consistent with a 1–5 minute
regime, and require the duration map to be backed by evidence rather than
asserted. A cheap model can only be validated on tasks a cheap model can
finish.

## Reproduction

```
# uniform 3-hour agent budget across the pinned checkout
grep -h 'timeout_sec' scratch/deep-swe/tasks/*/task.toml | sort | uniq -c

# difficulty proxy: solution patch bytes / files per task
for d in scratch/deep-swe/tasks/*/; do t=$(basename "$d"); \
  printf '%s\t%s\t%s\n' \
    "$(wc -c < "$d/solution/solution.patch")" \
    "$(grep -c '^diff --git' "$d/solution/solution.patch")" "$t"; \
done | sort -n
```

## Decision (2026-09-03)

The maintainer chose to **lift the 1–5 minute cap and keep the cheap pinned
model** (`z-ai/glm-5.3-flash`), and authorized provider spend. Option C
(migrating to `openai/gpt-5.6-sol`) is rejected and closed.

Implemented as a third bounded regime rather than an unbounded timeout:

| Regime | Expected minutes | Timeout (s) |
|---|---|---|
| `short` | 1–5 | ≤ 300 |
| `long` | 6–15 | 301–900 |
| `extended` | 16–180 | 901–10800 |

The extended ceiling is the source's own declared `[agent] timeout_sec`, so
spend caps and fail-closed accounting still apply.

### Verified budget

The provider account holds `$10.00` total credits with `$5.842127042` already
consumed, leaving **`$4.16`**. The `$200` figure on the key is a monthly rate
limit, not available funds. At observed Flash cell costs this covers the
blocking two-CLI calibration comfortably, but **not** a 160-cell official
matrix in the extended regime (estimated `$15–25`). The official run must
therefore be scoped — fewer repetitions and/or fewer tasks — and the published
table must state the reduced matrix shape honestly rather than implying the
full design.

### First extended calibration

Target `ink-grid-box-layout` (rank 6/113 by solution-patch size, the easiest of
the selected eight), Flash, Codex + Hermes, one repetition, extended regime at
`3600` seconds, `$1.50` hard cap, `$0.40` per-cell estimate. Preparation
exposed one real defect: the reference-polarity timeout defaulted to the agent
timeout, so any extended agent budget above the source's 1800-second verifier
bound failed the guard before preparation. That default is now clamped.
