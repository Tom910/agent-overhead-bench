import { createServer } from "node:http";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mockAgentAdapter } from "@aob/adapters";
import { BudgetExceeded, ConfigError, type C1Event } from "@aob/contracts";
import { describe, expect, it, vi } from "vitest";
import { estimateRunSpendUsd, type BudgetRates } from "./budget.js";
import { runHostCell } from "./cell.js";
import { runMatrix } from "./matrix.js";
import { loadState, saveState } from "./state.js";

const rates = { input: 0.001, cached_input: 0.0001, output: 0.002 };
const success: C1Event = {
  v: 1, run_id: "pinned:mock:t:0", seq: 0,
  t_req_start: 0, t_req_body_end: 0, t_upstream_sent: 0,
  t_first_byte: 1, t_last_byte: 1, duration_ms: 1,
  method: "POST", path: "/v1/chat/completions", protocol: "openai_chat",
  model_requested: "mock", model_served: "mock", status: 200, streamed: false,
  usage: { input: 10, cached_input: 0, output: 5, reasoning_output: 0 },
  usage_source: "response_body", error: null,
};
const aborted: C1Event = {
  ...success, model_requested: null, model_served: null, status: 0,
  usage: null, usage_source: "unavailable", error: { kind: "network", detail: "aborted" },
};

describe("failed-attempt spend completeness", () => {
  it.each<{
    name: string; events: C1Event[]; condition: "pinned" | "default";
    priceRates: BudgetRates | undefined; expected: number | null;
  }>([
    { name: "priced successful usage", events: [success], condition: "pinned", priceRates: rates, expected: 0.02 },
    { name: "cached successful usage", events: [{ ...success, usage: { ...success.usage!, cached_input: 5 } }], condition: "pinned", priceRates: rates, expected: 0.0155 },
    { name: "missing successful usage", events: [{ ...success, usage: null, usage_source: "unavailable" }], condition: "pinned", priceRates: rates, expected: null },
    { name: "missing rates", events: [success], condition: "pinned", priceRates: undefined, expected: null },
    { name: "default successful usage", events: [success], condition: "default", priceRates: rates, expected: null },
    { name: "request-free without rates", events: [], condition: "pinned", priceRates: undefined, expected: 0 },
    { name: "request-free default", events: [], condition: "default", priceRates: rates, expected: 0 },
    { name: "failed metadata GET", events: [{ ...aborted, method: "GET" }], condition: "pinned", priceRates: undefined, expected: 0 },
    { name: "unrecognized non-model path", events: [{ ...aborted, path: "/v1/models", protocol: "unknown" }], condition: "pinned", priceRates: rates, expected: 0 },
    { name: "local model refusal", events: [{ ...aborted, status: 404, error: { kind: "proxy_refused", detail: "path not allowed" } }], condition: "pinned", priceRates: undefined, expected: 0 },
    { name: "success plus local refusal", events: [success, { ...aborted, error: { kind: "proxy_refused", detail: "path not allowed" } }], condition: "pinned", priceRates: rates, expected: 0.02 },
    { name: "identityless abort", events: [aborted], condition: "pinned", priceRates: rates, expected: null },
    { name: "abort without rates", events: [aborted], condition: "pinned", priceRates: undefined, expected: null },
    { name: "default abort", events: [aborted], condition: "default", priceRates: undefined, expected: null },
    { name: "errored stream with observed usage", events: [{ ...success, error: { kind: "network", detail: "stream interrupted" } }], condition: "pinned", priceRates: rates, expected: null },
    { name: "failed HTTP with recovered usage", events: [{ ...success, status: 500, usage_source: "generation_lookup", usage_lookup: "recovered", error: { kind: "upstream_http", detail: "500" } }], condition: "pinned", priceRates: rates, expected: null },
  ])("preserves conservative accounting: $name", ({ events, condition, priceRates, expected }) => {
    expect(estimateRunSpendUsd(events, condition, priceRates)).toBe(expected);
  });

  it.each([
    { status: 429, recover: true, priced: true },
    { status: 500, recover: true, priced: true },
    { status: 500, recover: false, priced: false },
    { status: 0, recover: false, priced: true },
  ])("keeps spend unavailable for upstream $status (recovery=$recover, rates=$priced)", async ({ status, recover, priced }) => {
    const dir = await mkdtemp(join(tmpdir(), "aob-failed-spend-"));
    const taskDir = join(dir, "task");
    await mkdir(join(taskDir, "workspace"), { recursive: true });
    await writeFile(join(taskDir, "prompt.md"), "offline fixture");
    await writeFile(join(taskDir, "verify.sh"), "#!/bin/sh\nexit 0\n", { mode: 0o755 });
    let requests = 0;
    const server = createServer((req, res) => {
      req.resume();
      const nextStatus = requests++ === 0 ? status : 200;
      if (nextStatus === 0) { res.destroy(); return; }
      res.writeHead(nextStatus, { "content-type": "application/json" });
      res.end(JSON.stringify(nextStatus === 200
        ? { model: "mock", choices: [], usage: { prompt_tokens: 10, completion_tokens: 5 } }
        : { error: { message: "offline upstream failure" } }));
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (address === null || typeof address === "string") throw new ConfigError("missing fixture port");
    // Control only the external CLI boundary; proxy, HTTP, verifier, and C4 are real.
    const adapter = vi.spyOn(mockAgentAdapter, "run").mockImplementation(async (opts) => {
      const tStart = performance.now();
      const anchor = { wall_clock_iso: new Date().toISOString(), monotonic_zero: tStart };
      for (let i = 0; i < (recover ? 2 : 1); i++) {
        const response = await fetch(`${opts.proxyUrl}/v1/chat/completions`, {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ model: "mock", messages: [] }),
        });
        await response.text();
      }
      const stdoutPath = join(opts.workspaceDir, "stdout.log");
      const stderrPath = join(opts.workspaceDir, "stderr.log");
      await writeFile(stdoutPath, "");
      await writeFile(stderrPath, "");
      return { exitCode: 0, tStart, tEnd: performance.now(), anchor, artifacts: { stdoutPath, stderrPath } };
    });
    try {
      const run = await runHostCell({
        dir: join(dir, "out"), taskDir, upstream: `http://127.0.0.1:${address.port}`,
        run_id: "failed-spend", tool: "mock-agent", task_id: "t", model: "mock", price_book: "mock",
        task_source: "local-development", task_revision: "working-tree", task_regime: "short",
        ...(priced ? { priceRates: rates } : {}), env: {},
      });
      expect(run.outcome).toBe(recover ? "completed" : "adapter_error");
      expect(run.verification.exit).toBe(recover ? 0 : 1);
      expect(run.spend_usd_estimate).toBeNull();
    } finally {
      adapter.mockRestore();
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      await rm(dir, { recursive: true, force: true });
    }
  });

  it.each([false, true])("blocks capped interrupted abort recovery before executing (successful prefix=%s)", async (hasSuccess) => {
    const dir = await mkdtemp(join(tmpdir(), "aob-aborted-resume-"));
    const resultsDir = join(dir, "results");
    const statePath = join(dir, "state.json");
    const eventDir = join(resultsDir, "pinned", "mock", "t", "rep-0");
    await mkdir(eventDir, { recursive: true });
    const events = hasSuccess ? [success, { ...aborted, seq: 1 }] : [aborted];
    const eventText = events.map((event) => JSON.stringify(event)).join("\n") + "\n";
    await writeFile(join(eventDir, "events.jsonl"), eventText);
    saveState(statePath, {
      version: 1, seed: 1, spentUsd: 0,
      definition_key: JSON.stringify({ model: "mock", priceBook: "mock", tools: ["mock"], conditions: ["pinned"], reps: 1, tasks: [{ id: "t", source: "local-development", revision: "working-tree", regime: "short", timeoutS: 1 }] }),
      cells: [{ id: success.run_id, tool: "mock", task_id: "t", condition: "pinned", rep: 0, status: "running", retries: 0 }],
    });
    let executions = 0;
    const options = {
      resultsDir, statePath,
      tasks: [{ id: "t", dir, source: "local-development", revision: "working-tree", regime: "short" as const, timeoutS: 1 }],
      tools: ["mock"], conditions: ["pinned" as const], reps: 1, model: "mock", priceBook: "mock",
      priceRates: rates, capUsd: 1, estimateCellUsd: () => 0.01,
      executeCell: async () => { executions++; throw new ConfigError("must not execute with incomplete spend"); },
    };
    try {
      await expect(runMatrix(options)).rejects.toBeInstanceOf(BudgetExceeded);
      await expect(runMatrix(options)).rejects.toBeInstanceOf(BudgetExceeded);
      expect(executions).toBe(0);
      expect(loadState(statePath).spentUsd).toBe(0);
      expect(await readFile(join(eventDir, "events.jsonl"), "utf8")).toBe(eventText);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
