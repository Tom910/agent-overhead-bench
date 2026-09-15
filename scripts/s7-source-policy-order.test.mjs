import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = new URL("../", import.meta.url).pathname;

async function runPolicy(manifest) {
  const dir = await mkdtemp(join(tmpdir(), "aob-source-policy-"));
  const path = join(dir, "source.json");
  await writeFile(path, JSON.stringify(manifest));
  try {
    return await execFileAsync(process.execPath, [join(root, "scripts/s7-source-policy.mjs"), root, path], { cwd: root });
  } catch (error) {
    return error;
  }
}

test("run-all applies source lineage policy before loading provider credentials", async () => {
  const launcher = await readFile(join(root, "scripts/run-all.sh"), "utf8");
  const policy = launcher.indexOf("s7-source-policy.mjs");
  const credentialLoad = launcher.indexOf("runner_key=$(awk");
  assert.ok(policy >= 0, "official launcher must call the shared source-policy helper");
  assert.ok(credentialLoad >= 0, "official launcher must retain its isolated credential loader");
  assert.ok(policy < credentialLoad, "restricted source policy must run before .env credential loading");
});

test("direct preflight reuses the shared source policy helper", async () => {
  const preflight = await readFile(join(root, "scripts/s7-preflight.sh"), "utf8");
  assert.match(preflight, /s7-source-policy\.mjs/);
});

test("shared source policy rejects restricted lineage and accepts only the selected DeepSWE exception", async () => {
  const base = { source_adapter: "deepswe", source_dataset: "swe-bench-ultra" };
  const allowed = await runPolicy(base);
  assert.equal(allowed.stderr ?? "", "");
  assert.match(allowed.stdout ?? "", /accepted/i);

  const rejected = await runPolicy({ ...base, source_dataset: "terminal-bench" });
  assert.notEqual(rejected.code, 0);
  assert.match(rejected.stderr ?? "", /restricted|terminal-bench/i);
});

test("shared source policy fails closed for malformed or missing source manifests", async () => {
  const malformed = await runPolicy({ source_adapter: "deepswe" });
  assert.notEqual(malformed.code, 0);
  assert.match(malformed.stderr ?? "", /source_dataset|invalid|missing/i);

  const missing = await execFileAsync(process.execPath, [join(root, "scripts/s7-source-policy.mjs"), root, join(tmpdir(), "aob-source-policy-does-not-exist.json")]).then(
    () => null,
    (error) => error,
  );
  assert.ok(missing);
  assert.notEqual(missing.code, 0);
});
