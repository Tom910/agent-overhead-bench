# Completed Linux campaign

This is the current, completed campaign: eight selected DeepSWE tasks × five
harnesses × five repetitions, on the same Linux host. It reuses 104 prior attempts
and fills only the 96 missing slots. No already executed Linux slot was rerun.
Claude CLI is excluded. Collection ended on 19 September 2026 at 16:53 UTC.
Completion means measured outcomes exist, including native verification failures;
it does not mean every task passed or that an official v1 release was frozen.

## One data source

[`../current-campaign.json`](../current-campaign.json) points here.
[`analysis.json`](analysis.json) is the canonical sanitized attempt export.
The root README's current-results block, [detailed Markdown](analysis.md), and
[interactive HTML](analysis.html) are generated from its validated facts, using
the same overview and pricing code. Do not edit these views by hand.

```bash
npm run report:refresh
npm run report:check
```

Both commands work offline without credentials or model calls. The second is
read-only and runs in CI. It detects stale views and rejects mismatched source
hashes, incomplete/duplicate slots, other hosts/models, changed routing, mixed
comparison groups and incorrect selection bindings.

[summary.json](summary.json) binds the 200 selected raw C4/C1 pairs by hash.
[provenance.json](provenance.json) binds that summary, canonical data and generated
report files. Metrics come from attempt facts, not summary totals or handwritten
README values. Raw private evidence stays on the Linux host. The public export
contains no raw logs, prompts, account credentials or host filesystem paths.

## Reading the results

Pass rate, reference cost, cache rate and tokens in/out lead every view. Each
metric has its own best-observed 100% baseline: value/maximum for pass/cache;
minimum/value for cost/tokens. These are descriptive resource and outcome indices,
not a composite quality ranking. Partial measurement coverage is shown, unscored,
and excluded from baseline selection. Thus a lower known median from incomplete
measurements does not become the reference best.

Reference prices use the immutable `deepseek-v41-low-2026-09-10` book. Exact
successful-response counters are priced for each attempt before median aggregation.
Missing usage and ambiguous accounting stay unavailable. Original recorded price
books, costs and task identities are preserved in the export and detailed sections.
Reference pricing is not a claim about actual billing.

All harnesses cover the same eight task names and five repetition indices.
Retained and rebuilt verifier images differ after host cleanup; detailed task
identities preserve those differences. The overview is not an image-matched
controlled experiment. Task identity counts may exceed eight because they include
verifier variants. The legacy headline exporter still rejects repetition image
drift. The explicit analysis-only exporter also rejects agent-only image changes
within a single verifier identity.

To reconstruct this export from the private selected evidence:

```bash
node scripts/s6-campaign-analysis.mjs <selected-results-dir> \
  evidence/linux-results-2026-09-19/summary.json <output-dir> --allow-image-variants
```

The earlier [partial Linux snapshot](../linux-results-2026-09-18/README.md) and
[mixed-host snapshot](../nonclaude-results-2026-09-14/README.md) are retained as
history. They are not sources for the current generated comparison.
