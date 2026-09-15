import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const root = fileURLToPath(new URL("..", import.meta.url));
const capture = join(root, "scripts/deepswe-capture-model-patch.sh");

function git(cwd, ...args) {
  execFileSync("git", ["-C", cwd, ...args], { stdio: "ignore" });
}

test("captures the final workspace against an immutable base after Git history is removed", () => {
  const temp = mkdtempSync(join(tmpdir(), "aob-deepswe-patch-"));
  try {
    const base = join(temp, "base");
    const workspace = join(temp, "workspace");
    const patch = join(temp, "model.patch");
    mkdirSync(base);
    git(base, "init", "--quiet");
    git(base, "config", "user.name", "test");
    git(base, "config", "user.email", "test@example.invalid");
    writeFileSync(join(base, "keep.txt"), "base\n");
    writeFileSync(join(base, "remove.txt"), "remove\n");
    writeFileSync(join(base, ".gitignore"), ".aob-home/\n");
    git(base, "add", ".");
    git(base, "commit", "--quiet", "-m", "base");
    execFileSync("git", ["clone", "--quiet", base, workspace]);
    writeFileSync(join(workspace, "keep.txt"), "changed\n");
    rmSync(join(workspace, "remove.txt"));
    writeFileSync(join(workspace, "added.txt"), "added\n");
    mkdirSync(join(workspace, ".aob-home"));
    writeFileSync(join(workspace, ".aob-home", "secret"), "do-not-capture\n");
    rmSync(join(workspace, ".git"), { recursive: true, force: true });

    execFileSync("sh", [capture, base, workspace, patch]);
    const text = readFileSync(patch, "utf8");
    assert.match(text, /keep\.txt/);
    assert.match(text, /remove\.txt/);
    assert.match(text, /added\.txt/);
    assert.doesNotMatch(text, /do-not-capture|\.aob-home|\.git\//);
    assert.equal(execFileSync("git", ["-C", workspace, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(), execFileSync("git", ["-C", base, "rev-parse", "HEAD"], { encoding: "utf8" }).trim());
    assert.equal(readFileSync(join(workspace, "keep.txt"), "utf8"), "base\n");
    assert.equal(readFileSync(join(workspace, "remove.txt"), "utf8"), "remove\n");
    assert.equal(existsSync(join(workspace, "added.txt")), false);

    const check = join(temp, "check");
    execFileSync("git", ["clone", "--quiet", base, check]);
    execFileSync("git", ["-C", check, "apply", "--check", patch]);
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test("DeepSWE preparation wires the immutable patch-capture helper into verifier images", () => {
  const preparation = readFileSync(join(root, "scripts/prepare-deepswe-calibration.sh"), "utf8");
  const dockerfile = readFileSync(join(root, "scripts/deepswe-verifier.Dockerfile"), "utf8");
  assert.match(preparation, /deepswe-capture-model-patch\.sh/);
  assert.match(preparation, /aob-capture-model-patch \/app \/work\/workspace/);
  assert.match(dockerfile, /COPY capture-model-patch\.sh \/usr\/local\/bin\/aob-capture-model-patch/);
});

// Explicit local invocation only: CI neither pulls images nor needs Docker.
const dockerImage = process.env.AOB_DOCKER_PATCH_CAPTURE_IMAGE;
test("captures foreign-owner archives with all container capabilities dropped", { skip: !dockerImage }, () => {
  assert.match(dockerImage, /^sha256:[a-f0-9]{64}$/);
  const script = `set -eu
mkdir -p /tmp/base /tmp/bin
git -C /tmp/base init --quiet
git -C /tmp/base config user.name test
git -C /tmp/base config user.email test@example.invalid
printf 'base\\n' > /tmp/base/keep.txt
printf 'remove\\n' > /tmp/base/remove.txt
git -C /tmp/base add .
git -C /tmp/base commit --quiet -m base
git clone --quiet /tmp/base /tmp/workspace
printf 'changed\\n' > /tmp/workspace/keep.txt
rm /tmp/workspace/remove.txt
printf 'added\\n' > /tmp/workspace/added.txt
ln -s keep.txt /tmp/workspace/link
rm -rf /tmp/workspace/.git
# Make the archive carry the foreign IDs regardless of host platform. The
# extraction still uses real GNU tar under the verifier's privilege boundary.
cat > /tmp/bin/tar <<'SH'
#!/bin/sh
case " $* " in
  *" -cf "*) exec /usr/bin/tar --owner=501 --group=20 "$@" ;;
  *) exec /usr/bin/tar "$@" ;;
esac
SH
chmod +x /tmp/bin/tar
PATH=/tmp/bin:$PATH sh /capture /tmp/base /tmp/workspace /tmp/model.patch
git -C /tmp/base apply --check /tmp/model.patch
test "$(cat /tmp/workspace/keep.txt)" = base
test -f /tmp/workspace/remove.txt
test ! -e /tmp/workspace/added.txt
cat /tmp/model.patch
`;
  const patch = execFileSync("docker", [
    "run", "--pull=never", "--rm", "--user", "0:0", "--network", "none", "--read-only",
    "--cap-drop=ALL", "--security-opt", "no-new-privileges",
    "--tmpfs", "/tmp:rw,exec,nosuid,size=64m",
    "--mount", `type=bind,src=${capture},dst=/capture,readonly`,
    "--entrypoint", "sh", dockerImage, "-c", script,
  ], { encoding: "utf8", timeout: 30_000 });
  assert.match(patch, /keep\.txt/);
  assert.match(patch, /deleted file mode/);
  assert.match(patch, /added\.txt/);
  assert.match(patch, /new file mode 120000/);
  assert.doesNotMatch(patch, /\.git\//);
});

const ownershipImage = process.env.AOB_DOCKER_VERIFIER_OWNERSHIP_IMAGE;
test("verifier trusts the foreign-owned workspace through capture and subsequent native Git operations", { skip: !ownershipImage }, () => {
  assert.match(ownershipImage, /^sha256:[a-f0-9]{64}$/);
  const volume = `aob-verifier-ownership-${randomUUID()}`;
  execFileSync("docker", ["volume", "create", volume], {stdio:"ignore",timeout:30_000});
  try {
    // Set up actual ownership separately; verification itself retains no caps.
    execFileSync("docker", ["run","--pull=never","--rm","--user","0:0","--network","none","--read-only",
      "--cap-drop=ALL","--cap-add=CHOWN","--security-opt","no-new-privileges",
      "--mount",`type=volume,src=${volume},dst=/work`,"--entrypoint","sh",ownershipImage,"-c",
      "mkdir /work/workspace && chmod 0777 /work/workspace && chown 501:20 /work/workspace"], {stdio:"pipe",timeout:30_000});
    const script = `set -eu
mkdir /tmp/base
git -C /tmp/base init --quiet
git -C /tmp/base config user.name test
git -C /tmp/base config user.email test@example.invalid
printf 'base\\n' > /tmp/base/keep.txt
printf 'remove\\n' > /tmp/base/remove.txt
git -C /tmp/base add .
git -C /tmp/base commit --quiet -m base
printf 'changed\\n' > /work/workspace/keep.txt
printf 'added\\n' > /work/workspace/added.txt
test "$(stat -c %u /work/workspace)" = 501
/usr/local/bin/aob-capture-model-patch /tmp/base /work/workspace /tmp/model.patch
# Native verifier commands run in separate Git invocations after capture.
git -C /work/workspace clean -fd
test "$(cat /work/workspace/keep.txt)" = base
test -f /work/workspace/remove.txt
test ! -e /work/workspace/added.txt
git -C /work/workspace apply --check /tmp/model.patch
git -C /work/workspace apply /tmp/model.patch
test "$(cat /work/workspace/keep.txt)" = changed
test ! -e /work/workspace/remove.txt
test "$(cat /work/workspace/added.txt)" = added
printf 'ownership verification passed\\n'
`;
    const output = execFileSync("docker",["run","--pull=never","--rm","--user","0:0","--network","none","--read-only",
      "--cap-drop=ALL","--security-opt","no-new-privileges","--tmpfs","/tmp:rw,noexec,nosuid,nodev,size=64m",
      "--mount",`type=volume,src=${volume},dst=/work`,"--entrypoint","sh",ownershipImage,"-c",script],{encoding:"utf8",timeout:30_000});
    assert.match(output,/ownership verification passed/);
  } finally { execFileSync("docker",["volume","rm","--force",volume],{stdio:"ignore",timeout:30_000}); }
});
