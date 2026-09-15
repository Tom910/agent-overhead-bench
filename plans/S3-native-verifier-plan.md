# S3 follow-up — native verifier contract

Status: implemented; this slice does not approve a task source.

## Purpose

The current C2 preparation path represents a verifier as a shell script. A
publication-grade source may instead provide an authoritative command and a
pinned verifier image. This slice adds that source-side contract and an
isolated Docker executor; the later C4 provenance correction records the
verifier digest without introducing derived fields into `run.json`.

## Contracts

- `VerifierSpec` is either a prepared script or a Docker command.
- Docker commands are argument arrays, never shell strings.
- The verifier image is passed by an immutable digest, uses `--network none`,
  mounts only the staged workspace read/write, and runs from a safe workspace-
  relative directory.
- Script verification retains its in-container monotonic duration; native
  command verification records the host monotonic duration of the isolated
  Docker command boundary because verifier images are not required to contain
  a timing runtime.
- Existing script verifiers remain behaviorally unchanged.

## Acceptance tests before implementation

- [x] Script-backed C2 tasks still expose a script verifier.
- [x] A native command descriptor rejects empty arguments, NULs, path escape,
  mutable image identifiers, and non-`none` network policy.
- [x] A Docker native command is executed without a shell, with a pinned image,
  network disabled, and no verifier-file mount.
- [x] Native verification is reachable from both host-adapter and
  fresh-container cell execution paths.
- [x] Native stdout/stderr and bounded timeout produce the same typed verifier
  result boundary used by existing C4 execution.
- [x] `aob-task-validate` accepts native descriptors, checks the pinned image is
  available, and validates pristine behavior without requiring `verify.sh`.
- [x] Existing workspace tests and Docker route tests remain green.

## Implementation

1. Add the discriminated verifier type and strict runtime validator in the task
   source package.
2. Extend the Docker verifier helper with a command-array mode while retaining
   the existing script mode.
3. Add focused fake-Docker tests for argv, mounts, network, digest, and timeout.
4. Extend the source validation CLI to exercise native pristine checks without
   weakening the separate reference-result and review gates.
5. Document that a source adapter still must supply hidden-test preparation and
   reference-result evidence before S7 approval.

## Status

The verifier type/validator and the Docker command-array executor are
implemented and covered by task and runner tests. Prepared descriptors now
flow through CLI preparation, matrix definition/resume checks, cell staging,
host verification, and Docker-cell verification. Native commands execute as
Docker entrypoint plus argument arrays, so the verifier image need not contain
Node. Public task-pack preparation now rejects packs without a source-owned
native descriptor and copies that descriptor unchanged; generated benchmark-
side verifier wrappers are no longer used. Source-specific hidden-test
materialization and review remain separate; this slice does not make any source
eligible for S7.

## Out of scope

Dataset selection, hidden-test patch application, image building, source
license approval, calibration, maintainer sign-off, and official paid runs.
