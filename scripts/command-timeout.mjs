#!/usr/bin/env node

import { spawn } from "node:child_process";

const usage = "usage: command-timeout.mjs <timeout-ms> <command> [args...]";

function parseTimeout(value) {
  const timeoutMs = Number(value);
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0) {
    throw new Error(`timeout must be a positive integer: ${value ?? "missing"}`);
  }
  return timeoutMs;
}

function signalProcessTree(child, signal) {
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

function run(command, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { detached: process.platform !== "win32", stdio: "inherit" });
    let timedOut = false;
    let settled = false;
    let timeoutTimer;
    let killTimer;

    const settle = (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutTimer);
      clearTimeout(killTimer);
      resolve(code);
    };

    child.once("error", (error) => {
      if (!timedOut) reject(error);
    });
    child.once("exit", (code) => {
      settle(timedOut ? 124 : (code ?? 1));
    });

    timeoutTimer = setTimeout(() => {
      if (settled) return;
      timedOut = true;
      signalProcessTree(child, "SIGTERM");
      killTimer = setTimeout(() => {
        if (!settled) signalProcessTree(child, "SIGKILL");
      }, 250);
    }, timeoutMs);
    timeoutTimer.unref();
  });
}

async function main() {
  const [, , timeoutValue, command, ...args] = process.argv;
  if (!command) {
    console.error(usage);
    return 2;
  }

  let timeoutMs;
  try {
    timeoutMs = parseTimeout(timeoutValue);
  } catch (error) {
    console.error(`${usage}: ${error instanceof Error ? error.message : String(error)}`);
    return 2;
  }

  try {
    return await run(command, args, timeoutMs);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

process.exitCode = await main();
