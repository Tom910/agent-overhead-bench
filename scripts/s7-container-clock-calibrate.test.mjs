import { chmod, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import test from "node:test";
import assert from "node:assert/strict";

const root = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const script = join(root, "scripts/s7-container-clock-calibrate.sh");

function runCalibration(dir, offset, ...args) {
  return new Promise((resolve) => {
  const child = spawn("sh", [script, join(dir, "calibration.txt"), ...args], {
      cwd: root,
      env: { ...process.env, PATH: `${join(dir, "bin")}:${process.env.PATH ?? ""}`, AOB_FAKE_CLOCK_OFFSET_MS: String(offset), AOB_FAKE_DOCKER_LOG: join(dir, "fake-log.txt") },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}

async function setupFakeDocker(dir, output = "offset") {
  const bin = join(dir, "bin");
  await mkdir(bin, { recursive: true });
  await writeFile(join(bin, "docker"), `#!/bin/sh
printf '%s\\n' "$*" >> "$AOB_FAKE_DOCKER_LOG"
  if [ "$1" = run ]; then
  if [ "$AOB_FAKE_CLOCK_OUTPUT" = hang ]; then sleep 2; exit 0; fi
  printf 'ready\\n'
  while IFS= read -r token; do
    if [ "$AOB_FAKE_CLOCK_OUTPUT" = malformed ]; then
      printf 'not-a-timestamp\\n'
    else
      perl -MTime::HiRes -e 'printf "%.0f\\n", Time::HiRes::time() * 1000 + $ENV{AOB_FAKE_CLOCK_OFFSET_MS}'
    fi
  done
  exit 0
fi
exit 1
`);
  await chmod(join(bin, "docker"), 0o755);
  await writeFile(join(dir, "fake-log.txt"), "");
  return { bin, log: join(dir, "fake-log.txt"), output };
}

test("records bounded container-host clock offsets without network or provider access", async () => {
  const dir = await mkdtemp(join(tmpdir(), "aob-container-clock-"));
  try {
    const fake = await setupFakeDocker(dir);
    const result = await runCalibration(dir, -1, "--samples", "1", "--max-offset-ms", "10");
    assert.equal(result.status, 0, result.stderr);
    const report = await readFile(join(dir, "calibration.txt"), "utf8");
    assert.match(report, /^method=container-host-epoch-ms$/m);
    assert.match(report, /^samples=1$/m);
    assert.match(report, /^image=aob-base:s2$/m);
    assert.match(report, /^provider_requests=0$/m);
    assert.ok(Number(/^max_abs_offset_ms=(\d+)$/m.exec(report)?.[1] ?? "NaN") <= 10);
    const dockerArgs = await readFile(fake.log, "utf8");
    assert.match(dockerArgs, /run --pull=never/);
    assert.match(dockerArgs, /--network none/);
    assert.match(dockerArgs, /--entrypoint sh aob-base:s2/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("fails closed when the measured container offset exceeds the bound", async () => {
  const dir = await mkdtemp(join(tmpdir(), "aob-container-clock-fail-"));
  try {
    await setupFakeDocker(dir);
    const result = await runCalibration(dir, 25, "--samples", "2", "--max-offset-ms", "10");
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /offset|bound/i);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("fails closed on malformed container timestamps", async () => {
  const dir = await mkdtemp(join(tmpdir(), "aob-container-clock-malformed-"));
  try {
    await setupFakeDocker(dir);
    const result = await new Promise((resolve) => {
      const child = spawn("sh", [script, join(dir, "calibration.txt"), "--samples", "1"], {
        cwd: root,
        env: { ...process.env, PATH: `${join(dir, "bin")}:${process.env.PATH ?? ""}`, AOB_FAKE_CLOCK_OUTPUT: "malformed", AOB_FAKE_CLOCK_OFFSET_MS: "0", AOB_FAKE_DOCKER_LOG: join(dir, "fake-log.txt") },
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stderr = "";
      child.stderr.on("data", (chunk) => { stderr += chunk; });
      child.on("close", (status) => resolve({ status, stderr }));
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /timestamp/i);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("fails closed and returns promptly when the container handshake hangs", async () => {
  const dir = await mkdtemp(join(tmpdir(), "aob-container-clock-hang-"));
  try {
    await setupFakeDocker(dir);
    const started = Date.now();
    const result = await new Promise((resolve) => {
      const child = spawn("sh", [script, join(dir, "calibration.txt"), "--samples", "1", "--timeout-ms", "150"], {
        cwd: root,
        env: { ...process.env, PATH: `${join(dir, "bin")}:${process.env.PATH ?? ""}`, AOB_FAKE_CLOCK_OUTPUT: "hang", AOB_FAKE_CLOCK_OFFSET_MS: "0", AOB_FAKE_DOCKER_LOG: join(dir, "fake-log.txt") },
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stderr = "";
      child.stderr.on("data", (chunk) => { stderr += chunk; });
      child.on("close", (status) => resolve({ status, stderr }));
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /timeout|timed out|handshake/i);
    assert.doesNotMatch(result.stderr, /unknown option|requires a nonnegative|requires a positive/i);
    assert.ok(Date.now() - started < 1500);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
