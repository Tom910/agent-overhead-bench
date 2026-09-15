#!/usr/bin/env node
import { existsSync, lstatSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, relative, resolve } from "node:path";

const OUTCOMES = new Set(["completed", "timeout", "adapter_error", "verify_error"]);

function usage() {
  return "Usage: scripts/s3-calibration-summary.mjs CALIBRATION_ROOT... [--out FILE]";
}

function parseArgs(args) {
  const roots = [];
  let out;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--out") {
      out = args[++index];
      if (!out) throw new Error("--out requires a file path");
    } else if (arg === "--help" || arg === "-h") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else if (arg.startsWith("-")) {
      throw new Error(`unknown option: ${arg}`);
    } else {
      roots.push(resolve(arg));
    }
  }
  if (roots.length === 0) throw new Error(usage());
  return { roots, out };
}

function findRunFiles(directory) {
  const files = [];
  function visit(current) {
    const currentInfo = lstatSync(current);
    if (currentInfo.isSymbolicLink() || !currentInfo.isDirectory()) throw new Error(`calibration root contains an invalid directory: ${current}`);
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      // A measured result directory contains the private agent workspace. The
      // Docker adapters intentionally place dependency links there, but that
      // workspace is not calibration evidence and must not be traversed.
      if (entry.name === "workspace" && entry.isDirectory()) continue;
      if (entry.isSymbolicLink()) throw new Error(`calibration root contains a symlink: ${path}`);
      if (entry.isDirectory()) visit(path);
      else if (entry.isFile() && entry.name === "run.json") files.push(path);
    }
  }
  visit(directory);
  return files.sort();
}

function numberOrNull(value, label) {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${label} must be a finite number or null`);
  return value;
}

function fileSha256(path) {
  return `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
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

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function safeEvidencePath(runPath, value) {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0")) return null;
  const base = dirname(runPath);
  const candidate = resolve(base, value);
  const withinBase = candidate === base || candidate.startsWith(`${base}/`);
  if (!withinBase) return null;
  return candidate;
}

function validateC1Evidence(runPath, run, eventsPath, issues) {
  if (!eventsPath || !existsSync(eventsPath)) {
    issues.push("events_file is missing or escapes the result directory");
    return 0;
  }
  let lines;
  try {
    lines = readFileSync(eventsPath, "utf8").split("\n").filter((line) => line.trim().length > 0);
  } catch (error) {
    issues.push(`events_file cannot be read: ${error instanceof Error ? error.message : String(error)}`);
    return 0;
  }
  let successful = 0;
  for (const [index, line] of lines.entries()) {
    let event;
    try {
      event = JSON.parse(line);
    } catch (error) {
      issues.push(`events_file line ${index + 1} is not JSON: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    if (!isRecord(event)) {
      issues.push(`events_file line ${index + 1} is not an object`);
      continue;
    }
    for (const key of ["v", "run_id", "seq", "t_req_start", "t_req_body_end", "t_upstream_sent", "t_first_byte", "t_last_byte", "duration_ms", "method", "path", "protocol", "model_requested", "model_served", "status", "streamed", "usage", "usage_source", "error"]) {
      if (!(key in event)) issues.push(`events_file line ${index + 1} is missing ${key}`);
    }
    if (event.v !== 1 || event.run_id !== run.run_id || !Number.isInteger(event.seq) || event.seq < 0) {
      issues.push(`events_file line ${index + 1} has invalid C1 identity`);
    }
    const times = [event.t_req_start, event.t_req_body_end, event.t_upstream_sent, event.t_first_byte, event.t_last_byte];
    if (times.some((time) => !finiteNumber(time)) || times.some((time, index) => index > 0 && time < times[index - 1]) || !finiteNumber(event.duration_ms) || event.duration_ms < 0) {
      issues.push(`events_file line ${index + 1} has invalid C1 timing`);
    }
    if (!Number.isInteger(event.status) || (event.status !== 0 && (event.status < 100 || event.status > 599))) issues.push(`events_file line ${index + 1} has invalid status`);
    const path = typeof event.path === "string" ? event.path.split("?")[0] : "";
    const modelAttempt = event.method === "POST" && ((event.protocol === "anthropic_messages" && (path.includes("/v1/messages") || path.endsWith("/messages"))) || (event.protocol === "openai_chat" && path.includes("/chat/completions")) || (event.protocol === "openai_responses" && path.includes("/responses")));
    if (modelAttempt && event.status >= 200 && event.status < 300 && event.error === null) successful += 1;
  }
  return successful;
}

function validateSourceBinding(runPath, root, run, issues) {
  if (run.task_source === "local-development") {
    issues.push("local-development is not an approved calibration source");
    return;
  }
  const manifestPath = join(root, "deepswe-source-manifest.json");
  if (!existsSync(manifestPath)) {
    issues.push("deepswe-source-manifest.json is missing");
    return;
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (error) {
    issues.push(`source manifest cannot be parsed: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }
  if (!isRecord(manifest) || manifest.source_adapter !== "deepswe" || manifest.repository !== run.task_repository || manifest.revision !== run.task_revision || !Array.isArray(manifest.tasks)) {
    issues.push("run does not match the pinned DeepSWE source manifest");
    return;
  }
  const task = manifest.tasks.find((candidate) => isRecord(candidate) && candidate.id === run.task_id);
  if (!task) {
    issues.push("task_id is absent from the source manifest");
    return;
  }
  if (task.workspace_revision !== run.task_base_revision) issues.push("task_base_revision does not match the prepared workspace revision in the source manifest");
  const agent = isRecord(task.agent_images) ? task.agent_images[run.tool] : undefined;
  if (!isRecord(agent) || agent.image_digest !== run.task_environment?.agent_image_digest) {
    issues.push("agent image provenance does not match the source manifest");
  }
  if (task.verifier_image_digest !== run.container?.verifier_image_digest) {
    issues.push("verifier image provenance does not match the source manifest");
  }
}

function validateEvidence(runPath, root, run) {
  const issues = [];
  const required = ["v", "run_id", "tool", "tool_version", "task_id", "task_source", "task_revision", "task_regime", "condition", "rep", "model", "ori_version", "tool_visibility", "anchors", "adapter_result", "events_file", "verification", "container", "task_environment", "host", "spend_usd_estimate", "price_book", "outcome"];
  for (const key of required) if (!(key in run)) issues.push(`C4 run is missing ${key}`);
  if (run.v !== 1 || !OUTCOMES.has(run.outcome) || !["short", "long", "extended"].includes(run.task_regime) || !["pinned", "default"].includes(run.condition) || !["none", "partial", "full"].includes(run.tool_visibility)) issues.push("C4 run has invalid contract enums");
  if (!isRecord(run.adapter_result) || !Number.isInteger(run.adapter_result?.exitCode) || run.adapter_result.exitCode < 0) issues.push("adapter_result.exitCode is invalid");
  if (!isRecord(run.verification) || !Number.isInteger(run.verification?.exit) || run.verification.exit < 0 || !finiteNumber(run.verification?.duration_ms) || run.verification.duration_ms < 0) issues.push("verification evidence is invalid");
  if (!isRecord(run.container) || typeof run.container?.verifier_image_digest !== "string") issues.push("container verifier provenance is missing");
  if (!isRecord(run.task_environment) || run.task_environment?.network !== "disabled") issues.push("task environment is not network-disabled");
  if (!isRecord(run.host) || !finiteNumber(run.host?.ram_gb) || run.host.ram_gb < 0) issues.push("host evidence is invalid");
  const eventsPath = safeEvidencePath(runPath, run.events_file);
  const successfulEvents = validateC1Evidence(runPath, run, eventsPath, issues);
  const verificationPath = safeEvidencePath(runPath, run.verification?.logPath);
  if (!verificationPath || !existsSync(verificationPath)) issues.push("verification log is missing or escapes the result directory");
  if (run.outcome === "completed" && (run.adapter_result?.exitCode !== 0 || run.verification?.exit !== 0)) issues.push("completed run has a nonzero adapter or verifier exit");
  if (run.outcome === "completed" && successfulEvents === 0) issues.push("completed run has no successful model event");
  validateSourceBinding(runPath, root, run, issues);
  return issues;
}

function readRecord(path, root, rootIndex) {
  let value;
  try {
    value = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new Error(`cannot parse ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`${path} must contain a JSON object`);
  const run = value;
  if (run.tool_configuration !== undefined) throw new Error("compatibility runs cannot qualify default-tool calibration");
  for (const key of ["run_id", "tool", "task_id", "task_source", "task_revision", "task_regime", "condition", "model", "price_book", "outcome"]) {
    if (typeof run[key] !== "string" || run[key].length === 0) throw new Error(`${path} has invalid ${key}`);
  }
  if (run.task_repository !== undefined && (typeof run.task_repository !== "string" || run.task_repository.length === 0)) {
    throw new Error(`${path} has invalid task_repository`);
  }
  if (!OUTCOMES.has(run.outcome)) throw new Error(`${path} has invalid outcome ${run.outcome}`);
  if (!["short", "long", "extended"].includes(run.task_regime)) throw new Error(`${path} has invalid task_regime`);
  if (typeof run.verification !== "object" || run.verification === null || !Number.isInteger(run.verification.exit)) throw new Error(`${path} has invalid verification.exit`);
  if (typeof run.adapter_result !== "object" || run.adapter_result === null || !Number.isInteger(run.adapter_result.exitCode)) throw new Error(`${path} has invalid adapter_result.exitCode`);
  if (!Number.isInteger(run.rep) || run.rep < 0) throw new Error(`${path} has invalid rep`);
  if (run.condition !== "pinned" && run.condition !== "default") throw new Error(`${path} has invalid condition`);
  const attemptMatch = relative(root, path).match(/(?:^|[\\/])\.attempts[\\/]attempt-(\d+)[\\/]run\.json$/);
  const validationIssues = validateEvidence(path, root, run);
  const passed = run.outcome === "completed" && run.verification.exit === 0 && run.adapter_result.exitCode === 0 && validationIssues.length === 0;
  return {
    root_index: rootIndex,
    path: relative(root, path).split("\\").join("/"),
    run_sha256: fileSha256(path),
    kind: attemptMatch ? "retry" : "final",
    attempt: attemptMatch ? Number(attemptMatch[1]) : null,
    run_id: run.run_id,
    tool: run.tool,
    task_id: run.task_id,
    task_source: run.task_source,
    task_repository: run.task_repository ?? "",
    condition: run.condition,
    rep: run.rep,
    task_revision: run.task_revision,
    task_regime: run.task_regime,
    model: run.model,
    price_book: run.price_book,
    outcome: run.outcome,
    verification_exit: run.verification.exit,
    adapter_exit_code: run.adapter_result.exitCode,
    spend_usd: numberOrNull(run.spend_usd_estimate, `${path}.spend_usd_estimate`),
    validation_issues: validationIssues,
    passed,
  };
}

function roundUsd(value) {
  return Math.round(value * 100000000) / 100000000;
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

function summarizeTools(records) {
  return [...new Set(records.map((record) => record.tool))].sort().map((tool) => {
    const toolRecords = records.filter((record) => record.tool === tool);
    const outcomes = {};
    let spend = 0;
    for (const record of toolRecords) {
      outcomes[record.outcome] = (outcomes[record.outcome] ?? 0) + 1;
      if (record.spend_usd !== null) spend += record.spend_usd;
    }
    return {
      tool,
      attempts: toolRecords.length,
      passed: toolRecords.some((record) => record.passed),
      outcomes: Object.fromEntries(Object.entries(outcomes).sort(([left], [right]) => left.localeCompare(right))),
      spend_usd: roundUsd(spend),
    };
  });
}

function summarizeCandidate(records, taskId) {
  const taskRecords = records.filter((record) => record.task_id === taskId);
  const grouped = new Map();
  for (const record of taskRecords) {
    const key = JSON.stringify(calibrationIdentity(record));
    const group = grouped.get(key) ?? [];
    group.push(record);
    grouped.set(key, group);
  }
  const calibrationGroups = [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([key, group]) => {
    const tools = summarizeTools(group);
    return {
      identity: JSON.parse(key),
      tools,
      two_cli_pass: tools.filter((tool) => tool.passed).length >= 2,
    };
  });
  return {
    task_id: taskId,
    source_revisions: [...new Set(taskRecords.map((record) => record.task_revision))].sort(),
    regimes: [...new Set(taskRecords.map((record) => record.task_regime))].sort(),
    tools: summarizeTools(taskRecords),
    calibration_groups: calibrationGroups,
    two_cli_pass: calibrationGroups.some((group) => group.two_cli_pass),
  };
}

function loadStateSpend(root) {
  const statePath = join(root, "state.json");
  if (!existsSync(statePath)) return null;
  let value;
  try {
    value = JSON.parse(readFileSync(statePath, "utf8"));
  } catch (error) {
    throw new Error(`cannot parse ${statePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
  return numberOrNull(value?.spentUsd, `${statePath}.spentUsd`);
}

function buildSummary(rootPaths) {
  const records = [];
  const roots = rootPaths.map((root, rootIndex) => {
    if (!existsSync(root)) throw new Error(`calibration root does not exist: ${root}`);
    const results = existsSync(join(root, "results")) ? join(root, "results") : root;
    const runFiles = findRunFiles(results);
    const rootRecords = runFiles.map((path) => readRecord(path, root, rootIndex));
    records.push(...rootRecords);
    return { root_index: rootIndex, root_sha256: rootEvidenceSha256(root, runFiles), state_spent_usd: loadStateSpend(root), record_count: rootRecords.length };
  });
  records.sort((left, right) => left.root_index - right.root_index || left.task_id.localeCompare(right.task_id) || left.tool.localeCompare(right.tool) || (left.attempt ?? -1) - (right.attempt ?? -1) || left.path.localeCompare(right.path));
  const taskIds = [...new Set(records.map((record) => record.task_id))].sort();
  const stateSpends = roots.map((root) => root.state_spent_usd).filter((value) => value !== null);
  return {
    v: 1,
    state_spent_usd: stateSpends.length === 0 ? null : roundUsd(stateSpends.reduce((sum, value) => sum + value, 0)),
    roots,
    records,
    candidates: taskIds.map((taskId) => summarizeCandidate(records, taskId)),
  };
}

try {
  const { roots, out } = parseArgs(process.argv.slice(2));
  const summary = `${JSON.stringify(buildSummary(roots), null, 2)}\n`;
  if (out) writeFileSync(resolve(out), summary);
  else process.stdout.write(summary);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
