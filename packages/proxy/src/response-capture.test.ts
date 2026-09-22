import { describe, expect, it } from "vitest";
import { ResponseMetadataCapture } from "./response-capture.js";

const final = 'data: {"model":"served-模型","usage":{"prompt_tokens":20,"completion_tokens":5}}\r\n\r\n';

describe("incremental SSE response capture", () => {
  it("preserves split UTF-8, CRLF, field names, and multiline JSON at every byte boundary", () => {
    const capture = new ResponseMetadataCapture("openai_chat", "text/event-stream");
    const bytes = Buffer.from('\uFEFF: keepalive\r\nevent: completion\r\ndata: {"model":"served-模型",\r\ndata: "usage":{"prompt_tokens":20,"completion_tokens":5}}\r\n\r\ndata: [DONE]\r\n\r\n');
    for (let i = 0; i < bytes.length; i += 1) capture.push(bytes.subarray(i, i + 1));
    expect(capture.finish()).toEqual({ model_served: "served-模型", usage_source: "response_body",
      usage: { input: 20, cached_input: 0, output: 5, reasoning_output: 0 } });
  });

  it("handles bare CR and LF delimiters without treating CRLF as an empty event", () => {
    for (const separator of ["\r", "\n", "\r\n"]) {
      const capture = new ResponseMetadataCapture("openai_chat", "text/event-stream");
      capture.push(Buffer.from(final.replaceAll("\r\n", separator)));
      expect(capture.finish().usage?.output).toBe(5);
    }
  });

  it("drops a single oversized line across many chunks and resumes at the next event", () => {
    const capture = new ResponseMetadataCapture("openai_chat", "text/event-stream");
    capture.push(Buffer.from('data: {"content":"'));
    for (let i = 0; i < 8_193; i += 1) capture.push(Buffer.alloc(256, 120));
    capture.push(Buffer.from('"}\r'));
    capture.push(Buffer.from('\n\r'));
    capture.push(Buffer.from('\n' + final));
    expect(capture.finish().usage?.input).toBe(20);
  });

  it("bounds an event spread over many individually small data lines", () => {
    const capture = new ResponseMetadataCapture("openai_chat", "text/event-stream");
    capture.push(Buffer.from(final));
    for (let i = 0; i < 4_097; i += 1) capture.push(Buffer.from('data: ' + ' '.repeat(512) + '\n'));
    capture.push(Buffer.from('\n'));
    expect(capture.finish().usage).toBeNull();
  });

  it("does not reconstruct Anthropic totals from stale input after malformed or oversized events", () => {
    for (const bad of ['data: broken\n\n', 'data: ' + 'x'.repeat(2 * 1024 * 1024) + '\n\n']) {
      const capture = new ResponseMetadataCapture("anthropic_messages", "text/event-stream");
      capture.push(Buffer.from('data: {"type":"message_start","message":{"usage":{"input_tokens":10,"output_tokens":0}}}\n\n'));
      capture.push(Buffer.from(bad));
      capture.push(Buffer.from('data: {"type":"message_delta","usage":{"output_tokens":12}}\n\n'));
      expect(capture.finish().usage).toBeNull();
    }
  });

  it("retains existing nullable optional-details behavior on small JSON", () => {
    const capture = new ResponseMetadataCapture("openai_chat", "application/json");
    capture.push(Buffer.from('{"model":"served","usage":{"prompt_tokens":20,"completion_tokens":5,"prompt_tokens_details":null,"completion_tokens_details":null}}'));
    expect(capture.finish().usage).toEqual({ input: 20, cached_input: 0, output: 5, reasoning_output: 0 });
  });
});

const responseUsage = { input_tokens: 20, output_tokens: 5, input_tokens_details: { cached_tokens: 8 }, output_tokens_details: { reasoning_tokens: 2 } };
const expectedUsage = { input: 20, cached_input: 8, output: 5, reasoning_output: 2 };
const event = (value: unknown) => `data: ${JSON.stringify(value)}\n\n`;

describe("served-model evidence cannot inherit contradictory or unfinished identity", () => {
  it.each(["response.completed", "response.incomplete"])("keeps matching %s identity and independent token counters", type => {
    const capture = new ResponseMetadataCapture("openai_responses", "text/event-stream");
    capture.push(Buffer.from(event({ type: "response.created", response: { model: "gpt-6-luna" } }) + event({ type, response: { model: "gpt-6-luna", usage: responseUsage } })));
    expect(capture.finish()).toMatchObject({ model_served: "gpt-6-luna", usage: expectedUsage });
  });

  it.each([undefined, null, "", "   ", 123, {}, "different-model"])("rejects terminal Responses model %j without losing token counts", model => {
    const capture = new ResponseMetadataCapture("openai_responses", "text/event-stream");
    capture.push(Buffer.from(event({ type: "response.created", response: { model: "gpt-6-luna" } }) + event({ type: "response.completed", model: "gpt-6-luna", response: { model, usage: responseUsage } })));
    expect(capture.finish()).toMatchObject({ model_served: null, usage: expectedUsage });
  });

  it("does not infer Responses completion from creation, usage or DONE", () => {
    const capture = new ResponseMetadataCapture("openai_responses", "text/event-stream");
    capture.push(Buffer.from(event({ type: "response.created", response: { model: "gpt-6-luna", usage: responseUsage } }) + "data: [DONE]\n\n"));
    expect(capture.finish()).toMatchObject({ model_served: null, usage: expectedUsage });
  });

  it("keeps a contradiction unknown even after a later matching terminal", () => {
    const capture = new ResponseMetadataCapture("openai_responses", "text/event-stream");
    capture.push(Buffer.from(event({ type: "response.created", response: { model: "gpt-6-luna" } }) + event({ type: "response.in_progress", response: { model: "different-model" } }) + event({ type: "response.completed", response: { model: "gpt-6-luna", usage: responseUsage } })));
    expect(capture.finish()).toMatchObject({ model_served: null, usage: expectedUsage });
  });

  it("preserves Chat model across usage-only final chunks but rejects contradictions", () => {
    for (const conflict of [false, true]) {
      const capture = new ResponseMetadataCapture("openai_chat", "text/event-stream");
      capture.push(Buffer.from(event({ model: "gpt-6-luna", choices: [] }) + (conflict ? event({ model: "different-model", choices: [] }) : "") + event({ usage: { prompt_tokens: 20, completion_tokens: 5 } }) + "data: [DONE]\n\n"));
      expect(capture.finish()).toMatchObject({ model_served: conflict ? null : "gpt-6-luna", usage: { input: 20, output: 5 } });
    }
  });

  it("preserves Messages model across usage-only deltas and message_stop", () => {
    const capture = new ResponseMetadataCapture("anthropic_messages", "text/event-stream");
    capture.push(Buffer.from(event({ type: "message_start", message: { model: "served-messages", usage: { input_tokens: 20, output_tokens: 0 } } }) + event({ type: "message_delta", usage: { output_tokens: 5 } }) + event({ type: "message_stop" })));
    expect(capture.finish()).toMatchObject({ model_served: "served-messages", usage: { input: 20, output: 5 } });
  });

  it("rejects contradictory whole-body identity while retaining usage", () => {
    const capture = new ResponseMetadataCapture("openai_responses", "application/json");
    capture.push(Buffer.from(JSON.stringify({ model: "gpt-6-luna", response: { model: "different-model", usage: responseUsage } })));
    expect(capture.finish()).toMatchObject({ model_served: null, usage: expectedUsage });
  });
});
