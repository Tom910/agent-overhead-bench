# S7 Linux server migration

Maintainer request (2026-09-12): move continued independent harness execution
to the Linux server at `tom@192.168.0.200`, without repeating recorded work.

## Migration boundary

Retain the Mac batch and its raw results unchanged. Construct a separate Linux
batch from pending jobs only; completed, failed and interrupted Mac attempts
remain retained evidence and are not retried. Build the required agent and
native verifier images for the server's native amd64 architecture, then run
the existing source, verifier, model/routing, pricing and clock preflight gates.
Keep host identity in the existing run provenance and separate Mac and Linux
reports; do not pool their timing samples or imply official release approval.
Account credit remains the existing external soft admission/live guard, and
unknown C4 cost remains unknown. No C1–C4 schema or measurement-model changes.

The scheduler change only adds Linux power supervision. The deployment uses
94 never-started paid jobs: Qwen 17, Claude Code 39, and Cline 38. Three older
completed results remain retained by reference. The queued Qwen interruption
retry is excluded under the maintainer's latest no-rerun instruction.

Transfer the original Mac evidence into a separate retained directory without
rewriting its absolute paths or bytes. A migration manifest maps source paths
and job identities to the new Linux root. Rebuild the three required CLI images
and eight task/verifier image sets natively, run all five reference-verifier
samples per task, then bind the new images in freshly prepared manifests.
Start the pending-only scheduler independently of the SSH session only after
the existing preflight passes. Keep the existing $50 total-credit ceiling.

## Power behavior

Replace both inline `pmset` checks in `scripts/independent_harnesses.py` with
`checked_power(system=None, power_supply_root=Path('/sys/class/power_supply'))`.
Production selects the operating system automatically; injected arguments
allow local tests to use temporary sysfs directories.

- Darwin retains `pmset -g batt`, the 10-second timeout, and the existing
  requirement that its output contain `AC Power`. Unavailable power evidence
  raises the existing typed `BudgetStop` exception.
- Linux enumerates the readable power-supply directory. An empty directory
  allows a batteryless mains server. A missing or unreadable directory stops.
- Read each system supply's type. Optional `scope=Device` identifies a
  peripheral and excludes it; absent/`Unknown` scope is conservatively treated
  as system scope. Malformed scope or unknown supply type stops.
- A `Battery` with absent `present` is considered present, as specified by the
  kernel ABI. `present=0` denotes an empty battery bay, and `present=1` denotes
  a present battery; other values stop. A present system battery requires at
  least one external system supply online. Mains, UPS, Wireless, and the
  kernel's USB supply variants qualify; `online=0` is offline and `1`/`2` are
  online. All relevant exposed attributes are validated before admission,
  even when another supply is already online.
- Read failures and malformed attributes raise `BudgetStop`. Unsupported
  operating systems raise `ConfigurationError`. No Linux shell command,
  dependency, bypass flag, or credential is added.

The shared guard runs before child launch and at the existing live power-check
points. Balance checks, supervision-gap detection, cleanup, attempt identity,
and resume behavior remain unchanged.

Reference: [Linux power-supply ABI](https://github.com/torvalds/linux/blob/master/Documentation/ABI/testing/sysfs-class-power)
and [kernel type/scope definitions](https://github.com/torvalds/linux/blob/master/drivers/power/supply/power_supply_sysfs.c).

## Implementation and verification

- [x] Add failing tests in `scripts/independent_harnesses_test.py` for readable
  batteryless fixtures, battery with AC/USB power, offline battery, optional
  battery presence, peripheral scope, malformed/unreadable sysfs and Darwin
  AC/error behavior. Prove prelaunch rejection and live disconnection cleanup
  with an unpriced local child.
- [x] Run `rtk proxy env PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover
  -s scripts -p independent_harnesses_test.py` and observe the missing guard
  failures before implementing it.
- [x] Implement the shared guard using only the standard library and replace
  the two call sites.
- [x] Run the same focused suite and the existing Node CI wrapper; inspect the
  diff and report evidence for parent review without committing.

Verified locally on 2026-09-12: 25 Python tests passed after the new guard tests
first failed for the missing implementation. The Node CI wrapper
(`rtk proxy env PYTHONDONTWRITEBYTECODE=1 node --test scripts/independent-harnesses.test.mjs`)
passed, and `rtk proxy git diff --check` found no whitespace errors. These are
local tests with temporary sysfs fixtures and unpriced Python children; they
do not attest that the remote migration or paid continuation has occurred.

The same 25 tests also passed on the Linux destination. Its actual power guard
passed against an empty `/sys/class/power_supply` directory. Independent review
found no blocking defect. Native preparation and evidence transfer are complete. All 1,368 retained
files (58,698,894,862 bytes) match the originals. Native preparation passed
40 reference samples across eight unchanged task definitions; all 64 image
bindings matched amd64 Docker identities. The full six-tool profile is
prepared because existing preflight requires its scope, while the paid queue
still contains only the 94 never-started jobs for the three remaining tools.

The user systemd service is installed with lingering enabled, `Restart=no`,
`KillMode=mixed`, and a 90-second stop timeout. It is not enabled at boot.
Its paid admission has not occurred: source, eligibility, and native task
validation pass, but proxy calibration failed the existing 5 ms p99 gate.
The preflight result was 18.538 ms; three subsequent diagnostic checks were
11.919, 22.410, and 18.988 ms. Preserve these failures, keep the gate unchanged,
and leave the service stopped pending resolution of host timing suitability.
No Mac jobs were rerun and no Linux model requests were admitted. Operational
records and status commands are under `scratch/linux-migration-20260913`.


## Continuation admitted

The startup-contaminated proxy calibration was corrected and verified under
[S1-calibration-warmup-plan.md](./S1-calibration-warmup-plan.md). Three fixed
fresh-process checks passed without changing the 5 ms threshold. The full
Linux preflight then passed, and the service admitted Qwen SuperJSON
repetition 2 at 2026-09-13T04:00:50.226358Z with $22.94117787 available under
the existing $50 total-credit ceiling. Provider events were observed in the
first job. The service runs independently of SSH; the 94-job queue is active.
Previous failed preflights remain preserved. Runtime guards remain enabled.

All six retained Mac reports now generate from 144 C4/C1 pairs following the
S6 unknown-cost reporting correction. Updated retained inventory:
`scratch/independent-harnesses-20260911/inventory/20260913T040554Z`. Final Linux
results, combined coverage accounting and final reporting remain pending.

## Funded Cline continuation (2026-09-13)

After the account-credit stop, the maintainer added credit and explicitly
requested remote continuation with Cline and local Claude Code testing.
The account reported $64 funded and $49.91595912 used. Preserve the former
$50 configuration as `config.before-credit-topup-20260913.json` and raise
only the funded ceiling to $64, retaining the $0.10 reserve. No attempted
job is retried: the queue had exactly 29 untouched Cline jobs.

Remote source advanced to `33d71150`, including the reviewed S7 immediate
credit/repeated-infrastructure stops and S4 literal-prompt fix. The remote
scheduler tests and complete no-spend S7 preflight passed before admission.
The existing user service resumed with Cline TOMLKit repetition 1; Claude
Code is deferred. Locally, its pinned network-disabled image passed a mock
SSE tool round trip: Write created the expected file, the next request
contained the tool result, and the CLI exited 0 with the expected response.
This confirms CLI mechanics, not live-provider identity or cache behavior.
The earlier missing-identity and billing-gap audit remains unresolved.
