#!/usr/bin/env node

import { mkdir, rename, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { dirname } from "node:path";

const usage = "s7-container-clock-calibrate.sh OUTPUT [--samples N] [--max-offset-ms N] [--timeout-ms N]";
const PING_COUNT = 5;

function fail(message) {
  throw new Error(`container clock calibration: ${message}`);
}

function positiveInteger(value, name) {
  if (!/^\d+$/.test(value) || Number(value) <= 0 || !Number.isSafeInteger(Number(value))) {
    fail(`${name} must be a positive integer`);
  }
  return Number(value);
}

function nonnegativeInteger(value, name) {
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) {
    fail(`${name} must be a nonnegative integer`);
  }
  return Number(value);
}

function parseArgs(argv) {
  if (argv[0] === "--help" || argv[0] === "-h") {
    console.log(`Usage: ${usage}\n\nRuns a no-spend, network-disabled Docker stdio clock handshake.`);
    process.exit(0);
  }
  const output = argv.shift();
  if (output === undefined || output.length === 0) fail(usage);
  let samples = 20;
  let maxOffsetMs = 10;
  let timeoutMs = 10_000;
  while (argv.length > 0) {
    const option = argv.shift();
    const value = argv.shift();
    if (value === undefined) fail(`${option ?? "option"} requires a value`);
    if (option === "--samples") samples = positiveInteger(value, "--samples");
    else if (option === "--max-offset-ms") maxOffsetMs = nonnegativeInteger(value, "--max-offset-ms");
    else if (option === "--timeout-ms") timeoutMs = positiveInteger(value, "--timeout-ms");
    else fail(`unknown option: ${option}`);
  }
  return { output, samples, maxOffsetMs, timeoutMs };
}

function createLineReader(stream) {
  let buffer = "";
  let ended = false;
  let streamError = null;
  const pending = [];
  stream.setEncoding("utf8");
  const drain = () => {
    while (pending.length > 0) {
      const newline = buffer.indexOf("\n");
      if (newline < 0 && !ended) break;
      const waiter = pending.shift();
      if (waiter === undefined) break;
      clearTimeout(waiter.timer);
      if (streamError !== null) waiter.reject(streamError);
      else if (newline >= 0) {
        waiter.resolve(buffer.slice(0, newline).replace(/\r$/, ""));
        buffer = buffer.slice(newline + 1);
      } else {
        waiter.resolve(buffer);
        buffer = "";
      }
    }
  };
  stream.on("data", (chunk) => { buffer += chunk; drain(); });
  stream.on("end", () => { ended = true; drain(); });
  stream.on("error", (error) => { streamError = error instanceof Error ? error : new Error(String(error)); ended = true; drain(); });
  return {
    next(timeoutMs) {
      return new Promise((resolve, reject) => {
        const waiter = { resolve, reject, timer: setTimeout(() => {
          const index = pending.indexOf(waiter);
          if (index >= 0) pending.splice(index, 1);
          reject(new Error(`handshake timed out after ${timeoutMs} ms`));
        }, timeoutMs) };
        pending.push(waiter);
        drain();
      });
    },
  };
}

function stopProcessTree(child) {
  if (child.pid === undefined) return;
  if (process.platform !== "win32") {
    try {
      process.kill(-child.pid, "SIGTERM");
      return;
    } catch {
      // Fall through to the direct child signal when a process group is gone.
    }
  }
  child.kill("SIGTERM");
}

function waitForExit(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode !== null) {
      resolve();
      return;
    }
    child.once("close", () => resolve());
  });
}

function waitWithDeadline(promise, deadline) {
  const remaining = Math.max(1, deadline - Date.now());
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`handshake timed out after ${remaining} ms`)), remaining);
    timer.unref();
  });
  return Promise.race([
    promise,
    timeout,
  ]).finally(() => clearTimeout(timer));
}

async function sample(index, timeoutMs) {
  const containerCommand = 'printf "ready\\n"; while IFS= read -r token; do date +%s%3N; done';
  const child = spawn("docker", [
    "run", "--pull=never", "--rm", "--read-only", "--cap-drop=ALL",
    "--security-opt", "no-new-privileges", "--network", "none", "-i",
    "--entrypoint", "sh", "aob-base:s2", "-c", containerCommand,
  ], { detached: process.platform !== "win32", stdio: ["pipe", "pipe", "pipe"] });
  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  const lines = createLineReader(child.stdout);
  const exit = waitForExit(child);
  const deadline = Date.now() + timeoutMs;
  try {
    const ready = await waitWithDeadline(lines.next(Math.max(1, deadline - Date.now())), deadline);
    if (ready !== "ready") fail(`sample ${index} returned an invalid ready marker`);
    let best = null;
    for (let ping = 0; ping < PING_COUNT; ping += 1) {
      const hostBefore = Date.now();
      child.stdin.write("ping\n");
      const raw = await waitWithDeadline(lines.next(Math.max(1, deadline - Date.now())), deadline);
      const hostAfter = Date.now();
      if (!/^\d+$/.test(raw)) fail(`sample ${index} returned an invalid timestamp`);
      const containerNow = Number(raw);
      if (!Number.isSafeInteger(containerNow)) fail(`sample ${index} returned an unsafe timestamp`);
      const roundTrip = hostAfter - hostBefore;
      if (roundTrip < 0) fail(`sample ${index} host clock moved backwards`);
      const hostMid = hostBefore + Math.floor(roundTrip / 2);
      const offset = containerNow - hostMid;
      const absoluteOffset = Math.abs(offset);
      const conservativeBound = absoluteOffset + Math.ceil(roundTrip / 2);
      if (best === null || roundTrip < best.roundTrip) best = { offset, absoluteOffset, conservativeBound, roundTrip };
    }
    if (best === null) fail(`sample ${index} returned no pings`);
    child.stdin.end();
    await waitWithDeadline(exit, deadline);
    if (child.exitCode !== 0) fail(`sample ${index} Docker command failed${stderr.trim() === "" ? "" : `: ${stderr.trim()}`}`);
    return best;
  } catch (error) {
    child.stdin.destroy();
    stopProcessTree(child);
    await Promise.race([exit, new Promise((resolve) => setTimeout(resolve, 300))]);
    const detail = error instanceof Error ? error.message : String(error);
    fail(`sample ${index} ${detail}`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.maxOffsetMs > 10) fail("--max-offset-ms cannot exceed the official 10ms maximum");
  const offsets = [];
  let maxAbsOffset = 0;
  let maxConservativeBound = 0;
  let maxRoundTrip = 0;
  for (let index = 1; index <= options.samples; index += 1) {
    const result = await sample(index, options.timeoutMs);
    offsets.push(result.offset);
    maxAbsOffset = Math.max(maxAbsOffset, result.absoluteOffset);
    maxConservativeBound = Math.max(maxConservativeBound, result.conservativeBound);
    maxRoundTrip = Math.max(maxRoundTrip, result.roundTrip);
  }
  const passed = maxConservativeBound <= options.maxOffsetMs;
  const report = [
    "version=1",
    "method=container-host-epoch-ms",
    "protocol=stdio-ping-midpoint",
    `samples=${options.samples}`,
    `ping_count=${PING_COUNT}`,
    `max_abs_offset_ms=${maxAbsOffset}`,
    `max_conservative_bound_ms=${maxConservativeBound}`,
    `offsets_ms=${offsets.join(",")}`,
    `max_round_trip_ms=${maxRoundTrip}`,
    "image=aob-base:s2",
    "provider_requests=0",
    `status=${passed ? "passed" : "failed"}`,
    "",
  ].join("\n");
  await mkdir(dirname(options.output), { recursive: true });
  const temporary = `${options.output}.tmp.${process.pid}`;
  await writeFile(temporary, report, "utf8");
  await rename(temporary, options.output);
  if (!passed) fail(`conservative offset bound exceeded ${options.maxOffsetMs}ms: max_conservative_bound_ms=${maxConservativeBound}`);
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
