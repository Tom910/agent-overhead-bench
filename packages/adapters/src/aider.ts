import { lstatSync, readFileSync, readdirSync } from "node:fs";
import { ConfigError } from "@aob/contracts";
import { join, relative, sep } from "node:path";
import type { Adapter, AdapterRunOpts, ContainerInvocation } from "./types.js";

const MAX_CONTEXT_BYTES = 3_000_000;
const SOURCE_EXTENSIONS = new Set([
  ".c", ".cc", ".cpp", ".cs", ".go", ".h", ".hpp", ".java", ".js", ".jsx", ".kts", ".kt",
  ".mjs", ".php", ".py", ".rb", ".rs", ".scala", ".sh", ".sql", ".swift", ".ts", ".tsx", ".txt",
]);
const CONFIG_EXTENSIONS = new Set([".cfg", ".conf", ".ini", ".json", ".toml", ".xml", ".yaml", ".yml"]);
const EXCLUDED_NAMES = new Set(["package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lockb"]);

type WorkspaceFile = { path: string; bytes: number; priority: number };

function workspaceFiles(workspaceDir: string): string[] {
  const files: WorkspaceFile[] = [];
  const visit = (dir: string) => {
    for (const name of readdirSync(dir).sort()) {
      if (name === ".git" || name === "prompt.md" || name === ".aob-home" || name === ".aob-codex-home" || name === ".aob-qwen-home" || name === "verify.sh") continue;
      const path = join(dir, name);
      const info = lstatSync(path);
      if (info.isSymbolicLink()) throw new ConfigError(`aider workspace contains a symlink: ${path}`);
      if (info.isDirectory()) visit(path);
      else if (info.isFile()) {
        const relativePath = relative(workspaceDir, path).split(sep).join("/");
        const basename = name.toLowerCase();
        const extension = name.includes(".") ? name.slice(name.lastIndexOf(".")).toLowerCase() : "";
        if (EXCLUDED_NAMES.has(basename)) continue;
        const priority = SOURCE_EXTENSIONS.has(extension) ? 0 : CONFIG_EXTENSIONS.has(extension) ? 1 : -1;
        if (priority >= 0) files.push({ path: relativePath, bytes: info.size, priority });
      }
    }
  };
  visit(workspaceDir);
  const selected: WorkspaceFile[] = [];
  let totalBytes = 0;
  for (const file of files.sort((left, right) => left.priority - right.priority || left.path.localeCompare(right.path))) {
    if (file.bytes > MAX_CONTEXT_BYTES || totalBytes + file.bytes > MAX_CONTEXT_BYTES) continue;
    selected.push(file);
    totalBytes += file.bytes;
  }
  if (selected.length === 0) throw new ConfigError(`aider workspace has no source/config file within ${MAX_CONTEXT_BYTES} byte context budget`);
  return selected.map((file) => file.path);
}

function openAiCompatibleModel(model: string): string {
  return model.startsWith("openai/") ? model : `openai/${model}`;
}

function invocation(opts: AdapterRunOpts): ContainerInvocation {
  const key = opts.env.OPENROUTER_API_KEY ?? "";
  const files = workspaceFiles(opts.workspaceDir);
  const home = join(opts.workspaceDir, ".aob-home");
  const modelArgs = opts.condition === "pinned" ? ["--model", openAiCompatibleModel(opts.model)] : [];
  return {
    image: "aob-aider:s2",
    toolVersion: "0.86.2",
    versionArgv: ["aider", "--version"],
    workdir: opts.workspaceDir,
    env: {
      HOME: home,
      OPENAI_API_KEY: key,
      OPENAI_API_BASE: `${opts.proxyUrl}/v1`,
      CI: "1",
    },
    argv: [
      "aider",
      "--yes-always",
      "--no-git",
      "--openai-api-base",
      `${opts.proxyUrl}/v1`,
      ...modelArgs,
      ...files,
      "--message",
      readFileSync(opts.promptFile, "utf8").trimEnd(),
    ],
    setupFiles: [{ path: join(home, ".keep"), contents: "" }],
  };
}

export const aiderAdapter: Adapter = {
  name: "aider",
  capabilities: {
    headless: true,
    ori: false,
    baseUrlOverride: true,
    toolVisibility: "none",
    containerOnly: true,
  },
  async version() {
    throw new ConfigError("aider is container-only; query version inside its container");
  },
  containerInvocation: invocation,
  async run() {
    throw new ConfigError("aider is container-only; use containerInvocation");
  },
};
