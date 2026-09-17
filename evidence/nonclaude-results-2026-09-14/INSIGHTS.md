# What the selected campaign tells us

The useful question is where time and money go on comparable tasks. This
snapshot has 200 selected outcomes, but three separate host/price-book
populations. Start with the [analysis tables](analysis.md), or download and open
the [interactive view](analysis.html). The latter has population/outcome filters,
individual timing dots and expandable task distributions.

## The apparent speed difference depends strongly on task selection

In the historical macOS/DeepSeek-book headlines, Hermes is 418 seconds and
Codex is 594 seconds. Those summaries cover different successful task sets.
Restrict both to their six common successful tasks and their medians of task
medians become 418 and 542 seconds, respectively. Yet the median of the six
within-task Hermes/Codex ratios is approximately **1.00**: the task-specific
differences go in both directions.

This is why the analysis publishes each matched task, its successful sample
count and its ratio, alongside the aggregate. A ratio of summary medians and
a median of within-task ratios answer different questions. Neither establishes
an overall winner. One common task is especially weak evidence: every macOS
comparison involving Cline contains only its single successful psd-tools run.

## Failures consume substantial measured time and money

Within the macOS/DeepSeek-book population, the 73 selected successful attempts
sum to **12.78 hours** of CLI time; the 63 selected native failures sum to
**12.73 hours**. These are sums of individual measured durations, not elapsed
campaign time. A success-only speed table leaves out almost half of that
population's selected execution time.

The successful attempts have **$7.6164** in static estimated cost. The failures
have a **known subtotal of $5.9750 across 62 of 63 attempts**; one failure has
incomplete accounting. The failure subtotal is not a complete total. These
are selected-attempt estimates, not the provider invoice or the cost of all
recovery attempts. No Linux population is pooled into these figures.

## Investigate residual time by task

On macOS, Codex's successful ink-grid attempts have a median non-model residual
of about **519 seconds**, versus **46 seconds** for tomlkit. That identifies a
useful place to inspect tool activity. It does not identify 519 seconds of
pure harness overhead: all campaign tool timelines have partial visibility.
The analysis shows model and residual distributions for each task and outcome,
so slow tool work and different model-call patterns need not be hidden inside
one overall speed number.

## Read the sample counts before comparing numbers

- Populations keep host fields, model, price book, source revision, regime,
  routing and compatibility configuration separate. Recorded hardware fields
  do not prove identical machine load or provider conditions.
- Matched timing includes only tasks with reconciled native passes on both
  sides. Repetition indices are not paired random seeds, and execution windows
  differ. Matching does not remove success-selection bias.
- Each per-task outcome table shows available and missing counts independently
  for timing, turns, tokens, caching and cost. The 30 Linux/OpenRouter-book
  attempts have unavailable prices; they are not free.
- Quartiles describe the observed repetitions. They are not confidence
  intervals. One successful repetition has no measured spread.
- API turns count identifiable attempts; token usage covers successful model
  responses. First byte is an HTTP byte measurement, not first-token latency.

## Request-level explanations (within runs)

The analysis now includes sanitized per-call series: wait to first byte,
response transfer, gaps between calls, and time after the last model
response. These are within-run facts. Do not divide unrelated headline
medians.

On the macOS/DeepSeek-book population:

- Cline’s two selected attempts average **231** model calls; Hermes **88**,
  Qwen **88**, Pi **96**, Codex **101**. The median across each run's median
  call duration is approximately **2.5–3.1 s**. These are descriptive summaries
  of unequal samples: Cline covers two tasks, Qwen seven, and the others eight.
  They do not establish that Cline generally makes more calls or that call
  count explains a matched-task wall-clock difference. Long calls can affect
  total duration without substantially moving the median.
- Median *largest inter-request gap* is about **30 s** for Cline and **20 s**
  for Codex vs **14 s** for Hermes. Residual time often sits **between**
  calls.
- Codex’s median time after the last model response is about **5.4 s**,
  versus **0.4 s** for Hermes and **0.3 s** for Qwen. Some leftover is a
  **tail after the model stops**, not a longer generation.
- Annotated exemplars (most calls, largest gap, longest tail, longest
  single call, chatty failures) are in the interactive view. They are
  deterministic picks, not a ranking.

Failed selected attempts still issue many calls. This is consistent with their
substantial execution time, but does not by itself explain why summed failure
and success hours are similar. Task mix, call durations, gaps, and sample counts
all contribute. The request tables separate outcomes and show per-task
distributions so these hypotheses can be checked on comparable samples.

Request gaps are uncovered time between the union of model-call intervals;
overlapping calls create no gap. Tail time runs from the latest response end to
adapter completion and is unavailable when adapter timing is unreconciled.
Network-failure markers are excluded from byte-latency samples. Tail and gap
shares use the interval from the first request to adapter completion, excluding
startup; they are not harness-overhead shares.

Cumulative cost curves explicitly distinguish complete call-cost totals from
known subtotals and identify missing observations. Token trajectories cover
successful model responses and separate cached, uncached and output tokens.
They do not reconstruct unique prompt content or an invoice.

## Reproduce and inspect

[analysis.json](analysis.json) contains the allowlisted per-attempt facts and
the derived tables. [provenance.json](provenance.json) binds the generated
artifacts to the existing snapshot summary. Every exported attempt carries the
selected C1/C4 hashes. The raw files remain private, so public replay reproduces
the analysis from those exported facts; it does not independently authenticate
the private source bytes or constitute an official archive freeze.

From the repository root, rebuild all generated analysis views without network
access or credentials:

```bash
node scripts/s6-analysis-replay.mjs \
  evidence/nonclaude-results-2026-09-14/analysis.json scratch/campaign-analysis
```

The historical `report-engine.md` and `report-engine.json` are preserved. No new
provider execution or additional benchmark spend was needed for this analysis.
