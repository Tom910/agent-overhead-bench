# Four complete-measurement replacements

This revision replaces only four explicitly authorized incomplete-measurement
slots in the completed Linux campaign. The other 196 slots are unchanged.
The selection does not depend on verification pass/fail. Original measurements
remain in [the previous dataset](../linux-results-2026-09-19/README.md).

[summary.json](summary.json) binds the old/new run mapping and selected C4/C1
hashes. The normal exporter validates all raw files; the current-source publisher
checks all four replacements have complete reference-cost accounting, matches
slot identities and verifies the remaining 196 attempts are unchanged.

The root README discloses additional known cost from the four superseded runs.
One interrupted Hermes recovery startup also consumed tokens; its evidence is
retained on Linux and its extra spend is outside selected benchmark columns.
Whole-benchmark columns cover the selected 40 runs per harness, while per-task
costs average each task's five runs. Original costs remain incomplete; replacement
runs cannot recover missing usage from the originals.

Use `npm run report:refresh` and `npm run report:check` from the repository root.
The [canonical data](analysis.json), [detailed tables](analysis.md), and
[interactive report](analysis.html) use the same source. The historical snapshot
remains preserved. This is not an official frozen v1 release.

[diagnostics.json](diagnostics.json) adds repeat reliability, leave-one-task-out
pass differences, and exploratory 95% task-cluster intervals for secondary mean
reference cost, input tokens and output tokens. These are equal-task means,
not the headline token medians. The deterministic 10,000-resample intervals
use task/base-revision clusters; five repetitions do not create five independent
tasks. Missing observations block that metric's interval and preserve its counts.
No multiple-comparison correction or winner-selection claim is made.

Failure labels retain the original outcome. Only validated changed grades in the
separate audit receive the confirmed-verifier-false-negative label, with replay
and amendment hash references. Other verification errors retain an unknown cause.
The collection ledger inventories the 200 selected runs, four superseded runs
and one events-only interrupted startup. It reports known reference costs and
missing-cost counts; total historical collection cost remains unavailable.
