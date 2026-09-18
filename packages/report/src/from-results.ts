import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { ConfigError, isPreInferenceRejection, isModelRequestAttempt, isSuccessfulModelEvent, validateC1Event, validateC4Run, type C1Event, type C4Run } from "@aob/contracts";
import { aggregateMedians, aggregateTimingMeans, costBarSvg, costUsd, renderHtml, stackedBarSvg, tokenFloorUsd, type PriceRates } from "./aggregate.js";
import { deriveFromC1, iqr, median, type DerivedRun, type ToolVisibility } from "./derive.js";
import { requestSeries, summarizeRequests } from "./request-analysis.js";
import { renderHeadlineMarkdown, renderTaskMarkdown, type HeadlineRow, type TaskDetailRow } from "./render.js";
import { priceBookPath } from "./price-books.js";
import { analyzeAttempts, type AnalysisAttempt, type AnalysisExport } from "./analysis.js";
import { renderAnalysisHtml, renderAnalysisMarkdown } from "./analysis-render.js";

function walkRunJson(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (lstatSync(p).isSymbolicLink()) throw new ConfigError(`results tree contains a symlink: ${p}`);
    // A measured cell keeps the adapter's private working tree beside its
    // report artifacts. Tool homes may contain symlinks and other files that
    // are not part of the results tree; never descend into that workspace.
    if ((name === "workspace" || name === ".attempts") && statSync(p).isDirectory()) continue;
    if (statSync(p).isDirectory()) walkRunJson(p, acc);
    else if (name === "run.json") acc.push(p);
  }
  return acc;
}

function requireResultsDirectory(resultsDir: string): string {
  const absolute = resolve(resultsDir);
  try {
    const info = lstatSync(absolute);
    if (info.isSymbolicLink() || !info.isDirectory()) throw new ConfigError(`results tree is not a regular directory: ${absolute}`);
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(`results tree is unavailable: ${absolute}`);
  }
  return absolute;
}

function readJson(path: string, label: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new ConfigError(`${label} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function cellEventsPath(sourceCell: string, eventsFile: string): string {
  if (eventsFile.length === 0 || eventsFile.includes("\0") || eventsFile.startsWith("/")) {
    throw new ConfigError(`events file must be a relative sibling of the result cell: ${eventsFile}`);
  }
  const cellRoot = resolve(sourceCell);
  const candidate = resolve(cellRoot, eventsFile);
  const rel = relative(cellRoot, candidate);
  if (rel === "" || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    throw new ConfigError(`events file escapes result cell: ${eventsFile}`);
  }
  try {
    const info = lstatSync(candidate);
    if (info.isSymbolicLink() || !info.isFile()) throw new ConfigError(`events file is not a regular file: ${eventsFile}`);
    if (!insideReal(candidate, cellRoot)) throw new ConfigError(`events file escapes result cell: ${eventsFile}`);
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(`events file is unavailable: ${eventsFile}`);
  }
  return candidate;
}

function insideReal(path: string, root: string): boolean {
  const rel = relative(realpathSync(root), realpathSync(path));
  return rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

function validateEventSequence(events: C1Event[], runId: string): void {
  const sequences = [...events].map((event) => event.seq).sort((a, b) => a - b);
  for (let index = 0; index < sequences.length; index++) {
    if (sequences[index] !== index) {
      throw new ConfigError(`C1 event sequence has a gap or duplicate for C4 run ${runId}`);
    }
  }
}

export type LoadedCell = {
  runPath: string;
  run: C4Run;
  events: C1Event[];
  derived: DerivedRun;
  visibility: ToolVisibility;
};

export type ReviewAnomaly = { runId: string; reason: string };

export function loadResultsTree(resultsDir: string): LoadedCell[] {
  const cells: LoadedCell[] = [];
  const runIds = new Set<string>();
  const identities = new Set<string>();
  const root = requireResultsDirectory(resultsDir);
  for (const runPath of walkRunJson(root)) {
    const run = validateC4Run(readJson(runPath, `C4 run ${runPath}`));
    if (runIds.has(run.run_id)) throw new ConfigError(`duplicate C4 run_id in results tree: ${run.run_id}`);
    const identity = [run.tool, run.task_id, run.task_repository ?? "", run.condition, run.rep].join("\0");
    if (identities.has(identity)) throw new ConfigError(`duplicate result cell identity in results tree: ${identity.replaceAll("\0", "/")}`);
    runIds.add(run.run_id);
    identities.add(identity);
    const eventsPath = cellEventsPath(dirname(runPath), run.events_file);
    let eventText: string;
    try {
      eventText = readFileSync(eventsPath, "utf8");
    } catch (error) {
      throw new ConfigError(`C1 events file is unavailable: ${eventsPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
    const events = eventText.split("\n").filter((l) => l.length > 0).map((line, index) => {
      let value: unknown;
      try {
        value = JSON.parse(line);
      } catch (error) {
        throw new ConfigError(`C1 event ${eventsPath}:${index + 1} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
      }
      return validateC1Event(value);
    });
    if (events.some((event) => event.run_id !== run.run_id)) {
      throw new ConfigError(`C1 event run_id does not match C4 run ${run.run_id}`);
    }
    const measuredEvents = events.filter((event) => isSuccessfulModelEvent(event));
    if (run.outcome === "completed" && measuredEvents.length === 0) {
      throw new ConfigError(`completed C4 run ${run.run_id} has no model-request evidence`);
    }
    if (run.tool_visibility === "full" && run.adapter_result.toolEvents === undefined) {
      throw new ConfigError(`full-visibility C4 run ${run.run_id} has no tool instrumentation`);
    }
    validateEventSequence(events, run.run_id);
    const visibility: ToolVisibility = run.tool_visibility;
    const derived = deriveFromC1(
      { tStart: run.adapter_result.tStart, tEnd: run.adapter_result.tEnd },
      events,
      run.adapter_result.toolEvents ?? [],
      visibility,
      run.anchors,
    );
    cells.push({ runPath, run, events, derived, visibility });
  }
  return cells;
}

export function cellsForTiming(cells: LoadedCell[]): LoadedCell[] {
  return cells.filter((c) => c.run.outcome === "completed" && !c.derived.unreconciled);
}

type PricingFile = { id: string; models: Record<string, PriceRates>; allowUnpricedModels?: boolean };

function loadPricing(priceBookId: string): PricingFile {
  let path: string;
  try {
    path = priceBookPath(priceBookId);
  } catch (error) {
    throw new ConfigError(error instanceof Error ? error.message : String(error));
  }
  const raw = readJson(path, `price book ${priceBookId}`);
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    throw new ConfigError("price book must contain an object");
  }
  const record = raw as Record<string, unknown>;
  if (typeof record.id !== "string" || record.id.length === 0 ||
    typeof record.models !== "object" || record.models === null || Array.isArray(record.models)) {
    throw new ConfigError("price book has an invalid shape");
  }
  const models: Record<string, PriceRates> = {};
  for (const [model, value] of Object.entries(record.models as Record<string, unknown>)) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new ConfigError(`price book has invalid rates for model ${model}`);
    }
    const rates = value as Record<string, unknown>;
    if (!["input", "cached_input", "output"].every((key) =>
      typeof rates[key] === "number" && Number.isFinite(rates[key]) && (rates[key] as number) >= 0)) {
      throw new ConfigError(`price book has invalid rates for model ${model}`);
    }
    models[model] = {
      input: rates.input as number,
      cached_input: rates.cached_input as number,
      output: rates.output as number,
    };
  }
  return { id: record.id, models };
}

function headingValue(value: string | undefined): string {
  return (value ?? "").replace(/[\r\n]+/g, " ").replace(/[|]/g, "\\|");
}

/**
 * Load each dated price book at most once. A results tree may legitimately
 * contain runs from more than one book; each run is priced with the book it
 * actually recorded, never with a single globally-loaded one.
 */
function priceBookLoader(allowUnpricedModels = false): (id: string) => PricingFile {
  const cache = new Map<string, PricingFile>();
  return (id) => {
    const cached = cache.get(id);
    if (cached !== undefined) return cached;
    const loaded = { ...loadPricing(id), allowUnpricedModels };
    cache.set(id, loaded);
    return loaded;
  };
}

function ratesFor(run: C4Run, pricing: PricingFile): PriceRates | undefined {
  if (run.price_book !== pricing.id) throw new ConfigError(`price book ${run.price_book} does not declare that id`);
  const rates = pricing.models[run.model];
  if (rates === undefined && !pricing.allowUnpricedModels) throw new ConfigError(`no pricing rates for model ${run.model} in ${run.price_book}`);
  return rates;
}

function cellCost(c: LoadedCell, loadPriceBook: (id: string) => PricingFile): { cost: number | null; floor: number | null; unavailable?: AnalysisAttempt["cost_unavailable"] } {
  // Match S5 total-spend availability: a successful-request subtotal cannot
  // establish the total after an ambiguous upstream failure.
  if (c.events.some((event) => isModelRequestAttempt(event) &&
      !isSuccessfulModelEvent(event) && !isPreInferenceRejection(event) && event.error?.kind !== "proxy_refused")) {
    return { cost: null, floor: null, unavailable: "incomplete-accounting" };
  }
  const measuredEvents = c.events.filter((candidate) => isSuccessfulModelEvent(candidate));
  // The default condition deliberately records an empty C4 model because the
  // provider-selected model is not pinned. Never invent a price for it: a
  // request-free fixture is zero, while observed usage remains unavailable.
  if (c.run.model === "") return measuredEvents.length === 0 ? { cost: 0, floor: 0 } : { cost: null, floor: null, unavailable: "unpriced-model" };
  const rates = ratesFor(c.run, loadPriceBook(c.run.price_book));
  if (rates === undefined) return { cost: null, floor: null, unavailable: "unpriced-model" };
  let cost = 0;
  let floor = 0;
  for (const event of measuredEvents) {
    const eventCost = costUsd(event.usage, rates);
    const eventFloor = tokenFloorUsd(event.usage === null ? null : { input: event.usage.input, output: event.usage.output }, rates);
    if (eventCost === null || eventFloor === null) return { cost: null, floor: null, unavailable: "incomplete-usage" };
    cost += eventCost;
    floor += eventFloor;
  }
  return { cost, floor };
}

function medianNullable(values: Array<number | null>): number | null {
  if (values.length === 0 || values.some((value) => value === null)) return null;
  return median(values as number[]);
}

type UsageSummary = {
  turns: number;
  inputTokens: number | null;
  outputTokens: number | null;
  cachedPercent: number | null;
};

function usageSummary(cell: LoadedCell): UsageSummary {
  let inputTokens = 0;
  let outputTokens = 0;
  let cachedInput = 0;
  let complete = true;
  const modelAttempts = cell.events.filter((event) => isModelRequestAttempt(event));
  const measuredEvents = modelAttempts.filter((event) => isSuccessfulModelEvent(event));
  for (const event of measuredEvents) {
    if (event.usage === null) {
      complete = false;
      continue;
    }
    inputTokens += event.usage.input;
    outputTokens += event.usage.output;
    cachedInput += event.usage.cached_input;
  }
  return {
    // Turns are API round trips, including failed attempts. Usage and cost
    // remain successful-only because failed responses have no trustworthy
    // billable token accounting.
    turns: modelAttempts.length,
    inputTokens: complete && measuredEvents.length > 0 ? inputTokens : null,
    outputTokens: complete && measuredEvents.length > 0 ? outputTokens : null,
    cachedPercent: complete && inputTokens > 0 ? (cachedInput / inputTokens) * 100 : complete && measuredEvents.length > 0 ? 0 : null,
  };
}

function headlineRow(cells: LoadedCell[], loadPriceBook: (id: string) => PricingFile, rawPath: string): HeadlineRow {
  const visibility = new Set(cells.map((cell) => cell.visibility));
  if (visibility.size !== 1) throw new ConfigError(`visibility differs across repetitions for ${cells[0]?.run.tool ?? "unknown tool"}`);
  const versions = new Set(cells.map((cell) => cell.run.tool_version));
  if (versions.size !== 1) throw new ConfigError(`tool version differs across repetitions for ${cells[0]?.run.tool ?? "unknown tool"}`);
  const taskImages = new Map<string, { agent: string; verifier: string | null | undefined }>();
  for (const cell of cells) {
    const previous = taskImages.get(cell.run.task_id);
    const agent = cell.run.container.image_digest;
    const verifier = cell.run.container.verifier_image_digest;
    if (previous !== undefined && previous.agent !== agent) {
      throw new ConfigError(`image digest differs across repetitions for ${cell.run.tool}/${cell.run.task_id}`);
    }
    if (previous !== undefined && previous.verifier !== verifier) {
      throw new ConfigError(`verifier image digest differs across repetitions for ${cell.run.tool}/${cell.run.task_id}`);
    }
    taskImages.set(cell.run.task_id, { agent, verifier });
  }
  const timingByTask = new Map<string, LoadedCell[]>();
  for (const cell of cellsForTiming(cells)) {
    const task = timingByTask.get(cell.run.task_id) ?? [];
    task.push(cell);
    timingByTask.set(cell.run.task_id, task);
  }
  const taskDerived = [...timingByTask.values()].map((task) => aggregateMedians(task.map((cell) => cell.derived)));
  const taskUsage = new Map<string, LoadedCell[]>();
  for (const cell of cells) {
    const task = taskUsage.get(cell.run.task_id) ?? [];
    task.push(cell);
    taskUsage.set(cell.run.task_id, task);
  }
  const usageByTask = [...taskUsage.values()].map((task) => {
    const summaries = task.map(usageSummary);
    return {
      turns: median(summaries.map((summary) => summary.turns)),
      inputTokens: medianNullable(summaries.map((summary) => summary.inputTokens)),
      outputTokens: medianNullable(summaries.map((summary) => summary.outputTokens)),
      cachedPercent: medianNullable(summaries.map((summary) => summary.cachedPercent)),
    };
  });
  const taskCosts = new Map<string, Array<number | null>>();
  const taskFloors = new Map<string, Array<number | null>>();
  for (const cell of cells) {
    const price = cellCost(cell, loadPriceBook);
    if (cell.run.model !== "" && (price.cost === null) !== (cell.run.spend_usd_estimate === null)) {
      throw new ConfigError(`C4 spend availability disagrees with C1 pricing for ${cell.run.run_id}`);
    }
    if (price.cost !== null && cell.run.spend_usd_estimate !== null &&
      Math.abs(price.cost - cell.run.spend_usd_estimate) > Math.max(0.000001, Math.abs(price.cost) * 0.000001)) {
      throw new ConfigError(`C4 spend disagrees with C1 pricing for ${cell.run.run_id}`);
    }
    const costs = taskCosts.get(cell.run.task_id) ?? [];
    costs.push(price.cost);
    taskCosts.set(cell.run.task_id, costs);
    const floors = taskFloors.get(cell.run.task_id) ?? [];
    floors.push(price.floor);
    taskFloors.set(cell.run.task_id, floors);
  }
  const taskCostMedians = [...taskCosts.values()].map((values) => medianNullable(values));
  const taskFloorMedians = [...taskFloors.values()].map((values) => medianNullable(values));
  const timing = taskDerived.length === 0 ? null : aggregateMedians(taskDerived);
  const usage = {
    turns: median(usageByTask.map((summary) => summary.turns)),
    inputTokens: medianNullable(usageByTask.map((summary) => summary.inputTokens)),
    outputTokens: medianNullable(usageByTask.map((summary) => summary.outputTokens)),
    cachedPercent: medianNullable(usageByTask.map((summary) => summary.cachedPercent)),
  };
  const successful = cells.filter((cell) => cell.run.outcome === "completed").length;
  return {
    harness: cells[0]?.run.tool ?? "",
    version: cells[0]?.run.tool_version ?? "",
    visibility: [...visibility][0] ?? "none",
    ...(cells[0] === undefined
      ? {}
      : { sourceRegime: `${cells[0].run.tool_configuration === undefined ? "" : `${cells[0].run.tool_configuration} / `}${cells[0].run.task_repository === undefined ? "" : `${cells[0].run.task_repository} / `}${cells[0].run.task_source}@${cells[0].run.task_revision} / ${cells[0].run.task_regime}${cells[0].run.provider_routing === undefined ? "" : ` / ${providerRoutingLabel(cells[0].run.provider_routing)}`}` }),
    derived: timing,
    // Keep only tasks whose spread is measurable; a single-repetition task
    // contributes no information about spread and must not be folded in as 0.
    e2eIqr: medianNullable([...timingByTask.values()].map((task) => iqr(task.map((cell) => cell.derived.end_to_end))).filter((value): value is number => value !== null)),
    ...usage,
    costUsd: medianNullable(taskCostMedians),
    tokenFloorUsd: medianNullable(taskFloorMedians),
    success: `${successful}/${cells.length}`,
    rawPath,
  };
}

function taskDetailRows(cells: LoadedCell[], loadPriceBook: (id: string) => PricingFile, outDir: string): TaskDetailRow[] {
  const byTask = new Map<string, LoadedCell[]>();
  for (const cell of cells) {
    const task = byTask.get(cell.run.task_id) ?? [];
    task.push(cell);
    byTask.set(cell.run.task_id, task);
  }
  return [...byTask.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([taskId, taskCells]) => {
    const timingCells = cellsForTiming(taskCells);
    const derived = timingCells.length === 0 ? null : aggregateMedians(timingCells.map((cell) => cell.derived));
    const costs = taskCells.map((cell) => cellCost(cell, loadPriceBook).cost);
    const firstRun = taskCells[0]?.runPath;
    const rawPath = firstRun === undefined ? undefined : relative(resolve(outDir), firstRun);
    return {
      harness: taskCells[0]?.run.tool ?? "",
      taskId,
      visibility: taskCells[0]?.visibility ?? "none",
      derived,
      e2eIqr: iqr(timingCells.map((cell) => cell.derived.end_to_end)),
      costUsd: medianNullable(costs),
      success: `${taskCells.filter((cell) => cell.run.outcome === "completed").length}/${taskCells.length}`,
      rawPath,
    };
  });
}

export function reviewAnomalies(cells: LoadedCell[]): ReviewAnomaly[] {
  const anomalies: ReviewAnomaly[] = [];
  for (const cell of cells) {
    const reasons: string[] = [];
    if (cell.derived.unreconciled) reasons.push("unreconciled timing buckets");
    if (cell.run.outcome !== "completed") reasons.push(`outcome ${cell.run.outcome}`);
    if (reasons.length > 0) anomalies.push({ runId: cell.run.run_id, reason: reasons.join(", ") });
  }
  const groups = new Map<string, LoadedCell[]>();
  for (const cell of cells) {
    if (cell.run.outcome !== "completed" || cell.derived.unreconciled) continue;
    const key = [cell.run.tool, cell.run.task_id, cell.run.task_repository ?? "", cell.run.task_source, cell.run.task_revision,
      cell.run.task_regime, cell.run.condition, cell.run.model, cell.run.price_book, JSON.stringify(cell.run.provider_routing ?? null), cell.run.tool_configuration ?? null,
      cell.run.host.os, cell.run.host.cpu, cell.run.host.ram_gb, cell.run.ori_version ?? ""].join("\0");
    const group = groups.get(key) ?? [];
    group.push(cell);
    groups.set(key, group);
  }
  for (const group of groups.values()) {
    const cellMedian = median(group.map((cell) => cell.derived.end_to_end));
    for (const cell of group) {
      if (cell.derived.end_to_end > cellMedian * 3) {
        anomalies.push({
          runId: cell.run.run_id,
          reason: `end-to-end ${cell.derived.end_to_end}ms exceeds 3× cell median ${cellMedian}ms`,
        });
      }
    }
  }
  return anomalies.sort((left, right) => left.runId.localeCompare(right.runId));
}

function campaignScheduling(resultsDir: string): string {
  const parent = dirname(resolve(resultsDir));
  const candidates = [join(parent, "state.json"), join(parent, "provenance", "runner-state.json")];
  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    if (lstatSync(candidate).isSymbolicLink() || !lstatSync(candidate).isFile()) throw new ConfigError("report campaign state is not a regular file");
    const state = readJson(candidate, "report campaign state") as { definition_key?: unknown };
    if (typeof state.definition_key !== "string") continue;
    let definition: { executionProtocol?: unknown };
    try { definition = JSON.parse(state.definition_key) as { executionProtocol?: unknown }; }
    catch { throw new ConfigError("report campaign definition is not valid JSON"); }
    if (definition?.executionProtocol === "tool-batches-v1") return "Tool-by-tool batches were measured in separate windows; provider load and time-of-day may affect comparisons.\n\n";
  }
  return "";
}

function attemptAnalysis(cell: LoadedCell, loadPriceBook: (id: string) => PricingFile): AnalysisAttempt {
  const r = cell.run;
  const usage = usageSummary(cell);
  const price = cellCost(cell, loadPriceBook);
  const hash = (path: string) => `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
  return {
    run_id: r.run_id, harness: r.tool, version: r.tool_version, task: r.task_id, rep: r.rep,
    outcome: r.outcome, host: { os: r.host.os, cpu: r.host.cpu, ram_gb: r.host.ram_gb },
    condition: r.condition, model: r.model, price_book: r.price_book,
    source: { repository: r.task_repository ?? null, name: r.task_source, revision: r.task_revision },
    regime: r.task_regime,
    routing: r.provider_routing === undefined ? null : {
      ignored_providers: [...r.provider_routing.ignored_providers].sort(),
      ...(r.provider_routing.only_provider === undefined ? {} : { only_provider: r.provider_routing.only_provider }),
      ...(r.provider_routing.allow_fallbacks === undefined ? {} : { allow_fallbacks: r.provider_routing.allow_fallbacks }),
    },
    configuration: r.tool_configuration ?? null, ori_version: r.ori_version,
    task_base_revision: r.task_base_revision ?? null, verifier_image: r.container.verifier_image_digest,
    environment: r.task_environment.kind, started_iso: r.container.started_iso, visibility: cell.visibility,
    hashes: { run: hash(cell.runPath), events: hash(cellEventsPath(dirname(cell.runPath), r.events_file)) },
    timing: cell.derived.unreconciled ? null : { ...cell.derived },
    timing_unavailable: cell.derived.unreconciled ? "unreconciled" : null,
    turns: usage.turns, input_tokens: usage.inputTokens, output_tokens: usage.outputTokens, cached_percent: usage.cachedPercent,
    usage_unavailable: usage.inputTokens !== null ? null : cell.events.some(isSuccessfulModelEvent) ? "incomplete-usage" : "no-successful-usage",
    cost_usd: price.cost, token_floor_usd: price.floor, cost_unavailable: price.unavailable ?? null,
    ...(() => {
      const rates = r.model === "" ? null : ratesFor(r, loadPriceBook(r.price_book)) ?? null;
      // Relative to the first request, so export and replay share identical
      // arithmetic and cannot disagree through absolute-clock roundoff.
      const adapterEnd = cell.derived.unreconciled ? null : cell.derived.end_to_end - cell.derived.startup;
      const requests = requestSeries(cell.events, adapterEnd, rates);
      return { requests, request_summary: summarizeRequests(requests, adapterEnd, adapterEnd === null ? null : 0) };
    })(),
  };
}

function taskWeightedTimingMean(cells: LoadedCell[]): DerivedRun | null {
  const tasks = new Map<string, DerivedRun[]>();
  for (const cell of cellsForTiming(cells)) {
    const values = tasks.get(cell.run.task_id) ?? [];
    values.push(cell.derived);
    tasks.set(cell.run.task_id, values);
  }
  return aggregateTimingMeans([...tasks.values()].map((runs) => aggregateTimingMeans(runs)!));
}

/** Validated attempt analysis without a legacy cross-repetition timing headline. */
export function generateAnalysisReport(resultsDir: string, outDir: string, options: { allowUnpricedModels?: boolean } = {}): AnalysisExport {
  const cells = loadResultsTree(resultsDir);
  // Analysis task identities include verifier images, not CLI-specific agent
  // images. Do not silently combine agent-only rebuilds under one identity.
  const agentImages = new Map<string, string>();
  for (const { run } of cells) {
    const key = JSON.stringify([run.tool, run.tool_version, run.task_id,
      run.task_base_revision ?? null, run.container.verifier_image_digest,
      run.task_environment.kind]);
    const previous = agentImages.get(key);
    if (previous !== undefined && previous !== run.container.image_digest) {
      throw new ConfigError(`agent image digest differs within one analysis task identity for ${run.tool}/${run.task_id}`);
    }
    agentImages.set(key, run.container.image_digest);
  }
  const loadPriceBook = priceBookLoader(options.allowUnpricedModels === true);
  const analysis = analyzeAttempts(cells.map(cell => attemptAnalysis(cell, loadPriceBook)));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "analysis.json"), `${JSON.stringify(analysis, null, 2)}\n`);
  writeFileSync(join(outDir, "analysis.md"), renderAnalysisMarkdown(analysis));
  writeFileSync(join(outDir, "analysis.html"), renderAnalysisHtml(analysis));
  return analysis;
}

export function generateReport(resultsDir: string, outDir: string, options: { allowUnpricedModels?: boolean } = {}): { markdown: string; html: string; rows: HeadlineRow[]; analysis: AnalysisExport } {
  const cells = loadResultsTree(resultsDir);
  const loadPriceBook = priceBookLoader(options.allowUnpricedModels === true);
  const sections = new Map<string, LoadedCell[]>();
  const hasToolConfiguration = cells.some((cell) => cell.run.tool_configuration !== undefined);
  const hasProviderRouting = cells.some((cell) => cell.run.provider_routing !== undefined);
  for (const cell of cells) {
    const key = `${cell.run.condition}\0${cell.run.price_book}\0${cell.run.model}\0${cell.run.task_repository ?? ""}\0${cell.run.task_source}\0${cell.run.task_revision}\0${cell.run.task_regime}\0${JSON.stringify(cell.run.provider_routing ?? null)}\0${cell.run.tool_configuration ?? ""}\0${JSON.stringify([cell.run.host.os, cell.run.host.cpu, cell.run.host.ram_gb])}\0${cell.run.ori_version ?? ""}`;
    const list = sections.get(key) ?? [];
    list.push(cell);
    sections.set(key, list);
  }
  const regimes = new Set(cells.map((cell) => cell.run.task_regime));
  // Every regime needs its own positioning sentence. A fallthrough here would
  // publish an extended-regime table under the short-regime "1-5 minute" claim.
  const SINGLE_REGIME_POSITIONING: Record<string, string> = {
    short: "Independent measurement instrument for short (1–5 minute) selected tasks. Not a capabilities leaderboard, not a vendor harness cost claim.\n\n",
    long: "Independent measurement instrument for long-horizon selected public tasks. Not a capabilities leaderboard, not a vendor harness cost claim. Long-horizon results are not comparable with short-regime results.\n\n",
    extended: "Independent measurement instrument for extended-horizon (16–180 minute) selected public tasks. Not a capabilities leaderboard, not a vendor harness cost claim. Extended-horizon results are not comparable with short- or long-regime results.\n\n",
  };
  const positioning = regimes.size === 1
    ? SINGLE_REGIME_POSITIONING[[...regimes][0]!] ?? (() => { throw new Error(`unknown task regime ${[...regimes][0]}`); })()
    : "Independent measurement instrument reporting materially different task regimes separately. Not a capabilities leaderboard, not a vendor harness cost claim. Results from different regimes are not pooled.\n\n";
  const rows: HeadlineRow[] = [];
  const tables: string[] = [];
  const chartMeans: Array<DerivedRun | null> = [];
  for (const [key, section] of [...sections.entries()].sort()) {
    const [condition, priceBook, model, taskRepository, taskSource, taskRevision, taskRegime] = key.split("\0");
    const byTool = new Map<string, LoadedCell[]>();
    for (const cell of section) (byTool.get(cell.run.tool) ?? (byTool.set(cell.run.tool, []), byTool.get(cell.run.tool)!)).push(cell);
    const resultsRoot = resolve(resultsDir);
    const sectionRows = [...byTool.values()].map((toolCells) => {
      const source = resolve(toolCells[0]?.runPath ?? resultsDir);
      const sourceRelative = relative(resultsRoot, source);
      if (sourceRelative === "" || sourceRelative === ".." || sourceRelative.startsWith(`..${sep}`)) {
        throw new ConfigError(`raw result path escapes results tree: ${source}`);
      }
      if (!statSync(source).isFile()) throw new ConfigError(`raw result path is not a file: ${source}`);
      chartMeans.push(taskWeightedTimingMean(toolCells));
      return headlineRow(toolCells, loadPriceBook, relative(resolve(outDir), source));
    });
    rows.push(...sectionRows);
    const detailRows = [...byTool.values()].flatMap((toolCells) => taskDetailRows(toolCells, loadPriceBook, outDir));
    const sourceLabel = taskRepository === "" ? `${headingValue(taskSource)}@${headingValue(taskRevision)}` : `${headingValue(taskRepository)} / ${headingValue(taskSource)}@${headingValue(taskRevision)}`;
    const routingLabel = hasProviderRouting ? `; ${headingValue(providerRoutingLabel(section[0]?.run.provider_routing))}` : "";
    const toolLabel = hasToolConfiguration ? `; tools: ${headingValue(section[0]?.run.tool_configuration ?? "default tools")}` : "";
    const host = section[0]!.run.host;
    const hostLabel = `${headingValue(host.os)} / ${headingValue(host.cpu)} / ${host.ram_gb} GiB`;
    tables.push(`## Condition: ${headingValue(condition)} (model: ${headingValue(model)}; price book: ${headingValue(priceBook)}; source: ${sourceLabel}; regime: ${headingValue(taskRegime)}${routingLabel}${toolLabel}; host: ${hostLabel})\n\n${renderHeadlineMarkdown(sectionRows)}\n\n### Per-task drill-down\n\n${renderTaskMarkdown(detailRows)}`);
  }
  const anomalies = reviewAnomalies(cells);
  const appendix = anomalies.length === 0
    ? "## Review appendix\n\nNo unreconciled runs or >3× within-cell outliers were found."
    : `## Review appendix\n\n${anomalies.map((anomaly) => `- \`${headingValue(anomaly.runId)}\`: ${headingValue(anomaly.reason)}`).join("\n")}`;
  const pricingNotice = options.allowUnpricedModels === true ? "Diagnostic preview: pricing unavailable for models absent from their recorded price book; costs and token floors remain unavailable.\n\n" : "";
  const analysisNotice = "[Explore matched tasks, sample counts and outcome distributions](analysis.html) · [Analysis tables](analysis.md) · [Per-attempt data](analysis.json)\n\nHeadline timing uses reconciled native passes; usage and costs include all loaded outcomes. Headline E2E is the median of task medians; its spread is the median within-task IQR over tasks with at least two timing-eligible runs, not a pooled IQR or confidence interval. See the analysis view for contributing samples. Stacked timing charts use task-weighted arithmetic means, not the headline medians.\n\n";
  const markdown = positioning + pricingNotice + analysisNotice + campaignScheduling(resultsDir) + tables.join("\n\n") + (tables.length === 0 ? "" : "\n\n") + appendix;
  const svgs = rows.flatMap((r, index) => [
    ...(chartMeans[index] == null ? [] : [stackedBarSvg(chartMeans[index]!, 400, 24, `hatch-${index}`, `${r.harness} task-weighted mean timing breakdown`)]),
    costBarSvg(r.costUsd, r.tokenFloorUsd, 400, 16, `${r.harness} cost versus token floor`),
  ]);
  const html = renderHtml(markdown, svgs);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "README.md"), markdown);
  writeFileSync(join(outDir, "index.html"), html);
  const analysis = analyzeAttempts(cells.map((cell) => attemptAnalysis(cell, loadPriceBook)));
  writeFileSync(join(outDir, "analysis.json"), `${JSON.stringify(analysis, null, 2)}\n`);
  writeFileSync(join(outDir, "analysis.md"), renderAnalysisMarkdown(analysis));
  writeFileSync(join(outDir, "analysis.html"), renderAnalysisHtml(analysis));
  return { markdown, html, rows, analysis };
}

function providerRoutingLabel(policy: C4Run["provider_routing"]): string {
  return `excluded providers: ${policy?.ignored_providers.join(", ") ?? "none"}${policy?.only_provider === undefined ? "" : `; only provider: ${policy.only_provider}; fallbacks: disabled`}`;
}
