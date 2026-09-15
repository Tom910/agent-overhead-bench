# S3 — Timeout and parallel execution diagnostic

Status: 900/1800-second comparison and sequential Codex control complete (2026-09-07).

The maintainer explicitly authorized testing 15-minute, 30-minute, and parallel
execution, with a very large timeout available if necessary. Determine a usable
execution window from evidence rather than requiring the maintainer to predict
model completion time. The existing `long` and `extended` regimes already
support 900, 1800, and up to the source's 10800-second budget; no new regime,
measurement equation, dependency, or C1–C4 field is needed.

## Procedure

1. Preserve the failed five-minute validation and all original artifacts.
2. Copy the selected, pinned eight-task preparation into separate diagnostic
   preparations. Change only generated timeout/expected-duration metadata to
   `900/[6,15]` and `1800/[16,30]`, rebind the prepared manifest checksums, and
   validate the same source, agent images, native verifiers, reference polarity,
   and pristine workspaces before any provider call.
3. Run Pi on `psd-tools-blend-range-api` once in each preparation concurrently,
   using independent output roots, ledgers, containers, and the normal runner.
   Keep the selected Flash model, dated price book, and stop-on-failure behavior;
   do not retry automatically. This is a small timeout/concurrency diagnostic,
   not the 48-cell campaign validation or an official performance comparison.
4. Refresh read-only provider usage before launch. Reserve all lifetime key
   usage rounded up as a conservative bound for prior authorized validation
   charges; split available room under the existing $10 authorization across
   concurrent runs. Retain the reservation and provider snapshots privately.
   Check aggregate usage and C1 activity while the runs execute; do not start
   further work with unavailable budget evidence. Recorded-spend caps retain
   their documented semantics and do not become request-level hard limits.
5. Record completion, verifier result, adapter/model time, request count,
   measured spend availability, provider usage, and overlap. Keep concurrent
   diagnostics separate from sequential release results. If both time out
   while progressing, consider a fresh 10800-second diagnostic within the
   remaining authorized budget. Do not infer additional money authorization
   from the instruction to use a larger time limit.
6. Use the result to choose the next validation window. A diagnostic pass is
   not source sign-off, complete campaign validation, or frozen v1 evidence.

## Acceptance

- [x] No-spend preparation and transport/clock checks pass.
- [x] Both requested timeout experiments have retained terminal evidence.
- [x] Concurrency and budget reservation are recorded explicitly.
- [x] Results and the next execution decision are documented without pooling
      distinct regimes or rewriting prior failures.

## Results and next control

The original pair failed in whole-log conversion; S5 corrected that defect
without rewriting their evidence. The fresh 900-second Pi/PSD attempt timed
out and retained complete logs/C4. The fresh 1800-second attempt completed in
1727.709 seconds, then passed the native verifier in 9.960 seconds, with 92
fully priced requests and C4 estimated spend $0.13927733. See
`scratch/timeout-probe-streamed-20260907/terminal-summary.json` and the retained
artifact manifests. The successful result is accepted by the calibration
summary with no validation issues; it is one CLI on one task.

Use the unchanged 1800-second `extended` preparation for one fresh sequential
Codex/PSD control. Refresh provider usage, limit this attempt to a $1 recorded
cap and $1 cell estimate inside the existing $10 authorization, keep
stop-on-failure/no automatic retry, and retain a separate output root and
ledger. This checks transfer to a second CLI without representing the full
48-cell validation as funded or passed. The 10800-second preparation passed
no-spend preflight but does not need a paid Pi run after the 1800-second pass.
All eight-task source/calibration approval flags remain pending; this control
does not replace the complete validation or source approval gates.

## Sequential Codex control result

The fresh Codex/PSD control on runner commit `61c6621` exited normally after
765.178 seconds (12m 45.2s), before its 1800-second limit. Native verification
ran for 9.457 seconds and rejected the patch: all 979 preservation tests passed,
while 43 of 45 new tests passed. The two failures concern split-fade behavior
(`test_blend_if_split_linear_fade` and `test_split_fade`). This is a submitted
patch failure, not a timeout or a log-capture failure. All 45 C1 requests have
usage; C4 estimated spend is $0.053059125.

Terminal artifacts, checksums, source-manifest copy and combined calibration
summary are retained privately in `scratch/timeout-probe-codex-20260907`.
Both Pi and Codex records have no calibration validation issues, but only Pi
passed, so `two_cli_pass` remains false. The final provider lifetime snapshot is
$7.600530446; rounding that reserve up leaves $2.39 inside the existing $10
authorization. This reserve is not a campaign cost estimate.

No automatic retry or larger-window control follows this completed-but-failed
patch. A larger timeout alone does not address these assertion failures.
The 1800-second window remains a candidate for further validation; this one-task
evidence does not qualify all eight tasks. The full 48-cell validation, all-task
two-CLI calibration, source approval and official campaign remain pending.
The three-hour preparation remains unused. Fresh full offline verification on
`61c6621` passed 614 tests, strict typecheck, lint and the S8 launch check
(`status: pilot`); none of those checks spends provider tokens.

## Continued validation after the Codex control

The maintainer asked why work stopped: a terminal diagnostic failure does not
end the broader authorized validation. Continue with the remaining CLIs one at
a time, preserving failures and refreshing the aggregate reserve before each
paid attempt. The immediate next control is Hermes/PSD on the identical
1800-second preparation, a $1 recorded cap and $1 cell estimate, separate root
and ledger, no automatic retry, and the same provider-usage monitor. Retain the
full six-tool/eight-task no-spend preflight. Do not infer more money or campaign
approval from continuation; stop new spending if the available reserve cannot
cover the next declared cap. A failed patch does not justify a longer timeout;
a still-progressing timeout may use the previously authorized larger window.
