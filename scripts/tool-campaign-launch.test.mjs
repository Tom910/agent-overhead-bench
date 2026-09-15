import { mkdtemp, mkdir, cp, writeFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const cleanEnv = () => Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith("AOB_") && key !== "OPENROUTER_API_KEY"));

async function capturedLaunch(script, args, overrides = {}) {
  const temp = await mkdtemp(join(tmpdir(), "aob-launch-test-"));
  try {
    await mkdir(join(temp, "scripts"));
    await cp(join(root, "scripts", script), join(temp, "scripts", script));
    await writeFile(join(temp, "scripts/run-all.sh"), `#!/usr/bin/env node
process.stdout.write(JSON.stringify({ args: process.argv.slice(2), env: Object.fromEntries(Object.entries(process.env).filter(([key]) => key.startsWith("AOB_"))) }));
`, { mode: 0o755 });
    const result = spawnSync("sh", [join(temp, "scripts", script), ...args], { env: { ...cleanEnv(), ...overrides }, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  } finally { await rm(temp, { recursive: true, force: true }); }
}

test("batch launcher carries one selected tool and explicit budgets into the complete five-repetition campaign", async () => {
  const result = await capturedLaunch("run-tool-batch.sh", ["campaign", "codex", "model", "0.5", "20", "100", "validation"]);
  assert.deepEqual(result.args, ["campaign", "model", "0.5", "openrouter-2026-08-27"]);
  assert.equal(result.env.AOB_EXECUTION_PROTOCOL, "tool-batches-v1");
  assert.equal(result.env.AOB_REPS, "5");
  assert.equal(result.env.AOB_BATCH_TOOL, "codex");
  assert.equal(result.env.AOB_BATCH_CAP_USD, "20");
  assert.equal(result.env.AOB_CAP_USD, "100");
  assert.equal(result.env.AOB_VALIDATION_ROOT, "validation");
});

test("validation launcher forces one repetition and removes inherited batch settings", async () => {
  const result = await capturedLaunch("run-validation.sh", ["validation", "model", "0.5", "10", "dated-book"], {
    AOB_EXECUTION_PROTOCOL: "tool-batches-v1", AOB_BATCH_TOOL: "codex", AOB_BATCH_CAP_USD: "99", AOB_VALIDATION_ROOT: "old", AOB_REPS: "5", AOB_IGNORED_PROVIDERS: "relace",
  });
  assert.deepEqual(result.args, ["validation", "model", "0.5", "dated-book"]);
  assert.equal(result.env.AOB_VALIDATION_ONLY, "1");
  assert.equal(result.env.AOB_REPS, "1");
  assert.equal(result.env.AOB_CAP_USD, "10");
  assert.equal(result.env.AOB_EXECUTION_PROTOCOL, undefined);
  assert.equal(result.env.AOB_BATCH_TOOL, undefined);
  assert.equal(result.env.AOB_IGNORED_PROVIDERS, "relace");
});

for (const [label, args, env, pattern] of [
  ["missing budgets", ["campaign", "codex", "model", "0.5"], {}, /required arguments/],
  ["unknown tool", ["campaign", "unknown", "z-ai\/glm-5.3-flash", "0.5", "10", "100", "validation"], {}, /outside official scope/],
  ["oversized tool cap", ["campaign", "codex", "z-ai\/glm-5.3-flash", "0.5", "101", "100", "validation"], {}, /tool cap/],
  ["four repetitions", ["campaign", "codex", "z-ai\/glm-5.3-flash", "0.5", "10", "100", "validation"], { AOB_REPS: "4" }, /five repetitions/],
]) {
  test(`batch launch refuses ${label} before credentials or provider requests`, () => {
    const result = spawnSync("sh", [join(root, "scripts/run-tool-batch.sh"), ...args], { env: { ...cleanEnv(), ...env }, encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, pattern);
  });
}

test("campaign status includes validation in remaining spend and lists tools without execution", async () => {
  const temp = await mkdtemp(join(tmpdir(), "aob-status-test-"));
  try {
    await writeFile(join(temp, "state.json"), JSON.stringify({
      definition_key: JSON.stringify({ executionProtocol: "tool-batches-v1", tools: ["a", "b"], validationSpendUsd: 2, capUsd: 10 }),
      spentUsd: 3, cells: [{ tool: "a", status: "done" }, { tool: "a", status: "quarantined" }, { tool: "b", status: "verifying" }, { tool: "b", status: "pending" }],
    }));
    const result = spawnSync(process.execPath, [join(root, "scripts/campaign-status.mjs"), temp], { env: cleanEnv(), encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const status = JSON.parse(result.stdout);
    assert.equal(status.total_recorded_spend_usd, 5);
    assert.equal(status.remaining_recorded_budget_usd, 5);
    assert.equal(status.tools[0].done, 1);
    assert.equal(status.tools[1].pending, 1);
    assert.equal(status.tools[0].quarantined, 1);
    assert.equal(status.tools[1].verifying, 1);
  } finally { await rm(temp, { recursive: true, force: true }); }
});
