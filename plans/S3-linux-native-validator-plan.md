# S3 Linux native verifier validation

S7 preflight reaches `validatePristineTasks`, whose separate Docker execution
path still constructs a registry-style name@config-ID reference. Native
classic Docker rejects that reference. Inspect the configured tag with
`--format {{.Id}}`, require equality with the recorded digest, and execute the
bare immutable ID. Use the Linux host UID:GID and writable HOME=/tmp as in S5
so pristine checks exercise the verifier under the same filesystem ownership.
Keep Darwin behavior, network isolation, capability restrictions and native
exit polarity unchanged. No schema or dependency change.

Extend the existing fake-Docker fixture to model classic Docker, require bare
ID launch, and reject tag drift before execution. Run the focused task tests,
workspace typecheck, and the actual native S7 preflight before continuation.

Validation completed: the classic-Docker fixture failed before the fix, then
all 13 validator tests passed on both macOS and Linux. All workspace TypeScript
checks and `git diff --check` passed. The regression also proves tag drift is
rejected before a container launches and Linux uses its host workspace owner.
