import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
function fixture(t) {
  const work = mkdtempSync(join(tmpdir(), "aob-current-tool-images-"));
  t.after(() => rmSync(work, { recursive: true, force: true }));
  const bin = join(work, "bin"); mkdirSync(bin);
  const capture = join(work, "Dockerfile");
  const docker = join(bin, "docker");
  writeFileSync(docker, `#!${process.execPath}
const fs=require('node:fs'); const args=process.argv.slice(2);
if(args[0]==='image'&&args[1]==='inspect') { process.stdout.write(args.includes('--format') ? '[]\\n' : ''); }
else if(args[0]==='build') { fs.copyFileSync(args[args.indexOf('-f')+1],process.env.CAPTURE_DOCKERFILE); }
else if(args[0]==='run') {
  if(!args.includes('--pull=never')||!args.includes('--network')||args[args.indexOf('--network')+1]!=='none') process.exit(93);
  const binary=args[args.indexOf('--entrypoint')+1];
  if(binary==='cline') process.stdout.write(process.env.CLINE_VERSION||'3.0.61');
  else if(binary==='pi') process.stdout.write(process.env.PI_VERSION||'0.73.1');
  else if(binary==='node') {
    const image=args.find(a=>a==='aob-cline:s2'||a==='aob-pi:s2');
    if(!image) process.exit(94);
    process.stdout.write(image==='aob-cline:s2' ? (process.env.CLINE_PACKAGE_VERSION||'3.0.61') : (process.env.PI_PACKAGE_VERSION||'0.73.1'));
  } else if(binary!=='/bin/sh') process.exit(95);
} else process.exit(96);
`);
  chmodSync(docker, 0o755);
  const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, CAPTURE_DOCKERFILE: capture };
  return { work, capture, env };
}

test("S5 image check accepts current Cline and Pi pins without building or provider traffic", (t) => {
  const f = fixture(t);
  const result = spawnSync(join(root, "scripts/s5-build-images.sh"), ["--check"], {
    encoding: "utf8", env: { ...f.env, AOB_IMAGE_TOOLS: "cline,pi" }, timeout: 20_000,
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /aob-cline:s2: 3\.0\.61/);
  assert.match(result.stdout, /aob-pi:s2: 0\.73\.1/);
  assert.match(result.stdout, /no provider traffic/);
});

test("S5 image check rejects version drift including a misleading matching prefix", (t) => {
  const f = fixture(t);
  for (const [tool, drift] of [["cline", { CLINE_PACKAGE_VERSION: "3.0.610", CLINE_VERSION: "3.0.610" }], ["pi", { PI_PACKAGE_VERSION: "0.73.10", PI_VERSION: "0.73.10" }]]) {
    const result = spawnSync(join(root, "scripts/s5-build-images.sh"), ["--check"], {
      encoding: "utf8", env: { ...f.env, ...drift, AOB_IMAGE_TOOLS: tool }, timeout: 20_000,
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /package.*version|version.*drift/i);
  }
});

test("DeepSWE image assembly recreates CLI symlinks so package-relative imports retain their base", (t) => {
  const f = fixture(t);
  for (const [tool, packageName, entry] of [["cline", "cline", "bin/cline"], ["pi", "@mariozechner/pi-coding-agent", "dist/cli.js"]]) {
    const result = spawnSync(join(root, "scripts/build-deepswe-agent-image.sh"), ["task:fixture", `aob-${tool}:s2`, `combined:${tool}`, tool], {
      encoding: "utf8", env: f.env,
    });
    assert.equal(result.status, 0, result.stderr);
    const dockerfile = readFileSync(f.capture, "utf8");
    assert.ok(dockerfile.includes(`COPY --from=tool /usr/local/lib/node_modules/${packageName} /usr/local/lib/node_modules/${packageName}`));
    assert.ok(dockerfile.includes(`RUN ln -sf /usr/local/lib/node_modules/${packageName}/${entry} /usr/local/bin/${tool}`));
    assert.ok(!dockerfile.includes(`COPY --from=tool /usr/local/bin/${tool} `), "Docker COPY dereferences the entry-point symlink");
    assert.match(dockerfile, /COPY --from=tool \/opt\/aob \/opt\/aob/);
  }
});

test("DeepSWE preparation accepts the two current tools before attempting task preparation", (t) => {
  const f = fixture(t); const source = join(f.work, "source");
  mkdirSync(join(source, ".git"), { recursive: true }); mkdirSync(join(source, "tasks"));
  writeFileSync(join(source, "tasks/manifest.json"), JSON.stringify({ source_dataset: "swe-bench-ultra" }));
  const durations = join(f.work, "durations.json"); writeFileSync(durations, JSON.stringify({ "task-one": [1, 2] }));
  const git = join(f.work, "bin/git");
  writeFileSync(git, '#!/bin/sh\nprintf "%s\\n" 0b9fabbb63b9104d678fe965e1632f2dd9eaa2ea\n'); chmodSync(git, 0o755);
  for (const tool of ["cline", "pi", "unknown"]) {
    const result = spawnSync(join(root, "scripts/prepare-deepswe-calibration.sh"), [source, join(f.work, `out-${tool}`), "task-one"], {
      encoding: "utf8", env: { ...f.env, AOB_TASK_TOOLS: tool, AOB_TASK_EXPECTED_MINUTES_FILE: durations, AOB_TASK_REGIME: "short", AOB_TASK_TIMEOUT_S: "300" },
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, tool === "unknown" ? /unsupported DeepSWE task tool/ : /unknown DeepSWE task: task-one/);
  }
});
