# S8 — README metric overview

Maintainer requested an immediate README update and push before continuing S6.
Pause S6 implementation for this documentation-only stage.

- Generate compact pass-rate, cost, cache, input and output token tables directly
  from the validated public analysis export, separately per existing population.
- Include all selected outcomes, metric coverage and task counts. Median static
  cost and median attempt cache/token counters retain existing definitions.
- Lead with these tables; keep the historical fixture table behind details.
- Preserve unpublished status, provenance, existing evidence and release gates.
- Verify table values against the public JSON, launch scaffold and diff checks.
- Commit only README and this stage plan; push the README change to origin/main
  with a normal fast-forward push after checking remote history. No release tag.

No dependencies, measurement changes, API requests or new benchmark runs.
