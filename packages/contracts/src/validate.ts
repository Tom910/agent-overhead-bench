import type { C1Error, C1Event, C1Usage, Protocol, UsageLookup, UsageSource } from "./c1.js";
import type { C2TaskYaml } from "./c2.js";
import type { C3AdapterResult, C3ToolEvent } from "./c3.js";
import type { C4Outcome, C4Run, ProviderRouting, ToolVisibility } from "./c4.js";
import type { ClockAnchor } from "./clock.js";
import { ContractViolation } from "./errors.js";

function isRecord(data: unknown): data is Record<string, unknown> {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}

function fail(message: string): never {
  throw new ContractViolation(message);
}

function assertKnownKeys(obj: Record<string, unknown>, keys: readonly string[], label: string): void {
  const allowed = new Set(keys);
  for (const key of Object.keys(obj)) {
    if (!allowed.has(key)) fail(`${label} has unknown key ${key}`);
  }
}

function reqString(obj: Record<string, unknown>, key: string): string {
  const v = obj[key];
  if (typeof v !== "string") fail(`${key} must be a string`);
  return v;
}

function reqNumber(obj: Record<string, unknown>, key: string): number {
  const v = obj[key];
  if (typeof v !== "number" || !Number.isFinite(v)) fail(`${key} must be a finite number`);
  return v;
}

function reqNonnegativeNumber(obj: Record<string, unknown>, key: string): number {
  const value = reqNumber(obj, key);
  if (value < 0) fail(`${key} must be nonnegative`);
  return value;
}

function reqNonnegativeInteger(obj: Record<string, unknown>, key: string): number {
  const value = reqNonnegativeNumber(obj, key);
  if (!Number.isInteger(value)) fail(`${key} must be a nonnegative integer`);
  return value;
}

function reqBoolean(obj: Record<string, unknown>, key: string): boolean {
  const v = obj[key];
  if (typeof v !== "boolean") fail(`${key} must be a boolean`);
  return v;
}

function reqNullOrString(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  if (v !== null && typeof v !== "string") fail(`${key} must be a string or null`);
  return v;
}

function reqNullOrNumber(obj: Record<string, unknown>, key: string): number | null {
  const v = obj[key];
  if (v !== null && (typeof v !== "number" || !Number.isFinite(v))) fail(`${key} must be a number or null`);
  return v;
}

function oneOf<T extends string>(value: unknown, key: string, allowed: readonly T[]): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    fail(`${key} must be one of ${allowed.join(", ")}`);
  }
  return value as T;
}

const PROTOCOLS = ["anthropic_messages", "openai_chat", "openai_responses", "unknown"] as const;
const USAGE_SOURCES = ["response_body", "generation_lookup", "unavailable"] as const;
const USAGE_LOOKUPS = ["not_attempted", "recovered", "missing_generation_id", "missing_authorization", "request_failed", "http_error", "unparsable"] as const;
const LANGUAGES = ["python", "typescript", "go", "javascript", "rust"] as const;
const SIZES = ["small", "medium"] as const;
const SHAPES = ["bugfix", "test-fix", "feature", "refactor"] as const;
const CONDITIONS = ["pinned", "default"] as const;
const OUTCOMES = ["completed", "timeout", "adapter_error", "verify_error"] as const;
const TASK_REGIMES = ["short", "long", "extended"] as const;
const TOOL_VISIBILITIES = ["none", "partial", "full"] as const;

const C4_KEYS = new Set([
  "v", "run_id", "tool", "tool_version", "task_id", "task_source", "task_revision", "task_repository", "task_base_revision",
  "task_regime", "condition", "rep", "model", "ori_version", "tool_visibility", "anchors", "adapter_result",
  "events_file", "verification", "container", "task_environment", "host", "spend_usd_estimate", "price_book", "outcome",
  "provider_routing", "tool_configuration",
]);

function validateUsage(data: unknown): C1Usage {
  if (!isRecord(data)) fail("usage must be an object");
  assertKnownKeys(data, ["input", "cached_input", "output", "reasoning_output"], "usage");
  const usage = {
    input: reqNumber(data, "input"),
    cached_input: reqNumber(data, "cached_input"),
    output: reqNumber(data, "output"),
    reasoning_output: reqNumber(data, "reasoning_output"),
  };
  if (usage.input < 0 || usage.cached_input < 0 || usage.output < 0 || usage.reasoning_output < 0) {
    fail("usage token counts must be nonnegative");
  }
  if (usage.cached_input > usage.input) fail("cached_input cannot exceed input");
  if (usage.reasoning_output > usage.output) fail("reasoning_output cannot exceed output");
  return usage;
}

function validateC1Error(data: unknown): C1Error {
  if (!isRecord(data)) fail("error must be an object");
  assertKnownKeys(data, ["kind", "detail"], "error");
  return { kind: reqString(data, "kind"), detail: reqString(data, "detail") };
}

export function validateC1Event(data: unknown): C1Event {
  if (!isRecord(data)) fail("C1 event must be an object");
  assertKnownKeys(data, [
    "v", "run_id", "seq", "t_req_start", "t_req_body_end", "t_upstream_sent", "t_first_byte", "t_last_byte",
    "duration_ms", "method", "path", "protocol", "model_requested", "model_served", "status", "streamed",
    "usage", "usage_source", "usage_lookup", "error",
  ], "C1 event");
  if (data.v !== 1) fail("v must be 1");
  if (!("usage" in data)) fail("usage is required (use null, never omit)");
  if (!("t_req_start" in data)) fail("t_req_start is required");

  const usageSource = oneOf(data.usage_source, "usage_source", USAGE_SOURCES);
  const usageLookup = data.usage_lookup === undefined ? undefined : oneOf(data.usage_lookup, "usage_lookup", USAGE_LOOKUPS);
  // A recovered lookup is exactly what produces generation_lookup usage, so the
  // two must never disagree about whether recovery happened.
  if (usageLookup === "recovered" && usageSource !== "generation_lookup") {
    fail("usage_lookup recovered requires usage_source generation_lookup");
  }
  if (usageSource === "generation_lookup" && usageLookup !== undefined && usageLookup !== "recovered") {
    fail("usage_source generation_lookup requires usage_lookup recovered");
  }
  let usage: C1Usage | null;
  if (data.usage === null) {
    if (usageSource !== "unavailable") {
      fail("null usage requires usage_source unavailable");
    }
    usage = null;
  } else {
    if (usageSource === "unavailable") fail("non-null usage requires an observed usage_source");
    usage = validateUsage(data.usage);
  }

  const t_req_start = reqNonnegativeNumber(data, "t_req_start");
  const t_req_body_end = reqNonnegativeNumber(data, "t_req_body_end");
  const t_upstream_sent = reqNonnegativeNumber(data, "t_upstream_sent");
  const t_first_byte = reqNonnegativeNumber(data, "t_first_byte");
  const t_last_byte = reqNonnegativeNumber(data, "t_last_byte");
  const duration_ms = reqNonnegativeNumber(data, "duration_ms");
  if (!(t_req_start <= t_req_body_end && t_req_body_end <= t_upstream_sent &&
    t_upstream_sent <= t_first_byte && t_first_byte <= t_last_byte)) {
    fail("C1 timestamps must be monotonic");
  }
  if (duration_ms !== t_last_byte - t_req_start) fail("duration_ms must equal t_last_byte - t_req_start");
  return {
    v: 1,
    run_id: reqString(data, "run_id"),
    seq: reqNonnegativeInteger(data, "seq"),
    t_req_start,
    t_req_body_end,
    t_upstream_sent,
    t_first_byte,
    t_last_byte,
    duration_ms,
    method: reqString(data, "method"),
    path: reqString(data, "path"),
    protocol: oneOf(data.protocol, "protocol", PROTOCOLS) as Protocol,
    model_requested: reqNullOrString(data, "model_requested"),
    model_served: reqNullOrString(data, "model_served"),
    status: (() => {
      const status = reqNonnegativeInteger(data, "status");
      if (status > 599) fail("status must be an HTTP status or 0");
      return status;
    })(),
    streamed: reqBoolean(data, "streamed"),
    usage,
    usage_source: usageSource as UsageSource,
    ...(usageLookup === undefined ? {} : { usage_lookup: usageLookup as UsageLookup }),
    error: data.error === null ? null : validateC1Error(data.error),
  };
}

export function validateC2Task(data: unknown): C2TaskYaml {
  if (!isRecord(data)) fail("C2 task must be an object");
  assertKnownKeys(data, ["id", "source", "language", "size", "shape", "timeout_s", "expected_minutes", "description"], "C2 task");
  const minutes = data.expected_minutes;
  if (!Array.isArray(minutes) || minutes.length !== 2) {
    fail("expected_minutes must be [min, max]");
  }
  const lo = minutes[0];
  const hi = minutes[1];
  if (typeof lo !== "number" || typeof hi !== "number" || !Number.isFinite(lo) || !Number.isFinite(hi) || lo < 0 || hi < lo) {
    fail("expected_minutes must be numbers");
  }
  if (typeof data.timeout_s !== "number" || !Number.isFinite(data.timeout_s) || data.timeout_s <= 0) {
    fail("timeout_s must be a positive number");
  }
  return {
    id: reqString(data, "id"),
    source: (() => {
      if (!isRecord(data.source)) fail("source must be an object");
      assertKnownKeys(data.source, ["kind", "repository", "revision", "task_id", "license_notes", "base_revision"], "source");
      const baseRevision = data.source.base_revision;
      if (baseRevision !== undefined && (typeof baseRevision !== "string" || !/^[0-9a-f]{40}$/i.test(baseRevision))) {
        fail("source.base_revision must be a full commit SHA when present");
      }
      return {
        kind: reqString(data.source, "kind"),
        repository: reqString(data.source, "repository"),
        revision: reqString(data.source, "revision"),
        task_id: reqString(data.source, "task_id"),
        license_notes: reqString(data.source, "license_notes"),
        ...(baseRevision === undefined ? {} : { base_revision: baseRevision.toLowerCase() }),
      };
    })(),
    language: oneOf(data.language, "language", LANGUAGES),
    size: oneOf(data.size, "size", SIZES),
    shape: oneOf(data.shape, "shape", SHAPES),
    timeout_s: reqNumber(data, "timeout_s"),
    expected_minutes: [lo, hi],
    description: reqString(data, "description"),
  };
}

function validateToolEvent(data: unknown): C3ToolEvent {
  if (!isRecord(data)) fail("toolEvent must be an object");
  assertKnownKeys(data, ["tStart", "tEnd", "kind"], "toolEvent");
  const tStart = reqNonnegativeNumber(data, "tStart");
  const tEnd = reqNonnegativeNumber(data, "tEnd");
  if (tEnd < tStart) fail("toolEvent timestamps must be monotonic");
  return {
    tStart,
    tEnd,
    kind: reqString(data, "kind"),
  };
}

export function validateC3AdapterResult(data: unknown): C3AdapterResult {
  if (!isRecord(data)) fail("C3 adapter result must be an object");
  assertKnownKeys(data, ["exitCode", "tStart", "tEnd", "anchor", "startupProbe", "toolEvents", "artifacts"], "C3 adapter result");
  const artifactsRaw = data.artifacts;
  if (!isRecord(artifactsRaw)) fail("artifacts must be an object");
  assertKnownKeys(artifactsRaw, ["stdoutPath", "stderrPath", "toolLogPath"], "artifacts");
  const artifacts: C3AdapterResult["artifacts"] = {
    stdoutPath: reqString(artifactsRaw, "stdoutPath"),
    stderrPath: reqString(artifactsRaw, "stderrPath"),
  };
  if (artifactsRaw.toolLogPath !== undefined) {
    artifacts.toolLogPath = reqString(artifactsRaw, "toolLogPath");
  }
  const exitCode = reqNonnegativeInteger(data, "exitCode");
  const tStart = reqNonnegativeNumber(data, "tStart");
  const tEnd = reqNonnegativeNumber(data, "tEnd");
  if (tEnd < tStart) fail("adapter timestamps must be monotonic");
  const result: C3AdapterResult = {
    exitCode,
    tStart,
    tEnd,
    anchor: validateAnchor(data.anchor, "anchor"),
    artifacts,
  };
  if (data.startupProbe !== undefined) {
    const startupProbe = reqNonnegativeNumber(data, "startupProbe");
    if (startupProbe < tStart || startupProbe > tEnd) fail("startupProbe must be within the adapter run window");
    result.startupProbe = startupProbe;
  }
  if (data.toolEvents !== undefined) {
    if (!Array.isArray(data.toolEvents)) fail("toolEvents must be an array");
    result.toolEvents = data.toolEvents.map((event) => {
      const validated = validateToolEvent(event);
      if (validated.tStart < tStart || validated.tEnd > tEnd) {
        fail("toolEvent must be within the adapter run window");
      }
      return validated;
    });
  }
  return result;
}

function validateAnchor(data: unknown, label: string): ClockAnchor {
  if (!isRecord(data)) fail(`${label} must be an object`);
  assertKnownKeys(data, ["wall_clock_iso", "monotonic_zero"], label);
  const wallClock = reqString(data, "wall_clock_iso");
  if (!Number.isFinite(Date.parse(wallClock))) fail(`${label}.wall_clock_iso must be an ISO date`);
  return {
    wall_clock_iso: wallClock,
    monotonic_zero: reqNonnegativeNumber(data, "monotonic_zero"),
  };
}

export function validateProviderRouting(data: unknown): ProviderRouting {
  if (!isRecord(data)) fail("provider_routing must be an object");
  assertKnownKeys(data, ["ignored_providers", "only_provider", "allow_fallbacks"], "provider_routing");
  const ignored = data.ignored_providers;
  if (!Array.isArray(ignored) || ignored.length === 0 || !ignored.every((value): value is string =>
    typeof value === "string" && /^[a-z0-9][a-z0-9/_-]*$/.test(value))) fail("ignored_providers must be a nonempty provider ID array");
  if (new Set(ignored).size !== ignored.length || JSON.stringify([...ignored].sort()) !== JSON.stringify(ignored)) {
    fail("ignored_providers must be sorted and unique");
  }
  if ("only_provider" in data || "allow_fallbacks" in data) {
    const only = data.only_provider;
    if (typeof only !== "string" || !/^[a-z0-9][a-z0-9/_-]*$/.test(only) || data.allow_fallbacks !== false) {
      fail("only_provider requires a valid provider ID and allow_fallbacks false");
    }
    if (ignored.some(id => only === id || only.startsWith(`${id}/`))) fail("only_provider is excluded");
    return { ignored_providers: [...ignored], only_provider: only, allow_fallbacks: false };
  }
  return { ignored_providers: [...ignored] };
}

export function validateC4Run(data: unknown): C4Run {
  if (!isRecord(data)) fail("C4 run must be an object");
  assertKnownKeys(data, Array.from(C4_KEYS), "C4 run");
  for (const key of Object.keys(data)) {
    if (!C4_KEYS.has(key)) fail(`unknown C4 key ${key}`);
  }
  if ("harness_time" in data) fail("derived metric harness_time is forbidden in run.json");
  if ("harness_share" in data) fail("derived metric harness_share is forbidden in run.json");
  if (data.v !== 1) fail("v must be 1");
  if (data.tool_configuration !== undefined && (data.tool_configuration !== "claude-code-no-web-search" || data.tool !== "claude-code")) fail("unsupported tool_configuration for tool");
  const anchorsRaw = data.anchors;
  if (!isRecord(anchorsRaw)) fail("anchors must be an object");
  const verificationRaw = data.verification;
  if (!isRecord(verificationRaw)) fail("verification must be an object");
  assertKnownKeys(verificationRaw, ["exit", "duration_ms", "logPath"], "verification");
  const containerRaw = data.container;
  if (!isRecord(containerRaw)) fail("container must be an object");
  assertKnownKeys(containerRaw, ["image_digest", "verifier_image_digest", "started_iso"], "container");
  const taskEnvironmentRaw = data.task_environment;
  if (!isRecord(taskEnvironmentRaw)) fail("task_environment must be an object");
  assertKnownKeys(taskEnvironmentRaw, ["kind", "network", "agent_image", "agent_image_digest"], "task_environment");
  const agentImage = taskEnvironmentRaw.agent_image;
  const agentImageDigest = taskEnvironmentRaw.agent_image_digest;
  if (agentImage !== undefined && (typeof agentImage !== "string" || agentImage.length === 0 || agentImage.includes("\0") || agentImage.includes(","))) {
    fail("task_environment.agent_image must be a non-empty image name");
  }
  if (agentImageDigest !== undefined && (typeof agentImageDigest !== "string" || !/^sha256:[0-9a-f]{64}$/i.test(agentImageDigest))) {
    fail("task_environment.agent_image_digest must be an image digest");
  }
  if ((agentImage === undefined) !== (agentImageDigest === undefined)) fail("task_environment.agent_image and agent_image_digest must be provided together");
  const hostRaw = data.host;
  if (!isRecord(hostRaw)) fail("host must be an object");
  assertKnownKeys(hostRaw, ["os", "cpu", "ram_gb"], "host");
  const toolVisibility = oneOf(data.tool_visibility, "tool_visibility", TOOL_VISIBILITIES) as ToolVisibility;
  const adapterResult = validateC3AdapterResult(data.adapter_result);
  const verificationExit = reqNonnegativeInteger(verificationRaw, "exit");
  const outcome = oneOf(data.outcome, "outcome", OUTCOMES) as C4Outcome;
  if (outcome === "completed" && adapterResult.exitCode !== 0) {
    fail("completed runs require adapter_result.exitCode to be 0");
  }
  if (outcome === "completed" && verificationExit !== 0) {
    fail("completed runs require verification.exit to be 0");
  }
  if (toolVisibility === "full" && adapterResult.toolEvents === undefined) {
    fail("full visibility requires tool instrumentation (toolEvents)");
  }
  const adapterAnchor = validateAnchor(anchorsRaw.adapter, "anchors.adapter");
  if (adapterAnchor.wall_clock_iso !== adapterResult.anchor.wall_clock_iso || adapterAnchor.monotonic_zero !== adapterResult.anchor.monotonic_zero) {
    fail("C4 anchors.adapter must match adapter_result.anchor");
  }
  return {
    v: 1,
    run_id: reqString(data, "run_id"),
    tool: reqString(data, "tool"),
    tool_version: reqString(data, "tool_version"),
    task_id: reqString(data, "task_id"),
    task_source: reqString(data, "task_source"),
    task_revision: reqString(data, "task_revision"),
    ...(data.task_repository === undefined ? {} : { task_repository: reqString(data, "task_repository") }),
    task_base_revision: (() => {
      const revision = data.task_base_revision === undefined ? null : reqNullOrString(data, "task_base_revision");
      if (revision !== null && !/^[0-9a-f]{40}$/i.test(revision)) fail("task_base_revision must be a full commit SHA or null");
      return revision === null ? null : revision.toLowerCase();
    })(),
    task_regime: oneOf(data.task_regime, "task_regime", TASK_REGIMES),
    condition: oneOf(data.condition, "condition", CONDITIONS),
    rep: (() => {
      const rep = reqNumber(data, "rep");
      if (!Number.isInteger(rep) || rep < 0) fail("rep must be a nonnegative integer");
      return rep;
    })(),
    model: reqString(data, "model"),
    ...(data.provider_routing === undefined ? {} : { provider_routing: validateProviderRouting(data.provider_routing) }),
    ...(data.tool_configuration === undefined ? {} : { tool_configuration: "claude-code-no-web-search" as const }),
    ori_version: reqNullOrString(data, "ori_version"),
    tool_visibility: toolVisibility,
    anchors: {
      adapter: adapterAnchor,
      proxy: validateAnchor(anchorsRaw.proxy, "anchors.proxy"),
    },
    adapter_result: adapterResult,
    events_file: reqString(data, "events_file"),
    verification: {
      exit: verificationExit,
      duration_ms: reqNonnegativeNumber(verificationRaw, "duration_ms"),
      logPath: reqString(verificationRaw, "logPath"),
    },
    container: {
      image_digest: reqString(containerRaw, "image_digest"),
      verifier_image_digest: reqString(containerRaw, "verifier_image_digest"),
      started_iso: reqString(containerRaw, "started_iso"),
    },
    task_environment: {
      kind: reqString(taskEnvironmentRaw, "kind"),
      network: oneOf(taskEnvironmentRaw.network, "task_environment.network", ["disabled"]),
      ...(agentImage === undefined ? {} : { agent_image: agentImage as string, agent_image_digest: (agentImageDigest as string).toLowerCase() }),
    },
    host: {
      os: reqString(hostRaw, "os"),
      cpu: reqString(hostRaw, "cpu"),
      ram_gb: reqNonnegativeNumber(hostRaw, "ram_gb"),
    },
    spend_usd_estimate: (() => {
      const spend = reqNullOrNumber(data, "spend_usd_estimate");
      if (spend !== null && spend < 0) fail("spend_usd_estimate must be nonnegative");
      return spend;
    })(),
    price_book: reqString(data, "price_book"),
    outcome,
  };
}
