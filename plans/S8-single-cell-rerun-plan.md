# S8 Single-Cell Rerun Implementation Plan

**Goal:** Make the README’s bounded single-cell validation command copy-pasteable and explicitly budget-protected.

**Scope:** Documentation and launch scaffolding only. The command continues to use the checked-in local validation fixture; it is not an official v1 result and does not bypass S7 source-review gates.

## Tasks

- [x] Replace the stale price-book placeholder with the approved dated price-book ID.
- [x] Add a conservative per-cell cap and matching estimate to the documented command.
- [x] Verify the command references the selected model, Docker mode, one tool, one task, one repetition, and the dated price book.
- [x] Commit after documentation and repository checks pass.

**Status (2026-08-27):** Implemented and verified. The documented command remains a local validation run, not an official v1 result.
