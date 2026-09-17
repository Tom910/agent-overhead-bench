#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const result = spawnSync(process.execPath, [
  "--experimental-strip-types", "--no-warnings", "--experimental-loader",
  join(root, "scripts/ts-source-loader.mjs"),
  join(root, "packages/report/src/campaign-analysis.ts"),
  ...process.argv.slice(2),
], { stdio: "inherit" });
if (result.error) process.stderr.write(`${result.error.message}\n`);
process.exit(result.status ?? 1);
