#!/usr/bin/env node
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = fileURLToPath(new URL("..", import.meta.url));
const check = spawnSync(process.execPath, [join(root, "scripts/s6-current-campaign.mjs"), "--check"], { stdio: "inherit" });
if (check.status !== 0) process.exit(check.status ?? 1);
const { dataset, audit_dataset, conditions_dataset, schema_version, kind } = JSON.parse(readFileSync(join(root, "evidence/current-campaign.json"), "utf8"));
const output = join(root, "_site");
rmSync(output, { recursive: true, force: true });
mkdirSync(join(output, "data"), { recursive: true });
// Explicit allowlist: never upload raw results, credentials or the repository tree.
cpSync(join(root, "site/index.html"), join(output, "index.html"));
const snapshot = schema_version === 2 && kind === "five-cli-1017-descriptive-snapshot" && dataset === "linux-results-2026-10-24";
let report = readFileSync(join(root, "evidence", dataset, "analysis.html"), "utf8");
if (snapshot) for (const file of ["extra-attempts.json", "cohorts.json", "collection-ledger.json"]) report = report.replaceAll(`href="${file}"`, `href="data/${file}"`);
writeFileSync(join(output, "report.html"), report);
const files = snapshot
  ? ["analysis.json", "analysis.md", "analysis.html", "index.html", "report.html", "README.md", "summary.json", "provenance.json", "comparison.json", "diagnostics.json", "decision-cards.json", "extra-attempts.json", "cohorts.json", "native-evidence.json", "collection-ledger.json", "source.json"]
  : ["analysis.json", "analysis.md", "summary.json", "provenance.json", "comparison.json", "diagnostics.json"];
for (const file of files) {
  cpSync(join(root, "evidence", dataset, file), join(output, "data", file));
}
if (audit_dataset) cpSync(join(root, "evidence", audit_dataset, "audit.json"), join(output, "data/task-audit.json"));
if (conditions_dataset) cpSync(join(root, "evidence", conditions_dataset, "conditions.json"), join(output, "data/conditions.json"));
process.stdout.write(`Built GitHub Pages artifact from ${dataset} in _site/.\n`);
