import { createHash } from "node:crypto";
import { chmodSync, lstatSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { c4MeasurementIdentity, ConfigError, isSuccessfulModelEvent, modelIdentityMatches, validateC1Event, validateC4Run, type C1Event, type C4Run } from "@aob/contracts";
import { costUsd, type PriceRates } from "./aggregate.js";
import { loadResultsTree } from "./from-results.js";
import { parseActivityExportCsv } from "./activity.js";
import { priceBookPath } from "./price-books.js";

type PricingFile = { id: string; models: Record<string, PriceRates>; canonical_model: string | null };

export type ActivityLocalAccounting = {
  run_count: number;
  retry_run_count: number;
  usage_event_count: number;
  interrupted_spend_usd: number;
  replacement_spend_usd: number;
  spend_usd: number;
  runner_spend_usd: number | null;
  replacement_runner_spend_usd: number | null;
};

export type ActivityCrosscheckSummary = {
  version: 1;
  model: string;
  price_book: string;
  window: { start_iso: string; end_iso: string; operator_supplied: true } | null;
  binding: ActivityBinding;
  local: ActivityLocalAccounting;
  activity_export: { sha256: string; row_count: number; matching_row_count: number; spend_usd: number };
  delta_usd: number;
  tolerance_usd: number;
  within_tolerance: boolean;
};

export type ActivityBinding = {
  run_ids_sha256: string;
  results_sha256: string;
  state_sha256: string | null;
  replacement_state_sha256: string | null;
};

export type ActivityWindow = { startIso: string; endIso: string };
export type ActivityBounds = { start_ms: number; end_ms: number };

function invalid(message: string): never {
  throw new ConfigError(`Activity Export cross-check failed: ${message}`);
}

function readPricing(priceBookId: string): PricingFile {
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(priceBookPath(priceBookId), "utf8"));
  } catch (error) {
    invalid(`price book ${priceBookId} is unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) invalid("price book must contain an object");
  const value = raw as Record<string, unknown>;
  if (typeof value.id !== "string" || value.id.length === 0 || typeof value.models !== "object" || value.models === null || Array.isArray(value.models)) {
    invalid("price book has an invalid shape");
  }
  const models: Record<string, PriceRates> = {};
  for (const [model, rawRates] of Object.entries(value.models as Record<string, unknown>)) {
    if (typeof rawRates !== "object" || rawRates === null || Array.isArray(rawRates)) invalid(`price book rates for ${model} are invalid`);
    const rates = rawRates as Record<string, unknown>;
    if (!["input", "cached_input", "output"].every((key) => typeof rates[key] === "number" && Number.isFinite(rates[key]) && (rates[key] as number) >= 0)) {
      invalid(`price book rates for ${model} are invalid`);
    }
    models[model] = { input: rates.input as number, cached_input: rates.cached_input as number, output: rates.output as number };
  }
  const canonical = value.canonical_model;
  if (canonical !== undefined && (typeof canonical !== "string" || canonical.trim() === "")) invalid("price book canonical_model is invalid");
  return { id: value.id, models, canonical_model: typeof canonical === "string" ? canonical : null };
}

function sha256(data: string | Buffer): string {
  return `sha256:${createHash("sha256").update(data).digest("hex")}`;
}

function validateWindow(window: ActivityWindow | undefined): ActivityCrosscheckSummary["window"] {
  if (window === undefined) return null;
  const iso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  if (!iso.test(window.startIso) || !iso.test(window.endIso)) invalid("window must use millisecond ISO-8601 UTC timestamps");
  const start = Date.parse(window.startIso);
  const end = Date.parse(window.endIso);
  if (!Number.isFinite(start) || !Number.isFinite(end) || new Date(start).toISOString() !== window.startIso || new Date(end).toISOString() !== window.endIso) {
    invalid("window must use valid calendar dates in millisecond ISO-8601 UTC format");
  }
  if (start >= end) invalid("window must have a start before its end");
  return { start_iso: window.startIso, end_iso: window.endIso, operator_supplied: true };
}

function stateDigest(statePath: string | undefined): string | null {
  if (statePath === undefined) return null;
  let text: string;
  try {
    const info = lstatSync(statePath);
    if (info.isSymbolicLink() || !info.isFile()) invalid("runner state is not a regular file");
    text = readFileSync(statePath, "utf8");
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    invalid(`runner state is unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
  try {
    JSON.parse(text);
  } catch (error) {
    invalid(`runner state is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  return sha256(text);
}

type ActivityRole = "current" | "retry" | "replacement" | "replacement-retry";
type ActivityRecord = { role: ActivityRole; path: string; run: C4Run; events: C1Event[] };

function portableBindingRun(run: C4Run): C4Run {
  return {
    ...run,
    events_file: "events.jsonl",
    adapter_result: {
      ...run.adapter_result,
      artifacts: {
        ...run.adapter_result.artifacts,
        stdoutPath: "stdout.log",
        stderrPath: "stderr.log",
        ...(run.adapter_result.artifacts.toolLogPath === undefined ? {} : { toolLogPath: "tool.log" }),
      },
    },
    verification: { ...run.verification, logPath: "verify.log" },
  };
}

function bindingFromRecords(records: ActivityRecord[], statePath?: string, replacementStatePath?: string): ActivityBinding {
  const ordered = records.sort((left, right) => {
    const leftKey = JSON.stringify([left.role, left.path, left.run.run_id]);
    const rightKey = JSON.stringify([right.role, right.path, right.run.run_id]);
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  });
  const ids = ordered.map(({ role, path, run }) => ({ role, path, run_id: run.run_id }));
  const portable = ordered.map((record) => ({ ...record, run: portableBindingRun(record.run) }));
  return {
    run_ids_sha256: sha256(JSON.stringify(ids)),
    results_sha256: sha256(JSON.stringify(portable)),
    state_sha256: stateDigest(statePath),
    replacement_state_sha256: stateDigest(replacementStatePath),
  };
}

function replacementSelection(replacementResultsDir: string | undefined, replacementRunIds: string[] | undefined): { directory: string; ids: Set<string> } | null {
  if ((replacementResultsDir === undefined) !== (replacementRunIds === undefined)) invalid("replacement results and replacement run IDs must be supplied together");
  if (replacementResultsDir === undefined || replacementRunIds === undefined) return null;
  if (replacementRunIds.length === 0 || replacementRunIds.some((id) => id.trim() === "") || new Set(replacementRunIds).size !== replacementRunIds.length) {
    invalid("replacement run IDs must be a nonempty unique list");
  }
  return { directory: resolve(replacementResultsDir), ids: new Set(replacementRunIds) };
}

function activityRecords(resultsDir: string, replacementResultsDir?: string, replacementRunIds?: string[]): ActivityRecord[] {
  const root = resolve(resultsDir);
  const cells = loadResultsTree(root);
  if (cells.length === 0) invalid("results tree contains no runs");
  const currentRuns = new Map(cells.map((cell) => [cell.run.run_id, cell.run]));
  const records: ActivityRecord[] = [
    ...cells.map((cell) => ({ role: "current" as const, path: relative(root, cell.runPath), run: cell.run, events: cell.events })),
    ...retryRuns(root, currentRuns).map((retry) => ({ role: "retry" as const, path: relative(root, retry.path), run: retry.run, events: retry.events })),
  ];
  const selection = replacementSelection(replacementResultsDir, replacementRunIds);
  if (selection !== null) {
    const rerunCells = loadResultsTree(selection.directory);
    if (rerunCells.length !== selection.ids.size || rerunCells.some((cell) => !selection.ids.has(cell.run.run_id))) {
      invalid("rerun results must contain exactly the selected replacement run IDs");
    }
    const rerunById = new Map(rerunCells.map((cell) => [cell.run.run_id, cell]));
    const selected = [...selection.ids].map((id) => {
      const cell = rerunById.get(id);
      if (cell === undefined) invalid(`replacement run is not present in rerun results: ${id}`);
      if (cell.run.outcome !== "completed") invalid(`replacement run is not completed: ${id}`);
      if (![...currentRuns.values()].some((current) => c4MeasurementIdentity(current) === c4MeasurementIdentity(cell.run))) {
        invalid(`replacement run does not match a current cell: ${id}`);
      }
      if (currentRuns.has(id)) invalid(`replacement run_id collides with a current result: ${id}`);
      return cell;
    });
    records.push(...selected.map((cell) => ({ role: "replacement" as const, path: relative(selection.directory, cell.runPath), run: cell.run, events: cell.events })));
    const rerunRuns = new Map(rerunCells.map((cell) => [cell.run.run_id, cell.run]));
    records.push(...retryRuns(selection.directory, rerunRuns)
      .filter((retry) => selection.ids.has(retry.run.run_id))
      .map((retry) => ({ role: "replacement-retry" as const, path: relative(selection.directory, retry.path), run: retry.run, events: retry.events })));
  }
  return records.sort((left, right) => {
    const leftKey = JSON.stringify([left.role, left.path, left.run.run_id]);
    const rightKey = JSON.stringify([right.role, right.path, right.run.run_id]);
    return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
  });
}

/** Hash the exact current, retry, and selected replacement C4/C1 records used by accounting. */
export function activityBinding(resultsDir: string, statePath?: string, replacementResultsDir?: string, replacementRunIds?: string[], replacementStatePath?: string): ActivityBinding {
  const selection = replacementSelection(replacementResultsDir, replacementRunIds);
  if (selection !== null && (statePath === undefined || replacementStatePath === undefined)) invalid("replacement results require original and replacement runner state");
  if (selection === null && replacementStatePath !== undefined) invalid("replacement runner state requires replacement results and run IDs");
  const records = activityRecords(resultsDir, replacementResultsDir, replacementRunIds);
  return bindingFromRecords(records, statePath, replacementStatePath);
}

function archiveRetryRecords(root: string, role: "retry" | "replacement-retry"): ActivityRecord[] {
  let info;
  try {
    info = lstatSync(root);
  } catch (error) {
    if (isMissingPath(error)) return [];
    invalid(`archive retry provenance is unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (info.isSymbolicLink() || !info.isDirectory()) invalid("archive retry provenance is not a regular directory");
  const runPaths: string[] = [];
  const visit = (directory: string): void => {
    for (const name of readdirSync(directory)) {
      const path = join(directory, name);
      const child = lstatSync(path);
      if (child.isSymbolicLink()) invalid(`archive retry provenance contains a symlink: ${path}`);
      if (child.isDirectory()) visit(path);
      else if (child.isFile() && name === "run.json") runPaths.push(path);
    }
  };
  visit(root);
  return runPaths.map((runPath) => {
    const relativePath = relative(root, runPath).split(sep).join("/");
    const parts = relativePath.split("/");
    if (parts.length < 3 || !/^attempt-[0-9]+$/.test(parts.at(-2) ?? "")) invalid(`archive retry path is invalid: ${relativePath}`);
    parts.splice(parts.length - 2, 0, ".attempts");
    let run: C4Run;
    try {
      run = validateC4Run(JSON.parse(readFileSync(runPath, "utf8")));
    } catch (error) {
      invalid(`archive retry C4 is invalid: ${error instanceof Error ? error.message : String(error)}`);
    }
    return { role, path: parts.join("/"), run, events: readEvents(join(dirname(runPath), "events.jsonl"), run.run_id) };
  });
}

/** Reconstruct the Activity binding from the exact sanitized evidence in a frozen package. */
export function archivedActivityBinding(packageRoot: string): ActivityBinding {
  const root = resolve(packageRoot);
  const resultsRoot = join(root, "results");
  const provenanceRoot = join(root, "provenance");
  const published = loadResultsTree(resultsRoot);
  const records: ActivityRecord[] = [];
  const mappingPath = join(provenanceRoot, "resolved-replacements.json");
  let replacements = new Map<string, string>();
  try {
    const mapping = JSON.parse(readFileSync(mappingPath, "utf8")) as { version?: unknown; replacements?: unknown };
    if (mapping.version !== 1 || !Array.isArray(mapping.replacements)) invalid("archive replacement mapping is malformed");
    replacements = new Map(mapping.replacements.map((entry) => {
      if (typeof entry !== "object" || entry === null || Array.isArray(entry)) invalid("archive replacement mapping entry is malformed");
      const value = entry as Record<string, unknown>;
      if (typeof value.original_run_id !== "string" || typeof value.replacement_run_id !== "string") invalid("archive replacement mapping entry is malformed");
      return [value.original_run_id, value.replacement_run_id];
    }));
  } catch (error) {
    if (!isMissingPath(error)) {
      if (error instanceof ConfigError) throw error;
      invalid(`archive replacement mapping is unavailable: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  const originals = replacements.size === 0 ? [] : loadResultsTree(join(provenanceRoot, "anomalies"));
  const originalByReplacement = new Map([...replacements].map(([originalId, replacementId]) => [replacementId, originals.find((cell) => cell.run.run_id === originalId)]));
  for (const cell of published) {
    const original = originalByReplacement.get(cell.run.run_id);
    if (originalByReplacement.has(cell.run.run_id) && original === undefined) invalid(`archive has no original for replacement ${cell.run.run_id}`);
    const source = original ?? cell;
    records.push({ role: "current", path: relative(resultsRoot, cell.runPath).split(sep).join("/"), run: source.run, events: source.events });
  }
  records.push(...archiveRetryRecords(join(provenanceRoot, "retries"), "retry"));
  if (replacements.size > 0) {
    const rerunsRoot = join(provenanceRoot, "reruns");
    const reruns = loadResultsTree(rerunsRoot);
    const replacementIds = new Set(replacements.values());
    if (reruns.length !== replacementIds.size || reruns.some((cell) => !replacementIds.has(cell.run.run_id))) invalid("archive reruns do not match replacement mapping");
    records.push(...reruns.map((cell) => ({ role: "replacement" as const, path: relative(rerunsRoot, cell.runPath).split(sep).join("/"), run: cell.run, events: cell.events })));
    records.push(...archiveRetryRecords(join(provenanceRoot, "rerun-state", "retries"), "replacement-retry"));
  }
  return bindingFromRecords(
    records,
    join(provenanceRoot, "runner-state.json"),
    replacements.size === 0 ? undefined : join(provenanceRoot, "rerun-state", "runner-state.json"),
  );
}

/** Return the wall-clock envelope of every current, retry, and selected replacement adapter interval. */
export function activityBounds(resultsDir: string, replacementResultsDir?: string, replacementRunIds?: string[]): ActivityBounds {
  const records = activityRecords(resultsDir, replacementResultsDir, replacementRunIds);
  let startMs = Number.POSITIVE_INFINITY;
  let endMs = Number.NEGATIVE_INFINITY;
  for (const record of records) {
    const anchorMs = Date.parse(record.run.anchors.adapter.wall_clock_iso);
    const zero = record.run.anchors.adapter.monotonic_zero;
    const start = anchorMs + record.run.adapter_result.tStart - zero;
    const end = anchorMs + record.run.adapter_result.tEnd - zero;
    if (!Number.isFinite(anchorMs) || !Number.isFinite(zero) || !Number.isFinite(start) || !Number.isFinite(end) || end < start) {
      invalid(`adapter interval is invalid for ${record.role} ${record.run.run_id}`);
    }
    startMs = Math.min(startMs, start);
    endMs = Math.max(endMs, end);
  }
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) invalid("results contain no adapter intervals");
  return { start_ms: startMs, end_ms: endMs };
}

function isMissingPath(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

function readEvents(path: string, runId: string): C1Event[] {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    invalid(`C1 events are unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
  const events = text.split("\n").filter(Boolean).map((line, index) => {
    try {
      return validateC1Event(JSON.parse(line));
    } catch (error) {
      invalid(`C1 event ${path}:${index + 1} is invalid: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  if (events.some((event) => event.run_id !== runId)) invalid(`C1 event run_id does not match ${runId}`);
  const sequences = events.map((event) => event.seq).sort((left, right) => left - right);
  if (sequences.some((seq, index) => seq !== index)) invalid(`C1 event sequence has a gap or duplicate: ${path}`);
  return events;
}

function retryRuns(resultsDir: string, currentRuns: Map<string, C4Run>): Array<{ run: C4Run; events: C1Event[]; path: string }> {
  const found: Array<{ run: C4Run; events: C1Event[]; path: string }> = [];
  const visit = (directory: string): void => {
    for (const name of readdirSync(directory)) {
      const path = join(directory, name);
      const info = lstatSync(path);
      if (info.isSymbolicLink()) invalid(`results tree contains a symlink: ${path}`);
      if (!info.isDirectory()) continue;
      if (name === "workspace") continue;
      if (name !== ".attempts") {
        visit(path);
        continue;
      }
      for (const attemptName of readdirSync(path)) {
        const attempt = join(path, attemptName);
        const attemptInfo = lstatSync(attempt);
        if (attemptInfo.isSymbolicLink() || !attemptInfo.isDirectory() || !/^attempt-[0-9]+$/.test(attemptName)) invalid(`invalid retry directory: ${attempt}`);
        const runPath = join(attempt, "run.json");
        let run: C4Run;
        try {
          run = validateC4Run(JSON.parse(readFileSync(runPath, "utf8")));
        } catch (error) {
          invalid(`retry C4 artifact is invalid: ${runPath}: ${error instanceof Error ? error.message : String(error)}`);
        }
        const current = currentRuns.get(run.run_id);
        if (current === undefined || c4MeasurementIdentity(current) !== c4MeasurementIdentity(run)) {
          invalid(`retry C4 artifact does not match a current cell: ${runPath}`);
        }
        const eventsPath = resolve(attempt, run.events_file);
        const eventRel = relative(attempt, eventsPath);
        if (eventRel === "" || eventRel === ".." || eventRel.startsWith(`..${sep}`) || isAbsolute(eventRel)) invalid(`retry events escape attempt directory: ${runPath}`);
        found.push({ run, events: readEvents(eventsPath, run.run_id), path: runPath });
      }
    }
  };
  visit(resolve(resultsDir));
  return found;
}

function runnerAccounting(statePath: string): { spentUsd: number; interruptedSpendUsd: number; cellIds: Set<string> } {
  let value: unknown;
  try {
    const info = lstatSync(statePath);
    if (info.isSymbolicLink() || !info.isFile()) invalid("runner state is not a regular file");
    value = JSON.parse(readFileSync(statePath, "utf8"));
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    invalid(`runner state is unavailable or invalid: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) invalid("runner state has an invalid shape");
  const state = value as Record<string, unknown>;
  if (typeof state.spentUsd !== "number" || !Number.isFinite(state.spentUsd) || state.spentUsd < 0 || !Array.isArray(state.cells)) invalid("runner state has an invalid spend shape");
  let interrupted = 0;
  const cellIds = new Set<string>();
  for (const cell of state.cells) {
    if (typeof cell !== "object" || cell === null || Array.isArray(cell)) invalid("runner state has an invalid cell");
    const record = cell as Record<string, unknown>;
    if (typeof record.id !== "string" || record.id.length === 0 || cellIds.has(record.id)) invalid("runner state contains an invalid or duplicate cell id");
    cellIds.add(record.id);
    const spend = record.interruptedSpendUsd;
    if (spend === null) invalid("runner state contains unavailable interrupted spend");
    if (spend !== undefined) {
      if (typeof spend !== "number" || !Number.isFinite(spend) || spend < 0) invalid("runner state contains invalid interrupted spend");
      interrupted += spend;
    }
  }
  return { spentUsd: state.spentUsd, interruptedSpendUsd: interrupted, cellIds };
}

function sameIds(actual: Set<string>, expected: Set<string>): boolean {
  return actual.size === expected.size && [...actual].every((id) => expected.has(id));
}

function localSpend(resultsDir: string, model: string, priceBook: string, rates: PriceRates, statePath?: string, replacementResultsDir?: string, replacementRunIds?: string[], replacementStatePath?: string): ActivityLocalAccounting {
  const selection = replacementSelection(replacementResultsDir, replacementRunIds);
  if (selection !== null && (statePath === undefined || replacementStatePath === undefined)) invalid("replacement results require original and replacement runner state");
  if (selection === null && replacementStatePath !== undefined) invalid("replacement runner state requires replacement results and run IDs");
  const records = activityRecords(resultsDir, replacementResultsDir, replacementRunIds);
  let baseSpendUsd = 0;
  let replacementSpendUsd = 0;
  let usageEventCount = 0;
  for (const record of records) {
    if (record.run.condition !== "pinned") invalid(`results contain non-pinned run ${record.run.run_id}`);
    if (record.run.model !== model) invalid(`run ${record.run.run_id} uses model ${record.run.model}, expected ${model}`);
    if (record.run.price_book !== priceBook) invalid(`run ${record.run.run_id} uses price book ${record.run.price_book}, expected ${priceBook}`);
    let spend = 0;
    let usageEvents = 0;
    for (const event of record.events.filter((candidate): candidate is C1Event => isSuccessfulModelEvent(candidate))) {
      if (!modelIdentityMatches(event, model)) invalid(`successful ${record.role} event ${record.run.run_id}/${event.seq} identifies the wrong model`);
      if (event.usage === null) invalid(`successful ${record.role} event ${record.run.run_id}/${event.seq} has unavailable usage`);
      const amount = costUsd(event.usage, rates);
      if (amount === null || !Number.isFinite(amount)) invalid(`successful ${record.role} event ${record.run.run_id}/${event.seq} cannot be priced`);
      spend += amount;
      usageEvents++;
    }
    if (record.run.spend_usd_estimate === null) invalid(`${record.role} C4 spend availability disagrees with C1 pricing for ${record.run.run_id}`);
    if (record.run.spend_usd_estimate !== null && Math.abs(spend - record.run.spend_usd_estimate) > Math.max(0.000001, Math.abs(spend) * 0.000001)) invalid(`${record.role} C4 spend disagrees with C1 pricing for ${record.run.run_id}`);
    if (record.role === "replacement" || record.role === "replacement-retry") replacementSpendUsd += spend;
    else baseSpendUsd += spend;
    usageEventCount += usageEvents;
  }
  const accounting = statePath === undefined ? null : runnerAccounting(statePath);
  const originalIds = new Set(records.filter((record) => record.role === "current").map((record) => record.run.run_id));
  if (accounting !== null && !sameIds(accounting.cellIds, originalIds)) invalid("runner state cells do not match original results");
  const replacementAccounting = replacementStatePath === undefined ? null : runnerAccounting(replacementStatePath);
  const replacementIds = new Set(records.filter((record) => record.role === "replacement").map((record) => record.run.run_id));
  if (replacementAccounting !== null && !sameIds(replacementAccounting.cellIds, replacementIds)) invalid("replacement runner state cells do not match selected replacement results");
  const originalInterrupted = accounting?.interruptedSpendUsd ?? 0;
  const replacementInterrupted = replacementAccounting?.interruptedSpendUsd ?? 0;
  const originalSpendTotal = baseSpendUsd + originalInterrupted;
  if (accounting !== null && Math.abs(originalSpendTotal - accounting.spentUsd) > Math.max(0.000001, Math.abs(accounting.spentUsd) * 0.000001)) invalid("runner state spend does not reconcile with priced original results and interrupted spend");
  const replacementSpendTotal = replacementSpendUsd + replacementInterrupted;
  if (replacementAccounting !== null && Math.abs(replacementSpendTotal - replacementAccounting.spentUsd) > Math.max(0.000001, Math.abs(replacementAccounting.spentUsd) * 0.000001)) invalid("replacement runner state spend does not reconcile with priced replacement results and interrupted spend");
  const spendTotal = originalSpendTotal + replacementSpendTotal;
  return { run_count: records.length, retry_run_count: records.filter((record) => record.role === "retry" || record.role === "replacement-retry").length, usage_event_count: usageEventCount, interrupted_spend_usd: originalInterrupted + replacementInterrupted, replacement_spend_usd: replacementSpendTotal, spend_usd: spendTotal, runner_spend_usd: accounting?.spentUsd ?? null, replacement_runner_spend_usd: replacementAccounting?.spentUsd ?? null };
}

/** Recompute the complete local side of the Activity Export reconciliation. */
export function activityLocalAccounting(args: { resultsDir: string; statePath?: string; model: string; priceBook: string; replacementResultsDir?: string; replacementRunIds?: string[]; replacementStatePath?: string }): ActivityLocalAccounting {
  const pricing = readPricing(args.priceBook);
  if (pricing.id !== args.priceBook) invalid(`price book ${args.priceBook} does not declare that id`);
  const rates = pricing.models[args.model];
  if (rates === undefined) invalid(`price book ${args.priceBook} has no rates for ${args.model}`);
  return localSpend(args.resultsDir, args.model, args.priceBook, rates, args.statePath, args.replacementResultsDir, args.replacementRunIds, args.replacementStatePath);
}

export function runActivityCrosscheck(args: { resultsDir: string; statePath?: string; exportCsv: string; output: string; model: string; priceBook: string; window?: ActivityWindow; replacementResultsDir?: string; replacementRunIds?: string[]; replacementStatePath?: string }): ActivityCrosscheckSummary {
  if (args.model.trim() === "" || args.priceBook.trim() === "") invalid("model and price book must not be empty");
  const window = validateWindow(args.window);
  let exportBytes: Buffer;
  let exportText: string;
  try {
    const info = lstatSync(args.exportCsv);
    if (info.isSymbolicLink() || !info.isFile()) invalid("Activity Export path is not a regular file");
    exportBytes = readFileSync(args.exportCsv);
    exportText = new TextDecoder("utf-8", { fatal: true }).decode(exportBytes);
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    invalid(`Activity Export is unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
  const pricing = readPricing(args.priceBook);
  if (pricing.id !== args.priceBook) invalid(`price book ${args.priceBook} does not declare that id`);
  const aliases = pricing.canonical_model !== null && pricing.canonical_model !== args.model ? [pricing.canonical_model] : [];
  const exportSummary = parseActivityExportCsv(exportText, args.model, aliases);
  if (exportSummary.matchingRowCount === 0) invalid(`Activity Export contains no rows matching model ${args.model}`);
  const local = activityLocalAccounting(args);
  const deltaUsd = exportSummary.spendUsd - local.spend_usd;
  const toleranceUsd = Math.max(0.01, Math.abs(local.spend_usd) * 0.01);
  const summary: ActivityCrosscheckSummary = {
    version: 1,
    model: args.model,
    price_book: args.priceBook,
    window,
    binding: activityBinding(args.resultsDir, args.statePath, args.replacementResultsDir, args.replacementRunIds, args.replacementStatePath),
    local,
    activity_export: { sha256: sha256(exportBytes), row_count: exportSummary.rowCount, matching_row_count: exportSummary.matchingRowCount, spend_usd: exportSummary.spendUsd },
    delta_usd: deltaUsd,
    tolerance_usd: toleranceUsd,
    within_tolerance: Math.abs(deltaUsd) <= toleranceUsd,
  };
  const outputDir = dirname(args.output);
  mkdirSync(outputDir, { recursive: true });
  try {
    if (lstatSync(args.output).isSymbolicLink()) invalid("summary output must not be a symlink");
  } catch (error) {
    if (!isMissingPath(error)) invalid(`summary output is unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
  writeFileSync(args.output, `${JSON.stringify(summary, null, 2)}\n`, { mode: 0o600 });
  chmodSync(args.output, 0o600);
  return summary;
}
