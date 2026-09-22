import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { chmodSync, closeSync, constants, fstatSync, ftruncateSync, fsyncSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, readSync, readdirSync, readlinkSync, rmSync, symlinkSync, writeFileSync, writeSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ConfigError } from "@aob/contracts";

const MAX_BYTES = 256 * 1024 * 1024;
const MAX_ENTRIES = 100_000;
const CAPTURE_MS = 30_000;
const MAX_PATCH_BYTES = 16 * 1024 * 1024;
const HARNESS_PATHS = [".aob-home", ".aob-codex-home", ".aob-qwen-home", ".aob-pi-home", ".aob-cline-home", ".aob-mock-agent-cli.mjs", "stdout.log", "stderr.log", "tool-events.jsonl"];
type UnavailableReason = "baseline-unavailable" | "candidate-snapshot-unavailable" | "diff-unavailable" | "evidence-write-unavailable";
export type CandidateBaseline = { status: "ready"; directory: string; tree_sha256: string; excluded: string[] } | { status: "unavailable"; reason: "baseline-unavailable" };
export type CandidateEvidence = {
  schema_version: 1; run_id: string; run_sha256: string | null; task_id: string; status: "captured" | "unavailable";
  reason: UnavailableReason | null; prepared_tree_sha256: string | null;
  declared_base_revision: string | null; task_revision: string;
  agent_image_identity: string; verifier_image_identity: string; image_bytes_archived: false;
  projection: "prepared-visible-files-v1"; excluded_root_paths: string[];
  patch: { sha256: string; bytes: number } | null;
};
const sha = (bytes: Buffer | string) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

/** Snapshot file contents, executable modes and link targets, never Git metadata/config.
 * Unsupported file kinds and oversized trees are unavailable, not partial patches.
 */
function snapshot(source: string, destination: string, excluded: readonly string[]): string {
  const root = lstatSync(source);
  if (!root.isDirectory() || root.isSymbolicLink()) throw new ConfigError("candidate source must be a directory");
  const deadline = performance.now() + CAPTURE_MS;
  let totalBytes = 0; let entries = 0;
  const hashes: Array<[string, number, number, string]> = [];
  const visit = (relative: string, depth: number): void => {
    if (depth > 64 || performance.now() > deadline) throw new ConfigError("candidate snapshot limit exceeded");
    mkdirSync(join(destination, relative), { recursive: true, mode: 0o700 });
    for (const name of readdirSync(join(source, relative)).sort()) {
      if (++entries > MAX_ENTRIES || performance.now() > deadline) throw new ConfigError("candidate snapshot limit exceeded");
      if (name === ".git" || (relative === "" && excluded.includes(name))) continue;
      const path = relative === "" ? name : `${relative}/${name}`;
      const input = join(source, path); const output = join(destination, path); const info = lstatSync(input);
      if (info.isSymbolicLink()) {
        const target = readlinkSync(input, { encoding: "buffer" });
        const after = lstatSync(input);
        if (!after.isSymbolicLink() || info.ino !== after.ino || info.dev !== after.dev || info.mtimeMs !== after.mtimeMs || info.ctimeMs !== after.ctimeMs) throw new ConfigError("candidate link changed during capture");
        totalBytes += target.length;
        if (totalBytes > MAX_BYTES) throw new ConfigError("candidate snapshot limit exceeded");
        // Never dereference the target, including absolute/outside/dangling links.
        symlinkSync(target, output);
        hashes.push([path, 120000, target.length, sha(target)]);
        continue;
      }
      if (info.isDirectory()) { visit(path, depth + 1); continue; }
      if (!info.isFile() || info.size > MAX_BYTES - totalBytes) throw new ConfigError("candidate file capture unavailable");
      const fd = openSync(input, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
      try {
        const before = fstatSync(fd);
        if (!before.isFile() || before.ino !== info.ino || before.dev !== info.dev || before.size !== info.size) throw new ConfigError("candidate changed during capture");
        const out = openSync(output, "wx", 0o600);
        const digest = createHash("sha256"); let bytes = 0;
        try {
          const buffer = Buffer.alloc(64 * 1024);
          for (;;) {
            if (performance.now() > deadline) throw new ConfigError("candidate snapshot limit exceeded");
            const count = readSync(fd, buffer, 0, buffer.length, null);
            if (count === 0) break;
            bytes += count; totalBytes += count;
            if (totalBytes > MAX_BYTES) throw new ConfigError("candidate snapshot limit exceeded");
            digest.update(buffer.subarray(0, count));
            let written = 0;
            while (written < count) written += writeSync(out, buffer, written, count - written);
          }
        } finally { closeSync(out); }
        const after = fstatSync(fd);
        if (bytes !== before.size || before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs) throw new ConfigError("candidate changed during capture");
        const executable = info.mode & 0o111 ? 1 : 0;
        chmodSync(output, executable ? 0o700 : 0o600);
        hashes.push([path, executable ? 100755 : 100644, bytes, `sha256:${digest.digest("hex")}`]);
      } finally { closeSync(fd); }
    }
  };
  visit("", 0);
  return sha(JSON.stringify(hashes));
}

/** Called after staging, before the adapter can modify files or Git history. */
export function prepareCandidateBaseline(workspace: string): CandidateBaseline {
  let directory: string | undefined;
  try {
    directory = mkdtempSync(join(tmpdir(), "aob-candidate-"));
    chmodSync(directory, 0o700);
    const present = new Set(readdirSync(workspace));
    const excluded = HARNESS_PATHS.filter(name => !present.has(name));
    return { status: "ready", directory, excluded, tree_sha256: snapshot(workspace, join(directory, "a"), excluded) };
  } catch {
    if (directory !== undefined) { try { rmSync(directory, { recursive: true, force: true }); } catch { /* Capture cannot change the task outcome. */ } }
    return { status: "unavailable", reason: "baseline-unavailable" };
  }
}
export function releaseCandidateBaseline(baseline: CandidateBaseline): void {
  if (baseline.status === "ready") { try { rmSync(baseline.directory, { recursive: true, force: true }); } catch { /* Private temporary evidence stays private if cleanup fails. */ } }
}

/** Observe after the adapter's measured interval and before any verifier runs.
 * A capture/storage failure must not turn a native task outcome into a new failure.
 */
export function captureCandidate(input: {
  dir: string; workspace: string; baseline: CandidateBaseline; runId: string; taskId: string;
  baseRevision: string | null; taskRevision: string; agentImage: string; verifierImage: string;
}): CandidateEvidence {
  const baseline = input.baseline;
  let evidence: CandidateEvidence = {
    schema_version: 1, run_id: input.runId, run_sha256: null, task_id: input.taskId, status: "unavailable",
    reason: "baseline-unavailable", prepared_tree_sha256: baseline.status === "ready" ? baseline.tree_sha256 : null,
    declared_base_revision: input.baseRevision, task_revision: input.taskRevision,
    agent_image_identity: input.agentImage, verifier_image_identity: input.verifierImage, image_bytes_archived: false,
    projection: "prepared-visible-files-v1", excluded_root_paths: baseline.status === "ready" ? baseline.excluded : [], patch: null,
  };
  let patch: Buffer | undefined;
  if (baseline.status === "ready") {
    try {
      evidence.reason = "candidate-snapshot-unavailable";
      snapshot(input.workspace, join(baseline.directory, "b"), baseline.excluded);
      evidence.reason = "diff-unavailable";
      // No inherited credentials, Git variables, user configuration, external diff,
      // textconv, hooks or candidate refs. Snapshots contain no .git directories.
      const diff = spawnSync("git", ["-c", "core.attributesFile=/dev/null", "diff", "--no-index", "--binary", "--no-ext-diff", "--no-textconv", "--no-renames", "--no-prefix", "--", "a", "b"], {
        cwd: baseline.directory, timeout: CAPTURE_MS, killSignal: "SIGKILL", maxBuffer: MAX_PATCH_BYTES,
        env: { PATH: "/usr/bin:/bin", HOME: baseline.directory, LC_ALL: "C", GIT_CONFIG_NOSYSTEM: "1", GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_SYSTEM: "/dev/null", GIT_ATTR_NOSYSTEM: "1", GIT_TERMINAL_PROMPT: "0" },
      });
      if (diff.error || (diff.status !== 0 && diff.status !== 1) || diff.signal || diff.stdout.length > MAX_PATCH_BYTES) throw new ConfigError("candidate diff unavailable");
      patch = diff.stdout;
      evidence = { ...evidence, status: "captured", reason: null, patch: { sha256: sha(patch), bytes: patch.length } };
    } catch { /* Keep the bounded, non-sensitive unavailable reason; no empty patch. */ }
  }
  let wrotePatch = false;
  try {
    if (patch !== undefined) { writeFileSync(join(input.dir, "candidate.patch"), patch, { flag: "wx", mode: 0o600 }); wrotePatch = true; }
    writeFileSync(join(input.dir, "candidate-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, { flag: "wx", mode: 0o600 });
  } catch {
    if (wrotePatch) { try { rmSync(join(input.dir, "candidate.patch")); } catch { /* Do not replace the native outcome. */ } }
    evidence = { ...evidence, status: "unavailable", reason: "evidence-write-unavailable", patch: null };
    try { writeFileSync(join(input.dir, "candidate-evidence.json"), `${JSON.stringify(evidence, null, 2)}\n`, { flag: "wx", mode: 0o600 }); } catch { /* Storage failure may also prevent its own evidence record. */ }
  }
  return evidence;
}


/** Finalize only our unchanged private record after the exact C4 bytes exist.
 * No C4 (or failed finalization) leaves an explicit null binding; never changes C4.
 */
export function bindCandidateToRun(dir: string, evidence: CandidateEvidence, runBytes: Buffer): void {
  let fd: number | undefined;
  try {
    if (JSON.parse(runBytes.toString("utf8")).run_id !== evidence.run_id) return;
    fd = openSync(join(dir, "candidate-evidence.json"), constants.O_RDWR | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    const info = fstatSync(fd);
    if (!info.isFile() || info.nlink !== 1 || info.size > 16 * 1024) return;
    if (JSON.stringify(JSON.parse(readFileSync(fd, "utf8"))) !== JSON.stringify(evidence)) return;
    if (evidence.patch !== null) {
      const patchFd = openSync(join(dir, "candidate.patch"), constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
      try {
        const patchInfo = fstatSync(patchFd);
        if (!patchInfo.isFile() || patchInfo.size !== evidence.patch.bytes || patchInfo.size > MAX_PATCH_BYTES || sha(readFileSync(patchFd)) !== evidence.patch.sha256) return;
      } finally { closeSync(patchFd); }
    }
    const bytes = Buffer.from(`${JSON.stringify({ ...evidence, run_sha256: sha(runBytes) }, null, 2)}\n`);
    let written = 0;
    while (written < bytes.length) written += writeSync(fd, bytes, written, bytes.length - written, written);
    ftruncateSync(fd, bytes.length); fsyncSync(fd);
  } catch { /* Missing/broken private evidence cannot change the native task result. */ }
  finally { if (fd !== undefined) { try { closeSync(fd); } catch { /* Keep C4 outcome. */ } } }
}
