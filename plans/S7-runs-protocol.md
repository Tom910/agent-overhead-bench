# S7 — Official runs protocol

> **For agentic workers:** Execute this protocol literally. Do not “clean up” outliers by editing JSON.

**Current protocol (2026-09-05):** `tool-batches-v1` supports a campaign run one
tool at a time, after a passing separate validation run. The authoritative scope
is `plans/s7-official-tool-scope.json`: claude-code, cline, codex, hermes, pi,
and qwen. Five repetitions on the already selected eight DeepSWE tasks give
240 grand-run cells; all eight tasks once with every tool give 48 validation
cells. No new paid campaign has been executed. See
[S7-tool-batch-campaign-plan.md](./S7-tool-batch-campaign-plan.md).

## Tool-by-tool workflow

1. Keep the selected task preparation, source manifest, model, price book,
   versions, regime, and image pins fixed. Set `AOB_TASKS`, `AOB_TASK_MANIFEST`,
   and `AOB_SOURCE_MANIFEST` to that preparation.
2. Run `scripts/run-validation.sh OUTPUT MODEL CELL_ESTIMATE VALIDATION_CAP`.
   It requires a separate empty root, uses one repetition for all six tools,
   and stops on the first failure without retrying. Diagnostic mode permits
   pending aggregate review flags, while retaining source provenance,
   reference-polarity, native verifier, eligibility, and image checks.
3. Once validation passes and official source/calibration approval is complete,
   run `scripts/run-tool-batch.sh CAMPAIGN TOOL MODEL CELL_ESTIMATE TOOL_CAP
   CAMPAIGN_CAP VALIDATION_ROOT`. Repeat for the remaining tools. The complete
   campaign definition is persisted on the first invocation. A tool must finish
   before another starts; a completed tool does not run again.
4. Use `node scripts/campaign-status.mjs CAMPAIGN` between tools. Each batch
   rereads validation evidence and keeps accumulated spend. The explicit total
   cap includes validation; tool caps include retries and prior invocations.
   An in-flight request can exceed the estimate and therefore the recorded cap.
5. Review the full campaign's anomalies and provider Activity Export, then use
   the existing `s7-freeze.sh` with `CAMPAIGN/results` and expected count `240`.
   Freeze requires every cell, closed ledger segments, the saved validation
   proof, existing provenance/review gates, and reconciled spend. It produces
   one report and one archive; validation is archived separately from results.
   Run `s7-verify-archive.sh` on the final archive as usual.

Each batch has independently anchored monotonic intervals and host snapshots.
Tool grouping creates a time-of-day/provider-load confound, disclosed in the
report. A process interruption leaves evidence for review and does not silently
become an approved continuation. The runner prevents concurrent campaign writers.
The legacy `run-all.sh` single-window protocol remains available with at least
four repetitions and an empty output root; historical archives retain that rule.
The sections below retain the original single-window procedure where applicable.

The final no-spend preflight was re-run on 2026-08-27 against a freshly prepared
public task tree with the approved `z-ai/glm-5.3-flash` model, the five selected
container adapters, and `openrouter-2026-08-27`; its mechanical checks passed, then
the explicit source-review gate rejected the candidate because its review record is
pending. This is not an official result window.

**Goal:** Frozen, publication-grade dataset plus METHODOLOGY that describes what was actually done. A release contains one task regime only; short and long-horizon runs are separate datasets and report sections.

**Architecture:** Same S5 runner, on a quiesced Linux machine or the available quiescent Mac with Docker Desktop. Dataset is a GitHub Release artifact on tag `v1`, not a git tree of `results/`.

**Tech Stack:** S5 runner, S6 report, OpenRouter Activity Export for the pinned price-book cross-check.

**Spec:** North-star §7, roadmap S7.

## Global Constraints

- Inherited from `plans/README.md`.
- Host is Linux (preferred) or the available local Mac with Docker Desktop. A Mac dataset must record the virtualization/CPU-steal limitation in METHODOLOGY and must not be described as a dedicated Linux machine.
- Recorded-spend cap armed at $1,500. Original ~$170–800 estimate is the grid product, not the cap.
- Tool versions, pinned model id, Ori version (if used) re-verified immediately before the window.
- Post-freeze edits create `v1.1`. Files under a tag are immutable.
- Quiet edits of raw JSON are forbidden.

## Contracts consumed / produced

- Consumes: S5 results tree, S6 derive/render.
- Produces: tagged `v1` archive, `METHODOLOGY.md`, S6 report generated from that tree only.

## Out of scope

Launch posts (S8), changing derivation after seeing numbers (that is a `v1.1` + CHANGELOG if the math was wrong).

## Human review (required, ~3 h)

For every flagged outlier, unreconciled run, and quarantined cell, exactly one of:

1. Documented explanation in METHODOLOGY, or
2. Re-run of that cell, recorded as a re-run

Never a silent drop. Spot-check 2–3 raw event files per tool. Compare pinned-book totals to OpenRouter Activity Export.

## Risks

| Risk | Mitigation |
|---|---|
| Provider load drift | One contiguous window + block randomization |
| Temptation to drop ugly rows | Outlier flag, no auto-exclude |
| Mac numbers published as dedicated | Host check in this protocol |

---

### Pre-flight

The no-spend preflight command is:

```bash
AOB_TASKS=/path/to/reviewed/public/tasks/task-1,/path/to/reviewed/public/tasks/task-2 \\
  AOB_TASK_MANIFEST=/path/to/reviewed/public/tasks/manifest.json \\
AOB_SOURCE_MANIFEST=/path/to/reviewed/public/source/deepswe-source-manifest.json \\
  AOB_CALIBRATION_ATTESTATION=/path/to/reviewed/public/source/calibration-attestation.json \\
  AOB_CALIBRATION_SUMMARY=/private/path/calibration-summary.json \\
  AOB_CALIBRATION_ROOT=/private/path/calibration-results \\
  scripts/s7-preflight.sh results <pinned-model-id> openrouter-2026-08-27
```

It never prints the API key. It must pass immediately before an official run;
failure is a stop condition, not a reason to weaken the protocol.

- [ ] Linux host (preferred) or quiescent macOS + Docker Desktop, no other workloads, specs recorded (`os`, `cpu`, `ram_gb`)
- [ ] Tool versions = S2 pins; `ori --version` if used; pinned model id
- [ ] Reviewed adapter/model/protocol eligibility manifest accepts every tool in the declared five-tool official scope (Claude Code is explicitly excluded by the retained S2 evidence)
- [ ] Every selected adapter has a fresh-container descriptor and built image; host PATH probes are not official cells
- [ ] Proxy calibration script re-run; p99 still ≤ 5 ms on this host
- [ ] Cross-process clock calibration re-run; minimum-RTT projection bound ≤ 10 ms
- [ ] Docker container/host epoch handshake re-run; estimated offset ≤ 10 ms and retained round-trip ≤ 20 ms
- [ ] If review says `calibration_complete: true`, recomputed attestation output exactly matches the approved attestation; otherwise calibration remains pending
- [ ] `pricing.json` dated; `price_book` id recorded
- [ ] Recorded-spend cap $1,500 armed
- [ ] Empty `results/` for this window; previous dry-runs archived aside

The preflight implementation also checks the real Docker-to-host proxy route
with the no-spend pinned curl smoke and validates the selected adapter image build,
entrypoint, and S2 version probes before checking the S2-pinned versions of the selected
host adapters. It validates the selected task preparation and its manifest (including
checksums and pristine verifier behavior), and runs a no-spend proxy calibration (p99 must be ≤ 5 ms). A
version drift is a stop condition; it is not silently recorded as the old pin.
It also checks that every selected Docker image is already present, so an
official timed cell cannot trigger an image pull. Until S2 records a single
approved model, preflight rejects every official run.
For the current source boundary, the task manifest must also retain a
`source_provenance.source_adapter` record for a reviewed Git source
(`git-canonical`, `git-taskpack`, or `deepswe`); C2 fields alone are not sufficient
evidence of a reviewed public checkout. Its review record must have all four
approval flags set, cover every selected task ID, and point to an in-repository
evidence file whose SHA-256 matches the manifest.
The default condition is also refused until its native/default credentials and
behavior have been separately evidenced; suppressing a model flag is not
enough to call an OpenRouter-routed run “default.”

### Run

- [ ] Block-randomized full pinned matrix for the explicitly selected regime (default remains out of scope until native/default behavior is separately evidenced)
- [ ] Do not start a second heavy process on the box
- [ ] On `BudgetExceeded`, stop. Do not disable the guard. The cap is a local recorded-spend boundary, not an exact provider-billing cancellation guarantee.

### Review

- [ ] S6 report generated
- [ ] Outliers / unreconciled / quarantined: explanation or re-run
- [ ] Headline numbers sanity-checked
- [ ] OpenRouter export cross-check (pinned book)

The export cross-check is a local, no-network review step. After exporting the
exact pinned-model/window grouping from OpenRouter, run:

```bash
node scripts/s7-activity-crosscheck.mjs \
  results /private/path/activity-export.csv \
  review/activity-crosscheck.json \
  z-ai/glm-5.3-flash openrouter-2026-08-27 \
  state.json 2026-08-30T00:00:00.000Z 2026-08-31T00:00:00.000Z
```

Review the sanitized JSON summary and retain only that summary and its
operator review in the release materials; do not copy the raw CSV, account
identifiers, or credentials into the repository or archive. The state argument
is required for an official run because the summary must include preserved
retries and recorded interrupted spend. A mismatch beyond
`max($0.01, 1% of local spend)` is a stop condition requiring scope review or
an explanation, never an edit to `results/`. The final two arguments are the
operator-reviewed contiguous UTC export window; freeze rejects summaries that
omit it, reverse it, or do not contain every current, retry, and selected
replacement adapter interval. If anomaly review selects replacements, pass the
rerun results directory, its separate state file, and comma-separated
replacement run IDs; replacement spend is real account spend in addition to
the original attempt spend. The rerun tree and state must contain exactly the
reviewed replacements.

### Freeze

`METHODOLOGY.md` must include:

- Pinning path and Ori-vs-native deltas (process-tax and turns/tokens)
- Proxy self-overhead
- Per-tool visibility; which tools are omitted from harness-share ranking
- Exclusions and reasons
- Host OS
- Price book ids
- Positioning: name the selected public source and regime (short 1–5 minute or long-horizon); not a capabilities leaderboard; not Vetta / Terminal-Bench
- S6 algorithms in prose
- N = 4 is exploratory

- [ ] Tag `v1`
- [ ] Attach results archive to the GitHub Release
- [ ] Report generated from the frozen tree with zero unexplained anomalies

After review, create the immutable archive with. The command validates and regenerates
the report from a sanitized copy containing only `run.json`, `events.jsonl`, declared
stdout/stderr, and `verify.log`; staged workspaces, prompts, and solution files are
never included:

```bash
AOB_ANOMALY_REVIEW=review/anomaly-review.json \
AOB_TASK_MANIFEST=/path/to/task-manifest.json \
AOB_SOURCE_MANIFEST=/path/to/source-manifest.json \
AOB_ACTIVITY_SUMMARY=review/activity-crosscheck.json \
AOB_ACTIVITY_EXPORT=/private/path/activity-export.csv \
AOB_CALIBRATION_ATTESTATION=/path/to/reviewed/public/source/calibration-attestation.json \
AOB_CALIBRATION_SUMMARY=/private/path/calibration-summary.json \
scripts/s7-freeze.sh results dist/aob-v1-results.tar.gz <expected-cell-count>
```

The official freezer requires the configured five-tool pinned Cartesian matrix
(8–10 tasks, at least four contiguous repetitions, and the exact expected cell
count). For example, eight tasks × five tools × four repetitions requires `160`; nine or ten
tasks require their corresponding Cartesian count. If any
cell is quarantined or has a non-completed outcome, the optional argument must
point to a JSON review record with `{"version":1,"cells":[{"run_id":"...",
"disposition":"explained|rerun","note":"..."}]}` entries covering every
such cell. Reduced local archives require the explicit
`AOB_ALLOW_NONOFFICIAL_FREEZE=1` override and are not v1 artifacts.

For an official freeze, the approved calibration attestation and its generated
sanitized calibration summary are required when the
source review has `calibration_complete: true`; it is copied as
`provenance/calibration-attestation.json` and
`provenance/calibration-summary.json`; both bindings are checked. The
raw Activity Export is required as positional argument
10 or through `AOB_ACTIVITY_EXPORT`. The environment-variable form above avoids
empty positional placeholders; add `AOB_RERUN_RESULTS` and `AOB_RERUN_STATE`
when the anomaly review selects replacements. Freeze runs the no-network cross-check again against
when the anomaly review selects replacements. Official replacement reruns additionally require
`AOB_RERUN_WINDOW_LEDGER` (or positional argument 11), pointing to the separately closed
rerun session ledger produced by the replacement runner. The rerun ledger must have a distinct
session, the same host identity, exact current/retry coverage for the rerun state, and bindings
to the raw rerun state and results. Freeze rebinds that ledger after sanitization under
`provenance/rerun-state/run-window-ledger.json`; archive verification checks it again. Nonofficial
dry-run archives may omit this ledger, but cannot be verified with `--official`.

Freeze runs the no-network cross-check again against the exact original and reviewed-rerun evidence and requires field-for-field
equality with the supplied sanitized summary. The raw CSV and its path are not
copied into the package. The package instead includes a portable archive binding
over relative paths and exact sanitized bytes under `results/`, `report/`,
`review/`, and `provenance/`; the verifier recomputes that binding after
extraction. This is an integrity check, not a cryptographic authenticity
signature: publication should also retain the release checksum through the
release channel.

GitHub tagging, release attachment, OpenRouter export comparison, and the
maintainer anomaly review remain human/external actions.

### Follow-up: freeze sanitizer boundary

The release sanitizer is implemented with coverage for portable artifact paths,
symlink rejection, known credential redaction in declared logs and C1 error details,
missing evidence, and destination reuse. It emits typed configuration errors for unavailable evidence
and never merges into a non-empty destination. This is a local packaging guarantee;
it reads evidence through a no-follow descriptor to reduce check/use races, and it
does not replace the required human review of the frozen data. The archive verifier
also revalidates every extracted C4/C1 record through the report loader and scans
both results and generated report content for credential-shaped values before
accepting the archive.

**Follow-up correction (2026-08-26):** release output files now use no-follow
descriptor writes in addition to descriptor-based source reads, reducing
replacement-file races during freezing.

## Acceptance

Before implementation, the launcher acceptance checks were fixed as follows:

- `scripts/run-all.sh --help` explains that the command can spend money and shows the required model and conservative cell-estimate inputs.
- Without a model or conservative estimate, the launcher stops before the runner can make a provider request.
- With those inputs, it runs S7 preflight against the exact output tree, then invokes S5 with pinned-only conditions, the selected adapters, and the recorded-spend cap.
- It never passes `.env` as a Docker `--env-file`; the runner supplies only adapter-declared values.

Complete matrix in one window (or documented restart). Review checklist written. METHODOLOGY finalized. Tag + release artifact. Report from frozen tree only.

## Next

S8 launch. Courtesy notes to maintainers go out **before** the HN post.

### Follow-up corrections (2026-08-27)

- `scripts/run-all.sh` rejects overrides that would change the official
  configured official pinned matrix, pinned-only condition, OpenRouter upstream, or the
  minimum of four repetitions, and refuses a non-empty output root including
  stale `state.json`.
- S7 preflight validates the prepared task composition (8–10 tasks, four Python,
  four TypeScript, and at least two small and two medium). Generic task packs
  additionally require their common bugfix/feature/refactor coverage. DeepSWE
  preserves and reports its native categories and validates the source-specific
  category-to-shape mapping; it does not require an artificial category mix.
- `scripts/s7-freeze.sh` requires runner state, terminal cells, and a
  one-to-one state/result identity match; `s7-verify-archive.sh` checks the
  published archive sidecar checksum as well as the archive's internal sums.
- Report HTML contains structured tables and separate timing/cost SVG bars.
