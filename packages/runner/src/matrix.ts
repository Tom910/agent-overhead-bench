import { preserveAttempt } from "./attempt-evidence.js";
import { closeSync, existsSync, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { isCompletedNativeTaskFailure, BudgetExceeded, ConfigError, ContractViolation, validateC1Event, validateC4Run, validateProviderRouting, type ProviderRouting, type ToolConfiguration, type C1Event, type C4Run } from "@aob/contracts";
import type { TaskEnvironment, VerifierSpec } from "@aob/tasks";
import { getAdapter } from "@aob/adapters";
import { runDockerCell, runHostCell, validateToolConfiguration, type CellSpec } from "./cell.js";
import { assertBudget, estimateRunSpendUsd, type BudgetRates } from "./budget.js";
import { cleanupDockerResources } from "./docker.js";
import {
  blockRandomize,
  createMatrixState,
  isTerminal,
  loadState,
  saveState,
  transitionCell,
  type Cell,
  type MatrixState,
} from "./state.js";
import { bindRunWindowResults, digestText, loadRunWindowLedger, RunWindowWriter, type LedgerNow, type RunWindowHost } from "./window-ledger.js";
import type { MeasurementRegime } from "@aob/tasks";

export type MatrixTask = {
  id: string;
  dir: string;
  source: string;
  sourceRepository?: string;
  revision: string;
  baseRevision?: string;
  regime: MeasurementRegime;
  timeoutS: number;
  verifier?: VerifierSpec;
  environment?: TaskEnvironment;
};

export type MatrixOptions = {
  resultsDir: string;
  statePath: string;
  tasks: MatrixTask[];
  tools: string[];
  conditions: Array<"pinned" | "default">;
  reps: number;
  /** First repetition index for independently scheduled cells; defaults to zero. */
  repStart?: number;
  model: string;
  priceBook: string;
  providerRouting?: ProviderRouting;
  toolConfiguration?: ToolConfiguration;
  priceRates?: BudgetRates;
  upstream?: string;
  mode?: "host" | "docker" | "mixed";
  capUsd?: number;
  /** Required with capUsd; must conservatively upper-bound the cell's spend. */
  estimateCellUsd?: (cell: Cell, task: MatrixTask) => number | null;
  seed?: number;
  /** Optional explicit suffix for a separately-run anomaly replacement. */
  runIdSuffix?: string;
  /** Explicit campaign scheduling; legacy runs remain block randomized. */
  executionProtocol?: "tool-batches-v1";
  /** Execute only this tool, retaining the complete campaign definition. */
  batchTool?: string;
  /** Maximum recorded spend for this tool, including previous invocations/retries. */
  batchCapUsd?: number;
  /** Validation stops at its first failed C4, without retrying it. */
  stopOnFailure?: boolean;
  /** Verified validation spend reserved against the campaign cap; not a C4 metric. */
  validationSpendUsd?: number;
  /** Admission checks and waits occur before staging and measured attempt timing. */
  beforeCell?: (cell: Cell, task: MatrixTask) => Promise<void | (() => void)>;
  executeCell?: (cell: Cell, task: MatrixTask, dir: string) => Promise<C4Run>;
  runWindow?: {
    path: string;
    sessionId: string;
    host: RunWindowHost;
    endHost?: () => RunWindowHost;
    now?: () => LedgerNow;
  };
};

function modelForCondition(condition: "pinned" | "default", pinnedModel: string): string {
  return condition === "pinned" ? pinnedModel : "";
}

function rng(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (1664525 * value + 1013904223) >>> 0;
    return value / 0x1_0000_0000;
  };
}

function makeCells(opts: MatrixOptions): Cell[] {
  const random = rng(opts.seed ?? 1);
  const cells: Cell[] = [];
  for (const condition of opts.conditions) {
    for (let rep = opts.repStart ?? 0; rep < (opts.repStart ?? 0) + opts.reps; rep++) {
      for (const task of opts.tasks) {
        for (const tool of blockRandomize(opts.tools, 1, random)[0] ?? []) {
          const baseId = `${condition}:${tool}:${task.id}:${rep}`;
          cells.push({
            id: opts.runIdSuffix === undefined ? baseId : `${baseId}:${opts.runIdSuffix}`,
            tool,
            task_id: task.id,
            condition,
            rep,
            status: "pending",
            retries: 0,
          });
        }
      }
    }
  }
  if (opts.executionProtocol === "tool-batches-v1") {
    cells.sort((left, right) => opts.tools.indexOf(left.tool) - opts.tools.indexOf(right.tool));
  }
  return cells;
}

function taskFor(opts: MatrixOptions, cell: Cell): MatrixTask {
  const task = opts.tasks.find((candidate) => candidate.id === cell.task_id);
  if (!task) throw new ConfigError(`matrix cell ${cell.id} refers to unknown task ${cell.task_id}`);
  return task;
}

function c4MatchesMatrixCell(run: C4Run, cell: Cell, task: MatrixTask, opts: MatrixOptions): boolean {
  return run.run_id === cell.id && run.tool === cell.tool && run.task_id === cell.task_id &&
    run.task_source === task.source && (run.task_repository ?? "") === (task.sourceRepository ?? "") &&
    run.task_revision === task.revision && (run.task_base_revision ?? "") === (task.baseRevision ?? "") &&
    run.task_regime === task.regime && run.condition === cell.condition && run.rep === cell.rep &&
    run.model === modelForCondition(cell.condition, opts.model) && run.price_book === opts.priceBook &&
    JSON.stringify(run.provider_routing) === JSON.stringify(opts.providerRouting) &&
    run.tool_configuration === opts.toolConfiguration;
}

function cellDir(opts: MatrixOptions, cell: Cell): string {
  return `${opts.resultsDir}/${cell.condition}/${cell.tool}/${cell.task_id}/rep-${cell.rep}`;
}


function definitionKey(opts: MatrixOptions): string {
  return JSON.stringify({
    model: opts.model,
    priceBook: opts.priceBook,
    ...(opts.providerRouting === undefined ? {} : { providerRouting: opts.providerRouting }),
    ...(opts.toolConfiguration === undefined ? {} : { toolConfiguration: opts.toolConfiguration }),
    tools: opts.tools,
    conditions: opts.conditions,
    reps: opts.reps,
    ...((opts.repStart ?? 0) === 0 ? {} : { repStart: opts.repStart }),
    ...(opts.executionProtocol === undefined ? {} : { executionProtocol: opts.executionProtocol, capUsd: opts.capUsd, validationSpendUsd: opts.validationSpendUsd ?? 0 }),
    ...(opts.runIdSuffix === undefined ? {} : { runIdSuffix: opts.runIdSuffix }),
    tasks: opts.tasks.map(({ id, source, sourceRepository, revision, baseRevision, regime, timeoutS, verifier, environment }) => ({
      id, source, ...(sourceRepository === undefined ? {} : { sourceRepository }), revision, regime, timeoutS,
      ...(baseRevision === undefined ? {} : { baseRevision }),
      ...(environment === undefined ? {} : { environment }),
      ...(verifier === undefined ? {} : { verifier: verifier.kind === "docker-command" ? verifier : "script" }),
    })),
  });
}

function windowDefinitionDigest(opts: MatrixOptions, definition: string): string {
  return digestText(JSON.stringify({ definition, upstream: opts.upstream ?? null, mode: opts.mode ?? "docker", capUsd: opts.capUsd ?? null }));
}

function assertMatrixDefinition(state: MatrixState, opts: MatrixOptions): void {
  const expected = makeCells(opts);
  const sameCell = (left: Cell, right: Cell) => left.id === right.id && left.tool === right.tool && left.task_id === right.task_id &&
    left.condition === right.condition && left.rep === right.rep;
  if (state.seed !== (opts.seed ?? 1) || state.cells.length !== expected.length || expected.some((wanted) => !state.cells.some((actual) => sameCell(actual, wanted)))) {
    throw new ConfigError("matrix state does not match the requested matrix definition");
  }
}

type ReconciledArtifact = { state: MatrixState; failed: boolean };

function reconcilePersistedArtifact(state: MatrixState, cell: Cell, task: MatrixTask, opts: MatrixOptions, dir: string): ReconciledArtifact | null {
  const runPath = `${dir}/run.json`;
  if (cell.status === "failed") {
    // A failed cell normally proceeds to its one retry. An existing C4 with
    // unavailable spend is different: under a cap it is an executed paid
    // attempt that must remain non-runnable until its spend is reconciled.
    if (!existsSync(runPath)) return null;
    let run: C4Run;
    try {
      run = validateC4Run(JSON.parse(readFileSync(runPath, "utf8")));
    } catch {
      // Failed-cell retry handling owns arbitrary stale/partial root files;
      // preserve the existing retry path unless the file is a valid C4 whose
      // spend boundary must be enforced.
      return null;
    }
    if (!c4MatchesMatrixCell(run, cell, task, opts)) {
      throw new ConfigError(`cannot reconcile ${cell.id}: existing run.json does not match the matrix cell`);
    }
    if (run.spend_usd_estimate === null && opts.capUsd !== undefined) {
      throw new BudgetExceeded(`cell ${cell.id} has unavailable spend; refusing a capped resume`);
    }
    if (isCompletedNativeTaskFailure(run, dir, opts.priceRates)) {
      return { state: transitionCell(state, cell.id, "task_failed"), failed: false };
    }
    // Numeric spend is already part of state.spentUsd when this branch is
    // reached. The normal pre-execution estimate below decides whether a
    // retry fits the remaining cap; charging or checking the old amount here
    // would count the retained attempt as the next retry.
    return null;
  }
  if (cell.status !== "staged" && cell.status !== "running" && cell.status !== "verifying") return null;
  // A failed attempt is copied before failed -> staged is persisted. If the
  // process dies in that staged-retry window, the root artifact is the old
  // attempt and its spend is already in state.spentUsd.
  if (cell.status === "staged" && cell.retries > 0 && existsSync(join(dir, ".attempts", `attempt-${cell.retries - 1}`, "run.json"))) return null;
  if (!existsSync(runPath)) return null;
  let run: C4Run;
  try {
    run = validateC4Run(JSON.parse(readFileSync(runPath, "utf8")));
  } catch (error) {
    throw new ConfigError(`cannot reconcile ${cell.id}: existing run.json is invalid: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!c4MatchesMatrixCell(run, cell, task, opts)) {
    throw new ConfigError(`cannot reconcile ${cell.id}: existing run.json does not match the matrix cell`);
  }
  if (run.spend_usd_estimate === null && opts.capUsd !== undefined) {
    throw new BudgetExceeded(`cell ${cell.id} has unavailable spend; refusing a capped resume`);
  }
  const taskFailed = isCompletedNativeTaskFailure(run, dir, opts.priceRates);
  let recovered = state;
  if (run.outcome === "completed") {
    if (cell.status === "staged") recovered = transitionCell(recovered, cell.id, "running");
    if (cell.status !== "verifying") recovered = transitionCell(recovered, cell.id, "verifying");
    recovered = transitionCell(recovered, cell.id, "done");
  } else {
    if (cell.status === "staged") recovered = transitionCell(recovered, cell.id, "running");
    recovered = transitionCell(recovered, cell.id, taskFailed ? "task_failed" : "failed");
  }
  return { state: { ...recovered, spentUsd: recovered.spentUsd + (run.spend_usd_estimate ?? 0) }, failed: run.outcome !== "completed" && !taskFailed };
}

function clearContainerResources(state: MatrixState, id: string): MatrixState {
  return {
    ...state,
    cells: state.cells.map((candidate) => {
      if (candidate.id !== id) return { ...candidate };
      const { containerName: _containerName, relayName: _relayName, networkName: _networkName, ...withoutResources } = candidate;
      return withoutResources;
    }),
  };
}

function reconcileInterruptedSpend(
  state: MatrixState,
  cell: Cell,
  dir: string,
  rates: BudgetRates | undefined,
  capUsd: number | undefined,
): MatrixState {
  if (cell.interruptedSpendUsd !== undefined) {
    if (cell.interruptedSpendUsd === null && capUsd !== undefined) {
      throw new BudgetExceeded(`cell ${cell.id} has unpriced interrupted usage; refusing a capped resume`);
    }
    return state;
  }
  const eventsPath = `${dir}/events.jsonl`;
  // A valid returned C4 (including a failure outcome) has already been
  // charged by the matrix. Only an events file left without its C4 can be
  // attributed to an interrupted process.
  if (existsSync(`${dir}/run.json`)) return state;
  if (!existsSync(eventsPath)) return state;
  let events: C1Event[];
  try {
    events = readFileSync(eventsPath, "utf8").split("\n").filter(Boolean).map((line) => validateC1Event(JSON.parse(line)));
  } catch (error) {
    throw new ContractViolation(`cannot reconcile interrupted events for ${cell.id}: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (events.some((event) => event.run_id !== cell.id)) {
    throw new ContractViolation(`interrupted events do not belong to ${cell.id}`);
  }
  const spend = estimateRunSpendUsd(events, cell.condition, rates);
  if (spend === null && capUsd !== undefined) {
    throw new BudgetExceeded(`cell ${cell.id} has unpriced interrupted usage; refusing a capped resume`);
  }
  const cells = state.cells.map((candidate) => candidate.id === cell.id
    ? { ...candidate, interruptedSpendUsd: spend }
    : { ...candidate });
  return { ...state, cells, spentUsd: state.spentUsd + (spend ?? 0) };
}

/** A campaign has one writer even when tools run in separate processes. */
export async function runMatrix(opts: MatrixOptions): Promise<MatrixState> {
  validateToolConfiguration(opts.toolConfiguration, opts.tools);
  if (opts.providerRouting !== undefined) opts = { ...opts, providerRouting: validateProviderRouting(opts.providerRouting) };
  if (opts.executionProtocol === undefined) {
    if (opts.batchTool !== undefined || opts.batchCapUsd !== undefined) throw new ConfigError("batch options require tool-batches-v1 protocol");
    return runMatrixUnlocked(opts);
  }
  if (opts.executionProtocol !== "tool-batches-v1" || opts.batchTool === undefined || !opts.tools.includes(opts.batchTool)) {
    throw new ConfigError("batch tool must belong to the campaign tool scope");
  }
  if (opts.runWindow === undefined) throw new ConfigError("tool batch requires a run-window ledger");
  if (opts.capUsd === undefined || !Number.isFinite(opts.capUsd) || opts.capUsd <= 0 || opts.capUsd > 1500 ||
      opts.batchCapUsd === undefined || !Number.isFinite(opts.batchCapUsd) || opts.batchCapUsd <= 0 || opts.batchCapUsd > opts.capUsd) {
    throw new ConfigError("tool batch requires positive tool and campaign caps, with tool cap no greater than campaign cap");
  }
  if (opts.validationSpendUsd !== undefined && (!Number.isFinite(opts.validationSpendUsd) || opts.validationSpendUsd < 0)) {
    throw new ConfigError("validation spend must be a nonnegative finite number");
  }
  const lockPath = `${opts.statePath}.lock`;
  mkdirSync(dirname(lockPath), { recursive: true });
  let lock: number;
  try { lock = openSync(lockPath, "wx", 0o600); }
  catch (error) {
    throw new ConfigError(`campaign writer lock unavailable; another batch may be running: ${error instanceof Error ? error.message : String(error)}`);
  }
  try {
    writeFileSync(lock, `${JSON.stringify({ pid: process.pid, tool: opts.batchTool })}\n`);
    return await runMatrixUnlocked(opts);
  } finally {
    closeSync(lock);
    unlinkSync(lockPath);
  }
}

/** Count retained C4 spend for the selected tool, never resetting at a batch boundary. */
function recordedToolSpend(state: MatrixState, opts: MatrixOptions): number {
  let spend = 0;
  for (const cell of state.cells.filter((item) => item.tool === opts.batchTool)) {
    if (cell.interruptedSpendUsd !== undefined) {
      throw new BudgetExceeded(`tool ${cell.tool} has interrupted spend evidence; reconcile it before a tool batch`);
    }
    const dir = cellDir(opts, cell);
    const paths = [join(dir, "run.json")];
    const attempts = join(dir, ".attempts");
    if (existsSync(attempts)) {
      if (lstatSync(attempts).isSymbolicLink() || !lstatSync(attempts).isDirectory()) throw new ConfigError("invalid batch retry evidence directory");
      for (const name of readdirSync(attempts)) {
        if (!/^attempt-[0-9]+$/.test(name)) throw new ConfigError("unexpected batch retry evidence");
        const attemptDir = join(attempts, name);
        if (lstatSync(attemptDir).isSymbolicLink() || !lstatSync(attemptDir).isDirectory()) throw new ConfigError("invalid batch retry evidence");
        paths.push(join(attemptDir, "run.json"));
      }
    }
    for (const path of paths) {
      if (!existsSync(path)) {
        if (cell.status !== "pending" || path !== paths[0]) throw new BudgetExceeded(`batch spend evidence is missing for ${cell.id}`);
        continue;
      }
      if (lstatSync(path).isSymbolicLink() || !lstatSync(path).isFile()) throw new ConfigError("batch spend evidence is not a regular file");
      let run: C4Run;
      try { run = validateC4Run(JSON.parse(readFileSync(path, "utf8"))); }
      catch (error) { throw new ConfigError(`invalid batch spend evidence: ${error instanceof Error ? error.message : String(error)}`); }
      if (!c4MatchesMatrixCell(run, cell, taskFor(opts, cell), opts)) throw new ConfigError(`batch spend evidence does not match ${cell.id}`);
      if (run.spend_usd_estimate === null) throw new BudgetExceeded(`batch ${cell.tool} has unavailable spend`);
      spend += run.spend_usd_estimate;
    }
  }
  return spend;
}

async function runMatrixUnlocked(opts: MatrixOptions): Promise<MatrixState> {
  const repStart = opts.repStart ?? 0;
  if (!Number.isSafeInteger(repStart) || repStart < 0 || !Number.isSafeInteger(repStart + opts.reps)) {
    throw new ConfigError("repStart must be a nonnegative safe integer with a safe repetition range");
  }
  if (opts.runIdSuffix !== undefined && !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(opts.runIdSuffix)) {
    throw new ConfigError("runIdSuffix must be a safe identifier");
  }
  const existing = existsSync(opts.statePath);
  if (opts.executionProtocol === "tool-batches-v1" && !existing && existsSync(opts.resultsDir) &&
      (lstatSync(opts.resultsDir).isSymbolicLink() || !lstatSync(opts.resultsDir).isDirectory() || readdirSync(opts.resultsDir).length > 0)) {
    throw new ConfigError("campaign results exist without their checkpoint state; refusing to overwrite prior evidence");
  }
  const requestedDefinition = definitionKey(opts);
  let state = existing ? loadState(opts.statePath) : { ...createMatrixState(makeCells(opts), opts.seed ?? 1), definition_key: requestedDefinition };
  if (existing) {
    if (state.definition_key === undefined) {
      throw new ConfigError("matrix state is missing definition_key; refusing an unverified legacy resume");
    }
    assertMatrixDefinition(state, opts);
    if (state.definition_key !== requestedDefinition) {
      throw new ConfigError("matrix state does not match the requested model, price book, or task definition");
    }
  }
  const runWindowOptions = opts.runWindow;
  const runWindowLedgerRelative = runWindowOptions === undefined ? undefined : relative(dirname(opts.statePath), runWindowOptions.path).split(sep).join("/");
  if (runWindowLedgerRelative !== undefined && (runWindowLedgerRelative === "" || runWindowLedgerRelative.startsWith("../") || runWindowLedgerRelative === ".." || runWindowLedgerRelative.startsWith("/"))) {
    throw new ConfigError("run-window ledger must be inside the runner output root");
  }
  if (existing && runWindowOptions !== undefined && (state.run_window_session_id !== runWindowOptions.sessionId || state.run_window_ledger !== runWindowLedgerRelative)) {
    throw new ConfigError("matrix state is not bound to the requested run-window session");
  }
  if (!existing && runWindowOptions !== undefined && existsSync(runWindowOptions.path)) {
    throw new ConfigError("matrix state is missing for an existing run-window ledger; refusing an unbound continuation");
  }
  const eligible = (cell: Cell) => !isTerminal(cell.status) && (opts.batchTool === undefined || cell.tool === opts.batchTool);
  if (opts.executionProtocol === "tool-batches-v1") {
    if (existing && existsSync(runWindowOptions!.path)) {
      // Validate the previous clean checkpoint before using its spend or
      // overwriting its bindings when opening the next segment.
      const prior = loadRunWindowLedger(runWindowOptions!.path);
      if (prior.execution_protocol !== "tool-batches-v1" || prior.window.end_iso === null ||
          prior.state_sha256 !== digestText(readFileSync(opts.statePath)) ||
          JSON.stringify(prior.results_binding) !== JSON.stringify(bindRunWindowResults(opts.resultsDir))) {
        throw new ConfigError("campaign checkpoint state/results bindings do not match the closed ledger");
      }
    } else if (existing && (state.spentUsd !== 0 || state.cells.some((cell) => cell.status !== "pending") ||
        (existsSync(opts.resultsDir) && readdirSync(opts.resultsDir).length > 0))) {
      throw new ConfigError("campaign checkpoint is missing its run-window ledger");
    }
    if (!state.cells.some(eligible)) return state;
    for (const tool of opts.tools.filter((tool) => tool !== opts.batchTool)) {
      const cells = state.cells.filter((cell) => cell.tool === tool);
      if (cells.some((cell) => cell.status !== "pending") && cells.some((cell) => !isTerminal(cell.status))) {
        throw new ConfigError(`finish incomplete batch ${tool} before starting ${opts.batchTool}`);
      }
    }
    // Do not create empty ledger segments when a cap already prevents the next cell.
    const next = state.cells.find(eligible)!;
    const estimate = opts.estimateCellUsd?.(next, taskFor(opts, next));
    if (estimate === undefined || estimate === null || !Number.isFinite(estimate) || estimate <= 0) throw new ConfigError("tool batch requires a conservative cell estimate");
    assertBudget(state.spentUsd + (opts.validationSpendUsd ?? 0), estimate, opts.capUsd!);
    assertBudget(recordedToolSpend(state, opts), estimate, opts.batchCapUsd!);
  }
  const shouldOpenWindow = runWindowOptions !== undefined && (!existing || state.cells.some(eligible));
  if (shouldOpenWindow && !existing) {
    // Bind the new session before the ledger is first persisted. If the
    // process is killed between these durable writes, the next invocation can
    // safely recreate the missing ledger instead of finding an orphan with no
    // matrix-state owner.
    state = { ...state, run_window_session_id: runWindowOptions!.sessionId, run_window_ledger: runWindowLedgerRelative! };
    saveState(opts.statePath, state);
  }
  const window = !shouldOpenWindow ? undefined : RunWindowWriter.open({
    path: runWindowOptions.path,
    sessionId: runWindowOptions.sessionId,
    host: runWindowOptions.host,
    matrixDefinitionSha256: windowDefinitionDigest(opts, requestedDefinition),
    allowContinuation: existing && state.cells.some(eligible),
    ...(opts.executionProtocol === undefined ? {} : { batch: { tool: opts.batchTool!, capUsd: opts.batchCapUsd! } }),
    ...(runWindowOptions.now === undefined ? {} : { clock: runWindowOptions.now }),
  });
  if (window !== undefined) {
    if (state.run_window_session_id !== runWindowOptions!.sessionId || state.run_window_ledger !== runWindowLedgerRelative) {
      throw new ConfigError("matrix state is not bound to the opened run-window session");
    }
  }
  saveState(opts.statePath, state);
  let executionAdmissionForCell: (() => void) | undefined;
  let verificationStartForCell: (() => void) | undefined;
  let containerStartForCell: ((name: string, resources?: { relayName: string; networkName: string }) => void) | undefined;
  const execute = opts.executeCell ?? (async (cell: Cell, task: MatrixTask, dir: string) => {
    if (!opts.upstream) throw new ConfigError("matrix upstream is required for host execution");
    const spec: CellSpec = {
      dir, taskDir: task.dir, upstream: opts.upstream, run_id: cell.id, tool: cell.tool, task_id: cell.task_id,
      task_source: task.source, ...(task.sourceRepository === undefined ? {} : { task_repository: task.sourceRepository }), task_revision: task.revision, task_regime: task.regime, task_base_revision: task.baseRevision ?? null, model: modelForCondition(cell.condition, opts.model),
      price_book: opts.priceBook, condition: cell.condition, rep: cell.rep, timeoutS: task.timeoutS,
      ...(opts.providerRouting === undefined ? {} : { providerRouting: opts.providerRouting }),
    ...(opts.toolConfiguration === undefined ? {} : { toolConfiguration: opts.toolConfiguration }),
      ...(task.verifier === undefined ? {} : { verifier: task.verifier }),
      ...(task.environment === undefined ? {} : { environment: task.environment }),
      ...(executionAdmissionForCell === undefined ? {} : { onExecutionStart: executionAdmissionForCell }),
      ...(verificationStartForCell === undefined ? {} : { onVerificationStart: verificationStartForCell }),
      ...(containerStartForCell === undefined ? {} : { onContainerStart: containerStartForCell }),
    };
    if (opts.priceRates !== undefined && cell.condition === "pinned") spec.priceRates = opts.priceRates;
    const mode = opts.mode ?? "docker";
    const adapterMode = mode === "mixed"
      ? (getAdapter(cell.tool).containerInvocation !== undefined ? "docker" : "host")
      : mode;
    return adapterMode === "docker" ? runDockerCell(spec) : runHostCell(spec);
  });

  let retryPass = true;
  let primaryError: unknown;
  try {
   while (retryPass) {
    retryPass = false;
    for (const original of [...state.cells]) {
      let cell = state.cells.find((candidate) => candidate.id === original.id) ?? original;
      if (!eligible(cell)) continue;
      const task = taskFor(opts, cell);
      const dir = cellDir(opts, cell);
      if (cell.containerName !== undefined || cell.relayName !== undefined || cell.networkName !== undefined) {
        await cleanupDockerResources({
          ...(cell.containerName === undefined ? {} : { containerName: cell.containerName }),
          ...(cell.relayName === undefined ? {} : { relayName: cell.relayName }),
          ...(cell.networkName === undefined ? {} : { networkName: cell.networkName }),
        });
        state = clearContainerResources(state, cell.id);
        saveState(opts.statePath, state);
        cell = state.cells.find((candidate) => candidate.id === original.id)!;
      }
      const reconciled = reconcilePersistedArtifact(state, cell, task, opts, dir);
      if (reconciled !== null) {
        state = reconciled.state;
        saveState(opts.statePath, state);
        if (reconciled.failed) retryPass = true;
        continue;
      }
      const spendReconciled = reconcileInterruptedSpend(state, cell, dir, opts.priceRates, opts.capUsd);
      if (spendReconciled !== state) {
        state = spendReconciled;
        saveState(opts.statePath, state);
        cell = state.cells.find((candidate) => candidate.id === original.id)!;
      }
      const toolSpendBefore = opts.executionProtocol === undefined ? 0 : recordedToolSpend(state, opts);
      if (opts.capUsd !== undefined) {
        if (!opts.estimateCellUsd) throw new ConfigError("a preflight spend estimate is required when a budget cap is armed");
        const estimate = opts.estimateCellUsd(cell, task);
        if (estimate === null || !Number.isFinite(estimate) || estimate <= 0) {
          throw new ConfigError("a positive conservative spend estimate is required when a budget cap is armed");
        }
        assertBudget(state.spentUsd + (opts.validationSpendUsd ?? 0), estimate, opts.capUsd);
        if (opts.batchCapUsd !== undefined) assertBudget(toolSpendBefore, estimate, opts.batchCapUsd);
      }
      if (cell.status === "failed" && cell.retries >= 1) {
        state = transitionCell(state, cell.id, "quarantined");
        saveState(opts.statePath, state);
        continue;
      }
      executionAdmissionForCell = (await opts.beforeCell?.(cell, task)) || undefined;
      if (cell.status === "failed") {
        preserveAttempt(dir, cell.retries);
        state = transitionCell(state, cell.id, "staged");
      } else if (cell.status === "pending") {
        state = transitionCell(state, cell.id, "staged");
      } else {
        state = { ...state, cells: state.cells.map((candidate) => candidate.id === cell.id ? { ...candidate, status: "pending" } : candidate) };
        state = transitionCell(state, cell.id, "staged");
      }
      saveState(opts.statePath, state);
      cell = state.cells.find((candidate) => candidate.id === original.id)!;
      state = transitionCell(state, cell.id, "running");
      saveState(opts.statePath, state);
      verificationStartForCell = () => {
        const current = state.cells.find((candidate) => candidate.id === cell.id);
        if (current?.status === "running") {
          state = transitionCell(state, cell.id, "verifying");
          saveState(opts.statePath, state);
        }
      };
      containerStartForCell = (name, resources) => {
        state = {
          ...state,
          cells: state.cells.map((candidate) => candidate.id === cell.id ? {
            ...candidate,
            containerName: name,
            ...(resources === undefined ? {} : { relayName: resources.relayName, networkName: resources.networkName }),
          } : { ...candidate }),
        };
        saveState(opts.statePath, state);
      };
      let windowAttempt: string | undefined;
      try {
        windowAttempt = window?.startAttempt(cell.id, cell.id, cell.retries > 0 ? "retry" : "current");
        const run = await execute(cell, task, dir);
        // Custom executors may not expose a verification boundary. In that
        // case, make the transition before classifying their returned C4.
        verificationStartForCell?.();
        state = clearContainerResources(state, cell.id);
        saveState(opts.statePath, state);
        validateC4Run(run);
        if (!c4MatchesMatrixCell(run, cell, task, opts)) {
          throw new ConfigError(`C4 result does not match matrix cell ${cell.id}`);
        }
        if (windowAttempt !== undefined) {
          window?.finishAttempt(windowAttempt, run.outcome === "completed" ? "completed" : "failed");
          windowAttempt = undefined;
        }
        const nextSpend = run.spend_usd_estimate;
        if (opts.capUsd !== undefined) {
          if (nextSpend === null) {
            // The cell has executed and its C4 is evidence even when spend is
            // unavailable. Preserve that evidence and make the cell failed so
            // a capped resume cannot mistake it for an untouched cell.
            state = { ...state, cells: state.cells.map((candidate) => candidate.id === cell.id ? { ...candidate, status: "failed" } : candidate) };
            saveState(opts.statePath, state);
            throw new BudgetExceeded(`cell ${cell.id} has unavailable spend; refusing to continue under the recorded-spend cap`);
          }
          try {
            assertBudget(state.spentUsd + (opts.validationSpendUsd ?? 0), nextSpend, opts.capUsd);
            if (opts.batchCapUsd !== undefined) assertBudget(toolSpendBefore, nextSpend, opts.batchCapUsd);
          } catch (error) {
            // A numeric C4 that exceeds the cap is also paid-run evidence;
            // retain it for audit/reconciliation instead of deleting it.
            state = {
              ...state,
              spentUsd: state.spentUsd + nextSpend,
              cells: state.cells.map((candidate) => candidate.id === cell.id ? { ...candidate, status: "failed" } : candidate),
            };
            saveState(opts.statePath, state);
            throw error;
          }
        }
        state = { ...state, spentUsd: state.spentUsd + (nextSpend ?? 0) };
        const taskFailed = isCompletedNativeTaskFailure(run, dir, opts.priceRates);
        state = transitionCell(state, cell.id, run.outcome === "completed" ? "done" : taskFailed ? "task_failed" : "failed");
        if (run.outcome !== "completed" && !taskFailed && opts.stopOnFailure === true) {
          saveState(opts.statePath, state);
          return state;
        }
        if (run.outcome !== "completed" && !taskFailed) retryPass = true;
      } catch (error) {
        if (windowAttempt !== undefined) {
          try {
            window?.finishAttempt(windowAttempt, "failed");
          } catch {
            // Preserve the execution error; the outer ledger close will keep
            // the session ineligible if the attempt could not be recorded.
          }
          windowAttempt = undefined;
        }
        if (error instanceof BudgetExceeded) {
          saveState(opts.statePath, state);
          throw error;
        }
        state = transitionCell(state, cell.id, "failed");
        // A thrown error means no schema-valid C4 result was produced. Do not
        // turn an infrastructure/configuration failure into a successful
        // process with a quarantined, artifact-less cell. Returned C4 failure
        // outcomes are the only failures eligible for the one retry pass.
        saveState(opts.statePath, state);
        throw error;
      }
      saveState(opts.statePath, state);
    }
  }
  } catch (error) {
    primaryError = error;
    throw error;
  } finally {
    if (window !== undefined) {
      try {
        saveState(opts.statePath, state);
        const stateHash = digestText(readFileSync(opts.statePath));
        let resultsBinding = null;
        try {
          resultsBinding = bindRunWindowResults(opts.resultsDir);
        } catch (error) {
          if (!(error instanceof ConfigError)) throw error;
        }
        window.finish(runWindowOptions!.endHost?.() ?? runWindowOptions!.host, stateHash, resultsBinding);
      } catch (error) {
        if (primaryError === undefined) throw error;
      }
    }
  }
  return state;
}
