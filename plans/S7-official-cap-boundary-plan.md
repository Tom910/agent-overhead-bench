# S7 official cap boundary plan

Status: Implemented

## Goal

Make the north-star $1,500 maximum recorded spend an enforced official-run and
archive boundary, rather than a caller convention.

## Contract boundary

- `run-all.sh` rejects any configured cap above `$1,500` before preflight or
  provider execution.
- `s7-preflight.sh` repeats the same official cap check when invoked directly.
- `s7-freeze.sh` rejects a runner state whose persisted spend exceeds `$1,500`
  before creating an archive.
- Diagnostic calibration launchers may continue using smaller caps and do not
  become official archives.

## Acceptance tests

1. `run-all.sh` rejects `AOB_CAP_USD=1500.01` without requiring a key or
   starting Docker/model work.
2. `s7-preflight.sh` rejects a cap above `$1,500` before other gates.
3. `s7-freeze.sh` rejects state spend above `$1,500` and accepts spend at or
   below the boundary.
4. Existing positive-decimal validation and runner-level budget enforcement
   remain unchanged.

## Out of scope

- Changing diagnostic cap defaults or estimating cell cost.
- Changing C1-C4 accounting or retroactively changing already-spent money.

## Review point

Confirm that every path capable of declaring an official run or archive uses
the same hard maximum, including direct script invocation.
