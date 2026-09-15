import { describe, expect, it } from "vitest";
import { startMockUpstream } from "./index.js";

describe("mock-upstream", () => {
  it("serves a non-stream JSON completion after delayMs", async () => {
    const { baseUrl, close } = await startMockUpstream({
      delayMs: 50,
      status: 200,
      streamed: false,
      includeUsage: true,
    });
    try {
      const t0 = performance.now();
      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: "test", messages: [] }),
      });
      const elapsed = performance.now() - t0;
      expect(res.status).toBe(200);
      expect(elapsed).toBeGreaterThanOrEqual(40);
      const body = (await res.json()) as { usage: { prompt_tokens: number } };
      expect(body.usage.prompt_tokens).toBeGreaterThan(0);
    } finally {
      await close();
    }
  });

  it("can omit usage and return 429", async () => {
    const { baseUrl, close } = await startMockUpstream({
      status: 429,
      includeUsage: false,
      streamed: false,
      delayMs: 0,
    });
    try {
      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        body: "{}",
      });
      expect(res.status).toBe(429);
      const text = await res.text();
      expect(text.includes("prompt_tokens")).toBe(false);
    } finally {
      await close();
    }
  });

  it("streams SSE data lines", async () => {
    const { baseUrl, close } = await startMockUpstream({
      streamed: true,
      includeUsage: true,
      delayMs: 0,
      status: 200,
    });
    try {
      const res = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: "POST",
        body: "{}",
      });
      expect(res.headers.get("content-type")).toContain("text/event-stream");
      const text = await res.text();
      expect(text).toContain("data:");
      expect(text).toContain("[DONE]");
    } finally {
      await close();
    }
  });

  it("returns 500 without usage when configured", async () => {
    const { baseUrl, close } = await startMockUpstream({
      status: 500,
      includeUsage: false,
      streamed: false,
      delayMs: 0,
    });
    try {
      const res = await fetch(`${baseUrl}/v1/chat/completions`, { method: "POST", body: "{}" });
      expect(res.status).toBe(500);
    } finally {
      await close();
    }
  });

  it("can bind on a host-reachable interface for Docker zero-spend tests", async () => {
    const { baseUrl, close } = await startMockUpstream({ host: "0.0.0.0", status: 200, streamed: false, includeUsage: true });
    try {
      expect(new URL(baseUrl).hostname).toBe("127.0.0.1");
      expect((await fetch(`${baseUrl}/v1/chat/completions`, { method: "POST", body: "{}" })).status).toBe(200);
    } finally {
      await close();
    }
  });
});
