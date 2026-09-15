import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { chmod, mkdtemp, readFile, stat, symlink, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { ConfigError } from "@aob/contracts";
import { startProxy } from "./proxy.js";

// Only replace the external network boundary; the proxy, streaming, capture,
// routing and file writes remain real. This file cannot call a paid endpoint.
const boundary = vi.hoisted(() => ({ origin: "" }));
const disk = vi.hoisted(() => ({ fail: false, streams: [] as import("node:fs").WriteStream[] }));
vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return { ...actual,
    createWriteStream: (...args: Parameters<typeof actual.createWriteStream>) => {
      const stream = actual.createWriteStream(...args);
      if (String(args[0]).endsWith(".upstream.jsonl")) disk.streams.push(stream);
      return stream;
    },
    fsync: (fd: number, callback: (error: NodeJS.ErrnoException | null) => void) => {
      const stream = disk.streams.find(item => (item as unknown as { fd: number }).fd === fd);
      if (disk.fail && stream) {
        const error = Object.assign(new Error("offline disk full"), { code: "ENOSPC" });
        callback(error);
        stream.destroy(error);
      } else actual.fsync(fd, callback);
    },
  };
});
vi.mock("undici", async (importOriginal) => {
  const actual = await importOriginal<typeof import("undici")>();
  return { ...actual, request: (url: Parameters<typeof actual.request>[0], init: Parameters<typeof actual.request>[1]) => {
    if (typeof url !== "string" || boundary.origin === "") throw new Error("offline upstream is unavailable");
    const target = new URL(url);
    return actual.request(`${boundary.origin}${target.pathname}${target.search}`, init);
  } };
});

const model = "deepseek/deepseek-v4.1-flash";
const generation = "gen-offline-validation-123";
const rejection = () => ({
  type: "error",
  error: { type: "invalid_request_error", message: "This response_format type is unavailable now", error_type: "invalid_request" },
  request_id: generation,
  metadata: { provider_name: "DeepSeek", is_byok: false, provider_error_code: "invalid_request_error" },
});
const titleRequest = (): Record<string, unknown> => ({
  model, stream: true, max_tokens: 32000,
  system: [{ type: "text", text: "Private system prompt" }],
  messages: [{ role: "user", content: "Private title input" }],
  output_config: { effort: "high", format: { type: "json_schema", schema: { type: "object", properties: { title: { type: "string" } } } } },
});

type Case = {
  response?: string;
  body?: Record<string, unknown>;
  status?: number;
  generationId?: string | null;
  upstream?: string;
  provider?: string;
  contentType?: string;
  apiKey?: string | null;
  clientAuthorization?: string;
  diskFailure?: boolean;
  existingEvidenceMode?: number;
};

async function exercise(options: Case = {}) {
  const dir = await mkdtemp(join(tmpdir(), "aob-upstream-evidence-"));
  const path = join(dir, "events.jsonl");
  if (options.existingEvidenceMode !== undefined) {
    await writeFile(`${path}.upstream.jsonl`, "old evidence\n");
    await chmod(`${path}.upstream.jsonl`, options.existingEvidenceMode);
  }
  const responseBody = options.response ?? JSON.stringify(rejection());
  let forwardedBody = "";
  const server = createServer((req, res) => {
    req.setEncoding("utf8");
    req.on("data", (chunk: string) => { forwardedBody += chunk; });
    req.on("end", () => {
      const id = options.generationId === undefined ? generation : options.generationId;
      res.writeHead(options.status ?? 400, { "content-type": options.contentType ?? "application/json", ...(id === null ? {} : { "x-generation-id": id }) });
      // Split credential strings and JSON tokens across response chunks.
      for (let i = 0; i < responseBody.length; i += 23) res.write(responseBody.slice(i, i + 23));
      res.end();
    });
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new ConfigError("offline server did not bind");
  boundary.origin = `http://127.0.0.1:${address.port}`;
  const proxy = await startProxy({ run_id: "evidence-case", upstream: options.upstream ?? "https://openrouter.ai/api", outPath: path,
    ...(options.apiKey === null ? {} : { upstreamApiKey: options.apiKey ?? "test-provider-credential" }), onlyProvider: options.provider ?? "deepseek" });
  disk.fail = options.diskFailure ?? false;
  try {
    const response = await fetch(`${proxy.baseUrl}/v1/messages?beta=true`, { method: "POST", headers: { "content-type": "application/json", ...(options.clientAuthorization ? { authorization: options.clientAuthorization } : {}) }, body: JSON.stringify(options.body ?? titleRequest()) });
    const wire = await response.text();
    if (options.diskFailure) {
      await expect(proxy.flush()).rejects.toBeInstanceOf(ConfigError);
      await expect(proxy.flush()).rejects.toBeInstanceOf(ConfigError);
    } else await proxy.flush();
    const rawEvents = await readFile(path, "utf8");
    const events: Array<Record<string, unknown>> = rawEvents.trim().split("\n").map(line => JSON.parse(line) as Record<string, unknown>);
    return { dir, path, wire, responseBody, rawEvents, event: events[0]!, forwardedBody };
  } finally {
    try {
      if (options.diskFailure) {
        await expect(proxy.close()).rejects.toBeInstanceOf(ConfigError);
        expect(disk.streams.at(-1)?.closed).toBe(true);
      } else await proxy.close();
    } finally {
      disk.fail = false;
      server.closeAllConnections();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }

  }
}

describe("upstream response evidence", () => {
  it("retains the generation ID and structured cause bound to exact C1 bytes without changing passthrough", async () => {
    const result = await exercise();
    expect(result.wire).toBe(result.responseBody);
    expect(existsSync(`${result.path}.upstream.jsonl`)).toBe(true);
    const text = await readFile(`${result.path}.upstream.jsonl`, "utf8");
    const evidence = JSON.parse(text);
    expect(evidence).toMatchObject({ v: 1, run_id: "evidence-case", seq: 0, generation_id: generation,
      c1_sha256: createHash("sha256").update(result.rawEvents).digest("hex"), upstream_status: 400,
      error: { type: "invalid_request_error", message: "This response_format type is unavailable now" },
      error_body_complete: true, error_body_truncated: false,
    });
    expect(evidence.error_body_sha256).toBe(createHash("sha256").update(result.responseBody).digest("hex"));
    expect(text).not.toContain("Private system prompt");
    expect(text).not.toContain("Private title input");
    expect((await stat(`${result.path}.upstream.jsonl`)).mode & 0o777).toBe(0o600);
    expect(JSON.parse(result.forwardedBody).output_config).toEqual(titleRequest().output_config);
  });

  it("classifies the complete DeepSeek pre-inference rejection while preserving absent usage and HTTP 400", async () => {
    const { event } = await exercise();
    expect(event).toMatchObject({ status: 400, model_requested: model, model_served: null, usage: null,
      usage_source: "unavailable", usage_lookup: "not_attempted", error: { kind: "upstream_rejected" } });
  });

  it("recognizes Claude Code's explicit empty tools list", async () => {
    const { event } = await exercise({ body: { ...titleRequest(), tools: [] } });
    expect(event.error).toMatchObject({ kind: "upstream_rejected" });
  });

  it.each([
    { name: "transient 520", status: 520 },
    { name: "missing generation ID", generationId: null },
    { name: "mismatched generation ID", generationId: "gen-other" },
    { name: "untrusted upstream", upstream: "https://not-openrouter.example/api" },
    { name: "different selected provider", provider: "other" },
    { name: "malformed JSON", response: "not json" },
    { name: "error stream", contentType: "text/event-stream" },
    { name: "non-JSON MIME prefix", contentType: "application/json-fake" },
    { name: "unbounded response", response: JSON.stringify({ ...rejection(), padding: "x".repeat(70_000) }) },
    { name: "different error", response: JSON.stringify({ ...rejection(), error: { type: "invalid_request_error", message: "Another error" } }) },
    { name: "BYOK", response: JSON.stringify({ ...rejection(), metadata: { ...rejection().metadata, is_byok: true } }) },
    { name: "missing BYOK evidence", response: JSON.stringify({ ...rejection(), metadata: { provider_name: "DeepSeek", provider_error_code: "invalid_request_error" } }) },
    { name: "wrong response provider", response: JSON.stringify({ ...rejection(), metadata: { ...rejection().metadata, provider_name: "Other" } }) },
    { name: "unexpected provider charge metadata", response: JSON.stringify({ ...rejection(), metadata: { ...rejection().metadata, plugin_charge: 1 } }) },
    { name: "different requested model", body: { ...titleRequest(), model: "other/model" } },
    { name: "plugin request", body: { ...titleRequest(), plugins: [{ id: "web" }] } },
    { name: "null tools", body: { ...titleRequest(), tools: null } },
    { name: "nonarray tools", body: { ...titleRequest(), tools: {} } },
    { name: "tool request", body: { ...titleRequest(), tools: [{ name: "web_search", type: "web_search" }] } },
    { name: "unknown extension", body: { ...titleRequest(), future_billable_extension: true } },
    { name: "multimodal input", body: { ...titleRequest(), messages: [{ role: "user", content: [{ type: "image", source: { type: "url", url: "https://example.invalid/a.png" } }] }] } },
    { name: "missing requested schema", body: { ...titleRequest(), output_config: { effort: "high" } } },
  ])("leaves $name as an unresolved upstream error", async options => {
    const { event } = await exercise(options);
    expect(event.error).toMatchObject({ kind: "upstream_http" });
    expect(event.usage).toBeNull();
  });

  it("redacts known credentials and common secret patterns from bounded error fields", async () => {
    const key = "private-provider-secret-value";
    const result = await exercise({ apiKey: key, response: JSON.stringify({ error: { type: "invalid_request_error", message: `Rejected ${key}; sk-or-test-secret; Bearer test-auth-secret` } }) });
    expect(existsSync(`${result.path}.upstream.jsonl`)).toBe(true);
    const evidence = await readFile(`${result.path}.upstream.jsonl`, "utf8");
    for (const secret of [key, "sk-or-test-secret", "test-auth-secret"]) expect(evidence).not.toContain(secret);
    expect(evidence).toContain("[redacted]");
  });

  it.each(["Bearer", "Basic"])("redacts bare client %s credentials when no configured provider key exists", async scheme => {
    const key = "opaque-private-request-token";
    const result = await exercise({ apiKey: null, clientAuthorization: `${scheme} ${key}`,
      response: JSON.stringify({ error: { message: `Rejected ${key}` } }) });
    expect(await readFile(`${result.path}.upstream.jsonl`, "utf8")).not.toContain(key);
  });

  it("preserves one C1 event and remembers auxiliary disk failure through flush and cleanup", async () => {
    const result = await exercise({ diskFailure: true });
    const events = result.rawEvents.trim().split("\n").map(line => JSON.parse(line));
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ seq: 0, status: 400, error: { kind: "upstream_rejected" } });
  });

  it("retains header IDs on successful responses without storing generated content", async () => {
    const response = JSON.stringify({ model, content: [{ type: "text", text: "PRIVATE GENERATED CONTENT" }], usage: { input_tokens: 2, output_tokens: 3 } });
    const result = await exercise({ status: 200, response });
    expect(existsSync(`${result.path}.upstream.jsonl`)).toBe(true);
    const text = await readFile(`${result.path}.upstream.jsonl`, "utf8");
    expect(JSON.parse(text)).toMatchObject({ generation_id: generation, upstream_status: 200, error: null, error_body_sha256: null });
    expect(text).not.toContain("PRIVATE GENERATED CONTENT");
  });

  it("keeps oversized errors bounded while hashing the entire forwarded body", async () => {
    const response = JSON.stringify({ error: { message: "x".repeat(90_000) } });
    const result = await exercise({ response });
    expect(result.wire).toBe(response);
    const text = await readFile(`${result.path}.upstream.jsonl`, "utf8");
    expect(text.length).toBeLessThan(2048);
    expect(JSON.parse(text)).toMatchObject({ error: null, error_body_bytes: Buffer.byteLength(response),
      error_body_complete: true, error_body_truncated: true, error_body_sha256: createHash("sha256").update(response).digest("hex") });
  });

  it("restricts an existing auxiliary file to private permissions", async () => {
    const result = await exercise({ existingEvidenceMode: 0o644 });
    expect((await stat(`${result.path}.upstream.jsonl`)).mode & 0o777).toBe(0o600);
  });

  it("refuses an auxiliary symlink before changing its target", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-evidence-symlink-"));
    const target = join(dir, "retained.jsonl");
    const path = join(dir, "events.jsonl");
    await writeFile(target, "retained evidence");
    await symlink(target, `${path}.upstream.jsonl`);
    let rejected = false;
    try {
      const proxy = await startProxy({ run_id: "symlink", upstream: "http://127.0.0.1:1", outPath: path });
      await proxy.close();
    } catch (error) {
      expect(error).toBeInstanceOf(ConfigError);
      rejected = true;
    }
    expect(rejected).toBe(true);
    expect(await readFile(target, "utf8")).toBe("retained evidence");
  });

  it("binds concurrent out-of-order responses to their own C1 sequence", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-evidence-concurrent-"));
    const path = join(dir, "events.jsonl");
    const server = createServer((req, res) => {
      req.resume();
      req.once("end", () => {
        const slow = req.url?.includes("slow") === true;
        const id = slow ? "gen-slow" : "gen-fast";
        setTimeout(() => {
          res.writeHead(400, { "content-type": "application/json", "x-generation-id": id });
          res.end(JSON.stringify({ ...rejection(), request_id: id }));
        }, slow ? 40 : 0);
      });
    });
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new ConfigError("offline server did not bind");
    boundary.origin = `http://127.0.0.1:${address.port}`;
    const proxy = await startProxy({ run_id: "concurrent", upstream: "https://openrouter.ai/api", outPath: path,
      upstreamApiKey: "offline-credential", onlyProvider: "deepseek" });
    try {
      await Promise.all(["slow", "fast"].map(async name => {
        const response = await fetch(`${proxy.baseUrl}/v1/messages?${name}`, { method: "POST", body: JSON.stringify(titleRequest()) });
        await response.text();
      }));
      await proxy.flush();
      const lines = (await readFile(path, "utf8")).trim().split("\n");
      const evidence = (await readFile(`${path}.upstream.jsonl`, "utf8")).trim().split("\n").map(line => JSON.parse(line));
      expect(evidence).toHaveLength(2);
      for (const line of lines) {
        const event = JSON.parse(line);
        expect(evidence.find(record => record.seq === event.seq)).toMatchObject({
          generation_id: event.path.includes("slow") ? "gen-slow" : "gen-fast",
          c1_sha256: createHash("sha256").update(`${line}\n`).digest("hex"),
        });
      }
    } finally {
      await proxy.close(); server.closeAllConnections();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });

  it("retains received response IDs when shutdown interrupts an error response", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-evidence-interrupted-"));
    const path = join(dir, "events.jsonl");
    const server = createServer((req, res) => {
      req.resume();
      req.once("end", () => {
        res.writeHead(400, { "content-type": "application/json", "x-generation-id": generation });
        res.write('{"error":');
      });
    });
    await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new ConfigError("offline server did not bind");
    boundary.origin = `http://127.0.0.1:${address.port}`;
    const proxy = await startProxy({ run_id: "interrupted", upstream: "https://openrouter.ai/api", outPath: path });
    try {
      const response = await fetch(`${proxy.baseUrl}/v1/messages`, { method: "POST", body: JSON.stringify(titleRequest()) });
      const body = response.text().catch(() => undefined);
      await proxy.close(); await body;
      const event = JSON.parse((await readFile(path, "utf8")).trim());
      expect(event).toMatchObject({ status: 0, error: { kind: "network" } });
      const evidence = JSON.parse((await readFile(`${path}.upstream.jsonl`, "utf8")).trim());
      expect(evidence).toMatchObject({ generation_id: generation, upstream_status: 400, error_body_complete: false, error: null });
    } finally {
      await proxy.close(); server.closeAllConnections();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  });
});
