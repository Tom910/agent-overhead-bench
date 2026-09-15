#!/usr/bin/env node
/** CLI contract: prepare selected manifest-listed Git tasks into a local C2 tree. */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ConfigError } from "@aob/contracts";
import { prepareGitTaskPack, prepareGitTasks, validateGitTaskManifest, validateGitTaskPackManifest } from "./source.js";

const manifestPath = process.argv[2];
const checkoutDir = process.argv[3];
const outputDir = process.argv[4];
const selectedIds = process.argv.slice(5);
if (!manifestPath || !checkoutDir || !outputDir) {
  throw new ConfigError("usage: aob-task-source MANIFEST_JSON CHECKOUT_DIR OUTPUT_DIR [TASK_ID ...]");
}

let manifest: ReturnType<typeof validateGitTaskManifest> | ReturnType<typeof validateGitTaskPackManifest>;
try {
  const raw: unknown = JSON.parse(readFileSync(manifestPath, "utf8"));
  manifest = typeof raw === "object" && raw !== null && (raw as { source_adapter?: unknown }).source_adapter === "git-taskpack"
    ? validateGitTaskPackManifest(raw)
    : validateGitTaskManifest(raw);
} catch (error) {
  if (error instanceof ConfigError) throw error;
  throw new ConfigError(`cannot read Git task manifest: ${error instanceof Error ? error.message : String(error)}`);
}
const prepared = manifest.source_adapter === "git-taskpack"
  ? await prepareGitTaskPack(manifest, checkoutDir, outputDir, selectedIds.length > 0 ? selectedIds : undefined)
  : await prepareGitTasks(manifest, checkoutDir, outputDir, selectedIds.length > 0 ? selectedIds : undefined);
writeFileSync(join(outputDir, "suite-manifest.json"), `${JSON.stringify(prepared, null, 2)}\n`, { mode: 0o600 });
process.stdout.write(`${JSON.stringify({ output: outputDir, tasks: prepared.tasks.map((task) => task.id) })}\n`);
