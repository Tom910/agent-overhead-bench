# S7 — Retire the experimental Codex subscription integration

The maintainer requested history cleanup after the September 29 independent
review. Remove the experimental subscription integration from the active tree
and replace its interleaved implementation/recovery history with focused commits.
This does not remove the Codex CLI harness used by the API-backed benchmark.

## Scope

Start at 4e189a6, before subscription feasibility. Keep the generic benchmark
validity plans, immutable retry evidence, candidate capture before verification,
empty-attempt provenance export, and generic response metadata fixes. Do not keep
OAuth credential preparation, patched third-party bridge code, custom transport
hooks used only by that route, Luna campaign scripts, or historical repair gates.
Do not change canonical results, prices, task contracts, the website, dependencies,
raw C1/C4 schemas, or Linux campaign artifacts. No model calls.

Before rewriting GitHub main, preserve its exact old tip 9ee584d and the later
local diagnostic tip 362b0e5 in local backup refs and a verified Git bundle.
Use an explicit force-with-lease for the observed main tip so concurrent work
cannot be overwritten. Keep earlier unrelated history unchanged.

## Validation

Run all offline tests, typechecks, lint, canonical report freshness and site build.
Compare canonical evidence/report/site/task trees against the previous main.
Check the active tree for dangling removed-route references. Review the retained
proxy changes separately from the discarded bridge admission policy. Publish a
portable audit summary without private transcripts, local paths or credentials.

## Verified result

Offline validation passed: 887 workspace tests and 159 script tests (two skipped),
all TypeScript checks, lint, canonical report freshness and the Pages site build.
Independent review found no blocking issues. Canonical results, generated report
content, task files, site source, dependencies and schemas are unchanged.

The replacement history contains three focused commits after 4e189a6, replacing
39 interleaved integration-era commits on the previous GitHub main. Backups retain
the original published and unpublished integration tips; raw Linux runs are kept.
