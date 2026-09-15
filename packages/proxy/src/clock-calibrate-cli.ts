#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { ConfigError } from "@aob/contracts";
import { calibrateClock, formatClockCalibrationReport } from "./clock-calibrate.js";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  process.stdout.write("Usage: aob-clock-calibrate [--out PATH] [--samples N]\n");
  process.stdout.write("Runs a bounded two-process, zero-spend clock projection calibration.\n");
  process.exit(0);
}

function option(name: string, fallback: string): string {
  const index = process.argv.indexOf(name);
  if (index < 0) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new ConfigError(`missing value for ${name}`);
  return value;
}

const out = resolve(option("--out", "scratch/s1-clock-calibration.txt"));
const samples = Number(option("--samples", "20"));
const report = formatClockCalibrationReport(await calibrateClock(samples));
try {
  await mkdir(dirname(out), { recursive: true });
  await writeFile(out, report, { mode: 0o600 });
} catch (error) {
  throw new ConfigError(`cannot write clock calibration report: ${error instanceof Error ? error.message : String(error)}`);
}
process.stdout.write(`${report}path=${out}\n`);
