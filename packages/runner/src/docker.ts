import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { closeSync, constants, copyFileSync, fstatSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, readSync, rmSync, writeFileSync, writeSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { StringDecoder } from "node:string_decoder";
import { ConfigError, ToolError, type C3AdapterResult, type C3ToolEvent, type ClockAnchor } from "@aob/contracts";
import { createCodexToolEventParser, createOpenCodeToolEventParser, createRunLogWriter, redact, type ContainerInvocation, type ToolEventParser } from "@aob/adapters";

const CONTAINER_WORKSPACE = "/work/workspace";
const DEFAULT_TIMEOUT_S = 30;
const CONTAINER_NAME = /^aob-(?:verify-)?[0-9]+-[0-9]+$/;
const RELAY_NAME = /^aob-relay-[0-9]+-[0-9]+$/;
const NETWORK_NAME = /^aob-net-[0-9]+-[0-9]+$/;
const RELAY_IMAGE = "aob-base:s2";
const RELAY_HOST = "aob-relay";
const RELAY_PORT = 8080;
const WRITABLE_TMPFS = ["--tmpfs", "/tmp:rw,noexec,nosuid,nodev,size=64m"];
// Native verifiers may clone and reset a full upstream workspace before
// running source-owned tests. Keep the measured agent cell limit unchanged,
// but give the unmeasured verifier scratch space enough capacity for large
// documentation-heavy repositories such as Textual.
const VERIFIER_WRITABLE_TMPFS = ["--tmpfs", "/tmp:rw,noexec,nosuid,nodev,size=256m"];

export type DockerCommandResult = {
  exitCode: number;
  tStart: number;
  tEnd: number;
  anchor: ClockAnchor;
  imageDigest: string;
  stdoutPath: string;
  stderrPath: string;
  toolEvents?: C3ToolEvent[];
  toolLogPath?: string;
  toolVersion?: string;
};

export type DockerVerificationResult = { exitCode: number; duration_ms: number };

export type DockerResourceIdentity = { relayName: string; networkName: string };

export type DockerProxyRoute = DockerResourceIdentity & {
  targetUrl: string;
  clientUrl: string;
  containerName: string;
  relayImage: string;
  authToken: string;
};

type DockerProcessResult = {
  exitCode: number;
  stdout: Buffer;
  stderr: Buffer;
  unavailable: boolean;
};

type StdoutObserver = (chunk: Buffer, observedAt: number) => void;
type DockerOutputSinks = { stdout: (chunk: Buffer) => void; stderr: (chunk: Buffer) => void };
const MAX_CONTROL_OUTPUT_BYTES = 1024 * 1024;

function isWithin(path: string, parent: string): boolean {
  const rel = relative(parent, path);
  return rel !== "" && rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

function requireDirectory(path: string, name: string): string {
  const absolute = resolve(path);
  if (absolute.includes("\0") || absolute.includes(",")) throw new ConfigError(`${name} contains an unsupported path character`);
  try {
    const info = lstatSync(absolute);
    if (info.isSymbolicLink() || !info.isDirectory()) throw new ConfigError(`${name} is not a regular directory: ${absolute}`);
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(`${name} is unavailable: ${absolute}`);
  }
  return absolute;
}

function prepareOutputDirectory(path: string): string {
  const absolute = resolve(path);
  try {
    const info = lstatSync(absolute);
    if (info.isSymbolicLink() || !info.isDirectory()) throw new ConfigError(`Docker output is not a regular directory: ${absolute}`);
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    mkdirSync(absolute, { recursive: true });
  }
  return absolute;
}

function requireRegularFile(path: string, name: string): string {
  const absolute = resolve(path);
  if (absolute.includes("\0") || absolute.includes(",")) throw new ConfigError(`${name} contains an unsupported path character`);
  try {
    const info = lstatSync(absolute);
    if (info.isSymbolicLink() || !info.isFile()) throw new ConfigError(`${name} is not a regular file: ${absolute}`);
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(`${name} is unavailable: ${absolute}`);
  }
  return absolute;
}

function validateInvocation(invocation: ContainerInvocation): void {
  if (invocation.image.length === 0 || invocation.image.includes("\0")) throw new ConfigError("Docker invocation image is required");
  if (invocation.image_digest !== undefined && !/^sha256:[0-9a-f]{64}$/i.test(invocation.image_digest)) throw new ConfigError("Docker invocation image digest is invalid");
  if (invocation.argv.length === 0) throw new ConfigError("Docker invocation argv is required");
  if (invocation.argv.some((value) => value.includes("\0"))) throw new ConfigError("Docker invocation argv contains NUL");
  for (const [name, value] of Object.entries(invocation.env)) {
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name) || value.includes("\0")) {
      throw new ConfigError(`invalid Docker environment entry: ${name}`);
    }
  }
  if (invocation.user !== undefined && !/^[1-9][0-9]*:[0-9]+$/.test(invocation.user)) {
    throw new ConfigError("Docker invocation user must be a non-root uid:gid");
  }
}

/** Linux bind mounts retain host ownership even with container capabilities dropped. */
function workspaceUser(explicitUser?: string): string | undefined {
  if (explicitUser !== undefined || process.platform !== "linux") return explicitUser;
  let uid: number | undefined;
  let gid: number | undefined;
  try {
    uid = process.getuid?.();
    gid = process.getgid?.();
  } catch { throw new ConfigError("Linux host uid:gid is unavailable"); }
  if (uid === undefined || gid === undefined || !Number.isSafeInteger(uid) || !Number.isSafeInteger(gid) || uid < 0 || gid < 0) {
    throw new ConfigError("Linux host uid:gid is unavailable or invalid");
  }
  return `${uid}:${gid}`;
}

function assertProxyReference(invocation: ContainerInvocation, proxyUrl: string): void {
  const declared = `${JSON.stringify(invocation.argv)}${JSON.stringify(invocation.env)}${JSON.stringify(invocation.setupFiles ?? [])}`;
  if (!declared.includes(proxyUrl)) throw new ConfigError("Docker invocation does not reference the supplied relay proxy");
}

function validateTargetProxyUrl(value: string): void {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new ConfigError("Docker proxy URL is invalid");
  }
  if (parsed.protocol !== "http:" || parsed.hostname !== "host.docker.internal" || parsed.port.length === 0 ||
    parsed.username || parsed.password || parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new ConfigError("Docker proxy URL must target host.docker.internal over HTTP");
  }
}

function validateRoute(route: DockerProxyRoute): void {
  validateTargetProxyUrl(route.targetUrl);
  let client: URL;
  try {
    client = new URL(route.clientUrl);
  } catch {
    throw new ConfigError("Docker relay client URL is invalid");
  }
  if (client.protocol !== "http:" || client.hostname !== RELAY_HOST || client.port !== String(RELAY_PORT) || client.pathname !== "/") {
    throw new ConfigError("Docker relay client URL is invalid");
  }
  if (!CONTAINER_NAME.test(route.containerName) || !RELAY_NAME.test(route.relayName) || !NETWORK_NAME.test(route.networkName)) {
    throw new ConfigError("Docker relay resource identity is invalid");
  }
  if (route.relayImage.length === 0 || route.relayImage.includes("\0")) throw new ConfigError("Docker relay image is invalid");
  if (!/^[A-Za-z0-9_-]{32,}$/.test(route.authToken)) throw new ConfigError("Docker relay auth token is invalid");
}

export function newDockerContainerName(): string {
  return `aob-${process.pid}-${Math.floor(performance.now())}`;
}

export function newDockerProxyAuthToken(): string {
  return randomBytes(32).toString("hex");
}

export function describeDockerProxyRoute(targetUrl: string, containerName: string, authToken = newDockerProxyAuthToken()): DockerProxyRoute {
  validateTargetProxyUrl(targetUrl);
  if (!CONTAINER_NAME.test(containerName)) throw new ConfigError(`invalid Docker container name: ${containerName}`);
  const suffix = containerName.slice("aob-".length);
  return {
    targetUrl,
    clientUrl: `http://${RELAY_HOST}:${RELAY_PORT}`,
    containerName,
    relayName: `aob-relay-${suffix}`,
    networkName: `aob-net-${suffix}`,
    relayImage: RELAY_IMAGE,
    authToken,
  };
}

function runDocker(
  args: string[],
  timeoutS?: number,
  cleanupContainer?: string,
  environment: Record<string, string> = {},
  observeStdout?: StdoutObserver,
  sinks?: DockerOutputSinks,
  captureLimitBytes = MAX_CONTROL_OUTPUT_BYTES,
): Promise<DockerProcessResult> {
  return new Promise((resolveResult, rejectResult) => {
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let outputError: ToolError | undefined;
    let settled = false;
    let outputClosed = false;
    let stopping = false;
    let timedOut = false;
    let killTimer: NodeJS.Timeout | undefined;
    const child = spawn("docker", args, {
      // `--env NAME=value` exposes credentials in process listings. Docker accepts
      // `--env NAME` and reads the value from the Docker client's environment.
      env: { PATH: process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin", ...environment },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let cleanupPromise: Promise<void> | undefined;
    const finish = async (exitCode: number, unavailable = false) => {
      if (settled) return;
      settled = true;
      if (timeoutTimer !== undefined) clearTimeout(timeoutTimer);
      if (killTimer !== undefined) clearTimeout(killTimer);
      if (cleanupPromise !== undefined) await cleanupPromise;
      outputClosed = true;
      if (outputError !== undefined) { rejectResult(outputError); return; }
      resolveResult({ exitCode, stdout: Buffer.concat(stdout), stderr: Buffer.concat(stderr), unavailable });
    };

    const stop = () => {
      if (stopping) return;
      stopping = true;
      child.kill("SIGTERM");
      if (cleanupContainer) {
        const cleanup = spawn("docker", ["rm", "-f", cleanupContainer], {
          env: { PATH: process.env.PATH ?? "/usr/local/bin:/usr/bin:/bin" },
          stdio: "ignore",
        });
        cleanupPromise = new Promise<void>((resolveCleanup) => {
          const cleanupTimer = setTimeout(() => {
            cleanup.kill("SIGKILL");
            resolveCleanup();
          }, 1_000);
          const finishCleanup = () => {
            clearTimeout(cleanupTimer);
            resolveCleanup();
          };
          cleanup.once("error", finishCleanup);
          cleanup.once("close", finishCleanup);
        });
      }
      killTimer = setTimeout(() => {
        child.kill("SIGKILL");
        void finish(timedOut ? 124 : 1);
      }, 500);
    };
    const receive = (chunk: Buffer, stream: "stdout" | "stderr") => {
      if (outputClosed || outputError !== undefined) return;
      try {
        if (stream === "stdout") observeStdout?.(chunk, performance.now());
        if (sinks !== undefined) sinks[stream](chunk);
        else {
          const bytes = stream === "stdout" ? stdoutBytes += chunk.length : stderrBytes += chunk.length;
          if (bytes > captureLimitBytes) throw new ToolError("Docker control output exceeds its bounded capture limit");
          (stream === "stdout" ? stdout : stderr).push(chunk);
        }
      } catch (error) {
        outputError = error instanceof ToolError ? error : new ToolError("cannot retain Docker command output");
        stop();
      }
    };
    child.stdout?.on("data", (chunk: Buffer) => receive(chunk, "stdout"));
    child.stderr?.on("data", (chunk: Buffer) => receive(chunk, "stderr"));

    const timeoutTimer = timeoutS === undefined ? undefined : setTimeout(() => {
      if (outputError !== undefined) return;
      timedOut = true;
      stop();
    }, timeoutS * 1000);

    child.once("error", (error: NodeJS.ErrnoException) => {
      void finish(127, error.code === "ENOENT");
    });
    child.once("close", (code) => {
      void finish(timedOut ? 124 : code ?? 1);
    });
  });
}

/**
 * Collect candidate version lines from a tool's version probe.
 *
 * Writing a version banner to stderr is a common CLI convention - pi does it -
 * so reading stdout alone reported "empty output" for a tool that had answered
 * correctly. stdout is searched first so a tool that prints to both is still
 * pinned by its primary stream. The caller still requires the expected version
 * string to appear, so widening the streams cannot accept an arbitrary line.
 */
export function versionOutputLines(stdout: Buffer, stderr: Buffer): string[] {
  const lines = (buffer: Buffer): string[] =>
    buffer.toString("utf8").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return [...lines(stdout), ...lines(stderr)];
}

/** Attempts for a digest lookup, and the pause between them. */
export const IMAGE_INSPECT_ATTEMPTS = 3;
const IMAGE_INSPECT_RETRY_MS = 500;

/**
 * Resolve an image to its digest, retrying a transient daemon failure.
 *
 * This runs before every cell. A single hiccup from the Docker daemon
 * therefore aborted an entire multi-hour matrix at whatever cell it happened
 * to hit - observed twice, both times on the first cell of a 160+ cell run.
 * The retry is bounded and the failure mode is unchanged: a genuinely missing
 * or unreadable image still raises after the last attempt, so this cannot mask
 * an absent image.
 */
async function inspectImage(image: string): Promise<string> {
  let last = "";
  for (let attempt = 1; attempt <= IMAGE_INSPECT_ATTEMPTS; attempt += 1) {
    const result = await runDocker(["image", "inspect", "--format", "{{.Id}}", image]);
    if (result.unavailable) throw new ConfigError("Docker executable is not available on PATH");
    const digest = result.stdout.toString("utf8").trim();
    if (result.exitCode === 0 && /^sha256:[0-9a-f]{64}$/i.test(digest)) return digest;
    last = result.stderr.toString("utf8").trim().split("\n")[0] ?? "";
    if (attempt < IMAGE_INSPECT_ATTEMPTS) {
      await new Promise((resolve) => setTimeout(resolve, IMAGE_INSPECT_RETRY_MS));
    }
  }
  throw new ToolError(`cannot inspect Docker image ${image}${last === "" ? "" : `: ${last}`}`);
}

function removalSucceeded(result: DockerProcessResult, missingPattern: RegExp): boolean {
  return result.exitCode === 0 || missingPattern.test(result.stderr.toString("utf8"));
}

/** Starts a fixed-destination relay on a private per-cell network. */
export async function startDockerProxyRoute(route: DockerProxyRoute): Promise<void> {
  validateRoute(route);
  const relayDigest = await inspectImage(route.relayImage);
  try {
    const network = await runDocker([
      "network", "create", "--internal", "--driver", "bridge", "--label", "com.aob.owner=runner", route.networkName,
    ], 10);
    if (network.unavailable) throw new ConfigError("Docker executable is not available on PATH");
    if (network.exitCode !== 0) throw new ToolError(`cannot create isolated Docker network: ${network.stderr.toString("utf8").trim() || `exit ${network.exitCode}`}`);
    const relay = await runDocker([
      "run", "--pull=never", "-d", "--rm", "--init", "--read-only", "--cap-drop=ALL", "--security-opt", "no-new-privileges",
      "--network", route.networkName, "--network-alias", RELAY_HOST,
      "--add-host=host.docker.internal:host-gateway", "--user", "65532:65532",
      "--env", `AOB_RELAY_TARGET_URL=${route.targetUrl}`, "--env", `AOB_RELAY_PORT=${RELAY_PORT}`, "--env", "AOB_RELAY_AUTH_TOKEN",
      "--entrypoint", "node", "--name", route.relayName, relayDigest, "/opt/aob/proxy-relay.mjs",
    ], 10, undefined, { AOB_RELAY_AUTH_TOKEN: route.authToken });
    if (relay.unavailable) throw new ConfigError("Docker executable is not available on PATH");
    if (relay.exitCode !== 0) throw new ToolError(`cannot start Docker proxy relay: ${relay.stderr.toString("utf8").trim() || `exit ${relay.exitCode}`}`);
    const connected = await runDocker(["network", "connect", "bridge", route.relayName], 10);
    if (connected.unavailable) throw new ConfigError("Docker executable is not available on PATH");
    if (connected.exitCode !== 0) throw new ToolError(`cannot attach Docker proxy relay to bridge: ${connected.stderr.toString("utf8").trim() || `exit ${connected.exitCode}`}`);
    let ready = false;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const probe = await runDocker([
        "exec", route.relayName, "node", "-e",
        'fetch("http://127.0.0.1:8080/__aob_health").then((response) => process.exit(response.status === 204 ? 0 : 1)).catch(() => process.exit(1))',
      ], 1);
      if (probe.exitCode === 0) {
        ready = true;
        break;
      }
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 50));
    }
    if (!ready) throw new ToolError("Docker proxy relay did not become ready");
  } catch (error) {
    try {
      await stopDockerProxyRoute(route);
    } catch {
      // Preserve the startup error; the next resume path can retry validated cleanup.
    }
    if (error instanceof ConfigError || error instanceof ToolError) throw error;
    throw new ToolError(`Docker proxy relay startup failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/** Stops only the runner-owned relay and its per-cell network. */
export async function stopDockerProxyRoute(route: DockerProxyRoute): Promise<void> {
  validateRoute(route);
  const relay = await runDocker(["rm", "-f", route.relayName]);
  if (relay.unavailable) throw new ConfigError("Docker executable is not available on PATH");
  if (!removalSucceeded(relay, /no such container|not found/i)) {
    throw new ToolError(`cannot remove Docker proxy relay: ${relay.stderr.toString("utf8").trim() || `exit ${relay.exitCode}`}`);
  }
  const network = await runDocker(["network", "rm", route.networkName]);
  if (network.unavailable) throw new ConfigError("Docker executable is not available on PATH");
  if (!removalSucceeded(network, /no such network|not found/i)) {
    throw new ToolError(`cannot remove isolated Docker network: ${network.stderr.toString("utf8").trim() || `exit ${network.exitCode}`}`);
  }
}

function writeSetupFiles(invocation: ContainerInvocation, workspaceDir: string): void {
  // Keep the lexical root for containment because macOS commonly exposes /tmp
  // through a symlink while setup paths may still use that spelling. Symlink
  // traversal is checked independently below before any file is written.
  const workspaceRoot = resolve(workspaceDir);
  for (const setup of invocation.setupFiles ?? []) {
    const path = resolve(setup.path.startsWith("/") ? setup.path : workspaceDir + "/" + setup.path);
    if (!isWithin(path, workspaceRoot)) {
      throw new ConfigError(`setup file is outside staged workspace: ${setup.path}`);
    }
    let parent = dirname(path);
    while (isWithin(parent, workspaceRoot)) {
      try {
        if (lstatSync(parent).isSymbolicLink()) throw new ConfigError(`setup path traverses a symlink: ${setup.path}`);
      } catch (error) {
        if (error instanceof ConfigError) throw error;
      }
      if (parent === workspaceRoot) break;
      parent = dirname(parent);
    }
    try {
      mkdirSync(dirname(path), { recursive: true });
      const fd = openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
      try {
        if (!fstatSync(fd).isFile()) throw new ConfigError(`setup path is not a regular file: ${setup.path}`);
        const contents = Buffer.from(setup.contents, "utf8");
        let offset = 0;
        while (offset < contents.length) {
          const written = writeSync(fd, contents, offset, contents.length - offset);
          if (written <= 0) throw new ConfigError(`setup file write made no progress: ${setup.path}`);
          offset += written;
        }
      } finally {
        try {
          closeSync(fd);
        } catch (error) {
          throw new ConfigError(`setup file cannot be closed safely: ${setup.path}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } catch (error) {
      if (error instanceof ConfigError) throw error;
      throw new ConfigError(`setup path cannot be written safely: ${setup.path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/** Runs one Docker-only adapter invocation with no inherited secret environment. */
export async function runDockerCommand(
  invocation: ContainerInvocation,
  route: DockerProxyRoute,
  outDir: string,
  timeoutS = DEFAULT_TIMEOUT_S,
  onContainerStart?: (name: string, resources?: DockerResourceIdentity) => void,
  onExecutionStart?: () => void,
): Promise<DockerCommandResult> {
  validateInvocation(invocation);
  const user = workspaceUser(invocation.user);
  const userArgs = user === undefined ? [] : ["--user", user];
  validateRoute(route);
  if (!Number.isFinite(timeoutS) || timeoutS <= 0) throw new ConfigError("Docker timeout must be a positive number of seconds");
  assertProxyReference(invocation, route.clientUrl);

  const workspaceDir = requireDirectory(invocation.workdir, "staged workspace");
  const outputDir = prepareOutputDirectory(outDir);
  writeSetupFiles(invocation, workspaceDir);
  onContainerStart?.(route.containerName, { relayName: route.relayName, networkName: route.networkName });
  try {
    await startDockerProxyRoute(route);
    const imageDigest = await inspectImage(invocation.image);
    if (invocation.image_digest !== undefined && imageDigest.toLowerCase() !== invocation.image_digest.toLowerCase()) {
      throw new ToolError(`Docker agent image identity drift for ${invocation.image}: expected ${invocation.image_digest}, found ${imageDigest}`);
    }
    // inspectImage returns Docker's local .Id, not a registry manifest digest.
    const immutableImage = imageDigest;
    let toolVersion = invocation.toolVersion;
    if (invocation.versionArgv !== undefined) {
      if (invocation.versionArgv.length === 0 || invocation.versionArgv.some((value) => value.includes("\0"))) {
        throw new ConfigError("Docker version command is invalid");
      }
      const versionProbe = await runDocker([
        "run", "--pull=never", "--rm", "--read-only", "--cap-drop=ALL", "--security-opt", "no-new-privileges", ...WRITABLE_TMPFS, "--env", "HOME=/tmp", ...(process.platform === "linux" ? userArgs : []), "--network", "none", "--entrypoint", invocation.versionArgv[0]!, immutableImage,
        ...invocation.versionArgv.slice(1),
      ], Math.min(timeoutS, 10));
      if (versionProbe.unavailable) throw new ConfigError("Docker executable is not available on PATH");
      if (versionProbe.exitCode !== 0) throw new ToolError(`cannot query Docker tool version for ${invocation.image}`);
      const versionLines = versionOutputLines(versionProbe.stdout, versionProbe.stderr);
      const expectedVersion = invocation.toolVersion;
      const versionLine = expectedVersion === undefined
        ? versionLines[0] ?? ""
        : versionLines.find((line) => line.includes(expectedVersion)) ?? "";
      if (versionLine.length === 0) {
        throw new ToolError(`Docker tool version drift for ${invocation.image}: expected ${invocation.toolVersion ?? "a version"}, found ${versionLines[0] ?? "empty output"}`);
      }
      toolVersion = versionLine;
    }

    const args = [
      "run", "--pull=never", "--rm", "--init", "--read-only", "--cap-drop=ALL", "--security-opt", "no-new-privileges",
      ...WRITABLE_TMPFS, "--network", route.networkName, "--entrypoint", "/opt/aob/runner-entrypoint.sh", "--name", route.containerName,
      "--workdir", CONTAINER_WORKSPACE,
      ...userArgs,
      "--mount", `type=bind,src=${workspaceDir},dst=${CONTAINER_WORKSPACE}`,
      ...Object.entries(invocation.env)
        .filter(([name]) => name !== "AOB_VERIFY_SCRIPT" && name !== "AOB_VERIFY_START_MARKER")
        .flatMap(([name, value]) => name === "PATH" ? ["--env", `${name}=${value}`] : ["--env", name]),
      immutableImage,
      ...invocation.argv,
    ];
    // Keep the host PATH for locating Docker itself. PATH is the one
    // non-secret container variable whose value must be explicit above;
    // credentials continue to be supplied through the child environment and
    // name-only Docker declarations so they never enter the process argv.
    const containerEnvironment = Object.fromEntries(Object.entries(invocation.env)
      .filter(([name]) => name !== "AOB_VERIFY_SCRIPT" && name !== "AOB_VERIFY_START_MARKER" && name !== "PATH"));
    let parser: ToolEventParser | undefined;
    let parserError: unknown;
    const extras = Object.entries(invocation.env)
      .filter(([name]) => name !== "AOB_VERIFY_SCRIPT" && name !== "AOB_VERIFY_START_MARKER")
      .map(([, value]) => value);
    const stdoutPath = join(outputDir, "stdout.log");
    const stderrPath = join(outputDir, "stderr.log");
    const stdoutLog = createRunLogWriter(stdoutPath, extras);
    let stderrLog: ReturnType<typeof createRunLogWriter> | undefined;
    let result: DockerProcessResult;
    let tStart: number;
    let tEnd: number;
    let anchor: ClockAnchor;
    try {
      stderrLog = createRunLogWriter(stderrPath, extras);
      const errorLog = stderrLog;
      onExecutionStart?.();
      tStart = performance.now();
      anchor = { wall_clock_iso: new Date().toISOString(), monotonic_zero: tStart };
      parser = invocation.toolEventFormat === "codex-json"
        ? createCodexToolEventParser()
        : invocation.toolEventFormat === "opencode-json"
          ? createOpenCodeToolEventParser({
            wallClockMs: Date.parse(anchor.wall_clock_iso),
            monotonicZero: anchor.monotonic_zero,
          })
          : undefined;
      const observedParser = parser;
      result = await runDocker(
        args,
        timeoutS,
        route.containerName,
        containerEnvironment,
        observedParser === undefined ? undefined : (chunk, observedAt) => {
          if (parserError !== undefined) return;
          try {
            observedParser.feed(chunk, observedAt);
          } catch (error) {
            parserError = error;
          }
        },
        { stdout: (chunk) => stdoutLog.write(chunk), stderr: (chunk) => errorLog.write(chunk) },
      );
      tEnd = performance.now();
    } finally {
      try { stdoutLog.close(); } finally { stderrLog?.close(); }
    }
    if (result.unavailable) throw new ConfigError("Docker executable is not available on PATH");

    const toolLogPath = parser === undefined ? undefined : join(outputDir, "tool-events.jsonl");
    if (toolLogPath !== undefined) {
      try { copyFileSync(stdoutPath, toolLogPath); }
      catch { throw new ToolError("cannot retain Docker tool output"); }
    }
    let toolEvents: C3AdapterResult["toolEvents"] = undefined;
    if (parser !== undefined && result.exitCode !== 124 && parserError === undefined) {
      try {
        toolEvents = parser.finish(tEnd);
      } catch (error) {
        parserError = error;
      }
    }
    // Structured tool output is diagnostic evidence. If it is malformed,
    // fail this adapter result while retaining the redacted raw stream; a
    // single third-party record must not abort the entire matrix.
    const normalizedExitCode = parserError !== undefined && result.exitCode === 0 ? 1 : result.exitCode;
    return {
      exitCode: normalizedExitCode,
      tStart,
      tEnd,
      anchor,
      imageDigest,
      stdoutPath,
      stderrPath,
      ...(parserError === undefined && toolEvents !== undefined ? { toolEvents } : {}),
      ...(toolLogPath === undefined ? {} : { toolLogPath }),
      ...(toolVersion === undefined ? {} : { toolVersion }),
    };
  } finally {
    await stopDockerProxyRoute(route);
  }
}

/** Removes a runner-owned container left behind by a killed runner process. */
export async function cleanupDockerContainer(name: string): Promise<void> {
  if (!CONTAINER_NAME.test(name)) throw new ConfigError(`invalid persisted Docker container name: ${name}`);
  const result = await runDocker(["rm", "-f", name]);
  if (result.unavailable) throw new ConfigError("Docker executable is not available on PATH");
  const stderr = result.stderr.toString("utf8");
  if (result.exitCode !== 0 && !/no such container/i.test(stderr)) {
    throw new ToolError(`cannot clean up Docker container ${name}: ${stderr.trim() || `exit ${result.exitCode}`}`);
  }
}

/** Removes validated runner-owned resources left by a killed Docker cell. */
export async function cleanupDockerResources(resources: { containerName?: string; relayName?: string; networkName?: string }): Promise<void> {
  if (resources.containerName !== undefined) await cleanupDockerContainer(resources.containerName);
  if (resources.relayName !== undefined) {
    if (!RELAY_NAME.test(resources.relayName)) throw new ConfigError(`invalid persisted Docker relay name: ${resources.relayName}`);
    const result = await runDocker(["rm", "-f", resources.relayName]);
    if (result.unavailable) throw new ConfigError("Docker executable is not available on PATH");
    if (!removalSucceeded(result, /no such container|not found/i)) {
      throw new ToolError(`cannot clean up Docker relay ${resources.relayName}: ${result.stderr.toString("utf8").trim() || `exit ${result.exitCode}`}`);
    }
  }
  if (resources.networkName !== undefined) {
    if (!NETWORK_NAME.test(resources.networkName)) throw new ConfigError(`invalid persisted Docker network name: ${resources.networkName}`);
    const result = await runDocker(["network", "rm", resources.networkName]);
    if (result.unavailable) throw new ConfigError("Docker executable is not available on PATH");
    if (!removalSucceeded(result, /no such network|not found/i)) {
      throw new ToolError(`cannot clean up Docker network ${resources.networkName}: ${result.stderr.toString("utf8").trim() || `exit ${result.exitCode}`}`);
    }
  }
}

function appendVerifierLog(source: number, destination: ReturnType<typeof createRunLogWriter>): void {
  try {
    const decoder = new StringDecoder("utf8");
    const block = Buffer.allocUnsafe(64 * 1024);
    let position = 0;
    for (;;) {
      const bytes = readSync(source, block, 0, block.length, position);
      if (bytes === 0) break;
      position += bytes;
      destination.write(Buffer.from(decoder.write(block.subarray(0, bytes))));
    }
    destination.write(Buffer.from(decoder.end()));
  } catch { throw new ToolError("Cannot append verifier error log"); }
}

function spoolVerifierError(fd: number, chunk: Buffer): void {
  try {
    let offset = 0;
    while (offset < chunk.length) {
      const written = writeSync(fd, chunk, offset, Math.min(64 * 1024, chunk.length - offset));
      if (written === 0) throw new ToolError("Verifier error log write made no progress");
      offset += written;
    }
  } catch { throw new ToolError("Cannot spool verifier error log"); }
}

/** Runs the authoritative verifier in a separate, network-disabled container. */
export async function runDockerVerification(opts: {
  image: string;
  imageDigest: string;
  workspaceDir: string;
  verificationFile?: string;
  command?: string[];
  workdir?: string;
  network?: "none";
  logPath: string;
  timeoutS: number;
  onVerificationStart?: () => void;
  onContainerStart?: (name: string) => void;
}): Promise<DockerVerificationResult> {
  if (!/^sha256:[0-9a-f]{64}$/i.test(opts.imageDigest)) throw new ConfigError("Docker verifier image digest is invalid");
  if (opts.image.length === 0 || opts.image.includes("\0") || opts.image.includes(",")) throw new ConfigError("Docker verifier image is invalid");
  if ((opts.verificationFile === undefined) === (opts.command === undefined)) {
    throw new ConfigError("Docker verifier requires exactly one of verificationFile or command");
  }
  if (opts.network !== undefined && opts.network !== "none") throw new ConfigError("Docker verifier network must be none");
  if (opts.command !== undefined && (opts.command.length === 0 || opts.command.some((arg) => arg.length === 0 || arg.includes("\0")))) {
    throw new ConfigError("Docker verifier command must contain non-empty NUL-free arguments");
  }
  const workdir = opts.workdir ?? ".";
  if (workdir !== "." && (isAbsolute(workdir) || workdir.includes("\\") || workdir.includes("\0") || workdir.includes(",") || workdir.split("/").some((part) => part.length === 0 || part === "." || part === ".."))) {
    throw new ConfigError("Docker verifier workdir must be a safe workspace-relative path");
  }
  const user = workspaceUser();
  const userArgs = user === undefined ? [] : ["--user", user, "--env", "HOME=/tmp"];
  const workspaceDir = requireDirectory(opts.workspaceDir, "verification workspace");
  const verificationFile = opts.verificationFile === undefined ? undefined : requireRegularFile(opts.verificationFile, "verification script");
  const localImageDigest = await inspectImage(opts.image);
  if (localImageDigest.toLowerCase() !== opts.imageDigest.toLowerCase()) {
    throw new ToolError(`Docker verifier image identity drift for ${opts.image}: expected ${opts.imageDigest}, found ${localImageDigest}`);
  }
  const logPath = resolve(opts.logPath);
  mkdirSync(dirname(logPath), { recursive: true });
  const containerName = `aob-verify-${process.pid}-${Math.floor(performance.now())}`;
  const immutableImage = localImageDigest;
  let stdoutLog: ReturnType<typeof createRunLogWriter> | undefined;
  let stdoutDecoder: StringDecoder | undefined;
  let stderrFd: number | undefined;
  let stderrDirectory: string | undefined;
  const finishStdoutDecoding = () => {
    if (stdoutDecoder === undefined) return;
    const decoder = stdoutDecoder;
    stdoutDecoder = undefined;
    stdoutLog!.write(Buffer.from(decoder.end()));
  };
  try {
    if (verificationFile === undefined) {
      stdoutLog = createRunLogWriter(logPath);
      stdoutDecoder = new StringDecoder("utf8");
      try { stderrDirectory = mkdtempSync(join(dirname(logPath), ".aob-verifier-stderr-")); }
      catch { throw new ToolError("Cannot create private verifier error log directory"); }
      try {
        stderrFd = openSync(join(stderrDirectory, "stderr.log"), constants.O_RDWR | constants.O_CREAT | constants.O_EXCL | (constants.O_NOFOLLOW ?? 0), 0o600);
        if (!fstatSync(stderrFd).isFile()) throw new ToolError("Verifier error log must be a regular file");
      } catch { throw new ToolError("Cannot create private verifier error log"); }
    }
    opts.onVerificationStart?.();
    opts.onContainerStart?.(containerName);
    const tStart = performance.now();
    const mounts = verificationFile === undefined
      ? ["--mount", `type=bind,src=${workspaceDir},dst=/work/workspace,readonly=false`]
      : [
          "--mount", `type=bind,src=${workspaceDir},dst=/work/workspace,readonly=false`,
          "--mount", `type=bind,src=${verificationFile},dst=/work/verify.sh,readonly`,
        ];
    const verifierWorkdir = verificationFile === undefined
      ? `/work/workspace${workdir === "." ? "" : `/${workdir}`}`
      : "/work";
    if (verificationFile === undefined) {
      const command = opts.command!;
      const result = await runDocker([
        "run", "--pull=never", "--rm", "--init", "--read-only", "--cap-drop=ALL", "--security-opt", "no-new-privileges", ...VERIFIER_WRITABLE_TMPFS, "--network", "none", "--name", containerName,
        "--workdir", verifierWorkdir, ...userArgs, ...mounts,
        "--entrypoint", command[0]!, immutableImage, ...command.slice(1),
      ], opts.timeoutS, containerName, {}, undefined, {
        stdout: (chunk) => {
          for (let offset = 0; offset < chunk.length; offset += 64 * 1024) {
            stdoutLog!.write(Buffer.from(stdoutDecoder!.write(chunk.subarray(offset, offset + 64 * 1024))));
          }
        },
        stderr: (chunk) => spoolVerifierError(stderrFd!, chunk),
      });
      const hostDuration = performance.now() - tStart;
      // Decode each byte stream separately, then redact their concatenated
      // text with one state machine, matching the original verifier logs.
      finishStdoutDecoding();
      appendVerifierLog(stderrFd!, stdoutLog!);
      stdoutLog!.close();
      if (result.unavailable) throw new ConfigError("Docker executable is not available on PATH");
      return { exitCode: result.exitCode, duration_ms: hostDuration };
    }
    const verifierCode = `const{spawnSync}=require("node:child_process"),s=process.hrtime.bigint(),r=spawnSync("sh",["/work/verify.sh"],{cwd:"/work",stdio:["ignore","pipe","pipe"]}),d=Number(process.hrtime.bigint()-s)/1e6;process.stdout.write(r.stdout??Buffer.alloc(0));process.stderr.write(r.stderr??Buffer.alloc(0));process.stdout.write("\\n__AOB_VERIFY_META__"+JSON.stringify({exit:r.status??127,duration_ms:d})+"\\n");process.exit(r.status??127)`;
    // The legacy spawnSync wrapper already bounds each workload stream at
    // 1 MiB. Allow its small stdout metadata suffix without tightening that
    // existing boundary to the generic Docker control-output limit.
    const result = await runDocker([
      "run", "--pull=never", "--rm", "--init", "--read-only", "--cap-drop=ALL", "--security-opt", "no-new-privileges", ...VERIFIER_WRITABLE_TMPFS, "--network", "none", "--name", containerName,
      "--workdir", verifierWorkdir, ...userArgs, ...mounts,
      "--entrypoint", "node", immutableImage, "-e", verifierCode,
    ], opts.timeoutS, containerName, {}, undefined, undefined, 2 * 1024 * 1024);
    const hostDuration = performance.now() - tStart;
    if (result.unavailable) throw new ConfigError("Docker executable is not available on PATH");
    const stdout = result.stdout.toString("utf8");
    const marker = /(?:^|\n)__AOB_VERIFY_META__(\{[^\n]+\})\s*$/.exec(stdout);
    if (marker === null) {
      writeFileSync(logPath, redact(`${stdout}${result.stderr.toString("utf8")}`, []));
      if (result.exitCode === 124) return { exitCode: 124, duration_ms: hostDuration };
      throw new ToolError("Docker verifier did not emit a verification result");
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(marker[1]!);
    } catch (error) {
      throw new ToolError(`Docker verifier marker is invalid: ${error instanceof Error ? error.message : String(error)}`);
    }
    const data = parsed as Record<string, unknown>;
    if (typeof data.exit !== "number" || !Number.isInteger(data.exit) || typeof data.duration_ms !== "number" ||
      !Number.isFinite(data.duration_ms) || data.duration_ms < 0) {
      throw new ToolError("Docker verifier marker has invalid fields");
    }
    const verifierOutput = stdout.slice(0, marker.index) + result.stderr.toString("utf8");
    writeFileSync(logPath, redact(verifierOutput, []));
    return { exitCode: result.exitCode === 0 ? data.exit : result.exitCode, duration_ms: data.duration_ms };
  } finally {
    try {
      try { finishStdoutDecoding(); } finally { stdoutLog?.close(); }
    }
    finally {
      try {
        if (stderrFd !== undefined) {
          try { closeSync(stderrFd); } catch { throw new ToolError("Cannot close private verifier error log"); }
        }
      }
      finally {
        if (stderrDirectory !== undefined) {
          try { rmSync(stderrDirectory, { recursive: true, force: true }); }
          catch { throw new ToolError("Cannot remove private verifier error log directory"); }
        }
      }
    }
  }
}
