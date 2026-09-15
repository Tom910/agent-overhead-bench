# S5 — Fixed provider price windows

Status: Implemented and independently reviewed (2026-09-10).

The approved DeepSeek snapshot describes a changing UTC rate schedule. Before
starting each cell, require a live public endpoint snapshot with matching model,
provider, canonical model, schedule and rates, and enough continuous matching
rate time for the full task timeout plus 300 seconds of setup/cleanup margin.
Wait outside cell timing and state transitions. Invalid or changed endpoint
metadata fails closed; unknown/missing fixed-tier policy cannot silently bypass
the guard. Preserve raw admission snapshots in provenance, never C4 metrics.

Implement a typed schedule validator and minute-resolution weekly tier coverage,
an admission callback before staging/attempt timing, and mandatory CLI wiring
for fixed-provider-tier books. Existing ordinary price books are unaffected.
No new dependencies or changes to model parameters, task timeouts or C1–C4.

Tests first: UTC boundaries, adjacent-day continuity, insufficient duration,
missing/overlapping schedule coverage, live metadata drift, routing mismatch,
and callback failure leaving an untouched pending cell. Run runner tests,
typecheck and lint; independent review before paid validation.

Review corrections: admission returns an execution check retaining the full
300-second margin; Docker executes it after route/image/version setup and host
after staging. Exhausted retries quarantine before admission. Delayed setup
regression proved no measured container launches and existing cleanup executes.
Seven focused schedule/live-evidence tests and seven Docker log/admission tests
pass. Live public endpoint check passed without inference. The initial full verification was interrupted by host sleep; the awake rerun
passed 714 tests with two existing opt-in Docker skips. Full typecheck and lint
pass. Native task preflight also passes with pending calibration allowed.
