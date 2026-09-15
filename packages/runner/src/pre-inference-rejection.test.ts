import { createServer } from "node:http";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { mockAgentAdapter } from "@aob/adapters";
import { ConfigError, type C1Event } from "@aob/contracts";
import { describe, expect, it, vi } from "vitest";
import { estimateRunSpendUsd } from "./budget.js";
import { runHostCell } from "./cell.js";

const boundary = vi.hoisted(() => ({ origin: "" }));
vi.mock("undici", async importOriginal => {
  const actual = await importOriginal<typeof import("undici")>();
  return { ...actual, request: (url: Parameters<typeof actual.request>[0], init: Parameters<typeof actual.request>[1]) => {
    if (typeof url !== "string" || !boundary.origin) throw new ConfigError("offline boundary unavailable");
    const target = new URL(url);
    return actual.request(`${boundary.origin}${target.pathname}${target.search}`, init);
  } };
});
const model = "deepseek/deepseek-v4.1-flash";
const detail = "status 400: DeepSeek rejected unsupported response_format before inference";
const rates = { input: 0.001, cached_input: 0.0001, output: 0.002 };
const rejected: C1Event = {
  v: 1, run_id: "fixture", seq: 0, t_req_start: 0, t_req_body_end: 0, t_upstream_sent: 0,
  t_first_byte: 1, t_last_byte: 1, duration_ms: 1, method: "POST", path: "/v1/messages?beta=true",
  protocol: "anthropic_messages", model_requested: model, model_served: null, status: 400, streamed: false,
  usage: null, usage_source: "unavailable", usage_lookup: "not_attempted", error: { kind: "upstream_rejected", detail },
};
const success: C1Event = { ...rejected, seq: 1, status: 200, model_served: model, error: null,
  usage: { input: 10, cached_input: 0, output: 5, reasoning_output: 0 }, usage_source: "response_body" };

describe("observed pre-inference rejection accounting", () => {
  it("prices successful usage after the exact rejected request without changing raw usage", () => {
    expect(estimateRunSpendUsd([rejected, success], "pinned", rates)).toBe(0.02);
    expect(rejected.usage).toBeNull();
    expect(rejected.status).toBe(400);
    expect(estimateRunSpendUsd([rejected], "pinned", rates)).toBe(0);
    expect(estimateRunSpendUsd([rejected, success], "default", rates)).toBeNull();
    expect(estimateRunSpendUsd([rejected, success], "pinned", undefined)).toBeNull();
  });
  it.each<Partial<C1Event>>([
    { status: 520 }, { error: { kind: "upstream_http", detail } },
    { error: { kind: "upstream_rejected", detail: "some other rejection" } },
    { model_requested: "other/model" }, { model_served: model }, { usage: success.usage },
    { usage_source: "generation_lookup" }, { usage_lookup: "http_error" },
    { streamed: true }, { protocol: "openai_chat", path: "/v1/chat/completions" },
  ])("keeps ambiguous failures unpriced: %j", override => {
    expect(estimateRunSpendUsd([{ ...rejected, ...override }, success], "pinned", rates)).toBeNull();
  });

  it("requires explicit evidence that no usage lookup was attempted", () => {
    const historical = { ...rejected };
    delete historical.usage_lookup;
    expect(estimateRunSpendUsd([historical, success], "pinned", rates)).toBeNull();
  });

  it.each([
    { status: 400, recover: true, expectedSpend: 0.02 },
    { status: 400, recover: false, expectedSpend: 0 },
    { status: 520, recover: true, expectedSpend: null },
  ])("runs real proxy/C4/verifier for status $status, recovery=$recover", async ({ status, recover, expectedSpend }) => {
    const dir = await mkdtemp(join(tmpdir(), "aob-rejection-accounting-"));
    const taskDir = join(dir, "task");
    await mkdir(join(taskDir, "workspace"), { recursive: true });
    await writeFile(join(taskDir, "prompt.md"), "offline fixture");
    await writeFile(join(taskDir, "verify.sh"), "#!/bin/sh\ntest -f workspace/repaired.txt\n", { mode: 0o755 });
    let requests = 0;
    const server = createServer((req, res) => {
      req.resume();
      req.once("end", () => {
        const first = requests++ === 0;
        res.writeHead(first ? status : 200, { "content-type": "application/json", "x-generation-id": "gen-offline-123" });
        res.end(JSON.stringify(first ? {
          type: "error", request_id: "gen-offline-123",
          error: { type: "invalid_request_error", message: "This response_format type is unavailable now", error_type: "invalid_request" },
          metadata: { provider_name: "DeepSeek", is_byok: false, provider_error_code: "invalid_request_error" },
        } : { model, content: [{ type: "text", text: "fixed" }], usage: { input_tokens: 10, output_tokens: 5 } }));
      });
    });
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new ConfigError("offline port unavailable");
    boundary.origin = `http://127.0.0.1:${address.port}`;
    const adapter = vi.spyOn(mockAgentAdapter, "run").mockImplementation(async opts => {
      const tStart = performance.now();
      const anchor = { wall_clock_iso: new Date().toISOString(), monotonic_zero: tStart };
      for (let i = 0; i < (recover ? 2 : 1); i++) {
        const response = await fetch(`${opts.proxyUrl}/v1/messages`, { method: "POST",
          body: JSON.stringify({ model, tools: [], messages: [{ role: "user", content: "title" }],
            output_config: { format: { type: "json_schema", schema: { type: "object" } } } }) });
        await response.text();
      }
      await writeFile(join(opts.workspaceDir, "repaired.txt"), "fixed");
      const stdoutPath = join(opts.workspaceDir, "stdout.log");
      const stderrPath = join(opts.workspaceDir, "stderr.log");
      await writeFile(stdoutPath, ""); await writeFile(stderrPath, "");
      return { exitCode: 0, tStart, tEnd: performance.now(), anchor, artifacts: { stdoutPath, stderrPath } };
    });
    try {
      const run = await runHostCell({ dir: join(dir, "out"), taskDir, upstream: "https://openrouter.ai/api",
        run_id: "rejection-fixture", tool: "mock-agent", task_id: "t", model, price_book: "offline",
        task_source: "local-development", task_revision: "working-tree", task_regime: "short",
        priceRates: rates, env: { OPENROUTER_API_KEY: "offline-credential" },
        providerRouting: { ignored_providers: ["relace"], only_provider: "deepseek", allow_fallbacks: false },
      });
      expect(run.outcome).toBe(recover ? "completed" : "adapter_error");
      expect(run.verification.exit).toBe(recover ? 0 : 1);
      expect(run.spend_usd_estimate).toBe(expectedSpend);
      const events = (await readFile(join(dir, "out", "events.jsonl"), "utf8")).trim().split("\n").map(line => JSON.parse(line));
      expect(events).toHaveLength(recover ? 2 : 1);
      expect(events[0]).toMatchObject({ status, usage: null, error: { kind: status === 400 ? "upstream_rejected" : "upstream_http" } });
      expect(events[0].duration_ms).toBeGreaterThan(0);
    } finally {
      adapter.mockRestore(); server.closeAllConnections();
      await new Promise<void>(resolve => server.close(() => resolve()));
      await rm(dir, { recursive: true, force: true });
    }
  });
});
