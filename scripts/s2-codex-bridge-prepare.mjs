#!/usr/bin/env node
import { randomBytes } from "node:crypto";
import { chmodSync, closeSync, constants, fstatSync, fsyncSync, lstatSync, mkdirSync, openSync, readSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const BRIDGE_COMMIT = "2430354330af80b645f9ffb1a51e1e7c72c4cc8e";
export const REQUIRED_PATCH_SHA256 = "sha256:6a17e7ad40cff90e5b26722c13fdaea3255346d73a3d7966ec4af0014c54dc88";
const MAX_AUTH_BYTES = 256 * 1024;
export class BridgePreparationError extends Error {
  constructor(message) { super(message); this.name = "BridgePreparationError"; }
}
const invalidAuth = () => new BridgePreparationError("Unsupported or incomplete Codex subscription credential record.");
const object = value => value !== null && typeof value === "object" && !Array.isArray(value);
const knownKeys = (value, allowed) => Object.keys(value).every(key => allowed.includes(key));
const token = value => typeof value === "string" && value.length > 0 && value.length <= 32 * 1024 && /^[\x21-\x7e]+$/.test(value);
function claims(value) {
  if (!token(value)) throw invalidAuth();
  const pieces = value.split(".");
  if (pieces.length !== 3 || pieces.some(piece => !/^[A-Za-z0-9_-]+$/.test(piece))) throw invalidAuth();
  try {
    const header = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.from(pieces[0], "base64url")));
    const payload = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.from(pieces[1], "base64url")));
    if (!object(header) || !object(payload)) throw invalidAuth();
    return payload;
  } catch { throw invalidAuth(); }
}

/** Structural conversion only: JWT signatures, account access and allowance are not verified. */
export function convertCodexAuth(auth) {
  if (!object(auth) || !knownKeys(auth, ["auth_mode", "OPENAI_API_KEY", "tokens", "last_refresh"]) ||
      (auth.auth_mode !== undefined && auth.auth_mode !== "chatgpt") ||
      (auth.OPENAI_API_KEY !== undefined && auth.OPENAI_API_KEY !== null) || !object(auth.tokens) ||
      !knownKeys(auth.tokens, ["id_token", "access_token", "refresh_token", "account_id"])) throw invalidAuth();
  const tokens = auth.tokens;
  if (!token(tokens.refresh_token) || typeof tokens.account_id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(tokens.account_id)) throw invalidAuth();
  const identity = claims(tokens.id_token); const access = claims(tokens.access_token);
  for (const payload of [identity, access]) {
    const account = payload["https://api.openai.com/auth"];
    if (account !== undefined && (!object(account) || (account.chatgpt_account_id !== undefined && account.chatgpt_account_id !== tokens.account_id))) throw invalidAuth();
  }
  if (!Number.isSafeInteger(access.exp) || access.exp <= 0 || access.exp > 253402300799) throw invalidAuth();
  if (auth.last_refresh !== undefined && (typeof auth.last_refresh !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(auth.last_refresh) || !Number.isFinite(Date.parse(auth.last_refresh)))) throw invalidAuth();
  return {
    type: "codex", aob_disable_unauthorized_replay: true, id_token: tokens.id_token, access_token: tokens.access_token,
    refresh_token: tokens.refresh_token, account_id: tokens.account_id,
    ...(auth.last_refresh === undefined ? {} : { last_refresh: auth.last_refresh }),
    expired: new Date(access.exp * 1000).toISOString(),
  };
}

function readAuth(path) {
  let fd;
  try {
    const initial = lstatSync(path);
    if (!initial.isFile() || initial.isSymbolicLink() || initial.size < 1 || initial.size > MAX_AUTH_BYTES) throw invalidAuth();
    fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const before = fstatSync(fd);
    if (!before.isFile() || before.dev !== initial.dev || before.ino !== initial.ino || before.size !== initial.size) throw invalidAuth();
    const buffer = Buffer.alloc(MAX_AUTH_BYTES + 1); let count = 0;
    while (count < buffer.length) {
      const bytes = readSync(fd, buffer, count, buffer.length - count, null);
      if (bytes === 0) break;
      count += bytes;
    }
    const after = fstatSync(fd);
    if (count > MAX_AUTH_BYTES || count !== before.size || before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs) throw invalidAuth();
    return convertCodexAuth(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(buffer.subarray(0, count))));
  } catch { throw new BridgePreparationError("Cannot read a supported regular Codex subscription credential file."); }
  finally { if (fd !== undefined) closeSync(fd); }
}

function bridgeConfig(authDir, key) {
  return {
    host: "127.0.0.1", port: 8317, tls: { enable: false }, "auth-dir": authDir, "api-keys": [key],
    "remote-management": { "allow-remote": false, "secret-key": "", "disable-control-panel": true, "disable-auto-update-panel": true },
    pprof: { enable: false }, discovery: { enabled: false }, plugins: { enabled: false, configs: {} },
    debug: false, "commercial-mode": true, "request-log": false, "logging-to-file": false, "usage-statistics-enabled": false,
    "proxy-url": "direct", "request-retry": 0, "max-retry-credentials": 1, "max-retry-interval": 0,
    streaming: { "keepalive-seconds": 0, "bootstrap-retries": 0 }, "nonstream-keepalive-interval": 0,
    "quota-exceeded": { "switch-project": false, "switch-preview-model": false, "antigravity-credits": false },
    routing: { strategy: "fill-first", "session-affinity": false, "session-affinity-subagents": false },
    "disable-cooling": false, "save-cooldown-status": false, "force-model-prefix": false, "passthrough-headers": false,
    codex: { "response-steering": false, "identity-confuse": false, "disable-codex-cloaking": true,
      "stream-bootstrap-buffering": false, "stream-bootstrap-timeout": "0", "optimize-multi-agent-v2": false,
      "orphan-delegation-compatibility": false, "live-media-relay": { enabled: false } },
    "disable-claude-cloak-mode": true, "claude-code": { "disable-cloaking-model-list": true },
    "disable-image-generation": "passthrough", "oauth-model-alias": {}, "oauth-excluded-models": {},
    "codex-api-key": [], "claude-api-key": [], "gemini-api-key": [], "vertex-api-key": [], "openai-compatibility": [],
    payload: { default: [], override: [], filter: [] },
  };
}
function privateWrite(path, value) {
  const fd = openSync(path, "wx", 0o600);
  try { writeFileSync(fd, value); fsyncSync(fd); } finally { closeSync(fd); }
}

/** Prepare only. No implicit auth discovery, subprocesses, network or bridge startup. */
export function prepareCodexBridge({ authFile, output, exclusiveRefreshOwner } = {}) {
  if (exclusiveRefreshOwner !== true) throw new BridgePreparationError("Explicit --exclusive-refresh-owner acknowledgement is required.");
  if (typeof authFile !== "string" || !authFile || typeof output !== "string" || !output) throw new BridgePreparationError("Explicit --auth-file and --output paths are required.");
  const auth = readAuth(authFile);
  let destination; let created = false; let identity;
  try {
    const requested = resolve(output);
    destination = join(realpathSync(dirname(requested)), basename(requested));
    mkdirSync(destination, { mode: 0o700 }); created = true;
    identity = lstatSync(destination); chmodSync(destination, 0o700);
    const authDir = join(destination, "auth"); mkdirSync(authDir, { mode: 0o700 }); chmodSync(authDir, 0o700);
    const key = randomBytes(32).toString("hex");
    privateWrite(join(authDir, "codex.json"), `${JSON.stringify(auth, null, 2)}\n`);
    privateWrite(join(destination, "bridge-key"), `${key}\n`);
    privateWrite(join(destination, "config.json"), `${JSON.stringify(bridgeConfig(authDir, key), null, 2)}\n`);
    // Last file is a completion marker, never a campaign-admission certificate.
    privateWrite(join(destination, "manifest.json"), `${JSON.stringify({
      schema_version: 1, status: "unqualified", source: "https://github.com/router-for-me/CLIProxyAPI", source_commit: BRIDGE_COMMIT,
      required_source_patch_sha256: REQUIRED_PATCH_SHA256, build_verified: false, patch_applied_verified: false,
      model: "gpt-6-luna", refresh_owner: "bridge-exclusive-acknowledged", account_access_verified: false,
      native_harnesses_verified: false, provider_accounting_verified: false,
      model_allowlist_enforced: false, original_auth_modified: false,
    }, null, 2)}\n`);
    return { outputPath: destination, status: "unqualified", sourceCommit: BRIDGE_COMMIT };
  } catch {
    if (created && identity !== undefined) {
      try { const current = lstatSync(destination); if (current.isDirectory() && current.dev === identity.dev && current.ino === identity.ino) rmSync(destination, { recursive: true, force: true }); }
      catch { /* Partial output remains private and must not be launched. */ }
    }
    throw new BridgePreparationError("Cannot prepare a new private bundle; destination must not exist and its parent must be writable.");
  }
}

function main(args) {
  const options = {};
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--exclusive-refresh-owner" && options.exclusiveRefreshOwner === undefined) options.exclusiveRefreshOwner = true;
    else if ((arg === "--auth-file" || arg === "--output") && args[i + 1] !== undefined && !args[i + 1].startsWith("--")) {
      const field = arg === "--auth-file" ? "authFile" : "output";
      if (options[field] !== undefined) throw new BridgePreparationError("Duplicate preparation option.");
      options[field] = args[++i];
    } else throw new BridgePreparationError("Use --auth-file PATH --output NEW_DIRECTORY --exclusive-refresh-owner.");
  }
  prepareCodexBridge(options);
  process.stdout.write("Prepared an unqualified private bridge bundle. No bridge was started or account access verified.\n");
}
if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(process.argv.slice(2)); }
  catch (error) { process.stderr.write(`${error instanceof BridgePreparationError ? error.message : "Bridge preparation failed."}\n`); process.exitCode = 1; }
}
