import { describe, expect, it } from "vitest";
import { createCodexToolEventParser } from "./codex-events.js";

function line(value: unknown): string {
  return `${JSON.stringify(value)}\n`;
}

describe("Codex structured tool-event parser", () => {
  it("pairs command executions across split JSONL chunks", () => {
    const parser = createCodexToolEventParser();
    const first = line({ type: "thread.started", thread_id: "t1" }) +
      line({ type: "item.started", item: { id: "cmd-1", type: "command_execution", command: "npm test" } });
    const second = line({ type: "turn.started" }) +
      line({ type: "item.completed", item: { id: "cmd-1", type: "command_execution", status: "completed" } });
    parser.feed(Buffer.from(first.slice(0, first.length - 3)), 10);
    parser.feed(Buffer.from(first.slice(first.length - 3) + second), 20);

    expect(parser.finish(25)).toEqual([
      { tStart: 10, tEnd: 20, kind: "command_execution" },
    ]);
  });

  it("pairs interleaved file changes and MCP calls by stable item id", () => {
    const parser = createCodexToolEventParser();
    parser.feed(Buffer.from(
      line({ type: "item.started", item: { id: "file-1", type: "file_change" } }) +
      line({ type: "item.started", item: { id: "mcp-1", type: "mcp_tool_call" } }) +
      line({ type: "item.completed", item: { id: "file-1", type: "file_change" } }) +
      line({ type: "item.completed", item: { id: "mcp-1", type: "mcp_tool_call" } }),
    ), 100);
    parser.feed(Buffer.from(""), 110);

    expect(parser.finish(120)).toEqual([
      { tStart: 100, tEnd: 100, kind: "file_change" },
      { tStart: 100, tEnd: 100, kind: "mcp_tool_call" },
    ]);
  });

  it("ignores lifecycle records but rejects malformed JSON", () => {
    const parser = createCodexToolEventParser();
    parser.feed(Buffer.from(line({ type: "turn.completed", usage: { input_tokens: 1 } })), 1);
    expect(() => parser.feed(Buffer.from("not-json\n"), 2)).toThrow(/JSON/i);
  });

  it("fails closed when a tool item has no completion", () => {
    const parser = createCodexToolEventParser();
    parser.feed(Buffer.from(line({ type: "item.started", item: { id: "cmd-1", type: "command_execution" } })), 1);
    expect(() => parser.finish(5)).toThrow(/unmatched|incomplete/i);
  });

  it("rejects duplicate starts and completions", () => {
    const parser = createCodexToolEventParser();
    const start = line({ type: "item.started", item: { id: "cmd-1", type: "command_execution" } });
    expect(() => parser.feed(Buffer.from(start + start), 1)).toThrow(/duplicate/i);
  });

  it("preserves the first chunk timestamp for an unterminated final tool record", () => {
    const parser = createCodexToolEventParser();
    parser.feed(Buffer.from(line({ type: "item.started", item: { id: "cmd-1", type: "command_execution" } })), 7);
    parser.feed(Buffer.from(JSON.stringify({ type: "item.completed", item: { id: "cmd-1", type: "command_execution" } })), 9);
    expect(parser.finish(12)).toEqual([{ tStart: 7, tEnd: 9, kind: "command_execution" }]);
  });

  it("rejects timestamps that move backwards", () => {
    const parser = createCodexToolEventParser();
    parser.feed(Buffer.from(line({ type: "turn.started" })), 10);
    expect(() => parser.feed(Buffer.from(line({ type: "turn.completed" })), 9)).toThrow(/monotonic/i);
  });
});
