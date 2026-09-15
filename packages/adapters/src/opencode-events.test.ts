import { describe, expect, it } from "vitest";
import { ToolError } from "@aob/contracts";
import { createOpenCodeToolEventParser } from "./opencode-events.js";

const anchor = {
  wallClockMs: Date.parse("2026-08-31T00:00:00.000Z"),
  monotonicZero: 100,
};

function line(value: unknown): string {
  return `${JSON.stringify(value)}\n`;
}

function toolUse(callID = "call-1", start = 1_000, end = 2_500): unknown {
  return {
    type: "tool_use",
    part: {
      type: "tool",
      callID,
      tool: "bash",
      state: {
        status: "completed",
        time: { start: anchor.wallClockMs + start, end: anchor.wallClockMs + end },
      },
    },
  };
}

describe("OpenCode structured tool-event parser", () => {
  it("maps completed JSON events from epoch milliseconds to the adapter monotonic clock", () => {
    const parser = createOpenCodeToolEventParser(anchor);
    parser.feed(Buffer.from(
      line({ type: "step_start", part: { type: "step-start" } }) +
      line(toolUse()) +
      line({ type: "text", part: { type: "text", text: "done" } }),
    ), 3_000);

    expect(parser.finish(3_100)).toEqual([{ tStart: 1_100, tEnd: 2_600, kind: "bash" }]);
  });

  it("handles a UTF-8 JSON record split across output chunks", () => {
    const parser = createOpenCodeToolEventParser(anchor);
    const value = line(toolUse("call-split", 2_000, 2_100));
    parser.feed(Buffer.from(value.slice(0, 17)), 2_200);
    parser.feed(Buffer.from(value.slice(17)), 2_300);

    expect(parser.finish(2_400)).toEqual([{ tStart: 2_100, tEnd: 2_200, kind: "bash" }]);
  });

  it("fails closed for malformed, reversed, duplicate, and future intervals", () => {
    expect(() => {
      const parser = createOpenCodeToolEventParser(anchor);
      parser.feed(Buffer.from("not-json\n"), 1_000);
    }).toThrow(ToolError);

    expect(() => {
      const parser = createOpenCodeToolEventParser(anchor);
      parser.feed(Buffer.from(line(toolUse("reversed", 2_000, 1_000))), 3_000);
    }).toThrow(/reversed|monotonic/i);

    expect(() => {
      const parser = createOpenCodeToolEventParser(anchor);
      parser.feed(Buffer.from(line(toolUse("duplicate")) + line(toolUse("duplicate"))), 3_000);
    }).toThrow(/duplicate/i);

    expect(() => {
      const parser = createOpenCodeToolEventParser(anchor);
      parser.feed(Buffer.from(line(toolUse("future", 9_000, 9_100))), 2_000);
      parser.finish(2_100);
    }).toThrow(/observed|future|envelope/i);

    expect(() => {
      const parser = createOpenCodeToolEventParser(anchor);
      parser.feed(Buffer.from(line(toolUse("before-anchor", -50, 0))), 2_000);
    }).toThrow(/anchor|clock|before/i);
  });

  it("rejects a tool record without a completed interval", () => {
    expect(() => {
      const parser = createOpenCodeToolEventParser(anchor);
      parser.feed(Buffer.from(line({
        type: "tool_use",
        part: { type: "tool", callID: "missing-time", tool: "bash", state: { status: "running" } },
      })), 2_000);
      parser.finish(2_100);
    }).toThrow(/time|completed|interval/i);
  });
});
