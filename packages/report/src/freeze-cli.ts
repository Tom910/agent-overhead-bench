#!/usr/bin/env node
import { c4MeasurementIdentity, ConfigError } from "@aob/contracts";
import { loadResultsTree, type LoadedCell } from "./from-results.js";
import { copySanitizedProvenance, copySanitizedResults } from "./freeze.js";
import { readFileSync } from "node:fs";

const source = process.argv[2];
const destination = process.argv[3];
const state = process.argv[4];
const provenance = process.argv[5];
const rerunResults = process.argv[6] ?? "";
const reviewPath = process.argv[7] ?? "";
const runWindowLedger = process.argv[8] ?? "";
if (!source || !destination || !state || !provenance) throw new ConfigError("usage: freeze-cli RESULTS_DIR DESTINATION_DIR STATE_PATH PROVENANCE_DIR");
const replacements = new Map<string, LoadedCell>();
if (rerunResults !== "" || reviewPath !== "") {
  if (reviewPath === "") throw new ConfigError("replacement results and anomaly review must be supplied together");
  let review: unknown;
  try {
    review = JSON.parse(readFileSync(reviewPath, "utf8"));
  } catch (error) {
    throw new ConfigError(`anomaly review is unavailable or invalid: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (typeof review !== "object" || review === null || Array.isArray(review) || !Array.isArray((review as { cells?: unknown }).cells)) {
    throw new ConfigError("anomaly review record is malformed");
  }
  const current = loadResultsTree(source);
  const reruns = rerunResults === "" ? [] : loadResultsTree(rerunResults);
  const currentById = new Map(current.map((cell) => [cell.run.run_id, cell.run]));
  const rerunById = new Map(reruns.map((cell) => [cell.run.run_id, cell]));
  for (const entry of (review as { cells: unknown[] }).cells) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) continue;
    const record = entry as { run_id?: unknown; disposition?: unknown; replacement_run_id?: unknown };
    if (record.disposition !== "rerun") continue;
    if (typeof record.run_id !== "string" || typeof record.replacement_run_id !== "string") {
      throw new ConfigError("rerun anomaly review entry is malformed");
    }
    const original = currentById.get(record.run_id);
    const replacement = rerunById.get(record.replacement_run_id);
    if (original === undefined || replacement === undefined || replacement.run.outcome !== "completed" ||
      c4MeasurementIdentity(original) !== c4MeasurementIdentity(replacement.run)) {
      throw new ConfigError(`rerun replacement does not match current result ${record.run_id}`);
    }
    replacements.set(record.run_id, replacement);
  }
}
copySanitizedResults(source, destination, replacements);
copySanitizedProvenance(source, state, provenance, replacements, runWindowLedger === "" ? undefined : runWindowLedger);
