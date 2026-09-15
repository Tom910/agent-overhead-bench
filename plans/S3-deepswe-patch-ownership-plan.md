# S3: DeepSWE patch capture without archive ownership restoration

The AC-powered validation on September 8 completed Claude Code's adapter with
complete priced usage, then failed before native tests: GNU tar tried to restore
uid 501/gid 20 from the mounted workspace in a verifier with `--cap-drop=ALL`.
The extraction exited 2. A network-disabled container reproduced the error with
a two-entry archive carrying those IDs.

## Change

Extract the visible workspace overlay with `--no-same-owner`. Ownership is not
part of the Git patch. Preserve file contents, modes, symlinks, deletion capture,
the immutable Git base, and the verifier's existing container restrictions.
No dependency, contract, measurement, source-review, or calibration gate changes.

## Verification

- Retain the failed run, its raw evidence, and original workspace unchanged.
- Add an opt-in offline Docker regression that injects foreign owner IDs into
  the real archive and runs the real helper with all capabilities dropped.
  Demonstrate failure before the fix and success afterward, including a patch
  that applies cleanly to the immutable base.
- Run existing patch-capture tests, lint, and relevant preparation tests.
- On a separate copy of the retained workspace, run the original native
  verifier with the corrected helper. Record this as a diagnostic, never
  rewrite the measured run or promote it to a successful first attempt.
- Review before integration. Future prepared verifier images must include the
  corrected helper and record their actual new digests.

## Result — 2026-09-08

The regression failed with the original helper (tar ownership errors, exit 2)
and passed after the one-flag fix. All 10 patch-capture/preparation tests and
lint passed. Independent review found no blocking issue; its suggestion to
explicitly run the Docker regression as uid 0 was incorporated and retested.

The separate retained Claude workspace check passed in 9.934 seconds with
45/45 new and 979/979 required existing tests passing. No model tokens were
spent. The measured C4 remains `verify_error`; the diagnostic does not replace
its verifier outcome or satisfy the first-attempt validation gate.

## September 10: verifier Git ownership boundary

The Z.AI-pinned validation retained valid usage for all 184 model requests.
Pi passed; Claude's adapter exited zero but verification exited 128 at the
workspace Git boundary with dubious ownership. A foreign-owned writable
workspace reproduced this offline; the earlier archive-owner regression did
not cover directory ownership.

Add a system Git `safe.directory` entry for exactly `/work/workspace` only
in the verifier image. The immutable mirror remains the patch baseline and
replaces agent Git metadata before workspace Git commands. The setting covers
the helper, generated cleanup command, and native grader subprocesses under
read-only container runtime. Do not use a wildcard or change agent images.
No dependency, accounting, task, native test, or source gate changes.

Add an opt-in Docker regression with actual foreign directory ownership and
`--cap-drop=ALL`, proving patch capture/reset, subsequent Git cleanup and patch
application. Demonstrate failure against the old image and success against the
corrected image. Run the original native verifier on a retained-workspace copy;
retain the measured failure unchanged. Rebuild all eight verifier images from
their exact previous image IDs with this config-only layer, record new digests,
and rerun all 40 native reference checks before fresh paid validation.

The actual directory-ownership regression failed with exit 128 against the old
image and passed against the corrected image. All 11 targeted tests, including
both opt-in Docker cases, and lint passed. Independent review found no blockers;
the new regression also matches the runtime noexec/nodev temporary filesystem.
All eight verifier images were rebuilt on their exact prior IDs, all 40 native
reference checks passed, and updated source bindings validated. A separate copy
of the failed Claude workspace passed all 45 new and 979 existing native tests
in 17.385 seconds. Original artifacts remain unchanged.
