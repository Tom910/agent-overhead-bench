import { ConfigError } from "@aob/contracts";
import type { AnalysisAttempt } from "./analysis.js";
export type AuditSummary = {
  revision: string; audited: number; reproduced: number; corrected: number; unavailable: number;
  changes: Array<{ run_id: string; task: string; harness: string; rep: number; original: number; corrected: number }>;
  storage_failures: number;
};
const object = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
function requireAudit(valid: boolean, message: string): asserts valid { if (!valid) throw new ConfigError(`task audit: ${message}`); }
function grade(value: unknown): { reward: number; counts: number[] } {
  requireAudit(object(value), "missing grade");
  const keys = ["p2p_passed", "p2p_total", "f2p_passed", "f2p_total"];
  requireAudit(keys.every(k => Number.isInteger(value[k]) && (value[k] as number) >= 0), "invalid grade counts");
  const [p, pt, f, ft] = keys.map(k => value[k] as number) as [number, number, number, number];
  requireAudit(p <= pt && f <= ft && ft > 0 && value.reward === (p === pt && f === ft ? 1 : 0), "inconsistent grade reward");
  return { reward: value.reward as number, counts: [p, pt, pt - p, f, ft, ft - f] };
}
function replay(value: unknown, image: string, revised: boolean, amendment?: string) {
  requireAudit(object(value) && value.image === image && value.revised === revised && value.exit_code === 0, "invalid replay identity or execution");
  for (const key of ["patch_sha256", "stdout_sha256", "stderr_sha256"]) requireAudit(typeof value[key] === "string" && /^sha256:[a-f0-9]{64}$/.test(value[key]), "invalid replay hash");
  if (revised) requireAudit(typeof amendment === "string" && /^sha256:[a-f0-9]{64}$/.test(amendment) && value.amended_test_patch_sha256 === amendment, "amended verifier hash mismatch");
  return { ...grade(value.grade), patch: value.patch_sha256 };
}
export function validateTaskAudit(attempts: readonly AnalysisAttempt[], document: unknown, amendmentHashes: Record<string, string>): AuditSummary {
  requireAudit(object(document) && document.schema_version === 1 && document.historical_results_replaced === false && document.model_calls === 0
    && typeof document.revision === "string" && Array.isArray(document.attempts) && object(document.scope), "invalid audit document");
  const byId = new Map(attempts.map(a => [a.run_id, a])); const seen = new Set<string>();
  const taskIds = Object.keys(amendmentHashes).sort();
  requireAudit(taskIds.length === 3 && attempts.filter(a => taskIds.includes(a.task)).length === document.attempts.length, "complete reviewed-task coverage required");
  requireAudit(Array.isArray(document.polarity) && document.polarity.length === 7, "missing reference/pristine/control polarity");
  const polarityKeys = new Set<string>();
  for (const p of document.polarity) {
    requireAudit(object(p) && typeof p.task === "string" && taskIds.includes(p.task) && typeof p.label === "string"
      && ["reference", "pristine", "reference-without-events"].includes(p.label) && typeof p.image === "string", "invalid polarity record");
    const key = `${p.task}:${p.label}`;
    requireAudit(!polarityKeys.has(key) && attempts.some(a => a.task === p.task && a.verifier_image === p.image), "duplicate or unbound polarity image");
    polarityKeys.add(key);
    requireAudit(p.label !== "reference-without-events" || p.task === "textual-richlog-follow-state", "unexpected negative control");
    const verified = replay(p, p.image, p.task === "textual-richlog-follow-state", amendmentHashes[p.task]);
    requireAudit(verified.reward === (p.label === "reference" ? 1 : 0), "reference/control polarity failed");
  }
  requireAudit(taskIds.every(t => polarityKeys.has(`${t}:reference`) && polarityKeys.has(`${t}:pristine`)) && polarityKeys.has("textual-richlog-follow-state:reference-without-events"), "incomplete polarity coverage");
  const result: AuditSummary = { revision: document.revision, audited: 0, reproduced: 0, corrected: 0, unavailable: 0, changes: [], storage_failures: 0 };
  for (const record of document.attempts) {
    requireAudit(object(record) && typeof record.run_id === "string" && !seen.has(record.run_id), "duplicate or invalid attempt");
    const a = byId.get(record.run_id);
    requireAudit(a !== undefined && a.hashes.run === record.run_sha256 && a.task === record.task && a.harness === record.harness && a.rep === record.rep
      && a.outcome === record.outcome && a.verifier_image === record.verifier_image && taskIds.includes(a.task), "canonical binding mismatch");
    seen.add(record.run_id); result.audited++;
    requireAudit(typeof record.original_verify_log_sha256 === "string" && /^sha256:[a-f0-9]{64}$/.test(record.original_verify_log_sha256), "invalid historical log hash");
    if (record.failure_cause === "harness-session-storage") result.storage_failures++;
    if (record.original_replay === null) {
      requireAudit(record.replay_status === "unavailable-original-image" && record.corrected_replay === null && record.corrected_reward === null, "corrected outcome without original replay");
      result.unavailable++; continue;
    }
    requireAudit(record.replay_status === "reproduced-original-grade", "unexpected replay status");
    const original = replay(record.original_replay, a.verifier_image, false);
    requireAudit(JSON.stringify(original.counts) === JSON.stringify(record.original_grade) && original.reward === (a.outcome === "completed" ? 1 : 0), "original grade does not reproduce historical outcome");
    result.reproduced++;
    if (record.corrected_replay === null) { requireAudit(record.corrected_reward === null, "outcome without corrected replay"); continue; }
    requireAudit(a.task === "textual-richlog-follow-state", "unreviewed verifier amendment");
    const corrected = replay(record.corrected_replay, a.verifier_image, true, amendmentHashes[a.task]);
    requireAudit(corrected.patch === original.patch && corrected.counts[1] === original.counts[1] && corrected.counts[4] === original.counts[4]
      && corrected.reward === record.corrected_reward, "corrected patch or grade mismatch");
    result.corrected++;
    if (corrected.reward !== original.reward) result.changes.push({ run_id: a.run_id, task: a.task, harness: a.harness, rep: a.rep, original: original.reward, corrected: corrected.reward });
  }
  requireAudit(result.audited === document.scope.audited_attempts && result.reproduced === document.scope.original_grade_replays
    && result.corrected === document.scope.corrected_verifier_replays && result.unavailable === document.scope.unavailable_original_images, "coverage mismatch");
  return result;
}
