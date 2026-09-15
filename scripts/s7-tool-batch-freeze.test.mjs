import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test from "node:test";
import { MODEL, PRICE_BOOK, SOURCE_REPOSITORY, SOURCE_REVISION, SPEND_PER_CELL, TOOLS,
  createTaskPack, createOfficialRun, bindCalibrationReview, createRunWindowLedger, createReplacementLedger, checksumFiles } from "./test-fixtures/official-campaign.mjs";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("..", import.meta.url));
const digest = (bytes) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
const json = async (path) => JSON.parse(await readFile(path, "utf8"));
const writeJson = (path, value) => writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
const stripArgs = ["--experimental-strip-types", "--no-warnings", "--experimental-loader", join(root, "scripts/ts-source-loader.mjs"), "--input-type=module"];

async function fixture(reps = 5, withRetry = false) {
  const temp = await mkdtemp(join(tmpdir(), "aob-batch-freeze-"));
  const { sourcePath, taskPath, taskIds } = await createTaskPack(join(temp, "tasks"));
  const validation = join(temp, "provenance", "validation");
  const definition = {
    executionProtocol: "tool-batches-v1", capUsd: 1,
    validationSpendUsd: Array.from({ length: taskIds.length * TOOLS.length }, () => SPEND_PER_CELL).reduce((a, b) => a + b, 0),
    model: MODEL, priceBook: PRICE_BOOK, tools: TOOLS, conditions: ["pinned"], reps,
    tasks: taskIds.map((id) => ({ id, source: "public-task-pack", sourceRepository: SOURCE_REPOSITORY,
      revision: SOURCE_REVISION, regime: "short", timeoutS: 300, verifier: "script", environment: { kind: "prepared-task-pack", network: "disabled" } })),
  };
  const validationCells = [];
  for (const tool of TOOLS) for (const taskId of taskIds) {
    validationCells.push(await createOfficialRun(validation, tool, taskId, 0, -60_000 + validationCells.length * 200));
  }
  await writeJson(join(validation, "state.json"), { version: 1, seed: 1, definition_key: JSON.stringify({ ...definition, reps: 1 }), spentUsd: definition.validationSpendUsd, cells: validationCells });
  const workspace = join(validation, "results", "pinned", TOOLS[0], taskIds[0], "rep-0", "workspace");
  await mkdir(workspace);
  await writeFile(join(workspace, "prompt.md"), "PRIVATE_VALIDATION_WORKSPACE");
  const cells = [];
  for (const [toolIndex, tool] of TOOLS.entries()) for (const taskId of taskIds) for (let rep = 0; rep < reps; rep++) {
    cells.push(await createOfficialRun(temp, tool, taskId, rep, toolIndex * 60_000 + (cells.length % (taskIds.length * reps)) * 200));
  }
  const { attestationPath, calibrationSummaryPath } = await bindCalibrationReview(temp, sourcePath, taskPath, taskIds);
  const statePath = join(temp, "state.json");
  const state = { version: 1, seed: 1, definition_key: JSON.stringify(definition), spentUsd: SPEND_PER_CELL * cells.length, cells,
    run_window_session_id: "session-official-fixture", run_window_ledger: "provenance/run-window-ledger.json" };
  await writeJson(statePath, state);
  await createRunWindowLedger(temp, cells, statePath);
  const ledgerPath = join(temp, "provenance", "run-window-ledger.json");
  const ledger = await json(ledgerPath);
  ledger.execution_protocol = "tool-batches-v1";
  ledger.segments = TOOLS.map((tool, index) => {
    const zero = 100_000 * index;
    const wall = Date.parse("2026-08-30T00:00:00.000Z") + index * 60_000;
    const iso = (ms) => new Date(wall + ms).toISOString();
    const selected = cells.filter((cell) => cell.tool === tool);
    return { id: `segment-${index}`, anchor: { wall_clock_iso: iso(0), monotonic_zero: zero },
      start_ms: zero, end_ms: zero + selected.length * 200, start_iso: iso(0), end_iso: iso(selected.length * 200),
      batch_tool: tool, batch_cap_usd: .1, host_start: ledger.host_start, host_end: ledger.host_end,
      attempts: selected.map((cell, i) => ({ id: `segment-${index}:attempt-${i}`, cell_id: cell.id, run_id: cell.id, kind: "current",
        start_ms: zero + i * 200, end_ms: zero + i * 200 + 100, start_iso: iso(i * 200), end_iso: iso(i * 200 + 100), status: "completed" })) };
  });
  ledger.window.end_iso = ledger.segments.at(-1).end_iso;
  await writeJson(ledgerPath, ledger);
  if (withRetry) {
    const cell = cells.filter((cell) => cell.tool === TOOLS[0]).at(-1);
    const current = join(temp, "results", "pinned", cell.tool, cell.task_id, `rep-${cell.rep}`);
    const retry = join(current, ".attempts", "attempt-0");
    await mkdir(retry, { recursive: true });
    for (const file of ["run.json", "events.jsonl", "stdout.log", "stderr.log", "verify.log"]) await cp(join(current, file), join(retry, file));
    const previousRun = await json(join(retry, "run.json"));
    previousRun.outcome = "verify_error"; previousRun.verification.exit = 1;
    await writeJson(join(retry, "run.json"), previousRun);
    const currentRun = await json(join(current, "run.json"));
    const later = new Date(Date.parse(currentRun.anchors.adapter.wall_clock_iso) + 200).toISOString();
    currentRun.anchors.adapter.wall_clock_iso = later; currentRun.anchors.proxy.wall_clock_iso = later;
    currentRun.adapter_result.anchor.wall_clock_iso = later; currentRun.container.started_iso = later;
    await writeJson(join(current, "run.json"), currentRun);
    cell.retries = 1; state.spentUsd += SPEND_PER_CELL;
    await writeJson(statePath, state);
    const segment = ledger.segments[0];
    const previous = segment.attempts.at(-1);
    previous.status = "failed";
    segment.attempts.push({ ...previous, id: `${segment.id}:attempt-${segment.attempts.length}`, kind: "retry", status: "completed",
      start_ms: previous.start_ms + 200, end_ms: previous.end_ms + 200, start_iso: later, end_iso: new Date(Date.parse(later) + 100).toISOString() });
    segment.end_ms += 200; segment.end_iso = new Date(Date.parse(segment.end_iso) + 200).toISOString();
    ledger.state_sha256 = digest(await readFile(statePath));
    const bound = await execFileAsync(process.execPath, [...stripArgs, "-e", `
      import { pathToFileURL } from 'node:url'; import { join } from 'node:path';
      const { bindRunWindowResults } = await import(pathToFileURL(join(process.argv[1], 'packages/runner/src/window-ledger.ts')));
      process.stdout.write(JSON.stringify(bindRunWindowResults(process.argv[2])));
    `, root, join(temp, "results")], { cwd: root });
    ledger.results_binding = JSON.parse(bound.stdout);
    await writeJson(ledgerPath, ledger);
  }
  const rawExport = join(temp, "raw-activity.csv");
  await writeFile(rawExport, `Model,Spend\n${MODEL},${state.spentUsd}\n`);
  const summary = join(temp, "activity-summary.json");
  await execFileAsync(process.execPath, ["scripts/s7-activity-crosscheck.mjs", join(temp, "results"), rawExport, summary, MODEL, PRICE_BOOK, statePath, "2026-08-29T00:00:00.000Z", "2026-08-31T00:00:00.000Z"], { cwd: root });
  const env = { ...process.env, AOB_ALLOW_NONOFFICIAL_FREEZE: "0", AOB_TASK_MANIFEST: taskPath, AOB_SOURCE_MANIFEST: sourcePath,
    AOB_ACTIVITY_SUMMARY: summary, AOB_ACTIVITY_EXPORT: rawExport, AOB_CALIBRATION_ATTESTATION: attestationPath, AOB_CALIBRATION_SUMMARY: calibrationSummaryPath };
  return { temp, validation, definition, cells, ledgerPath, statePath, env, freeze: (name) => execFileAsync("sh", [join(root, "scripts/s7-freeze.sh"), join(temp, "results"), join(temp, name), String(cells.length)], { cwd: root, env, maxBuffer: 4 * 1024 * 1024 }) };
}

async function repack(directory, archive, rebindState = false) {
  await execFileAsync(process.execPath, [...stripArgs, "-e", `
    import { readFileSync, writeFileSync } from 'node:fs';
    import { join } from 'node:path';
    import { pathToFileURL } from 'node:url';
    const root = process.argv[1], checkout = process.argv[2];
    const { computePortableArchiveBinding } = await import(pathToFileURL(join(root, 'packages/report/src/archive-binding.ts')));
    const activity = JSON.parse(readFileSync(join(checkout, 'provenance/activity-export-summary.json'), 'utf8'));
    if (process.argv[3] === 'true') {
      const { archivedActivityBinding } = await import(pathToFileURL(join(root, 'packages/report/src/activity-cli.ts')));
      const { digestText } = await import(pathToFileURL(join(root, 'packages/runner/src/window-ledger.ts')));
      activity.binding = archivedActivityBinding(checkout);
      writeFileSync(join(checkout, 'provenance/activity-export-summary.json'), JSON.stringify(activity));
      const ledgerPath = join(checkout, 'provenance/run-window-ledger.json');
      const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
      ledger.state_sha256 = digestText(readFileSync(join(checkout, 'provenance/runner-state.json')));
      writeFileSync(ledgerPath, JSON.stringify(ledger));
    }
    writeFileSync(join(checkout, 'provenance/archive-binding.json'), JSON.stringify(computePortableArchiveBinding(checkout, activity.binding)));
  `, root, directory, String(rebindState)], { cwd: root });
  const checksums = [];
  for (const file of await checksumFiles(directory)) checksums.push(`${digest(await readFile(join(directory, file))).slice(7)}  ${file}`);
  await writeFile(join(directory, "SHA256SUMS"), `${checksums.join("\n")}\n`);
  await execFileAsync("tar", ["-czf", archive, "-C", directory, "results", "report", "provenance", "SHA256SUMS"]);
  await writeFile(`${archive}.sha256`, `${digest(await readFile(archive)).slice(7)}  ${archive}\n`);
}

async function rejected(operation, pattern) {
  const error = await operation().then(() => null, (error) => error);
  assert.ok(error, "operation should fail closed");
  assert.match(`${error.stderr ?? ""}${error.stdout ?? ""}`, pattern);
}

test("official batch campaign freezes five repetitions and rechecks portable validation evidence", { timeout: 120_000 }, async () => {
  const value = await fixture(5, true);
  try {
    const originalLedger = await json(value.ledgerPath);
    const missingBatch = structuredClone(originalLedger);
    missingBatch.segments.pop(); missingBatch.window.end_iso = missingBatch.segments.at(-1).end_iso;
    await writeJson(value.ledgerPath, missingBatch);
    await rejected(() => value.freeze("missing-batch"), /missing cell|C4 evidence.*unknown/i);
    const drift = structuredClone(originalLedger);
    drift.segments[1].host_end.cpu = "changed-host";
    await writeJson(value.ledgerPath, drift);
    await rejected(() => value.freeze("host-drift"), /host/i);
    const mixed = structuredClone(originalLedger);
    mixed.segments[1].batch_tool = mixed.segments[0].batch_tool;
    await writeJson(value.ledgerPath, mixed);
    await rejected(() => value.freeze("mixed-tool"), /cell tool/i);
    await writeJson(value.ledgerPath, originalLedger);
    const result = await value.freeze("archive");
    assert.match(`${result.stdout}${result.stderr}`, /S7 archive verified/);
    const unpacked = join(value.temp, "unpacked");
    await mkdir(unpacked);
    await execFileAsync("tar", ["-xzf", join(value.temp, "archive"), "-C", unpacked]);
    assert.equal((await json(join(unpacked, "provenance/release-manifest.json"))).execution_protocol, "tool-batches-v1");
    assert.equal((await json(join(unpacked, "provenance/validation/state.json"))).cells.length, TOOLS.length * 8);
    assert.equal((await json(join(unpacked, "provenance/runner-state.json"))).cells.filter((cell) => cell.retries === 1).length, 1);
    assert.match(await readFile(join(unpacked, "report/README.md"), "utf8"), /Tool-by-tool batches.*separate windows/);
    const paths = await checksumFiles(unpacked);
    assert.equal(paths.filter((path) => path.startsWith("results/") && path.endsWith("/run.json")).length, TOOLS.length * 8 * 5);
    assert.ok(paths.every((path) => !path.includes("workspace") && !path.endsWith("prompt.md")));
    assert.equal(paths.filter((path) => path.startsWith("provenance/retries/") && path.endsWith("/run.json")).length, 1);
    const archivedLedgerPath = join(unpacked, "provenance/run-window-ledger.json");
    const archivedLedgerBytes = await readFile(archivedLedgerPath, "utf8");
    const earlyWindow = JSON.parse(archivedLedgerBytes);
    const firstSegment = earlyWindow.segments[0];
    const earlyWall = "2026-08-29T23:58:00.000Z";
    firstSegment.anchor.wall_clock_iso = earlyWall;
    firstSegment.start_iso = earlyWall;
    firstSegment.end_ms += 120_000;
    for (const attempt of firstSegment.attempts) { attempt.start_ms += 120_000; attempt.end_ms += 120_000; }
    earlyWindow.anchor = firstSegment.anchor;
    earlyWindow.window.start_iso = earlyWall;
    await writeJson(archivedLedgerPath, earlyWindow);
    await repack(unpacked, join(value.temp, "late-archived-validation.tar.gz"));
    await rejected(() => execFileAsync("sh", [join(root, "scripts/s7-verify-archive.sh"), "--official", join(value.temp, "late-archived-validation.tar.gz")], { cwd: root }), /validation.*precede|validation.*window/i);
    await writeFile(archivedLedgerPath, archivedLedgerBytes);
    const archivedStatePath = join(unpacked, "provenance/runner-state.json");
    const archivedStateBytes = await readFile(archivedStatePath, "utf8");
    const activityPath = join(unpacked, "provenance/activity-export-summary.json");
    const activityBytes = await readFile(activityPath, "utf8");
    const swapped = JSON.parse(archivedStateBytes);
    const firstCell = swapped.cells.find((cell) => cell.tool === TOOLS[0] && cell.task_id === "official-task-1" && cell.rep === 0);
    const secondCell = swapped.cells.find((cell) => cell.tool === TOOLS[0] && cell.task_id === "official-task-2" && cell.rep === 0);
    [firstCell.task_id, secondCell.task_id] = [secondCell.task_id, firstCell.task_id];
    await writeJson(archivedStatePath, swapped);
    await repack(unpacked, join(value.temp, "swapped-state-identities.tar.gz"), true);
    await rejected(() => execFileAsync("sh", [join(root, "scripts/s7-verify-archive.sh"), "--official", join(value.temp, "swapped-state-identities.tar.gz")], { cwd: root }), /state.*C4|state.*identity|state.*tuple/i);
    await writeFile(archivedStatePath, archivedStateBytes);
    await writeFile(archivedLedgerPath, archivedLedgerBytes);
    await writeFile(activityPath, activityBytes);
    const release = join(unpacked, "provenance/release-manifest.json");
    const marker = await json(release);
    delete marker.execution_protocol;
    await writeJson(release, marker);
    await repack(unpacked, join(value.temp, "missing-protocol.tar.gz"));
    await rejected(() => execFileAsync("sh", [join(root, "scripts/s7-verify-archive.sh"), "--official", join(value.temp, "missing-protocol.tar.gz")], { cwd: root }), /protocol/i);
    marker.execution_protocol = "tool-batches-v1";
    await writeJson(release, marker);
    const validationRun = join(unpacked, "provenance/validation/results/pinned", TOOLS[0], "official-task-1/rep-0/run.json");
    const run = await json(validationRun);
    run.verification.exit = 1;
    await writeJson(validationRun, run);
    await repack(unpacked, join(value.temp, "failed-validation.tar.gz"));
    await rejected(() => execFileAsync("sh", [join(root, "scripts/s7-verify-archive.sh"), "--official", join(value.temp, "failed-validation.tar.gz")], { cwd: root }), /validation/i);
    await rm(join(unpacked, "provenance/validation"), { recursive: true });
    await repack(unpacked, join(value.temp, "missing-validation.tar.gz"));
    await rejected(() => execFileAsync("sh", [join(root, "scripts/s7-verify-archive.sh"), "--official", join(value.temp, "missing-validation.tar.gz")], { cwd: root }), /validation/i);
  } finally { await rm(value.temp, { recursive: true, force: true }); }
});

test("official batch freeze rejects four repetitions, missing validation, and mismatched reserved spend", { timeout: 120_000 }, async () => {
  const value = await fixture(4);
  try {
    await rejected(() => value.freeze("four-reps"), /five|repetition|Cartesian/i);
    const ledger = await json(value.ledgerPath);
    const state = await json(value.statePath);
    const definition = JSON.parse(state.definition_key);
    definition.validationSpendUsd = 0;
    state.definition_key = JSON.stringify(definition);
    await writeJson(value.statePath, state);
    ledger.state_sha256 = digest(await readFile(value.statePath));
    await writeJson(value.ledgerPath, ledger);
    await rejected(() => value.freeze("wrong-validation-spend"), /validation.*spend|reserved.*spend/i);
    definition.validationSpendUsd = value.definition.validationSpendUsd;
    state.definition_key = JSON.stringify(definition);
    await writeJson(value.statePath, state);
    ledger.state_sha256 = digest(await readFile(value.statePath));
    await writeJson(value.ledgerPath, ledger);
    definition.capUsd = state.spentUsd + value.definition.validationSpendUsd / 2;
    state.definition_key = JSON.stringify(definition);
    await writeJson(value.statePath, state);
    ledger.state_sha256 = digest(await readFile(value.statePath));
    await writeJson(value.ledgerPath, ledger);
    await rejected(() => value.freeze("validation-over-cap"), /combined.*spend.*cap/i);
    await rm(value.validation, { recursive: true });
    await rejected(() => value.freeze("missing-validation"), /validation/i);
  } finally { await rm(value.temp, { recursive: true, force: true }); }
});


test("batch freeze preserves a separate replacement session alongside retained retries", { timeout: 120_000 }, async () => {
  const value = await fixture(5, true);
  try {
    const anomalyCell = join(value.temp, "results/pinned/codex/official-task-1/rep-0");
    const anomalyPath = join(anomalyCell, "run.json");
    const anomaly = await json(anomalyPath);
    anomaly.outcome = "timeout"; anomaly.adapter_result.exitCode = 124; anomaly.verification.exit = 1;
    await writeJson(anomalyPath, anomaly);
    const state = await json(value.statePath);
    state.cells.find((cell) => cell.id === anomaly.run_id).status = "quarantined";
    await writeJson(value.statePath, state);
    const ledger = await json(value.ledgerPath);
    ledger.segments.flatMap((segment) => segment.attempts).find((attempt) => attempt.run_id === anomaly.run_id).status = "failed";
    ledger.state_sha256 = digest(await readFile(value.statePath));
    const binding = await execFileAsync(process.execPath, [...stripArgs, "-e", `
      import { pathToFileURL } from 'node:url'; import { join } from 'node:path';
      const { bindRunWindowResults } = await import(pathToFileURL(join(process.argv[1], 'packages/runner/src/window-ledger.ts')));
      process.stdout.write(JSON.stringify(bindRunWindowResults(process.argv[2])));
    `, root, join(value.temp, "results")], { cwd: root });
    ledger.results_binding = JSON.parse(binding.stdout);
    await writeJson(value.ledgerPath, ledger);
    const replacementRoot = join(value.temp, "reruns");
    const replacement = join(replacementRoot, "pinned/codex/official-task-1/rep-0");
    await cp(anomalyCell, replacement, { recursive: true });
    const replacementRun = await json(join(replacement, "run.json"));
    replacementRun.run_id += ":replacement";
    replacementRun.outcome = "completed"; replacementRun.adapter_result.exitCode = 0; replacementRun.verification.exit = 0;
    const wall = "2026-08-31T00:00:00.000Z";
    replacementRun.anchors.adapter.wall_clock_iso = wall; replacementRun.anchors.proxy.wall_clock_iso = wall;
    replacementRun.adapter_result.anchor.wall_clock_iso = wall; replacementRun.container.started_iso = wall;
    await writeJson(join(replacement, "run.json"), replacementRun);
    await writeFile(join(replacement, "events.jsonl"), (await readFile(join(replacement, "events.jsonl"), "utf8")).replaceAll(anomaly.run_id, replacementRun.run_id));
    const replacementStatePath = join(value.temp, "rerun-state.json");
    await writeJson(replacementStatePath, { version: 1, seed: 1, spentUsd: SPEND_PER_CELL,
      cells: [{ id: replacementRun.run_id, tool: "codex", task_id: "official-task-1", condition: "pinned", rep: 0, status: "done", retries: 0 }],
      run_window_session_id: "session-rerun-fixture", run_window_ledger: "provenance/run-window-ledger.json" });
    const replacementLedgerPath = await createReplacementLedger(value.temp, replacementRoot, replacementStatePath, replacementRun);
    const rawExport = join(value.temp, "raw-activity.csv");
    await writeFile(rawExport, `Model,Spend\n${MODEL},${state.spentUsd + SPEND_PER_CELL}\n`);
    await execFileAsync(process.execPath, ["scripts/s7-activity-crosscheck.mjs", join(value.temp, "results"), rawExport, join(value.temp, "activity-summary.json"), MODEL, PRICE_BOOK, value.statePath, "2026-08-29T00:00:00.000Z", "2026-09-01T00:00:00.000Z", replacementRoot, replacementStatePath, replacementRun.run_id], { cwd: root });
    const reviewPath = join(value.temp, "review.json");
    await writeJson(reviewPath, { version: 1, cells: [{ run_id: anomaly.run_id, disposition: "rerun", replacement_run_id: replacementRun.run_id, note: "replacement completed" }] });
    const freeze = (name) => execFileAsync("sh", [join(root, "scripts/s7-freeze.sh"), join(value.temp, "results"), join(value.temp, name), String(value.cells.length), reviewPath, "", "", "", replacementRoot, replacementStatePath, rawExport, replacementLedgerPath], { cwd: root, env: value.env, maxBuffer: 4 * 1024 * 1024 });
    const result = await freeze("replacement-archive");
    assert.match(`${result.stdout}${result.stderr}`, /S7 archive verified/);
    const listing = (await execFileAsync("tar", ["-tzf", join(value.temp, "replacement-archive")])).stdout;
    assert.match(listing, /provenance\/rerun-state\/run-window-ledger.json/);
    assert.match(listing, /provenance\/validation\/state.json/);
    const definition = JSON.parse(state.definition_key);
    definition.capUsd = state.spentUsd + definition.validationSpendUsd + SPEND_PER_CELL / 2;
    state.definition_key = JSON.stringify(definition);
    await writeJson(value.statePath, state);
    ledger.state_sha256 = digest(await readFile(value.statePath));
    await writeJson(value.ledgerPath, ledger);
    await rejected(() => freeze("over-cap-replacement"), /combined.*spend.*cap/i);
  } finally { await rm(value.temp, { recursive: true, force: true }); }
});


test("batch freeze rejects validation after an earlier retained attempt even when current runs are later", { timeout: 120_000 }, async () => {
  const value = await fixture();
  try {
    const state = await json(value.statePath);
    const cell = state.cells[0];
    const current = join(value.temp, "results", "pinned", cell.tool, cell.task_id, "rep-0");
    const retry = join(current, ".attempts", "attempt-0");
    await mkdir(retry, { recursive: true });
    for (const file of ["run.json", "events.jsonl", "stdout.log", "stderr.log", "verify.log"]) await cp(join(current, file), join(retry, file));
    const earlier = await json(join(retry, "run.json"));
    const wall = "2026-08-29T23:58:00.000Z";
    earlier.anchors.adapter.wall_clock_iso = wall; earlier.anchors.proxy.wall_clock_iso = wall;
    earlier.adapter_result.anchor.wall_clock_iso = wall; earlier.container.started_iso = wall;
    earlier.outcome = "verify_error"; earlier.verification.exit = 1;
    await writeJson(join(retry, "run.json"), earlier);
    cell.retries = 1; state.spentUsd += SPEND_PER_CELL;
    await writeJson(value.statePath, state);
    const ledger = await json(value.ledgerPath);
    const initial = ledger.segments[0];
    initial.attempts[0].kind = "retry";
    const first = { ...initial, id: "segment-earlier", anchor: { wall_clock_iso: wall, monotonic_zero: 0 },
      start_ms: 0, end_ms: 200, start_iso: wall, end_iso: "2026-08-29T23:58:00.200Z",
      attempts: [{ ...initial.attempts[0], id: "attempt-earlier", kind: "current", status: "failed", start_ms: 0, end_ms: 100, start_iso: wall, end_iso: "2026-08-29T23:58:00.100Z" }] };
    ledger.segments.unshift(first); ledger.anchor = first.anchor; ledger.window.start_iso = wall;
    ledger.state_sha256 = digest(await readFile(value.statePath));
    const binding = await execFileAsync(process.execPath, [...stripArgs, "-e", `
      import { pathToFileURL } from 'node:url'; import { join } from 'node:path';
      const { bindRunWindowResults } = await import(pathToFileURL(join(process.argv[1], 'packages/runner/src/window-ledger.ts')));
      process.stdout.write(JSON.stringify(bindRunWindowResults(process.argv[2])));
    `, root, join(value.temp, "results")], { cwd: root });
    ledger.results_binding = JSON.parse(binding.stdout);
    await writeJson(value.ledgerPath, ledger);
    const rawExport = join(value.temp, "raw-activity.csv");
    await writeFile(rawExport, `Model,Spend\n${MODEL},${state.spentUsd}\n`);
    await execFileAsync(process.execPath, ["scripts/s7-activity-crosscheck.mjs", join(value.temp, "results"), rawExport, join(value.temp, "activity-summary.json"), MODEL, PRICE_BOOK, value.statePath, "2026-08-29T00:00:00.000Z", "2026-08-31T00:00:00.000Z"], { cwd: root });
    await rejected(() => value.freeze("late-validation"), /validation.*precede|validation.*window/i);
  } finally { await rm(value.temp, { recursive: true, force: true }); }
});
