# contracts changelog

## unreleased — development surface

The raw C1–C4 contract surface remains changeable during implementation. The
final release will freeze the contract and record its release version after the
official run and launch artifacts are complete; no backward-compatibility
promise is made before then.

- Added raw C4 `tool_visibility` metadata so S6 can distinguish `partial` from
  `none` when `toolEvents` are absent. This is not a derived metric.
- Added C4 verifier image and canonical task-environment provenance
  alongside the agent container digest.
- Added paired C4 `task_environment.agent_image` and
  `task_environment.agent_image_digest` fields for prepared task images; these
  are raw provenance, not derived metrics.

The entries above describe the current working shape. Release-time changes will
be recorded here when the final contract is frozen.
