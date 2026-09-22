# Reviewed task contracts and offline verification revision

Approved scope: attachment `pasted-text-1.txt`, item 1. Execute this stage before
comparison-condition validation and report uncertainty. No model calls, no paid
reruns, no changes to historical run.json or selected outcomes.

## Design

Preserve upstream DeepSWE lineage and all existing source review gates. Store
small versioned local amendments, not another imported task collection. Clarify
SuperJSON Node pseudo-path processing and Ink fixed minmax allocation for future
prompts. Correct Textual verification to accept both nested and shared public
FollowChanged classes while retaining widget-specific payload and event checks.
Prompt clarifications cannot retroactively establish that old agents saw the
clarified requirements: label historical findings explicitly.

Keep immutable original grades and publish a separate correction/audit artifact
bound to canonical run hashes, amendment hashes and actual verifier image IDs.
Replay retained candidate patches where available. A workspace modified by the
original verifier is not automatically an authentic saved candidate patch.
Record unavailable evidence rather than reconstructing or inventing outcomes.

## Tasks and acceptance

1. Inventory selected run artifacts and retained Linux images; hash original
   sources. Establish which patches can be replayed faithfully.
2. Write versioned amendments and a deterministic application tool with tests
   rejecting unknown source bytes and duplicate application. Test alternative
   event implementations, not only the upstream reference implementation.
3. Run offline pristine/reference polarity and available candidate replays on
   Linux with pinned images, disabled network, bounded resources/time. Preserve
   raw logs privately and publish sanitized hash-bound results and limitations.
4. Publish the revision separately; do not replace original outcome/cost data or
   interpret prompt-only corrections as newly passed historical runs.

No npm dependencies. Verification: amendment unit tests, offline Docker gates,
artifact hash validation, then relevant repository tests and types. Subsequent
stages need their own plans: effective-condition manifest and report uncertainty.

## Observed completion evidence

64 task-package tests and strict typecheck pass. All three retained-image
reference solutions pass and pristine implementations fail. All 33 available
original-image candidate replays reproduce historical feature/regression counts.
13 Textual replays use the amended verifier; four change from fail to full pass.
The event-suppression negative control fails. Published separate audit:
`evidence/task-verification-2026-09-21`. Forty-two exact original-image replays
are unavailable; original temporary patches were not retained. Recovered
post-verification workspaces and their limitations are explicitly identified.
