# Task-quality audit: three low-pass tasks

Audit requested by the maintainer. Read-only inspection of existing measurements, with independent subagent review. No paid model calls, no benchmark reruns, and no changes to published outcomes.

## Scope and evidence

Current dataset: `evidence/linux-results-2026-09-19-r1`. Examined all 75 selected verifier logs for the three tasks, retrieved from their original Linux result directories. All 75 adjacent `run.json` SHA-256 hashes match the selected slots in the published summary. This binds selected run identities; the historical verifier text itself is not independently hash-bound by that summary. Examined original task instructions, hidden test patches, reference solution behavior, historical reference-polarity records and selected agent-output excerpts.

Private working evidence remains in `scratch/task-quality-audit/`: `logs.json`, `classification.json`, `details.json`, and `agent-excerpts.json`. Raw stdout was not published. Some historical stdout files are capped at 64 KiB; absence of implementation from those truncated logs is not evidence of no implementation.

## Results

| Task | Full passes | Main observations | Assessment |
|---|---:|---|---|
| SuperJSON error stack serialization | 3/25 | 13 attempts pass 79/80 feature tests and fail solely the same redaction/internal-frame interaction | Meaningful feature task; significant prompt ambiguity dominates the binary result |
| Ink grid box layout | 1/25 | 19 fail fixed-column minmax; 17 fail fixed-row minmax; 13 fail only one/both of those tests; one attempt has a storage failure before useful agent execution | Meaningful feature task, but fixed-max allocation needs a clearer contract and infrastructure failures need separate treatment |
| Textual RichLog follow state | 6/25 | 13 runs share five event-listener failures; sampled Codex implementation uses a shared event class incompatible with test handler assumptions | Plausible false negative from an unstated dispatch contract; other observed failures match explicit requirements |

Every attempt with a grade (74/75) passes all whitelisted regression checks. Median feature-test completion is 79/80 for SuperJSON, 23/25 for Ink (24 graded attempts), and 15/20 for Textual. These are diagnostic partial-test counts, not substitutes for the existing binary pass metric. The grader requires every whitelisted feature and regression test to pass, so nearly complete implementations still count as failed tasks.

## Findings

### SuperJSON: ambiguous interaction between basename redaction and internal-frame stripping

The prompt explicitly orders string processing as redaction, line limiting, then internal-frame stripping. It says basename keeps only the filename and node stripping removes `node:internal` frames. It does not define how basename treats Node pseudo-paths.

The disputed test supplies `node:internal/process/task_queues:1:1` and requires it to disappear after basename processing. A plausible basename implementation reduces it to `task_queues:1:1`, losing the prefix that the later stripper would recognize. The reference implementation preserves enough of the prefix to strip it. Thirteen selected attempts fail only this test; twenty mention it among their failures. This is a specification concern, not proof that all twenty should pass.

Source: `scratch/deep-swe/tasks/superjson-error-stack-serialization/instruction.md` (pipeline, stripping and redaction paragraphs), `tests/test.patch` around lines 911–932. Examples include Cline rep0, Codex rep1 and Hermes rep1.

### Ink: fixed minmax growth is implicit

The instructions permit `minmax(min,max)` and explicitly explain allocation for fractional maxima. Tests also require fixed maxima to grow when space is available: with `minmax(5,15) 10` in width30, the second column begins at15; with rows `minmax(2,4) 1` in height5, the second row begins at4.

These expectations are defensible grid behavior. They are not obviously invalid tests, but the simplified task leaves that allocation rule implicit. It materially affects results: thirteen attempts fail only one or both fixed-max tests. Other failures involve auto-placement, spans and sizing and cannot be excused by this ambiguity.

Source: `scratch/deep-swe/tasks/ink-grid-box-layout/instruction.md`, `tests/test.patch` around lines 405–444. Codex rep0 passes 49/49 regression and 23/25 feature checks, failing only fixed column/row minmax.

### Textual: tests impose an unstated event-handler naming contract

The prompt asks Log/RichLog to expose a FollowChanged message with specified fields and change-only posting. Hidden test listeners use `on_log_follow_changed` and `on_rich_log_follow_changed`.

Codex rep0's captured implementation defines a shared top-level FollowChanged class in `_log_common.py`, exposes it through widget aliases, and posts on boolean changes. That class dispatches to `on_follow_changed` under Textual's naming rules; class-based subscriptions are also available. The required payload is present. The prompt does not explicitly mandate separate nested classes or those two handler names.

This is a concrete plausible false-negative from an unstated contract. It does not prove the entire patch is correct, nor that all thirteen attempts with similar event failures have the same cause. Do not attribute every wait timeout to a missing event or flaky environment without inspecting the patch.

Other Textual failures appear reasonable: three runs fail only the example interaction test; the inspected Qwen rep1 assertion checks that pressing `#clear-events` leaves the event log empty, explicitly requested by the prompt. Resize/min-width behavior is also explicit.

Source: `scratch/deep-swe/tasks/textual-richlog-follow-state/instruction.md`, `tests/test.patch` around lines 143–158; captured Codex rep0 source/output in `agent-excerpts.json`.

### One selected Ink run is a harness/storage failure

`pinned:hermes:ink-grid-box-layout:2:hermes-linux-20260915` has empty verifier output. Agent stdout reports that the turn stopped because session storage could not be written and no reply was produced. This is not evidence of task-solving inability. Full disk versus permissions is not established by the available message.

The current dataset labels it `verify_error`; retain that original record and add an audited cause classification before interpreting task-failure rates. This audit did not modify it or rerun it.

## Solvability and limits

All three tasks have historical 5/5 reference-pass records under `scratch/deepswe-release-shape-20260903-v3/reference-polarity`. Each also has at least one actual selected passing run. They are demonstrably solvable, but reference success alone does not prove fairness, and historical reference images do not establish validation on every rebuilt current image.

No stored patch was replayed in this audit, and no reference verification was rerun. The findings are based on existing evidence and source comparison. A full certification needs isolated offline verifier replay of the disputed candidate patches and reference solutions against the exact relevant image, without invoking a model.

## Recommended next steps

1. Version and clarify the three task contracts: Node pseudo-path handling, fixed minmax growth, and event dispatch naming (or use class-based listeners accepting equivalent implementations).
2. Replay disputed saved patches offline against reviewed verifiers, preserving originals and publishing a separate audit/corrected revision. Do not silently turn existing failures into passes or remove tests to improve scores.
3. Separate the confirmed storage failure from behavioral task failures in the report's diagnostic information. Keep complete costs and original outcomes traceable.
4. Explain all-or-nothing scoring and expose feature-test counts as secondary diagnostic detail, using the actual verifier output as evidence.

Conclusion: these are substantial tasks with solvable implementations, but the current failure counts should not be presented as entirely clean task-performance signals. Specification ambiguity and one confirmed operational failure materially affect interpretation.
