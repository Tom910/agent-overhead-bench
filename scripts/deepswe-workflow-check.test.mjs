import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const command = fileURLToPath(new URL("./deepswe-workflow-check.py", import.meta.url));
const python = spawnSync("python3", ["-c", "import sys; print(sys.executable)"], { encoding: "utf8" }).stdout.trim();
const expected = (branch, committed) => ({ version: 1, assertions: [
  { id: "workflow.branch-created", result: branch },
  { id: "workflow.changes-committed", result: committed },
] });

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "aob-workflow-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const workspace = join(root, "workspace"); mkdirSync(workspace);
  const git = (...args) => {
    const result = spawnSync("git", ["-c", "core.hooksPath=/dev/null", "-C", workspace, ...args], {
      encoding: "utf8", timeout: 5000,
      env: { ...process.env, GIT_CONFIG_GLOBAL: "/dev/null", GIT_CONFIG_NOSYSTEM: "1",
        GIT_AUTHOR_NAME: "fixture", GIT_AUTHOR_EMAIL: "fixture@example.invalid",
        GIT_COMMITTER_NAME: "fixture", GIT_COMMITTER_EMAIL: "fixture@example.invalid" },
    });
    assert.equal(result.status, 0, result.stderr); return result.stdout.trim();
  };
  git("init", "--quiet"); git("checkout", "-b", "main");
  writeFileSync(join(workspace, "value.txt"), "base\n"); git("add", "."); git("commit", "-qm", "base");
  const base = git("rev-parse", "HEAD"), configPath = join(root, "config.json"), output = join(root, "workflow.json");
  writeFileSync(configPath, JSON.stringify({ base_commit: base, p2p_node_ids: [], f2p_node_ids: [] }));
  const run = (env = {}, outputPath = output) => spawnSync(python, [command, configPath, workspace, outputPath], {
    env: { ...process.env, ...env }, encoding: "utf8", timeout: 10000,
  });
  const commit = (empty = false) => {
    if (!empty) writeFileSync(join(workspace, "value.txt"), "candidate\n");
    git("add", "."); git("commit", "--allow-empty", "-qm", "candidate");
  };
  return { root, workspace, configPath, output, base, git, run, commit };
}

function assertGrade(f, result, grade) {
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, ""); assert.equal(result.stderr, "");
  assert.deepEqual(JSON.parse(readFileSync(f.output, "utf8")), grade);
}

function snapshot(directory) {
  const files = {};
  const visit = (path, prefix = "") => {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const name = `${prefix}${entry.name}`;
      if (entry.isDirectory()) visit(join(path, entry.name), `${name}/`);
      else files[name] = createHash("sha256").update(readFileSync(join(path, entry.name))).digest("hex");
    }
  };
  visit(directory); return files;
}

test("grades a clean new branch commit without changing workspace or Git metadata", t => {
  const f = fixture(t); f.git("checkout", "-b", "solution"); f.commit();
  const before = snapshot(f.workspace);
  assertGrade(f, f.run(), expected("passed", "passed"));
  assert.deepEqual(snapshot(f.workspace), before);
});

test("a clean empty commit supports pristine workflow controls", t => {
  const f = fixture(t); f.git("checkout", "-b", "control/pristine"); f.commit(true);
  assertGrade(f, f.run(), expected("passed", "passed"));
});

test("a commit on main fails the branch obligation", t => {
  const f = fixture(t); f.commit(); assertGrade(f, f.run(), expected("failed", "passed"));
});

test("a new branch still at the base fails the commit obligation", t => {
  const f = fixture(t); f.git("checkout", "-b", "solution");
  assertGrade(f, f.run(), expected("passed", "failed"));
});

for (const kind of ["unstaged", "staged", "untracked"]) {
  test(`${kind} public changes fail the commit obligation`, t => {
    const f = fixture(t); f.git("checkout", "-b", "solution"); f.commit();
    writeFileSync(join(f.workspace, kind === "untracked" ? "new.txt" : "value.txt"), "uncommitted\n");
    if (kind === "staged") f.git("add", ".");
    assertGrade(f, f.run(), expected("passed", "failed"));
  });
}

test("detached HEAD fails the branch obligation even with a clean descendant commit", t => {
  const f = fixture(t); f.git("checkout", "-b", "solution"); f.commit(); f.git("checkout", "--detach");
  assertGrade(f, f.run(), expected("failed", "passed"));
});

test("a known but unrelated base fails ancestry rather than inventing infrastructure failure", t => {
  const f = fixture(t); f.git("checkout", "--orphan", "unrelated"); f.commit();
  assertGrade(f, f.run(), expected("failed", "passed"));
});

test("excludes harness homes including Cline while still rejecting uncommitted public files", t => {
  const f = fixture(t); f.git("checkout", "-b", "solution"); f.commit();
  for (const name of [".aob-home", ".aob-codex-home", ".aob-qwen-home", ".aob-pi-home", ".aob-cline-home"]) {
    mkdirSync(join(f.workspace, name)); writeFileSync(join(f.workspace, name, "private.txt"), "private\n");
  }
  assertGrade(f, f.run(), expected("passed", "passed"));
  rmSync(f.output); mkdirSync(join(f.workspace, ".other-cache"));
  writeFileSync(join(f.workspace, ".other-cache", "file"), "public\n");
  assertGrade(f, f.run(), expected("passed", "failed"));
});

function clineCache(f) {
  const cache = join(f.workspace, ".aob-cline-home", ".cline", "data", "cache");
  mkdirSync(cache, { recursive: true });
  writeFileSync(join(cache, "feature-flags.json"), "{}\n");
}

test("Cline's nested private cache does not invalidate a clean task commit", t => {
  const f = fixture(t); f.git("checkout", "-b", "solution"); f.commit(); clineCache(f);
  const before = snapshot(f.workspace);
  assertGrade(f, f.run(), expected("passed", "passed"));
  assert.deepEqual(snapshot(f.workspace), before);
});

for (const kind of ["unstaged", "staged", "untracked"]) {
  test(`Cline cache does not excuse ${kind} task changes after a commit`, t => {
    const f = fixture(t); f.git("checkout", "-b", "solution"); f.commit(); clineCache(f);
    writeFileSync(join(f.workspace, kind === "untracked" ? "new.txt" : "value.txt"), "uncommitted\n");
    if (kind === "staged") f.git("add", "value.txt");
    assertGrade(f, f.run(), expected("passed", "failed"));
  });
}

test("Cline cache does not excuse a missing task commit", t => {
  const f = fixture(t); f.git("checkout", "-b", "solution"); clineCache(f);
  assertGrade(f, f.run(), expected("passed", "failed"));
});

test("a public path with a similar Cline cache name remains task work", t => {
  const f = fixture(t); f.git("checkout", "-b", "solution"); f.commit(); clineCache(f);
  const publicDir = join(f.workspace, ".aob-cline-home-extra"); mkdirSync(publicDir);
  writeFileSync(join(publicDir, "task.txt"), "uncommitted\n");
  assertGrade(f, f.run(), expected("passed", "failed"));
});

test("honors normal ignored build outputs while checking public untracked files", t => {
  const f = fixture(t); f.git("checkout", "-b", "solution");
  writeFileSync(join(f.workspace, ".gitignore"), "build/\n"); f.commit();
  mkdirSync(join(f.workspace, "build")); writeFileSync(join(f.workspace, "build/result"), "generated\n");
  assertGrade(f, f.run(), expected("passed", "passed"));
});

test("ignores global config and Git environment and disables repository fsmonitor/hooks", t => {
  const f = fixture(t); f.git("checkout", "-b", "solution"); f.commit();
  const marker = join(f.root, "must-not-run"), helper = join(f.root, "hook.sh");
  writeFileSync(helper, `#!/bin/sh\ntouch '${marker}'\n`, { mode: 0o700 });
  f.git("config", "core.fsmonitor", helper); f.git("config", "core.hooksPath", f.root);
  writeFileSync(join(f.root, "post-index-change"), readFileSync(helper), { mode: 0o700 });
  const badConfig = join(f.root, "global.gitconfig"); writeFileSync(badConfig, "invalid configuration [\n");
  assertGrade(f, f.run({ GIT_CONFIG_GLOBAL: badConfig, GIT_DIR: "/missing-git", GIT_WORK_TREE: "/missing-worktree" }), expected("passed", "passed"));
  assert.equal(existsSync(marker), false);
});

for (const kind of ["missing-base", "missing-git", "malformed-git", "malformed-config", "duplicate-config", "short-base", "shallow"]) {
  test(`${kind} is unavailable evidence, never a failed workflow assertion`, t => {
    const f = fixture(t);
    if (kind === "missing-base") writeFileSync(f.configPath, JSON.stringify({ base_commit: "f".repeat(40) }));
    if (kind === "missing-git") rmSync(join(f.workspace, ".git"), { recursive: true });
    if (kind === "malformed-git") writeFileSync(join(f.workspace, ".git/HEAD"), "broken\n");
    if (kind === "malformed-config") writeFileSync(f.configPath, "{");
    if (kind === "duplicate-config") writeFileSync(f.configPath, `{"base_commit":"${f.base}","base_commit":"${f.base}"}`);
    if (kind === "short-base") writeFileSync(f.configPath, JSON.stringify({ base_commit: f.base.slice(0, 8) }));
    if (kind === "shallow") writeFileSync(join(f.workspace, ".git/shallow"), `${f.base}\n`);
    const result = f.run(); assert.equal(result.status, 2, result.stderr);
    assert.match(result.stderr, /workflow check unavailable/);
    assert.equal(result.stdout, ""); assert.equal(existsSync(f.output), false);
  });
}

test("a hung Git process times out without publishing assertions", t => {
  const f = fixture(t), bin = join(f.root, "bin"); mkdirSync(bin);
  writeFileSync(join(bin, "git"), "#!/bin/sh\nexec /bin/sleep 30\n", { mode: 0o700 });
  const started = performance.now(), result = f.run({ PATH: `${bin}:/usr/bin:/bin` });
  assert.equal(result.status, 2, result.stderr); assert.ok(performance.now() - started < 8000);
  assert.match(result.stderr, /timed out/);
  assert.equal(existsSync(f.output), false); assert.equal(result.stdout, "");
});

test("oversized Git output is unavailable evidence without leaking its contents", t => {
  const f = fixture(t), bin = join(f.root, "bin"); mkdirSync(bin);
  writeFileSync(join(bin, "git"), "#!/bin/sh\nexec /usr/bin/head -c 1200000 /dev/zero\n", { mode: 0o700 });
  const result = f.run({ PATH: `${bin}:/usr/bin:/bin` });
  assert.equal(result.status, 2, result.stderr); assert.match(result.stderr, /output exceeds/);
  assert.equal(existsSync(f.output), false); assert.equal(result.stdout, "");
});

test("does not overwrite output or create output inside the candidate workspace", t => {
  const f = fixture(t); writeFileSync(f.output, "existing evidence\n");
  assert.equal(f.run().status, 2); assert.equal(readFileSync(f.output, "utf8"), "existing evidence\n");
  assert.equal(f.run({}, join(f.workspace, "workflow.json")).status, 2);
  assert.equal(existsSync(join(f.workspace, "workflow.json")), false);
});
