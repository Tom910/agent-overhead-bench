import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, statSync, symlinkSync, truncateSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { bindCandidateToRun, captureCandidate, prepareCandidateBaseline, releaseCandidateBaseline, type CandidateBaseline } from "./candidate-evidence.js";
import { preserveAttempt } from "./attempt-evidence.js";
const roots: string[] = []; const baselines: CandidateBaseline[] = [];
afterEach(() => { vi.unstubAllEnvs(); for (const b of baselines.splice(0)) releaseCandidateBaseline(b); for (const r of roots.splice(0)) rmSync(r, { recursive: true, force: true }); });
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "aob-candidate-test-")); roots.push(root);
  const workspace = join(root, "workspace"); mkdirSync(workspace);
  writeFileSync(join(workspace, "source.txt"), "base\n");
  return { root, workspace };
}
function baseline(workspace: string) { const b = prepareCandidateBaseline(workspace); baselines.push(b); return b; }
function capture(root: string, workspace: string, b: CandidateBaseline) {
  return captureCandidate({ dir: root, workspace, baseline: b, runId: "candidate-fixture", taskId: "fixture", baseRevision: "a".repeat(40), taskRevision: "source-revision", agentImage: "sha256:" + "b".repeat(64), verifierImage: "sha256:" + "c".repeat(64) });
}

it("replays added/deleted/binary/executable changes against prepared bytes despite rewritten agent Git history", () => {
  const { root, workspace } = fixture();
  writeFileSync(join(workspace, "remove.txt"), "delete me\n");
  writeFileSync(join(workspace, "binary.dat"), Buffer.from([0, 1, 2, 255]));
  execFileSync("/usr/bin/git", ["init", "-q", workspace]);
  execFileSync("/usr/bin/git", ["-C", workspace, "add", "."]);
  execFileSync("/usr/bin/git", ["-C", workspace, "-c", "user.name=fixture", "-c", "user.email=fixture@invalid", "-c", "core.hooksPath=/dev/null", "commit", "-qm", "base"]);
  const replay = join(root, "replay"); cpSync(workspace, replay, { recursive: true });
  const b = baseline(workspace);
  writeFileSync(join(workspace, "source.txt"), "agent\n");
  writeFileSync(join(workspace, "space name.txt"), "added\n");
  writeFileSync(join(workspace, "binary.dat"), Buffer.from([255, 0, 4, 3, 2, 1]));
  chmodSync(join(workspace, "source.txt"), 0o755); rmSync(join(workspace, "remove.txt"));
  execFileSync("/usr/bin/git", ["-C", workspace, "add", "."]);
  execFileSync("/usr/bin/git", ["-C", workspace, "-c", "user.name=fixture", "-c", "user.email=fixture@invalid", "-c", "core.hooksPath=/dev/null", "commit", "-qm", "agent commits solution"]);
  writeFileSync(join(workspace, ".git/config"), "invalid agent-controlled config");
  const result = capture(root, workspace, b);
  expect(result.status).toBe("captured");
  expect(result).toMatchObject({ declared_base_revision: "a".repeat(40), image_bytes_archived: false, patch: { bytes: expect.any(Number) } });
  const patch = readFileSync(join(root, "candidate.patch"));
  expect(result.patch?.sha256).toBe(`sha256:${createHash("sha256").update(patch).digest("hex")}`);
  expect(patch.toString()).toContain("GIT binary patch");
  execFileSync("/usr/bin/git", ["-C", replay, "apply", "--binary", join(root, "candidate.patch")]);
  expect(readFileSync(join(replay, "source.txt"), "utf8")).toBe("agent\n");
  expect(readFileSync(join(replay, "space name.txt"), "utf8")).toBe("added\n");
  expect(readFileSync(join(replay, "binary.dat"))).toEqual(Buffer.from([255, 0, 4, 3, 2, 1]));
  expect(existsSync(join(replay, "remove.txt"))).toBe(false);
  expect(statSync(join(replay, "source.txt")).mode & 0o111).not.toBe(0);
  expect(statSync(join(root, "candidate.patch")).mode & 0o777).toBe(0o600);
  expect(statSync(join(root, "candidate-evidence.json")).mode & 0o777).toBe(0o600);
  preserveAttempt(root, 0);
  expect(readFileSync(join(root, ".attempts/attempt-0/candidate.patch"))).toEqual(patch);
  expect(JSON.parse(readFileSync(join(root, ".attempts/attempt-0/candidate-evidence.json"), "utf8"))).toEqual(result);
});

it("excludes new harness files without hiding existing source files named stdout.log", () => {
  const { root, workspace } = fixture();
  writeFileSync(join(workspace, "stdout.log"), "tracked source\n");
  const b = baseline(workspace);
  writeFileSync(join(workspace, "stdout.log"), "changed source\n");
  writeFileSync(join(workspace, "stderr.log"), "PRIVATE LOG");
  mkdirSync(join(workspace, ".aob-home")); writeFileSync(join(workspace, ".aob-home/token"), "PRIVATE TOKEN");
  const result = capture(root, workspace, b);
  expect(result.status).toBe("captured");
  const patch = readFileSync(join(root, "candidate.patch"), "utf8");
  expect(patch).toContain("+changed source"); expect(patch).not.toMatch(/PRIVATE|stderr.log|\.aob-home/);
});

it("does not execute agent Git hooks/config, inherited diff commands, or PATH replacements", () => {
  const { root, workspace } = fixture(); const marker = join(root, "executed");
  const hostile = join(root, "git"); writeFileSync(hostile, `#!/bin/sh\ntouch '${marker}'\n`, { mode: 0o755 });
  mkdirSync(join(workspace, ".git/hooks"), { recursive: true });
  writeFileSync(join(workspace, ".git/config"), `[diff]\nexternal = ${hostile}\n[core]\nhooksPath = ${root}\n`);
  writeFileSync(join(workspace, ".git/hooks/pre-commit"), readFileSync(hostile), { mode: 0o755 });
  const b = baseline(workspace); writeFileSync(join(workspace, "source.txt"), "agent\n");
  vi.stubEnv("PATH", root); vi.stubEnv("GIT_EXTERNAL_DIFF", hostile); vi.stubEnv("GIT_CONFIG_GLOBAL", join(workspace, ".git/config"));
  vi.stubEnv("OPENROUTER_API_KEY", "PRIVATE_CREDENTIAL");
  expect(capture(root, workspace, b).status).toBe("captured"); expect(existsSync(marker)).toBe(false);
  expect(readFileSync(join(root, "candidate-evidence.json"), "utf8")).not.toContain("PRIVATE_CREDENTIAL");
});

it("captures outside and dangling symlinks as link bytes without reading their targets", () => {
  const { root, workspace } = fixture();
  const outside = join(root, "private-outside"); writeFileSync(outside, "DO_NOT_READ_OUTSIDE_CONTENT");
  symlinkSync("old-missing", join(workspace, "changed-link"));
  const replay = join(root, "replay"); cpSync(workspace, replay, { recursive: true, verbatimSymlinks: true });
  const b = baseline(workspace);
  rmSync(join(workspace, "changed-link")); symlinkSync(outside, join(workspace, "changed-link"));
  symlinkSync("missing-new-target", join(workspace, "dangling"));
  expect(capture(root, workspace, b).status).toBe("captured");
  const patch = readFileSync(join(root, "candidate.patch"), "utf8");
  expect(patch).toContain("120000"); expect(patch).toContain(outside); expect(patch).not.toContain("DO_NOT_READ_OUTSIDE_CONTENT");
  execFileSync("/usr/bin/git", ["-C", replay, "apply", join(root, "candidate.patch")]);
  expect(readlinkSync(join(replay, "changed-link"))).toBe(outside);
  expect(readlinkSync(join(replay, "dangling"))).toBe("missing-new-target");
});

it("retains explicit unavailable evidence without a misleading empty patch for oversized candidate trees", () => {
  const { root, workspace } = fixture(); const b = baseline(workspace);
  const large = join(workspace, "oversized"); writeFileSync(large, ""); truncateSync(large, 256 * 1024 * 1024 + 1);
  expect(capture(root, workspace, b)).toMatchObject({ status: "unavailable", reason: "candidate-snapshot-unavailable", patch: null });
  expect(existsSync(join(root, "candidate.patch"))).toBe(false);
  expect(JSON.parse(readFileSync(join(root, "candidate-evidence.json"), "utf8")).status).toBe("unavailable");
});

it("records missing and oversized baselines as unavailable and never fabricates a patch", () => {
  const { root, workspace } = fixture();
  const large = join(workspace, "oversized"); writeFileSync(large, ""); truncateSync(large, 256 * 1024 * 1024 + 1);
  expect(capture(root, workspace, baseline(workspace))).toMatchObject({ status: "unavailable", reason: "baseline-unavailable", prepared_tree_sha256: null, patch: null });
  expect(existsSync(join(root, "candidate.patch"))).toBe(false);
  expect(prepareCandidateBaseline(join(root, "missing"))).toEqual({ status: "unavailable", reason: "baseline-unavailable" });
});

it("distinguishes a verified unchanged candidate from unavailable capture", () => {
  const { root, workspace } = fixture();
  const result = capture(root, workspace, baseline(workspace));
  expect(result.status).toBe("captured"); expect(result.reason).toBeNull();
  expect(readFileSync(join(root, "candidate.patch")).length).toBe(0);
  expect(result.patch?.sha256).toBe("sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
});


it("records Git output-limit failure without writing a fake empty patch", () => {
  const { root, workspace } = fixture();
  writeFileSync(join(workspace, "large.txt"), "a".repeat(9 * 1024 * 1024));
  const b = baseline(workspace);
  writeFileSync(join(workspace, "large.txt"), "b".repeat(9 * 1024 * 1024));
  expect(capture(root, workspace, b)).toMatchObject({ status: "unavailable", reason: "diff-unavailable", patch: null });
  expect(existsSync(join(root, "candidate.patch"))).toBe(false);
});


it("binds identical run IDs to distinct C4 bytes and preserves the first retry binding", () => {
  const { root, workspace } = fixture();
  const first = capture(root, workspace, baseline(workspace));
  expect(first.run_sha256).toBeNull();
  const run1 = Buffer.from('{"run_id":"candidate-fixture","attempt":1}\n');
  writeFileSync(join(root, "run.json"), run1);
  bindCandidateToRun(root, first, run1);
  const firstBound = JSON.parse(readFileSync(join(root, "candidate-evidence.json"), "utf8"));
  expect(firstBound.run_sha256).toBe(`sha256:${createHash("sha256").update(run1).digest("hex")}`);
  preserveAttempt(root, 0);
  rmSync(join(root, "candidate.patch")); rmSync(join(root, "candidate-evidence.json"));
  writeFileSync(join(workspace, "source.txt"), "second attempt\n");
  const second = capture(root, workspace, baseline(workspace));
  const run2 = Buffer.from('{"run_id":"candidate-fixture","attempt":2}\n');
  writeFileSync(join(root, "run.json"), run2); bindCandidateToRun(root, second, run2);
  expect(JSON.parse(readFileSync(join(root, "candidate-evidence.json"), "utf8")).run_sha256).not.toBe(firstBound.run_sha256);
  expect(JSON.parse(readFileSync(join(root, ".attempts/attempt-0/candidate-evidence.json"), "utf8"))).toEqual(firstBound);
  expect(readFileSync(join(root, ".attempts/attempt-0/run.json"))).toEqual(run1);
});

it("does not finalize evidence if its captured patch was changed or the C4 run identity differs", () => {
  const { root, workspace } = fixture(); const result = capture(root, workspace, baseline(workspace));
  bindCandidateToRun(root, result, Buffer.from('{"run_id":"different"}'));
  expect(JSON.parse(readFileSync(join(root, "candidate-evidence.json"), "utf8")).run_sha256).toBeNull();
  writeFileSync(join(root, "candidate.patch"), "changed after capture");
  bindCandidateToRun(root, result, Buffer.from('{"run_id":"candidate-fixture"}'));
  expect(JSON.parse(readFileSync(join(root, "candidate-evidence.json"), "utf8")).run_sha256).toBeNull();
});
