import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

test("verifier trusts only the workspace and exact immutable clone source", () => {
  const source = readFileSync(new URL("./deepswe-verifier.Dockerfile", import.meta.url), "utf8");
  const entries = [...source.matchAll(/git config --system --add safe\.directory ([^\s;&]+)/g)].map(match => match[1]);
  assert.deepEqual(entries.sort(), ["/app/.git", "/work/workspace"]);
});
