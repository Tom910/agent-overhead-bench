import { createServer, request as httpRequest } from 'node:http';
import { timingSafeEqual } from 'node:crypto';
import { constants } from 'node:fs';
import { open, lstat, readFile } from 'node:fs/promises';
import { dirname, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import { startProxy } from '@aob/proxy';

const MAX_BODY = 16 * 1024 * 1024;
const MAX_OBSERVATIONS = 128;
const MAX_FRONT_REJECTIONS = 128;
export class BridgeServiceError extends Error {
  constructor() { super('Codex bridge service failed'); this.name = 'BridgeServiceError'; }
}

/** Retain booleans only; never persist prompts, output text, keys or account identity. */
export function observeRequest(body, marker) {
  const object = body !== null && typeof body === 'object' && !Array.isArray(body);
  const input = object && Array.isArray(body.input) ? body.input : null;
  const observation = {
    accepted: false,
    model_matches: object && body.model === 'gpt-6-luna',
    effort_low: object && body.reasoning?.effort === 'low',
    summary_auto: object && body.reasoning?.summary === 'auto',
    store_false: object && body.store === false,
    reasoning_replay_absent: input !== null && input.every(item => item && typeof item === 'object' && item.type !== 'reasoning'),
    continuation_absent: object && !Object.hasOwn(body, 'previous_response_id') && !Object.hasOwn(body, 'conversation'),
    tool_result_observed: input !== null && input.some(item => item?.type === 'function_call_output' && (
      typeof item.output === 'string' ? item.output.includes(marker)
        : Array.isArray(item.output) && item.output.some(part => ['input_text', 'text'].includes(part?.type)
          && typeof part.text === 'string' && part.text.includes(marker)))),
  };
  observation.accepted = observation.model_matches && observation.effort_low && observation.summary_auto
    && observation.store_false && observation.reasoning_replay_absent && observation.continuation_absent;
  return observation;
}
function authenticated(actual, expected) {
  if (typeof actual !== 'string') return false;
  const a = Buffer.from(actual); const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
/** Classify transient request fields into fixed labels; never retain raw targets. */
function rejectionCategory(req, reason, status) {
  const target = typeof req.url === 'string' ? req.url : '';
  const path = target.split('?', 1)[0];
  let route = 'other';
  if (/^\/(?:v1\/)?responses$/.test(path)) route = 'responses';
  else if (/^\/(?:v1\/)?chat\/completions$/.test(path)) route = 'chat-completions';
  else if (/^\/(?:v1\/)?models$/.test(path)) route = 'models';
  else if (path === '/v1/models/gpt-6-luna') route = 'model-detail';
  else if (/^\/(?:v1\/)?generation$/.test(path)) route = 'generation';
  else if (/^\/(?:v1\/)?responses\/compact$/.test(path)) route = 'responses-compact';
  else if (path === '/api/v1/models') route = 'api-models';
  else if (path === '/api/tags') route = 'backend-tags';
  else if (['/v1/props', '/props'].includes(path)) route = 'backend-properties';
  else if (path === '/version') route = 'backend-version';
  else if (path === '/api/show') route = 'backend-show';
  else if (['/', '/health', '/healthz', '/ready', '/readyz'].includes(path)) route = 'root-or-health';
  const method = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS', 'CONNECT', 'TRACE'].includes(req.method) ? req.method : 'other';
  return { reason, status, method, route, query_present: target.includes('?') };
}
function reject(res, status) {
  if (res.headersSent) { res.destroy(); return; }
  res.writeHead(status, { 'content-type': 'application/json', connection: 'close' });
  res.end('{"error":"bridge request refused"}');
}
async function bodyBytes(req) {
  const parts = []; let size = 0;
  for await (const part of req) {
    size += part.length;
    if (size > MAX_BODY) return null;
    parts.push(part);
  }
  return Buffer.concat(parts);
}
export function responseTransport(headers) {
  const classify = (value, allowed) => value === undefined ? 'absent' : typeof value === 'string' && allowed.includes(value.toLowerCase().split(';', 1)[0].trim()) ? value.toLowerCase().split(';', 1)[0].trim() : 'other';
  return { response_content_type: classify(headers['content-type'], ['text/event-stream','application/json','text/plain','application/octet-stream']), response_content_encoding: classify(headers['content-encoding'], ['identity','gzip','br','deflate']) };
}
function relay(req, res, target, body, active, options = {}) {
  return new Promise(resolve => {
    // Node HTTP does not follow redirects or retry failed requests.
    const headers = { ...req.headers, host: new URL(target).host, 'content-length': String(body.length) };
    delete headers['transfer-encoding'];
    if (options.identityEncoding) headers['accept-encoding'] = 'identity';
    if (options.bridgeAuthorization) {
      headers.authorization = options.bridgeAuthorization;
      delete headers['x-aob-proxy-token'];
    }
    const forwarded = httpRequest(target, { method: req.method, headers }, upstream => {
      options.onResponse?.(upstream.headers);
      res.writeHead(upstream.statusCode ?? 502, upstream.headers);
      upstream.pipe(res);
      upstream.on('error', () => { res.destroy(); });
    });
    active.add(forwarded);
    forwarded.setTimeout(120_000, () => forwarded.destroy());
    forwarded.on('error', () => reject(res, 502));
    forwarded.on('close', () => { active.delete(forwarded); resolve(); });
    res.on('close', () => forwarded.destroy());
    forwarded.end(body);
  });
}
async function listen(server, port, host) {
  server.requestTimeout = 125_000; server.headersTimeout = 10_000;
  await new Promise((resolve, rejectPromise) => { server.once('error', rejectPromise); server.listen(port, host, resolve); });
  return `http://127.0.0.1:${server.address().port}`;
}
async function stop(server) {
  if (!server?.listening) return;
  server.closeAllConnections();
  await new Promise(resolve => server.close(resolve));
}
function validateSpec(spec) {
  if (!spec || typeof spec !== 'object') throw new BridgeServiceError();
  let upstream;
  try { upstream = new URL(spec.upstream); } catch { throw new BridgeServiceError(); }
  const live = spec.upstream === 'https://chatgpt.com/backend-api/codex';
  const mock = upstream.protocol === 'http:' && ['127.0.0.1', 'localhost', 'aob-fake'].includes(upstream.hostname)
    && upstream.pathname === '/backend' && upstream.port !== '' && !upstream.username && !upstream.password && !upstream.search && !upstream.hash;
  if (!live && !mock) throw new BridgeServiceError();
  if (![spec.meterKey, spec.bridgeKey].every(key => typeof key === 'string' && /^[A-Za-z0-9_-]{32,256}$/.test(key))
    || typeof spec.marker !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(spec.marker)
    || typeof spec.runId !== 'string' || !/^[A-Za-z0-9_-]{1,160}$/.test(spec.runId)
    || ![spec.outPath, spec.observationsPath].every(path => typeof path === 'string' && isAbsolute(path))
    || spec.outPath === spec.observationsPath || `${spec.outPath}.upstream.jsonl` === spec.observationsPath) throw new BridgeServiceError();
}

/** Port overrides support isolated local integration; the CLI always uses the fixed topology. */
export async function startBridgeService(spec, options = {}) {
  validateSpec(spec);
  const maxModelRequests = options.maxModelRequests === undefined ? 2 : options.maxModelRequests;
  if (!Number.isSafeInteger(maxModelRequests) || maxModelRequests < 1 || maxModelRequests > 512
    || ['maxInputTokens', 'maxOutputTokens'].some(key => options[key] !== undefined && (!Number.isSafeInteger(options[key]) || options[key] < 1))
    || (options.ingressAuthToken !== undefined && (typeof options.ingressAuthToken !== 'string' || !/^[A-Za-z0-9_-]{32,256}$/.test(options.ingressAuthToken)))) throw new BridgeServiceError();
  const taskMode = ['maxModelRequests', 'maxInputTokens', 'maxOutputTokens', 'ingressAuthToken'].some(key => options[key] !== undefined);
  const observationLimit = taskMode ? 2 * maxModelRequests + 16 : MAX_OBSERVATIONS;
  let admission = Promise.resolve(); let taskForwarded = 0; let taskHalted = false;
  const bridge = options.bridge ?? 'http://127.0.0.1:8317';
  const bridgeUrl = new URL(bridge);
  if (bridgeUrl.protocol !== 'http:' || bridgeUrl.hostname !== '127.0.0.1' || bridgeUrl.pathname !== '/' || bridgeUrl.search || bridgeUrl.hash || bridgeUrl.username || bridgeUrl.password) throw new BridgeServiceError();
  let meter; let gate; let front; let observationsFile; let closePromise;
  const active = new Set(); const pending = new Set();
  const observations = { schema_version: 1, requests: [], front_refused: 0, gate_refused: 0,
    front_rejections: [], front_rejections_truncated: 0 };
  function rejectFront(req, res, reason, status) {
    observations.front_refused++;
    if (observations.front_rejections.length < MAX_FRONT_REJECTIONS) observations.front_rejections.push(rejectionCategory(req, reason, status));
    else observations.front_rejections_truncated++;
    reject(res, status);
  }
  const close = () => closePromise ??= (async () => {
    await stop(front); await stop(gate);
    for (const request of active) request.destroy();
    await Promise.allSettled([...pending]);
    let meterFailure;
    try { await meter?.close(); } catch { meterFailure = new BridgeServiceError(); }
    if (observationsFile) {
      try { await observationsFile.writeFile(`${JSON.stringify(observations)}\n`); await observationsFile.sync(); }
      finally { await observationsFile.close(); }
    }
    if (meterFailure) throw meterFailure;
  })();
  try {
    for (const path of [spec.outPath, spec.observationsPath]) {
      const parent = await lstat(dirname(path));
      if (!parent.isDirectory() || parent.isSymbolicLink() || (parent.mode & 0o077) !== 0) throw new BridgeServiceError();
    }
    // Exclusive reservation also avoids overwriting an earlier qualification slot.
    const sidecar = await open(`${spec.outPath}.upstream.jsonl`, 'wx', 0o600); await sidecar.close();
    const output = await open(spec.outPath, 'wx', 0o600); await output.close();
    observationsFile = await open(spec.observationsPath, 'wx', 0o600);
    meter = await startProxy({ run_id: spec.runId, upstream: spec.upstream, outPath: spec.outPath,
      authToken: spec.meterKey, expectedModel: 'gpt-6-luna', maxModelRequests,
      host: '127.0.0.1', port: options.meterPort ?? 3212 });
    async function taskAdmissionAllowed() {
      if (closePromise || taskHalted) return false;
      try {
        // The completed canonical records are the only token-accounting source.
        // Serial gate ownership prevents another admission while this drains.
        await meter.flush();
        const text = await readFile(spec.outPath, 'utf8');
        const events = text.trim() === '' ? [] : text.trim().split('\n').map(line => JSON.parse(line));
        const actual = events.filter(event => event.method === 'POST' && event.error?.kind !== 'proxy_refused');
        if (actual.length !== taskForwarded) throw new BridgeServiceError();
        let input = 0; let output = 0;
        for (const event of actual) {
          if (event.protocol !== 'openai_responses' || event.status !== 200 || event.error !== null
            || event.model_requested !== 'gpt-6-luna' || event.model_served !== 'gpt-6-luna'
            || !event.usage || !['input', 'cached_input', 'output', 'reasoning_output'].every(key => Number.isSafeInteger(event.usage[key]) && event.usage[key] >= 0)) throw new BridgeServiceError();
          input += event.usage.input; output += event.usage.output;
        }
        if (!Number.isSafeInteger(input) || !Number.isSafeInteger(output)) throw new BridgeServiceError();
        if (actual.length >= maxModelRequests || input >= (options.maxInputTokens ?? Infinity)
          || output >= (options.maxOutputTokens ?? Infinity)) { taskHalted = true; return false; }
        return true;
      } catch { taskHalted = true; return false; }
    }
    function dispatch(handler) {
      return (req, res) => {
        const task = handler(req, res).catch(() => reject(res, 400));
        pending.add(task); void task.finally(() => pending.delete(task));
      };
    }
    gate = createServer(dispatch(async (req, res) => {
      if (!authenticated(req.headers['x-aob-proxy-token'], spec.meterKey)) { observations.gate_refused++; reject(res, 401); return; }
      if (req.method !== 'POST' || req.url !== '/responses') { observations.gate_refused++; reject(res, 404); return; }
      const body = await bodyBytes(req);
      if (body === null) { observations.gate_refused++; reject(res, 413); return; }
      let parsed; try { parsed = JSON.parse(body.toString('utf8')); } catch { observations.gate_refused++; reject(res, 400); return; }
      if (observations.requests.length >= observationLimit) { observations.gate_refused++; reject(res, 429); return; }
      const observation = observeRequest(parsed, spec.marker); observations.requests.push(observation);
      if (!observation.accepted) { observations.gate_refused++; reject(res, 400); return; }
      const forward = () => relay(req, res, `${meter.baseUrl}/responses`, body, active, { identityEncoding: true, onResponse: headers => Object.assign(observation, responseTransport(headers)) });
      if (!taskMode) { await forward(); return; }
      const queued = admission.then(async () => {
        if (res.destroyed || closePromise) return;
        if (!await taskAdmissionAllowed()) { observation.accepted = false; observations.gate_refused++; reject(res, 429); return; }
        taskForwarded++;
        await forward();
      });
      admission = queued.catch(() => { taskHalted = true; });
      await queued;
    }));
    const gateUrl = await listen(gate, options.gatePort ?? 3211, '127.0.0.1');
    front = createServer(dispatch(async (req, res) => {
      const authorized = options.ingressAuthToken === undefined
        ? authenticated(req.headers.authorization, `Bearer ${spec.bridgeKey}`)
        : authenticated(req.headers['x-aob-proxy-token'], options.ingressAuthToken);
      if (!authorized) { rejectFront(req, res, 'auth', 401); return; }
      if (!['GET /v1/models', 'POST /v1/chat/completions', 'POST /v1/responses'].includes(`${req.method} ${req.url}`)) { rejectFront(req, res, 'path', 404); return; }
      const body = await bodyBytes(req);
      if (body === null) { rejectFront(req, res, 'body-limit', 413); return; }
      await relay(req, res, `${bridge}${req.url}`, body, active, options.ingressAuthToken === undefined ? {} : { bridgeAuthorization: `Bearer ${spec.bridgeKey}` });
    }));
    const frontUrl = await listen(front, options.frontPort ?? 3210, '0.0.0.0');
    return { frontUrl, gateUrl, anchor: meter.anchor, flush: async () => {
      await Promise.allSettled([...pending]);
      await meter.flush();
    }, close };
  } catch {
    await close().catch(() => {});
    throw new BridgeServiceError();
  }
}

async function main() {
  process.umask(0o077);
  if (process.argv.length !== 3) throw new BridgeServiceError();
  const file = await open(process.argv[2], constants.O_RDONLY | constants.O_NOFOLLOW);
  let spec;
  try {
    const info = await file.stat();
    if (!info.isFile() || info.size > 16_384 || (info.mode & 0o077) !== 0) throw new BridgeServiceError();
    spec = JSON.parse(await file.readFile('utf8'));
  } finally { await file.close(); }
  const service = await startBridgeService(spec);
  let closing = false;
  const shutdown = () => {
    if (closing) return; closing = true;
    void service.close().then(() => { process.exitCode = 0; }, () => { process.stderr.write('Codex bridge service failed\n'); process.exitCode = 1; });
  };
  process.once('SIGTERM', shutdown); process.once('SIGINT', shutdown);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => { process.stderr.write('Codex bridge service failed\n'); process.exitCode = 1; });
}
