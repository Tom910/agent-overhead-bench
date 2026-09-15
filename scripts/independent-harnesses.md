# Independent harness runs

`python3 scripts/independent_harnesses.py CONFIG.json` shows the saved index without provider requests. Add `--run` to execute pending jobs. The configuration is private operational data and must never contain API keys. The executable reads `OPENROUTER_API_KEY` from the local `.env`.

Each job has a unique `id`, `harness`, `task`, `rep`, `out` and an argument array `argv` for the existing runner. Use one task/tool, `--reps 1 --rep-start N --stop-on-failure`, an independent output root and run-window ledger. Retained jobs instead supply `retained_run` and `retained_state`; their original C4 repetition must match. Keep native source verification and the approved profile preflight in `preflight`. `env` supplies its non-secret AOB configuration. `credit_ceiling_usd` pins the account's authorized total credit snapshot; live remaining account credit and key limits are checked before and during each new attempt.

The index groups work by first-seen harness. Finish that harness's queued attempts before advancing. To add an approved harness, append jobs with new identities and output roots to the same configuration, then run the same command. Do not remove or modify retained job definitions. Completed, failed and interrupted attempts are never automatically repeated. An intentional retry needs a new identity and output root, preserving the failed attempt.

`index.json` records operational status, artifact paths, SHA-256 bindings and the unchanged C4 outcome/cost. Raw output remains under each job's output root. Incomplete cost stays unavailable; provider balance independently guards spending across failed attempts. The controller stops at a $0.10 margin, on unavailable balance, host suspension, AC disconnection or uncertain cleanup. This is an operational guard with polling delay, not a billing hard cap.

After an interrupted controller, reconcile its recorded host process and Docker resources before resuming. A surviving child/resource or unavailable resource status blocks new work. Corrupted cell artifacts remain a failed result and do not invalidate other jobs. Evidence tampering blocks reuse until reviewed.

These are independently accumulated diagnostic measurements. Official source calibration and release checks still apply before publication. A native task failure is a retained outcome, not a passing task.
