import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ContractViolation,
  c4MeasurementIdentity,
  isModelRequestAttempt,
  isSuccessfulModelEvent,
  modelIdentityMatches,
  validateC1Event,
  validateC2Task,
  validateC3AdapterResult,
  validateC4Run,
} from "./index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

it("binds explicit Claude tool configuration without relabeling legacy runs", () => {
  const raw = { ...(loadFixture("c4.run.valid.json") as Record<string, unknown>), tool: "claude-code" };
  const legacy = validateC4Run(raw);
  const configured = validateC4Run({ ...raw, tool_configuration: "claude-code-no-web-search" });
  expect(configured.tool_configuration).toBe("claude-code-no-web-search");
  expect(legacy.tool_configuration).toBeUndefined();
  expect(c4MeasurementIdentity(configured)).not.toBe(c4MeasurementIdentity(legacy));
  for (const value of [null, "", "other", {}, false]) {
    expect(() => validateC4Run({ ...raw, tool_configuration: value })).toThrow(ContractViolation);
  }
  expect(() => validateC4Run({ ...raw, tool: "qwen", tool_configuration: "claude-code-no-web-search" })).toThrow(ContractViolation);
  expect((loadSchema("c4.run.schema.json").properties as Record<string, unknown>).tool_configuration).toBeDefined();
});

it("binds raw provider exclusions to C4 identity while preserving legacy records", () => {
  const raw = loadFixture("c4.run.valid.json") as Record<string, unknown>;
  const legacy = validateC4Run(raw);
  const policy = { ignored_providers: ["relace"] };
  const routed = validateC4Run({ ...raw, provider_routing: policy });
  expect(routed.provider_routing).toEqual(policy);
  expect(legacy.provider_routing).toBeUndefined();
  expect(c4MeasurementIdentity(routed)).not.toBe(c4MeasurementIdentity(legacy));
  for (const invalid of [null, {}, { ignored_providers: [] }, { ignored_providers: ["relace", "relace"] },
    { ignored_providers: ["z", "a"] }, { ignored_providers: ["Relace"] }, { ignored_providers: [3] },
    { ignored_providers: ["relace"], extra: true }]) {
    expect(() => validateC4Run({ ...raw, provider_routing: invalid })).toThrow(ContractViolation);
  }
  const schema = loadSchema("c4.run.schema.json");
  expect((schema.properties as Record<string, unknown>).provider_routing).toBeDefined();
});

it("binds a single provider and refuses ambiguous fallback policy", () => {
  const raw = loadFixture("c4.run.valid.json") as Record<string, unknown>;
  const policy = { ignored_providers: ["relace"], only_provider: "z-ai/fp8", allow_fallbacks: false };
  const pinned = validateC4Run({ ...raw, provider_routing: policy });
  expect(pinned.provider_routing).toEqual(policy);
  expect(c4MeasurementIdentity(pinned)).not.toBe(c4MeasurementIdentity(validateC4Run({...raw,provider_routing:{ignored_providers:["relace"]}})));
  for (const patch of [{allow_fallbacks:true},{allow_fallbacks:undefined},{only_provider:undefined},{only_provider:""},{only_provider:"Z.AI"},{only_provider:"relace/fp8"}]) {
    expect(() => validateC4Run({...raw,provider_routing:{...policy,...patch}})).toThrow(ContractViolation);
  }
});

function loadFixture(rel: string): unknown {
  return JSON.parse(readFileSync(join(root, "fixtures", rel), "utf8"));
}

function loadSchema(rel: string): Record<string, unknown> {
  return JSON.parse(readFileSync(join(root, "schemas", rel), "utf8")) as Record<string, unknown>;
}

describe("C1", () => {
  it("separates identifiable model attempts from successful model events", () => {
    const event = validateC1Event(loadFixture("c1.event.valid.json"));
    expect(isModelRequestAttempt(event)).toBe(true);
    expect(isSuccessfulModelEvent(event)).toBe(true);
    expect(isModelRequestAttempt({ method: "GET", path: "/v1/messages", protocol: "anthropic_messages" })).toBe(false);
    const failedHttp = { method: "POST", path: "/chat/completions", protocol: "openai_chat" as const };
    expect(isModelRequestAttempt(failedHttp)).toBe(true);
    expect(isSuccessfulModelEvent({ ...failedHttp, status: 429, error: null })).toBe(false);
    expect(isSuccessfulModelEvent({ method: "POST", path: "/metadata", protocol: "unknown", status: 200, error: null })).toBe(false);
    expect(isSuccessfulModelEvent({ ...failedHttp, status: 200, error: { kind: "network", detail: "failed" } })).toBe(false);
  });

  it("requires the recorded path to agree with the model protocol", () => {
    expect(isModelRequestAttempt({ method: "POST", path: "/v1/messages?beta=true", protocol: "anthropic_messages" })).toBe(true);
    expect(isModelRequestAttempt({ method: "POST", path: "/api/chat/completions", protocol: "openai_chat" })).toBe(true);
    expect(isModelRequestAttempt({ method: "POST", path: "/v1/responses", protocol: "openai_responses" })).toBe(true);
    expect(isModelRequestAttempt({ method: "POST", path: "/v1/messages", protocol: "openai_chat" })).toBe(false);
    expect(isSuccessfulModelEvent({ method: "POST", path: "/metadata", protocol: "openai_responses", status: 200, error: null })).toBe(false);
    expect(isModelRequestAttempt({ method: "POST", path: "/v1/messages/chat/completions", protocol: "openai_chat" })).toBe(false);
    expect(isModelRequestAttempt({ method: "POST", path: "/chat/completions/responses", protocol: "openai_responses" })).toBe(false);
    expect(isModelRequestAttempt({ method: "POST", path: "/v1/messages/responses", protocol: "openai_responses" })).toBe(false);
  });

  it("accepts a missing requested model only when the served model proves the pin", () => {
    expect(modelIdentityMatches({ model_requested: null, model_served: "m" }, "m")).toBe(true);
    expect(modelIdentityMatches({ model_requested: "m", model_served: null }, "m")).toBe(true);
    expect(modelIdentityMatches({ model_requested: null, model_served: null }, "m")).toBe(false);
    expect(modelIdentityMatches({ model_requested: null, model_served: "other" }, "m")).toBe(false);
    expect(modelIdentityMatches({ model_requested: "other", model_served: "m" }, "m")).toBe(false);
  });

  it("accepts the valid fixture", () => {
    const event = validateC1Event(loadFixture("c1.event.valid.json"));
    expect(event.run_id).toBe("s5-cell-uuid");
    expect(event.protocol).toBe("anthropic_messages");
    expect(event.usage?.cached_input).toBe(31400);
  });

  it("rejects missing t_req_start", () => {
    const raw = loadFixture("c1.event.valid.json") as Record<string, unknown>;
    delete raw.t_req_start;
    expect(() => validateC1Event(raw)).toThrow(ContractViolation);
  });

  it("never guesses usage — null is legal", () => {
    const raw = loadFixture("c1.event.valid.json") as Record<string, unknown>;
    raw.usage = null;
    raw.usage_source = "unavailable";
    expect(validateC1Event(raw).usage).toBeNull();
  });

  it("rejects contradictory usage provenance", () => {
    const raw = loadFixture("c1.event.valid.json") as Record<string, unknown>;
    raw.usage_source = "unavailable";
    expect(() => validateC1Event(raw)).toThrow(/observed usage_source/);
    raw.usage = null;
    raw.usage_source = "generation_lookup";
    expect(() => validateC1Event(raw)).toThrow(/null usage/);
  });

  it("records why a usage lookup failed, and keeps the field optional", () => {
    // A C1 event used to say only usage_source "unavailable", never why. That
    // is how a permanently broken generation-lookup fallback went unnoticed
    // long enough to abort every calibration run in this repository.
    const raw = loadFixture("c1.event.valid.json") as Record<string, unknown>;
    expect(validateC1Event(raw).usage_lookup).toBeUndefined();

    raw.usage = null;
    raw.usage_source = "unavailable";
    raw.usage_lookup = "missing_generation_id";
    expect(validateC1Event(raw).usage_lookup).toBe("missing_generation_id");

    raw.usage_lookup = "http_error";
    expect(validateC1Event(raw).usage_lookup).toBe("http_error");

    raw.usage_lookup = "sometimes";
    expect(() => validateC1Event(raw)).toThrow(/usage_lookup/);
  });

  it("requires a recovered lookup to agree with usage_source", () => {
    const raw = loadFixture("c1.event.valid.json") as Record<string, unknown>;
    raw.usage = null;
    raw.usage_source = "unavailable";
    raw.usage_lookup = "recovered";
    expect(() => validateC1Event(raw)).toThrow(/recovered/);
  });

  it("rejects omitted usage (must be null, never guessed)", () => {
    const raw = loadFixture("c1.event.valid.json") as Record<string, unknown>;
    delete raw.usage;
    expect(() => validateC1Event(raw)).toThrow(ContractViolation);
  });

  it("rejects unknown raw event fields", () => {
    const raw = loadFixture("c1.event.valid.json") as Record<string, unknown>;
    raw.debug_body = "must not enter the contract";
    expect(() => validateC1Event(raw)).toThrow(/unknown key/);
  });

  it("rejects negative or inconsistent token counts", () => {
    const negative = loadFixture("c1.event.valid.json") as Record<string, unknown>;
    negative.usage = { input: -1, cached_input: 0, output: 1, reasoning_output: 0 };
    expect(() => validateC1Event(negative)).toThrow(/nonnegative/);

    const inconsistent = loadFixture("c1.event.valid.json") as Record<string, unknown>;
    inconsistent.usage = { input: 1, cached_input: 2, output: 1, reasoning_output: 0 };
    expect(() => validateC1Event(inconsistent)).toThrow(/cached_input/);
  });

  it("rejects non-monotonic timestamps and a mismatched duration", () => {
    const outOfOrder = loadFixture("c1.event.valid.json") as Record<string, unknown>;
    outOfOrder.t_first_byte = 1;
    expect(() => validateC1Event(outOfOrder)).toThrow(/monotonic/);

    const wrongDuration = loadFixture("c1.event.valid.json") as Record<string, unknown>;
    wrongDuration.duration_ms = 1;
    expect(() => validateC1Event(wrongDuration)).toThrow(/duration_ms/);
  });
});

describe("C2", () => {
  it("accepts the valid fixture", () => {
    const task = validateC2Task(loadFixture("c2.task.valid.json"));
    expect(task.language).toBe("typescript");
    expect(task.shape).toBe("refactor");
  });

  it("accepts all languages used by the selected public source", () => {
    for (const language of ["go", "javascript", "rust"] as const) {
      const raw = loadFixture("c2.task.valid.json") as Record<string, unknown>;
      raw.language = language;
      expect(validateC2Task(raw).language).toBe(language);
    }
  });

  it("requires source provenance", () => {
    const raw = loadFixture("c2.task.valid.json") as Record<string, unknown>;
    delete raw.source;
    expect(() => validateC2Task(raw)).toThrow(ContractViolation);
  });

  it("rejects invalid timeout and expected-minute ranges", () => {
    const timeout = loadFixture("c2.task.valid.json") as Record<string, unknown>;
    timeout.timeout_s = 0;
    expect(() => validateC2Task(timeout)).toThrow(/timeout_s/);
    const range = loadFixture("c2.task.valid.json") as Record<string, unknown>;
    range.expected_minutes = [5, 1];
    expect(() => validateC2Task(range)).toThrow(/expected_minutes/);
  });
});

describe("C3", () => {
  it("accepts the valid fixture", () => {
    const result = validateC3AdapterResult(loadFixture("c3.adapter-result.valid.json"));
    expect(result.exitCode).toBe(0);
    expect(result.toolEvents?.length).toBe(1);
    expect(result.anchor?.monotonic_zero).toBe(0);
  });

  it("keeps the JSON Schema anchor requirement aligned with runtime validation", () => {
    const schema = loadSchema("c3.adapter-result.schema.json");
    expect(schema.required).toContain("anchor");
  });

  it("requires the adapter clock anchor", () => {
    const raw = loadFixture("c3.adapter-result.valid.json") as Record<string, unknown>;
    delete raw.anchor;
    expect(() => validateC3AdapterResult(raw)).toThrow(/anchor/i);
  });

  it("rejects unknown adapter-result fields", () => {
    const raw = loadFixture("c3.adapter-result.valid.json") as Record<string, unknown>;
    raw.debug = true;
    expect(() => validateC3AdapterResult(raw)).toThrow(/unknown key/);
  });

  it("rejects an adapter interval that runs backward", () => {
    const raw = loadFixture("c3.adapter-result.valid.json") as Record<string, unknown>;
    raw.tEnd = -1;
    expect(() => validateC3AdapterResult(raw)).toThrow(/nonnegative|monotonic/);
  });
});

describe("C4", () => {
  it("keeps the JSON Schema aligned with required runtime fields", () => {
    const schema = loadSchema("c4.run.schema.json");
    expect(schema.required).toContain("task_environment");
    const properties = schema.properties as Record<string, unknown>;
    const verification = properties.verification as Record<string, unknown>;
    const verificationProperties = verification.properties as Record<string, unknown>;
    const taskEnvironment = properties.task_environment as Record<string, unknown>;
    const taskEnvironmentProperties = taskEnvironment.properties as Record<string, unknown>;
    expect(verificationProperties.exit).toMatchObject({ type: "integer", minimum: 0 });
    expect(taskEnvironmentProperties.agent_image).toMatchObject({ type: "string", minLength: 1 });
    expect(taskEnvironmentProperties.agent_image_digest).toMatchObject({
      type: "string",
      pattern: "^sha256:[0-9a-f]{64}$",
    });
    expect(taskEnvironment.oneOf).toEqual([
      { not: { anyOf: [{ required: ["agent_image"] }, { required: ["agent_image_digest"] }] } },
      { required: ["agent_image", "agent_image_digest"] },
    ]);
    expect(schema).toMatchObject({
      allOf: expect.arrayContaining([{
        if: { properties: { tool_visibility: { const: "full" } } },
        then: { properties: { adapter_result: { required: ["toolEvents"] } } },
      }]),
    });
  });

  it("accepts a prepared image identity only when its pair is complete", () => {
    const raw = loadFixture("c4.run.valid.json") as Record<string, unknown>;
    raw.task_environment = {
      kind: "prepared-local",
      network: "disabled",
      agent_image: "aob-task-codex:calibration",
      agent_image_digest: `sha256:${"A".repeat(64)}`,
    };
    expect(validateC4Run(raw).task_environment.agent_image_digest).toBe(`sha256:${"a".repeat(64)}`);

    const incomplete = loadFixture("c4.run.valid.json") as Record<string, unknown>;
    incomplete.task_environment = {
      kind: "prepared-local",
      network: "disabled",
      agent_image: "aob-task-codex:calibration",
    };
    expect(() => validateC4Run(incomplete)).toThrow(/provided together/);
  });

  it("accepts the valid fixture and forbids derived metric keys", () => {
    const run = validateC4Run(loadFixture("c4.run.valid.json"));
    expect(run.outcome).toBe("completed");
    expect("harness_time" in run).toBe(false);
    expect("harness_share" in run).toBe(false);
  });

  it("preserves an optional raw task repository locator", () => {
    const raw = loadFixture("c4.run.valid.json") as Record<string, unknown>;
    raw.task_repository = "https://github.com/example/source.git";
    expect(validateC4Run(raw).task_repository).toBe("https://github.com/example/source.git");
    raw.task_repository = 42;
    expect(() => validateC4Run(raw)).toThrow(/task_repository/);
  });

  it("requires a raw tool visibility classification", () => {
    const raw = loadFixture("c4.run.valid.json") as Record<string, unknown>;
    delete raw.tool_visibility;
    expect(() => validateC4Run(raw)).toThrow(/tool_visibility/);
    raw.tool_visibility = "unknown";
    expect(() => validateC4Run(raw)).toThrow(/tool_visibility/);
  });

  it("requires tool events for full visibility only", () => {
    const full = loadFixture("c4.run.valid.json") as Record<string, unknown>;
    full.tool_visibility = "full";
    delete (full.adapter_result as Record<string, unknown>).toolEvents;
    expect(() => validateC4Run(full)).toThrow(/tool instrumentation/);

    const emptyFull = loadFixture("c4.run.valid.json") as Record<string, unknown>;
    emptyFull.tool_visibility = "full";
    (emptyFull.adapter_result as Record<string, unknown>).toolEvents = [];
    expect(validateC4Run(emptyFull).tool_visibility).toBe("full");

    const partial = loadFixture("c4.run.valid.json") as Record<string, unknown>;
    partial.tool_visibility = "partial";
    delete (partial.adapter_result as Record<string, unknown>).toolEvents;
    expect(validateC4Run(partial).tool_visibility).toBe("partial");
  });

  it("throws ContractViolation when harness_time is present", () => {
    const raw = loadFixture("c4.run.valid.json") as Record<string, unknown>;
    raw.harness_time = 1700;
    expect(() => validateC4Run(raw)).toThrow(ContractViolation);
  });

  it("throws ContractViolation when harness_share is present", () => {
    const raw = loadFixture("c4.run.valid.json") as Record<string, unknown>;
    raw.harness_share = 0.18;
    expect(() => validateC4Run(raw)).toThrow(ContractViolation);
  });

  it("requires task provenance and rejects unknown keys", () => {
    const raw = loadFixture("c4.run.valid.json") as Record<string, unknown>;
    delete raw.task_source;
    expect(() => validateC4Run(raw)).toThrow(ContractViolation);

    const withUnknown = loadFixture("c4.run.valid.json") as Record<string, unknown>;
    withUnknown.task_source = "local";
    withUnknown.task_revision = "working-tree";
    withUnknown.task_regime = "short";
    withUnknown.unexpected_raw_field = "must fail";
    expect(() => validateC4Run(withUnknown)).toThrow(ContractViolation);
  });

  it("requires verifier provenance and task-environment metadata", () => {
    const raw = loadFixture("c4.run.valid.json") as Record<string, unknown>;
    delete (raw.container as Record<string, unknown>).verifier_image_digest;
    expect(() => validateC4Run(raw)).toThrow(/verifier_image_digest/);

    const withoutEnvironment = loadFixture("c4.run.valid.json") as Record<string, unknown>;
    delete withoutEnvironment.task_environment;
    expect(() => validateC4Run(withoutEnvironment)).toThrow(/task_environment/);
  });

  it("requires a nonnegative integer repetition", () => {
    const negative = loadFixture("c4.run.valid.json") as Record<string, unknown>;
    negative.rep = -1;
    expect(() => validateC4Run(negative)).toThrow(/rep/);
    const fractional = loadFixture("c4.run.valid.json") as Record<string, unknown>;
    fractional.rep = 0.5;
    expect(() => validateC4Run(fractional)).toThrow(/rep/);
  });

  it("rejects negative spend and verification duration", () => {
    const spend = loadFixture("c4.run.valid.json") as Record<string, unknown>;
    spend.spend_usd_estimate = -0.01;
    expect(() => validateC4Run(spend)).toThrow(/spend/);

    const verification = loadFixture("c4.run.valid.json") as Record<string, unknown>;
    (verification.verification as Record<string, unknown>).duration_ms = -1;
    expect(() => validateC4Run(verification)).toThrow(/duration_ms/);
  });

  it("rejects fractional and negative verification exit codes", () => {
    const fractional = loadFixture("c4.run.valid.json") as Record<string, unknown>;
    (fractional.verification as Record<string, unknown>).exit = 0.5;
    expect(() => validateC4Run(fractional)).toThrow(/exit/);
    const negative = loadFixture("c4.run.valid.json") as Record<string, unknown>;
    (negative.verification as Record<string, unknown>).exit = -1;
    expect(() => validateC4Run(negative)).toThrow(/exit/);
  });

  it("rejects a completed run when adapter or verification failed", () => {
    const adapterFailure = loadFixture("c4.run.valid.json") as Record<string, unknown>;
    (adapterFailure.adapter_result as Record<string, unknown>).exitCode = 1;
    expect(() => validateC4Run(adapterFailure)).toThrow(/completed.*adapter_result.*exitCode/i);

    const verificationFailure = loadFixture("c4.run.valid.json") as Record<string, unknown>;
    (verificationFailure.verification as Record<string, unknown>).exit = 1;
    expect(() => validateC4Run(verificationFailure)).toThrow(/completed.*verification.*exit/i);
  });

  it("rejects invalid HTTP status and clock anchors", () => {
    const status = loadFixture("c1.event.valid.json") as Record<string, unknown>;
    status.status = 600;
    expect(() => validateC1Event(status)).toThrow(/status/);

    const run = loadFixture("c4.run.valid.json") as Record<string, unknown>;
    ((run.anchors as Record<string, unknown>).adapter as Record<string, unknown>).wall_clock_iso = "not-a-date";
    expect(() => validateC4Run(run)).toThrow(/ISO date/);
  });

  it("rejects C4 runs whose duplicated adapter anchors disagree", () => {
    const run = loadFixture("c4.run.valid.json") as Record<string, unknown>;
    ((run.anchors as Record<string, unknown>).adapter as Record<string, unknown>).monotonic_zero = 1;
    expect(() => validateC4Run(run)).toThrow(/anchors\.adapter.*match/i);
  });

  it("rejects adapter observations outside the adapter run window", () => {
    const result = loadFixture("c3.adapter-result.valid.json") as Record<string, unknown>;
    const toolEvents = (result.toolEvents as Array<Record<string, unknown>>);
    toolEvents[0] = { ...toolEvents[0], tStart: 13_000, tEnd: 14_000 };
    expect(() => validateC3AdapterResult(result)).toThrow(/adapter run window/i);

    const startup = loadFixture("c3.adapter-result.valid.json") as Record<string, unknown>;
    startup.startupProbe = 13_001;
    expect(() => validateC3AdapterResult(startup)).toThrow(/adapter run window/i);
  });
});

describe("derivation fixture", () => {
  it("records the overlap worked example numbers", () => {
    const fx = loadFixture("derivation/overlap.json") as {
      expected: { startup: number; model_time: number; tool_time: number; harness_time: number };
    };
    expect(fx.expected.startup).toBe(2500);
    expect(fx.expected.model_time).toBe(6500);
    expect(fx.expected.tool_time).toBe(1800);
    expect(fx.expected.harness_time).toBe(1700);
  });
});
