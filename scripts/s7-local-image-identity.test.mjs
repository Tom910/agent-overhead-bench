import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const source = readFileSync(new URL("./s7-preflight.sh", import.meta.url), "utf8");
const expected = `sha256:${"a".repeat(64)}`;

// Exercise the actual inline gates, following the other preflight fixtures,
// without running the host/source/calibration stages or a Docker daemon.
function gate(kind, actual = expected, missing = false) {
  const root = mkdtempSync(join(tmpdir(), "aob-preflight-image-id-"));
  try {
    const image = `aob-${kind}:local`;
    const commands = join(root, "commands");
    const docker = join(root, "docker");
    writeFileSync(docker, `#!${process.execPath}
const args = process.argv.slice(2);
require('node:fs').appendFileSync(${JSON.stringify(commands)}, JSON.stringify(args) + '\\n');
if (${missing} || args.some(arg => arg.includes('@sha256:'))) process.exit(1);
if (args.at(-1) !== ${JSON.stringify(image)}) process.exit(1);
process.stdout.write(${JSON.stringify(actual + "\n")});
`);
    chmodSync(docker, 0o755);
    const nativePath = join(root, "verifier.json");
    writeFileSync(nativePath, JSON.stringify({ kind: "docker-command", image, image_digest: expected }));
    const start = source.indexOf(kind === "agent"
      ? "const image = task.agent_images[tool];"
      : "const verifier = validateVerifierSpec(JSON.parse(fs.readFileSync(nativePath");
    const end = source.indexOf(kind === "agent"
      ? "\n    }\n  }\n} else if"
      : "\n  if (deepsweTasks !== undefined) {", start);
    assert.ok(start >= 0 && end > start, "preflight image gate must remain exercised");
    const program = `const fs = require('node:fs'); const {execFileSync} = require('node:child_process');
      const tool = 'fixture'; const selectedId = 'task-one';
      const task = {agent_images:{fixture:{image:${JSON.stringify(image)},image_digest:${JSON.stringify(expected)}}}};
      const nativePath = ${JSON.stringify(nativePath)}; const validateVerifierSpec = value => value;
      ${source.slice(start, end)}`;
    const result = spawnSync(process.execPath, ["-e", program], {
      encoding: "utf8", env: { PATH: `${root}:${process.env.PATH ?? "/usr/bin:/bin"}` }, timeout: 10_000,
    });
    return { result, commands: readFileSync(commands, "utf8").trim().split("\n").map(line => JSON.parse(line)), image };
  } finally { rmSync(root, { recursive: true, force: true }); }
}

for (const kind of ["agent", "verifier"]) {
  test(`preflight accepts the matching local ${kind} tag without RepoDigests`, () => {
    const { result, commands, image } = gate(kind);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(commands, [["image", "inspect", "--format", "{{.Id}}", image]]);
  });

  test(`preflight rejects a retagged or malformed ${kind} identity`, () => {
    for (const actual of [`sha256:${"b".repeat(64)}`, "not-an-image-id", ""]) {
      const { result } = gate(kind, actual);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /image identity drift/);
    }
  });

  test(`preflight rejects a missing ${kind} image`, () => {
    const { result } = gate(kind, expected, true);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /image is missing/);
  });
}
