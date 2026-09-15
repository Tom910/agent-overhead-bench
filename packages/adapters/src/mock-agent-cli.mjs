#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const promptFile = process.argv[2];
const workspace = process.argv[3] ?? process.cwd();
const base = process.env.OPENAI_BASE_URL;
if (!base) {
  console.error("OPENAI_BASE_URL required");
  process.exit(2);
}
const res = await fetch(`${base.replace(/\/$/, "")}/v1/chat/completions`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    model: process.env.AOB_MODEL ?? "mock",
    messages: [{ role: "user", content: promptFile ?? "" }],
  }),
});
await res.text();
writeFileSync(join(workspace, "SOLVED"), "ok\n");
process.exit(0);
