# S7 conservative account usage high-water guard

The recovery queue stopped at Invalid per-cell budget metadata after a new
Cline job started. Its retained baseline and $1.50 cap are finite and positive;
the only applicable branch is usage below baseline. The provider subsequently
returned increasing account totals, consistent with asynchronous/stale billing
reads. Two valid model responses were interrupted; preserve their evidence.

Maintain a thread-safe session high-water usage observation. A lower valid
reading never restores budget and does not itself stop a healthy attempt.
Use the high-water value for global and per-cell guards and starting baselines.
Retain raw observed baseline beside the conservative baseline in operational
budget metadata. Do not change C4 accounting, existing ceilings, the .10
reserve, 45-second supervisor deadline, credit-error scan or identity guard.
Malformed/nonfinite/negative/bool metadata still fails closed. Existing
account/key limits remain binding. No inference retries in tests.

Extract the operational remaining-credit calculation into a small typed
Python helper, with offline regressions for lower readings before/after spend,
thread-safe monotonic observations, malformed metadata and unchanged budget
caps. Then deploy only the helper and recovery wrapper; acknowledge the
reviewed stop and continue pending jobs. The interrupted Cline slot gets a
fresh ID in the final recovery queue, not an overwritten attempt.
