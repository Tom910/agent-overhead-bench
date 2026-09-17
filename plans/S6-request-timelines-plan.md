# S6 — Request timelines and token trajectories

Explain why runs differ using existing C1 events. No new provider spend.
No operational ledger of unselected recoveries in this stage (separate later).
No tool-name residual (still `partial` visibility).

## Additions

- Sanitized per-request series on each selected attempt: duration, wait to
  first byte, transfer, gap before the call, status, cached/uncached/output
  tokens and static cost when complete. No paths, bodies, prompts or logs.
- Per-task pass/fail distributions of those request metrics.
- Time after the last model response vs gaps between requests.
- Deterministic annotated representative runs (most calls, largest gap,
  longest tail after last call, longest single call, a native failure with
  many calls).
- HTML timelines and cumulative token/cost curves for those runs.

Hypotheses to show as **run-level relationships**, not ratios of headline
medians: more/shorter calls vs fewer/longer; slowing as sequence grows;
few long responses dominating; failures that keep calling; residual in
gaps vs after the last response.

## Review corrections — authorized 2026-09-17

Continue this S6 stage; no new data collection or measurement model.

- [x] Derive gaps from the running maximum response end (interval union), and
  tail from the maximum response end. Sort chronologically; exclude synthetic
  network-failure first-byte markers. Unreconciled adapter timing yields no tail
  or adapter-relative shares. Shares use first request to adapter end, excluding
  startup. Successful-response token totals retain the existing usage scope.
- [x] Validate the complete v2 request schema, relationships and summary scalar
  types. Recompute summaries from validated requests and reconciled timing;
  reject disagreement and nested payloads. Repair corruption tests to reach
  their intended validation using a valid v2 envelope.
- [x] Use existing median interpolation for even samples; expose missing counts.
  Label partial cumulative costs as known subtotals, show missing observations,
  and add successful-response input/cached/uncached/output token trajectories.
- [x] Expose request metrics in per-task distributions; show the adapter tail on
  request timelines and use completion order for cumulative curves.
- [x] Rewrite the interpretation to distinguish descriptive unequal task samples
  from matched comparisons or causal explanations. Label median-of-run-medians.
- [x] Regenerate all 200 selected attempts from hash-verified C1/C4. Verify public
  replay byte-for-byte, focused regressions, full tests/typecheck/lint, browser
  rendering and independent review. Preserve raw contracts and historical reports.

Implementation ownership: request derivation/integration/docs by primary agent;
replay validator/tests and renderer/tests delegated independently under the
subagent development workflow. All changes remain on the current local branch.

## Verification commands

```text
npm test --workspace=@aob/report -- src/request-analysis.test.ts src/analysis-replay.test.ts src/campaign-analysis.test.ts
node scripts/s6-campaign-analysis.mjs scratch/finish-nonclaude-20260914/engine-input evidence/nonclaude-results-2026-09-14/summary.json evidence/nonclaude-results-2026-09-14
node scripts/s6-analysis-replay.mjs evidence/nonclaude-results-2026-09-14/analysis.json scratch/campaign-analysis-replay
```

## Verified outcome — 2026-09-17

- Regenerated all 200 selected attempts (23,057 requests) from hash-verified
  C1/C4 inputs. Public JSON, Markdown and HTML replay byte-for-byte; provenance
  hashes match the summary and all three generated artifacts.
- Full `npm test`: 759 workspace tests and 158 script tests passed (917 total),
  with 2 script tests skipped. Typecheck, lint (185 files), shell syntax and
  `git diff --check` passed.
- Headless Chrome: 200 run dots, 6 annotated runs, 36 timeline/curve figures,
  6 tail regions and 423 missing-observation markers. Outcome filtering works;
  desktop and mobile have no document overflow. Screenshot inspected at
  `scratch/request-corrections-browser.png`.
- Independent review found no remaining important issues in these corrections.
- Existing timing reconciliation remains authoritative: a response ending past
  the adapter endpoint yields unavailable tail/shares, without introducing a
  new rejection rule for exports accepted by the existing measurement model.
- No provider runs, extra spend, new dependencies or raw-contract changes.
  Changes remain uncommitted.
