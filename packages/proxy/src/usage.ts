import type { C1Usage, Protocol, UsageSource } from "@aob/contracts";

export function detectProtocol(path: string): Protocol {
  const p = path.split("?")[0] ?? path;
  if (p.includes("/v1/messages") || p.endsWith("/messages")) return "anthropic_messages";
  if (p.includes("/chat/completions")) return "openai_chat";
  if (p.includes("/responses")) return "openai_responses";
  return "unknown";
}

type UsageBlob = {
  prompt_tokens?: number;
  completion_tokens?: number;
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
  prompt_tokens_details?: { cached_tokens?: number };
  input_tokens_details?: { cached_tokens?: number };
  completion_tokens_details?: { reasoning_tokens?: number };
  output_tokens_details?: { thinking_tokens?: number; reasoning_tokens?: number };
};

type GenerationBlob = {
  tokens_prompt?: number;
  native_tokens_prompt?: number;
  tokens_cached?: number;
  native_tokens_cached?: number;
  tokens_completion?: number;
  native_tokens_completion?: number;
  tokens_reasoning?: number;
  native_tokens_reasoning?: number;
};

function asUsage(u: UsageBlob, anthropic: boolean): C1Usage | null {
  const baseInput = u.prompt_tokens ?? u.input_tokens;
  const output = u.completion_tokens ?? u.output_tokens;
  // A partial usage object is not evidence for zero tokens. Keep it
  // unavailable so cost and token aggregates cannot be understated.
  if (typeof baseInput !== "number" || !Number.isFinite(baseInput) || baseInput < 0
    || typeof output !== "number" || !Number.isFinite(output) || output < 0) return null;
  const cacheRead = u.cache_read_input_tokens ?? 0;
  const cacheCreation = u.cache_creation_input_tokens ?? 0;
  // Anthropic reports input_tokens as uncached input and reports cache reads
  // separately. C1 input is the total input token count, so add both cache
  // fields before recording cached_input.
  const input = anthropic ? baseInput + cacheRead + cacheCreation : baseInput;
  const cached =
    u.prompt_tokens_details?.cached_tokens ??
    u.input_tokens_details?.cached_tokens ??
    cacheRead ??
    0;
  const reasoning =
    u.completion_tokens_details?.reasoning_tokens ??
    u.output_tokens_details?.reasoning_tokens ??
    u.output_tokens_details?.thinking_tokens ??
    0;
  if (![cacheRead, cacheCreation, cached, reasoning].every((value) =>
    typeof value === "number" && Number.isFinite(value) && value >= 0)) return null;
  if (cached < 0 || cached > input || reasoning < 0 || reasoning > output) return null;
  return { input, cached_input: cached, output, reasoning_output: reasoning };
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

/** Retain only recognized counters, never an event's response content. */
function checkedUsageBlob(value: unknown, protocol: Protocol): UsageBlob | null {
  const raw = record(value);
  if (raw === null) return null;
  const blob: UsageBlob = {};
  const valid = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;
  for (const key of ["prompt_tokens", "completion_tokens", "input_tokens", "output_tokens", "cache_read_input_tokens", "cache_creation_input_tokens"] as const) {
    if (raw[key] === undefined) continue;
    // Messages providers may explicitly omit optional cache counters with null.
    // Keep them absent so a delta preserves any earlier observed cache count.
    if (protocol === "anthropic_messages" && raw[key] === null &&
        (key === "cache_read_input_tokens" || key === "cache_creation_input_tokens")) continue;
    if (!valid(raw[key])) return null;
    blob[key] = raw[key];
  }
  for (const key of ["prompt_tokens_details", "input_tokens_details", "completion_tokens_details", "output_tokens_details"] as const) {
    if (raw[key] === undefined || raw[key] === null) continue;
    const details = record(raw[key]);
    if (details === null) return null;
    const counters: { cached_tokens?: number; reasoning_tokens?: number; thinking_tokens?: number } = {};
    for (const field of ["cached_tokens", "reasoning_tokens", "thinking_tokens"] as const) {
      if (details[field] === undefined) continue;
      if (!valid(details[field])) return null;
      counters[field] = details[field];
    }
    blob[key] = counters;
  }
  return blob;
}

function validServedModel(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0 && value === value.trim();
}

export type ResponseMetadata = {
  usage: C1Usage | null;
  usage_source: UsageSource;
  model_served: string | null;
};

/** Fold complete JSON/SSE payloads into small, observed response metadata. */
export class ResponseUsageAccumulator {
  private readonly protocol: Protocol;
  private usage: C1Usage | null = null;
  private model: string | null = null;
  private anthropicUsage: UsageBlob | null = null;
  private readonly streamed: boolean;
  private modelContradiction = false;
  private responsesStream: boolean;
  private terminalModel: string | null = null;
  private invalidTerminalModel = false;

  constructor(protocol: Protocol, streamed = false) {
    this.protocol = protocol;
    this.streamed = streamed;
    this.responsesStream = streamed && protocol === "openai_responses";
  }

  /** An unobserved/malformed event may contain contradictory identity. */
  invalidateModel(): void { this.modelContradiction = true; }

  private observeModels(root: Record<string, unknown>): void {
    const response = record(root.response);
    for (const candidate of [root.model, response?.model, record(root.message)?.model]) {
      if (!validServedModel(candidate)) continue;
      if (this.model !== null && this.model !== candidate) this.modelContradiction = true;
      this.model ??= candidate;
    }
    // Whole-body model inspection has no request path; infer only the explicit
    // Responses SSE event family, never a requested model or generic DONE marker.
    if (this.streamed && typeof root.type === "string" && root.type.startsWith("response.")) this.responsesStream = true;
    if (this.responsesStream && (root.type === "response.completed" || root.type === "response.incomplete")) {
      if (!validServedModel(response?.model)) this.invalidTerminalModel = true;
      else this.terminalModel = response.model;
    }
  }

  invalidateUsage(): void {
    this.usage = null;
    this.anthropicUsage = null;
  }

  consume(payload: string): void {
    if (payload.trim() === "[DONE]") return;
    let root: Record<string, unknown> | null;
    try { root = record(JSON.parse(payload)); }
    catch { this.invalidateUsage(); this.invalidateModel(); return; }
    if (root === null) { this.invalidateUsage(); this.invalidateModel(); return; }
    this.observeModels(root);
    if (this.protocol === "unknown") return;
    if (this.protocol === "anthropic_messages" && root.type === "message_start") {
      this.invalidateUsage();
      this.anthropicUsage = checkedUsageBlob(record(root.message)?.usage, this.protocol);
      // message_start's zero output is provisional, not a completed total.
      return;
    }
    if (this.protocol === "anthropic_messages" && root.type === "message_delta") {
      const delta = checkedUsageBlob(root.usage, this.protocol);
      if (delta === null || (delta.output_tokens === undefined && delta.completion_tokens === undefined)) {
        this.invalidateUsage();
        return;
      }
      const cumulative = { ...this.anthropicUsage, ...delta };
      this.usage = asUsage(cumulative, true);
      this.anthropicUsage = this.usage === null ? null : cumulative;
      return;
    }
    const response = record(root.response);
    if ("usage" in root || (response !== null && "usage" in response)) {
      const blob = checkedUsageBlob(root.usage ?? response?.usage, this.protocol);
      // A later malformed/partial usage report must replace an earlier total,
      // rather than leave stale counters looking like a complete response.
      this.usage = blob === null ? null : asUsage(blob, this.protocol === "anthropic_messages");
      if (this.usage === null) this.anthropicUsage = null;
    } else if (root.type === "response.completed") {
      this.invalidateUsage();
    }
  }

  result(): ResponseMetadata {
    return { usage: this.usage === null ? null : { ...this.usage },
      usage_source: this.usage === null ? "unavailable" : "response_body",
      model_served: this.modelContradiction || (this.responsesStream && (this.terminalModel === null || this.invalidTerminalModel)) ? null : this.model };
  }
}

export function extractUsage(
  protocol: Protocol,
  body: Buffer,
  contentType: string | undefined,
): { usage: C1Usage | null; usage_source: UsageSource } {
  if (protocol === "unknown") {
    return { usage: null, usage_source: "unavailable" };
  }
  const text = body.toString("utf8");
  const streamed = (contentType ?? "").includes("event-stream") || text.includes("data:");
  const accumulator = new ResponseUsageAccumulator(protocol, streamed);
  if (streamed) {
    for (const line of text.split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data:")) accumulator.consume(trimmed.slice(5).trim());
    }
  } else accumulator.consume(text);
  const { usage } = accumulator.result();
  if (usage) return { usage, usage_source: "response_body" };
  return { usage: null, usage_source: "unavailable" };
}

/** Maps the token counters returned by OpenRouter's generation endpoint. */
export function extractGenerationUsage(body: Buffer): C1Usage | null {
  try {
    const root = JSON.parse(body.toString("utf8")) as { data?: GenerationBlob };
    const data = root.data;
    if (!data) return null;
    // OpenRouter reports two counter families: normalized (`tokens_*`) and the
    // provider's own (`native_tokens_*`). Only the native family reliably
    // carries cached/reasoning counters, so taking each field independently
    // mixed a normalized prompt with a native cached count. On a heavily cached
    // agent turn that makes `cached` exceed `input`, the consistency check
    // below rejects the record, and the caller then has no usage at all.
    // Choose one family and stay in it. Native is preferred because it is what
    // the streamed response body reports and what pricing is applied to.
    const nativeFamily = typeof data.native_tokens_prompt === "number" && typeof data.native_tokens_completion === "number";
    const input = nativeFamily ? data.native_tokens_prompt : data.tokens_prompt;
    const cached = (nativeFamily ? data.native_tokens_cached : data.tokens_cached) ?? 0;
    const output = nativeFamily ? data.native_tokens_completion : data.tokens_completion;
    const reasoning = (nativeFamily ? data.native_tokens_reasoning : data.tokens_reasoning) ?? 0;
    if (typeof input !== "number" || !Number.isFinite(input) || input < 0
      || typeof cached !== "number" || !Number.isFinite(cached) || cached < 0
      || typeof output !== "number" || !Number.isFinite(output) || output < 0
      || typeof reasoning !== "number" || !Number.isFinite(reasoning) || reasoning < 0) {
      return null;
    }
    if (cached > input || reasoning > output) return null;
    return { input, cached_input: cached, output, reasoning_output: reasoning };
  } catch {
    return null;
  }
}

export function peekModel(body: Buffer, cap = 16 * 1024 * 1024): string | null {
  if (body.length > cap) return null;
  try {
    const obj: unknown = JSON.parse(body.toString("utf8"));
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return null;
    const model = (obj as Record<string, unknown>).model;
    return typeof model === "string" ? model : null;
  } catch {
    return null;
  }
}

/** Model id the upstream actually served, from JSON or SSE — never copied from the request. */
export function peekServedModel(body: Buffer): string | null {
  const text = body.toString("utf8");
  try {
    JSON.parse(text);
    const accumulator = new ResponseUsageAccumulator("unknown");
    accumulator.consume(text);
    return accumulator.result().model_served;
  } catch { /* SSE or non-JSON */ }
  const accumulator = new ResponseUsageAccumulator("unknown", true);
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("data:")) accumulator.consume(trimmed.slice(5).trim());
  }
  return accumulator.result().model_served;
}
