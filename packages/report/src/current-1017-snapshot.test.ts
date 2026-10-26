import { createHash } from "node:crypto";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { loadValidatedCurrentCampaign } from "./current-campaign.js";

const dataset = "linux-results-2026-10-24";
const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "aob-1017-source-")); roots.push(root);
  cpSync(new URL(`../../../evidence/${dataset}`, import.meta.url), join(root, "evidence", dataset), { recursive: true });
  writeFileSync(join(root, "evidence/current-campaign.json"), JSON.stringify({ schema_version: 2, kind: "five-cli-1017-descriptive-snapshot", dataset }));
  return { root, dir: join(root, "evidence", dataset), load: (mode: "stored" | "derive" = "stored") => loadValidatedCurrentCampaign(root, mode) };
}
it("admits the exact reviewed 1017 snapshot and derives the same diagnostics", () => {
  const f = fixture(), c = f.load();
  expect(c.analysis.attempts).toHaveLength(80);
  expect(c.analysis.attempts.filter(a => a.outcome === "completed")).toHaveLength(44);
  expect(c.groups[0]!.reference_book).toBe("deepseek-v41-1017-reference-2026-10-18");
  expect(c.evidence).toEqual({ audit: null, audit_dataset: null, conditions: null, conditions_dataset: null });
  expect(f.load("derive").diagnostics).toEqual(c.diagnostics);
});
it.each(["audit_dataset", "conditions_dataset", "extra", "schema_version", "kind"])("rejects changed pointer %s", key => {
  const f = fixture(), path = join(f.root, "evidence/current-campaign.json"), pointer = JSON.parse(readFileSync(path, "utf8"));
  pointer[key] = key === "schema_version" ? 3 : "unapproved";
  writeFileSync(path, JSON.stringify(pointer));
  expect(() => f.load()).toThrow();
});
it.each(["analysis.json", "summary.json", "cohorts.json", "native-evidence.json", "extra-attempts.json", "collection-ledger.json"])("rejects changed immutable %s in both modes", file => {
  const f = fixture(), path = join(f.dir, file);
  writeFileSync(path, readFileSync(path, "utf8") + "\n");
  for (const mode of ["stored", "derive"] as const) expect(() => f.load(mode)).toThrow(/snapshot/);
});
it.each(["missing", "duplicate", "model", "routing", "book", "outcome", "usage", "reps", "hash", "cohort", "schedule", "imports", "native", "window", "release", "full-cost"])("rejects coherent source rewrite: %s", change => {
  const f = fixture();
  const file = ["cohort", "schedule", "imports", "window"].includes(change) ? "cohorts.json" : change === "native" ? "native-evidence.json" : ["release", "full-cost"].includes(change) ? "summary.json" : "analysis.json";
  const path = join(f.dir, file), value = JSON.parse(readFileSync(path, "utf8"));
  if (change === "missing") value.attempts.pop();
  if (change === "duplicate") value.attempts[1] = value.attempts[0];
  if (change === "model") value.attempts[0].model = "foreign";
  if (change === "routing") value.attempts[0].routing.allow_fallbacks = true;
  if (change === "book") value.attempts[0].price_book = "deepseek-v41-low-2026-09-10";
  if (change === "outcome") value.attempts[0].outcome = "completed";
  if (change === "usage") value.attempts[0].usage_unavailable = "incomplete-usage";
  if (change === "reps") value.attempts[0].rep = 2;
  if (change === "hash") value.attempts[0].hashes.events = "sha256:" + "0".repeat(64);
  if (change === "cohort") value.cohorts[0].run_ids.pop();
  if (change === "schedule") value.cohorts[0].schedule_sha256 = "sha256:" + "0".repeat(64);
  if (change === "imports") value.cohorts[1].retained_imports.pop();
  if (change === "native") value[0].native_reward = 1;
  if (change === "window") value.collection_windows[0].end_iso = "2026-10-25T00:00:00Z";
  if (change === "release") value.official_release = true;
  if (change === "full-cost") value.full_experiment_measured_cost_usd = 10;
  writeFileSync(path, JSON.stringify(value));
  const sourcePath = join(f.dir, "source.json"), source = JSON.parse(readFileSync(sourcePath, "utf8"));
  const hash = "sha256:" + createHash("sha256").update(readFileSync(path)).digest("hex");
  source.artifacts[file] = hash; writeFileSync(sourcePath, JSON.stringify(source));
  const provPath = join(f.dir, "provenance.json"), prov = JSON.parse(readFileSync(provPath, "utf8"));
  prov.artifacts[file] = hash; if (file === "summary.json") prov.summary_sha256 = hash;
  writeFileSync(provPath, JSON.stringify(prov));
  expect(() => f.load("derive")).toThrow(/approved source|snapshot/);
});
it("derives stale diagnostics without writing but rejects a stale stored view", () => {
  const f = fixture(), path = join(f.dir, "diagnostics.json");
  writeFileSync(path, "stale");
  expect(() => f.load()).toThrow(/diagnostics/);
  expect(f.load("derive").diagnostics.dataset).toBe(dataset);
  expect(readFileSync(path, "utf8")).toBe("stale");
});
