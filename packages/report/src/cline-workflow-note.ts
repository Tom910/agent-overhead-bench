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
  total_cells: number; trace_estimated_combined_pass_count: number;
  exact_amended_native_pass_count: null; original_evidence_modified: boolean; grade_changes: number;
  cells: AuditCell[];
};

/** A separately approved trace estimate. Never replaces a native grade or analysis input. */
export function clineWorkflowNote(dir: string): {
  hash: string; markdown: string; repositoryMarkdown: string; html: (prefix?: string) => string;
} {
  try {
    const bytes = readFileSync(join(dir, CLINE_WORKFLOW_AUDIT));
    requireSnapshot(snapshotHash(bytes) === APPROVED_AUDIT, "Cline trace audit hash mismatch");
    const audit = JSON.parse(bytes.toString()) as Audit;
    const nativeBytes = readFileSync(join(dir, "native-evidence.json"));
    const native = JSON.parse(nativeBytes.toString()) as { run_id: string; run_sha256: string; native_manifest_sha256: string; native_reward: number }[];
    const cline = new Map(native.filter(row => row.run_id.startsWith("pinned:cline:")).map(row => [row.run_id, row]));
    requireSnapshot(audit.dataset === "linux-results-2026-10-24" && audit.total_cells === 16 && audit.cells.length === 16 &&
      new Set(audit.cells.map(row => row.run_id)).size === 16 && cline.size === 16 &&
      audit.original_source_sha256 === snapshotHash(readFileSync(join(dir, "source.json"))) &&
      audit.native_evidence_sha256 === snapshotHash(nativeBytes) && audit.exact_amended_native_pass_count === null &&
      !audit.original_evidence_modified && audit.grade_changes === 0, "Cline trace audit identity differs");
    for (const row of audit.cells) {
      const original = cline.get(row.run_id);
      requireSnapshot(original !== undefined && original.native_reward === 0 && row.original_native_reward === 0 &&
        original.run_sha256 === `sha256:${row.sha256["run.json"]}` &&
        original.native_manifest_sha256 === `sha256:${row.sha256["native-verifier-evidence.json"]}`, "Cline trace audit source binding differs");
    }
    requireSnapshot(audit.cells.filter(row => row.trace_estimated_combined_pass).length === 6 &&
      audit.trace_estimated_combined_pass_count === 6 &&
      audit.cells.filter(row => row.native_functional_failure_count === 0).length === 8 &&
      audit.cells.filter(row => row.observed_successful_commit).length === 15 &&
      audit.cells.filter(row => row.trace_estimated_workflow_pass).length === 14, "Cline trace audit counts differ");
    const title = "Cline verifier correction";
    const estimate = "Cline trace estimate: 6/16 (37.5%).";
    const body = "The recorded result is 0/16, affected by a verifier defect: Cline's private cache was counted as uncommitted task work. This estimate covers all 16 Cline runs. Eight runs passed all code assertions; two of those still had real commit failures. Original Git metadata was overwritten, so an exact regrade is unavailable. Four of the six estimated passes lack a complete final Git status. Do not use Cline's recorded pass rate for a performance comparison. Original grades, costs, time and cache data are unchanged.";
    const markdown = (prefix: string) => `## ${title}\n\n**${estimate}** ${body}\n\n[Read the trace audit and per-run limits](${prefix}${CLINE_WORKFLOW_AUDIT}).\n\n`;
    return { hash: APPROVED_AUDIT, markdown: markdown(""), repositoryMarkdown: markdown(`evidence/${audit.dataset}/`),
      html: (prefix = "") => `<section id="cline-workflow-correction" style="border:1px solid currentColor;padding:16px;margin:16px 0"><h2>${title}</h2><p><strong>${estimate}</strong></p><p>${body}</p><p><a href="${prefix}${CLINE_WORKFLOW_AUDIT}">Read the trace audit and per-run limits</a></p></section>` };
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError("Cline trace audit is unavailable or invalid");
  }
}
