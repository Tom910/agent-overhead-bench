# S7: continue measured task outcomes

After S5 native-outcome verification, replace the all-task-pass prerequisite
with a complete first-attempt measurement prerequisite. The maintainer requested
continuation on September 10, including sequential final harness runs and a
combined result after all batches. All 48 validation cells remain required;
`done` must bind to a passing C4 and `task_failed` must independently satisfy the
S5 native grader and accounting classifier. No retry-to-pass or changed C4.
Source review, native verifier, model identity, usage, prices, images, timing,
calibration passes and shared budget gates remain mandatory.

Archive/state readers recognize `task_failed` as terminal. Report eligibility
continues to count its `verify_error` as an unsuccessful task outcome. Calibration
remains unchanged and needs two actual passing CLIs per task.

Resume existing validation with its original definition/session/ledger and
retained artifacts. Re-run no-spend preflight and verify closed checkpoint
bindings before continuation. Run final batches sequentially in one campaign
root with shared spend and an external provider-total guard; combine only when
the full matrix and existing release evidence gates are complete. No npm deps.

Test the acceptance and state/C4 binding, retained rejection cases, and launcher
resume boundaries without API keys. This supersedes the all-pass clause of
S7-tool-batch-campaign-plan.md; it does not relax source calibration or publication.

Official batch launcher arms stop-on-failure for unqualified failures. The S5 CLI scopes completion to the selected harness, so later pending harnesses do not turn a finished batch into a process error.
