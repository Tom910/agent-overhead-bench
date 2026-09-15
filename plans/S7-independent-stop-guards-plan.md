# S7 independent scheduler stop guards

Approved scope: pause on provider credit errors and repeated infrastructure errors before further paid execution. This is operational admission control around unchanged C1–C4, not a new measurement model.

Implement this stage before the separate S4 prompt transport and S1/S5 identity work. No dependencies, paid calls, changes to retained attempts, or automatic retries.

- [x] Add failing no-spend tests in `scripts/independent_harnesses_test.py`: a real local child writes a model HTTP 402 event then sleeps; supervision must terminate it promptly, preserve its evidence, persist a stop and leave the next job pending. Partial JSONL lines must not be parsed prematurely; malformed/truncated completed evidence stops conservatively.
- [x] Add tests: two consecutive infrastructure failures pause before the third job; native verification failures continue and reset the streak. A persisted stop blocks restart until explicitly acknowledged; acknowledgement skips all terminal jobs.
- [x] Implement incremental C1 credit-error scanning in `scripts/independent_harnesses.py`, invoked during child supervision and once before accepting completion. Match model-request protocols, never arbitrary text or metadata probes. Keep the existing account ceiling, power, process cleanup and no-rerun checks.
- [x] Persist an operational `stop.json` with reason and triggering job. Add `--acknowledge-stop` for reviewed continuation with `--run`; it acknowledges only the stop, never changes job definitions or permits retries. Keep stop history when acknowledged.
- [x] Run `rtk proxy python3 scripts/independent_harnesses_test.py` and `rtk proxy node --test scripts/independent-harnesses.test.mjs`; review the diff and commit this stage.

Default repeated-infrastructure threshold: two consecutive failed cells without a native task outcome. Normal native pass/failure and task timeout reset the streak. HTTP 402 pauses immediately even when a cached account balance remains above $0.10. The guard must work without the 45-minute observer.

Validation: 37 no-spend Python cases pass through the Node test wrapper. Review regressions include crash before stop-file persistence, recovery of running C1 credit errors, recovered infrastructure streaks, slow account queries, and a total 45-second guard-query deadline. Stop intent is recorded atomically in the index as well as the operator-facing stop file. Account and power queries run separately from one-second credit-event checks.

Independent review found no remaining important issues after the crash, caught-signal, recovered-streak and slow-query regressions were addressed.
