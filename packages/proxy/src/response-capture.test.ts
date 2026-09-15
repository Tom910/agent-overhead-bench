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
