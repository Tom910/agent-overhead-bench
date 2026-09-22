# Harness benchmarking audit and next priorities

Reviewed September 22, 2026, at commit `470056a588aa3ac6d6e3047abf915c3d9730d2d2`.
This is a research and validation report, not an implementation plan or approval
to spend on a new campaign. Three independent agent reviews covered results,
task quality, and external methodology; the coordinating review checked the
collection pipeline and reproduced an evidence-retention defect using mocks.
No paid benchmark attempts or historical verifier reruns were performed.

The project is a useful, internally consistent measurement snapshot. Its next
major improvement should be experimental validity and diagnostic evidence.
The website already communicates the main metrics; more presentation work will
not establish which harness behavior caused a difference.

## What the audit established

- The selected dataset contains exactly five harnesses × eight tasks × five
  repetitions: 200 unique slots, 105 original passes and 95 verification failures.
- Rebuilding analysis from the retained selected C1/C4 files produces a
  byte-identical `analysis.json`. Independent calculations agree with request
  token sums, cache percentages, reference costs, and all ten pairwise intervals.
  The shared-price total is **$27.184785825**, including selected failed attempts.
- The four accounting replacements preserve their task/harness/repetition
  identities; the other 196 attempts are unchanged. One replacement changed a
  pass to a failure, so those four replacements were not selected to improve
  pass rates.
- That total is the selected benchmark cost, not the money spent collecting
  everything. Four superseded attempts add at least $0.673298502 at reference
  prices; interrupted recovery and earlier excluded collection work are outside
  that total. Thirty selected attempts lack historical-price costs even though
  their shared-reference calculations are complete.
- The separate task audit binds 33 reproduced original grades and 13 corrected
  Textual replays. Four original failures become full passes. Forty-two of the
  75 inspected attempts could not be replayed in their exact historical images.
  Replays used recovered post-verification workspaces, not preserved original
  candidate patch bytes. This is not a fully corrected 200-run dataset.
- All 200 selected attempts have partial tool visibility. Only Codex has tool
  intervals in the selected C4 files: 4,248 records, of which 2,818 have zero
  duration. The other four harnesses have no such intervals. Existing labels
  correctly avoid calling non-model time pure harness overhead.
- Selected agent intervals do not overlap: observed peak selected concurrency
  is one. However, harnesses ran on different mixtures of dates. For example,
  37/40 Codex and 39/40 Pi attempts started September 19, whereas 38/40 Hermes
  attempts started September 15–16. This does not rule out other host activity.
- Every selected task has two verifier-image identities across its 25 attempts.
  Rebuilding images may have been operationally necessary, but image equality
  is not established by matching task names.

These checks support descriptive claims about the selected executions. They
do not certify provider counters, reconstruct missing historical controls, or
establish a general or causal harness ranking. The original Qwen–Pi pass-rate
difference is +5 percentage points, with an exploratory task-cluster interval
of −10 to +17.5 points. Eight deliberately selected tasks are not a random
sample of all coding work.

Evidence: [canonical analysis](../evidence/linux-results-2026-09-19-r1/analysis.json),
[selection](../evidence/linux-results-2026-09-19-r1/summary.json),
[verification audit](../evidence/task-verification-2026-09-21/README.md),
and [methodology](../METHODOLOGY.md).

## Improvements in priority order

| Priority | Improvement | Why it matters | Acceptance evidence |
|---|---|---|---|
| Before new paid runs | Preserve evidence across the entire attempt lifecycle | Newly captured settings are lost on retry; original patches and some historical images are unavailable | Failed, retried, resumed and interrupted mock attempts retain individually bound evidence; a retained candidate can be graded offline in its exact image |
| Before reusing affected tasks | Finish task-contract and verifier validation | Three known ambiguities affected outcomes; several additional assertions need closer checking | Versioned task cards, prompt-to-assertion mapping, reference/pristine checks, targeted incorrect implementations, alternative valid implementations and stability checks |
| Before a controlled comparison | Enforce declared execution conditions and validate evidence | Recording Docker settings does not impose CPU/RAM limits or establish matching reasoning budgets | Admission checks, actual observations, explicit uncontrolled fields, immutable task/verifier identity and preserved request-setting coverage |
| Next campaign protocol | Randomize within task/time blocks on the same Linux host | One-host execution alone does not remove time/provider/cache confounding | Recorded seed, randomized order, matched blocks, resume integrity, host-pressure and provider-incident records |
| Core measurement work | Validate tool timing and explain failure causes | The benchmark currently cannot separate most tool work from harness work | Known-duration local probes, adapter coverage statements, correctly handled overlap/children/compaction, trace-linked failure categories |
| Next task version | Broaden work patterns while retaining useful anchors | Eight library features omit important workflows | Predeclared coverage and held-out evaluation tasks; language/size/source gates retained or explicitly revised |
| Analysis, using existing data first | Add sensitivity, reliability and complete collection accounting | A single observed lead hides task dependence and recovery expense | Per-task differences, 0/5–5/5 reliability counts, cost/token uncertainty, leave-one-task-out checks and a separate all-attempt ledger |

### 1. Evidence retention: a newly reproduced defect

`packages/runner/src/matrix.ts:140` preserves a fixed list of retry artifacts.
It omits `agent-conditions.json`, `verifier-conditions.json`,
`execution-conditions.json`, and `events.jsonl.upstream.jsonl`.
`stageTask()` then deletes execution sidecars (`cell.ts:105`), and starting a
new proxy truncates the upstream sidecar (`proxy.ts:218`). A two-attempt mock
matrix reproduced the loss: the first run/events survive in `.attempts`, but
all four evidence files exist only for the second attempt.

This does not change the current snapshot's verified token arithmetic. It is
a future diagnostic/reproducibility defect and should be fixed before another
campaign. The release copier also omits these sidecars
(`packages/report/src/freeze.ts:115`, `:152`). Public release needs an allowlisted,
sanitized projection and bindings to sanitized evidence; copying private files
or retaining hashes that no longer match rewritten C4 bytes is insufficient.

Also retain the candidate patch before any grader changes the workspace,
including after timeout where possible, together with exact task/verifier
image artifacts and source/build manifests. Test offline retrieval and replay
before deleting local images. A digest establishes identity, not availability
or grader correctness. Preserve raw outcomes and publish later rescoring as a
separate, versioned analysis.

### 2. Task quality: keep useful workloads, repair weak contracts

The current suite contains four Python and four TypeScript library feature
requests, in two small and six medium repositories. The work is substantial:
task-level median interactions span 53–167 API attempts and approximately
6.5–23.9 minutes. Long execution and repeated input tokens do not, by themselves,
establish long-context retrieval or compaction coverage.

| Task | Original passes / 25 | Recommendation |
|---|---:|---|
| PSD blend ranges | 22 | Keep as an integration/cost anchor. Check whether the conditional per-channel compositing assertion can pass without exercising its intended behavior. |
| cattrs partial structuring | 19 | Keep. Strengthen regression assurance beyond the seven selected regression checks. Application recovery is not a harness-recovery test. |
| Textual follow state | 6 | Use the reviewed class-subscription correction in a new task version. Existing partial rescoring demonstrates four false negatives, not the correctness of every other outcome. |
| TOMLKit converters | 24 | Keep as a successful-work overhead anchor. The test named `test_comments_collected` asserts parsed values without checking comments; test a comment-dropping implementation. Other comment tests do contain checks. |
| Ink grid layout | 1 | Apply the explicit minmax-growth contract before reuse, then recalibrate. Retain the storage-failure diagnosis separately from task correctness. Do not drop it merely because its pass rate is low. |
| True Myth combinators | 22 | Keep as a small-repository/API anchor. No clear conflict was found in sampled contract/assertion inspection; this is not exhaustive certification. |
| Happy DOM observer | 8 | Next verifier-audit priority. Check polling/absence timing and queued-record draining; current sampled `takeRecords` assertions exercise empty cases. Flakiness and false outcomes have not been demonstrated. |
| SuperJSON error stacks | 3 | Apply the versioned pseudo-path/stripping clarification before reuse. Do not retroactively award passes based only on the revised prompt. |

Source inspection found assurance gaps, not proof of additional incorrect
historical grades. Low pass rates may reflect real implementation failures,
ambiguous contracts, infrastructure problems, or incomplete solutions; the
classification must come from evidence rather than the score alone.

Each future task needs a compact validity card: user obligation, relevant
repository/workflow, intended harness stress, source/license/revision,
environment, visible instructions, hidden acceptance obligations, regression
scope, reference/negative controls, alternate solutions, repeatability, and
known limitations. Have a reviewer independent of the task author map every
critical hidden assertion to the written contract. Test deliberately broken
implementations, including skipped behavior and constant/no-op responses.
Repeat identical-patch checks for async tasks under the frozen environment;
do not simply increase timeouts until they pass.

The present calibration approval is a documented maintainer exception based on
campaign outcomes, not an independent portable two-CLI calibration attestation
([review record](s3-deepswe-review.json)). Preserve that distinction. Public
tasks/reference solutions also create possible prior model familiarity;
this review did not establish training contamination. Use an independently
reviewed held-out tranche for confirmation, frozen before inspecting its
comparative results. Preserve the existing source lineage and review gates.

### 3. Collection controls: complete the path from capture to comparison

The new request and Docker capture is useful and already implemented. It is
observational: the agent/verifier launch commands do not currently set explicit
CPU or memory quotas (`docker.ts:522`, `:761`), and post-run observations permit
unset limits or unavailable inspection. S7 admission/freezing and the current
publisher do not yet consume these sidecars as future-campaign eligibility
evidence. This is a remaining integration step, not a request to redo capture.

Define the comparison question first: native deployable configurations using
the same model, or a particular controlled setting/ablation. Keep native tool
sets, system prompts, context management and orchestration as harness behavior.
Record adapter compatibility overrides. If reasoning/output settings cannot
be matched across APIs, label the configuration contrast rather than claiming
only the harness changed. A future settings study can use the same C1–C4
instrument with an explicitly distinct condition; it need not introduce a new
measurement model.

Declare and enforce calibrated CPU/RAM/PID/disk/time policies, dependency
images, network access, session resets and concurrency. Record configured,
observed, unknown and uncontrolled values separately. Watch host load, memory
pressure and disk capacity outside the measured workload where possible.
Record returned model/provider identity; requested settings are not evidence
that the provider honored them. Omitted defaults remain unknown.

Keep one Linux host and serial agent execution. Use each task/repetition as a
block containing all compared harnesses in a recorded randomized order; rotate
positions across blocks. The existing matrix already has a randomized path
(`matrix.ts:91`); integrate it with campaign ledgers, recovery and spending
guards instead of building a second runner. Distribute blocks across time and
record interruptions. Preregister retry eligibility so a native task failure
is not repeatedly attempted until it passes.

Fresh local sessions do not reset a provider's shared prefix cache. Report
cache state as uncontrolled unless a supported mechanism establishes otherwise;
do not add prompt salts just to force misses in the main comparison. Separate
cold/warm experiments require explicit policies. Cache hit rate is diagnostic:
a long failed run can have excellent cache reuse and still waste tokens.

### 4. Explain the measured overhead

Preserve the existing additive measurement model. First establish which native
tool events are complete and which timestamps describe execution rather than
buffered stdout receipt. Use zero-provider mock/known-duration tool probes,
including parallel tools and child sessions. Calibrate observer overhead and
clock alignment with representative request sizes and concurrency. C1 measures
the proxy-observed HTTP interval, including routing/buffering; it is not pure
provider inference time.

Useful diagnostics are request retries, context/token growth, available
compaction events, tool execution time, unobserved gaps, failed verification,
and repeated unsuccessful edit/test loops. Every diagnostic needs a coverage
count. Add a trace-linked taxonomy distinguishing implementation failure,
contract/grader defect, provider/accounting error, runtime/storage/OOM failure,
and timeout. Keep the original C4 outcome. Verify saved timeout patches
offline when possible, without counting an unfinished run as a completed run.

A public artifact should contain allowlisted metadata and sanitized evidence
without prompt bodies or credentials. Private trajectories can support audit;
LLM failure classifications should remain suggestions until checked against
logs/tests. Start with deterministic rules and a small human-reviewed sample
blinded to harness identity where feasible; keep development labels separate
from validation labels and report agreement, precision/recall and unknowns.
They should not replace executable correctness tests. This follows the
validation approach documented by
[Inspect Scout](https://meridianlabs-ai.github.io/inspect_scout/validation.html).

### 5. Broaden tasks and analysis economically

A reasonable next portfolio is 16 reviewed tasks: the eight repaired legacy
workloads plus four short changes/diagnosis tasks and four deeper integration,
build/configuration, context-retention or recovery workloads. This is a coverage
target, not a statistically justified sample size. A smaller eight-task pilot
could span two short anchors, two diagnosis fixes, two multi-file features,
one async integration and one controlled context/recovery task. Freeze the
selection rule before results; do not optimize the portfolio for particular
harnesses. Synthetic recovery probes should be a labeled diagnostic stratum,
not pooled into an overall task-quality claim.

Keep the user's primary metrics: pass rate, average task cost, whole-benchmark
cost, cache and input/output tokens. Add task-level cost/token differences,
reliability counts from 0/5 to 5/5, uncertainty and leave-one-task-out sensitivity.
For the existing original Qwen–Pi data, deleting one task moves the observed
gap from +2.86 to +11.43 points; none of these calculations repairs confounding.
Add a separate collection ledger covering all retries, interruptions and
superseded runs, with known subtotals and unknowns preserved.

Predeclare a practically meaningful difference and a primary comparison before
confirmatory analysis. Five repetitions help estimate variability on a task;
they do not create five independent task types. Prefer broader distinct tasks
over automatically increasing every repetition count. Quality-at-budget curves
require actual enforced-budget observations or valid saved checkpoints; final
patches cannot tell us what a harness would have solved at a lower budget.
Keep any result specific to the chosen model/configuration. A second model is
only needed later if broader claims become the objective.

## What current external work contributes

The comparison focuses on methods we can adopt, not their leaderboard positions.
Primary sources were checked on September 22, 2026. Their benchmark results were
not independently reproduced in this audit.

| Work | Useful practice | Application here |
|---|---|---|
| [FrontierHarness repository](https://github.com/frontier-harness-eval/eval) | Fresh runtime restores and explicit comparability requirements; reproduction runs record egress policy and require matched controls when baseline conditions are missing | Add a tested campaign eligibility contract and per-run reset evidence. Preserve our precise mean/task and selected-benchmark cost definitions. |
| [Inspect tracing](https://inspect.aisi.org.uk/tracing.html), [logs](https://inspect.aisi.org.uk/eval-logs.html), [scoring](https://inspect.aisi.org.uk/scoring.html) | Sample-level traces, retained logs, rescoring, clustered metrics and explicit error handling | Make every diagnosis traceable, preserve score history, and connect future sidecars to the analysis. Adopting the framework is not necessary. |
| [Harbor](https://docs.harborframework.com/) | Reusable task/environment/agent abstractions and verifier/artifact conventions | Borrow the separation of execution, grading and artifacts while retaining C1–C4 and existing source restrictions. |
| [Harness-Bench, May 2026 preprint](https://arxiv.org/abs/2605.27922) | Workflow coverage, manually reviewed task contracts, native harness behavior and model–harness configuration analysis | Broaden task strata and preserve native strategies. Its composite scoring approach is unnecessary for this time/cost instrument. |
| [Harness or Model?, September 2026 preprint](https://arxiv.org/abs/2609.11987) | Same-model task contrasts, private evaluation tasks, oracle separation, telemetry correction and explicit accounting uncertainty | Audit token semantics, separate outcome from completion, and avoid a universal winner claim from a small selected cohort. Private tasks trade public replayability for reduced exposure. |
| [Anthropic evaluation guidance](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) and [infrastructure experiment](https://www.anthropic.com/engineering/infrastructure-noise) | Repeated trials and grader maintenance; empirical sensitivity to resource enforcement | Audit graders and calibrate resource headroom. Do not copy a resource multiplier without checking these tasks. |
| [AI Agents That Matter](https://arxiv.org/abs/2407.01502) and [NIST randomized blocks](https://www.itl.nist.gov/div898/handbook/pri/section3/pri332.htm) | Joint cost/outcome evaluation, holdouts and control of nuisance variation | Keep failure cost visible, reserve confirmation tasks, and randomize within matched task/time blocks. |

One concrete reason to inspect implementations: FrontierHarness's
[pinned report generator](https://github.com/frontier-harness-eval/eval/blob/e837a70bd6beb4e72eeeda62dd06e3bd34f6cb63/skills/frontierharness-eval/scripts/build-report.mjs#L128)
says its website's median-cost label represents total available cost divided by
passes. That is not a median or our average cost per attempted task. Keep our
definitions; a visually effective comparison site is not a statistical standard.

Recent preprints add useful protocol ideas, but their claims need separate
verification. [Prompt-Induced Waste v6](https://arxiv.org/html/2608.01347v6)
describes development/holdout separation, frozen prompt semantics and gateway
logging. Its cited code repository was unavailable during this audit, and its
adaptive controller is proposed rather than evaluated. These are reasons to
borrow testable methods without treating the paper as a reproduced result.

## Recommended sequence and spending boundary

1. **No new provider spend:** fix retry/archive evidence retention; retain
   pre-verifier patches/images; integrate condition checks; audit the affected
   verifiers; build task cards; validate instrumentation with mocks; add existing
   data sensitivity and the complete collection ledger. Offline verification
   still consumes compute/storage, but not model tokens.
2. **Small, separately budgeted protocol pilot:** after those gates pass, select
   two relevant harnesses and four representative frozen tasks, two repetitions
   each: 16 attempts. This checks collection/retention/conditions, not a winner.
   An eight-task version is 32 attempts if checking every legacy task is needed.
   Use a new campaign identity and a conservative per-attempt reserve; the old
   mean is not a safe spending cap. No pilot is authorized by this report.
3. **Only then expand:** use pilot variability, intended decisions and a
   prespecified meaningful difference to choose the next task/sample budget.
   Keep the historical campaign intact; reuse it for offline analysis and
   diagnostics without mixing it into a newly controlled campaign.

## Audit artifacts and verification

Local supporting files are under `scratch/research-20260922/`:
`results-review.md`, `tasks-review.md`, `landscape-review.md`,
`recompute-results.py`, `recompute-results.txt`, `collection-observations.json`,
`sensitivity.json`, and `retry-evidence-probe.mjs`/`.json`.
They contain review notes and derived diagnostics; original evidence was not
modified. The scratch notes are not a portable public release.

Executed checks: report freshness passed; 35 focused report tests passed; all
200 raw condition records reconciled; rebuilding and byte-comparing canonical
analysis passed; independent arithmetic/bootstrap assertions passed. The mock
retry exercised actual `runMatrix`, `stageTask` and proxy initialization with
zero upstream requests and reproduced the retention defect. All eight task
prompts/manifests and targeted verifier assertions were inspected, with source
hash checks. No claim is made that every hidden assertion or all historical
failed patches received a new exhaustive behavioral validation.
