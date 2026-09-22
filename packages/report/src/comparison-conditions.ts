import { ConfigError } from "@aob/contracts";
import type { AnalysisAttempt } from "./analysis.js";

export type ConditionCheck = { id: string; label: string; status: "matched" | "recorded" | "different" | "unknown"; detail: string };
export type ConditionAssessment = { controlled_comparison: boolean; attempts_validated: number; checks: ConditionCheck[] };
const hash = /^sha256:[a-f0-9]{64}$/;
const object = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === "object" && !Array.isArray(value);
function requireCondition(valid: boolean, message: string): asserts valid {
  if (!valid) throw new ConfigError(`comparison conditions: ${message}`);
}
function stable(value: unknown): string {
  if (Array.isArray(value)) return JSON.stringify(value.map(v => stable(v)));
  if (object(value)) return JSON.stringify(Object.keys(value).sort().map(k => [k, stable(value[k])]));
  return JSON.stringify(value);
}

/** Validate recorded facts first. Unknown external controls can never pass equality. */
export function assessComparisonConditions(attempts: readonly AnalysisAttempt[], document: unknown): ConditionAssessment {
  requireCondition(object(document) && document.schema_version === 1 && Array.isArray(document.attempts), "invalid document");
  requireCondition(document.attempts.length === attempts.length && attempts.length > 0, "complete condition coverage required");
  const byId = new Map(attempts.map(a => [a.run_id, a])); const seen = new Set<string>();
  const records: Record<string, unknown>[] = [];
  for (const r of document.attempts) {
    requireCondition(object(r) && typeof r.run_id === "string" && !seen.has(r.run_id), "duplicate or invalid run");
    const a = byId.get(r.run_id);
    requireCondition(a !== undefined && r.run_sha256 === a.hashes.run && r.model === a.model && r.harness === a.harness && r.version === a.version
      && r.verifier_image === a.verifier_image && r.task_base_revision === a.task_base_revision && stable(r.provider_routing) === stable(a.routing), "canonical condition binding mismatch");
    requireCondition(typeof r.agent_image === "string" && hash.test(r.agent_image) && typeof r.verifier_image === "string" && hash.test(r.verifier_image), "invalid image identity");
    requireCondition(r.declared_task_network === "disabled", "unexpected declared task network");
    for (const key of ["effective_request_settings", "enforced_resources", "enforced_network_policy", "cache_policy"]) requireCondition(key in r, `missing ${key}`);
    seen.add(r.run_id); records.push(r);
  }
  const same = (values: unknown[]) => new Set(values.map(stable)).size === 1;
  const modelMatched = same(attempts.map(a => [a.model, a.routing]));
  const versions = new Map<string, Set<string>>(); const images = new Map<string, Set<string>>(); const bases = new Map<string, Set<string | null>>();
  for (const a of attempts) {
    const v = versions.get(a.harness) ?? new Set<string>(); v.add(a.version); versions.set(a.harness, v);
    const im = images.get(a.task) ?? new Set<string>(); im.add(a.verifier_image); images.set(a.task, im);
    const base = bases.get(a.task) ?? new Set<string | null>(); base.add(a.task_base_revision); bases.set(a.task, base);
  }
  const checks: ConditionCheck[] = [
    { id: "model-routing", label: "Model and provider route", status: modelMatched ? "matched" : "different", detail: "Recorded model IDs, provider allowlist and fallback policy. A model ID does not establish immutable provider weights or honored request settings." },
    { id: "harness-versions", label: "Harness versions", status: [...versions.values()].every(v => v.size === 1) ? "matched" : "different", detail: [...versions].map(([h, v]) => `${h}: ${[...v].join(", ")}`).join("; ") },
    { id: "agent-images", label: "Agent image identities", status: "recorded", detail: "Agent image hashes were extracted from original C4 files. The historical analysis lacks this field; use the raw-C4 extraction checker to reconcile it. Different harness images are expected; native tools and context management remain the treatment." },
    { id: "task-bases", label: "Task source and base revisions", status: same(attempts.map(a => a.source)) && [...bases.values()].every(v => v.size === 1 && !v.has(null)) ? "matched" : "different", detail: "Exact source lineage and base revision are compared within each task." },
    { id: "verifier-images", label: "Verifier images", status: [...images.values()].every(v => v.size === 1) ? "matched" : "different", detail: "Retained and rebuilt image hashes differ within some tasks. The overall comparison is not image-matched." },
  ];
  const external = [
    ["request-settings", "Effective request settings", "effective_request_settings", "Historical sampling, reasoning and output caps were not captured per request. Omitted provider defaults are not known settings."],
    ["resources", "Enforced resource limits", "enforced_resources", "CPU, memory, disk, process and time limits need per-run evidence. Host RAM is not a container limit."],
    ["network", "Enforced network policy", "enforced_network_policy", "C4 declares disabled task network access; per-run enforcement was not attested."],
    ["cache", "Cache policy", "cache_policy", "Provider cache reset/warmness was not controlled. Observed cache tokens remain valid usage measurements."],
  ] as const;
  for (const [id, label, key, detail] of external) {
    const values = records.map(r => r[key]);
    // A non-null placeholder or partial dictionary is not a complete observation.
    const valid = (v: unknown): boolean => {
      if (!object(v) || v.evidence !== "observed" || !object(v.values) || typeof v.evidence_sha256 !== "string" || !hash.test(v.evidence_sha256)) return false;
      const n = (name: string, minimum: number) => typeof (v.values as Record<string, unknown>)[name] === "number" && Number.isFinite((v.values as Record<string, unknown>)[name]) && ((v.values as Record<string, unknown>)[name] as number) >= minimum;
      const x = v.values;
      if (id === "resources") return ["cpu_cores", "memory_bytes", "disk_bytes", "pids_limit", "wall_timeout_s"].every(k => n(k, 1));
      if (id === "request-settings") return n("temperature", 0) && n("top_p", 0) && n("max_output_tokens", 1) && n("reasoning_budget_tokens", 0)
        && ["none", "minimal", "low", "medium", "high", "xhigh"].includes(String(x.reasoning_effort))
        && typeof x.provider_endpoint === "string" && /^https:\/\/[^\s?#@]+$/.test(x.provider_endpoint)
        && typeof x.model_revision === "string" && /^[a-z0-9][a-z0-9/_.:-]{2,159}$/i.test(x.model_revision) && x.model_revision !== "unknown";
      if (id === "network") return x.agent === "proxy-only" && x.verifier === "none";
      return ["cold-controlled", "warm-controlled"].includes(String(x.policy)) && typeof x.reset_protocol_sha256 === "string" && hash.test(x.reset_protocol_sha256);
    };
    const status = values.every(valid) ? same(values.map(v => (v as Record<string, unknown>).values)) ? "matched" : "different" : "unknown";
    checks.push({ id, label, status, detail });
  }
  return { controlled_comparison: checks.every(c => c.status === "matched" || c.status === "recorded"), attempts_validated: records.length, checks };
}
