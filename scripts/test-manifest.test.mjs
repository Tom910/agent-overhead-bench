import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptsDir, "..");

// A hardcoded list of script test files silently dropped four suites, including
// s3-calibration-attestation.test.mjs — the machine-checkable two-CLI gate that
// authorizes a release. Keep the runner glob-driven so a new suite cannot be
// added to the repository and skipped by CI at the same time.
test("npm test discovers every script test suite by glob", () => {
  const testScript = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).scripts.test;

  assert.match(testScript, /node --test "scripts\/\*\.test\.mjs"/, "script tests must run via the glob, not an enumerated list");

  const enumerated = testScript.match(/scripts\/[A-Za-z0-9._-]+\.test\.mjs/g) ?? [];
  assert.deepEqual(enumerated, [], `script test files must not be enumerated individually: ${enumerated.join(", ")}`);

  const onDisk = readdirSync(scriptsDir).filter((entry) => entry.endsWith(".test.mjs"));
  assert.ok(onDisk.length > 0, "expected at least one script test suite on disk");
  assert.ok(onDisk.includes("s3-calibration-attestation.test.mjs"), "the calibration attestation gate must have a test suite");
});
