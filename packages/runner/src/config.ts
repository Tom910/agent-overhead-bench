import { ConfigError } from "@aob/contracts";

function isLoopbackHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return normalized === "localhost" || normalized === "127.0.0.1" || normalized === "::1";
}

/**
 * Prevents an explicit remote run from reaching adapter startup without the
 * credential that the approved OpenRouter route requires. Loopback upstreams
 * are intentionally allowed for zero-spend diagnostics.
 */
export function assertProviderCredentials(upstream: string | undefined, env: Record<string, string | undefined> = process.env): void {
  if (upstream === undefined) return;
  let loopback = false;
  try {
    loopback = isLoopbackHostname(new URL(upstream).hostname);
  } catch {
    // Let the normal upstream request path report malformed URLs. A key does
    // not make an invalid endpoint safe, so this is treated as remote here.
  }
  if (loopback) return;
  if (upstream.replace(/\/$/, "") !== "https://openrouter.ai/api" && env.AOB_ALLOW_CUSTOM_UPSTREAM !== "1") {
    throw new ConfigError("custom remote upstream requires AOB_ALLOW_CUSTOM_UPSTREAM=1 (the key is otherwise restricted to OpenRouter)");
  }
  if (env.OPENROUTER_API_KEY?.trim()) return;
  throw new ConfigError("remote upstream requires OPENROUTER_API_KEY (value is never printed)");
}
