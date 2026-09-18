# S5 — Restore pruned Linux benchmark images

S7 continuation is paused before paid execution: the Linux host's Docker cleanup
prunes unused images and build cache after 72 hours. All benchmark images are
missing; Docker reports zero build cache. No image archives were found in the
checked repository/home locations. Existing C1/C4 results remain intact.

Restore infrastructure using the retained source checkout, pinned CLI versions,
base digests and existing preparation scripts. Use a new preparation directory;
preserve all old manifests and their original image identities. Native verifier
polarity checks are zero-model-token validation, not repeated benchmark attempts.

- Build the existing full-profile prerequisite images (no provider requests).
- Prepare the eight existing selected DeepSWE tasks in a fresh directory with
  unchanged prompts, source revisions, timeouts and expected duration metadata.
- Run source-owned reference checks and compare task definition identities with
  the retained preparation. Keep actual rebuilt image digests; never substitute
  old digests or call new image bytes identical without evidence.
- Update only the not-yet-started 96-job schedule to the new prepared paths.
- Resume normal S7 preflight and guarded scheduling after preparation succeeds.
- Keep all 104 existing Linux slots; new image generation is a disclosed
  environment difference, not permission to rerun old slots.

No new npm dependencies or source-policy exceptions. No real model requests in
restoration. Do not disable the host's unrelated cleanup service. Benchmark
publication must retain the original/rebuilt image provenance.

Restoration completed successfully on 2026-09-18. Source-owned verifier checks
passed, task definitions matched the retained manifests, and normal preflight
admitted the queue. Retained files were not rewritten. The Linux report discloses
the original/rebuilt verifier identities.
