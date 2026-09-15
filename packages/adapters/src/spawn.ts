import { spawn, type ChildProcess } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { ToolError, type C3AdapterResult } from "@aob/contracts";
import { createRunLogWriter } from "./log-writer.js";
import type { ToolEventParser } from "./types.js";

export function extraRedact(env: Record<string, string>): string[] {
  return Object.values(env).filter((v) => v.length >= 8);
}

/** Pass only runner-declared values plus the executable search path to a CLI. */
export function restrictedEnv(values: Record<string, string>): Record<string, string> {
  return { PATH: process.env.PATH ?? "/usr/bin:/bin", ...values };
}

function resolveCmd(bin: string): { cmd: string; argvPrefix: string[] } {
  if (bin.endsWith(".mjs") || bin.endsWith(".js")) {
    return { cmd: process.execPath, argvPrefix: [bin] };
  }
  return { cmd: bin, argvPrefix: [] };
}

function signalProcessTree(child: ChildProcess, signal: NodeJS.Signals): void {
  if (child.pid === undefined) return;
  if (process.platform === "win32") {
    child.kill(signal);
    return;
  }
  try {
    process.kill(-child.pid, signal);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code !== "ESRCH") child.kill(signal);
  }
}

export async function spawnAdapter(opts: {
  bin: string;
  argv: string[];
  cwd: string;
  env: Record<string, string>;
  timeoutS: number;
  extraRedact: string[];
  toolEventParser?: ToolEventParser;
}): Promise<C3AdapterResult> {
  mkdirSync(opts.cwd, { recursive: true });
  const stdoutPath = join(opts.cwd, "stdout.log");
  const stderrPath = join(opts.cwd, "stderr.log");
  const stdout = createRunLogWriter(stdoutPath, opts.extraRedact);
  let stderr;
  try { stderr = createRunLogWriter(stderrPath, opts.extraRedact); }
  catch (error) { stdout.close(); throw error; }
  const tStart = performance.now();
  const anchor = { wall_clock_iso: new Date().toISOString(), monotonic_zero: tStart };
  const parser = opts.toolEventParser;
  const { cmd, argvPrefix } = resolveCmd(opts.bin);
  let child: ChildProcess;
  try { child = spawn(cmd, [...argvPrefix, ...opts.argv], {
    cwd: opts.cwd,
    env: opts.env,
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
  }); } catch {
    try { stdout.close(); } finally { stderr.close(); }
    throw new ToolError("Unable to spawn adapter process");
  }
  let parserError: unknown;
  let logError: unknown;
  const writeLog = (writer: typeof stdout, chunk: Buffer) => {
    if (logError !== undefined) return;
    try { writer.write(chunk); } catch (error) {
      logError = error;
      signalProcessTree(child, "SIGKILL");
    }
  };
  child.stdout?.on("data", (c: Buffer) => {
    if (parser !== undefined && parserError === undefined) {
      try {
        parser.feed(c, performance.now());
      } catch (error) {
        parserError = error;
      }
    }
    writeLog(stdout, c);
  });
  child.stderr?.on("data", (c: Buffer) => writeLog(stderr, c));
  let timedOut = false;
  let settled = false;
  let timeoutTimer: NodeJS.Timeout | undefined;
  let killTimer: NodeJS.Timeout | undefined;
  const exitCode: number = await new Promise((resolve) => {
    const settle = (code: number) => {
      if (settled) return;
      settled = true;
      if (timeoutTimer !== undefined) clearTimeout(timeoutTimer);
      if (killTimer !== undefined) clearTimeout(killTimer);
      resolve(timedOut ? 124 : code);
    };
    timeoutTimer = setTimeout(() => {
      if (settled) return;
      timedOut = true;
      signalProcessTree(child, "SIGTERM");
      killTimer = setTimeout(() => {
        if (!settled) signalProcessTree(child, "SIGKILL");
      }, 500);
    }, opts.timeoutS * 1000);
    child.once("error", () => settle(127));
    child.once("close", (code) => settle(code ?? 1));
  });
  const tEnd = performance.now();
  try { stdout.close(); } finally { stderr.close(); }
  if (logError !== undefined) throw logError;
  const toolLogPath = parser === undefined ? undefined : join(opts.cwd, "tool-events.jsonl");
  if (toolLogPath !== undefined) {
    try { copyFileSync(stdoutPath, toolLogPath); }
    catch { throw new ToolError("Unable to retain adapter tool output"); }
  }
  let toolEvents: C3AdapterResult["toolEvents"] = undefined;
  if (parser !== undefined && exitCode !== 124 && parserError === undefined) {
    try {
      toolEvents = parser.finish(tEnd);
    } catch (error) {
      parserError = error;
    }
  }
  // A malformed structured stream is an adapter failure, not a runner-wide
  // exception. Preserve the raw redacted stream for diagnosis, but do not
  // expose partial tool timing as if it were complete.
  const normalizedExitCode = parserError !== undefined && exitCode === 0 ? 1 : exitCode;
  return {
    exitCode: normalizedExitCode,
    tStart,
    tEnd,
    anchor,
    ...(parserError === undefined && toolEvents !== undefined ? { toolEvents } : {}),
    artifacts: { stdoutPath, stderrPath, ...(toolLogPath === undefined ? {} : { toolLogPath }) },
  };
}

export async function spawnVersion(bin: string, flag = "--version"): Promise<string> {
  const { cmd, argvPrefix } = resolveCmd(bin);
  const child = spawn(cmd, [...argvPrefix, flag], {
    env: restrictedEnv({}),
    stdio: ["ignore", "pipe", "pipe"],
  });
  const chunks: Buffer[] = [];
  child.stdout?.on("data", (c: Buffer) => chunks.push(c));
  child.stderr?.on("data", (c: Buffer) => chunks.push(c));
  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      resolve();
    }, 10_000);
    child.on("error", () => {
      clearTimeout(timer);
      resolve();
    });
    child.on("close", () => {
      clearTimeout(timer);
      resolve();
    });
  });
  const text = Buffer.concat(chunks).toString("utf8").trim();
  return text.split("\n")[0] || "unknown";
}
