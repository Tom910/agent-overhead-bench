/**
 * Release boundary: copy only validated raw results and declared logs into a
 * portable archive tree, excluding workspaces, prompts, and private solutions.
 */
import { createHash } from "node:crypto";
import { constants, lstatSync, mkdirSync, openSync, readFileSync, readdirSync, realpathSync, closeSync, fstatSync, writeFileSync, type Stats } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { c4MeasurementIdentity, ConfigError, validateC1Event, validateC4Run, type C1Event, type C4Run } from "@aob/contracts";
import { loadResultsTree, type LoadedCell } from "./from-results.js";
import { validateCampaignValidation, type CampaignValidationSummary } from "./campaign-validation.js";
import { copyRawEvidence, copyRedactedReleaseLog, redactReleaseLog } from "./release-log.js";

function redactJsonValue(value: unknown): unknown {
  if (typeof value === "string") return redactReleaseLog(value);
  if (Array.isArray(value)) return value.map(redactJsonValue);
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, redactJsonValue(child)]));
  }
  return value;
}

function redactReleaseJson(text: string, source: string): string {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    throw new ConfigError(`cannot redact invalid JSON evidence ${source}: ${error instanceof Error ? error.message : String(error)}`);
  }
  return JSON.stringify(redactJsonValue(value));
}

function inside(path: string, root: string): boolean {
  const rel = relative(root, path);
  return rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

function closeEvidenceDescriptor(fd: number | undefined): void {
  if (fd === undefined) return;
  try { closeSync(fd); }
  catch { throw new ConfigError("cannot close release evidence descriptor"); }
}

function writeReleaseFile(path: string, contents: string | Buffer): void {
  mkdirSync(dirname(path), { recursive: true });
  let fd: number | undefined;
  try {
    fd = openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | (constants.O_NOFOLLOW ?? 0), 0o600);
    if (!fstatSync(fd).isFile()) throw new ConfigError(`release output is not a regular file: ${path}`);
    writeFileSync(fd, contents);
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(`cannot write release output: ${path}`);
  } finally {
    closeEvidenceDescriptor(fd);
  }
}

function copyEvidence(source: string, root: string, destination: string, redactContents: false | "text" | "json" = false): void {
  const absolute = resolve(source);
  if (!inside(absolute, root)) throw new ConfigError(`result evidence escapes its cell: ${source}`);
  let info: Stats;
  let realRoot: string;
  let realFile: string;
  let fd: number | undefined;
  let outputFd: number | undefined;
  try {
    info = lstatSync(absolute);
    realRoot = realpathSync(root);
    realFile = realpathSync(absolute);
    fd = openSync(absolute, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    const opened = fstatSync(fd);
    if (!opened.isFile()) throw new ConfigError(`result evidence is not a regular file: ${source}`);
  } catch (error) {
    closeEvidenceDescriptor(fd);
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(`result evidence is unavailable: ${source}`);
  }
  try {
    if (!info.isFile() || info.isSymbolicLink() || !inside(realFile, realRoot)) {
      throw new ConfigError(`result evidence is not a regular file: ${source}`);
    }
    mkdirSync(dirname(destination), { recursive: true });
    if (redactContents === "json") writeReleaseFile(destination, redactReleaseJson(readFileSync(fd, "utf8"), source));
    else {
      outputFd = openSync(destination, constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC | (constants.O_NOFOLLOW ?? 0), 0o600);
      if (!fstatSync(outputFd).isFile()) throw new ConfigError(`release output is not a regular file: ${destination}`);
      if (redactContents === "text") copyRedactedReleaseLog(fd, outputFd);
      else copyRawEvidence(fd, outputFd);
    }
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(`cannot copy result evidence: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    try { closeEvidenceDescriptor(fd); }
    finally { closeEvidenceDescriptor(outputFd); }
  }
}

function requireEmptyDestination(path: string): string {
  const destination = resolve(path);
  try {
    const info = lstatSync(destination);
    if (info.isSymbolicLink() || !info.isDirectory()) throw new ConfigError(`release destination is not a regular directory: ${destination}`);
    if (readdirSync(destination).length > 0) throw new ConfigError(`release destination is not empty: ${destination}`);
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    try {
      mkdirSync(destination, { recursive: true });
    } catch (mkdirError) {
      throw new ConfigError(`release destination is unavailable: ${mkdirError instanceof Error ? mkdirError.message : String(mkdirError)}`);
    }
  }
  return destination;
}

function copyCell(cell: LoadedCell, resultsRoot: string, destinationRoot: string, destinationRelative?: string): void {
  const sourceCell = dirname(resolve(cell.runPath));
  const destinationCell = join(destinationRoot, destinationRelative ?? relative(resultsRoot, sourceCell));
  const destinationRun = join(destinationCell, "run.json");
  copyEvidence(cell.runPath, sourceCell, destinationRun);
  const events = resolve(sourceCell, cell.run.events_file);
  const destinationEvents = join(destinationCell, "events.jsonl");
  copyEvidence(events, sourceCell, destinationEvents);
  // C1 bodies are already excluded by the proxy contract. Redact the complete
  // serialized record so credential-shaped values cannot survive in optional
  // model/error metadata while the validated JSON shape remains unchanged.
  const portableEvents = cell.events.map((event) => redactReleaseJson(JSON.stringify(event), events));
  writeReleaseFile(destinationEvents, `${portableEvents.join("\n")}\n`);
  const artifactPath = (path: string) => isAbsolute(path) ? path : resolve(sourceCell, path);
  copyEvidence(artifactPath(cell.run.adapter_result.artifacts.stdoutPath), sourceCell, join(destinationCell, "stdout.log"), "text");
  copyEvidence(artifactPath(cell.run.adapter_result.artifacts.stderrPath), sourceCell, join(destinationCell, "stderr.log"), "text");
  copyEvidence(resolve(sourceCell, cell.run.verification.logPath), sourceCell, join(destinationCell, "verify.log"), "text");
  if (cell.run.adapter_result.artifacts.toolLogPath !== undefined) {
    copyEvidence(artifactPath(cell.run.adapter_result.artifacts.toolLogPath), sourceCell, join(destinationCell, "tool.log"), "text");
  }
  const portableRun = {
    ...cell.run,
    events_file: "events.jsonl",
    adapter_result: {
      ...cell.run.adapter_result,
      artifacts: {
        ...cell.run.adapter_result.artifacts,
        stdoutPath: "stdout.log",
        stderrPath: "stderr.log",
        ...(cell.run.adapter_result.artifacts.toolLogPath === undefined ? {} : { toolLogPath: "tool.log" }),
      },
    },
    verification: { ...cell.run.verification, logPath: "verify.log" },
  };
  writeReleaseFile(destinationRun, `${JSON.stringify(portableRun, null, 2)}\n`);
}

const RETRY_EVIDENCE = ["run.json", "events.jsonl", "stdout.log", "stderr.log", "tool-events.jsonl", "verify.log"] as const;
const RETRY_LOGS = new Set<string>(["stdout.log", "stderr.log", "tool-events.jsonl", "verify.log"]);

function readRetryRun(path: string, currentRuns: Map<string, C4Run>): C4Run {
  let run: C4Run;
  try {
    run = validateC4Run(JSON.parse(readFileSync(path, "utf8")));
  } catch (error) {
    throw new ConfigError(`retry C4 artifact is invalid: ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
  const current = currentRuns.get(run.run_id);
  if (current === undefined || c4MeasurementIdentity(current) !== c4MeasurementIdentity(run)) {
    throw new ConfigError(`retry C4 artifact does not match a current cell: ${path}`);
  }
  return run;
}

function readRetryEvents(path: string, runId: string): C1Event[] {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    throw new ConfigError(`retry C1 artifact is unavailable: ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
  const events = text.split("\n").filter((line) => line.length > 0).map((line, index) => {
    try {
      return validateC1Event(JSON.parse(line));
    } catch (error) {
      throw new ConfigError(`retry C1 artifact is invalid: ${path}:${index + 1}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  if (events.some((event) => event.run_id !== runId)) throw new ConfigError(`retry C1 run_id does not match ${path}`);
  const sequences = events.map((event) => event.seq).sort((left, right) => left - right);
  if (sequences.some((seq, index) => seq !== index)) throw new ConfigError(`retry C1 sequence has a gap or duplicate: ${path}`);
  return events;
}

function portableRetryRun(run: C4Run): C4Run {
  return {
    ...run,
    events_file: "events.jsonl",
    adapter_result: {
      ...run.adapter_result,
      artifacts: {
        ...run.adapter_result.artifacts,
        stdoutPath: "stdout.log",
        stderrPath: "stderr.log",
        ...(run.adapter_result.artifacts.toolLogPath === undefined ? {} : { toolLogPath: "tool-events.jsonl" }),
      },
    },
    verification: { ...run.verification, logPath: "verify.log" },
  };
}

// Versioned schema allowlist, deliberately separate from the runner's private
// copy inventory. Adding a private artifact must not silently widen this gate.
const EMPTY_RETRY_FILES_V1 = [
  "run.json", "events.jsonl", "stdout.log", "stderr.log", "tool-events.jsonl", "verify.log",
  "prompt.md", "verifier.json", "verify.sh", "agent-conditions.json", "verifier-conditions.json",
  "execution-conditions.json", "events.jsonl.upstream.jsonl", "candidate.patch", "candidate-evidence.json",
] as const;
function emptyRetryMetadata(attemptPath: string, attemptName: string, entries: string[]): string {
  const fail = (): never => { throw new ConfigError(`retry without C4 requires a strictly all-missing manifest: ${attemptPath}`); };
  if (entries.length !== 1 || entries[0] !== "manifest.json") fail();
  const path = join(attemptPath, "manifest.json");
  let fd: number | undefined;
  try {
    fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const info = fstatSync(fd);
    if (!info.isFile() || info.size > 16 * 1024) fail();
    const bytes = readFileSync(fd);
    const value: unknown = JSON.parse(bytes.toString("utf8"));
    const object = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
    if (!object(value) || Object.keys(value).length !== 3 || value.schema_version !== 1
      || !Number.isSafeInteger(value.attempt) || (value.attempt as number) < 0
      || `attempt-${value.attempt}` !== attemptName || !object(value.files)) fail();
    const record = value as { attempt: number; files: Record<string, unknown> };
    if (Object.keys(record.files).length !== EMPTY_RETRY_FILES_V1.length) fail();
    for (const name of EMPTY_RETRY_FILES_V1) {
      const item = record.files[name];
      if (!object(item) || Object.keys(item).length !== 1 || item.status !== "missing") fail();
    }
    // Missing observations are not proof that setup used no model or money.
    // Keep this separate from retries/ so C4-based measured populations cannot
    // acquire a fabricated run, outcome, token count or zero-cost observation.
    return `${JSON.stringify({
      schema_version: 1, attempt: record.attempt, status: "unmeasured",
      reason: "all-retained-attempt-artifacts-missing", spend_usd: null,
      included_in_measured_counts: false,
      private_manifest_sha256: `sha256:${createHash("sha256").update(bytes).digest("hex")}`,
    }, null, 2)}\n`;
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(`invalid empty retry manifest: ${attemptPath}`);
  } finally { closeEvidenceDescriptor(fd); }
}

function copyRetryEvidence(resultsRoot: string, destinationRoot: string, currentRuns: Map<string, C4Run>): void {
  const visit = (directory: string): void => {
    for (const name of readdirSync(directory)) {
      const source = join(directory, name);
      const info = lstatSync(source);
      if (info.isSymbolicLink()) throw new ConfigError(`results tree contains a symlink: ${source}`);
      if (!info.isDirectory()) continue;
      if (name === "workspace") continue;
      if (name !== ".attempts") {
        visit(source);
        continue;
      }
      const cellPath = directory;
      const relativeCell = relative(resultsRoot, cellPath);
      if (relativeCell === "" || relativeCell.startsWith("..")) throw new ConfigError(`retry cell escapes results tree: ${cellPath}`);
      for (const attemptName of readdirSync(source)) {
        const attemptPath = join(source, attemptName);
        const attemptInfo = lstatSync(attemptPath);
        if (attemptInfo.isSymbolicLink() || !attemptInfo.isDirectory() || !/^attempt-[0-9]+$/.test(attemptName)) {
          throw new ConfigError(`retry attempt directory is invalid: ${attemptPath}`);
        }
        const entries = readdirSync(attemptPath);
        for (const entryName of entries) {
          const entryPath = join(attemptPath, entryName);
          const entryInfo = lstatSync(entryPath);
          if (entryInfo.isSymbolicLink()) throw new ConfigError(`retry evidence is a symlink: ${entryPath}`);
          if (entryInfo.isDirectory()) throw new ConfigError(`retry evidence contains an unpublished directory: ${entryPath}`);
        }
        if (!entries.includes("run.json")) {
          const metadata = emptyRetryMetadata(attemptPath, attemptName, entries);
          writeReleaseFile(join(destinationRoot, "unmeasured-retries", relativeCell, `${attemptName}.json`), metadata);
          continue;
        }
        const run = readRetryRun(join(attemptPath, "run.json"), currentRuns);
        const eventPath = join(attemptPath, "events.jsonl");
        const events = readRetryEvents(eventPath, run.run_id);
        const destination = join(destinationRoot, "retries", relativeCell, attemptName);
        writeReleaseFile(join(destination, "run.json"), `${JSON.stringify(portableRetryRun(run), null, 2)}\n`);
        writeReleaseFile(join(destination, "events.jsonl"), `${events.map((event) => redactReleaseJson(JSON.stringify(event), eventPath)).join("\n")}\n`);
        for (const name of RETRY_EVIDENCE) {
          if (name === "run.json" || name === "events.jsonl") continue;
          const evidence = join(attemptPath, name);
          if (!existsRegularFile(evidence)) {
            if (name === "tool-events.jsonl" && run.adapter_result.artifacts.toolLogPath === undefined) continue;
            throw new ConfigError(`retry evidence is unavailable: ${evidence}`);
          }
          copyEvidence(evidence, attemptPath, join(destination, name), RETRY_LOGS.has(name) ? "text" : false);
        }
      }
    }
  };
  visit(resultsRoot);
}

function existsRegularFile(path: string): boolean {
  try {
    const info = lstatSync(path);
    return info.isFile() && !info.isSymbolicLink();
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return false;
    throw new ConfigError(`cannot inspect retry evidence: ${path}`);
  }
}

/** Copy runner state, retry evidence, and displaced anomaly evidence beside results. */
export function copySanitizedProvenance(
  resultsDir: string,
  statePath: string,
  destinationRoot: string,
  replacements: ReadonlyMap<string, LoadedCell> = new Map(),
  runWindowLedgerPath?: string,
): void {
  const resultsRoot = resolve(resultsDir);
  const cells = loadResultsTree(resultsRoot);
  const destination = requireEmptyDestination(destinationRoot);
  const state = resolve(statePath);
  if (!existsRegularFile(state)) throw new ConfigError(`runner state is unavailable: ${statePath}`);
  try {
    JSON.parse(readFileSync(state, "utf8"));
  } catch (error) {
    throw new ConfigError(`runner state is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  copyEvidence(state, dirname(state), join(destination, "runner-state.json"));
  if (runWindowLedgerPath !== undefined) {
    const ledger = resolve(runWindowLedgerPath);
    if (!existsRegularFile(ledger)) throw new ConfigError(`run-window ledger is unavailable: ${runWindowLedgerPath}`);
    copyEvidence(ledger, dirname(ledger), join(destination, "run-window-ledger.json"));
  }
  const currentRuns = new Map(cells.map((cell) => [cell.run.run_id, cell.run]));
  copyRetryEvidence(resultsRoot, destination, currentRuns);
  if (replacements.size > 0) {
    const anomalyRoot = join(destination, "anomalies");
    for (const originalRunId of replacements.keys()) {
      const original = cells.find((cell) => cell.run.run_id === originalRunId);
      if (original === undefined) throw new ConfigError(`anomaly replacement references an unknown current run: ${originalRunId}`);
      copyCell(original, resultsRoot, anomalyRoot, relative(resultsRoot, dirname(resolve(original.runPath))));
    }
    writeReleaseFile(join(destination, "resolved-replacements.json"), `${JSON.stringify({
      version: 1,
      replacements: [...replacements.entries()].map(([originalRunId, replacement]) => ({
        original_run_id: originalRunId,
        replacement_run_id: replacement.run.run_id,
      })),
    }, null, 2)}\n`);
  }
}

/** Copy only validated C4/C1 and declared log evidence; never copy workspaces or prompts. */
/** Copy validated results, optionally replacing current cells for publication. */
export function copySanitizedResults(resultsDir: string, destinationRoot: string, replacements: ReadonlyMap<string, LoadedCell> = new Map()): void {
  const resultsRoot = resolve(resultsDir);
  let rootInfo: Stats;
  try {
    rootInfo = lstatSync(resultsRoot);
  } catch (error) {
    throw new ConfigError(`results directory is unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) throw new ConfigError(`results directory is unavailable: ${resultsDir}`);
  const cells = loadResultsTree(resultsRoot);
  if (cells.length === 0) throw new ConfigError("results tree contains no cells");
  const destination = requireEmptyDestination(destinationRoot);
  for (const cell of cells) {
    const replacement = replacements.get(cell.run.run_id);
    copyCell(replacement ?? cell, resultsRoot, destination, relative(resultsRoot, dirname(resolve(cell.runPath))));
  }
}


/** Copy the required validation proof without workspaces, prompts, or undeclared files. */
export function copySanitizedValidation(validationRoot: string, destinationRoot: string, definition: unknown, campaignResults?: string): CampaignValidationSummary {
  validateCampaignValidation(validationRoot, definition, campaignResults);
  const source = resolve(validationRoot);
  const destination = requireEmptyDestination(destinationRoot);
  copyEvidence(join(source, "state.json"), source, join(destination, "state.json"));
  copySanitizedResults(join(source, "results"), join(destination, "results"));
  return validateCampaignValidation(destination, definition, campaignResults);
}
