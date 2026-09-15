import { createHash } from "node:crypto";
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const script = join(root, "scripts/s8-launch-check.mjs");

function run(checkRoot) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, checkRoot], {
      cwd: root,
      env: { ...process.env, AOB_S8_LAUNCH_CHECK_NO_NETWORK: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (status) => resolve({ status, stdout, stderr }));
  });
}

async function scaffold() {
  const destination = await mkdtemp(join(tmpdir(), "aob-s8-launch-"));
  await cp(join(root, "evidence"), join(destination, "evidence"), { recursive: true });
  await cp(join(root, "README.md"), join(destination, "README.md"));
  await cp(join(root, "METHODOLOGY.md"), join(destination, "METHODOLOGY.md"));
  await cp(join(root, "CONTRIBUTING.md"), join(destination, "CONTRIBUTING.md"));
  await cp(join(root, "LICENSE"), join(destination, "LICENSE"));
  return destination;
}

test("accepts the repository's current launch state without network access", async () => {
  // This asserted status "pending" with no artifacts, which stopped being true
  // the moment the pilot leaderboard was published. The check that matters is
  // that the repository's real state passes and that the reported status
  // matches its own ledger - not that it is frozen in the pre-publication
  // scaffold forever.
  const destination = await scaffold();
  try {
    const result = await run(destination);
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    const ledger = JSON.parse(await readFile(join(root, "evidence/index.json"), "utf8"));
    assert.equal(report.status, ledger.status);
    assert.ok(["pending", "pilot", "released"].includes(report.status), `unexpected status ${report.status}`);
    assert.equal(report.artifacts.length, ledger.artifacts.length);
    if (report.status === "pending") assert.deepEqual(report.artifacts, []);
    else assert.ok(report.artifacts.length > 0, "a published ledger must list artifacts");
    assert.equal(report.network, "disabled");
  } finally {
    await rm(destination, { recursive: true, force: true });
  }
});

test("rejects a pending ledger containing a claimed external artifact", async () => {
  const destination = await scaffold();
  try {
    const indexPath = join(destination, "evidence/index.json");
    const index = JSON.parse(await readFile(indexPath, "utf8"));
    index.artifacts = [{ kind: "release", status: "complete" }];
    await writeFile(indexPath, `${JSON.stringify(index)}\n`);
    const result = await run(destination);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /pending|artifacts|publication/i);
  } finally {
    await rm(destination, { recursive: true, force: true });
  }
});

test("rejects malformed evidence JSON", async () => {
  const destination = await scaffold();
  try {
    await writeFile(join(destination, "evidence/index.json"), "{not-json}\n");
    const result = await run(destination);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /invalid JSON|evidence/i);
  } finally {
    await rm(destination, { recursive: true, force: true });
  }
});

test("rejects a symlinked evidence ledger", async () => {
  const destination = await scaffold();
  try {
    const indexPath = join(destination, "evidence/index.json");
    const replacement = join(destination, "replacement-index.json");
    await rm(indexPath);
    await writeFile(replacement, JSON.stringify({ version: 1, status: "pending", artifacts: [] }));
    await symlink(replacement, indexPath);
    const result = await run(destination);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /regular file|symlink/i);
  } finally {
    await rm(destination, { recursive: true, force: true });
  }
});

async function releasedScaffold(artifacts, status = "released") {
  const destination = await scaffold();
  const readme = (await readFile(join(destination, "README.md"), "utf8"))
    .replace(/Results are unpublished until the v1 dataset ships\./i, "Results for v1 are published below.");
  await writeFile(join(destination, "README.md"), readme);
  const methodology = (await readFile(join(destination, "METHODOLOGY.md"), "utf8"))
    .replace(/^# METHODOLOGY.*$/m, "# METHODOLOGY (v1)");
  await writeFile(join(destination, "METHODOLOGY.md"), methodology);
  const indexPath = join(destination, "evidence/index.json");
  const index = JSON.parse(await readFile(indexPath, "utf8"));
  index.status = status;
  index.artifacts = artifacts;
  await writeFile(indexPath, `${JSON.stringify(index)}\n`);
  await writeArtifact(destination);
  return destination;
}

const ARTIFACT_BYTES = "frozen archive bytes";
const releaseArtifact = {
  kind: "frozen-archive",
  path: "evidence/aob-v1.tar.gz",
  sha256: createHash("sha256").update(ARTIFACT_BYTES).digest("hex"),
};

/** Materialise the declared artifact so its checksum can actually be verified. */
async function writeArtifact(destination) {
  await writeFile(join(destination, releaseArtifact.path), ARTIFACT_BYTES);
}

test("accepts a released ledger that carries checksummed publication artifacts", async () => {
  const destination = await releasedScaffold([releaseArtifact]);
  try {
    const result = await run(destination);
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.status, "released");
    assert.equal(report.artifacts.length, 1);
  } finally {
    await rm(destination, { recursive: true, force: true });
  }
});

test("rejects a released ledger with no publication artifacts", async () => {
  const destination = await releasedScaffold([]);
  try {
    const result = await run(destination);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /released evidence\/index\.json must list at least one publication artifact/);
  } finally {
    await rm(destination, { recursive: true, force: true });
  }
});

test("rejects a released artifact without a path and sha256", async () => {
  const destination = await releasedScaffold([{ kind: "frozen-archive" }]);
  try {
    const result = await run(destination);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /publication artifact/);
  } finally {
    await rm(destination, { recursive: true, force: true });
  }
});

test("rejects a released README that still claims results are unpublished", async () => {
  const destination = await releasedScaffold([releaseArtifact]);
  try {
    const readme = await readFile(join(destination, "README.md"), "utf8");
    await writeFile(join(destination, "README.md"), `${readme}\nResults are unpublished until the v1 dataset ships.\n`);
    const result = await run(destination);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must not still claim that results are unpublished/);
  } finally {
    await rm(destination, { recursive: true, force: true });
  }
});

test("rejects a released METHODOLOGY that is still marked draft", async () => {
  const destination = await releasedScaffold([releaseArtifact]);
  try {
    await writeFile(join(destination, "METHODOLOGY.md"), "# METHODOLOGY (draft — not a v1 freeze)\n\nno v1 measurements\n");
    const result = await run(destination);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /METHODOLOGY must not remain a draft once results are released/);
  } finally {
    await rm(destination, { recursive: true, force: true });
  }
});

test("keeps the non-leaderboard positioning required after release", async () => {
  const destination = await releasedScaffold([releaseArtifact]);
  try {
    const readme = (await readFile(join(destination, "README.md"), "utf8")).replace(/not a capabilities leaderboard/gi, "the definitive ranking");
    await writeFile(join(destination, "README.md"), readme);
    const result = await run(destination);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /non-leaderboard positioning/);
  } finally {
    await rm(destination, { recursive: true, force: true });
  }
});

test("rejects an unknown ledger status", async () => {
  const destination = await releasedScaffold([releaseArtifact]);
  try {
    const indexPath = join(destination, "evidence/index.json");
    const index = JSON.parse(await readFile(indexPath, "utf8"));
    index.status = "mostly-released";
    await writeFile(indexPath, `${JSON.stringify(index)}\n`);
    const result = await run(destination);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /status must be pending, pilot, or released/);
  } finally {
    await rm(destination, { recursive: true, force: true });
  }
});

async function pilotScaffold(artifacts) {
  const destination = await scaffold();
  const readme = await readFile(join(destination, "README.md"), "utf8");
  await writeFile(join(destination, "README.md"), `${readme}\nThis is a pilot table, not the v1 dataset.\n`);
  const indexPath = join(destination, "evidence/index.json");
  const index = JSON.parse(await readFile(indexPath, "utf8"));
  index.status = "pilot";
  index.artifacts = artifacts;
  await writeFile(indexPath, `${JSON.stringify(index)}\n`);
  await writeArtifact(destination);
  return destination;
}

test("accepts a pilot ledger that keeps the v1 hedge and labels the table", async () => {
  const destination = await pilotScaffold([releaseArtifact]);
  try {
    const result = await run(destination);
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.status, "pilot");
    assert.equal(report.artifacts.length, 1);
  } finally {
    await rm(destination, { recursive: true, force: true });
  }
});

test("rejects a pilot ledger that drops the v1 unpublished hedge", async () => {
  const destination = await pilotScaffold([releaseArtifact]);
  try {
    const readme = (await readFile(join(destination, "README.md"), "utf8"))
      .replace(/Results are unpublished until the v1 dataset ships\./i, "Results for v1 are published below.");
    await writeFile(join(destination, "README.md"), readme);
    const result = await run(destination);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /pilot README must still state that results are unpublished until the v1 dataset ships/);
  } finally {
    await rm(destination, { recursive: true, force: true });
  }
});

test("rejects a pilot ledger whose README never labels the table a pilot", async () => {
  const destination = await pilotScaffold([releaseArtifact]);
  try {
    const readme = (await readFile(join(destination, "README.md"), "utf8")).replace(/pilot/gi, "final");
    await writeFile(join(destination, "README.md"), readme);
    const result = await run(destination);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /pilot README must label its results as a pilot/);
  } finally {
    await rm(destination, { recursive: true, force: true });
  }
});

test("rejects a pilot ledger with no publication artifacts", async () => {
  const destination = await pilotScaffold([]);
  try {
    const result = await run(destination);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must list at least one publication artifact/);
  } finally {
    await rm(destination, { recursive: true, force: true });
  }
});

test("verifies a declared artifact exists and matches its checksum", async () => {
  // A published ledger that merely declares a well-formed checksum proves
  // nothing. The gate must confirm the bytes are present and are the bytes
  // claimed, or a release can cite evidence that is missing or altered.
  const destination = await releasedScaffold([]);
  try {
    const artifactPath = join(destination, "evidence/pilot-artifact.bin");
    await writeFile(artifactPath, "real artifact bytes");
    const digest = createHash("sha256").update("real artifact bytes").digest("hex");
    const indexPath = join(destination, "evidence/index.json");
    const index = JSON.parse(await readFile(indexPath, "utf8"));

    index.artifacts = [{ kind: "pilot-report", path: "evidence/pilot-artifact.bin", sha256: digest }];
    await writeFile(indexPath, `${JSON.stringify(index)}\n`);
    assert.equal((await run(destination)).status, 0, "correct checksum is accepted");

    index.artifacts = [{ kind: "pilot-report", path: "evidence/pilot-artifact.bin", sha256: "b".repeat(64) }];
    await writeFile(indexPath, `${JSON.stringify(index)}\n`);
    const altered = await run(destination);
    assert.notEqual(altered.status, 0);
    assert.match(altered.stderr, /checksum does not match/);

    index.artifacts = [{ kind: "pilot-report", path: "evidence/missing.bin", sha256: digest }];
    await writeFile(indexPath, `${JSON.stringify(index)}\n`);
    const missing = await run(destination);
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /is unavailable|must be a regular file/);
  } finally {
    await rm(destination, { recursive: true, force: true });
  }
});
