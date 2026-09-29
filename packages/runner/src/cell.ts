import { bindCandidateToRun, captureCandidate, prepareCandidateBaseline, releaseCandidateBaseline } from "./candidate-evidence.js";
import { PRIVATE_ATTEMPT_ARTIFACTS } from "./attempt-evidence.js";
import { copyFileSync, cpSync, lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { arch, platform, totalmem } from "node:os";
import { join, relative, sep } from "node:path";
import { ConfigError, ContractViolation, isModelRequestAttempt, isSuccessfulModelEvent, ToolError, validateC1Event, validateC4Run, type C1Event, type C3AdapterResult, type C4Run } from "@aob/contracts";
import { getAdapter, type ContainerInvocation } from "@aob/adapters";
import { startProxy } from "@aob/proxy";
import { validateVerifierSpec, type TaskEnvironment, type VerifierSpec } from "@aob/tasks";
import { estimateRunSpendUsd, type BudgetRates } from "./budget.js";
import { describeDockerProxyRoute, newDockerContainerName, newDockerProxyAuthToken, runDockerCommand, runDockerVerification, type DockerResourceIdentity } from "./docker.js";
import { bindExecutionConditions, type ExecutionObservation } from "./execution-conditions.js";
import type { MeasurementRegime } from "@aob/tasks";
import { validateProviderRouting, type ProviderRouting, type ToolConfiguration } from "@aob/contracts";

export type CellSpec = {
  dir: string;
  taskDir: string;
  upstream: string;
  run_id: string;
  tool: string;
  task_id: string;
  task_source?: string;
  task_revision?: string;
  task_repository?: string;
  task_base_revision?: string | null;
  task_regime?: MeasurementRegime;
  model: string;
  price_book: string;
  providerRouting?: ProviderRouting;
  toolConfiguration?: ToolConfiguration;
  priceRates?: BudgetRates;
  condition?: "pinned" | "default";
  rep?: number;
  timeoutS?: number;
  env?: Record<string, string>;
  environment?: TaskEnvironment;
  verifier?: VerifierSpec;
  /** Recheck admission after setup, immediately before measured execution. */
  onExecutionStart?: () => void;
  /** Called at the exact boundary where task verification starts. */
  onVerificationStart?: () => void;
  /** Persists the Docker container identity before its process is launched. */
  onContainerStart?: (name: string, resources?: DockerResourceIdentity) => void;
};

const PROXY_CREDENTIAL_SENTINEL = "aob-proxy-broker";
const PROVIDER_CREDENTIAL_NAMES = new Set([
  "OPENROUTER_API_KEY",
  "OPENAI_API_KEY",
  "ANTHROPIC_AUTH_TOKEN",
  "ANTHROPIC_API_KEY",
]);

function providerApiKey(spec: CellSpec): string | undefined {
  return spec.env?.OPENROUTER_API_KEY ?? process.env.OPENROUTER_API_KEY;
}

export function brokerDockerInvocation(invocation: ContainerInvocation): ContainerInvocation {
  return {
    ...invocation,
    env: Object.fromEntries(Object.entries(invocation.env).map(([name, value]) => [
      name,
      PROVIDER_CREDENTIAL_NAMES.has(name) && value !== "" ? PROXY_CREDENTIAL_SENTINEL : value,
    ])),
  };
}

function taskAgentImage(environment: TaskEnvironment | undefined, tool: string): { image: string; image_digest: string } | undefined {
  const images = environment?.agent_images;
  if (images === undefined) return undefined;
  const selected = images[tool];
  if (selected === undefined) throw new ConfigError(`task environment has no prepared agent image for ${tool}`);
  return selected;
}

/** Applies a prepared task/tool image while leaving ordinary S2 invocations unchanged. */
export function applyTaskEnvironmentImage(invocation: ContainerInvocation, environment: TaskEnvironment | undefined, tool: string): ContainerInvocation {
  const selected = taskAgentImage(environment, tool);
  return selected === undefined ? invocation : { ...invocation, image: selected.image, image_digest: selected.image_digest };
}

function reportedTaskEnvironment(environment: TaskEnvironment | undefined, tool: string, used: boolean): C4Run["task_environment"] {
  const base = environment ?? { kind: "runner-default", network: "disabled" as const };
  if (!used) return { kind: base.kind, network: base.network };
  const selected = taskAgentImage(environment, tool);
  return selected === undefined
    ? { kind: base.kind, network: base.network }
    : { kind: base.kind, network: base.network, agent_image: selected.image, agent_image_digest: selected.image_digest };
}

export function stageTask(spec: CellSpec): { workspaceDir: string; promptFile: string; verifier: VerifierSpec; verifyFile?: string } {
  mkdirSync(spec.dir, { recursive: true });
  const cellInfo = lstatSync(spec.dir);
  if (cellInfo.isSymbolicLink() || !cellInfo.isDirectory()) throw new ConfigError("invalid cell evidence directory");
  for (const artifact of PRIVATE_ATTEMPT_ARTIFACTS) {
    rmSync(join(spec.dir, artifact), { force: true });
  }
  const workspaceDir = join(spec.dir, "workspace");
  rmSync(workspaceDir, { recursive: true, force: true });
  cpSync(join(spec.taskDir, "workspace"), workspaceDir, { recursive: true });
  // The verifier is a cell-level artifact, not agent-visible task input.
  rmSync(join(workspaceDir, "verify.sh"), { force: true });
  rmSync(join(workspaceDir, "verifier.json"), { force: true });
  const promptFile = join(spec.dir, "prompt.md");
  const verifyFile = join(spec.dir, "verify.sh");
  const verifierDescriptorFile = join(spec.dir, "verifier.json");
  cpSync(join(spec.taskDir, "prompt.md"), promptFile);
  let verifier = spec.verifier;
  if (verifier === undefined) {
    try {
      const descriptor = lstatSync(join(spec.taskDir, "verifier.json"));
      if (descriptor.isSymbolicLink() || !descriptor.isFile()) throw new ConfigError("native verifier descriptor is not a regular file");
      verifier = validateVerifierSpec(JSON.parse(readFileSync(join(spec.taskDir, "verifier.json"), "utf8")));
    } catch (error) {
      if (error instanceof ConfigError) throw error;
      if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
        throw new ConfigError(`native verifier descriptor is invalid: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
  if (verifier !== undefined) {
    verifier = validateVerifierSpec(verifier);
    if (verifier.kind === "script") {
      cpSync(join(spec.taskDir, "verify.sh"), verifyFile);
      return { workspaceDir, promptFile, verifier: { kind: "script", path: verifyFile }, verifyFile };
    }
    writeFileSync(verifierDescriptorFile, `${JSON.stringify(verifier, null, 2)}\n`);
    return { workspaceDir, promptFile, verifier };
  }
  const scriptVerifier: VerifierSpec = { kind: "script", path: verifyFile };
  cpSync(join(spec.taskDir, "verify.sh"), verifyFile);
  return { workspaceDir, promptFile, verifier: scriptVerifier, verifyFile };
}

async function verifyTask(script: string, cwd: string, logPath: string, timeoutS: number): Promise<{ exit: number; duration_ms: number }> {
  const tStart = performance.now();
  const chunks: Buffer[] = [];
  const child = spawn("sh", [script], {
    cwd,
    env: { PATH: process.env.PATH ?? "/usr/bin:/bin", CI: "1", PYTHONDONTWRITEBYTECODE: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout?.on("data", (chunk: Buffer) => chunks.push(chunk));
  child.stderr?.on("data", (chunk: Buffer) => chunks.push(chunk));
  let timedOut = false;
  const exit = await new Promise<number>((resolve) => {
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 100);
    }, timeoutS * 1000);
    child.on("error", () => {
      clearTimeout(timer);
      resolve(127);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve(timedOut ? 124 : code ?? 1);
    });
  });
  writeFileSync(logPath, Buffer.concat(chunks));
  return { exit, duration_ms: performance.now() - tStart };
}

function cellLocalAdapterArtifacts(dir: string, result: C3AdapterResult): C3AdapterResult {
  const stdoutPath = join(dir, "stdout.log");
  const stderrPath = join(dir, "stderr.log");
  try {
    copyFileSync(result.artifacts.stdoutPath, stdoutPath);
    copyFileSync(result.artifacts.stderrPath, stderrPath);
    const toolLogPath = result.artifacts.toolLogPath === undefined ? undefined : join(dir, "tool-events.jsonl");
    if (result.artifacts.toolLogPath !== undefined && toolLogPath !== undefined) {
      copyFileSync(result.artifacts.toolLogPath, toolLogPath);
    }
    return {
      ...result,
      artifacts: {
        stdoutPath,
        stderrPath,
        ...(toolLogPath === undefined ? {} : { toolLogPath }),
      },
    };
  } catch (error) {
    throw new ToolError(`adapter artifacts are unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function readEvents(path: string): C1Event[] {
  try {
    return readFileSync(path, "utf8").split("\n").filter(Boolean).map((line) => validateC1Event(JSON.parse(line)));
  } catch (error) {
    throw new ContractViolation(`cannot read validated proxy events: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function requireTaskProvenance(spec: CellSpec): asserts spec is CellSpec & {
  task_source: string;
  task_revision: string;
  task_regime: MeasurementRegime;
} {
  if (spec.task_source === undefined || spec.task_revision === undefined || spec.task_regime === undefined) {
    throw new ConfigError("cell task provenance is required");
  }
}

function pinnedModelMismatch(events: C1Event[], spec: CellSpec): string | null {
  // The in-repo mock deliberately uses a synthetic served id; it is a zero-
  // spend plumbing fixture, not a model-routing assertion.
  if ((spec.condition ?? "pinned") !== "pinned" || spec.model === "mock") return null;
  for (const event of events) {
    if (event.model_requested !== null && event.model_requested !== spec.model) {
      return `pinned model was requested as ${event.model_requested}, expected ${spec.model}`;
    }
    if (event.model_served !== null && event.model_served !== spec.model) {
      return `pinned model was served as ${event.model_served}, expected ${spec.model}`;
    }
  }
  return null;
}

function modelEvents(events: C1Event[]): C1Event[] {
  return events.filter((event) => isSuccessfulModelEvent(event));
}

function modelAttempts(events: C1Event[]): C1Event[] {
  return events.filter((event) => isModelRequestAttempt(event));
}

export function shouldSkipVerification(input: {
  exitCode: number;
  timedOut: boolean;
  measuredEventCount: number;
  statusFailure: boolean;
  modelMismatch: string | null;
  missingProxyEvidence: boolean;
}): boolean {
  if (input.modelMismatch !== null || input.missingProxyEvidence) return true;
  if (!input.timedOut && input.exitCode !== 0) return true;
  // A provider failure is recoverable when the CLI exited cleanly and at
  // least one successful model response exists. An all-failed sequence stays
  // an adapter error, while every failed interval remains in C1/model_time.
  return input.statusFailure && input.measuredEventCount === 0;
}

export async function runHostCell(spec: CellSpec): Promise<C4Run> {
  validateToolConfiguration(spec.toolConfiguration, [spec.tool]);
  const providerRouting = spec.providerRouting === undefined ? undefined : validateProviderRouting(spec.providerRouting);
  requireTaskProvenance(spec);
  const adapter = getAdapter(spec.tool);
  const staged = stageTask(spec);
  const eventsPath = join(spec.dir, "events.jsonl");
  const upstreamApiKey = providerApiKey(spec);
  const proxy = await startProxy({
    run_id: spec.run_id,
    upstream: spec.upstream,
    outPath: eventsPath,
    ...(upstreamApiKey === undefined ? {} : { upstreamApiKey }),
    ...(providerRouting === undefined ? {} : { ignoredProviders: providerRouting.ignored_providers, onlyProvider: providerRouting.only_provider }),
  });
  const candidateBaseline = prepareCandidateBaseline(staged.workspaceDir);
  let adapterResult: C3AdapterResult;
  try {
    if (adapter.capabilities.containerOnly) throw new ToolError(`${adapter.name} requires Docker execution`);
    try {
      spec.onExecutionStart?.();
      adapterResult = await adapter.run({
        ...(spec.toolConfiguration === undefined ? {} : { toolConfiguration: spec.toolConfiguration }),
        workspaceDir: staged.workspaceDir,
        promptFile: staged.promptFile,
        model: spec.model,
        proxyUrl: proxy.baseUrl,
        condition: spec.condition ?? "pinned",
        timeoutS: spec.timeoutS ?? 30,
        env: spec.env ?? { OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? "" },
      });
    } catch (error) {
      throw error instanceof ToolError || error instanceof ConfigError ? error : new ToolError(`adapter execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    adapterResult = cellLocalAdapterArtifacts(spec.dir, adapterResult);
    if (adapterResult.exitCode === 0) await proxy.flush();
    else await proxy.close();
    const events = readEvents(eventsPath);
    const measuredEvents = modelEvents(events);
    const adapterAnchor = adapterResult.anchor;
    const statusFailure = modelAttempts(events).some((event) => event.status === 0 || event.status >= 400 || event.error !== null);
    const modelMismatch = pinnedModelMismatch(events, spec);
    const missingProxyEvidence = (spec.condition ?? "pinned") === "pinned" && spec.model !== "mock" && measuredEvents.length === 0;
    const adapterTimedOut = adapterResult.exitCode === 124;
    const adapterFailure = shouldSkipVerification({
      exitCode: adapterResult.exitCode, timedOut: adapterTimedOut, measuredEventCount: measuredEvents.length,
      statusFailure, modelMismatch, missingProxyEvidence,
    });
    const candidateEvidence = captureCandidate({ dir: spec.dir, workspace: staged.workspaceDir, baseline: candidateBaseline,
      runId: spec.run_id, taskId: spec.task_id, baseRevision: spec.task_base_revision ?? null, taskRevision: spec.task_revision,
      agentImage: "host", verifierImage: staged.verifier.kind === "docker-command" ? staged.verifier.image_digest : "host" });
    const verificationLog = join(spec.dir, "verify.log");
    const verification = adapterFailure || adapterTimedOut
      ? (writeFileSync(verificationLog, ""), { exit: 1, duration_ms: 0 })
      : staged.verifier.kind === "script"
        ? (spec.onVerificationStart?.(), await verifyTask(staged.verifier.path, spec.dir, verificationLog, 60))
        : await runDockerVerification({
            image: staged.verifier.image,
            imageDigest: staged.verifier.image_digest,
            ...(spec.toolConfiguration === undefined ? {} : { toolConfiguration: spec.toolConfiguration }),
        workspaceDir: staged.workspaceDir,
            command: staged.verifier.command,
            workdir: staged.verifier.workdir,
            network: staged.verifier.network,
            logPath: verificationLog,
            timeoutS: 60,
            ...(spec.onVerificationStart === undefined ? {} : { onVerificationStart: spec.onVerificationStart }),
            ...(spec.onContainerStart === undefined ? {} : { onContainerStart: spec.onContainerStart }),
          }).then((result) => ({ exit: result.exitCode, duration_ms: result.duration_ms }));
    const outcome: C4Run["outcome"] = adapterTimedOut || verification.exit === 124
      ? "timeout"
      : adapterFailure
        ? "adapter_error"
        : verification.exit === 0 ? "completed" : "verify_error";
    const run: C4Run = {
      v: 1,
      run_id: spec.run_id,
      tool: spec.tool,
      tool_version: adapter.capabilities.containerOnly ? "container-image" : await adapter.version(),
      task_id: spec.task_id,
      task_source: spec.task_source ?? "local-development",
      task_revision: spec.task_revision ?? "working-tree",
      ...(spec.task_repository === undefined ? {} : { task_repository: spec.task_repository }),
      task_base_revision: spec.task_base_revision ?? null,
      task_regime: spec.task_regime ?? "short",
      condition: spec.condition ?? "pinned",
      rep: spec.rep ?? 0,
      model: spec.model,
      ori_version: null,
      tool_visibility: adapter.capabilities.toolVisibility,
      anchors: {
        adapter: adapterAnchor,
        proxy: proxy.anchor,
      },
      adapter_result: adapterResult,
      events_file: "events.jsonl",
      verification: { ...verification, logPath: "verify.log" },
      container: {
        image_digest: "host",
        verifier_image_digest: staged.verifier.kind === "docker-command" ? staged.verifier.image_digest : "host",
        started_iso: adapterAnchor.wall_clock_iso,
      },
      task_environment: reportedTaskEnvironment(spec.environment, spec.tool, false),
      host: { os: platform(), cpu: arch(), ram_gb: totalmem() / (1024 ** 3) },
      spend_usd_estimate: estimateRunSpendUsd(events, spec.condition ?? "pinned", spec.priceRates),
      price_book: spec.price_book,
      ...(providerRouting === undefined ? {} : { provider_routing: providerRouting }),
      ...(spec.toolConfiguration === undefined ? {} : { tool_configuration: spec.toolConfiguration }),
      outcome,
    };
    validateC4Run(run);
    const runBytes = Buffer.from(`${JSON.stringify(run, null, 2)}\n`);
    writeFileSync(join(spec.dir, "run.json"), runBytes);
    bindCandidateToRun(spec.dir, candidateEvidence, runBytes);
    return run;
  } finally {
    releaseCandidateBaseline(candidateBaseline);
    await proxy.close();
  }
}

export async function runDockerCell(spec: CellSpec): Promise<C4Run> {
  validateToolConfiguration(spec.toolConfiguration, [spec.tool]);
  const providerRouting = spec.providerRouting === undefined ? undefined : validateProviderRouting(spec.providerRouting);
  requireTaskProvenance(spec);
  const adapter = getAdapter(spec.tool);
  if (!adapter.containerInvocation) {
    throw new ConfigError(`${spec.tool} has no Docker invocation descriptor`);
  }
  const staged = stageTask(spec);
  const eventsPath = join(spec.dir, "events.jsonl");
  const upstreamApiKey = providerApiKey(spec);
  const proxyAuthToken = newDockerProxyAuthToken();
  const proxy = await startProxy({
    run_id: spec.run_id,
    upstream: spec.upstream,
    outPath: eventsPath,
    host: "0.0.0.0",
    authToken: proxyAuthToken,
    ...(upstreamApiKey === undefined ? {} : { upstreamApiKey }),
    ...(providerRouting === undefined ? {} : { ignoredProviders: providerRouting.ignored_providers, onlyProvider: providerRouting.only_provider }),
  });
  const candidateBaseline = prepareCandidateBaseline(staged.workspaceDir);
  try {
    const targetProxyUrl = `http://host.docker.internal:${proxy.port}`;
    const route = describeDockerProxyRoute(targetProxyUrl, newDockerContainerName(), proxyAuthToken);
    const invocation = applyTaskEnvironmentImage(brokerDockerInvocation(adapter.containerInvocation({
      workspaceDir: staged.workspaceDir,
      promptFile: staged.promptFile,
      ...(spec.toolConfiguration === undefined ? {} : { toolConfiguration: spec.toolConfiguration }),
      model: spec.model,
      proxyUrl: route.clientUrl,
      condition: spec.condition ?? "pinned",
      timeoutS: spec.timeoutS ?? 30,
      env: spec.env ?? { OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? "" },
    })), spec.environment, spec.tool);
    if (invocation.env.HOME?.startsWith(`${staged.workspaceDir}${sep}`) || invocation.env.HOME === staged.workspaceDir) {
      invocation.env.HOME = `/work/workspace${relative(staged.workspaceDir, invocation.env.HOME).split(sep).join("/") === "" ? "" : `/${relative(staged.workspaceDir, invocation.env.HOME).split(sep).join("/")}`}`;
    }
    const docker = await runDockerCommand(invocation, route, spec.dir, spec.timeoutS ?? 30, spec.onContainerStart, spec.onExecutionStart);
    if (docker.exitCode === 0) await proxy.flush();
    else await proxy.close();
    const events = readEvents(eventsPath);
    const measuredEvents = modelEvents(events);
    const statusFailure = modelAttempts(events).some((event) => event.status === 0 || event.status >= 400 || event.error !== null);
    const modelMismatch = pinnedModelMismatch(events, spec);
    const missingProxyEvidence = (spec.condition ?? "pinned") === "pinned" && spec.model !== "mock" && measuredEvents.length === 0;
    const adapterTimedOut = docker.exitCode === 124;
    const adapterFailure = shouldSkipVerification({
      exitCode: docker.exitCode, timedOut: adapterTimedOut, measuredEventCount: measuredEvents.length,
      statusFailure, modelMismatch, missingProxyEvidence,
    });
    const candidateEvidence = captureCandidate({ dir: spec.dir, workspace: staged.workspaceDir, baseline: candidateBaseline,
      runId: spec.run_id, taskId: spec.task_id, baseRevision: spec.task_base_revision ?? null, taskRevision: spec.task_revision,
      agentImage: docker.imageDigest, verifierImage: staged.verifier.kind === "docker-command" ? staged.verifier.image_digest : docker.imageDigest });
    const verificationLog = join(spec.dir, "verify.log");
    const verification = adapterFailure || adapterTimedOut
      ? (writeFileSync(verificationLog, ""), { exitCode: 1, duration_ms: 0 })
      : staged.verifier.kind === "script"
        ? await runDockerVerification({
            image: invocation.image,
            imageDigest: docker.imageDigest,
            ...(spec.toolConfiguration === undefined ? {} : { toolConfiguration: spec.toolConfiguration }),
        workspaceDir: staged.workspaceDir,
            verificationFile: staged.verifier.path,
            logPath: verificationLog,
            timeoutS: 60,
            ...(spec.onVerificationStart === undefined ? {} : { onVerificationStart: spec.onVerificationStart }),
            ...(spec.onContainerStart === undefined ? {} : { onContainerStart: spec.onContainerStart }),
          })
        : await runDockerVerification({
            image: staged.verifier.image,
            imageDigest: staged.verifier.image_digest,
            ...(spec.toolConfiguration === undefined ? {} : { toolConfiguration: spec.toolConfiguration }),
        workspaceDir: staged.workspaceDir,
            command: staged.verifier.command,
            workdir: staged.verifier.workdir,
            network: staged.verifier.network,
            logPath: verificationLog,
            timeoutS: 60,
            ...(spec.onVerificationStart === undefined ? {} : { onVerificationStart: spec.onVerificationStart }),
            ...(spec.onContainerStart === undefined ? {} : { onContainerStart: spec.onContainerStart }),
          });
    const outcome: C4Run["outcome"] = adapterTimedOut || verification.exitCode === 124
      ? "timeout"
      : adapterFailure ? "adapter_error" : verification.exitCode === 0 ? "completed" : "verify_error";
    const adapterResult: C3AdapterResult = {
      exitCode: docker.exitCode,
      tStart: docker.tStart,
      tEnd: docker.tEnd,
      anchor: docker.anchor,
      ...(docker.toolEvents === undefined ? {} : { toolEvents: docker.toolEvents }),
      artifacts: {
        stdoutPath: docker.stdoutPath,
        stderrPath: docker.stderrPath,
        ...(docker.toolLogPath === undefined ? {} : { toolLogPath: docker.toolLogPath }),
      },
    };
    const run: C4Run = {
      v: 1,
      run_id: spec.run_id,
      tool: spec.tool,
      tool_version: docker.toolVersion ?? "container-image",
      task_id: spec.task_id,
      task_source: spec.task_source ?? "local-development",
      task_revision: spec.task_revision ?? "working-tree",
      ...(spec.task_repository === undefined ? {} : { task_repository: spec.task_repository }),
      task_base_revision: spec.task_base_revision ?? null,
      task_regime: spec.task_regime ?? "short",
      condition: spec.condition ?? "pinned",
      rep: spec.rep ?? 0,
      model: spec.model,
      ori_version: null,
      tool_visibility: adapter.capabilities.toolVisibility,
      anchors: { adapter: docker.anchor, proxy: proxy.anchor },
      adapter_result: adapterResult,
      events_file: "events.jsonl",
      verification: { exit: verification.exitCode, duration_ms: verification.duration_ms, logPath: "verify.log" },
      container: {
        image_digest: docker.imageDigest,
        verifier_image_digest: staged.verifier.kind === "docker-command" ? staged.verifier.image_digest : docker.imageDigest,
        started_iso: docker.anchor.wall_clock_iso,
      },
      task_environment: reportedTaskEnvironment(spec.environment, spec.tool, true),
      host: { os: platform(), cpu: arch(), ram_gb: totalmem() / (1024 ** 3) },
      spend_usd_estimate: estimateRunSpendUsd(events, spec.condition ?? "pinned", spec.priceRates),
      price_book: spec.price_book,
      ...(providerRouting === undefined ? {} : { provider_routing: providerRouting }),
      ...(spec.toolConfiguration === undefined ? {} : { tool_configuration: spec.toolConfiguration }),
      outcome,
    };
    validateC4Run(run);
    const runBytes = Buffer.from(`${JSON.stringify(run, null, 2)}\n`);
    const readObservation = (name: string): ExecutionObservation => {
      try { return JSON.parse(readFileSync(join(spec.dir, name), "utf8")) as ExecutionObservation; }
      catch { throw new ToolError("cannot read execution-condition evidence"); }
    };
    const conditions = bindExecutionConditions(runBytes, readObservation("agent-conditions.json"),
      adapterFailure || adapterTimedOut ? null : readObservation("verifier-conditions.json"));
    writeFileSync(join(spec.dir, "run.json"), runBytes);
    bindCandidateToRun(spec.dir, candidateEvidence, runBytes);
    writeFileSync(join(spec.dir, "execution-conditions.json"), `${JSON.stringify(conditions, null, 2)}\n`, { mode: 0o600 });
    return run;
  } finally {
    releaseCandidateBaseline(candidateBaseline);
    await proxy.close();
  }
}

export function validateToolConfiguration(value: unknown, tools: string[]): asserts value is ToolConfiguration | undefined {
  if (value !== undefined && (value !== "claude-code-no-web-search" || tools.length === 0 || tools.some((tool) => tool !== "claude-code"))) {
    throw new ConfigError("tool configuration requires claude-code-no-web-search and Claude-only tools");
  }
}
