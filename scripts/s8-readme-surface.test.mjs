import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readme = readFileSync(join(root, "README.md"), "utf8");
const methodology = readFileSync(join(root, "METHODOLOGY.md"), "utf8");
const ledger = JSON.parse(readFileSync(join(root, "evidence/index.json"), "utf8"));
const summary = JSON.parse(readFileSync(join(root, "evidence/nonclaude-results-2026-09-14/summary.json"), "utf8"));

test("README keeps unpublished positioning and does not open as a capabilities ranking", () => {
  assert.match(readme, /not a capabilities leaderboard/i);
  assert.match(readme, /Results are unpublished until the v1 dataset ships/i);
  assert.match(readme, /\bpilot\b/i);
  assert.doesNotMatch(readme, /\|\s*Native pass\s*\|/);
  assert.doesNotMatch(readme, /additional \$4 authorization/i);
  assert.doesNotMatch(readme, /\$13\.780724/);
  assert.doesNotMatch(readme, /\$64\.219276/);
});

test("README campaign snapshot separates host and price-book populations", () => {
  assert.match(readme, /macOS/);
  assert.match(readme, /Linux/);
  assert.match(readme, /deepseek-v41-low-2026-09-10/);
  assert.match(readme, /openrouter-2026-09-04/);
  assert.match(readme, /not the frozen v1 dataset/i);
  const measurement = readme.indexOf("| Harness | vX.Y |");
  assert.ok(measurement > 0, "pilot measurement table must exist");
  const before = readme.slice(0, measurement);
  assert.match(before, /local fixture pilot/i);
  assert.doesNotMatch(readme.slice(measurement), /^\| Harness \| Native pass \|/m);
});

test("METHODOLOGY is frozen protocol text and still withholds the official archive", () => {
  assert.match(methodology, /^# METHODOLOGY$/m);
  assert.doesNotMatch(methodology, /^# METHODOLOGY \(draft/m);
  assert.match(methodology, /official v1 results archive remains unpublished/i);
  assert.match(methodology, /deepseek\/deepseek-v4\.1-flash/);
  assert.match(methodology, /\$50\.701287/);
  assert.match(methodology, /\$52\.1/);
  assert.match(methodology, /turns count identifiable model API attempts/i);
  assert.match(methodology, /usage, cache, and cost remain successful-response-only/i);
});

test("evidence ledger stays unpublished and binds campaign snapshot files", () => {
  assert.equal(ledger.status, "pilot");
  assert.equal(summary.official_release, false);
  const kinds = new Set(ledger.artifacts.map((artifact) => artifact.kind));
  assert.ok(kinds.has("pilot-report"));
  assert.ok(kinds.has("campaign-summary"));
  assert.ok(kinds.has("campaign-report"));
});
