export type Protocol =
  | "anthropic_messages"
  | "openai_chat"
  | "openai_responses"
  | "unknown";

export type UsageSource = "response_body" | "generation_lookup" | "unavailable";

export type C1Usage = {
  input: number;
  cached_input: number;
  output: number;
  reasoning_output: number;
};

export type C1Error = { kind: string; detail: string };

export type UsageLookup =
  | "not_attempted"
  | "recovered"
  | "missing_generation_id"
  | "missing_authorization"
  | "request_failed"
  | "http_error"
  | "unparsable";

export type C1Event = {
  v: 1;
  run_id: string;
  seq: number;
  t_req_start: number;
  t_req_body_end: number;
  t_upstream_sent: number;
  t_first_byte: number;
  t_last_byte: number;
  duration_ms: number;
  method: string;
  path: string;
  protocol: Protocol;
  model_requested: string | null;
  model_served: string | null;
  status: number;
  streamed: boolean;
  usage: C1Usage | null;
  usage_source: UsageSource;
  /**
   * Why a usage lookup ended the way it did. Optional so existing evidence
   * stays valid, but recorded going forward: an event that says only
   * "unavailable" gives no way to tell a broken fallback from a provider that
   * genuinely returned nothing.
   */
  usage_lookup?: UsageLookup;
  error: C1Error | null;
};

function protocolForPath(path: string): Protocol {
  const p = path.split("?")[0] ?? path;
  if (p.includes("/v1/messages") || p.endsWith("/messages")) return "anthropic_messages";
  if (p.includes("/chat/completions")) return "openai_chat";
  if (p.includes("/responses")) return "openai_responses";
  return "unknown";
}

/** True for a request-shaped event sent to one of the measured model APIs. */
export function isModelRequestAttempt(event: Pick<C1Event, "method" | "path" | "protocol">): boolean {
  return event.method === "POST" && event.protocol !== "unknown" && protocolForPath(event.path) === event.protocol;
}

/** True when a model API request completed successfully for usage and cost accounting. */
export function isSuccessfulModelEvent(
  event: Pick<C1Event, "method" | "path" | "protocol" | "status" | "error">,
): boolean {
  return isModelRequestAttempt(event) && event.status >= 200 && event.status < 300 && event.error === null;
}

/** True when at least one observed model identity proves the requested model. */
export function modelIdentityMatches(
  event: Pick<C1Event, "model_requested" | "model_served">,
  expectedModel: string,
): boolean {
  const observed = [event.model_requested, event.model_served].filter((model): model is string => model !== null);
  return observed.length > 0 && observed.every((model) => model === expectedModel);
}

export const PRE_INFERENCE_REJECTION_DETAIL = "status 400: DeepSeek rejected unsupported response_format before inference";

/** S1 proves this exact DeepSeek rejection before emitting the identifying error.
 * It is still a failed attempt: preserve its timing and absent usage.
 */
export function isPreInferenceRejection(event: C1Event): boolean {
  const path = event.path.split("?")[0];
  return event.method === "POST" && event.protocol === "anthropic_messages" &&
    ["/messages", "/v1/messages", "/api/v1/messages"].includes(path ?? "") &&
    event.model_requested === "deepseek/deepseek-v4.1-flash" && event.model_served === null &&
    event.status === 400 && event.streamed === false && event.usage === null &&
    event.usage_source === "unavailable" && event.usage_lookup === "not_attempted" &&
    event.error?.kind === "upstream_rejected" && event.error.detail === PRE_INFERENCE_REJECTION_DETAIL;
}
