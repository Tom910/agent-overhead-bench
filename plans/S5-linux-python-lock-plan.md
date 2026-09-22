# S5 Linux Python artifact locks

The native amd64 Hermes build fails at `cffi==2.1.1`: the retained lock
contains the ARM artifact hash, while pip selects an x86_64 wheel.
Preserve every package version and existing hash. Add only hashes of the
same pinned packages selected by Python 3.11 in the native base image,
verified against their PyPI release metadata. Keep `--require-hashes` and
all existing image isolation and source pins. No dependency is added.

Validation: retain the failing native build, record selected filenames and
hashes with PyPI verification, then rebuild with hash enforcement and run
the existing S5 image validation. Task preparation and S7 preflight must
pass before any paid Linux continuation. This change adds no metrics or
schema fields and does not alter retained Mac evidence.

Verified on the Linux destination: all 61 downloaded artifacts matched PyPI
release metadata; 15 native hashes were appended, with every original line
preserved as a prefix. The native Codex, Hermes and Pi image builds and S5
version/entrypoint/credential checks passed without provider traffic. Local
`git diff --check` passed. Detailed artifact evidence is retained in
`scratch/linux-migration-20260913/hermes-amd64-pypi-verification.json`.

## Aider Linux CI follow-up (2026-09-22)

The same defect reproduces in the optional Aider image: pinned aiohttp 3.13.3
selects a Linux x86_64 wheel whose hash is absent from the retained lock.
Apply the same method: download exact pinned artifacts in the Linux Python 3.11
base, verify filenames/digests against PyPI release metadata, append only missing
hashes, and rebuild an isolated validation tag with `--require-hashes` retained.
No package version changes, benchmark calls, or replacement of historical images.

Verified all 108 downloaded artifacts against PyPI and appended 29 missing
Linux hashes. Every original version/hash remains unchanged. The isolated Aider
image rebuilt successfully with hash enforcement and reported version 0.86.2.
Artifact verification is retained in the Linux checkout's
`scratch/goal-validation-20260922/aider-lock/pypi-verification.json`.
