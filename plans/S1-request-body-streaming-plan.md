# S1 — Request-body streaming and bounded model capture

**Goal:** Match the frozen C1 contract for large and malformed request bodies:
forward request bytes unchanged while retaining only a bounded prefix for model
inspection. Oversized or unparseable bodies record `model_requested: null`; they
are not converted into proxy errors.

**Constraints:** No request mutation, retry, or body persistence; no new
dependencies; bounded capture; monotonic timestamps; no change to C1 fields.

## Tasks

- [x] Replace whole-body buffering with a streaming transform that forwards the
  incoming request body to `undici` and captures at most 16 MiB.
- [x] Mark oversized capture as `model_requested: null` while preserving the
  upstream response and status.
- [x] Treat client abort/close before `end` as an incomplete request error rather
  than a completed body, and keep the C1 error path typed and honest.
- [x] Add regression coverage for oversized forwarding and run existing
  byte-for-byte, streaming, and disconnect tests.

**Status (2026-08-27):** Implemented and verified. The previous 413 behavior was
removed because it contradicted the roadmap's passthrough contract.
