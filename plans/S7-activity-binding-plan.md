# S7 Activity Export Binding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or **superpowers:executing-plans** to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bind the independent Activity Export review to the exact measured run/event set, runner state, and operator-selected contiguous execution window.

**Architecture:** Keep the raw Activity Export outside the repository and continue to emit only a sanitized summary. Extend that summary with deterministic, role- and path-labeled hashes for current, retry, and selected anomaly-replacement run/event records and the exact original and rerun state files, plus a strictly validated ISO window supplied by the operator. S7 freeze recomputes the hashes and local accounting from the original results/state and the exact reviewed rerun results/state, rejecting stale, extra, mismatched, over-cap, or windowless evidence.

**Tech Stack:** TypeScript strict, existing Node.js CSV parser and report loader, POSIX shell; no new npm dependencies.

**Spec:** `/Users/tom910/dev/visa-case/agent-overhead-benchmark-design.md`, `/Users/tom910/dev/visa-case/agent-overhead-benchmark-implementation-roadmap.md`, `plans/S7-activity-export-crosscheck-plan.md`, and `plans/S7-runs-protocol.md`.

## Global Constraints

- No raw Activity Export rows, credentials, account identifiers, prompts, or solutions enter the repository or release archive.
- No derived metrics are added to `run.json`; binding metadata belongs only in the review summary/provenance.
- The cross-check remains no-network and pinned-price-book-only.
- The operator must choose and review an export window containing only the official contiguous run; the tool must validate its shape and coverage but must not invent the window.
- Selected anomaly replacement reruns and their separate runner state must be included in Activity accounting and binding; their original paid attempts remain included as provenance.
- The rerun result/state matrix must exactly equal the reviewed replacement IDs. Unselected paid reruns cannot be silently excluded.
- The official $1,500 cap applies to combined original and rerun state spend.
- Existing spend tolerance remains `max($0.01, 1% of local spend)`.
- No new npm dependency.

---

### Task 1: Define and test summary binding

**Files:**
- Modify: `packages/report/src/activity-cli.ts`
- Modify: `packages/report/src/activity.test.ts`

**Interfaces:**
- `runActivityCrosscheck` accepts `window?: { startIso: string; endIso: string }` for library callers; official CLI callers must supply it.
- Export `activityBinding(resultsDir: string, statePath?: string)` returning deterministic `run_ids_sha256`, `results_sha256`, and `state_sha256` values.
- `ActivityCrosscheckSummary` includes `window: { start_iso: string; end_iso: string }` and `binding` with those hashes.

- [x] **Step 1: Add failing tests** for valid/invalid ISO windows, deterministic binding hashes, and summary fields that change when a run/event or state file changes.
- [x] **Step 2: Run the focused report tests** and observe the new expectations fail.
- [x] **Step 3: Implement the binding hash from sorted current plus preserved retry C4/C1 records and the exact state-file bytes.**
- [x] **Step 4: Validate `startIso < endIso` and require a nonempty explicit window for official CLI use.**
- [x] **Step 5: Run the focused activity tests.**

### Task 1b: Bind replacements and distinguish attempt roles

**Files:**
- Modify: `packages/report/src/activity-cli.ts`
- Modify: `packages/report/src/activity.test.ts`

**Interfaces:**
- `activityBinding(resultsDir, statePath?, replacementResultsDir?, replacementRunIds?, replacementStatePath?)` includes selected replacement records, both state digests, and labels every record with `current`, `retry`, `replacement`, or `replacement-retry` plus its logical relative path.
- `runActivityCrosscheck` accepts the same replacement arguments, requires a separate rerun state, and reconciles original and rerun accounting independently before combining spend.
- `activityLocalAccounting(...)` is the single evidence-derived local total used by both summary generation and official freeze; freeze does not trust declared summary counts or replacement spend.

- [x] **Step 1: Add failing tests** for a selected replacement’s spend/binding inclusion, a current-versus-retry path swap, and changed state bytes.
- [x] **Step 2: Run focused activity tests and observe the bypasses.**
- [x] **Step 3: Implement selected-rerun loading, identity checks, role/path-labeled canonical records, and replacement spend accounting.**
- [x] **Step 4: Require strict calendar round-trip validation (`new Date(ms).toISOString() === input`).**
- [x] **Step 5: Run the focused activity tests.**

### Task 2: Bind the S7 CLI and documentation

**Files:**
- Modify: `packages/report/src/activity-main.ts`
- Modify: `plans/S7-activity-export-crosscheck-plan.md`
- Modify: `plans/S7-runs-protocol.md`
- Modify: `README.md`

**Interfaces:**
- CLI syntax becomes:
  `s7-activity-crosscheck.mjs RESULTS_DIR ACTIVITY_EXPORT.csv SUMMARY.json MODEL PRICE_BOOK STATE.json WINDOW_START_ISO WINDOW_END_ISO [RERUN_RESULTS_DIR RERUN_STATE.json REPLACEMENT_RUN_IDS]`.
- The CLI rejects missing, malformed, reversed, or non-ISO window arguments before writing a summary.

- [x] **Step 1: Add no-spend CLI contract tests** for missing and malformed window arguments.
- [x] **Step 2: Parse the two window arguments and pass them to `runActivityCrosscheck`.**
- [x] **Step 3: Update the operational command and explain that the operator must review the export scope.**
- [x] **Step 4: Run all script and report tests.**
- [x] **Step 5: Require replacement arguments when an anomaly review selects reruns and document that original and replacement spend are both real account spend.**

### Task 2b: Close replacement-state and export-selection gaps

**Files:**
- Modify: `packages/report/src/activity-cli.ts`
- Modify: `packages/report/src/activity-main.ts`
- Modify: `packages/report/src/activity.test.ts`
- Modify: `scripts/s7-freeze.sh`
- Modify: `scripts/s7-verify-archive.sh`

- [x] **Step 1: Add failing tests** for replacement interrupted spend/state binding, missing rerun state, extra unselected reruns, combined-cap enforcement, and zero matching export rows.
- [x] **Step 2: Require exact reviewed rerun results/state identity and independently reconcile both states.**
- [x] **Step 3: Preserve sanitized rerun state/retry provenance and validate it in the archive.**
- [x] **Step 4: Apply the cap to combined state spend and reject zero matching export rows.**
- [x] **Step 5: Run focused verification before continuing freeze hardening.**

### Task 3: Enforce binding at S7 freeze

**Files:**
- Modify: `scripts/s7-freeze.sh`
- Modify: `scripts/s7-verify-archive.sh`
- Modify: `scripts/s7-freeze-retry.test.mjs`

**Interfaces:**
- Official freeze recomputes `activityBinding(results, state)` and compares every binding field and window field in the supplied summary.
- Official freeze recomputes the binding with the reviewed replacement IDs and requires the declared window to contain every current, retry, and replacement adapter wall-clock interval; no result is silently reassigned to another window.
- Official freeze also recomputes every local count and spend field from C1/C4 evidence and runner state before checking export arithmetic.
- The sanitized summary remains the only Activity Export artifact in the archive.

- [x] **Step 1: Add a failing freeze test** for a summary with matching spend/model but stale results binding and a window outside the current run starts.
- [x] **Step 2: Run the focused freeze test** and observe that the current freeze accepts the stale summary.
- [x] **Step 3: Recompute and compare binding/window fields before accepting the Activity Export summary.**
- [x] **Step 4: Validate the archive-side summary fields in `s7-verify-archive.sh`.**
- [x] **Step 5: Run focused/full verification.**
- [x] **Step 6: Verify the archive summary’s binding semantics against the original/replacement provenance set, not only field presence.**

### Task 4: Review, verify, and record

**Files:**
- Modify: `plans/README.md`
- Modify: `plans/S7-activity-binding-plan.md`

- [x] **Step 1: Run `npm test`, `npm run typecheck`, `npm run lint --silent`, `sh -n scripts/*.sh images/*.sh`, and `git diff --check`.**
- [x] **Step 2: Confirm no provider calls occurred and no raw export path/content is emitted.**
- [x] **Step 3: Request a no-spend GPT Sol review and integrate only verified findings.**
- [x] **Step 4: Mark the plan implemented only after all checks pass.**

### Task 3b: Add a portable sanitized-archive binding

**Files:**
- Create: `packages/report/src/archive-binding.ts`
- Create: `packages/report/src/archive-binding.test.ts`
- Modify: `packages/report/src/index.ts`
- Modify: `scripts/s7-freeze.sh`
- Modify: `scripts/s7-verify-archive.sh`
- Modify: `scripts/s7-freeze-retry.test.mjs`

**Contract produced:** `provenance/archive-binding.json` contains a versioned deterministic SHA-256 over relative paths and exact sanitized bytes under `results/`, `report/`, `review/`, and `provenance/`, excluding itself and `SHA256SUMS`. It also embeds the source Activity binding copied from the validated summary. The verifier recomputes the manifest from the extracted archive and requires source-binding equality with the Activity summary.

- [x] **Step 1: Add failing unit tests** for deterministic path ordering, byte mutation, symlink rejection, and exclusion of the binding file itself.
- [x] **Step 2: Implement the no-dependency portable file-manifest hash.**
- [x] **Step 3: Emit the binding after sanitization and before `SHA256SUMS`.**
- [x] **Step 4: Recompute and compare the binding during archive verification.**
- [x] **Step 5: Add an archive regression test and run focused verification.**

### Task 3c: Recompute provider evidence at official freeze

**Files:**
- Modify: `scripts/s7-freeze.sh`
- Modify: `scripts/official-cap.test.mjs`
- Modify: `plans/S7-runs-protocol.md`
- Modify: `README.md`

**Interface:** official freeze additionally requires the private raw Activity CSV path. It invokes the same no-network `runActivityCrosscheck` implementation using the summary's reviewed window and the exact original/rerun evidence, then requires complete parsed-summary equality. The raw CSV and its path are never copied into the archive.

- [x] **Step 1: Add a no-spend contract test** proving official freeze requires the raw export input.
- [x] **Step 2: Recompute the summary into a private temporary file and compare every field.**
- [x] **Step 3: Prove the raw export is absent from archive contents and checksums.**
- [x] **Step 4: Add the official-style end-to-end fixture, update operator documentation, and run full verification.**

## Acceptance

- A summary cannot be reused after the measured run/event set or state changes without failing freeze.
- A summary without an explicit valid contiguous window cannot support an official archive.
- Matching spend alone is insufficient to pass the official Activity Export gate.
- Existing cost equations, C4 schema, raw result files, and no-network behavior are unchanged.

**Status:** Activity binding, portable sanitized-archive binding, private raw-export recomputation, and the adversarial official-style freeze fixture are implemented and verified. The separate host-window ledger and final official provider run remain outside this stage.
