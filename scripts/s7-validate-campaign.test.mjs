import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(root, "scripts/s7-validate-campaign.mjs");
function edit(path, mutate) { const value = JSON.parse(readFileSync(path, "utf8")); mutate(value); writeFileSync(path, JSON.stringify(value)); }
function fixture(t) {
  const temp = mkdtempSync(join(tmpdir(), "aob-validation-launch-"));
  t.after(() => rmSync(temp, { recursive: true, force: true }));
  const taskId = "py-small-bugfix-1";
  const task = join(temp, "tasks", taskId);
  cpSync(join(root, "packages/tasks/suite", taskId), task, { recursive: true });
  const validation = join(temp, "validation"); const campaign = join(temp, "campaign");
  const id = `mock-agent:${taskId}:pinned:0`;
  const cell = join(validation, "results", "one"); mkdirSync(cell, { recursive: true });
  const definition = { tools: ["mock-agent"], model: "mock", priceBook: "openrouter-2026-08-27", conditions: ["pinned"], reps: 1,
    tasks: [{ id: taskId, source: "local-development", sourceRepository: "agent-overhead-bench", revision: "working-tree", regime: "short", timeoutS: 300,
      environment: { kind: "prepared-local", network: "disabled" }, verifier: "script" }] };
  const anchor = { wall_clock_iso: "2026-09-05T00:00:00.000Z", monotonic_zero: 0 };
  const run = { v: 1, run_id: id, tool: "mock-agent", tool_version: "1.0", task_id: taskId, task_source: "local-development", task_repository: "agent-overhead-bench",
    task_revision: "working-tree", task_regime: "short", condition: "pinned", rep: 0, model: "mock", ori_version: null, tool_visibility: "none",
    anchors: { adapter: anchor, proxy: anchor }, adapter_result: { exitCode: 0, tStart: 0, tEnd: 100, anchor,
      artifacts: { stdoutPath: join(cell, "stdout.log"), stderrPath: join(cell, "stderr.log") } }, events_file: "events.jsonl",
    verification: { exit: 0, duration_ms: 1, logPath: join(cell, "verify.log") }, container: { image_digest: "host", verifier_image_digest: "host", started_iso: anchor.wall_clock_iso },
    task_environment: definition.tasks[0].environment, host: { os: "linux", cpu: "test", ram_gb: 16 }, spend_usd_estimate: 0, price_book: definition.priceBook, outcome: "completed" };
  writeFileSync(join(cell, "run.json"), JSON.stringify(run));
  for (const name of ["stdout.log", "stderr.log", "verify.log"]) writeFileSync(join(cell, name), "passed\n");
  writeFileSync(join(cell, "events.jsonl"), JSON.stringify({ v: 1, run_id: id, seq: 0, t_req_start: 10, t_req_body_end: 10, t_upstream_sent: 10,
    t_first_byte: 20, t_last_byte: 80, duration_ms: 70, method: "POST", path: "/v1/chat/completions", protocol: "openai_chat", model_requested: "mock", model_served: "mock",
    status: 200, streamed: false, usage: { input: 10, output: 2, cached_input: 0, reasoning_output: 0 }, usage_source: "response_body", error: null }) + "\n");
  writeFileSync(join(validation, "state.json"), JSON.stringify({ version: 1, seed: 1, spentUsd: 0, definition_key: JSON.stringify(definition), cells: [{ id,
    tool: "mock-agent", task_id: taskId, condition: "pinned", rep: 0, status: "done", retries: 0 }] }));
  const args = [root, task, "mock-agent", "mock", definition.priceBook, "5", validation, campaign];
  const launch = (overrides = args) => spawnSync(process.execPath, [script, ...overrides], { encoding: "utf8" });
  return { temp, task, validation, campaign, cell, args, launch };
}
test("validates and archives prerequisites while printing only spend", (t) => {
  const f = fixture(t); const result = f.launch(); assert.equal(result.status, 0, result.stderr); assert.equal(result.stdout, "0\n");
  const snapshot = join(f.campaign, "provenance/validation");
  assert.equal(existsSync(join(snapshot, "state.json")), true);
  const run = JSON.parse(readFileSync(join(snapshot, "results/one/run.json"), "utf8"));
  assert.equal(run.verification.logPath, "verify.log");
  assert.equal(run.adapter_result.artifacts.stdoutPath, "stdout.log");
  rmSync(f.validation, { recursive: true });
  const resumed = f.launch(); assert.equal(resumed.status, 0, resumed.stderr); assert.equal(resumed.stdout, "0\n");
});
test("enforces the requested routing policy in live and archived validation", (t) => {
  const f = fixture(t);
  const env = { ...process.env, AOB_IGNORED_PROVIDERS: "relace" };
  const launch = () => spawnSync(process.execPath, [script, ...f.args], { env, encoding: "utf8" });
  assert.notEqual(launch().status, 0);
  const policy = { ignored_providers: ["relace"] };
  edit(join(f.validation, "state.json"), s => { const d = JSON.parse(s.definition_key); d.providerRouting = policy; s.definition_key = JSON.stringify(d); });
  edit(join(f.cell, "run.json"), r => { r.provider_routing = policy; });
  const passed = launch(); assert.equal(passed.status, 0, passed.stderr);
  const snapshot = join(f.campaign, "provenance/validation/results/one/run.json");
  assert.deepEqual(JSON.parse(readFileSync(snapshot, "utf8")).provider_routing, policy);
  env.AOB_IGNORED_PROVIDERS = "other";
  assert.notEqual(launch().status, 0);
});
test("refuses an exclusion-only archive when a single endpoint is requested", (t) => {
  const f = fixture(t);
  const env = { ...process.env, AOB_IGNORED_PROVIDERS: "relace", AOB_ONLY_PROVIDER: "z-ai/fp8" };
  const policy = { ignored_providers: ["relace"] };
  edit(join(f.validation, "state.json"), s => { const d = JSON.parse(s.definition_key); d.providerRouting = policy; s.definition_key = JSON.stringify(d); });
  edit(join(f.cell, "run.json"), r => { r.provider_routing = policy; });
  const launch = () => spawnSync(process.execPath, [script, ...f.args], {env,encoding:"utf8"});
  assert.notEqual(launch().status, 0);
  Object.assign(policy,{only_provider:"z-ai/fp8",allow_fallbacks:false});
  edit(join(f.validation, "state.json"), s => { const d = JSON.parse(s.definition_key); d.providerRouting = policy; s.definition_key = JSON.stringify(d); });
  edit(join(f.cell, "run.json"), r => { r.provider_routing = policy; });
  const passed = launch(); assert.equal(passed.status,0,passed.stderr);
  env.AOB_ONLY_PROVIDER = "gmicloud/fp8";
  assert.notEqual(launch().status,0);
});
test("refuses tampered archived validation even if input evidence still passes", (t) => {
  const f = fixture(t); assert.equal(f.launch().status, 0);
  rmSync(join(f.campaign, "provenance/validation/results/one/verify.log"));
  const result = f.launch(); assert.notEqual(result.status, 0); assert.equal(result.stdout, "");
});
test("refuses to attach validation after campaign state exists", (t) => {
  const f = fixture(t); mkdirSync(f.campaign); writeFileSync(join(f.campaign, "state.json"), "{}");
  const result = f.launch(); assert.notEqual(result.status, 0); assert.match(result.stderr, /state.*validation|validation.*state/);
  assert.equal(existsSync(join(f.campaign, "provenance/validation")), false);
});
test("refuses task metadata changes before creating a snapshot", (t) => {
  const f = fixture(t); const path = join(f.task, "task.yaml");
  writeFileSync(path, readFileSync(path, "utf8").replace("timeout_s: 300", "timeout_s: 301"));
  const result = f.launch(); assert.notEqual(result.status, 0); assert.match(result.stderr, /definition differs/);
  assert.equal(existsSync(join(f.campaign, "provenance/validation")), false);
});
test("refuses malformed invocation without creating campaign files", (t) => {
  const f = fixture(t); const args = [...f.args]; args[5] = "NaN";
  const result = f.launch(args); assert.notEqual(result.status, 0); assert.match(result.stderr, /repetitions/);
  assert.equal(existsSync(f.campaign), false);
});
test("prints actual priced spend and redacts the archived logs", (t) => {
  const f = fixture(t); const model = "z-ai/glm-5.3-flash"; const spend = 0.00000125;
  edit(join(f.validation, "state.json"), (s) => {
    const definition = JSON.parse(s.definition_key); definition.model = model;
    s.definition_key = JSON.stringify(definition); s.spentUsd = spend;
  });
  edit(join(f.cell, "run.json"), (r) => { r.model = model; r.spend_usd_estimate = spend; });
  edit(join(f.cell, "events.jsonl"), (e) => { e.model_requested = model; e.model_served = model; });
  writeFileSync(join(f.cell, "stdout.log"), "OPENAI_API_KEY=private-fixture-secret\n");
  const args = [...f.args]; args[3] = model;
  const result = f.launch(args); assert.equal(result.status, 0, result.stderr); assert.equal(result.stdout, `${spend}\n`);
  const log = readFileSync(join(f.campaign, "provenance/validation/results/one/stdout.log"), "utf8");
  assert.equal(log.includes("private-fixture-secret"), false);
});
test("compares existing campaign evidence with archived validation", (t) => {
  const f = fixture(t); assert.equal(f.launch().status, 0);
  const results = join(f.campaign, "results"); cpSync(join(f.campaign, "provenance/validation/results"), results, { recursive: true });
  edit(join(results, "one/run.json"), (r) => {
    r.rep = 4; r.anchors.adapter.wall_clock_iso = "2026-09-05T01:00:00.000Z";
    r.anchors.proxy.wall_clock_iso = "2026-09-05T01:00:00.000Z"; r.adapter_result.anchor.wall_clock_iso = "2026-09-05T01:00:00.000Z";
  });
  assert.equal(f.launch().status, 0);
  edit(join(results, "one/run.json"), (r) => { r.tool_version = "different"; });
  const changed = f.launch(); assert.notEqual(changed.status, 0); assert.match(changed.stderr, /identity\/version\/image differs/);
});
test("refuses failed validation without leaving an accepted snapshot", (t) => {
  const f = fixture(t); edit(join(f.cell, "run.json"), (r) => { r.outcome = "verify_error"; r.verification.exit = 1; });
  const result = f.launch(); assert.notEqual(result.status, 0); assert.equal(result.stdout, "");
  assert.equal(existsSync(join(f.campaign, "provenance/validation")), false);
});
test("resume binds prerequisite timing to the primary ledger and rejects a missing or stale ledger", (t) => {
  const f = fixture(t); assert.equal(f.launch().status, 0);
  const statePath = join(f.campaign, "state.json");
  const state = JSON.parse(readFileSync(join(f.validation, "state.json"), "utf8"));
  const definition = JSON.parse(state.definition_key); definition.executionProtocol = "tool-batches-v1"; definition.reps = 5;
  state.definition_key = JSON.stringify(definition); state.run_window_session_id = "campaign-session"; state.run_window_ledger = "provenance/run-window-ledger.json";
  writeFileSync(statePath, JSON.stringify(state));
  const absent = f.launch(); assert.notEqual(absent.status, 0); assert.match(absent.stderr, /ledger/);
  const ledgerPath = join(f.campaign, "provenance/run-window-ledger.json");
  function writeLedger(start) {
    const host = { os: "linux", cpu: "test", ram_gb: 16, docker: "test", image_digests: [] };
    const anchor = { wall_clock_iso: start, monotonic_zero: 0 };
    const end = new Date(Date.parse(start) + 100).toISOString();
    writeFileSync(ledgerPath, JSON.stringify({ version: 1, execution_protocol: "tool-batches-v1", session_id: state.run_window_session_id,
      anchor, window: { start_iso: start, end_iso: end }, host_start: host, host_end: host,
      matrix_definition_sha256: `sha256:${"a".repeat(64)}`, state_sha256: `sha256:${createHash("sha256").update(readFileSync(statePath)).digest("hex")}`,
      results_binding: null, replacement_state_sha256: null,
      segments: [{ id: "first", anchor, start_ms: 0, end_ms: 100, start_iso: start, end_iso: end, attempts: [],
        batch_tool: "mock-agent", batch_cap_usd: 1, host_start: host, host_end: host }] }));
  }
  writeLedger("2026-09-05T00:00:00.050Z");
  const late = f.launch(); assert.notEqual(late.status, 0); assert.match(late.stderr, /must precede.*primary/);
  writeLedger("2026-09-05T00:00:00.200Z");
  const correct = f.launch(); assert.equal(correct.status, 0, correct.stderr);
  edit(statePath, (s) => { s.seed = 999; });
  const stale = f.launch(); assert.notEqual(stale.status, 0); assert.match(stale.stderr, /ledger.*state|state.*ledger/);
});
