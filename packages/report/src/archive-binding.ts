import { createHash } from "node:crypto";
import { closeSync, constants, fstatSync, lstatSync, openSync, readSync, readdirSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { ConfigError } from "@aob/contracts";
import type { ActivityBinding } from "./activity-cli.js";

const BOUND_ROOTS = ["results", "report", "review", "provenance"] as const;
const REQUIRED_ROOTS = new Set<string>(["results", "report"]);
const EXCLUDED_PATHS = new Set(["provenance/archive-binding.json", "SHA256SUMS"]);
const SHA256_PATTERN = /^sha256:[0-9a-f]{64}$/;

type ManifestEntry = {
  path: string;
  sha256: string;
};

export type PortableArchiveBinding = {
  version: 1;
  algorithm: "sha256";
  file_count: number;
  manifest_sha256: string;
  source_binding: ActivityBinding | null;
};

function invalid(message: string): never {
  throw new ConfigError(`Portable archive binding failed: ${message}`);
}

function hash(data: string | Buffer): string {
  return `sha256:${createHash("sha256").update(data).digest("hex")}`;
}

function hashFile(path: string, archivePath: string): string {
  let fd: number | undefined;
  try {
    fd = openSync(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    if (!fstatSync(fd).isFile()) invalid(`non-regular entry is not allowed: ${archivePath}`);
    const digest = createHash("sha256");
    const block = Buffer.allocUnsafe(64 * 1024);
    for (;;) {
      const bytes = readSync(fd, block, 0, block.length, null);
      if (bytes === 0) break;
      digest.update(block.subarray(0, bytes));
    }
    return `sha256:${digest.digest("hex")}`;
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    return invalid(`cannot hash file: ${archivePath}`);
  } finally {
    if (fd !== undefined) {
      try { closeSync(fd); }
      catch { invalid(`cannot close file: ${archivePath}`); }
    }
  }
}

function normalizePath(root: string, path: string): string {
  return relative(root, path).split(sep).join("/");
}

function validateSourceBinding(binding: ActivityBinding | null): ActivityBinding | null {
  if (binding === null) return null;
  for (const key of ["run_ids_sha256", "results_sha256"] as const) {
    if (!SHA256_PATTERN.test(binding[key])) invalid(`source_binding.${key} must be a SHA-256 digest`);
  }
  for (const key of ["state_sha256", "replacement_state_sha256"] as const) {
    if (binding[key] !== null && !SHA256_PATTERN.test(binding[key])) invalid(`source_binding.${key} must be null or a SHA-256 digest`);
  }
  return { ...binding };
}

function collectEntries(packageRoot: string): ManifestEntry[] {
  const entries: ManifestEntry[] = [];

  function visit(path: string): void {
    const info = lstatSync(path);
    const archivePath = normalizePath(packageRoot, path);
    if (info.isSymbolicLink()) invalid(`symlink is not allowed: ${archivePath}`);
    if (info.isDirectory()) {
      for (const name of readdirSync(path).sort((left, right) => left < right ? -1 : left > right ? 1 : 0)) {
        visit(join(path, name));
      }
      return;
    }
    if (!info.isFile()) invalid(`non-regular entry is not allowed: ${archivePath}`);
    if (!EXCLUDED_PATHS.has(archivePath)) entries.push({ path: archivePath, sha256: hashFile(path, archivePath) });
  }

  for (const name of BOUND_ROOTS) {
    const path = join(packageRoot, name);
    try {
      visit(path);
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT" && !REQUIRED_ROOTS.has(name)) continue;
      if (error instanceof ConfigError) throw error;
      invalid(`${name} is unavailable: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return entries.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
}

/** Bind the exact sanitized bytes and relative paths that form a portable release archive. */
export function computePortableArchiveBinding(packageRoot: string, sourceBinding: ActivityBinding | null): PortableArchiveBinding {
  const root = resolve(packageRoot);
  let rootInfo;
  try {
    rootInfo = lstatSync(root);
  } catch (error) {
    invalid(`package root is unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (rootInfo.isSymbolicLink() || !rootInfo.isDirectory()) invalid("package root must be a regular directory");
  const entries = collectEntries(root);
  return {
    version: 1,
    algorithm: "sha256",
    file_count: entries.length,
    manifest_sha256: hash(JSON.stringify(entries)),
    source_binding: validateSourceBinding(sourceBinding),
  };
}
