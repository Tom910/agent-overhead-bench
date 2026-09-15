import { readFileSync } from "node:fs";
import { ConfigError } from "@aob/contracts";
import type { Adapter, AdapterRunOpts, ContainerInvocation } from "./types.js";

/**
 * Route pi through the metering proxy as a custom OpenAI-compatible provider.
 *
 * pi has no base-URL flag; custom providers are declared in
 * ~/.pi/agent/models.json with an explicit `baseUrl`, which is exactly the
 * shape the proxy needs. The provider
 * is named `aob` so it cannot collide with pi's built-in provider list, and the
 * pinned model is declared explicitly so pi never resolves a different one.
 */
function settings(opts: AdapterRunOpts): string {
  return `${JSON.stringify({
    providers: {
      aob: {
        baseUrl: `${opts.proxyUrl}/v1`,
        api: "openai-completions",
        apiKey: opts.env.OPENROUTER_API_KEY ?? "",
        models: [{ id: opts.model }],
      },
    },
  }, null, 2)}\n`;
}

function invocation(opts: AdapterRunOpts): ContainerInvocation {
  const home = `${opts.workspaceDir}/.aob-pi-home`;
  const prompt = readFileSync(opts.promptFile, "utf8").trimEnd();
  const useStdin = prompt.startsWith("-");
  const promptPath = `${home}/prompt.txt`;
  return {
    image: "aob-pi:s2",
    toolVersion: "0.73.1",
    versionArgv: ["pi", "--version"],
    workdir: opts.workspaceDir,
    env: {
      HOME: home,
      // pi reads PI_KEY for its own provider credentials; the proxy injects the
      // real upstream key, so the value here only has to be non-empty.
      PI_KEY: opts.env.OPENROUTER_API_KEY ?? "",
      // The measured cell has no network beyond the proxy. Skip pi's startup
      // version and telemetry calls so a DNS failure is not charged to the
      // tool as harness time.
      PI_OFFLINE: "1",
      PI_SKIP_VERSION_CHECK: "1",
      PI_TELEMETRY: "0",
      CI: "1",
    },
    setupFiles: [
      { path: `${home}/.pi/agent/models.json`, contents: settings(opts) },
      ...(useStdin ? [{ path: promptPath, contents: prompt }] : []),
    ],
    argv: [
      // Pi 0.73.1 has no end-of-options sentinel. Its stdin route accepts
      // literal leading-hyphen prompts without interpreting them as flags.
      ...(useStdin ? ["sh", "-c", 'prompt=$1; shift; exec "$@" < "$prompt"', "aob-pi-stdin", ".aob-pi-home/prompt.txt"] : []),
      "pi",
      "--print",
      "--mode", "json",
      "--no-session",
      // Discovery of AGENTS.md/CLAUDE.md would let repository content vary the
      // measured prompt between tasks; keep the cell's input deterministic.
      "--no-context-files",
      "--no-extensions",
      "--no-skills",
      ...(opts.condition === "pinned" ? ["--provider", "aob", "--model", opts.model] : []),
      ...(useStdin ? [] : [prompt]),
    ],
  };
}

export const piAdapter: Adapter = {
  name: "pi",
  capabilities: {
    headless: true,
    ori: false,
    baseUrlOverride: true,
    toolVisibility: "partial",
    containerOnly: true,
  },
  async version() {
    throw new ConfigError("pi is container-only; query version inside its container");
  },
  containerInvocation: invocation,
  async run() {
    throw new ConfigError("pi is container-only; use containerInvocation");
  },
};
