import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { describeDockerProxyRoute, runDockerCommand, runDockerVerification } from "./docker.js";

const agentId = `sha256:${"a".repeat(64)}`;
const relayId = `sha256:${"b".repeat(64)}`;
const verifierId = `sha256:${"c".repeat(64)}`;

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "aob-local-image-id-"));
  const bin = join(root, "bin");
  const workspace = join(root, "workspace");
  const commands = join(root, "commands.jsonl");
  await mkdir(bin);
  await mkdir(workspace);
  const docker = join(bin, "docker");
  await writeFile(docker, `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(commands)}, JSON.stringify(args) + '\\n');
const ids = { 'aob-agent:local': ${JSON.stringify(agentId)}, 'aob-base:s2': ${JSON.stringify(relayId)}, 'aob-verifier:local': ${JSON.stringify(verifierId)} };
if (args[0] === 'image') {
  const id = ids[args.at(-1)];
  if (!id || args[2] !== '--format' || args[3] !== '{{.Id}}') process.exit(1);
  process.stdout.write(id + '\\n');
} else if (args[0] === 'container' && args[1] === 'inspect') {
  const launches = fs.readFileSync(${JSON.stringify(commands)}, 'utf8').trim().split('\\n').map(JSON.parse);
  const launch = launches.findLast(a => a[0] === 'run' && a[a.indexOf('--name') + 1] === args.at(-1));
  if (!launch || launch.includes('--rm')) process.exit(1);
  process.stdout.write(JSON.stringify([{ Image: launch.find(a => /^sha256:/.test(a)), HostConfig: {
    NanoCpus: 0, CpuQuota: 0, CpuPeriod: 0, CpusetCpus: '', Memory: 0, MemoryReservation: 0, MemorySwap: 0, PidsLimit: null, StorageOpt: null, ReadonlyRootfs: true, NetworkMode: launch[launch.indexOf('--network') + 1]
  }, NetworkSettings: { Networks: { [launch[launch.indexOf('--network') + 1]]: {} } }, State: { OOMKilled: false }, Config: { Env: ['SECRET=private'] } }]));
} else if (args[0] === 'network' && args[1] === 'inspect') {
  process.stdout.write(JSON.stringify([{Internal: true}]));
} else if (args[0] === 'run') {
  if (args.some(arg => arg.includes('@sha256:'))) {
    process.stderr.write('No such image: a local image ID is not a repository digest\\n');
    process.exit(125);
  }
  const entrypoint = args[args.indexOf('--entrypoint') + 1];
  const expected = args.includes('/opt/aob/proxy-relay.mjs') ? ids['aob-base:s2']
    : entrypoint === '/opt/aob/runner-entrypoint.sh' || entrypoint === 'fixture-version' ? ids['aob-agent:local']
    : ids['aob-verifier:local'];
  if (!args.includes('--pull=never') || !args.includes(expected)) process.exit(125);
  if (args.includes('fixture-agent-timeout')) setInterval(() => {}, 1000);
  if (entrypoint === 'fixture-version') process.stdout.write('fixture 1.0.0\\n');
  else if (args.some(arg => arg.includes('__AOB_VERIFY_META__'))) process.stdout.write('\\n__AOB_VERIFY_META__{"exit":0,"duration_ms":1}\\n');
}
`);
  await chmod(docker, 0o755);
  const previousPath = process.env.PATH;
  process.env.PATH = `${bin}:${previousPath ?? "/usr/bin:/bin"}`;
  return {
    root, workspace,
    async commands(): Promise<string[][]> {
      return (await readFile(commands, "utf8")).trim().split("\n").map((line) => JSON.parse(line) as string[]);
    },
    async close() {
      process.env.PATH = previousPath;
      await rm(root, { recursive: true, force: true });
    },
  };
}

it("launches relay, version probe and agent by their inspected local image IDs", async () => {
  const f = await fixture();
  try {
    const route = describeDockerProxyRoute("http://host.docker.internal:1234", "aob-123-456");
    const result = await runDockerCommand({
      image: "aob-agent:local", image_digest: agentId, workdir: f.workspace,
      argv: ["fixture-agent", route.clientUrl], env: {},
      versionArgv: ["fixture-version"], toolVersion: "1.0.0",
    }, route, join(f.root, "out"));
    expect(result.exitCode).toBe(0);
    expect(result.imageDigest).toBe(agentId);
    expect(result.toolVersion).toBe("fixture 1.0.0");
    const launches = (await f.commands()).filter((args) => args[0] === "run");
    expect(launches).toHaveLength(3);
    expect(launches.map((args) => args.find((arg) => /^sha256:/.test(arg)))).toEqual([relayId, agentId, agentId]);
    expect(launches.every((args) => args.includes("--pull=never"))).toBe(true);
  } finally { await f.close(); }
});

it.each([false, true])("launches the verifier by its checked local ID (legacy=%s)", async (legacy) => {
  const f = await fixture();
  try {
    const verificationFile = join(f.root, "verify.sh");
    await writeFile(verificationFile, "#!/bin/sh\nexit 0\n");
    const result = await runDockerVerification({
      image: "aob-verifier:local", imageDigest: verifierId, workspaceDir: f.workspace,
      ...(legacy ? { verificationFile } : { command: ["fixture-verifier"] }),
      logPath: join(f.root, "verify.log"), timeoutS: 5,
    });
    expect(result.exitCode).toBe(0);
    const launches = (await f.commands()).filter((args) => args[0] === "run");
    expect(launches).toHaveLength(1);
    expect(launches[0]).toContain(verifierId);
    expect(launches[0]).toContain("--pull=never");
    expect(launches[0]).toContain("none");
  } finally { await f.close(); }
});

it("rejects a retagged agent before its version probe or workload starts", async () => {
  const f = await fixture();
  try {
    const route = describeDockerProxyRoute("http://host.docker.internal:1234", "aob-123-456");
    await expect(runDockerCommand({
      image: "aob-agent:local", image_digest: verifierId, workdir: f.workspace,
      argv: ["fixture-agent", route.clientUrl], env: {},
      versionArgv: ["fixture-version"], toolVersion: "1.0.0",
    }, route, join(f.root, "out"))).rejects.toThrow(/agent image identity drift/);
    const commands = await f.commands();
    expect(commands.some((args) => args.includes("fixture-version"))).toBe(false);
    expect(commands.some((args) => args.includes("/opt/aob/runner-entrypoint.sh"))).toBe(false);
  } finally { await f.close(); }
});

it("rejects a retagged verifier before any launch", async () => {
  const f = await fixture();
  try {
    await expect(runDockerVerification({
      image: "aob-verifier:local", imageDigest: agentId, workspaceDir: f.workspace,
      command: ["fixture-verifier"], logPath: join(f.root, "verify.log"), timeoutS: 5,
    })).rejects.toThrow(/verifier image identity drift/);
    expect((await f.commands()).some((args) => args[0] === "run")).toBe(false);
  } finally { await f.close(); }
});


afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const unixProcess = process as NodeJS.Process & { getuid: () => number; getgid: () => number };

function host(platform: string, uid: unknown = 1000, gid: unknown = 1001) {
  vi.spyOn(process, "platform", "get").mockReturnValue(platform as NodeJS.Platform);
  vi.spyOn(unixProcess, "getuid").mockReturnValue(uid as number);
  vi.spyOn(unixProcess, "getgid").mockReturnValue(gid as number);
}

it.each([
  ["linux", undefined, "1000:1001", "1000:1001"],
  ["linux", "2000:2001", "2000:2001", "2000:2001"],
  ["darwin", undefined, undefined, undefined],
  ["darwin", "2000:2001", "2000:2001", undefined],
] as const)("selects workspace users on %s with explicit %s", async (platform, user, agentUser, versionUser) => {
  host(platform);
  const f = await fixture();
  try {
    const route = describeDockerProxyRoute("http://host.docker.internal:1234", "aob-123-456");
    await runDockerCommand({ image: "aob-agent:local", workdir: f.workspace,
      argv: ["fixture-agent", route.clientUrl], env: {}, versionArgv: ["fixture-version"],
      ...(user === undefined ? {} : { user }),
    }, route, join(f.root, "out"));
    const launches = (await f.commands()).filter(args => args[0] === "run");
    const users = launches.map(args => args.includes("--user") ? args[args.indexOf("--user") + 1] : undefined);
    expect(users).toEqual(["65532:65532", versionUser, agentUser]);
    expect(launches.every(args => args.includes("--cap-drop=ALL") && args.includes("--read-only"))).toBe(true);
  } finally { await f.close(); }
});

it.each([false, true])("uses Linux host identity and writable HOME for verifier legacy=%s", async legacy => {
  host("linux");
  const f = await fixture();
  try {
    const verificationFile = join(f.root, "verify.sh");
    await writeFile(verificationFile, "exit 0\n");
    await runDockerVerification({ image: "aob-verifier:local", imageDigest: verifierId, workspaceDir: f.workspace,
      ...(legacy ? { verificationFile } : { command: ["fixture-verifier"] }),
      logPath: join(f.root, "verify.log"), timeoutS: 5 });
    const args = (await f.commands()).find(args => args[0] === "run")!;
    expect(args[args.indexOf("--user") + 1]).toBe("1000:1001");
    expect(args).toContain("HOME=/tmp");
    expect(args).toContain("--cap-drop=ALL");
    expect(args[args.indexOf("--network") + 1]).toBe("none");
  } finally { await f.close(); }
});

it.each([undefined, -1, 1.5, NaN])("rejects invalid Linux host UID %s before Docker starts", async uid => {
  host("linux", uid);
  // Passing undefined must represent an unavailable identity, not host()'s default.
  vi.spyOn(unixProcess, "getuid").mockReturnValue(uid as number);
  const f = await fixture();
  try {
    await expect(runDockerVerification({ image: "aob-verifier:local", imageDigest: verifierId,
      workspaceDir: f.workspace, command: ["fixture-verifier"], logPath: join(f.root, "verify.log"), timeoutS: 5,
    })).rejects.toThrow(/Linux host uid:gid/);
    await expect(f.commands()).rejects.toThrow(/ENOENT/);
  } finally { await f.close(); }
});


it("retains observed agent and verifier conditions before removing their containers", async () => {
  const f = await fixture();
  try {
    const route = describeDockerProxyRoute("http://host.docker.internal:1234", "aob-123-456");
    await runDockerCommand({ image: "aob-agent:local", workdir: f.workspace, argv: ["fixture-agent", route.clientUrl], env: {} }, route, join(f.root, "out"));
    const agent = JSON.parse(await readFile(join(f.root, "out", "agent-conditions.json"), "utf8"));
    expect(agent).toMatchObject({ status: "observed", image_digest: agentId, network: { mode: "internal", internal: true } });
    expect(JSON.stringify(agent)).not.toContain("private");
    await runDockerVerification({ image: "aob-verifier:local", imageDigest: verifierId, workspaceDir: f.workspace, command: ["fixture-verifier"], logPath: join(f.root, "verify.log"), timeoutS: 5 });
    const verifier = JSON.parse(await readFile(join(f.root, "verifier-conditions.json"), "utf8"));
    expect(verifier).toMatchObject({ status: "observed", image_digest: verifierId, network: { mode: "none", internal: null } });
    const commands = await f.commands();
    for (const inspection of commands.filter(a => a[0] === "container")) {
      expect(commands.findIndex(a => a[0] === "rm" && a.at(-1) === inspection.at(-1))).toBeGreaterThan(commands.indexOf(inspection));
    }
  } finally { await f.close(); }
});


it("keeps timeout evidence available until inspection, then removes the killed container", async () => {
  const f = await fixture();
  try {
    const route = describeDockerProxyRoute("http://host.docker.internal:1234", "aob-123-456");
    const result = await runDockerCommand({ image: "aob-agent:local", workdir: f.workspace, argv: ["fixture-agent-timeout", route.clientUrl], env: {} }, route, join(f.root, "out"), 0.5);
    expect(result.exitCode).toBe(124);
    expect(JSON.parse(await readFile(join(f.root, "out", "agent-conditions.json"), "utf8"))).toMatchObject({status: "observed", wall_timeout_s: 0.5});
    const commands = await f.commands();
    const killed = commands.findIndex(a => a[0] === "kill" && a.at(-1) === route.containerName);
    const inspected = commands.findIndex(a => a[0] === "container" && a.at(-1) === route.containerName);
    const removed = commands.findIndex(a => a[0] === "rm" && a.at(-1) === route.containerName);
    expect(killed).toBeGreaterThan(-1);
    expect(inspected).toBeGreaterThan(killed);
    expect(removed).toBeGreaterThan(inspected);
  } finally { await f.close(); }
});
