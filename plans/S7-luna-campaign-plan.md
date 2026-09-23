# S7 serial Luna subscription campaign

The maintainer authorizes 200 new Luna attempts: the unchanged eight prepared
DeepSWE tasks, five repetitions, Codex/Hermes first then Cline/Pi/Qwen, on Linux.
The historical task amendments stay separate. Existing DeepSeek runs are neither
rerun nor overwritten. This is a diagnostic campaign, not an official v1 freeze.

## Implementation boundary

Use the S5 task transport and existing `runDockerCell`, native adapters, task
preparation, verifier, candidate retention, execution conditions and C1/C4 writers.
No second measurement model and no npm dependency. Exact model `gpt-6-luna`;
policy `luna-low-reasoning-replay-disabled`; price-book label
`codex-subscription-unpriced-2026-09-22`, without fabricated price rates. Canonical
C1/C4 remain the measurement source; state records scheduling and admission only.

Validate exact eight-task prepared/source manifests, source checksum bindings,
reference-polarity records and prepared task checksums before staging. Read the
already prepared task metadata through the existing task loaders; runDockerCell
alone stages each attempt, retaining original revisions, images, prompt, timeout
10800 seconds and native verifier. Pin binary and relevant
implementation hashes and the SHA-256 of the Linux machine identifier in the campaign
definition; never retain the identifier itself. Require original workspaces to have
real, nonsymlink Git directories, the declared base HEAD and no tracked or untracked
changes, using Git with optional locks disabled. Do not turn pending historical
source-review flags into approval or run a separate paid validation matrix.

Persist the full serial schedule under an exclusive lock with atomic state writes.
`--harnesses` selects pending harnesses from that schedule without changing its
identity. Phase one interleaves Codex/Hermes by repetition then task (80 attempts);
phase two interleaves Cline/Pi/Qwen in the same order (120 attempts). Persist
`started` before invoking any cell lifecycle. Never call stageTask/runDockerCell
for an existing evidence directory or a consumed slot. Interrupted/unknown slots
halt the campaign for investigation; there is no automatic retry or reset switch.

The first funded repetition-zero cells also provide admission evidence for the
same run population. Complete C1 served-model/usage/timing is required after each
attempt. Auth/quota/model denials, unknown accounting, process failures, timeout,
malformed verifier evidence or infrastructure errors halt subsequent admission.
Native exit 0 plus a genuine verifier reward-zero footer may continue as a task
failure; its C4 outcome remains unchanged. Hash-bound evidence is checked again
on resume. A successful verification remains a separate task outcome.

Transport enforces 512 provider requests, 100M cumulative input and 1M cumulative
output tokens per attempt; completed-response token ceilings can overshoot by one
in-flight response. Snapshot expiry must exceed timeout plus 15 minutes. These
ceilings are finite safety controls, not an assertion about subscription allowance.
No USD estimate is reconstructed; quota rejection stops before another cell.

## Command and verification

`node scripts/s7-luna-campaign.mjs --task-root PREPARED --output PRIVATE_CAMPAIGN
--auth-file EXPLICIT_CLI_FILE --bridge-binary PINNED_BINARY --private-root PRIVATE_TRANSPORT
[--harnesses codex,hermes]`

The command never searches for credentials. Credential material is handled only
by the S5 factory. Output and transport roots are private directories outside the
checkout; errors and progress do not print credentials. Existing Linux checkout
edits are preserved by using an isolated source checkout.

Tests use synthetic tasks and injected cell execution/transport dependencies.
Cover order and exact 200 slots, subset resume, no duplicate execution, atomic
locking, retained interrupted attempts, drift/tampered evidence refusal, provider
failure and unknown-usage stops, genuine task-failure continuation, and null USD.
No real credentials, Docker model calls, network inference or CI secrets. Root
review and the S5 changed-path zero-spend integration precede paid execution.

## Acceptance evidence (2026-09-22)

Focused synthetic controller suite: 9/9 passed, including host drift refusal;
syntax checks and `git diff --check` passed. Red-before-green checks established
both the safe service run-ID requirement and host binding.

The actual Linux default loader was invoked twice against the existing canonical
prepared task root. Both validated all eight tasks; the first persisted 200 slots
and entered one injected transport/cell before an intentional interruption. The
second preserved the halted slot without invoking either stub again. Workspace
base HEAD/cleanliness checks and host binding passed. A synthetic script file
served as the binary-hash input; the auth path was absent. There were zero real
credential reads, task staging operations or inference requests. This tests loader
and resume integration, not funded benchmark outcomes.

## Audited Hermes metadata continuation

The first funded Hermes attempt stopped campaign admission after seven front-relay
404 responses, despite 47 successful canonical provider requests, native exit 0
and a genuine verifier reward-zero result. The pinned native metadata probe proof
in S5 reproduces seven non-inference metadata requests and unchanged context-window
fallback. Historical observations contain counts only: their classification stays
explicitly inferred, never rewritten as observed path evidence.

Future admission permits only Hermes metadata rejections classified as path/404,
without query or truncation: one GET each for api-models, backend-tags,
backend-version and model-detail, at most two GET backend-properties, and one POST
backend-show. Any other rejection, duplicate beyond that bound, provider failure
or incomplete accounting still halts admission. The relay continues returning 404.
The model-detail category is restricted to the proved /v1/models/gpt-6-luna
target; other model-detail paths remain unclassified and stop admission.

A single-purpose exported `repairLunaMetadataStop(options)` has no CLI reset flag.
It pins the known old state, implementation, Hermes C1/C4/observations, native image
and offline proof hashes; validates every unchanged campaign binding; and verifies
the two consumed results. Under the campaign lock, it exclusively preserves the old
state and an inferred-adjudication receipt, then atomically updates scheduling
metadata and the implementation binding. Raw attempts remain unchanged. Both past
cells retain their original implementation provenance. Resume validates the receipt,
backup and exact legacy artifacts before accepting the one historical exception.
The 198 pending slots retain their identities; neither consumed task is staged again.
Synthetic tests cover allowed metadata, strict refusals, preservation, tampering,
definition drift and failed-provider refusal. This transition does not create a
reusable reset or automatically adjudicate other historical refusals.

Continuation acceptance: 13/13 focused tests passed after the new cases failed
before implementation. Syntax and diff checks passed. Tests use synthetic files,
including the repair pin dependency seam; the production export retains fixed
historical hashes and exposes no reset option. No credentials or inference were
used for this change. The historical attribution remains an inference even after
successful repair; future records contain observed rejection categories.

## Repeated observed metadata probes and second audited continuation

The seven-call assumption was too strict: native Hermes can repeat context
metadata lookup within one attempt. Safe metadata admission now depends on the
classification, never a maximum count of each safe category. Complete historical
arrays must account for every refusal without truncation. New bounded exact
category counters may prove larger populations beyond the 128-item diagnostic
sample: every refusal must belong to a permitted method/path-reason/404/no-query
category, the unclassified count must be zero, totals must reconcile, and the
retained sample must agree with the counters. Unknown/auth/body/model-endpoint
refusals, inconsistent counters and missing evidence still halt admission.

A second narrowly pinned export, `repairLunaRepeatedMetadataStop(options)`, repairs
only the known state with five task failures, one blocked Hermes Textual attempt
and 194 pending slots. All 39 provider requests and the genuine verifier failure
remain required. Unlike the first count-only adjudication, this attempt has 11
fully observed metadata diagnostics; no inferred path attribution is needed.
It preserves the second stopped state and a new receipt with exclusive creation,
validates and links the unchanged first receipt and backup, and binds every raw
artifact in all six consumed slots. The first two slots retain their original
implementation epoch; slots 2–5 acquire their actual second epoch. Every future
resume validates the full two-receipt chain and immutable raw evidence. No consumed
slot is staged again, and no arbitrary implementation drift is accepted.

Second-continuation acceptance: 17/17 focused tests passed. New repeat/recovery
cases failed before implementation; the missing retained-prefix case also failed
before its check was added. Exact-counter admission requires the complete first
`min(128, front_refused)` sample and reconciled truncation. Tests include a valid
140-refusal population, a correctly totaled unsafe tail, malformed counters,
missing or contradictory samples, both preserved implementation epochs, six-cell
raw-file preservation, provider/source drift, and every missing receipt/backup
link. No credentials, provider calls or benchmark task reruns were used.

## Verifier summary followed by asynchronous stderr

The retained Textual attempt contains one coherent reward-zero summary (13/20
fail-to-pass and 6/6 pass-to-pass tests) followed by a candidate-triggered asynchronous
ValueError traceback. The Docker verifier collector concatenates stdout with
stderr, so the last line of the combined log is not a trustworthy summary boundary.
No standalone reward.json is retained for this attempt. Admission therefore uses
the unique structured reward record anywhere in the combined verifier log, with
all existing count/fraction coherence checks and required native exit 0/verifier
exit 1. Missing, duplicate, malformed or incoherent records still halt. Raw logs
and C4 outcomes remain unchanged; the second repair still requires its exact
historical hashes. A representative regression uses the actual reward summary and
asynchronous traceback shape, without committing the private full candidate trace.

Verifier-ordering acceptance: the new regression failed before the one-condition
change; 18/18 focused tests then passed. The unchanged full retained Textual log
also passed the current parser in a read-only local check. Syntax/diff checks
passed, and no inference or task rerun occurred.

## Evidence-bound no-solution outcomes

An empty verifier log with native exit 0/verifier exit 1 is not by itself a task
failure. The retained Codex Ink attempt also has a nonempty candidate patch, so
neither stdout's no-change declaration nor the candidate patch size establishes
what the immutable verifier consumed. The retained candidate projection can include
ignored dependency symlinks that the verifier's own capture projection excludes.

For this case and future attempts, retain complete exact-Luna C1 accounting and
all native/task/image gates, then use the separate S7 no-solution proof helper to
reconstruct the hash-verified candidate in disposable storage. The exact immutable
verifier image runs only its capture helper with network disabled; no model calls,
task verifier execution or original evidence mutation occurs. Admission requires a
validated proof binding the original run, empty verifier log, candidate evidence,
patch, prepared tree and immutable images to successful capture of an empty verifier
patch. Missing, invalid or nonempty proofs halt. The raw C4 remains verify_error;
operational state records task_failed with failure_reason=no_solution_produced.
No reward or test-pass counts are invented.

A third exact-state transition preserves the stopped state, the first two receipt
chains and all nine consumed attempts. The old implementation hash and stopped
Codex Ink C1/C4/observation hashes are fixed; only implementation drift authorized
by this transition is accepted. The first six implementation epochs remain intact;
the latest three receive their actual prior epoch. The proof is validated before
writing any audit or state transition, and all receipts/proofs are revalidated on
resume. Only the 191 existing pending slots may execute afterward.

No-solution admission acceptance: 23/23 focused controller tests passed. Positive
fixtures use the real retained-candidate generator and real proof validator, with
only the isolated capture process replaced by a synthetic empty-diff result. They
cover future admission/resume, all nine consumed attempts and three historical
implementation epochs, unchanged raw C4 and earlier audit files, 191 pending
slots, proof tampering, every prior/new receipt and backup, and provider/source
refusal. The blocked slot's original candidate-evidence and patch hashes are also
pinned explicitly; its drift regression failed before the guard was added. Syntax
and diff checks passed. The helper's actual Linux empty-diff validation is a
separate required operational gate before root applies the transition.
