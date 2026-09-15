# S5 independently scheduled repetitions

S7 independent harness runs need one-cell invocations whose C4 repetition remains its actual index. Add optional `repStart` / `--rep-start` (default zero) to the existing runner. Generate `reps` consecutive indices starting there, bind nonzero start in the matrix definition, and reject negative, fractional or unsafe ranges before execution. Preserve the exact legacy definition for zero. No C1–C4 changes, metrics, dependencies or paid tests.

Validate nonzero single-cell identity, unchanged zero default, resume mismatch and invalid ranges. Then return to the S7 independent scheduler plan.

Implemented: 67 runner tests and all workspace TypeScript checks pass (2026-09-11).
