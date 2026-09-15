#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(import.meta.url);
if (process.argv[2] !== "--loaded") {
  const result = spawnSync(process.execPath, ["--experimental-strip-types", "--no-warnings", "--experimental-loader",
    join(dirname(here), "ts-source-loader.mjs"), here, "--loaded", ...process.argv.slice(2)], { stdio: "inherit" });
  if (result.error) process.stderr.write(`${result.error.name}: ${result.error.message}\n`);
  process.exit(result.status ?? 1);
}

const { ConfigError } = await import("../packages/contracts/src/index.ts");
const { LocalTaskSourceAdapter, validateLocalTaskManifest } = await import("../packages/tasks/src/index.ts");
const { validateCampaignValidation } = await import("../packages/report/src/campaign-validation.ts");
const { copySanitizedValidation } = await import("../packages/report/src/freeze.ts");
const { digestText, validateRunWindowLedger } = await import("../packages/runner/src/window-ledger.ts");

function fail(message) { throw new ConfigError(`campaign validation: ${message}`); }
function csv(value, label) {
  const values = value.split(",").map((item) => item.trim());
  if (values.some((item) => item.length === 0) || new Set(values).size !== values.length) fail(`${label} must be a nonempty unique list`);
  return values;
}
function regularDirectory(path) {
  if (existsSync(path) && (lstatSync(path).isSymbolicLink() || !lstatSync(path).isDirectory())) fail(`not a regular directory: ${path}`);
}
function regularFile(path, label) {
  if (!existsSync(path) || lstatSync(path).isSymbolicLink() || !lstatSync(path).isFile()) fail(`${label} is missing or not a regular file`);
  return readFileSync(path, "utf8");
}
function primaryCampaignStart(campaign) {
  const statePath = join(campaign, "state.json");
  if (!existsSync(statePath)) return undefined;
  const stateText = regularFile(statePath, "campaign state");
  const state = JSON.parse(stateText);
  const definition = JSON.parse(state.definition_key);
  const ledger = validateRunWindowLedger(JSON.parse(regularFile(join(campaign, "provenance/run-window-ledger.json"), "primary campaign ledger")));
  if (definition?.executionProtocol !== "tool-batches-v1" || ledger.execution_protocol !== "tool-batches-v1" ||
      state.run_window_session_id !== ledger.session_id || state.run_window_ledger !== "provenance/run-window-ledger.json" ||
      ledger.state_sha256 !== digestText(stateText)) fail("primary campaign ledger is not bound to the batch runner state");
  // The runner checks the full checkpoint and result binding under its writer
  // lock. This read-only gate retains the first session start on continuation.
  return ledger.window.start_iso;
}

async function main(args) {
  if (args.length !== 8) fail("usage: ROOT TASKS_CSV TOOLS_CSV MODEL PRICE_BOOK REPS VALIDATION_ROOT CAMPAIGN_ROOT");
  const [rootArg, tasksCsv, toolsCsv, model, priceBook, repsRaw, validationArg, campaignArg] = args;
  const root = resolve(rootArg); const validation = resolve(root, validationArg); const campaign = resolve(root, campaignArg);
  const reps = Number(repsRaw);
  if (!Number.isInteger(reps) || reps <= 0) fail("repetitions must be a positive integer");
  if (!model.trim() || !priceBook.trim()) fail("model and price book are required");
  const requested = csv(tasksCsv, "tasks"); const tools = csv(toolsCsv, "tools");
  regularDirectory(campaign);
  const provenance = join(campaign, "provenance"); regularDirectory(provenance);
  const snapshot = join(provenance, "validation"); regularDirectory(snapshot);
  const results = join(campaign, "results"); regularDirectory(results);
  if (!existsSync(snapshot) && (existsSync(join(campaign, "state.json")) || (existsSync(results) && readdirSync(results).length > 0))) {
    fail("campaign state/results already exist without archived validation; validation must precede the grand run");
  }
  const pathTasks = requested.filter((value) => {
    const candidate = resolve(root, value);
    return existsSync(candidate) && lstatSync(candidate).isDirectory();
  });
  if (pathTasks.length > 0 && pathTasks.length !== requested.length) fail("tasks must contain either ids or directory paths, not a mixture");
  const suite = join(root, "packages/tasks/suite");
  const sourceRoot = pathTasks.length > 0 ? dirname(resolve(root, pathTasks[0])) : suite;
  if (pathTasks.some((value) => dirname(resolve(root, value)) !== sourceRoot)) fail("task directories must share one source root");
  const source = new LocalTaskSourceAdapter(sourceRoot);
  if (sourceRoot === suite) validateLocalTaskManifest(suite, JSON.parse(readFileSync(join(suite, "../suite-manifest.json"), "utf8")));
  const ids = pathTasks.length > 0 ? pathTasks.map((value) => basename(resolve(root, value))) : requested;
  const preparedRoot = mkdtempSync(join(tmpdir(), "aob-campaign-validation-tasks-"));
  try {
    const tasks = [];
    for (const id of ids) {
      const prepared = await source.prepareTask(id, join(preparedRoot, id));
      const task = prepared.task;
      tasks.push({ id: task.id, source: task.source.kind, sourceRepository: task.source.repository, revision: prepared.sourceRevision,
        regime: task.regime, timeoutS: task.timeoutS,
        ...(task.baseRevision === undefined ? {} : { baseRevision: task.baseRevision }),
        ...(task.environment === undefined ? {} : { environment: task.environment }),
        ...(task.verifier === undefined ? {} : { verifier: task.verifier.kind === "docker-command" ? task.verifier : "script" }),
      });
    }
    const { validateProviderRouting } = await import("../packages/contracts/src/index.ts");
    const ignored = process.env.AOB_IGNORED_PROVIDERS ?? "";
    const only = process.env.AOB_ONLY_PROVIDER ?? "";
    const definition = { tools, tasks, model, priceBook, conditions: ["pinned"], reps,
      ...(ignored === "" && only === "" ? {} : { providerRouting: validateProviderRouting({ ignored_providers: ignored === "" ? [] : ignored.split(","), ...(only === "" ? {} : { only_provider: only, allow_fallbacks: false }) }) }) };
    const campaignResults = existsSync(results) ? results : undefined;
    const campaignStartIso = primaryCampaignStart(campaign);
    if (!existsSync(snapshot)) {
      // Validate before creating campaign files; stage and re-read the portable
      // copy before publishing its directory as the campaign prerequisite.
      validateCampaignValidation(validation, definition, campaignResults);
      mkdirSync(provenance, { recursive: true });
      const staging = mkdtempSync(join(provenance, ".validation-"));
      try {
        copySanitizedValidation(validation, staging, definition, campaignResults);
        renameSync(staging, snapshot);
      } finally { rmSync(staging, { recursive: true, force: true }); }
    }
    const summary = validateCampaignValidation(snapshot, definition, campaignResults, campaignStartIso);
    process.stdout.write(`${summary.spent_usd}\n`);
  } finally { rmSync(preparedRoot, { recursive: true, force: true }); }
}

try { await main(process.argv.slice(3)); }
catch (error) {
  process.stderr.write(`${error instanceof ConfigError ? error.name : "ConfigError"}: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
