# S2 — Feasibility spike

> **For agentic workers:** This is a decision record, not a feature to keep. Spike scripts are throwaway. Fill evidence files; do not start S4 adapters from memory.

**Implementation status (2026-08-27):** spike executed. Keep set = claude-code, codex, hermes (host PATH already present) plus aider, opencode, qwen (**Docker images only**). Ori missing; six cross-tool requested-model evidence cells passed for `z-ai/glm-5.3-flash`, and the user’s model-change instruction records maintainer approval. Contracts **not frozen**. The disposable Docker probe defaults to `z-ai/glm-5.3-flash` and accepts an explicit `AOB_MODEL`. See `plans/s2-decision-record.md`.

**Follow-up implementation (2026-08-26):** the disposable probe now supports
Codex and Hermes with the requested model, and `AOB_S2_SKIP_BUILD=1` reuses an
already-built image only after the shared S5 image validation passes. Codex and
Hermes both completed zero-prompt-content Docker smoke runs with
`z-ai/glm-5.3-flash` and exit 0; this is partial S2 evidence, not approval for
the full keep set. The reuse option is a local resource-recovery path and does
not change the official image-build gate.

**Follow-up security correction (2026-08-26):** S2 Docker probes now pass a
temporary 0600 env file containing only `OPENROUTER_API_KEY`; unrelated `.env`
variables are rejected before Docker starts, and the temporary file is removed
on normal exit or HUP/INT/TERM cleanup paths.

### Follow-up: requested-model Docker evidence completeness

**Acceptance tests:** Every selected Docker adapter has a requested-model probe
recorded with the exact model id, exit code, proxy capture count, and credential
redaction result. Claude Code's bypass-permission probe must run under a non-root
image user because the CLI rejects bypass mode for root; the image check and
adapter descriptor must preserve that user boundary. A failed model request is
recorded as evidence and does not become an approval by omission.

**Implementation:** Re-run Aider, OpenCode, Qwen, and Hermes against
`z-ai/glm-5.3-flash`; correct the Claude Code container user boundary before its
probe; append dated evidence without changing the approved-model field or
claiming full S2 sign-off.

**Status (2026-08-27):** requested-model evidence is now recorded for all six
selected Docker adapters, with the exact model in the observed model-bearing
traffic and no credential-shaped values in the sanitized captures. The
maintainer-directed model approval is recorded in the decision record; the
feasibility contracts remain unfrozen because the required Ori-vs-native
comparison and final review are still incomplete.

**Out of scope:** changing the selected tool list, bypassing proxy validation,
or declaring the model approved without cross-tool evidence and sign-off.

**Goal:** Turn the candidate CLI list into a final v1 tool list (5–7), a pinning path (Ori vs key+base-URL), a pinned model, and sanitized HTTP fixtures for every dialect an included tool actually speaks.

**Architecture:** Per-tool probes against a local logging sink (S1 prototype or a one-off request dumper). No code from this stage is merged except: evidence markdown, a decision record, sanitized fixtures under `packages/contracts/fixtures/http/`, and contract field amendments if S2 proves the draft C1/C3 shape is wrong.

**Tech Stack:** The real CLIs on PATH or in throwaway containers; `OPENROUTER_API_KEY` in a gitignored `.env`; optional `ori` if headless auth works. Do not commit login cookies.

**Spec:** North-star §5–§6 and roadmap S2. This plan says *how* to run the spike.

## Global Constraints

- Official runs cannot open a browser. If Ori only supports OAuth PKCE, the pinned path is `OPENROUTER_API_KEY` + base-URL override, or the tool is dropped from pinned.
- Chaining is the inclusion test. A tool that cannot be chained cannot produce `harness_time`. Five timed tools beat seven tools of which three have coarse timestamps.
- Mixed Ori/non-Ori in the **pinned** table is forbidden. Either every pinned tool uses Ori, or every pinned tool uses a direct override to the same OpenRouter model.
- Subagent children must hit the proxy, or the tool cannot contribute headline model/harness splits.
- Do not bake `~/.ori` or vendor login files into any image.
- Spend counts against the $1,500 working cap. Keep S2 probes to one short prompt per question on a tiny workspace.
- Keep candidates within the approved vendor scope. Do not add Vetta, Terminal-Bench, or SWE-bench to the candidate list.

## Contracts consumed / produced

- Consumes: draft C1/C3 from S0 (protocol enum, adapter capability flags).
- Produces: `plans/s2-evidence/<tool>.md` (one per candidate), `plans/s2-decision-record.md`, sanitized `packages/contracts/fixtures/http/<tool>-{stream,nonstream}.json` (headers + usage-bearing terminal chunks only; **no prompt text, no Authorization**), optional C1/C3 field amendments (version bump + CHANGELOG).

## Out of scope

S4 adapters, S5 runner, production proxy polish, task suite, publishing numbers.

## Human review (required)

Maintainer signs off on: final v1 list, pinning path, pinned model, Ori-vs-native deltas (process-tax **and** turns/tokens). Do not freeze contracts before that sign-off.

## Risks

| Risk | Mitigation |
|---|---|
| Ori OAuth blocks headless | Key + base-URL first; drop from pinned if both fail |
| Subagents bypass the proxy | Evidence field; no headline split if `no` |
| Spike scripts get merged | `.gitignore` `scratch/` ; only evidence + fixtures land |
| Chatty CLIs blow the budget | One short prompt; hard timeout 3 minutes; stop a tool after two failures |

---

## Candidate list

Probe in this order (cheaper / more likely to chain first, then Ori roster):

1. `aider`
2. `opencode`
3. `claude` (Claude Code)
4. `codex` (OpenAI Codex CLI)
5. `gemini` (Gemini CLI)
6. `goose`
7. `qwen` / Qwen Code
8. `grok` (Grok Build)
9. `hermes`
10. `pi`
11. `prime-agent`
12. `dsh` (DeepSeek Harness)

Starting argv guesses (replace with what actually worked in the evidence form):

| Tool | First try |
|---|---|
| Claude Code | `claude -p "$(cat prompt.md)" --output-format json` (stdin closed, `CI=1`) |
| Codex | `codex exec --full-auto "$(cat prompt.md)"` |
| Aider | `aider --message "$(cat prompt.md)" --yes-always --no-git` |
| Gemini CLI | `gemini -p "$(cat prompt.md)" --yolo` if that flag exists |
| Goose | `goose run -t "$(cat prompt.md)"` |
| OpenCode | non-interactive form from `opencode --help` |

## Probe workspace

Use a tiny throwaway directory (not the S3 suite): one `hello.ts` or `hello.py` and `prompt.md` = `Add a function that returns 2. Do not explain.` Timeout 180s. Stdin closed unless the evidence form records `pty`.

---

### Task 1: Scaffold evidence files and scratch dir

- [x] Copy `plans/s2-evidence/_template.md` to `plans/s2-evidence/<tool>.md` for each candidate. Fill `date` and `host`. Leave other fields as `untested`.
- [x] Add `scratch/` to `.gitignore` if missing. Spike scripts live only there.
- [x] Confirm `.env` is gitignored. Put `OPENROUTER_API_KEY` there. Never print it.

---

### Task 2: Per-tool questions (do not shuffle)

For **each** candidate, stop early if (1)–(3) fail.

**Q1 — Headless invoke.** Run the first-try argv with stdin closed and `CI=1`. Record `exact_argv`, `exits_on_complete`, `exit_codes`. If it hangs on “yes?”, try the minimum extra flag; record it as a fairness deviation. If it still hangs, `decision: drop`.

**Q2 — Auth with no browser.** Prefer `OPENROUTER_API_KEY` (or the vendor key for a later default-condition-only path). Try `ori <tool> --model <id>` only after key+env works *or* as an additional path. Record `auth_headless`. Browser-only → not pinned.

**Q3 — Proxy chaining.** Point the CLI at `http://127.0.0.1:$PORT` via the env vars it actually honors (`ANTHROPIC_BASE_URL`, `OPENAI_BASE_URL`, `OPENROUTER_BASE_URL`, etc.). Upstream of the sink is OpenRouter. Record `env_for_proxy` and `proxy_chain`. Bypass (`cli→ori→openrouter` with no local hop) = cannot time. Default inclusion rule: drop or `default_only`.

**Q4 — Protocol capture.** Save sanitized request line: method, path, content-type, whether the body is Anthropic Messages / OpenAI chat / Responses. Strip `authorization`, `x-api-key`, `cookie`, and prompt/text/content arrays before check-in. Record `protocol` and `fixture` path. Capture one streamed and one non-streamed response if the CLI can do both.

**Q5 — Subagent inheritance.** If the CLI can spawn children, use a prompt that asks it to (or observe a default subagent). Check the sink for a second process’s requests. `subagent_inherits_proxy: yes | no | n/a`.

**Q6 — Everything else.** Tool visibility (`none | partial | full`) and log source. Non-LLM chatter on the same base URL (paths). Ori config files/env actually written.

Fill every field. `untested` / `failed` + the command is legal; a blank is not.

---

### Task 3: Ori-vs-native control

Pick 2–3 tools that run both natively (key+base-URL to OpenRouter) and under Ori on the **same** model and the **same** tiny prompt.

- [ ] Record wall-clock process tax (e2e delta). **Blocked:** `command -v ori` failed.
- [ ] Record turns and input/output/cached tokens both ways. **Blocked:** Ori missing.
- [ ] Expect behavioral change (tool-search, system prompt). That is a finding, not a bug.

Write numbers into `plans/s2-decision-record.md`. These numbers go into METHODOLOGY later.

---

### Task 4: Pinned model

Rubric (all must hold):

- Available on OpenRouter to every **included** pinned tool
- Strong enough that the ≥80% task-success guardrail is plausible on the S3 suite (judgment call; S3 calibration will re-check)
- Affordable at matrix scale (working cap $1,500)
- Stable id, not a preview alias that will vanish mid-study

- [x] Record the initial 2–3 candidates tried and the one chosen, with date. Tried `openai/gpt-4.1-mini`, `anthropic/claude-3.5-haiku` (404), and `anthropic/claude-haiku-4.5`. **None chosen** — no id verified on every keep tool.
- [x] Record the additionally requested `stealth/ox-alpha` candidate. The 2026-08-26 live catalog check did not expose that id, and its zero-spend OpenCode probe produced no proxy event; it remains unapproved until a successful cross-tool evidence run exists.
- [x] Record the newly requested `z-ai/glm-5.3-flash` candidate and six-tool evidence.
- [x] Write the OpenRouter model id verbatim into the decision record; maintainer approval is recorded there.

---

### Task 5: Decision record and contract amendments

Write `plans/s2-decision-record.md`:

```md
# S2 decision record
date:
host:
pinned_model:
pinning_path: ori_uniform | key_base_url_uniform
v1_tools:   # 5–7
excluded:   # tool → reason
ori_vs_native:  # table
protocol_dialects_required_for_S1:
contract_amendments: none | (describe + CHANGELOG)
maintainer_signoff: pending
```

- [x] If C1 `protocol` enum or C3 capability flags are wrong, amend `packages/contracts`, bump CHANGELOG, keep `"v": 1` until freeze. No amendment: keep dialects already in the enum. Gemini generateContent not added because the tool was dropped.
- [x] Check in sanitized fixtures only.
- [x] Maintainer sign-off line filled by user-directed approval recorded 2026-08-27.

---

## Acceptance

- One filled evidence file per candidate (no blank fields)
- Feasibility matrix (tool × form field) — can live as a table in the decision record
- v1 list of 5–7 with written exclusions
- Pinning-path decision (uniform; mixed forbidden)
- Pinned model with date and alternatives
- Ori-vs-native numbers for 2–3 tools
- Sanitized HTTP fixtures for each included dialect
- Maintainer sign-off

## Next

S1 usage extractors for the dialects listed in `protocol_dialects_required_for_S1`. S4 adapters copy `exact_argv` and `env_for_proxy` from the evidence files.
