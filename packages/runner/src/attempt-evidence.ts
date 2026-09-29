import { createHash } from "node:crypto";
import { chmodSync, closeSync, constants, fstatSync, fsyncSync, linkSync, lstatSync, mkdirSync, openSync, readSync, unlinkSync, writeSync, type Stats } from "node:fs";
import { join } from "node:path";
import { ConfigError } from "@aob/contracts";

/** Private source evidence only; never reuse this inventory for public exports. */
export const PRIVATE_ATTEMPT_ARTIFACTS = [
  "run.json", "events.jsonl", "stdout.log", "stderr.log", "tool-events.jsonl", "verify.log",
  "prompt.md", "verifier.json", "verify.sh", "agent-conditions.json", "verifier-conditions.json",
  "execution-conditions.json", "events.jsonl.upstream.jsonl", "candidate.patch", "candidate-evidence.json",
] as const;
type FileEvidence = { status: "missing" } | { status: "preserved"; bytes: number; sha256: string };
export type AttemptEvidenceManifest = { schema_version: 1; attempt: number; files: Record<string, FileEvidence> };
const MANIFEST = "manifest.json";
function stat(path: string): Stats | undefined {
  try { return lstatSync(path); }
  catch (error) { if (error instanceof Error && "code" in error && error.code === "ENOENT") return undefined; throw error; }
}
function regular(path: string): Stats | undefined {
  const info = stat(path);
  if (info && (!info.isFile() || info.isSymbolicLink())) throw new ConfigError(`retry evidence is not a regular file: ${path}`);
  return info;
}
function directory(path: string, create: boolean): void {
  if (!stat(path) && create) mkdirSync(path, { mode: 0o700 });
  const info = stat(path);
  if (!info?.isDirectory() || info.isSymbolicLink()) throw new ConfigError(`invalid retry evidence directory: ${path}`);
  if (create) chmodSync(path, 0o700);
}
function identity(a: Stats, b: Stats): boolean { return a.dev === b.dev && a.ino === b.ino; }

/** Hash and optionally copy with bounded memory, without following a file symlink. */
function stream(path: string, output?: number): FileEvidence & { status: "preserved" } {
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const before = fstatSync(fd);
    if (!before.isFile()) throw new ConfigError(`retry evidence is not a regular file: ${path}`);
    const hash = createHash("sha256"); const buffer = Buffer.alloc(64 * 1024); let bytes = 0;
    for (;;) {
      const count = readSync(fd, buffer, 0, buffer.length, null);
      if (count === 0) break;
      hash.update(buffer.subarray(0, count)); bytes += count;
      if (output !== undefined) {
        let written = 0;
        while (written < count) written += writeSync(output, buffer, written, count - written);
      }
    }
    const after = fstatSync(fd);
    if (before.size !== bytes || before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs) throw new ConfigError(`retry evidence changed while reading: ${path}`);
    return { status: "preserved", bytes, sha256: `sha256:${hash.digest("hex")}` };
  } finally { closeSync(fd); }
}
const same = (a: FileEvidence, b: FileEvidence) => JSON.stringify(a) === JSON.stringify(b);
function bytesEvidence(bytes: Buffer): FileEvidence {
  return { status: "preserved", bytes: bytes.length, sha256: `sha256:${createHash("sha256").update(bytes).digest("hex")}` };
}

/** Recover only our unfinished temporary file, including a crash after link(). */
function recoverPending(destination: string, name: string): void {
  const pending = join(destination, `.pending-${name}`); const info = regular(pending);
  if (!info) return;
  const final = regular(join(destination, name));
  if (info.nlink !== 1 && !(info.nlink === 2 && final && identity(info, final))) throw new ConfigError(`unsafe retry temporary file: ${pending}`);
  unlinkSync(pending);
}
function checkExisting(path: string, expected: FileEvidence): boolean {
  const info = regular(path);
  if (!info) return false;
  if (info.nlink !== 1 || !same(stream(path), expected)) throw new ConfigError(`conflicting retry evidence: ${path}`);
  chmodSync(path, 0o600);
  return true;
}
function publish(destination: string, name: string, expected: FileEvidence, source: string | Buffer): void {
  const final = join(destination, name);
  if (checkExisting(final, expected)) return;
  const pending = join(destination, `.pending-${name}`);
  const fd = openSync(pending, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | constants.O_NOFOLLOW, 0o600);
  try {
    if (typeof source === "string") {
      if (!same(stream(source, fd), expected)) throw new ConfigError(`retry evidence changed before copying: ${source}`);
    } else {
      let offset = 0;
      while (offset < source.length) offset += writeSync(fd, source, offset, source.length - offset);
    }
    fsyncSync(fd);
  } finally { closeSync(fd); }
  // Exclusive publication: link fails if a different writer created the target.
  linkSync(pending, final);
  unlinkSync(pending);
}

/** Caller owns the cell lifecycle; call before persisting failed -> staged. */
export function preserveAttempt(dir: string, attempt: number): void {
  try {
    if (!Number.isSafeInteger(attempt) || attempt < 0) throw new ConfigError("invalid retry attempt index");
    // A failed setup may not have created a cell directory yet.
    if (!stat(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 });
    directory(dir, false);
    const parent = join(dir, ".attempts"); directory(parent, true);
    const destination = join(parent, `attempt-${attempt}`); directory(destination, true);
    for (const name of [...PRIVATE_ATTEMPT_ARTIFACTS, MANIFEST]) recoverPending(destination, name);
    const manifest: AttemptEvidenceManifest = { schema_version: 1, attempt, files: {} };
    for (const name of PRIVATE_ATTEMPT_ARTIFACTS) {
      const source = join(dir, name);
      manifest.files[name] = regular(source) ? stream(source) : { status: "missing" };
    }
    const bytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
    // Check every existing artifact and completed manifest before publishing any.
    checkExisting(join(destination, MANIFEST), bytesEvidence(bytes));
    for (const name of PRIVATE_ATTEMPT_ARTIFACTS) checkExisting(join(destination, name), manifest.files[name]!);
    for (const name of PRIVATE_ATTEMPT_ARTIFACTS) {
      const entry = manifest.files[name]!;
      if (entry.status === "preserved") publish(destination, name, entry, join(dir, name));
    }
    publish(destination, MANIFEST, bytesEvidence(bytes), bytes);
    const fd = openSync(destination, constants.O_RDONLY);
    try { fsyncSync(fd); } finally { closeSync(fd); }
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(`cannot preserve retry evidence: ${error instanceof Error ? error.message : String(error)}`);
  }
}
