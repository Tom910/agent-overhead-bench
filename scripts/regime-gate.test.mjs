import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const root = fileURLToPath(new URL("..", import.meta.url));
const runAll = join(root, "scripts/run-all.sh");
// Derive the preflight tool list from the official scope. Hardcoding it made
// these tests fail at the scope check before reaching the behaviour they
// actually assert, as soon as the profile changed.
const OFFICIAL_TOOLS = JSON.parse(readFileSync(join(root, "plans/s7-official-tool-scope.json"), "utf8")).tools.join(",");

function run(env = {}) {
  return spawnSync(runAll, ["/tmp/aob-regime-test-output", "z-ai/glm-5.3-flash", "0.01"], {
    cwd: root,
    env: { ...process.env, ...env },
    encoding: "utf8",
  });
}

test("run-all defaults to short and validates the explicit regime before credentials", () => {
  const defaultResult = run({ AOB_RUN_REGIME: undefined });
  assert.notEqual(defaultResult.status, 0);
  assert.doesNotMatch(`${defaultResult.stdout}\n${defaultResult.stderr}`, /AOB_RUN_REGIME must be short or long/);

  const longResult = run({ AOB_RUN_REGIME: "long" });
  assert.notEqual(longResult.status, 0);
  assert.doesNotMatch(`${longResult.stdout}\n${longResult.stderr}`, /AOB_RUN_REGIME must be short or long/);

  const extendedResult = run({ AOB_RUN_REGIME: "extended" });
  assert.notEqual(extendedResult.status, 0);
  assert.doesNotMatch(`${extendedResult.stdout}\n${extendedResult.stderr}`, /AOB_RUN_REGIME must be short, long, or extended/);

  const invalidResult = run({ AOB_RUN_REGIME: "overnight" });
  assert.notEqual(invalidResult.status, 0);
  assert.match(`${invalidResult.stdout}\n${invalidResult.stderr}`, /AOB_RUN_REGIME must be short, long, or extended/);
});

test("duration maps accept the extended range and still reject out-of-regime rows", () => {
  const temp = mkdtempSync(join("/tmp", "aob-duration-extended-"));
  try {
    const map = join(temp, "durations.json");
    writeFileSync(map, '{"task-one":[16,180]}\n');
    const accepted = spawnSync(process.execPath, [join(root, "scripts/validate-duration-map.mjs"), map, "extended", "task-one"], { cwd: root, encoding: "utf8" });
    assert.equal(accepted.status, 0);
    assert.match(accepted.stdout, /task-one\t16\t180/);

    writeFileSync(map, '{"task-one":[16,181]}\n');
    const rejected = spawnSync(process.execPath, [join(root, "scripts/validate-duration-map.mjs"), map, "extended", "task-one"], { cwd: root, encoding: "utf8" });
    assert.notEqual(rejected.status, 0);
    assert.match(`${rejected.stdout}\n${rejected.stderr}`, /outside the extended regime/);

    writeFileSync(map, '{"task-one":[16,180]}\n');
    const wrongRegime = spawnSync(process.execPath, [join(root, "scripts/validate-duration-map.mjs"), map, "short", "task-one"], { cwd: root, encoding: "utf8" });
    assert.notEqual(wrongRegime.status, 0);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test("DeepSWE duration maps reject duplicate task keys", () => {
  const temp = mkdtempSync(join("/tmp", "aob-duration-duplicate-"));
  try {
    const map = join(temp, "durations.json");
    writeFileSync(map, '{"task-one":[2,3],"task-one":[4,5]}\n');
    const result = spawnSync(process.execPath, [join(root, "scripts/validate-duration-map.mjs"), map, "short", "task-one"], { cwd: root, encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /duplicate JSON object key/);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test("the official launcher passes the selected regime to preflight", () => {
  const script = readFileSync(runAll, "utf8");
  assert.match(script, /AOB_RUN_REGIME/);
  assert.match(script, /s7-preflight\.sh.*\$REGIME/);
});

test("preflight reads the regime from the ninth positional argument", () => {
  const preflight = join(root, "scripts/s7-preflight.sh");
  const result = spawnSync(preflight, [
    "/tmp/aob-regime-preflight-results",
    "z-ai/glm-5.3-flash",
    "openrouter-2026-08-27",
    OFFICIAL_TOOLS,
    "pinned",
    "/tmp/aob-regime-tasks",
    "/tmp/aob-regime-task-manifest.json",
    "/tmp/aob-regime-source-manifest.json",
    "overnight",
  ], {
    cwd: root,
    env: Object.fromEntries(Object.entries(process.env).filter(([key]) => key !== "AOB_RUN_REGIME")),
    encoding: "utf8",
  });
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /regime must be short, long, or extended/);
});

test("S7 preflight bounds the Docker daemon readiness check", () => {
  const preflight = readFileSync(join(root, "scripts/s7-preflight.sh"), "utf8");
  assert.match(preflight, /command-timeout\.mjs/);
  assert.match(preflight, /docker info/);
  assert.match(preflight, /AOB_S7_DOCKER_INFO_TIMEOUT_MS/);
  assert.doesNotMatch(preflight, /^\s*docker info\s*>/m);
});

test("S7 preflight gates the Docker container-host clock calibration", () => {
  const preflight = readFileSync(join(root, "scripts/s7-preflight.sh"), "utf8");
  assert.match(preflight, /s7-container-clock-calibrate\.sh/);
  assert.match(preflight, /AOB_S7_CONTAINER_CLOCK_SAMPLES/);
  assert.match(preflight, /AOB_S7_CONTAINER_CLOCK_MAX_OFFSET_MS/);
  assert.match(preflight, /AOB_S7_CONTAINER_CLOCK_TIMEOUT_MS/);
  assert.match(preflight, /container-host clock bound cannot exceed.*10ms/);
  assert.match(preflight, /method=container-host-epoch-ms/);
  assert.match(preflight, /max_conservative_bound_ms/);
  assert.match(preflight, /max_round_trip_ms/);
  assert.match(preflight, /provider_requests=0/);
  assert.match(preflight, /status=passed/);
});

test("S7 preflight validates prepared DeepSWE agent image identities", () => {
  const preflight = readFileSync(join(root, "scripts/s7-preflight.sh"), "utf8");
  assert.match(preflight, /agent_images/);
  assert.match(preflight, /image_digest/);
  assert.match(preflight, /docker.*image.*inspect/);
  assert.match(preflight, /validateDeepSWEManifest/);
});

test("S7 preflight closes task validation before running pricing and calibration shell", () => {
  const preflight = readFileSync(join(root, "scripts/s7-preflight.sh"), "utf8");
  const taskValidationStart = preflight.indexOf("--input-type=module - \"$ROOT\" \"$TASKS\"");
  const taskValidationEnd = preflight.indexOf("\nNODE\n", taskValidationStart);
  const pricingCheck = preflight.indexOf("node -e '\nconst fs=require(\"node:fs\")", taskValidationEnd);
  assert.ok(taskValidationStart >= 0);
  assert.ok(taskValidationEnd > taskValidationStart);
  assert.ok(pricingCheck > taskValidationEnd);
});

test("S7 preflight binds completed calibration review to recomputed attestation evidence before credentials", () => {
  const preflight = readFileSync(join(root, "scripts/s7-preflight.sh"), "utf8");
  assert.match(preflight, /AOB_CALIBRATION_ATTESTATION/);
  assert.match(preflight, /AOB_CALIBRATION_SUMMARY/);
  assert.match(preflight, /AOB_CALIBRATION_ROOT/);
  assert.match(preflight, /s3-calibration-attestation\.mjs/);
  assert.match(preflight, /calibration_attestation_sha256/);
  assert.ok(preflight.indexOf("s3-calibration-attestation.mjs") < preflight.indexOf("OPENROUTER_API_KEY is not available"));
});

test("S7 preflight rejects directly restricted source lineage before setup", () => {
  const preflight = join(root, "scripts/s7-preflight.sh");
  const temp = mkdtempSync(join("/tmp", "aob-s7-lineage-order-"));
  try {
    const sourceManifest = join(temp, "source-manifest.json");
    writeFileSync(sourceManifest, JSON.stringify({ source_adapter: "deepswe", source_dataset: "terminal-bench" }));
    const result = spawnSync(preflight, [
      join(temp, "results"),
      "z-ai/glm-5.3-flash",
      "openrouter-2026-08-27",
      OFFICIAL_TOOLS,
      "pinned",
      join(temp, "tasks"),
      join(temp, "missing-task-manifest.json"),
      sourceManifest,
      "short",
    ], { cwd: root, encoding: "utf8" });
    assert.notEqual(result.status, 0);
    const output = `${result.stdout}\n${result.stderr}`;
    assert.match(output, /restricted source dataset lineage|terminal-bench/i);
    assert.doesNotMatch(output, /task manifest is unavailable|Docker daemon|OPENROUTER_API_KEY is not available/);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});
