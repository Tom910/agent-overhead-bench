import { createHash } from "node:crypto";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it } from "vitest";
import { publishCurrentCampaign } from "./current-campaign.js";

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
it("generates all current views from one source and detects drift without writing", () => {
  const f = fixture();
  expect(() => f.run(true)).toThrow(/stale/);
  expect(readFileSync(join(f.root, "README.md"), "utf8")).toContain("stale");
  f.run(); f.run(true);
  const site = join(f.root, "site/index.html");
  expect(readFileSync(site, "utf8")).toContain("The numbers, side by side.");
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
    replacements.push({ original_run_id: a.run_id, replacement_run_id: next.run_id });
    const slot = summary.slots.find((s: { run_id: string }) => s.run_id === a.run_id);
    Object.assign(slot, { run_id: next.run_id, outcome: next.outcome, run_sha256: next.hashes.run, events_sha256: next.hashes.events });
    return next;
  });
  expect(replacements).toHaveLength(4);
  Object.assign(summary, { prior_dataset: "linux-results-2026-09-19", replacements, interrupted_recovery_note: "Retained interrupted startup" });
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
