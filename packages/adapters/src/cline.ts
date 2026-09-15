import { readFileSync } from "node:fs";
import { ConfigError } from "@aob/contracts";
import type { Adapter, AdapterRunOpts, ContainerInvocation } from "./types.js";

/**
 * Route cline through the metering proxy as an OpenAI-compatible provider.
 *
 * `cline auth -b <url>` writes this file; seeding it directly keeps the
 * measured cell to a single command instead of spending one on configuration.
 * The shape is cline's own, captured from that command.
 */
function providers(opts: AdapterRunOpts): string {
  return `${JSON.stringify({
    version: 1,
    lastUsedProvider: "openai-compatible",
    modes: {},
    providers: {
      "openai-compatible": {
        settings: {
          provider: "openai-compatible",
          apiKey: opts.env.OPENROUTER_API_KEY ?? "",
          model: opts.model,
          baseUrl: `${opts.proxyUrl}/v1`,
        },
        // Required. cline silently ignores a provider entry without it and
        // falls back to the real OpenAI endpoint, so the cell would leave the
        // measured route entirely. Fixed rather than generated, to keep the
        // container input byte-identical across repetitions.
        updatedAt: "2026-09-04T00:00:00.000Z",
        tokenSource: "manual",
      },
    },
  }, null, 2)}\n`;
}

function invocation(opts: AdapterRunOpts): ContainerInvocation {
  const home = `${opts.workspaceDir}/.aob-cline-home`;
  return {
    image: "aob-cline:s2",
    toolVersion: "3.0.61",
    versionArgv: ["cline", "--version"],
    workdir: opts.workspaceDir,
    env: { HOME: home, CI: "1" },
    setupFiles: [{ path: `${home}/.cline/data/settings/providers.json`, contents: providers(opts) }],
    argv: [
      "cline",
      "--json",
      // Tool prompts would block forever in a headless cell.
      "--auto-approve", "true",
      // No --timeout: the runner owns the cell's time bound, and a second
      // internal timeout would race it and attribute a harness stop to the
      // tool. cline's own default is already "no timeout"; passing 0
      // explicitly is rejected even though its help documents that value.
      ...(opts.condition === "pinned" ? ["--provider", "openai-compatible", "--model", opts.model] : []),
      "--",
      readFileSync(opts.promptFile, "utf8"),
    ],
  };
}

export const clineAdapter: Adapter = {
  name: "cline",
  capabilities: {
    headless: true,
    ori: false,
    baseUrlOverride: true,
    toolVisibility: "partial",
    containerOnly: true,
  },
  async version() {
    throw new ConfigError("cline is container-only; query version inside its container");
  },
  containerInvocation: invocation,
  async run() {
    throw new ConfigError("cline is container-only; use containerInvocation");
  },
};
