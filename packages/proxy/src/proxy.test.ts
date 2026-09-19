import { createGunzip } from "node:zlib";
import { mkdtemp, readFile } from "node:fs/promises";
import { createServer, request } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { describe, expect, it } from "vitest";
import { ConfigError, validateC1Event, type C1Event } from "@aob/contracts";
import { startMockUpstream } from "@aob/mock-upstream";
import { startProxy } from "./proxy.js";

async function withProxy(
  mockOpts: Parameters<typeof startMockUpstream>[0],
  fn: (baseUrl: string, eventsPath: string, flush: () => Promise<void>) => Promise<void>,
): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), "aob-proxy-"));
  const eventsPath = join(dir, "events.jsonl");
  const mock = await startMockUpstream(mockOpts);
  const proxy = await startProxy({
    run_id: "test-run",
    upstream: mock.baseUrl,
    outPath: eventsPath,
  });
  try {
    await fn(proxy.baseUrl, eventsPath, proxy.flush);
  } finally {
    await proxy.close();
    await mock.close();
  }
}

async function loadEvents(path: string): Promise<C1Event[]> {
  const text = await readFile(path, "utf8");
  const lines = text.split("\n").filter((l) => l.length > 0);
  return lines.map((l) => validateC1Event(JSON.parse(l)));
}

describe("proxy passthrough", () => {
  it("aborts pending upstream requests when closing after an adapter timeout", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-proxy-close-"));
    const eventsPath = join(dir, "events.jsonl");
    let requestStarted!: () => void;
    const requestAccepted = new Promise<void>((resolve) => { requestStarted = resolve; });
    const upstream = createServer((_req, res) => {
      requestStarted();
      setTimeout(() => res.end(JSON.stringify({ choices: [] })), 500);
    });
    await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", () => resolve()));
    const address = upstream.address();
    if (!address || typeof address === "string") throw new Error("upstream did not bind");
    const proxy = await startProxy({ run_id: "close-timeout", upstream: `http://127.0.0.1:${address.port}`, outPath: eventsPath });
    const request = fetch(`${proxy.baseUrl}/v1/chat/completions`, { method: "POST", body: "{}" }).catch(() => undefined);
    try {
      await requestAccepted;
      const started = performance.now();
      await proxy.close();
      expect(performance.now() - started).toBeLessThan(400);
      await request;
    } finally {
      await new Promise<void>((resolve) => upstream.close(() => resolve()));
    }
  });

  it("retains completed request identity and upload timing when shutdown aborts the upstream", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-proxy-abort-metadata-"));
    const eventsPath = join(dir, "events.jsonl");
    let bodyReceived!: () => void;
    const received = new Promise<void>((resolve) => { bodyReceived = resolve; });
    const upstream = createServer((req, _res) => {
      req.resume();
      req.once("end", bodyReceived);
    });
    await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
    const address = upstream.address();
    if (!address || typeof address === "string") throw new ConfigError("upstream did not bind");
    const proxy = await startProxy({ run_id: "abort-metadata", upstream: `http://127.0.0.1:${address.port}`, outPath: eventsPath });
    const pending = fetch(`${proxy.baseUrl}/v1/chat/completions`, {
      method: "POST", body: JSON.stringify({ model: "requested-before-abort", messages: [] }),
    }).catch(() => undefined);
    try {
      await received;
      await new Promise((resolve) => setTimeout(resolve, 20));
      await proxy.close();
      await pending;
      const [event] = await loadEvents(eventsPath);
      expect(event?.model_requested).toBe("requested-before-abort");
      expect(event?.t_req_body_end).toBeLessThan(event!.t_last_byte);
      expect(event?.t_upstream_sent).toBeLessThan(event!.t_last_byte);
      expect(event?.status).toBe(0);
      expect(event?.usage).toBeNull();
      expect(event?.error?.kind).toBe("network");
    } finally {
      upstream.closeAllConnections();
      await new Promise<void>((resolve) => upstream.close(() => resolve()));
    }
  });

  it("retains the observed first byte when shutdown interrupts a response stream", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-proxy-stream-abort-"));
    const eventsPath = join(dir, "events.jsonl");
    const upstream = createServer((req, res) => {
      req.resume();
      req.once("end", () => {
        res.writeHead(200, { "content-type": "text/event-stream" });
        res.write('data: {"model":"served-before-abort","choices":[]}\n\n');
      });
    });
    await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
    const address = upstream.address();
    if (!address || typeof address === "string") throw new ConfigError("upstream did not bind");
    const proxy = await startProxy({ run_id: "stream-abort", upstream: `http://127.0.0.1:${address.port}`, outPath: eventsPath });
    try {
      const response = await fetch(`${proxy.baseUrl}/v1/chat/completions`, {
        method: "POST", body: JSON.stringify({ model: "requested-before-abort", messages: [] }),
      });
      const reader = response.body!.getReader();
      expect((await reader.read()).done).toBe(false);
      await new Promise((resolve) => setTimeout(resolve, 20));
      await proxy.close();
      await reader.cancel().catch(() => undefined);
      const [event] = await loadEvents(eventsPath);
      expect(event?.model_requested).toBe("requested-before-abort");
      expect(event?.t_req_body_end).toBeLessThanOrEqual(event!.t_upstream_sent);
      expect(event?.t_upstream_sent).toBeLessThanOrEqual(event!.t_first_byte);
      expect(event?.t_first_byte).toBeLessThan(event!.t_last_byte);
      expect(event?.streamed).toBe(true);
      expect(event?.status).toBe(0);
      expect(event?.usage).toBeNull();
      expect(event?.error?.kind).toBe("network");
    } finally {
      upstream.closeAllConnections();
      await new Promise<void>((resolve) => upstream.close(() => resolve()));
    }
  });

  it("closes promptly without inventing model metadata from an unfinished upload", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-proxy-upload-abort-"));
    const eventsPath = join(dir, "events.jsonl");
    let receivedChunk!: () => void;
    const received = new Promise<void>((resolve) => { receivedChunk = resolve; });
    const upstream = createServer((req, _res) => { req.on("data", receivedChunk); });
    await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
    const address = upstream.address();
    if (!address || typeof address === "string") throw new ConfigError("upstream did not bind");
    const proxy = await startProxy({ run_id: "upload-abort", upstream: `http://127.0.0.1:${address.port}`, outPath: eventsPath });
    const pending = request(`${proxy.baseUrl}/v1/chat/completions`, { method: "POST" });
    pending.on("error", () => undefined);
    pending.write('{"model":"not-a-completed-body",');
    try {
      await received;
      await proxy.close();
      const events = await loadEvents(eventsPath);
      expect(events).toHaveLength(1);
      expect(events[0]?.model_requested).toBeNull();
      expect(events[0]?.status).toBe(0);
      expect(events[0]?.usage).toBeNull();
      validateC1Event(events[0]);
    } finally {
      pending.destroy();
      upstream.closeAllConnections();
      await new Promise<void>((resolve) => upstream.close(() => resolve()));
    }
  }, 2_000);

  it("aborts a pending generation lookup when closing", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-proxy-lookup-close-"));
    const eventsPath = join(dir, "events.jsonl");
    let lookupStarted!: () => void;
    const lookupAccepted = new Promise<void>((resolve) => { lookupStarted = resolve; });
    const upstream = createServer((req, res) => {
      if (req.url?.startsWith("/api/v1/generation")) {
        lookupStarted();
        return;
      }
      req.resume();
      req.once("end", () => {
        res.writeHead(200, { "content-type": "application/json", "x-generation-id": "gen-close" });
        res.end(JSON.stringify({ choices: [] }));
      });
    });
    await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", () => resolve()));
    const address = upstream.address();
    if (!address || typeof address === "string") throw new Error("upstream did not bind");
    const proxy = await startProxy({ run_id: "lookup-close", upstream: `http://127.0.0.1:${address.port}`, outPath: eventsPath });
    try {
      const response = await fetch(`${proxy.baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { authorization: "Bearer sk-or-test" },
        body: "{}",
      });
      expect(response.status).toBe(200);
      await lookupAccepted;
      const started = performance.now();
      await proxy.close();
      expect(performance.now() - started).toBeLessThan(400);
    } finally {
      await new Promise<void>((resolve) => upstream.close(() => resolve()));
    }
  });

  it("forwards non-stream JSON byte-for-byte and records C1", async () => {
    await withProxy({ delayMs: 0, streamed: false, includeUsage: true, status: 200 }, async (baseUrl, eventsPath) => {
      const directMock = await startMockUpstream({
        delayMs: 0,
        streamed: false,
        includeUsage: true,
        status: 200,
      });
      try {
        const body = JSON.stringify({ model: "test-model", messages: [] });
        const via = await fetch(`${baseUrl}/v1/chat/completions`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body,
        });
        const viaBuf = Buffer.from(await via.arrayBuffer());
        const raw = await fetch(`${directMock.baseUrl}/v1/chat/completions`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body,
        });
        const rawBuf = Buffer.from(await raw.arrayBuffer());
        expect(viaBuf.equals(rawBuf)).toBe(true);
        expect(via.status).toBe(200);
        const events = await loadEvents(eventsPath);
        expect(events).toHaveLength(1);
        expect(events[0]?.protocol).toBe("openai_chat");
        expect(events[0]?.model_requested).toBe("test-model");
        expect(events[0]?.model_served).toBe("mock-served");
        expect(events[0]?.model_served).not.toBe(events[0]?.model_requested);
        expect(events[0]?.usage?.input).toBeGreaterThan(0);
        expect(events[0]?.usage_source).toBe("response_body");
      } finally {
        await directMock.close();
      }
    });
  });

  it("forwards SSE streams including data: lines", async () => {
    await withProxy({ delayMs: 0, streamed: true, includeUsage: true, status: 200 }, async (baseUrl, eventsPath, flush) => {
      const res = await fetch(`${baseUrl}/v1/chat/completions`, { method: "POST", body: "{}" });
      const text = await res.text();
      expect(text).toContain("data:");
      expect(text).toContain("[DONE]");
      await flush();
      const events = await loadEvents(eventsPath);
      expect(events[0]?.streamed).toBe(true);
      expect(events[0]?.usage_source).toBe("response_body");
    });
  });

  it("falls back to OpenRouter generation usage when the response has no usage", async () => {
    await withProxy(
      { delayMs: 0, streamed: false, includeUsage: false, status: 200, generationId: "gen-test" },
      async (baseUrl, eventsPath, flush) => {
        const res = await fetch(`${baseUrl}/v1/chat/completions`, {
          method: "POST",
          headers: { authorization: "Bearer sk-or-test" },
          body: JSON.stringify({ model: "test-model", messages: [] }),
        });
        expect(res.status).toBe(200);
        await flush();
        const events = await loadEvents(eventsPath);
        expect(events[0]?.usage).toEqual({ input: 20, cached_input: 8, output: 5, reasoning_output: 2 });
        expect(events[0]?.usage_source).toBe("generation_lookup");
      },
    );
  });

  it("pins upstream and generation-lookup authorization to the runner credential", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-proxy-credential-broker-"));
    const eventsPath = join(dir, "events.jsonl");
    const seen: string[] = [];
    const upstream = createServer((req, res) => {
      seen.push(req.headers.authorization ?? "");
      if (req.url?.startsWith("/api/v1/generation")) {
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ data: { tokens_prompt: 20, tokens_cached: 8, tokens_completion: 5, tokens_reasoning: 2 } }));
        return;
      }
      req.resume();
      req.once("end", () => {
        res.setHeader("content-type", "application/json");
        res.setHeader("x-generation-id", "gen-broker");
        res.end(JSON.stringify({ id: "response-without-usage", choices: [] }));
      });
    });
    await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", () => resolve()));
    const address = upstream.address();
    if (!address || typeof address === "string") throw new Error("upstream did not bind");
    const proxy = await startProxy({
      run_id: "credential-broker",
      upstream: `http://127.0.0.1:${address.port}`,
      upstreamApiKey: "sk-or-runner-owned",
      outPath: eventsPath,
    });
    try {
      const response = await fetch(`${proxy.baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { authorization: "Bearer attacker-supplied" },
        body: JSON.stringify({ model: "test-model", messages: [] }),
      });
      expect(response.status).toBe(200);
      await proxy.flush();
      expect(seen).toEqual(["Bearer sk-or-runner-owned", "Bearer sk-or-runner-owned"]);
    } finally {
      await proxy.close();
      await new Promise<void>((resolve, reject) => upstream.close((error) => error ? reject(error) : resolve()));
    }
  });

  it("requires the per-cell token and refuses unapproved paths", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-proxy-capability-"));
    const eventsPath = join(dir, "events.jsonl");
    let upstreamRequests = 0;
    let forwardedToken: string | undefined;
    let forwardedAlternateAuth: string | undefined;
    const upstream = createServer((req, res) => {
      upstreamRequests += 1;
      const token = req.headers["x-aob-proxy-token"];
      const alternate = req.headers["x-api-key"];
      forwardedToken = Array.isArray(token) ? token[0] : token;
      forwardedAlternateAuth = Array.isArray(alternate) ? alternate[0] : alternate;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ choices: [] }));
    });
    await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", () => resolve()));
    const address = upstream.address();
    if (!address || typeof address === "string") throw new Error("upstream did not bind");
    const proxy = await startProxy({
      run_id: "capability-boundary",
      upstream: `http://127.0.0.1:${address.port}`,
      upstreamApiKey: "sk-or-runner-owned",
      authToken: "cell-token-012345678901234567890123456789",
      outPath: eventsPath,
      host: "0.0.0.0",
    });
    try {
      const missing = await fetch(`${proxy.baseUrl}/v1/chat/completions`, { method: "POST", body: "{}" });
      expect(missing.status).toBe(403);
      const wrong = await fetch(`${proxy.baseUrl}/v1/chat/completions`, {
        method: "POST", headers: { "x-aob-proxy-token": "wrong" }, body: "{}",
      });
      expect(wrong.status).toBe(403);
      const forbidden = await fetch(`${proxy.baseUrl}/v1/admin`, {
        headers: { "x-aob-proxy-token": "cell-token-012345678901234567890123456789" },
      });
      expect(forbidden.status).toBe(404);
      const allowed = await fetch(`${proxy.baseUrl}/v1/chat/completions`, {
        method: "POST", headers: {
          "x-aob-proxy-token": "cell-token-012345678901234567890123456789",
          "x-api-key": "attacker-alternate",
        }, body: "{}",
      });
      expect(allowed.status).toBe(200);
      expect(upstreamRequests).toBe(1);
      expect(forwardedToken).toBeUndefined();
      expect(forwardedAlternateAuth).toBeUndefined();
    } finally {
      await proxy.close();
      await new Promise<void>((resolve, reject) => upstream.close((error) => error ? reject(error) : resolve()));
    }
  });

  it("uses the versioned generation path when the upstream is OpenRouter's API root", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-proxy-openrouter-root-"));
    const eventsPath = join(dir, "events.jsonl");
    const mock = await startMockUpstream({ delayMs: 0, streamed: false, includeUsage: false, status: 200, generationId: "gen-root" });
    const proxy = await startProxy({ run_id: "root-path", upstream: `${mock.baseUrl}/api`, outPath: eventsPath });
    try {
      const res = await fetch(`${proxy.baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { authorization: "Bearer sk-or-test" },
        body: JSON.stringify({ model: "test-model", messages: [] }),
      });
      expect(res.status).toBe(200);
      await proxy.flush();
      const events = await loadEvents(eventsPath);
      expect(events[0]?.usage_source).toBe("generation_lookup");
      expect(events[0]?.usage?.input).toBe(20);
    } finally {
      await proxy.close();
      await mock.close();
    }
  });

  it("records timestamps within ±10 ms of mock delay", async () => {
    const delayMs = 80;
    await withProxy({ delayMs, streamed: false, includeUsage: true, status: 200 }, async (baseUrl, eventsPath) => {
      const t0 = performance.now();
      await fetch(`${baseUrl}/v1/chat/completions`, { method: "POST", body: "{}" });
      const wall = performance.now() - t0;
      expect(wall).toBeGreaterThanOrEqual(delayMs - 10);
      const events = await loadEvents(eventsPath);
      const e = events[0];
      expect(e).toBeDefined();
      if (!e) return;
      const modelSpan = e.t_last_byte - e.t_upstream_sent;
      expect(modelSpan).toBeGreaterThanOrEqual(delayMs - 10);
      expect(modelSpan).toBeLessThanOrEqual(delayMs + 10);
    });
  });

  it("propagates 429/500 unmodified", async () => {
    await withProxy({ delayMs: 0, streamed: false, includeUsage: false, status: 429 }, async (baseUrl, eventsPath, flush) => {
      const res = await fetch(`${baseUrl}/v1/chat/completions`, { method: "POST", body: "{}" });
      expect(res.status).toBe(429);
      await flush();
      const events = await loadEvents(eventsPath);
      expect(events[0]?.status).toBe(429);
      expect(events[0]?.usage).toBeNull();
      expect(events[0]?.usage_source).toBe("unavailable");
      expect(events[0]?.error).toEqual({ kind: "upstream_http", detail: "status 429" });
    });
  });

  it("records ten overlapping concurrent requests", async () => {
    await withProxy({ delayMs: 40, streamed: false, includeUsage: true, status: 200 }, async (baseUrl, eventsPath, flush) => {
      await Promise.all(
        Array.from({ length: 10 }, () =>
          fetch(`${baseUrl}/v1/chat/completions`, { method: "POST", body: "{}" }),
        ),
      );
      await flush();
      const events = await loadEvents(eventsPath);
      expect(events).toHaveLength(10);
      const sorted = [...events].sort((a, b) => a.t_req_start - b.t_req_start);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      expect(first && last).toBeTruthy();
      if (!first || !last) return;
      expect(last.t_req_start).toBeLessThan(first.t_last_byte);
      const seqs = new Set(events.map((e) => e.seq));
      expect(seqs.size).toBe(10);
    });
  });

  it("passes gzip bodies through without decompressing", async () => {
    const { gzipSync } = await import("node:zlib");
    const payload = gzipSync(Buffer.from('{"ok":true}'));
    const server = createServer((req, res) => {
      req.resume();
      req.on("end", () => {
        res.writeHead(200, { "content-type": "application/json", "content-encoding": "gzip" });
        res.end(payload);
      });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    const addr = server.address();
    if (!addr || typeof addr === "string") throw new Error("bind");
    const dir = await mkdtemp(join(tmpdir(), "aob-gz-"));
    const proxy = await startProxy({
      run_id: "gz",
      upstream: `http://127.0.0.1:${addr.port}`,
      outPath: join(dir, "events.jsonl"),
    });
    try {
      const { request } = await import("undici");
      const res = await request(`${proxy.baseUrl}/v1/chat/completions`, {
        method: "POST",
        body: "{}",
        headers: { "accept-encoding": "identity" },
      });
      const buf = Buffer.from(await res.body.arrayBuffer());
      expect(buf.equals(payload)).toBe(true);
      const gunzipped: Buffer[] = [];
      await pipeline(Readable.from(buf), createGunzip(), async (src) => {
        for await (const c of src) gunzipped.push(c as Buffer);
      });
      expect(Buffer.concat(gunzipped).toString()).toBe('{"ok":true}');
    } finally {
      await proxy.close();
      await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
    }
  });

  it("forwards a slow-trickle SSE body in order and spans first-to-last byte", async () => {
    await withProxy(
      { delayMs: 0, streamed: true, includeUsage: true, status: 200, trickleMs: 25 },
      async (baseUrl, eventsPath) => {
        const t0 = performance.now();
        const res = await fetch(`${baseUrl}/v1/chat/completions`, { method: "POST", body: "{}" });
        const text = await res.text();
        const elapsed = performance.now() - t0;
        expect(text).toContain("data:");
        expect(text).toContain("[DONE]");
        expect(text.indexOf("ok")).toBeLessThan(text.indexOf("[DONE]"));
        expect(elapsed).toBeGreaterThanOrEqual(40);
        const events = await loadEvents(eventsPath);
        expect(events[0]?.streamed).toBe(true);
        expect((events[0]?.t_last_byte ?? 0) - (events[0]?.t_first_byte ?? 0)).toBeGreaterThanOrEqual(20);
      },
    );
  });

  it("records a well-formed C1 event when the client disconnects early", async () => {
    await withProxy(
      { delayMs: 0, streamed: true, includeUsage: true, status: 200, trickleMs: 40 },
      async (baseUrl, eventsPath) => {
        const { request } = await import("undici");
        const res = await request(`${baseUrl}/v1/chat/completions`, {
          method: "POST",
          body: "{}",
        });
        for await (const _chunk of res.body) {
          res.body.destroy();
          break;
        }
        await new Promise((r) => setTimeout(r, 250));
        const events = await loadEvents(eventsPath);
        expect(events.length).toBeGreaterThanOrEqual(1);
        expect(events[0]?.run_id).toBe("test-run");
        expect(typeof events[0]?.t_req_start).toBe("number");
      },
    );
  });

  it("forwards an incoming body above the capture limit and records unknown model", async () => {
    await withProxy({ delayMs: 0, streamed: false, includeUsage: true, status: 200 }, async (baseUrl, eventsPath, flush) => {
      const body = Buffer.alloc(16 * 1024 * 1024 + 1, 0x78);
      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body,
      });
      expect(res.status).toBe(200);
      await flush();
      const events = await loadEvents(eventsPath);
      expect(events).toHaveLength(1);
      expect(events[0]?.status).toBe(200);
      expect(events[0]?.model_requested).toBeNull();
      expect(events[0]?.error).toBeNull();
    });
  });
});

describe("upstream path normalization", () => {
  it("does not double the /api prefix when the upstream is already OpenRouter's API root", async () => {
    // The official launcher supplies `https://openrouter.ai/api`. An agent that
    // asks for `/api/v1/models` (the origin-root convention) was forwarded to
    // `.../api/api/v1/models` and got a 404, which the run then measured as
    // agent overhead. Verified against the real service: `/api/v1/models`
    // answers 200 and the doubled path answers 404.
    const seen: string[] = [];
    const upstream = createServer((req, res) => {
      seen.push(req.url ?? "");
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ data: [] }));
    });
    await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
    const address = upstream.address();
    if (address === null || typeof address === "string") throw new Error("no upstream address");

    const dir = await mkdtemp(join(tmpdir(), "aob-proxy-prefix-"));
    const eventsPath = join(dir, "events.jsonl");
    const proxy = await startProxy({
      run_id: "prefix-run",
      upstream: `http://127.0.0.1:${address.port}/api`,
      outPath: eventsPath,
    });
    try {
      const viaApiRoot = await fetch(`${proxy.baseUrl}/api/v1/models`);
      expect(viaApiRoot.status).toBe(200);
      const viaVersioned = await fetch(`${proxy.baseUrl}/v1/models`);
      expect(viaVersioned.status).toBe(200);
    } finally {
      await proxy.close();
      await new Promise<void>((resolve) => upstream.close(() => resolve()));
    }

    // Both conventions must reach the same upstream path exactly once.
    expect(seen).toEqual(["/api/v1/models", "/api/v1/models"]);
  });
});

describe("generation lookup fallback", () => {
  it("recovers usage when a streamed body carries none", async () => {
    // Half of requests over 60s lose body usage, and an unpriced successful
    // request trips the runner's recorded-spend cap, aborting the run before
    // the second CLI. This fallback is the only thing standing between that
    // and an aborted calibration, so exercise the whole proxy path.
    let lookups = 0;
    const upstream = createServer((req, res) => {
      if ((req.url ?? "").startsWith("/api/v1/generation")) {
        lookups += 1;
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ data: {
          tokens_prompt: 7,
          native_tokens_prompt: 2_398_346,
          native_tokens_cached: 2_312_288,
          tokens_completion: 3,
          native_tokens_completion: 21_210,
          native_tokens_reasoning: 0,
        } }));
        return;
      }
      // A streamed completion that never emits a usage block.
      res.writeHead(200, { "content-type": "text/event-stream", "x-generation-id": "gen-test-1" });
      res.write('data: {"choices":[{"delta":{"content":"hi"}}]}\n\n');
      res.end("data: [DONE]\n\n");
    });
    await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
    const address = upstream.address();
    if (address === null || typeof address === "string") throw new Error("no upstream address");

    const dir = await mkdtemp(join(tmpdir(), "aob-proxy-genlookup-"));
    const eventsPath = join(dir, "events.jsonl");
    const proxy = await startProxy({
      run_id: "genlookup-run",
      upstream: `http://127.0.0.1:${address.port}/api`,
      outPath: eventsPath,
      upstreamApiKey: "sk-or-test",
    });
    try {
      const response = await fetch(`${proxy.baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: "z-ai/glm-5.3-flash", messages: [{ role: "user", content: "hi" }], stream: true }),
      });
      expect(response.status).toBe(200);
      await response.text();
      await proxy.flush();
    } finally {
      await proxy.close();
      await new Promise<void>((resolve) => upstream.close(() => resolve()));
    }

    const events = await loadEvents(eventsPath);
    const post = events.find((event) => event.method === "POST");
    expect(post).toBeDefined();
    expect(lookups).toBe(1);
    expect(post!.usage_source).toBe("generation_lookup");
    expect(post!.usage_lookup).toBe("recovered");
    expect(post!.usage).toEqual({ input: 2_398_346, cached_input: 2_312_288, output: 21_210, reasoning_output: 0 });
  });

  it("records why a lookup failed instead of only saying unavailable", async () => {
    const upstream = createServer((req, res) => {
      if ((req.url ?? "").startsWith("/api/v1/generation")) {
        res.writeHead(500, { "content-type": "application/json" });
        res.end("{}");
        return;
      }
      // No x-generation-id on the first request, a failing lookup on the second.
      const withId = (req.headers["x-aob-test-id"] ?? "") === "yes";
      res.writeHead(200, {
        "content-type": "text/event-stream",
        ...(withId ? { "x-generation-id": "gen-test-2" } : {}),
      });
      res.end('data: {"choices":[{"delta":{"content":"hi"}}]}\n\ndata: [DONE]\n\n');
    });
    await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
    const address = upstream.address();
    if (address === null || typeof address === "string") throw new Error("no upstream address");

    const dir = await mkdtemp(join(tmpdir(), "aob-proxy-lookupfail-"));
    const eventsPath = join(dir, "events.jsonl");
    const proxy = await startProxy({
      run_id: "lookupfail-run",
      upstream: `http://127.0.0.1:${address.port}/api`,
      outPath: eventsPath,
      upstreamApiKey: "sk-or-test",
    });
    try {
      for (const withId of [false, true]) {
        const response = await fetch(`${proxy.baseUrl}/v1/chat/completions`, {
          method: "POST",
          headers: { "content-type": "application/json", ...(withId ? { "x-aob-test-id": "yes" } : {}) },
          body: JSON.stringify({ model: "z-ai/glm-5.3-flash", messages: [{ role: "user", content: "hi" }], stream: true }),
        });
        await response.text();
      }
      await proxy.flush();
    } finally {
      await proxy.close();
      await new Promise<void>((resolve) => upstream.close(() => resolve()));
    }

    const posts = (await loadEvents(eventsPath)).filter((event) => event.method === "POST");
    expect(posts).toHaveLength(2);
    expect(posts.map((event) => event.usage_source)).toEqual(["unavailable", "unavailable"]);
    expect(posts.map((event) => event.usage_lookup)).toEqual(["missing_generation_id", "http_error"]);
  });
});

describe("refused requests", () => {
  it("records an event so the sequence stays contiguous and the refusal is visible", async () => {
    // A refused request used to consume a sequence number and write nothing.
    // That left a gap that fails the report loader outright ("C1 event
    // sequence has a gap or duplicate"), and it hid harness-attributable
    // overhead: the agent made a call and the harness, not the provider,
    // refused it.
    const upstream = createServer((_req, res) => {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true }));
    });
    await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
    const address = upstream.address();
    if (address === null || typeof address === "string") throw new Error("no upstream address");

    const dir = await mkdtemp(join(tmpdir(), "aob-proxy-refused-"));
    const eventsPath = join(dir, "events.jsonl");
    const proxy = await startProxy({
      run_id: "refused-run",
      upstream: `http://127.0.0.1:${address.port}/api`,
      outPath: eventsPath,
    });
    try {
      expect((await fetch(`${proxy.baseUrl}/v1/models`)).status).toBe(200);
      expect((await fetch(`${proxy.baseUrl}/definitely/not/allowed`)).status).toBe(404);
      expect((await fetch(`${proxy.baseUrl}/v1/models`)).status).toBe(200);
      await proxy.flush();
    } finally {
      await proxy.close();
      await new Promise<void>((resolve) => upstream.close(() => resolve()));
    }

    const events = await loadEvents(eventsPath);
    expect(events.map((event) => event.seq)).toEqual([0, 1, 2]);
    const refused = events[1]!;
    expect(refused.status).toBe(404);
    expect(refused.path).toBe("/definitely/not/allowed");
    expect(refused.error?.kind).toBe("proxy_refused");
    // A refused non-model path must not be mistaken for a model turn.
    expect(refused.protocol).toBe("unknown");
    expect(refused.usage).toBeNull();
  });
});

describe("model metadata paths", () => {
  it("allows read-only model lookups and still refuses everything else", async () => {
    // Agents look up the pinned model's metadata at /v1/models/{id}. Model ids
    // contain slashes, so exact-match allowlisting refused them and the 404
    // plus retry was measured as agent overhead. Same class as the
    // /api/v1/models path-doubling defect.
    const seen: string[] = [];
    const upstream = createServer((req, res) => {
      seen.push(req.url ?? "");
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ data: {} }));
    });
    await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
    const address = upstream.address();
    if (address === null || typeof address === "string") throw new Error("no upstream address");

    const dir = await mkdtemp(join(tmpdir(), "aob-proxy-modelmeta-"));
    const proxy = await startProxy({
      run_id: "modelmeta-run",
      upstream: `http://127.0.0.1:${address.port}/api`,
      outPath: join(dir, "events.jsonl"),
    });
    try {
      expect((await fetch(`${proxy.baseUrl}/v1/models/z-ai/glm-5.3-flash`)).status).toBe(200);
      expect((await fetch(`${proxy.baseUrl}/api/v1/models/z-ai/glm-5.3-flash`)).status).toBe(200);
      // Still tightly scoped: only GET, and only under the models prefix.
      expect((await fetch(`${proxy.baseUrl}/v1/models/x`, { method: "POST" })).status).toBe(404);
      expect((await fetch(`${proxy.baseUrl}/v1/modelsx/y`)).status).toBe(404);
      expect((await fetch(`${proxy.baseUrl}/v1/keys/secret`)).status).toBe(404);
      await proxy.flush();
    } finally {
      await proxy.close();
      await new Promise<void>((resolve) => upstream.close(() => resolve()));
    }
    // Both conventions reach the same upstream path, undoubled.
    expect(seen).toEqual(["/api/v1/models/z-ai/glm-5.3-flash", "/api/v1/models/z-ai/glm-5.3-flash"]);
  });
});

describe("anthropic messages route", () => {
  it("records nullable-cache Messages body usage without falling back to generation lookup", async () => {
    const seen: string[] = [];
    const wire = [
      { type: "message_start", message: { id: "gen-null-cache-fixture", model: "z-ai/glm-5.3-flash", usage: {
        input_tokens: 0, output_tokens: 0, cache_read_input_tokens: null, cache_creation_input_tokens: null,
      } } },
      { type: "message_delta", usage: { input_tokens: 16, output_tokens: 16,
        cache_read_input_tokens: 0, cache_creation_input_tokens: null,
        output_tokens_details: { thinking_tokens: 14 },
      } },
      { type: "message_stop" },
    ].map((payload) => `data: ${JSON.stringify(payload)}\n\n`).join("");
    const upstream = createServer((req, res) => {
      seen.push(req.url ?? "");
      if (req.method !== "POST") { res.writeHead(404); res.end("{}"); return; }
      res.writeHead(200, { "content-type": "text/event-stream" });
      res.write(wire.slice(0, 13));
      res.end(wire.slice(13));
    });
    await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
    const address = upstream.address();
    if (address === null || typeof address === "string") throw new Error("no upstream address");
    const dir = await mkdtemp(join(tmpdir(), "aob-proxy-null-cache-"));
    const outPath = join(dir, "events.jsonl");
    const proxy = await startProxy({ run_id: "null-cache-run", upstream: `http://127.0.0.1:${address.port}/api`,
      upstreamApiKey: "test-upstream-token", outPath });
    try {
      const response = await fetch(`${proxy.baseUrl}/v1/messages?beta=true`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: "z-ai/glm-5.3-flash", stream: true, max_tokens: 16, messages: [] }),
      });
      expect(response.status).toBe(200);
      expect(await response.text()).toBe(wire);
      await proxy.flush();
      const events = await loadEvents(outPath);
      expect(events).toHaveLength(1);
      expect(events[0]?.usage).toEqual({ input: 16, cached_input: 0, output: 16, reasoning_output: 14 });
      expect(events[0]?.usage_source).toBe("response_body");
      expect(events[0]?.usage_lookup).toBe("not_attempted");
      expect(seen).toEqual(["/api/v1/messages?beta=true"]);
    } finally {
      await proxy.close();
      await new Promise<void>((resolve) => upstream.close(() => resolve()));
    }
  });

  it("allows POST /v1/messages as well as the bare /messages form", async () => {
    // OpenRouter now serves the pinned model over Anthropic Messages, and a
    // client given an origin-style base URL appends /v1/messages. Only the
    // bare "/messages" form was allowlisted, so that request was refused by
    // the harness rather than measured.
    const seen: string[] = [];
    const upstream = createServer((req, res) => {
      seen.push(req.url ?? "");
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ type: "message" }));
    });
    await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
    const address = upstream.address();
    if (address === null || typeof address === "string") throw new Error("no upstream address");

    const dir = await mkdtemp(join(tmpdir(), "aob-proxy-anthropic-"));
    const proxy = await startProxy({
      run_id: "anthropic-run",
      upstream: `http://127.0.0.1:${address.port}/api`,
      outPath: join(dir, "events.jsonl"),
    });
    try {
      const post = (path: string) => fetch(`${proxy.baseUrl}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: "z-ai/glm-5.3-flash", max_tokens: 4, messages: [] }),
      });
      expect((await post("/v1/messages")).status).toBe(200);
      expect((await post("/v1/messages?beta=true")).status).toBe(200);
      expect((await post("/messages")).status).toBe(200);
      await proxy.flush();
    } finally {
      await proxy.close();
      await new Promise<void>((resolve) => upstream.close(() => resolve()));
    }

    const events = await loadEvents(join(dir, "events.jsonl"));
    // Anthropic requests must be recognised as model attempts, not unknown traffic.
    expect(events.every((event) => event.protocol === "anthropic_messages")).toBe(true);
    expect(seen).toEqual(["/api/v1/messages", "/api/v1/messages?beta=true", "/api/messages"]);
  });
});
