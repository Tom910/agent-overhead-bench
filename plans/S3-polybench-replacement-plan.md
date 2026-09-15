# S3 follow-up — verified public source replacement

Status: historical evaluation; rejected for v1 and superseded by the selected
DeepSWE source. No replacement-source decision is pending in this plan.

The former eight-task public preparation candidate is quarantined for
publication because its TypeScript labels do not correspond to TypeScript
source, it has no medium repositories, and its source-native reference-result
gate is unproven. The evaluated replacement also does not satisfy the required
size composition, so this plan records the reusable native-verifier boundary
without accepting either source or changing the measurement model.

## Candidate and immutable inputs

Candidate: [SWE-PolyBench Verified](https://github.com/amazon-science/SWE-PolyBench)
and its public dataset record.

Pin all preparation inputs before implementation:

- dataset revision: `b3fca77b637379f0c01ad86d18753a7ac1998b53`
- `test.csv` byte size: `12410402`
- `test.csv` SHA-256: `0c8138e73c34fa29a5276b675b146b72d78ce001fcc4560d76302c908b4808a5`
- each repository at the row's full `base_commit`
- each task's Dockerfile content and native `test_command`

The checked-in manifest must record the dataset revision, file checksum, row
IDs, repository URLs, base commits, and task checksums. Preparation may use
network access; timed agent cells may not.

## Required contract extension

Extend the source-side task metadata, without adding derived metrics to
`run.json`, with the information needed to reproduce the source verifier:

- repository and exact base commit;
- source task category and measured repository size classification;
- public problem statement;
- hidden test patch kept outside the agent workspace;
- native test command and working directory;
- immutable verifier image digest;
- deterministic dependency/setup recipe executed before timing.

The C2 task still exposes only the existing task identity, language, size,
shape, timeout, expected duration, description, and source provenance. The
additional preparation fields belong to the source manifest or verifier
metadata, not to measurement outputs.

The reusable native verifier boundary is specified in
`plans/S3-native-verifier-plan.md`: source adapters may return an immutable
Docker command descriptor, while the existing script verifier remains
supported. The descriptor is now validated and executable through the runner
matrix; it is not yet wired to a selected replacement source.

## Selection constraints

Select exactly eight tasks after inspecting the pinned base checkouts:

- four Python and four TypeScript tasks;
- at least two measured medium repositories and at least two small ones;
- at least one feature, bug-fix, and refactoring task; document the missing
  test-fix category rather than relabeling a task;
- native tests complete within the task timeout after dependencies are built;
- pristine workspace fails and the source gold patch passes;
- no network access or package installation during an agent cell;
- no task-specific content copied into this repository beyond the immutable
  manifest and preparation metadata.

Repository size is measured from the exact base checkout using a documented
file-count/byte-count rule. It is not inferred from dataset labels.

## Implementation sequence

1. Add tests for pinned dataset parsing, row/checksum validation, safe Git
   checkout, hidden test isolation, native command metadata, and malformed
   manifests.
2. Implement a no-new-dependency preparation adapter using Node filesystem,
   Git, and Docker APIs already used by S3–S5.
3. Build or pull each task verifier image during preparation and record its
   immutable digest. The timed runner must reject mutable image references.
4. Materialize separate agent and verifier workspaces. Apply the hidden test
   patch only to the verifier workspace; never mount it into the agent
   workspace.
5. Extend the runner verifier boundary to execute the recorded native command
   in the pinned verifier image with network disabled and a bounded timeout.
6. Run five pristine and five gold-patched offline repetitions per selected
   task. Record exit codes, durations, image digests, and failures in private
   validation evidence.
7. Run the required two-CLI calibration, review every prompt and source
   boundary, then update the public manifest only after maintainer sign-off.

## Acceptance gates

- [ ] exact dataset revision, file checksum, and source licenses recorded;
- [ ] eight selected rows are genuine Python/TypeScript tasks;
- [ ] size composition and category composition satisfy this plan;
- [ ] all native verifiers are deterministic, isolated, and offline;
- [ ] every pristine run fails and every gold-patched run passes;
- [ ] two-CLI calibration and maintainer review are recorded;
- [ ] S7 preflight accepts the prepared manifest and no official matrix has
  been run before all gates are checked.

No code in S5–S7 may claim this candidate is accepted until every gate above is
checked.

## Preflight enforcement correction

The existing public task-pack manifest must carry an explicit review record.
S7 preflight must reject a prepared source unless its record confirms source
review, reference-result validation, calibration, and maintainer sign-off. A
fresh checksum and a passing pristine verifier are necessary mechanical checks,
but they are not evidence that a source is publication-ready. The review record
is bound to a hashed evidence file and an exact reviewed-task-ID set, so changing
approval booleans alone cannot satisfy the gate. This gate is implemented before
any replacement source is allowed to reach an official run.
