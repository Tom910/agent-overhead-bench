#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { ConfigError } from "@aob/contracts";
import { calibrate, formatCalibrationReport } from "./calibrate.js";

function option(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new ConfigError(`missing value for ${name}`);
  return value;
}

function positiveInteger(name: string, fallback: string, allowZero = false): number {
  const value = Number(option(name, fallback));
  if (!Number.isInteger(value) || (allowZero ? value < 0 : value < 1)) {
    throw new ConfigError(`${name} must be ${allowZero ? "a nonnegative" : "a positive"} integer`);
  }
  return value;
}

const out = resolve(option("--out", "scratch/s1-calibration.txt"));
const delayMs = positiveInteger("--delay-ms", "0", true);
const concurrency = positiveInteger("--concurrency", "10");
const rounds = positiveInteger("--rounds", "3");
const measured = await calibrate(delayMs, concurrency, rounds);
const report = formatCalibrationReport({
  delayMs,
  concurrency,
  rounds,
  sampleCount: measured.added.length,
  streamed: true,
  p50: measured.p50,
  p99: measured.p99,
});
try {
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, report, { mode: 0o600 });
} catch (error) {
  throw new ConfigError(`cannot write calibration report: ${error instanceof Error ? error.message : String(error)}`);
}
process.stdout.write(`${report}path=${out}\n`);
