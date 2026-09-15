# S6 — Report generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Derivation is the credibility core — expand TDD from the fixtures below before any rendering.

**Implementation status (2026-08-26):** validated and corrected. `deriveRun` overlap 2500/6500/1800/1700; adapter times projected onto the proxy clock via C4 anchors; source/regime/condition/model/price-book-isolated tables; C1-priced cost and token-floor columns; headline and per-task IQR; raw-data links; explicit raw C4 `tool_visibility` metadata preserves `partial` visibility; partial/none headline rows show an explicit non-model-share substitute while harness share remains unavailable; fixed outlier and unreconciled-run review appendix; checked-in rendering golden fixture; `generateReport` + `aob-report` bin.

**Follow-up boundary correction (2026-08-27):** metadata-only C1 events are excluded
from model-time, usage, and cost calculations; completed cells without model evidence
and full-visibility cells without tool instrumentation are rejected. The report CLI
now has a Node wrapper that supplies the TypeScript source loader, so the documented
workspace bin is runnable.

**Follow-up rendering correction (2026-08-27):** `partial` visibility is excluded
from headline harness-share output, and the static HTML renderer converts validated
relative raw-data Markdown links into real anchors so the report remains usable from
`file://`.

**Follow-up terminology correction (2026-09-02):** headline and per-task table
headers now label harness share as `full only` and the partial/none residual as
the explicit non-model fallback. This changes presentation only; the existing
S6 derivation and visibility gates are unchanged.

**Follow-up correction (2026-08-26):** results-tree and event-line parsing now converts
missing files and malformed JSON into typed configuration errors before derivation,
keeping the report/archive boundary fail-closed.

**Goal:** Raw C1/C4 trees → headline table, per-task drill-downs, stacked decomposition charts, raw-data links. Pure derivation, no I/O in the math module.

**Architecture:** `packages/report/src/derive.ts` (pure) + `packages/report/src/render.ts` (markdown + static HTML with inline SVG). No client-side JS framework. Page must work from `file://`.

**Tech Stack:** `@aob/contracts` fixtures. Chart-less SVG helper only if hand-built SVG becomes unreadable (justify then). No d3, no React.

**Spec:** North-star §3 and §4.5, roadmap S6. Algorithms below may be refined, not contradicted.

## Global Constraints

- Inherited from `plans/README.md`.
- `harness_time` / harness share are **null** (not zero) when `toolVisibility === "none"`. Renderer leaves the share blank and **refuses to sort/rank** on it. Golden table with mixed visibility must fail the test if a `none` tool gets a harness-share percentage.
- `toolVisibility === "partial"` is also excluded from harness-share ranking: its tool time is null because the observed tool timeline is incomplete. The raw visibility label remains reportable.
- Cost vs **token floor** (billed tokens × the same price book), not vs cheapest other harness. That cheapest-harness figure may be an article callout only.
- Never mix pinned and default conditions in one table. Never mix price books in one cost column.
- Failed-verification runs are excluded from timing aggregates and still reported in success rate.
- Outlier rule: e2e > 3× cell median is flagged, not auto-excluded.

## Contracts consumed / produced

- Consumes: C1, C4, `fixtures/derivation/overlap.json`.
- Produces: derived row types (not stored in `run.json`); README markdown; `site/index.html`.

## Algorithms (lock)

Per run, after projecting adapter timestamps onto the proxy clock via anchors (durations themselves stay in-process):

- `end_to_end` = adapter `tEnd − tStart`
- `startup` = first C1 `t_req_start` − adapter `tStart` (projected)
- `model_time` = duration of the **union** of C1 `[t_req_start, t_last_byte]` intervals
- `tool_time` = union of `toolEvents` minus overlap with model intervals; **null** if visibility is `none`
- `harness_time` = `end_to_end − startup − model_time − tool_time` when `tool_time` is known; **null** otherwise
- `non_model_time` = `end_to_end − startup − model_time` (always)
- `parallelism` = Σ request durations ÷ union duration

Reconciliation: if `tool_time` known, buckets sum to `end_to_end` within ±1% or ±500 ms, whichever larger; else `startup + model_time + non_model_time = end_to_end`. Violations → `unreconciled`, appendix only, excluded from aggregates.

Aggregation: per (tool × task × condition) median and IQR over reps. Headline row = median across tasks of per-task medians (tasks are the experimental unit). N = 4 is exploratory; METHODOLOGY must say IQR on four points is noisy.

Cost: usage × dated `pricing.json` keyed by `price_book`. `usage_source: "unavailable"` surfaced, not guessed.

## Worked example (must unit-test exactly)

From `packages/contracts/fixtures/derivation/overlap.json`:

| quantity | ms |
|---|---|
| end_to_end | 12500 |
| startup | 2500 |
| model_time (union) | 6500 |
| sum of request durations | 10500 |
| parallelism | 1.615 |
| tool_time | 1800 |
| harness_time | 1700 |

Visibility `none` → `tool_time` null, `harness_time` null, `non_model_time` 3500, no harness share emitted.

Second fixture: unreconciled run. Third: failed verification excluded from timing.

## Out of scope

Re-running the matrix, leaderboard scores, client-side frameworks.

## Human review (required, ~3 h)

Maintainer reads `derive.ts` against this plan and the overlap fixture. Highest-priority code review in the project.

## Risks

| Risk | Mitigation |
|---|---|
| Sum instead of union | Overlap fixture |
| Ranking `none` visibility | Mixed-visibility golden that fails on a percentage |
| Derivation bug ships | Hand-computed goldens + review + reconciliation invariant |

---

### Tasks

1. **`unionDuration(intervals)`** TDD with overlap, disjoint, nested, empty.
2. **`deriveRun(c4, events, visibility)`** against overlap.json and the two extra fixtures.
3. **`aggregate(runs)`** median-of-medians, IQR, success rate separate, unreconciled dropped from timing.
4. **`costUsd(usage, priceBook)`** cache-aware; unavailable usage not zeroed.
5. **Render** markdown table (Vis. column, blank harness share) + HTML/SVG stacked bars (tool segment hatched or omitted when `none`). Positioning paragraph above the table (not a capabilities leaderboard; 1–5 minute original tasks; not Vetta / Terminal-Bench).
6. **One command** regenerates the report from a results tree (`npx aob-report results/ --out dist/report`).

## Acceptance

Derivation reproduces the hand-computed overlap numbers. Golden-file tests for markdown/HTML. Mixed-visibility table cannot rank on harness share. Runs on S5 dry-run data end-to-end.

## Next

S7 freezes a dataset and regenerates the report from that tree only.
