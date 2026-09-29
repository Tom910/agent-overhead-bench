import { createHash } from "node:crypto";
import { chmodSync, existsSync, linkSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, expect, it } from "vitest";
import { ConfigError } from "@aob/contracts";
import { preserveAttempt } from "./attempt-evidence.js";
import { stageTask } from "./cell.js";

const roots: string[] = [];
const fixture = () => { const dir = mkdtempSync(join(tmpdir(), "aob-retain-")); roots.push(dir); return dir; };
afterEach(() => { for (const dir of roots.splice(0)) rmSync(dir, { recursive: true, force: true }); });
const archived = (dir: string, name: string) => join(dir, ".attempts", "attempt-0", name);

it("keeps raw bindings byte-identical and records missing legacy files privately", () => {
  const dir = fixture();
  const bytes = Buffer.from('{ "run_sha256": "original", "setting": 0.7 }\n');
  writeFileSync(join(dir, "execution-conditions.json"), bytes);
  writeFileSync(join(dir, "events.jsonl.upstream.jsonl"), "private provider settings\n");
  preserveAttempt(dir, 0);
  const manifest = JSON.parse(readFileSync(archived(dir, "manifest.json"), "utf8"));
  expect(manifest).toMatchObject({ schema_version: 1, attempt: 0, files: {
    "execution-conditions.json": { status: "preserved", bytes: bytes.length, sha256: `sha256:${createHash("sha256").update(bytes).digest("hex")}` },
    "candidate.patch": { status: "missing" }, "run.json": { status: "missing" },
  } });
  expect(readFileSync(archived(dir, "execution-conditions.json"))).toEqual(bytes);
  expect(readFileSync(archived(dir, "events.jsonl.upstream.jsonl"), "utf8")).toBe("private provider settings\n");
  for (const name of ["manifest.json", "execution-conditions.json", "events.jsonl.upstream.jsonl"]) expect(lstatSync(archived(dir, name)).mode & 0o777).toBe(0o600);
  expect(lstatSync(join(dir, ".attempts")).mode & 0o777).toBe(0o700);
  expect(lstatSync(archived(dir, ".")).mode & 0o777).toBe(0o700);
});

it("finishes a partial copy after a crash and repeats identically without rewriting evidence", () => {
  const dir = fixture();
  writeFileSync(join(dir, "run.json"), "original C4 bytes\n");
  writeFileSync(join(dir, "stdout.log"), "original log\n");
  mkdirSync(archived(dir, "."), { recursive: true });
  writeFileSync(archived(dir, "run.json"), "original C4 bytes\n");
  chmodSync(archived(dir, "run.json"), 0o644);
  preserveAttempt(dir, 0);
  const manifest = readFileSync(archived(dir, "manifest.json"));
  const before = lstatSync(archived(dir, "run.json"));
  preserveAttempt(dir, 0);
  expect(readFileSync(archived(dir, "manifest.json"))).toEqual(manifest);
  expect(lstatSync(archived(dir, "run.json")).ino).toBe(before.ino);
  expect(lstatSync(archived(dir, "run.json")).mtimeMs).toBe(before.mtimeMs);
  expect(lstatSync(archived(dir, "run.json")).mode & 0o777).toBe(0o600);
  expect(readFileSync(archived(dir, "stdout.log"), "utf8")).toBe("original log\n");
});

it("refuses a conflicting prior copy instead of overwriting it", () => {
  const dir = fixture();
  writeFileSync(join(dir, "run.json"), "new bytes");
  mkdirSync(archived(dir, "."), { recursive: true });
  writeFileSync(archived(dir, "run.json"), "retained bytes");
  expect(() => preserveAttempt(dir, 0)).toThrow(ConfigError);
  expect(readFileSync(archived(dir, "run.json"), "utf8")).toBe("retained bytes");
});

it("rejects changed presence or conflicting manifests on an already completed archive", () => {
  const dir = fixture();
  preserveAttempt(dir, 0);
  const path = archived(dir, "manifest.json");
  const original = readFileSync(path);
  writeFileSync(join(dir, "candidate.patch"), "later patch");
  expect(() => preserveAttempt(dir, 0)).toThrow(ConfigError);
  expect(readFileSync(path)).toEqual(original);
  rmSync(join(dir, "candidate.patch"));
  writeFileSync(path, "conflicting manifest");
  expect(() => preserveAttempt(dir, 0)).toThrow(ConfigError);
  expect(readFileSync(path, "utf8")).toBe("conflicting manifest");
});

it.each(["source", "destination", "manifest", "attempts-dir", "attempt-dir", "cell-dir"])("rejects %s symlinks without touching their targets", kind => {
  const root = fixture(); const dir = join(root, "cell"); const outside = join(root, "outside");
  mkdirSync(dir); mkdirSync(outside);
  const target = join(outside, "target"); writeFileSync(target, "outside bytes");
  writeFileSync(join(dir, "run.json"), "current bytes");
  if (kind === "source") { rmSync(join(dir, "run.json")); symlinkSync(target, join(dir, "run.json")); }
  if (kind === "cell-dir") { rmSync(dir, { recursive: true }); symlinkSync(outside, dir); }
  if (kind === "attempts-dir") symlinkSync(outside, join(dir, ".attempts"));
  if (kind === "attempt-dir") { mkdirSync(join(dir, ".attempts")); symlinkSync(outside, archived(dir, ".")); }
  if (kind === "destination" || kind === "manifest") { mkdirSync(archived(dir, "."), { recursive: true }); symlinkSync(target, archived(dir, kind === "destination" ? "run.json" : "manifest.json")); }
  expect(() => preserveAttempt(dir, 0)).toThrow(ConfigError);
  expect(readFileSync(target, "utf8")).toBe("outside bytes");
  expect(existsSync(join(outside, "attempt-0"))).toBe(false);
});

it.each([-1, 0.5, Number.MAX_SAFE_INTEGER + 1])("rejects invalid attempt %s", attempt => {
  const dir = fixture(); writeFileSync(join(dir, "run.json"), "bytes");
  expect(() => preserveAttempt(dir, attempt)).toThrow(ConfigError);
});

it("clears stale provider and candidate evidence even when staging fails before proxy startup", () => {
  const dir = fixture();
  for (const name of ["events.jsonl.upstream.jsonl", "candidate.patch", "candidate-evidence.json"]) writeFileSync(join(dir, name), "old private bytes");
  expect(() => stageTask({ dir, taskDir: join(dir, "missing-task"), upstream: "http://127.0.0.1:1", run_id: "fixture", tool: "mock", task_id: "fixture", model: "mock", price_book: "mock" })).toThrow();
  for (const name of ["events.jsonl.upstream.jsonl", "candidate.patch", "candidate-evidence.json"]) expect(existsSync(join(dir, name))).toBe(false);
});


it.each([false, true])("recovers a crash before/after exclusive publication (linked=%s)", linked => {
  const dir = fixture(); const destination = archived(dir, ".");
  writeFileSync(join(dir, "run.json"), "complete source");
  mkdirSync(destination, { recursive: true });
  const pending = archived(dir, ".pending-run.json");
  writeFileSync(pending, linked ? "complete source" : "incomplete");
  if (linked) linkSync(pending, archived(dir, "run.json"));
  preserveAttempt(dir, 0);
  expect(readFileSync(archived(dir, "run.json"), "utf8")).toBe("complete source");
  expect(existsSync(pending)).toBe(false);
  expect(lstatSync(archived(dir, "run.json")).nlink).toBe(1);
  expect(JSON.parse(readFileSync(archived(dir, "manifest.json"), "utf8")).files["run.json"].bytes).toBe(15);
});

it.each(["run.json", ".pending-run.json"])("rejects externally hard-linked retained %s", name => {
  const dir = fixture(); const target = join(dir, "outside");
  writeFileSync(target, "same bytes"); writeFileSync(join(dir, "run.json"), "same bytes");
  mkdirSync(archived(dir, "."), { recursive: true });
  linkSync(target, archived(dir, name));
  const mode = lstatSync(target).mode;
  expect(() => preserveAttempt(dir, 0)).toThrow(ConfigError);
  expect(lstatSync(target).mode).toBe(mode);
  expect(readFileSync(target, "utf8")).toBe("same bytes");
});

it("copies multi-chunk binary evidence and binds its complete byte length and hash", () => {
  const dir = fixture(); const bytes = Buffer.alloc(200_003);
  for (let i = 0; i < bytes.length; i++) bytes[i] = i % 251;
  writeFileSync(join(dir, "candidate.patch"), bytes);
  preserveAttempt(dir, 0);
  expect(readFileSync(archived(dir, "candidate.patch"))).toEqual(bytes);
  expect(JSON.parse(readFileSync(archived(dir, "manifest.json"), "utf8")).files["candidate.patch"]).toEqual({ status: "preserved", bytes: 200_003, sha256: `sha256:${createHash("sha256").update(bytes).digest("hex")}` });
});
