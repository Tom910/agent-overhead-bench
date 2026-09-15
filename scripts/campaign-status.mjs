#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve, join } from "node:path";

if (process.argv.length !== 3 || process.argv[2] === "--help") {
  process.stdout.write("Usage: node scripts/campaign-status.mjs CAMPAIGN_ROOT\nRead-only progress and recorded campaign spend; sends no provider requests.\n");
  process.exit(process.argv[2] === "--help" ? 0 : 1);
}
try {
  const root = resolve(process.argv[2]);
  const state = JSON.parse(readFileSync(join(root, "state.json"), "utf8"));
  const definition = JSON.parse(state.definition_key);
  if (definition.executionProtocol !== "tool-batches-v1" || !Array.isArray(state.cells) ||
      !Array.isArray(definition.tools) || !Number.isFinite(state.spentUsd) ||
      !Number.isFinite(definition.validationSpendUsd) || !Number.isFinite(definition.capUsd)) {
    process.stderr.write("campaign-status: invalid tool campaign state\n");
    process.exit(1);
  }
  const tools = definition.tools.map((tool) => {
    const cells = state.cells.filter((cell) => cell.tool === tool);
    const counts = Object.fromEntries(["pending", "staged", "running", "verifying", "done", "task_failed", "failed", "quarantined"].map((status) => [status, cells.filter((cell) => cell.status === status).length]));
    return { tool, total: cells.length, ...counts };
  });
  process.stdout.write(JSON.stringify({
    protocol: definition.executionProtocol,
    campaign_spend_usd: state.spentUsd,
    validation_spend_usd: definition.validationSpendUsd,
    total_recorded_spend_usd: state.spentUsd + definition.validationSpendUsd,
    campaign_cap_usd: definition.capUsd,
    remaining_recorded_budget_usd: definition.capUsd - state.spentUsd - definition.validationSpendUsd,
    tools,
  }, null, 2) + "\n");
} catch (error) {
  process.stderr.write(`campaign-status: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
