# S6 — Metric overview implementation plan

**Goal:** Lead the report with pass rate, cost, cache rate and input/output tokens;
keep detailed evidence below, as requested by the maintainer.

**Architecture:** Derive presentation summaries from existing AnalysisAttempt
facts per population and harness/version. Render a compact sortable overview
with horizontal bars in self-contained HTML and equivalent Markdown. Preserve
all existing detailed views and measurement definitions.

**Tech stack:** Strict TypeScript, existing renderer, Vitest, inline CSS/JavaScript.
No dependencies, paid runs, raw-contract changes or derived run.json fields.

**Spec:** `frontierharness-review-2026-09-18.md`, plus maintainer instructions to
add input/output tokens and place secondary information after primary metrics.
User refinements authorize implementing this layout. Work on
`codex/s6-metric-overview`; preserve the existing untracked unrelated plans.

## Tasks

- [x] Test summaries with passing, failing, timeout and missing-usage attempts:
  pass rate includes every selected outcome; medians include measured attempts
  across outcomes; missing values retain n/total; harness versions stay separate.
  Use `analysis-render.test.ts` fixtures and new `overview.test.ts` if needed.
- [x] Add `overview.ts` for typed summary derivation and compact display formats.
  Cost = median static estimated attempt cost, cache = median attempt cached-input
  percentage, tokens = median attempt successful-response counters. Input includes
  cached tokens. Never pool populations or imply equal task coverage.
- [x] Render primary metrics first in `analysis-render.ts`; add accessible sort
  control with alphabetical default, metric bars and responsive rows. Sort by
  full precision, nulls last. Keep partial coverage beside values and exact values
  in accessible details. No winner badges or capabilities leaderboard claims.
- [x] Keep timing, coverage, request details and provenance below the overview.
  Match Markdown ordering and definitions. Existing outcome filters must not
  silently change the all-outcome summary denominators.
- [x] Verify focused tests and offline replay; regenerate public HTML/Markdown
  and update provenance hashes without changing analysis.json or summary.json.
- [x] Run full tests, types, lint, shell syntax and diff checks. Inspect desktop
  and mobile rendering with available local browser tooling. Record evidence here.

## Verification

`npm test --workspace=@aob/report -- src/analysis-render.test.ts src/overview.test.ts`

`node scripts/s6-analysis-replay.mjs evidence/nonclaude-results-2026-09-14/analysis.json scratch/metric-overview`

Full required checks: `npm test`, `npm run typecheck`, `npm run lint --silent`,
`sh -n` for scripts/images shell files, `git diff --check`.

## Verified outcome — 2026-09-18

- Primary overview implemented in HTML and Markdown, with all five metrics,
  per-metric coverage, raw-value sorting, and separate recorded populations.
- Secondary timing, outcome and request evidence is collapsed below the HTML
  overview; all previous details remain available.
- Full suite: 763 workspace tests and 158 script tests passed (921 total), with
  two existing script tests skipped. Typecheck, lint, shell syntax, launch check
  and diff checks passed.
- Chrome at 1440×1100 and 390×844: 11 harness rows, 55 metric cells, no horizontal
  document overflow, detail panels initially closed; sorting and population
  selection verified. Desktop/mobile screenshots inspected in ignored scratch.
- Independent reviewer found no important defects. Shared cache definition now
  matches HTML and Markdown following the minor review suggestion.
- Regenerated all report artifacts from hash-verified C1/C4 source bytes. Public
  replay matches JSON/Markdown/HTML byte-for-byte and provenance hashes verify.
  `analysis.json` and `summary.json` remain byte-identical to the previous commit.
- No dependencies, model calls, paid infrastructure or release-status changes.
