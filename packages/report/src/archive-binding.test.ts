import { createHash } from "node:crypto";
import * as fs from "node:fs";
import { mkdirSync, mkdtempSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ConfigError } from "@aob/contracts";
import { describe, expect, it, vi } from "vitest";
import { computePortableArchiveBinding } from "./archive-binding.js";

vi.mock("node:fs", async (importOriginal) => ({ ...await importOriginal<typeof import("node:fs")>() }));

const sha = (character: string) => `sha256:${character.repeat(64)}`;
const sourceBinding = {
  run_ids_sha256: sha("a"),
  results_sha256: sha("b"),
  state_sha256: sha("c"),
  replacement_state_sha256: null,
};

describe("portable archive binding", () => {
  it("hashes large artifacts without whole-file reads and preserves the original manifest digest", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-archive-binding-large-"));
    const payload = Buffer.alloc(2 * 1024 * 1024 + 17);
    for (let i = 0; i < payload.length; i += 1) payload[i] = i % 251;
    const digest = (bytes: string | Buffer) => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
    const expected = digest(JSON.stringify([
      { path: "report/README.md", sha256: digest("") },
      { path: "results/stdout.log", sha256: digest(payload) },
    ]));
    let read: { mockRestore(): void } | undefined;
    try {
      mkdirSync(join(root, "results"));
      mkdirSync(join(root, "report"));
      writeFileSync(join(root, "results", "stdout.log"), payload);
      writeFileSync(join(root, "report", "README.md"), "");
      read = vi.spyOn(fs, "readFileSync").mockImplementation(() => { throw new Error("whole-file reads are forbidden"); });
      expect(computePortableArchiveBinding(root, sourceBinding)).toEqual({
        version: 1, algorithm: "sha256", file_count: 2, manifest_sha256: expected, source_binding: sourceBinding,
      });
    } finally {
      read?.mockRestore();
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("is deterministic, path-sensitive, and changes with sanitized bytes", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-archive-binding-"));
    try {
      mkdirSync(join(root, "results", "cell"), { recursive: true });
      mkdirSync(join(root, "report"), { recursive: true });
      mkdirSync(join(root, "provenance"), { recursive: true });
      writeFileSync(join(root, "results", "cell", "run.json"), "one\n");
      writeFileSync(join(root, "report", "README.md"), "report\n");
      writeFileSync(join(root, "provenance", "runner-state.json"), "state\n");

      const first = computePortableArchiveBinding(root, sourceBinding);
      expect(computePortableArchiveBinding(root, sourceBinding)).toEqual(first);
      expect(first.file_count).toBe(3);
      expect(first.manifest_sha256).toMatch(/^sha256:[0-9a-f]{64}$/);

      writeFileSync(join(root, "results", "cell", "run.json"), "two\n");
      expect(computePortableArchiveBinding(root, sourceBinding).manifest_sha256).not.toBe(first.manifest_sha256);

      writeFileSync(join(root, "results", "cell", "run.json"), "one\n");
      renameSync(join(root, "results", "cell", "run.json"), join(root, "results", "cell", "renamed.json"));
      expect(computePortableArchiveBinding(root, sourceBinding).manifest_sha256).not.toBe(first.manifest_sha256);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("does not depend on filesystem creation order", () => {
    const firstRoot = mkdtempSync(join(tmpdir(), "aob-archive-binding-order-a-"));
    const secondRoot = mkdtempSync(join(tmpdir(), "aob-archive-binding-order-b-"));
    try {
      for (const root of [firstRoot, secondRoot]) {
        mkdirSync(join(root, "results"), { recursive: true });
        mkdirSync(join(root, "report"), { recursive: true });
      }
      writeFileSync(join(firstRoot, "results", "a.json"), "a\n");
      writeFileSync(join(firstRoot, "results", "b.json"), "b\n");
      writeFileSync(join(firstRoot, "report", "README.md"), "report\n");
      writeFileSync(join(secondRoot, "report", "README.md"), "report\n");
      writeFileSync(join(secondRoot, "results", "b.json"), "b\n");
      writeFileSync(join(secondRoot, "results", "a.json"), "a\n");
      expect(computePortableArchiveBinding(secondRoot, sourceBinding)).toEqual(computePortableArchiveBinding(firstRoot, sourceBinding));
    } finally {
      rmSync(firstRoot, { recursive: true, force: true });
      rmSync(secondRoot, { recursive: true, force: true });
    }
  });

  it("excludes its own output and SHA256SUMS from the manifest", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-archive-binding-self-"));
    try {
      mkdirSync(join(root, "results"), { recursive: true });
      mkdirSync(join(root, "report"), { recursive: true });
      mkdirSync(join(root, "provenance"), { recursive: true });
      writeFileSync(join(root, "results", "run.json"), "result\n");
      writeFileSync(join(root, "report", "README.md"), "report\n");
      const before = computePortableArchiveBinding(root, sourceBinding);
      writeFileSync(join(root, "provenance", "archive-binding.json"), "changed self\n");
      writeFileSync(join(root, "SHA256SUMS"), "changed sums\n");
      expect(computePortableArchiveBinding(root, sourceBinding)).toEqual(before);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("rejects symlinks anywhere in a bound subtree", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-archive-binding-link-"));
    try {
      mkdirSync(join(root, "results"), { recursive: true });
      mkdirSync(join(root, "report"), { recursive: true });
      writeFileSync(join(root, "results", "run.json"), "result\n");
      writeFileSync(join(root, "report", "README.md"), "report\n");
      symlinkSync(join(root, "results", "run.json"), join(root, "results", "linked.json"));
      expect(() => computePortableArchiveBinding(root, sourceBinding)).toThrow(/symlink/i);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it.each(["symlink", "directory"])("rejects a file replaced by a %s between inspection and opening", (replacement) => {
    const root = mkdtempSync(join(tmpdir(), "aob-archive-binding-replaced-"));
    const path = join(root, "results", "stdout.log");
    const open = fs.openSync;
    let descriptor: number | undefined;
    let spy: { mockRestore(): void } | undefined;
    try {
      mkdirSync(join(root, "results"));
      mkdirSync(join(root, "report"));
      writeFileSync(path, "original\n");
      writeFileSync(join(root, "other.log"), "outside bound roots\n");
      spy = vi.spyOn(fs, "openSync").mockImplementation((target, flags, mode) => {
        if (target === path) {
          rmSync(path);
          if (replacement === "symlink") symlinkSync(join(root, "other.log"), path);
          else mkdirSync(path);
        }
        const fd = open(target, flags, mode);
        if (target === path) descriptor = fd;
        return fd;
      });
      expect(() => computePortableArchiveBinding(root, sourceBinding)).toThrow(ConfigError);
      if (descriptor !== undefined) expect(() => fs.fstatSync(descriptor!)).toThrow(expect.objectContaining({ code: "EBADF" }));
    } finally {
      spy?.mockRestore();
      rmSync(root, { recursive: true, force: true });
    }
  });

  it("closes the source descriptor and reports a typed error when a block read fails", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-archive-binding-read-error-"));
    let descriptor: number | undefined;
    let spy: { mockRestore(): void } | undefined;
    try {
      mkdirSync(join(root, "results"));
      mkdirSync(join(root, "report"));
      writeFileSync(join(root, "results", "stdout.log"), "fixture\n");
      spy = vi.spyOn(fs, "readSync").mockImplementation((fd) => {
        descriptor = fd;
        throw new Error("fixture read failure");
      });
      expect(() => computePortableArchiveBinding(root, sourceBinding)).toThrow(ConfigError);
      expect(descriptor).toBeDefined();
      expect(() => fs.fstatSync(descriptor!)).toThrow(expect.objectContaining({ code: "EBADF" }));
    } finally {
      spy?.mockRestore();
      rmSync(root, { recursive: true, force: true });
    }
  });
});
