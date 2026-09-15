import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { isCompletedNativeTaskFailure, c4MeasurementIdentity, ConfigError, isPreInferenceRejection, isModelRequestAttempt, isSuccessfulModelEvent, modelIdentityMatches, type C4Run } from "@aob/contracts";
import { costUsd, type PriceRates } from "./aggregate.js";
import { loadResultsTree, type LoadedCell } from "./from-results.js";
import { priceBookPath } from "./price-books.js";
import { validateProviderRouting, type ProviderRouting } from "@aob/contracts";

export type CampaignValidationSummary = {
  version: 1; passed: true; task_ids: string[]; tools: string[]; model: string; price_book: string; cells: number; spent_usd: number;
};
type RecordValue = Record<string, unknown>;
type Task = { id: string; source: string; revision: string; regime: string; timeoutS: number; sourceRepository?: unknown; baseRevision?: unknown; environment?: unknown; verifier?: unknown };
type Definition = { tools: string[]; tasks: Task[]; model: string; priceBook: string; conditions: string[]; reps: number; providerRouting?: ProviderRouting };

function fail(message: string): never { throw new ConfigError(`campaign validation: ${message}`); }
function record(value: unknown, label: string): RecordValue {
  if (value === null || typeof value !== "object" || Array.isArray(value)) fail(`${label} must be an object`);
  return value as RecordValue;
}
function string(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim().length === 0) fail(`${label} must be a nonempty string`);
  return value;
}
function strings(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.length === 0) fail(`${label} must be a nonempty array`);
  const result = value.map((item) => string(item, label));
  if (new Set(result).size !== result.length) fail(`${label} contains duplicates`);
  return result;
}
function finite(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value) && value >= 0; }
function definition(value: unknown): Definition {
  const d = record(value, "definition");
  if (d.toolConfiguration !== undefined) fail("compatibility configuration is outside the existing campaign profile");
  const tools = strings(d.tools, "tools");
  const conditions = strings(d.conditions, "conditions");
  if (conditions.length !== 1 || conditions[0] !== "pinned") fail("validation requires the pinned condition");
  if (!finite(d.reps) || !Number.isInteger(d.reps) || d.reps < 1) fail("invalid repetition count");
  if (!Array.isArray(d.tasks) || d.tasks.length === 0) fail("tasks must be a nonempty array");
  const tasks = d.tasks.map((value) => {
    const task = record(value, "task");
    for (const field of ["id", "source", "revision", "regime"]) string(task[field], `task ${field}`);
    if (!["short", "long", "extended"].includes(task.regime as string) || !finite(task.timeoutS) || task.timeoutS === 0) fail("invalid task regime or timeout");
    for (const field of ["sourceRepository", "baseRevision"]) if (task[field] !== undefined) string(task[field], `task ${field}`);
    return task as Task;
  });
  if (new Set(tasks.map((task) => task.id)).size !== tasks.length) fail("duplicate task ids");
  return { tools, conditions, tasks, model: string(d.model, "model"), priceBook: string(d.priceBook, "price book"), reps: d.reps,
    ...(d.providerRouting === undefined ? {} : { providerRouting: validateProviderRouting(d.providerRouting) }) };
}
function readJson(path: string): unknown {
  const info = lstatSync(path);
  if (info.isSymbolicLink() || !info.isFile()) fail(`evidence is not a regular file: ${path}`);
  return JSON.parse(readFileSync(path, "utf8"));
}
function sameDefinition(actual: Definition, intended: Definition): boolean {
  return isDeepStrictEqual({ ...actual, reps: 1 }, { ...intended, reps: 1 });
}
function key(tool: string, task: string, condition: string): string { return JSON.stringify([tool, task, condition]); }
/** Routing binding also applies to legacy scheduling and nonofficial archives. */
export function assertProviderRoutingMatches(runs: readonly C4Run[], intended: unknown): void {
  const d = intended == null ? {} : record(intended, "definition");
  if (d.toolConfiguration !== undefined || runs.some((run) => run.tool_configuration !== undefined)) fail("compatibility configuration is outside the existing campaign/archive profile");
  const policy = d.providerRouting === undefined ? undefined : validateProviderRouting(d.providerRouting);
  for (const run of runs) {
    if (!isDeepStrictEqual(run.provider_routing, policy)) fail(`provider routing differs for ${run.run_id}`);
  }
}
function assertPins(run: C4Run, d: Definition): void {
  assertProviderRoutingMatches([run], d);
  const task = d.tasks.find((candidate) => candidate.id === run.task_id);
  if (!task || !d.tools.includes(run.tool) || !d.conditions.includes(run.condition)) fail(`unexpected cell ${run.run_id}`);
  if (run.model !== d.model || run.price_book !== d.priceBook || run.task_source !== task.source ||
      run.task_revision !== task.revision || run.task_repository !== task.sourceRepository ||
      (run.task_base_revision ?? undefined) !== task.baseRevision || run.task_regime !== task.regime) fail(`source/model/price book pins differ for ${run.run_id}`);
  string(run.tool_version, "tool version");
  if (/^(unknown|unavailable)$/i.test(run.tool_version)) fail(`unidentifiable tool version for ${run.run_id}`);
  for (const image of [run.container.image_digest, run.container.verifier_image_digest]) {
    if (/^(unknown|unavailable)$/i.test(string(image, "container image digest"))) fail(`unidentifiable image for ${run.run_id}`);
  }
  const environment = task.environment === undefined ? { kind: "runner-default", network: "disabled" } : record(task.environment, "task environment");
  if (run.task_environment.kind !== environment.kind || run.task_environment.network !== environment.network) fail(`task environment differs for ${run.run_id}`);
  if (environment.agent_images !== undefined) {
    const image = record(record(environment.agent_images, "agent images")[run.tool], "tool agent image");
    const imageName = string(image.image, "agent image"); const imageDigest = string(image.image_digest, "agent image digest");
    if (run.container.image_digest !== imageDigest || run.task_environment.agent_image_digest !== imageDigest || run.task_environment.agent_image !== imageName) fail(`agent image differs for ${run.run_id}`);
  } else if (run.task_environment.agent_image !== undefined || run.task_environment.agent_image_digest !== undefined) fail(`unexpected agent image for ${run.run_id}`);
  if (task.verifier !== undefined && task.verifier !== "script") {
    const verifier = record(task.verifier, "verifier");
    if (verifier.kind !== "docker-command" || run.container.verifier_image_digest !== string(verifier.image_digest, "verifier image digest")) fail(`verifier image differs for ${run.run_id}`);
  }
}
function verifyLog(cell: LoadedCell): void {
  const root = realpathSync(dirname(cell.runPath));
  const path = resolve(dirname(cell.runPath), cell.run.verification.logPath);
  const rel = relative(root, realpathSync(path));
  if (rel === "" || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel) || lstatSync(path).isSymbolicLink() || !lstatSync(path).isFile()) fail(`verifier log escapes cell or is not a regular file for ${cell.run.run_id}`);
}
function rates(d: Definition): PriceRates {
  const book = record(readJson(priceBookPath(d.priceBook)), "price book");
  if (book.id !== d.priceBook) fail("price book id differs");
  const value = record(record(book.models, "price book models")[d.model], "model pricing");
  if (!finite(value.input) || !finite(value.cached_input) || !finite(value.output)) fail("invalid model pricing");
  return { input: value.input, cached_input: value.cached_input, output: value.output };
}
function close(left: number, right: number): boolean { return Math.abs(left - right) <= Math.max(1e-9, Math.abs(left) * 1e-6); }
/** Archive boundaries recheck terminal task failures against retained raw evidence. */
export function assertNativeTaskFailureStates(state: unknown, cells: readonly LoadedCell[], intended: unknown): void {
  const value = record(state, "runner state");
  if (!Array.isArray(value.cells)) fail("runner state cells are missing");
  const failed = value.cells.map((cell) => record(cell, "state cell")).filter((cell) => cell.status === "task_failed");
  if (failed.length === 0) return;
  const d = definition(intended);
  const pricing = rates(d);
  for (const cell of failed) {
    const matches = cells.filter((candidate) => candidate.run.run_id === cell.id);
    if (matches.length !== 1) fail(`missing or duplicate native failure evidence for ${String(cell.id)}`);
    const loaded = matches[0]!;
    const run = loaded.run;
    assertPins(run, d);
    if (cell.tool !== run.tool || cell.task_id !== run.task_id || cell.condition !== run.condition || cell.rep !== run.rep) fail(`native failure state identity differs for ${run.run_id}`);
    assertSuccessful(loaded, pricing, d.model, cell.status);
  }
}
function assertSuccessful(cell: LoadedCell, pricing: PriceRates, model: string, status: unknown): number {
  const { run, events, derived } = cell;
  const accepted = status === "task_failed" ? isCompletedNativeTaskFailure(run, dirname(cell.runPath), pricing) :
    status === "done" && run.outcome === "completed" && run.adapter_result.exitCode === 0 && run.verification.exit === 0;
  if (!accepted || derived.unreconciled) fail(`unsuccessful or unreconciled evidence for ${run.run_id}`);
  if (![run.adapter_result.tStart, run.adapter_result.tEnd, run.verification.duration_ms].every(finite) ||
      run.adapter_result.tEnd <= run.adapter_result.tStart) fail(`invalid timings for ${run.run_id}`);
  verifyLog(cell);
  for (const event of events) {
    // Metadata GETs are permitted, but malformed model requests must not
    // disappear from accounting merely because their protocol is unknown.
    if (!isModelRequestAttempt(event) && (event.model_requested !== null || event.model_served !== null ||
        (event.method === "POST" && /\/(?:messages|responses|chat\/completions)(?:\?|$)/.test(event.path)))) fail(`unrecognized model traffic for ${run.run_id}`);
  }
  const attempts = events.filter(isModelRequestAttempt);
  if (attempts.length === 0) fail(`missing model evidence for ${run.run_id}`);
  let spent = 0;
  let successful = 0;
  for (const event of attempts) {
    if (!modelIdentityMatches(event, model) ||
        ![event.t_req_start, event.t_req_body_end, event.t_upstream_sent, event.t_first_byte, event.t_last_byte, event.duration_ms].every(finite)) fail(`incomplete model identity/timing for ${run.run_id}`);
    if (isPreInferenceRejection(event)) continue;
    if (!isSuccessfulModelEvent(event) || event.usage === null || event.usage_source === "unavailable") fail(`incomplete successful model identity/usage/timing for ${run.run_id}`);
    successful++;
    const cost = costUsd(event.usage, pricing);
    if (cost === null || !finite(cost)) fail(`unpriced traffic for ${run.run_id}`);
    spent += cost;
  }
  if (successful === 0) fail(`missing successful model evidence for ${run.run_id}`);
  if (!finite(run.spend_usd_estimate) || !close(spent, run.spend_usd_estimate)) fail(`C4 spend disagrees with C1 pricing for ${run.run_id}`);
  return run.spend_usd_estimate;
}
function wallTime(run: C4Run, point: "tStart" | "tEnd"): number {
  const anchor = run.anchors.adapter;
  const value = Date.parse(anchor.wall_clock_iso) + run.adapter_result[point] - anchor.monotonic_zero;
  if (!Number.isFinite(value)) fail(`invalid adapter clock for ${run.run_id}`);
  return value;
}

/** Recompute the pre-campaign gate from raw runner state, C4 and C1 evidence. */
export function validateCampaignValidation(validationRoot: string, intended: unknown, campaignResults?: string, campaignStartIso?: string): CampaignValidationSummary {
  try {
    const d = definition(intended);
    const state = record(readJson(join(validationRoot, "state.json")), "validation state");
    if (state.version !== 1 || !finite(state.spentUsd) || !Array.isArray(state.cells)) fail("invalid validation state");
    const recordedDefinition = definition(JSON.parse(string(state.definition_key, "state definition_key")));
    if (recordedDefinition.reps !== 1 || !sameDefinition(recordedDefinition, d)) fail("validation definition differs from intended campaign");
    const expected = new Set(d.tools.flatMap((tool) => d.tasks.map((task) => key(tool, task.id, "pinned"))));
    const stateKeys = new Set<string>(); const ids = new Set<string>();
    for (const value of state.cells) {
      const cell = record(value, "state cell");
      const cellKey = key(string(cell.tool, "cell tool"), string(cell.task_id, "cell task"), string(cell.condition, "cell condition"));
      const id = string(cell.id, "cell id");
      if (!expected.has(cellKey) || stateKeys.has(cellKey) || ids.has(id) || cell.rep !== 0 || (cell.status !== "done" && cell.status !== "task_failed") || cell.retries !== 0 ||
          cell.interruptedSpendUsd !== undefined || cell.containerName !== undefined || cell.relayName !== undefined || cell.networkName !== undefined) fail(`unexpected, duplicate, or incomplete validation state cell ${id}`);
      stateKeys.add(cellKey); ids.add(id);
    }
    if (stateKeys.size !== expected.size) fail("missing validation state cells");
    const cells = loadResultsTree(join(validationRoot, "results"));
    const evidence = new Map<string, LoadedCell>(); const versions = new Map<string, string>();
    const pricing = rates(d); let spent = 0;
    for (const cell of cells) {
      const { run } = cell; assertPins(run, d);
      const cellKey = key(run.tool, run.task_id, run.condition);
      if (run.rep !== 0 || evidence.has(cellKey) || !ids.has(run.run_id)) fail(`unexpected or duplicate validation result ${run.run_id}`);
      const stateCell = state.cells.find((value) => record(value, "state cell").id === run.run_id) as RecordValue;
      if (stateCell.tool !== run.tool || stateCell.task_id !== run.task_id || stateCell.condition !== run.condition) fail(`state/result identity differs for ${run.run_id}`);
      const version = versions.get(run.tool);
      if (version !== undefined && version !== run.tool_version) fail(`tool version differs across validation tasks for ${run.tool}`);
      versions.set(run.tool, run.tool_version); evidence.set(cellKey, cell);
      spent += assertSuccessful(cell, pricing, d.model, stateCell.status);
    }
    if (evidence.size !== expected.size) fail("missing validation C4 cells");
    if (!close(spent, state.spentUsd)) fail("validation state spend disagrees with C4 spend");
    const validationEnd = Math.max(...cells.map((cell) => wallTime(cell.run, "tEnd")));
    if (campaignStartIso !== undefined) {
      const campaignStart = Date.parse(campaignStartIso);
      if (!Number.isFinite(campaignStart) || new Date(campaignStart).toISOString() !== campaignStartIso) fail("invalid primary campaign start ISO timestamp");
      // The primary ledger starts before retained retries and replacement
      // originals, which may no longer appear in the report-facing results.
      if (validationEnd > campaignStart + 2) fail("validation evidence must precede the primary campaign window");
    }
    if (campaignResults !== undefined) {
      const campaign = loadResultsTree(campaignResults);
      for (const cell of campaign) {
        const { run } = cell; assertPins(run, d);
        const prior = evidence.get(key(run.tool, run.task_id, run.condition));
        if (!prior || run.rep >= d.reps || c4MeasurementIdentity({ ...run, rep: 0 }) !== c4MeasurementIdentity(prior.run)) fail(`campaign identity/version/image differs from validation for ${run.run_id}`);
      }
      if (campaign.length > 0 && validationEnd > Math.min(...campaign.map((cell) => wallTime(cell.run, "tStart"))) + 2) fail("validation evidence must precede the campaign");
    }
    return { version: 1, passed: true, task_ids: d.tasks.map((task) => task.id), tools: d.tools, model: d.model, price_book: d.priceBook, cells: cells.length, spent_usd: spent };
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(`campaign validation evidence is invalid: ${error instanceof Error ? error.message : String(error)}`);
  }
}
