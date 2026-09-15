import { spawn } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { C3AdapterResult } from "@aob/contracts";
import { redact } from "./redact.js";
import { restrictedEnv } from "./spawn.js";
import type { AdapterRunOpts, ContainerInvocation } from "./types.js";

const MOCK_CLI = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "mock-agent-cli.mjs"), "utf8");

export const mockAgentAdapter = {
  name: "mock-agent",
  capabilities: {
    headless: true,
    ori: false,
    baseUrlOverride: true,
    toolVisibility: "none" as const,
  },
  containerInvocation(opts: AdapterRunOpts): ContainerInvocation {
    return {
      image: "aob-base:s2",
      argv: ["node", "/work/workspace/.aob-mock-agent-cli.mjs", "/work/workspace/prompt.md", "/work/workspace"],
      env: {
        OPENAI_BASE_URL: opts.proxyUrl,
        AOB_MODEL: opts.model,
      },
      // The runner uses this host path for the bind mount; argv remains in the
      // container namespace.
      workdir: opts.workspaceDir,
      setupFiles: [{ path: join(opts.workspaceDir, ".aob-mock-agent-cli.mjs"), contents: MOCK_CLI }],
    };
  },
  async version(): Promise<string> {
    return "0.0.0-mock";
  },
  async run(opts: {
    workspaceDir: string;
    promptFile: string;
    model: string;
    proxyUrl: string;
    condition: "pinned" | "default";
    timeoutS: number;
    env: Record<string, string>;
  }): Promise<C3AdapterResult> {
    const tStart = performance.now();
    const anchor = { wall_clock_iso: new Date().toISOString(), monotonic_zero: tStart };
    const script = join(dirname(fileURLToPath(import.meta.url)), "mock-agent-cli.mjs");
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    const child = spawn(process.execPath, [script, opts.promptFile, opts.workspaceDir], {
      cwd: opts.workspaceDir,
      env: {
        ...restrictedEnv(opts.env),
        ...opts.env,
        OPENAI_BASE_URL: opts.proxyUrl,
        AOB_MODEL: opts.model,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout?.on("data", (c: Buffer) => stdout.push(c));
    child.stderr?.on("data", (c: Buffer) => stderr.push(c));
    const exitCode: number = await new Promise((resolve) => {
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
        setTimeout(() => child.kill("SIGKILL"), 500);
      }, opts.timeoutS * 1000);
      child.on("close", (code) => {
        clearTimeout(timer);
        resolve(timedOut ? 124 : code ?? 1);
      });
    });
    const tEnd = performance.now();
    const extras = Object.values(opts.env).filter((v) => v.length >= 8);
    const stdoutText = redact(Buffer.concat(stdout).toString("utf8"), extras);
    const stderrText = redact(Buffer.concat(stderr).toString("utf8"), extras);
    const stdoutPath = join(opts.workspaceDir, "stdout.log");
    const stderrPath = join(opts.workspaceDir, "stderr.log");
    writeFileSync(stdoutPath, stdoutText);
    writeFileSync(stderrPath, stderrText);
    return { exitCode, tStart, tEnd, anchor, artifacts: { stdoutPath, stderrPath } };
  },
};
