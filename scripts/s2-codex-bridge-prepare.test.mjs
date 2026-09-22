import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { afterEach, test } from "node:test";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, statSync, symlinkSync, truncateSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import childProcess from "node:child_process";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import { syncBuiltinESMExports } from "node:module";
import { convertCodexAuth, prepareCodexBridge, BridgePreparationError, BRIDGE_COMMIT, REQUIRED_PATCH_SHA256 } from "./s2-codex-bridge-prepare.mjs";
import * as preparation from "./s2-codex-bridge-prepare.mjs";

const roots = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const jwt = payload => `${Buffer.from('{"alg":"RS256"}').toString("base64url")}.${Buffer.from(JSON.stringify(payload)).toString("base64url")}.fake-signature`;
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "aob-bridge-test-")); roots.push(root);
  const account = "test-account-123";
  const auth = { auth_mode: "chatgpt", OPENAI_API_KEY: null, tokens: {
    id_token: jwt({ email: "private-fixture@example.invalid", "https://api.openai.com/auth": { chatgpt_account_id: account } }),
    access_token: jwt({ exp: 2000000000, "https://api.openai.com/auth": { chatgpt_account_id: account } }),
    refresh_token: "private-fixture-refresh", account_id: account,
  }, last_refresh: "2026-09-22T12:00:00Z" };
  const authFile = join(root, "source-auth.json"); writeFileSync(authFile, JSON.stringify(auth));
  return { root, auth, authFile, output: join(root, "bundle") };
}
const readJSON = path => JSON.parse(readFileSync(path, "utf8"));
const rejects = fn => assert.throws(fn, error => error instanceof BridgePreparationError && !/private-fixture|test-account|source-auth|SyntaxError/.test(error.message));

test("converts standard nested subscription auth to one flat Codex record without leaking extra claims", () => {
  const { auth } = fixture(); const before = JSON.stringify(auth);
  const result = convertCodexAuth(auth);
  assert.equal(result.aob_disable_unauthorized_replay, true);
  assert.equal(result.type, "codex"); assert.equal(result.account_id, auth.tokens.account_id);
  assert.equal(result.access_token, auth.tokens.access_token); assert.equal(result.refresh_token, auth.tokens.refresh_token);
  assert.equal(result.id_token, auth.tokens.id_token); assert.equal(result.last_refresh, auth.last_refresh);
  assert.equal(result.expired, new Date(2000000000000).toISOString());
  assert.equal(result.email, undefined); assert.equal(result.tokens, undefined); assert.equal(JSON.stringify(auth), before);
});

test("creates a private unqualified bundle and preserves the original auth bytes", () => {
  const { authFile, output, auth } = fixture(); const before = readFileSync(authFile);
  const result = prepareCodexBridge({ authFile, output, exclusiveRefreshOwner: true });
  assert.equal(result.status, "unqualified"); assert.equal(result.sourceCommit, BRIDGE_COMMIT);
  assert.deepEqual(readFileSync(authFile), before);
  assert.equal(statSync(output).mode & 0o777, 0o700);
  assert.equal(statSync(join(output, "auth")).mode & 0o777, 0o700);
  for (const file of ["config.json", "bridge-key", "manifest.json", "auth/codex.json"]) assert.equal(statSync(join(output, file)).mode & 0o777, 0o600);
  const config = readJSON(join(output, "config.json"));
  assert.equal(config.host, "127.0.0.1"); assert.equal(config["auth-dir"], realpathSync(join(output, "auth")));
  assert.deepEqual(config["api-keys"], [readFileSync(join(output, "bridge-key"), "utf8").trim()]);
  assert.match(config["api-keys"][0], /^[a-f0-9]{64}$/);
  assert.equal(config["request-retry"], 0); assert.equal(config.streaming["bootstrap-retries"], 0);
  assert.equal(config["max-retry-credentials"], 1); assert.equal(config["commercial-mode"], true);
  assert.equal(config["remote-management"]["secret-key"], "");
  assert.deepEqual(config["oauth-model-alias"], {});
  assert.equal(config.codex["disable-codex-cloaking"], true);
  assert.equal(config["disable-image-generation"], "passthrough");
  assert.equal(readJSON(join(output, "auth/codex.json")).account_id, auth.tokens.account_id);
  const manifestText = readFileSync(join(output, "manifest.json"), "utf8");
  const manifest = readJSON(join(output, "manifest.json"));
  assert.equal(manifest.status, "unqualified");
  assert.match(manifest.required_source_patch_sha256, /^sha256:[a-f0-9]{64}$/);
  assert.equal(manifest.build_verified, false); assert.equal(manifest.patch_applied_verified, false);
  for (const privateValue of [authFile, auth.tokens.account_id, auth.tokens.refresh_token, auth.tokens.access_token, "private-fixture@example.invalid"]) assert.equal(manifestText.includes(privateValue), false);
});

test("requires explicit source, destination and credential mode before reading anything", () => {
  const { authFile, output } = fixture();
  for (const options of [{}, { authFile, output }, { authFile, output, exclusiveRefreshOwner: false }, { output, exclusiveRefreshOwner: true }, { authFile, exclusiveRefreshOwner: true }]) rejects(() => prepareCodexBridge(options));
  assert.throws(() => statSync(output), { code: "ENOENT" });
});

test("does not overwrite an existing destination or follow a destination symlink", () => {
  const { root, authFile, output } = fixture(); mkdirSync(output); writeFileSync(join(output, "keep"), "unchanged");
  rejects(() => prepareCodexBridge({ authFile, output, exclusiveRefreshOwner: true }));
  assert.equal(readFileSync(join(output, "keep"), "utf8"), "unchanged");
  const link = join(root, "link"); symlinkSync(output, link);
  rejects(() => prepareCodexBridge({ authFile, output: link, exclusiveRefreshOwner: true }));
  assert.deepEqual(readdirSync(output), ["keep"]);
});

test("rejects symlink, directory, oversized and malformed sources without creating output", () => {
  const { root, authFile, output } = fixture(); const link = join(root, "auth-link"); symlinkSync(authFile, link);
  const large = join(root, "large"); writeFileSync(large, ""); truncateSync(large, 256 * 1024 + 1);
  const invalid = join(root, "invalid"); writeFileSync(invalid, '{"private-fixture": invalid');
  for (const source of [link, root, large, invalid]) rejects(() => prepareCodexBridge({ authFile: source, output, exclusiveRefreshOwner: true }));
  assert.throws(() => statSync(output), { code: "ENOENT" });
});

test("rejects API keys, incomplete or foreign auth shapes, invalid identity and inconsistent JWT accounts", () => {
  const { auth } = fixture();
  const variants = [null, [], {}, { access_token: "private-fixture" }, { ...auth, auth_mode: "apikey" }, { ...auth, OPENAI_API_KEY: "private-fixture-key" },
    { ...auth, tokens: { ...auth.tokens, refresh_token: "" } }, { ...auth, tokens: { ...auth.tokens, account_id: "../private-fixture" } },
    { ...auth, tokens: { ...auth.tokens, account_id: "another-account" } }, { ...auth, tokens: { ...auth.tokens, access_token: "not-jwt" } },
    { ...auth, tokens: { ...auth.tokens, access_token: jwt({ exp: -1 }) } }, { ...auth, last_refresh: "invalid" }];
  for (const value of variants) rejects(() => convertCodexAuth(value));
});

test("independent preparations get different local keys", () => {
  const { root, authFile, output } = fixture();
  prepareCodexBridge({ authFile, output, exclusiveRefreshOwner: true });
  const second = join(root, "second"); prepareCodexBridge({ authFile, output: second, exclusiveRefreshOwner: true });
  assert.notEqual(readFileSync(join(output, "bridge-key"), "utf8"), readFileSync(join(second, "bridge-key"), "utf8"));
});

test("CLI rejects missing ownership and never includes fixture secrets in output", () => {
  const { authFile, output, auth } = fixture();
  const cli = new URL("./s2-codex-bridge-prepare.mjs", import.meta.url);
  const bad = spawnSync(process.execPath, [cli.pathname, "--auth-file", authFile, "--output", output], { encoding: "utf8" });
  assert.equal(bad.status, 1); assert.match(bad.stderr, /exclusive-refresh-owner/);
  const good = spawnSync(process.execPath, [cli.pathname, "--auth-file", authFile, "--output", output, "--exclusive-refresh-owner"], { encoding: "utf8" });
  assert.equal(good.status, 0); assert.match(good.stdout, /unqualified/);
  for (const secret of [authFile, auth.tokens.account_id, auth.tokens.refresh_token]) assert.equal((good.stdout + good.stderr + bad.stdout + bad.stderr).includes(secret), false);
});


test("cleans its private output after a write failure and does not expose the failure detail", t => {
  const { authFile, output } = fixture();
  t.mock.method(fs, "writeFileSync", () => { throw new Error("private-fixture-sensitive-storage-detail"); });
  syncBuiltinESMExports();
  try {
    rejects(() => prepareCodexBridge({ authFile, output, exclusiveRefreshOwner: true }));
    assert.throws(() => statSync(output), { code: "ENOENT" });
  } finally { t.mock.restoreAll(); syncBuiltinESMExports(); }
});

test("preparation performs no network or subprocess action", t => {
  const { authFile, output, root } = fixture();
  const noExternalAction = () => { assert.fail("unexpected external action"); };
  for (const method of ["spawn", "spawnSync", "exec", "execSync", "execFile", "execFileSync", "fork"]) t.mock.method(childProcess, method, noExternalAction);
  for (const module of [http, https]) for (const method of ["get", "request"]) t.mock.method(module, method, noExternalAction);
  for (const method of ["connect", "createConnection"]) t.mock.method(net, method, noExternalAction);
  t.mock.method(globalThis, "fetch", noExternalAction); syncBuiltinESMExports();
  try {
    assert.equal(prepareCodexBridge({ authFile, output, exclusiveRefreshOwner: true }).status, "unqualified");
    assert.equal(prepareCodexBridge({ authFile, output: join(root, "snapshot"), accessTokenSnapshot: true, meterUrl: "http://127.0.0.1:33117", nowMs: 1999998800000 }).status, "unqualified");
  }
  finally { t.mock.restoreAll(); syncBuiltinESMExports(); }
});

test("importing the module does not run its CLI or discover HOME credentials", () => {
  const { root } = fixture();
  const moduleURL = new URL("./s2-codex-bridge-prepare.mjs", import.meta.url).href;
  const result = spawnSync(process.execPath, ["--input-type=module", "-e", `await import(${JSON.stringify(moduleURL)})`], { encoding: "utf8", env: { PATH: process.env.PATH, HOME: root } });
  assert.equal(result.status, 0); assert.equal(result.stdout, ""); assert.equal(result.stderr, "");
  assert.deepEqual(readdirSync(root), ["source-auth.json"]);
});


test("bundle requirement binds the exact reviewed source patch bytes", () => {
  const patch = readFileSync(new URL("../plans/s2-evidence/codex-bridge/cli-proxy-api-benchmark-guards.patch", import.meta.url));
  assert.equal(REQUIRED_PATCH_SHA256, `sha256:${createHash("sha256").update(patch).digest("hex")}`);
  assert.match(patch.toString("utf8"), /^diff --git /);
});

const meterUrl = "http://127.0.0.1:33117";
const snapshotNow = 1999998800000;

test("snapshot conversion permits absent refresh credentials and never exports them", () => {
  const { auth } = fixture();
  for (const includeRefresh of [true, false]) {
    const input = structuredClone(auth);
    if (!includeRefresh) delete input.tokens.refresh_token;
    const before = JSON.stringify(input);
    const converted = convertCodexAuth(input, { accessTokenSnapshot: true, nowMs: snapshotNow });
    assert.equal(Object.hasOwn(converted, "refresh_token"), false);
    assert.equal(JSON.stringify(converted).includes("private-fixture-refresh"), false);
    assert.equal(converted.access_token, auth.tokens.access_token);
    assert.equal(JSON.stringify(input), before);
  }
  const missing = structuredClone(auth); delete missing.tokens.refresh_token;
  rejects(() => convertCodexAuth(missing));
});

test("snapshot expiry requires at least fifteen minutes and a finite validation clock", () => {
  const { auth } = fixture();
  assert.equal(preparation.MIN_SNAPSHOT_LIFETIME_MS, 15 * 60 * 1000);
  const expiresMs = 2000000000000;
  for (const nowMs of [expiresMs, expiresMs - 899999, expiresMs + 1, NaN, Infinity]) {
    rejects(() => convertCodexAuth(auth, { accessTokenSnapshot: true, nowMs }));
  }
  assert.equal(convertCodexAuth(auth, { accessTokenSnapshot: true, nowMs: expiresMs - 900000 }).expired, new Date(expiresMs).toISOString());
});

test("snapshot bundle requires a meter and records no-refresh ownership and controlled policy", () => {
  const { authFile, output, auth } = fixture(); const source = readFileSync(authFile);
  rejects(() => prepareCodexBridge({ authFile, output, accessTokenSnapshot: true, nowMs: snapshotNow }));
  prepareCodexBridge({ authFile, output, accessTokenSnapshot: true, meterUrl, nowMs: snapshotNow });
  assert.deepEqual(readFileSync(authFile), source);
  const record = readJSON(join(output, "auth/codex.json"));
  assert.equal(Object.hasOwn(record, "refresh_token"), false);
  assert.equal(record.aob_meter_base_url, meterUrl);
  const meterKey = readFileSync(join(output, "meter-key"), "utf8").trim();
  assert.match(meterKey, /^[a-f0-9]{64}$/);
  assert.equal(statSync(join(output, "meter-key")).mode & 0o777, 0o600);
  assert.notEqual(meterKey, readFileSync(join(output, "bridge-key"), "utf8").trim());
  assert.deepEqual(record.headers, { "x-aob-proxy-token": meterKey });
  const manifest = readJSON(join(output, "manifest.json"));
  assert.equal(manifest.auth_mode, "access-token-snapshot");
  assert.equal(manifest.refresh_owner, "none-snapshot-only");
  assert.equal(manifest.refresh_token_imported, false);
  assert.equal(manifest.access_token_expires_at, record.expired);
  assert.equal(manifest.policy, preparation.CONTROLLED_POLICY);
  assert.equal(manifest.required_meter_patch_sha256, preparation.REQUIRED_METER_PATCH_SHA256);
  assert.equal(manifest.provider_accounting_verified, false);
  assert.equal(manifest.model_allowlist_enforced, false);
  for (const secret of [meterKey, auth.tokens.refresh_token, auth.tokens.account_id]) assert.equal(JSON.stringify(manifest).includes(secret), false);
  const config = readJSON(join(output, "config.json"));
  assert.deepEqual(config.payload.override, [{ models: [{ name: "gpt-6-luna", protocol: "codex" }], params: { "reasoning.effort": "low", "reasoning.summary": "auto", store: false } }]);
  assert.deepEqual(config.payload.filter, [{ models: [{ name: "gpt-6-luna", protocol: "codex" }], params: ['input.#(type=="reasoning")#', "previous_response_id", "conversation"] }]);
});

test("snapshot rejects conflicting and malformed mode flags before producing output", () => {
  const { authFile, output } = fixture();
  for (const flags of [{ accessTokenSnapshot: true, exclusiveRefreshOwner: true }, { accessTokenSnapshot: "true" }, { accessTokenSnapshot: true, exclusiveRefreshOwner: "yes" }]) {
    rejects(() => prepareCodexBridge({ authFile, output, meterUrl, ...flags }));
  }
  assert.throws(() => statSync(output), { code: "ENOENT" });
});

test("meter accepts only exact local HTTP host and canonical nonzero port", () => {
  const { authFile, root } = fixture();
  const invalid = ["http://127.1:33117", "http://2130706433:33117", "http://localhost:033117", "http://localhost:0", "http://localhost:65536", "http://localhost:33117/", "http://localhost:33117?", "http://localhost:33117#", "http://a:b@localhost:33117", "http://localhost.evil:33117", "https://localhost:33117", " http://localhost:33117", null, 1];
  for (const [i, value] of invalid.entries()) rejects(() => prepareCodexBridge({ authFile, output: join(root, `invalid-${i}`), accessTokenSnapshot: true, meterUrl: value, nowMs: snapshotNow }));
  for (const [i, value] of [meterUrl, "http://localhost:65535"].entries()) prepareCodexBridge({ authFile, output: join(root, `valid-${i}`), accessTokenSnapshot: true, meterUrl: value, nowMs: snapshotNow });
});

test("snapshot CLI supports explicit meter and rejects mixed ownership flags", () => {
  const { authFile, output } = fixture();
  const cli = new URL("./s2-codex-bridge-prepare.mjs", import.meta.url);
  const args = [cli.pathname, "--auth-file", authFile, "--output", output, "--access-token-snapshot", "--meter-url", meterUrl];
  const bad = spawnSync(process.execPath, [...args, "--exclusive-refresh-owner"], { encoding: "utf8" });
  assert.equal(bad.status, 1);
  const good = spawnSync(process.execPath, args, { encoding: "utf8" });
  assert.equal(good.status, 0, good.stderr);
  assert.equal(Object.hasOwn(readJSON(join(output, "auth/codex.json")), "refresh_token"), false);
  assert.equal((good.stdout + good.stderr + bad.stderr).includes("private-fixture"), false);
});

test("required meter patch constant binds reviewed patch bytes", () => {
  const patch = readFileSync(new URL("../plans/s2-evidence/codex-bridge/cli-proxy-api-local-meter.patch", import.meta.url));
  assert.equal(preparation.REQUIRED_METER_PATCH_SHA256, `sha256:${createHash("sha256").update(patch).digest("hex")}`);
  assert.match(patch.toString("utf8"), /^diff --git /);
});
