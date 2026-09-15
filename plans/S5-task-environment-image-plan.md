# S5 — Execute prepared task environments in agent cells

## Goal

Use the prepared DeepSWE task environment for the measured agent process. The
current runner records an environment label and builds task-specific verifier
images, but launches the agent from only the generic `aob-<tool>:s2` image. A
real task therefore has no offline project dependencies and may stall trying to
install them over the intentionally disabled network.

## Scope and invariants

- Build a task/tool composite image before measurement: the task environment
  supplies the offline repository dependencies and the pinned tool image
  supplies the coding-agent CLI and runner entrypoint.
- Record the composite image and immutable digest in task-environment
  provenance, and make the runner verify that digest before launch.
- Keep the proxy route, no-network boundary, timeout, clocks, C1–C4 fields,
  and measurement derivation unchanged.
- Do not copy hidden tests, reference patches, API keys, or verifier inputs into
  the measured workspace or agent image.
- Preserve the generic local/S2 runner path when no prepared task image is
  declared.

## Acceptance

- A no-spend runner test proves a declared task/tool image is selected and its
  digest is checked before Docker launch.
- A no-spend entrypoint test proves dependencies already present at `/app` are
  linked into the mounted workspace without network access.
- DeepSWE preparation builds one composite image per requested task/tool,
  records each image digest, and emits it in the prepared task metadata.
- A real bounded DeepSWE retry reaches the task with its prepared dependencies;
  whether the model solves it remains calibration evidence, not an automatic
  pass.
- Existing workspace tests, strict typecheck, lint, and Docker route smoke pass.

## Implementation order (TDD)

1. Add failing runner/entrypoint tests for image selection, digest pinning, and
   offline dependency linking.
2. Add the typed task-environment image metadata and C4 provenance fields.
3. Add the composite-image build to the DeepSWE preparation launcher and parse
   its sidecar metadata in the local task source adapter.
4. Select the tool-specific composite image in Docker cells and enforce its
   digest in `runDockerCommand`.
5. Run a bounded single-task retry, update the S3 calibration record, and run
   the complete no-spend verification gate.

## Out of scope

Changing the short-regime timeout, adding tool-event instrumentation, approving
the DeepSWE source, or starting the official S7 matrix.

## Status (2026-08-28)

Plan opened after a real Codex/Ink trace showed `npm install` was attempted in
the generic agent container while network access was disabled. The existing
DeepSWE environment image was used only as the verifier base, not as the agent
runtime.

The composite-image path, typed digest enforcement, task metadata sidecar, and
offline dependency-linking entrypoint are implemented. A rebuilt real
Codex/Ink retry used the composite image and recorded its digest in C4; both
attempts reached the task without the prior missing-dependency failure but
timed out before verification. This closes the environment-boundary defect;
short-regime calibration remains open.
