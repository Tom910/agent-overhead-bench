# S8 — Release readiness status (2026-09-03)

## Current status — 2026-09-04

This section supersedes the historical handoff below. The authoritative official
profile is `s7-official-tool-scope.json`: claude-code, cline, codex, hermes, pi,
and qwen. The matching eligibility manifest accepts all six. Claude's old
protocol exclusion was superseded by the September 4 successful smoke and
`/v1/messages` proxy correction; Aider and OpenCode exclusions are explained in
the scope file. Eight tasks × six tools × four repetitions means 192 cells.

The completed local fixture pilot in `scratch/pilot-v2/state.json` records
192 done cells and $0.450821265 of recorded spend. A fresh report generated from
its results accepts all cells and shows 32/32 verifier successes for each tool.
The README now contains the six-tool pilot table generated from the verified
nonofficial archive at `evidence/pilot/pilot-report.tgz`. This replacement
contains 192 sanitized raw C4 records, C1 events, provenance, review notes,
checksums and report files; the previous download contained only rendered
report files. Both timing outliers are retained with evidence-based explained
dispositions. The archive marker is explicitly `official: false`.

The pilot publisher requires an explicit state path and validates coverage
against that run's persisted Cartesian definition. See
`S8-pilot-coverage-binding-plan.md`. Exercising the actual freeze found and
fixed an explained-only review rejection in the packaging CLI; see
`S7-explained-anomaly-freeze-plan.md`. The freeze and archive verification now
pass with all original cells retained. No provider run was started.

Next actions:

1. Completed: retain both pilot outliers, freeze and verify raw evidence, and
   update the README from that frozen report.
2. Continue the already selected eight-task DeepSWE suite. The September 3
   license evidence is complete; reconcile remaining review flags with that
   evidence. Do not restart source selection or license collection. The user
   reaffirmed the selection and prior license checks on September 5.
3. Obtain two-CLI calibration evidence for every selected task and maintainer
   source sign-off before the official matrix.
4. Complete the official run window, Activity reconciliation, anomaly review,
   verified archive, and S8 human publication deliverables.

No new provider run was started in this audit. Historical credit estimates and
provider latency observations below are dated evidence, not current balances
or a funding authorization. The v1 goal remains incomplete.

## Historical handoff (superseded where noted above)


Consolidated from a full gate-chain audit plus the extended-regime work landed
today. This supersedes scattered status notes for the question "what actually
stands between here and a published v1 with a README leaderboard".

## What changed today

| Commit | Change |
|---|---|
| `568dce3` | Verifier containers get a 256m tmpfs; agent cells keep 64m |
| `67466af` | Rejected the GPT-5.6 Sol migration; recorded the regime/source mismatch analysis |
| `fde6485` | Added the `extended` regime (16–180 min, 901–10800 s) and lifted the 1–5 minute cap |
| `f6e5c2e` | Fixed a pre-existing broken adapter timeout fixture (exit 13 vs 124) |
| `88ff90d` | Clamped the reference-polarity timeout default to the 1800 s verifier bound |
| `b3b1ee9` | Documented the extended calibration opt-in; recorded the regime decision |
| `0a36f76` | **Threaded `extended` through the runner, gates, and report** |
| `8193611` | Gave `s8-launch-check.mjs` a released branch; made the README table test ledger-aware |

### The defect that mattered most

`fde6485` added the regime to the validators and shell entry gates, but the
runner still derived the recorded label inline:

```ts
regime: task.expected_minutes[1] <= 5 ? "short" : "long"
```

So an extended task was written into C4 as `task_regime: "long"` beside a
3600-second timeout — a combination `validateTaskRegime` rejects. A live paid
calibration recorded exactly that before being stopped at `spentUsd: 0`.
Four downstream gates would then have refused the resulting evidence
(`s3-calibration-summary.mjs`, `s3-calibration-attestation.mjs`,
`s7-verify-archive.sh`), and the report would have published an extended table
under the short-regime "1–5 minute" claim. The derivation is now a shared
`regimeForExpectedMinutes()` beside `validateTaskRegime`, bound by a test
asserting every derived label passes its own validator.

## Hard constraints on an official v1 run

The official matrix is fixed by contract in three places:

- `scripts/run-all.sh` — repetitions must be ≥ 4
- `scripts/s7-freeze.sh:11` — `OFFICIAL_MIN_CELLS = 8 tasks × 5 tools × 4 reps = 160`
- `scripts/s7-freeze.sh:368` — 8–10 tasks, ≥ 4 contiguous reps, exact Cartesian

These are not arbitrary. The published headline column is `E2E (med/IQR)`, and
the IQR is within-cell dispersion: dropping to one repetition does not merely
reduce power, it makes a published column undefined. **This contract should not
be loosened to fit a budget.**

Against that fixed 160-cell shape:

| Constraint | Value |
|---|---|
| Provider credits remaining | `$4.16` (of `$10`; `$5.842127042` consumed) |
| Estimated cost, 160 extended cells | `$15–25` |
| Estimated wall clock, sequential | ~40–55 h |
| Required manual step | Private OpenRouter Activity CSV export for the exact run window (`s7-freeze.sh:289` recomputes the summary from it and refuses without it) |

An official v1 run is therefore blocked on **funding and elapsed time**, not on
code. Both numbers should be confirmed against the pending calibration's
measured per-cell duration and spend before anyone commits to a window.

## Honest publication options

1. **Official v1** — the full 160-cell matrix. Requires the budget and window
   above. `evidence/index.json` moves to `released`; README carries the real
   leaderboard; METHODOLOGY is de-drafted.
2. **Labelled pilot** — a smaller, complete, honestly-labelled matrix frozen
   with `AOB_ALLOW_NONOFFICIAL_FREEZE=1`, which already sets `official: false`
   and is accepted by `s7-verify-archive.sh` without `--official`. This
   publishes a table without claiming the v1 dataset. It needs a third ledger
   status so the README can show real rows while still stating that v1 is
   unpublished.

Option 2 is the only one reachable inside the current budget. It must never be
presented as option 1.

## Remaining work

### Needs a paid provider run
1. Two-CLI calibration pass for every selected task. Zero exist today; the
   first extended attempt on `ink-grid-box-layout` is in flight.
2. The official contiguous matrix (see constraints above).
3. The Activity CSV export — only the account holder can produce this.

### Needs local compute only
4. Report generation from the frozen tree into the README table.
5. A third ledger status if the pilot route is taken.

### Needs a human decision
6. Set the four review flags true — legitimate only once (1) exists.
   `source_reviewed`, `reference_results_verified`, and `maintainer_signed_off`
   have no code-enforced evidence; they are attestations.
7. Approve the final 8–10 task IDs.
8. Rewrite `plans/s3-deepswe-release-duration-map.json`, which still declares
   all eight tasks as `[1, 5]` and contradicts the extended decision. The new
   ranges should be evidence-based, from measured calibration durations.
9. De-draft METHODOLOGY at freeze time.

## Verification state

`npm test` green: 322 workspace tests across 25 files plus 83 script tests.
Typecheck, lint, shell syntax, and `git diff --check` all clean.
`node scripts/s8-launch-check.mjs` reports `status: pending`, as it should
until a real freeze exists.

One environmental flake to know about: `s7-container-clock-calibrate.test.mjs`
measures a real container/host clock offset against a 10 ms bound and can fail
while Docker is under load from a concurrent run. It passes on a quiet host.

## Pilot matrix findings (2026-09-04)

Running a real five-adapter matrix surfaced defects that no amount of unit
testing had:

1. **Refused requests broke report generation outright.** A request the proxy
   refuses consumed a C1 sequence number and wrote no event, leaving a hole
   that makes the report loader fail closed on the entire results tree. Every
   Hermes cell carried one. Fixed in `167708d`; refusals now record an event
   with `error.kind: "proxy_refused"`.
2. **Fixtures were starved of their own declared time.** All eight local tasks
   declared `expected_minutes: [1, 5]` with `timeout_s: 60`, so any cell slower
   than a minute timed out against its own five-minute expectation.
   `validateTaskRegime` checked both bounds independently and never against
   each other. Fixed in `2ec472d`; two of the first eight cells had already
   failed this way, and after the fix the matrix ran 21 consecutive cells with
   zero failures.
3. **Published costs were overstated.** Two-decimal rounding displayed a
   `$0.0065` cell as `$0.01`, 54% high, and an existing test asserted that
   rounding as correct. Fixed in `8dcb88b`.
4. **Published raw-evidence links were dead.** The generated report links each
   row to a `run.json` by a path relative to the report directory inside the
   gitignored results tree. Fixed in `38c83c9`; the table cites the checksummed
   artifact instead.

### Open, not fixed

Agents request `GET /v1/models/{model_id}`, which the proxy allowlist does not
include, so it returns 404. This is the same class as the `/api/v1/models`
path-doubling defect: a call that would succeed against OpenRouter directly
fails through the harness, and the retry cost is measured as agent overhead.
It is now visible in the evidence rather than silent, because refusals record
an event. It is deliberately **not** changed mid-matrix: altering the allowlist
would make earlier and later cells non-comparable within one run. Fix it before
the next matrix, not during this one.
