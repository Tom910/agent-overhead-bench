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

## Interrupted-stream outcomes without retrying consumed tasks

A narrowly evidenced interrupted stream is an operational transport failure, not a
verified task failure or success. Admission may continue once when an otherwise
complete exact-Luna request sequence ends in one streamed Responses request with
status 0, a typed network error after upstream forwarding, unavailable usage and
unknown served model. Error-detail wording is not part of this classification;
zero or more fully observed local denied retries may follow. Require all earlier
provider events to be successful and complete, unchanged policy flags, and the
accepted observation prefix to match all canonical calls. The gate-refused count
must exactly equal the denied tail within the service record cap. Require native
exit 1/adapter_error and skipped verification (duration
0 and empty log). Provider 429/auth failures, model drift, unavailable accounting
without this terminal network evidence, other gate refusals and ambiguous native
failures still halt. A matching terminal upstream sidecar must bind the exact C1 hash/sequence/run and
show upstream HTTP 200 with no upstream error; a disconnected auth or quota-error
body cannot enter this classification. The original C1/C4 remain unchanged and incomplete accounting
remains unscored; state records transport_failed, never task_failed or completed.

Do not replay any consumed attempt. A persistent admission-order ledger records
actual serial invocation order, including harness-subset resumes; two consecutive
transport_failed attempts trip a circuit breaker before another attempt starts.
A successful transport with a legitimate task result breaks the consecutive streak.
Resume validates the ledger and recomputes the breaker from hash-bound outcomes.

One audited exact-state transition preserves all 21 consumed slots, all earlier
receipts and their implementation epochs, and 179 pending slots. It binds the known
stopped state's implementation and interrupted attempt artifacts, validates the
strict transport signature, preserves the original state, and adds a linked receipt.
The latest 12 consumed slots retain their original implementation epoch; the first
nine remain untouched. Recovery seeds the proven existing invocation order and
continues only pending work. No state changes or model calls occur during tests.

Transport-continuation acceptance: new positive classification/breaker and recovery
cases failed before implementation; 28/28 focused tests then passed. Coverage
includes zero/one/multiple fully observed local retries, unknown usage left intact,
no task replays, HTTP 401/429 or missing/mismatched/duplicate upstream evidence
rejection, policy/model/accounting drift refusal, actual-order streaks across
harness-subset resumes, streak reset after a completed transport, persistent
circuit breaking, 21 original attempts/receipt epochs preserved, and 179 pending
slots. Syntax/diff checks passed. All tests used synthetic model execution; no
credentials, account access, inference or task verifier reruns were used.

## Pre-inference image preflight and never-started setup recovery

Docker cleanup can remove pinned images between attempts. Before consuming any
pending slot, inspect the local exact bridge runtime and the selected native-agent
and verifier image tags/IDs; never pull or substitute images. Check the selected
pending matrix at startup and the current cell again immediately before admission.
A missing or mismatched image records preflight_blocked and leaves every pending
slot unconsumed. Availability may be checked again safely after external restoration;
no transport factory, credentials or model request is involved in the preflight.

A reusable but explicit `repairLunaEnvironmentSetup` requires an independently supplied
expected state hash, exactly one last blocked setup admission, and unchanged earlier
receipts/results. Only the known staging artifact set may exist, with empty canonical
and upstream logs, zero bridge activity and no native output/result/transport marker.
No paid or native-executed attempt can qualify. Hash every file and symlink without
following links, preserve the original state, and atomically move the whole setup
directory into a private archive before returning only that run_id to pending.
The receipt binds the archive, old/new implementation, earlier receipt context and
all retained consumed slots. Future resumes revalidate the archive and chain.
No arbitrary task retry or implementation drift is allowed. Missing images remain
a blocker until separately restored and verified; this recovery does not claim
restoration or infer success from an empty model log alone.

The original pinned task images were pruned and are not assumed reproducible by
identity. A rebuilt image generation may serve only the 179 pending slots after
separate restoration verification. Combine the zero-activity setup archival with
an explicit generation transition, pinning the supplied new suite/source hashes.
Compare both prepared roots: source/base revision, timeout/regime, task YAML,
prompt and workspace visible contents, and verifier command/network/workdir must
remain equivalent; only image identities/names and corresponding manifest hashes
may change. Preserve the original prepared root and definition for all consumed
attempts and their read-only proof validation. Non-original manifest hashes are
accepted only through the audited generation receipt or its explicit creation
arguments, never by disabling the original loader checks. All selected pending
images must pass local preflight before the transition can admit new work.

Generation recovery binds an independently supplied old-state SHA and restoration
proof SHA. It validates all 200 deterministic schedule identities before any write,
then preserves all 21 paid results and all four earlier receipt epochs. The exact
setup directory is archived without rewriting it, and only its unstarted run_id
returns to pending. New attempts carry the generation receipt hash, including
orphan-directory admissions. Every resume revalidates the setup archive, original
state, receipt chain and old-root proof context. Runtime import/loader setup is
cached once; image checks remain read-only and run before admission.

Upstream source checksums, suite source bindings and reference-polarity source task
checksums are invariant across image generations. Only the prepared suite checksum,
image fields and corresponding source/polarity manifest digests may change. Tests
cover these boundaries independently of the source loader.

Acceptance: the full 33-test focused suite passed, followed by the added
orphan-admission/receipt-loss regression (1/1); all 34 current tests are covered.
Lint and diff checks passed. Independent review approved the final schedule,
archive, old-context and preflight gates. A read-only check on Linux accepted all
8 actual restored task generations, including visible workspace hashes, only
after the original frozen review artifact was retained. The initial regenerated
review hash was correctly rejected; no provenance gate was relaxed. The accepted
restoration proof is `restoration-preserved-review.json`, SHA-256
`611e48f6e282395e8b36b53e3476ff948fb3af87cfb9ec5aa4efffbb8f5ba43c`.
The temporary inspection module was removed and the Linux checkout remained clean.
These checks performed no model calls and did not mutate campaign state. Actual
recovery/restart remains a separate supervised action after integration.

## Exact provider access-verification 503 continuation

The next observed stop was a provider HTTP503 after39 complete Luna requests,
with a complete69-byte error body whose SHA-256 is
`39b34ad272f10d75ddfe6dfce35ba8a89d64a60ed80721c656d326832a04f764`.
The body asks to retry an unavailable access verification. This establishes a
specific provider failure, not a historical quota cause or a task result. Current
read-only account/model readiness is checked separately before supervised restart.

Recognize only this exact C1-bound upstream status/body signature, with a complete
successful request prefix, native exit1, unrun verifier, policy-valid observations
and no later forwarded requests. Preserve unknown usage/model identity on the final
request. Classify it as transport_failed/incomplete and retain the existing two
consecutive transport-failure breaker. Other503 bodies and401/403/429, truncated
bodies, missing sidecars, policy drift or nonterminal failures still halt.

An explicit expected-state-hash repair preserves the complete old state and receipt
chain, verifies every scheduled identity and all consumed artifacts, and changes
only the final blocked funded attempt to the evidenced unscored transport outcome.
Old and new definitions may differ only in implementation hash. Historical
image-generation receipts validate in their original implementation/task contexts;
no old receipt/raw evidence is rewritten. The repair does not stage, retry or refund
any attempt. Subsequent resumes revalidate the new immutable receipt and old chain.

Acceptance: the exact-response classifier and51-slot continuation tests failed
before implementation. All38 focused controller tests then passed, including the
full earlier receipt chain, original no-solution proof context, replacement image
generation,51 funded slots preserved/149 pending, no paid replay, unknown accounting,
and the persistent two-failure breaker. Other503 bodies,401/403/429, incomplete or
truncated error evidence, mismatched sidecars, later paid requests, source/host drift
and malformed scheduling are rejected. The tested repair writes only an immutable
old-state copy, a linked receipt, and the updated operational state. Historical
C1/C4 and previous receipts remain unchanged. Tests used synthetic execution only;
actual recovery and restart remain separate supervised actions after integration.
Independent review approved the final classifier and nested receipt contexts;
reviewer reran all4 new focused tests. Lint, syntax and diff checks passed.
