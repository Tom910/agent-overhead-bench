/**
 * Task-source boundary: validate canonical C2 trees, pin reviewed Git checkouts,
 * and materialize public run inputs without private reference material.
 */
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { ConfigError, type C2TaskYaml } from "@aob/contracts";
import { loadTaskYaml } from "./yaml.js";
import { regimeForExpectedMinutes, type MeasurementRegime } from "./regime.js";

export type TaskSpec = {
  id: string;
  source: C2TaskYaml["source"];
  workspaceDir: string;
  promptFile: string;
  verifier: VerifierSpec;
  environment: TaskEnvironment;
  timeoutS: number;
  language: C2TaskYaml["language"];
  type: C2TaskYaml["shape"];
  regime: MeasurementRegime;
  baseRevision?: string;
};

export type TaskAgentImage = { image: string; image_digest: string };

export type TaskEnvironment = {
  kind: string;
  network: "disabled";
  agent_images?: Record<string, TaskAgentImage>;
};

export type VerifierSpec =
  | { kind: "script"; path: string }
  | { kind: "docker-command"; image: string; image_digest: string; command: string[]; workdir: string; network: "none" };

export type SourceTaskBinding = {
  path: string;
  source_task_id: string;
  source_checksum: string;
};

export type TaskSourceReview = {
  source_reviewed: boolean;
  reference_results_verified: boolean;
  calibration_complete: boolean;
  maintainer_signed_off: boolean;
  reviewer: string;
  reviewed_at: string;
  evidence_file: string;
  evidence_sha256: string;
  reviewed_task_ids: string[];
  calibration_adapters: string[];
  calibration_attestation_file?: string;
  calibration_attestation_sha256?: string;
};

export interface TaskSourceAdapter {
  name: string;
  listTasks(): Promise<string[]>;
  prepareTask(taskId: string, destination: string): Promise<{
    task: TaskSpec;
    sourceRevision: string;
    checksum: string;
  }>;
}

export type LocalTaskManifest = {
  version: 1;
  source_adapter: "local-prepared";
  source_provenance?: {
    source_adapter: "git-canonical" | "git-taskpack" | "deepswe";
    repository: string;
    revision: string;
    license_notes: string;
    source_manifest_sha256: string;
    review: TaskSourceReview;
  };
  tasks: Array<{
    id: string;
    source: C2TaskYaml["source"];
    checksum: string;
    preparation: "copy-task-yaml-prompt-workspace-verifier";
    source_binding?: SourceTaskBinding;
  }>;
};

export type GitCanonicalTaskManifest = {
  version: 1;
  source_adapter: "git-canonical";
  repository: string;
  /** Exact commit checked out for the reviewed canonical task tree. */
  revision: string;
  license_notes: string;
  review: TaskSourceReview;
  tasks: Array<{
    id: string;
    path: string;
    task_id: string;
    /** Revision recorded by the task's C2 provenance, which may differ from the checkout revision. */
    source_revision: string;
    checksum: string;
  }>;
};

export type GitTaskPackRunner = "python-basic" | "node-basic";

export type GitTaskPackManifest = {
  version: 1;
  source_adapter: "git-taskpack";
  repository: string;
  /** Exact commit containing the task pack, prompts, and public starter repositories. */
  revision: string;
  license_notes: string;
  review: TaskSourceReview;
  tasks: Array<{
    id: string;
    path: string;
    source_task_id: string;
    language: C2TaskYaml["language"];
    shape: C2TaskYaml["shape"];
    size: C2TaskYaml["size"];
    timeout_s: number;
    expected_minutes: [number, number];
    test_runners: GitTaskPackRunner[];
    checksum: string;
  }>;
};

export type DeepSWESourceCategory = "bugfix" | "enhancement" | "feature_request";

/** Original-source manifest for DeepSWE's task.toml + pinned upstream layout. */
export type DeepSWEManifest = {
  version: 1;
  source_adapter: "deepswe";
  repository: string;
  source_dataset: string;
  revision: string;
  license_notes: string;
  review: TaskSourceReview;
  tasks: Array<{
    id: string;
    path: string;
    source_task_id: string;
    language: C2TaskYaml["language"];
    shape: C2TaskYaml["shape"];
    source_category: DeepSWESourceCategory;
    size: C2TaskYaml["size"];
    timeout_s: number;
    expected_minutes: [number, number];
    upstream_repository: string;
    upstream_revision: string;
    /** Fresh sanitized Git base used by the measured workspace and verifier. */
    workspace_revision: string;
    environment_image: string;
    environment_image_digest: string;
    agent_images?: Record<string, TaskAgentImage>;
    verifier_image: string;
    verifier_image_digest: string;
    reference_polarity_sha256?: string;
    checksum: string;
  }>;
};

export type DeepSWEReferencePolarity = {
  version: 1;
  task_id: string;
  source_task_checksum: string;
  verifier_image: string;
  verifier_image_digest: string;
  samples: 5;
  exit_codes: [number, number, number, number, number];
  reference_passed: true;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertKnownKeys(value: Record<string, unknown>, keys: string[], label: string): void {
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new ConfigError(`${label} contains unknown field: ${key}`);
  }
}

function requiredString(value: Record<string, unknown>, key: string, label: string): string {
  const result = value[key];
  if (typeof result !== "string" || result.length === 0) throw new ConfigError(`${label}.${key} must be a non-empty string`);
  return result;
}

/** Validate preparation-time evidence that a DeepSWE reference patch passes. */
export function validateDeepSWEReferencePolarity(value: unknown, task: DeepSWEManifest["tasks"][number]): DeepSWEReferencePolarity {
  if (!isRecord(value)) throw new ConfigError("DeepSWE reference polarity must be an object");
  assertKnownKeys(value, ["version", "task_id", "source_task_checksum", "verifier_image", "verifier_image_digest", "samples", "exit_codes", "reference_passed"], "DeepSWE reference polarity");
  if (value.version !== 1 || value.task_id !== task.id || value.source_task_checksum !== task.checksum ||
    value.verifier_image !== task.verifier_image || value.verifier_image_digest !== task.verifier_image_digest ||
    value.samples !== 5 || value.reference_passed !== true) {
    throw new ConfigError("DeepSWE reference polarity evidence does not match its task or verifier");
  }
  if (!Array.isArray(value.exit_codes) || value.exit_codes.length !== 5 || value.exit_codes.some((code) => typeof code !== "number" || !Number.isInteger(code) || code < 0 || code !== 0)) {
    throw new ConfigError("DeepSWE reference polarity evidence must contain five stable zero exit codes");
  }
  return {
    version: 1,
    task_id: task.id,
    source_task_checksum: task.checksum,
    verifier_image: task.verifier_image,
    verifier_image_digest: task.verifier_image_digest,
    samples: 5,
    exit_codes: value.exit_codes as [number, number, number, number, number],
    reference_passed: true,
  };
}

function fullRevision(value: string, label: string): string {
  if (!/^[0-9a-f]{40}$/i.test(value)) throw new ConfigError(`${label} must be a full 40-character commit SHA`);
  return value.toLowerCase();
}

function checksum(value: string, label: string): string {
  if (!/^sha256:[0-9a-f]{64}$/i.test(value)) throw new ConfigError(`${label} must be a sha256 checksum`);
  return value.toLowerCase();
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

export function sourceManifestSha256(manifest: GitCanonicalTaskManifest | GitTaskPackManifest | DeepSWEManifest): string {
  return `sha256:${createHash("sha256").update(canonicalJson(manifest)).digest("hex")}`;
}

function sourceReview(value: unknown, label: string): TaskSourceReview {
  if (!isRecord(value)) throw new ConfigError(`${label} must be an object`);
  assertKnownKeys(value, ["source_reviewed", "reference_results_verified", "calibration_complete", "maintainer_signed_off", "reviewer", "reviewed_at", "evidence_file", "evidence_sha256", "reviewed_task_ids", "calibration_adapters", "calibration_attestation_file", "calibration_attestation_sha256"], label);
  const booleanKeys = ["source_reviewed", "reference_results_verified", "calibration_complete", "maintainer_signed_off"] as const;
  for (const key of booleanKeys) {
    if (typeof value[key] !== "boolean") throw new ConfigError(`${label}.${key} must be boolean`);
  }
  const reviewer = requiredString(value, "reviewer", label);
  const reviewedAt = requiredString(value, "reviewed_at", label);
  const evidenceFile = safeRelativePath(requiredString(value, "evidence_file", label), `${label}.evidence_file`);
  const evidenceSha256 = checksum(requiredString(value, "evidence_sha256", label), `${label}.evidence_sha256`);
  if (!Array.isArray(value.reviewed_task_ids) || value.reviewed_task_ids.length === 0 || value.reviewed_task_ids.some((id) => typeof id !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id))) {
    throw new ConfigError(`${label}.reviewed_task_ids must contain task ids`);
  }
  const reviewedTaskIds = value.reviewed_task_ids as string[];
  if (new Set(reviewedTaskIds).size !== reviewedTaskIds.length) throw new ConfigError(`${label}.reviewed_task_ids contains duplicates`);
  if (!Array.isArray(value.calibration_adapters) || value.calibration_adapters.some((name) => typeof name !== "string" || name.length === 0)) {
    throw new ConfigError(`${label}.calibration_adapters must contain adapter names`);
  }
  const calibrationAdapters = value.calibration_adapters as string[];
  if (new Set(calibrationAdapters).size !== calibrationAdapters.length) throw new ConfigError(`${label}.calibration_adapters contains duplicates`);
  if (value.calibration_complete === true && calibrationAdapters.length < 2) throw new ConfigError(`${label}.calibration_adapters must contain at least two adapters when calibration is complete`);
  const attestationFile = value.calibration_attestation_file === undefined ? undefined : safeRelativePath(requiredString(value, "calibration_attestation_file", label), `${label}.calibration_attestation_file`);
  const attestationSha256 = value.calibration_attestation_sha256 === undefined ? undefined : checksum(requiredString(value, "calibration_attestation_sha256", label), `${label}.calibration_attestation_sha256`);
  if ((attestationFile === undefined) !== (attestationSha256 === undefined)) throw new ConfigError(`${label}.calibration attestation file and checksum must be provided together`);
  if (value.calibration_complete === true && (attestationFile === undefined || attestationSha256 === undefined)) throw new ConfigError(`${label} requires a calibration attestation when calibration is complete`);
  return {
    source_reviewed: value.source_reviewed as boolean,
    reference_results_verified: value.reference_results_verified as boolean,
    calibration_complete: value.calibration_complete as boolean,
    maintainer_signed_off: value.maintainer_signed_off as boolean,
    reviewer,
    reviewed_at: reviewedAt,
    evidence_file: evidenceFile,
    evidence_sha256: evidenceSha256,
    reviewed_task_ids: reviewedTaskIds,
    calibration_adapters: calibrationAdapters,
    ...(attestationFile === undefined ? {} : { calibration_attestation_file: attestationFile }),
    ...(attestationSha256 === undefined ? {} : { calibration_attestation_sha256: attestationSha256 }),
  };
}

function reviewsMatch(left: TaskSourceReview, right: TaskSourceReview): boolean {
  return canonicalJson(left) === canonicalJson(right);
}

function validateReviewedTaskIds(review: TaskSourceReview, taskIds: string[], label: string): void {
  if (taskIds.some((id) => !review.reviewed_task_ids.includes(id))) {
    throw new ConfigError(`${label}.reviewed_task_ids must cover every manifest task`);
  }
}

function safeRelativePath(value: string, label: string): string {
  if (isAbsolute(value) || value.length === 0 || value.includes("\\") || value.includes("\0")) throw new ConfigError(`${label} must be a safe relative path`);
  const parts = value.split("/");
  if (parts.some((part) => part.length === 0 || part === "." || part === "..")) throw new ConfigError(`${label} must be a safe relative path`);
  return value;
}

function safeWorkspaceRelativePath(value: string, label: string): string {
  if (value === "" || value === ".") return ".";
  return safeRelativePath(value, label);
}

export function validateVerifierSpec(value: unknown): VerifierSpec {
  if (!isRecord(value)) throw new ConfigError("verifier specification must be an object");
  if (value.kind === "script") {
    assertKnownKeys(value, ["kind", "path"], "script verifier");
    return { kind: "script", path: requiredString(value, "path", "script verifier") };
  }
  if (value.kind !== "docker-command") throw new ConfigError("unsupported verifier specification kind");
  assertKnownKeys(value, ["kind", "image", "image_digest", "command", "workdir", "network"], "Docker verifier");
  const image = requiredString(value, "image", "Docker verifier");
  if (image.includes("\0") || image.includes(",")) throw new ConfigError("Docker verifier.image contains an unsupported character");
  const imageDigest = checksum(requiredString(value, "image_digest", "Docker verifier"), "Docker verifier.image_digest");
  if (!Array.isArray(value.command) || value.command.length === 0 || value.command.some((arg) => typeof arg !== "string" || arg.length === 0 || arg.includes("\0"))) {
    throw new ConfigError("Docker verifier.command must be a non-empty NUL-free argument array");
  }
  if (value.command[0]!.length === 0) throw new ConfigError("Docker verifier.command executable must not be empty");
  const workdir = safeWorkspaceRelativePath(requiredString(value, "workdir", "Docker verifier"), "Docker verifier.workdir");
  if (value.network !== "none") throw new ConfigError("Docker verifier.network must be none");
  return { kind: "docker-command", image, image_digest: imageDigest, command: value.command as string[], workdir, network: "none" };
}

export function validateGitTaskManifest(value: unknown): GitCanonicalTaskManifest {
  if (!isRecord(value)) throw new ConfigError("git task manifest must be an object");
  assertKnownKeys(value, ["version", "source_adapter", "repository", "revision", "license_notes", "review", "tasks"], "git task manifest");
  if (value.version !== 1 || value.source_adapter !== "git-canonical") throw new ConfigError("unsupported git task manifest version or adapter");
  const repository = requiredString(value, "repository", "git task manifest");
  const revision = fullRevision(requiredString(value, "revision", "git task manifest"), "git task manifest.revision");
  const licenseNotes = requiredString(value, "license_notes", "git task manifest");
  const review = sourceReview(value.review, "git task manifest.review");
  if (!Array.isArray(value.tasks) || value.tasks.length === 0) throw new ConfigError("git task manifest.tasks must not be empty");
  const tasks = value.tasks.map((raw, index) => {
    if (!isRecord(raw)) throw new ConfigError(`git task manifest.tasks[${index}] must be an object`);
    assertKnownKeys(raw, ["id", "path", "task_id", "source_revision", "checksum"], `git task manifest.tasks[${index}]`);
    const id = requiredString(raw, "id", `git task manifest.tasks[${index}]`);
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id)) throw new ConfigError(`invalid task id in git manifest: ${id}`);
    const path = safeRelativePath(requiredString(raw, "path", `git task manifest.tasks[${index}]`), `git task manifest.tasks[${index}].path`);
    const taskId = requiredString(raw, "task_id", `git task manifest.tasks[${index}]`);
    const sourceRevision = fullRevision(requiredString(raw, "source_revision", `git task manifest.tasks[${index}]`), `git task manifest.tasks[${index}].source_revision`);
    const taskChecksum = checksum(requiredString(raw, "checksum", `git task manifest.tasks[${index}]`), `git task manifest.tasks[${index}].checksum`);
    return { id, path, task_id: taskId, source_revision: sourceRevision, checksum: taskChecksum };
  });
  if (new Set(tasks.map((task) => task.id)).size !== tasks.length) throw new ConfigError("git task manifest contains duplicate task ids");
  if (new Set(tasks.map((task) => task.path)).size !== tasks.length) throw new ConfigError("git task manifest contains duplicate task paths");
  validateReviewedTaskIds(review, tasks.map((task) => task.id), "git task manifest");
  return { version: 1, source_adapter: "git-canonical", repository, revision, license_notes: licenseNotes, review, tasks };
}

function c2Language(value: unknown, label: string): C2TaskYaml["language"] {
  if (value !== "python" && value !== "typescript" && value !== "go" && value !== "javascript" && value !== "rust") {
    throw new ConfigError(`${label} must be python, typescript, go, javascript, or rust`);
  }
  return value;
}

function c2Shape(value: unknown, label: string): C2TaskYaml["shape"] {
  if (value !== "bugfix" && value !== "test-fix" && value !== "feature" && value !== "refactor") {
    throw new ConfigError(`${label} has an unsupported task shape`);
  }
  return value;
}

function deepSWESourceCategory(value: unknown, label: string): DeepSWESourceCategory {
  if (value !== "bugfix" && value !== "enhancement" && value !== "feature_request") {
    throw new ConfigError(`${label} has an unsupported DeepSWE source category`);
  }
  return value;
}

function taskAgentImages(value: unknown, label: string): Record<string, TaskAgentImage> {
  if (!isRecord(value)) throw new ConfigError(`${label} must be an object`);
  const agentImages: Record<string, TaskAgentImage> = {};
  for (const [tool, imageValue] of Object.entries(value)) {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(tool)) throw new ConfigError(`${label} contains an invalid tool name: ${tool}`);
    if (!isRecord(imageValue)) throw new ConfigError(`${label}.${tool} must be an object`);
    assertKnownKeys(imageValue, ["image", "image_digest"], `${label}.${tool}`);
    agentImages[tool] = {
      image: requiredString(imageValue, "image", `${label}.${tool}`),
      image_digest: checksum(requiredString(imageValue, "image_digest", `${label}.${tool}`), `${label}.${tool}.image_digest`),
    };
  }
  return agentImages;
}

function c2Size(value: unknown, label: string): C2TaskYaml["size"] {
  if (value !== "small" && value !== "medium") throw new ConfigError(`${label} must be small or medium`);
  return value;
}

function positiveNumber(value: unknown, key: string, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) throw new ConfigError(`${label}.${key} must be a positive number`);
  return value;
}

function minuteRange(value: unknown, label: string): [number, number] {
  if (!Array.isArray(value) || value.length !== 2) throw new ConfigError(`${label}.expected_minutes must be [min, max]`);
  const lo = positiveNumber(value[0], "min", label);
  const hi = positiveNumber(value[1], "max", label);
  if (lo > hi) throw new ConfigError(`${label}.expected_minutes must be ascending`);
  return [lo, hi];
}

function taskPackRunners(value: unknown, label: string): GitTaskPackRunner[] {
  if (!Array.isArray(value) || value.length === 0) throw new ConfigError(`${label}.test_runners must not be empty`);
  const runners = value.map((runner, index) => {
    if (runner !== "python-basic" && runner !== "node-basic") throw new ConfigError(`${label}.test_runners[${index}] is unsupported`);
    return runner;
  });
  if (new Set(runners).size !== runners.length) throw new ConfigError(`${label}.test_runners contains duplicates`);
  return runners;
}

export function validateGitTaskPackManifest(value: unknown): GitTaskPackManifest {
  if (!isRecord(value)) throw new ConfigError("git task-pack manifest must be an object");
  assertKnownKeys(value, ["version", "source_adapter", "repository", "revision", "license_notes", "review", "tasks"], "git task-pack manifest");
  if (value.version !== 1 || value.source_adapter !== "git-taskpack") throw new ConfigError("unsupported git task-pack manifest version or adapter");
  const repository = requiredString(value, "repository", "git task-pack manifest");
  const revision = fullRevision(requiredString(value, "revision", "git task-pack manifest"), "git task-pack manifest.revision");
  const licenseNotes = requiredString(value, "license_notes", "git task-pack manifest");
  const review = sourceReview(value.review, "git task-pack manifest.review");
  if (!Array.isArray(value.tasks) || value.tasks.length === 0) throw new ConfigError("git task-pack manifest.tasks must not be empty");
  const tasks = value.tasks.map((raw, index) => {
    if (!isRecord(raw)) throw new ConfigError(`git task-pack manifest.tasks[${index}] must be an object`);
    const label = `git task-pack manifest.tasks[${index}]`;
    assertKnownKeys(raw, ["id", "path", "source_task_id", "language", "shape", "size", "timeout_s", "expected_minutes", "test_runners", "checksum"], label);
    const id = requiredString(raw, "id", label);
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id)) throw new ConfigError(`invalid task id in git task-pack manifest: ${id}`);
    const path = safeRelativePath(requiredString(raw, "path", label), `${label}.path`);
    const sourceTaskId = requiredString(raw, "source_task_id", label);
    const language = c2Language(raw.language, `${label}.language`);
    const shape = c2Shape(raw.shape, `${label}.shape`);
    const size = c2Size(raw.size, `${label}.size`);
    const timeoutS = positiveNumber(raw.timeout_s, "timeout_s", label);
    const expectedMinutes = minuteRange(raw.expected_minutes, label);
    const testRunners = taskPackRunners(raw.test_runners, label);
    const taskChecksum = checksum(requiredString(raw, "checksum", label), `${label}.checksum`);
    return { id, path, source_task_id: sourceTaskId, language, shape, size, timeout_s: timeoutS, expected_minutes: expectedMinutes, test_runners: testRunners, checksum: taskChecksum };
  });
  if (new Set(tasks.map((task) => task.id)).size !== tasks.length) throw new ConfigError("git task-pack manifest contains duplicate task ids");
  if (new Set(tasks.map((task) => task.path)).size !== tasks.length) throw new ConfigError("git task-pack manifest contains duplicate task paths");
  if (new Set(tasks.map((task) => task.source_task_id)).size !== tasks.length) throw new ConfigError("git task-pack manifest contains duplicate source task ids");
  validateReviewedTaskIds(review, tasks.map((task) => task.id), "git task-pack manifest");
  return { version: 1, source_adapter: "git-taskpack", repository, revision, license_notes: licenseNotes, review, tasks };
}

export function validateDeepSWEManifest(value: unknown): DeepSWEManifest {
  if (!isRecord(value)) throw new ConfigError("DeepSWE manifest must be an object");
  assertKnownKeys(value, ["version", "source_adapter", "repository", "source_dataset", "revision", "license_notes", "review", "tasks"], "DeepSWE manifest");
  if (value.version !== 1 || value.source_adapter !== "deepswe") throw new ConfigError("unsupported DeepSWE manifest version or adapter");
  const repository = requiredString(value, "repository", "DeepSWE manifest");
  const sourceDataset = requiredString(value, "source_dataset", "DeepSWE manifest");
  const revision = fullRevision(requiredString(value, "revision", "DeepSWE manifest"), "DeepSWE manifest.revision");
  const licenseNotes = requiredString(value, "license_notes", "DeepSWE manifest");
  const review = sourceReview(value.review, "DeepSWE manifest.review");
  if (!Array.isArray(value.tasks) || value.tasks.length === 0) throw new ConfigError("DeepSWE manifest.tasks must not be empty");
  const tasks = value.tasks.map((raw, index) => {
    if (!isRecord(raw)) throw new ConfigError(`DeepSWE manifest.tasks[${index}] must be an object`);
    const label = `DeepSWE manifest.tasks[${index}]`;
    assertKnownKeys(raw, ["id", "path", "source_task_id", "language", "shape", "source_category", "size", "timeout_s", "expected_minutes", "upstream_repository", "upstream_revision", "workspace_revision", "environment_image", "environment_image_digest", "agent_images", "verifier_image", "verifier_image_digest", "reference_polarity_sha256", "checksum"], label);
    const id = requiredString(raw, "id", label);
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id)) throw new ConfigError(`invalid task id in DeepSWE manifest: ${id}`);
    const path = safeRelativePath(requiredString(raw, "path", label), `${label}.path`);
    const sourceTaskId = requiredString(raw, "source_task_id", label);
    const language = c2Language(raw.language, `${label}.language`);
    const shape = c2Shape(raw.shape, `${label}.shape`);
    const sourceCategory = deepSWESourceCategory(raw.source_category, `${label}.source_category`);
    const size = c2Size(raw.size, `${label}.size`);
    const timeoutS = positiveNumber(raw.timeout_s, "timeout_s", label);
    const expectedMinutes = minuteRange(raw.expected_minutes, label);
    const upstreamRepository = requiredString(raw, "upstream_repository", label);
    const upstreamRevision = fullRevision(requiredString(raw, "upstream_revision", label), `${label}.upstream_revision`);
    const workspaceRevision = fullRevision(requiredString(raw, "workspace_revision", label), `${label}.workspace_revision`);
    const environmentImage = requiredString(raw, "environment_image", label);
    const environmentImageDigest = checksum(requiredString(raw, "environment_image_digest", label), `${label}.environment_image_digest`);
    const agentImages = raw.agent_images === undefined ? undefined : taskAgentImages(raw.agent_images, `${label}.agent_images`);
    const verifierImage = requiredString(raw, "verifier_image", label);
    const verifierImageDigest = checksum(requiredString(raw, "verifier_image_digest", label), `${label}.verifier_image_digest`);
    const referencePolaritySha256 = raw.reference_polarity_sha256 === undefined ? undefined : checksum(requiredString(raw, "reference_polarity_sha256", label), `${label}.reference_polarity_sha256`);
    const taskChecksum = checksum(requiredString(raw, "checksum", label), `${label}.checksum`);
    const expectedShape = sourceCategory === "bugfix" ? "bugfix" : "feature";
    if (shape !== expectedShape) throw new ConfigError(`${label}.shape must map DeepSWE source_category ${sourceCategory} to ${expectedShape}`);
    return { id, path, source_task_id: sourceTaskId, language, shape, source_category: sourceCategory, size, timeout_s: timeoutS, expected_minutes: expectedMinutes, upstream_repository: upstreamRepository, upstream_revision: upstreamRevision, workspace_revision: workspaceRevision, environment_image: environmentImage, environment_image_digest: environmentImageDigest, ...(agentImages === undefined ? {} : { agent_images: agentImages }), verifier_image: verifierImage, verifier_image_digest: verifierImageDigest, ...(referencePolaritySha256 === undefined ? {} : { reference_polarity_sha256: referencePolaritySha256 }), checksum: taskChecksum };
  });
  if (new Set(tasks.map((task) => task.id)).size !== tasks.length) throw new ConfigError("DeepSWE manifest contains duplicate task ids");
  if (new Set(tasks.map((task) => task.path)).size !== tasks.length) throw new ConfigError("DeepSWE manifest contains duplicate task paths");
  if (new Set(tasks.map((task) => task.source_task_id)).size !== tasks.length) throw new ConfigError("DeepSWE manifest contains duplicate source task ids");
  validateReviewedTaskIds(review, tasks.map((task) => task.id), "DeepSWE manifest");
  return { version: 1, source_adapter: "deepswe", repository, source_dataset: sourceDataset, revision, license_notes: licenseNotes, review, tasks };
}

/** Validate the fixed S7 composition without imposing it on focused task fixtures. */
export function validateOfficialTaskComposition(tasks: Array<Pick<C2TaskYaml, "language" | "shape" | "size">>): void {
  if (!Array.isArray(tasks) || tasks.length < 8 || tasks.length > 10) {
    throw new ConfigError("official task-pack selection must contain 8 to 10 tasks");
  }
  const languageCounts = new Map<C2TaskYaml["language"], number>();
  for (const task of tasks) languageCounts.set(task.language, (languageCounts.get(task.language) ?? 0) + 1);
  if (languageCounts.get("python") !== 4 || languageCounts.get("typescript") !== 4 || tasks.some((task) => task.language !== "python" && task.language !== "typescript")) {
    throw new ConfigError("official task-pack language composition must contain exactly four Python and four TypeScript tasks");
  }
  for (const size of ["small", "medium"] as const) {
    if (tasks.filter((task) => task.size === size).length < 2) throw new ConfigError(`official task-pack selection must contain at least two ${size} tasks`);
  }
  for (const shape of ["bugfix", "feature", "refactor"] as const) {
    if (!tasks.some((task) => task.shape === shape)) throw new ConfigError(`official task-pack selection must include a ${shape} task`);
  }
}

export function validateOfficialTaskPackSelection(manifest: GitTaskPackManifest, selectedIds: string[]): void {
  if (!/^https:\/\//.test(manifest.repository)) throw new ConfigError("official task-pack repository must use HTTPS");
  if (!Array.isArray(selectedIds) || new Set(selectedIds).size !== selectedIds.length) {
    throw new ConfigError("official task-pack selection contains duplicate task ids");
  }
  const entries = new Map(manifest.tasks.map((task) => [task.id, task]));
  const selected = selectedIds.map((id) => {
    const task = entries.get(id);
    if (task === undefined) throw new ConfigError(`official task-pack selection contains unknown task: ${id}`);
    return task;
  });
  validateOfficialTaskComposition(selected);
}

/** Validate DeepSWE composition without inventing or balancing native categories. */
export function validateOfficialDeepSWESelection(manifest: DeepSWEManifest, selectedIds: string[]): void {
  if (!/^https:\/\//.test(manifest.repository)) throw new ConfigError("official DeepSWE repository must use HTTPS");
  const lineage = manifest.source_dataset.toLowerCase();
  const isSelectedDeepSWEUpstream = lineage === "swe-bench-ultra";
  const isNoncanonicalRestrictedLineage = (lineage.includes("swe-bench") && !isSelectedDeepSWEUpstream)
    || lineage.includes("terminal-bench")
    || lineage.includes("vetta");
  if (isNoncanonicalRestrictedLineage) {
    throw new ConfigError(`official DeepSWE source dataset lineage is forbidden: ${manifest.source_dataset}`);
  }
  if (!Array.isArray(selectedIds) || new Set(selectedIds).size !== selectedIds.length) {
    throw new ConfigError("official DeepSWE selection contains duplicate task ids");
  }
  if (selectedIds.length < 8 || selectedIds.length > 10) {
    throw new ConfigError("official DeepSWE selection must contain 8 to 10 tasks");
  }
  const entries = new Map(manifest.tasks.map((task) => [task.id, task]));
  const selected = selectedIds.map((id) => {
    const task = entries.get(id);
    if (task === undefined) throw new ConfigError(`official DeepSWE selection contains unknown task: ${id}`);
    return task;
  });
  const languageCounts = new Map<C2TaskYaml["language"], number>();
  for (const task of selected) languageCounts.set(task.language, (languageCounts.get(task.language) ?? 0) + 1);
  if ((languageCounts.get("python") ?? 0) < 4 || (languageCounts.get("typescript") ?? 0) < 4 || selected.some((task) => task.language !== "python" && task.language !== "typescript")) {
    throw new ConfigError("official DeepSWE language composition must contain at least four Python and four TypeScript tasks");
  }
  for (const size of ["small", "medium"] as const) {
    if (selected.filter((task) => task.size === size).length < 2) throw new ConfigError(`official DeepSWE selection must contain at least two ${size} tasks`);
  }
}

function validateSourceProvenance(value: unknown): LocalTaskManifest["source_provenance"] {
  if (value === undefined) return undefined;
  if (!isRecord(value)) throw new ConfigError("local task manifest source_provenance must be an object");
  assertKnownKeys(value, ["source_adapter", "repository", "revision", "license_notes", "source_manifest_sha256", "review"], "local task manifest source_provenance");
  if (value.source_adapter !== "git-canonical" && value.source_adapter !== "git-taskpack" && value.source_adapter !== "deepswe") throw new ConfigError("unsupported local task manifest source provenance");
  return {
    source_adapter: value.source_adapter,
    repository: requiredString(value, "repository", "local task manifest source_provenance"),
    revision: fullRevision(requiredString(value, "revision", "local task manifest source_provenance"), "local task manifest source_provenance.revision"),
    license_notes: requiredString(value, "license_notes", "local task manifest source_provenance"),
    source_manifest_sha256: checksum(requiredString(value, "source_manifest_sha256", "local task manifest source_provenance"), "local task manifest source_provenance.source_manifest_sha256"),
    review: sourceReview(value.review, "local task manifest source_provenance.review"),
  };
}

function sourceTaskBinding(value: unknown, label: string): SourceTaskBinding {
  if (!isRecord(value)) throw new ConfigError(`${label} must be an object`);
  assertKnownKeys(value, ["path", "source_task_id", "source_checksum"], label);
  return {
    path: safeRelativePath(requiredString(value, "path", label), `${label}.path`),
    source_task_id: requiredString(value, "source_task_id", label),
    source_checksum: checksum(requiredString(value, "source_checksum", label), `${label}.source_checksum`),
  };
}

function validateTaskSource(value: unknown, label: string): C2TaskYaml["source"] {
  if (!isRecord(value)) throw new ConfigError(`${label} must be an object`);
  assertKnownKeys(value, ["kind", "repository", "revision", "task_id", "license_notes", "base_revision"], label);
  const baseRevision = value.base_revision;
  if (baseRevision !== undefined && (typeof baseRevision !== "string" || !/^[0-9a-f]{40}$/i.test(baseRevision))) {
    throw new ConfigError(`${label}.base_revision must be a full commit SHA when present`);
  }
  return {
    kind: requiredString(value, "kind", label),
    repository: requiredString(value, "repository", label),
    revision: requiredString(value, "revision", label),
    task_id: requiredString(value, "task_id", label),
    license_notes: requiredString(value, "license_notes", label),
    ...(baseRevision === undefined ? {} : { base_revision: baseRevision.toLowerCase() }),
  };
}

function requireDirectory(path: string, label: string): string {
  const absolute = resolve(path);
  try {
    const info = lstatSync(absolute);
    if (info.isSymbolicLink() || !info.isDirectory()) throw new ConfigError(`${label} is not a regular directory: ${absolute}`);
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(`${label} is unavailable: ${absolute}`);
  }
  return absolute;
}

function requireRegularFile(path: string, label: string): string {
  const absolute = resolve(path);
  try {
    const info = lstatSync(absolute);
    if (info.isSymbolicLink() || !info.isFile()) throw new ConfigError(`${label} is not a regular file: ${absolute}`);
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(`${label} is unavailable: ${absolute}`);
  }
  return absolute;
}

function inside(path: string, root: string): boolean {
  const rel = relative(root, path);
  return rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel);
}

function publicFiles(root: string, current = root, files: string[] = []): string[] {
  for (const name of readdirSync(current).sort()) {
    if (name === "reference" && current === root) continue;
    const path = join(current, name);
    const info = lstatSync(path);
    if (info.isSymbolicLink()) {
      safeInTreeFileSymlink(path, root);
      files.push(path);
      continue;
    }
    if (info.isDirectory()) publicFiles(root, path, files);
    else if (info.isFile()) files.push(path);
    else throw new ConfigError(`task source contains a non-regular entry: ${path}`);
  }
  return files;
}

export function taskSourceChecksum(taskDir: string): string {
  const hash = createHash("sha256");
  for (const path of publicFiles(taskDir)) {
    hash.update(relative(taskDir, path).split(sep).join("/"));
    hash.update("\0");
    hash.update(requireFile(path));
    hash.update("\0");
  }
  return `sha256:${hash.digest("hex")}`;
}

const sourceChecksum = taskSourceChecksum;
export const taskPackChecksum = taskSourceChecksum;
const PREPARED_EVIDENCE_DIRECTORIES = new Set(["reference-polarity"]);

function requireFile(path: string): Buffer {
  try {
    const info = lstatSync(path);
    if (!info.isFile() && !info.isSymbolicLink()) throw new ConfigError(`task source file is unavailable: ${path}`);
    return readFileSync(path);
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(`task source file is unavailable: ${path}`);
  }
}

function safeInTreeFileSymlink(path: string, root: string): string {
  let target: string;
  try {
    target = realpathSync(path);
  } catch {
    throw new ConfigError(`task source symlink target is unavailable: ${path}`);
  }
  if (!inside(target, realpathSync(root))) throw new ConfigError(`task source symlink escapes task: ${path}`);
  const targetRelative = relative(realpathSync(root), target);
  if (targetRelative === "reference" || targetRelative.startsWith(`reference${sep}`)) {
    throw new ConfigError(`task source symlink targets private reference material: ${path}`);
  }
  if (targetRelative === ".git" || targetRelative.startsWith(`.git${sep}`)) {
    throw new ConfigError(`task source symlink targets Git metadata: ${path}`);
  }
  let info;
  try {
    info = lstatSync(target);
  } catch {
    throw new ConfigError(`task source symlink target is unavailable: ${path}`);
  }
  if (!info.isFile()) throw new ConfigError(`task source symlink must target a regular file: ${path}`);
  return target;
}

function copyPublicTree(source: string, destination: string, root: string): void {
  const info = lstatSync(source);
  if (info.isSymbolicLink()) {
    const target = safeInTreeFileSymlink(source, root);
    mkdirSync(dirname(destination), { recursive: true });
    const link = readlinkSync(source);
    if (isAbsolute(link)) {
      copyFileSync(target, destination);
      chmodSync(destination, lstatSync(target).mode & 0o7777);
    } else {
      symlinkSync(link, destination);
    }
    return;
  }
  if (info.isDirectory()) {
    mkdirSync(destination, { recursive: true });
    for (const name of readdirSync(source).sort()) {
      if ((name === "reference" && source === root) || name === ".git") continue;
      copyPublicTree(join(source, name), join(destination, name), root);
    }
    chmodSync(destination, info.mode & 0o7777);
    return;
  }
  if (!info.isFile()) throw new ConfigError(`task source contains a non-regular entry: ${source}`);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(source, destination);
  chmodSync(destination, info.mode & 0o7777);
}

const PREPARED_GIT_AUTHOR = "aob-preparation";
const PREPARED_GIT_EMAIL = "aob-preparation@example.invalid";
const PREPARED_GIT_DATE = "2000-01-01T00:00:00Z";
const PREPARED_GIT_MESSAGE = "DeepSWE sanitized upstream base";

function runPreparedGit(workspaceDir: string, args: string[], environment: Record<string, string> = {}): string {
  try {
    const result = spawnSync("git", args, {
      cwd: workspaceDir,
      encoding: "utf8",
      env: { ...process.env, ...environment },
    });
    if (result.error !== undefined || result.status !== 0) {
      const detail = result.error?.message ?? (result.stderr.trim() || `exit ${result.status ?? "unknown"}`);
      throw new ConfigError(`cannot rehydrate prepared Git base: git ${args[0] ?? "command"} failed: ${detail}`);
    }
    return result.stdout.trim();
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(`cannot rehydrate prepared Git base: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/** Recreate the deterministic sanitized base used by DeepSWE preparation. */
function rehydratePreparedGitBase(workspaceDir: string, expectedRevision: string): void {
  runPreparedGit(workspaceDir, ["init", "--quiet"]);
  runPreparedGit(workspaceDir, ["branch", "-M", "main"]);
  runPreparedGit(workspaceDir, ["config", "user.name", PREPARED_GIT_AUTHOR]);
  runPreparedGit(workspaceDir, ["config", "user.email", PREPARED_GIT_EMAIL]);
  runPreparedGit(workspaceDir, ["config", "core.hooksPath", "/dev/null"]);
  runPreparedGit(workspaceDir, ["add", "--all"]);
  runPreparedGit(workspaceDir, ["commit", "--quiet", "--allow-empty", "-m", PREPARED_GIT_MESSAGE], {
    GIT_AUTHOR_NAME: PREPARED_GIT_AUTHOR,
    GIT_AUTHOR_EMAIL: PREPARED_GIT_EMAIL,
    GIT_AUTHOR_DATE: PREPARED_GIT_DATE,
    GIT_COMMITTER_NAME: PREPARED_GIT_AUTHOR,
    GIT_COMMITTER_EMAIL: PREPARED_GIT_EMAIL,
    GIT_COMMITTER_DATE: PREPARED_GIT_DATE,
  });
  const actualRevision = runPreparedGit(workspaceDir, ["rev-parse", "HEAD"]);
  if (actualRevision.toLowerCase() !== expectedRevision.toLowerCase()) {
    throw new ConfigError(`rehydrated Git base ${actualRevision} does not match declared base ${expectedRevision}`);
  }
}

/** Copy an upstream checkout while excluding only its task-root private reference directory. */
export function copyPublicWorkspace(source: string, destination: string): void {
  const root = requireDirectory(source, "public workspace source");
  const target = resolve(destination);
  mkdirSync(target, { recursive: true });
  for (const name of readdirSync(root).sort()) {
    if (name === "reference" || name === ".git") continue;
    copyPublicTree(join(root, name), join(target, name), root);
  }
}

function validateTaskDir(taskDir: string, taskId: string): C2TaskYaml {
  requireDirectory(taskDir, `task ${taskId}`);
  const task = loadTaskYaml(join(taskDir, "task.yaml"));
  if (task.id !== taskId) throw new ConfigError(`task id mismatch: ${task.id} vs ${taskId}`);
  const prompt = requireRegularFile(join(taskDir, "prompt.md"), `task ${taskId} prompt`);
  requireDirectory(join(taskDir, "workspace"), `task ${taskId} workspace`);
  const scriptPath = join(taskDir, "verify.sh");
  const nativePath = join(taskDir, "verifier.json");
  let hasScript = false;
  let hasNative = false;
  try {
    const verifier = lstatSync(scriptPath);
    if (verifier.isSymbolicLink() || !verifier.isFile()) throw new ConfigError(`task ${taskId} verifier is not a regular file`);
    if ((verifier.mode & 0o111) === 0) throw new ConfigError(`task ${taskId} verifier is not executable`);
    hasScript = true;
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
      throw new ConfigError(`task ${taskId} verifier is unavailable: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  try {
    const descriptor = lstatSync(nativePath);
    if (descriptor.isSymbolicLink() || !descriptor.isFile()) throw new ConfigError(`task ${taskId} native verifier is not a regular file`);
    validateVerifierSpec(JSON.parse(readFileSync(nativePath, "utf8")));
    hasNative = true;
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
      throw new ConfigError(`task ${taskId} native verifier is invalid: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (hasScript === hasNative) throw new ConfigError(`task ${taskId} must contain exactly one of verify.sh or verifier.json`);
  return task;
}

function verifierSpecFor(taskDir: string, target: string, taskId: string): VerifierSpec {
  const nativePath = join(taskDir, "verifier.json");
  try {
    const descriptor = validateVerifierSpec(JSON.parse(readFileSync(nativePath, "utf8")));
    if (descriptor.kind !== "docker-command") throw new ConfigError(`task ${taskId} native verifier must be a Docker command`);
    return descriptor;
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
      throw new ConfigError(`task ${taskId} native verifier is invalid: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return { kind: "script", path: join(target, "verify.sh") };
}

function taskEnvironmentFor(target: string, environmentKind: string): TaskEnvironment {
  const environmentPath = join(target, "environment.json");
  try {
    const info = lstatSync(environmentPath);
    if (info.isSymbolicLink() || !info.isFile()) throw new ConfigError("task environment metadata is not a regular file");
    const raw: unknown = JSON.parse(readFileSync(environmentPath, "utf8"));
    if (!isRecord(raw)) throw new ConfigError("task environment metadata must be an object");
    assertKnownKeys(raw, ["agent_images"], "task environment metadata");
    return { kind: environmentKind, network: "disabled", agent_images: taskAgentImages(raw.agent_images, "task environment metadata.agent_images") };
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
      throw new ConfigError(`task environment metadata is invalid: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return { kind: environmentKind, network: "disabled" };
}

function sameTaskAgentImages(expected: Record<string, TaskAgentImage> | undefined, actual: Record<string, TaskAgentImage> | undefined): boolean {
  const expectedTools = expected === undefined ? [] : Object.keys(expected).sort();
  const actualTools = actual === undefined ? [] : Object.keys(actual).sort();
  if (expectedTools.length !== actualTools.length || expectedTools.some((tool, index) => tool !== actualTools[index])) return false;
  return expectedTools.every((tool) => expected?.[tool]?.image === actual?.[tool]?.image && expected?.[tool]?.image_digest === actual?.[tool]?.image_digest);
}

function taskSpec(task: C2TaskYaml, target: string, environmentKind: string): TaskSpec {
  return {
    id: task.id,
    source: task.source,
    workspaceDir: join(target, "workspace"),
    promptFile: join(target, "prompt.md"),
    verifier: verifierSpecFor(target, target, task.id),
    environment: taskEnvironmentFor(target, environmentKind),
    timeoutS: task.timeout_s,
    language: task.language,
    type: task.shape,
    regime: regimeForExpectedMinutes(task.expected_minutes),
    ...(task.source.base_revision === undefined ? {} : { baseRevision: task.source.base_revision }),
  };
}

/** Source boundary for the prepared local C2 tree; private reference material is never copied. */
export class LocalTaskSourceAdapter implements TaskSourceAdapter {
  readonly name = "local-prepared";
  private readonly root: string;

  constructor(root: string) {
    this.root = requireDirectory(root, "task source root");
  }

  async listTasks(): Promise<string[]> {
    try {
      return readdirSync(this.root).filter((name) => {
        if (PREPARED_EVIDENCE_DIRECTORIES.has(name)) return false;
        const info = lstatSync(join(this.root, name));
        if (info.isSymbolicLink()) throw new ConfigError(`task source contains a symlink: ${join(this.root, name)}`);
        return info.isDirectory();
      }).sort();
    } catch (error) {
      if (error instanceof ConfigError) throw error;
      throw new ConfigError(`cannot list task source: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async prepareTask(taskId: string, destination: string): Promise<{ task: TaskSpec; sourceRevision: string; checksum: string }> {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(taskId)) throw new ConfigError(`invalid task id: ${taskId}`);
    const taskDir = resolve(this.root, taskId);
    if (!inside(taskDir, this.root)) throw new ConfigError(`task id escapes source root: ${taskId}`);
    requireDirectory(taskDir, `task ${taskId}`);
    const task = validateTaskDir(taskDir, taskId);
    const target = resolve(destination);
    try {
      const targetInfo = lstatSync(target);
      if (targetInfo.isSymbolicLink() || !targetInfo.isDirectory()) throw new ConfigError(`preparation destination is not a regular directory: ${target}`);
      if (readdirSync(target).length > 0) throw new ConfigError(`preparation destination is not empty: ${target}`);
    } catch (error) {
      if (error instanceof ConfigError) throw error;
      // A missing destination is created by copyPublicTree below.
    }
    copyPublicTree(taskDir, target, taskDir);
    if (task.source.base_revision !== undefined) {
      rehydratePreparedGitBase(join(target, "workspace"), task.source.base_revision);
    }
    const taskSpec = taskSpecFor(task, target);
    return { task: taskSpec, sourceRevision: task.source.revision, checksum: sourceChecksum(taskDir) };
  }
}

// Kept separate from the local adapter's method body so both adapters construct identical C2 task specs.
function taskSpecFor(task: C2TaskYaml, target: string): TaskSpec {
  return taskSpec(task, target, "prepared-local");
}

function requireEmptyDirectory(path: string, label: string): string {
  const absolute = resolve(path);
  try {
    const info = lstatSync(absolute);
    if (info.isSymbolicLink() || !info.isDirectory()) throw new ConfigError(`${label} is not a regular directory: ${absolute}`);
    if (readdirSync(absolute).length > 0) throw new ConfigError(`${label} is not empty: ${absolute}`);
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    mkdirSync(absolute, { recursive: true });
  }
  return absolute;
}

function runGit(args: string[], cwd?: string): string {
  const env: NodeJS.ProcessEnv = { ...process.env };
  for (const key of Object.keys(env)) {
    if (/^GIT_CONFIG_(COUNT|KEY_\d+|VALUE_\d+|PARAMETERS)$/.test(key) ||
      /^(GIT_DIR|GIT_WORK_TREE|GIT_INDEX_FILE|GIT_OBJECT_DIRECTORY|GIT_ALTERNATE_OBJECT_DIRECTORIES|GIT_COMMON_DIR|GIT_NAMESPACE)$/.test(key)) {
      delete env[key];
    }
  }
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    timeout: 120_000,
    env: {
      ...env,
      GIT_TERMINAL_PROMPT: "0",
      GIT_ASKPASS: process.platform === "win32" ? "cmd.exe /c exit 1" : "/usr/bin/false",
      SSH_ASKPASS: process.platform === "win32" ? "cmd.exe /c exit 1" : "/usr/bin/false",
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_CONFIG_SYSTEM: process.platform === "win32" ? "NUL" : "/dev/null",
      GIT_CONFIG_GLOBAL: process.platform === "win32" ? "NUL" : "/dev/null",
      GIT_SSH_COMMAND: "ssh -oBatchMode=yes -oIdentitiesOnly=yes -F /dev/null",
    },
  });
  if (result.error || result.status !== 0) {
    const detail = result.error?.message ?? result.stderr?.trim() ?? `exit ${result.status ?? "unknown"}`;
    throw new ConfigError(`git command failed: ${detail}`);
  }
  return result.stdout.trim();
}

function rejectSymlinkPath(root: string, target: string): void {
  const rel = relative(root, target);
  if (!inside(target, root)) throw new ConfigError(`canonical task path escapes checkout: ${rel}`);
  let current = root;
  for (const part of rel.split(sep)) {
    current = join(current, part);
    const info = lstatSync(current);
    if (info.isSymbolicLink()) throw new ConfigError(`canonical task path contains a symlink: ${current}`);
  }
}

/** Clone a reviewed repository without a shell, then verify that the requested full SHA is checked out. */
export async function checkoutGitTaskSource(manifest: GitCanonicalTaskManifest, checkoutDir: string): Promise<string> {
  const checked = validateGitTaskManifest(manifest);
  const target = requireEmptyDirectory(checkoutDir, "Git checkout directory");
  runGit(["clone", "--no-checkout", "--no-local", checked.repository, target]);
  runGit(["checkout", "--detach", checked.revision], target);
  const actual = fullRevision(runGit(["rev-parse", "HEAD"], target), "checked out revision");
  if (actual !== checked.revision) throw new ConfigError(`checked out revision mismatch: ${actual} vs ${checked.revision}`);
  return target;
}

/** Source boundary for a reviewed Git tree; only manifest-listed C2 tasks may be materialized. */
export class GitCanonicalTaskSourceAdapter implements TaskSourceAdapter {
  readonly name = "git-canonical";
  private readonly root: string;
  private readonly manifest: GitCanonicalTaskManifest;

  constructor(root: string, manifest: GitCanonicalTaskManifest) {
    this.root = requireDirectory(root, "canonical Git checkout");
    this.manifest = validateGitTaskManifest(manifest);
    const actual = fullRevision(runGit(["rev-parse", "HEAD"], this.root), "canonical checkout revision");
    if (actual !== this.manifest.revision) throw new ConfigError(`canonical checkout revision mismatch: ${actual} vs ${this.manifest.revision}`);
  }

  async listTasks(): Promise<string[]> {
    return this.manifest.tasks.map((task) => task.id).sort();
  }

  async prepareTask(taskId: string, destination: string): Promise<{ task: TaskSpec; sourceRevision: string; checksum: string }> {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(taskId)) throw new ConfigError(`invalid task id: ${taskId}`);
    const entry = this.manifest.tasks.find((task) => task.id === taskId);
    if (!entry) throw new ConfigError(`task is not listed in canonical manifest: ${taskId}`);
    const taskDir = resolve(this.root, entry.path);
    rejectSymlinkPath(this.root, taskDir);
    requireDirectory(taskDir, `canonical task ${taskId}`);
    const task = validateTaskDir(taskDir, taskId);
    if (task.source.kind === "local-development") throw new ConfigError(`canonical task ${taskId} has local-development provenance`);
    if (task.source.repository !== this.manifest.repository || task.source.revision !== entry.source_revision ||
      task.source.task_id !== entry.task_id || task.source.license_notes !== this.manifest.license_notes) {
      throw new ConfigError(`canonical task provenance mismatch for ${taskId}`);
    }
    const actualChecksum = sourceChecksum(taskDir);
    if (actualChecksum !== entry.checksum) throw new ConfigError(`canonical task checksum mismatch for ${taskId}`);
    const target = resolve(destination);
    try {
      const info = lstatSync(target);
      if (info.isSymbolicLink() || !info.isDirectory()) throw new ConfigError(`preparation destination is not a regular directory: ${target}`);
      if (readdirSync(target).length > 0) throw new ConfigError(`preparation destination is not empty: ${target}`);
    } catch (error) {
      if (error instanceof ConfigError) throw error;
    }
    copyPublicTree(taskDir, target, taskDir);
    return { task: taskSpec(task, target, "prepared-git"), sourceRevision: task.source.revision, checksum: actualChecksum };
  }
}

function taskPackMetadata(taskDir: string): Record<string, unknown> {
  const metadataPath = requireRegularFile(join(taskDir, "metadata.json"), "task-pack metadata");
  try {
    const value: unknown = JSON.parse(readFileSync(metadataPath, "utf8"));
    if (!isRecord(value)) throw new ConfigError("task-pack metadata must be an object");
    return value;
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(`task-pack metadata is invalid: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function taskPackTestFiles(taskDir: string): { python: string[]; node: string[] } {
  const testsDir = requireDirectory(join(taskDir, "tests"), "task-pack tests");
  const python: string[] = [];
  const node: string[] = [];
  for (const file of publicFiles(testsDir)) {
    const rel = relative(testsDir, file).split(sep).join("/");
    safeRelativePath(rel, "task-pack test file");
    if (file.endsWith(".py")) python.push(rel);
    else if (file.endsWith(".js")) node.push(rel);
    else throw new ConfigError(`task-pack test file has unsupported extension: ${rel}`);
  }
  if (python.length === 0 && node.length === 0) throw new ConfigError("task-pack tests must contain Python or Node test files");
  return { python: python.sort(), node: node.sort() };
}

function taskPackVerifier(taskDir: string, taskId: string): VerifierSpec {
  const path = requireRegularFile(join(taskDir, "verifier.json"), `task-pack task ${taskId} native verifier`);
  let verifier: VerifierSpec;
  try {
    verifier = validateVerifierSpec(JSON.parse(readFileSync(path, "utf8")));
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(`task-pack task ${taskId} native verifier is invalid: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (verifier.kind !== "docker-command") throw new ConfigError(`task-pack task ${taskId} must provide a Docker native verifier`);
  return verifier;
}

function verifyTaskPackShape(taskDir: string, entry: GitTaskPackManifest["tasks"][number]): VerifierSpec {
  requireDirectory(taskDir, `task-pack task ${entry.source_task_id}`);
  requireDirectory(join(taskDir, "repo"), `task-pack task ${entry.source_task_id} repo`);
  requireRegularFile(join(taskDir, "prompt.md"), `task-pack task ${entry.source_task_id} prompt`);
  const metadata = taskPackMetadata(taskDir);
  if (metadata.language !== entry.language && !(entry.source_task_id === "10-fullstack-angular-python" && metadata.language === "python")) {
    throw new ConfigError(`task-pack language mismatch for ${entry.source_task_id}`);
  }
  const tests = taskPackTestFiles(taskDir);
  if (tests.python.length > 0 && !entry.test_runners.includes("python-basic")) throw new ConfigError(`task-pack Python tests are not declared for ${entry.source_task_id}`);
  if (tests.node.length > 0 && !entry.test_runners.includes("node-basic")) throw new ConfigError(`task-pack Node tests are not declared for ${entry.source_task_id}`);
  for (const runner of entry.test_runners) {
    if (runner === "python-basic" && tests.python.length === 0) throw new ConfigError(`task-pack Python runner has no Python tests for ${entry.source_task_id}`);
    if (runner === "node-basic" && tests.node.length === 0) throw new ConfigError(`task-pack Node runner has no Node tests for ${entry.source_task_id}`);
  }
  return taskPackVerifier(taskDir, entry.source_task_id);
}

/** Checks out and prepares the public task-pack layout without exposing held-out tests to an agent. */
export class GitTaskPackSourceAdapter implements TaskSourceAdapter {
  readonly name = "git-taskpack";
  private readonly root: string;
  private readonly manifest: GitTaskPackManifest;

  constructor(root: string, manifest: GitTaskPackManifest) {
    this.root = requireDirectory(root, "task-pack Git checkout");
    this.manifest = validateGitTaskPackManifest(manifest);
    const actual = fullRevision(runGit(["rev-parse", "HEAD"], this.root), "task-pack checkout revision");
    if (actual !== this.manifest.revision) throw new ConfigError(`task-pack checkout revision mismatch: ${actual} vs ${this.manifest.revision}`);
  }

  async listTasks(): Promise<string[]> {
    return this.manifest.tasks.map((task) => task.id).sort();
  }

  async prepareTask(taskId: string, destination: string): Promise<{ task: TaskSpec; sourceRevision: string; checksum: string }> {
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(taskId)) throw new ConfigError(`invalid task id: ${taskId}`);
    const entry = this.manifest.tasks.find((task) => task.id === taskId);
    if (!entry) throw new ConfigError(`task is not listed in task-pack manifest: ${taskId}`);
    const taskDir = resolve(this.root, entry.path);
    rejectSymlinkPath(this.root, taskDir);
    const verifier = verifyTaskPackShape(taskDir, entry);
    const actualChecksum = taskPackChecksum(taskDir);
    if (actualChecksum !== entry.checksum) throw new ConfigError(`task-pack checksum mismatch for ${taskId}`);
    const target = requireEmptyDirectory(destination, "task-pack preparation destination");
    const source: C2TaskYaml["source"] = {
      kind: "public-task-pack",
      repository: this.manifest.repository,
      revision: this.manifest.revision,
      task_id: entry.source_task_id,
      license_notes: this.manifest.license_notes,
    };
    const task: C2TaskYaml = {
      id: entry.id,
      source,
      language: entry.language,
      size: entry.size,
      shape: entry.shape,
      timeout_s: entry.timeout_s,
      expected_minutes: entry.expected_minutes,
      description: readFileSync(join(taskDir, "prompt.md"), "utf8").trim(),
    };
    mkdirSync(target, { recursive: true });
    mkdirSync(join(target, "workspace"), { recursive: true });
    copyPublicTree(join(taskDir, "repo"), join(target, "workspace"), join(taskDir, "repo"));
    writeFileSync(join(target, "prompt.md"), readFileSync(join(taskDir, "prompt.md")));
    writeFileSync(join(target, "task.yaml"), serializeTaskYaml(task));
    writeFileSync(join(target, "verifier.json"), `${JSON.stringify(verifier, null, 2)}\n`);
    return { task: taskSpec(task, target, "prepared-git-taskpack"), sourceRevision: this.manifest.revision, checksum: actualChecksum };
  }
}

function serializeTaskYaml(task: C2TaskYaml): string {
  return [
    `id: ${task.id}`,
    "source:",
    `  kind: ${task.source.kind}`,
    `  repository: ${task.source.repository}`,
    `  revision: ${task.source.revision}`,
    `  task_id: ${task.source.task_id}`,
    `  license_notes: ${task.source.license_notes}`,
    ...(task.source.base_revision === undefined ? [] : [`  base_revision: ${task.source.base_revision}`]),
    `language: ${task.language}`,
    `size: ${task.size}`,
    `shape: ${task.shape}`,
    `timeout_s: ${task.timeout_s}`,
    `expected_minutes: [${task.expected_minutes[0]}, ${task.expected_minutes[1]}]`,
    `description: ${task.description.replaceAll("\n", " ")}`,
    "",
  ].join("\n");
}

export async function checkoutGitTaskPackSource(manifest: GitTaskPackManifest, checkoutDir: string): Promise<string> {
  const checked = validateGitTaskPackManifest(manifest);
  const target = requireEmptyDirectory(checkoutDir, "task-pack Git checkout directory");
  runGit(["clone", "--no-checkout", "--no-local", checked.repository, target]);
  runGit(["checkout", "--detach", checked.revision], target);
  const actual = fullRevision(runGit(["rev-parse", "HEAD"], target), "checked out task-pack revision");
  if (actual !== checked.revision) throw new ConfigError(`checked out task-pack revision mismatch: ${actual} vs ${checked.revision}`);
  return target;
}

export async function prepareGitTaskPack(
  manifest: GitTaskPackManifest,
  checkoutDir: string,
  destinationRoot: string,
  selectedIds?: string[],
): Promise<LocalTaskManifest> {
  const checked = validateGitTaskPackManifest(manifest);
  const checkout = await checkoutGitTaskPackSource(checked, checkoutDir);
  const adapter = new GitTaskPackSourceAdapter(checkout, checked);
  const ids = selectedIds ?? await adapter.listTasks();
  if (new Set(ids).size !== ids.length) throw new ConfigError("selected task ids contain duplicates");
  const output = requireEmptyDirectory(destinationRoot, "prepared task output");
  for (const id of ids) await adapter.prepareTask(id, join(output, id));
  const prepared = await createLocalTaskManifest(output);
  const tasks = prepared.tasks.map((localTask) => {
    const sourceTask = checked.tasks.find((candidate) => candidate.id === localTask.id);
    if (sourceTask === undefined) throw new ConfigError(`prepared task is not present in source manifest: ${localTask.id}`);
    return {
      ...localTask,
      source_binding: {
        path: sourceTask.path,
        source_task_id: sourceTask.source_task_id,
        source_checksum: sourceTask.checksum,
      },
    };
  });
  return {
    ...prepared,
    tasks,
    source_provenance: {
      source_adapter: "git-taskpack",
      repository: checked.repository,
      revision: checked.revision,
      license_notes: checked.license_notes,
      source_manifest_sha256: sourceManifestSha256(checked),
      review: checked.review,
    },
  };
}

export async function prepareGitTasks(
  manifest: GitCanonicalTaskManifest,
  checkoutDir: string,
  destinationRoot: string,
  selectedIds?: string[],
): Promise<LocalTaskManifest> {
  const checked = validateGitTaskManifest(manifest);
  const checkout = await checkoutGitTaskSource(checked, checkoutDir);
  const adapter = new GitCanonicalTaskSourceAdapter(checkout, checked);
  const ids = selectedIds ?? await adapter.listTasks();
  if (new Set(ids).size !== ids.length) throw new ConfigError("selected task ids contain duplicates");
  const output = requireEmptyDirectory(destinationRoot, "prepared task output");
  for (const id of ids) await adapter.prepareTask(id, join(output, id));
  const prepared = await createLocalTaskManifest(output);
  const tasks = prepared.tasks.map((localTask) => {
    const sourceTask = checked.tasks.find((candidate) => candidate.id === localTask.id);
    if (sourceTask === undefined) throw new ConfigError(`prepared task is not present in source manifest: ${localTask.id}`);
    return {
      ...localTask,
      source_binding: {
        path: sourceTask.path,
        source_task_id: sourceTask.task_id,
        source_checksum: sourceTask.checksum,
      },
    };
  });
  return {
    ...prepared,
    tasks,
    source_provenance: {
      source_adapter: "git-canonical",
      repository: checked.repository,
      revision: checked.revision,
      license_notes: checked.license_notes,
      source_manifest_sha256: sourceManifestSha256(checked),
      review: checked.review,
    },
  };
}

export async function createLocalTaskManifest(root: string): Promise<LocalTaskManifest> {
  const adapter = new LocalTaskSourceAdapter(root);
  const tasks: LocalTaskManifest["tasks"] = [];
  for (const id of await adapter.listTasks()) {
    const taskDir = resolve(root, id);
    const task = validateTaskDir(taskDir, id);
    tasks.push({
      id,
      source: task.source,
      checksum: sourceChecksum(taskDir),
      preparation: "copy-task-yaml-prompt-workspace-verifier",
    });
  }
  return { version: 1, source_adapter: "local-prepared", tasks };
}

type ValidatedLocalManifest = {
  provenance: LocalTaskManifest["source_provenance"];
  entries: LocalTaskManifest["tasks"];
};

function parseLocalTaskManifest(value: unknown): ValidatedLocalManifest {
  if (!isRecord(value)) throw new ConfigError("local task manifest must be an object");
  assertKnownKeys(value, ["version", "source_adapter", "source_provenance", "tasks"], "local task manifest");
  if (value.version !== 1 || value.source_adapter !== "local-prepared" || !Array.isArray(value.tasks) || value.tasks.length === 0) {
    throw new ConfigError("local task manifest has an invalid shape");
  }
  const provenance = validateSourceProvenance(value.source_provenance);
  const entries = value.tasks.map((raw, index) => {
    if (!isRecord(raw)) throw new ConfigError(`local task manifest.tasks[${index}] must be an object`);
    const label = `local task manifest.tasks[${index}]`;
    assertKnownKeys(raw, ["id", "source", "checksum", "preparation", "source_binding"], label);
    const id = requiredString(raw, "id", label);
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id)) throw new ConfigError(`invalid task id in manifest: ${id}`);
    const taskSource = validateTaskSource(raw.source, `${label}.source`);
    const preparation = requiredString(raw, "preparation", label);
    if (preparation !== "copy-task-yaml-prompt-workspace-verifier") {
      throw new ConfigError(`unsupported preparation for task ${id}`);
    }
    return {
      id,
      source: taskSource,
      checksum: checksum(requiredString(raw, "checksum", label), `${label}.checksum`),
      preparation: "copy-task-yaml-prompt-workspace-verifier" as const,
      ...(raw.source_binding === undefined ? {} : { source_binding: sourceTaskBinding(raw.source_binding, `${label}.source_binding`) }),
    };
  });
  const ids = entries.map((entry) => entry.id);
  if (new Set(ids).size !== ids.length) throw new ConfigError("local task manifest contains duplicate task ids");
  if (provenance !== undefined) validateReviewedTaskIds(provenance.review, ids, "local task manifest source provenance");
  return { provenance, entries };
}

function validateMaterializedManifestEntry(root: string, entry: LocalTaskManifest["tasks"][number], provenance: LocalTaskManifest["source_provenance"]): void {
  const taskDir = resolve(root, entry.id);
  const task = validateTaskDir(taskDir, entry.id);
  if (provenance !== undefined && entry.source_binding === undefined) {
    throw new ConfigError(`task manifest source binding is missing for ${entry.id}`);
  }
  if (provenance !== undefined && (task.source.kind === "local-development" || task.source.repository !== provenance.repository || task.source.license_notes !== provenance.license_notes ||
    ((provenance.source_adapter === "git-taskpack" || provenance.source_adapter === "deepswe") && (task.source.kind !== "public-task-pack" || task.source.revision !== provenance.revision)))) {
    throw new ConfigError(`task manifest source provenance mismatch for ${entry.id}`);
  }
  const sourceRevisionMismatch = (provenance?.source_adapter === "git-taskpack" || provenance?.source_adapter === "deepswe") && task.source.revision !== provenance.revision;
  if (entry.source_binding !== undefined && (provenance === undefined || task.source.repository !== provenance.repository || sourceRevisionMismatch === true ||
    task.source.task_id !== entry.source_binding.source_task_id || entry.source_binding.path.length === 0)) {
    throw new ConfigError(`task manifest source binding mismatch for ${entry.id}`);
  }
  if (task.source.kind !== entry.source.kind || task.source.repository !== entry.source.repository ||
    task.source.revision !== entry.source.revision || task.source.task_id !== entry.source.task_id ||
    task.source.license_notes !== entry.source.license_notes || sourceChecksum(taskDir) !== entry.checksum) {
    throw new ConfigError(`task manifest checksum or provenance mismatch for ${entry.id}`);
  }
}

function materializedWorkspaceRevision(taskDir: string, taskId: string): string {
  const result = spawnSync("git", ["-C", join(taskDir, "workspace"), "rev-parse", "HEAD"], { encoding: "utf8" });
  const revision = result.status === 0 ? result.stdout.trim() : "";
  if (!/^[0-9a-f]{40}$/i.test(revision)) {
    throw new ConfigError(`DeepSWE task ${taskId} workspace Git HEAD is unavailable or invalid`);
  }
  return revision.toLowerCase();
}

export function validateLocalTaskManifest(root: string, value: unknown): asserts value is LocalTaskManifest {
  const { provenance, entries } = parseLocalTaskManifest(value);
  const expected = new Map(entries.map((entry) => [entry.id, entry]));
  for (const entry of entries) validateMaterializedManifestEntry(root, entry, provenance);
  const taskIds = readdirSync(resolve(root)).filter((id) => {
    if (PREPARED_EVIDENCE_DIRECTORIES.has(id)) return false;
    const info = lstatSync(join(resolve(root), id));
    return info.isDirectory() && !info.isSymbolicLink();
  }).sort();
  if (taskIds.length !== expected.size || taskIds.some((id) => !expected.has(id))) {
    throw new ConfigError("local task manifest task list does not match source root");
  }
}

/** Validate that an official selection is a subset of the reviewed manifest. */
export function validateSelectedLocalTaskManifest(
  root: string,
  manifest: unknown,
  selectedIds: string[],
  sourceManifest?: unknown,
): void {
  const { provenance, entries } = parseLocalTaskManifest(manifest);
  if (!Array.isArray(selectedIds) || selectedIds.some((id) => typeof id !== "string")) {
    throw new ConfigError("selected task ids must be an array of strings");
  }
  if (new Set(selectedIds).size !== selectedIds.length) throw new ConfigError("selected task ids contain duplicates");
  const listed = new Map(entries.map((entry) => [entry.id, entry]));
  for (const id of selectedIds) {
    const entry = listed.get(id);
    if (entry === undefined) throw new ConfigError(`selected task is not listed in local task manifest: ${id}`);
    validateMaterializedManifestEntry(root, entry, provenance);
  }
  if (sourceManifest !== undefined) {
    if (provenance === undefined) throw new ConfigError("source manifest binding requires Git source provenance");
    if (!isRecord(sourceManifest)) throw new ConfigError("original source manifest must be an object");
    const checked = sourceManifest.source_adapter === "git-taskpack"
      ? validateGitTaskPackManifest(sourceManifest)
      : sourceManifest.source_adapter === "deepswe"
        ? validateDeepSWEManifest(sourceManifest)
        : validateGitTaskManifest(sourceManifest);
    if (checked.source_adapter !== provenance.source_adapter || checked.repository !== provenance.repository ||
      checked.revision !== provenance.revision || checked.license_notes !== provenance.license_notes ||
      sourceManifestSha256(checked) !== provenance.source_manifest_sha256 ||
      !reviewsMatch(checked.review, provenance.review)) {
      throw new ConfigError("prepared task manifest is not bound to the original source manifest");
    }
    const sourceEntries = checked.tasks.map((task) => ({
      task,
      path: task.path,
      source_task_id: "source_task_id" in task ? task.source_task_id : task.task_id,
      source_checksum: task.checksum,
      ...(checked.source_adapter === "deepswe" ? { base_revision: (task as DeepSWEManifest["tasks"][number]).workspace_revision } : {}),
    }));
    for (const id of selectedIds) {
      const entry = listed.get(id)!;
      const binding = entry.source_binding;
      const source = binding === undefined ? undefined : sourceEntries.find((candidate) => candidate.path === binding.path && candidate.source_task_id === binding.source_task_id && candidate.source_checksum === binding.source_checksum);
      if (source === undefined || ("base_revision" in source && entry.source.base_revision !== source.base_revision)) {
        throw new ConfigError(`prepared task ${id} is not bound to its original source-manifest entry`);
      }
      if (checked.source_adapter === "deepswe") {
        const task = validateTaskDir(resolve(root, id), id);
        const original = source.task as DeepSWEManifest["tasks"][number];
        if (materializedWorkspaceRevision(resolve(root, id), id) !== original.workspace_revision) {
          throw new ConfigError(`prepared DeepSWE task ${id} workspace Git HEAD does not match its source-manifest revision`);
        }
        if (task.language !== original.language || task.shape !== original.shape || task.size !== original.size ||
          task.timeout_s !== original.timeout_s || task.expected_minutes[0] !== original.expected_minutes[0] || task.expected_minutes[1] !== original.expected_minutes[1]) {
          throw new ConfigError(`prepared DeepSWE task ${id} metadata does not match its original source-manifest entry`);
        }
        const environment = taskEnvironmentFor(resolve(root, id), "disabled");
        if (!sameTaskAgentImages(original.agent_images, environment.agent_images)) {
          throw new ConfigError(`prepared DeepSWE task ${id} agent image environment does not match its original source-manifest entry`);
        }
        const verifier = validateVerifierSpec(JSON.parse(readFileSync(join(resolve(root, id), "verifier.json"), "utf8")));
        if (verifier.kind !== "docker-command" || verifier.image !== original.verifier_image || verifier.image_digest !== original.verifier_image_digest) {
          throw new ConfigError(`prepared DeepSWE task ${id} verifier does not match its original source-manifest entry`);
        }
      }
    }
  }
}
