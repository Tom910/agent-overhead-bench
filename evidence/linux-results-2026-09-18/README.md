# Linux-only campaign snapshot

In-progress snapshot at 2026-09-18T23:17:32.099082+00:00: 107 of 200 planned
slots, all from one physical Linux host. Reuses 104 existing attempts plus three
new outcomes. No already executed Linux slots were rerun for this campaign.
Claude CLI is excluded. The remaining queue continues separately; these files
are a fixed snapshot, not a live feed or an official v1 release.

The [overview](analysis.md) prioritizes pass rate, reference cost, cache rate and
input/output tokens. Each metric has its own best-observed 100% index: value /
maximum for pass/cache, minimum / value for cost/tokens. No composite ranking.
Incomplete metric coverage is unscored and excluded from baseline selection.
Unequal task coverage means these are descriptive, provisional comparisons.

Reference prices are frozen in `deepseek-v41-low-2026-09-10`: $0.15/M uncached
input, $0.003/M cached input, $0.60/M output. Exact successful-response counters
are priced per attempt, then summarized by median. Missing usage or ambiguous
accounting stays unavailable. Original recorded costs and book identities stay
unchanged in analysis.json and the detailed sections; reference costs are not
billing claims.

Retained and rebuilt task environments occur after Linux image cleanup. Their
verifier-image identities remain in the sanitized export and separate detailed
task distributions. Raw agent/verifier image records are bound by C4 hashes.
The overview is not an image-matched controlled comparison. The legacy timing
headline exporter still rejects image drift across repetitions.

## Provenance and reproduction

[summary.json](summary.json) selects each slot and binds its raw C4/C1 hashes.
[provenance.json](provenance.json) binds that summary and the generated files.
Private raw evidence is retained on the Linux host; no logs, prompts, credentials,
or machine paths are included in the public export. Public hashes do not make
this a verified official archive.

With the selected private evidence, validate and export:

```bash
node scripts/s6-campaign-analysis.mjs <selected-results-dir> \
  evidence/linux-results-2026-09-18/summary.json <output-dir> --allow-image-variants
```

The explicit flag writes attempt analysis only, keeps C1/C4 validation and
summary binding, and avoids producing a legacy image-matched timing headline. Agent-only image
changes within one verifier identity are still rejected.
To reproduce public tables and HTML offline without private evidence or spend:

```bash
node scripts/s6-analysis-replay.mjs \
  evidence/linux-results-2026-09-18/analysis.json scratch/linux-analysis
```
