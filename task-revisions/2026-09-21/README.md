# Task contract revision: 2026-09-21

Local amendments to the maintainer-selected DeepSWE source at
`0b9fabbb63b9104d678fe965e1632f2dd9eaa2ea`. Upstream lineage, review gates and
historical results remain unchanged. These files contain local clarification
addenda; they do not republish the upstream task collection or hidden tests.

- SuperJSON: define Node pseudo-path handling before internal-frame stripping.
- Ink: specify fixed-max minmax growth with concrete column/row examples.
- Textual: accept subscriptions through the public message classes, including
  aliases of a shared class. Keep every existing payload, state-change and
  widget behavior assertion. Route received events by their originating widget.

Materialize a separate amendment from the original reviewed task directory:

```sh
node scripts/s7-materialize-task-revision.mjs \
  scratch/deep-swe/tasks/textual-richlog-follow-state \
  task-revisions/2026-09-21 textual-richlog-follow-state \
  scratch/textual-contract-revision
```

The command rejects unknown source hashes and an existing output directory.
It writes amended `instruction.md`, `test.patch`, and a hash-bound `revision.json`.
Inputs are never overwritten. The output is an amendment, not an automatically
approved runnable task pack. A future prepared task must use the amended prompt
and verifier together and pass the existing source-review and validation gates.
Do not reuse the old source sign-off for changed task bytes.

Historical SuperJSON and Ink attempts did not receive these clarifications.
Their grades therefore remain original, with the ambiguity disclosed. Textual
supports a separate verifier correction, but only replayed and bound evidence
can support a changed verification result. Recovered post-verification
workspaces are identified as such; they are not original saved patch bytes.

Offline validation uses retained Linux images, no network, no model calls,
2 CPU cores, 4 GiB memory and a 240-second verifier timeout. These are **audit
replay** controls, not claims about historical campaign resource limits.
