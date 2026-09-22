export type RequestConditions = {
  status: "captured" | "unavailable";
  parameters: Record<string, number | boolean | string | string[]>;
  omitted: string[];
  invalid: string[];
};
const numeric = ["temperature", "top_p", "top_k", "seed", "max_tokens", "max_completion_tokens", "max_output_tokens", "frequency_penalty", "presence_penalty", "reasoning.max_tokens", "thinking.budget_tokens"];
const enums: Record<string, readonly string[]> = {
  reasoning_effort: ["none", "minimal", "low", "medium", "high", "xhigh"],
  "reasoning.effort": ["none", "minimal", "low", "medium", "high", "xhigh"],
  "thinking.type": ["enabled", "disabled", "adaptive"],
  "output_config.effort": ["low", "medium", "high", "max"],
  "cache_control.type": ["ephemeral"], "cache_control.ttl": ["5m", "1h"],
  prompt_cache_retention: ["in-memory", "24h"],
};
const boolean = ["reasoning.enabled", "reasoning.exclude", "provider.allow_fallbacks", "provider.require_parameters"];
const lists = ["provider.only", "provider.ignore", "provider.order"];
const fields = [...numeric, ...Object.keys(enums), ...boolean, ...lists];
function object(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

/** Observe forwarded settings; absence never means a known provider default. */
export function captureRequestConditions(bytes: Buffer, complete = true, secrets: readonly string[] = []): RequestConditions {
  const unavailable: RequestConditions = { status: "unavailable", parameters: {}, omitted: [], invalid: [] };
  if (!complete || bytes.length > 16 * 1024 * 1024) return unavailable;
  let body: Record<string, unknown> | undefined;
  try { body = object(JSON.parse(bytes.toString("utf8"))); } catch { return unavailable; }
  if (!body) return unavailable;
  const result: RequestConditions = { status: "captured", parameters: {}, omitted: [], invalid: [] };
  for (const key of fields) {
    const parts = key.split(".");
    const parent = parts.length === 1 ? body : object(body[parts[0]!]);
    const value = parent?.[parts.at(-1)!];
    if (value === undefined) {
      if (parts.length > 1 && body[parts[0]!] !== undefined && !parent) result.invalid.push(key);
      else result.omitted.push(key);
      continue;
    }
    if (numeric.includes(key) && typeof value === "number" && Number.isFinite(value)) result.parameters[key] = value;
    else if (boolean.includes(key) && typeof value === "boolean") result.parameters[key] = value;
    else if (enums[key]?.includes(String(value)) && typeof value === "string" && !secrets.includes(value)) result.parameters[key] = value;
    else if (lists.includes(key) && Array.isArray(value) && value.length <= 32 && value.every(v => typeof v === "string" && /^[a-z0-9][a-z0-9/_-]{0,63}$/.test(v) && !/^sk[-_]/i.test(v) && !secrets.some(s => s.length > 0 && v.includes(s)))) result.parameters[key] = value as string[];
    else result.invalid.push(key);
  }
  return result;
}
