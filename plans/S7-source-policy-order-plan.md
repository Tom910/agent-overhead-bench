# S7 — Fail fast on restricted source lineage

**Status:** implemented and verified (2026-09-02).

## Goal

Reject a source whose declared dataset lineage violates repository policy before
S7 checks credentials, Docker, images, or starts any provider-facing work.

## Scope and invariants

- Preserve the authoritative DeepSWE manifest validation and selection checks.
- Add only an early, read-only lineage check for the DeepSWE source manifest.
- Allow the exact selected DeepSWE declaration `swe-bench-ultra`; reject direct
  or noncanonical restricted labels.
- Keep diagnostic preparation and diagnostic runs available.
- Do not change task selection, C1–C4 semantics, or the official source policy.
- No provider spend, Docker work, or new dependency in tests.

## TDD implementation order

1. Add a no-spend preflight test with a restricted DeepSWE lineage and no API
   key; require the lineage error rather than the credential error.
2. Observe the test fail because credentials are checked first.
3. Add the early source-manifest check and document the completed gate.
4. Run the full verification gate and commit the isolated change.

All four steps are complete. A shared lightweight source-manifest check now
rejects restricted DeepSWE lineage before credential or Docker checks; the
later full validator remains the authoritative source-selection gate. Both the
official launcher and direct preflight call the same helper.

## Acceptance

- A restricted DeepSWE source fails before credential and Docker checks.
- The later full manifest validator remains authoritative and unchanged.
- Missing or malformed source manifests still fail closed.
- Workspace tests, typecheck, lint, shell syntax, and diff checks pass.
- The launcher performs cap validation first, then source policy, then reads
  `.env`, preserving the existing budget fail-fast behavior.

## Out of scope

Changing task contents, approving DeepSWE, official S7 execution, and any
measured-cell behavior.

## Verification record

`scripts/s7-source-policy-order.test.mjs` covers restricted and permitted
lineage, malformed/missing manifests, launcher ordering, and helper reuse in
direct preflight. The full no-spend verification passed on 2026-09-02 with 55
script tests plus all workspace tests; strict typecheck, lint, shell syntax,
`git diff --check`, and `scripts/s8-launch-check.mjs` also passed.
