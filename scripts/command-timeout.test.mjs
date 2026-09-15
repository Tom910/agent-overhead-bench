import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { test } from "node:test";

const root = dirname(fileURLToPath(import.meta.url));
const helper = join(root, "command-timeout.mjs");

function runHelper(timeoutMs, command, ...args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [helper, String(timeoutMs), command, ...args], {
      stdio: "ignore",
    });
    child.once("error", reject);
    child.once("exit", (code, signal) => resolve({ code, signal }));
  });
}

test("preserves a command's normal exit code", async () => {
  const result = await runHelper(1_000, process.execPath, "-e", "process.exit(7)");
  assert.equal(result.code, 7);
  assert.equal(result.signal, null);
});

test("terminates a command that exceeds the timeout", async () => {
  const started = performance.now();
  const result = await runHelper(100, process.execPath, "-e", "setTimeout(() => {}, 60000)");
  const elapsed = performance.now() - started;
  assert.equal(result.code, 124);
  assert.equal(result.signal, null);
  assert.ok(elapsed < 2_000, `timeout wrapper took ${elapsed.toFixed(0)}ms`);
});

test("escalates to SIGKILL when a command ignores SIGTERM", async () => {
  const result = await runHelper(100, process.execPath, "-e", "process.on('SIGTERM', () => {}); setTimeout(() => {}, 60000)");
  assert.equal(result.code, 124);
  assert.equal(result.signal, null);
});

test("terminates descendants with the timed-out command", async () => {
  const dir = await mkdtemp(join(tmpdir(), "aob-command-timeout-test-"));
  const pidFile = join(dir, "child.pid");
  let childPid;
  try {
    const result = await runHelper(
      500,
      process.execPath,
      "-e",
      "const fs = require('node:fs'); const { spawn } = require('node:child_process'); const child = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 60000)'], { stdio: 'ignore' }); fs.writeFileSync(process.argv[1], String(child.pid)); process.on('SIGTERM', () => {}); setTimeout(() => {}, 60000)",
      pidFile,
    );
    assert.equal(result.code, 124);
    childPid = Number(await readFile(pidFile, "utf8"));
    assert.ok(Number.isInteger(childPid) && childPid > 0);
    for (let attempt = 0; attempt < 40; attempt += 1) {
      try {
        process.kill(childPid, 0);
      } catch (error) {
        if (error?.code === "ESRCH") return;
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    assert.fail(`descendant ${childPid} survived the timeout`);
  } finally {
    if (childPid) {
      try { process.kill(childPid, "SIGKILL"); } catch { /* already exited */ }
    }
    await rm(dir, { recursive: true, force: true });
  }
});
