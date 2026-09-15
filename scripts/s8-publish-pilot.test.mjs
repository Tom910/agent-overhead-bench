import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { headlineRows, spliceReadme, pilotLedger, rewriteRawLinks, coverageLabel, intendedPilotCells } from "./s8-publish-pilot.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const README_HEADER = readFileSync(join(root, "README.md"), "utf8")
  .split("\n")
  .find((line) => line.startsWith("| Harness | vX.Y |"));

function report(rows) {
  return `# Report\n\nsome prose\n\n${README_HEADER}\n|---|---|\n${rows.join("\n")}\n\nmore prose\n`;
}

test("extracts only the headline data rows", () => {
  const rows = ["| codex | 1 |", "| hermes | 2 |"];
  assert.deepEqual(headlineRows(report(rows)), rows);
});

test("selects measurement rows after a coverage table and rejects coverage-only input", () => {
  const coverage = "| Harness | Native pass |\n|---|---|\n| cline | 17 |\n\n";
  assert.deepEqual(headlineRows(coverage + report(["| codex | 1 |"])), ["| codex | 1 |"]);
  assert.throws(() => headlineRows(coverage), /no headline table/);
  assert.throws(() => spliceReadme(coverage, ["| x | 1 |"]), /no headline table/);
});

test("refuses a report with no headline table or no rows", () => {
  assert.throws(() => headlineRows("# Report\n\nnothing here\n"), /no headline table/);
  assert.throws(() => headlineRows(`${README_HEADER}\n|---|---|\n\nprose\n`), /no rows/);
});

test("replaces the placeholder row and keeps the table rectangular", () => {
  const readme = readFileSync(join(root, "README.md"), "utf8");
  const width = README_HEADER.split("|").length;
  const cells = new Array(width - 2).fill("x");
  const rows = [`| ${cells.join(" | ")} |`, `| ${cells.join(" | ")} |`];

  const out = spliceReadme(readme, rows, "PILOT LABEL");
  const table = out.slice(out.indexOf(README_HEADER)).split("\n\n")[0].split("\n");
  assert.equal(out.slice(0, out.indexOf(README_HEADER)), readme.slice(0, readme.indexOf(README_HEADER)), "coverage and preceding prose stay unchanged");
  assert.equal(table.length, 4, "header, delimiter, and exactly the two new rows");
  assert.equal(new Set(table.map((line) => line.split("|").length)).size, 1);
  assert.ok(!out.includes("*unpublished*"), "placeholder row is gone");
  assert.ok(out.includes("PILOT LABEL"), "pilot label is added");
  // The v1 hedge must survive: a pilot is not the v1 dataset.
  assert.match(out, /Results are unpublished until the v1 dataset ships/i);
  assert.match(out, /not a capabilities leaderboard/i);
});

test("refuses a generated row whose width does not match the README table", () => {
  const readme = readFileSync(join(root, "README.md"), "utf8");
  assert.throws(() => spliceReadme(readme, ["| too | few |"]), /table width/);
});

test("is idempotent about the label", () => {
  const readme = readFileSync(join(root, "README.md"), "utf8");
  const width = README_HEADER.split("|").length;
  const row = `| ${new Array(width - 2).fill("x").join(" | ")} |`;
  const label = "The table above is a **pilot** measured on fixtures. Complete matrix: 160 of 160 cells.";
  const once = spliceReadme(readme, [row], label);
  const twice = spliceReadme(once, [row], label);
  assert.equal(once.match(/The table above is a \*\*pilot\*\*/g).length, 1);
  assert.equal(twice.match(/The table above is a \*\*pilot\*\*/g).length, 1);
});

test("a pilot ledger must carry an artifact", () => {
  assert.throws(() => pilotLedger({ version: 1 }, [], "notes"), /at least one artifact/);
  const ledger = pilotLedger({ version: 1, status: "pending", artifacts: [] },
    [{ kind: "pilot-report", path: "evidence/x.tgz", sha256: "a".repeat(64) }], "notes");
  assert.equal(ledger.status, "pilot");
  assert.equal(ledger.artifacts.length, 1);
});

test("repoints raw evidence links at the published artifact", () => {
  // The generated report links into the gitignored results tree by a path
  // relative to the report directory. In the repository README those are dead
  // links; the raw runs are only reachable inside the checksummed artifact.
  const row = "| codex | 1 | [run.json](../pilot-matrix/results/pinned/codex/t/rep-0/run.json) |";
  const out = rewriteRawLinks(row, "evidence/pilot-report.tgz");
  assert.equal(out, "| codex | 1 | [run.json](evidence/pilot-report.tgz) |");
  assert.ok(!out.includes("../"), "no relative escape survives");
});

test("leaves a row without a raw link untouched", () => {
  const row = "| codex | 1 | — |";
  assert.equal(rewriteRawLinks(row, "evidence/pilot-report.tgz"), row);
});

test("states matrix coverage so a partial run cannot read as complete", () => {
  const cell = (status) => ({ status });
  const partial = { cells: [cell("done"), cell("done"), cell("pending")] };
  assert.match(coverageLabel(partial, 160), /Partial matrix: 2 of 160 cells/);
  const complete = { cells: new Array(160).fill(cell("done")) };
  assert.match(coverageLabel(complete, 160), /Complete matrix: 160 of 160 cells/);
  // Failed and quarantined cells are measured outcomes, not missing ones.
  const withFailures = { cells: [cell("done"), cell("failed"), cell("quarantined")] };
  assert.match(coverageLabel(withFailures, 3), /Complete matrix: 3 of 3 cells/);
});

test("replaces a previous pilot label instead of appending a second one", () => {
  // Republishing as the matrix fills in changes the coverage sentence, so an
  // exact-text idempotency check appended a second label and the README
  // carried both "Partial matrix: 47 of 160" and "Complete matrix: 160 of 160".
  const readme = readFileSync(join(root, "README.md"), "utf8");
  const width = README_HEADER.split("|").length;
  const row = `| ${new Array(width - 2).fill("x").join(" | ")} |`;
  const partial = spliceReadme(readme, [row], "The table above is a **pilot** measured on fixtures. Partial matrix: 47 of 160 cells.");
  const complete = spliceReadme(partial, [row], "The table above is a **pilot** measured on fixtures. Complete matrix: 160 of 160 cells.");

  assert.equal(complete.match(/The table above is a \*\*pilot\*\*/g).length, 1, "exactly one pilot label");
  assert.ok(!complete.includes("Partial matrix: 47 of 160"), "the stale coverage sentence is gone");
  assert.ok(complete.includes("Complete matrix: 160 of 160"));
});

function matrixState(tools = ["one", "two"]) {
  return {
    definition_key: JSON.stringify({ tools, tasks: [{ id: "task" }], conditions: ["pinned"], reps: 1 }),
    cells: tools.map((tool) => ({ id: `pinned:${tool}:task:0`, tool, task_id: "task", condition: "pinned", rep: 0, status: "done" })),
  };
}

test("publisher CLI uses explicit run state instead of a stale sibling or fixed profile", () => {
  const dir = mkdtempSync(join(tmpdir(), "aob-pilot-coverage-"));
  try {
    mkdirSync(join(dir, "evidence"));
    mkdirSync(join(dir, "report"));
    mkdirSync(join(dir, "pilot-matrix"));
    writeFileSync(join(dir, "README.md"), readFileSync(join(root, "README.md")));
    writeFileSync(join(dir, "evidence/index.json"), JSON.stringify({ status: "pending" }));
    writeFileSync(join(dir, "artifact.tgz"), "test artifact");
    const row = `| ${new Array(README_HEADER.split("|").length - 2).fill("x").join(" | ")} |`;
    writeFileSync(join(dir, "report/README.md"), report([row]));
    writeFileSync(join(dir, "pilot-matrix/state.json"), JSON.stringify(matrixState(["old"])));
    const state = matrixState();
    state.cells[1].status = "pending";
    writeFileSync(join(dir, "new-state.json"), JSON.stringify(state));
    const result = spawnSync(process.execPath, [join(root, "scripts/s8-publish-pilot.mjs"),
      join(dir, "report"), join(dir, "artifact.tgz"), join(dir, "new-state.json"), dir], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.match(readFileSync(join(dir, "README.md"), "utf8"), /Partial matrix: 1 of 2 cells/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("publisher CLI preserves non-pilot ledger artifacts", () => {
  const dir = mkdtempSync(join(tmpdir(), "aob-pilot-preserve-"));
  try {
    mkdirSync(join(dir, "evidence"));
    mkdirSync(join(dir, "report"));
    writeFileSync(join(dir, "README.md"), readFileSync(join(root, "README.md")));
    writeFileSync(join(dir, "evidence/index.json"), JSON.stringify({
      version: 1,
      status: "pilot",
      artifacts: [{ kind: "campaign-summary", path: "evidence/summary.json", sha256: "b".repeat(64) }],
      notes: "keep campaign notes",
    }));
    writeFileSync(join(dir, "artifact.tgz"), "test artifact");
    const row = `| ${new Array(README_HEADER.split("|").length - 2).fill("x").join(" | ")} |`;
    writeFileSync(join(dir, "report/README.md"), report([row]));
    writeFileSync(join(dir, "new-state.json"), JSON.stringify(matrixState()));
    const result = spawnSync(process.execPath, [join(root, "scripts/s8-publish-pilot.mjs"),
      join(dir, "report"), join(dir, "artifact.tgz"), join(dir, "new-state.json"), dir], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const ledger = JSON.parse(readFileSync(join(dir, "evidence/index.json"), "utf8"));
    assert.equal(ledger.status, "pilot");
    assert.deepEqual(ledger.artifacts.map((artifact) => artifact.kind), ["pilot-report", "campaign-summary"]);
    assert.equal(ledger.notes, "keep campaign notes");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("coverage rejects missing, duplicate and out-of-definition cells", () => {
  assert.equal(intendedPilotCells(matrixState()), 2);
  for (const mutate of [
    (s) => s.cells.pop(),
    (s) => { s.cells[1] = s.cells[0]; },
    (s) => { s.cells[0].rep = 1; },
    (s) => { s.cells[0].status = "unknown"; },
    (s) => { s.definition_key = "{}"; },
    (s) => { s.definition_key = "bad json"; },
  ]) {
    const state = matrixState();
    mutate(state);
    assert.throws(() => intendedPilotCells(state), { name: "PublishError" });
  }
});

test("in-flight runner phases remain valid partial pilot evidence", () => {
  for (const status of ["pending", "staged", "running", "verifying"]) {
    const state = matrixState();
    state.cells[0].status = status;
    assert.match(coverageLabel(state, intendedPilotCells(state)), /Partial matrix: 1 of 2/);
  }
});
