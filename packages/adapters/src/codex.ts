import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { extraRedact, restrictedEnv, spawnAdapter, spawnVersion } from "./spawn.js";
import { createCodexToolEventParser } from "./codex-events.js";
import type { Adapter, AdapterRunOpts, ContainerInvocation } from "./types.js";

const CODEX_CONTAINER_PATH = [
  "/opt/aob/npm/codex/node_modules/.bin",
  "/opt/aob/npm/codex/node_modules/@openai/codex-linux-arm64/vendor/aarch64-unknown-linux-musl/codex-resources",
  "/usr/local/sbin",
  "/usr/local/bin",
  "/usr/sbin",
  "/usr/bin",
  "/sbin",
  "/bin",
].join(":");

// OpenRouter's Responses compatibility layer does not accept every optional
// server-side tool advertised by recent Codex releases.  The benchmark tasks
// need the normal shell/edit loop only, so keep that loop while removing
// browser/computer/image/app tools that can make the request invalid before
// the model is called.  This is part of the pinned headless invocation.
const HEADLESS_FEATURE_FLAGS = [
  "--disable", "apps",
  "--disable", "browser_use",
  "--disable", "browser_use_external",
  "--disable", "computer_use",
  "--disable", "image_generation",
  "--disable", "tool_search",
];

function bin(): string {
  return process.env.AOB_CODEX_BIN ?? "codex";
}

function containerInvocation(opts: AdapterRunOpts): ContainerInvocation {
  const home = join(opts.workspaceDir, ".aob-codex-home");
  const config = [
    'model_provider = "openrouter"',
    ...(opts.condition === "pinned" ? [`model = ${JSON.stringify(opts.model)}`] : []),
    'model_reasoning_effort = "high"',
    'web_search = "disabled"',
    "",
    "[model_providers.openrouter]",
    'name = "openrouter"',
    `base_url = ${JSON.stringify(`${opts.proxyUrl}/v1`)}`,
    'env_key = "OPENROUTER_API_KEY"',
    'wire_api = "responses"',
    "",
  ].join("\n");
  return {
    image: "aob-codex:s2",
    toolVersion: "codex-cli 0.149.1",
    versionArgv: ["codex", "--version"],
    workdir: opts.workspaceDir,
    env: {
      HOME: home,
      CODEX_HOME: "/work/workspace/.aob-codex-home",
      OPENROUTER_API_KEY: opts.env.OPENROUTER_API_KEY ?? "",
      CI: "1",
      PATH: CODEX_CONTAINER_PATH,
    },
    // The Docker cell is the outer sandbox. Codex's nested bubblewrap mode
    // requires privileges that would weaken the shared container boundary.
    argv: ["codex", "exec", "--json", ...HEADLESS_FEATURE_FLAGS, "--skip-git-repo-check", "--ephemeral", "--dangerously-bypass-approvals-and-sandbox", "-C", "/work/workspace", ...(opts.condition === "pinned" ? ["-m", opts.model] : []), "--", readFileSync(opts.promptFile, "utf8").trimEnd()],
    toolEventFormat: "codex-json",
    setupFiles: [{ path: join(home, "config.toml"), contents: config }],
  };
}

/** S2: isolated CODEX_HOME; the host path uses workspace-write and the Docker path uses the outer sandbox boundary. Do not pass --ignore-user-config. */
export const codexAdapter: Adapter = {
  name: "codex",
  pinnedVersion: "codex-cli 0.149.1",
  capabilities: {
    headless: true,
    ori: false,
    baseUrlOverride: true,
    toolVisibility: "partial",
  },
  containerInvocation,
  version: () => spawnVersion(bin()),
  async run(opts: AdapterRunOpts) {
    const prompt = readFileSync(opts.promptFile, "utf8").trimEnd();
    const home = join(opts.workspaceDir, ".aob-codex-home");
    mkdirSync(home, { recursive: true });
    const config = [
        'model_provider = "openrouter"',
        "",
        'model_reasoning_effort = "high"',
        'web_search = "disabled"',
        "[model_providers.openrouter]",
        'name = "openrouter"',
        `base_url = ${JSON.stringify(`${opts.proxyUrl}/v1`)}`,
        'env_key = "OPENROUTER_API_KEY"',
        'wire_api = "responses"',
        "",
      ];
    if (opts.condition === "pinned") config.splice(1, 0, `model = ${JSON.stringify(opts.model)}`);
    writeFileSync(join(home, "config.toml"), config.join("\n"));
    const env = {
      ...restrictedEnv(opts.env),
      ...opts.env,
      CI: "1",
      CODEX_HOME: home,
    };
    const modelArgs = opts.condition === "pinned" ? ["-m", opts.model] : [];
    return spawnAdapter({
      bin: bin(),
      argv: [
        "exec",
        "--json",
        ...HEADLESS_FEATURE_FLAGS,
        "--skip-git-repo-check",
        "--ephemeral",
        "--sandbox",
        "workspace-write",
        "-C",
        opts.workspaceDir,
        ...modelArgs,
        "--",
        prompt,
      ],
      cwd: opts.workspaceDir,
      env,
      timeoutS: opts.timeoutS,
      extraRedact: extraRedact(env),
      toolEventParser: createCodexToolEventParser(),
    });
  },
};
