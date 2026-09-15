# S7 tool-by-tool campaign and validation plan

**Status:** implementation and independent review complete; awake-host prerequisite and native verifier ownership defect resolved. Maintainer-approved Relace exclusion is implemented and verified, but another provider returned inconsistent token counters in the live probe. Full validation remains paused on accounting; see the current handoff (2026-09-08).

**Goal:** Run the official matrix one tool at a time with spend checkpoints,
a passing one-repetition validation run first, and one verified combined report.

**Authorization/spec:** The maintainer requested tool-by-tool execution,
combining results, five repetitions, and a one-run-per-tool validation before
the grand run. This explicitly replaces the single uninterrupted randomized
cross-tool window requirement for the new protocol, not C1–C4 measurement.
The already selected eight DeepSWE tasks and collected license evidence stay.

**Architecture:** One campaign root retains the complete Cartesian matrix,
shared cumulative spend, and results. Each invocation selects one tool and
stops after that tool's pending cells. Independent monotonic ledger segments
record each batch; no intervals from different processes are subtracted.
The final existing freeze validates the full matrix and every batch segment.
Legacy single-window archives keep their original verification behavior.

**Tech stack:** Existing strict TypeScript modules, shell/Node entry points,
Vitest and node:test. No new dependency or provider spend during implementation.

## Design decisions and invariants

- New explicit protocol: `tool-batches-v1`. `run-all.sh` retains legacy support;
  a dedicated `run-tool-batch.sh` provides the new workflow. Five repetitions
  by default for new full campaigns (8 × 6 × 5 = 240 cells).
- Validation defaults to every selected task once per tool (48 cells), across the full
  eight-task scope. It is separate from official
  results and is never added to repetition counts. First failure stops it.
- The campaign has an explicit total cap and each invocation requires an
  explicit tool cap. Tool spend includes retained attempts and retries; rerunning
  the command cannot reset its recorded spend. Unavailable spend stops execution.
- Repeated commands for completed tools do nothing. Changing task/model/price
  book/protocol/total-cap identity after a campaign starts is refused.
- A single writer lock prevents two tool batches concurrently changing state.
- Each new segment records the selected tool, host snapshots and cap. Only
  cleanly closed segment continuations are eligible; interrupted evidence is
  retained and fails official verification. All cells and retries must be
  covered exactly once, and a tool cannot resume after another tool has started.
- Validation evidence is re-read, not trusted from a boolean marker. Every
  expected tool/task must have a completed C4, successful identifiable model
  traffic, complete usage/pricing, correct pins, matching versions and images,
  verifier exit zero and finite timings. Changes to pins invalidate the gate.
- Official source, reference-polarity, calibration, image, Activity, anomaly,
  redaction and archive-binding gates remain enabled. License evidence is not
  re-collected, nor are pending aggregate flags fabricated.
- Reports name tool batching and its time-of-day/provider-load limitation.
  Archive verification uses archived protocol/evidence, not today's defaults.

## Task 1 — Batch ledger contract

Files: `packages/runner/src/window-ledger.ts`, its existing test file, index exports.

- [x] Extend optional protocol/segment metadata without breaking legacy ledgers.
- [x] Add explicit batch-mode options to `assertOfficialRunWindow` so legacy
  calls still require one segment. Batch calls require expected tool mapping,
  correct tool-only segments, exact attempt coverage, stable hosts and closure.
- [x] Update `RunWindowWriter` to persist batch metadata and refuse unclean or
  mismatched continuation. Never reopen a completed ledger silently.
- [x] Test two distinct monotonic anchors, clean pause/resume, mixed-tool and
  reordered batches, host drift, missing attempts and legacy rejection.

## Task 2 — Runner batching and budgets

Files: `packages/runner/src/matrix.ts`, `matrix.test.ts`, `cli.ts`.

- [x] Add `executionProtocol`, `batchTool`, and `batchCapUsd` options. Create the
  complete grouped matrix once and execute only the selected tool.
- [x] Bind protocol to definition_key, preserve global cap across segments,
  fail on concurrency and require previous started tool to finish first.
- [x] Add fail-fast validation execution. Keep failure C4 and spend evidence.
- [x] Test two sequential invocations yield the full matrix, no implicit second
  tool, no repeat charges, per-tool and total cap enforcement, and pin drift.

## Task 3 — Validation and launch commands

Files: `packages/report/src/campaign-validation.ts` and tests,
`scripts/s7-validate-campaign.mjs`, `scripts/run-validation.sh`,
`scripts/run-tool-batch.sh`, `scripts/s7-preflight.sh`, `scripts/run-all.sh`,
`scripts/s5-build-images.sh`, `scripts/prepare-deepswe-calibration.sh`,
`scripts/build-deepswe-agent-image.sh`, `images/pi.Dockerfile`.

- [x] Implement reusable validation comparison from C4/C1 evidence and the
  intended source identities, plus a no-spend status/validation CLI.
- [x] Launch validation with one repetition, a separate root, explicit cap,
  fresh Docker cells and stop-on-failure; no grand run auto-start.
- [x] Launch a single tool with five-repetition campaign definition, validate
  smoke evidence first, and reuse official no-spend preflight before requests.
- [x] Permit validated batch resumption in preflight without accepting arbitrary
  nonempty result directories or relaxing source gates for official execution.
- [x] Cover missing/stale/failed validation evidence and no-spend argument gates.
- [x] Align image preflight/preparation with the existing official Cline and Pi
  selection. Use their retained evidenced versions; pin the previously floating
  Pi container install to that version. Copy their installed CLI packages into
  source-owned task images. This completes the existing tool scope and adds no
  project npm dependency. Cline 3.0.61 and Pi 0.73.1 are retained pilot pins;
  their existing images use global npm installs. Check their exact offline
  package metadata and CLI versions while preserving the other tools' npm-lock
  gates; task images copy the corresponding package tree and executable.

## Task 4 — Official freeze, archive and docs

Files: `scripts/s7-freeze.sh`, `scripts/s7-verify-archive.sh`,
`packages/report/src/freeze.ts`, new campaign integration tests,
`plans/S7-runs-protocol.md`, `README.md`, `METHODOLOGY.md`, handoff.

- [x] Record the protocol in release marker; verify grouped matrix plus all
  ledger segments, and keep exact full-scope Cartesian validation at freeze.
- [x] Sanitize/archive validation evidence and recompute its gate on extraction.
- [x] Preserve separate replacement-session behavior and prevent overlap with
  any batch; maintain existing Activity and total spend reconciliation.
- [x] Generate one report from the shared results; include scheduling caveat.
- [x] Test a full synthetic official campaign, archive round trip, missing batch,
  forged protocol, validation tampering, retries, and legacy archive behavior.

## Final acceptance

- [x] Full no-spend workspace/script tests, typecheck, lint, shell syntax, diff.
- [x] Fresh independent review of protocol, spend and evidence boundaries.
- [x] Demonstrate validation → tool A → tool B → combined report on mock evidence.
- [x] Inspect current pinned preparation for the real validation prerequisites;
  launch paid validation only with a concrete explicit budget, never the full
  campaign automatically. Report actual gate failures without weakening them.

## Baseline finding

The isolated baseline failed the invalid-regime test because it referenced an
ignored `scratch/deep-swe` checkout. The regression now makes and cleans its own
minimal source fixture; no production calibration behavior changes.

## Inspection findings

The selected eight-task `scratch/deepswe-release-shape-20260903-official-prep-v2`
retains all eight reference-polarity records but has source-owned images for the
older five-tool set. It needs preparation for the current six-tool scope before
real validation. The image/preparation scripts also still rejected Cline and Pi;
this plan includes completing that prerequisite, without changing selected tasks.

Independent review found and closed a campaign resume gap: prior state/result
bindings must be checked before spending or replacing ledger bindings, including
completed-tool no-ops. New initialization refuses orphaned prior results. Status
now reports all real runner states, including verifying and quarantined.

## Verification

Full `npm test` passed after campaign review fixes: 406 workspace tests and 135
script tests. Full workspace typecheck, lint (171 JavaScript/shell files), and
`git diff --check` passed. Independent runner/spend review and separate
freeze/archive review are clean. Real offline base-image version checks passed
for all six tools. The real source-image smoke found a Cline/Pi launcher copy
issue; packaging must recreate the installed executable symlinks so relative
module/binary resolution is retained. The fix passed four focused tests and a real Cline task-image version probe.

## Real no-spend readiness — 2026-09-05

Prepared `scratch/v1-validation-tasks-20260905` with the same eight selected
DeepSWE source/workspace revisions and short regime. All 48 source-owned agent
images passed offline, read-only version probes. The old PSD/Ink environment and
verifier image pins were no longer locally available; their retained newer
images have the same source/workspace revisions. Fresh five-sample native
reference checks passed for both, and all source, task and reference bindings
were recomputed and validated. The earlier preparation is untouched.

The complete diagnostic `s7-preflight.sh` passed on macOS Docker Desktop with
all six tools, the selected eight tasks, one repetition, the pinned Flash model
and dated price book. Evidence: `scratch/v1-validation-tasks-20260905/no-spend-preflight.log`.
`scratch/v1-validation-config.sh` contains only task/provenance paths, no
credentials, and starts no runs. No provider traffic or new provider spend was
incurred. Paid validation and the grand campaign have not started; the validation
budget must be explicitly set before launch. Official aggregate review and
calibration approvals remain required for the grand campaign.

## Increased budget and extended validation — 2026-09-07

The maintainer authorized spending the account's available $22.40 and asked to
raise/remove restrictive limits and finish v1.0. This supersedes the earlier $10
validation allowance. Record a fresh provider lifetime baseline and permit at
most $22.40 of additional spending from it, retaining a small in-flight reserve
in the external monitor; historical lifetime usage is not subtracted twice.
Use the existing source-supported 10800-second `extended` preparation, unchanged
eight-task selection, all six tools, one repetition, separate output/ledger,
and the standard stop-on-failure validation command. The conservative cell
estimate is $2.50 and the aggregate recorded cap is $22.40. Refresh remaining
funds before further attempts or the official campaign; this is one shared
budget, not a new allowance for each command. Preserve every failure and do
not relax verifier, calibration, source or release evidence gates.

The fresh root is `scratch/v1-validation-extended-20260907`. Earlier 1800-second
Pi/Codex results remain separate. The planned Hermes-only control was not
launched; the full validation now takes priority. The latest no-spend clock
recheck passed at a 3 ms conservative bound; no Docker restart was required.

## Retained attempts and awake-host requirement — 2026-09-07

The first funded attempt found nullable optional Messages cache counters;
the S1 fix and its verification are recorded in
`S1-anthropic-null-cache-usage-plan.md`. A subsequent complete Claude control
retained usage for all 131 model requests, but an observed served-model
`unknown` failed the existing pinned-model gate. A successful native check on
a separate workspace copy cannot promote that rejected C4 into calibration.

Fresh full attempts under `scratch/v1-validation-accounting-fixed-20260907`
and `scratch/v1-validation-awake-20260907` each passed Pi/PSD, then experienced
confirmed clamshell sleep during Claude/PSD. The latter was already launched
under `caffeinate -i -s`; idle-sleep assertions do not prevent lid-close sleep.
The owned cells were stopped, unavailable request spend stayed unavailable,
and original results, state, ledgers, hashes and host sleep logs were retained.
Both matrices remain one done, one failed and 46 pending, with no official
campaign eligibility. No further paid restart is scheduled until a stable
awake host is available. Refresh the original shared balance at that time;
the last provider snapshot leaves $20.550295502 of the additional allowance.

The existing 48/48 first-attempt verifier-pass gate has not changed. A
clarification was requested because treating a normally completed, fully
measured task failure as an instrumentation failure may exceed the intended
overhead-validation scope. Any policy change needs an explicit stage update
and review; complete accounting, correct model identity, two-CLI calibration
for every task and source/release gates must remain enabled.

September 10 amendment: see S7-native-task-continuation-plan.md for measured native task failures. Complete first-attempt measurement remains required; all-task-pass validation is superseded.
