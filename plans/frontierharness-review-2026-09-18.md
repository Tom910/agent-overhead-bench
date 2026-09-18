# Frontier Harness review — 2026-09-18

Research deliverable, not a release authorization. Subsequent primary-metric
overview implementation is tracked in `S6-metric-overview-plan.md`. Local code reviewed at `f46bbc77bbc25ffa6e4b65ff54511538901c6567`.

## Recommendation

Make our existing matched comparisons and request evidence easier to discover.
The strongest product promise is explaining where time and estimated cost went,
with explicit comparability and missing-data boundaries. Do not turn this project
into a pass-rate leaderboard or combine our numbers with Frontier Harness scores.

## Sources and acquired skill

- Live site: <https://frontierharness.org/>, inspected September 18.
- Upstream revision: [e837a70](https://github.com/frontier-harness-eval/eval/tree/e837a70bd6beb4e72eeeda62dd06e3bd34f6cb63).
- [Skill](https://github.com/frontier-harness-eval/eval/blob/e837a70bd6beb4e72eeeda62dd06e3bd34f6cb63/skills/frontierharness-eval/SKILL.md), including its scripts and reference material, downloaded to
  `scratch/frontierharness-review-20260918/skills/frontierharness-eval/`.
- Skill SHA-256: `592df399f28e0ce3fcb1f9d2ab6caa8d5d1190839a66408fede74cd80317f4a7`.

This is an isolated source checkout for inspection, not an installed active skill.
No upstream task definitions were checked out or imported into our suite. No
upstream provisioning, installation, evaluation, or publishing commands ran.
No root license file appeared in the inspected upstream tree; reuse concepts and
write our own implementation unless code-reuse permission is established.

## What they do well

The site offers a readily understandable overview, cost/speed controls, compact
tables, methodology context, and a direct path to evaluating another harness.
It describes 360 trials covering nine harnesses and twelve configurations using
one model. These are their published claims, not independently rerun results.

The skill describes a complete onboarding flow: pinned setup, checkpoint restore
per trial, evidence collection, normalized data, chart, and portable HTML report.
It explicitly warns that provider and environment differences require controls;
new runs default to non-comparable because historical egress policy is unknown.
Its corpus reproduction caveat is another reason to avoid assuming that running
the current instructions reproduces the historical conditions.

## Verified accounting defect

The chart says **Median cost per task**, but the inspected chart code calls
`websiteCost`, which uses `effective_cost_per_pass` for baseline records. That is
the sum of available canonical costs divided by successful tasks.

Recomputed directly from `results/eval-data.json` at the pinned revision:

| Configuration | Measured task costs | True median task cost | Sum of available costs / passes | Website value |
| --- | ---: | ---: | ---: | ---: |
| Codex | 30/30 | $0.230521 | $3.468296 | $3.47 |
| Pi Responses | 30/30 | $0.234674 | $2.432966 | $2.43 |
| Claude Code | 29/30 | $0.394050 | $18.336834 | $18.34 |

Claude's median here is only the measured subset, and its available-cost total
does not establish complete cost. These are upstream normalized estimates, not
actual invoices. This table diagnoses a definition mismatch; it does not compare
our harness results against theirs.

Code evidence: [website-cost.mjs](https://github.com/frontier-harness-eval/eval/blob/e837a70bd6beb4e72eeeda62dd06e3bd34f6cb63/skills/frontierharness-eval/scripts/website-cost.mjs),
[generate-chart.mjs](https://github.com/frontier-harness-eval/eval/blob/e837a70bd6beb4e72eeeda62dd06e3bd34f6cb63/skills/frontierharness-eval/scripts/generate-chart.mjs),
[baseline data](https://github.com/frontier-harness-eval/eval/blob/e837a70bd6beb4e72eeeda62dd06e3bd34f6cb63/results/eval-data.json).

## Skill and script review

Useful patterns are durable execution, reconnecting to the original attempt,
retaining evidence before runtime deletion, separating infrastructure-invalid
attempts, and exporting a self-contained report. Our runner and release gates
already address much of this; importing another runner would duplicate the model.

Specific reasons not to adopt the skill verbatim:

- Later instructions override earlier metric definitions and preserve the
  incorrect chart label. Our definitions should have one authoritative source.
- Provisioning creates cloud resources, installs software, configures secrets,
  and eventually deletes owned runtimes. This is an operational workflow, not a
  passive reporting skill. Inspection does not establish runtime safety.
- Its default suite includes a source our repository forbids importing directly.
  Keep our selected DeepSWE adapter and its source-specific gates.
- `trial-worker.sh` measures its fallback duration with `date +%s`. That path
  does not meet our monotonic-clock requirement; this is not a claim that every
  upstream duration uses that path.
- First-cold normalization changes cached-token pricing. Keep it distinct from
  our pinned price-book estimates and provider reconciliation.

This was a static review and numerical check, not a complete security audit or
an execution test of their evaluation system.

## What our current project already supplies

| Capability | Current evidence | Practical limitation |
| --- | --- | --- |
| Matched comparisons | `packages/report/src/analysis.ts`; campaign `analysis.md` | Common successful task identities only; not paired seeds or causal effects |
| Repeated measurements | 200 selected attempts in public `analysis.json` | Three recorded populations must remain separate |
| Request-level explanation | `request-analysis.ts`; request series and timelines | Non-model residual includes unobserved tool work |
| Honest missing data | Per-metric availability and sample counts | Known subtotals cannot become complete cost |
| Portable offline report | `scripts/s6-analysis-replay.mjs` | Snapshot remains unpublished as v1 |
| Timing decomposition | `derive.ts` interval unions and visibility checks | Harness time is unavailable without full tool visibility |

The premise that we cannot compare harnesses is therefore only partly true:
matched descriptive comparisons exist. A universal ranking across hosts, task
populations, outcomes, and external benchmarks would not be supported.

## Improvement options, in priority order

1. **S6: simple metric overview — maintainer priority.** Lead with three visual
   comparisons: pass rate, estimated cost, and cache rate, with input and output
   token medians per attempt alongside them. Use compact harness
   rows and horizontal bars, sortable by metric. Pass rate means native passes
   divided by selected attempts, including failures/timeouts in the denominator.
   Label cost as median estimated cost per attempt across outcomes, with measured
   coverage; label cache as median cached-input percentage per measured attempt.
   Keep unknowns visible. A population selector preserves existing boundaries;
   differing task coverage must be apparent rather than implying a fair ranking.
   Put detailed timing, methodology, and pairwise comparisons below the overview.
   This priority supersedes starting with two-harness selectors. Show
   why a comparison is unavailable. Use existing analysis derivations. Acceptance:
   mismatched hosts/models/routing/task revisions never merge; every value exposes
   its population and denominator; unknown cost remains unknown; mobile layout
   and keyboard controls work; public offline replay stays deterministic.
2. **S8: our own evaluation/replay skill.** Offer a zero-spend walkthrough first:
   inspect evidence, replay the report, explain comparisons. Separate new paid
   runs behind existing explicit budget and preflight requirements. Acceptance:
   a clean checkout can produce the published snapshot report without keys or
   network; the skill cannot treat diagnostic evidence as an official release.
3. **S4: improve tool-event coverage where feasible.** Add one adapter at a time
   with source-supported event semantics. Acceptance: fixtures and bounded real
   validation establish timing coverage before any full harness-time claim.
   This costs more engineering effort and may require separately funded probes.
4. **S7/S8: finish the evidence and publication path.** Reconcile current anomaly,
   archive, and release state using authoritative artifacts; then finish the
   existing freeze and human publication gates. A polished website cannot make
   the current pilot an official frozen release.

A fresh cross-project benchmark is a separate, costly option, with incompatible
task-policy constraints and different model, provider, runtime, pricing and
selection rules. It is not needed to improve this project's explanatory value.

Implement one numbered stage at a time after a concrete stage plan. Add no npm
dependencies and no derived fields to `run.json`. Success means easier,
reproducible interpretation of supported comparisons—not better-looking scores.

## Checks performed

- Verified the upstream commit and skill hash after retrieval.
- Recomputed the three cost examples from all numeric canonical task costs.
- Inspected local derivation, matching, public analysis, and current stage plans.
- Replayed the public analysis with `node scripts/s6-analysis-replay.mjs
  evidence/nonclaude-results-2026-09-14/analysis.json scratch/frontier-review-replay`;
  byte comparison of generated HTML against the retained HTML passed.
- During research, no production code changed and no model calls or cloud resources were used.

## Real-data overview preview

Computed from the retained public `analysis.json`, September 18. This is a
content preview for the proposed UI, not an implemented renderer. Start with
population 1: recorded macOS ARM64, 16 GiB, DeepSeek v4.1 Flash. Preserve the
complete population identity in the selector/details, including routing and
price book. Rows below are alphabetical, not ranked.

| Harness | Pass rate | Median estimated cost / attempt | Median cache rate | Coverage |
| --- | ---: | ---: | ---: | --- |
| Cline | 50.0% · 1/2 | $0.183 · partial, 1/2 measured | 97.1% | 2 tasks, 2 attempts |
| Codex | 62.2% · 23/37 | $0.086 | 99.2% | 8 tasks, 37 attempts |
| Hermes | 45.0% · 18/40 | $0.089 | 98.9% | 8 tasks, 40 attempts |
| Pi | 46.2% · 18/39 | $0.107 | 98.1% | 8 tasks, 39 attempts |
| Qwen | 72.2% · 13/18 | $0.096 | 99.2% | 7 tasks, 18 attempts |

Visible qualification: **Different task coverage; descriptive snapshot.** Cache
values have complete attempt coverage in this population and represent medians
of each attempt's cached-input percentage, not a pooled token ratio. Costs are
static estimates across measured selected attempts of all outcomes. Cline's
partial cost median must not receive a cheapest badge. All pass-rate denominators
include the selected non-pass outcomes. These summaries do not include earlier
unselected attempts or establish a capabilities ranking.

Suggested visual treatment: metric tabs with horizontal bars, persistent
values for pass rate, cost, cache rate, input tokens and output tokens in each
row, and a compact coverage column. Token values use the existing successful
model-response usage scope, with medians per measured selected attempt across
all outcomes. Input includes cached input; output preserves the existing counter
definition. Show missing coverage and never substitute zero. Use compact K/M
formatting with exact values available in accessible details. Default
alphabetical ordering avoids declaring a winner from unequal samples. Sorting
is descriptive and retains the coverage qualification. Keep full precision for
sorting; round only displayed values. Unknown costs have no bar and sort last.

Population 3 has no complete cost observations for any harness; its cost view
must show **Unavailable** throughout. It must not silently borrow population 2's
prices or combine those populations because the recorded hardware matches.

The maintainer subsequently requested input/output tokens and primary metrics
first, with other data below. Implementation is tracked in
`S6-metric-overview-plan.md`; the separately requested README-first update was
pushed in `cf3bc71`. The preview above records the research-stage proposal.
