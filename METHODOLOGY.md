# METHODOLOGY

This document records **what was actually done** for the 2026-09-14 DeepSeek
public-repository campaign and the 2026-09-04 local fixture pilot. The
official v1 results archive remains unpublished until `scripts/s7-freeze.sh`
and source sign-off complete.

## What this measures

Wall-clock and token-cost decomposition of coding-agent CLIs on selected Python and TypeScript tasks:

`end_to_end = startup + model_time + harness_time + tool_time`

- `model_time` is the **union** of API request intervals (overlapping subagent calls are not double-counted).
- `First byte (med)` is the median C1 `t_first_byte - t_req_start` across identifiable model attempts with a genuinely observed upstream byte. It is a byte-level latency measure, not a claim that the first byte is a semantic token. Run-level medians are then aggregated using the existing task/repetition hierarchy.
- `tool_time` is null when the CLI exposes no tool timeline (`visibility: none`). Harness share is **not ranked** for those tools.
- Raw `run.json` contains no derived metrics.

Current validation status: the selected adapters have only `none` or `partial`
local tool visibility, so no harness-share ranking is currently claimed. The
headline fallback is therefore explicitly `non_model_time / end_to_end` for
these rows; it includes unobserved harness and tool work and must not be read
as a harness-share measurement. A publication table may include harness share
only for a tool with a complete, positive-duration local tool timeline.
The Codex adapter captures its structured JSONL tool records into C3 and a
redacted raw artifact. A completed local smoke recorded complete pairs, but
the start and completion records arrived in one stdout batch and therefore
had zero measurable duration; Codex remains `partial` and is not ranked.
The OpenCode adapter requests its JSON event stream and projects completed
`tool_use` wall timestamps onto the Docker runner's monotonic anchor. A real
Flash smoke recorded four positive-duration tool intervals, but one task
cannot establish complete child-session coverage; OpenCode remains `partial`
and is not ranked for harness share.

The Claude Code adapter uses the provider model environment mapping rather
than Claude Code's native `--model` argument. A local Anthropic-compatible
transport capture verified that this sends the exact pinned model ID. The
real OpenRouter diagnostic returned 404 `unrecognized_model` for
`z-ai/glm-5.3-flash` on the Anthropic Messages protocol, so Claude Code is
excluded from a pinned run with this model unless an Anthropic-compatible
provider route is available. Aider's measured workspace context is limited
to deterministic source/config/text files under 3 MB, excluding lockfiles and
runtime noise; a real rerun passed this admission check but timed out on the
DeepSWE task.

S7 preflight validates the declared official scope before checking the
provider key or starting Docker. `plans/s7-official-tool-scope.json` (GLM
Flash/OpenRouter) and `plans/s7-deepseek-tool-scope.json` both list
claude-code, cline, codex, hermes, pi, and qwen. Aider and OpenCode are
held out of those profiles. The 2026-09-14 public-repository campaign used
the DeepSeek profile and then excluded Claude Code from selected results
because model identity and completion were unresolved; it is not silently
counted as a failed benchmark cell. The selected scope is archived with
every official release.

## Single-provider validation condition (September 9)

The maintainer approved `AOB_ONLY_PROVIDER=z-ai/fp8` with fallbacks disabled
and one validation cell at a time. This extends the existing Relace exclusion:
C4 records `provider_routing.only_provider` and `allow_fallbacks: false`;
validation, resume, archive, and report grouping bind the complete policy.
The proxy overrides client routing on all three supported API formats, retaining
the buffering/timing caveat below. The endpoint pin reduces routing variation;
it does not establish stable provider load or deterministic model responses.
Fresh cross-protocol probes passed token accounting. Full validation and all
existing source, verifier, calibration, and publication gates remain required.

## Explicit provider exclusion condition (September 8)

The maintainer approved `AOB_IGNORED_PROVIDERS=relace` consistently for all six
current CLIs (Claude Code, Cline, Codex, Hermes, Pi, and Qwen). This records
`provider_routing.ignored_providers` in C4 and binds the routing policy to
validation, campaign and retry identity. Earlier evidence without this policy
does not validate the new condition. Model, task and verifier pins stay fixed.

The proxy merges exclusions into each model request's `provider.ignore` while
preserving the other JSON tokens. This requires complete request buffering,
bounded at 16 MiB, before upstream submission. That proxy work is included in
C1 request intervals and therefore in the reported model-time union; it must
not be described as provider execution time or separately subtracted. Response
streaming remains unchanged. Results using different routing policies must
remain separate.

The small exclusion probe avoided Relace but another provider also returned
inconsistent usage counters. This is diagnostic evidence, not a completed S7
validation or a claim that provider accounting has been resolved.

## Measurement regimes

Every task declares an explicit regime, and cells are only compared within one
regime. A regime bounds both the task's reviewed expected duration and its
hard timeout:

| Regime | Expected minutes | Timeout (s) |
|---|---|---|
| `short` | 1–5 | ≤ 300 |
| `long` | 6–15 | 301–900 |
| `extended` | 16–180 | 901–10800 |

`extended` was added on 2026-09-03. The reviewed DeepSWE source declares a
uniform 10800-second agent budget for all 113 of its tasks, so constraining
that source to the short regime produced timeout-only cells that carry no
overhead signal at all. The extended ceiling is the source's own declared
budget, so the regime remains closed rather than unbounded; a task whose
timeout exceeds its source budget is still rejected. Overhead decomposition
needs cells that complete, and the regime a task runs in is recorded in C4 and
archived with every release.

This is not a capabilities leaderboard or a vendor cost claim. The current checked-in tasks are local validation fixtures; the publication run must name its selected public source and preserve its task semantics. The primary regime emphasizes startup and context assembly rather than multi-hour sleep/retry.

## Task-source provenance

The checked-in development suite is a local, reproducible fixture. Its
`packages/tasks/suite-manifest.json` records each task checksum, revision, and
preparation recipe; `LocalTaskSourceAdapter` copies only the public task
inputs into a timed cell and excludes `reference/`. This is sufficient for
zero-spend validation, but it is not a public-source v1 dataset claim. A
publication run must record the selected external source repository, exact
revision, license review, task IDs, checksums, and preparation command here
before numbers are released.

The DeepSWE preparation path also preserves the source repository's
machine-readable `source_dataset` field in the original source manifest. The
maintainer-selected DeepSWE revision declares `swe-bench-ultra`; this exact
lineage is accepted only as preserved DeepSWE provenance, not as a direct
SWE-bench task import. Direct or noncanonical `swe-bench`, `terminal-bench`,
and `vetta` labels remain rejected before credentials or Docker work. Source
review, native verifier polarity, two-CLI calibration, and task-composition
gates are still required before S7.

## Pinning

Pinned-condition comparisons use one OpenRouter model for every included CLI, via one uniform key+base-URL path. No Ori control was run because that control was unavailable on the measurement host; no native-vs-Ori process-tax or turns/tokens delta is claimed. Reported turns count identifiable model API attempts, including failed attempts; usage, cache, and cost remain successful-response-only.

**S2 status:** contracts are **not frozen**. The current official adapter
list is claude-code, cline, codex, hermes, pi, and qwen. Aider and OpenCode
remain optional adapters. Ori is not installed, so pinning_path is
key+base-URL uniform. GLM Flash (`z-ai/glm-5.3-flash`) remains the original
pinned-model smoke profile. The 2026-09-14 campaign used
`deepseek/deepseek-v4.1-flash` instead; those results are a snapshot, not a
v1 freeze.

**Codex/OpenRouter compatibility:** the current Codex recipe sets
`model_reasoning_effort = "high"` because Codex 0.149.1 otherwise omits the
reasoning setting and this endpoint rejects that request shape. It also sets
`web_search = "disabled"` and disables optional server features that the
OpenRouter Responses endpoint does not accept. These are recorded as
Codex-specific compatibility settings, not as a claim that every CLI has the
same native defaults. The Docker recipe uses the shared S5 outer sandbox and
therefore passes Codex's dangerous-sandbox bypass inside that already isolated,
capability-dropped container; the host recipe retains `--sandbox workspace-write`.

## Proxy

Local HTTP reverse proxy, byte-for-byte passthrough, monotonic clocks. Self-overhead is measured by `scripts/s1-calibrate.sh` (p99 added latency vs direct mock, ten concurrent requests). Linux is preferred for official numbers; macOS Docker Desktop is permitted when the virtualization and possible CPU-steal limitation are recorded. Agent cells use a per-cell internal Docker network and a runner-owned relay that is the only bridge-connected component; agents cannot reach the host gateway or external network directly. The route is smoke-tested, and verifier containers use `--network none`. The latest no-spend calibration on this macOS host (2026-08-29) used 30 streamed samples (three rounds of ten concurrent requests) and measured 1.70 ms p50 / 3.29 ms p99 added latency at zero mock delay; it made zero provider requests. A preceding sample measured 5.34 ms p99, so this remains a transient host-scheduling gate that S7 must repeat immediately before an official window. The same run's two-process clock calibration measured a 0.78 ms maximum projection bound across 20 samples, also with zero provider requests; S7 must repeat it immediately before the official window. Container-emitted OpenCode epoch timestamps are additionally rejected when they map before the adapter anchor. S7 now additionally runs an interactive no-spend stdio handshake in `aob-base:s2`, retains the minimum-round-trip offset estimate, and requires a maximum conservative Docker-VM/host epoch bound of 10 ms (absolute estimate plus half the retained RTT) with a retained round-trip of 20 ms or less; this is a preflight-time agreement check, not a guarantee of zero drift during a long run or complete child-session visibility.

## Run protocol and reconciliation

Each cell gets a fresh staged workspace, one proxy instance, one tool
invocation, and one verifier invocation. The matrix writes its lifecycle state
before and after staging, running, and verification; a completed `run.json`
can reconcile an interrupted process only when its identity matches the cell.
Failed cells retry once and then remain quarantined. The recorded-spend cap
requires a conservative per-cell upper-bound estimate before execution,
reconciles C1-derived usage after each cell, and rejects unavailable usage. The
runner stops before starting another cell when the recorded total would exceed
the cap; it cannot cancel a provider-side request at the exact dollar boundary
or control when external billing becomes final.

## Aggregation and visibility

S6 reads raw `run.json` and sibling `events.jsonl` files. It groups by source,
revision, regime, condition, model, tool, price book, provider routing,
tool configuration, Ori version and recorded host fields; computes medians and
IQRs only after the raw-file validation and success-denominator checks; and
never writes those derived values into `run.json`. Harness-share ranking is
reserved for tools with full tool-event visibility. Partial or absent
visibility is shown as a limitation, not treated as zero. Every identifiable
model API attempt contributes its proxy interval to the model-time union,
including upstream HTTP or network failures; usage and cost remain
successful-response-only.

## Statistics

The target is N ≥ 4 per cell. N = 4 is exploratory; actual timing-eligible
counts can be smaller because failed verification is excluded from headline
timing. Headline E2E is the median across per-task medians. Headline spread is
the median of the measurable within-task IQRs; tasks with fewer than two
eligible repetitions contribute no IQR. This is neither a pooled IQR nor a
confidence interval. Per-task quartiles use linear interpolation.

The S6 analysis view exposes every loaded attempt and separates `completed`,
`verify_error`, timeout and adapter-error outcomes. Reconciled failure timing
is shown only in its own outcome distribution. Every metric shows its available
and missing sample count. A known static-cost subtotal with missing prices is
not a total invoice. Successful-response usage and all-attempt turn counts keep
their existing definitions.

Pairwise comparisons first intersect task identities with successful timing
on both sides within the same recorded population. Identity includes the task
base revision, verifier image and environment kind. Each side summarizes the
same task set using the existing median-of-task-medians hierarchy. The reported
ratio is the median of within-task right/left ratios; it need not equal the
ratio of the displayed summary medians. Per-task repetition counts remain
visible. This is exploratory success-conditioned matching, not paired random
seeds, matched execution windows, or a causal estimate of harness effects.
No matched-model comparison is generated for an unspecified model.

Stacked timing charts use arithmetic means within tasks, then arithmetic means
across those tasks, so the original timing buckets remain additive. Their
values intentionally differ from headline medians. Independently aggregated
medians must not be stacked as an E2E decomposition. The historical campaign
report files retain their original values; the new analysis is a separate view.

`analysis.json` is an allowlisted per-attempt export with C1/C4 hashes, measured
identity, timing, usage, static costs and reasons for unavailable values. It
contains no logs, request bodies or workspace paths. The public snapshot export
contains only its 200 selected outcomes, excluding superseded infrastructure
attempts. It can reproduce `analysis.md` and `analysis.html` offline using
`scripts/s6-analysis-replay.mjs`; summaries are recomputed from attempt facts.
These artifacts do not replace official archive verification or invoice
reconciliation.

Schema v2 additionally exports allowlisted per-request observations. Requests
are ordered by start time, gaps are uncovered intervals after the running
maximum response end, and tail time ends at adapter completion. Tail and gap
shares use first request through adapter completion, excluding startup; those
shares are unavailable for unreconciled adapter timing. Network-error closure
markers are not first-byte observations. Wait and transfer remain unavailable
for those calls, matching the existing C1 derivation.

Request-summary tables report medians across run-level summaries with separate
available and missing counts, and per-task tables retain outcome separation.
Cumulative token trajectories sum successful-response usage only. Cumulative
cost curves label partial pricing as a known subtotal and mark missing calls;
they never establish an invoice. Replay validates request geometry, token and
cost availability, and agreement with attempt facts, then checks and recomputes
request summaries instead of trusting supplied derived values.

## Cost

Cache-aware tokens × a dated `pricing.json` (`price_book`). Primary overhead is cost vs token floor, not vs cheapest other harness.

## Official v1 (S7)

The 2026-09-14 DeepSeek campaign executed native outcomes. The official
archive command `scripts/s7-freeze.sh` has not been run. Freeze still
requires source sign-off, anomaly review, and the private Activity export
(completeness exception recorded).

The `tool-batches-v1` protocol uses `scripts/run-validation.sh` for a separate
one-repetition validation across all eight selected tasks and six tools (48
cells). `scripts/run-tool-batch.sh` then executes one tool at a time within one
240-cell campaign: eight tasks, six tools, five repetitions. Validation must
pass before the first batch and remains bound to task/model/image/version
identities. It is not included in the timing aggregates or repetition counts.

Each invocation records its own monotonic clock anchor and cleanly closed host
window segment. Pauses between tools are allowed. Tool order is grouped rather
than randomized across time, so provider load and time-of-day changes may
confound cross-tool comparisons. No timings are calculated across these pauses.
Legacy four-repetition single-window archives retain their original protocol.

Campaign and tool recorded-spend caps are explicit, at most $1,500 in total.
The campaign cap includes validation, grand-run cells, and retained attempts;
freeze also checks replacement spend. Before freeze, the operator must review
outliers, quarantined cells, raw event files, tool-version pins, and the provider
activity export. Recorded-spend checks cannot cancel provider billing for an
in-flight request that exceeds its estimate.
The final release archive is generated only by `scripts/s7-freeze.sh` after
that review; staged workspaces, prompts, verifier scripts, and private
reference material are excluded.

## Pilot publication (2026-09-04)

The README carries a **pilot** leaderboard. It is a real measurement and a
complete matrix, and it is deliberately not the v1 dataset. Read it with these
boundaries:

- **Tasks are this repository's checked-in fixture suite**, whose source kind is
  `local-development`. `scripts/s7-preflight.sh` refuses that kind for an
  official archive, and correctly so: these tasks are not a reviewed public
  dataset. No public-source claim is made from them.
- **The matrix shape is complete**: 8 tasks x 6 adapters x 4 repetitions = 192
  pinned cells, one model (`z-ai/glm-5.3-flash`), one price book, one regime
  (`short`), executed sequentially in one session.
- **Harness share is blank for every row.** All six adapters are `partial` or
  `none` local tool visibility, so the published fallback is explicitly
  `non_model_time / end_to_end`. It contains unobserved harness and tool work
  and is not a harness-share measurement. Nothing in the pilot ranks harness
  share, and the renderer refuses to emit one for a non-`full` tool.
- **The evidence ledger records `status: "pilot"`**, not `released`, with a
  checksummed report artifact. `scripts/s8-launch-check.mjs` enforces that a
  pilot keeps the "unpublished until the v1 dataset ships" statement and labels
  its table as a pilot; it refuses a pilot ledger with no artifact.
- **Costs are small and are reported at four decimals below a cent.** A
  fixture task legitimately costs a fraction of a cent; two-decimal rounding
  previously displayed `$0.0065` as `$0.01`.

The pilot exists because the v1 path is blocked on evidence, not on machinery.
See `plans/S8-release-readiness-status.md` for what an official v1 run still
requires.

## Public-repository campaign snapshot (2026-09-14)

A non-Claude campaign completed 200 selected native outcomes on eight
DeepSWE public-repository tasks (five harnesses × five repetitions) in the
`extended` regime with `deepseek/deepseek-v4.1-flash` through OpenRouter,
DeepSeek-only, fallbacks disabled, and Relace excluded. Claude Code is
excluded from the selected set. Completing native outcomes does not approve
the DeepSWE source flags or produce an official archive.

The 200 slots mix two hosts and two price books (136 macOS DeepSeek-book,
34 Linux DeepSeek-book, 30 Linux OpenRouter-book). Linux cells ran on a
dedicated Linux measurement host. Timing, usage, and available static costs
must stay inside those populations; they are not one comparable matrix.
Native verifier pass/fail is a task outcome, not a harness ranking. Tool
visibility is partial. The README therefore links the host-separated
report rather than publishing a pooled overhead table. Evidence hashes in
`evidence/nonclaude-results-2026-09-14/summary.json` bind retained private
C4/C1 files; they are not a substitute for `scripts/s7-freeze.sh`.

The operator DeepSeek-only Activity export billed **$50.701287** across
24,999 rows (`model_permaslug`
`deepseek/deepseek-v4.1-flash-20260910`, the price-book `canonical_model`
of the pin). The dashboard DeepSeek V4.1 Flash total was **$52.1**. The
maintainer accepted the **~$1.40** shortfall as a 25,000-row export cap.
Earlier GLM 5.3 Flash and other dashboard models are prior account work and
are not in that export. See
`plans/S7-activity-export-gap-exception.md`.

## Publication gate

The official v1 results archive is unpublished. The historical GLM Flash
diagnostics below remain excluded from official-archive evidence. The 2026-08-27/28 DeepSWE calibration
reached the pinned `z-ai/glm-5.3-flash` endpoint and produced usage. The
FastAPI, Awilix, IPython, Mashumaro, Happy DOM, HTTPX, and dateutil diagnostic
cells did not complete within the 300-second short-regime gate; an extended
Awilix diagnostic also did not complete within 900 seconds. The dateutil
cross-CLI diagnostic used Codex and Hermes and spent `$0.040044365` across the
two quarantined cells. These cells are diagnostics only and are excluded from
v1 evidence. The pinned DeepSWE revision has no native refactor or test-fix
category; the eight-task selection preserves eight native
`feature_request` tasks (four Python and four TypeScript) rather than inventing
categories. Maintainer sign-off on 2026-09-15 approved that selection
(`plans/s3-deepswe-review.json`). Its native DeepSWE category distribution is
8 feature requests (4 Python, 4 TypeScript); this is reported as source
provenance, not treated as a balanced category sample. Ofetch, Tomlkit, and
True Myth have passed source verifier polarity; however, Ofetch timed out in
both Codex attempts, True Myth timed out in both Codex and Hermes, and Tomlkit
timed out in Codex, so none is short-regime calibration evidence. Ofetch and
True Myth are rejected for the short regime. SuperJSON now passes source
verifier polarity and is the provisional TypeScript replacement, but its
two-CLI short-regime calibration is still pending. Automated verifier polarity
for all eight provisional selected tasks is now recorded in the S3 task plan;
that does not constitute source review or short-regime calibration. SuperJSON's
Codex diagnostic also exhausted both 300-second attempts and was quarantined
after `$0.015474885`, so it is not short-regime calibration evidence. Human review
is still required for model
selection, source and license provenance, adapter fairness, anomaly handling,
provider cost reconciliation, methodology freeze, courtesy notifications, and
release publication. Until those gates are complete, README numbers remain
unpublished.

The subsequent one-task SuperJSON two-CLI diagnostic (2026-08-30) used one
Codex and one Hermes repetition plus the runner's single retry allowance. Both
final cells timed out with preserved C4 artifacts; Codex emitted 15 model turns
across its attempts and Hermes emitted 5, with no verifier pass. The retained
spend was `$0.01869325`. This confirms the retry and spend accounting path but
does not qualify the task for calibration or publication.

An extended Hermes diagnostic on `cattrs-partial-structuring-recovery` with a
900-second bound made 33 model attempts, but two successful streams and one
aborted request had unavailable usage and the model produced no patch. Only the
known usage-bearing subset prices to approximately `$0.0174`; the runner
refused to fabricate a capped spend total, so this cell is excluded from all v1
evidence.

The same prepared task was then run once with Codex and the pinned model under
the same 900-second, `$2` diagnostic cap. It produced 47 proxy events, 45
usage-bearing events, and 100 redacted structured JSONL records. The raw stream
contained 43 complete command/file/MCP item pairs, but the cell timed out and
the runner withheld `toolEvents` from the C3 result rather than treating a
possibly incomplete timeout as complete visibility. The known usage-bearing
portion prices to approximately `$0.0686`; the cell did not produce a valid
completed C4 result. This confirms the live capture path and preserves the
evidence, but it does not promote Codex to `full` or qualify the task for S7.

A bounded two-CLI GLM Flash diagnostic then ran the provisional
`superjson-error-stack-serialization` task with the short-regime 300-second
timeout and a `$2` recorded-spend cap. Hermes and Codex each timed out twice and
were quarantined; the final known spend was `$0.022703025`. The cells produced
timeout C4 records with partial visibility and preserved retry archives,
including Codex structured tool-event logs. Neither cell completed a patch or
qualifies SuperJSON for short-regime calibration or S7 approval.

An explicit long-regime control then ran `anko-default-function-arguments`
with Codex and Hermes, one planned attempt per CLI, the same pinned Flash
model, a 900-second timeout, a `$1` conservative cell estimate, and a `$2`
recorded-spend cap. Both initial attempts timed out. Codex produced a schema-valid long
C4 timeout at `$0.02771733`; Hermes produced a retry-archived timeout at
`$0.00282104`. The following retry was stopped fail-closed because its
terminal usage was unavailable under the recorded-spend cap. Persisted runner state
reconciles to `$0.030538365`; no verifier pass or official result was claimed.
This validates the long execution and timeout-accounting path, but does not
qualify DeepSWE/Flash for calibration or publication.

A second bounded short-regime diagnostic then ran
`tomlkit-toml-table-converters` with Codex and Hermes, one repetition each,
the pinned Flash model, Docker isolation, the 300-second timeout, and a `$2`
recorded-spend cap. Both tools timed out on both attempts and neither verifier passed;
the final persisted spend was `$0.08918645`. The retry artifacts and timeout
C4 records are retained for audit, but this task also does not qualify the
short regime or S7.

The corrected Git-boundary path was then exercised on
`cattrs-partial-structuring-recovery` in explicit long mode with Codex and Hermes,
one planned attempt per CLI, the pinned Flash model, a 900-second timeout, and a
`$2` recorded-spend cap. Hermes timed out on its initial attempt with
`$0.01333927` of known spend, Codex timed out with `$0.050563705`, and Hermes'
single retry ended with unavailable terminal usage. The runner preserved both
final C4 timeout records and the retry artifact, then refused to continue under
the cap rather than inventing the retry's spend. The reconciled state total is
`$0.063902975`; neither CLI reached verification success. This validates the
corrected immutable-base/model-patch boundary and fail-closed unavailable-spend
handling, but it is not DeepSWE calibration evidence or an S7 result.
