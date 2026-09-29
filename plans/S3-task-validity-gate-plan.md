# S3 task validity gate implementation plan

> For agentic workers: use subagent-driven-development and verification-before-completion.

**Goal:** Make task assurance an executable, evidence-bound review instead of treating a failing process as proof of a sound verifier.

**Architecture:** Versioned task validity cards and control observations outside task/C4 contracts. A strict evaluator returns specific unmet obligations. A bounded offline command runs each control in a fresh workspace and records exact task, patch, verifier and log hashes. Existing source approvals remain separate.

**Tech stack:** Existing TypeScript, Node crypto/filesystem/child-process and Vitest; no dependencies.

**Spec:** September 22 audit; `benchmark-validity-packages-2026-09-22.md` package 2.

## Global constraints

No model calls. No changed historical results or frozen September 21 amendments. No new source approval, calibration attestation or claim of task certification without evidence. Infrastructure failures/timeouts are not valid negative controls. Hidden checks remain outside agent workspaces. No source import from prohibited suites. Preserve the selected DeepSWE lineage and existing review gates.

## Review focus

Bindings between written contract, assertions, verifier revision, patches and observations. Fresh filesystem per repetition; no reused mutated verifier workspace. Explicit unknown gaps. Native grader reward and named assertion results, not shell exit alone. Unknown fields, duplicate controls, stale evidence and arbitrary path traversal fail closed.

### Task 1: Typed validity cards and assurance evaluator

**Files:** New `packages/tasks/src/task-validity.ts` and tests, `packages/tasks/src/index.ts`, versioned `task-validity/2026-09-22/` card data and README.

**Interfaces:** Card declares task/source/instruction/verifier identities; workflow and harness stress; critical obligations mapped to named assertions; regression scope; independent review identity/status; reference, pristine, alternate and mutant controls; repeatability and limitations. Control observations bind exact card/verifier/patch/log hashes and distinguish graded pass, graded rejection, timeout, infrastructure error and unavailable. Gate requires an independently reviewed mapping, reference and at least one distinct alternative valid patch, pristine rejection, every declared critical mutant rejected by its targeted assertion, and repeated identical-patch results in fresh workspaces. Missing evidence yields a structured pending result; malformed evidence is rejected.

- [ ] Write meaningful failing tests for forged/stale hashes, infrastructure-as-negative, omitted critical assertions, absent or identical alternate patch, undetected mutation, unstable repeated grade and genuine complete evidence.
- [ ] Implement strict parser and evaluator with a versioned, documented evidence schema. Expose an offline CLI/wrapper to inspect cards/evidence and exit nonzero when assurance is pending or invalid.
- [ ] Add eight current-task cards from the audit and source instructions. Record known gaps honestly; do not assert a complete assertion map or independent sign-off that was not performed. Bind actual source file hashes, preserve provenance and required amendments.
- [ ] Validate all card files, focused tasks tests and typecheck. Commit and report.

### Task 2: Fresh-control execution and verifier fault discrimination

**Files:** New offline control runner and tests in `packages/tasks/src/`; wrapper under `scripts/`; legacy `validate.ts` only if needed for a confirmed isolated bug with regression tests.

**Interfaces:** Explicit local-development control protocol produces structured assertion outcomes and fresh workspace identity for each repetition. Bounded execution, private complete logs and portable hash metadata. Unknown/invalid/missing grade, process timeout, signal, launch error or verifier corruption cannot count as a rejected candidate. Native DeepSWE evidence requires reward plus feature/regression results, with its existing immutable-image replay interface; do not generalize a local fixture pass into native verifier certification.

- [ ] Write failing tests with a verifier that mutates its workspace, a constant/no-op candidate, an alternate valid implementation, a timed-out command and malformed grade output.
- [ ] Implement fresh-copy execution, patch application isolated from mutable candidate Git configuration, explicit control classes and safe artifact paths. Keep reference/control files outside measured task input.
- [ ] Add a reproducible command and schema examples that later diagnostic tasks can use. Record unexecuted native controls as pending.
- [ ] Run focused tests and typecheck; commit and report limitations precisely.
