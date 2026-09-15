import { StringDecoder } from "node:string_decoder";
import { ToolError, type C3ToolEvent } from "@aob/contracts";

type JsonRecord = Record<string, unknown>;

export type OpenCodeToolEventParser = {
  feed(chunk: Uint8Array, observedAt: number): void;
  finish(observedAt: number): C3ToolEvent[];
};

export type OpenCodeToolEventAnchor = {
  wallClockMs: number;
  monotonicZero: number;
};

function invalid(message: string): never {
  throw new ToolError(`OpenCode structured tool log is invalid: ${message}`);
}

function record(value: unknown): JsonRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as JsonRecord
    : null;
}

function number(value: unknown, name: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) invalid(`${name} must be a finite number`);
  return value;
}

function mapEpochMs(value: unknown, name: string, anchor: OpenCodeToolEventAnchor): number {
  const epochMs = number(value, name);
  if (epochMs < 0) invalid(`${name} must be nonnegative`);
  const monotonic = anchor.monotonicZero + epochMs - anchor.wallClockMs;
  if (!Number.isFinite(monotonic) || monotonic < anchor.monotonicZero) invalid(`${name} maps before the adapter clock anchor`);
  return monotonic;
}

function toolEvent(value: unknown, anchor: OpenCodeToolEventAnchor, observedAt: number): C3ToolEvent {
  const entry = record(value);
  if (entry === null) invalid("event must be an object");
  const part = record(entry.part);
  if (part === null || part.type !== "tool") invalid("tool_use.part must be a tool part");
  if (typeof part.callID !== "string" || part.callID.length === 0) invalid("tool callID is required");
  if (typeof part.tool !== "string" || part.tool.length === 0) invalid("tool name is required");
  const state = record(part.state);
  if (state === null || (state.status !== "completed" && state.status !== "error")) {
    invalid(`tool ${part.callID} has no completed terminal state`);
  }
  const time = record(state.time);
  if (time === null) invalid(`tool ${part.callID} has no completed time interval`);
  const tStart = mapEpochMs(time.start, `${part.callID}.time.start`, anchor);
  const tEnd = mapEpochMs(time.end, `${part.callID}.time.end`, anchor);
  if (tEnd < tStart) invalid(`tool ${part.callID} interval is reversed`);
  if (tEnd > observedAt) invalid(`tool ${part.callID} interval is after the observed output time`);
  return { tStart, tEnd, kind: part.tool };
}

export function createOpenCodeToolEventParser(anchor: OpenCodeToolEventAnchor): OpenCodeToolEventParser {
  if (!Number.isFinite(anchor.wallClockMs) || !Number.isFinite(anchor.monotonicZero) || anchor.wallClockMs < 0 || anchor.monotonicZero < 0) {
    throw new ToolError("OpenCode structured tool log has an invalid clock anchor");
  }
  const decoder = new StringDecoder("utf8");
  let pending = "";
  let pendingAt: number | null = null;
  let previousObservedAt: number | null = null;
  const callIDs = new Set<string>();
  const events: C3ToolEvent[] = [];

  const observedTime = (value: number): number => {
    if (!Number.isFinite(value) || value < 0) invalid("observed timestamp must be nonnegative");
    if (previousObservedAt !== null && value < previousObservedAt) invalid("observed timestamps must be monotonic");
    previousObservedAt = value;
    return value;
  };

  const consumeLine = (line: string, observedAt: number): void => {
    if (line.trim() === "") return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch (error) {
      invalid(`invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
    const entry = record(parsed);
    if (entry === null) invalid("event must be an object");
    if (entry.type !== "tool_use") return;
    const part = record(entry.part);
    if (part === null || typeof part.callID !== "string" || part.callID.length === 0) {
      invalid("tool_use.part.callID is required");
    }
    if (callIDs.has(part.callID)) invalid(`duplicate tool call ${part.callID}`);
    const event = toolEvent(entry, anchor, observedAt);
    callIDs.add(part.callID);
    events.push(event);
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
      const lineObservedAt = pendingAt ?? observedAt;
      const line = pending + fragment;
      pending = "";
      pendingAt = null;
      cursor = newline + 1;
      consumeLine(line, lineObservedAt);
    }
  };

  return {
    feed(chunk, observedAt) {
      const time = observedTime(observedAt);
      consume(decoder.write(chunk), time);
    },
    finish(observedAt) {
      const time = observedTime(observedAt);
      consume(decoder.end(), time);
      if (pending.trim() !== "") {
        const line = pending;
        const lineObservedAt = pendingAt ?? time;
        pending = "";
        pendingAt = null;
        consumeLine(line, lineObservedAt);
      }
      return [...events].sort((left, right) => left.tStart - right.tStart || left.tEnd - right.tEnd);
    },
  };
}
