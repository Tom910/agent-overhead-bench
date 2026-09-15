# S8 — Bind pilot coverage to its run state

Status: implemented and verified (2026-09-04).

The pilot publisher guesses a sibling `pilot-matrix` directory and hardcodes
160 cells. A six-tool pilot can therefore inherit another run's coverage label.

Implement only this S8 correction, without provider spend or dependencies:

- Require an explicit state path in the publisher CLI.
- Derive intended cells from the persisted run definition, independent of the
  current official profile; validate exact, unique Cartesian cell identities.
- Reject malformed state before changing README or the evidence ledger.
- Exercise the CLI with a differently named run directory and misleading old
  sibling state; test incomplete and malformed matrices.
- Update current release guidance; preserve historical evidence and pilot labels.

Validation: publisher regressions, launch checker, full no-spend tests,
typecheck, lint, shell syntax and diff checks. A pilot does not satisfy S7.

Publisher invocation:

```sh
node scripts/s8-publish-pilot.mjs REPORT_DIR ARTIFACT_PATH STATE_PATH [ROOT]
```

Verification: all workspace tests and 103 script tests passed; the subsequent
in-flight-phase regression passed in the 13-test publisher suite. Typecheck,
lint, shell syntax, launch checker and diff checks passed. The completed pilot now has two explained timing anomalies, retained without
replacement; its verified nonofficial archive supplies the updated six-tool
README table and raw-evidence download. The initially refused freeze exposed
the packaging defect tracked in S7-explained-anomaly-freeze-plan.md. No provider spend was incurred.
