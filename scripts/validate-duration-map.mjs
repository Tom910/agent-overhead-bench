#!/usr/bin/env node
import { readFileSync } from "node:fs";

function fail(message) {
  throw new Error(message);
}

function assertUniqueJsonKeys(text) {
  let index = 0;
  const whitespace = () => { while (/\s/.test(text[index] ?? "")) index += 1; };
  const string = () => {
    const start = index;
    if (text[index++] !== '"') fail("invalid JSON string");
    while (index < text.length) {
      const character = text[index++];
      if (character === "\\") {
        if (index >= text.length) fail("invalid JSON escape");
        index += text[index] === "u" ? 5 : 1;
      } else if (character === '"') {
        try { return JSON.parse(text.slice(start, index)); } catch { fail("invalid JSON string"); }
      }
    }
    fail("unterminated JSON string");
  };
  const value = () => {
    whitespace();
    const character = text[index];
    if (character === "{") return object();
    if (character === "[") return array();
    if (character === '"') { string(); return; }
    if (text.startsWith("true", index)) { index += 4; return; }
    if (text.startsWith("false", index)) { index += 5; return; }
    if (text.startsWith("null", index)) { index += 4; return; }
    const number = text.slice(index).match(/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/);
    if (number) { index += number[0].length; return; }
    fail("invalid JSON value");
  };
  const array = () => {
    index += 1;
    whitespace();
    if (text[index] === "]") { index += 1; return; }
    while (true) {
      value();
      whitespace();
      if (text[index] === "]") { index += 1; return; }
      if (text[index++] !== ",") fail("invalid JSON array");
    }
  };
  const object = () => {
    index += 1;
    const keys = new Set();
    whitespace();
    if (text[index] === "}") { index += 1; return; }
    while (true) {
      whitespace();
      const key = string();
      if (keys.has(key)) fail(`duplicate JSON object key: ${key}`);
      keys.add(key);
      whitespace();
      if (text[index++] !== ":") fail("invalid JSON object");
      value();
      whitespace();
      if (text[index] === "}") { index += 1; return; }
      if (text[index++] !== ",") fail("invalid JSON object");
    }
  };
  value();
  whitespace();
  if (index !== text.length) fail("trailing JSON content");
}

const [path, regime, ...taskIds] = process.argv.slice(2);
if (!path || !regime || taskIds.length === 0) fail("usage: validate-duration-map.mjs MAP.json short|long|extended TASK_ID...");
const REGIME_RANGES = { short: [1, 5], long: [6, 15], extended: [16, 180] };
if (!Object.hasOwn(REGIME_RANGES, regime)) fail(`unknown regime ${regime}`);
const raw = readFileSync(path, "utf8");
assertUniqueJsonKeys(raw);
const value = JSON.parse(raw);
if (typeof value !== "object" || value === null || Array.isArray(value)) fail("duration map must be an object");
const requested = new Set(taskIds);
for (const taskId of taskIds) {
  const range = value[taskId];
  if (!Array.isArray(range) || range.length !== 2 || !range.every((entry) => Number.isInteger(entry))) fail(`invalid range for ${taskId}`);
  const [lo, hi] = range;
  const [floor, ceiling] = REGIME_RANGES[regime];
  const valid = lo >= floor && hi <= ceiling;
  if (lo > hi || !valid) fail(`range for ${taskId} is outside the ${regime} regime`);
  process.stdout.write(`${taskId}\t${lo}\t${hi}\n`);
}
for (const taskId of Object.keys(value)) if (!requested.has(taskId)) fail(`duration map contains unselected task ${taskId}`);
