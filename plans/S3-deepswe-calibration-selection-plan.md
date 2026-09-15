# S3 — DeepSWE calibration selection

**Status (2026-08-31):** In progress; the existing eight-task pack is
provisional and has no passing two-CLI calibration. The no-spend summary now
binds evidence to the complete calibration identity before evaluating that
guardrail; see `S3-calibration-identity-binding-plan.md`.

## Goal

Turn the pinned DeepSWE checkout into a defensible release task selection based
on observed Flash-model behavior. Select only tasks that preserve the native
prompt/verifier semantics, run within the explicitly selected regime, and can
be completed by at least two included CLIs. Keep failed candidates as evidence;
never rewrite the task or verifier to manufacture a pass.

## Evidence boundary

- Source revision remains
  `0b9fabbb63b9104d678fe965e1632f2dd9eaa2ea`.
- A candidate is eligible for short calibration only with `timeout_s ≤ 300`
  and expected maximum ≤5 minutes. A candidate is eligible for long
  calibration only with expected range `[6,15]` minutes and timeout 301–900.
- Calibration uses the same pinned model (`z-ai/glm-5.3-flash`), proxy, Docker
  isolation, native verifier, and adapter invocation used by measurement runs.
- A calibration pass requires a completed C4 result and native verifier exit 0;
  two different included CLIs must pass every selected task. Timeouts,
  adapter errors, and verifier failures remain explicit negative evidence.
- Candidate selection is based on task-level evidence, not on changing the
  timeout, deleting difficult tests, or replacing the source verifier.

## Implementation order (TDD)

1. [x] Inventory all pinned source tasks and existing diagnostics, including
   native category, repository size, regime bounds, verifier type, and outcome.
2. [x] Add a no-spend evidence summarizer that reads calibration C4 trees and
   emits a reviewable candidate matrix without exposing prompts or solutions.
3. [x] Select a small candidate batch that gives the best chance of a real pass
   while preserving source diversity; document exclusions and rationale.
4. [x] Run the first two-CLI batch with an explicit per-cell estimate and hard
   cap. Start with one or two tasks, then expand only when results justify it.
5. [ ] Update source-review evidence only after the task list, polarity,
   calibration results, and provenance have been independently reviewed. The
   review must also name the generated calibration attestation and checksum;
   `calibration_complete` alone is not approval.
6. [ ] Rerun task validation, short/long preflight, report generation, and
   full verification against the resulting manifest.

## Acceptance

- The selected task list has a machine-readable evidence record for every
  candidate and every included calibration CLI.
- No task is approved from a timeout-only or parser-only result.
- The generated source manifest, local task manifest, checksums, native
  verifier, and regime metadata agree.
- The two-CLI calibration result is reproducible from retained sanitized
  metadata and private raw runs, with spend reconciled by runner state.
- A two-CLI result is valid only when both tools share task source, repository,
  revision, regime, model, condition, and price-book identity; mixed runs stay
  visible but cannot be combined.
- If no candidate passes, the project records that DeepSWE/Flash cannot yet
  satisfy the release guardrail and does not fabricate approval.

The machine-checkable two-CLI gate is implemented by
`scripts/s3-calibration-attestation.mjs`. It recomputes the attestation from a
sanitized summary plus retained run files and binds the selected task IDs,
source revision, regime, model, condition, price book, and included CLIs. A
synthetic fixture cannot authorize a real source review or S7 run.

## Current inventory and evidence

The pinned checkout contains 113 tasks. Its four native `bugfix` tasks are
`happy-dom-abort-pending-body-reads`, `opa-template-string-reconstruction`,
`prometheus-typed-label-sorting`, and `tengo-callable-instance-isolation`;
the rest are source-labelled enhancements or feature requests. The original
eight-task pack is therefore not a representative short-regime calibration
sample: it contains only feature requests and its first observed candidates
have timed out.

The no-spend summary command is
`scripts/s3-calibration-summary.mjs`. It reads C4 records plus the bounded
events/verifier/source-manifest evidence needed to validate a pass; it never
reads prompt, stdout, stderr, tool-log, or solution files. Incomplete records
remain visible but cannot set `passed` or satisfy `two_cli_pass`. The retained
summary for the current diagnostic set reports:

| Task | CLI evidence | Regime | Result |
|---|---|---|---|
| `superjson-error-stack-serialization` | Codex 2 timeouts; Hermes 2 timeouts | short | no pass |
| `psd-tools-blend-range-api` | Codex 3 timeouts + 1 verifier error; Hermes 1 timeout | short/long | no pass |
| `happy-dom-abort-pending-body-reads` | Codex 2 timeouts; Hermes 2 timeouts | short | no pass |
| `anko-default-function-arguments` | native reference polarity passed 5/5; Codex 2 timeouts; Hermes 2 timeouts | short | no pass; `$0.03231064` |
| `opa-template-string-reconstruction` | native reference polarity passed 5/5; Codex 2 timeouts; Hermes 2 timeouts | short | no pass; `$0.05506120` |
| `anko-default-function-arguments` | native reference polarity passed 5/5; Codex 1 timeout; Hermes 1 timeout; retry stopped by unavailable-spend guard | long | no pass; `$0.030538365` |
| `go-critic-doc-link-checker` | native reference-polarity gate failed | short | no paid run |
| `prometheus-typed-label-sorting` | Codex 2 timeouts; Hermes 1 timeout with final provider usage unavailable | long | no pass; Codex `$0.06440483` recorded, Hermes spend unavailable |
| `geo-shapeindex-serialization` | Codex verifier error + timeout; Hermes timeout with final provider usage unavailable | long | no pass; Codex `$0.11854255` recorded |

The retained runner states reconcile to `$0.27102508` across these diagnostics
(including retries). The latest OPA batch reconciles to `$0.05506120`; the
Anko batch reconciles to `$0.03231064`; the latest Happy DOM batch alone
reconciles to
`$0.051235845`; the Go candidates added no spend because preparation failed
before the runner. These are calibration diagnostics, not release measurements.

The explicit long-regime control used `anko-default-function-arguments` with
both Codex and Hermes, one planned attempt per CLI, Flash only, `timeout_s:
900`, a `$1` conservative cell estimate, and a `$2` hard cap. Both initial
attempts timed out. Codex produced a schema-valid long C4 timeout at
`$0.02771733`; Hermes produced a retry-archived timeout at `$0.00282104`.
The subsequent retry was stopped because terminal usage was unavailable under
the hard cap. The persisted state total is `$0.030538365`; no verifier pass
was claimed. This is long-path evidence, not a two-CLI calibration pass.

The Anko reference gate initially exposed two benchmark-container issues rather
than source failures: Go test binaries landed under the verifier's `noexec`
`/tmp`, and one upstream diagnostic log targeted the read-only image layer.
The preparation path now routes Go's temporary build directory and GOPATH log
directory into isolated writable workspace paths. The native tests then passed
all five reference samples without changing test selection or grading logic.

OPA's reference gate initially failed because the generic Go workaround moved
its module cache out of the prepared image. The preparation path now relocates
GOPATH only when the source verifier hard-codes `/root/go/bin`; ordinary Go
tasks retain the image's prewarmed module cache. OPA then passed all five
reference samples with no provider requests.

DeepSWE's README describes the tasks as original, but its pinned dataset
manifest records `source_dataset = "swe-bench-ultra"`, while task images also
carry a `swe-bench-*` image namespace. This provenance must be resolved against
the repository's explicit restricted-benchmark rule before release approval;
the current review flags remain false. No approval is inferred from the
description alone.

The corrected-boundary `prometheus-typed-label-sorting` control was run with
Flash in the long regime after deterministic Git-base rehydration was fixed.
Hermes reached 13 provider events before a 900-second timeout and ended with
an unpriced aborted request; the capped runner stopped before Codex in that
two-tool invocation. A fresh Codex-only run completed both its initial attempt
and one retry, recording `$0.06440483` across 75 C1 events, and both attempts
timed out without a verifier pass. The Codex result is retained at
`/tmp/aob-real-codex-rehydrated.znVMLd`; the Hermes boundary result is at
`/tmp/aob-real-rehydrated.ArsXNN`. These runs validate the preparation and
long-run accounting paths but do not qualify any task or establish a
two-CLI calibration pass. Further candidate swaps should wait for a changed
hypothesis or a deliberate release-regime decision.

The 2026-08-31 `geo-shapeindex-serialization` control used the same reviewed
DeepSWE revision, long regime, Flash model, and 900-second bound. Hermes timed
out with an unpriced final request, so its runner stopped before retrying or
starting a second CLI. A separate Codex run completed its initial attempt and
one retry, with a verifier error followed by a timeout, and reconciled spend of
`$0.11854255`. Neither CLI passed the native verifier, so this remains
diagnostic evidence only. While summarizing these roots, the summary scanner
was corrected to ignore private workspace dependency symlinks; the regression
is covered by `scripts/s3-calibration-summary.test.mjs`.

## Out of scope

Changing the DeepSWE source revision, modifying native prompts/verifiers,
changing the measurement equations, adding a stronger model without an
explicit user decision, or publishing a capability score.

## Follow-up candidate audit (2026-09-02)

The stale source audit count was corrected: the previous eight-task materialized
slice had one small and seven medium repositories, not two small and six medium.
The source-quality recommendation therefore replaces one TypeScript medium task
with `true-myth-iterable-collection-combinators`, which is a 74-file MIT
repository. A second small Python reserve, `aiomonitor-task-snapshots-diff`, is
79 files under Apache-2.0. Both candidates were prepared from the pinned
DeepSWE revision and passed five no-network native reference-polarity samples;
their exact checksums and image digests are recorded in
`s3-deepswe-recommended-candidates.json`.

The first changed-hypothesis paid diagnostic used the two small candidates, the
pinned Flash model, Hermes first, and the explicit long 900-second regime under
a `$0.50` cap. The Hermes/aiomonitor cell timed out after 17 proxy events, of
which nine carried usage and eight had unavailable usage. The runner stopped
before Codex rather than guess spend. No verifier pass or two-CLI calibration
pass was claimed. The retained sanitized summary is
`s3-deepswe-recommended-run.json`.

This result is negative evidence against the current Flash/task/regime path. It
does not justify changing the short timeout, changing a task, or promoting any
review flag. The detailed recommendation and license audit are in
`S3-deepswe-task-recommendation.md`.

The maintainer then agreed to the replacement shape. The structured release
selection replaces `ts-pattern-match-each` with
`true-myth-iterable-collection-combinators`, and the refreshed no-provider
materialization is `scratch/deepswe-release-shape-20260903-v3`. It passes the
official composition validator and all 40 native reference-polarity samples;
it remains unapproved for S7 because no two-CLI calibration pass or sign-off
has been recorded.

The authorized real probe on `psd-tools-blend-range-api` confirms the current
Flash mismatch. In the short regime (300 seconds), both Codex and Hermes timed
out on both allowed attempts; the retained runner total was `$0.125408285`.
The separate long-regime probe then timed out on Hermes at 900 seconds, while
Codex returned a patch but failed the native verifier (`reward=0`, 34/45
feature-to-patch tests passed; first-attempt spend `$0.04777226`). The first
long attempts therefore do not qualify this task for either regime or for
two-CLI calibration. The retained diagnostic roots are
`scratch/deepswe-release-shape-20260903-calibration-psd-20260903` and
`scratch/deepswe-release-shape-20260903-calibration-psd-long-20260903`.

The full five-tool preparation for that same ordered selection is also retained
at `scratch/deepswe-release-shape-20260903-official-prep-v2`. It contains all
40 digest-pinned agent images and verifier images, and its native polarity
checks pass 40/40. This is preparation evidence only; it does not change the
review flags or substitute for two-CLI Flash calibration and sign-off.

Two same-task model controls isolate the cause of the failed Flash probe. A
Codex-only `z-ai/glm-5.3` run completed in about 265 seconds with all 979
regression tests passing, but failed three of 45 feature tests (`reward=0`). Its
captured usage was 1,763,556 input tokens, including 1,699,712 cached tokens,
and 16,893 output tokens; applying the then-current OpenRouter rates gives a
manual diagnostic cost of `$0.40167048`. The retained root is
`scratch/deepswe-release-shape-20260903-calibration-psd-glm53-control`.

A second Codex-only control with `openai/gpt-5.6-sol` completed in about 329
seconds and passed the native verifier: 979/979 regression tests and 45/45
feature tests (`reward=1`). All 42 proxy events returned HTTP 200. Captured
usage was 2,398,346 input tokens, including 2,312,288 cached tokens, and 21,210
output tokens; no request crossed the provider's 272,000-token long-context
pricing threshold. Applying the current per-request rates gives a manual
diagnostic cost of `$0.84667360`. The retained root is
`scratch/deepswe-release-shape-20260903-calibration-psd-gpt56sol-control`.
The runner then failed closed before any retry because neither control model is
present in the frozen Flash price book; that expected accounting stop does not
invalidate the completed cell or verifier result.

The matching Hermes control then completed in about 357 seconds and also
passed: 979/979 regression tests and 45/45 feature tests (`reward=1`). Its 38
usage-bearing events recorded 2,594,826 input tokens, including 2,506,061
cached tokens, and 19,816 output tokens. No request crossed the long-context
threshold; the manual diagnostic cost is `$0.87690220`. The retained root is
`scratch/deepswe-release-shape-20260903-calibration-psd-gpt56sol-hermes-control`.

Together these controls show that the prepared task, container, proxy routes,
both adapters, and native verifier can produce valid passes. They also show
that Flash is below the demonstrated reliability threshold for this task,
while full GLM improves substantially but still misses the binary gate. The
two GPT-5.6 Sol controls are positive two-CLI model-selection evidence, but not
yet the canonical S3 calibration artifact: they were run as separate
diagnostic roots with spend unavailable under the frozen Flash price book.
They therefore do not approve `openai/gpt-5.6-sol`, authorize mixed-model
comparison, or change any S3 review flag. Before expanding, add a dated price
book and model-eligibility evidence, then reproduce both passes in one bounded
calibration identity so recorded spend and the generated attestation are
complete.

## Model-migration question (2026-09-03)

The recommendation to migrate the pinned model to `openai/gpt-5.6-sol` was
re-examined against no-spend source evidence and rejected as the wrong fix.
Every task in the pinned checkout declares a 3-hour agent budget, and the
GPT-passing task ranks 15/113 by solution-patch size, so the constraint is a
regime/source mismatch rather than model capability alone. The migration would
also cost about 18x per cell (`~$135` for the 160-cell matrix against a `$10`
budget). See `S3-model-vs-task-regime-analysis.md`. No review flag changes.

## Risks

| Risk | Mitigation |
|---|---|
| Candidate swapping hides a structural model/task mismatch | Inventory outcomes and stop after a predeclared batch; record all failures |
| Long tasks consume excessive spend | One/two tasks first, explicit estimate, hard cap, one retry maximum |
| A task is made easier during preparation | Bind checksums, native verifier polarity, source revision, and workspace base |
| Calibration evidence is mistaken for final results | Keep review flags false until the complete evidence record is reviewed |
