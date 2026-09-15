#!/usr/bin/env node
import { writeFileSync } from "node:fs";

const keys = [
  "ANTHROPIC_BASE_URL",
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_DEFAULT_SONNET_MODEL",
  "ANTHROPIC_DEFAULT_HAIKU_MODEL",
  "ANTHROPIC_DEFAULT_OPUS_MODEL",
  "ANTHROPIC_MODEL",
  "ANTHROPIC_SMALL_FAST_MODEL",
  "CLAUDE_CODE_DISABLE_1M_CONTEXT",
  "CLAUDE_CODE_DISABLE_UNKNOWN_MODEL_WINDOW_ENFORCEMENT",
  "CODEX_HOME",
  "OPENROUTER_BASE_URL",
  "OPENROUTER_API_KEY",
  "CI",
  "HOME",
  "AOB_UNDECLARED_SECRET",
];
const env = {};
for (const k of keys) {
  if (process.env[k] !== undefined) env[k] = process.env[k];
}
writeFileSync("stub-invoke.json", `${JSON.stringify({ argv: process.argv.slice(2), env }, null, 2)}\n`);
if (process.argv.includes("--version")) {
  process.stdout.write("stub 0.0.0\n");
  process.exit(0);
}
if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify({ type: "thread.started", thread_id: "stub" })}\n`);
  process.stdout.write(`${JSON.stringify({ type: "item.started", item: { id: "stub-command", type: "command_execution", command: "sk-or-testleakvalue999" } })}\n`);
  process.stdout.write(`${JSON.stringify({ type: "item.completed", item: { id: "stub-command", type: "command_execution", status: "completed" } })}\n`);
} else {
  process.stdout.write("ok\nleak sk-or-testleakvalue999\n");
}
