# S5: retain completed native task failures

The maintainer requested continuation and sequential final harness runs on
September 10. A completed DeepSWE grader failure is a measured task outcome,
not an infrastructure retry. Preserve its C4 `verify_error` unchanged and use
terminal runner state `task_failed`. Continue without retrying to obtain a pass.

Accept this state only for the selected DeepSWE repository, successful adapter,
native grader exit 1 with a complete, internally consistent zero-reward footer,
and complete successful model traffic whose pinned pricing matches C4 spend.
Missing/malformed evidence, provider errors and infrastructure exits retain the
existing failure behavior. Use bounded file reads in a shared contracts helper;
this adds no schema fields, derived C4 metrics or npm dependencies.

Resume a previously charged failed result by classifying its retained evidence,
without altering the C4 or charging it twice. Crash recovery before charging
must still charge exactly once. Test continuation, recovery, and invalid-evidence
rejection without network access. Finish S5 verification before updating S7
validation and campaign orchestration. Calibration still requires actual passes.

CLI completion checks apply only to the selected batch tool when present; pending later tools do not make a completed batch fail. Native task failures are successful execution completion, not successful task solutions.
