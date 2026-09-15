import { chmodSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { ConfigError } from "@aob/contracts";
import {
  checkoutGitTaskSource,
  checkoutGitTaskPackSource,
  GitTaskPackSourceAdapter,
  createLocalTaskManifest,
  GitCanonicalTaskSourceAdapter,
  prepareGitTasks,
  taskPackChecksum,
  prepareGitTaskPack,
  taskSourceChecksum,
  LocalTaskSourceAdapter,
  validateGitTaskManifest,
  validateGitTaskPackManifest,
  validateDeepSWEManifest,
  validateDeepSWEReferencePolarity,
  sourceManifestSha256,
  validateOfficialDeepSWESelection,
  validateOfficialTaskPackSelection,
  validateLocalTaskManifest,
  validateSelectedLocalTaskManifest,
  validateVerifierSpec,
  copyPublicWorkspace,
} from "./source.js";

const REVIEW_PENDING = {
  source_reviewed: false,
  reference_results_verified: false,
  calibration_complete: false,
  maintainer_signed_off: false,
  reviewer: "unassigned",
  reviewed_at: "pending",
  evidence_file: "plans/s3-public-taskpack-review.json",
  evidence_sha256: "sha256:" + "a".repeat(64),
  reviewed_task_ids: ["canonical-1"],
  calibration_adapters: [],
};
const REVIEW_COMPLETE = {
  source_reviewed: true,
  reference_results_verified: true,
  calibration_complete: true,
  maintainer_signed_off: true,
  reviewer: "maintainer",
  reviewed_at: "2026-08-27T00:00:00Z",
  evidence_file: "plans/s3-public-taskpack-review.json",
  evidence_sha256: "sha256:" + "b".repeat(64),
  reviewed_task_ids: ["canonical-1"],
  calibration_adapters: ["claude-code", "codex"],
  calibration_attestation_file: "calibration-attestation.json",
  calibration_attestation_sha256: "sha256:" + "c".repeat(64),
};

function taskTree(root: string, id = "task-1"): string {
  const dir = join(root, id);
  mkdirSync(join(dir, "workspace"), { recursive: true });
  writeFileSync(join(dir, "task.yaml"), `id: ${id}
source:
  kind: local-development
  repository: agent-overhead-bench
  revision: working-tree
  task_id: ${id}
  license_notes: local fixture
language: python
size: small
shape: bugfix
timeout_s: 60
expected_minutes: [1, 5]
description: test task
`);
  writeFileSync(join(dir, "prompt.md"), "Make the change.\n");
  writeFileSync(join(dir, "verify.sh"), "#!/bin/sh\nexit 1\n");
  chmodSync(join(dir, "verify.sh"), 0o755);
  writeFileSync(join(dir, "workspace", "main.py"), "value = 1\n");
  return dir;
}

function nativeTaskTree(root: string, id = "native-task-1"): string {
  const dir = taskTree(root, id);
  rmSync(join(dir, "verify.sh"));
  writeFileSync(join(dir, "verifier.json"), JSON.stringify({
    kind: "docker-command", image: "aob-native-verifier:s2", image_digest: "sha256:" + "a".repeat(64),
    command: ["npm", "test"], workdir: ".", network: "none",
  }) + "\n");
  return dir;
}

function git(cwd: string, ...args: string[]): string {
  const result = spawnSync("git", args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || `git ${args.join(" ")} failed`);
  return result.stdout.trim();
}

function deterministicWorkspaceRevision(workspace: string): string {
  git(workspace, "init", "--quiet");
  git(workspace, "branch", "-M", "main");
  git(workspace, "config", "user.name", "aob-preparation");
  git(workspace, "config", "user.email", "aob-preparation@example.invalid");
  git(workspace, "config", "core.hooksPath", "/dev/null");
  git(workspace, "add", "--all");
  const result = spawnSync("git", ["commit", "--quiet", "--allow-empty", "-m", "DeepSWE sanitized upstream base"], {
    cwd: workspace,
    encoding: "utf8",
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "aob-preparation",
      GIT_AUTHOR_EMAIL: "aob-preparation@example.invalid",
      GIT_AUTHOR_DATE: "2000-01-01T00:00:00Z",
      GIT_COMMITTER_NAME: "aob-preparation",
      GIT_COMMITTER_EMAIL: "aob-preparation@example.invalid",
      GIT_COMMITTER_DATE: "2000-01-01T00:00:00Z",
    },
  });
  if (result.status !== 0) throw new Error(result.stderr || "deterministic Git commit failed");
  return git(workspace, "rev-parse", "HEAD");
}

async function canonicalRepository(): Promise<{ repository: string; sourceRevision: string; checkoutRevision: string }> {
  const repository = mkdtempSync(join(tmpdir(), "aob-canonical-git-"));
  taskTree(repository, "canonical-1");
  git(repository, "init", "--quiet");
  git(repository, "config", "user.email", "aob@example.invalid");
  git(repository, "config", "user.name", "AOB Test");
  git(repository, "add", ".");
  git(repository, "commit", "--quiet", "-m", "source");
  const sourceRevision = git(repository, "rev-parse", "HEAD");
  const yamlPath = join(repository, "canonical-1", "task.yaml");
  const yaml = readFileSync(yamlPath, "utf8").replace("kind: local-development", "kind: external").replace("revision: working-tree", `revision: ${sourceRevision}`).replace("repository: agent-overhead-bench", `repository: ${repository}`).replace("license_notes: local fixture", "license_notes: test repository");
  writeFileSync(yamlPath, yaml);
  git(repository, "add", ".");
  git(repository, "commit", "--quiet", "-m", "canonical metadata");
  const checkoutRevision = git(repository, "rev-parse", "HEAD");
  return { repository, sourceRevision, checkoutRevision };
}

describe("LocalTaskSourceAdapter", () => {
  it("lists deterministically and prepares a canonical task with checksum", async () => {
    const root = mkdtempSync(join(tmpdir(), "aob-source-"));
    taskTree(root, "z-task");
    taskTree(root, "a-task");
    mkdirSync(join(root, "a-task", "workspace", "docs", "reference"), { recursive: true });
    writeFileSync(join(root, "a-task", "workspace", "docs", "reference", "public.rst"), "public\n");
    writeFileSync(join(root, "a-task", "workspace", "run.sh"), "#!/bin/sh\n");
    chmodSync(join(root, "a-task", "workspace", "run.sh"), 0o755);
    const adapter = new LocalTaskSourceAdapter(root);
    expect(await adapter.listTasks()).toEqual(["a-task", "z-task"]);
    const destination = join(mkdtempSync(join(tmpdir(), "aob-prepared-")), "a-task");
    const prepared = await adapter.prepareTask("a-task", destination);
    expect(prepared.task.id).toBe("a-task");
    expect(prepared.task.workspaceDir).toBe(join(destination, "workspace"));
    expect(prepared.task.verifier).toEqual({ kind: "script", path: join(destination, "verify.sh") });
    expect(prepared.sourceRevision).toBe("working-tree");
    expect(prepared.checksum).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(readFileSync(join(destination, "workspace", "docs", "reference", "public.rst"), "utf8")).toBe("public\n");
    expect(lstatSync(join(destination, "workspace", "run.sh")).mode & 0o111).not.toBe(0);
  });

  it("does not copy private reference material and rejects unknown or symlinked tasks", async () => {
    const root = mkdtempSync(join(tmpdir(), "aob-source-private-"));
    const dir = taskTree(root);
    mkdirSync(join(dir, "reference"));
    writeFileSync(join(dir, "reference", "solution.py"), "secret\n");
    const adapter = new LocalTaskSourceAdapter(root);
    const destination = join(mkdtempSync(join(tmpdir(), "aob-prepared-private-")), "task-1");
    const prepared = await adapter.prepareTask("task-1", destination);
    expect(prepared.task.workspaceDir).toBe(join(destination, "workspace"));
    expect(() => new LocalTaskSourceAdapter(join(root, "missing"))).toThrow(ConfigError);
    await expect(adapter.prepareTask("missing", join(root, "out"))).rejects.toBeInstanceOf(ConfigError);

    const linkedRoot = mkdtempSync(join(tmpdir(), "aob-source-link-"));
    symlinkSync(dir, join(linkedRoot, "task-1"));
    await expect(new LocalTaskSourceAdapter(linkedRoot).listTasks()).rejects.toBeInstanceOf(ConfigError);
  });

  it("rejects a non-empty preparation destination instead of merging stale files", async () => {
    const root = mkdtempSync(join(tmpdir(), "aob-source-stale-"));
    taskTree(root);
    const destination = join(mkdtempSync(join(tmpdir(), "aob-prepared-stale-")), "task-1");
    mkdirSync(destination, { recursive: true });
    writeFileSync(join(destination, "stale.txt"), "must not survive\n");
    await expect(new LocalTaskSourceAdapter(root).prepareTask("task-1", destination)).rejects.toThrow(/destination/i);
  });

  it("preserves safe in-tree file symlinks and rejects links outside the task", async () => {
    const root = mkdtempSync(join(tmpdir(), "aob-source-symlink-file-"));
    const task = taskTree(root);
    symlinkSync("main.py", join(task, "workspace", "LICENSE"));
    const destination = join(mkdtempSync(join(tmpdir(), "aob-prepared-symlink-file-")), "task-1");

    const manifest = await createLocalTaskManifest(root);
    expect(manifest.tasks[0]?.checksum).toMatch(/^sha256:/);
    await new LocalTaskSourceAdapter(root).prepareTask("task-1", destination);
    expect(lstatSync(join(destination, "workspace", "LICENSE")).isSymbolicLink()).toBe(true);
    expect(readFileSync(join(destination, "workspace", "LICENSE"), "utf8")).toBe("value = 1\n");

    symlinkSync("/etc/passwd", join(task, "workspace", "outside"));
    expect(() => taskSourceChecksum(task)).toThrow(/symlink|outside|escape/i);
  });

	it("prepares an immutable native verifier descriptor without requiring verify.sh", async () => {
    const root = mkdtempSync(join(tmpdir(), "aob-native-source-"));
    nativeTaskTree(root);
    const destination = join(mkdtempSync(join(tmpdir(), "aob-native-prepared-")), "native-task-1");
    const prepared = await new LocalTaskSourceAdapter(root).prepareTask("native-task-1", destination);
    expect(prepared.task.verifier).toEqual({
      kind: "docker-command", image: "aob-native-verifier:s2", image_digest: "sha256:" + "a".repeat(64),
      command: ["npm", "test"], workdir: ".", network: "none",
    });
		expect(readFileSync(join(destination, "verifier.json"), "utf8")).toContain("docker-command");
	});

  it("preserves tool-specific prepared agent images from task metadata", async () => {
		const root = mkdtempSync(join(tmpdir(), "aob-source-environment-image-"));
		const task = taskTree(root);
		writeFileSync(join(task, "environment.json"), JSON.stringify({
			agent_images: {
				codex: {image: "aob-task-codex:calibration", image_digest: "sha256:" + "c".repeat(64)},
			},
		}) + "\n");
		const destination = join(mkdtempSync(join(tmpdir(), "aob-prepared-environment-image-")), "task-1");
		const prepared = await new LocalTaskSourceAdapter(root).prepareTask("task-1", destination);
		expect(prepared.task.environment.agent_images?.codex).toEqual({
			image: "aob-task-codex:calibration", image_digest: "sha256:" + "c".repeat(64),
		});
	});

  it("rehydrates the exact prepared DeepSWE Git base for the native verifier", async () => {
    const root = mkdtempSync(join(tmpdir(), "aob-source-git-base-"));
    const task = taskTree(root, "deepswe-task");
    const baseRevision = deterministicWorkspaceRevision(join(task, "workspace"));
    const taskYaml = readFileSync(join(task, "task.yaml"), "utf8").replace(
      "revision: working-tree",
      `revision: prepared-source\n  base_revision: ${baseRevision}`,
    );
    writeFileSync(join(task, "task.yaml"), taskYaml);

    const destination = join(mkdtempSync(join(tmpdir(), "aob-prepared-git-base-")), "deepswe-task");
    const prepared = await new LocalTaskSourceAdapter(root).prepareTask("deepswe-task", destination);
    expect(git(join(destination, "workspace"), "rev-parse", "HEAD")).toBe(baseRevision);

    writeFileSync(join(destination, "workspace", "main.py"), "value = 2\n");
    expect(git(join(destination, "workspace"), "diff", "--binary", baseRevision, "HEAD")).toBe("");
    expect(git(join(destination, "workspace"), "diff", "--binary", baseRevision)).toContain("value = 2");
    expect(prepared.task.baseRevision).toBe(baseRevision);
  });

  it("fails closed when a prepared task declares an unreproducible Git base", async () => {
    const root = mkdtempSync(join(tmpdir(), "aob-source-git-base-invalid-"));
    const task = taskTree(root, "deepswe-invalid");
    const taskYaml = readFileSync(join(task, "task.yaml"), "utf8").replace(
      "revision: working-tree",
      `revision: prepared-source\n  base_revision: ${"f".repeat(40)}`,
    );
    writeFileSync(join(task, "task.yaml"), taskYaml);
    const destination = join(mkdtempSync(join(tmpdir(), "aob-prepared-git-base-invalid-")), "deepswe-invalid");
    await expect(new LocalTaskSourceAdapter(root).prepareTask("deepswe-invalid", destination)).rejects.toBeInstanceOf(ConfigError);
  });

  it("creates and validates a reproducible source manifest", async () => {
    const root = mkdtempSync(join(tmpdir(), "aob-source-manifest-"));
    taskTree(root);
    mkdirSync(join(root, "reference-polarity"));
    writeFileSync(join(root, "reference-polarity", "task-1.json"), "{}\n");
    const manifest = await createLocalTaskManifest(root);
    expect(manifest.version).toBe(1);
    expect(manifest.source_adapter).toBe("local-prepared");
    expect(manifest.tasks[0]?.checksum).toMatch(/^sha256:/);
    expect(() => validateLocalTaskManifest(root, manifest)).not.toThrow();
    const provenance = await createLocalTaskManifest(root);
    provenance.tasks[0]!.source = { ...provenance.tasks[0]!.source, kind: "external", license_notes: "changed" };
    expect(() => validateLocalTaskManifest(root, provenance)).toThrow(/provenance/);
    writeFileSync(join(root, "task-1", "prompt.md"), "changed\n");
    expect(() => validateLocalTaskManifest(root, manifest)).toThrow(/checksum/);
  });

  it("rejects duplicate manifest entries", async () => {
    const root = mkdtempSync(join(tmpdir(), "aob-source-duplicate-"));
    taskTree(root);
    const manifest = await createLocalTaskManifest(root);
    const duplicate = { ...manifest, tasks: [...manifest.tasks, manifest.tasks[0]!] };
    expect(() => validateLocalTaskManifest(root, duplicate)).toThrow(/duplicate/i);
  });

  it("rejects malformed local manifests with typed configuration errors", async () => {
    const root = mkdtempSync(join(tmpdir(), "aob-source-manifest-shape-"));
    taskTree(root);
    const manifest = await createLocalTaskManifest(root);

    expect(() => validateLocalTaskManifest(root, { ...manifest, unexpected: true } as never)).toThrow(ConfigError);
    expect(() => validateLocalTaskManifest(root, {
      ...manifest,
      tasks: [{ ...manifest.tasks[0]!, unexpected: true }],
    } as never)).toThrow(ConfigError);
    expect(() => validateLocalTaskManifest(root, { ...manifest, tasks: [null] } as never)).toThrow(ConfigError);
    expect(() => validateLocalTaskManifest(root, {
      ...manifest,
      tasks: [{ ...manifest.tasks[0]!, source: { kind: "local-development" } }],
    } as never)).toThrow(ConfigError);
  });

  it("rejects an official selection that is absent from the reviewed manifest", async () => {
    const root = mkdtempSync(join(tmpdir(), "aob-source-selection-"));
    taskTree(root, "listed");
    taskTree(root, "unlisted");
    const manifest = await createLocalTaskManifest(root);
    expect(() => validateSelectedLocalTaskManifest(root, manifest, ["listed"])).not.toThrow();
    expect(() => validateSelectedLocalTaskManifest(root, manifest, ["missing"])).toThrow(/not listed/i);
    expect(() => validateSelectedLocalTaskManifest(root, manifest, ["listed", "listed"])).toThrow(/duplicate/i);
  });

  it("validates only selected task contents for a selected-manifest check", async () => {
    const root = mkdtempSync(join(tmpdir(), "aob-source-selected-subset-"));
    taskTree(root, "selected");
    taskTree(root, "unselected");
    const manifest = await createLocalTaskManifest(root);
    writeFileSync(join(root, "unselected", "prompt.md"), "stale unselected input\n");

    expect(() => validateSelectedLocalTaskManifest(root, manifest, ["selected"])).not.toThrow();
    expect(() => validateLocalTaskManifest(root, manifest)).toThrow(/checksum/);
  });

  it("requires provenance review coverage to match the complete local manifest", async () => {
    const root = mkdtempSync(join(tmpdir(), "aob-source-review-coverage-"));
    taskTree(root, "first");
    taskTree(root, "second");
    const manifest = await createLocalTaskManifest(root);
    const provenance = {
      source_adapter: "git-taskpack" as const,
      repository: "https://example.invalid/tasks.git",
      revision: "a".repeat(40),
      license_notes: "MIT fixture",
      source_manifest_sha256: "sha256:" + "c".repeat(64),
      review: { ...REVIEW_PENDING, reviewed_task_ids: ["first"] },
    };
    const withIncompleteReview = { ...manifest, source_provenance: provenance };
    expect(() => validateLocalTaskManifest(root, withIncompleteReview)).toThrow(/reviewed_task_ids/i);
    expect(() => validateSelectedLocalTaskManifest(root, withIncompleteReview, ["first"])).toThrow(/reviewed_task_ids/i);
  });

  it("accepts a selected subset covered by the source review record", async () => {
    const root = mkdtempSync(join(tmpdir(), "aob-source-review-subset-"));
    taskTree(root, "first");
    taskTree(root, "second");
    for (const id of ["first", "second"]) {
      const yamlPath = join(root, id, "task.yaml");
      const yaml = readFileSync(yamlPath, "utf8")
        .replace("kind: local-development", "kind: public-task-pack")
        .replace("repository: agent-overhead-bench", "repository: https://example.invalid/tasks.git")
        .replace("revision: working-tree", `revision: ${"a".repeat(40)}`)
        .replace("task_id: " + id, "task_id: " + id)
        .replace("license_notes: local fixture", "license_notes: MIT fixture");
      writeFileSync(yamlPath, yaml);
    }
    const manifest = await createLocalTaskManifest(root);
    const provenance = {
      source_adapter: "git-taskpack" as const,
      repository: "https://example.invalid/tasks.git",
      revision: "a".repeat(40),
      license_notes: "MIT fixture",
      source_manifest_sha256: "sha256:" + "c".repeat(64),
      review: { ...REVIEW_PENDING, reviewed_task_ids: ["first", "second"] },
    };
    const withCompleteReview = {
      ...manifest,
      source_provenance: provenance,
      tasks: manifest.tasks.map((entry) => ({
        ...entry,
        source_binding: { path: entry.id, source_task_id: entry.source.task_id, source_checksum: "sha256:" + "d".repeat(64) },
      })),
    };
    expect(() => validateSelectedLocalTaskManifest(root, withCompleteReview, ["first"])).not.toThrow();
  });
});

describe("public workspace boundary", () => {
  it("omits root private reference material but preserves nested public reference paths", () => {
    const source = mkdtempSync(join(tmpdir(), "aob-workspace-boundary-source-"));
    const destination = mkdtempSync(join(tmpdir(), "aob-workspace-boundary-destination-"));
    mkdirSync(join(source, "reference"), { recursive: true });
    mkdirSync(join(source, "docs", "reference"), { recursive: true });
    mkdirSync(join(source, "docs", ".git"), { recursive: true });
    mkdirSync(join(source, ".git"), { recursive: true });
    writeFileSync(join(source, "reference", "private.txt"), "held out\n");
    writeFileSync(join(source, "docs", "reference", "public.txt"), "public\n");
    writeFileSync(join(source, "README.md"), "public checkout\n");
    symlinkSync(join(source, "docs", "reference", "public.txt"), join(source, "docs", "public-link.txt"));
    chmodSync(join(source, "docs"), 0o700);

    copyPublicWorkspace(source, destination);

    expect(() => readFileSync(join(destination, "reference", "private.txt"))).toThrow();
    expect(() => lstatSync(join(destination, ".git"))).toThrow();
    expect(() => lstatSync(join(destination, "docs", ".git"))).toThrow();
    expect(readFileSync(join(destination, "docs", "reference", "public.txt"), "utf8")).toBe("public\n");
    expect(readFileSync(join(destination, "docs", "public-link.txt"), "utf8")).toBe("public\n");
    expect(readFileSync(join(destination, "README.md"), "utf8")).toBe("public checkout\n");
    expect(lstatSync(join(destination, "docs")).mode & 0o777).toBe(0o700);
  });

  it("rejects symlinks that target root private reference material", () => {
    const source = mkdtempSync(join(tmpdir(), "aob-workspace-boundary-link-source-"));
    const destination = mkdtempSync(join(tmpdir(), "aob-workspace-boundary-link-destination-"));
    mkdirSync(join(source, "reference"), { recursive: true });
    writeFileSync(join(source, "reference", "private.txt"), "held out\n");
    symlinkSync(join(source, "reference", "private.txt"), join(source, "leak.txt"));
    expect(() => copyPublicWorkspace(source, destination)).toThrow(/private reference/i);
  });

  it("rejects symlinks that target source Git metadata", () => {
    const source = mkdtempSync(join(tmpdir(), "aob-workspace-boundary-git-link-source-"));
    const destination = mkdtempSync(join(tmpdir(), "aob-workspace-boundary-git-link-destination-"));
    mkdirSync(join(source, ".git"), { recursive: true });
    writeFileSync(join(source, ".git", "config"), "private\n");
    symlinkSync(join(source, ".git", "config"), join(source, "git-config-leak"));
    expect(() => copyPublicWorkspace(source, destination)).toThrow(/git metadata/i);
  });
});

describe("VerifierSpec", () => {
  it("validates script and native Docker command descriptors", () => {
    expect(validateVerifierSpec({ kind: "script", path: "/tmp/verify.sh" })).toEqual({ kind: "script", path: "/tmp/verify.sh" });
    expect(validateVerifierSpec({
      kind: "docker-command", image: "aob-verifier:s2", image_digest: "sha256:" + "a".repeat(64),
      command: ["npm", "test", "--", "unit"], workdir: ".", network: "none",
    })).toEqual({
      kind: "docker-command", image: "aob-verifier:s2", image_digest: "sha256:" + "a".repeat(64),
      command: ["npm", "test", "--", "unit"], workdir: ".", network: "none",
    });
    expect(() => validateVerifierSpec({ kind: "docker-command", image: "aob", image_digest: "latest", command: ["test"], workdir: ".", network: "none" })).toThrow(ConfigError);
    expect(() => validateVerifierSpec({ kind: "docker-command", image: "aob", image_digest: "sha256:" + "a".repeat(64), command: ["test"], workdir: "../outside", network: "none" })).toThrow(ConfigError);
    expect(() => validateVerifierSpec({ kind: "docker-command", image: "aob", image_digest: "sha256:" + "a".repeat(64), command: ["test"], workdir: ".", network: "bridge" })).toThrow(ConfigError);
    expect(() => validateVerifierSpec({ kind: "docker-command", image: "aob", image_digest: "sha256:" + "a".repeat(64), command: ["test\0bad"], workdir: ".", network: "none" })).toThrow(ConfigError);
    expect(() => validateVerifierSpec({ kind: "docker-command", image: "aob", image_digest: "sha256:" + "a".repeat(64), command: ["test", ""], workdir: ".", network: "none" })).toThrow(ConfigError);
    expect(() => validateVerifierSpec({ kind: "docker-command", image: "aob", image_digest: "sha256:" + "a".repeat(64), command: ["test"], workdir: "ok\0bad", network: "none" })).toThrow(ConfigError);
  });
});

describe("GitCanonicalTaskSourceAdapter", () => {
  it("checks out an exact revision and prepares only selected public tasks", async () => {
    const source = await canonicalRepository();
    const checkout = join(mkdtempSync(join(tmpdir(), "aob-checkout-")), "repo");
    const output = join(mkdtempSync(join(tmpdir(), "aob-output-")), "tasks");
    const canonicalDir = join(source.repository, "canonical-1");
    mkdirSync(join(canonicalDir, "reference"));
    writeFileSync(join(canonicalDir, "reference", "solution.py"), "private\n");
    git(source.repository, "add", ".");
    git(source.repository, "commit", "--quiet", "-m", "private reference");
    const revisionWithReference = git(source.repository, "rev-parse", "HEAD");
    const manifest = {
      version: 1 as const,
      source_adapter: "git-canonical" as const,
      repository: source.repository,
      revision: revisionWithReference,
      license_notes: "test repository",
      review: REVIEW_COMPLETE,
      tasks: [{
        id: "canonical-1",
        path: "canonical-1",
        task_id: "canonical-1",
        source_revision: source.sourceRevision,
        checksum: "",
      }],
    };
    const checksum = taskSourceChecksum(canonicalDir);
    manifest.tasks[0]!.checksum = checksum;
    validateGitTaskManifest(manifest);
    const prepared = await prepareGitTasks(manifest, checkout, output, ["canonical-1"]);
    expect(prepared.tasks).toHaveLength(1);
    expect(prepared.tasks[0]!.id).toBe("canonical-1");
    expect(prepared.source_provenance?.revision).toBe(revisionWithReference);
    expect(prepared.source_provenance).toMatchObject({ source_manifest_sha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/) });
    expect(prepared.tasks[0]).toMatchObject({
      source_binding: { path: "canonical-1", source_task_id: "canonical-1", source_checksum: checksum },
    });
    expect(readFileSync(join(output, "canonical-1", "prompt.md"), "utf8")).toContain("Make the change.");
    expect(() => readFileSync(join(output, "canonical-1", "reference", "solution.py"))).toThrow();
    expect(git(checkout, "rev-parse", "HEAD")).toBe(revisionWithReference);
    validateLocalTaskManifest(output, prepared);
    expect(() => validateSelectedLocalTaskManifest(output, prepared, ["canonical-1"], manifest)).not.toThrow();
    const changedSource = { ...manifest, tasks: [{ ...manifest.tasks[0]!, checksum: "sha256:" + "f".repeat(64) }] };
    expect(() => validateSelectedLocalTaskManifest(output, prepared, ["canonical-1"], changedSource)).toThrow(/source manifest|binding|checksum/i);
    const changedBinding = { ...prepared, tasks: [{ ...prepared.tasks[0]!, source_binding: { path: "other", source_task_id: "canonical-1", source_checksum: checksum } }] };
    expect(() => validateSelectedLocalTaskManifest(output, changedBinding, ["canonical-1"], manifest)).toThrow(/binding|provenance|source[- ]manifest/i);
    const forgedReview = {
      ...prepared,
      source_provenance: {
        ...prepared.source_provenance!,
        review: { ...prepared.source_provenance!.review, reviewer: "forged-reviewer" },
      },
    };
    expect(() => validateSelectedLocalTaskManifest(output, forgedReview, ["canonical-1"], manifest)).toThrow(/review|source manifest|provenance/i);
    rmSync(source.repository, { recursive: true, force: true });
  });

  it("rejects unsafe or unverified manifests before checkout", async () => {
    const source = await canonicalRepository();
    const base = {
      version: 1 as const,
      source_adapter: "git-canonical" as const,
      repository: source.repository,
      revision: source.checkoutRevision,
      license_notes: "test repository",
      review: REVIEW_PENDING,
      tasks: [{ id: "canonical-1", path: "canonical-1", task_id: "canonical-1", source_revision: source.sourceRevision, checksum: "sha256:" + "a".repeat(64) }],
    };
    expect(() => validateGitTaskManifest({ ...base, review: undefined } as never)).toThrow(ConfigError);
    expect(() => validateGitTaskManifest({ ...base, revision: "short" })).toThrow(ConfigError);
    expect(() => validateGitTaskManifest({ ...base, tasks: [{ ...base.tasks[0]!, path: "../escape" }] })).toThrow(ConfigError);
    expect(() => validateGitTaskManifest({ ...base, tasks: [{ ...base.tasks[0]!, checksum: "sha256:bad" }] })).toThrow(ConfigError);
    const checkout = join(mkdtempSync(join(tmpdir(), "aob-checkout-invalid-")), "repo");
    await expect(checkoutGitTaskSource({ ...base, revision: "short" }, checkout)).rejects.toBeInstanceOf(ConfigError);
    rmSync(source.repository, { recursive: true, force: true });
  });

  it("rejects local-development tasks and checksum/provenance drift", async () => {
    const source = await canonicalRepository();
    const root = join(mkdtempSync(join(tmpdir(), "aob-git-root-")), "repo");
    await checkoutGitTaskSource({
      version: 1,
      source_adapter: "git-canonical",
      repository: source.repository,
      revision: source.checkoutRevision,
      license_notes: "test repository",
      review: REVIEW_PENDING,
      tasks: [{ id: "canonical-1", path: "canonical-1", task_id: "canonical-1", source_revision: source.sourceRevision, checksum: "sha256:" + "a".repeat(64) }],
    }, root).catch(() => undefined);
    const manifest = {
      version: 1 as const,
      source_adapter: "git-canonical" as const,
      repository: source.repository,
      revision: source.checkoutRevision,
      license_notes: "test repository",
      review: REVIEW_COMPLETE,
      tasks: [{ id: "canonical-1", path: "canonical-1", task_id: "canonical-1", source_revision: source.sourceRevision, checksum: "sha256:" + "b".repeat(64) }],
    };
    const adapter = new GitCanonicalTaskSourceAdapter(root, manifest);
    expect(() => new GitCanonicalTaskSourceAdapter(root, { ...manifest, revision: source.sourceRevision })).toThrow(/revision/i);
    symlinkSync(join(root, "canonical-1"), join(root, "linked-task"));
    const linkedAdapter = new GitCanonicalTaskSourceAdapter(root, { ...manifest, tasks: [{ ...manifest.tasks[0]!, path: "linked-task" }] });
    await expect(linkedAdapter.prepareTask("canonical-1", join(mkdtempSync(join(tmpdir(), "aob-prepared-git-link-")), "task"))).rejects.toThrow(/symlink/i);
    const yamlPath = join(root, "canonical-1", "task.yaml");
    writeFileSync(yamlPath, readFileSync(yamlPath, "utf8").replace("kind: external", "kind: local-development"));
    await expect(adapter.prepareTask("canonical-1", join(mkdtempSync(join(tmpdir(), "aob-prepared-git-local-")), "task"))).rejects.toThrow(/local-development/i);
    writeFileSync(yamlPath, readFileSync(yamlPath, "utf8").replace("kind: local-development", "kind: external"));
    await expect(adapter.prepareTask("canonical-1", join(mkdtempSync(join(tmpdir(), "aob-prepared-git-")), "task"))).rejects.toThrow(/checksum|provenance/i);
    rmSync(source.repository, { recursive: true, force: true });
  });

  it("prepares through the no-dependency CLI and writes a runner manifest", async () => {
    const source = await canonicalRepository();
    const checkout = join(mkdtempSync(join(tmpdir(), "aob-cli-checkout-")), "repo");
    const output = join(mkdtempSync(join(tmpdir(), "aob-cli-output-")), "tasks");
    const checksum = taskSourceChecksum(join(source.repository, "canonical-1"));
    const manifestPath = join(mkdtempSync(join(tmpdir(), "aob-cli-manifest-")), "manifest.json");
    writeFileSync(manifestPath, JSON.stringify({
      version: 1,
      source_adapter: "git-canonical",
      repository: source.repository,
      revision: source.checkoutRevision,
      license_notes: "test repository",
      review: REVIEW_COMPLETE,
      tasks: [{ id: "canonical-1", path: "canonical-1", task_id: "canonical-1", source_revision: source.sourceRevision, checksum }],
    }));
    const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "../../..");
    const result = spawnSync(process.execPath, [
      "--experimental-strip-types",
      "--no-warnings",
      "--experimental-loader",
      join(repoRoot, "scripts/ts-source-loader.mjs"),
      join(repoRoot, "packages/tasks/src/source-cli.ts"),
      manifestPath,
      checkout,
      output,
      "canonical-1",
    ], { cwd: repoRoot, encoding: "utf8" });
    expect(result.status, result.stderr).toBe(0);
    const prepared = JSON.parse(readFileSync(join(output, "suite-manifest.json"), "utf8"));
    expect(prepared.source_adapter).toBe("local-prepared");
    expect(prepared.source_provenance?.repository).toBe(source.repository);
    validateLocalTaskManifest(output, prepared);
    const malformed = spawnSync(process.execPath, [
      "--experimental-strip-types",
      "--no-warnings",
      "--experimental-loader",
      join(repoRoot, "scripts/ts-source-loader.mjs"),
      join(repoRoot, "packages/tasks/src/source-cli.ts"),
    ], { cwd: repoRoot, encoding: "utf8" });
    expect(malformed.status).not.toBe(0);
    expect(`${malformed.stdout}${malformed.stderr}`).toMatch(/usage: aob-task-source/i);
    rmSync(source.repository, { recursive: true, force: true });
  });
});

describe("GitTaskPackSourceAdapter", () => {
  it("rejects malformed task-pack manifests before checkout", () => {
    const task = {
      id: "py-small-bugfix-1",
      path: "tasks/pack-1",
      source_task_id: "pack-1",
      language: "python" as const,
      shape: "bugfix" as const,
      size: "small" as const,
      timeout_s: 60,
      expected_minutes: [1, 5] as [number, number],
      test_runners: ["python-basic" as const],
      checksum: "sha256:" + "a".repeat(64),
    };
    const manifest = {
      version: 1 as const,
      source_adapter: "git-taskpack" as const,
      repository: "https://example.invalid/task-pack.git",
      revision: "a".repeat(40),
      license_notes: "MIT fixture",
      review: { ...REVIEW_PENDING, reviewed_task_ids: ["py-small-bugfix-1"] },
      tasks: [task],
    };
    expect(() => validateGitTaskPackManifest(manifest)).not.toThrow();
    expect(() => validateGitTaskPackManifest({ ...manifest, unexpected: true } as never)).toThrow(ConfigError);
    expect(() => validateGitTaskPackManifest({ ...manifest, review: undefined } as never)).toThrow(ConfigError);
    expect(() => validateGitTaskPackManifest({ ...manifest, review: { ...manifest.review, unexpected: true } } as never)).toThrow(ConfigError);
    expect(() => validateGitTaskPackManifest({ ...manifest, review: { ...manifest.review, source_reviewed: "yes" } } as never)).toThrow(ConfigError);
    expect(() => validateGitTaskPackManifest({ ...manifest, review: { ...manifest.review, reviewed_task_ids: ["other"] } } as never)).toThrow(ConfigError);
    expect(() => validateGitTaskPackManifest({ ...manifest, review: { ...manifest.review, calibration_complete: true, calibration_adapters: ["claude-code"] } } as never)).toThrow(ConfigError);
    const { calibration_attestation_file: _attestationFile, calibration_attestation_sha256: _attestationSha256, ...completeWithoutAttestationBase } = REVIEW_COMPLETE;
    const completeWithoutAttestation = { ...completeWithoutAttestationBase, reviewed_task_ids: [task.id] };
    expect(() => validateGitTaskPackManifest({ ...manifest, review: completeWithoutAttestation })).toThrow(/calibration attestation/i);
    expect(() => validateGitTaskPackManifest({ ...manifest, tasks: [{ ...task, path: "../escape" }] })).toThrow(ConfigError);
    expect(() => validateGitTaskPackManifest({ ...manifest, tasks: [{ ...task, test_runners: ["unsupported"] }] } as never)).toThrow(ConfigError);
    expect(() => validateGitTaskPackManifest({ ...manifest, tasks: [{ ...task, checksum: "sha256:bad" }] })).toThrow(ConfigError);
  });

  it("enforces the official public task-pack composition and URL", () => {
    const taskIds = [
      "py-small-bugfix-1", "py-small-feature-1", "py-medium-refactor-1", "py-medium-feature-1",
      "ts-small-bugfix-1", "ts-small-feature-1", "ts-medium-refactor-1", "ts-medium-feature-1",
    ];
    const manifest = validateGitTaskPackManifest({
      version: 1,
      source_adapter: "git-taskpack",
      repository: "https://example.invalid/task-pack.git",
      revision: "a".repeat(40),
      license_notes: "MIT fixture",
      review: { ...REVIEW_COMPLETE, reviewed_task_ids: taskIds },
      tasks: taskIds.map((id, index) => ({
        id,
        path: `tasks/${id}`,
        source_task_id: `source-${index}`,
        language: id.startsWith("py-") ? "python" : "typescript",
        shape: id.includes("bugfix") ? "bugfix" : id.includes("feature") ? "feature" : "refactor",
        size: id.includes("medium") ? "medium" : "small",
        timeout_s: 60,
        expected_minutes: [1, 5],
        test_runners: [id.startsWith("py-") ? "python-basic" : "node-basic"],
        checksum: "sha256:" + "a".repeat(64),
      })),
    });
    expect(() => validateOfficialTaskPackSelection(manifest, taskIds)).not.toThrow();
    expect(() => validateOfficialTaskPackSelection(manifest, taskIds.slice(0, 7))).toThrow(/8.*10|composition/i);
    const wrongLanguage = {
      ...manifest,
      tasks: manifest.tasks.map((task, index) => index === 0 ? { ...task, language: "typescript" as const } : task),
    };
    expect(() => validateOfficialTaskPackSelection(wrongLanguage, taskIds)).toThrow(/language/i);
    expect(() => validateOfficialTaskPackSelection({ ...manifest, repository: "file:///tmp/task-pack" }, taskIds)).toThrow(/https/i);
  });

  it("materializes a public task pack while keeping held-out tests out of the workspace", async () => {
    const repository = mkdtempSync(join(tmpdir(), "aob-task-pack-git-"));
    const taskDir = join(repository, "tasks", "pack-1");
    mkdirSync(join(taskDir, "repo"), { recursive: true });
    mkdirSync(join(taskDir, "repo", "reference"), { recursive: true });
    mkdirSync(join(taskDir, "tests"), { recursive: true });
    writeFileSync(join(taskDir, "metadata.json"), JSON.stringify({ language: "python", category: "bugfix", timeout_seconds: 60 }));
    writeFileSync(join(taskDir, "verifier.json"), JSON.stringify({
      kind: "docker-command", image: "aob-native-verifier:s2", image_digest: "sha256:" + "a".repeat(64),
      command: ["aob-native-verify"], workdir: ".", network: "none",
    }));
    writeFileSync(join(taskDir, "prompt.md"), "Fix the add function.\n");
    writeFileSync(join(taskDir, "repo", "main.py"), "def add(a, b): return a - b\n");
    writeFileSync(join(taskDir, "repo", "reference", "solution.py"), "private solution\n");
    writeFileSync(join(taskDir, "tests", "test_main.py"), "from main import add\ndef test_add():\n    assert add(2, 3) == 5\n");
    git(repository, "init", "--quiet");
    git(repository, "config", "user.email", "aob@example.invalid");
    git(repository, "config", "user.name", "AOB Test");
    git(repository, "add", ".");
    git(repository, "commit", "--quiet", "-m", "task pack");
    const revision = git(repository, "rev-parse", "HEAD");
    const manifest = {
      version: 1 as const,
      source_adapter: "git-taskpack" as const,
      repository,
      revision,
      license_notes: "MIT task-pack fixture",
      review: { ...REVIEW_COMPLETE, reviewed_task_ids: ["py-small-bugfix-1"] },
      tasks: [{
        id: "py-small-bugfix-1",
        path: "tasks/pack-1",
        source_task_id: "pack-1",
        language: "python" as const,
        shape: "bugfix" as const,
        size: "small" as const,
        timeout_s: 60,
        expected_minutes: [1, 5] as [number, number],
        test_runners: ["python-basic" as const],
        checksum: "",
      }],
    };
    manifest.tasks[0]!.checksum = taskPackChecksum(taskDir);
    const checkout = join(mkdtempSync(join(tmpdir(), "aob-task-pack-checkout-")), "repo");
    const output = join(mkdtempSync(join(tmpdir(), "aob-task-pack-output-")), "task");
    const checkedOut = await checkoutGitTaskPackSource(manifest, checkout);
    expect(() => new GitTaskPackSourceAdapter(checkedOut, { ...manifest, revision: "a".repeat(40) })).toThrow(/revision/i);
    const verifierPath = join(checkedOut, "tasks", "pack-1", "verifier.json");
    const verifierContents = readFileSync(verifierPath, "utf8");
    rmSync(verifierPath);
    const missingVerifierAdapter = new GitTaskPackSourceAdapter(checkedOut, manifest);
    await expect(missingVerifierAdapter.prepareTask("py-small-bugfix-1", join(mkdtempSync(join(tmpdir(), "aob-task-pack-no-verifier-")), "task"))).rejects.toThrow(/native verifier/i);
    writeFileSync(verifierPath, verifierContents);
    const adapter = new GitTaskPackSourceAdapter(checkedOut, manifest);
    await expect(adapter.prepareTask("missing", join(mkdtempSync(join(tmpdir(), "aob-task-pack-missing-")), "task"))).rejects.toThrow(/not listed/i);
    const prepared = await adapter.prepareTask("py-small-bugfix-1", output);
    expect(prepared.task.id).toBe("py-small-bugfix-1");
    expect((manifest.review?.source_reviewed)).toBe(true);
    expect(readFileSync(join(output, "prompt.md"), "utf8")).toContain("Fix the add function");
    expect(() => readFileSync(join(output, "workspace", "test_main.py"))).toThrow();
    expect(() => readFileSync(join(output, "workspace", "reference", "solution.py"))).toThrow();
    expect(readFileSync(join(output, "verifier.json"), "utf8")).toContain("docker-command");
    expect(() => readFileSync(join(output, "verify.sh"))).toThrow();
    expect(JSON.parse(readFileSync(join(output, "verifier.json"), "utf8"))).toMatchObject({
      kind: "docker-command", command: ["aob-native-verify"], network: "none",
    });
  });

  it("runs a Node test pack and resolves relative imports from the hidden test location", async () => {
    const repository = mkdtempSync(join(tmpdir(), "aob-node-task-pack-git-"));
    const taskDir = join(repository, "tasks", "pack-1");
    mkdirSync(join(taskDir, "repo"), { recursive: true });
    mkdirSync(join(taskDir, "tests", "unit"), { recursive: true });
    writeFileSync(join(taskDir, "metadata.json"), JSON.stringify({ language: "typescript", category: "feature", timeout_seconds: 60 }));
    writeFileSync(join(taskDir, "verifier.json"), JSON.stringify({
      kind: "docker-command", image: "aob-native-verifier:s2", image_digest: "sha256:" + "a".repeat(64),
      command: ["aob-native-verify"], workdir: ".", network: "none",
    }));
    writeFileSync(join(taskDir, "prompt.md"), "Implement greet.\n");
    writeFileSync(join(taskDir, "repo", "greet.js"), "module.exports = { greet: (name) => 'bye ' + name };\n");
    writeFileSync(join(taskDir, "tests", "unit", "greet.test.js"), `const { greet } = require('../../greet.js');
describe('greet', () => {
  test('returns a greeting', () => {
    expect(greet('Ada')).toBe('hello Ada');
  });
});

`);
    git(repository, "init", "--quiet");
    git(repository, "config", "user.email", "aob@example.invalid");
    git(repository, "config", "user.name", "AOB Test");
    git(repository, "add", ".");
    git(repository, "commit", "--quiet", "-m", "node task pack");
    const revision = git(repository, "rev-parse", "HEAD");
    const manifest = {
      version: 1 as const,
      source_adapter: "git-taskpack" as const,
      repository,
      revision,
      license_notes: "MIT task-pack fixture",
      review: { ...REVIEW_COMPLETE, reviewed_task_ids: ["ts-small-feature-1"] },
      tasks: [{
        id: "ts-small-feature-1",
        path: "tasks/pack-1",
        source_task_id: "pack-1",
        language: "typescript" as const,
        shape: "feature" as const,
        size: "small" as const,
        timeout_s: 60,
        expected_minutes: [1, 5] as [number, number],
        test_runners: ["node-basic" as const],
        checksum: "",
      }],
    };
    manifest.tasks[0]!.checksum = taskPackChecksum(taskDir);
    const checkout = join(mkdtempSync(join(tmpdir(), "aob-node-task-pack-checkout-")), "repo");
    const output = join(mkdtempSync(join(tmpdir(), "aob-node-task-pack-output-")), "task");
    const adapter = new GitTaskPackSourceAdapter(await checkoutGitTaskPackSource(manifest, checkout), manifest);
    await adapter.prepareTask("ts-small-feature-1", output);
    expect(readFileSync(join(output, "verifier.json"), "utf8")).toContain("docker-command");
    expect(() => readFileSync(join(output, "verify.sh"))).toThrow();
    expect(JSON.parse(readFileSync(join(output, "verifier.json"), "utf8"))).toMatchObject({
      kind: "docker-command", command: ["aob-native-verify"], network: "none",
    });
  });
});

describe("DeepSWE source manifest", () => {
  it("exposes a zero-spend diagnostic launcher with safe pinned defaults", () => {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
    const launcher = join(root, "scripts/s3-deepswe-calibration.sh");
    const result = spawnSync("sh", [launcher, "--help"], { cwd: root, encoding: "utf8" });

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("diagnostic");
    expect(result.stdout).toContain("AOB_CALIBRATION_MODEL=z-ai/glm-5.3-flash");
    expect(result.stdout).toContain("--conditions pinned");
    expect(result.stdout).toContain("--mode docker");
    expect(result.stdout).toContain("--cap-usd");

    const source = readFileSync(launcher, "utf8");
    expect(source).toContain('prepare-deepswe-calibration.sh');
    expect(source).toContain('cli-wrapper.mjs');
    expect(source).toContain('--conditions pinned');
    expect(source).toContain('--mode docker');
    expect(source).toContain('deepswe-source-manifest.json');
    expect(source).toContain('OPENROUTER_API_KEY');
    expect(source).not.toContain('source "$ROOT/.env"');
  });

  it("requires an explicit bounded opt-in for the extended DeepSWE regime", () => {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
    const launcher = join(root, "scripts/s3-deepswe-calibration.sh");
    const source = readFileSync(launcher, "utf8");
    expect(source).toContain("AOB_CALIBRATION_REGIME=short");
    expect(source).toContain("AOB_CALIBRATION_TIMEOUT_S=300");
    expect(source).toContain("900");
    expect(source).toContain("long-regime diagnostic");
    expect(source).toContain("10800");
    expect(source).toContain("extended-regime diagnostic");
    const preparation = readFileSync(join(root, "scripts/prepare-deepswe-calibration.sh"), "utf8");
    expect(preparation).toContain("timeout_s: timeoutS");
    expect(preparation).toContain("expected_minutes: durationByTask.get(taskId)");
    expect(readFileSync(join(root, "scripts/s7-preflight.sh"), "utf8")).toContain("validateTaskRegime");
    expect(readFileSync(join(root, "packages/tasks/src/regime.ts"), "utf8")).toContain("long regime requires tasks");
    expect(readFileSync(join(root, "packages/tasks/src/regime.ts"), "utf8")).toContain("extended regime requires tasks");

    const fixture = mkdtempSync(join(tmpdir(), "aob-deepswe-invalid-regime-"));
    const output = join(fixture, "out");
    const checkout = join(fixture, "source");
    mkdirSync(join(checkout, ".git"), { recursive: true });
    try {
    const result = spawnSync("sh", [
      launcher,
      checkout,
      output,
      "psd-tools-blend-range-api",
    ], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, AOB_CALIBRATION_REGIME: "unsupported" },
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/AOB_CALIBRATION_REGIME/);
    expect(result.stderr).not.toMatch(/OPENROUTER_API_KEY is not available/);
    } finally { rmSync(fixture, { recursive: true, force: true }); }
  });

  it("counts newline-separated upstream files when assigning repository size", () => {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
    const script = readFileSync(join(root, "scripts/prepare-deepswe-calibration.sh"), "utf8");

    expect(script).toContain('files.split("\\n").length < 100');
    expect(script).toContain('source_category: readToml(taskId, "category")');
    expect(script).toContain('docker build --pull=false --build-arg "BASE_SHA=$base"');
    expect(script).toContain('npm cache clean --force');
    expect(script).toContain('environment_dockerfile="$WORK/$task_id.environment.Dockerfile"');
    expect(script).toContain('git -C "$checkout" submodule update --init --recursive');
    expect(script).toContain('/^[0-9a-f]{7,40}$/i.test');
    expect(script).toContain('base=$(git -C "$checkout" rev-parse --verify "$base^{commit}"');
    expect(script).toContain('resolved-revisions.tsv');
    expect(script).toContain('upstream_revision: resolvedRevisions.get(taskId)');
    expect(script).toContain('workspace_revision: execFileSync("git", ["-C", workspace, "rev-parse", "HEAD"]');
    expect(script).toContain('git -C "$checkout" branch main "$base"');
    expect(script).toContain('refs/heads/main');
    expect(script).toContain('environment_image_digest: execFileSync("docker", ["image", "inspect"');
    expect(script).toContain('build-deepswe-agent-image.sh');
    expect(script).toContain('environment.json');
    expect(script).toContain('AOB_TASK_TOOLS');
    expect(script).toContain('AOB_TASK_EXPECTED_MINUTES_FILE');
    expect(script).toContain('durationByTask');
    expect(readFileSync(join(root, "scripts/s3-deepswe-calibration.sh"), "utf8")).toContain("AOB_CALIBRATION_EXPECTED_MINUTES_FILE");
    expect(script).toContain('solution/solution.patch');
    expect(readFileSync(join(root, "scripts/deepswe-verifier.Dockerfile"), "utf8")).toContain("pytest<9");
    expect(readFileSync(join(root, "scripts/deepswe-verifier.Dockerfile"), "utf8")).toContain("aob-task-environment-assets");
    expect(readFileSync(join(root, "scripts/deepswe-verifier.Dockerfile"), "utf8")).toContain("[ -f /app/.gitmodules ] && [ -d /app/.git ]");
    expect(readFileSync(join(root, "scripts/deepswe-verifier.Dockerfile"), "utf8")).toContain("GIT_AUTHOR_DATE=2000-01-01T00:00:00Z");
    expect(readFileSync(join(root, "scripts/deepswe-verifier.Dockerfile"), "utf8")).toContain("git -C /app commit --quiet --allow-empty");
    expect(readFileSync(join(root, "scripts/deepswe-verifier.Dockerfile"), "utf8")).toContain("aob-verifier-config.json");
    expect(readFileSync(join(root, "scripts/deepswe-verifier.Dockerfile"), "utf8")).toContain("submodule update --init --recursive");
    expect(readFileSync(join(root, "scripts/deepswe-verifier.Dockerfile"), "utf8")).toContain("/app/node_modules/.bin");
    expect(readFileSync(join(root, "scripts/prepare-deepswe-calibration.sh"), "utf8")).toContain("reward.json");
    expect(readFileSync(join(root, "scripts/prepare-deepswe-calibration.sh"), "utf8")).toContain("data.get('reward') == 1");
    expect(readFileSync(join(root, "scripts/prepare-deepswe-calibration.sh"), "utf8")).toContain("verifier_rc=\\$?");
    expect(readFileSync(join(root, "scripts/prepare-deepswe-calibration.sh"), "utf8")).toContain("for _report in /logs/verifier/*.xml");
    expect(readFileSync(join(root, "scripts/prepare-deepswe-calibration.sh"), "utf8")).toContain("s#/work/workspace/#/app/#g");
    expect(readFileSync(join(root, "scripts/prepare-deepswe-calibration.sh"), "utf8")).toContain('gsub("/app", "/work/workspace")');
    expect(readFileSync(join(root, "scripts/prepare-deepswe-calibration.sh"), "utf8")).toContain("APP_DIR=/work/workspace");
    const preparationScript = readFileSync(join(root, "scripts/prepare-deepswe-calibration.sh"), "utf8");
    expect(preparationScript).toContain('s3-deepswe-review.json');
    expect(preparationScript).toContain('source_dataset: sourceDataset');
    expect(preparationScript).toContain("for _pkg in backend frontend");
    expect(preparationScript).toContain("for _dep in");
    expect(preparationScript).toContain("/app/node_modules/.[!.]*");
    expect(preparationScript).toContain('PYTHONPATH=\\"/work/workspace/src:/work/workspace/tests/tests_helpers:/work/workspace/tests\\${PYTHONPATH:+:\\$PYTHONPATH}\\"');
    expect(preparationScript).toContain('verifier_context="$WORK/verifier-$task_id"');
    expect(preparationScript).toContain("copyPublicWorkspace");
    expect(preparationScript).toContain("taskPackChecksum");
    expect(preparationScript).toContain("cp /opt/aob-verifier-config.json /tmp/aob-verifier-config.json");
    expect(preparationScript).toContain("p=Path('/tmp/aob-verifier-config.json')");
    expect(preparationScript).toContain("git -C \"$destination/workspace\" cat-file -e HEAD:reference");
    expect(preparationScript).toContain("rm -rf /app/reference /app/.git");
    expect(preparationScript).toContain("runDockerVerification");
    expect(preparationScript).toContain("reference-polarity");
    expect(preparationScript).toContain('cpSync(join(output, taskId, "workspace"), referenceWorkspace');
    expect(readFileSync(join(root, "scripts/s7-preflight.sh"), "utf8")).toContain("validateDeepSWEReferencePolarity");
    expect(preparationScript).not.toContain('verifier_context="$WORK/$task_id/verifier"');
    expect(preparationScript).toContain("sed -i.bak 's/bunx vitest/.\\/node_modules\\/.bin\\/vitest/g'");
    expect(preparationScript).not.toContain("NODE_PATH=/opt/aob-task-node-modules");
    expect(preparationScript.indexOf("git clean -fd")).toBeLessThan(preparationScript.indexOf("for _pkg in backend frontend"));
    expect(preparationScript).toContain("deepswe-capture-model-patch.sh");
    expect(preparationScript).toContain("aob-capture-model-patch /app /work/workspace");
    expect(preparationScript).toContain("GIT_AUTHOR_DATE=2000-01-01T00:00:00Z");
    expect(readFileSync(join(root, "scripts/prepare-deepswe-calibration.sh"), "utf8")).toContain("git clean -fd");
    expect(readFileSync(join(root, "scripts/deepswe-capture-model-patch.sh"), "utf8")).toContain("diff --no-ext-diff --binary HEAD");
    expect(readFileSync(join(root, "scripts/deepswe-capture-model-patch.sh"), "utf8")).toContain(":(exclude).aob-codex-home");
    expect(readFileSync(join(root, "scripts/deepswe-capture-model-patch.sh"), "utf8")).toContain(":(exclude).aob-home");
    expect(readFileSync(join(root, "scripts/deepswe-capture-model-patch.sh"), "utf8")).toContain(":(exclude).aob-qwen-home");
  });

  it("rejects unsafe DeepSWE task ids before using them as paths", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-deepswe-id-"));
    mkdirSync(join(root, ".git"));
    const launcher = join(resolve(dirname(fileURLToPath(import.meta.url)), "../../.."), "scripts/prepare-deepswe-calibration.sh");
    const result = spawnSync("sh", [launcher, root, join(root, "output"), "../escape"], { encoding: "utf8" });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/unsafe|task id/i);
    rmSync(root, { recursive: true, force: true });
  });

  it("rejects an unreviewed DeepSWE checkout before task lookup", () => {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
    const source = mkdtempSync(join(tmpdir(), "aob-deepswe-wrong-revision-"));
    const output = join(mkdtempSync(join(tmpdir(), "aob-deepswe-wrong-revision-output-")), "tasks");
    spawnSync("git", ["init", "-q", source], { cwd: root, encoding: "utf8" });
    spawnSync("git", ["-C", source, "config", "user.email", "test@example.invalid"], { cwd: root, encoding: "utf8" });
    spawnSync("git", ["-C", source, "config", "user.name", "AOB Test"], { cwd: root, encoding: "utf8" });
    writeFileSync(join(source, "README.md"), "unreviewed\n");
    spawnSync("git", ["-C", source, "add", "README.md"], { cwd: root, encoding: "utf8" });
    spawnSync("git", ["-C", source, "commit", "-qm", "fixture"], { cwd: root, encoding: "utf8" });
    const result = spawnSync("sh", [join(root, "scripts/prepare-deepswe-calibration.sh"), source, output, "not-a-real-task"], { cwd: root, encoding: "utf8" });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/reviewed DeepSWE revision/i);
    rmSync(source, { recursive: true, force: true });
  });

  it("keeps DeepSWE review evidence in the S7-consumable shape", () => {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
    const evidence = JSON.parse(readFileSync(join(root, "plans/s3-deepswe-review.json"), "utf8")) as {
      source_repository: string;
      source_revision: string;
      reviewer: string;
      reviewed_at: string;
      selected_task_ids: string[];
      calibration_adapters: string[];
      review: Record<string, boolean>;
    };
    expect(evidence.source_repository).toBe("https://github.com/datacurve-ai/deep-swe.git");
    expect(evidence.source_revision).toBe("0b9fabbb63b9104d678fe965e1632f2dd9eaa2ea");
    expect(evidence.reviewer).toBe("tom910");
    expect(evidence.reviewed_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(evidence.selected_task_ids).toHaveLength(8);
    expect(evidence.calibration_adapters).toEqual(["cline", "codex", "hermes", "pi", "qwen"]);
    expect(evidence.review).toEqual({
      source_reviewed: true,
      reference_results_verified: true,
      calibration_complete: true,
      maintainer_signed_off: true,
    });
  });

  it("validates pinned upstream and native category provenance", () => {
    const manifest = {
      version: 1 as const,
      source_adapter: "deepswe" as const,
      repository: "https://github.com/datacurve-ai/deep-swe.git",
      source_dataset: "independent-public-tasks",
      revision: "a".repeat(40),
      license_notes: "DeepSWE review pending",
      review: { ...REVIEW_PENDING, reviewed_task_ids: ["deep-1"] },
      tasks: [{
        id: "deep-1",
        path: "tasks/deep-1",
        source_task_id: "deep-1",
        language: "python" as const,
        shape: "feature" as const,
        source_category: "feature_request" as const,
        size: "small" as const,
        timeout_s: 300,
        expected_minutes: [1, 5] as [number, number],
        upstream_repository: "https://github.com/example/project.git",
        upstream_revision: "b".repeat(40),
        workspace_revision: "b".repeat(40),
        environment_image: "public.ecr.aws/example/base:latest",
        environment_image_digest: "sha256:" + "e".repeat(64),
        verifier_image: "aob-deepswe-deep-1-verifier:calibration",
        verifier_image_digest: "sha256:" + "c".repeat(64),
        checksum: "sha256:" + "d".repeat(64),
      }],
    };
    expect(validateDeepSWEManifest(manifest)).toMatchObject({ source_adapter: "deepswe", tasks: [{ upstream_revision: "b".repeat(40), source_category: "feature_request" }] });
    const { source_dataset: _sourceDataset, ...withoutLineage } = manifest;
    expect(() => validateDeepSWEManifest(withoutLineage)).toThrow(/source_dataset/i);
    expect(() => validateDeepSWEManifest({ ...manifest, tasks: [{ ...manifest.tasks[0], upstream_revision: "short" }] })).toThrow(ConfigError);
    expect(() => validateDeepSWEManifest({ ...manifest, tasks: [{ ...manifest.tasks[0], shape: "bugfix" }] })).toThrow(/shape.*source_category/i);
    expect(() => validateDeepSWEManifest({ ...manifest, unexpected: true } as never)).toThrow(ConfigError);
  });

  it("requires reference polarity evidence to match the prepared verifier", () => {
    const manifest = validateDeepSWEManifest({
      version: 1,
      source_adapter: "deepswe",
      repository: "https://github.com/datacurve-ai/deep-swe.git",
      source_dataset: "independent-public-tasks",
      revision: "a".repeat(40),
      license_notes: "DeepSWE review pending",
      review: { ...REVIEW_PENDING, reviewed_task_ids: ["deep-1"] },
      tasks: [{
        id: "deep-1", path: "tasks/deep-1", source_task_id: "deep-1", language: "python", shape: "feature",
        source_category: "feature_request", size: "small", timeout_s: 300, expected_minutes: [1, 5],
        upstream_repository: "https://github.com/example/project.git", upstream_revision: "b".repeat(40),
        workspace_revision: "b".repeat(40),
        environment_image: "aob-deepswe-deep-1-environment:calibration", environment_image_digest: "sha256:" + "e".repeat(64),
        verifier_image: "aob-deepswe-deep-1-verifier:calibration", verifier_image_digest: "sha256:" + "c".repeat(64), checksum: "sha256:" + "d".repeat(64),
        reference_polarity_sha256: "sha256:" + "b".repeat(64),
      }],
    });
    const task = manifest.tasks[0]!;
    const evidence = {
      version: 1,
      task_id: task.id,
      source_task_checksum: task.checksum,
      verifier_image: task.verifier_image,
      verifier_image_digest: task.verifier_image_digest,
      samples: 5,
      exit_codes: [0, 0, 0, 0, 0],
      reference_passed: true,
    };
    expect(() => validateDeepSWEReferencePolarity(evidence, task)).not.toThrow();
    expect(() => validateDeepSWEReferencePolarity({ ...evidence, verifier_image_digest: "sha256:" + "f".repeat(64) }, task)).toThrow(/verifier/i);
    expect(() => validateDeepSWEReferencePolarity({ ...evidence, exit_codes: [0, 1, 0, 0, 0] }, task)).toThrow(/stable|exit/i);
  });

  it("uses native categories as provenance without requiring category balance", () => {
    const taskIds = ["py-1", "py-2", "py-3", "py-4", "ts-1", "ts-2", "ts-3", "ts-4"];
    const manifest = validateDeepSWEManifest({
      version: 1,
      source_adapter: "deepswe",
      repository: "https://github.com/datacurve-ai/deep-swe.git",
      source_dataset: "independent-public-tasks",
      revision: "a".repeat(40),
      license_notes: "DeepSWE review pending",
      review: { ...REVIEW_PENDING, reviewed_task_ids: taskIds },
      tasks: taskIds.map((id, index) => ({
        id,
        path: `tasks/${id}`,
        source_task_id: id,
        language: index < 4 ? "python" : "typescript",
        shape: index === 0 ? "bugfix" : "feature",
        source_category: index === 0 ? "bugfix" : index === 1 ? "enhancement" : "feature_request",
        size: index < 2 ? "small" : "medium",
        timeout_s: 300,
        expected_minutes: [1, 5],
        upstream_repository: "https://github.com/example/project.git",
        upstream_revision: "b".repeat(40),
        workspace_revision: "b".repeat(40),
        environment_image: "public.ecr.aws/example/base:latest",
        environment_image_digest: "sha256:" + "e".repeat(64),
        verifier_image: `aob-deepswe-${id}-verifier:calibration`,
        verifier_image_digest: "sha256:" + "c".repeat(64),
        checksum: "sha256:" + "d".repeat(64),
      })),
    });
    expect(() => validateOfficialDeepSWESelection(manifest, taskIds)).not.toThrow();
    expect(() => validateOfficialDeepSWESelection({
      ...manifest,
      repository: "https://github.com/datacurve-ai/deep-swe.git",
      source_dataset: "swe-bench-ultra",
    }, taskIds)).not.toThrow();
    expect(() => validateOfficialDeepSWESelection({
      ...manifest,
      repository: "https://github.com/datacurve-ai/deep-swe.git",
      source_dataset: "terminal-bench",
    }, taskIds)).toThrow(/forbidden|terminal-bench/i);
    expect(() => validateOfficialDeepSWESelection({
      ...manifest,
      repository: "https://github.com/datacurve-ai/deep-swe.git",
      source_dataset: "swe-bench-other",
    }, taskIds)).toThrow(/forbidden|swe-bench/i);
    const allFeatureRequests = {
      ...manifest,
      tasks: manifest.tasks.map((task) => ({
        ...task,
        source_category: "feature_request" as const,
        shape: "feature" as const,
      })),
    };
    expect(() => validateOfficialDeepSWESelection(allFeatureRequests, taskIds)).not.toThrow();
    const nineTaskManifest = {
      ...manifest,
      tasks: [...manifest.tasks, { ...manifest.tasks[7]!, id: "ts-5", path: "tasks/ts-5", source_task_id: "ts-5" }],
    };
    expect(() => validateOfficialDeepSWESelection(nineTaskManifest, [...taskIds, "ts-5"])).not.toThrow();
  });

  it("rejects prepared metadata that drifts from the bound DeepSWE entry", async () => {
    const root = mkdtempSync(join(tmpdir(), "aob-deepswe-binding-"));
    const taskDir = nativeTaskTree(root, "deep-1");
    git(join(taskDir, "workspace"), "init", "--quiet");
    git(join(taskDir, "workspace"), "config", "user.email", "aob@example.invalid");
    git(join(taskDir, "workspace"), "config", "user.name", "AOB Test");
    git(join(taskDir, "workspace"), "add", ".");
    git(join(taskDir, "workspace"), "commit", "--quiet", "-m", "base");
    const workspaceRevision = git(join(taskDir, "workspace"), "rev-parse", "HEAD");
    const agentImage = {
      image: "aob-deepswe-deep-1-codex:calibration",
      image_digest: "sha256:" + "f".repeat(64),
    };
    writeFileSync(join(taskDir, "environment.json"), JSON.stringify({ agent_images: { codex: agentImage } }) + "\n");
    const yamlPath = join(taskDir, "task.yaml");
    writeFileSync(yamlPath, readFileSync(yamlPath, "utf8")
      .replace("kind: local-development", "kind: public-task-pack")
      .replace("repository: agent-overhead-bench", "repository: https://github.com/datacurve-ai/deep-swe.git")
      .replace("revision: working-tree", `revision: ${"a".repeat(40)}`)
      .replace("license_notes: local fixture", "license_notes: DeepSWE dataset provenance")
      .replace("  task_id: deep-1", "  task_id: deep-1\n  base_revision: " + workspaceRevision));
    const local = await createLocalTaskManifest(root);
    const checksum = local.tasks[0]!.checksum;
    const source = validateDeepSWEManifest({
      version: 1,
      source_adapter: "deepswe",
      repository: "https://github.com/datacurve-ai/deep-swe.git",
      source_dataset: "independent-public-tasks",
      revision: "a".repeat(40),
      license_notes: "DeepSWE dataset provenance",
      review: { ...REVIEW_PENDING, reviewed_task_ids: ["deep-1"] },
      tasks: [{
        id: "deep-1", path: "tasks/deep-1", source_task_id: "deep-1", language: "python", shape: "bugfix",
        source_category: "bugfix", size: "small", timeout_s: 60, expected_minutes: [1, 5],
        upstream_repository: "https://github.com/example/project.git", upstream_revision: "b".repeat(40),
        workspace_revision: workspaceRevision,
        environment_image: "public.ecr.aws/example/base:latest", environment_image_digest: "sha256:" + "e".repeat(64),
        agent_images: { codex: agentImage },
        verifier_image: "aob-native-verifier:s2", verifier_image_digest: "sha256:" + "a".repeat(64), checksum,
      }],
    });
    const prepared = {
      ...local,
      source_provenance: {
        source_adapter: "deepswe" as const, repository: source.repository, revision: source.revision,
        license_notes: source.license_notes, source_manifest_sha256: sourceManifestSha256(source), review: source.review,
      },
      tasks: local.tasks.map((entry) => ({ ...entry, source_binding: { path: "tasks/deep-1", source_task_id: "deep-1", source_checksum: checksum } })),
    };
    expect(() => validateSelectedLocalTaskManifest(root, prepared, ["deep-1"], source)).not.toThrow();
    writeFileSync(join(taskDir, "environment.json"), JSON.stringify({ agent_images: {
      codex: { ...agentImage, image_digest: "sha256:" + "0".repeat(64) },
    } }) + "\n");
    const environmentDrift = await createLocalTaskManifest(root);
    const environmentDriftPrepared = { ...prepared, tasks: environmentDrift.tasks.map((entry) => ({ ...entry, source_binding: prepared.tasks[0]!.source_binding })) };
    expect(() => validateSelectedLocalTaskManifest(root, environmentDriftPrepared, ["deep-1"], source)).toThrow(/environment.*match|agent image/i);
    writeFileSync(join(taskDir, "environment.json"), JSON.stringify({ agent_images: { codex: agentImage } }) + "\n");
    writeFileSync(yamlPath, readFileSync(yamlPath, "utf8").replace("size: small", "size: medium"));
    const drifted = await createLocalTaskManifest(root);
    const driftedPrepared = { ...prepared, tasks: drifted.tasks.map((entry) => ({ ...entry, source_binding: prepared.tasks[0]!.source_binding })) };
    expect(() => validateSelectedLocalTaskManifest(root, driftedPrepared, ["deep-1"], source)).toThrow(/metadata.*match/i);
  });

  it("rejects a DeepSWE workspace whose Git HEAD drifts from the bound revision", async () => {
    const root = mkdtempSync(join(tmpdir(), "aob-deepswe-head-"));
    const taskDir = nativeTaskTree(root, "deep-head");
    git(join(taskDir, "workspace"), "init", "--quiet");
    git(join(taskDir, "workspace"), "config", "user.email", "aob@example.invalid");
    git(join(taskDir, "workspace"), "config", "user.name", "AOB Test");
    git(join(taskDir, "workspace"), "add", ".");
    git(join(taskDir, "workspace"), "commit", "--quiet", "-m", "base");
    const workspaceRevision = git(join(taskDir, "workspace"), "rev-parse", "HEAD");
    const yamlPath = join(taskDir, "task.yaml");
    writeFileSync(yamlPath, readFileSync(yamlPath, "utf8")
      .replace("kind: local-development", "kind: public-task-pack")
      .replace("repository: agent-overhead-bench", "repository: https://github.com/datacurve-ai/deep-swe.git")
      .replace("revision: working-tree", `revision: ${"a".repeat(40)}`)
      .replace("license_notes: local fixture", "license_notes: DeepSWE dataset provenance")
      .replace("  task_id: deep-head", `  task_id: deep-head\n  base_revision: ${workspaceRevision}`));
    const local = await createLocalTaskManifest(root);
    const checksum = local.tasks[0]!.checksum;
    const source = validateDeepSWEManifest({
      version: 1,
      source_adapter: "deepswe",
      repository: "https://github.com/datacurve-ai/deep-swe.git",
      source_dataset: "swe-bench-ultra",
      revision: "a".repeat(40),
      license_notes: "DeepSWE dataset provenance",
      review: { ...REVIEW_PENDING, reviewed_task_ids: ["deep-head"] },
      tasks: [{
        id: "deep-head", path: "tasks/deep-head", source_task_id: "deep-head", language: "python", shape: "bugfix",
        source_category: "bugfix", size: "small", timeout_s: 60, expected_minutes: [1, 5],
        upstream_repository: "https://github.com/example/project.git", upstream_revision: "b".repeat(40),
        workspace_revision: workspaceRevision,
        environment_image: "aob-environment:calibration", environment_image_digest: "sha256:" + "e".repeat(64),
        verifier_image: "aob-native-verifier:s2", verifier_image_digest: "sha256:" + "a".repeat(64), checksum,
      }],
    });
    const prepared = {
      ...local,
      source_provenance: {
        source_adapter: "deepswe" as const, repository: source.repository, revision: source.revision,
        license_notes: source.license_notes, source_manifest_sha256: sourceManifestSha256(source), review: source.review,
      },
      tasks: local.tasks.map((entry) => ({ ...entry, source_binding: { path: "tasks/deep-head", source_task_id: "deep-head", source_checksum: checksum } })),
    };
    expect(() => validateSelectedLocalTaskManifest(root, prepared, ["deep-head"], source)).not.toThrow();
    writeFileSync(join(taskDir, "workspace", "main.py"), "value = 2\n");
    git(join(taskDir, "workspace"), "add", ".");
    git(join(taskDir, "workspace"), "commit", "--quiet", "-m", "drift");
    const drifted = await createLocalTaskManifest(root);
    const driftedPrepared = {
      ...prepared,
      tasks: drifted.tasks.map((entry) => ({ ...entry, source_binding: prepared.tasks[0]!.source_binding })),
    };
    expect(() => validateSelectedLocalTaskManifest(root, driftedPrepared, ["deep-head"], source)).toThrow(/workspace.*revision|HEAD/i);
  });
});
