#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { register } from "node:module";
register("./ts-source-loader.mjs", import.meta.url);
const { validateExecutionConditions } = await import("../packages/runner/src/execution-conditions.ts");
const [directory, ...extra] = process.argv.slice(2);
if (!directory || extra.length) throw new Error("Usage: node scripts/s5-check-execution-conditions.mjs RUN_DIRECTORY");
const run = await readFile(resolve(directory, "run.json"));
const conditions = JSON.parse(await readFile(resolve(directory, "execution-conditions.json"), "utf8"));
const checked = validateExecutionConditions(run, conditions);
console.log(JSON.stringify({ run_id: checked.run_id, binding: "verified", agent: checked.agent.status, verifier: checked.verifier?.status ?? "not-run" }));
