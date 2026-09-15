#!/usr/bin/env node
import { lstatSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function fail(message) {
  process.stderr.write(`S7 source policy: ${message}\n`);
  process.exit(1);
}

const [rootArg, manifestArg] = process.argv.slice(2);
if (!rootArg || !manifestArg) fail("usage: s7-source-policy.mjs REPOSITORY_ROOT SOURCE_MANIFEST");
const manifestPath = resolve(rootArg, manifestArg);
let manifest;
try {
  const info = lstatSync(manifestPath);
  if (info.isSymbolicLink() || !info.isFile()) fail(`source manifest is not a regular file: ${manifestPath}`);
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (error) {
  fail(`source manifest is unavailable or invalid: ${error instanceof Error ? error.message : String(error)}`);
}

if (manifest === null || typeof manifest !== "object" || Array.isArray(manifest)) {
  fail("source manifest must be a JSON object");
}

if (manifest.source_adapter !== "deepswe") {
  process.stdout.write("S7 source policy: non-DeepSWE source accepted\n");
  process.exit(0);
}

if (typeof manifest.source_dataset !== "string" || manifest.source_dataset.trim() === "") {
  fail("DeepSWE source_dataset is missing");
}

const lineage = manifest.source_dataset.toLowerCase();
if (lineage !== "swe-bench-ultra" && (/swe-bench/.test(lineage) || /terminal-bench|vetta/.test(lineage))) {
  fail(`restricted source dataset lineage: ${manifest.source_dataset}`);
}

process.stdout.write(`S7 source policy: DeepSWE lineage accepted (${manifest.source_dataset})\n`);
