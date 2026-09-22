import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import type { AnalysisExport } from "./analysis.js";
import { validateTaskAudit } from "./task-audit.js";
const data = JSON.parse(readFileSync(new URL("../../../evidence/linux-results-2026-09-19-r1/analysis.json", import.meta.url), "utf8")) as AnalysisExport;
const audit = JSON.parse(readFileSync(new URL("../../../evidence/task-verification-2026-09-21/audit.json", import.meta.url), "utf8"));
const manifest = JSON.parse(readFileSync(new URL("../../../task-revisions/2026-09-21/manifest.json", import.meta.url), "utf8"));
const hashes = Object.fromEntries(manifest.tasks.map((r: { task: string; amended_test_patch_sha256: string }) => [r.task, r.amended_test_patch_sha256]));
it("exposes only bound corrected replays and preserves historical outcomes", () => {
  const result = validateTaskAudit(data.attempts, audit, hashes);
  expect(result).toMatchObject({ audited: 75, reproduced: 33, corrected: 13, unavailable: 42 });
  expect(result.changes.map(c => [c.harness, c.rep])).toEqual([["codex", 0], ["codex", 1], ["pi", 0], ["qwen", 0]]);
  expect(data.attempts.filter(a => a.outcome === "completed")).toHaveLength(105);
});
it.each(["hash", "patch", "grade", "duplicate", "unreplayed", "amendment", "polarity", "control"])("rejects %s drift in the verification revision", change => {
  const changed = structuredClone(audit);
  const r = changed.attempts.find((a: { corrected_reward: number | null }) => a.corrected_reward === 1);
  if (change === "hash") r.run_sha256 = "sha256:" + "0".repeat(64);
  if (change === "patch") r.corrected_replay.patch_sha256 = "sha256:" + "0".repeat(64);
  if (change === "grade") r.original_grade[3] = 20;
  if (change === "duplicate") changed.attempts.push(r);
  if (change === "unreplayed") { r.original_replay = null; r.replay_status = "unavailable-original-image"; }
  if (change === "amendment") r.corrected_replay.amended_test_patch_sha256 = "sha256:" + "0".repeat(64);
  if (change === "polarity") delete changed.polarity;
  if (change === "control") changed.polarity.find((p: { label: string }) => p.label === "reference-without-events").grade.reward = 1;
  expect(() => validateTaskAudit(data.attempts, changed, hashes)).toThrow(/audit/);
});
