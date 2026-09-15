import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { chmodSync, cpSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { parseTaskYaml } from "./yaml.js";
import { validateLocalTaskManifest } from "./source.js";
import { validatePristine, validatePristineTasks, validateWithReference } from "./validate.js";

const suiteDir = join(dirname(fileURLToPath(import.meta.url)), "../suite");

describe("task.yaml parser", () => {
  it("parses C2 fields", () => {
    const t = parseTaskYaml(`id: py-small-testfix-1
source:
  kind: local-development
  repository: agent-overhead-bench
  revision: working-tree
  task_id: py-small-testfix-1
  license_notes: local fixture
language: python
size: small
shape: test-fix
timeout_s: 60
expected_minutes: [1, 5]
description: Make the failing unit test for add() pass.
`);
    expect(t.language).toBe("python");
    expect(t.expected_minutes).toEqual([1, 5]);
  });
});

describe("suite validate (CI)", () => {
  it("checked-in source manifest matches the prepared suite", () => {
    const manifest = JSON.parse(readFileSync(join(dirname(suiteDir), "suite-manifest.json"), "utf8"));
    expect(() => validateLocalTaskManifest(suiteDir, manifest)).not.toThrow();
  });

  it("ignores a generated manifest file when walking task directories", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-task-manifest-file-"));
    const selected = "py-small-testfix-1";
    cpSync(join(suiteDir, selected), join(root, selected), { recursive: true });
    writeFileSync(join(root, "suite-manifest.json"), "{}\n");
    expect(validatePristine(root)).toEqual([{ id: selected, ok: true, detail: "pristine-fail" }]);
  });

  it("ignores prepared-source evidence directories when walking task directories", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-task-evidence-dir-"));
    const selected = "py-small-testfix-1";
    cpSync(join(suiteDir, selected), join(root, selected), { recursive: true });
    mkdirSync(join(root, "reference-polarity"));
    writeFileSync(join(root, "reference-polarity", `${selected}.json`), "{}\n");
    expect(validatePristine(root)).toEqual([{ id: selected, ok: true, detail: "pristine-fail" }]);
  });

  it("every original task has structure and pristine verify fails", () => {
    const results = validatePristine(suiteDir);
    const ids = results.map((r) => r.id).sort();
    expect(ids).toEqual(
      [
        "py-medium-feature-1",
        "py-medium-refactor-1",
        "py-small-bugfix-1",
        "py-small-testfix-1",
        "ts-medium-feature-1",
        "ts-medium-refactor-1",
        "ts-small-bugfix-1",
        "ts-small-testfix-1",
      ].sort(),
    );
    const failed = results.filter((r) => !r.ok);
    expect(failed, JSON.stringify(failed)).toEqual([]);
  }, 15_000);

  it("can validate only the selected tasks in a larger source tree", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-selected-tasks-"));
    const selected = "py-small-testfix-1";
    cpSync(join(suiteDir, selected), join(root, selected), { recursive: true });
    mkdirSync(join(root, "unselected-broken"));
    const results = validatePristineTasks([{ id: selected, dir: join(root, selected) }]);
    expect(results).toEqual([{ id: selected, ok: true, detail: "pristine-fail" }]);
  });

  it("validates a native verifier descriptor without requiring verify.sh", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-native-validate-"));
    const task = join(root, "native-task");
    mkdirSync(join(task, "workspace"), { recursive: true });
    writeFileSync(join(task, "task.yaml"), `id: native-task
source:
  kind: local-development
  repository: agent-overhead-bench
  revision: working-tree
  task_id: native-task
  license_notes: local fixture
language: python
size: small
shape: bugfix
timeout_s: 60
expected_minutes: [1, 5]
description: native verifier fixture
`);
    writeFileSync(join(task, "prompt.md"), "x\n");
    writeFileSync(join(task, "verifier.json"), JSON.stringify({
      kind: "docker-command", image: "aob-native-verifier:s2", image_digest: "sha256:" + "a".repeat(64),
      command: ["native-check"], workdir: ".", network: "none",
    }));
    writeFileSync(join(task, "workspace", "main.py"), "x = 1\n");
    writeFileSync(join(task, "workspace", "run.sh"), "#!/bin/sh\nexit 1\n");
    chmodSync(join(task, "workspace", "run.sh"), 0o755);
    mkdirSync(join(task, "workspace", "docs", "reference"), { recursive: true });
    writeFileSync(join(task, "workspace", "docs", "reference", "public.rst"), "public\n");
    const binDir = join(root, "bin");
    mkdirSync(binDir);
    const docker = join(binDir, "docker");
    const argsPath = join(root, "docker-args");
    writeFileSync(docker, `#!/bin/sh
printf '%s\\n' "$*" >> "${argsPath}"
if [ "$1" = image ]; then
  case "$*" in *@sha256:*) exit 1 ;; esac
  printf '%s\\n' "sha256:${"a".repeat(64)}"
  exit 0
fi
mount=
while [ "$#" -gt 0 ]; do
  if [ "$1" = --mount ]; then
    case "$2" in
      type=bind,src=*,dst=/work/workspace,readonly=false) mount=\${2#type=bind,src=}; mount=\${mount%,dst=/work/workspace,readonly=false} ;;
    esac
    shift 2
  else
    shift
  fi
done
[ -n "$mount" ] && [ -x "$mount/run.sh" ] && [ -f "$mount/docs/reference/public.rst" ] || exit 2
exit 1
`);
    chmodSync(docker, 0o755);
    const oldPath = process.env.PATH;
    process.env.PATH = `${binDir}:${oldPath ?? "/usr/bin:/bin"}`;
    try {
      expect(validatePristineTasks([{ id: "native-task", dir: task }])).toEqual([
        { id: "native-task", ok: true, detail: "pristine-fail" },
      ]);
      const dockerArgs = readFileSync(argsPath, "utf8");
      expect(dockerArgs).toContain("run --pull=never");
      expect(dockerArgs).toContain("--tmpfs /tmp:rw,noexec,nosuid,nodev,size=64m");
      expect(dockerArgs).toContain("readonly=false");
      expect(dockerArgs).not.toContain("aob-native-verifier:s2@sha256:");
      expect(dockerArgs).toContain("--entrypoint native-check sha256:" + "a".repeat(64));
      if (process.platform === "linux") {
        expect(dockerArgs).toContain(`--user ${process.getuid!()}:${process.getgid!()}`);
        expect(dockerArgs).toContain("--env HOME=/tmp");
      }
      writeFileSync(argsPath, "");
      writeFileSync(docker, readFileSync(docker, "utf8").replace("a".repeat(64), "b".repeat(64)));
      const drift = validatePristineTasks([{ id: "native-task", dir: task }]);
      expect(drift[0]?.ok).toBe(false);
      expect(drift[0]?.detail).toContain("image identity drift");
      expect(readFileSync(argsPath, "utf8")).not.toContain("run --pull=never");
    } finally {
      process.env.PATH = oldPath;
    }
  });

  it("rejects symlinked selected task inputs", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-selected-symlink-"));
    const selected = "py-small-testfix-1";
    symlinkSync(join(suiteDir, selected), join(root, selected));
    const results = validatePristineTasks([{ id: selected, dir: join(root, selected) }]);
    expect(results[0]?.ok).toBe(false);
    expect(results[0]?.detail).toMatch(/regular directory/);
  });

  it("rejects unstable verifier exit codes", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-unstable-verifier-"));
    const task = join(root, "unstable-task");
    const state = join(root, "state");
    mkdirSync(join(task, "workspace"), { recursive: true });
    mkdirSync(join(task, "reference"));
    writeFileSync(join(task, "task.yaml"), `id: unstable-task
source:
  kind: local-development
  repository: agent-overhead-bench
  revision: working-tree
  task_id: unstable-task
  license_notes: local fixture
language: python
size: small
shape: bugfix
timeout_s: 60
expected_minutes: [1, 5]
description: unstable verifier fixture
`);
    writeFileSync(join(task, "prompt.md"), "x\n");
    writeFileSync(join(task, "workspace", "main.py"), "x = 1\n");
    writeFileSync(join(task, "reference", "solution.py"), "x = 2\n");
    writeFileSync(join(task, "verify.sh"), [
      "#!/bin/sh",
      `count=0; if [ -f "${state}" ]; then count=$(cat "${state}"); fi`,
      `count=$((count + 1)); echo "$count" > "${state}"`,
      "if [ -f workspace/solution.py ]; then",
      "  if [ $((count % 2)) -eq 0 ]; then exit 0; else exit 1; fi",
      "fi",
      "if [ $((count % 2)) -eq 0 ]; then exit 2; else exit 1; fi",
      "",
    ].join("\n"), { mode: 0o755 });
    const pristine = validatePristineTasks([{ id: "unstable-task", dir: task }]);
    expect(pristine[0]?.ok).toBe(false);
    expect(pristine[0]?.detail).toMatch(/stable|unstable|exit/i);
    writeFileSync(state, "0\n");
    const reference = validateWithReference(root);
    expect(reference[0]?.ok).toBe(false);
    expect(reference[0]?.detail).toMatch(/stable|unstable|exit/i);
  });

  it("does not let pristine verification read the private reference directory", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-pristine-reference-"));
    const task = join(root, "reference-dependent");
    mkdirSync(join(task, "workspace"), { recursive: true });
    mkdirSync(join(task, "reference"));
    writeFileSync(join(task, "task.yaml"), `id: reference-dependent
source:
  kind: local-development
  repository: agent-overhead-bench
  revision: working-tree
  task_id: reference-dependent
  license_notes: local fixture
language: python
size: small
shape: bugfix
timeout_s: 60
expected_minutes: [1, 5]
description: reference isolation fixture
`);
    writeFileSync(join(task, "prompt.md"), "x\n");
    writeFileSync(join(task, "workspace", "main.py"), "x = 1\n");
    writeFileSync(join(task, "reference", "solution.txt"), "private\n");
    writeFileSync(join(task, "verify.sh"), "#!/bin/sh\n[ -f reference/solution.txt ]\n", { mode: 0o755 });
    const result = validatePristineTasks([{ id: "reference-dependent", dir: task }]);
    expect(result[0]?.ok).toBe(true);
    expect(result[0]?.detail).toBe("pristine-fail");
  });

  it("validateWithReference errors when reference/ is missing", () => {
    const tmp = mkdtempSync(join(tmpdir(), "aob-noref-"));
    const task = join(tmp, "py-small-testfix-1");
    mkdirSync(join(task, "workspace"), { recursive: true });
    writeFileSync(
      join(task, "task.yaml"),
      `id: py-small-testfix-1
source:
  kind: local-development
  repository: agent-overhead-bench
  revision: working-tree
  task_id: py-small-testfix-1
  license_notes: local fixture
language: python
size: small
shape: test-fix
timeout_s: 60
expected_minutes: [1, 5]
description: x
`,
    );
    writeFileSync(join(task, "prompt.md"), "x");
    writeFileSync(join(task, "verify.sh"), "#!/bin/sh\nexit 1\n", { mode: 0o755 });
    writeFileSync(join(task, "workspace", "x.py"), "x");
    const results = validateWithReference(tmp);
    expect(results).toHaveLength(1);
    expect(results[0]?.ok).toBe(false);
    expect(results[0]?.detail).toMatch(/reference missing/);
  });

  it("validate:reference config loads the overlay file; default config excludes it", () => {
    const pkg = join(dirname(fileURLToPath(import.meta.url)), "..");
    const def = spawnSync("npx", ["vitest", "list"], { cwd: pkg, encoding: "utf8" });
    const overlay = spawnSync("npx", ["vitest", "list", "--config", "vitest.reference.config.ts"], {
      cwd: pkg,
      encoding: "utf8",
    });
    const defOut = `${def.stdout}${def.stderr}`;
    const overlayOut = `${overlay.stdout}${overlay.stderr}`;
    expect(overlay.status, overlayOut).toBe(0);
    expect(overlayOut).toMatch(/validate\.reference\.test/);
    expect(overlayOut).not.toMatch(/No test files found/i);
    expect(defOut).not.toMatch(/validate\.reference\.test/);
  }, 15_000);

  it("npm run validate:reference does not report No test files found", () => {
    const pkg = join(dirname(fileURLToPath(import.meta.url)), "..");
    const r = spawnSync("npm", ["run", "validate:reference"], { cwd: pkg, encoding: "utf8" });
    const out = `${r.stdout}${r.stderr}`;
    expect(out).not.toMatch(/No test files found/i);
    expect(out).toMatch(/validate\.reference\.test/);
  }, 15_000);
});
