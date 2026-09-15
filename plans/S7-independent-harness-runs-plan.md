# S7 independent harness runs

Maintainer request (2026-09-11): run one harness at a time using available account credit; retain individual successes and failures; add harnesses without rerunning completed work.

## Scope

Add a durable operational scheduler around the existing single-cell runner. Each harness/task/repetition has an independent output root, with an append-only attempt identity and an atomically persisted scheduling index. The index is operational metadata, not another measurement model. C1–C4, native verification, pinned model/routing, source provenance, clock and pricing gates remain unchanged. Diagnostic evidence can be accumulated independently; official release/calibration gates still apply when assembling a release.

Run all requested repetitions/tasks for one harness before advancing to the next. Already recorded attempts (including failed or interrupted attempts) are never automatically rerun. Additional harnesses append new jobs. An explicit new attempt is required to retry a failed job. Retain pre-existing runs by reference with SHA-256 bindings, without editing their raw files or relabelling repetitions.

Each process executes one cell with stop-on-failure. Cell failure is persisted and the scheduler proceeds only after a fresh successful provider balance check. Unknown per-cell spend remains unknown in C4 and reports; the external account balance provides the cross-attempt admission and live spending guard. Check both account credit and key limits. Stop if credit is exhausted, balance checks fail, AC disconnects, or the host suspends during a measured cell. Preserve all evidence on every exit. Available credit is a soft operational guard; provider billing enforcement remains authoritative.

## Implementation and validation

1. Standard-library operational scheduler and append-only job configuration; no npm dependency.
2. Tests with a local fake child process and injected balance checker: sequential order, failure isolation, no rerun after resume, append another harness, interrupted attempt preservation, identity mutation rejection, and depleted/unavailable credit preventing execution.
3. Retain earlier paid artifacts by reference, then complete Pi before the next approved harness. Five repetitions per task are the requested final measurement target, with partial progress retained when credit runs out.
4. Record per-harness status and artifact paths; never claim a native task failure or incomplete measurement passed.

Implemented in `scripts/independent_harnesses.py`; usage in `scripts/independent-harnesses.md`. Eleven no-spend scheduler tests cover actual subprocess retention, resume/append, evidence tampering, malformed artifacts, orphan resources, unavailable cleanup, and macOS sleep detection. Node test wrapper includes these in CI. Reviewed with identified cleanup/resume issues corrected before paid launch.
