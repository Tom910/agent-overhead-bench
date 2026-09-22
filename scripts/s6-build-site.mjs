#!/usr/bin/env node
import { cpSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = fileURLToPath(new URL("..", import.meta.url));
const check = spawnSync(process.execPath, [join(root, "scripts/s6-current-campaign.mjs"), "--check"], { stdio: "inherit" });
if (check.status !== 0) process.exit(check.status ?? 1);
const { dataset } = JSON.parse(readFileSync(join(root, "evidence/current-campaign.json"), "utf8"));
const output = join(root, "_site");
rmSync(output, { recursive: true, force: true });
mkdirSync(join(output, "data"), { recursive: true });
// Explicit allowlist: never upload raw results, credentials or the repository tree.
cpSync(join(root, "site/index.html"), join(output, "index.html"));
cpSync(join(root, "evidence", dataset, "analysis.html"), join(output, "report.html"));
for (const file of ["analysis.json", "analysis.md", "summary.json", "provenance.json"]) {
  cpSync(join(root, "evidence", dataset, file), join(output, "data", file));
}
process.stdout.write(`Built GitHub Pages artifact from ${dataset} in _site/.\n`);
