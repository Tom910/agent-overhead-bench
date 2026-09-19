# S6 — Cost per task and whole benchmark

Maintainer correction: median reference cost per attempt is not the desired
headline. Show cost per task and total cost for the whole benchmark per harness,
including failures and all repetitions. Keep tokens as the pricing baseline and
use the canonical current campaign source. No reruns or provider requests.

- Sum exact per-request token costs at existing shared rates, including known
  observations within an incompletely measured attempt. Preserve unknown total
  costs: known subtotal is a lower bound, never a complete total or zero fill.
- Show whole-benchmark reference cost across all 40 selected runs per harness.
- Provide each task's repetition count, cost and contribution to benchmark cost.
  Maintainer confirmed: average across the five runs for each task; the headline
  equally averages these task means. Also expose all-repetition totals.
- Replace median-cost headline and definitions in README/Markdown/HTML together;
  preserve old raw costs, historical snapshots, pass/cache/token semantics.
- Keep summaries within existing comparison groups and show missing coverage.
  Reuse existing pricing and generated-current-data workflow; no new dependencies.
- Test summation versus median, repeated tasks, failures, missing observations,
  coverage and deterministic regeneration; verify responsive presentation and
  get bounded independent review before pushing.

## Verification and publication

Task-average and benchmark arithmetic tests pass, including unequal repetition
counts, failed outcomes, known observations within incomplete runs, cached-token
pricing and zero/no-observation distinctions. The current publisher validates four
replacement mappings against the prior canonical source and preserves 196 other
attempts exactly. It discloses superseded-run costs and the interrupted startup.

All workspace suites pass after fixing an existing asynchronous SSE test race:
784 tests total, plus 158 script tests (2 skipped). Report has 287 passing tests;
proxy has 113. Workspace types, lint, diff and freshness checks pass. Public
Markdown/HTML replay is byte-identical. Browser checks at 1440px and 390px show
five rows, 30 metrics, no overflow, working sorting/filtering and closed details.
Independent reviews found no remaining issues after isolating the watcher's
contracts import inside its pinned worktree.

The four paid replacements are still running separately. An audited local watcher
at `scratch/usage-replacements-20260919/finish-when-ready.py` will publish the
replacement dataset only after complete raw-data validation and freshness checks;
no incomplete replacement is silently selected and no new retries are launched.
