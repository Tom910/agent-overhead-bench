import { readFileSync } from "node:fs";
import { ConfigError } from "@aob/contracts";
import type { Adapter, AdapterRunOpts, ContainerInvocation } from "./types.js";

function invocation(opts: AdapterRunOpts): ContainerInvocation {
  const home = `${opts.workspaceDir}/.aob-qwen-home`;
  return {
    image: "aob-qwen:s2",
    toolVersion: "0.22.2",
    versionArgv: ["qwen", "--version"],
    workdir: opts.workspaceDir,
    env: {
      HOME: home,
      OPENAI_API_KEY: opts.env.OPENROUTER_API_KEY ?? "",
      OPENAI_BASE_URL: `${opts.proxyUrl}/v1`,
      CI: "1",
    },
    setupFiles: [{
      path: `${home}/.qwen/settings.json`,
      contents: '{"security":{"auth":{"selectedType":"openai"}}}\n',
    }],
    // An attached value keeps leading hyphens literal in Qwen's option parser.
    argv: ["qwen", `--prompt=${readFileSync(opts.promptFile, "utf8")}`, "--yolo", ...(opts.condition === "pinned" ? ["-m", opts.model] : []), "-o", "json"],
  };
}

export const qwenAdapter: Adapter = {
  name: "qwen",
  capabilities: {
    headless: true,
    ori: false,
    baseUrlOverride: true,
    toolVisibility: "partial",
    containerOnly: true,
  },
  async version() {
    throw new ConfigError("qwen is container-only; query version inside its container");
  },
  containerInvocation: invocation,
  async run() {
    throw new ConfigError("qwen is container-only; use containerInvocation");
  },
};
