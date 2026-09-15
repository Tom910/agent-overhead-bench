import { createHash } from "node:crypto";
import type { C1Event } from "@aob/contracts";

const MAX_ERROR_BYTES = 64 * 1024;
const REJECTION_MESSAGE = "This response_format type is unavailable now";
const REQUEST_KEYS = new Set(["model", "messages", "system", "stream", "max_tokens", "output_config", "thinking",
  "tools", "metadata", "temperature", "top_p", "top_k", "stop_sequences", "provider"]);

function object(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

function textContent(value: unknown): boolean {
  return typeof value === "string" || Array.isArray(value) && value.every(block => {
    const entry = object(block);
    return entry?.type === "text" && typeof entry.text === "string" &&
      Object.keys(entry).every(key => ["type", "text", "cache_control"].includes(key));
  });
}

function plainSchemaRequest(bytes: Buffer): boolean {
  let value: unknown;
  try { value = JSON.parse(bytes.toString("utf8")); } catch { return false; }
  const request = object(value);
  if (!request || request.model !== "deepseek/deepseek-v4.1-flash" || Object.keys(request).some(key => !REQUEST_KEYS.has(key))) return false;
  if (request.tools !== undefined && (!Array.isArray(request.tools) || request.tools.length !== 0)) return false;
  const format = object(object(request.output_config)?.format);
  if (format?.type !== "json_schema" || !object(format.schema)) return false;
  if (request.system !== undefined && !textContent(request.system)) return false;
  if (!Array.isArray(request.messages) || request.messages.length === 0 || !request.messages.every(message => {
    const entry = object(message);
    return entry && ["user", "assistant"].includes(String(entry.role)) && textContent(entry.content) &&
      Object.keys(entry).every(key => ["role", "content"].includes(key));
  })) return false;
  const provider = object(request.provider);
  return provider?.allow_fallbacks === false && Array.isArray(provider.only) && provider.only.length === 1 && provider.only[0] === "deepseek";
}

export type UpstreamEvidenceSnapshot = {
  generation_id: string | null;
  request_id: string | null;
  upstream_status: number;
  error: { type: string | null; code: string | null; message: string | null } | null;
  error_body_sha256: string | null;
  error_body_bytes: number;
  error_body_complete: boolean;
  error_body_truncated: boolean;
};

type CaptureOptions = {
  status: number;
  contentType: string | undefined;
  generationId: string | string[] | undefined;
  requestId: string | string[] | undefined;
  secrets: Array<string | undefined>;
};

/** Only error bodies are buffered; normal streamed output is never retained here. */
export class UpstreamEvidenceCapture {
  private readonly buffer: Buffer;
  private readonly hash = createHash("sha256");
  private bytes = 0;
  private retained = 0;
  private readonly secrets: string[];
  private readonly options: CaptureOptions;

  constructor(options: CaptureOptions) {
    this.options = options;
    this.buffer = options.status >= 400 ? Buffer.alloc(MAX_ERROR_BYTES) : Buffer.alloc(0);
    this.secrets = options.secrets.filter((value): value is string => typeof value === "string" && value.length > 0)
      .flatMap(value => [value, value.replace(/^(?:Bearer|Basic)\s+/i, "")])
      .sort((left, right) => right.length - left.length);
  }

  push(chunk: Buffer): void {
    if (this.options.status < 400) return;
    this.bytes += chunk.length;
    this.hash.update(chunk);
    const count = Math.min(chunk.length, MAX_ERROR_BYTES - this.retained);
    chunk.copy(this.buffer, this.retained, 0, count);
    this.retained += count;
  }

  private safeText(value: unknown): string | null {
    if (typeof value !== "string" && typeof value !== "number") return null;
    let text = String(value).replace(/sk-[A-Za-z0-9_-]+|(?:Bearer|Basic)\s+\S+/gi, "[redacted]");
    for (const secret of this.secrets) text = text.split(secret).join("[redacted]");
    return text.slice(0, 2048);
  }

  private id(value: unknown): string | null {
    const first = Array.isArray(value) ? value[0] : value;
    return typeof first === "string" && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,255}$/.test(first) && this.safeText(first) === first ? first : null;
  }

  private document(complete: boolean): Record<string, unknown> | undefined {
    if (!complete || this.bytes > MAX_ERROR_BYTES || !/^application\/json(?:\s*;|$)/i.test(this.options.contentType ?? "")) return undefined;
    try { return object(JSON.parse(this.buffer.subarray(0, this.retained).toString("utf8"))); } catch { return undefined; }
  }

  isPreInferenceRejection(upstream: string, onlyProvider: string | undefined, request: Buffer): boolean {
    if (!["https://openrouter.ai/api", "https://openrouter.ai/api/v1"].includes(upstream) || onlyProvider !== "deepseek" || this.options.status !== 400) return false;
    const response = this.document(true);
    const error = object(response?.error);
    const metadata = object(response?.metadata);
    const id = this.id(this.options.generationId);
    return response?.type === "error" && id !== null && response.request_id === id &&
      error?.type === "invalid_request_error" && error.message === REJECTION_MESSAGE &&
      metadata?.provider_name === "DeepSeek" && metadata.is_byok === false && metadata.provider_error_code === "invalid_request_error" &&
      Object.keys(metadata).every(key => ["provider_name", "is_byok", "provider_error_code", "raw"].includes(key)) &&
      !["usage", "choices", "output", "content"].some(key => key in response) && plainSchemaRequest(request);
  }

  snapshot(complete: boolean): UpstreamEvidenceSnapshot {
    const document = this.document(complete);
    const error = object(document?.error);
    const isError = this.options.status >= 400;
    return {
      generation_id: this.id(this.options.generationId),
      request_id: this.id(this.options.requestId) ?? this.id(document?.request_id),
      upstream_status: this.options.status,
      error: error ? { type: this.safeText(error.type), code: this.safeText(error.code), message: this.safeText(error.message) } : null,
      error_body_sha256: isError ? this.hash.copy().digest("hex") : null,
      error_body_bytes: this.bytes,
      error_body_complete: isError && complete,
      error_body_truncated: this.bytes > MAX_ERROR_BYTES,
    };
  }
}

export function upstreamEvidenceRecord(event: C1Event, snapshot: UpstreamEvidenceSnapshot | undefined) {
  return {
    v: 1,
    run_id: event.run_id,
    seq: event.seq,
    c1_sha256: createHash("sha256").update(`${JSON.stringify(event)}\n`).digest("hex"),
    ...(snapshot ?? { generation_id: null, request_id: null, upstream_status: null, error: null,
      error_body_sha256: null, error_body_bytes: 0, error_body_complete: false, error_body_truncated: false }),
  };
}
