# S1 calibration warm-up

The Linux migration exposed startup contamination in `calibrate`: two warm-up
requests precede bursts of ten measured requests. Connection tracing confirms
new pools are still being established in measured bursts. Same-process and
matched-concurrency probes remove most of the 12–22 ms excess. Evidence is in
`scratch/linux-migration-20260913/CALIBRATION-DIAGNOSIS.md`.

Use ten fixed warm-up rounds, each sending the configured concurrency to the
direct endpoint and then the proxied endpoint. This exercises connection pools
and runtime paths repeatedly before measurement. Discard warm-up timings.
The count is fixed for every host and independent of measured latency; there
is no adaptive warm-up, retry-until-pass, or result selection. Preserve the
three default measured rounds, ten default concurrent requests, percentile
calculation, 5 ms preflight threshold, and actual proxy implementation.

Report `warmup_rounds=10` and `warmup_samples_per_path=10 * concurrency` in the
standalone calibration text. No C1–C4 schema, run.json, dependency, provider
traffic, or measured-run timing model changes. Retain previous failed
calibration evidence; this does not retroactively reclassify old runs.

Before implementation, add a regression exercising concurrent fetch bursts
and asserting warm-up occurs at the selected concurrency, output contains only
measured samples, and the standalone report identifies warm-up. Run the
focused proxy tests and all workspace typechecks. Independently review the
change, then deploy and retain three fresh-process Linux calibration results
with no filtering. Run the full preflight unchanged before paid admission.

Verification: regression tests first failed for two-request warm-up and missing
warm-up metadata, then all six calibration tests passed on macOS and Linux.
All workspace TypeScript checks and whitespace checks passed. Independent
review found no blocking issue. Three fresh Linux processes produced p99
4.233318, 3.654002, and 4.195738 ms, each retaining exactly 30 measured samples.
All three results are retained in
`scratch/linux-migration-20260913/calibration-fixed-warmup-validation.json`.
Full preflight remains the admission gate; these diagnostics do not authorize
ignoring a subsequent failure.
