import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdtemp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("..", import.meta.url));

async function checksumFiles(directory, relativeDirectory = "") {
  const files = [];
  for (const name of (await readdir(join(directory, relativeDirectory))).sort()) {
    const relativePath = join(relativeDirectory, name);
    const info = await stat(join(directory, relativePath));
    if (info.isDirectory()) files.push(...await checksumFiles(directory, relativePath));
    else if (info.isFile() && relativePath !== "SHA256SUMS") files.push(relativePath);
  }
  return files;
}

async function rewriteArchiveChecksums(directory) {
  const files = await checksumFiles(directory);
  const lines = [];
  for (const file of files) {
    const digest = createHash("sha256").update(await readFile(join(directory, file))).digest("hex");
    lines.push(`${digest}  ${file}`);
  }
  await writeFile(join(directory, "SHA256SUMS"), `${lines.join("\n")}\n`);
}

function runRecord() {
  const digest = `sha256:${"a".repeat(64)}`;
  return {
    v: 1,
    run_id: "default:mock-agent:retry-fixture:0",
    tool: "mock-agent",
    tool_version: "0.0.0-mock",
    task_id: "retry-fixture",
    task_source: "local-development",
    task_revision: "working-tree",
    task_regime: "short",
    condition: "default",
    rep: 0,
    model: "",
    ori_version: null,
    tool_visibility: "none",
    anchors: {
      adapter: { wall_clock_iso: "2026-08-30T00:00:00.000Z", monotonic_zero: 0 },
      proxy: { wall_clock_iso: "2026-08-30T00:00:00.000Z", monotonic_zero: 0 },
    },
    adapter_result: {
      exitCode: 0,
      tStart: 0,
      tEnd: 300,
      anchor: { wall_clock_iso: "2026-08-30T00:00:00.000Z", monotonic_zero: 0 },
      artifacts: { stdoutPath: "stdout.log", stderrPath: "stderr.log" },
    },
    events_file: "events.jsonl",
    verification: { exit: 0, duration_ms: 10, logPath: "verify.log" },
    container: { image_digest: digest, verifier_image_digest: digest, started_iso: "2026-08-30T00:00:00.000Z" },
    task_environment: { kind: "prepared-local", network: "disabled" },
    host: { os: "linux", cpu: "x86_64", ram_gb: 16 },
    spend_usd_estimate: null,
    price_book: "openrouter-2026-08-27",
    outcome: "completed",
  };
}

test("S7 freeze excludes retry copies from cell count but keeps the current result", async () => {
  const temp = await mkdtemp(join(tmpdir(), "aob-freeze-retry-ci-"));
  try {
    const cell = join(temp, "results", "default", "mock-agent", "retry-fixture", "rep-0");
    const retry = join(cell, ".attempts", "attempt-0");
    await mkdir(retry, { recursive: true });
    const run = runRecord();
    const event = {
      v: 1,
      run_id: run.run_id,
      seq: 0,
      t_req_start: 100,
      t_req_body_end: 110,
      t_upstream_sent: 111,
      t_first_byte: 120,
      t_last_byte: 200,
      duration_ms: 100,
      method: "POST",
      path: "/v1/chat/completions",
      protocol: "openai_chat",
      model_requested: "mock",
      model_served: "mock",
      status: 200,
      streamed: false,
      usage: { input: 1, cached_input: 0, output: 1, reasoning_output: 0 },
      usage_source: "response_body",
      error: null,
    };
    await writeFile(join(cell, "run.json"), `${JSON.stringify(run)}\n`);
    await writeFile(join(retry, "run.json"), `${JSON.stringify(run)}\n`);
    await writeFile(join(cell, "events.jsonl"), `${JSON.stringify(event)}\n`);
    await writeFile(join(cell, "stdout.log"), "mock stdout\n");
    await writeFile(join(cell, "stderr.log"), "mock stderr\n");
    await writeFile(join(cell, "verify.log"), "verified\n");
    await writeFile(join(retry, "events.jsonl"), `${JSON.stringify(event)}\n`);
    await writeFile(join(retry, "stdout.log"), "retry stdout\n");
    await writeFile(join(retry, "stderr.log"), "retry stderr\n");
    await writeFile(join(retry, "verify.log"), "retry verified\n");
    await writeFile(join(retry, "prompt.md"), "private prompt\n");
    await writeFile(join(retry, "verifier.json"), "private verifier\n");
    await writeFile(join(temp, "state.json"), JSON.stringify({
      version: 1,
      seed: 1,
      spentUsd: 0,
      cells: [{ id: run.run_id, tool: run.tool, task_id: run.task_id, condition: run.condition, rep: run.rep, status: "done", retries: 1 }],
    }));
    const privateExport = join(temp, "private-activity.csv");
    const privateMarker = "PRIVATE_ACTIVITY_EXPORT_MUST_NOT_BE_ARCHIVED";
    await writeFile(privateExport, `model,cost\n${privateMarker},0\n`);

    const { stdout, stderr } = await execFileAsync("sh", [
      join(root, "scripts/s7-freeze.sh"),
      join(temp, "results"),
      join(temp, "archive"),
      "1",
      "", "", "", "", "", "", privateExport,
    ], { cwd: root, env: { ...process.env, AOB_ALLOW_NONOFFICIAL_FREEZE: "1" } });
    assert.match(`${stdout}\n${stderr}`, /S7 archive verified/);
    const { stdout: archiveListing } = await execFileAsync("tar", ["-tzf", join(temp, "archive")]);
    assert.doesNotMatch(archiveListing, /\.attempts/);
    assert.match(archiveListing, /provenance\/runner-state\.json/);
    assert.match(archiveListing, /provenance\/archive-binding\.json/);
    assert.match(archiveListing, /provenance\/release-manifest\.json/);
    const { stdout: releaseManifest } = await execFileAsync("tar", ["-xOf", join(temp, "archive"), "provenance/release-manifest.json"]);
    assert.equal(JSON.parse(releaseManifest).official, false);
    await assert.rejects(
      execFileAsync("sh", [join(root, "scripts/s7-verify-archive.sh"), "--official", join(temp, "archive")], { cwd: root }),
      /not official|release manifest/i,
    );
    assert.match(archiveListing, /provenance\/retries\/default\/mock-agent\/retry-fixture\/rep-0\/attempt-0\/run\.json/);
    assert.match(archiveListing, /provenance\/retries\/default\/mock-agent\/retry-fixture\/rep-0\/attempt-0\/events\.jsonl/);
    assert.doesNotMatch(archiveListing, /prompt\.md|verifier\.json/);
    assert.doesNotMatch(archiveListing, /private-activity\.csv/);
    await readFile(join(temp, "archive.sha256"));

    const tampered = join(temp, "tampered");
    await mkdir(tampered);
    await execFileAsync("tar", ["-xzf", join(temp, "archive"), "-C", tampered]);
    for (const file of await checksumFiles(tampered)) {
      assert.doesNotMatch(await readFile(join(tampered, file), "utf8"), new RegExp(privateMarker));
    }
    await writeFile(join(tampered, "SHA256SUMS"), `${await readFile(join(tampered, "SHA256SUMS"), "utf8")}e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855  /dev/null\n`);
    const unsafeArchive = join(temp, "unsafe-checksum-archive");
    await execFileAsync("tar", ["-czf", unsafeArchive, "-C", tampered, "results", "report", "provenance", "SHA256SUMS"]);
    const unsafeDigest = createHash("sha256").update(await readFile(unsafeArchive)).digest("hex");
    await writeFile(`${unsafeArchive}.sha256`, `${unsafeDigest}  ${unsafeArchive}\n`);
    await assert.rejects(
      execFileAsync("sh", [join(root, "scripts/s7-verify-archive.sh"), unsafeArchive], { cwd: root }),
      /SHA256SUMS.*unsafe|unsafe.*path/i,
    );

    await writeFile(join(tampered, "report", "README.md"), "mutated after portable binding\n");
    await rewriteArchiveChecksums(tampered);
    const tamperedArchive = join(temp, "tampered-archive");
    await execFileAsync("tar", ["-czf", tamperedArchive, "-C", tampered, "results", "report", "provenance", "SHA256SUMS"]);
    const tamperedDigest = createHash("sha256").update(await readFile(tamperedArchive)).digest("hex");
    await writeFile(`${tamperedArchive}.sha256`, `${tamperedDigest}  ${tamperedArchive}\n`);
    await assert.rejects(
      execFileAsync("sh", [join(root, "scripts/s7-verify-archive.sh"), tamperedArchive], { cwd: root }),
      /archive binding|manifest/i,
    );
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test("S7 freeze requires provenance and passing Activity Export evidence for official archives", async () => {
  const script = await readFile(join(root, "scripts/s7-freeze.sh"), "utf8");
  assert.match(script, /TASK_MANIFEST/);
  assert.match(script, /SOURCE_MANIFEST/);
  assert.match(script, /ACTIVITY_SUMMARY/);
  assert.match(script, /within_tolerance/);
  assert.match(script, /task_repository/);
  assert.match(script, /runner_spend_usd/);
});

test("S7 freeze accepts an anomaly replacement from a separate rerun tree", async () => {
  const temp = await mkdtemp(join(tmpdir(), "aob-freeze-rerun-ci-"));
  try {
    const fixture = join(root, "scripts/test-fixtures/default-mock");
    const currentNormal = join(temp, "results", "default", "mock-agent", "rerun-fixture", "rep-0");
    const currentAnomaly = join(temp, "results", "default", "mock-agent", "rerun-fixture", "rep-1");
    const currentNormalTwo = join(temp, "results", "default", "mock-agent", "rerun-fixture", "rep-2");
    const replacement = join(temp, "reruns", "default", "mock-agent", "rerun-fixture", "rep-1");
    await mkdir(currentNormal, { recursive: true });
    await mkdir(currentAnomaly, { recursive: true });
    await mkdir(currentNormalTwo, { recursive: true });
    await mkdir(replacement, { recursive: true });
    for (const destination of [currentNormal, currentAnomaly, currentNormalTwo, replacement]) await cp(fixture, destination, { recursive: true });
    const normalRunPath = join(currentNormal, "run.json");
    const normalRun = JSON.parse(await readFile(normalRunPath, "utf8"));
    normalRun.run_id = "default:mock-agent:rerun-fixture:0";
    normalRun.task_id = "rerun-fixture";
    normalRun.adapter_result.artifacts.stdoutPath = join(currentNormal, "stdout.log");
    normalRun.adapter_result.artifacts.stderrPath = join(currentNormal, "stderr.log");
    await writeFile(normalRunPath, `${JSON.stringify(normalRun)}\n`);
    await writeFile(join(currentNormal, "events.jsonl"), (await readFile(join(currentNormal, "events.jsonl"), "utf8")).replaceAll("default:mock-agent:dry-run-1:0", normalRun.run_id));
    const normalTwoRunPath = join(currentNormalTwo, "run.json");
    const normalTwoRun = JSON.parse(await readFile(normalTwoRunPath, "utf8"));
    normalTwoRun.run_id = "default:mock-agent:rerun-fixture:2";
    normalTwoRun.task_id = "rerun-fixture";
    normalTwoRun.rep = 2;
    normalTwoRun.adapter_result.artifacts.stdoutPath = join(currentNormalTwo, "stdout.log");
    normalTwoRun.adapter_result.artifacts.stderrPath = join(currentNormalTwo, "stderr.log");
    await writeFile(normalTwoRunPath, `${JSON.stringify(normalTwoRun)}\n`);
    await writeFile(join(currentNormalTwo, "events.jsonl"), (await readFile(join(currentNormalTwo, "events.jsonl"), "utf8")).replaceAll("default:mock-agent:dry-run-1:0", normalTwoRun.run_id));
    const anomalyRunPath = join(currentAnomaly, "run.json");
    const anomalyRun = JSON.parse(await readFile(anomalyRunPath, "utf8"));
    anomalyRun.run_id = "default:mock-agent:rerun-fixture:1";
    anomalyRun.task_id = "rerun-fixture";
    anomalyRun.rep = 1;
    anomalyRun.adapter_result.tEnd = 50000;
    anomalyRun.adapter_result.artifacts.stdoutPath = join(currentAnomaly, "stdout.log");
    anomalyRun.adapter_result.artifacts.stderrPath = join(currentAnomaly, "stderr.log");
    await writeFile(anomalyRunPath, `${JSON.stringify(anomalyRun)}\n`);
    const anomalyEventsPath = join(currentAnomaly, "events.jsonl");
    await writeFile(anomalyEventsPath, (await readFile(anomalyEventsPath, "utf8")).replaceAll("default:mock-agent:dry-run-1:0", anomalyRun.run_id));
    const replacementRunPath = join(replacement, "run.json");
    const replacementRun = JSON.parse(await readFile(replacementRunPath, "utf8"));
    replacementRun.run_id = "default:mock-agent:rerun-fixture:replacement";
    replacementRun.task_id = "rerun-fixture";
    replacementRun.rep = 1;
    replacementRun.adapter_result.artifacts.stdoutPath = join(replacement, "stdout.log");
    replacementRun.adapter_result.artifacts.stderrPath = join(replacement, "stderr.log");
    await writeFile(replacementRunPath, `${JSON.stringify(replacementRun)}\n`);
    const replacementEventsPath = join(replacement, "events.jsonl");
    await writeFile(replacementEventsPath, (await readFile(replacementEventsPath, "utf8")).replaceAll("default:mock-agent:dry-run-1:0", replacementRun.run_id));
    const state = {
      version: 1,
      seed: 1,
      spentUsd: 0,
      cells: [
        { id: "default:mock-agent:rerun-fixture:0", tool: "mock-agent", task_id: "rerun-fixture", condition: "default", rep: 0, status: "done", retries: 0 },
        { id: anomalyRun.run_id, tool: "mock-agent", task_id: "rerun-fixture", condition: "default", rep: 1, status: "done", retries: 0 },
        { id: normalTwoRun.run_id, tool: "mock-agent", task_id: "rerun-fixture", condition: "default", rep: 2, status: "done", retries: 0 },
      ],
    };
    await writeFile(join(temp, "state.json"), JSON.stringify(state));
    const rerunStatePath = join(temp, "rerun-state.json");
    await writeFile(rerunStatePath, JSON.stringify({
      version: 1,
      seed: 1,
      spentUsd: 0,
      cells: [{ id: replacementRun.run_id, tool: "mock-agent", task_id: "rerun-fixture", condition: "default", rep: 1, status: "done", retries: 0 }],
    }));
    const reviewPath = join(temp, "review.json");
    await writeFile(reviewPath, JSON.stringify({
      version: 1,
      cells: [{ run_id: anomalyRun.run_id, disposition: "rerun", replacement_run_id: replacementRun.run_id, note: "replacement completed" }],
    }));
    replacementRun.model = "wrong-model";
    await writeFile(replacementRunPath, `${JSON.stringify(replacementRun)}\n`);
    await assert.rejects(
      execFileAsync("sh", [join(root, "scripts/s7-freeze.sh"), join(temp, "results"), join(temp, "bad-archive"), "3", reviewPath, "", "", "", join(temp, "reruns"), rerunStatePath], { cwd: root, env: { ...process.env, AOB_ALLOW_NONOFFICIAL_FREEZE: "1" } }),
      /replacement|identity/i,
    );
    replacementRun.model = "mock";
    await writeFile(replacementRunPath, `${JSON.stringify(replacementRun)}\n`);
    normalTwoRun.host.cpu = "different-host";
    await writeFile(normalTwoRunPath, `${JSON.stringify(normalTwoRun)}\n`);
    await assert.rejects(
      execFileAsync("sh", [join(root, "scripts/s7-freeze.sh"), join(temp, "results"), join(temp, "bad-host-archive"), "3", reviewPath, "", "", "", join(temp, "reruns"), rerunStatePath], { cwd: root, env: { ...process.env, AOB_ALLOW_NONOFFICIAL_FREEZE: "1" } }),
      /host/i,
    );
    normalTwoRun.host.cpu = "x86_64";
    await writeFile(normalTwoRunPath, `${JSON.stringify(normalTwoRun)}\n`);
    replacementRun.adapter_result.tEnd = 50000;
    await writeFile(replacementRunPath, `${JSON.stringify(replacementRun)}\n`);
    await assert.rejects(
      execFileAsync("sh", [join(root, "scripts/s7-freeze.sh"), join(temp, "results"), join(temp, "bad-rerun-archive"), "3", reviewPath, "", "", "", join(temp, "reruns"), rerunStatePath], { cwd: root, env: { ...process.env, AOB_ALLOW_NONOFFICIAL_FREEZE: "1" } }),
      /anomal/i,
    );
    replacementRun.adapter_result.tEnd = normalRun.adapter_result.tEnd;
    await writeFile(replacementRunPath, `${JSON.stringify(replacementRun)}\n`);
    const { stdout, stderr } = await execFileAsync("sh", [
      join(root, "scripts/s7-freeze.sh"),
      join(temp, "results"),
      join(temp, "archive"),
      "3",
      reviewPath,
      "",
      "",
      "",
      join(temp, "reruns"),
      rerunStatePath,
    ], { cwd: root, env: { ...process.env, AOB_ALLOW_NONOFFICIAL_FREEZE: "1" } });
    assert.match(`${stdout}\n${stderr}`, /S7 archive verified/);
    const unpacked = join(temp, "unpacked");
    await mkdir(unpacked, { recursive: true });
    await execFileAsync("tar", ["-xzf", join(temp, "archive"), "-C", unpacked]);
    const published = JSON.parse(await readFile(join(unpacked, "results", "default", "mock-agent", "rerun-fixture", "rep-1", "run.json"), "utf8"));
    assert.equal(published.run_id, replacementRun.run_id);
    const original = JSON.parse(await readFile(join(unpacked, "provenance", "anomalies", "default", "mock-agent", "rerun-fixture", "rep-1", "run.json"), "utf8"));
    assert.equal(original.run_id, anomalyRun.run_id);
    const mapping = JSON.parse(await readFile(join(unpacked, "provenance", "resolved-replacements.json"), "utf8"));
    assert.deepEqual(mapping.replacements, [{ original_run_id: anomalyRun.run_id, replacement_run_id: replacementRun.run_id }]);
    const archivedRerunState = JSON.parse(await readFile(join(unpacked, "provenance", "rerun-state", "runner-state.json"), "utf8"));
    assert.equal(archivedRerunState.cells[0].id, replacementRun.run_id);
    await readFile(join(unpacked, "report", "README.md"));
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});


test("S7 freezes an explained timing outlier without replacement runs", async () => {
  const temp = await mkdtemp(join(tmpdir(), "aob-explained-freeze-"));
  try {
    const cells = [];
    for (let rep = 0; rep < 4; rep += 1) {
      const run = runRecord();
      run.rep = rep;
      run.run_id = `default:mock-agent:retry-fixture:${rep}`;
      run.adapter_result.tEnd = rep === 3 ? 10000 : 300;
      const cell = join(temp, "results", "default", "mock-agent", "retry-fixture", `rep-${rep}`);
      await mkdir(cell, { recursive: true });
      const event = { v: 1, run_id: run.run_id, seq: 0,
        t_req_start: 100, t_req_body_end: 110, t_upstream_sent: 111,
        t_first_byte: 120, t_last_byte: 200, duration_ms: 100,
        method: "POST", path: "/v1/chat/completions", protocol: "openai_chat",
        model_requested: "mock", model_served: "mock", status: 200, streamed: false,
        usage: { input: 1, cached_input: 0, output: 1, reasoning_output: 0 },
        usage_source: "response_body", error: null };
      await writeFile(join(cell, "run.json"), JSON.stringify(run));
      await writeFile(join(cell, "events.jsonl"), `${JSON.stringify(event)}\n`);
      for (const file of ["stdout.log", "stderr.log", "verify.log"]) await writeFile(join(cell, file), "fixture\n");
      cells.push({ id: run.run_id, tool: run.tool, task_id: run.task_id, condition: run.condition, rep, status: "done", retries: 0 });
    }
    await writeFile(join(temp, "state.json"), JSON.stringify({ version: 1, seed: 1, spentUsd: 0, cells }));
    const review = { version: 1, cells: [{ run_id: cells[3].id, disposition: "explained", note: "Synthetic delayed cell retained to exercise explained-only freeze." }] };
    const reviewPath = join(temp, "review.json");
    await writeFile(reviewPath, JSON.stringify(review));
    const args = [join(root, "scripts/s7-freeze.sh"), join(temp, "results"), join(temp, "archive"), "4", reviewPath];
    const options = { cwd: root, env: { ...process.env, AOB_ALLOW_NONOFFICIAL_FREEZE: "1" } };
    const result = await execFileAsync("sh", args, options);
    assert.match(result.stdout + result.stderr, /S7 archive verified/);
    const archived = await execFileAsync("tar", ["-xOf", join(temp, "archive"), "review/anomaly-review.json"]);
    assert.deepEqual(JSON.parse(archived.stdout), review);
    review.cells[0].disposition = "rerun";
    review.cells[0].replacement_run_id = "missing-replacement";
    await writeFile(reviewPath, JSON.stringify(review));
    args[2] = join(temp, "rejected-archive");
    await assert.rejects(execFileAsync("sh", args, options), /no valid completed replacement|replacement results/);
  } finally { await rm(temp, { recursive: true, force: true }); }
});
