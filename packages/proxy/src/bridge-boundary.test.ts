import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateC1Event } from "@aob/contracts";
import { expect, it } from "vitest";
import { startProxy, upstreamRequestPath, type ProxyOptions } from "./proxy.js";

async function boundary(options: Partial<ProxyOptions> = {}, responseStatus = 200) {
  const root = await mkdtemp(join(tmpdir(), "aob-boundary-"));
  const received: Array<{ path: string; body: string; authorization: string | undefined; capability: string | undefined }> = [];
  const upstream = createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    received.push({ path: req.url ?? "", body: Buffer.concat(chunks).toString("utf8"), authorization: req.headers.authorization, capability: req.headers["x-aob-proxy-token"] as string | undefined });
    res.writeHead(responseStatus, { "content-type": "application/json" });
    res.end(JSON.stringify({ model: "gpt-6-luna", usage: { input_tokens: 10, output_tokens: 2 } }));
  });
  await new Promise<void>(resolve => upstream.listen(0, "127.0.0.1", resolve));
  const address = upstream.address();
  if (!address || typeof address === "string") throw new Error("fixture failed to bind");
  const outPath = join(root, "events.jsonl");
  let proxy;
  try { proxy = await startProxy({ run_id: "bridge-boundary", upstream: `http://127.0.0.1:${address.port}/backend-api/codex`, outPath, ...options }); }
  catch (error) { upstream.closeAllConnections(); await new Promise<void>(resolve => upstream.close(() => resolve())); await rm(root, { recursive: true, force: true }); throw error; }
  return { proxy, root, outPath, received,
    post: async (body: string, path = "/responses", headers: Record<string, string> = {}) => {
      const response = await fetch(proxy.baseUrl + path, { method: "POST", headers, body }); await response.text(); return response.status;
    },
    events: async () => { await proxy.flush(); return (await readFile(outPath, "utf8")).trim().split("\n").map(line => validateC1Event(JSON.parse(line))); },
    close: async () => { await proxy.close(); upstream.closeAllConnections(); await new Promise<void>(resolve => upstream.close(() => resolve())); await rm(root, { recursive: true, force: true }); },
  };
}

it("forwards canonical /responses exactly onto the Codex root and strips only the private capability", async () => {
  const capability = "a".repeat(48);
  const fixture = await boundary({ authToken: capability });
  try {
    const body = '{ "model":"gpt-6-luna", "input": "keep bytes", "seed":9007199254740993 }';
    expect(await fixture.post(body, "/responses?probe=1", { "x-aob-proxy-token": capability, authorization: "Bearer synthetic-oauth" })).toBe(200);
    expect(fixture.received).toEqual([{ path: "/backend-api/codex/responses?probe=1", body, authorization: "Bearer synthetic-oauth", capability: undefined }]);
    const events = await fixture.events(); expect(events[0]).toMatchObject({ path: "/responses?probe=1", protocol: "openai_responses", model_requested: "gpt-6-luna", model_served: "gpt-6-luna" });
    expect(await readFile(`${fixture.outPath}.upstream.jsonl`, "utf8")).not.toMatch(/synthetic-oauth|aaaaaaaaaaaaaaaa/);
    expect(upstreamRequestPath("https://chatgpt.com/backend-api/codex", "/responses")).toBe("/responses");
    for (const path of ["/responses/other", "/responses-extra"]) expect(await fixture.post(body, path, { "x-aob-proxy-token": capability })).toBe(404);
    expect(fixture.received).toHaveLength(1);
  } finally { await fixture.close(); }
});

it("rejects invalid or ambiguous requested models before upstream traffic and preserves valid request bytes", async () => {
  const fixture = await boundary({ expectedModel: "gpt-6-luna" });
  try {
    const wrong = ['{}', '[]', '{', '{"model":null}', '{"model":"other"}', '{"model":"gpt-6-luna(low)"}', '{"model":"gpt-6-luna "}', '{"nested":{"model":"gpt-6-luna"}}', '{"model":"other","model":"gpt-6-luna"}', '{"model":"other","mo\\u0064el":"gpt-6-luna"}'];
    for (const path of ["/responses", "/v1/responses", "/v1/chat/completions"]) {
      for (const body of wrong) expect(await fixture.post(body, path)).toBe(400);
      const valid = '{"nested":{"model":"irrelevant"},"model":"gpt-6-luna","seed":9007199254740993}';
      expect(await fixture.post(valid, path)).toBe(200);
      expect(fixture.received.at(-1)?.body).toBe(valid);
    }
    expect(fixture.received).toHaveLength(3);
    expect(await fixture.post('{"model":"gpt-6-luna"}', "/responses", { "content-encoding": "gzip" })).toBe(400);
    expect(await fixture.post(' '.repeat(16 * 1024 * 1024 + 1))).toBe(413);
    expect(fixture.received).toHaveLength(3);
    const events = await fixture.events();
    expect(events.filter(value => value.error?.kind === "proxy_refused")).toHaveLength(wrong.length * 3 + 2);
    expect(events.every(value => value.status === 200 || value.usage === null)).toBe(true);
  } finally { await fixture.close(); }
});

it("retains provider routing while enforcing the exact requested model", async () => {
  const fixture = await boundary({ expectedModel: "gpt-6-luna", onlyProvider: "fixture/provider" });
  try {
    expect(await fixture.post('{"model":"different"}', "/v1/chat/completions")).toBe(400);
    expect(await fixture.post('{"model":"gpt-6-luna","seed":9007199254740993}', "/v1/chat/completions")).toBe(200);
    expect(fixture.received).toHaveLength(1);
    expect(fixture.received[0]?.body).toBe('{"model":"gpt-6-luna","seed":9007199254740993,"provider":{"only":["fixture/provider"],"allow_fallbacks":false}}');
  } finally { await fixture.close(); }
});

it("caps concurrent forwarded model requests without refunding upstream failures or counting pre-forward refusals", async () => {
  const capability = "b".repeat(48);
  const fixture = await boundary({ expectedModel: "gpt-6-luna", maxModelRequests: 2, authToken: capability }, 503);
  const headers = { "x-aob-proxy-token": capability };
  try {
    expect(await fixture.post('{"model":"gpt-6-luna"}')).toBe(403);
    expect(await fixture.post('{"model":"wrong"}', "/responses", headers)).toBe(400);
    const metadata = await fetch(fixture.proxy.baseUrl + "/v1/models", { headers }); await metadata.text();
    expect(fixture.received).toHaveLength(1);
    const statuses = await Promise.all(Array.from({ length: 6 }, () => fixture.post('{"model":"gpt-6-luna"}', "/responses", headers)));
    expect(statuses.filter(status => status === 503)).toHaveLength(2);
    expect(statuses.filter(status => status === 429)).toHaveLength(4);
    expect(fixture.received.filter(value => value.path.endsWith("/responses"))).toHaveLength(2);
    expect(await fixture.post('{"model":"gpt-6-luna"}', "/responses", headers)).toBe(429);
    const events = await fixture.events();
    expect(events.filter(value => value.status === 429)).toHaveLength(5);
    expect(events.filter(value => value.status === 429).every(value => value.error?.kind === "proxy_refused")).toBe(true);
  } finally { await fixture.close(); }
});

it("validates optional model and budget guards before opening proxy artifacts", async () => {
  for (const options of [{ expectedModel: "" }, { expectedModel: " gpt-6-luna" }, { maxModelRequests: 0 }, { maxModelRequests: -1 }, { maxModelRequests: 1.5 }, { maxModelRequests: Infinity }]) {
    let unexpectedlyAccepted: Awaited<ReturnType<typeof boundary>> | undefined;
    try { await expect(boundary(options).then(result => { unexpectedlyAccepted = result; return result; })).rejects.toThrow(); }
    finally { await unexpectedlyAccepted?.close(); }
  }
});
