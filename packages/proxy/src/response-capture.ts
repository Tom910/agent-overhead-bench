import type { Protocol } from "@aob/contracts";
import { extractUsage, peekServedModel, ResponseUsageAccumulator, type ResponseMetadata } from "./usage.js";

const MAX_CAPTURE_BYTES = 2 * 1024 * 1024;

/**
 * Capture one bounded SSE event at a time, rather than a response prefix.
 * JSON remains bounded as a complete document. Content is never retained
 * after its event is consumed, and these buffers never control passthrough.
 */
export class ResponseMetadataCapture {
  private readonly protocol: Protocol;
  private readonly contentType: string | undefined;
  private readonly streamed: boolean;
  private readonly accumulator: ResponseUsageAccumulator;
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
    this.contentType = contentType;
    this.streamed = (contentType ?? "").includes("event-stream");
    this.accumulator = new ResponseUsageAccumulator(protocol);
  }

  push(chunk: Buffer): void {
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
    if (!this.streamed) {
      if (this.oversized) return { usage: null, usage_source: "unavailable", model_served: null };
      const body = this.buffer.subarray(0, this.retained);
      this.buffer = Buffer.alloc(0);
      this.retained = 0;
      return { ...extractUsage(this.protocol, body, this.contentType), model_served: peekServedModel(body) };
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
