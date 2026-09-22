import { expect, it } from "vitest";
import { normalizeExecutionConditions, bindExecutionConditions, validateExecutionConditions } from "./execution-conditions.js";

const image = `sha256:${"a".repeat(64)}`;
const inspect = { Image: image, NetworkSettings: { Networks: { "aob-net-1-2": {} } }, HostConfig: { NanoCpus: 0, CpuQuota: 0, CpuPeriod: 0, CpusetCpus: "", Memory: 0, MemoryReservation: 0, MemorySwap: 0, PidsLimit: null, StorageOpt: null, ReadonlyRootfs: true, NetworkMode: "aob-net-1-2", Binds: ["/private/secret"] }, State: { OOMKilled: false }, Config: { Env: ["KEY=secret"], Cmd: ["private prompt"] } };

it("records unset Docker limits without claiming unlimited host resources or a cold provider cache", () => {
  const result = normalizeExecutionConditions(inspect, { Internal: true }, image, "aob-net-1-2", 60);
  expect(result.status).toBe("observed");
  if (result.status !== "observed") throw new Error("missing observation");
  expect(result.docker.memory_bytes).toBe(0);
  expect(result.docker.pids_limit).toBe(null);
  expect(result.network).toEqual({ mode: "internal", internal: true });
  expect(result.ancestor_limits).toBe("unknown");
  expect(result.workspace_disk_quota).toBe("unknown");
  expect(result.provider_cache).toBe("uncontrolled");
  expect(JSON.stringify(result)).not.toMatch(/secret|private prompt|Binds|Env/);
});

it("rejects missing controls, mismatched images, and non-internal agent networks", () => {
  expect(() => normalizeExecutionConditions({ ...inspect, HostConfig: {} }, { Internal: true }, image, "aob-net-1-2", 60)).toThrow();
  expect(() => normalizeExecutionConditions(inspect, { Internal: false }, image, "aob-net-1-2", 60)).toThrow();
  expect(() => normalizeExecutionConditions(inspect, { Internal: true }, `sha256:${"b".repeat(64)}`, "aob-net-1-2", 60)).toThrow();
  const verifier = { ...inspect, NetworkSettings: { Networks: { none: {} } }, HostConfig: { ...inspect.HostConfig, NetworkMode: "none", Memory: 268435456, NanoCpus: 1000000000, PidsLimit: 64 } };
  expect(normalizeExecutionConditions(verifier, null, image, "none", 5)).toMatchObject({ docker: { memory_bytes: 268435456, nano_cpus: 1000000000, pids_limit: 64 }, network: { mode: "none", internal: null } });
});

it("binds exact raw run bytes, checks image identity, and validates evidence on read", () => {
  const bytes = Buffer.from(JSON.stringify({ run_id: "run-1", container: { image_digest: image, verifier_image_digest: image } }));
  const agent = normalizeExecutionConditions(inspect, { Internal: true }, image, "aob-net-1-2", 60);
  const evidence = bindExecutionConditions(bytes, agent, null);
  expect(validateExecutionConditions(bytes, evidence).agent).toEqual(agent);
  expect(() => validateExecutionConditions(Buffer.concat([bytes, Buffer.from("\n")]), evidence)).toThrow(/binding/);
  expect(() => validateExecutionConditions(bytes, { ...evidence, agent: { ...agent, image_digest: `sha256:${"b".repeat(64)}` } })).toThrow();
  expect(() => validateExecutionConditions(bytes, { ...evidence, agent: { ...agent, docker: {} } })).toThrow();
  expect(evidence.verifier).toBe(null);
});


it("rejects an additional bridge attachment even when the primary network is internal", () => {
  expect(() => normalizeExecutionConditions({ ...inspect, NetworkSettings: { Networks: { "aob-net-1-2": {}, bridge: {} } } }, { Internal: true }, image, "aob-net-1-2", 60)).toThrow();
});
