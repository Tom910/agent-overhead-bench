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
