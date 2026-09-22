import { createServer } from "node:http";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { C1Event } from "@aob/contracts";
import { describe, expect, it } from "vitest";
import { startProxy } from "./proxy.js";

const limit = 2 * 1024 * 1024;
const chatUsage = { prompt_tokens: 23_281, completion_tokens: 7_484,
  prompt_tokens_details: { cached_tokens: 22_592 }, completion_tokens_details: { reasoning_tokens: 7_364 } };
const normalized = { input: 23_281, cached_input: 22_592, output: 7_484, reasoning_output: 7_364 };
const sse = (value: unknown) => `data: ${JSON.stringify(value)}\n\n`;
const finalChat = sse({ model: "served-model", choices: [], usage: chatUsage });
const filler = sse({ choices: [{ delta: { content: "x".repeat(512) } }] }).repeat(4_096);

async function recordResponse(body: string, path = "/v1/chat/completions", contentType = "text/event-stream"): Promise<C1Event> {
  const root = await mkdtemp(join(tmpdir(), "aob-response-metadata-"));
  const eventsPath = join(root, "events.jsonl");
  const upstream = createServer((req, res) => {
    req.resume();
    req.once("end", () => {
      res.writeHead(200, { "content-type": contentType });
      res.end(body);
    });
  });
  await new Promise<void>((resolve) => upstream.listen(0, "127.0.0.1", resolve));
  const address = upstream.address();
  if (address === null || typeof address === "string") throw new Error("local upstream did not bind");
  const proxy = await startProxy({ run_id: "metadata-test", upstream: `http://127.0.0.1:${address.port}`, outPath: eventsPath });
  try {
    const response = await fetch(`${proxy.baseUrl}${path}`, { method: "POST", body: JSON.stringify({ model: "requested-model" }) });
    expect(Buffer.from(await response.arrayBuffer()).equals(Buffer.from(body))).toBe(true);
    await proxy.flush();
    return JSON.parse((await readFile(eventsPath, "utf8")).trim()) as C1Event;
  } finally {
    await proxy.close();
    await new Promise<void>((resolve) => upstream.close(() => resolve()));
    await rm(root, { recursive: true, force: true });
  }
}

describe("bounded response metadata on the live proxy path", () => {
  it("records final Chat usage after more than 2 MiB of small SSE events without a lookup", async () => {
    expect(Buffer.byteLength(filler)).toBeGreaterThan(limit);
    const event = await recordResponse(filler + finalChat + "data: [DONE]\n\n");
    expect(event.usage).toEqual(normalized);
    expect(event.usage_source).toBe("response_body");
    expect(event.usage_lookup).toBe("not_attempted");
    expect(event.model_served).toBe("served-model");
  });

  it("records nested Responses model and final usage after a long stream", async () => {
    const event = await recordResponse(filler + sse({ type: "response.completed", response: { model: "responses-served", usage: {
      input_tokens: 80, output_tokens: 9, input_tokens_details: { cached_tokens: 16 }, output_tokens_details: { reasoning_tokens: 3 },
    } } }), "/v1/responses");
    expect(event.model_served).toBe("responses-served");
    expect(event.usage).toEqual({ input: 80, cached_input: 16, output: 9, reasoning_output: 3 });
    expect(event.usage_lookup).toBe("not_attempted");
  });

  it("combines Anthropic input/cache metadata with cumulative output counters without summing deltas", async () => {
    const event = await recordResponse(sse({ type: "message_start", message: { model: "anthropic-served", usage: {
      input_tokens: 10, output_tokens: 0, cache_read_input_tokens: 20, cache_creation_input_tokens: 5,
    } } }) + filler + sse({ type: "message_delta", usage: { output_tokens: 43 } })
      + sse({ type: "message_delta", usage: { output_tokens: 49 } }) + sse({ type: "message_stop" }), "/v1/messages");
    expect(event.model_served).toBe("anthropic-served");
    expect(event.usage).toEqual({ input: 35, cached_input: 20, output: 49, reasoning_output: 0 });
    expect(event.usage_lookup).toBe("not_attempted");
  });

  it.each(["malformed", "oversized", "incomplete usage", "unfinished"])("never reuses earlier usage after a later %s event", async (kind) => {
    const bad = kind === "malformed" ? 'data: {"usage":broken}\n\n'
      : kind === "oversized" ? sse({ usage: { prompt_tokens: 1 }, content: "x".repeat(limit) })
      : kind === "unfinished" ? 'data: {"usage":'
      : sse({ usage: { prompt_tokens: 1 } });
    const event = await recordResponse(finalChat + bad);
    expect(event.usage).toBeNull();
    expect(event.usage_source).toBe("unavailable");
  });

  it("resynchronizes after an oversized event and accepts a later complete final usage event", async () => {
    const event = await recordResponse(sse({ choices: [{ delta: { content: "x".repeat(limit + 1) } }] }) + finalChat);
    expect(event.usage).toEqual(normalized);
    expect(event.usage_source).toBe("response_body");
  });

  it("does not report Anthropic start counters as a completed response", async () => {
    const event = await recordResponse(sse({ type: "message_start", message: { model: "anthropic-served", usage: {
      input_tokens: 10, output_tokens: 0,
    } } }) + sse({ type: "message_delta", usage: { output_tokens: "bad" } }), "/v1/messages");
    expect(event.usage).toBeNull();
    expect(event.model_served).toBe("anthropic-served");
  });

  it("keeps oversized non-stream JSON unavailable while forwarding it unchanged", async () => {
    const event = await recordResponse(JSON.stringify({ model: "served-model", content: "x".repeat(limit), usage: chatUsage }),
      "/v1/chat/completions", "application/json");
    expect(event.usage).toBeNull();
    expect(event.model_served).toBeNull();
  });

  it("retains small JSON usage and nested Responses served-model identity", async () => {
    const event = await recordResponse(JSON.stringify({ response: { model: "responses-served", usage: { input_tokens: 8, output_tokens: 3 } } }),
      "/v1/responses", "application/json");
    expect(event.usage).toEqual({ input: 8, cached_input: 0, output: 3, reasoning_output: 0 });
    expect(event.model_served).toBe("responses-served");
  });
});

describe("provider identity on real proxy HTTP streams", () => {
  it.each([undefined, "different-model"])("does not inherit an early Responses model when terminal is %j", async model => {
    const event = await recordResponse(sse({ type: "response.created", response: { model: "gpt-6-luna" } }) + sse({ type: "response.completed", response: { model, usage: { input_tokens: 20, output_tokens: 5 } } }), "/v1/responses");
    expect(event.model_served).toBeNull();
    expect(event.usage).toEqual({ input: 20, cached_input: 0, output: 5, reasoning_output: 0 });
    expect(event.model_requested).toBe("requested-model");
  });
});
