import { createHash } from "node:crypto";
import { ConfigError, validateC4Run } from "@aob/contracts";

export function extractConditionRecord(raw: Buffer) {
  let parsed: unknown;
  try { parsed = JSON.parse(raw.toString()); } catch { throw new ConfigError("condition extraction: invalid C4 JSON"); }
  const r = validateC4Run(parsed);
  return { run_id: r.run_id, run_sha256: `sha256:${createHash("sha256").update(raw).digest("hex")}`,
    harness: r.tool, version: r.tool_version, model: r.model,
    agent_image: r.container.image_digest, verifier_image: r.container.verifier_image_digest,
    task_base_revision: r.task_base_revision ?? null, provider_routing: r.provider_routing ?? null,
    declared_task_network: r.task_environment.network };
}
/** Requires private raw C4 preimages; artifact hashing alone is not field reconciliation. */
export function verifyConditionExtraction(records: unknown, rawRuns: readonly Buffer[]): void {
  if (!Array.isArray(records) || records.length !== rawRuns.length) throw new ConfigError("condition extraction: coverage mismatch");
  const extracted = rawRuns.map(extractConditionRecord);
  const byId = new Map(extracted.map(r => [r.run_id, r])); const seen = new Set<string>();
  if (byId.size !== rawRuns.length) throw new ConfigError("condition extraction: duplicate raw run");
  for (const value of records) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) throw new ConfigError("condition extraction: invalid record");
    const record = value as Record<string, unknown>;
    if (typeof record.run_id !== "string" || seen.has(record.run_id)) throw new ConfigError("condition extraction: duplicate or missing run ID");
    const raw = byId.get(record.run_id);
    if (!raw) throw new ConfigError("condition extraction: raw run missing");
    seen.add(record.run_id);
    for (const [key, expected] of Object.entries(raw)) {
      if (JSON.stringify(record[key]) !== JSON.stringify(expected)) throw new ConfigError(`condition extraction: ${key} differs from raw C4`);
    }
  }
}
