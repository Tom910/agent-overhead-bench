# S7 — Freeze explained anomalies without replacement runs

Status: implemented (2026-09-04).

The S7 shell validates explained dispositions, but freeze-cli requires a rerun
directory for every review file. This prevents retaining observed outliers and
blocks the completed local pilot archive.

- Permit a review without rerun results; load an empty replacement set.
- Continue rejecting rerun dispositions without matching replacement evidence.
- Keep the shell's anomaly validation and archive review retention unchanged.
- Add a four-repetition no-spend fixture with one explained timing outlier;
  prove freeze and archive verification succeed, and missing reruns fail.
- Validate the completed local pilot using the same nonofficial freeze path.

No dependencies, measurement changes, discarded cells, provider spend, or
source/sign-off changes. Run the focused archive test, typecheck, lint, shell
syntax, and full no-spend suite before closing.

The regression failed on the former paired-argument condition and passes with
review-only packaging enabled. Missing replacements remain rejected. The real
192-cell fixture pilot passed freeze and archive verification with both timing
outliers retained. Its archive SHA-256 is
`1567384899177b4b1e1f7734fcc60906c7b5187ce9c07e989aba0307c64a2540`.
The README and evidence ledger now reference that nonofficial archive.

Final verification: full workspace suite and 105 script tests passed, including
explained-only freeze and missing-replacement rejection. Typecheck, lint, shell
syntax and diff checks passed. After the README/artifact replacement, 29
publisher/launch checks passed and the ledger checksum matched the archive.
