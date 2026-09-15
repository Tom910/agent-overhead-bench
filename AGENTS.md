# agent-overhead-bench

Read `plans/README.md` before coding.

This repo measures where coding-agent CLIs spend wall-clock time and money (model vs harness vs tools). It is not a capabilities leaderboard.

Rules:
- Implement one stage at a time from `plans/S<N>-*.md`. Do not invent a second measurement model.
- No derived metrics in `run.json`.
- No new npm dependency without a justification in the stage plan. Default answer is no.
- TypeScript strict. Typed errors. Monotonic clocks for measurement.
- CI never holds API keys and never spends tokens.
- Do not measure, mention, or compare Meta products.
- Do not import SWE-bench, Terminal-Bench, or Vetta tasks directly. The
  maintainer-selected DeepSWE adapter is an explicit exception: preserve its
  declared upstream lineage as provenance and keep the source-specific review
  and verifier gates enabled.
