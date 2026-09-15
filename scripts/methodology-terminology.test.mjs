import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const root = fileURLToPath(new URL("..", import.meta.url));

test("methodology distinguishes attempt turns from successful usage and cost", () => {
  const methodology = readFileSync(join(root, "METHODOLOGY.md"), "utf8");
  assert.match(methodology, /turns count identifiable model API attempts/i);
  assert.match(methodology, /usage, cache, and cost remain successful-response-only/i);
  assert.doesNotMatch(methodology, /successful-turn counts/i);
});
