# S6 — Analysis usability implementation plan

**Goal:** Make the existing measurements interpretable through explicit sample
counts, matched task populations, outcome-specific distributions, and a sanitized
per-attempt export. The maintainer approved this scope after the repository review.

**Architecture:** Extend the existing S6 engine and its C1/C4 derivation. Export
allowlisted per-attempt facts to `analysis.json`; render `analysis.md` and an HTML
analysis view from those facts. Keep legacy headline medians for continuity, but
use task-weighted arithmetic means for additive timing charts. No new measurement
model, npm dependencies, provider calls, or raw contract changes.

**Spec:** The approved review in this session: matched tasks within recorded host,
model, routing, price-book and source boundaries; distinct passes/failures;
distributions and sample counts; coherent timing charts; reproducible campaign
analysis from retained evidence.

## Constraints and decisions

- TypeScript strict; typed errors; no derived metrics in `run.json`.
- Preserve existing source review, verifier and release gates. This is analysis of
  the snapshot, not an official archive freeze or a capabilities leaderboard.
- Host identity uses all C4 host fields available (OS, CPU, RAM), not a claim of
  machine identity or matched execution windows. Keep tool version and configuration
  explicit. Pairwise matching uses task identity including source/base revision;
  repetition indices are not claimed to be paired random seeds.
- Existing successful/reconciled headline timing remains unchanged. Separate
  failure timing is descriptive and never enters success timing or matched pairs.
- Record timing/usage/cost eligibility and null reasons; unknown cost stays null.
- Export no prompts, request/response bodies, logs, paths, credentials, or private
  workspaces. Preserve C1/C4 hashes for binding.
- Work on `codex/s6-analysis`; leave the two pre-existing untracked plans intact.
- Use the subagent development skill for independent tasks and final review.

## Task 1 — Correct statistical presentation

Files: `aggregate.ts`, `render.ts`, `from-results.ts`, report tests and golden fixture.

- [x] Reproduce nonadditive medians and missing whole-row IQR with tests.
- [x] Add `aggregateTimingMeans(runs)` for reconciled timing; apply means first
  within tasks then across tasks for chart-only decompositions. Keep headline
  median fields unchanged. Label the chart aggregation explicitly.
- [x] Compute headline IQR from non-null within-task IQRs; expose contributing
  task count in the analysis view and explain the denominator. Retain null when
  no task has at least two eligible runs. Label headline spread as median
  within-task IQR rather than a pooled IQR or confidence interval.
- [x] Verify focused report tests before integration.

## Task 2 — Analysis export and views

Files: new `analysis.ts`, `analysis-render.ts`, tests, `from-results.ts`, `index.ts`.

- [x] Test allowlisted export, hashes, null reasons and population isolation.
- [x] Export all loaded attempts via `generateReport`, using the existing usage,
  cost and timing derivations. Separate pass, native failure and other outcomes.
- [x] Build per-task/outcome distributions (n, median, Q1, Q3, min, max) and
  pairwise common-success-task comparisons, retaining per-task run counts.
- [x] Test that unmatched tasks cannot alter a matched comparison; that hosts,
  routing, price books and task revisions cannot leak across comparisons; and
  that failures, unreconciled timing and unavailable costs stay explicit.
- [x] Render readable Markdown plus an HTML view with per-run timing dots and
  labeled outcome tables. Include turns, tokens, caching and cost on the same
  outcome population; no claims from ratios of unrelated headline medians.
- [x] Wire generation into the existing report command; document output files.

## Task 3 — Analyze the retained published campaign

Files: a deterministic local snapshot analysis script, campaign analysis artifacts,
root/evidence README and methodology.

- [x] Resolve all 200 selected C1/C4 pairs from the retained local staging tree;
  verify each against the published summary hashes and slot metadata before use.
- [x] Produce analysis JSON/Markdown/HTML using the same S6 functions, preserving
  snapshot provenance and explicit limits. Keep the historical report unchanged.
- [x] Make analysis reproducible offline from the public allowlisted export.
- [x] Link the new view prominently and explain sample conditioning and matching.

## Task 4 — Verification and review

- [x] Run focused regression tests, then `npm test`, `npm run typecheck`,
  `npm run lint --silent`, shell syntax checks and `git diff --check`.
- [x] Independently review the implementation and rendered data: matched task
  denominators, privacy allowlist, missing costs, additive chart widths.
- [x] Rebuild the campaign artifacts and verify deterministic outputs and 200
  unique selected attempts. Record outcomes here before closing the stage.

## Verification outcome — 2026-09-16

Implemented and reviewed on `codex/s6-analysis`.

- Full `npm test`: 720 workspace tests and 158 script tests passed; two script
  tests skipped. The first full run hit the pre-existing proxy SSE test reading
  its event file before the event was visible. That test passed independently,
  and the final full suite passed without proxy changes.
- Full typecheck, repository lint (185 JavaScript/shell files), shell syntax and
  `git diff --check` passed.
- 200 selected attempt identities and C1/C4 hashes verified against the existing
  summary. Three recorded populations and 31 unavailable costs retained.
- Public replay regenerated all three analysis artifacts byte-for-byte; output
  checksums and the summary binding in `provenance.json` verified.
- Chrome smoke verified population filtering, outcome filtering, 200 individual
  timing dots, and no page-level horizontal overflow at 1440px. Screenshot was
  inspected locally; browser artifacts stay in ignored scratch storage.
- Independent review confirmed matching and sample denominators, privacy
  allowlisting, replay validation and the interpretation guide's calculations.
  Corrected generic `verify_error` wording to “Verification failure” because
  that outcome alone does not distinguish task and verifier infrastructure
  failures. No important findings remain.
- Added duplicate-slot rejection for public replay and recorded-host separation
  to anomaly baselines, with focused regression tests.
- No dependencies, raw contract changes, provider calls, official freeze,
  external publication or modifications to the pre-existing untracked plans.

### Use

```bash
node scripts/s6-analysis-replay.mjs \
  evidence/nonclaude-results-2026-09-14/analysis.json scratch/campaign-analysis

# Maintainer-only regeneration from retained selected C1/C4 bytes:
node scripts/s6-campaign-analysis.mjs \
  scratch/finish-nonclaude-20260914/engine-input \
  evidence/nonclaude-results-2026-09-14/summary.json \
  evidence/nonclaude-results-2026-09-14
```
