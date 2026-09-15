#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import http from "node:http";

function request(url, body) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = http.request(parsed, {
      method: "POST",
      headers: { "content-type": "application/json", "content-length": Buffer.byteLength(body) },
    }, (res) => {
      res.resume();
      res.on("end", () => resolve(res.statusCode ?? 500));
    });
    req.on("error", reject);
    req.end(body);
  });
}

if (process.argv.includes("--version")) {
  process.stdout.write("integration-stub 1.0\n");
  process.exit(0);
}

let base = process.env.ANTHROPIC_BASE_URL ?? process.env.OPENROUTER_BASE_URL;
let requestPath = process.env.ANTHROPIC_BASE_URL ? "/messages" : "/chat/completions";
let model = process.env.ANTHROPIC_DEFAULT_HAIKU_MODEL ?? "z-ai/glm-5.3-flash";
if (process.env.CODEX_HOME) {
  const config = readFileSync(process.env.CODEX_HOME + "/config.toml", "utf8");
  base = /base_url = "([^"]+)"/.exec(config)?.[1];
  requestPath = "/responses";
  model = /model = "([^"]+)"/.exec(config)?.[1] ?? model;
} else {
  const modelIndex = process.argv.indexOf("-m");
  if (modelIndex >= 0) model = process.argv[modelIndex + 1] ?? model;
}
if (!base) throw new Error("proxy base URL missing");
const status = await request(
  new URL(base.replace(/\/$/, "") + requestPath).toString(),
  JSON.stringify({ model, messages: [{ role: "user", content: "integration" }] }),
);
if (status < 200 || status >= 300) throw new Error("mock upstream status " + status);
writeFileSync("SOLVED", "ok\n");
if (process.env.CODEX_HOME && process.argv.includes("--json")) {
  process.stdout.write(JSON.stringify({ type: "thread.started", thread_id: "integration" }) + "\n");
  process.stdout.write(JSON.stringify({ type: "item.started", item: { id: "integration-command", type: "command_execution", command: "true" } }) + "\n");
  process.stdout.write(JSON.stringify({ type: "item.completed", item: { id: "integration-command", type: "command_execution", status: "completed" } }) + "\n");
} else {
  process.stdout.write("integration complete\n");
}
