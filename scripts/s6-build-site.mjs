#!/usr/bin/env node
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { register } from "node:module";

const root = fileURLToPath(new URL("..", import.meta.url));
const pointer = JSON.parse(readFileSync(join(root, "evidence/current-campaign.json"), "utf8"));
if (pointer.schema_version === 2 && pointer.kind === "five-cli-1017-descriptive-snapshot") {
  register("./ts-source-loader.mjs", import.meta.url);
  const { buildPublishedSite } = await import("../packages/report/src/current-report.ts");
  buildPublishedSite(root, join(root, "_site"));
  process.stdout.write(`Built page from ${pointer.dataset}/report.json in _site/.\n`);
} else {
  const check = spawnSync(process.execPath, [join(root, "scripts/s6-current-campaign.mjs"), "--check"], { stdio: "inherit" });
  if (check.status !== 0) process.exit(check.status ?? 1);
  const { dataset, audit_dataset, conditions_dataset } = pointer;
  const output = join(root, "_site");
  rmSync(output, { recursive: true, force: true });
  mkdirSync(join(output, "data"), { recursive: true });
  // Legacy profile: explicit allowlist, never upload raw results or the repository tree.
  cpSync(join(root, "site/index.html"), join(output, "index.html"));
  writeFileSync(join(output, "report.html"), readFileSync(join(root, "evidence", dataset, "analysis.html"), "utf8"));
  for (const file of ["analysis.json", "analysis.md", "summary.json", "provenance.json", "comparison.json", "diagnostics.json"]) {
    cpSync(join(root, "evidence", dataset, file), join(output, "data", file));
  }
  if (audit_dataset) cpSync(join(root, "evidence", audit_dataset, "audit.json"), join(output, "data/task-audit.json"));
  if (conditions_dataset) cpSync(join(root, "evidence", conditions_dataset, "conditions.json"), join(output, "data/conditions.json"));
  process.stdout.write(`Built GitHub Pages artifact from ${dataset} in _site/.\n`);
}
