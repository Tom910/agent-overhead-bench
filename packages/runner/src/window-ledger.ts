/**
 * Provenance for one runner session. This records scheduler intervals on the
 * runner's own monotonic clock; it is not an alternative source of C1-C4
 * measurement or an S6 derived metric.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { closeSync, existsSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { arch, cpus, platform, totalmem } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import { ConfigError, validateC4Run, type C4Run, type ClockAnchor } from "@aob/contracts";

const DIGEST = /^sha256:[0-9a-f]{64}$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const SESSION_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{2,127}$/;

export type RunWindowHost = {
  os: string;
  cpu: string;
  ram_gb: number;
  docker: string;
  image_digests: string[];
};

export type RunWindowAttempt = {
  id: string;
  cell_id: string;
  run_id: string;
  kind: "current" | "retry" | "replacement" | "interrupted";
  start_ms: number;
  end_ms: number | null;
  start_iso: string;
  end_iso: string | null;
  status: "open" | "completed" | "failed" | "interrupted" | "reconciled";
};

export type RunWindowSegment = {
  batch_tool?: string;
  batch_cap_usd?: number;
  host_start?: RunWindowHost;
  host_end?: RunWindowHost | null;
  id: string;
  anchor: ClockAnchor;
  start_ms: number;
  end_ms: number | null;
  start_iso: string;
  end_iso: string | null;
  attempts: RunWindowAttempt[];
};

export type RunWindowLedger = {
  execution_protocol?: "tool-batches-v1";
  version: 1;
  session_id: string;
  anchor: ClockAnchor;
  window: { start_iso: string; end_iso: string | null };
  host_start: RunWindowHost;
  host_end: RunWindowHost | null;
  matrix_definition_sha256: string;
  segments: RunWindowSegment[];
  results_binding: RunWindowResultsBinding | null;
  state_sha256: string | null;
  replacement_state_sha256: string | null;
};

export type LedgerNow = ClockAnchor & { now_ms: number };

export type CreateRunWindowLedgerOptions = {
  batch?: { tool: string; capUsd: number };
  sessionId: string;
  now: LedgerNow;
  host: RunWindowHost;
  matrixDefinitionSha256: string;
};

export type RunWindowWriterOptions = Omit<CreateRunWindowLedgerOptions, "now"> & {
  path: string;
  clock?: () => LedgerNow;
  allowContinuation?: boolean;
};

export type OfficialRunWindowOptions = {
  executionProtocol?: "tool-batches-v1";
  expectedCellTools?: ReadonlyMap<string, string>;
  expectedCellIds?: ReadonlySet<string>;
  expectedRetryCounts?: ReadonlyMap<string, number>;
  requireResultBinding?: boolean;
  /** Required by official freeze/archive paths to bind attempts to C4 evidence. */
  resultsRoot?: string;
  /** Sanitized archive retry evidence is stored outside resultsRoot. */
  retryResultsRoots?: readonly string[];
  /** Published replacement runs replace original IDs in the archive results tree. */
  ignoredRunIds?: ReadonlySet<string>;
};

/** Raw pre-freeze result-tree binding; deliberately distinct from S7 Activity's portable results_sha256. */
export type RunWindowResultsBinding = { run_ids_sha256: string; results_bytes_sha256: string };

const C4_CLOCK_TOLERANCE_MS = 2;

const LEDGER_KEYS = new Set([
  "version", "session_id", "anchor", "window", "host_start", "host_end",
  "matrix_definition_sha256", "segments", "results_binding", "state_sha256",
  "replacement_state_sha256", "execution_protocol",
]);
const HOST_KEYS = new Set(["os", "cpu", "ram_gb", "docker", "image_digests"]);
const SEGMENT_KEYS = new Set(["id", "anchor", "start_ms", "end_ms", "start_iso", "end_iso", "attempts", "batch_tool", "batch_cap_usd", "host_start", "host_end"]);
const ATTEMPT_KEYS = new Set(["id", "cell_id", "run_id", "kind", "start_ms", "end_ms", "start_iso", "end_iso", "status"]);

function fail(message: string): never {
  throw new ConfigError(`run-window ledger is invalid: ${message}`);
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(`${label} must be an object`);
  return value as Record<string, unknown>;
}

function knownKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>, label: string): void {
  const unknown = Object.keys(value).find((key) => !allowed.has(key));
  if (unknown !== undefined) fail(`${label} contains unsupported field ${unknown}`);
}

function nonemptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") fail(`${label} must be a non-empty string`);
  return value;
}

function finiteMs(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) fail(`${label} must be a nonnegative finite number`);
  return value;
}

function iso(value: unknown, label: string): string {
  if (typeof value !== "string" || !ISO.test(value)) fail(`${label} must be a millisecond UTC ISO timestamp`);
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) fail(`${label} is not a valid UTC timestamp`);
  return value;
}

function digest(value: unknown, label: string): string {
  if (typeof value !== "string" || !DIGEST.test(value)) fail(`${label} must be a SHA-256 digest`);
  return value;
}

function anchor(value: unknown, label: string): ClockAnchor {
  const raw = record(value, label);
  knownKeys(raw, new Set(["wall_clock_iso", "monotonic_zero"]), label);
  return { wall_clock_iso: iso(raw.wall_clock_iso, `${label}.wall_clock_iso`), monotonic_zero: finiteMs(raw.monotonic_zero, `${label}.monotonic_zero`) };
}

function projectedIso(value: ClockAnchor, monotonicMs: number): string {
  const wall = Date.parse(value.wall_clock_iso) + monotonicMs - value.monotonic_zero;
  if (!Number.isFinite(wall)) fail("clock projection is not finite");
  return new Date(wall).toISOString();
}

function host(value: unknown, label: string): RunWindowHost {
  const raw = record(value, label);
  knownKeys(raw, HOST_KEYS, label);
  const imageDigests = raw.image_digests;
  if (!Array.isArray(imageDigests) || imageDigests.some((item) => typeof item !== "string" || !DIGEST.test(item))) {
    fail(`${label}.image_digests must contain only SHA-256 digests`);
  }
  const sorted = [...imageDigests].sort();
  if (new Set(sorted).size !== sorted.length || JSON.stringify(sorted) !== JSON.stringify(imageDigests)) fail(`${label}.image_digests must be sorted and unique`);
  const ram = raw.ram_gb;
  if (typeof ram !== "number" || !Number.isFinite(ram) || ram <= 0) fail(`${label}.ram_gb must be positive`);
  return { os: nonemptyString(raw.os, `${label}.os`), cpu: nonemptyString(raw.cpu, `${label}.cpu`), ram_gb: ram, docker: nonemptyString(raw.docker, `${label}.docker`), image_digests: [...imageDigests] };
}

function nullableIso(value: unknown, label: string): string | null {
  return value === null ? null : iso(value, label);
}

type C4Evidence = { path: string; run: C4Run; retryIndex: number | null };

function readC4Evidence(resultsRoot: string, retryResultsRoots: readonly string[] = []): C4Evidence[] {
  const evidence: C4Evidence[] = [];
  const visit = (path: string, root: string): void => {
    const info = lstatSync(path);
    if (info.isSymbolicLink()) throw new ConfigError(`official run-window results contain a symlink: ${path}`);
    if (info.isDirectory()) {
      if (path !== root && path.split(sep).at(-1) === "workspace") return;
      for (const name of readdirSync(path).sort()) visit(join(path, name), root);
      return;
    }
    if (!info.isFile() || path.split(sep).at(-1) !== "run.json") return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(path, "utf8"));
    } catch (error) {
      throw new ConfigError(`official run-window C4 evidence is invalid: ${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
    const run = validateC4Run(parsed);
    const retryMatch = /(?:^|[\\/])(?:\.attempts|retries)(?:[\\/][^\\/]+)*[\\/]attempt-([0-9]+)[\\/]run\.json$/.exec(path);
    evidence.push({ path, run, retryIndex: retryMatch === null ? null : Number(retryMatch[1]) });
  };
  for (const candidate of [resultsRoot, ...retryResultsRoots]) {
    const root = resolve(candidate);
    if (!existsSync(root) || !lstatSync(root).isDirectory() || lstatSync(root).isSymbolicLink()) {
      throw new ConfigError(`official run-window results root is unavailable: ${candidate}`);
    }
    visit(root, root);
  }
  return evidence;
}

function projectedC4Ms(run: C4Run, value: number): number {
  const projected = Date.parse(run.anchors.adapter.wall_clock_iso) + value - run.anchors.adapter.monotonic_zero;
  if (!Number.isFinite(projected)) throw new ConfigError(`C4 adapter interval is not projectable for ${run.run_id}`);
  return projected;
}

/** Bind each ledger attempt to the C4 file and adapter interval it produced. */
function assertC4AttemptCoverage(ledger: RunWindowLedger, resultsRoot: string, retryResultsRoots: readonly string[] = [], ignoredRunIds: ReadonlySet<string> = new Set(), expectedCellTools?: ReadonlyMap<string, string>): void {
  const evidence = readC4Evidence(resultsRoot, retryResultsRoots);
  const byRunId = new Map<string, C4Evidence[]>();
  for (const item of evidence) {
    const list = byRunId.get(item.run.run_id) ?? [];
    list.push(item);
    byRunId.set(item.run.run_id, list);
  }
  const attempts = ledger.segments.flatMap((segment) => segment.attempts);
  const ledgerRunIds = new Set(attempts.map((item) => item.run_id));
  for (const runId of ledgerRunIds) {
    const expected = attempts.filter((item) => item.run_id === runId);
    const actual = byRunId.get(runId) ?? [];
    if (actual.length !== expected.length) {
      throw new ConfigError(`official run-window C4 evidence count does not match ${runId}: expected ${expected.length}, found ${actual.length}`);
    }
    const retries = actual.filter((item) => item.retryIndex !== null).sort((left, right) => left.retryIndex! - right.retryIndex!);
    if (retries.length !== Math.max(0, expected.length - 1) || retries.some((item, index) => item.retryIndex !== index)) {
      throw new ConfigError(`official run-window retry C4 evidence is not contiguous for ${runId}`);
    }
    const current = actual.filter((item) => item.retryIndex === null);
    if (current.length !== 1) throw new ConfigError(`official run-window current C4 evidence is not unique for ${runId}`);
    const ordered = expected.length === 1 ? current : [...retries, ...current];
    for (let index = 0; index < expected.length; index += 1) {
      const attemptItem = expected[index]!;
      const evidenceItem = ordered[index]!;
      if (evidenceItem.run.run_id !== attemptItem.run_id) {
        throw new ConfigError(`official run-window attempt ${attemptItem.id} is not bound to its C4 run ID`);
      }
      if (expectedCellTools !== undefined && evidenceItem.run.tool !== expectedCellTools.get(attemptItem.cell_id)) {
        throw new ConfigError(`official run-window C4 tool does not match attempt ${attemptItem.id}`);
      }
      const adapterStart = projectedC4Ms(evidenceItem.run, evidenceItem.run.adapter_result.tStart);
      const adapterEnd = projectedC4Ms(evidenceItem.run, evidenceItem.run.adapter_result.tEnd);
      const attemptStart = Date.parse(attemptItem.start_iso);
      const attemptEnd = Date.parse(attemptItem.end_iso!);
      if (adapterStart < attemptStart - C4_CLOCK_TOLERANCE_MS || adapterEnd > attemptEnd + C4_CLOCK_TOLERANCE_MS) {
        throw new ConfigError(`official run-window attempt ${attemptItem.id} does not contain its C4 adapter interval`);
      }
    }
  }
  for (const item of evidence) {
    if (!ledgerRunIds.has(item.run.run_id) && !ignoredRunIds.has(item.run.run_id)) throw new ConfigError(`official run-window has C4 evidence for an unknown attempt: ${item.run.run_id}`);
  }
}

function attempt(value: unknown, label: string, segmentAnchor: ClockAnchor, segmentStart: number, segmentEnd: number | null): RunWindowAttempt {
  const raw = record(value, label);
  knownKeys(raw, ATTEMPT_KEYS, label);
  const start = finiteMs(raw.start_ms, `${label}.start_ms`);
  const end = raw.end_ms === null ? null : finiteMs(raw.end_ms, `${label}.end_ms`);
  if (end !== null && end < start) fail(`${label} has a reversed interval`);
  if (start < segmentStart || (segmentEnd !== null && (end === null || end > segmentEnd))) fail(`${label} lies outside its segment`);
  const startIso = iso(raw.start_iso, `${label}.start_iso`);
  const endIso = nullableIso(raw.end_iso, `${label}.end_iso`);
  if (startIso !== projectedIso(segmentAnchor, start) || (end !== null && endIso !== projectedIso(segmentAnchor, end)) || (end === null && endIso !== null)) fail(`${label} ISO timestamps do not match its monotonic interval`);
  const kind = raw.kind;
  if (kind !== "current" && kind !== "retry" && kind !== "replacement" && kind !== "interrupted") fail(`${label}.kind is unsupported`);
  const status = raw.status;
  if (status !== "open" && status !== "completed" && status !== "failed" && status !== "interrupted" && status !== "reconciled") fail(`${label}.status is unsupported`);
  if (status === "open" && end !== null) fail(`${label} open status requires a null end`);
  if (status !== "open" && end === null) fail(`${label} closed status requires an end`);
  if (status === "interrupted" && kind !== "interrupted") fail(`${label} interrupted status requires interrupted kind`);
  return {
    id: nonemptyString(raw.id, `${label}.id`), cell_id: nonemptyString(raw.cell_id, `${label}.cell_id`), run_id: nonemptyString(raw.run_id, `${label}.run_id`),
    kind, start_ms: start, end_ms: end, start_iso: startIso, end_iso: endIso, status,
  };
}

function batchTool(value: unknown): string {
  if (typeof value !== "string" || !/^[a-z][a-z0-9-]{0,63}$/.test(value)) fail("batch tool has an invalid format");
  return value;
}

function batchCap(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) fail("batch cap must be positive and finite");
  return value;
}

function batchMetadata(batch: CreateRunWindowLedgerOptions["batch"], snapshot: RunWindowHost): Partial<RunWindowSegment> {
  return batch === undefined ? {} : { batch_tool: batchTool(batch.tool), batch_cap_usd: batchCap(batch.capUsd), host_start: host(snapshot, "batch host_start"), host_end: null };
}

function segment(value: unknown, label: string, batch: boolean): RunWindowSegment {
  const raw = record(value, label);
  knownKeys(raw, SEGMENT_KEYS, label);
  let metadata: Partial<RunWindowSegment> = {};
  if (batch) {
    metadata = { batch_tool: batchTool(raw.batch_tool), batch_cap_usd: batchCap(raw.batch_cap_usd),
      host_start: host(raw.host_start, `${label}.host_start`), host_end: raw.host_end === null ? null : host(raw.host_end, `${label}.host_end`) };
  } else if (["batch_tool", "batch_cap_usd", "host_start", "host_end"].some((key) => key in raw)) {
    fail(`${label} batch metadata requires the batch protocol`);
  }
  const segmentAnchor = anchor(raw.anchor, `${label}.anchor`);
  const start = finiteMs(raw.start_ms, `${label}.start_ms`);
  const end = raw.end_ms === null ? null : finiteMs(raw.end_ms, `${label}.end_ms`);
  if (end !== null && end < start) fail(`${label} has a reversed interval`);
  const startIso = iso(raw.start_iso, `${label}.start_iso`);
  const endIso = nullableIso(raw.end_iso, `${label}.end_iso`);
  if (startIso !== projectedIso(segmentAnchor, start) || (end !== null && endIso !== projectedIso(segmentAnchor, end)) || (end === null && endIso !== null)) fail(`${label} ISO timestamps do not match its monotonic interval`);
  if (!Array.isArray(raw.attempts)) fail(`${label}.attempts must be an array`);
  const attempts = raw.attempts.map((item, index) => attempt(item, `${label}.attempts[${index}]`, segmentAnchor, start, end));
  for (let index = 1; index < attempts.length; index += 1) {
    if (attempts[index]!.start_ms < attempts[index - 1]!.start_ms) fail(`${label}.attempts must be ordered by start time`);
    const previousEnd = attempts[index - 1]!.end_ms;
    if (previousEnd !== null && attempts[index]!.start_ms < previousEnd) fail(`${label}.attempts overlap`);
  }
  const ids = new Set<string>();
  const cellKinds = new Set<string>();
  for (const item of attempts) {
    if (ids.has(item.id)) fail(`duplicate attempt id ${item.id}`);
    ids.add(item.id);
    if (item.kind !== "interrupted") {
      const cellKind = `${item.kind}:${item.cell_id}`;
      if (cellKinds.has(cellKind)) fail(`duplicate ${cellKind}`);
      cellKinds.add(cellKind);
    }
  }
  return { id: nonemptyString(raw.id, `${label}.id`), anchor: segmentAnchor, start_ms: start, end_ms: end, start_iso: startIso, end_iso: endIso, attempts, ...metadata };
}

/** Validate and return a defensive copy of a runner session ledger. */
export function validateRunWindowLedger(value: unknown): RunWindowLedger {
  const raw = record(value, "ledger");
  knownKeys(raw, LEDGER_KEYS, "ledger");
  if (raw.version !== 1) fail("version must be 1");
  if ("execution_protocol" in raw && raw.execution_protocol !== "tool-batches-v1") fail("execution protocol is unsupported");
  const batch = raw.execution_protocol === "tool-batches-v1";
  const sessionId = nonemptyString(raw.session_id, "session_id");
  if (!SESSION_ID.test(sessionId)) fail("session_id has an invalid or secret-shaped format");
  const ledgerAnchor = anchor(raw.anchor, "anchor");
  const windowRaw = record(raw.window, "window");
  knownKeys(windowRaw, new Set(["start_iso", "end_iso"]), "window");
  const windowStart = iso(windowRaw.start_iso, "window.start_iso");
  const windowEnd = nullableIso(windowRaw.end_iso, "window.end_iso");
  if (windowEnd !== null && Date.parse(windowStart) >= Date.parse(windowEnd)) fail("window must have a start before its end");
  const hostStart = host(raw.host_start, "host_start");
  const hostEnd = raw.host_end === null ? null : host(raw.host_end, "host_end");
  const matrixHash = digest(raw.matrix_definition_sha256, "matrix_definition_sha256");
  if (!Array.isArray(raw.segments) || raw.segments.length === 0) fail("segments must be non-empty");
  const segments = raw.segments.map((item, index) => segment(item, `segments[${index}]`, batch));
  const segmentIds = new Set<string>();
  for (let index = 0; index < segments.length; index += 1) {
    const item = segments[index]!;
    if (segmentIds.has(item.id)) fail(`duplicate segment id ${item.id}`);
    segmentIds.add(item.id);
    if (index > 0) {
      const previous = segments[index - 1]!;
      if (item.start_iso < previous.start_iso) fail("segments must be ordered");
      if (previous.end_iso !== null && Date.parse(item.start_iso) < Date.parse(previous.end_iso)) fail("segments overlap");
    }
  }
  if (windowStart !== segments[0]!.start_iso) fail("window start does not match the first segment");
  const finalSegment = segments[segments.length - 1]!;
  if (windowEnd !== finalSegment.end_iso) fail("window end does not match the final segment");
  if (ledgerAnchor.wall_clock_iso !== segments[0]!.anchor.wall_clock_iso || ledgerAnchor.monotonic_zero !== segments[0]!.anchor.monotonic_zero) fail("ledger anchor must match the first segment anchor");
  const bindingRaw = raw.results_binding;
  let resultsBinding: RunWindowLedger["results_binding"] = null;
  if (bindingRaw !== null) {
    const binding = record(bindingRaw, "results_binding");
    knownKeys(binding, new Set(["run_ids_sha256", "results_bytes_sha256"]), "results_binding");
    resultsBinding = { run_ids_sha256: digest(binding.run_ids_sha256, "results_binding.run_ids_sha256"), results_bytes_sha256: digest(binding.results_bytes_sha256, "results_binding.results_bytes_sha256") };
  }
  const stateHash = raw.state_sha256 === null ? null : digest(raw.state_sha256, "state_sha256");
  const replacementStateHash = raw.replacement_state_sha256 === null ? null : digest(raw.replacement_state_sha256, "replacement_state_sha256");
  return {
    version: 1, session_id: sessionId, anchor: ledgerAnchor,
    window: { start_iso: windowStart, end_iso: windowEnd }, host_start: hostStart, host_end: hostEnd,
    matrix_definition_sha256: matrixHash, segments, results_binding: resultsBinding,
    state_sha256: stateHash, replacement_state_sha256: replacementStateHash,
    ...(batch ? { execution_protocol: "tool-batches-v1" as const } : {}),
  };
}

/** Apply official single-window rules, or explicit tool-batch campaign rules. */
export function assertOfficialRunWindow(value: unknown, options: OfficialRunWindowOptions = {}): RunWindowLedger {
  const ledger = validateRunWindowLedger(value);
  const batch = options.executionProtocol === "tool-batches-v1";
  if (!batch && ledger.execution_protocol !== undefined) throw new ConfigError("official batch run-window requires explicit execution protocol validation");
  if (!batch && ledger.segments.length !== 1) throw new ConfigError("official run-window ledger must contain one contiguous segment");
  if (batch && ledger.execution_protocol !== "tool-batches-v1") throw new ConfigError("official run-window execution protocol does not match batch validation");
  if (ledger.window.end_iso === null || ledger.host_end === null || ledger.segments.some((item) => item.end_ms === null)) throw new ConfigError("official run-window ledger must be closed");
  if (JSON.stringify(ledger.host_start) !== JSON.stringify(ledger.host_end)) throw new ConfigError("official run-window host identity changed during the window");
  const allAttempts = ledger.segments.flatMap((item) => item.attempts);
  if (allAttempts.some((item) => item.end_ms === null || item.status === "open" || item.status === "interrupted" || item.kind === "interrupted")) throw new ConfigError("official run-window ledger contains an unclosed or interrupted attempt");
  const expectedCellIds = options.expectedCellIds ?? (batch && options.expectedCellTools !== undefined ? new Set(options.expectedCellTools.keys()) : undefined);
  if (batch) {
    const mapping = options.expectedCellTools;
    if (mapping === undefined || mapping.size === 0 || expectedCellIds === undefined) throw new ConfigError("official batch run-window requires an expected cell tool mapping");
    if (mapping.size !== expectedCellIds.size || [...mapping.keys()].some((id) => !expectedCellIds.has(id))) throw new ConfigError("official batch run-window tool mapping keys must exactly match expected cells");
    for (const [id, tool] of mapping) { nonemptyString(id, "expected cell ID"); batchTool(tool); }
    const seenTools = new Set<string>();
    const attemptIds = new Set<string>();
    let previousTool: string | undefined;
    for (const segment of ledger.segments) {
      if (segment.host_end === null || JSON.stringify(segment.host_start) !== JSON.stringify(ledger.host_start) || JSON.stringify(segment.host_end) !== JSON.stringify(ledger.host_start)) throw new ConfigError("official batch run-window segment host identity changed or is not closed");
      const tool = segment.batch_tool!;
      if (tool !== previousTool && seenTools.has(tool)) throw new ConfigError("official batch run-window tool order contains a resumed earlier tool");
      seenTools.add(tool);
      previousTool = tool;
      for (const attempt of segment.attempts) {
        if (mapping.get(attempt.cell_id) !== tool) throw new ConfigError("official batch run-window segment contains a different or unknown cell tool");
        if (attemptIds.has(attempt.id)) throw new ConfigError("official batch run-window contains a duplicate attempt ID");
        attemptIds.add(attempt.id);
      }
    }
  }
  if (options.requireResultBinding !== false && (ledger.results_binding === null || ledger.state_sha256 === null)) throw new ConfigError("official run-window ledger is missing result/state bindings");
  if (options.resultsRoot !== undefined) assertC4AttemptCoverage(ledger, options.resultsRoot, options.retryResultsRoots, options.ignoredRunIds, batch ? options.expectedCellTools : undefined);
  if (expectedCellIds !== undefined) {
    const expectedRetryCounts = options.expectedRetryCounts ?? new Map<string, number>();
    for (const [id, count] of expectedRetryCounts) {
      if (!expectedCellIds.has(id) || !Number.isInteger(count) || count < 0) throw new ConfigError(`official run-window retry expectation is invalid for ${id}`);
    }
    for (const id of expectedCellIds) {
      const attempts = allAttempts.filter((item) => item.cell_id === id);
      if (attempts.length === 0) throw new ConfigError(`official run-window ledger is missing cell ${id}`);
      const current = attempts.filter((item) => item.kind === "current");
      const retry = attempts.filter((item) => item.kind === "retry");
      const expectedRetries = expectedRetryCounts.get(id) ?? 0;
      if (current.length !== 1 || retry.length !== expectedRetries || attempts.length !== expectedRetries + 1) {
        throw new ConfigError(`official run-window attempt coverage does not match cell ${id}: expected one current and ${expectedRetries} retries`);
      }
    }
    if (allAttempts.some((item) => !expectedCellIds.has(item.cell_id))) throw new ConfigError("official run-window ledger contains an unknown cell");
  }
  return ledger;
}

/** Official replacement windows may be separate sessions but cannot overlap. */
export function assertOfficialRunWindowsDoNotOverlap(primary: RunWindowLedger, replacement: RunWindowLedger, primaryOptions: OfficialRunWindowOptions = {}): void {
  const primaryChecked = assertOfficialRunWindow(primary, { ...primaryOptions, requireResultBinding: false });
  const replacementChecked = assertOfficialRunWindow(replacement, { requireResultBinding: false });
  const primaryStart = Date.parse(primaryChecked.window.start_iso);
  const primaryEnd = Date.parse(primaryChecked.window.end_iso!);
  const replacementStart = Date.parse(replacementChecked.window.start_iso);
  const replacementEnd = Date.parse(replacementChecked.window.end_iso!);
  if (primaryStart < replacementEnd && replacementStart < primaryEnd) {
    throw new ConfigError("official replacement run-window overlaps the primary run window");
  }
}

/**
 * Check that every retained retry artifact has a matching state retry count.
 * This accepts both raw `.attempts/attempt-N` trees and the sanitized
 * `retries/.../attempt-N` archive layout. It intentionally reads only the
 * identity marker; C4 validation remains the report loader's responsibility.
 */
export function assertRetryEvidenceCoverage(resultsRoot: string, expectedRetryCounts: ReadonlyMap<string, number>): void {
  for (const [cellId, count] of expectedRetryCounts) {
    if (typeof cellId !== "string" || cellId === "" || !Number.isInteger(count) || count < 0) {
      throw new ConfigError(`retry evidence expectation is invalid for ${cellId}`);
    }
  }
  const found = new Map<string, Set<number>>();
  const root = resolve(resultsRoot);
  if (!existsSync(root)) {
    if ([...expectedRetryCounts.values()].some((count) => count > 0)) throw new ConfigError(`retry evidence root is missing: ${resultsRoot}`);
    return;
  }
  const visit = (path: string): void => {
    const info = lstatSync(path);
    if (info.isSymbolicLink()) throw new ConfigError(`retry evidence contains a symlink: ${path}`);
    if (!info.isDirectory()) return;
    for (const name of readdirSync(path).sort()) {
      const child = join(path, name);
      const childInfo = lstatSync(child);
      if (childInfo.isSymbolicLink()) throw new ConfigError(`retry evidence contains a symlink: ${child}`);
      if (!childInfo.isDirectory()) continue;
      const match = /^attempt-([0-9]+)$/.exec(name);
      if (match === null) {
        visit(child);
        continue;
      }
      const runPath = join(child, "run.json");
      if (!existsSync(runPath) || lstatSync(runPath).isSymbolicLink() || !lstatSync(runPath).isFile()) {
        throw new ConfigError(`retry evidence is missing run.json: ${child}`);
      }
      let parsed: unknown;
      try { parsed = JSON.parse(readFileSync(runPath, "utf8")); } catch (error) {
        throw new ConfigError(`retry evidence run.json is invalid: ${error instanceof Error ? error.message : String(error)}`);
      }
      const run = record(parsed, `${runPath} run`);
      const runId = nonemptyString(run.run_id, `${runPath}.run_id`);
      if (!expectedRetryCounts.has(runId)) throw new ConfigError(`retry evidence contains an unknown cell: ${runId}`);
      const index = Number(match[1]);
      const indexes = found.get(runId) ?? new Set<number>();
      if (indexes.has(index)) throw new ConfigError(`retry evidence contains a duplicate attempt ${runId}/${index}`);
      indexes.add(index);
      found.set(runId, indexes);
    }
  };
  visit(root);
  for (const [cellId, expected] of expectedRetryCounts) {
    const indexes = found.get(cellId) ?? new Set<number>();
    if (indexes.size !== expected || [...indexes].some((index) => index < 0 || index >= expected)) {
      throw new ConfigError(`retry evidence coverage does not match ${cellId}: expected ${expected}, found ${indexes.size}`);
    }
    for (let index = 0; index < expected; index += 1) {
      if (!indexes.has(index)) throw new ConfigError(`retry evidence coverage has a gap for ${cellId}`);
    }
  }
}

export function createRunWindowLedger(options: CreateRunWindowLedgerOptions): RunWindowLedger {
  const startIso = projectedIso(options.now, options.now.now_ms);
  const segment: RunWindowSegment = {
    id: "segment-0", anchor: { wall_clock_iso: options.now.wall_clock_iso, monotonic_zero: options.now.monotonic_zero },
    start_ms: options.now.now_ms, end_ms: null, start_iso: startIso, end_iso: null, attempts: [],
    ...batchMetadata(options.batch, options.host),
  };
  return validateRunWindowLedger({
    version: 1, session_id: options.sessionId,
    ...(options.batch === undefined ? {} : { execution_protocol: "tool-batches-v1" }),
    anchor: { wall_clock_iso: options.now.wall_clock_iso, monotonic_zero: options.now.monotonic_zero },
    window: { start_iso: startIso, end_iso: null },
    host_start: options.host, host_end: null, matrix_definition_sha256: options.matrixDefinitionSha256,
    segments: [segment], results_binding: null, state_sha256: null, replacement_state_sha256: null,
  });
}

function runtimeNow(): LedgerNow {
  const monotonicZero = performance.now();
  const wallClockIso = new Date().toISOString();
  return { wall_clock_iso: wallClockIso, monotonic_zero: monotonicZero, now_ms: monotonicZero };
}

function runtimeClock(): () => LedgerNow {
  const anchor = runtimeNow();
  return () => ({ ...anchor, now_ms: performance.now() });
}

/** Capture non-secret host facts used to explain Docker/VM effects in a run. */
export function captureRunWindowHost(imageDigests: string[] = []): RunWindowHost {
  const dockerPart = (argv: string[]): string => {
    try {
      const value = execFileSync("docker", argv, { encoding: "utf8", timeout: 10_000, stdio: ["ignore", "pipe", "ignore"] }).trim();
      return value === "" ? "unavailable" : value;
    } catch {
      return "unavailable";
    }
  };
  const version = dockerPart(["version", "--format", "{{.Server.Version}}"]).replace(/[\r\n]/g, "");
  const context = dockerPart(["context", "show"]).replace(/[\r\n]/g, "");
  return {
    os: platform(),
    cpu: cpus()[0]?.model ?? arch(),
    ram_gb: totalmem() / (1024 ** 3),
    docker: `version=${version};context=${context}`,
    image_digests: [...new Set(imageDigests)].sort(),
  };
}

/**
 * Durable writer for the session ledger. Every mutation is atomically written
 * before the next external execution step, so a hard kill leaves an explicit
 * open attempt instead of an invented duration.
 */
export class RunWindowWriter {
  private readonly path: string;
  private readonly now: () => LedgerNow;
  private value: RunWindowLedger;

  private constructor(path: string, now: () => LedgerNow, value: RunWindowLedger) {
    this.path = path;
    this.now = now;
    this.value = value;
  }

  static open(options: RunWindowWriterOptions): RunWindowWriter {
    const metadata = batchMetadata(options.batch, options.host);
    const now = options.clock ?? runtimeClock();
    let value: RunWindowLedger;
    if (existsSync(options.path)) {
      value = loadRunWindowLedger(options.path);
      if ((value.execution_protocol === "tool-batches-v1") !== (options.batch !== undefined)) throw new ConfigError("run-window ledger execution protocol cannot change");
      if (options.batch !== undefined && (value.window.end_iso === null || value.segments.some((item) => item.end_ms === null || item.host_end === null || item.attempts.some((attempt) => attempt.end_ms === null || attempt.kind === "interrupted" || attempt.status === "interrupted")))) throw new ConfigError("batch run-window continuation requires cleanly closed segments");
      if (options.batch !== undefined && (JSON.stringify(value.host_end) !== JSON.stringify(value.host_start) || value.segments.some((item) => JSON.stringify(item.host_start) !== JSON.stringify(value.host_start) || JSON.stringify(item.host_end) !== JSON.stringify(value.host_start)))) throw new ConfigError("batch run-window continuation rejects host drift");
      if (options.batch !== undefined && value.segments.at(-1)!.batch_tool !== options.batch.tool && value.segments.some((item) => item.batch_tool === options.batch!.tool)) throw new ConfigError("batch run-window tool order cannot resume an earlier tool");
      if (value.window.end_iso !== null && options.allowContinuation !== true) throw new ConfigError("run-window ledger is already closed; refusing to reopen it");
      if (value.session_id !== options.sessionId) throw new ConfigError("run-window ledger session ID does not match the requested session");
      if (value.matrix_definition_sha256 !== options.matrixDefinitionSha256) throw new ConfigError("run-window ledger matrix definition does not match the requested matrix");
      if (JSON.stringify(value.host_start) !== JSON.stringify(options.host)) throw new ConfigError("run-window ledger host identity does not match the existing session");
      const start = now();
      const segmentNumber = value.segments.length;
      const next: RunWindowSegment = {
        id: `segment-${segmentNumber}`,
        anchor: { wall_clock_iso: start.wall_clock_iso, monotonic_zero: start.monotonic_zero },
        start_ms: start.now_ms, end_ms: null,
        start_iso: projectedIso(start, start.now_ms), end_iso: null, attempts: [],
        ...metadata,
      };
      value = validateRunWindowLedger({ ...value, window: { ...value.window, end_iso: null }, host_end: null, segments: [...value.segments, next], state_sha256: null, results_binding: null });
    } else {
      value = createRunWindowLedger({ sessionId: options.sessionId, now: now(), host: options.host, matrixDefinitionSha256: options.matrixDefinitionSha256, ...(options.batch === undefined ? {} : { batch: options.batch }) });
    }
    const writer = new RunWindowWriter(options.path, now, value);
    writer.save();
    return writer;
  }

  get ledger(): RunWindowLedger { return validateRunWindowLedger(this.value); }

  startAttempt(cellId: string, runId: string, kind: RunWindowAttempt["kind"]): string {
    const current = this.value.segments[this.value.segments.length - 1];
    if (current === undefined || current.end_ms !== null) throw new ConfigError("run-window ledger has no open segment");
    const start = this.now();
    if (start.now_ms < current.start_ms) throw new ConfigError("run-window attempt starts before its segment");
    const id = `${current.id}:attempt-${current.attempts.length}`;
    current.attempts.push({ id, cell_id: cellId, run_id: runId, kind, start_ms: start.now_ms, end_ms: null, start_iso: projectedIso(current.anchor, start.now_ms), end_iso: null, status: "open" });
    this.value = validateRunWindowLedger(this.value);
    this.save();
    return id;
  }

  finishAttempt(id: string, status: Exclude<RunWindowAttempt["status"], "open" | "interrupted">): void {
    const found = this.value.segments.flatMap((item) => item.attempts).find((item) => item.id === id);
    if (found === undefined || found.end_ms !== null || found.status !== "open") throw new ConfigError(`run-window attempt is not open: ${id}`);
    const segment = this.value.segments.find((item) => item.attempts.some((attemptItem) => attemptItem.id === id));
    if (segment === undefined || segment.end_ms !== null) throw new ConfigError(`run-window segment is not open: ${id}`);
    const end = this.now();
    if (end.now_ms < found.start_ms) throw new ConfigError(`run-window attempt ended before it started: ${id}`);
    found.end_ms = end.now_ms;
    found.end_iso = projectedIso(segment.anchor, end.now_ms);
    found.status = status;
    this.value = validateRunWindowLedger(this.value);
    this.save();
  }

  finish(host: RunWindowHost, stateSha256: string | null, resultsBinding: RunWindowLedger["results_binding"]): RunWindowLedger {
    const current = this.value.segments[this.value.segments.length - 1];
    if (current === undefined || current.end_ms !== null) throw new ConfigError("run-window ledger has no open segment");
    if (current.attempts.some((item) => item.end_ms === null)) throw new ConfigError("cannot close run-window ledger with an open attempt");
    const end = this.now();
    if (end.now_ms < current.start_ms) throw new ConfigError("run-window ended before it started");
    current.end_ms = end.now_ms;
    current.end_iso = projectedIso(current.anchor, end.now_ms);
    if (this.value.execution_protocol === "tool-batches-v1") current.host_end = host;
    this.value = validateRunWindowLedger({ ...this.value, window: { start_iso: this.value.window.start_iso, end_iso: current.end_iso }, host_end: host, state_sha256: stateSha256, results_binding: resultsBinding });
    this.save();
    return this.ledger;
  }

  private save(): void {
    saveRunWindowLedger(this.path, this.value);
  }
}

export function digestText(text: string | Buffer): string {
  return `sha256:${createHash("sha256").update(text).digest("hex")}`;
}

function digestFile(path: string): string {
  try {
    const fd = openSync(path, "r");
    try {
      const hash = createHash("sha256");
      const buffer = Buffer.allocUnsafe(64 * 1024);
      let bytesRead: number;
      while ((bytesRead = readSync(fd, buffer, 0, buffer.length, null)) > 0) {
        hash.update(buffer.subarray(0, bytesRead));
      }
      return `sha256:${hash.digest("hex")}`;
    } finally {
      closeSync(fd);
    }
  } catch (error) {
    throw new ConfigError(`run-window result binding cannot hash ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/** Bind exact result evidence bytes without including workspaces or prompts. */
export function bindRunWindowResults(resultsRoot: string): RunWindowResultsBinding | null {
  const root = resolve(resultsRoot);
  const entries: Array<{ path: string; sha256: string }> = [];
  const runIds: string[] = [];
  const visit = (path: string): void => {
    const info = lstatSync(path);
    const relativePath = relative(root, path).split(sep).join("/");
    if (info.isSymbolicLink()) throw new ConfigError(`run-window result binding rejects symlink: ${relativePath}`);
    if (info.isDirectory()) {
      if (relativePath === "workspace" || relativePath.endsWith("/workspace")) return;
      for (const name of readdirSync(path).sort()) visit(join(path, name));
      return;
    }
    if (!info.isFile()) throw new ConfigError(`run-window result binding rejects non-regular file: ${relativePath}`);
    const isRun = relativePath.endsWith("/run.json") || relativePath === "run.json";
    // C4 hashing and run-id extraction must observe the same bytes.
    const runBytes = isRun ? readFileSync(path) : null;
    entries.push({ path: relativePath, sha256: runBytes === null ? digestFile(path) : digestText(runBytes) });
    if (runBytes !== null) {
      try {
        const parsed = JSON.parse(runBytes.toString("utf8")) as { run_id?: unknown };
        if (typeof parsed.run_id === "string" && parsed.run_id !== "") runIds.push(parsed.run_id);
      } catch {
        // The result binding remains useful for an interrupted/partial tree;
        // the C4 loader is the authority for whether the run is publishable.
      }
    }
  };
  if (!existsSync(root)) return null;
  visit(root);
  if (entries.length === 0) return null;
  entries.sort((left, right) => left.path.localeCompare(right.path));
  runIds.sort();
  return { run_ids_sha256: digestText(JSON.stringify(runIds)), results_bytes_sha256: digestText(JSON.stringify(entries)) };
}

export function saveRunWindowLedger(path: string, ledger: RunWindowLedger): void {
  const checked = validateRunWindowLedger(ledger);
  mkdirSync(dirname(path), { recursive: true });
  const temporary = `${path}.tmp`;
  const fd = openSync(temporary, "w", 0o600);
  try {
    writeFileSync(fd, `${JSON.stringify(checked, null, 2)}\n`, "utf8");
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  renameSync(temporary, path);
}

export function loadRunWindowLedger(path: string): RunWindowLedger {
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new ConfigError(`cannot read run-window ledger: ${error instanceof Error ? error.message : String(error)}`);
  }
  return validateRunWindowLedger(parsed);
}
