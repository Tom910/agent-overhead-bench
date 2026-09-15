import { ConfigError } from "@aob/contracts";
import { claudeCodeAdapter } from "./claude-code.js";
import { codexAdapter } from "./codex.js";
import { hermesAdapter } from "./hermes.js";
import { mockAgentAdapter } from "./mock-agent.js";
import { aiderAdapter } from "./aider.js";
import { opencodeAdapter } from "./opencode.js";
import { clineAdapter } from "./cline.js";
import { piAdapter } from "./pi.js";
import { qwenAdapter } from "./qwen.js";
import type { Adapter } from "./types.js";

const adapters: Record<string, Adapter> = {
  "mock-agent": mockAgentAdapter,
  // A second deterministic identity exercises matrix block randomization in
  // the reduced dry run. It is not an official harness adapter.
  "mock-agent-secondary": { ...mockAgentAdapter, name: "mock-agent-secondary" },
  "claude-code": claudeCodeAdapter,
  codex: codexAdapter,
  hermes: hermesAdapter,
  aider: aiderAdapter,
  opencode: opencodeAdapter,
  cline: clineAdapter,
  pi: piAdapter,
  qwen: qwenAdapter,
};

export function getAdapter(name: string): Adapter {
  const adapter = adapters[name];
  if (!adapter) throw new ConfigError(`unknown adapter ${name}`);
  return adapter;
}

export function adapterNames(): string[] {
  return Object.keys(adapters);
}

/** Verifies the host-side S2 pins before any provider request is allowed. */
export async function verifyHostVersionPins(names = ["claude-code", "codex", "hermes"]): Promise<void> {
  for (const name of names) {
    const adapter = getAdapter(name);
    if (adapter.containerInvocation !== undefined || adapter.pinnedVersion === undefined) continue;
    const actual = await adapter.version();
    if (actual !== adapter.pinnedVersion) {
      throw new ConfigError(`${name} version drift: expected ${adapter.pinnedVersion}, found ${actual}`);
    }
  }
}
