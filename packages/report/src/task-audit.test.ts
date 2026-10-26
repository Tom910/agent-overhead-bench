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

it("retains sanitized evidence hashes and exact attempt binding for changed grades", () => {
  const result = validateTaskAudit(data.attempts, audit, hashes);
  const change = result.changes[0]!;
  const index = audit.attempts.findIndex((r: { run_id: string }) => r.run_id === change.run_id);
  const record = audit.attempts[index];
  expect(change).toMatchObject({ run_sha256: record.run_sha256, verifier_image: record.verifier_image });
  expect(change.evidence).toEqual([
    `audit.json#/attempts/${index}/original_verify_log_sha256@${record.original_verify_log_sha256}`,
    `audit.json#/attempts/${index}/original_replay/patch_sha256@${record.original_replay.patch_sha256}`,
    `audit.json#/attempts/${index}/original_replay/stdout_sha256@${record.original_replay.stdout_sha256}`,
    `audit.json#/attempts/${index}/original_replay/stderr_sha256@${record.original_replay.stderr_sha256}`,
    `audit.json#/attempts/${index}/corrected_replay/patch_sha256@${record.corrected_replay.patch_sha256}`,
    `audit.json#/attempts/${index}/corrected_replay/stdout_sha256@${record.corrected_replay.stdout_sha256}`,
    `audit.json#/attempts/${index}/corrected_replay/stderr_sha256@${record.corrected_replay.stderr_sha256}`,
    `audit.json#/attempts/${index}/corrected_replay/amended_test_patch_sha256@${hashes[record.task]}`,
  ]);
});
it.each(["run_id", "task", "harness", "rep", "verifier_image", "stdout", "stderr", "original-log"])("rejects %s drift before exposing a claim", change => {
  const changed = structuredClone(audit);
  const r = changed.attempts.find((r: { corrected_reward: number | null; outcome: string }) => r.corrected_reward === 1 && r.outcome === "verify_error");
  if (change === "rep") r.rep = 99;
  else if (change === "stdout") r.corrected_replay.stdout_sha256 = "invalid";
  else if (change === "stderr") r.original_replay.stderr_sha256 = "invalid";
  else if (change === "original-log") r.original_verify_log_sha256 = "invalid";
  else r[change] = "other";
  expect(() => validateTaskAudit(data.attempts, changed, hashes)).toThrow(/audit/);
});
