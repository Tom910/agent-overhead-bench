import { createServer } from "node:http";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { startProxy } from "@aob/proxy";
import { ConfigError, validateC1Event, validateC4Run } from "@aob/contracts";
import { validateExecutionConditions } from "./execution-conditions.js";
import { runDockerCell, runHostCell, type CellSpec } from "./cell.js";

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), "test-fixtures");
const cleanups: Array<() => Promise<unknown>> = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0).reverse()) await cleanup(); });
async function fixture(response: { model?: string; usage?: unknown } = { model: "gpt-6-luna", usage: { prompt_tokens: 20, completion_tokens: 5 } }) {
  const root = await mkdtemp(join(tmpdir(), "aob-cell-transport-"));
  cleanups.push(() => rm(root, { recursive: true, force: true }));
  const taskDir = join(root, "task");
  await mkdir(join(taskDir, "workspace"), { recursive: true });
  await writeFile(join(taskDir, "prompt.md"), "Write SOLVED.\n");
  await writeFile(join(taskDir, "verify.sh"), "test -f workspace/SOLVED\n");
  await writeFile(join(root, "docker"), await readFile(join(fixtureDir, "docker-stub.mjs")), { mode: 0o755 });
  const oldPath = process.env.PATH;
  process.env.PATH = `${root}:${oldPath ?? "/usr/bin:/bin"}`;
  cleanups.push(async () => { if (oldPath === undefined) delete process.env.PATH; else process.env.PATH = oldPath; });
  let calls = 0;
  const backend = createServer(async (req, res) => {
    for await (const _chunk of req) { /* consume the synthetic request */ }
    calls++;
    if (req.headers["x-fixture-denial"] === "yes") res.statusCode = 429;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ...response, choices: [] }));
  });
  await new Promise<void>(resolve => backend.listen(0, "127.0.0.1", resolve));
  cleanups.push(() => new Promise<void>(resolve => { backend.closeAllConnections(); backend.close(() => resolve()); }));
  const address = backend.address();
  if (!address || typeof address === "string") throw new Error("fixture did not bind");
  const upstream = `http://127.0.0.1:${address.port}`;
  const spec: CellSpec = { dir: join(root, "out"), taskDir, upstream, run_id: "custom-transport", tool: "hermes",
    task_id: "fixture", task_source: "local-development", task_revision: "working-tree", task_regime: "short",
    model: "gpt-6-luna", price_book: "subscription-unpriced", timeoutS: 5,
    environment: { kind: "prepared-local", network: "disabled" } };
  return { root, spec, upstream, calls: () => calls };
}

function transport(spec: CellSpec, upstream: string) {
  let closed = 0; let flushed = 0;
  let actual: Awaited<ReturnType<typeof startProxy>> | undefined;
  spec.transportFactory = async ({ runId, eventsPath, authToken }) => {
    expect(runId).toBe(spec.run_id); expect(eventsPath).toBe(join(spec.dir, "events.jsonl"));
    expect(authToken).toMatch(/^[a-f0-9]{64}$/);
    actual = await startProxy({ run_id: runId, outPath: eventsPath, authToken, upstream });
    cleanups.push(() => actual!.close());
    return { port: actual.port, anchor: actual.anchor,
      flush: async () => { flushed++; await actual!.flush(); },
      close: async () => { closed++; await actual!.close(); } };
  };
  return { closed: () => closed, flushed: () => flushed, proxy: () => actual };
}

describe("Docker cell custom provider transport", () => {
  it("uses supplied ingress, canonical events and provider clock while retaining verifier/C4 evidence", async () => {
    const f = await fixture(); const custom = transport(f.spec, f.upstream);
    // The default upstream is deliberately unusable: only the injected route works.
    f.spec.upstream = "http://127.0.0.1:1";
    const run = await runDockerCell(f.spec);
    expect(run.outcome).toBe("completed"); expect(f.calls()).toBe(1);
    expect(run.anchors.proxy).toEqual(custom.proxy()!.anchor);
    expect(await readFile(join(f.root, "relay-target"), "utf8")).toBe(`http://host.docker.internal:${custom.proxy()!.port}`);
    expect(custom.flushed()).toBe(1); expect(custom.closed()).toBe(1);
    expect(run.spend_usd_estimate).toBeNull();
    expect(validateC4Run(JSON.parse(await readFile(join(f.spec.dir, "run.json"), "utf8")))).toEqual(run);
    expect(validateExecutionConditions(await readFile(join(f.spec.dir, "run.json")), JSON.parse(await readFile(join(f.spec.dir, "execution-conditions.json"), "utf8"))).verifier).not.toBeNull();
    expect(await readFile(join(f.spec.dir, "candidate.patch"), "utf8")).toContain("SOLVED");
    const events = (await readFile(join(f.spec.dir, "events.jsonl"), "utf8")).trim().split("\n").map(line => validateC1Event(JSON.parse(line)));
    expect(events).toHaveLength(1); expect(events[0]?.run_id).toBe(run.run_id);
  });

  it.each([
    { usage: { prompt_tokens: 20, completion_tokens: 5 } },
    { model: "gpt-6-luna" },
    { model: "wrong", usage: { prompt_tokens: 20, completion_tokens: 5 } },
  ])("preserves C1 but skips verification for incomplete identity/accounting %j", async response => {
    const f = await fixture(response); const custom = transport(f.spec, f.upstream);
    let verified = false; f.spec.onVerificationStart = () => { verified = true; };
    const run = await runDockerCell(f.spec);
    expect(run.outcome).toBe("adapter_error"); expect(verified).toBe(false);
    expect(run.verification.duration_ms).toBe(0); expect(f.calls()).toBe(1);
    expect(custom.closed()).toBe(1); expect(await readFile(join(f.spec.dir, "events.jsonl"), "utf8")).not.toBe("");
    expect(await readFile(join(f.spec.dir, "candidate.patch"), "utf8")).toContain("SOLVED");
  });

  it.each(["port", "anchor", "flush"])("rejects invalid %s before native execution and closes returned transport", async field => {
    const f = await fixture(); let closed = 0;
    f.spec.transportFactory = async () => ({ port: field === "port" ? 0 : 12345,
      anchor: { wall_clock_iso: field === "anchor" ? "invalid" : new Date().toISOString(), monotonic_zero: 1 },
      flush: field === "flush" ? undefined : async () => {}, close: async () => { closed++; } }) as never;
    await expect(runDockerCell(f.spec)).rejects.toBeInstanceOf(ConfigError);
    expect(f.calls()).toBe(0); expect(closed).toBe(1);
  });

  it("closes custom transport when native setup throws", async () => {
    const f = await fixture(); const custom = transport(f.spec, f.upstream);
    f.spec.onExecutionStart = () => { throw new ConfigError("synthetic admission refusal"); };
    await expect(runDockerCell(f.spec)).rejects.toThrow("synthetic admission refusal");
    expect(custom.closed()).toBe(1); expect(f.calls()).toBe(0);
  });

  it("rejects a custom host transport before staging or opening it", async () => {
    const f = await fixture(); let opened = false;
    f.spec.transportFactory = async () => { opened = true; throw new ConfigError("must not open"); };
    await expect(runHostCell(f.spec)).rejects.toBeInstanceOf(ConfigError); expect(opened).toBe(false);
    await expect(readFile(join(f.spec.dir, "prompt.md"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("preserves legacy default route behavior with nullable served identity", async () => {
    const f = await fixture({ usage: { prompt_tokens: 20, completion_tokens: 5 } });
    const run = await runDockerCell(f.spec);
    expect(run.outcome).toBe("completed"); expect(f.calls()).toBe(1);
  });

  it("rejects provider-routing claims the custom transport cannot apply", async () => {
    const f = await fixture(); let opened = false;
    f.spec.providerRouting = { ignored_providers: ["synthetic-excluded"] };
    f.spec.transportFactory = async () => { opened = true; throw new ConfigError("must not open"); };
    await expect(runDockerCell(f.spec)).rejects.toThrow("custom transport cannot apply provider routing");
    expect(opened).toBe(false);
    await expect(readFile(join(f.spec.dir, "prompt.md"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("retains a failed provider attempt after success even when the native CLI exits zero", async () => {
    const f = await fixture(); transport(f.spec, f.upstream);
    const original = f.spec.transportFactory!;
    f.spec.transportFactory = async options => {
      const handle = await original(options);
      return { ...handle, flush: async () => {
        const response = await fetch(`http://127.0.0.1:${handle.port}/v1/chat/completions`, {
          method: "POST", headers: { "x-aob-proxy-token": options.authToken, "x-fixture-denial": "yes" },
          body: '{"model":"gpt-6-luna"}',
        });
        await response.text(); await handle.flush();
      } };
    };
    let verified = false; f.spec.onVerificationStart = () => { verified = true; };
    const run = await runDockerCell(f.spec);
    expect(run.adapter_result.exitCode).toBe(0); expect(run.outcome).toBe("adapter_error");
    expect(verified).toBe(false); expect(f.calls()).toBe(2);
    const events = (await readFile(join(f.spec.dir, "events.jsonl"), "utf8")).trim().split("\n").map(line => validateC1Event(JSON.parse(line)));
    expect(events.map(event => event.status)).toEqual([200, 429]); expect(run.spend_usd_estimate).toBeNull();
  });

});
