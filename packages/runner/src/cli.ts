import { createFixedPriceGuard, FIXED_PRICE_BOOK } from "./fixed-price-window.js";
import { hasIncompleteCells } from "./state.js";
import { existsSync, lstatSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { ConfigError, validateProviderRouting } from "@aob/contracts";
import { startMockUpstream } from "@aob/mock-upstream";
import { LocalTaskSourceAdapter, validateLocalTaskManifest } from "@aob/tasks";
import { validateToolConfiguration } from "./cell.js";
import { assertProviderCredentials } from "./config.js";
import { captureRunWindowHost, runMatrix, type MatrixTask } from "./index.js";

const HELP = `Usage: aob-runner [options]

Runs a resumable matrix. A non-mock run sends requests to the configured upstream
and can spend money. CI-safe validation uses the default mock upstream and model.

Options:
  --out DIR                 output root (default: scratch/s5-dry-run)
  --tasks PATH[,PATH...]    canonical task directories
  --tools NAME[,NAME...]    adapters (default: mock-agent)
  --conditions LIST         pinned or default (default: pinned)
  --reps N                  repetitions (default: 2)
  --rep-start N             first repetition index for independent runs (default: 0)
  --model ID                pinned model id (default: mock)
  --price-book ID           dated price-book id (default: openrouter-2026-08-27)
  --mode host|docker|mixed  execution mode (default: docker; host/mixed only for local validation)
  --upstream URL            upstream URL; otherwise use the zero-spend mock
  --ignored-providers LIST  sorted comma-separated provider exclusions, recorded in run identity
  --only-provider ID        one provider endpoint; disables fallbacks (with --ignored-providers)
  --tool-configuration ID   claude-code-no-web-search (separate Claude recovery condition)
  --cap-usd USD             recorded-spend cap; requires --estimate-cell-usd
  --estimate-cell-usd USD   conservative upper bound for every cell
  --window-ledger PATH      provenance ledger for an official run session
  --session-id ID            operator-created run-session ID (with --window-ledger)
  --run-id-suffix ID          explicit suffix for a separately-run replacement session
  --execution-protocol ID   tool-batches-v1 for a tool-by-tool campaign
  --batch-tool NAME         execute only this tool from the complete campaign
  --batch-cap-usd USD       cap for this tool including earlier attempts
  --validation-spend-usd USD reserve verified validation spend against total cap
  --stop-on-failure         stop validation on its first failed cell, without retry
  --help                    show this help
`;

if (process.argv.includes("--help")) {
  process.stdout.write(HELP);
  process.exit(0);
}

function option(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  if (value === undefined || value.startsWith("--")) throw new ConfigError(`${name} requires a value`);
  return value;
}

function csvOption(name: string, fallback: string): string[] {
  return option(name, fallback).split(",").map((value) => value.trim()).filter(Boolean);
}

function positiveIntOption(name: string, fallback: string): number {
  const value = Number(option(name, fallback));
  if (!Number.isInteger(value) || value <= 0) throw new ConfigError(`${name} must be a positive integer`);
  return value;
}

const root = join(fileURLToPath(new URL(".", import.meta.url)), "../../..");
const out = resolve(root, option("--out", "scratch/s5-dry-run"));
const mode = option("--mode", "docker");
if (mode !== "host" && mode !== "docker" && mode !== "mixed") throw new ConfigError("--mode must be host, docker, or mixed");
const upstreamOption = option("--upstream", "");
const ignoredRaw = option("--ignored-providers", "");
const onlyProvider = option("--only-provider", "");
const providerRouting = ignoredRaw === "" && onlyProvider === "" ? undefined : validateProviderRouting({
  ignored_providers: ignoredRaw === "" ? [] : ignoredRaw.split(","),
  ...(onlyProvider === "" ? {} : { only_provider: onlyProvider, allow_fallbacks: false }),
});
assertProviderCredentials(upstreamOption || undefined);
const suite = join(root, "packages/tasks/suite");
const requestedTasks = csvOption("--tasks", "");
const pathTasks = requestedTasks.filter((value) => {
  const candidate = resolve(root, value);
  try {
    return existsSync(candidate) && lstatSync(candidate).isDirectory();
  } catch {
    return false;
  }
});
if (pathTasks.length > 0 && pathTasks.length !== requestedTasks.length) {
  throw new ConfigError("--tasks must contain either task ids or task directory paths, not a mixture");
}
const sourceRoot = pathTasks.length > 0 ? dirname(resolve(root, pathTasks[0]!)) : suite;
if (pathTasks.length > 1 && pathTasks.some((value) => dirname(resolve(root, value)) !== sourceRoot)) {
  throw new ConfigError("task directory paths must share one source root");
}
const sourceAdapter = new LocalTaskSourceAdapter(sourceRoot);
if (sourceRoot === suite) {
  const manifestPath = join(suite, "..", "suite-manifest.json");
  try {
    validateLocalTaskManifest(suite, JSON.parse(readFileSync(manifestPath, "utf8")));
  } catch (error) {
    throw new ConfigError(`task source manifest validation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
const taskIds = pathTasks.length > 0
  ? pathTasks.map((value) => basename(resolve(root, value)))
  : requestedTasks.length > 0
    ? requestedTasks
    : (await sourceAdapter.listTasks()).filter((id) => id.startsWith("py-small-")).slice(0, 2);
if (taskIds.length === 0) throw new ConfigError("at least one task id or directory is required");
const preparedRoot = mkdtempSync(join(tmpdir(), "aob-cli-prepared-"));
const tasks: MatrixTask[] = [];
for (const taskId of taskIds) {
  const prepared = await sourceAdapter.prepareTask(taskId, join(preparedRoot, taskId));
  tasks.push({
    id: prepared.task.id,
    dir: join(preparedRoot, taskId),
    source: prepared.task.source.kind,
    sourceRepository: prepared.task.source.repository,
    revision: prepared.sourceRevision,
    ...(prepared.task.baseRevision === undefined ? {} : { baseRevision: prepared.task.baseRevision }),
    regime: prepared.task.regime,
    timeoutS: prepared.task.timeoutS,
    verifier: prepared.task.verifier,
    environment: prepared.task.environment,
  });
}
const tools = csvOption("--tools", "mock-agent");
const toolConfiguration = option("--tool-configuration", "") || undefined;
validateToolConfiguration(toolConfiguration, tools);
const conditions = csvOption("--conditions", "pinned");
if (!conditions.every((condition): condition is "pinned" | "default" => condition === "pinned" || condition === "default")) {
  throw new ConfigError("--conditions must contain only pinned or default");
}
const reps = positiveIntOption("--reps", "2");
const repStart = Number(option("--rep-start", "0"));
if (!Number.isSafeInteger(repStart) || repStart < 0 || !Number.isSafeInteger(repStart + reps)) throw new ConfigError("--rep-start requires a nonnegative safe repetition range");
const model = option("--model", "mock");
const priceBook = option("--price-book", "openrouter-2026-08-27");
const mockDelayMs = Number(process.env.AOB_MOCK_DELAY_MS ?? "0");
if (!Number.isFinite(mockDelayMs) || mockDelayMs < 0) throw new ConfigError("AOB_MOCK_DELAY_MS must be nonnegative");
const mock = upstreamOption.length === 0
  ? await startMockUpstream({ delayMs: mockDelayMs, streamed: false, includeUsage: true, status: 200, host: mode === "docker" || mode === "mixed" ? "0.0.0.0" : "127.0.0.1" })
  : null;
if (mock === null && upstreamOption.length === 0) throw new ConfigError("upstream configuration is invalid");
if (mock === null && tools.includes("mock-agent")) throw new ConfigError("mock-agent requires the default mock upstream");
let pricingPolicyBook: unknown;
let priceRates: { input: number; cached_input: number; output: number } | undefined;
try {
  // Price books are dated, immutable snapshots resolved by id. Validate the id
  // here too: it comes from a CLI argument and must not name a file outside
  // the price-book directory.
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(priceBook) || priceBook.length > 100) throw new ConfigError(`invalid price book id: ${priceBook}`);
  const pricing = JSON.parse(readFileSync(join(root, "packages/report/price-books", `${priceBook}.json`), "utf8")) as {
    id: string;
    pricing_condition?: unknown;
    models: Record<string, { input: number; cached_input: number; output: number }>;
  };
  if (pricing.id === priceBook) {
    priceRates = pricing.models[model];
    if (pricing.pricing_condition !== undefined || priceBook === FIXED_PRICE_BOOK) pricingPolicyBook = pricing;
  }
} catch {
  priceRates = undefined;
}
if (priceBook === FIXED_PRICE_BOOK && pricingPolicyBook === undefined) throw new ConfigError("fixed-price book policy is missing");
const beforeCell = pricingPolicyBook === undefined ? undefined : createFixedPriceGuard(pricingPolicyBook, { model, upstream: upstreamOption, ...(providerRouting === undefined ? {} : { routing: providerRouting }), evidencePath: join(out, "provenance/fixed-price-windows.jsonl") });
const capRaw = option("--cap-usd", "");
const capUsd = capRaw.length === 0 ? undefined : Number(capRaw);
if (capUsd !== undefined && (!Number.isFinite(capUsd) || capUsd <= 0)) throw new ConfigError("--cap-usd must be positive");
if (capUsd !== undefined && capUsd > 1500) throw new ConfigError("--cap-usd must not exceed the official $1,500 maximum");
const estimateRaw = option("--estimate-cell-usd", "");
const estimateCellUsd = estimateRaw.length === 0 ? undefined : Number(estimateRaw);
if (estimateCellUsd !== undefined && (!Number.isFinite(estimateCellUsd) || estimateCellUsd < 0)) throw new ConfigError("--estimate-cell-usd must be nonnegative");
const upstream = upstreamOption || mock?.baseUrl;
const windowLedgerPath = option("--window-ledger", "");
const sessionId = option("--session-id", "");
if ((windowLedgerPath === "") !== (sessionId === "")) throw new ConfigError("--window-ledger and --session-id must be supplied together");
const runIdSuffixRaw = option("--run-id-suffix", "");
if (runIdSuffixRaw !== "" && !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(runIdSuffixRaw)) throw new ConfigError("--run-id-suffix must be a safe identifier");
const executionProtocol = option("--execution-protocol", "");
if (executionProtocol !== "" && executionProtocol !== "tool-batches-v1") throw new ConfigError("unsupported execution protocol");
const batchTool = option("--batch-tool", "");
const batchCapRaw = option("--batch-cap-usd", "");
const validationSpendRaw = option("--validation-spend-usd", "");
const batchCapUsd = batchCapRaw === "" ? undefined : Number(batchCapRaw);
const validationSpendUsd = validationSpendRaw === "" ? undefined : Number(validationSpendRaw);
const stopOnFailure = process.argv.includes("--stop-on-failure");
if (executionProtocol === "" && (batchTool !== "" || batchCapRaw !== "" || validationSpendRaw !== "")) {
  throw new ConfigError("batch arguments require tool-batches-v1 execution protocol");
}
const selectedImageDigests = tasks.flatMap((task) => [
  ...(task.verifier?.kind === "docker-command" ? [task.verifier.image_digest] : []),
  ...Object.values(task.environment?.agent_images ?? {}).map((image) => image.image_digest),
]);
try {
  const state = await runMatrix({
    ...(beforeCell === undefined ? {} : { beforeCell }),
    resultsDir: join(out, "results"),
    statePath: join(out, "state.json"),
    tasks,
    tools,
    conditions,
    reps,
    repStart,
    model,
    priceBook,
    ...(providerRouting === undefined ? {} : { providerRouting }),
    ...(toolConfiguration === undefined ? {} : { toolConfiguration }),
    ...(executionProtocol === "" ? {} : { executionProtocol, batchTool,
      ...(batchCapUsd === undefined ? {} : { batchCapUsd }),
      ...(validationSpendUsd === undefined ? {} : { validationSpendUsd }) }),
    ...(stopOnFailure ? { stopOnFailure: true } : {}),
    ...(priceRates === undefined ? {} : { priceRates }),
    ...(capUsd === undefined ? {} : { capUsd }),
    ...(estimateCellUsd === undefined ? {} : { estimateCellUsd: () => estimateCellUsd }),
    ...(runIdSuffixRaw === "" ? {} : { runIdSuffix: runIdSuffixRaw }),
    ...(upstream === undefined ? {} : { upstream }),
    mode: mode as "host" | "docker" | "mixed",
    ...(windowLedgerPath === "" ? {} : { runWindow: { path: resolve(root, windowLedgerPath), sessionId, host: captureRunWindowHost(selectedImageDigests), endHost: () => captureRunWindowHost(selectedImageDigests) } }),
  });
  process.stdout.write(`${JSON.stringify(state)}\n`);
  if (stopOnFailure && hasIncompleteCells(state, batchTool || undefined)) process.exitCode = 1;
} finally {
  await mock?.close();
  rmSync(preparedRoot, { recursive: true, force: true });
}
