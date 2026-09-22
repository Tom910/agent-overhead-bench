import { closeSync, constants, createWriteStream, fchmodSync, fstatSync, fsync, ftruncateSync, openSync, type WriteStream } from "node:fs";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { Transform, type TransformCallback } from "node:stream";
import { Agent, request as undiciRequest } from "undici";
import {
  ConfigError,
  PRE_INFERENCE_REJECTION_DETAIL,
  validateC1Event,
  type C1Event,
  type ClockAnchor,
  type UsageLookup,
} from "@aob/contracts";
import { detectProtocol, extractGenerationUsage, peekModel, type ResponseMetadata } from "./usage.js";
import { captureRequestConditions, type RequestConditions } from "./request-conditions.js";
import { ResponseMetadataCapture } from "./response-capture.js";
import { routedRequestBody, RoutingRequestError } from "./provider-routing.js";
import { UpstreamEvidenceCapture, upstreamEvidenceRecord, type UpstreamEvidenceSnapshot } from "./upstream-evidence.js";

export type ProxyOptions = {
  run_id: string;
  upstream: string;
  outPath: string;
  /** Runner-owned provider credential. Never sourced from the client request. */
  upstreamApiKey?: string;
  /** Explicit measurement condition: merge exclusions into model request JSON. */
  ignoredProviders?: readonly string[];
  onlyProvider?: string;
  /** Ephemeral Docker relay credential. Direct host callers omit this. */
  authToken?: string;
  /** Optional exact request-model gate before any provider traffic. */
  expectedModel?: string;
  /** Optional admission cap across all model POSTs; failures are not refunded. */
  maxModelRequests?: number;
  port?: number;
  /** Bind address. Docker cells use 0.0.0.0 so host.docker.internal can reach the proxy. */
  host?: string;
};

export type ProxyHandle = {
  port: number;
  baseUrl: string;
  anchor: ClockAnchor;
  flush: () => Promise<void>;
  close: () => Promise<void>;
};

const HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
  "x-aob-proxy-token",
]);

const ALLOWED_PATHS = new Set([
  "GET /api/tags",
  "GET /api/v1/models",
  "GET /props",
  "GET /v1",
  "GET /v1/models",
  "GET /v1/props",
  "GET /version",
  "POST /messages",
  // Anthropic Messages. Clients that are given an origin-style base URL append
  // /v1/messages, which the bare "/messages" entry does not cover.
  "POST /v1/messages",
  "POST /v1/chat/completions",
  "POST /v1/responses",
  "POST /responses",
]);

// Keep request buffering bounded as well. This is large enough for the
// intended coding-agent prompts while preventing an untrusted client from
// making the proxy retain an unbounded body before forwarding it.
const MAX_REQUEST_BODY_BYTES = 16 * 1024 * 1024;
const GENERATION_LOOKUP_TIMEOUT_MS = 5_000;

/**
 * Join a client request path onto the configured upstream without doubling a
 * prefix the upstream already carries. The official launcher supplies
 * OpenRouter's API root (`.../api`), while agents may use either the
 * origin-root convention (`/api/v1/...`) or the versioned one (`/v1/...`).
 * Forwarding the first verbatim produced `.../api/api/v1/...` and a 404, which
 * the run then measured as agent overhead rather than a harness defect.
 */
export function upstreamRequestPath(upstreamOrigin: string, path: string): string {
  const strip = (prefix: string): string | undefined =>
    path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${prefix}?`)
      ? path.slice(prefix.length) || "/"
      : undefined;
  if (upstreamOrigin.endsWith("/api")) return strip("/api") ?? path;
  if (upstreamOrigin.endsWith("/api/v1")) return strip("/api/v1") ?? strip("/v1") ?? path;
  return path;
}

function generationLookupUrl(upstreamOrigin: string, id: string): string {
  // The official launcher supplies OpenRouter's API root (`.../api`), while
  // callers may provide the already-versioned root or a local test origin.
  const path = upstreamOrigin.endsWith("/api")
    ? "/v1/generation"
    : upstreamOrigin.endsWith("/api/v1")
      ? "/generation"
      : "/api/v1/generation";
  return `${upstreamOrigin}${path}?id=${encodeURIComponent(id)}`;
}

function filterHeaders(headers: IncomingMessage["headers"]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    if (v === undefined) continue;
    if (HOP.has(k.toLowerCase())) continue;
    out[k] = Array.isArray(v) ? (v[0] ?? "") : v;
  }
  return out;
}

function headerValue(headers: IncomingMessage["headers"], name: string): string | undefined {
  const value = headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function upstreamHeaders(headers: IncomingMessage["headers"], upstreamApiKey: string | undefined): Record<string, string> {
  const filtered = filterHeaders(headers);
  for (const name of ["api-key", "x-api-key", "x-goog-api-key", "x-azure-api-key"]) delete filtered[name];
  if (upstreamApiKey !== undefined) filtered.authorization = `Bearer ${upstreamApiKey}`;
  return filtered;
}

// Model ids contain slashes ("z-ai/glm-5.3-flash"), so a lookup arrives as
// /v1/models/z-ai/glm-5.3-flash and cannot be expressed as an exact path.
// These are read-only metadata reads that succeed against the provider
// directly; refusing them charged the agent under test for harness overhead.
const ALLOWED_GET_PREFIXES = ["/api/v1/models/", "/v1/models/"];

function allowedPath(method: string, requestUrl: string): boolean {
  try {
    const pathname = new URL(requestUrl, "http://aob-proxy.invalid").pathname;
    const verb = method.toUpperCase();
    if (ALLOWED_PATHS.has(`${verb} ${pathname}`)) return true;
    return verb === "GET"
      && ALLOWED_GET_PREFIXES.some((prefix) => pathname.startsWith(prefix) && pathname.length > prefix.length)
      && !pathname.includes("..");
  } catch {
    return false;
  }
}

/** Reject ambiguous model keys without reserializing large numeric request values. */
function matchesExpectedModel(body: Buffer, expected: string): boolean {
  let text: string; let parsed: unknown;
  try {
    text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(body);
    parsed = JSON.parse(text);
  } catch { return false; }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed) ||
      (parsed as Record<string, unknown>).model !== expected) return false;
  let depth = 0; let modelFields = 0;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === "{" || ch === "[") depth += 1;
    else if (ch === "}" || ch === "]") depth -= 1;
    else if (ch === '"') {
      const start = i;
      for (i += 1; i < text.length && text[i] !== '"'; i += 1) if (text[i] === "\\") i += 1;
      let next = i + 1;
      while (/\s/.test(text[next] ?? "")) next += 1;
      if (depth === 1 && text[next] === ":" && JSON.parse(text.slice(start, i + 1)) === "model") modelFields += 1;
    }
  }
  return modelFields === 1;
}

async function modelGuardBody(req: IncomingMessage, now: () => number): Promise<{ preview: Buffer; oversized: false; t_end: number }> {
  if (req.headers["content-encoding"] !== undefined && req.headers["content-encoding"] !== "identity") {
    throw new RoutingRequestError(400, "model guard requires an unencoded JSON request");
  }
  const chunks: Buffer[] = []; let bytes = 0;
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    const buffer = Buffer.from(chunk as Uint8Array);
    bytes += buffer.length;
    if (bytes > MAX_REQUEST_BODY_BYTES) throw new RoutingRequestError(413, "model guard request exceeds 16 MiB");
    chunks.push(buffer);
  }
  return { preview: Buffer.concat(chunks), oversized: false, t_end: now() };
}

type RequestBodyCapture = {
  stream: Transform;
  done: Promise<{ preview: Buffer; oversized: boolean; t_end: number }>;
};

function streamRequestBody(req: IncomingMessage, now: () => number): RequestBodyCapture {
  const chunks: Buffer[] = [];
  let bytes = 0;
  let oversized = false;
  let ended = false;
  let settled = false;
  const stream = new Transform({
    transform(chunk: Buffer, _encoding: BufferEncoding, callback: TransformCallback) {
      bytes += chunk.byteLength;
      if (bytes > MAX_REQUEST_BODY_BYTES) {
        oversized = true;
        chunks.length = 0;
      } else if (!oversized) {
        chunks.push(Buffer.from(chunk));
      }
      callback(null, chunk);
    },
  });
  const done = new Promise<{ preview: Buffer; oversized: boolean; t_end: number }>((resolve, reject) => {
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      stream.destroy(error);
      reject(error);
    };
    req.once("end", () => {
      ended = true;
      if (settled) return;
      settled = true;
      resolve({ preview: Buffer.concat(chunks), oversized, t_end: now() });
    });
    req.once("aborted", () => fail(new Error("client request aborted before body completed")));
    req.once("error", (error: Error) => fail(error));
    req.once("close", () => {
      if (!ended) fail(new Error("client request closed before body completed"));
    });
    stream.once("error", (error: Error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    });
  });
  req.pipe(stream);
  return { stream, done };
}

function appendRecord(stream: WriteStream, event: unknown): Promise<void> {
  const line = `${JSON.stringify(event)}\n`;
  return new Promise((resolve, reject) => {
    stream.write(line, (err) => {
      if (err) {
        reject(err);
        return;
      }
      const fd = (stream as unknown as { fd?: number }).fd;
      if (typeof fd !== "number") {
        resolve();
        return;
      }
      fsync(fd, (syncErr) => (syncErr ? reject(syncErr) : resolve()));
    });
  });
}

function privateEvidenceStream(path: string): WriteStream {
  let fd: number | undefined;
  try {
    fd = openSync(path, constants.O_RDWR | constants.O_CREAT | constants.O_NOFOLLOW | constants.O_NONBLOCK, 0o600);
    if (!fstatSync(fd).isFile()) throw new ConfigError("upstream evidence must be a regular file");
    fchmodSync(fd, 0o600);
    ftruncateSync(fd, 0);
    return createWriteStream(path, { fd, autoClose: true });
  } catch {
    if (fd !== undefined) closeSync(fd);
    throw new ConfigError("cannot create private upstream evidence file");
  }
}

export async function startProxy(opts: ProxyOptions): Promise<ProxyHandle> {
  const monotonic_zero = performance.now();
  const anchor: ClockAnchor = {
    wall_clock_iso: new Date().toISOString(),
    monotonic_zero,
  };
  const now = () => performance.now() - monotonic_zero;
  const upstreamOrigin = opts.upstream.replace(/\/$/, "");
  const ignoredProviders = [...(opts.ignoredProviders ?? [])];
  const onlyProvider = opts.onlyProvider;
  if (onlyProvider !== undefined && (typeof onlyProvider !== "string" || !/^[a-z0-9][a-z0-9/_-]*$/.test(onlyProvider) ||
    ignoredProviders.some(id => onlyProvider === id || onlyProvider.startsWith(`${id}/`)))) {
    throw new ConfigError("onlyProvider must be a valid, non-excluded provider ID");
  }
  if (!ignoredProviders.every(value => typeof value === "string" && /^[a-z0-9][a-z0-9/_-]*$/.test(value))) {
    throw new ConfigError("invalid ignored provider identifier");
  }
  if (opts.authToken !== undefined && !/^[A-Za-z0-9_-]{32,}$/.test(opts.authToken)) {
    throw new ConfigError("proxy auth token is invalid");
  }
  if (opts.expectedModel !== undefined && (typeof opts.expectedModel !== "string" || opts.expectedModel.length === 0 || /[\s\x00-\x1f\x7f]/.test(opts.expectedModel))) {
    throw new ConfigError("expectedModel must be a nonempty model identity without whitespace or control characters");
  }
  if (opts.maxModelRequests !== undefined && (!Number.isSafeInteger(opts.maxModelRequests) || opts.maxModelRequests <= 0)) {
    throw new ConfigError("maxModelRequests must be a positive safe integer");
  }
  let admittedModelRequests = 0;
  let seq = 0;
  const pendingEvents = new Set<Promise<void>>();
  const pendingRequests = new Set<Promise<void>>();
  const requestControllers = new Set<AbortController>();
  const evidenceOut = privateEvidenceStream(`${opts.outPath}.upstream.jsonl`);
  const out = createWriteStream(opts.outPath, { flags: "w" });
  let persistenceFailure: ConfigError | undefined;
  const rememberPersistenceFailure = (): ConfigError => persistenceFailure ??= new ConfigError("proxy evidence persistence failed");
  out.on("error", rememberPersistenceFailure);
  evidenceOut.on("error", rememberPersistenceFailure);
  const dispatcher = new Agent({ connections: 32, keepAliveTimeout: 10_000, keepAliveMaxTimeout: 30_000 });

  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const controller = new AbortController();
    requestControllers.add(controller);
    const request = handle(req, res, controller.signal).finally(() => requestControllers.delete(controller));
    pendingRequests.add(request);
    void request.then(
      () => pendingRequests.delete(request),
      () => pendingRequests.delete(request),
    );
  });

  async function handle(req: IncomingMessage, res: ServerResponse, signal: AbortSignal): Promise<void> {
    const t_req_start = now();
    const arrivalSeq = seq;
    seq += 1;
    const path = req.url ?? "/";
    let observedModel: string | null = null;
    let requestConditions: RequestConditions = { status: "unavailable", parameters: {}, omitted: [], invalid: [] };
    let observedBodyEnd: number | undefined;
    let observedUpstreamSent: number | undefined;
    let observedFirstByte: number | undefined;
    let observedStreamed = false;
    let evidenceCapture: UpstreamEvidenceCapture | undefined;
    // A refusal still consumed a sequence number, so writing nothing left a gap
    // that fails the report loader outright. It also hid real overhead: the
    // agent issued a call and the harness, not the provider, refused it. Record
    // it. A refused non-model path keeps protocol "unknown", so it is never
    // counted as a model turn.
    const refuse = async (status: number, detail: string): Promise<void> => {
      req.resume();
      res.writeHead(status);
      res.end();
      const stamp = now();
      await writeEvent({
        arrivalSeq,
        t_req_start,
        t_req_body_end: stamp,
        t_upstream_sent: stamp,
        t_first_byte: stamp,
        t_last_byte: stamp,
        path,
        method: req.method ?? "GET",
        protocol: detectProtocol(path),
        model_requested: null,
        status,
        streamed: false,
        metadata: { usage: null, usage_source: "unavailable", model_served: null },
        signal,
        error: { kind: "proxy_refused", detail },
      });
    };
    try {
      if (opts.authToken !== undefined && headerValue(req.headers, "x-aob-proxy-token") !== opts.authToken) {
        await refuse(403, "proxy token mismatch");
        return;
      }
      if (!allowedPath(req.method ?? "GET", path)) {
        await refuse(404, `path not allowed: ${req.method ?? "GET"} ${path.split("?")[0] ?? path}`);
        return;
      }
      const protocol = detectProtocol(path);
      const target = `${upstreamOrigin}${upstreamRequestPath(upstreamOrigin, path)}`;
      const method = req.method ?? "GET";
      let routed: Awaited<ReturnType<typeof routedRequestBody>> | undefined;
      if ((ignoredProviders.length > 0 || onlyProvider !== undefined) && method === "POST" && protocol !== "unknown") {
        try { routed = await routedRequestBody(req, ignoredProviders, now, onlyProvider); }
        catch (error) {
          if (!(error instanceof RoutingRequestError)) throw error;
          await refuse(error.status, error.message);
          return;
        }
      }
      if (opts.expectedModel !== undefined && method === "POST" && protocol !== "unknown") {
        try {
          routed ??= await modelGuardBody(req, now);
          if (!matchesExpectedModel(routed.preview, opts.expectedModel)) throw new RoutingRequestError(400, "requested model does not match the exact model guard");
        } catch (error) {
          if (!(error instanceof RoutingRequestError)) throw error;
          await refuse(error.status, error.message);
          return;
        }
      }
      if (method === "POST" && protocol !== "unknown" && opts.maxModelRequests !== undefined) {
        if (admittedModelRequests >= opts.maxModelRequests) {
          await refuse(429, "model request limit reached");
          return;
        }
        // No await between admission and forwarding. Failed upstream requests
        // retain their slot, including transport errors and provider refusals.
        admittedModelRequests += 1;
      }
      const requestBody = routed !== undefined || method === "GET" || method === "HEAD" ? undefined : streamRequestBody(req, now);
      const headers = upstreamHeaders(req.headers, opts.upstreamApiKey);
      if (routed !== undefined) delete headers["content-length"];
      const init: Parameters<typeof undiciRequest>[1] = {
        method,
        headers,
        dispatcher,
        signal,
      };
      if (requestBody !== undefined) init.body = requestBody.stream;
      if (routed !== undefined) init.body = routed.preview;
      const t_upstream_sent = now();
      observedUpstreamSent = t_upstream_sent;
      const bodyDone = (requestBody?.done ?? Promise.resolve(routed ?? { preview: Buffer.alloc(0), oversized: false, t_end: now() }))
        .then((capture) => {
          observedBodyEnd = capture.t_end;
          requestConditions = captureRequestConditions(capture.preview, !capture.oversized, [opts.upstreamApiKey, opts.authToken, headerValue(req.headers, "authorization"), headerValue(req.headers, "x-api-key")].filter((s): s is string => typeof s === "string"));
          observedModel = capture.oversized ? null : peekModel(capture.preview);
          return capture;
        });
      const [upstreamRes, bodyCapture] = await Promise.all([undiciRequest(target, init), bodyDone]);
      const t_req_body_end = bodyCapture.t_end;
      // The upstream stream starts before the client has necessarily finished
      // uploading. C1 keeps these fields ordered, so report the observable
      // request boundary at the later of the two events.
      const orderedUpstreamSent = Math.max(t_upstream_sent, t_req_body_end);
      const model_requested = bodyCapture.oversized ? null : peekModel(bodyCapture.preview);
      const generationId = upstreamRes.headers["x-generation-id"];
      evidenceCapture = new UpstreamEvidenceCapture({ status: upstreamRes.statusCode,
        contentType: headerValue(upstreamRes.headers, "content-type"), generationId,
        requestId: upstreamRes.headers["x-request-id"],
        secrets: [opts.upstreamApiKey, opts.authToken, headerValue(req.headers, "authorization"),
          headerValue(req.headers, "x-api-key"), headerValue(req.headers, "api-key")],
      });
      const outHeaders: Record<string, string> = {};
      for (const [k, v] of Object.entries(upstreamRes.headers)) {
        if (v === undefined) continue;
        if (HOP.has(k.toLowerCase())) continue;
        outHeaders[k] = Array.isArray(v) ? (v[0] ?? "") : String(v);
      }
      res.writeHead(upstreamRes.statusCode, outHeaders);
      observedStreamed = (outHeaders["content-type"] ?? "").includes("event-stream");
      const capture = new ResponseMetadataCapture(protocol, outHeaders["content-type"]);
      let t_first_byte: number | undefined;
      const body = upstreamRes.body;
      if (!body) {
        t_first_byte = now();
        res.end();
        const t_last_byte = now();
        await writeEvent({
          arrivalSeq,
          t_req_start,
          t_req_body_end,
          t_upstream_sent: orderedUpstreamSent,
          t_first_byte,
          t_last_byte,
          path,
          method,
          protocol,
          model_requested,
          status: upstreamRes.statusCode,
          streamed: false,
          metadata: capture.finish(),
          upstreamEvidence: evidenceCapture.snapshot(true),
          requestConditions,
          generationId,
          requestHeaders: req.headers,
          signal,
          ...(upstreamRes.statusCode >= 400
            ? { error: { kind: "upstream_http", detail: `status ${upstreamRes.statusCode}` } }
            : {}),
        });
        return;
      }
      for await (const chunk of body) {
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        if (t_first_byte === undefined) t_first_byte = now();
        observedFirstByte = t_first_byte;
        capture.push(buf);
        evidenceCapture.push(buf);
        if (!res.destroyed) res.write(buf);
      }
      const t_last_byte = now();
      if (!res.destroyed) res.end();
      await writeEvent({
        arrivalSeq,
        t_req_start,
        t_req_body_end,
        t_upstream_sent: orderedUpstreamSent,
        t_first_byte: t_first_byte ?? t_last_byte,
        t_last_byte,
        path,
        method,
        protocol,
        model_requested,
        status: upstreamRes.statusCode,
        streamed: (outHeaders["content-type"] ?? "").includes("event-stream"),
        metadata: capture.finish(),
        upstreamEvidence: evidenceCapture.snapshot(true),
        requestConditions,
        generationId,
        requestHeaders: req.headers,
        signal,
        ...(upstreamRes.statusCode >= 400
          ? { error: evidenceCapture.isPreInferenceRejection(upstreamOrigin, onlyProvider, bodyCapture.preview)
            ? { kind: "upstream_rejected", detail: PRE_INFERENCE_REJECTION_DETAIL }
            : { kind: "upstream_http", detail: `status ${upstreamRes.statusCode}` } }
          : {}),
      });
    } catch (err) {
      // Artifact failure must never become a second network event for this request.
      if (err === persistenceFailure) throw err;
      const t_last_byte = now();
      if (!res.headersSent) {
        res.writeHead(502, { "content-type": "application/json" });
      }
      if (!res.destroyed) res.end();
      const protocol = detectProtocol(path);
      await writeEvent({
        arrivalSeq,
        t_req_start,
        t_req_body_end: observedBodyEnd ?? t_last_byte,
        t_upstream_sent: Math.max(observedUpstreamSent ?? t_last_byte, observedBodyEnd ?? t_last_byte),
        t_first_byte: observedFirstByte ?? t_last_byte,
        t_last_byte,
        path,
        method: req.method ?? "POST",
        protocol,
        model_requested: observedModel,
        status: 0,
        streamed: observedStreamed,
        metadata: { usage: null, usage_source: "unavailable", model_served: null },
        ...(evidenceCapture === undefined ? {} : { upstreamEvidence: evidenceCapture.snapshot(false) }),
        requestConditions,
        error: {
          kind: "network",
          detail: err instanceof Error ? err.message : String(err),
        },
        signal,
      });
    }
  }

  async function writeEvent(args: {
    arrivalSeq: number;
    t_req_start: number;
    t_req_body_end: number;
    t_upstream_sent: number;
    t_first_byte: number;
    t_last_byte: number;
    path: string;
    method: string;
    protocol: C1Event["protocol"];
    model_requested: string | null;
    status: number;
    streamed: boolean;
    metadata: ResponseMetadata;
    upstreamEvidence?: UpstreamEvidenceSnapshot;
    requestConditions?: RequestConditions;
    generationId?: string | string[] | undefined;
    requestHeaders?: IncomingMessage["headers"];
    signal: AbortSignal;
    error?: { kind: string; detail: string };
  }): Promise<void> {
    const extracted = args.error
      ? { usage: null, usage_source: "unavailable" as const }
      : args.metadata;
    const attemptLookup = extracted.usage === null && !args.error;
    const lookup = attemptLookup
      ? await lookupGenerationUsage(args.generationId, args.requestHeaders ?? {}, args.signal)
      : { usage: null, outcome: "not_attempted" as const };
    const finalUsage = extracted.usage !== null
      ? extracted
      : lookup.usage !== null
        ? { usage: lookup.usage, usage_source: "generation_lookup" as const }
        : extracted;
    const event: C1Event = {
      v: 1,
      run_id: opts.run_id,
      seq: args.arrivalSeq,
      t_req_start: args.t_req_start,
      t_req_body_end: args.t_req_body_end,
      t_upstream_sent: args.t_upstream_sent,
      t_first_byte: args.t_first_byte,
      t_last_byte: args.t_last_byte,
      duration_ms: args.t_last_byte - args.t_req_start,
      method: args.method,
      path: args.path,
      protocol: args.protocol,
      model_requested: args.model_requested,
      model_served: args.error ? null : args.metadata.model_served,
      status: args.status,
      streamed: args.streamed,
      usage: finalUsage.usage,
      usage_source: finalUsage.usage_source,
      usage_lookup: lookup.outcome,
      error: args.error ?? null,
    };
    validateC1Event(event);
    const write = Promise.allSettled([appendRecord(out, event), appendRecord(evidenceOut, { ...upstreamEvidenceRecord(event, args.upstreamEvidence), request_conditions: args.requestConditions ?? { status: "unavailable", parameters: {}, omitted: [], invalid: [] } })]).then(results => {
      if (results.some(result => result.status === "rejected")) throw rememberPersistenceFailure();
    });
    pendingEvents.add(write);
    try {
      await write;
    } finally {
      pendingEvents.delete(write);
    }
  }

  /**
   * Recover usage from the provider's own generation record. Every exit
   * reports why it ended: an event that says only "unavailable" cannot
   * distinguish a broken fallback from a provider that returned nothing, and
   * that ambiguity hid a permanently failing lookup for the entire history of
   * this repository.
   */
  async function lookupGenerationUsage(
    generationId: string | string[] | undefined,
    headers: IncomingMessage["headers"],
    signal: AbortSignal,
  ): Promise<{ usage: C1Event["usage"]; outcome: UsageLookup }> {
    const id = Array.isArray(generationId) ? generationId[0] : generationId;
    if (!id) return { usage: null, outcome: "missing_generation_id" };
    const authorization = opts.upstreamApiKey === undefined
      ? headerValue(headers, "authorization")
      : `Bearer ${opts.upstreamApiKey}`;
    if (!authorization) return { usage: null, outcome: "missing_authorization" };
    let statusCode: number;
    let body: Buffer;
    try {
      const lookup = await undiciRequest(
        generationLookupUrl(upstreamOrigin, id),
        {
          method: "GET",
          headers: { authorization },
          dispatcher,
          signal: AbortSignal.any([signal, AbortSignal.timeout(GENERATION_LOOKUP_TIMEOUT_MS)]),
          headersTimeout: GENERATION_LOOKUP_TIMEOUT_MS,
          bodyTimeout: GENERATION_LOOKUP_TIMEOUT_MS,
        },
      );
      statusCode = lookup.statusCode;
      body = Buffer.from(await lookup.body.arrayBuffer());
    } catch {
      return { usage: null, outcome: "request_failed" };
    }
    if (statusCode < 200 || statusCode >= 300) return { usage: null, outcome: "http_error" };
    const usage = extractGenerationUsage(body);
    return usage === null ? { usage: null, outcome: "unparsable" } : { usage, outcome: "recovered" };
  }

  async function flush(): Promise<void> {
    while (pendingRequests.size > 0 || pendingEvents.size > 0) {
      const results = await Promise.allSettled([...pendingRequests, ...pendingEvents]);
      if (results.some(result => result.status === "rejected")) rememberPersistenceFailure();
    }
    if (persistenceFailure) throw persistenceFailure;
  }

  async function closeWriter(stream: WriteStream): Promise<void> {
    if (stream.closed) return;
    await new Promise<void>(resolve => {
      stream.once("close", resolve);
      if (!stream.destroyed) stream.end();
    });
  }

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(opts.port ?? 0, opts.host ?? "127.0.0.1", () => resolve());
  });
  const addr = server.address();
  if (!addr || typeof addr === "string") {
    throw new ConfigError("proxy failed to bind");
  }
  let closePromise: Promise<void> | undefined;
  return {
    port: addr.port,
    baseUrl: `http://127.0.0.1:${addr.port}`,
    anchor,
    flush,
    close: () => closePromise ??= new Promise<void>((resolve, reject) => {
      for (const controller of requestControllers) controller.abort();
      server.closeAllConnections();
      server.close((err) => {
        void (async () => {
          // Drain and release every resource even when evidence could not be saved.
          await flush().catch(() => rememberPersistenceFailure());
          const results = await Promise.allSettled([dispatcher.close(), closeWriter(out), closeWriter(evidenceOut)]);
          if (persistenceFailure) throw persistenceFailure;
          if (err || results.some(result => result.status === "rejected")) throw new ConfigError("proxy cleanup failed");
        })().then(resolve, reject);
      });
    }),
  };
}
