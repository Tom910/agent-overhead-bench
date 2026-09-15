# Current Review and Next Work

## GitHub push-ready — 2026-09-15

`main` is a single unpublished-source commit. The only remaining operator
action is `git push -u origin main`. Do not tag `v1`. Do not add `.env` or
`scratch/`.

## Maintainer signed off DeepSWE review flags — 2026-09-15

`plans/s3-deepswe-review.json` is approved by tom910: all four flags true.
`calibration_complete` is a policy exception from the 200-slot DeepSeek
campaign, not a two-CLI short-regime attestation file. `evidence/index.json`
stays `pilot`. Do not tag `v1` until freeze.

## METHODOLOGY frozen; Activity gap accepted; v1 still blocked — 2026-09-14

METHODOLOGY is no longer a draft. It records the DeepSeek campaign protocol
and the accepted Activity CSV completeness exception (dashboard $52.1 vs
export $50.70). `evidence/index.json` stays `pilot`.

## Public surface honesty, v1 still blocked — 2026-09-14

The non-Claude campaign completed 200 selected native outcomes. That is a
snapshot, not a v1 freeze. README no longer opens with a per-harness
pass/fail ranking or operator account balances. Timing stays in the
host/price-book report. `evidence/index.json` remains `pilot` and now also
checksums the campaign summary/report. METHODOLOGY is frozen protocol text;
the official archive is still unpublished. The Activity CSV $50.70 vs
dashboard $52.1 gap is an accepted 25k-row-cap exception. Source-review
flags remain false until the maintainer approves or refuses each one.

Linux cells ran on the dedicated Linux measurement host; macOS cells ran
on the operator Mac. Raw C4/C1 files remain in private `scratch/` trees
(local and on that host). Do not copy them into git. Do not flip `official_release` or ledger
status to `released`. Source-review flags were approved 2026-09-15.

Remaining v1 work: source sign-off (approve or refuse each flag), anomaly
review, `scripts/s7-freeze.sh`, courtesy notes, and human publication copy.
The Activity CSV completeness gap is accepted.

## DeepSeek readiness prepared; validation awaits host/window — 2026-09-10

The resumed maintainer objective includes completing preparations and running
the final campaign one harness at a time, with five repetitions per harness. Commit `b1ce53c` adds the explicitly selected DeepSeek profile,
immutable low-tier price book and live per-cell schedule admission. Admission
is rechecked after Docker setup with the full task timeout plus a 300-second
margin. Provider routing remains `deepseek` with fallbacks disabled.

The full awake check passed 714 tests, with two existing opt-in Docker skips;
full typecheck, lint and native task preflight passed. Earlier checks were
interrupted by confirmed host sleep and were rerun without weakening gates.
Fresh task inputs retain the eight selected tasks and all 40 matching pinned
native reference checks. No new model-validation spend has occurred.

Private readiness control is under `scratch/deepseek-readiness-20260910`.
Its supervisor requires AC power and waits until the next sufficient matching
price window, September 11 at 10:00 UTC (03:00 PDT), before preflight and runner
creation. The Mac was on battery at the latest check. The previous all-pending,
zero-spend schedule is retained under `pending-before-power-gate`.

Completion still requires all 48 valid terminal measurements, independent
provider cost reconciliation, two actual passing CLIs per selected task,
bound calibration/source review, final preflight and a fresh budget assessment.
The original shared authorization is unchanged: baseline $7.603752101 plus
$22.40; latest lifetime usage $12.153720152. The supervisor reserves $12 for
validation and retains the conservative lifetime stop $29.903752101. The explicit
`--then-final` handoff can start the six sequential final harness batches only
after clean validation, genuine calibration, fresh preflight and budget checks.

## DeepSeek provider diagnostic passed — 2026-09-10

The maintainer requested `deepseek/deepseek-v4.1-flash`, provider `deepseek`,
with fallback disabled. Five direct streaming probes and all six real CLI
file-editing smoke tests pass. Final-smoke C4 estimates, provider generation
costs and settled account usage agree exactly at $0.027490062. All 29 successful
generation records confirm DeepSeek and the dated model version. Total
additional diagnostic spend is $0.065459994; lifetime usage is $12.153720152
at 19:35:28Z, still subject to the same original shared authorization.

Claude Code's background JSON-schema title request receives a complete provider
validation rejection. S1 now captures private redacted provider evidence and
recognizes only that observed error. S5 and S7 retain failed request timing and
null usage while allowing complete successful-request accounting. Unknown
provider failures, incomplete usage, wrong identities and verifier defects stay
blocked. See [diagnostic results](./S2-deepseek-v41-provider-diagnostic-plan.md)
and its linked stage plans; private artifacts remain under
`scratch/deepseek-v41-provider-check-20260910`.

No paid process remains active. This is smoke compatibility evidence, not
public-task calibration or final repetitions. The old GLM campaign remains
stopped and unchanged. The next full campaign needs a separate DeepSeek model
and pricing definition, a scheduled-pricing boundary policy, and fresh bound
calibration/validation. Do not relabel old measurements or reset the budget.

## Verifier Git ownership fix — 2026-09-10

The Z.AI-pinned validation stopped with Pi/PSD passing and Claude/PSD
`verify_error` (exit 128): Git rejected `/work/workspace` ownership. All 184
model requests returned HTTP 200 with valid usage; the eight other 404 events
were proxy-refused auxiliary routes. Provider lifetime usage at the terminal
snapshot was $10.839387268, within the original shared authorization.

The verifier Dockerfile now trusts exactly `/work/workspace` in system Git
configuration. Agent images, immutable base capture, native tests and container
restrictions are unchanged. An actual foreign-directory-ownership Docker test
failed against the old image and passed against the corrected image with all
capabilities dropped. All 11 targeted tests (including both opt-in Docker
cases) pass. Independent review found no blockers.

A copy of Claude's retained workspace passed the original native grader in
17.385 seconds: 45/45 new and 979/979 existing tests. Original measured evidence
remains failed and unchanged; 14 artifact hashes were rechecked.
All eight rebuilt verifier images passed all 40 native reference checks and
updated source-binding validation. Fresh launch inputs are prepared under
`scratch/v1-validation-verifier-git-safe-20260910`; its preparation sentinel,
reference-summary.json, execution.json and validation/run/state.json record
completion and live progress. Do not resume the old failed root.

## Z.AI pin implemented; fresh validation launch — 2026-09-09

The maintainer approved pinning `z-ai/fp8`, disabling fallbacks, and running
one validation cell at a time. S0/S1/S7/S6 extend the existing routing policy
through raw C4 metadata, proxy enforcement, launcher, validation/archive
identity, and separate report labels. Existing Relace exclusion is retained.
Independent review found no blockers. Full offline verification passed 633
tests (one existing opt-in Docker skip); all typechecks and lint pass.

Both the earlier five-request check and a fresh proxy-enforced five-request
preflight passed all three API formats. Evidence is retained privately under
`scratch/single-provider-zai-launch-preflight-20260909`. Fresh copied task
inputs and the launcher are under `scratch/v1-validation-zai-pinned-20260909`;
its execution.json and validation/run/state.json are authoritative for live
progress. The old failed roots remain unchanged and must not be resumed.
The original $22.40 shared authorization and conservative lifetime stop
$29.903752101 remain in force. v1.0 and full validation remain incomplete.

## Relace exclusion implemented; accounting still blocked — 2026-09-08

The maintainer explicitly approved excluding Relace consistently across all
six CLIs, retaining the model, tasks and verifiers and collecting fresh
validation. Implementation was completed one stage at a time: S1 transport,
S0 raw routing contract, S7 runner/validation/archive binding, and S6 separate
report groups. Official launchers now default to
`AOB_IGNORED_PROVIDERS=relace`. Explicit empty selects the original condition;
it cannot reuse routed validation or resume routed matrix state.

The optional raw C4 policy is included in measurement identity. All three model
protocols merge exclusions without changing other JSON tokens; malformed,
encoded, oversized and ambiguous routing requests are refused before upstream.
Routing buffers up to 16 MiB before submission; this added proxy work remains
inside C1 request intervals, as disclosed in METHODOLOGY. Counters are never
clamped or fabricated. Full offline verification passed 629 tests, with one
existing opt-in Docker skip; typecheck, lint and independent reviews pass.

The paid exclusion probe confirmed GMICloud then DeepInfra served the requests,
not Relace. GMICloud returned output 61 / thinking 57; DeepInfra returned output
70 / thinking 81, causing correctly unavailable C1 usage. Delayed generation
lookups confirmed both provider identities and the inconsistent DeepInfra
counters. Private proof is in
`scratch/anthropic-usage-interruption-20260908/relace-excluded/verified-summary.json`.
This proves exclusion works but does not resolve the accounting prerequisite.
Do not silently exclude additional providers or relax token invariants.

Fresh byte-copied task inputs and an exclusion-configured launcher are prepared
under `scratch/v1-validation-relace-excluded-20260908`. Its explicit accounting
failure marker and zero preparation-only cap prevent starting a paid matrix.
The launch guard was exercised without API requests. No full validation has
restarted and no paid process remains active. Original failed evidence remains
unchanged. At 15:48:46Z provider lifetime usage was $10.533741968, leaving
$19.470010133 against the original baseline plus $22.40 shared authorization.
Refresh that same budget before any future paid work. v1.0 is not complete.

## Provider accounting interruption after verifier rebuild — 2026-09-08

All eight verifier images were rebuilt on the exact previous base image IDs
with the S3 ownership helper correction. All 40 native reference checks and
prepared source-binding checks passed. Fresh validation under
`scratch/v1-validation-ownership-fixed-20260908` passed Pi/PSD in 2618.768
seconds, with native verification in 9.875 seconds and $0.162024595 C4 spend.

Claude/PSD then recorded two completed HTTP 200 model requests with unavailable
usage and `usage_lookup: http_error`. The owned cell was stopped to investigate
before more spending on incomplete accounting. The runner closed at 09:39:27Z
with one done cell, one failed cell, and 46 pending; 16 nonworkspace artifact
hashes are retained. Original records remain unchanged and this root is not
eligible for capped resumption or campaign validation.

Private wire diagnostics in `scratch/anthropic-usage-interruption-20260908`
reproduced inconsistent provider counters: Relace returned output 16 / thinking
17 at a token cutoff, then output 124 / thinking 143 on a natural `end_turn`.
The first generation lookup returned 404 immediately and 200 later, but its
native counters retained the inconsistency. The campaign's full response bodies
were not captured, so this is a reproduced current provider problem, not proof
of the exact cause of both campaign gaps. Do not clamp or fabricate counters,
relax C1 invariants, or silently change provider routing. A routing decision is
pending with the maintainer; further full validation is paused during diagnosis.

Provider lifetime usage before the first probe was $10.533671288, leaving
approximately $19.47 against the original $7.603752101 baseline plus $22.40.
Refresh the shared balance before any further paid work. The host prerequisite
is resolved; implementation remains at `25a07ba`, and v1.0 is incomplete.

## AC-powered validation and native patch-capture fix — 2026-09-08

The maintainer connected AC power and confirmed the host would remain awake,
resolving the host prerequisite described below. Fresh validation under
`scratch/v1-validation-ac-powered-20260907` passed Pi/PSD in 2473.957 seconds
with $0.128095935 recorded spend. Claude/PSD completed its adapter in
4004.567 seconds with all 114 model requests priced and correctly identified
($0.63928657), then native patch capture failed before tests: tar could not
restore macOS uid 501/gid 20 under the verifier's dropped capabilities.

The S3 fix extracts without restoring owner IDs. Its real offline Docker
regression failed before the fix and passes afterward; all 10 focused tests,
lint, and independent review pass. A separate copy of Claude's retained
workspace passed the native verifier in 9.934 seconds (45/45 new tests and
979/979 required existing tests). Original C4/C1/ledger/workspace evidence,
16 nonworkspace artifact hashes, and prepared source files are retained.
The original C4 remains `verify_error`, with one done cell, one failed cell,
and 46 pending. Rebuild prepared verifier images before further validation.

Provider lifetime usage at 08:30:08Z was $10.358557352, leaving $19.645194749
against the original baseline plus $22.40 shared authorization. Refresh this
balance before any next paid attempt. All existing validation, calibration,
source-review, and release gates remain in force; v1.0 remains incomplete.

## Paid validation requires a stable awake host — 2026-09-07

The Messages usage fix on `a709d28` held through a complete Claude/PSD control:
131 model requests retained usage. The CLI exited successfully, but one
response reported served model `unknown`; the pinned-model gate correctly
rejected that run. A separate native-verifier check on a fresh copy passed
45/45 new tests and 979/979 existing tests. It does not replace the original
C4 or satisfy calibration for the rejected run. Private evidence is under
`scratch/claude-usage-control-20260907`.

Two subsequent full validation attempts each passed Pi/PSD, then were
interrupted by confirmed Mac lid-close sleep during Claude/PSD:

- `scratch/v1-validation-accounting-fixed-20260907`: Pi passed in 2882.728
  seconds, native verification took 13.548 seconds, and C4 spend was
  $0.19647844. Clamshell sleep from 20:46:28 to 21:07:51 PDT interrupted a
  model request; its usage is unavailable.
- `scratch/v1-validation-awake-20260907`: Pi passed in 3077.464 seconds,
  native verification took 10.800 seconds, and C4 spend was $0.212495045.
  `caffeinate -i -s` was active, but lid-close sleep still occurred at
  22:15:01–22:15:54 and 22:16:29–22:24:05 PDT. The owned Claude cell was
  stopped; three model requests have unavailable usage.

Both roots retain one done cell, one failed cell, 46 pending cells, original
C4/C1/ledger evidence, sleep logs, and 17 nonworkspace artifact hashes. Neither
is eligible for a campaign or capped resumption. No paid runner remains active.
Do not start another paid attempt until an uninterrupted awake host is
available; keep the lid open and retain idle-sleep protection during the run.
The first 60-second post-run verifier diagnostic also overlapped a recorded
lid-close sleep; its fresh no-network repeat passed in 10.159 seconds. There
is no reproduced verifier-timeout defect requiring a code change.

At 2026-09-08T05:25:29Z, provider lifetime usage was $9.453456599. Against the
original $7.603752101 baseline and additional $22.40 authorization, $20.550295502
remains. Refresh that same shared balance before a future launch; do not reset
the allowance. Implementation remains at the verified `a709d28` code baseline
(622 offline tests, typecheck, lint and independent review passed).

A maintainer clarification is pending on whether a normally completed,
fully measured attempt whose task verifier fails should block pre-campaign
validation. The current gate still requires all 48 first-attempt task passes.
No gate has changed: accounting, model identity, source review, all-task
two-CLI calibration, and official release checks remain required. v1.0 and
the 240-cell official campaign are not complete.

## Funded extended validation and Messages usage fix — 2026-09-07

The maintainer authorized the available $22.40 balance and a high timeout to
finish v1.0. Fresh validation uses the source-supported 10800-second extended
preparation, all eight selected tasks and six tools. The shared provider
lifetime baseline is $7.603752101; all subsequent probes, validation attempts
and any campaign draw from the same additional $22.40 authorization.

The first cell, Pi/PSD, passed in 2035.131 seconds (33m 55.1s), with native
verification in 10.853 seconds and estimated spend $0.146537125. Claude Code
then returned seven successful model responses whose usage the parser rejected.
The owned Claude cell was stopped for diagnosis; the retained matrix has one
pass, one failed/null-spend cell and 46 pending cells. Original records and
17 nonworkspace artifact hashes remain under
`scratch/v1-validation-extended-20260907`. Do not resume its null-spend state.

A tiny live probe reproduced documented nullable optional cache counters in
Messages responses. S1 now accepts those nulls as omitted, preserving observed
stream counts and strict required-total/numeric checks. All 622 offline tests,
typecheck, lint, independent review and a fresh live proxy usage smoke pass.
See `S1-anthropic-null-cache-usage-plan.md`. The completed Claude/PSD control
and subsequent validation attempts are recorded above.
The existing release gate still requires all 48 first-attempt validation passes,
all-task two-CLI calibration and source approval. No official campaign or v1
release evidence has been created.

## Sequential Codex control complete — 2026-09-07

Codex completed PSD Tools in 765.178 seconds (12m 45.2s), within the same
1800-second extended window used for the successful Pi diagnostic. Its native
verifier ran normally and rejected two split-fade assertions: 979/979 existing
tests and 43/45 new tests passed. This is a patch failure, not an exhausted
timeout. All 45 requests have usage and C4 estimated spend is $0.053059125.
The attempt stopped on failure; no automatic retry or three-hour run followed.

Private terminal evidence, hashes and the combined calibration summary are in
`scratch/timeout-probe-codex-20260907`. Both run records validate without issues,
but Pi is the only passing CLI, so the task still lacks two-CLI calibration.
The final provider lifetime snapshot is $7.600530446, leaving a conservative
$2.39 reserve for further work inside the existing $10 authorization. It does
not establish funding for the full 48-cell validation. All-task calibration,
source approval, passing validation and the official campaign remain pending.

Fresh verification on runner commit `61c6621` passed all 614 offline tests,
strict typecheck, lint and the S8 launch check with `status: pilot`. No measured
run is active. The 1800-second window is a candidate for further validation;
this control supplies no reason to spend on a longer timeout for the same
completed patch. See `S3-timeout-parallel-diagnostic-plan.md` for the evidence.

## A passing timeout window established — 2026-09-07

The fresh 1800-second Pi/PSD diagnostic completed in 1727.709 seconds (28m
47.7s) and passed the native verifier in 9.960 seconds. All 92 C1 requests have
usage; C4 estimated spend is $0.13927733. The 900-second control timed out and
retained a normal C4 plus a complete 1,002,364,223-byte log. Its interrupted
last request leaves spend null, so the existing capped/report gates stop it.
Checksummed private evidence and the comparison are under
`scratch/timeout-probe-streamed-20260907`.

The final S5 follow-up also separates native verifier workload output from
small Docker control capture. Eight new regressions and independent review
cover large logs, legacy metadata, stream-boundary redaction and private
stderr-spool cleanup; all 153 runner tests and typecheck pass. The sequential
Codex control has passed no-spend preflight under
`scratch/timeout-probe-codex-20260907` and still requires its fresh reservation
immediately before launch.

The successful root includes an unchanged copy of its prepared source manifest.
The calibration-summary validator accepts its Pi/PSD completion with no issues;
one task on one CLI is still short of the all-task/two-CLI gate. Keep its
concurrent timing separate from official sequential performance evidence.
The next bounded control is Codex/PSD at the identical 1800-second `extended`
preparation, $1 recorded cap/$1 estimate, fresh provider reserve, separate
output/ledger, and no automatic retry. The full 48-cell validation, all-task
calibration, source approval and official campaign remain pending. A three-hour
preparation passed no-spend preflight; a paid Pi attempt is unnecessary now.

## Large-log archive handling corrected — 2026-09-07

The separate S6 follow-up streams release log redaction/copying and archive
hashing with fixed-size descriptor reads. Existing secret-matching rules and
archive identities are preserved, including failed long-whitespace candidates,
UTF-8 and short writes. Guarded descriptors retain the file/containment checks.
The full freeze/binding probe verified over 536 MB with a matching output hash
and bounded memory. See `S6-streamed-release-logs-plan.md` for test and review
evidence. This does not change release eligibility or publish new results.

The fixed-runner 900/1800-second retries started in parallel under
`scratch/timeout-probe-streamed-20260907`, from S5 commit `8c6ec93`. Fresh
no-spend preflight passed for both. A conservative reserve of all prior key
usage left $2.64 inside the existing $10 authorization, split into $1.32 caps.
Both logs grew past the original string limit while the runners retained
bounded memory. The 900-second retry now has a normal timeout C4 and a complete
1,002,364,223-byte stdout log; verification was skipped because the adapter
timed out. Its final interrupted request lacks usage, so spend remains null and
capped continuation stops correctly. The 1800-second retry passed as recorded
above; both private sanitized previews retain their distinct evidence status.

## Run-log failure corrected — 2026-09-07

Both authorized Pi/PSD timeout diagnostics reached their 900/1800-second windows
and failed in the runner's whole-stdout conversion with `ERR_STRING_TOO_LONG`,
before normal C4 or verifier output. The 15-minute run retained 38 completed C1
requests; the 30-minute run retained 66. All captured requests have usage. Their
state, C1, workspaces and ledgers are preserved. A private Docker capture retained
955,471,503 bytes from the 30-minute attempt. These are failed harness attempts,
not task passes or evidence for choosing a final benchmark window.

`S5-streamed-run-logs-plan.md` implements private, incremental redacted logs for
host/Docker execution and filesystem artifact copies. A local output probe above
Node's string limit passed full-file hash verification with bounded memory.
Tests and independent review cover split secrets/UTF-8, control-output bounds,
timeout tails and file lifecycle. The next step is fresh timeout diagnostics
using the fixed runner, inside a freshly checked conservative reserve under the
existing $10 authorization. No retry may overwrite the original failed attempts.

## Timeout experiment authorized — 2026-09-07

The maintainer has now authorized testing 15-minute, 30-minute, and parallel
execution, with a larger timeout if needed. The earlier unanswered regime
decision is resolved: determine a practical window empirically. The existing
`long` and `extended` paths already support these durations, including a
10800-second source-declared ceiling. The $10 spending authorization remains
separate and unchanged.

See `S3-timeout-parallel-diagnostic-plan.md`. Two fresh Pi/PSD attempts use
separate preparations, outputs and ledgers at 900 and 1800 seconds. Their
parallel execution is diagnostic and will not be pooled into sequential v1
timing results. Source/native-verifier/polarity checks and incomplete-spend
guards remain enabled. Private evidence is under
`scratch/timeout-probe-20260907`; the original failed validation is preserved.

## Release continuation — 2026-09-07

The working branch contains the independently reviewed proxy and runner fixes.
A fresh no-network `node scripts/s8-launch-check.mjs` passes with `status: pilot`;
the only published evidence remains the verified nonofficial pilot archive.
The retained validation state is still one failed cell and 47 pending cells.
No new model call or official run has been started.

A read-only provider key-usage query now bounds prior charges conservatively.
Private records `provider-key-usage-diagnostic-20260907.json` and
`validation-budget-reserve-20260907.json` are retained under
`scratch/v1-validation-20260906`. Reserving the configured key's entire lifetime
usage, rounded up, leaves a smaller possible new-attempt cap inside the already
approved $10 total. This operational reserve includes unrelated earlier usage;
it is not a reconstructed C4 cost or a substitute for official Activity
reconciliation. Refresh the bound immediately before any new attempt and retain
the failed run unchanged. Do not resume its null-spend state or relax its gates.

The timeout decision at this earlier checkpoint is superseded by the explicit
15-minute/30-minute/larger-window authorization above. Passing
validation/calibration, the official tool batches, source
sign-off, Activity/anomaly review, and frozen v1 release evidence remain required.

## Validation attempt — 2026-09-06

The maintainer approved a $10 recorded-spend cap for validation. The fresh
no-spend preflight passed, then `scratch/v1-validation-20260906` stopped at its
first cell: Pi on PSD Tools timed out after 300 seconds, before verification.
The remaining 47 validation cells and the grand campaign were not started.

One generation consumed about 184 seconds. The C1 stream lacks usage for that
completed generation and for a final aborted request, so C4 spend remains null;
state `spentUsd: 0` is not evidence of zero cost. Read-only provider lookups
confirmed $0.011352925 across 19 identified generations, with the final aborted
request unreconciled. Raw C1/C4 records remain unchanged. Diagnostic summaries
are in that run root. The accounting fixes below are complete; review
the short timeout regime before retrying. The existing $10 authorization remains
in force, with prior spend included. Do not silently switch regimes or start the
grand campaign from failed validation.

Independent analysis found 295.911 seconds of completed model requests within
the 300.357-second adapter window (98.5%). All 36 local tool calls completed;
the working tree has no source edits. This is an exhausted configured timeout,
not evidence of a Pi adapter hang. An offline 2,202,752-byte SSE reproduction
separately confirmed that the proxy's cumulative 2 MiB capture cap loses final
usage while forwarding the response correctly. The original wire bytes were
not retained, so this reproduction supports but cannot prove that exact byte
threshold was crossed in the failed run. See
`S1-validation-stream-accounting-plan.md` for the accounting fixes.

Implemented fixes retain usage with bounded per-event SSE parsing and preserve
completed request identity/timing when cancellation interrupts a request. The
separate `S5-failed-attempt-cost-completeness-plan.md` keeps potentially billable
failed attempts from disappearing out of host, Docker, and interrupted-resume
spend totals. Recovered requests can still reach verification; incomplete spend
blocks capped continuation. Both stages passed independent review, 448 workspace
tests and 135 script tests, strict typecheck, lint, and diff checks. No additional
provider calls were made. These fixes do not change the five-minute regime or
turn the retained failure into passing validation. Reconcile the final aborted
charge and make any regime change explicit before retrying.

The private run root retains `diagnosis.md`,
`retained-artifact-manifest.json`, original C1/C4 and ledger/state records,
adapter stdout/stderr, verifier records, and the post-run workspace. The
manifest records original artifact hashes. Do not rewrite original evidence
with usage reconstructed from CLI output or later provider diagnostics.

## Current status — 2026-09-05

This section supersedes the historical handoff below. The authoritative official
profile is `s7-official-tool-scope.json`: claude-code, cline, codex, hermes, pi,
and qwen. The matching eligibility manifest accepts all six. Claude's old
protocol exclusion was superseded by the September 4 successful smoke and
`/v1/messages` proxy correction; Aider and OpenCode exclusions are explained in
the scope file. The completed legacy pilot has 192 cells (four repetitions).
New tool-by-tool campaigns use five repetitions: 240 cells, preceded by 48
separate validation cells. The selected eight DeepSWE tasks remain unchanged.

The new `tool-batches-v1` implementation uses one campaign state and total
budget with a separate cap and ledger segment for each tool invocation.
Validation evidence is reread before every batch and archived with the combined
report. Source/calibration, Activity, anomaly and archive gates remain enabled.
See `S7-tool-batch-campaign-plan.md` and `S7-runs-protocol.md`.

The new workflow passed 406 workspace tests, 135 script tests, strict typecheck,
lint and independent spend/archive reviews. Final Cline/Pi task-image packaging
also passed its four focused tests and real offline probes. The ready local
preparation is `scratch/v1-validation-tasks-20260905`; all 48 task-specific CLI
images passed version checks, refreshed PSD/Ink native references passed five
samples each, and the full one-repetition diagnostic preflight passed. Source
`scratch/v1-validation-config.sh` to select these prepared inputs. The later
September 6 attempt and continuing approved cap are documented above.

The completed local fixture pilot in `scratch/pilot-v2/state.json` records
192 done cells and $0.450821265 of recorded spend. A fresh report generated from
its results accepts all cells and shows 32/32 verifier successes for each tool.
The README now contains the six-tool pilot table generated from the verified
nonofficial archive at `evidence/pilot/pilot-report.tgz`. This replacement
contains 192 sanitized raw C4 records, C1 events, provenance, review notes,
checksums and report files; the previous download contained only rendered
report files. Both timing outliers are retained with evidence-based explained
dispositions. The archive marker is explicitly `official: false`.

The pilot publisher requires an explicit state path and validates coverage
against that run's persisted Cartesian definition. See
`S8-pilot-coverage-binding-plan.md`. Exercising the actual freeze found and
fixed an explained-only review rejection in the packaging CLI; see
`S7-explained-anomaly-freeze-plan.md`. The freeze and archive verification now
pass with all original cells retained. No provider run was started.

Next actions:

1. Completed: retain both pilot outliers, freeze and verify raw evidence, and
   update the README from that frozen report.
2. Continue the already selected eight-task DeepSWE suite. The September 3
   license evidence is complete; reconcile remaining review flags with that
   evidence. Do not restart source selection or license collection. The user
   reaffirmed the selection and prior license checks on September 5.
3. Run the one-repetition validation with an explicit approved spend cap. If it
   fails, retain the evidence and fix the cause before starting a grand run.
   Obtain two-CLI calibration evidence and maintainer source sign-off before
   the official campaign.
4. Run each tool's five-repetition batch with explicit per-tool and total caps,
   then complete Activity reconciliation, anomaly review, the combined verified
   archive, and S8 human publication deliverables.

No new provider run was started in this audit. Historical credit estimates and
provider latency observations below are dated evidence, not current balances
or a funding authorization. The v1 goal remains incomplete.

## Historical handoff (superseded where noted above)


**Updated:** 2026-09-02

**Purpose:** This is the current engineering handoff for completing the benchmark. It distinguishes implemented and verified machinery from release evidence that does not yet exist. The design and roadmap remain authoritative; this file only records current state and execution order.

## Current outcome

The measurement instrument is substantially implemented: proxy, contracts, six retained candidate adapters, Docker isolation, runner, reporting, DeepSWE source preparation, budget accounting, anomaly replacement handling, and release/archive guards all exist. The official GLM Flash/OpenRouter profile is five tools (`codex`, `hermes`, `aider`, `opencode`, `qwen`); Claude Code is explicitly excluded after the real Anthropic-protocol 404 and remains in the retained S2 evidence. The repository is not release-ready because the public task calibration and official contiguous run have not succeeded. The S7 host-window evidence chain is now implemented and guarded, but it has not yet been exercised by a paid official run.

The latest full verification run passed all workspace tests and 55 script tests;
typecheck, lint, shell syntax, and `git diff --check` are required again after
each final patch. Recent provider-backed diagnostics are retained separately
and are never treated as official results.

The S7 official scope follow-up is complete and verified. The launcher and
preflight derive the five-tool profile from `plans/s7-official-tool-scope.json`
and use the matching five-record eligibility manifest. Freeze archives that
scope and its checksum; archive verification reconstructs the archived tool
matrix, model, condition, calibration identity, and randomization blocks without
depending on a later checkout's scope file. A no-spend preflight against
`scratch/deepswe-eight-current` accepted all five eligible combinations and
stopped on the expected incomplete source-review flags. The current full check
is 55 script tests plus all workspace tests, with typecheck, lint, shell syntax,
and diff checks clean.

## Implemented and verified

- Five official pinned adapters use `z-ai/glm-5.3-flash` through the common proxy route; the six-candidate S2 evidence remains available for audit.
- S7 now has a provider-independent eligibility gate backed by
  `plans/s7-official-eligibility.json` and the scope declaration; it fails
  closed before credentials or Docker when a reviewed adapter/model/protocol
  combination is missing or ineligible. The retained six-tool Flash/OpenRouter
  evidence in `plans/s2-eligibility.json` intentionally records Claude's real
  Anthropic-protocol `404 unrecognized_model`; the official profile excludes it.
- C1–C4 validation, monotonic timing, proxy calibration, union model-time derivation, mixed-visibility reporting, and fail-closed report loading are implemented.
- S6 reports the existing union-based parallelism factor in both headline and per-task tables; failed identifiable model attempts count as turns while successful usage remains the only source for token and cost totals.
- S6 also reports the median C1 first-byte latency per run/task; it is explicitly byte-level (`t_first_byte − t_req_start`) and is not labeled as semantic token latency.
- Network-failed requests remain in the model-time union, but proxy-generated close markers are excluded from first-byte samples; report tables and the unpublished README fixture are checked for rectangular Markdown shape.
- Docker cells use isolated networks, proxy-only provider access, digest-pinned images, sequential execution, block randomization, one retry, quarantine, resume, and a recorded-spend cap.
- DeepSWE source manifests, pinned revisions, verifier polarity, workspace sanitization, image provenance, and short/long regime separation are implemented.
- S7 preflight now also performs a no-spend interactive container/host epoch handshake in `aob-base:s2` and requires ≤10 ms estimated offset with ≤20 ms retained minimum round-trip before measured cells.
- The official launcher now applies the shared credential-free source-lineage
  policy before reading `.env`; direct preflight reuses the same helper, and
  restricted DeepSWE lineage is covered by four no-spend ordering regressions.
- The clock gate uses a conservative `|offset| + ceil(RTT/2)` bound and a process-tree timeout; the report renderer also validates headline Markdown column parity.
- S7 freeze validates the matrix, host identity, source manifests, image provenance, state/result identity, anomaly dispositions, replacements, spend reconciliation, archive checksums, secret redaction, and immutable output paths.
- Activity Export summaries bind role- and path-labelled current/retry/replacement records, original state bytes, strict UTC windows, and evidence-derived local accounting. Freeze recomputes local counts and spend rather than trusting summary declarations.
- Replacement originals are retained under provenance, selected replacements become report-facing results, and the mapping is checked against runner state and review records.
- Portable archive binding is recomputed from extracted sanitized bytes, and the archive Activity binding is recomputed from sanitized C1/C4/state evidence. Official freeze snapshots validated summaries/manifests and recomputes the complete Activity summary from the private raw CSV; raw CSV bytes and paths are never archived.
- The runner now writes `provenance/run-window-ledger.json` before the first measured cell, records distinct current/retry scheduler intervals on a runner-process monotonic anchor, binds the final state/result tree, and captures fresh host facts at session end. Official freeze requires one closed segment and rejects open/interrupted or resumed multi-segment sessions; archive verification revalidates the sanitized ledger.
- Official ledger validation now compares the exact current/retry attempt multiset with runner state, rejects unknown cells, and both freeze and archive verification enforce that comparison.
- Calibration summaries now group by task source/repository/revision, regime, model, condition, and price book, so incompatible runs cannot form a false two-CLI pass. Recovered provider failures are allowed through verification when the CLI exits successfully with at least one successful response; all-failed sequences remain adapter errors.
- Frozen archives carry an explicit `provenance/release-manifest.json`; structural verification accepts dry-run archives, while `s7-verify-archive.sh --official` requires the official marker. Official freeze invokes that stronger check.
- Official replacement reruns now require a separately closed ledger, bind its session/path to rerun state, require exact retry evidence coverage, compare the replacement host to the primary host, and rebind the sanitized ledger after copying. Official archive verification always requires and rechecks the primary ledger, even if mutable state metadata is missing.
- The runner now accepts an explicit safe `--run-id-suffix` for replacement
  sessions; it preserves task/tool/condition/repetition identity while
  emitting a distinct C4 run ID. The official archive verifier also binds a
  resolved replacement archive to the retained original anomaly evidence.
- OpenCode now runs with `--format json`; its completed `tool_use` records are parsed from epoch milliseconds into adapter-monotonic C3 intervals and propagated through Docker artifacts. A bounded real Flash smoke produced four positive-duration events (`glob`, `read`, `write`, `bash`) and six successful proxy responses; OpenCode remains `partial` until child-session and complete-stream coverage are established.
- Claude Code's pinned recipe now maps the requested provider model through
  `ANTHROPIC_*_MODEL` environment variables instead of the CLI's native
  `--model` validator, and disables its unknown-model context suffixes. A local
  Anthropic-compatible capture proved the exact `z-ai/glm-5.3-flash` request.
  OpenRouter returned 404 `unrecognized_model` for that model on the Anthropic
  Messages protocol in the real rerun, so Claude is protocol-ineligible for
  this pinned model rather than silently falling back.
- Aider now stages only deterministic source/config/text inputs under a 3 MB
  byte budget, excluding lockfiles and repository noise. Its rebuilt real
  DeepSWE rerun passed context admission and timed out on the task; it did not
  reproduce the prior 1.88M-token context error.
- The runner’s second preparation pass now rehydrates the exact deterministic
  DeepSWE Git base recorded in `task.source.base_revision`. Before this fix it
  stripped `.git` while retaining the revision, so the native verifier could
  exit before judging a model patch. The new task-source regression proves
  `git diff --binary <base>` works after a prepared-workspace edit and rejects
  an unreproducible base with a typed configuration error.
- DeepSWE verifier patch capture now compares the final visible workspace with
  the immutable `/app` base snapshot in the verifier image. A CLI may create a
  branch, commit, or rewrite/remove its workspace Git history without causing
  the verifier to lose the model patch; additions and deletions are retained,
  while `.git` and adapter-private configuration remain excluded.
- The rebuilt one-task long-regime DeepSWE/Codex verifier image passed all five
  source-owned reference polarity replays after this boundary fix. This is
  preparation evidence only; it does not approve the source or qualify model
  calibration.
- Methodology terminology now matches S6: `turns` means identifiable model
  attempts, while usage, cache, cost, and token-floor accounting remain based
  on successful responses. A documentation regression protects this wording.
- The corrected immutable-base/model-patch boundary was exercised in a real
  long-regime DeepSWE control on 2026-09-01. Five source-owned reference
  polarity replays passed; Hermes and Codex both timed out, and the permitted
  Hermes retry ended with unavailable terminal usage. The retained state
  reconciles to `$0.063902975`; no verifier pass or calibration qualification
  was claimed.

## Latest completed integrity follow-up

The 2026-08-31 Claude Opus and GPT Sol release reviews found and closed the
following mechanical defects before any further paid run: completed C4 records
now require zero adapter and verifier exits; calibration summaries validate
their C4/C1 files, verifier log, DeepSWE source manifest, and image provenance
before setting `passed`; malformed Codex/OpenCode structured output becomes a
failed adapter result eligible for the normal retry/quarantine path; OpenCode
prompts terminate option parsing and its epoch events cannot map before the
adapter anchor; the DeepSWE 8–10 selection gate now accepts 9/10-task subsets
with at least four tasks in each audited language; the report CLI now honors a
sole supplied results directory; and the old low-effort/budget flags were
removed from the S2 Docker probe. Ten historical Codex shell snapshots that
contained provider credentials were removed from ignored `scratch/` artifacts.

OpenRouter key rotation is still required because the credential appeared in
historical artifacts and review transcripts. No key is tracked in Git or sent
to CI.

The 2026-08-31 Claude Opus review also found that a prepared manifest could
forge its copied review metadata while retaining the source-manifest hash.
Prepared/source review fields are now compared exactly. Official freezes also
retain the hashed review evidence as `provenance/review-evidence.json`, and
archive verification checks its identity and digest independently.

The calibration-integrity gap is now closed mechanically: a complete review must
name a SHA-256-bound attestation, S7 recomputes it from the calibration summary
and retained run files before credentials or Docker, and official freeze/archive
paths retain and revalidate the sanitized attestation. This still does not make
the current timeout-only DeepSWE diagnostics a pass; real two-CLI evidence and
maintainer approval remain open.

The attestation archive check was independently reviewed and corrected: it now
binds qualifying runs to the archived calibration summary, not to potentially
colliding official result IDs. The summary and attestation are both retained
under `provenance/`; the run-file digests remain commitments to the pre-freeze
calibration evidence because release run JSON is sanitized.

The next independent integrity review found two additional archive-boundary
defects and both are now fixed. Calibration attestation discovery skips only
private `workspace/` subtrees, so Docker dependency links cannot invalidate a
valid result tree while evidence-path symlinks remain rejected. Official archive
verification now recomputes `source_manifest_sha256` with the task-source
canonicalization and compares it to the archived task manifest. The attestation
also binds a stable canonical digest of source task content (excluding review
metadata, which links back to attestation bytes), so recomputing generic and
task-manifest bindings cannot conceal a changed source task.

`plans/S7-activity-binding-plan.md` was extended after two independent GPT Sol audits. The completed follow-up now provides:

- a separate rerun state file whenever anomaly replacements are selected;
- independent reconciliation and hashing of original and rerun states;
- exact equality between reviewed replacement IDs and the rerun results/state matrix;
- preservation of sanitized rerun state and retry evidence in the archive;
- the $1,500 cap applied to combined original and rerun spend;
- rejection of Activity exports with zero rows for the selected model.

These changes are implemented. Portable archive binding and private raw-export recomputation are now implemented as well: every sanitized archive carries a recomputable path-and-byte manifest, and official freeze reruns the complete Activity cross-check from the private CSV before accepting the sanitized summary. The raw CSV and its path are not archived. The official-style fixture covers missing raw input, stale provider data, stale binding, out-of-window data, successful 160-cell freeze, and archive exclusion.

## Independent review findings

Two GPT Sol reviews of the current Activity/freeze work agreed on the following issues:

1. Replacement interrupted spend needs its own runner state and state hash.
2. Rerun state/retry provenance must not be deleted during archive construction.
3. Unselected reruns must be rejected or fully accounted; the chosen policy is exact reviewed-set equality.
4. The official cap must cover combined original and rerun state spend.
5. A zero-matching-row provider export must fail even when local spend is below the `$0.01` tolerance floor.
6. Portable semantic archive binding was added and is recomputed after sanitization; the adversarial fixture covers post-freeze byte mutation.
7. Freeze now recomputes the provider-side summary from the private raw export, because a sanitized summary can otherwise be coherently falsified; the official-style fixture covers missing and stale raw evidence.
8. The run window should ultimately bind every billable request and state-only interrupted attempt, not only completed adapter envelopes.
9. Replacement mappings must require the review and exactly match anomaly originals, published replacements, rerun provenance, and both states.
10. Provenance allowlisting should be generated from declared evidence rather than broad recursive path patterns.
11. Checksum manifests now accept only safe archive-relative regular files, and invalid UTF-8 Activity exports fail rather than receive lossy text hashes.
12. GPT Sol and Claude Opus reviews found and closed the ledger's default-clock projection bug, error masking path, closed-ledger reopening issue, hardcoded state path, and raw-versus-portable binding ambiguity. The remaining interrupted/replacement policy is intentionally fail-closed rather than inferred.
13. A further GPT Sol review found calibration identity mixing, incomplete retry coverage, release-mode ambiguity, and recovered-provider classification gaps; all four are now covered by code/tests or explicit official-mode gates.

## Latest replacement-ledger review

A fresh GPT Sol audit found three high-severity gaps in the initial replacement
patch: an archive verifier could omit the primary ledger, a rerun ledger session
ID was not cross-bound to rerun state, and retained retry artifacts were not
compared with state retry counts. All three are now fixed and covered by the
runner/release verification suite. The review also identified medium-strength
hardening opportunities—attempt-to-C4 interval semantics, explicit non-overlap
between primary and replacement windows, and a functional official replacement
fixture. The attempt-to-C4, non-overlap, and official replacement follow-up
are now implemented and covered by the runner and official 160-cell no-spend
fixtures. The runner also emits distinct replacement IDs with
`--run-id-suffix`. These checks are not used to
authorize a release; the official freeze remains fail-closed and no paid run
is permitted until the source and window gates pass.

## Release blockers outside the current patch

### Adapter/model eligibility

- The superseded six-tool shape was not executable with the selected Flash
  model because Claude Code's Anthropic Messages route is ineligible.
  `s7-official-tool-scope.json` now makes the explicit five-tool decision, and
  preflight derives the launcher and freeze matrix from it before credentials
  or Docker.

### Public task evidence

- DeepSWE is selected, but no task has passed the required two-CLI calibration.
- A corrected-boundary long-regime control for
  `cattrs-partial-structuring-recovery` ran on 2026-09-01 with Codex and
  Hermes, one planned attempt per CLI, Flash, Docker isolation, and a
  900-second bound. Source-owned polarity passed, but both CLIs timed out;
  Hermes' initial attempt had `$0.01333927` known spend, Codex had
  `$0.050563705`, and the retry's terminal usage was unavailable. The runner
  stopped fail-closed at a reconciled `$0.063902975`. This validates the
  corrected Git boundary and spend guard, but remains diagnostic only.
- An earlier Hermes-first one-task GLM Flash long-regime diagnostic for
  `cattrs-partial-structuring-recovery` was run on 2026-09-01 with Hermes first
  under the 900-second bound. Hermes timed out with an unavailable final
  provider-attempt spend, so the runner fail-closed before starting Codex;
  recorded spend is `$0` in the retained state. This confirms the diagnostic
  path and does not qualify the task or establish two-CLI calibration.
- The latest bounded diagnostic (`ts-pattern-match-each`, Codex + Hermes,
  Flash, short/300 s, one retry) ended with four timeouts and no verifier pass;
  reconciled spend was `$0.038535125`. The evidence is retained under
  `/tmp/aob-calibration-ts-pattern.drQYrW` and remains diagnostic only.
- A controlled long-regime Codex-only run of
  `cattrs-partial-structuring-recovery` at 900 seconds timed out on both the
  initial attempt and one retry. It recorded 63 and 78 successful provider
  responses, with total spend `$0.119788805`; no verifier pass occurred. This
  is diagnostic evidence only and does not establish a DeepSWE calibration
  pass.
- The matching OpenCode-only long-regime run at 900 seconds recorded 19
  provider events (18 successful with usage and one final aborted response
  without usage). The runner correctly refused a retry because complete spend
  was unavailable; no verifier pass occurred. This is diagnostic evidence
  only and does not establish calibration or full OpenCode visibility.
- A separate OpenCode short-regime bug-fix candidate,
  `happy-dom-abort-pending-body-reads`, timed out on both the initial attempt
  and one retry. It was quarantined at total recorded spend `$0.01764666`,
  with 13 successful responses on the final attempt and no verifier pass. The
  evidence does not qualify the short regime; further candidate swaps should
  stop unless the model or regime changes.
- A fresh one-task Hermes/Flash diagnostic for
  `superjson-error-stack-serialization` completed with one timeout and one
  verifier error at `$0.015730495` total recorded spend. Its final and retry
  C4 records now pass calibration-summary provenance validation; the verifier
  error came from the agent rewriting the workspace Git history and removing
  the prepared base object. This remains diagnostic evidence only and does not
  qualify the task.
- A six-tool Flash diagnostic then ran the same SuperJSON task once per tool
  with one retry. Claude had two provider/protocol adapter errors, Aider timed
  out after the context fix, and Hermes/OpenCode/Qwen/Codex did not complete
  within the 300-second bound. Codex's retry had unavailable terminal usage,
  so the runner stopped fail-closed at `$0.039500385` rather than fabricating
  spend. The follow-up Aider/Claude run quarantined both cells at zero local
  spend; Aider timed out and Claude again received the OpenRouter 404. All
  records are diagnostic only.
- A planned long-regime Go bug-fix control was stopped during preparation after
  the Git-base defect was independently identified; no model execution or
  provider spend was retained from that interrupted attempt. It must be rerun
  only after the no-spend gate and preparation-boundary check pass.
- The corrected-boundary rerun of `prometheus-typed-label-sorting` then reached
  the native verifier boundary with the declared base commit restored. Hermes
  made several priced provider requests but ended at the 900-second timeout
  with a final aborted/unpriced request; the runner fail-closed at recorded
  spend `$0` and did not start the randomized Codex cell. This is useful
  preparation evidence, not a calibration pass or a complete spend record.
- A fresh Codex-only Flash run of the same task completed its initial attempt
  and one retry, with 75 C1 events and recorded spend `$0.06440483`; both
  attempts timed out without a verifier pass. The final C4 and retry records
  are retained under `/tmp/aob-real-codex-rehydrated.znVMLd`, and the
  calibration summary validates both identities. This confirms the long-run
  Codex path and Git-base boundary but still produces no two-CLI pass.
- A new long-regime control for `geo-shapeindex-serialization` used the same
  reviewed DeepSWE revision and 900-second bound. Hermes timed out with an
  unpriced final request; a separate Codex run produced one verifier error and
  one timeout across its initial attempt and retry. Codex spend reconciled to
  `$0.11854255`; neither CLI passed the native verifier. This is diagnostic
  evidence only. During no-spend validation, the calibration summary scanner
  also exposed and fixed a real integration defect: it rejected legitimate
  dependency symlinks under private result workspaces. The scanner now skips
  workspace contents while retaining symlink rejection for evidence paths, and
  the regression is tested.
- Roughly twenty previous candidates timed out at the five-minute bound. This suggests a long-horizon population, not merely a bad candidate selection.
- Source review flags and maintainer sign-off must remain false until real calibration evidence supports them.
- Start with one or two tasks, but do not begin an official matrix until the chosen release regime and task list are reviewed.

### Headline metric

- Codex has partial tool timing instrumentation; the remaining tools are partial or none.
- Full `harness_time`/harness-share ranking is therefore unavailable. Current reporting correctly publishes non-model residuals and leaves harness share unavailable where visibility is incomplete.
- Do not relabel partial observation as full visibility. Either improve native timelines for enough tools or make non-model residual the explicit headline.

### Official execution

- No official contiguous S7 window has run.
- The Mac/Docker Desktop host must be quiesced, on AC power, and recorded; proxy calibration must pass on that host immediately before execution.
- The OpenRouter Activity export, anomaly review, frozen archive, final METHODOLOGY, tag, release attachment, and publication actions do not yet exist.

## Next implementation order

1. Complete DeepSWE calibration using one selected task at a time with the approved Flash model and a deliberate bounded budget. The summary now prevents mixed model/regime/source/incomplete evidence from forming a false two-CLI pass; do not swap candidates repeatedly without changing the hypothesis being tested.
2. Decide the release regime from calibration evidence, then freeze the 8–10 task source manifest and review flags.
3. Resolve the eligibility decision (supported Claude route/model or explicit tool-scope change) before any official spend.
4. Run the official block-randomized matrix in a fresh single-segment session, perform Activity reconciliation and anomaly review, freeze the archive, regenerate the report from the frozen tree, and finalize METHODOLOGY/README.
5. Run final GPT Sol and human reviews before any tag or publication.

## Required verification before each stage closes

```text
npm test
npm run typecheck
npm run lint --silent
sh -n scripts/*.sh images/*.sh
git diff --check
```

Provider-spending commands are separate release/calibration actions. No CI or integrity test may hold credentials or spend tokens.

## Human decisions still required

- Approve the final DeepSWE task IDs and short-versus-long release regime after calibration evidence exists.
- Choose whether the public headline is non-model residual or whether additional full tool timelines are required before release.
- Review every anomaly disposition and the exact provider export window.
- Approve the final METHODOLOGY claims and publication package.

## Definition of release-ready

Release-ready means all selected tasks have reviewed provenance and successful calibration; all official cells and permitted retries/replacements are bound to one documented run window; all original and rerun spend reconciles with the private provider export and remains under the cap; the archive verifier recomputes portable semantic bindings; no unexplained anomaly remains; and the published report is generated only from the verified frozen archive.
