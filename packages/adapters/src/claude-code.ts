import { mkdirSync, readFileSync } from "node:fs";
import { ConfigError } from "@aob/contracts";
import { join } from "node:path";
import { extraRedact, restrictedEnv, spawnAdapter, spawnVersion } from "./spawn.js";
import type { Adapter, AdapterRunOpts, ContainerInvocation } from "./types.js";

function bin(): string {
  return process.env.AOB_CLAUDE_BIN ?? "claude";
}

function hostUser(): string {
  const uid = typeof process.getuid === "function" ? process.getuid() : 1000;
  const gid = typeof process.getgid === "function" ? process.getgid() : uid;
  if (uid <= 0 || gid < 0) throw new ConfigError("Claude Code requires a non-root container user");
  return `${uid}:${gid}`;
}

function toolArgs(opts: AdapterRunOpts): string[] {
  if (opts.toolConfiguration === undefined) return [];
  if (opts.toolConfiguration !== "claude-code-no-web-search") throw new ConfigError("Unsupported Claude tool configuration");
  return ["--disallowedTools", "WebSearch"];
}

function containerInvocation(opts: AdapterRunOpts): ContainerInvocation {
  const home = join(opts.workspaceDir, ".aob-home");
  const env: Record<string, string> = {
    HOME: home,
    ANTHROPIC_BASE_URL: opts.proxyUrl,
    ANTHROPIC_AUTH_TOKEN: opts.env.OPENROUTER_API_KEY ?? "",
    ANTHROPIC_API_KEY: "",
    CI: "1",
  };
  if (opts.condition === "pinned") {
    env.ANTHROPIC_DEFAULT_SONNET_MODEL = opts.model;
    env.ANTHROPIC_DEFAULT_HAIKU_MODEL = opts.model;
    env.ANTHROPIC_DEFAULT_OPUS_MODEL = opts.model;
    env.ANTHROPIC_MODEL = opts.model;
    env.ANTHROPIC_SMALL_FAST_MODEL = opts.model;
    env.CLAUDE_CODE_SUBAGENT_MODEL = opts.model;
    // Claude Code appends its 1M-context marker to custom model IDs. That
    // marker is not a valid OpenRouter model ID, so use the normal context
    // path for third-party provider remapping.
    env.CLAUDE_CODE_DISABLE_1M_CONTEXT = "1";
    env.CLAUDE_CODE_DISABLE_UNKNOWN_MODEL_WINDOW_ENFORCEMENT = "1";
  }
  return {
    image: "aob-claude-code:s2",
    toolVersion: "2.1.246",
    versionArgv: ["claude", "--version"],
    workdir: opts.workspaceDir,
    user: hostUser(),
    env,
    argv: ["claude", "-p", "--output-format", "json", "--permission-mode", "bypassPermissions", ...toolArgs(opts), "--", readFileSync(opts.promptFile, "utf8")],
    setupFiles: [{ path: join(home, ".keep"), contents: "" }],
  };
}

/** Exact argv: claude -p --output-format json --permission-mode bypassPermissions -- <prompt>.
 * The provider model is selected through ANTHROPIC_DEFAULT_*_MODEL because
 * Claude Code validates --model as a native Claude alias before making the
 * provider request.
 */
export const claudeCodeAdapter: Adapter = {
  name: "claude-code",
  pinnedVersion: "2.1.246 (Claude Code)",
  capabilities: {
    headless: true,
    ori: false,
    baseUrlOverride: true,
    toolVisibility: "partial",
  },
  containerInvocation,
  version: () => spawnVersion(bin()),
  async run(opts: AdapterRunOpts) {
    const prompt = readFileSync(opts.promptFile, "utf8");
    const key = opts.env.OPENROUTER_API_KEY ?? "";
    const home = join(opts.workspaceDir, ".aob-home");
    mkdirSync(home, { recursive: true });
    const env: Record<string, string> = {
      ...restrictedEnv(opts.env),
      ...opts.env,
      CI: "1",
      HOME: home,
      ANTHROPIC_BASE_URL: opts.proxyUrl,
      ANTHROPIC_AUTH_TOKEN: key,
      ANTHROPIC_API_KEY: "",
    };
    if (opts.condition === "pinned") {
      env.ANTHROPIC_DEFAULT_SONNET_MODEL = opts.model;
      env.ANTHROPIC_DEFAULT_HAIKU_MODEL = opts.model;
      env.ANTHROPIC_DEFAULT_OPUS_MODEL = opts.model;
      env.ANTHROPIC_MODEL = opts.model;
      env.ANTHROPIC_SMALL_FAST_MODEL = opts.model;
      env.CLAUDE_CODE_SUBAGENT_MODEL = opts.model;
      env.CLAUDE_CODE_DISABLE_1M_CONTEXT = "1";
      env.CLAUDE_CODE_DISABLE_UNKNOWN_MODEL_WINDOW_ENFORCEMENT = "1";
    }
    return spawnAdapter({
      bin: bin(),
      argv: [
        "-p",
        "--output-format",
        "json",
        "--permission-mode",
        "bypassPermissions",
        ...toolArgs(opts),
        "--",
        prompt,
      ],
      cwd: opts.workspaceDir,
      env,
      timeoutS: opts.timeoutS,
      extraRedact: extraRedact(env),
    });
  },
};
