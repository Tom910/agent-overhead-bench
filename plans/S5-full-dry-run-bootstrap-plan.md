# S5 — Bootstrap the shared image for the Docker full dry run

**Status:** implemented and verified.

## Goal

Make the documented Docker full dry-run executable on a host that has Docker
but has not yet built the shared no-credential `aob-base:s2` image.

## Root cause

`mock-agent` and its secondary identity intentionally run from `aob-base:s2`.
`scripts/s5-full-dry-run.sh` selected Docker by default but assumed that image
had already been built, so a clean Docker setup failed before any C1/C4 output
or report could be produced.

## Scope and invariants

- Before the mock Docker matrix, check for `aob-base:s2` and build only that
  shared base image when it is missing.
- The base Dockerfile contains no coding-agent CLI or provider credential.
- Do not build or pull any six-tool image from the dry-run command.
- Preserve explicit host mode and all runner/report behavior.
- Official S7 image preparation remains explicit and unchanged.
- No provider spend and no new dependency.

## TDD implementation order

1. Add a no-spend source contract test requiring the Docker full dry-run to
   check and bootstrap `aob-base:s2`.
2. Observe the test fail against the current script.
3. Add the conditional base-image bootstrap and update S5 documentation.
4. Run the Docker dry-run on the current host, generate a report, run the full
   verification gate, and commit.

The implementation is complete. Docker mode checks the daemon and reuses or
builds only the shared base image before invoking the mock matrix; host mode
remains unchanged. The first attempt exposed Docker storage exhaustion, which
made APT report a misleading signature error. After reclaiming Docker build
cache only, APT passed with signature verification enabled; the base image was
built and the Docker matrix completed end to end. No provider request was
made.

## Acceptance

- Missing `aob-base:s2` is handled by a base-only Docker build before the
  runner starts.
- Existing base images are reused without rebuilding.
- The host full dry-run produces complete pinned/default mock artifacts and
  the report CLI consumes them.
- The Docker full dry-run builds the missing base image, produces complete
  pinned/default mock artifacts, and the report CLI consumes them.
- Full tests, typecheck, lint, shell syntax, and diff checks pass.

## Out of scope

Building official adapter images, provider-backed runs, source approval, or
changing measured-cell execution semantics.
