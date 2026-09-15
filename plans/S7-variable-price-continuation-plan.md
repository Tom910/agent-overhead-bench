# S7 maintainer-authorized continuation without a tier wait

The maintainer explicitly requests immediate remote execution, authorizes at
most $10 additional account spending from $53.63381808 usage, and defers
Claude. Preserve task timeouts, model/provider, task images and repetitions.

The existing low-tier price book requires a whole-cell matching window and
cannot truthfully describe calls crossing tiers. Remaining jobs use the
existing generic `openrouter-2026-09-04` snapshot, which deliberately has no
entry for the selected DeepSeek model. Existing runner/report behavior must
therefore retain unknown token-price estimates (null), never zero or the
low-tier rates. Account balance supervision remains the spending authority;
individual provider charges require a separately retained settlement audit.
These runs are diagnostics with variable pricing, not fixed-tier comparisons.
No contracts, derived metrics, dependencies or pricing algorithms change.

Stop the old scheduler while it waits before cell staging. Retain its empty
admission attempt and all prior paid evidence. Verify the waiting cell has
no C1/C4 or measured task execution, then migrate it plus the ten untouched
jobs into a new root with new session/output identities. Keep the old root
stopped with a migration pointer. No previously executed cell is retried.
The eleven selected jobs must match all prior task/model/tool/repetition
arguments except output/session identity and price book. Reuse the verified
Linux task/image profile and run no-spend preflight before admission.

Keep the immediate HTTP 402 stop, repeated infrastructure-error stop and
account guard. The separate live $10 guard stops at $9.90 observed extra
usage, preserving the $0.10 reserve; the new config records the same ceiling
of $63.63381808 total usage. Validate both guards and first live Cline C1
responses after restart. Never combine unknown estimates into a known total.
