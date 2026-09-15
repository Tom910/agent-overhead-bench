import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { extraRedact, restrictedEnv, spawnAdapter, spawnVersion } from "./spawn.js";
import type { Adapter, AdapterRunOpts, ContainerInvocation } from "./types.js";

function bin(): string {
  return process.env.AOB_HERMES_BIN ?? "hermes";
}

const HERMES_CONFIG = "terminal:\n  oneshot_completion_wait_seconds: 0\n";

function configPath(home: string): string {
  return join(home, ".hermes", "config.yaml");
}

function containerInvocation(opts: AdapterRunOpts): ContainerInvocation {
  const home = join(opts.workspaceDir, ".aob-home");
  return {
    image: "aob-hermes:s2",
    toolVersion: "Hermes Agent v0.20.5",
    versionArgv: ["hermes", "--version"],
    workdir: opts.workspaceDir,
    env: {
      HOME: home,
      OPENROUTER_API_KEY: opts.env.OPENROUTER_API_KEY ?? "",
      OPENROUTER_BASE_URL: `${opts.proxyUrl}/v1`,
      CI: "1",
    },
    argv: ["hermes", "-z", readFileSync(opts.promptFile, "utf8").trimEnd(), "--provider", "openrouter", ...(opts.condition === "pinned" ? ["-m", opts.model] : []), "--yolo", "--in", "/work/workspace"],
    setupFiles: [
      { path: join(home, ".keep"), contents: "" },
      { path: configPath(home), contents: HERMES_CONFIG },
    ],
  };
}

/** S2 exact_argv: hermes -z <prompt> --provider openrouter -m <id> --yolo --in <ws> */
export const hermesAdapter: Adapter = {
  name: "hermes",
  pinnedVersion: "Hermes Agent v0.20.5 (2026.8.19)",
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
    const home = join(opts.workspaceDir, ".aob-home");
    mkdirSync(home, { recursive: true });
    mkdirSync(join(home, ".hermes"), { recursive: true });
    writeFileSync(configPath(home), HERMES_CONFIG);
    const env = {
      ...restrictedEnv(opts.env),
      ...opts.env,
      CI: "1",
      HOME: home,
      OPENROUTER_BASE_URL: `${opts.proxyUrl}/v1`,
    };
    const modelArgs = opts.condition === "pinned" ? ["-m", opts.model] : [];
    return spawnAdapter({
      bin: bin(),
      argv: ["-z", prompt, "--provider", "openrouter", ...modelArgs, "--yolo", "--in", opts.workspaceDir],
      cwd: opts.workspaceDir,
      env,
      timeoutS: opts.timeoutS,
      extraRedact: extraRedact(env),
    });
  },
};
