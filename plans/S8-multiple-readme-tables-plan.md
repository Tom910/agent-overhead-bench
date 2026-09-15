# S8 README table selection and launch fixtures

The full pre-push suite exposed seven failures after the final campaign
coverage table and revised unpublished wording were added. Six launch tests
perform case-sensitive replacement of text that the production launch gate
already matches case-insensitively. Fix the fixtures to exercise their intended
release/pilot branches, without weakening the production gate.

The pilot publisher selects the first `| Harness |` table, which now selects
campaign coverage instead of measurement rows. Bind both report extraction
and README replacement to the existing `| Harness | vX.Y |` measurement
header. Keep coverage tables and surrounding text unchanged. Regressions must
exercise extraction with preceding coverage, reject coverage-only inputs,
and verify the real README coverage table survives a pilot replacement.

Observe the regressions fail before changing production code; then run the
targeted tests and full no-spend npm suite, lint and type checking. No measured
data, prices, dependencies, release status or external publication changes.

## Verification

The new regression failed against the old publisher: it extracted coverage
rows and rejected correctly sized measurement rows. After binding the header,
all 30 targeted tests passed. The full npm suite passed with 787 tests passed
and two skipped; lint and workspace type checking passed. Linux Docker proxy
smoke passed using byte-identical validation scripts, without provider traffic.
The server cache lacks an unused adapter image, so a clean build of every
image remains for GitHub CI. No push or release was performed.
