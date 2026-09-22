import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { extractGenerationUsage, extractUsage, peekModel, peekServedModel } from "./usage.js";

const httpDir = join(dirname(fileURLToPath(import.meta.url)), "../../contracts/fixtures/http");

function sseFromPayloads(payloads: unknown[]): Buffer {
  const lines = payloads.map((p) =>
    p === "[DONE]" ? "data: [DONE]" : `data: ${JSON.stringify(p)}`,
  );
  return Buffer.from(`${lines.join("\n")}\n`);
}

describe("extractUsage S2 dialects", () => {
  it("reads non-stream JSON usage for Anthropic, Chat Completions, and Responses", () => {
    expect(extractUsage(
      "anthropic_messages",
      Buffer.from(JSON.stringify({ usage: {
        input_tokens: 10,
        cache_read_input_tokens: 20,
        cache_creation_input_tokens: 5,
        output_tokens: 2,
      } })),
      "application/json",
    )).toEqual({
      usage_source: "response_body",
      usage: { input: 35, cached_input: 20, output: 2, reasoning_output: 0 },
    });
    expect(extractUsage(
      "openai_chat",
      Buffer.from(JSON.stringify({ usage: {
        prompt_tokens: 80,
        completion_tokens: 9,
        prompt_tokens_details: { cached_tokens: 16 },
        completion_tokens_details: { reasoning_tokens: 3 },
      } })),
      "application/json",
    )).toEqual({
      usage_source: "response_body",
      usage: { input: 80, cached_input: 16, output: 9, reasoning_output: 3 },
    });
    expect(extractUsage(
      "openai_responses",
      Buffer.from(JSON.stringify({ response: { usage: {
        input_tokens: 40,
        output_tokens: 6,
        input_tokens_details: { cached_tokens: 4 },
      } } })),
      "application/json",
    )).toEqual({
      usage_source: "response_body",
      usage: { input: 40, cached_input: 4, output: 6, reasoning_output: 0 },
    });
  });

  it("reads Anthropic message_delta usage from the Claude Code stream fixture", () => {
    const raw = JSON.parse(readFileSync(join(httpDir, "claude-code-stream.json"), "utf8")) as {
      res_body: { sse_usage_bearing: unknown[] };
    };
    const body = sseFromPayloads(raw.res_body.sse_usage_bearing);
    const out = extractUsage("anthropic_messages", body, "text/event-stream");
    expect(out.usage_source).toBe("response_body");
    expect(out.usage).toEqual({
      input: 30664,
      cached_input: 30654,
      output: 266,
      reasoning_output: 0,
    });
  });

  it("accepts nullable Anthropic cache counters from the OpenRouter stream", () => {
    const body = sseFromPayloads([
      { type: "message_start", message: { model: "z-ai/glm-5.3-flash", usage: {
        input_tokens: 0, output_tokens: 0, output_tokens_details: null,
        cache_creation_input_tokens: null, cache_read_input_tokens: null,
      } } },
      { type: "message_delta", usage: { input_tokens: 16, output_tokens: 16,
        output_tokens_details: { thinking_tokens: 14 },
        cache_creation_input_tokens: null, cache_read_input_tokens: 0,
      } },
      { type: "message_stop" },
    ]);
    expect(extractUsage("anthropic_messages", body, "text/event-stream")).toEqual({
      usage_source: "response_body",
      usage: { input: 16, cached_input: 0, output: 16, reasoning_output: 14 },
    });
  });

  it("accepts nullable optional cache counters in an Anthropic JSON response", () => {
    const body = Buffer.from(JSON.stringify({ type: "message", usage: {
      input_tokens: 12, output_tokens: 18, cache_creation_input_tokens: null,
      cache_read_input_tokens: null, output_tokens_details: null,
    } }));
    expect(extractUsage("anthropic_messages", body, "application/json")).toEqual({
      usage_source: "response_body",
      usage: { input: 12, cached_input: 0, output: 18, reasoning_output: 0 },
    });
  });

  it("preserves observed Anthropic stream cache counts when a later delta nulls them", () => {
    const body = sseFromPayloads([
      { type: "message_start", message: { usage: { input_tokens: 10, output_tokens: 0,
        cache_read_input_tokens: 20, cache_creation_input_tokens: 5 } } },
      { type: "message_delta", usage: { output_tokens: 2,
        cache_read_input_tokens: null, cache_creation_input_tokens: null } },
    ]);
    expect(extractUsage("anthropic_messages", body, "text/event-stream").usage).toEqual({
      input: 35, cached_input: 20, output: 2, reasoning_output: 0,
    });
  });

  it.each([
    { input_tokens: null, output_tokens: 2 },
    { input_tokens: 10, output_tokens: null },
    { input_tokens: 10, output_tokens: 2, cache_read_input_tokens: -1 },
    { input_tokens: 10, output_tokens: 2, cache_creation_input_tokens: "0" },
  ])("still rejects incomplete or malformed Anthropic counters: %j", (usage) => {
    expect(extractUsage("anthropic_messages", Buffer.from(JSON.stringify({ usage })), "application/json").usage).toBeNull();
  });

  it("reads OpenAI chat usage from the Hermes stream fixture", () => {
    const raw = JSON.parse(readFileSync(join(httpDir, "hermes-stream.json"), "utf8")) as {
      res_body: { sse_usage_bearing: unknown[] };
    };
    const body = sseFromPayloads(raw.res_body.sse_usage_bearing);
    const out = extractUsage("openai_chat", body, "text/event-stream");
    expect(out.usage_source).toBe("response_body");
    expect(out.usage).toEqual({
      input: 18214,
      cached_input: 17920,
      output: 34,
      reasoning_output: 0,
    });
  });

  it("reads nested response.usage on Responses SSE (S2 dump kept only [DONE])", () => {
    const body = sseFromPayloads([
      {
        type: "response.completed",
        response: {
          model: "openai/gpt-4.1-mini",
          usage: {
            input_tokens: 80,
            output_tokens: 9,
            input_tokens_details: { cached_tokens: 16 },
            output_tokens_details: { reasoning_tokens: 3 },
          },
        },
      },
      "[DONE]",
    ]);
    const out = extractUsage("openai_responses", body, "text/event-stream");
    expect(out.usage_source).toBe("response_body");
    expect(out.usage).toEqual({
      input: 80,
      cached_input: 16,
      output: 9,
      reasoning_output: 3,
    });
  });

  it("normalizes Anthropic cache creation and cache read into total input", () => {
    const body = sseFromPayloads([{
      type: "message_delta",
      usage: {
        input_tokens: 10,
        cache_creation_input_tokens: 5,
        cache_read_input_tokens: 20,
        output_tokens: 2,
      },
    }]);
    expect(extractUsage("anthropic_messages", body, "text/event-stream").usage).toEqual({
      input: 35,
      cached_input: 20,
      output: 2,
      reasoning_output: 0,
    });
  });

  it("does not guess usage on unknown protocol", () => {
    const body = Buffer.from(JSON.stringify({ usage: { prompt_tokens: 1, completion_tokens: 1 } }));
    const out = extractUsage("unknown", body, "application/json");
    expect(out.usage).toBeNull();
    expect(out.usage_source).toBe("unavailable");
  });

  it("does not turn a partial usage object into zero tokens", () => {
    const body = Buffer.from(JSON.stringify({ usage: { prompt_tokens: 10 } }));
    const out = extractUsage("openai_chat", body, "application/json");
    expect(out.usage).toBeNull();
    expect(out.usage_source).toBe("unavailable");
  });

  it("maps OpenRouter generation token counters", () => {
    expect(extractGenerationUsage(Buffer.from(JSON.stringify({ data: {
      tokens_prompt: 20,
      tokens_cached: 8,
      tokens_completion: 5,
      tokens_reasoning: 2,
    } })))).toEqual({ input: 20, cached_input: 8, output: 5, reasoning_output: 2 });
  });

  it("prefers the native counter family and never mixes it with the normalized one", () => {
    // Captured live from OpenRouter: the generation record carries both
    // families, but only the native one has cached/reasoning counters. Mixing a
    // normalized prompt with a native cached count made cached exceed input on
    // any heavily-cached agent trajectory, which failed the consistency check
    // and returned null - so the fallback never recovered usage, the runner
    // could not price the request, and the recorded-spend cap aborted the run.
    expect(extractGenerationUsage(Buffer.from(JSON.stringify({ data: {
      tokens_prompt: 1,
      native_tokens_prompt: 13,
      native_tokens_cached: 0,
      tokens_completion: 1,
      native_tokens_completion: 1,
      native_tokens_reasoning: 1,
    } })))).toEqual({ input: 13, cached_input: 0, output: 1, reasoning_output: 1 });

    // The shape of a real cached agent turn: normalized prompt is far smaller
    // than the native cached count.
    expect(extractGenerationUsage(Buffer.from(JSON.stringify({ data: {
      tokens_prompt: 5_000,
      native_tokens_prompt: 2_398_346,
      native_tokens_cached: 2_312_288,
      tokens_completion: 8_000,
      native_tokens_completion: 21_210,
      native_tokens_reasoning: 3_000,
    } })))).toEqual({ input: 2_398_346, cached_input: 2_312_288, output: 21_210, reasoning_output: 3_000 });
  });

  it("still rejects a genuinely inconsistent record within one family", () => {
    expect(extractGenerationUsage(Buffer.from(JSON.stringify({ data: {
      native_tokens_prompt: 10,
      native_tokens_cached: 11,
      native_tokens_completion: 5,
    } })))).toBeNull();
    expect(extractGenerationUsage(Buffer.from(JSON.stringify({ data: {
      native_tokens_prompt: 10,
      native_tokens_completion: 5,
      native_tokens_reasoning: 6,
    } })))).toBeNull();
  });
});

describe("peekServedModel", () => {
  it("reads the served model from an Anthropic message_start event", () => {
    // Anthropic streams nest the model under `message`, so a top-level lookup
    // returned null and a claude-code cell recorded no served-model identity.
    const sse = [
      'event: message_start',
      'data: {"type":"message_start","message":{"id":"msg_1","model":"z-ai/glm-5.3-flash","role":"assistant"}}',
      '',
      'event: content_block_delta',
      'data: {"type":"content_block_delta","delta":{"text":"hi"}}',
      '',
    ].join("\n");
    expect(peekServedModel(Buffer.from(sse))).toBe("z-ai/glm-5.3-flash");
  });

  it("still reads a top-level model from JSON and OpenAI-style streams", () => {
    expect(peekServedModel(Buffer.from(JSON.stringify({ model: "m1" })))).toBe("m1");
    expect(peekServedModel(Buffer.from('data: {"model":"m2","choices":[]}\n\ndata: [DONE]\n'))).toBe("m2");
  });

  it("returns null when no model is present", () => {
    expect(peekServedModel(Buffer.from('data: {"type":"ping"}\n'))).toBeNull();
  });
});


describe("complete request model metadata", () => {
  it("reads a trailing top-level model after a large message list instead of a nested decoy", () => {
    const body = Buffer.from(JSON.stringify({ messages: [{ model: "nested-decoy", content: "x".repeat(100000) }], model: "pinned-model" }));
    expect(peekModel(body)).toBe("pinned-model");
  });
  it("never promotes nested fields or malformed JSON into requested-model evidence", () => {
    expect(peekModel(Buffer.from('{"messages":[{"model":"nested"}]}'))).toBeNull();
    expect(peekModel(Buffer.from('{"model":"incomplete",'))).toBeNull();
    expect(peekModel(Buffer.from('null'))).toBeNull();
    expect(peekModel(Buffer.from('[{"model":"array"}]'))).toBeNull();
  });
  it("retains bounded capture and decodes JSON strings", () => {
    expect(peekModel(Buffer.from(JSON.stringify({ model: "escaped\\model" })))).toBe("escaped\\model");
    expect(peekModel(Buffer.from('{"model":"over-limit"}'), 8)).toBeNull();
  });
});

describe("whole-body served-model consistency", () => {
  it("requires terminal identity in Responses SSE and rejects conflicts in JSON or SSE", () => {
    expect(peekServedModel(Buffer.from('{"model":"first","response":{"model":"second"}}'))).toBeNull();
    expect(peekServedModel(sseFromPayloads([{ type: "response.created", response: { model: "first" } }, { type: "response.completed", response: { model: "second" } }]))).toBeNull();
    expect(peekServedModel(sseFromPayloads([{ type: "response.created", response: { model: "first" } }, { type: "response.completed", response: {} }]))).toBeNull();
    expect(peekServedModel(sseFromPayloads([{ type: "response.created", response: { model: "first" } }, "[DONE]"]))).toBeNull();
    expect(peekServedModel(sseFromPayloads([{ type: "response.created", response: { model: "first" } }, { type: "response.completed", response: { model: "first" } }]))).toBe("first");
  });
});
