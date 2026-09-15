#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const SHA256 = /^sha256:[0-9a-f]{64}$/;
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function usage() {
  return "Usage: scripts/s3-calibration-attestation.mjs SUMMARY SOURCE_MANIFEST TASK_SOURCE MODEL REGIME CONDITION PRICE_BOOK TOOLS --root ROOT... --out FILE";
}

function fail(message) {
  throw new Error(message);
}

function digest(bytes) {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function sourceContentSha256(source) {
  const { review: _review, ...content } = source;
  return digest(Buffer.from(canonicalJson(content)));
}

function readRegularJson(path, label) {
  if (!existsSync(path) || lstatSync(path).isSymbolicLink() || !lstatSync(path).isFile()) fail(`${label} is missing or is not a regular file`);
  const bytes = readFileSync(path);
  try {
    return { value: JSON.parse(bytes.toString("utf8")), bytes };
  } catch {
    fail(`${label} is not valid JSON`);
  }
}

function nonEmptyString(value, label) {
  if (typeof value !== "string" || value.length === 0) fail(`${label} must be a non-empty string`);
  return value;
}

function findRunFiles(directory) {
  const files = [];
  function visit(current) {
    if (!existsSync(current) || lstatSync(current).isSymbolicLink() || !lstatSync(current).isDirectory()) fail(`calibration root is missing or is not a real directory: ${current}`);
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      // A measured result may contain the private agent workspace. Its dependency
      // links are outside the evidence tree and must not affect attestation.
      if (entry.name === "workspace" && entry.isDirectory()) continue;
      if (entry.isSymbolicLink()) fail(`calibration root contains a symlink: ${path}`);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile() && entry.name === "run.json") files.push(path);
    }
  }
  visit(directory);
  return files.sort();
}

function rootEvidenceSha256(root, files) {
  const hash = createHash("sha256");
  for (const path of files) {
    hash.update(relative(root, path).split("\\").join("/"));
    hash.update("\0");
    hash.update(readFileSync(path));
    hash.update("\0");
  }
  return `sha256:${hash.digest("hex")}`;
}

function parseArgs(args) {
  if (args.includes("--help") || args.includes("-h")) {
    process.stdout.write(`${usage()}\n`);
    process.exit(0);
  }
  if (args.length < 8) fail(usage());
  const positional = args.slice(0, 8);
  const roots = [];
  let out;
  for (let index = 8; index < args.length; index += 1) {
    if (args[index] === "--root") {
      const root = args[++index];
      if (!root) fail("--root requires a directory");
      roots.push(resolve(root));
    } else if (args[index] === "--out") {
      out = args[++index];
      if (!out) fail("--out requires a file");
    } else {
      fail(`unknown option: ${args[index]}`);
    }
  }
  if (roots.length === 0) fail("at least one --root is required");
  if (!out) fail("--out is required");
  const tools = positional[7].split(",");
  if (tools.length < 2 || tools.some((tool) => !SAFE_ID.test(tool)) || new Set(tools).size !== tools.length) {
    fail("TOOLS must contain at least two unique safe adapter names");
  }
  if (!["short", "long", "extended"].includes(positional[4])) fail("REGIME must be short, long, or extended");
  if (positional[5] !== "pinned" && positional[5] !== "default") fail("CONDITION must be pinned or default");
  return { summaryPath: resolve(positional[0]), sourceManifestPath: resolve(positional[1]), taskSource: nonEmptyString(positional[2], "TASK_SOURCE"), model: positional[3], regime: positional[4], condition: positional[5], priceBook: positional[6], tools, roots, out: resolve(out) };
}

function sortedUniqueStrings(value, label) {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== "string" || !SAFE_ID.test(item))) fail(`${label} must contain safe task ids`);
  if (new Set(value).size !== value.length) fail(`${label} contains duplicate ids`);
  return [...value].sort();
}

function assertWithin(root, candidate, label) {
  const resolvedRoot = resolve(root);
  const resolvedCandidate = resolve(candidate);
  const escaped = relative(resolvedRoot, resolvedCandidate).startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) || relative(resolvedRoot, resolvedCandidate) === "..";
  if (escaped || resolvedCandidate === resolvedRoot) fail(`${label} escapes its calibration root`);
  return resolvedCandidate;
}

function calibrationIdentity(record) {
  return {
    task_id: record.task_id,
    task_source: record.task_source,
    task_repository: record.task_repository,
    task_revision: record.task_revision,
    task_regime: record.task_regime,
    model: record.model,
    condition: record.condition,
    price_book: record.price_book,
  };
}

function assertRecordIdentity(record, expected, tools) {
  for (const [key, value] of Object.entries(expected)) {
    if (record[key] !== value) fail(`calibration record ${record.run_id} has mismatched ${key}`);
  }
  nonEmptyString(record.task_source, `calibration record ${record.run_id}.task_source`);
  if (!tools.includes(record.tool)) fail(`calibration record ${record.run_id} uses an unselected tool: ${record.tool}`);
  if (!SHA256.test(record.run_sha256)) fail(`calibration record ${record.run_id} has no valid run_sha256`);
}

function validatePassedRun(record, root) {
  if (typeof record.root_index !== "number" || !Number.isInteger(record.root_index) || record.root_index < 0 || record.root_index >= root.length) fail(`calibration record ${record.run_id} has an invalid root_index`);
  const path = nonEmptyString(record.path, `calibration record ${record.run_id}.path`);
  const runPath = assertWithin(root[record.root_index], join(root[record.root_index], path), `calibration record ${record.run_id}.path`);
  if (!runPath.endsWith("/run.json") && !runPath.endsWith("\\run.json")) fail(`calibration record ${record.run_id}.path must point to run.json`);
  const { value, bytes } = readRegularJson(runPath, `calibration run ${record.run_id}`);
  if (value.tool_configuration !== undefined) fail("compatibility runs cannot qualify default-tool calibration");
  if (digest(bytes) !== record.run_sha256) fail(`calibration run digest does not match summary for ${record.run_id}`);
  if (value.run_id !== record.run_id || value.tool !== record.tool || value.task_id !== record.task_id || value.model !== record.model ||
    value.task_revision !== record.task_revision || value.task_regime !== record.task_regime || value.condition !== record.condition ||
    value.price_book !== record.price_book || value.outcome !== "completed" || value.adapter_result?.exitCode !== 0 || value.verification?.exit !== 0) {
    fail(`calibration run ${record.run_id} does not match its qualifying summary record`);
  }
  return { tool: record.tool, run_id: record.run_id, run_sha256: record.run_sha256, root_index: record.root_index, path, identity: calibrationIdentity(record) };
}

function buildAttestation(options) {
  const summaryFile = readRegularJson(options.summaryPath, "calibration summary");
  const sourceFile = readRegularJson(options.sourceManifestPath, "source manifest");
  const summary = summaryFile.value;
  const source = sourceFile.value;
  if (summary?.v !== 1 || !Array.isArray(summary.records)) fail("calibration summary has an invalid shape");
  if (source?.version !== 1 || typeof source.source_adapter !== "string" || typeof source.repository !== "string" || typeof source.revision !== "string" || !Array.isArray(source.tasks)) {
    fail("source manifest has an invalid shape");
  }
  if (!Array.isArray(summary.roots) || summary.roots.length !== options.roots.length) fail("calibration summary roots do not match --root arguments");
  for (const [index, root] of options.roots.entries()) {
    const results = existsSync(join(root, "results")) ? join(root, "results") : root;
    const files = findRunFiles(results);
    const summaryRoot = summary.roots[index];
    if (summaryRoot?.root_index !== index || summaryRoot.root_sha256 !== rootEvidenceSha256(root, files) || summaryRoot.record_count !== files.length) {
      fail(`calibration root ${index} does not match its summary binding`);
    }
  }
  const selectedTaskIds = sortedUniqueStrings(source.review?.reviewed_task_ids, "source review reviewed_task_ids");
  const sourceTaskIds = new Set(source.tasks.map((task) => task?.id));
  if (selectedTaskIds.some((id) => !sourceTaskIds.has(id))) fail("source review selects a task absent from the source manifest");
  const expected = { task_source: options.taskSource, task_repository: source.repository, task_revision: source.revision, task_regime: options.regime, model: options.model, condition: options.condition, price_book: options.priceBook };
  const recordsByTask = new Map(selectedTaskIds.map((id) => [id, new Map()]));
  const seenRunIds = new Set();
  for (const record of summary.records) {
    if (!record || typeof record !== "object") fail("calibration summary contains a malformed record");
    nonEmptyString(record.run_id, "calibration record.run_id");
    if (seenRunIds.has(record.run_id)) fail(`calibration summary contains duplicate run_id: ${record.run_id}`);
    seenRunIds.add(record.run_id);
    if (!recordsByTask.has(record.task_id)) fail(`calibration summary contains an unselected task: ${record.task_id}`);
    const taskRecords = recordsByTask.get(record.task_id);
    assertRecordIdentity(record, { ...expected, task_id: record.task_id }, options.tools);
    if (record.passed === true && (!Array.isArray(record.validation_issues) || record.validation_issues.length !== 0)) fail(`passed calibration record has validation issues: ${record.run_id}`);
    if (record.passed === true) {
      const qualifying = validatePassedRun(record, options.roots);
      if (!taskRecords.has(record.tool)) taskRecords.set(record.tool, qualifying);
    }
  }
  const tasks = selectedTaskIds.map((taskId) => {
    const qualifying = recordsByTask.get(taskId);
    if (qualifying.size < 2) fail(`calibration task ${taskId} lacks two distinct passing CLIs`);
    const first = [...qualifying.values()][0];
    return {
      task_id: taskId,
      identity: first.identity,
      qualifying_runs: [...qualifying.values()].sort((left, right) => left.tool.localeCompare(right.tool)),
    };
  });
  return {
    v: 1,
    source_adapter: source.source_adapter,
    source_repository: source.repository,
    source_revision: source.revision,
    task_source: options.taskSource,
    model: options.model,
    task_regime: options.regime,
    condition: options.condition,
    price_book: options.priceBook,
    included_tools: [...options.tools].sort(),
    selected_task_ids: selectedTaskIds,
    calibration_summary_sha256: digest(summaryFile.bytes),
    source_manifest_sha256: sourceContentSha256(source),
    tasks,
  };
}

try {
  const options = parseArgs(process.argv.slice(2));
  const attestation = buildAttestation(options);
  writeFileSync(options.out, `${JSON.stringify(attestation, null, 2)}\n`, { mode: 0o600 });
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
