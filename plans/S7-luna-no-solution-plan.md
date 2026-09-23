# S7: prove an empty verifier patch without rerunning an agent

The user authorized fixing and restarting the Luna collection. Codex Ink rep0
has successful, complete model accounting and native exit0, but verifier exit1
with an empty log. Its retained candidate patch is nonempty because the private
prepared-visible projection includes runtime dependency links. Native prose
cannot establish whether a solution exists.

Add `scripts/s7-luna-no-solution.mjs` and focused tests. It reconstructs the
candidate in a disposable `prepareCandidateBaseline` snapshot, checks the exact
recorded prepared tree hash and exclusion list, and applies the retained,
hash-bound binary patch using safe `git apply`. Invoke only the original capture
helper from the pinned immutable verifier image, with networking disabled and
bounded local resources. Its /app base revision and helper bytes must match the
frozen source. The original workspace, verifier command, images and grader remain
unchanged. A successful capture with a genuinely zero-byte output proves
`no_solution_produced`; it does not claim that the task tests ran.

`createNoSolutionProof({cellDir,taskDir})` returns a small private receipt; its
caller writes `no-solution-proof.json` exclusively. The synchronous
`validateNoSolutionProof({cellDir,taskDir,proof})` checks receipt schema, original
run/candidate/log/task/verifier hashes, image identities, and empty-capture facts
without rerunning Docker. Existing evidence remains unchanged. Restrict the
helper to native exit0, verify_error with verifier exit1 and zero-byte verify.log.
S7 separately requires canonical Luna identity/usage before using the result.

Test before implementing: reconstruction of nonempty ignored-link patches,
nonempty capture and capture errors, unavailable/mismatched candidate evidence,
changed prepared baseline/exclusions, changed image or retained bytes, and exact
receipt validation. Use local fixtures only; no credentials, inference, frozen
image rebuild or agent rerun. Root coordinates current-cell proof and admission.

## Validation outcome

Five focused regression tests failed before implementation and now pass. They
exercise actual prepared snapshots and binary patch application; Docker capture
is replaced only in the unit fixtures. Root then ran the unchanged helper on the
actual Linux Ink attempt with its immutable verifier image: capture exit0,
126037-byte retained candidate, zero-byte reconstructed verifier patch. That
read-only invocation returned a proof without writing campaign evidence or
changing original files. No model calls or agent/grader reruns were used.
