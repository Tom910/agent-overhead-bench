# S4 follow-up — Codex under the hardened Docker cell

Status: implemented and verified.

## Problem

The S2 Codex recipe uses `--sandbox workspace-write`, which launches Codex's
nested bubblewrap sandbox. The S5 agent container deliberately drops all Linux
capabilities and enables `no-new-privileges`; on the current Docker runtime,
bubblewrap then cannot create its namespace and Codex cannot execute shell
commands. Adding `CAP_SYS_ADMIN` and an unconfined seccomp profile would make
the nested sandbox work, but would weaken the outer cell boundary.

## Decision

The Docker-only descriptor uses
`--dangerously-bypass-approvals-and-sandbox`, relying on the S5 container as the
outer sandbox. The host diagnostic adapter retains the S2 `workspace-write`
recipe. This is a documented container-execution deviation, not a model or
task change.

The Docker cell still enforces a read-only image, a writable temporary tmpfs,
all capabilities dropped, `no-new-privileges`, an internal proxy-only network,
one staged workspace mount, closed stdin, and a bounded timeout. The bypass
flag is never used by the host adapter.

## Acceptance

- [x] Container and host Codex argv paths are tested separately.
- [x] The Docker descriptor explicitly uses the externally sandboxed bypass
      mode and does not request nested bubblewrap.
- [x] The hardened Docker boundary remains covered by runner tests.
- [x] A real pinned-model Codex task reaches the provider and produces a
      schema-valid result or a typed verifier outcome; namespace failure is
      absent.
- [x] No capability or seccomp relaxation is added to the shared runner.

## Out of scope

Changing the pinned model, changing the S2 host recipe, adding Docker
privileges, or weakening network and artifact isolation.
