import { createHash } from "node:crypto";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import type { C1Event, C4Run } from "@aob/contracts";
import { buildCampaignAnalysis } from "./campaign-analysis.js";

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const hash = (bytes: Buffer): string => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

function fixture(os = "linux") {
  const root = mkdtempSync(join(tmpdir(), "aob-campaign-test-"));
  roots.push(root);
  const results = join(root, "results");
  const cell = join(results, "one");
  mkdirSync(cell, { recursive: true });
  const run = JSON.parse(readFileSync(new URL("../../contracts/fixtures/c4.run.valid.json", import.meta.url), "utf8")) as C4Run;
  run.model = "mock";
  run.host.os = os;
  run.spend_usd_estimate = 0;
  run.anchors.proxy = run.anchors.adapter;
  const event = JSON.parse(readFileSync(new URL("../../contracts/fixtures/c1.event.valid.json", import.meta.url), "utf8")) as C1Event;
  Object.assign(event, {
    seq: 0, t_req_start: 100, t_req_body_end: 100, t_upstream_sent: 100,
    t_first_byte: 150, t_last_byte: 1000, duration_ms: 900,
    model_requested: "mock", model_served: "mock",
  });
  writeFileSync(join(cell, "run.json"), JSON.stringify(run));
  writeFileSync(join(cell, "events.jsonl"), `${JSON.stringify(event)}\n`);
  writeFileSync(join(cell, "stdout.log"), "PRIVATE LOG SENTINEL");
  const summary = {
    as_of: "2026-09-14T16:09:23.683455+00:00", official_release: false,
    model: "mock", regime: "short",
    slots: [{
      run_id: run.run_id, harness: run.tool, task: run.task_id, rep: run.rep,
      outcome: run.outcome, host: os === "darwin" ? "macOS" : "Linux", price_book: run.price_book,
      run_sha256: hash(readFileSync(join(cell, "run.json"))),
      events_sha256: hash(readFileSync(join(cell, "events.jsonl"))),
    }],
  };
  const summaryPath = join(root, "summary.json");
  const save = () => writeFileSync(summaryPath, JSON.stringify(summary));
  save();
  const out = join(root, "public");
  return { root, results, cell, summary, summaryPath, save, out, build: () => buildCampaignAnalysis(results, summaryPath, out) };
}

it.each(["linux", "darwin"])("builds deterministic sanitized analysis for %s with snapshot binding", (os) => {
  const f = fixture(os);
  mkdirSync(f.out);
  writeFileSync(join(f.out, "report-engine.md"), "historical report");
  f.build();
  expect(readdirSync(f.out).sort()).toEqual(["analysis.html", "analysis.json", "analysis.md", "provenance.json", "report-engine.md"]);
  expect(readFileSync(join(f.out, "report-engine.md"), "utf8")).toBe("historical report");
  const first = readFileSync(join(f.out, "provenance.json"), "utf8");
  const provenance = JSON.parse(first);
  expect(provenance).toMatchObject({ summary_sha256: hash(readFileSync(f.summaryPath)), as_of: f.summary.as_of, official_release: false, selected_attempt_count: 1 });
  for (const name of ["analysis.json", "analysis.md", "analysis.html"]) {
    const bytes = readFileSync(join(f.out, name));
    expect(provenance.artifacts[name]).toBe(hash(bytes));
    expect(bytes.toString()).not.toMatch(/PRIVATE LOG SENTINEL|stdout\.log|events\.jsonl|run\.json/);
    expect(bytes.toString()).not.toContain(f.root);
  }
  f.build();
  expect(readFileSync(join(f.out, "provenance.json"), "utf8")).toBe(first);
});

it.each(["harness", "task", "rep", "outcome", "host", "price_book"] as const)("rejects forged %s metadata even when evidence hashes match", (key) => {
  const f = fixture();
  const slot = f.summary.slots[0]!;
  if (key === "rep") slot.rep += 1;
  else if (key === "outcome") slot.outcome = "verify_error";
  else slot[key] = key === "host" ? "macOS" : "forged";
  f.save();
  expect(f.build).toThrow(/metadata mismatch/);
});

it.each(["model", "regime"] as const)("rejects forged summary %s", (key) => {
  const f = fixture();
  f.summary[key] = "forged";
  f.save();
  expect(f.build).toThrow(/metadata mismatch/);
});

it.each(["run.json", "events.jsonl"])("rejects changed %s bytes", (name) => {
  const f = fixture();
  writeFileSync(join(f.cell, name), `${readFileSync(join(f.cell, name), "utf8")}\n`);
  expect(f.build).toThrow(/hash mismatch/);
});

it("rejects missing, extra, duplicate and substituted selected runs", () => {
  const missing = fixture();
  rmSync(missing.cell, { recursive: true });
  expect(missing.build).toThrow(/count differs/);
  const extra = fixture();
  cpSync(extra.cell, join(extra.results, "two"), { recursive: true });
  expect(extra.build).toThrow(/duplicate C4/);
  const secondRunPath = join(extra.results, "two/run.json");
  const secondRun = JSON.parse(readFileSync(secondRunPath, "utf8")) as C4Run;
  secondRun.run_id = "extra-run";
  secondRun.rep += 1;
  writeFileSync(secondRunPath, JSON.stringify(secondRun));
  const secondEventPath = join(extra.results, "two/events.jsonl");
  const secondEvent = JSON.parse(readFileSync(secondEventPath, "utf8")) as C1Event;
  secondEvent.run_id = secondRun.run_id;
  writeFileSync(secondEventPath, `${JSON.stringify(secondEvent)}\n`);
  expect(extra.build).toThrow(/count differs/);
  const duplicate = fixture();
  duplicate.summary.slots.push({ ...duplicate.summary.slots[0]! });
  duplicate.save();
  expect(duplicate.build).toThrow(/duplicate campaign slot/);
  const substituted = fixture();
  substituted.summary.slots[0]!.run_id = "another-selected-id";
  substituted.save();
  expect(substituted.build).toThrow(/unexpected campaign run/);
});
