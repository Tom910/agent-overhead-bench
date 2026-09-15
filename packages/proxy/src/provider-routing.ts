import type { IncomingMessage } from "node:http";
import { ConfigError } from "@aob/contracts";

export class RoutingRequestError extends ConfigError {
  readonly status: 400 | 413;
  constructor(status: 400 | 413, detail: string) { super(detail); this.status = status; }
}

// Locate only top-level member values in already-validated JSON. Splicing the
// original text avoids changing large numbers, escape sequences or whitespace.
function objectFields(text: string): Array<{ key: string; start: number; end: number }> {
  const fields: Array<{ key: string; start: number; end: number }> = [];
  let i = text.indexOf("{") + 1;
  while (i < text.length) {
    while (/\s/.test(text[i] ?? "") || text[i] === ",") i++;
    if (text[i] === "}") break;
    const keyStart = i++;
    while (i < text.length && text[i] !== '"') { if (text[i] === "\\") i++; i++; }
    const key = JSON.parse(text.slice(keyStart, ++i)) as string;
    while (text[i] !== ":") i++;
    i++;
    while (/\s/.test(text[i] ?? "")) i++;
    const start = i;
    let depth = 0; let quoted = false;
    for (; i < text.length; i++) {
      const ch = text[i];
      if (quoted) { if (ch === "\\") i++; else if (ch === '"') quoted = false; continue; }
      if (ch === '"') { quoted = true; continue; }
      if (depth === 0 && (ch === "," || ch === "}")) break;
      if (ch === "{" || ch === "[") depth++;
      else if (ch === "}" || ch === "]") depth--;
    }
    let end = i;
    while (/\s/.test(text[end - 1] ?? "")) end--;
    fields.push({ key, start, end });
  }
  return fields;
}

function replaceMember(text: string, key: string, value: string): string {
  const fields = objectFields(text);
  const matches = fields.filter(field => field.key === key);
  if (matches.length > 1) throw new RoutingRequestError(400, `duplicate routing member ${key}`);
  const field = matches[0];
  if (field) return text.slice(0, field.start) + value + text.slice(field.end);
  const end = text.lastIndexOf("}");
  return text.slice(0, end) + (fields.length > 0 ? "," : "") + JSON.stringify(key) + ":" + value + text.slice(end);
}

export async function routedRequestBody(req: IncomingMessage, ignored: readonly string[], now: () => number, onlyProvider?: string): Promise<{ preview: Buffer; oversized: false; t_end: number }> {
  if (req.headers["content-encoding"] !== undefined && req.headers["content-encoding"] !== "identity") {
    throw new RoutingRequestError(400, "provider routing requires an unencoded JSON request");
  }
  const chunks: Buffer[] = [];
  let bytes = 0;
  // Do not destroy the IncomingMessage on a size refusal: the caller still
  // needs its socket to return the error and drains the remaining upload.
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    const buffer = Buffer.from(chunk as Uint8Array);
    bytes += buffer.length;
    if (bytes > 16 * 1024 * 1024) throw new RoutingRequestError(413, "provider routing request exceeds 16 MiB");
    chunks.push(buffer);
  }
  const t_end = now();
  let parsed: unknown; let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(Buffer.concat(chunks));
    parsed = JSON.parse(text);
  }
  catch { throw new RoutingRequestError(400, "provider routing requires valid JSON"); }
  const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
  if (!record(parsed)) throw new RoutingRequestError(400, "provider routing requires a JSON object");
  const provider = parsed.provider ?? {};
  if (!record(provider)) throw new RoutingRequestError(400, "provider must be an object");
  const existing = provider.ignore ?? [];
  if (!Array.isArray(existing) || !existing.every(x => typeof x === "string")) throw new RoutingRequestError(400, "provider.ignore must be a string array");
  const providerFields = objectFields(text).filter(field => field.key === "provider");
  if (providerFields.length > 1) throw new RoutingRequestError(400, "duplicate routing member provider");
  const providerField = providerFields[0];
  const providerText = parsed.provider == null || !providerField ? "{}" : text.slice(providerField.start, providerField.end);
  const exclusions = [...new Set([...existing, ...ignored])];
  if (onlyProvider !== undefined && exclusions.some(id => onlyProvider === id || onlyProvider.startsWith(`${id}/`))) {
    throw new RoutingRequestError(400, "provider.ignore excludes the pinned provider");
  }
  let merged = ignored.length > 0 ? replaceMember(providerText, "ignore", JSON.stringify(exclusions)) : providerText;
  if (objectFields(providerText).filter(field => field.key === "ignore").length > 1) {
    throw new RoutingRequestError(400, "duplicate routing member ignore");
  }
  if (onlyProvider !== undefined) {
    merged = replaceMember(merged, "only", JSON.stringify([onlyProvider]));
    merged = replaceMember(merged, "allow_fallbacks", "false");
  }
  return { preview: Buffer.from(replaceMember(text, "provider", merged)), oversized: false, t_end };
}
