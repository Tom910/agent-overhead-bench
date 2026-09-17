import { createHash } from "node:crypto";
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ConfigError } from "@aob/contracts";
import { generateReport, loadResultsTree } from "./from-results.js";

type Slot = {
  run_id: string; harness: string; task: string; rep: number; outcome: string;
  host: string; price_book: string; run_sha256: string; events_sha256: string;
};
type Summary = { as_of: string; official_release: false; model: string; regime: string; slots: Slot[] };

function digest(bytes: Buffer): string {
  return `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
}

function readSummary(bytes: Buffer): Summary {
  let value: unknown;
  try { value = JSON.parse(bytes.toString("utf8")); }
  catch { throw new ConfigError("campaign summary is not valid JSON"); }
  if (typeof value !== "object" || value === null) throw new ConfigError("campaign summary must be an object");
  const record = value as Record<string, unknown>;
  if (record.official_release !== false || typeof record.as_of !== "string" ||
      !Number.isFinite(Date.parse(record.as_of)) || typeof record.model !== "string" ||
      typeof record.regime !== "string" || !Array.isArray(record.slots) || record.slots.length === 0) {
    throw new ConfigError("campaign summary requires snapshot date, model, regime, slots and official_release false");
  }
  const ids = new Set<string>();
  const identities = new Set<string>();
  for (const value of record.slots) {
    if (typeof value !== "object" || value === null) throw new ConfigError("invalid campaign slot");
    const slot = value as Record<string, unknown>;
    if (!["run_id", "harness", "task", "outcome", "price_book"].every((key) => typeof slot[key] === "string" && slot[key].length > 0) ||
        !Number.isInteger(slot.rep) || (slot.rep as number) < 0 ||
        !["macOS", "darwin", "Linux", "linux"].includes(String(slot.host)) ||
        !["run_sha256", "events_sha256"].every((key) => typeof slot[key] === "string" && /^sha256:[a-f0-9]{64}$/.test(slot[key]))) {
      throw new ConfigError("invalid campaign slot metadata or hashes");
    }
    const id = slot.run_id as string;
    const identity = JSON.stringify([slot.harness, slot.task, slot.rep]);
    if (ids.has(id) || identities.has(identity)) throw new ConfigError(`duplicate campaign slot: ${id}`);
    ids.add(id);
    identities.add(identity);
  }
  return value as Summary;
}

/** Verify the selected raw evidence, then publish only the S6 allowlisted views. */
export function buildCampaignAnalysis(resultsDir: string, summaryPath: string, outDir: string): void {
  const summaryBytes = readFileSync(summaryPath);
  const summary = readSummary(summaryBytes);
  const slots = new Map(summary.slots.map((slot) => [slot.run_id, slot]));
  const sourceCells = loadResultsTree(resultsDir);
  if (sourceCells.length !== slots.size) throw new ConfigError("campaign selected run count differs from summary (missing or extra runs)");
  const temporary = mkdtempSync(join(tmpdir(), "aob-campaign-analysis-"));
  try {
    const staged = join(temporary, "results");
    for (const [index, cell] of sourceCells.entries()) {
      const slot = slots.get(cell.run.run_id);
      if (slot === undefined) throw new ConfigError(`unexpected campaign run: ${cell.run.run_id}`);
      const runBytes = readFileSync(cell.runPath);
      const eventBytes = readFileSync(join(dirname(cell.runPath), cell.run.events_file));
      if (digest(runBytes) !== slot.run_sha256 || digest(eventBytes) !== slot.events_sha256) {
        throw new ConfigError(`campaign C1/C4 hash mismatch: ${slot.run_id}`);
      }
      // Stage exactly the verified bytes so report generation cannot reread
      // changing source evidence. Preserve C4-relative event filenames.
      const cellDir = join(staged, String(index));
      mkdirSync(dirname(join(cellDir, cell.run.events_file)), { recursive: true });
      writeFileSync(join(cellDir, "run.json"), runBytes);
      writeFileSync(join(cellDir, cell.run.events_file), eventBytes);
    }
    for (const { run } of loadResultsTree(staged)) {
      const slot = slots.get(run.run_id);
      const expectedOs = slot?.host === "macOS" || slot?.host === "darwin" ? "darwin" : "linux";
      if (slot === undefined || run.tool !== slot.harness || run.task_id !== slot.task ||
          run.rep !== slot.rep || run.outcome !== slot.outcome || run.price_book !== slot.price_book ||
          run.host.os !== expectedOs || run.model !== summary.model || run.task_regime !== summary.regime) {
        throw new ConfigError(`campaign slot metadata mismatch: ${run.run_id}`);
      }
    }
    const reportDir = join(temporary, "report");
    generateReport(staged, reportDir, { allowUnpricedModels: true });
    const files = ["analysis.json", "analysis.md", "analysis.html"];
    const outputs = files.map((name) => ({ name, bytes: readFileSync(join(reportDir, name)) }));
    const provenance = {
      schema_version: 1,
      summary_sha256: digest(summaryBytes),
      as_of: summary.as_of,
      official_release: false,
      selected_attempt_count: slots.size,
      artifacts: Object.fromEntries(outputs.map(({ name, bytes }) => [name, digest(bytes)])),
    };
    mkdirSync(outDir, { recursive: true });
    for (const name of [...files, "provenance.json"]) {
      try {
        if (!lstatSync(join(outDir, name)).isFile()) throw new ConfigError(`campaign output is not a regular file: ${name}`);
      } catch (error) {
        if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
      }
    }
    for (const { name, bytes } of outputs) writeFileSync(join(outDir, name), bytes);
    writeFileSync(join(outDir, "provenance.json"), `${JSON.stringify(provenance, null, 2)}\n`);
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [resultsDir, summaryPath, outDir, extra] = process.argv.slice(2);
    if (resultsDir === undefined || summaryPath === undefined || outDir === undefined || extra !== undefined) {
      throw new ConfigError("usage: node scripts/s6-campaign-analysis.mjs <selected-results-dir> <summary.json> <output-dir>");
    }
    buildCampaignAnalysis(resultsDir, summaryPath, outDir);
    process.stdout.write("Wrote verified campaign analysis and snapshot provenance.\n");
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
