import { StringDecoder } from "node:string_decoder";
import { ToolError, type C3ToolEvent } from "@aob/contracts";

const TOOL_ITEM_TYPES = new Set(["command_execution", "file_change", "mcp_tool_call"]);

type JsonRecord = Record<string, unknown>;

type OpenTool = {
  kind: string;
  tStart: number;
};

export type CodexToolEventParser = {
  feed(chunk: Uint8Array, observedAt: number): void;
  finish(observedAt: number): C3ToolEvent[];
};

function invalid(message: string): never {
  throw new ToolError(`Codex structured tool log is invalid: ${message}`);
}

function record(value: unknown): JsonRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}

function validateObservedTime(value: number): number {
  if (!Number.isFinite(value) || value < 0) invalid("event timestamp must be nonnegative");
  return value;
}

function toolItem(value: unknown): { id: string; kind: string } | null {
  const item = record(value);
  if (item === null) invalid("item must be an object");
  const kind = item.type;
  if (typeof kind !== "string" || !TOOL_ITEM_TYPES.has(kind)) return null;
  if (typeof item.id !== "string" || item.id.length === 0) invalid("tool item id is required");
  return { id: item.id, kind };
}

export function createCodexToolEventParser(): CodexToolEventParser {
  const decoder = new StringDecoder("utf8");
  let pending = "";
  let pendingAt: number | null = null;
  const open = new Map<string, OpenTool>();
  const completed = new Set<string>();
  const events: C3ToolEvent[] = [];
  let previousObservedAt: number | null = null;
  const observedTime = (value: number): number => {
    if (previousObservedAt !== null && value < previousObservedAt) invalid("event timestamps must be monotonic");
    previousObservedAt = value;
    return validateObservedTime(value);
  };

  const consume = (text: string, observedAt: number): void => {
    let cursor = 0;
    while (cursor < text.length) {
      const newline = text.indexOf("\n", cursor);
      if (newline < 0) {
        if (pending.length === 0) pendingAt = observedAt;
        pending += text.slice(cursor);
        return;
      }
      const fragment = text.slice(cursor, newline).replace(/\r$/, "");
      const line = pending + fragment;
      const lineObservedAt = pendingAt ?? observedAt;
      pending = "";
      pendingAt = null;
      cursor = newline + 1;
      if (line.trim() === "") continue;
      let parsed: unknown;
      try {
        parsed = JSON.parse(line);
      } catch (error) {
        invalid(`invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
      }
      const entry = record(parsed);
      if (entry === null) invalid("event must be an object");
      if (entry.type === "item.started") {
        const item = toolItem(entry.item);
        if (item === null) continue;
        if (open.has(item.id) || completed.has(item.id)) invalid(`duplicate start for ${item.id}`);
        open.set(item.id, { kind: item.kind, tStart: lineObservedAt });
      } else if (entry.type === "item.completed") {
        const item = toolItem(entry.item);
        if (item === null) continue;
        const started = open.get(item.id);
        if (started === undefined) {
          if (completed.has(item.id)) invalid(`duplicate completion for ${item.id}`);
          invalid(`unmatched completion for ${item.id}`);
        }
        if (started.kind !== item.kind) invalid(`tool item type changed for ${item.id}`);
        if (lineObservedAt < started.tStart) invalid(`tool interval is not monotonic for ${item.id}`);
        open.delete(item.id);
        completed.add(item.id);
        events.push({ tStart: started.tStart, tEnd: lineObservedAt, kind: started.kind });
      }
    }
  };

  return {
    feed(chunk, observedAt) {
      consume(decoder.write(chunk), observedTime(observedAt));
    },
    finish(observedAt) {
      const time = observedTime(observedAt);
      consume(decoder.end(), time);
      if (pending.trim() !== "") {
        const line = pending;
        const lineObservedAt = pendingAt ?? time;
        pending = "";
        pendingAt = null;
        let parsed: unknown;
        try {
          parsed = JSON.parse(line);
        } catch (error) {
          invalid(`invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
        }
        const entry = record(parsed);
        if (entry === null) invalid("event must be an object");
        if (entry.type === "item.started" || entry.type === "item.completed") {
          // Reuse the normal newline-delimited path for a final unterminated line.
          consume(`${line}\n`, lineObservedAt);
        }
      }
      if (open.size > 0) invalid(`unmatched tool starts: ${[...open.keys()].join(", ")}`);
      return [...events].sort((left, right) => left.tStart - right.tStart || left.tEnd - right.tEnd);
    },
  };
}
