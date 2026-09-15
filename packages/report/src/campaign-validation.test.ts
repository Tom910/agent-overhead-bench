import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { copySanitizedValidation } from "./freeze.js";
import { loadResultsTree } from "./from-results.js";
import { ConfigError } from "@aob/contracts";
import { assertNativeTaskFailureStates, assertProviderRoutingMatches, validateCampaignValidation } from "./campaign-validation.js";

const offlineBook = vi.hoisted(() => ({ path: "" }));
vi.mock("./price-books.js", async importOriginal => {
  const actual = await importOriginal<typeof import("./price-books.js")>();
  return { ...actual, priceBookPath: (id: string) => id === "deepseek-offline" ? offlineBook.path : actual.priceBookPath(id) };
});

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const model = "z-ai/glm-5.3-flash";
const digest = `sha256:${"a".repeat(64)}`;
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "aob-campaign-validation-")); roots.push(root);
  const tools = ["codex", "cline"];
  const definition = { tools, model, priceBook: "openrouter-2026-08-27", conditions: ["pinned"], reps: 5,
    tasks: ["t1", "t2"].map((id) => ({ id, source: "local-development", revision: "working-tree", regime: "short", timeoutS: 60,
      environment: { kind: "runner-default", network: "disabled", agent_images: Object.fromEntries(tools.map((tool) => [tool, { image: `image:${tool}`, image_digest: digest }])) },
      verifier: { kind: "docker-command", image: "verifier:test", image_digest: digest, command: ["true"] } })) };
  const cells = [];
  for (const tool of tools) for (const task of definition.tasks) {
    const id = `${tool}-${task.id}-pinned-0`;
    const dir = join(root, "results", id); mkdirSync(dir, { recursive: true });
    const anchor = { wall_clock_iso: "2026-09-05T00:00:00.000Z", monotonic_zero: 0 };
    const run = { v: 1, run_id: id, tool, tool_version: "1.0", task_id: task.id, task_source: task.source, task_revision: task.revision,
      task_regime: "short", condition: "pinned", rep: 0, model, ori_version: null, tool_visibility: "none", anchors: { adapter: anchor, proxy: anchor },
      adapter_result: { exitCode: 0, tStart: 0, tEnd: 100, anchor, artifacts: { stdoutPath: "stdout.log", stderrPath: "stderr.log" } },
      verification: { exit: 0, duration_ms: 1, logPath: "verify.log" }, events_file: "events.jsonl", outcome: "completed",
      container: { image_digest: digest, verifier_image_digest: digest, started_iso: anchor.wall_clock_iso },
      task_environment: { kind: "runner-default", network: "disabled", agent_image: `image:${tool}`, agent_image_digest: digest },
      host: { os: "linux", cpu: "test", ram_gb: 16 }, price_book: definition.priceBook, spend_usd_estimate: 0.00000125 };
    writeFileSync(join(dir, "run.json"), JSON.stringify(run)); writeFileSync(join(dir, "verify.log"), "pass\n");
    writeFileSync(join(dir, "stdout.log"), ""); writeFileSync(join(dir, "stderr.log"), "");
    writeFileSync(join(dir, "events.jsonl"), JSON.stringify({ v: 1, run_id: id, seq: 0, t_req_start: 10, t_req_body_end: 10,
      t_upstream_sent: 10, t_first_byte: 20, t_last_byte: 80, duration_ms: 70, method: "POST", path: "/v1/chat/completions",
      protocol: "openai_chat", model_requested: model, model_served: model, status: 200, streamed: false,
      usage: { input: 10, cached_input: 0, output: 2, reasoning_output: 0 }, usage_source: "response_body", error: null }) + "\n");
    cells.push({ id, tool, task_id: task.id, condition: "pinned", rep: 0, status: "done", retries: 0 });
  }
  writeFileSync(join(root, "state.json"), JSON.stringify({ version: 1, seed: 1, spentUsd: 0.000005, cells, definition_key: JSON.stringify({ ...definition, reps: 1 }) }));
  return { root, definition, cell: join(root, "results", cells[0]!.id) };
}
function edit(path: string, mutate: (value: Record<string, any>) => void) {
  const value = JSON.parse(readFileSync(path, "utf8")) as Record<string, any>; mutate(value); writeFileSync(path, JSON.stringify(value));
}
function deepseekFixture(nativeFailure: boolean) {
  const base = fixture();
  const model = "deepseek/deepseek-v4.1-flash";
  const definition = { ...base.definition, model, priceBook: "deepseek-offline",
    tasks: base.definition.tasks.map(task => nativeFailure ? { ...task, source: "public-task-pack",
      sourceRepository: "https://github.com/datacurve-ai/deep-swe.git" } : task) };
  offlineBook.path = join(base.root, "offline-pricing.json");
  writeFileSync(offlineBook.path, JSON.stringify({ id: definition.priceBook,
    models: { [model]: { input: 0.000000035, cached_input: 0.000000005, output: 0.00000045 } } }));
  for (const dir of readdirSync(join(base.root, "results"))) {
    const cell = join(base.root, "results", dir);
    edit(join(cell, "run.json"), run => {
      run.model = model; run.price_book = definition.priceBook;
      if (nativeFailure) { run.task_source = "public-task-pack"; run.task_repository = "https://github.com/datacurve-ai/deep-swe.git"; }
    });
    edit(join(cell, "events.jsonl"), event => { event.model_requested = model; event.model_served = model; });
  }
  edit(join(base.root, "state.json"), state => {
    state.definition_key = JSON.stringify({ ...definition, reps: 1 });
    if (nativeFailure) state.cells[0].status = "task_failed";
  });
  if (nativeFailure) {
    edit(join(base.cell, "run.json"), run => { run.outcome = "verify_error"; run.verification.exit = 1; });
    writeFileSync(join(base.cell, "verify.log"), '[verifier] reward.json={"reward":0,"f2p_total":2,"f2p_passed":1,"p2p_total":1,"p2p_passed":1,"f2p":0.5,"p2p":1,"partial":0.6666666666666666}\n');
  }
  const path = join(base.cell, "events.jsonl");
  const success = JSON.parse(readFileSync(path, "utf8")); success.seq = 1;
  const rejection = { ...success, seq: 0, method: "POST", path: "/v1/messages", protocol: "anthropic_messages",
    t_req_start: 1, t_req_body_end: 1, t_upstream_sent: 1, t_first_byte: 2, t_last_byte: 5, duration_ms: 4,
    model_served: null, status: 400, usage: null, usage_source: "unavailable", usage_lookup: "not_attempted",
    error: { kind: "upstream_rejected", detail: "status 400: DeepSeek rejected unsupported response_format before inference" } };
  writeFileSync(path, [rejection, success].map(event => JSON.stringify(event) + "\n").join(""));
  return { ...base, definition, path, rejection, success };
}

describe("campaign validation evidence gate", () => {
  it.each([false, true])("accepts a recovered known rejection with native task failure=%s and preserves raw evidence", nativeFailure => {
    const { root, definition, path } = deepseekFixture(nativeFailure);
    const before = readFileSync(path, "utf8");
    expect(validateCampaignValidation(root, definition).passed).toBe(true);
    expect(copySanitizedValidation(root, join(root, "portable"), definition).passed).toBe(true);
    expect(readFileSync(path, "utf8")).toBe(before);
    const loaded = loadResultsTree(join(root, "results")).find(cell => cell.events.length === 2)!;
    expect(loaded.events[0]!.status).toBe(400);
    expect(loaded.derived.model_time).toBe(74);
  });
  it.each([false, true])("rejects uncertain, mismatched or all-rejected evidence with native task failure=%s", nativeFailure => {
    const { root, definition, path, rejection, success } = deepseekFixture(nativeFailure);
    for (const event of [
      { ...rejection, status: 520 },
      { ...rejection, model_requested: "other/model" },
      { ...rejection, error: { kind: "upstream_rejected", detail: "other error" } },
      { ...rejection, t_last_byte: null },
    ]) {
      writeFileSync(path, [event, success].map(value => JSON.stringify(value) + "\n").join(""));
      expect(() => validateCampaignValidation(root, definition)).toThrow(ConfigError);
    }
    writeFileSync(path, JSON.stringify(rejection) + "\n");
    expect(() => validateCampaignValidation(root, definition)).toThrow(ConfigError);
  });

  it("checks routing for non-batch archive definitions as well", () => {
    const {cell,definition} = fixture();
    const run = JSON.parse(readFileSync(join(cell,"run.json"),"utf8"));
    const providerRouting = {ignored_providers:["relace"]};
    expect(()=>assertProviderRoutingMatches([run],definition)).not.toThrow();
    expect(()=>assertProviderRoutingMatches([run],{...definition,providerRouting})).toThrow(/routing/);
    run.provider_routing=providerRouting;
    expect(()=>assertProviderRoutingMatches([run],{...definition,providerRouting})).not.toThrow();
    expect(()=>assertProviderRoutingMatches([run],null)).toThrow(/routing/);
  });
  it("binds routing in intended definitions and every validation C4", () => {
    const {root,definition,cell} = fixture();
    const providerRouting = {ignored_providers:["relace"]};
    const routed = {...definition,providerRouting};
    expect(()=>validateCampaignValidation(root,routed)).toThrow(/definition/);
    edit(join(root,"state.json"),s=>{s.definition_key=JSON.stringify({...routed,reps:1});});
    expect(()=>validateCampaignValidation(root,routed)).toThrow(/routing/);
    for (const dir of readdirSync(join(root,"results"))) edit(join(root,"results",dir,"run.json"),r=>{r.provider_routing=providerRouting;});
    expect(validateCampaignValidation(root,routed).passed).toBe(true);
    edit(join(cell,"run.json"),r=>{r.provider_routing={ignored_providers:["other"]};});
    expect(()=>validateCampaignValidation(root,routed)).toThrow(/routing/);
  });
  it("accepts the complete one-repetition Cartesian validation independently of campaign reps", () => {
    const { root, definition } = fixture();
    expect(validateCampaignValidation(root, definition)).toEqual({ version: 1, passed: true, task_ids: ["t1", "t2"], tools: ["codex", "cline"], model,
      price_book: definition.priceBook, cells: 4, spent_usd: 0.000005 });
  });
  it.each(["missing", "duplicate", "quarantined", "retry", "state spend", "definition", "model", "version", "image", "verifier image", "usage", "C1 identity", "C4 spend", "outcome", "log", "timing"])("refuses %s evidence", (kind) => {
    const { root, definition, cell } = fixture();
    if (kind === "missing") rmSync(cell, { recursive: true });
    if (kind === "duplicate") cpSync(cell, join(root, "results", "duplicate"), { recursive: true });
    if (["quarantined", "retry", "state spend", "definition"].includes(kind)) edit(join(root, "state.json"), (s) => {
      if (kind === "quarantined") s.cells[0].status = "quarantined";
      if (kind === "retry") s.cells[0].retries = 1;
      if (kind === "state spend") s.spentUsd = 2;
      if (kind === "definition") s.definition_key = JSON.stringify({ ...definition, reps: 1, model: "mock" });
    });
    if (["model", "version", "image", "verifier image", "C4 spend", "outcome", "timing"].includes(kind)) edit(join(cell, "run.json"), (r) => {
      if (kind === "model") r.model = "mock";
      if (kind === "version") r.tool_version = "changed";
      if (kind === "image") r.container.image_digest = "host";
      if (kind === "verifier image") r.container.verifier_image_digest = "host";
      if (kind === "C4 spend") r.spend_usd_estimate = 1;
      if (kind === "outcome") r.outcome = "verify_error";
      if (kind === "timing") r.adapter_result.tEnd = null;
    });
    if (kind === "usage" || kind === "C1 identity") edit(join(cell, "events.jsonl"), (e) => { if (kind === "usage") { e.usage = null; e.usage_source = "unavailable"; } else e.model_served = "other"; });
    if (kind === "log") rmSync(join(cell, "verify.log"));
    expect(() => validateCampaignValidation(root, definition)).toThrow(ConfigError);
  });
  it("accepts a first-attempt measured native failure but binds it to its state", () => {
    const { root, definition, cell } = fixture();
    const native = { ...definition, tasks: definition.tasks.map((task) => ({ ...task, source: "public-task-pack", sourceRepository: "https://github.com/datacurve-ai/deep-swe.git" })) };
    for (const dir of readdirSync(join(root, "results"))) edit(join(root, "results", dir, "run.json"), (r) => {
      r.task_source = "public-task-pack"; r.task_repository = "https://github.com/datacurve-ai/deep-swe.git";
    });
    edit(join(root, "state.json"), (s) => { s.definition_key = JSON.stringify({ ...native, reps: 1 }); s.cells[0].status = "task_failed"; });
    edit(join(cell, "run.json"), (r) => { r.outcome = "verify_error"; r.verification.exit = 1; });
    writeFileSync(join(cell, "verify.log"), '[verifier] reward.json={"reward":0,"f2p_total":2,"f2p_passed":1,"p2p_total":1,"p2p_passed":1,"f2p":0.5,"p2p":1,"partial":0.6666666666666666}\n');
    expect(validateCampaignValidation(root, native).passed).toBe(true);
    const check = () => assertNativeTaskFailureStates(JSON.parse(readFileSync(join(root, "state.json"), "utf8")), loadResultsTree(join(root, "results")), native);
    expect(check).not.toThrow();
    expect(copySanitizedValidation(root, join(root, "portable"), native).passed).toBe(true);
    edit(join(root, "state.json"), (s) => { s.cells[0].status = "done"; });
    expect(() => validateCampaignValidation(root, native)).toThrow(ConfigError);
    edit(join(root, "state.json"), (s) => { s.cells[0].status = "task_failed"; });
    writeFileSync(join(cell, "verify.log"), "grader crashed\n");
    expect(() => validateCampaignValidation(root, native)).toThrow(ConfigError);
    expect(check).toThrow(ConfigError);
  });

  it("re-reads evidence after an earlier pass", () => {
    const { root, definition, cell } = fixture(); validateCampaignValidation(root, definition);
    edit(join(cell, "run.json"), (r) => { r.verification.exit = 1; });
    expect(() => validateCampaignValidation(root, definition)).toThrow(ConfigError);
  });
  it("binds campaign identities while ignoring repetition and clocks", () => {
    const { root, definition } = fixture(); const campaign = fixture();
    for (const dir of readdirSync(join(campaign.root, "results"))) edit(join(campaign.root, "results", dir, "run.json"), (r) => {
      r.anchors.adapter.wall_clock_iso = "2026-09-05T01:00:00.000Z";
      r.anchors.proxy.wall_clock_iso = "2026-09-05T01:00:00.000Z";
      r.adapter_result.anchor.wall_clock_iso = "2026-09-05T01:00:00.000Z";
    });
    edit(join(campaign.cell, "run.json"), (r) => { r.rep = 3; r.container.started_iso = "2026-09-05T01:00:00.000Z"; });
    expect(validateCampaignValidation(root, definition, join(campaign.root, "results")).passed).toBe(true);
    edit(join(campaign.cell, "run.json"), (r) => { r.tool_version = "other"; });
    expect(() => validateCampaignValidation(root, definition, join(campaign.root, "results"))).toThrow(ConfigError);
  });
  it("rejects validation collected after campaign execution began", () => {
    const { root, definition } = fixture(); const campaign = fixture();
    expect(() => validateCampaignValidation(root, definition, join(campaign.root, "results"))).toThrow(/must precede/);
  });
  it("binds validation to the first primary window even when early attempts were retried or replaced", () => {
    const { root, definition } = fixture();
    expect(() => validateCampaignValidation(root, definition, undefined, "2026-09-05T00:00:00.050Z")).toThrow(/must precede/);
    expect(validateCampaignValidation(root, definition, undefined, "2026-09-05T00:00:00.098Z").passed).toBe(true);
    expect(() => validateCampaignValidation(root, definition, undefined, "invalid")).toThrow(ConfigError);
  });
  it("accepts absolute live verifier paths and relative archive paths", () => {
    const { root, definition, cell } = fixture();
    edit(join(cell, "run.json"), (r) => { r.verification.logPath = join(cell, "verify.log"); });
    expect(validateCampaignValidation(root, definition).passed).toBe(true);
  });
  it.each(["source", "repository", "base revision", "regime", "condition", "rep", "price book", "state duplicate", "state missing", "unknown outcome", "failed model", "unknown model request", "unknown image"])("refuses altered %s", (kind) => {
    const { root, definition, cell } = fixture();
    if (kind.startsWith("state")) edit(join(root, "state.json"), (s) => {
      if (kind === "state duplicate") s.cells[1] = s.cells[0]; else s.cells.pop();
    });
    else if (kind === "failed model" || kind === "unknown model request") {
      const path = join(cell, "events.jsonl"); const event = JSON.parse(readFileSync(path, "utf8"));
      event.seq = 1;
      if (kind === "failed model") { event.status = 500; event.error = { kind: "upstream_http", detail: "500" }; }
      else event.protocol = "unknown";
      writeFileSync(path, readFileSync(path, "utf8") + JSON.stringify(event) + "\n");
    } else edit(join(cell, "run.json"), (r) => {
      if (kind === "source") r.task_source = "other";
      if (kind === "repository") r.task_repository = "https://example.test/other.git";
      if (kind === "base revision") r.task_base_revision = "b".repeat(40);
      if (kind === "regime") r.task_regime = "long";
      if (kind === "condition") r.condition = "default";
      if (kind === "rep") r.rep = 1;
      if (kind === "price book") r.price_book = "other";
      if (kind === "unknown outcome") r.outcome = false;
      if (kind === "unknown image") {
        r.container.image_digest = "unknown";
        delete r.task_environment.agent_image; delete r.task_environment.agent_image_digest;
        for (const task of definition.tasks) delete (task.environment as { agent_images?: unknown }).agent_images;
      }
    });
    if (kind === "unknown image") {
      edit(join(root, "state.json"), (s) => { s.definition_key = JSON.stringify({ ...definition, reps: 1 }); });
      for (const dir of readdirSync(join(root, "results"))) edit(join(root, "results", dir, "run.json"), (r) => {
        delete r.task_environment.agent_image; delete r.task_environment.agent_image_digest;
      });
    }
    expect(() => validateCampaignValidation(root, definition)).toThrow(ConfigError);
  });
});

it("rejects compatibility variants at the existing campaign/archive boundary", () => {
  const { cell, definition } = fixture();
  const run = JSON.parse(readFileSync(join(cell, "run.json"), "utf8"));
  expect(() => assertProviderRoutingMatches([run], { ...definition, toolConfiguration: "claude-code-no-web-search" })).toThrow(/compatibility/);
  run.tool_configuration = "claude-code-no-web-search";
  expect(() => assertProviderRoutingMatches([run], definition)).toThrow(/compatibility/);
});
