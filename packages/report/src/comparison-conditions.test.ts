import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import type { AnalysisExport } from "./analysis.js";
import { assessComparisonConditions } from "./comparison-conditions.js";
const data = JSON.parse(readFileSync(new URL("../../../evidence/linux-results-2026-09-19-r1/analysis.json", import.meta.url), "utf8")) as AnalysisExport;
const document = JSON.parse(readFileSync(new URL("../../../evidence/linux-conditions-2026-09-21/conditions.json", import.meta.url), "utf8"));
it("does not equate missing settings or host RAM with controlled requests/resources", () => {
  const result = assessComparisonConditions(data.attempts, document);
  expect(result.controlled_comparison).toBe(false);
  expect(result.attempts_validated).toBe(200);
  expect(result.checks.find(c => c.id === "request-settings")!.status).toBe("unknown");
  expect(result.checks.find(c => c.id === "resources")!.status).toBe("unknown");
  expect(result.checks.find(c => c.id === "verifier-images")!.status).toBe("different");
  expect(result.checks.find(c => c.id === "model-routing")!.status).toBe("matched");
});
it("does not accept observed labels on incomplete control dictionaries", () => {
  const doc = structuredClone(document);
  for (const r of doc.attempts) r.enforced_resources = { evidence: "observed", values: { memory_bytes: 4096 } };
  expect(assessComparisonConditions(data.attempts, doc).checks.find(c => c.id === "resources")!.status).toBe("unknown");
});
it("compares complete control values independently of their evidence-file hashes", () => {
  const doc = structuredClone(document);
  for (const [i, r] of doc.attempts.entries()) r.enforced_resources = { evidence: "observed", evidence_sha256: "sha256:" + i.toString(16).padStart(64, "0"), values: { cpu_cores: 2, memory_bytes: 4294967296, disk_bytes: 10737418240, pids_limit: 512, wall_timeout_s: 10800 } };
  expect(assessComparisonConditions(data.attempts, doc).checks.find(c => c.id === "resources")!.status).toBe("matched");
  doc.attempts[0].enforced_resources.values.cpu_cores = 4;
  expect(assessComparisonConditions(data.attempts, doc).checks.find(c => c.id === "resources")!.status).toBe("different");
});
it.each(["hash", "model", "version", "image", "duplicate", "missing"])("rejects condition evidence with %s drift", change => {
  const doc = structuredClone(document);
  if (change === "hash") doc.attempts[0].run_sha256 = "sha256:" + "0".repeat(64);
  if (change === "model") doc.attempts[0].model = "different";
  if (change === "version") doc.attempts[0].version = "different";
  if (change === "image") doc.attempts[0].verifier_image = "sha256:" + "0".repeat(64);
  if (change === "duplicate") doc.attempts.push(doc.attempts[0]);
  if (change === "missing") doc.attempts.pop();
  expect(() => assessComparisonConditions(data.attempts, doc)).toThrow(/condition/);
});
