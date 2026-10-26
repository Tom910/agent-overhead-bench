import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ConfigError } from "@aob/contracts";
import { requireSnapshot, snapshotHash } from "./current-1017-snapshot.js";

export const CLINE_WORKFLOW_AUDIT = "cline-workflow-audit.json";
const APPROVED_AUDIT = "sha256:1383d088c1359c8e7f2c661ec85528448092665fec246773b6377f0c925a721c";
type AuditCell = {
  run_id: string; original_native_reward: number; native_functional_failure_count: number;
  observed_successful_commit: boolean; trace_estimated_workflow_pass: boolean;
  trace_estimated_combined_pass: boolean; sha256: Record<string, string>;
};
type Audit = {
  dataset: string; original_source_sha256: string; native_evidence_sha256: string;
  total_cells: number; trace_estimated_combined_pass_count: number; native_functional_pass_count: number;
  successful_commit_cells: number; trace_estimated_workflow_pass_count: number;
  exact_amended_native_pass_count: null; original_evidence_modified: boolean; grade_changes: number;
  cells: AuditCell[];
};

/** A separately approved trace estimate. Never replaces a native grade or analysis input. */
export function loadSnapshotPassAudit(dir: string): {
  file: string; hash: string; passEstimates: ReadonlyMap<string, boolean>;
} {
  try {
    const bytes = readFileSync(join(dir, CLINE_WORKFLOW_AUDIT));
    requireSnapshot(snapshotHash(bytes) === APPROVED_AUDIT, "Cline trace audit hash mismatch");
    const audit = JSON.parse(bytes.toString()) as Audit;
    const nativeBytes = readFileSync(join(dir, "native-evidence.json"));
    const native = JSON.parse(nativeBytes.toString()) as { run_id: string; run_sha256: string; native_manifest_sha256: string; native_reward: number }[];
    const cline = new Map(native.filter(row => row.run_id.startsWith("pinned:cline:")).map(row => [row.run_id, row]));
    requireSnapshot(audit.dataset === "linux-results-2026-10-24" && audit.cells.length === audit.total_cells &&
      new Set(audit.cells.map(row => row.run_id)).size === audit.total_cells && cline.size === audit.total_cells &&
      audit.original_source_sha256 === snapshotHash(readFileSync(join(dir, "source.json"))) &&
      audit.native_evidence_sha256 === snapshotHash(nativeBytes) && audit.exact_amended_native_pass_count === null &&
      !audit.original_evidence_modified && audit.grade_changes === 0, "Cline trace audit identity differs");
    for (const row of audit.cells) {
      const original = cline.get(row.run_id);
      requireSnapshot(original !== undefined && original.native_reward === 0 && row.original_native_reward === 0 &&
        original.run_sha256 === `sha256:${row.sha256["run.json"]}` &&
        original.native_manifest_sha256 === `sha256:${row.sha256["native-verifier-evidence.json"]}`, "Cline trace audit source binding differs");
    }
    requireSnapshot(audit.cells.filter(row => row.trace_estimated_combined_pass).length === audit.trace_estimated_combined_pass_count &&
      audit.cells.filter(row => row.native_functional_failure_count === 0).length === audit.native_functional_pass_count &&
      audit.cells.filter(row => row.observed_successful_commit).length === audit.successful_commit_cells &&
      audit.cells.filter(row => row.trace_estimated_workflow_pass).length === audit.trace_estimated_workflow_pass_count, "Cline trace audit counts differ");
    return { file: CLINE_WORKFLOW_AUDIT, hash: APPROVED_AUDIT,
      passEstimates: new Map(audit.cells.map(row => [row.run_id, row.trace_estimated_combined_pass])) };

  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError("Cline trace audit is unavailable or invalid");
  }
}
