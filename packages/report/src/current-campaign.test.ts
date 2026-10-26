import { createHash } from "node:crypto";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import type { ValidityDiagnostics } from "./validity-diagnostics.js";
import { loadValidatedCurrentCampaign, publishCurrentCampaign } from "./current-campaign.js";

const roots: string[] = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "aob-current-")); roots.push(root);
  const dataset = "linux-results-2026-09-19";
  const dir = join(root, "evidence", dataset);
  mkdirSync(join(root, "evidence"));
  cpSync(new URL(`../../../evidence/${dataset}`, import.meta.url), dir, { recursive: true });
  writeFileSync(join(root, "evidence/current-campaign.json"), JSON.stringify({ dataset }));
  writeFileSync(join(root, "README.md"), "Intro\n<!-- CURRENT-CAMPAIGN:START -->\nstale\n<!-- CURRENT-CAMPAIGN:END -->\nFooter\n");
  return { root, dir, run: (check = false) => publishCurrentCampaign(root, check) };
}
function currentFixture() {
  const f = fixture();
  for (const dataset of ["linux-results-2026-09-19-r1", "linux-conditions-2026-09-21", "task-verification-2026-09-21"]) {
    cpSync(new URL(`../../../evidence/${dataset}`, import.meta.url), join(f.root, "evidence", dataset), { recursive: true });
  }
  cpSync(new URL("../../../task-revisions", import.meta.url), join(f.root, "task-revisions"), { recursive: true });
  writeFileSync(join(f.root, "evidence/current-campaign.json"), JSON.stringify({ dataset: "linux-results-2026-09-19-r1", conditions_dataset: "linux-conditions-2026-09-21", audit_dataset: "task-verification-2026-09-21" }));
  return { ...f, dir: join(f.root, "evidence/linux-results-2026-09-19-r1") };
}
it("binds separate audit and condition evidence and publishes consistent comparison artifacts", () => {
  const f = currentFixture();
  f.run();
  const comparison = JSON.parse(readFileSync(join(f.root, "evidence/linux-results-2026-09-19-r1/comparison.json"), "utf8"));
  expect(comparison.conditions.controlled_comparison).toBe(false);
  expect(comparison.audit.changes).toHaveLength(4);
  expect(comparison.pairwise).toHaveLength(10);
  expect(readFileSync(join(f.root, "site/index.html"), "utf8")).toContain("What changed in verification?");
  f.run(true);
  const path = join(f.root, "evidence/task-verification-2026-09-21/audit.json");
  writeFileSync(path, readFileSync(path, "utf8") + "\n");
  expect(f.run).toThrow(/audit.*hash|hash.*audit/);
});
it("generates all current views from one source and detects drift without writing", () => {
  const f = fixture();
  expect(() => f.run(true)).toThrow(/stale/);
  expect(readFileSync(join(f.root, "README.md"), "utf8")).toContain("stale");
  f.run(); f.run(true);
  const site = join(f.root, "site/index.html");
  expect(readFileSync(site, "utf8")).toContain("side by side.</span>");
  writeFileSync(site, "stale site");
  expect(() => f.run(true)).toThrow(/stale/);
  f.run(); f.run(true);
  const readme = readFileSync(join(f.root, "README.md"), "utf8");
  expect(readme).toContain("All harnesses combined:"); expect(readme).toContain("Avg cost / task"); expect(readme).toContain("Whole benchmark");
  expect(readme).toContain("200/200"); expect(readme).toContain("62.5%");
  expect(readme).toContain("**100.0%**"); expect(readme).not.toContain("\\*\\*"); expect(readme).toContain("Intro\n"); expect(readme).toContain("Footer\n");
  writeFileSync(join(f.dir, "analysis.html"), "stale");
  expect(() => f.run(true)).toThrow(/stale/);
  expect(readFileSync(join(f.dir, "analysis.html"), "utf8")).toBe("stale");
  f.run(); f.run(true);
});
it("rejects changed canonical bytes and selection hashes", () => {
  const f = fixture();
  const source = join(f.dir, "analysis.json");
  writeFileSync(source, readFileSync(source, "utf8") + "\n");
  expect(f.run).toThrow(/source hash/);
});
it("rejects incomplete matrices even with updated source binding", () => {
  const f = fixture(); const source = join(f.dir, "analysis.json");
  const data = JSON.parse(readFileSync(source, "utf8")); data.attempts.pop();
  writeFileSync(source, JSON.stringify(data));
  const path = join(f.dir, "provenance.json"); const provenance = JSON.parse(readFileSync(path, "utf8"));
  provenance.artifacts["analysis.json"] = `sha256:${createHash("sha256").update(readFileSync(source)).digest("hex")}`;
  writeFileSync(path, JSON.stringify(provenance));
  expect(f.run).toThrow(/200|matrix/);
});
it("rejects unsafe source pointers and missing README markers", () => {
  const f = fixture();
  writeFileSync(join(f.root, "README.md"), "No marker"); expect(f.run).toThrow(/markers/);
  writeFileSync(join(f.root, "evidence/current-campaign.json"), JSON.stringify({ dataset: "../private" }));
  expect(f.run).toThrow(/dataset/);
});

it.each(["host", "model", "slot", "routing"])("rejects inconsistent %s facts even with refreshed source hashes", (change) => {
  const f = fixture(); const source = join(f.dir, "analysis.json");
  const data = JSON.parse(readFileSync(source, "utf8"));
  const summaryPath = join(f.dir, "summary.json");
  const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
  const attempt = data.attempts[0];
  const slot = summary.slots.find((slot: { run_id: string }) => slot.run_id === attempt.run_id);
  if (change === "host") { attempt.host.os = "darwin"; slot.host = "darwin"; }
  if (change === "model") { attempt.model = "other-model"; }
  if (change === "slot") { slot.rep = (slot.rep + 1) % 5; }
  if (change === "routing") { attempt.routing.allow_fallbacks = true; }
  writeFileSync(source, JSON.stringify(data)); writeFileSync(summaryPath, JSON.stringify(summary));
  const path = join(f.dir, "provenance.json"); const provenance = JSON.parse(readFileSync(path, "utf8"));
  const hash = (path: string) => `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
  provenance.artifacts["analysis.json"] = hash(source); provenance.summary_sha256 = hash(summaryPath);
  writeFileSync(path, JSON.stringify(provenance));
  expect(f.run).toThrow(/boundary|binding|routing/);
});

it("publishes complete replacements with preserved originals and disclosed additional cost", () => {
  const f = fixture();
  const nextDir = join(f.root, "evidence/linux-results-2026-09-19-r1"); cpSync(f.dir, nextDir, { recursive: true });
  const data = JSON.parse(readFileSync(join(f.dir, "analysis.json"), "utf8"));
  const summary = JSON.parse(readFileSync(join(f.dir, "summary.json"), "utf8"));
  const replacements: { original_run_id: string; replacement_run_id: string }[] = [];
  data.attempts = data.attempts.map((a: { run_id: string; harness: string; task: string; rep: number; usage_unavailable: string | null; cost_unavailable: string | null }) => {
    if (a.usage_unavailable === null && a.cost_unavailable !== "incomplete-accounting") return a;
    const next = structuredClone(data.attempts.find((b: typeof a) => b.harness === a.harness && b.task === a.task && b.usage_unavailable === null && b.cost_unavailable === null));
    next.run_id = a.run_id + "-replacement"; next.rep = a.rep;
    // A replacement has its own artifacts, even when the fixture reuses usage facts.
    next.hashes = { run: `sha256:${createHash("sha256").update(next.run_id).digest("hex")}`, events: `sha256:${createHash("sha256").update(`events:${next.run_id}`).digest("hex")}` };
    replacements.push({ original_run_id: a.run_id, replacement_run_id: next.run_id });
    const slot = summary.slots.find((s: { run_id: string }) => s.run_id === a.run_id);
    Object.assign(slot, { run_id: next.run_id, outcome: next.outcome, run_sha256: next.hashes.run, events_sha256: next.hashes.events });
    return next;
  });
  expect(replacements).toHaveLength(4);
  Object.assign(summary, { prior_dataset: "linux-results-2026-09-19", replacements, interrupted_recovery_note: "Retained interrupted startup", interrupted_recovery_evidence: [{ run_id: "interrupted", events_sha256: "sha256:" + "0".repeat(64), event_count: 12 }] });
  writeFileSync(join(nextDir, "analysis.json"), JSON.stringify(data));
  writeFileSync(join(nextDir, "summary.json"), JSON.stringify(summary));
  const provenance = JSON.parse(readFileSync(join(nextDir, "provenance.json"), "utf8"));
  const hash = (name: string) => `sha256:${createHash("sha256").update(readFileSync(join(nextDir, name))).digest("hex")}`;
  provenance.artifacts["analysis.json"] = hash("analysis.json"); provenance.summary_sha256 = hash("summary.json");
  writeFileSync(join(nextDir, "provenance.json"), JSON.stringify(provenance));
  writeFileSync(join(f.root, "evidence/current-campaign.json"), JSON.stringify({ dataset: "linux-results-2026-09-19-r1" }));
  f.run(); f.run(true);
  expect(readFileSync(join(f.root, "README.md"), "utf8")).toContain("additional reference cost");
  expect(readFileSync(join(f.root, "README.md"), "utf8")).toContain("One additional Hermes recovery startup");
  // A duplicate mapping may not silently authorize changes to another slot.
  summary.replacements[1] = summary.replacements[0];
  writeFileSync(join(nextDir, "summary.json"), JSON.stringify(summary));
  provenance.summary_sha256 = hash("summary.json"); writeFileSync(join(nextDir, "provenance.json"), JSON.stringify(provenance));
  expect(f.run).toThrow(/replacement membership/);
});

it("publishes deterministic bound diagnostics, preserving grades and selected costs", () => {
  const f = currentFixture();
  const original = readFileSync(join(f.dir, "analysis.json"));
  f.run(); f.run(true);
  const bytes = readFileSync(join(f.dir, "diagnostics.json"));
  const d = JSON.parse(bytes.toString()) as ValidityDiagnostics;
  expect(d.reliability.reduce((sum, row) => sum + row.passes, 0)).toBe(105);
  expect(d.reliability.reduce((sum, row) => sum + row.repetitions, 0)).toBe(200);
  expect(d.failures).toHaveLength(200);
  expect(d.failures.filter(row => row.category === "confirmed-verifier-false-negative")).toHaveLength(4);
  // Owner sorts Pi before Qwen; negate the endpoints to express Qwen minus Pi.
  const pair = d.sensitivity.find(row => JSON.parse(row.left)[0] === "pi" && JSON.parse(row.right)[0] === "qwen")!;
  expect(-pair.max_pp!).toBeCloseTo(2.857142857142857, 10);
  expect(-pair.min_pp!).toBeCloseTo(11.428571428571429, 10);
  const subtotal = (role: string) => d.collection.items.filter(row => row.class === role).reduce((sum, row) => sum + (row.known_reference_usd ?? 0), 0);
  expect(subtotal("selected")).toBeCloseTo(27.184785825, 10);
  expect(subtotal("superseded")).toBeCloseTo(0.673298502, 10);
  expect(d.collection).toMatchObject({ selected_count: 200, superseded_count: 4, interrupted_count: 1,
    missing_cost_count: 5, complete_total_usd: null, historical_excluded_scope: "unknown" });
  expect(d.collection.known_reference_usd).toBeCloseTo(27.858084327, 10);
  expect(d.collection.items.find(row => row.class === "interrupted")).toMatchObject({
    run_id: "pinned:hermes:textual-richlog-follow-state:4:usage-replacements-20260919",
    events_sha256: "sha256:a4e9a3d6f78ca4d144e9a73d1eb1c811a814d7875680a904e55d6be3e2b2d068", known_reference_usd: null });
  const provenance = readFileSync(join(f.dir, "provenance.json"));
  expect(JSON.parse(provenance.toString()).artifacts["diagnostics.json"]).toBe(`sha256:${createHash("sha256").update(bytes).digest("hex")}`);
  f.run();
  expect(readFileSync(join(f.dir, "diagnostics.json")).equals(bytes)).toBe(true);
  expect(readFileSync(join(f.dir, "provenance.json")).equals(provenance)).toBe(true);
  expect(readFileSync(join(f.dir, "analysis.json")).equals(original)).toBe(true);
  writeFileSync(join(f.dir, "diagnostics.json"), "stale");
  expect(() => f.run(true)).toThrow(/stale generated view.*diagnostics/);
  expect(readFileSync(join(f.dir, "diagnostics.json"), "utf8")).toBe("stale");
});
it("rejects tampered prior bytes before publishing collection costs", () => {
  const f = currentFixture(), prior = join(f.root, "evidence/linux-results-2026-09-19/analysis.json");
  writeFileSync(prior, readFileSync(prior, "utf8") + "\n");
  expect(f.run).toThrow(/prior source hash mismatch/);
});
it.each(["hash", "count", "run-id", "missing"])("rejects invalid interrupted %s evidence even when the summary hash is refreshed", field => {
  const f = currentFixture(), path = join(f.dir, "summary.json");
  const summary = JSON.parse(readFileSync(path, "utf8"));
  if (field === "hash") summary.interrupted_recovery_evidence[0].events_sha256 = "invalid";
  if (field === "count") summary.interrupted_recovery_evidence[0].event_count = -1;
  if (field === "run-id") summary.interrupted_recovery_evidence[0].run_id = 123;
  if (field === "missing") delete summary.interrupted_recovery_evidence;
  writeFileSync(path, JSON.stringify(summary));
  const provenancePath = join(f.dir, "provenance.json"), provenance = JSON.parse(readFileSync(provenancePath, "utf8"));
  provenance.summary_sha256 = `sha256:${createHash("sha256").update(readFileSync(path)).digest("hex")}`;
  writeFileSync(provenancePath, JSON.stringify(provenance));
  expect(f.run).toThrow(/interrupted/);
});

it("loads a validated campaign without rewriting stale presentation files", () => {
  const f = currentFixture(); const site = join(f.root, "site/index.html");
  mkdirSync(join(f.root, "site")); writeFileSync(site, "stale presentation sentinel");
  const loaded = loadValidatedCurrentCampaign(f.root);
  expect(loaded.dataset).toBe("linux-results-2026-09-19-r1");
  expect(loaded.analysis.attempts).toHaveLength(200); expect(loaded.diagnostics.failures).toHaveLength(200);
  expect(readFileSync(site, "utf8")).toBe("stale presentation sentinel");
  expect(readFileSync(join(f.root, "README.md"), "utf8")).toContain("stale");
  const path = join(f.dir, "diagnostics.json"); writeFileSync(path, "stale diagnostics sentinel");
  expect(() => loadValidatedCurrentCampaign(f.root)).toThrow(/diagnostics/);
  expect(readFileSync(path, "utf8")).toBe("stale diagnostics sentinel");
  // Refresh derives from validated canonical inputs, never from this stale sidecar.
  f.run(); expect(loadValidatedCurrentCampaign(f.root).diagnostics.failures).toHaveLength(200);
});
