#!/usr/bin/env node
/**
 * Publish a pilot leaderboard into README.md and the evidence ledger.
 *
 * A pilot is a real, complete, honestly-labelled matrix that is deliberately
 * not the v1 dataset: the official path refuses `local-development` sources,
 * and this must never be presented as though it had passed that gate. The
 * README therefore keeps its "unpublished until the v1 dataset ships" hedge,
 * and the table is labelled a pilot. s8-launch-check.mjs enforces both.
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, statSync, lstatSync } from "node:fs";
import { join } from "node:path";

class PublishError extends Error {
  constructor(message) {
    super(message);
    this.name = "PublishError";
  }
}

const HEADER_ROW = "| Harness | vX.Y | Vis. | Source/regime | E2E (med/IQR) | Non-model share (fallback) |";

/** Pull the headline table's data rows out of a generated report. */
export function headlineRows(reportMarkdown) {
  const lines = reportMarkdown.split("\n");
  const start = lines.findIndex((line) => line.startsWith("| Harness | vX.Y |"));
  if (start < 0) throw new PublishError("generated report has no headline table");
  const rows = [];
  for (const line of lines.slice(start + 2)) {
    if (!line.startsWith("|")) break;
    rows.push(line);
  }
  if (rows.length === 0) throw new PublishError("generated report headline table has no rows");
  return rows;
}

/**
 * Point every raw-evidence link at the published artifact.
 *
 * The generated report links each row to a run.json by a path relative to the
 * report directory, inside the gitignored results tree. Pasted into the
 * repository README those are dead links to files no reader can reach. The raw
 * runs live in the checksummed artifact, so that is what the table must cite.
 */
export function rewriteRawLinks(row, artifactPath) {
  return row.replace(/\[run\.json\]\([^)]*\)/g, `[run.json](${artifactPath})`);
}

/** Replace the README's placeholder row with real rows, keeping the table rectangular. */
export function spliceReadme(readme, rows, label) {
  const lines = readme.split("\n");
  const header = lines.findIndex((line) => line.startsWith("| Harness | vX.Y |"));
  if (header < 0) throw new PublishError("README has no headline table");
  const delimiter = header + 1;
  let end = delimiter + 1;
  while (end < lines.length && lines[end].startsWith("|")) end += 1;

  const width = lines[header].split("|").length;
  for (const row of rows) {
    if (row.split("|").length !== width) {
      throw new PublishError(`generated row does not match the README table width: ${row.slice(0, 60)}`);
    }
  }
  const next = [...lines.slice(0, delimiter + 1), ...rows, ...lines.slice(end)];
  let spliced = next.join("\n");
  if (label === undefined) return spliced;
  // Republishing as a matrix fills in changes the coverage sentence, so the
  // label cannot be matched by exact text. Drop any previous label first,
  // otherwise the README accumulates one per publish and contradicts itself.
  spliced = spliced.replace(/^The table above is a \*\*pilot\*\*.*\n\n?/gm, "");
  return spliced.replace(
    /^Monthly re-runs will be announced here after v1\.$/m,
    `${label}\n\nMonthly re-runs will be announced here after v1.`,
  );
}

export function sha256File(path) {
  const info = lstatSync(path);
  if (info.isSymbolicLink() || !info.isFile()) throw new PublishError(`artifact must be a regular file: ${path}`);
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

/**
 * Describe exactly how much of the intended matrix the published table covers.
 * A pilot republished while its matrix is still filling in must say so; a
 * reader cannot otherwise tell a complete run from a partial one.
 */
export function coverageLabel(state, intendedCells) {
  const finished = state.cells.filter((cell) => ["done", "failed", "quarantined"].includes(cell.status)).length;
  const complete = finished >= intendedCells;
  return complete
    ? `Complete matrix: ${finished} of ${intendedCells} cells.`
    : `Partial matrix: ${finished} of ${intendedCells} cells measured so far; this table is republished as the run fills in.`;
}

/** Validate the persisted matrix, which may differ from today's official scope. */
export function intendedPilotCells(state) {
  let definition;
  try { definition = JSON.parse(state?.definition_key); }
  catch { throw new PublishError("pilot state requires a valid run definition"); }
  const uniqueStrings = (values) => Array.isArray(values) && values.length > 0
    && values.every((value) => typeof value === "string" && value.length > 0)
    && new Set(values).size === values.length;
  const tasks = Array.isArray(definition?.tasks) ? definition.tasks.map((task) => task?.id) : [];
  if (!uniqueStrings(definition?.tools) || !uniqueStrings(definition?.conditions)
      || !uniqueStrings(tasks) || !Number.isSafeInteger(definition?.reps) || definition.reps < 1
      || !Array.isArray(state.cells)) {
    throw new PublishError("invalid pilot matrix definition");
  }
  const intended = tasks.length * definition.tools.length * definition.conditions.length * definition.reps;
  if (!Number.isSafeInteger(intended) || state.cells.length !== intended) {
    throw new PublishError("pilot state must contain the exact intended matrix");
  }
  const seen = new Set();
  for (const cell of state.cells) {
    if (!cell || !definition.tools.includes(cell.tool) || !tasks.includes(cell.task_id)
        || !definition.conditions.includes(cell.condition) || !Number.isInteger(cell.rep)
        || cell.rep < 0 || cell.rep >= definition.reps
        || !["pending", "staged", "running", "verifying", "done", "failed", "quarantined"].includes(cell.status)) {
      throw new PublishError("invalid pilot matrix cell");
    }
    const key = JSON.stringify([cell.condition, cell.tool, cell.task_id, cell.rep]);
    if (seen.has(key) || cell.id !== `${cell.condition}:${cell.tool}:${cell.task_id}:${cell.rep}`) {
      throw new PublishError("duplicate or inconsistent pilot matrix cell");
    }
    seen.add(key);
  }
  return intended;
}

export function pilotLedger(existing, artifacts, notes) {
  if (artifacts.length === 0) throw new PublishError("a pilot ledger must list at least one artifact");
  return { ...existing, version: 1, status: "pilot", artifacts, notes };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [reportDir, artifactPath, statePath, root = process.cwd()] = process.argv.slice(2);
  if (!reportDir || !artifactPath || !statePath) {
    throw new PublishError("usage: s8-publish-pilot.mjs REPORT_DIR ARTIFACT_PATH STATE_PATH [ROOT]");
  }
  statSync(reportDir);
  const artifactRelative = artifactPath.replace(`${root}/`, "");
  const rows = headlineRows(readFileSync(join(reportDir, "README.md"), "utf8"))
    .map((row) => rewriteRawLinks(row, artifactRelative));
  const state = JSON.parse(readFileSync(statePath, "utf8"));
  const coverage = ` ${coverageLabel(state, intendedPilotCells(state))}`;
  const label = `The table above is a **pilot** measured on this repository's checked-in fixture suite, not the v1 public-source dataset.${coverage}`;
  const readmePath = join(root, "README.md");
  writeFileSync(readmePath, spliceReadme(readFileSync(readmePath, "utf8"), rows, label));

  const ledgerPath = join(root, "evidence/index.json");
  const existing = JSON.parse(readFileSync(ledgerPath, "utf8"));
  const preserved = (existing.artifacts || []).filter((artifact) => artifact.kind !== "pilot-report");
  const ledger = pilotLedger(
    existing,
    [{ kind: "pilot-report", path: artifactRelative, sha256: sha256File(artifactPath) }, ...preserved],
    preserved.length > 0 && typeof existing.notes === "string" && existing.notes.length > 0
      ? existing.notes
      : "Pilot leaderboard measured on the checked-in fixture suite. Not the v1 public-source dataset; no official S7 archive exists.",
  );
  writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ rows: rows.length, ledger: ledgerPath })}\n`);
}
