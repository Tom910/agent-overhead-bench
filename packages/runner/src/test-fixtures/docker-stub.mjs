#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const relayStatePath = new URL("./relay-target", import.meta.url).pathname;
const relayAuthPath = new URL("./relay-auth", import.meta.url).pathname;
if (args[0] === "image" && args[1] === "inspect") {
  process.stdout.write("sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\n");
  process.exit(0);
}
if (args[0] === "network" && (args[1] === "create" || args[1] === "connect" || args[1] === "rm")) process.exit(0);
if (args[0] === "rm" && args[1] === "-f") process.exit(0);
if (args[0] === "exec") process.exit(0);
if (args[0] !== "run") process.exit(1);
if (args.includes("-d")) {
  const relayTarget = args.find((value) => value.startsWith("AOB_RELAY_TARGET_URL="));
  if (relayTarget) writeFileSync(relayStatePath, relayTarget.slice("AOB_RELAY_TARGET_URL=".length));
  if (args.includes("AOB_RELAY_AUTH_TOKEN") && process.env.AOB_RELAY_AUTH_TOKEN) writeFileSync(relayAuthPath, process.env.AOB_RELAY_AUTH_TOKEN);
  process.stdout.write("relay-id\n");
  process.exit(0);
}
const entryIndex = args.indexOf("--entrypoint");
const entrypoint = entryIndex >= 0 ? args[entryIndex + 1] : "";
if (["aider", "opencode", "qwen", "claude", "codex", "hermes"].includes(entrypoint)) {
  const versions = {
    aider: "0.86.2",
    opencode: "1.18.23",
    qwen: "0.22.2",
    claude: "2.1.246 (Claude Code)",
    codex: "WARNING: proceeding, even though we could not create PATH aliases: Read-only file system (os error 30)\ncodex-cli 0.149.1",
    hermes: "Hermes Agent v0.20.5",
  };
  process.stdout.write(versions[entrypoint] + "\n");
  process.exit(0);
}
const env = {};
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--env") {
    const declaration = String(args[i + 1]);
    const [name, ...rest] = declaration.split("=");
    env[name] = rest.length === 0 ? process.env[name] ?? "" : rest.join("=");
  }
}
const mount = args.find((value) => value.startsWith("type=bind,src="));
const source = mount?.match(/^type=bind,src=(.*),dst=/)?.[1];
if (!source) process.exit(1);
if (entrypoint === "/opt/aob/runner-entrypoint.sh") {
  const toolIndex = args.findIndex((value) => /^sha256:[0-9a-f]{64}$/i.test(value)) + 1;
  const tool = args[toolIndex];
  const configPath = source + "/.aob-codex-home/config.toml";
  const config = existsSync(configPath) ? readFileSync(configPath, "utf8") : "";
  const configuredBase = config.match(/^base_url = "([^"]+)"$/m)?.[1];
  const base = env.ANTHROPIC_BASE_URL ?? env.OPENROUTER_BASE_URL ?? env.OPENAI_BASE_URL ?? env.OPENAI_API_BASE ?? configuredBase;
  if (!base) process.exit(1);
  const endpointPath = tool === "claude" ? "/messages" : tool === "codex" || tool === "opencode" ? "/responses" : "/chat/completions";
  const basePath = new URL(base).pathname.replace(/\/$/, "");
  const relayTarget = base.startsWith("http://aob-relay:8080")
    ? readFileSync(relayStatePath, "utf8").trim()
    : base;
  const endpoint = new URL(relayTarget.replace(/\/$/, "") + basePath + endpointPath);
  endpoint.hostname = "127.0.0.1";
  const proxyToken = existsSync(relayAuthPath) ? readFileSync(relayAuthPath, "utf8").trim() : undefined;
  const modelIndex = args.findIndex((value) => value === "--model" || value === "-m");
  const rawModel = modelIndex >= 0 ? args[modelIndex + 1] : "z-ai/glm-5.3-flash";
  const model = rawModel?.startsWith("openai/")
    ? rawModel.slice("openai/".length)
    : rawModel;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", ...(proxyToken ? { "x-aob-proxy-token": proxyToken } : {}) },
    body: JSON.stringify({ model, messages: [{ role: "user", content: "integration" }] }),
  });
  if (!response.ok) {
    process.stderr.write(`stub request rejected: ${response.status} ${endpoint.pathname}\n`);
    process.exit(1);
  }
  writeFileSync(source + "/SOLVED", "ok\n");
  const behavior = existsSync(source + "/fixture-behavior") ? readFileSync(source + "/fixture-behavior", "utf8") : "";
  if (behavior === "error") process.exit(7);
  if (behavior === "timeout") await new Promise(() => { setInterval(() => {}, 1000); });

  if (args.includes("--json")) {
    process.stdout.write(JSON.stringify({ type: "thread.started", thread_id: "integration" }) + "\n");
    process.stdout.write(JSON.stringify({ type: "item.started", item: { id: "integration-command", type: "command_execution", command: "true" } }) + "\n");
    process.stdout.write(JSON.stringify({ type: "item.completed", item: { id: "integration-command", type: "command_execution", status: "completed" } }) + "\n");
  } else if (args.includes("--format") && args.includes("json")) {
    await new Promise((resolve) => setTimeout(resolve, 10));
    const now = Date.now();
    process.stdout.write(JSON.stringify({ type: "step_start", part: { type: "step-start" } }) + "\n");
    process.stdout.write(JSON.stringify({
      type: "tool_use",
      part: { type: "tool", callID: "integration-opencode", tool: "bash", state: { status: "completed", time: { start: now - 20, end: now - 10 } } },
    }) + "\n");
  } else {
    process.stdout.write("container integration complete\n");
  }
  process.exit(0);
}
if (entrypoint === "node") {
  const ok = existsSync(source + "/SOLVED");
  process.stdout.write((ok ? "verified\n" : "missing\n") + "\n__AOB_VERIFY_META__" + JSON.stringify({ exit: ok ? 0 : 1, duration_ms: 1 }) + "\n");
  process.exit(ok ? 0 : 1);
}
if (entrypoint === "aob-native-verify") {
  process.exit(existsSync(source + "/SOLVED") ? 0 : 1);
}
process.exit(1);
