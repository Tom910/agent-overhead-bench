# Research: making harness differences interpretable

Research requested by the maintainer, September 21, 2026. Read-only review of
primary sources and local methodology; no benchmark runs or implementation
changes. Recommendations are proposals, not authorization to spend tokens.

## Assessment

The current project has useful measurement foundations: one selected Linux
dataset, a shared model/provider route, five repetitions, token-based reference
prices, per-task outcomes, immutable original results, separate verifier audits,
and exploratory task-cluster intervals. It cannot yet establish a general
harness-quality ranking. All eight tasks are feature requests, historical
conditions are incompletely recorded, execution was grouped by harness, and all
200 selected attempts have only partial tool visibility. A better presentation
cannot recover those missing experimental controls.

## Comparable work worth borrowing from

| Source | Useful precedent | Implication here |
|---|---|---|
| [FrontierHarness website](https://frontierharness.org/) and [repository](https://github.com/frontier-harness-eval/eval) | Same-model comparisons, task drilldowns, fresh runtime restores; its reproduction workflow records egress policy and withholds comparability when baseline controls are missing | Keep the clear cost/pass presentation; prioritize enforceable conditions and matched controls over another overall score |
| [Inspect log viewer](https://inspect.aisi.org.uk/log-viewer.html), [tracing](https://inspect.aisi.org.uk/tracing.html), and [scoring](https://inspect.aisi.org.uk/scoring.html) | Per-sample messages, scoring and metadata; action start/end traces; rescoring and clustered statistics | Make a result explainable from its evidence; borrow concepts without replacing C1–C4 or adding a dependency |
| [AI Agents That Matter](https://arxiv.org/abs/2407.01502) | Joint cost/accuracy evaluation, reproducibility and holdout concerns | Preserve tokens and cost alongside success; reserve unseen tasks for confirming improvements |
| [Anthropic's evaluation guidance](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents) | Multiple trials, transcript review, clear outcome contracts and grader maintenance | Reference passes alone do not certify fair tasks |
| [Anthropic's infrastructure experiment](https://www.anthropic.com/engineering/infrastructure-noise) | Resource enforcement changed measured agent outcomes; allocated resources and hard limits differ | Record actual enforced conditions and operational failures, not merely host specifications |

## Priorities

1. **Finish condition attestation before another comparison campaign.** Already
   present: model/routing/version/image provenance and explicit historical
   unknowns. Missing: per-run effective CPU, RAM, PID and disk constraints,
   network enforcement, execution order/time block, provider defaults, and cache
   policy. Capture allowlisted observations, bind them to raw evidence, and
   distinguish configured, observed, uncontrolled and unknown. Preserve native
   harness prompts/tools/context behavior as the treatment. A shared model name
   alone does not imply matched reasoning or sampling. Implementation and local
   mock checks cost no model tokens; attesting actual future runs requires those
   runs. Resource motivation: [infrastructure experiment](https://www.anthropic.com/engineering/infrastructure-noise).

2. **Add a task coverage and validity card.** Already present: source review,
   polarity checks and three focused audits. Missing: a public mapping from
   task to workflow, language, repository breadth, context pressure, test/debug
   cycle and duration. Eight feature additions do not represent bug fixing,
   refactoring, maintenance, exploration or long-session recovery. Audit the
   remaining five tasks; freeze clarified instructions, equivalent-solution
   checks, negative controls and exact verifier images. Keep feature-check
   fractions diagnostic: 79/80 checks is not 98.75% of user value. Metadata and
   offline verifier work are zero-spend. New workflow coverage requires reviewed
   new tasks and later runs, preserving existing source gates. This follows the
   distinction between outcomes and grader artifacts in [evaluation guidance](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents).

3. **Explain where the overhead comes from.** Existing request intervals,
   input/output/cache counts and gaps are a strong start. Add task/attempt
   drilldowns with request timelines, retry/error categories, context growth,
   compaction events where exposed, and observed tool durations. Every panel
   needs coverage counts. All current tool timelines are partial: non-model
   time cannot be labelled pure harness overhead. Prioritize adapter coverage
   validation and no-spend known-duration subprocess probes before ranking
   harness time. Existing request plots and audited failure categories need no
   model calls; new native event capture needs future runs. [Inspect tracing](https://inspect.aisi.org.uk/tracing.html)
   provides a concrete diagnostic precedent.

4. **Randomize within task/time blocks.** Replace one-harness-at-a-time future
   scheduling with each task/repetition block containing all compared harnesses
   in recorded, randomized order, serially on the same Linux host. Rotate order
   across blocks and record host pressure and provider incidents. Fresh local
   sessions do not reset provider caches; report provider cache state as
   uncontrolled unless the provider supplies a verifiable mechanism. This
   reduces temporal confounding, without promising deterministic responses.
   Scheduler/mock validation is zero-spend; the evidence requires a new campaign.
   Design basis: [NIST randomized blocks](https://www.itl.nist.gov/div898/handbook/pri/section3/pri332.htm).

5. **Show reliability and practical differences, not a forced winner.** Already
   present: task-cluster pass-rate intervals and best=100% display. Add counts of
   tasks passing 0/5 through 5/5, audited operational failure rates, per-task
   cost/token differences, and leave-one-task-out sensitivity. Retain all costs.
   Predeclare a practically meaningful difference and primary comparison before
   confirmatory runs; account for multiple comparisons when claiming winners.
   Do not turn five repeats into forty independent task samples. Existing data
   supports exploratory additions without spend; broader conclusions need more
   distinct tasks. Current Qwen–Pi lead is +5 percentage points with exploratory
   interval [−10, +17.5], so it does not establish separation.

6. **Keep cost tradeoffs transparent.** Retain average cost per task and total
   benchmark cost, with input/output/cache tokens first-class. Add an observed
   pass-versus-tokens frontier and optional common-price sensitivity controls.
   Secondary “total spend / successful attempts” includes failed-attempt spend
   but is not the same as average cost per task; label it explicitly and leave
   it undefined at zero passes. Do not infer success at smaller budgets from
   final patches: genuine budget-quality curves require enforced-budget runs.
   Most display changes are zero-spend. Joint optimization is supported by
   [AI Agents That Matter](https://arxiv.org/abs/2407.01502).

7. **Preserve enough evidence to reproduce the explanation.** Keep original
   candidate patches before verification, exact verifier images or reproducible
   build inputs, request-setting sidecars and sanitized failure evidence.
   Publish a small artifact manifest and retention coverage. The audit already
   found missing original patch bytes and unavailable historical images.
   Hashes prove identity, not availability or grader correctness. This requires
   storage/protocol work, not model calls; it prevents avoidable future reruns.

## Minimum economical next experiment

Do all offline work first. Then propose, rather than automatically launch, a
**32-attempt protocol pilot: two preselected harnesses × eight frozen tasks ×
two repetitions**, randomized within task/time blocks on Linux. Select the pair
for the user's actual decision, not merely because it currently ranks highest.
Use the corrected contracts and a new campaign identity; do not overwrite or
mix historical runs. Preserve all failures and specify retry eligibility before
starting. This pilot tests controls and measurement completeness; it cannot
establish a universal winner or reliably resolve a five-point gap.

Set a hard campaign budget from conservative per-cell estimates before starting;
historical mean cost is not a safe spending ceiling. If the protocol works,
estimate the next sample size from task-level variability and the predefined
practical difference. Prefer adding distinct, reviewed workflow coverage over
blindly adding repetitions to the same eight tasks. Generalization beyond this
model requires a later, separately budgeted second-model experiment; it is not
necessary for a useful model-specific harness comparison.
