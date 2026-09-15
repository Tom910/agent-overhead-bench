#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { generateReport } from "./from-results.js";

export function parseReportArgs(argv: string[]): { resultsDir: string; outDir: string } {
  const positional: string[] = [];
  let outDir = "dist/report";
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--out") {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith("-")) throw new Error("--out requires a directory");
      outDir = value;
      index += 1;
    } else if (arg?.startsWith("-")) {
      throw new Error(`unknown option: ${arg}`);
    } else if (arg !== undefined) {
      positional.push(arg);
    }
  }
  if (positional.length > 1) throw new Error("aob-report accepts one results directory");
  return { resultsDir: positional[0] ?? "results", outDir };
}

function main(): void {
  const { resultsDir, outDir } = parseReportArgs(process.argv.slice(2));
  const { markdown } = generateReport(resultsDir, outDir);
  process.stdout.write(`wrote ${outDir} (${markdown.split("\n").length} lines)\n`);
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
