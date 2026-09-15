# S3 — Source-lineage policy gate

**Status (2026-08-30):** Superseded by
`S3-deepswe-lineage-exception-plan.md` after the maintainer selected DeepSWE.

## Goal

Make the repository's explicit prohibition on direct SWE-bench, Terminal-Bench,
and Vetta imports mechanically enforceable at the official S7 boundary. A
source adapter must preserve the upstream machine-readable lineage;
preparation or renaming cannot make a prohibited source eligible. The selected
DeepSWE upstream's exact `swe-bench-ultra` declaration is an explicit,
maintainer-approved provenance exception and is governed by the dedicated
follow-up plan.

## Design

- Add required `source_dataset` provenance to the DeepSWE original manifest.
- Read that field from the pinned upstream manifest during preparation and bind
  it into the manifest checksum and prepared-suite provenance.
- Reject noncanonical restricted lineages, while allowing the exact selected
  DeepSWE declaration `swe-bench-ultra`.
- Keep diagnostic preparation and reports possible, but make official
  preflight fail before any provider request.
- Do not alter C1–C4 timing, task contents, verifier behavior, or the existing
  generic task-pack validator.

## Implementation order

1. [x] Add failing DeepSWE manifest/selection tests for required lineage and
   forbidden source names.
2. [x] Add strict manifest validation and preparation propagation.
3. [x] Ensure S7 preflight dispatch enforces the policy through the DeepSWE
   selection validator and add a no-spend shell assertion.
4. [x] Update provenance documentation and source audit status.
5. [x] Run focused tests, full tests, typecheck, lint, and shell checks.

## Acceptance

- A DeepSWE manifest without `source_dataset` fails closed.
- A manifest whose lineage is `swe-bench-ultra`, `terminal-bench`, or `vetta`
  cannot pass official DeepSWE selection.
- An unrelated public lineage can pass the composition validator when all other
  composition fields are valid.
- The preparation script emits the exact upstream lineage and the generated
  source-manifest checksum includes it.
- Diagnostics remain available and no provider request is made by tests.

## Human decision boundary

The maintainer selected DeepSWE after review. The exception and its narrow
allow-list are recorded in `S3-deepswe-lineage-exception-plan.md`.
