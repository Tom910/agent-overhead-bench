import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { ConfigError } from "@aob/contracts";

export type MockUpstreamOptions = {
  host: string;
  delayMs: number;
  status: number;
  streamed: boolean;
  includeUsage: boolean;
  servedModel: string;
  trickleMs: number;
  generationId?: string;
};

const defaults: MockUpstreamOptions = {
  host: "127.0.0.1",
  delayMs: 0,
  status: 200,
  streamed: false,
  includeUsage: true,
  servedModel: "mock-served",
  trickleMs: 0,
};

function jsonBody(includeUsage: boolean, servedModel: string): string {
  const body: Record<string, unknown> = {
    id: "mock-1",
    object: "chat.completion",
    model: servedModel,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: "ok" },
        finish_reason: "stop",
      },
    ],
  };
  if (includeUsage) {
    body.usage = {
      prompt_tokens: 12,
      completion_tokens: 3,
      total_tokens: 15,
      prompt_tokens_details: { cached_tokens: 0 },
    };
  }
  return JSON.stringify(body);
}

function sseBody(includeUsage: boolean, servedModel: string): string {
  const delta = `data: ${JSON.stringify({
    id: "mock-1",
    object: "chat.completion.chunk",
    model: servedModel,
    choices: [{ index: 0, delta: { content: "ok" }, finish_reason: null }],
  })}\n\n`;
  const tail = includeUsage
    ? `data: ${JSON.stringify({
        id: "mock-1",
        object: "chat.completion.chunk",
        model: servedModel,
        choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
        usage: {
          prompt_tokens: 12,
          completion_tokens: 3,
          total_tokens: 15,
          prompt_tokens_details: { cached_tokens: 0 },
        },
      })}\n\n`
    : "";
  return `${delta}${tail}data: [DONE]\n\n`;
}

function writeTrickle(res: ServerResponse, payload: string, trickleMs: number): void {
  const parts = payload.split("\n\n").filter((p) => p.length > 0).map((p) => `${p}\n\n`);
  const next = (i: number) => {
    if (res.destroyed) return;
    if (i >= parts.length) {
      res.end();
      return;
    }
    res.write(parts[i]);
    setTimeout(() => next(i + 1), trickleMs);
  };
  next(0);
}

export async function startMockUpstream(
  opts?: Partial<MockUpstreamOptions>,
): Promise<{ baseUrl: string; close: () => Promise<void> }> {
  const cfg = { ...defaults, ...opts };

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    if (req.url?.startsWith("/api/v1/generation") || req.url?.startsWith("/v1/generation")) {
      const id = new URL(req.url, "http://mock-upstream").searchParams.get("id");
      if (cfg.generationId === undefined || id !== cfg.generationId) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "generation not found" }));
        return;
      }
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({
        data: {
          id,
          tokens_prompt: 20,
          tokens_cached: 8,
          tokens_completion: 5,
          tokens_reasoning: 2,
        },
      }));
      return;
    }
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => {
      chunks.push(c);
    });
    req.on("end", () => {
      setTimeout(() => {
        if (cfg.status !== 200) {
          res.statusCode = cfg.status;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ error: { message: `mock ${cfg.status}` } }));
          return;
        }
        if (cfg.streamed) {
          res.statusCode = 200;
          res.setHeader("content-type", "text/event-stream");
          if (cfg.generationId !== undefined) res.setHeader("x-generation-id", cfg.generationId);
          const payload = sseBody(cfg.includeUsage, cfg.servedModel);
          if (cfg.trickleMs > 0) {
            writeTrickle(res, payload, cfg.trickleMs);
            return;
          }
          res.end(payload);
          return;
        }
        res.statusCode = 200;
        res.setHeader("content-type", "application/json");
        if (cfg.generationId !== undefined) res.setHeader("x-generation-id", cfg.generationId);
        res.end(jsonBody(cfg.includeUsage, cfg.servedModel));
      }, cfg.delayMs);
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(0, cfg.host, () => resolve());
  });
  const addr = server.address();
  if (!addr || typeof addr === "string") {
    throw new ConfigError("mock-upstream failed to bind");
  }
  return {
    baseUrl: `http://127.0.0.1:${addr.port}`,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
