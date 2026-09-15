import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ConfigError } from "@aob/contracts";
import type { Adapter, AdapterRunOpts, ContainerInvocation } from "./types.js";

function openAiCompatibleModel(model: string): string {
  return model.startsWith("openai/") ? model : `openai/${model}`;
}

function openAiProviderModel(model: string): string {
  return model.startsWith("openai/") ? model.slice("openai/".length) : model;
}

function invocation(opts: AdapterRunOpts): ContainerInvocation {
  const home = join(opts.workspaceDir, ".aob-home");
  const configValue: Record<string, unknown> = {
    $schema: "https://opencode.ai/config.json",
    provider: {
      openai: {
        options: { baseURL: `${opts.proxyUrl}/v1` },
      },
    },
  };
  if (opts.condition === "pinned") {
    const model = openAiProviderModel(opts.model);
    configValue.model = openAiCompatibleModel(opts.model);
    configValue.small_model = openAiCompatibleModel(opts.model);
    (configValue.provider as { openai: { models: Record<string, { name: string }> } }).openai.models = { [model]: { name: model } };
  }
  const config = JSON.stringify(configValue, null, 2);
  return {
    image: "aob-opencode:s2",
    toolVersion: "1.18.23",
    versionArgv: ["opencode", "--version"],
    workdir: opts.workspaceDir,
    env: {
      HOME: home,
      OPENAI_API_KEY: opts.env.OPENROUTER_API_KEY ?? "",
      OPENAI_BASE_URL: `${opts.proxyUrl}/v1`,
      OPENROUTER_API_KEY: opts.env.OPENROUTER_API_KEY ?? "",
      CI: "1",
    },
    argv: ["opencode", "run", "--format", "json", ...(opts.condition === "pinned" ? ["--model", openAiCompatibleModel(opts.model)] : []), "--", readFileSync(opts.promptFile, "utf8").trimEnd()],
    toolEventFormat: "opencode-json",
    setupFiles: [
      { path: join(home, ".keep"), contents: "" },
      { path: join(home, ".config/opencode/opencode.json"), contents: `${config}\n` },
    ],
  };
}

export const opencodeAdapter: Adapter = {
  name: "opencode",
  capabilities: {
    headless: true,
    ori: false,
    baseUrlOverride: true,
    toolVisibility: "partial",
    containerOnly: true,
  },
  async version() {
    throw new ConfigError("opencode is container-only; query version inside its container");
  },
  containerInvocation: invocation,
  async run() {
    throw new ConfigError("opencode is container-only; use containerInvocation");
  },
};
