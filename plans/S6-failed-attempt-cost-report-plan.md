# S6 unknown total cost after failed upstream attempts

The retained Codex SuperJSON repetition 2 contains eight successfully priced
Responses requests and an ambiguous HTTP 400 with unavailable usage. S5
correctly records total C4 spend as null. The report currently calculates a
successful-request subtotal and rejects the availability mismatch, blocking
an honest diagnostic report of the retained failures.

Before successful-event pricing or default-condition zero fallback, apply the
same cost-availability predicate as S5 estimateRunSpendUsd: a recognized model
request attempt that is neither successful, a contracts-validated
pre-inference rejection, nor proxy_refused makes total cost and token floor
unavailable. Use existing contracts predicates. Retain both C4/C1 availability
and numeric reconciliation checks; do not infer cost from outcome alone.
Known costs for adapter failures with complete successful events and zero
for request-free attempts remain unchanged. Null propagates through task and
headline medians. Successful-only token usage and all-attempt turn/timing
semantics remain unchanged.

No raw evidence, C1–C4 schema, dependency, runner accounting, official campaign
validation or archive release gate changes. This is an S6 diagnostic reporting
follow-up, not an approval of the unknown-cost run for official publication.

Regression cases: ambiguous failure after success and failure-only; numeric
C4 against ambiguous C1 rejected; null C4 against complete C1 rejected; known
pre-inference rejection and proxy refusal remain exceptions; missing rejection
proof remains unknown; request-free zero and aggregate-null propagation.
Run report tests/types and generate all six host-separated Mac diagnostic
reports from byte-verified retained C4/C1 copies. Independently review before
committing. The separately running Linux scheduler is not modified.

Verification: the unknown-cost regression cases failed on the old code, then
43 report-generation tests and all 137 report workspace tests passed. All
workspace typechecks and whitespace checks passed. A root-level broad test
invocation initially hit six existing relative-fixture-path errors; running
the package's intended `npm test --workspace @aob/report` command passed.
Independent review found no blockers. All six retained Mac reports now
generate from 144 C4/C1 pairs, after 1,344 indexed artifact hashes were
verified and missing report inputs were copied byte-for-byte. The refreshed
inventory is `scratch/independent-harnesses-20260911/inventory/20260913T040554Z`.
