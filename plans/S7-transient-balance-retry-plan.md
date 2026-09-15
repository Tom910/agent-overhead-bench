# S7 transient account metadata retry implementation plan

> **For agentic workers:** Use superpowers:executing-plans after the current S4 work is complete. Initial preparation was limited to the plan and failing tests. Subsequent authorization covers implementation, local validation and an S7-only commit; deployment and paid execution remain excluded.

**Goal:** Avoid stopping a measured child for one transient account metadata read while retaining bounded, fail-closed supervision.

**Architecture:** Add one metadata-only reader to `scripts/independent_harnesses.py` and share it with the recovery wrapper. Retry each credits/key read independently, before the existing arithmetic and `checked_balance` validation. Do not retry a whole job, model request, native verifier, or balance threshold failure.

**Tech stack:** Python standard library `urllib`, `json`, `time`, and offline `unittest` mocks. No dependency changes.

**Spec:** Maintainer recovery requirements in `S7-authorized-recovery-run-plan.md`, plus this bounded task: three attempts, five-second socket timeout per attempt, 0.25-second delay between attempts; retry only `URLError`, `TimeoutError`, HTTP 429 and HTTP 500–599. HTTP 401/403/402 and malformed metadata stop immediately.

## Constraints

- Keep the existing 45-second asynchronous account/power supervision deadline and independent one-second C1 credit/model-identity scan.
- Keep global/per-cell budget arithmetic, the $0.10 reserve, terminal job retention, explicit stop acknowledgement and immutable C1/C4 evidence.
- No keys or network calls in tests. Mock `urlopen` and `time.sleep` for every reader invocation.
- A five-second urllib timeout is a socket timeout, not a total wall-clock deadline against trickling bodies. The existing outer 45-second live guard remains necessary.
- Each endpoint has at most three opens and two sleeps. Two endpoints nominally consume at most 31 seconds under socket timeout failures, leaving room under the existing 45-second supervisor. Do not extend that deadline or read cached funds on failure.

## Task 1: Shared reader and bounded failure policy

**Files:** modify `scripts/independent_harnesses.py`; tests in `scripts/independent_harnesses_test.py` (`AccountMetadataRetryTest`).

**Proposed shared API:**

```python
def read_account_metadata(request: urllib.request.Request) -> dict:
    """Read a credits/key GET envelope, retrying transient transport failures."""
```

Callers construct authenticated GET requests. The helper returns the envelope's `data` dictionary. It raises `BudgetStop` on exhausted transient failures, permanent HTTP responses, or malformed JSON/envelope, without including headers, credential-bearing request objects, response bodies, or raw exception messages in diagnostics. Numeric budget validation stays in the existing callers/`checked_balance`.

- [x] Add offline tests for first-try success, transient recovery, exactly three attempts, immediate permanent errors, malformed envelopes, body-read timeouts, transient-then-permanent errors and interruption propagation.
- [x] Run the focused red suite:

  ```sh
  rtk proxy python3 scripts/independent_harnesses_test.py AccountMetadataRetryTest
  ```

  Expected before implementation: failures reporting the absent `read_account_metadata` helper. The suite opens no sockets and does not sleep.

- [x] Implement the helper with `range(3)` and `with urllib.request.urlopen(request, timeout=5) as response`. Parse `json.load(response)` within that context. Require a dictionary envelope with a dictionary `data`; reject missing/null/list data without retry. Close each response on both success and read/parse failure.
- [x] Catch `urllib.error.HTTPError` **before** `urllib.error.URLError`: HTTPError is its subclass. Retry only status 429 or `500 <= code < 600`; close HTTPError response streams before retry/stop. Catch `URLError` and `TimeoutError` for retry, including body-read timeout. JSON/Unicode/envelope failures raise `BudgetStop` immediately. Do not catch `BaseException`; KeyboardInterrupt must propagate.
- [x] Sleep `time.sleep(0.25)` only when a transient failure has another attempt available. After attempt three, raise a sanitized `BudgetStop` with the original error chained. A permanent failure on attempt two ends the sequence immediately.
- [x] Run the focused suite again; all eight test methods must pass.

## Task 2: Adopt in both metadata callers and verify existing supervision

**Files:** modify the nested `endpoint` in `scripts/independent_harnesses.py:main` and `scratch/claude-restart-diagnostic-20260914/recovery-scheduler.py:main`; leave `plans/README.md` to the main agent, because this commit is limited to scheduler, tests and this plan.

- [x] Replace each direct `urlopen(..., timeout=15)`/`json.load(...)["data"]` pair with:

  ```python
  return read_account_metadata(request)
  ```

  The recovery wrapper names its local request `req`, so use `return read_account_metadata(req)` and import the helper alongside `checked_balance`. This also covers its baseline account read through the same nested endpoint.
- [x] Leave the credits/key allowance calculation and finite/nonnegative baseline checks unchanged. Do not add retries to `checked_balance` itself: invalid/low balances and power errors must still stop immediately.
- [x] Add an offline caller-wiring test using a temporary config/environment and patched scheduler admission: verify both endpoints call the shared helper, including the recovery baseline read. Mock all request execution and do not load real credentials.
- [x] Run existing Python/Node supervision tests, including slow account I/O, the outer deadline, live C1 402/model mismatch, restart recovery, and process reaping:

  ```sh
  rtk proxy python3 scripts/independent_harnesses_test.py
  rtk proxy node --test scripts/independent-harnesses.test.mjs
  ```

- [x] Review the final diff as S7 only. The subsequent instruction authorizes an S7-only commit. Deployment, actual stop acknowledgement and paid execution remain excluded; hand the tested result to the main agent.

## Validation and handoff

Implemented the shared reader and both caller integrations. The recovery wrapper also accepts explicit `--acknowledge-stop` and forwards it to the unchanged scheduler; no acknowledgement was performed. Scratch-wrapper edits remain local and outside the S7 commit. The retry stays below `checked_balance`, preserving immediate invalid/low-balance stops.

Focused red run: eight test methods, 25 failing cases/subtests, all reporting the absent helper. Execution took 0.010 seconds with network and sleeps mocked.

Green validation: all ten focused reader/caller test methods pass. The full Node wrapper passes the Python supervision suite. An additional offline scratch-wrapper integration check exercised both endpoints, baseline retrieval, the $0.75 per-cell allowance and explicit acknowledgement forwarding with `urlopen` forbidden. The production diff leaves the 45-second deadline and one-second C1 scan untouched.
