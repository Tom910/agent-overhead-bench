# Native five-client bridge smoke

2026-09-22, Linux only. **All five actual pinned native clients completed a real harmless tool call through patched CLIProxyAPI and returned the tool result in a second model request.** The upstream was a local scripted Responses server with fake credentials. No model inference, OAuth, account allowance, or campaign data was involved.

| Client | Verified version | Native tool | Fake requests | Exit | Observed effort |
|---|---|---|---:|---:|---|
| Codex | 0.149.1 | exec_command | 2 | 0 | high |
| Pi | 0.73.1 | bash | 2 | 0 | medium |
| Qwen | 0.22.2 | run_shell_command | 2 | 0 | medium |
| Hermes | 0.20.5 | terminal | 2 | 0 | medium |
| Cline | 3.0.61 | run_commands | 2 | 0 | medium |

Each tool created `bridge-smoke.txt` with its unique synthetic marker and printed it. The local upstream accepted completion only after seeing that marker in the native next-turn tool result. All final responses named exact `gpt-6-luna`. Native tools and call/result IDs were preserved; each client kept its own agent loop.

The first Cline fixture attempt returned 422 because the fixture recognized several shell tools but not Cline's `run_commands({commands:string[]})`. That engineering fixture error is retained at `cline-fixture-unmapped`; only the fixture mapping was corrected and Cline was repeated once. The other four clients were not rerun. There were ten successful-path fake requests plus that one failed fixture request, all zero inference.

## Isolation and identity

The Go server was built from pinned source `2430354330af80b645f9ffb1a51e1e7c72c4cc8e` with the two narrow qualification fixes. Required unified patch SHA256 is `6a17e7ad40cff90e5b26722c13fdaea3255346d73a3d7966ec4af0014c54dc88`; exact server binary and all five immutable image IDs are in `sanitized-summary.json`. The bridge prints development build metadata; its binary hash is the concrete artifact identity, not an asserted release version.

Additional locked Go modules were downloaded in a setup container, then the server compiled with `--network none`. Actual probes used a Docker `--internal` network, no published ports, no host credential mounts and synthetic local/upstream keys. Bridge and fake service were reachable only inside that test network. Upstream background catalog/discovery refreshes attempted public network access and were denied; no external service was reached by the probe route. Every created probe container/network was removed afterward. Native version checks also used `--network none`.

Adapters' provider modes and pinned invocations were reused, including Cline's explicit compatible provider and required `updatedAt` field. Fixture service binding used `0.0.0.0` inside the isolated network rather than the real private bundle's host loopback binding. Containers received only synthetic keys. Fake authentication deliberately used the bridge's `codex-api-key` base-URL override; **this is not a test of OAuth import/refresh, actual account entitlement, Luna availability or subscription billing**.

## Usage and comparison limitations

The fake backend supplied input 100, cached input 40, output 30 and reasoning output 10 per response. Codex reports the expected aggregate 200/80/60/20. Qwen reports matching totals and 20 thoughts. Cline reports 200 input, 80 cached and 60 output. Pi exposes each response's input as 60 uncached plus cacheRead 40, output 30; that counter's semantics differ from total input. Hermes' selected text output contains no native usage record. The upstream fixture counts are not measurements of a real model.

This probe did **not** include the benchmark C1 proxy. It proves native protocol/tool-loop compatibility and inspects available native usage, not provider-boundary accounting correctness. Native zero cost displays reflect synthetic unknown-provider metadata; they must not become subscription dollar costs.

The actual settings confirm a remaining comparison condition: Codex requests high reasoning while the four Chat routes reach medium. Existing generic model metadata also needs qualification. Encrypted reasoning replay, parallel tools, compaction, abort/error paths and real refresh semantics remain outside this minimal smoke. Successful fake tool loops do not remove those gates or approve a new campaign profile.

Raw requests, full native prompts/tool schemas, logs, original fixture failure and workspace files remain private at Linux `scratch/codex-bridge-qualification-20260922/native-smoke/`. The sanitized JSON contains only versions, immutable artifact IDs, tool/argument shapes, call IDs, effective settings, token counters and request-artifact hashes. It can be included in the S2 engineering evidence; it is not a benchmark result.

## Reusable fixture files

`fake.py` is the bounded local Responses server. `run.py` creates the internal network, starts the bridge/fake backend, runs all five native clients sequentially and cleans every container/network it created. Reuse requires Linux Docker, the listed cached images, the pinned Go runtime image and an already reviewed/built bridge binary; set `AOB_BRIDGE_BINARY` to that binary path. Copy these scripts to a fresh private scratch directory before running so existing evidence is not overwritten. The script is engineering infrastructure, not an npm/CI hook or a campaign command. Its network and container names are fixed for this isolated probe, so do not run concurrent copies.

`run-cline.py` and `summarize.py` retain the specific fixture-correction/evidence-extraction procedure used here. The latter expects the initial and corrected summary files from this session; it is not a general clean-run report generator. No further basic native-loop rerun is needed to preserve the evidence above.
