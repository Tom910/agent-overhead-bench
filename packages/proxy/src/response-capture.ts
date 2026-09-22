import type { Protocol } from "@aob/contracts";
import { ResponseUsageAccumulator, type ResponseMetadata } from "./usage.js";

const MAX_CAPTURE_BYTES = 2 * 1024 * 1024;
const MAX_FRAMING_PREFIX_BYTES = 4 * 1024;

function ssePrefix(prefix: Buffer): boolean | undefined {
  // Wait for a split UTF-8 BOM before deciding the first field's framing.
  if (prefix.length < 3 && prefix[0] === 0xef) return undefined;
  const text = prefix.toString("utf8").replace(/^\uFEFF/, "").replace(/^[\r\n]*/, "");
  if (text === "") return undefined;
  const fields = ["data:", "event:", "id:", "retry:", ":"];
  if (fields.some(field => text.startsWith(field))) return true;
  if (fields.some(field => field.startsWith(text))) return undefined;
  return false;
}

/**
 * Capture one bounded SSE event at a time, rather than a response prefix.
 * JSON remains bounded as a complete document. Content is never retained
 * after its event is consumed, and these buffers never control passthrough.
 */
export class ResponseMetadataCapture {
  private isStreamed: boolean;
  private framingKnown: boolean;
  private framingPrefix = Buffer.alloc(0);
  private readonly protocol: Protocol;
  private accumulator: ResponseUsageAccumulator;

  get streamed(): boolean { return this.isStreamed; }
  private buffer = Buffer.alloc(0);
  private retained = 0;
  private bytes = 0;
  private oversized = false;
  private lineBytes = 0;
  private data: string[] = [];
  private skipLf = false;
  private firstLine = true;

  constructor(protocol: Protocol, contentType: string | undefined) {
    this.protocol = protocol;
    this.isStreamed = (contentType ?? "").toLowerCase().split(";", 1)[0]?.trim() === "text/event-stream";
    this.framingKnown = this.isStreamed;
    this.accumulator = new ResponseUsageAccumulator(protocol, this.isStreamed);
  }

  push(chunk: Buffer): void {
    if (!this.framingKnown) {
      const take = Math.min(chunk.length, MAX_FRAMING_PREFIX_BYTES - this.framingPrefix.length);
      this.framingPrefix = Buffer.concat([this.framingPrefix, chunk.subarray(0, take)]);
      const detected = ssePrefix(this.framingPrefix);
      if (detected === undefined && this.framingPrefix.length < MAX_FRAMING_PREFIX_BYTES) return;
      this.framingKnown = true;
      this.isStreamed = detected === true;
      this.accumulator = new ResponseUsageAccumulator(this.protocol, this.isStreamed);
      const prefix = this.framingPrefix;
      this.framingPrefix = Buffer.alloc(0);
      this.push(prefix);
      if (take < chunk.length) this.push(chunk.subarray(take));
      return;
    }
    if (!this.streamed) {
      this.capture(chunk);
      return;
    }
    let start = 0;
    while (start < chunk.length) {
      if (this.skipLf) {
        this.skipLf = false;
        if (chunk[start] === 10) { start += 1; continue; }
      }
      const lf = chunk.indexOf(10, start);
      const cr = chunk.indexOf(13, start);
      const end = lf < 0 ? cr : cr < 0 ? lf : Math.min(lf, cr);
      const stop = end < 0 ? chunk.length : end;
      this.lineBytes += stop - start;
      this.capture(chunk.subarray(start, stop));
      if (end < 0) break;
      // Count delimiters too, so arbitrarily many tiny lines remain bounded.
      this.bytes += 1;
      if (this.bytes > MAX_CAPTURE_BYTES) this.discardEvent();
      this.endLine();
      this.skipLf = chunk[end] === 13;
      start = end + 1;
    }
  }

  finish(): ResponseMetadata {
    if (!this.framingKnown) {
      this.framingKnown = true;
      this.capture(this.framingPrefix);
      this.framingPrefix = Buffer.alloc(0);
    }
    if (!this.streamed) {
      if (this.oversized) return { usage: null, usage_source: "unavailable", model_served: null };
      const body = this.buffer.subarray(0, this.retained);
      this.buffer = Buffer.alloc(0);
      this.retained = 0;
      this.accumulator.consume(body.toString("utf8"));
      return this.accumulator.result();
    }
    if (this.lineBytes > 0) this.endLine();
    this.endEvent();
    return this.accumulator.result();
  }

  private capture(chunk: Buffer): void {
    if (chunk.length === 0) return;
    this.bytes += chunk.length;
    if (this.bytes > MAX_CAPTURE_BYTES) this.discardEvent();
    if (!this.oversized) {
      const needed = this.retained + chunk.length;
      if (needed > this.buffer.length) {
        const next = Buffer.allocUnsafe(Math.min(MAX_CAPTURE_BYTES, Math.max(1_024, this.buffer.length * 2, needed)));
        this.buffer.copy(next, 0, 0, this.retained);
        this.buffer = next;
      }
      chunk.copy(this.buffer, this.retained);
      this.retained = needed;
    }
  }

  private discardEvent(): void {
    this.oversized = true;
    this.buffer = Buffer.alloc(0);
    this.retained = 0;
    this.data = [];
    this.accumulator.invalidateUsage();
    this.accumulator.invalidateModel();
  }

  private endLine(): void {
    if (this.lineBytes === 0) {
      this.endEvent();
      return;
    }
    if (!this.oversized) {
      // Decode complete lines so a UTF-8 codepoint split between network
      // chunks is never replaced by a decoding artifact.
      let line = this.buffer.subarray(0, this.retained).toString("utf8");
      if (this.firstLine && line.startsWith("\uFEFF")) line = line.slice(1);
      const colon = line.indexOf(":");
      const field = colon < 0 ? line : line.slice(0, colon);
      if (field === "data") {
        let payload = colon < 0 ? "" : line.slice(colon + 1);
        if (payload.startsWith(" ")) payload = payload.slice(1);
        this.data.push(payload);
      }
    }
    this.firstLine = false;
    this.retained = 0;
    this.lineBytes = 0;
  }

  private endEvent(): void {
    if (!this.oversized && this.data.length > 0) this.accumulator.consume(this.data.join("\n"));
    this.retained = 0;
    this.data = [];
    this.lineBytes = 0;
    this.bytes = 0;
    this.oversized = false;
  }
}
