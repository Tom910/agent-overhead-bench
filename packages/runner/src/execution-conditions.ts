import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { ContractViolation } from "@aob/contracts";

type DockerLimits = {
  nano_cpus: number; cpu_quota: number; cpu_period: number; cpuset_cpus: string;
  memory_bytes: number; memory_reservation_bytes: number; memory_swap_bytes: number;
  pids_limit: number | null; storage_size: string | null; readonly_root: boolean;
};
export type ExecutionObservation = {
  status: "observed"; image_digest: string; docker: DockerLimits;
  network: { mode: "none" | "internal"; internal: boolean | null };
  oom_killed: boolean; wall_timeout_s: number;
  ancestor_limits: "unknown"; workspace_disk_quota: "unknown"; provider_cache: "uncontrolled";
} | { status: "unavailable"; reason: "inspection-failed" };
export type ExecutionConditions = {
  schema_version: 1; run_sha256: string; run_id: string;
  agent: ExecutionObservation; verifier: ExecutionObservation | null;
};
const digest = (bytes: Buffer): string => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
function fail(): never { throw new ContractViolation("invalid execution-condition evidence"); }
function object(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return fail();
  return value as Record<string, unknown>;
}
function integer(value: unknown, min = 0): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min) return fail();
  return value;
}
function boolean(value: unknown): boolean { if (typeof value !== "boolean") return fail(); return value; }

/** Docker container-level settings only. Zero means unset, not unlimited host resources. */
export function normalizeExecutionConditions(raw: unknown, networkRaw: unknown, image: string, expectedNetwork: string, timeoutS: number): ExecutionObservation {
  const data = object(raw), host = object(data.HostConfig), state = object(data.State);
  if (!/^sha256:[a-f0-9]{64}$/.test(image) || data.Image !== image || host.NetworkMode !== expectedNetwork || !Number.isFinite(timeoutS) || timeoutS <= 0) return fail();
  const attached = Object.keys(object(object(data.NetworkSettings).Networks));
  if (attached.length !== 1 || attached[0] !== expectedNetwork) return fail();
  const internal = expectedNetwork === "none" ? null : boolean(object(networkRaw).Internal);
  if (expectedNetwork !== "none" && internal !== true) return fail();
  if (typeof host.CpusetCpus !== "string" || !/^[0-9,-]*$/.test(host.CpusetCpus)) return fail();
  const storage = host.StorageOpt == null ? null : object(host.StorageOpt).size ?? null;
  if (storage !== null && (typeof storage !== "string" || !/^[0-9]+(?:\.[0-9]+)?[bBkKmMgGtT]?$/.test(storage))) return fail();
  return {
    status: "observed", image_digest: image,
    docker: {
      nano_cpus: integer(host.NanoCpus), cpu_quota: integer(host.CpuQuota, -1), cpu_period: integer(host.CpuPeriod), cpuset_cpus: host.CpusetCpus,
      memory_bytes: integer(host.Memory), memory_reservation_bytes: integer(host.MemoryReservation), memory_swap_bytes: integer(host.MemorySwap, -1),
      pids_limit: host.PidsLimit === null ? null : integer(host.PidsLimit, -1), storage_size: storage, readonly_root: boolean(host.ReadonlyRootfs),
    },
    network: { mode: expectedNetwork === "none" ? "none" : "internal", internal },
    oom_killed: boolean(state.OOMKilled), wall_timeout_s: timeoutS,
    ancestor_limits: "unknown", workspace_disk_quota: "unknown", provider_cache: "uncontrolled",
  };
}

function validateObservation(value: unknown, image: unknown, mode: "none" | "internal"): ExecutionObservation {
  const data = object(value);
  if (data.status === "unavailable") {
    if (!isDeepStrictEqual(data, { status: "unavailable", reason: "inspection-failed" })) return fail();
    return { status: "unavailable", reason: "inspection-failed" };
  }
  const limits = object(data.docker), network = object(data.network);
  if (data.status !== "observed" || data.image_digest !== image || network.mode !== mode || typeof image !== "string") return fail();
  const result = normalizeExecutionConditions({ Image: image, HostConfig: {
    NanoCpus: limits.nano_cpus, CpuQuota: limits.cpu_quota, CpuPeriod: limits.cpu_period, CpusetCpus: limits.cpuset_cpus,
    Memory: limits.memory_bytes, MemoryReservation: limits.memory_reservation_bytes, MemorySwap: limits.memory_swap_bytes,
    PidsLimit: limits.pids_limit, StorageOpt: { size: limits.storage_size }, ReadonlyRootfs: limits.readonly_root, NetworkMode: mode,
  }, NetworkSettings: { Networks: { [mode]: {} } }, State: { OOMKilled: data.oom_killed } }, { Internal: network.internal }, image, mode, data.wall_timeout_s as number);
  if (!isDeepStrictEqual(data, result)) return fail();
  return result;
}

export function validateExecutionConditions(runBytes: Buffer, value: unknown): ExecutionConditions {
  const data = object(value);
  let run: Record<string, unknown>;
  try { run = object(JSON.parse(runBytes.toString("utf8"))); } catch { return fail(); }
  if (data.schema_version !== 1 || data.run_sha256 !== digest(runBytes) || typeof run.run_id !== "string" || data.run_id !== run.run_id) throw new ContractViolation("execution-condition run binding mismatch");
  const container = object(run.container);
  return { schema_version: 1, run_sha256: digest(runBytes), run_id: run.run_id,
    agent: validateObservation(data.agent, container.image_digest, "internal"),
    verifier: data.verifier === null ? null : validateObservation(data.verifier, container.verifier_image_digest, "none"),
  };
}

export function bindExecutionConditions(runBytes: Buffer, agent: ExecutionObservation, verifier: ExecutionObservation | null): ExecutionConditions {
  let run: Record<string, unknown>;
  try { run = object(JSON.parse(runBytes.toString("utf8"))); } catch { return fail(); }
  return validateExecutionConditions(runBytes, { schema_version: 1, run_sha256: digest(runBytes), run_id: run.run_id, agent, verifier });
}
