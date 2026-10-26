# S3 — Correct the Cline workflow cache exclusion

The maintainer asks whether the confirmed root cause has been fixed. Complete
the repair in the isolated engineering checkout. The diagnostic proved that
the workflow checker counts `.aob-cline-home` as uncommitted task work.

Use the same private-cache exclusion mechanism as the other adapters. This
keeps task commit and branch obligations intact. Changing the agent prompt or
having the runner commit would hide task failures and would not fix the checker.
No dependency, measurement model, provider call or new paid run is required.

1. Extend the real Python checker's tests with Cline's nested private cache,
   staged/unstaged/untracked task changes in its presence, an absent commit,
   and a similar but non-private path. Observe failure before the fix.
2. Add only `.aob-cline-home` to `PRIVATE_CACHES`. Run the checker suite and the
   native grading/preparation integration tests. Replay the retained copied PSD
   candidate against the production checker; keep the synthetic-commit label.
3. Build eight new verifier images in a new private Linux namespace with network
   disabled. Bind each exact original image ID and replace only its checker.
   Check the copied script bytes and the real Git predicates inside every new
   image. Preserve original tags, source trees, manifests, grades and budgets.
   These images are separately identified artifacts, not a qualified campaign
   or an implicit replacement for the frozen source. Existing source-review,
   calibration and verifier admission gates remain in force.
4. Obtain one independent review of this repair, resolve material findings,
   record verification and commit the repair locally. Do not publish amended
   historical grades or claim that six diagnostic estimates are regrades.

Review focus: genuine source changes must still fail; a new branch without a
commit must still fail; private cache and similar public names must be distinct;
original artifacts and image tags must remain unchanged.

Status: complete. The regression failed before the fix. All 53 targeted tests
pass after the fix, including 28 actual workflow-checker tests. The copied PSD
candidate passes the production checker; uncommitted-source and missing-commit
controls fail. All eight corrected Linux image overlays pass six Git checks
each (48 checks). Lint passes. An independent reviewer found no material issues.
The original files and tags remain unchanged. See
[verification record](../docs/reviews/2026-10-25-cline-workflow-fix.json).
