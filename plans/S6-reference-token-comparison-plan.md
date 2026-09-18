# S6 — Token-based reference pricing and relative metric comparisons

Maintainer explicitly requests tokens as the comparison baseline, calculated
pricing, and per-metric relative values with the best observed option at 100%.
This is report-only work while the existing S7 Linux queue continues unchanged.

## Design

- Use the existing `costUsd` formula and immutable DeepSeek low-tier rates:
  $0.15/M uncached input, $0.003/M cached input, $0.60/M output.
- Compute each attempt's reference cost from exact request token counters,
  never from rounded medians or displayed cache percentages. Summarize attempt
  costs with the existing median function. Call it reference cost, not billing.
- Group primary comparison views by existing population identity except original
  price book when the model has an explicit shared reference price. Keep host,
  model, source, routing, regime and configuration boundaries. Keep raw exports,
  original costs/price books, and detailed historical populations unchanged.
- Show per-metric percent of observed best: value / max for pass/cache;
  min / value for cost/input/output. No composite score. Lower token usage is
  resource usage, not a quality claim. Exclude incomplete metric coverage from
  the baseline and score; show unavailable when no meaningful baseline exists.
- Preserve sample/task counts and unequal-coverage caveats. These are descriptive
  within-group indices, not causal harness effects or a capabilities leaderboard.
- Reference totals stay unavailable for incomplete usage or ambiguous accounting.
  Zero observations do not establish zero cost. Retain failure outcomes in
  pass-rate denominators and measured cost/token distributions.

- Permit rebuilt image variants only through an explicit analysis-only campaign
  export flag. Preserve C1/C4 validation, summary hash binding and environment
  identities. Reject agent-only image changes within a single verifier identity,
  which the analysis schema cannot distinguish. Keep legacy headline image-drift rejection unchanged and disclose
  variants beside the overview.

## Implementation and verification

- [x] Test exact cached/uncached/output arithmetic, unknown original pricing,
  incomplete observations, grouping isolation, score directions/zeros/ties.
- [x] Implement reference-view grouping and calculations using existing types
  and price book; add no dependencies or derived run.json fields.
- [x] Use consolidated primary HTML/Markdown overviews, keep original-population
  evidence below, and show actual values plus relative metric percentages.
- [x] Regenerate checked-in report artifacts and README from validated export;
  preserve historical raw evidence and verify replay/provenance hashes.
- [x] Test formatting, sorting, escaping and mobile/desktop rendering; run full
  tests, typecheck, lint and diff checks; independent review before pushing.

The current live Linux collection remains the source of the future Linux-only
snapshot; this change neither reruns cells nor reprices actual account spending.

## Verification result

Implemented the Linux snapshot (107/200 selected slots at export time), preserving
historical files. Public replay matches Markdown/HTML byte-for-byte. All workspace
tests passed; the final report suite has 275 passing tests. The script suite had
one obsolete host/price-book README assertion, updated to validate the authorized
Linux/reference-price surface; its four tests now pass. Other script tests passed
(2 skipped). Workspace typecheck, lint and diff checks passed. Desktop 1440px and
mobile 390px browser checks show five rows, 25 metrics, no page overflow, working
cost sort and population filter, and closed secondary panels.

Independent review found agent-only image drift could be hidden by analysis-only
export. Fixed with explicit rejection within a verifier identity and a regression
test; reviewer confirmed resolution. No paid calls or reruns were needed for S6.
The S7 Linux queue remains active; the snapshot is explicitly provisional.
