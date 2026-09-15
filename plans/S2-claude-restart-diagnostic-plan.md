# S2 Claude restart diagnostic

The maintainer authorizes a tightly capped live Claude diagnostic, followed
by retries of infrastructure-blocked/interrupted slots and analysis of all
retained evidence. Completed native-test failures stay final. Diagnostic
spend is part of the existing total-account ceiling $63.63381808, not a new
budget. Cap this diagnostic at $0.25 additional observed usage, with a
$0.02 stop reserve, one local original fixture and a 180-second timeout.

Use pinned Claude Code 2.1.246 and the measured Docker adapter. Preserve
DeepSeek-only routing, no fallback, model and normal CLI options. Retain C1,
C4, native verifier logs, account balances and generation GET records. A
private diagnostic relay may retain bounded request/response shapes and
model/usage/ID fields to distinguish provider identity or cache behavior;
never persist credentials or publish task prompts. Stop on incomplete model
identity, accounting, provider rejection beyond the known pre-inference
case, or failed native verification. Require a provider settlement check.
A passing short smoke is not proof of whole-task cache efficiency; admit at
most one separately capped Claude task before a wider retry queue.

No production behavior, dependencies, contracts or old attempt files change.
