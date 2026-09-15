import { chmodSync, copyFileSync, cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { ConfigError } from "@aob/contracts";
import { loadTaskYaml } from "./yaml.js";
import { validateVerifierSpec, type VerifierSpec } from "./source.js";

export type ValidateResult = { id: string; ok: boolean; detail: string };

type TaskSelection = { id: string; dir: string };

function copyPublicTask(source: string, destination: string, root = source): void {
  mkdirSync(destination, { recursive: true });
  for (const name of readdirSync(source).sort()) {
    const from = join(source, name);
    const to = join(destination, name);
    const info = lstatSync(from);
    if (info.isSymbolicLink()) throw new ConfigError(`task contains a symlink: ${from}`);
    if (name === "reference" && source === root) continue;
    if (info.isDirectory()) copyPublicTask(from, to, root);
    else if (info.isFile()) {
      copyFileSync(from, to);
      chmodSync(to, info.mode & 0o7777);
    }
    else throw new ConfigError(`task contains a non-regular entry: ${from}`);
  }
}

function walkDirs(root: string): string[] {
  return readdirSync(root).filter((n) => {
    const info = lstatSync(join(root, n));
    return info.isDirectory() && !info.isSymbolicLink() && existsSync(join(root, n, "task.yaml"));
  });
}

function overlayReference(workspace: string, reference: string): void {
  const copy = (from: string, to: string) => {
    for (const name of readdirSync(from)) {
      const src = join(from, name);
      const dest = join(to, name);
      if (statSync(src).isDirectory()) {
        copy(src, dest);
      } else {
        cpSync(src, dest);
      }
    }
  };
  copy(reference, workspace);
}

function runVerify(taskDir: string): number {
  const nativePath = join(taskDir, "verifier.json");
  let executable = "sh";
  let args = [join(taskDir, "verify.sh")];
  if (existsSync(nativePath)) {
    const verifier = readNativeVerifier(taskDir);
    if (verifier.kind !== "docker-command") throw new ConfigError("native verifier must be a Docker command");
    const workspace = join(taskDir, "workspace");
    const workdir = `/work/workspace${verifier.workdir === "." ? "" : `/${verifier.workdir}`}`;
    const image = verifier.image_digest;
    const inspected = spawnSync("docker", ["image", "inspect", "--format", "{{.Id}}", verifier.image], {
      cwd: taskDir,
      encoding: "utf8",
      timeout: 60_000,
      env: { PATH: process.env.PATH ?? "/usr/bin:/bin", CI: "1" },
    });
    if (inspected.error) {
      const error = inspected.error as NodeJS.ErrnoException;
      if (error.code === "ENOENT") throw new ConfigError("Docker executable is not available on PATH");
      throw new ConfigError(`cannot inspect native verifier image: ${error.message}`);
    }
    if (inspected.status !== 0) throw new ConfigError(`native verifier image is unavailable: ${image}`);
    if (inspected.stdout.trim().toLowerCase() !== image.toLowerCase()) {
      throw new ConfigError(`native verifier image identity drift: ${verifier.image}`);
    }
    const userArgs: string[] = [];
    if (process.platform === "linux") {
      if (process.getuid === undefined || process.getgid === undefined) throw new ConfigError("Linux workspace owner is unavailable");
      userArgs.push("--user", `${process.getuid()}:${process.getgid()}`, "--env", "HOME=/tmp");
    }
    executable = "docker";
    args = [
      "run", "--pull=never", "--rm", "--read-only", "--cap-drop=ALL", "--security-opt", "no-new-privileges", "--tmpfs", "/tmp:rw,noexec,nosuid,nodev,size=64m", "--network", "none",
      ...userArgs, "--workdir", workdir, "--mount", `type=bind,src=${workspace},dst=/work/workspace,readonly=false`,
      "--entrypoint", verifier.command[0]!, image, ...verifier.command.slice(1),
    ];
  }
  const r = spawnSync(executable, args, {
    cwd: taskDir,
    encoding: "utf8",
    timeout: 60_000,
    env: { PATH: process.env.PATH ?? "/usr/bin:/bin", CI: "1", PYTHONDONTWRITEBYTECODE: "1" },
  });
  if (r.error) {
    const error = r.error as NodeJS.ErrnoException;
    if (error.code === "ETIMEDOUT") return 124;
    if (error.code === "ENOENT" && executable === "docker") throw new ConfigError("Docker executable is not available on PATH");
  }
  return r.status ?? 1;
}

function requireStableExitCodes(codes: number[], predicate: (code: number) => boolean, label: string): void {
  if (codes.length === 0 || codes.some((code) => !predicate(code)) || codes.some((code) => code !== codes[0])) {
    throw new ConfigError(`${label} must have stable exit codes, got ${codes.join(",")}`);
  }
}

function readNativeVerifier(taskDir: string): VerifierSpec {
  try {
    const verifier = validateVerifierSpec(JSON.parse(readFileSync(join(taskDir, "verifier.json"), "utf8")));
    if (verifier.kind !== "docker-command") throw new ConfigError("native verifier must be a Docker command");
    return verifier;
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(`native verifier is invalid: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function assertStructure(taskDir: string, id: string): void {
  const taskInfo = lstatSync(taskDir);
  if (taskInfo.isSymbolicLink() || !taskInfo.isDirectory()) throw new ConfigError("task directory is not a regular directory");
  const yaml = loadTaskYaml(join(taskDir, "task.yaml"));
  if (yaml.id !== id) throw new ConfigError(`id mismatch ${yaml.id} vs ${id}`);
  for (const name of ["prompt.md", "workspace"]) {
    const entry = join(taskDir, name);
    if (!existsSync(entry)) throw new ConfigError(`missing ${name}`);
    const info = lstatSync(entry);
    const valid = name === "workspace" ? info.isDirectory() : info.isFile();
    if (info.isSymbolicLink() || !valid) throw new ConfigError(`${name} is not a regular ${name === "workspace" ? "directory" : "file"}`);
  }
  const script = join(taskDir, "verify.sh");
  const native = join(taskDir, "verifier.json");
  const hasScript = existsSync(script);
  const hasNative = existsSync(native);
  if (hasScript === hasNative) throw new ConfigError("task must contain exactly one of verify.sh or verifier.json");
  if (hasScript) {
    const info = lstatSync(script);
    if (info.isSymbolicLink() || !info.isFile()) throw new ConfigError("verify.sh is not a regular file");
    if ((info.mode & 0o111) === 0) throw new ConfigError("verify.sh is not executable");
  } else {
    const info = lstatSync(native);
    if (info.isSymbolicLink() || !info.isFile()) throw new ConfigError("verifier.json is not a regular file");
    readNativeVerifier(taskDir);
  }
}

/** CI path: structure + pristine verify must fail. Never requires gitignored reference/. */
function validatePristineTask({ id, dir }: TaskSelection): ValidateResult {
  try {
    assertStructure(dir, id);
    const tmp = mkdtempSync(join(tmpdir(), `aob-task-${id}-`));
    copyPublicTask(dir, tmp);
    try {
      const fails: number[] = [];
      for (let i = 0; i < 5; i++) fails.push(runVerify(tmp));
      requireStableExitCodes(fails, (code) => code !== 0, "pristine verify");
    } finally {
      rmSync(tmp, { recursive: true, force: true });
    }
    return { id, ok: true, detail: "pristine-fail" };
  } catch (e) {
    return { id, ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
}

/** Validates only the task directories selected for a run. */
export function validatePristineTasks(tasks: TaskSelection[]): ValidateResult[] {
  return tasks.map(validatePristineTask);
}

export function validatePristine(suiteDir: string): ValidateResult[] {
  return validatePristineTasks(walkDirs(suiteDir).map((id) => ({ id, dir: join(suiteDir, id) })));
}

/**
 * Local overlay path. Errors if `reference/` is missing — do not run in CI
 * (those dirs are gitignored).
 */
export function validateWithReference(suiteDir: string): ValidateResult[] {
  const results: ValidateResult[] = [];
  for (const id of walkDirs(suiteDir)) {
    const taskDir = join(suiteDir, id);
    try {
      assertStructure(taskDir, id);
      const refSrc = join(taskDir, "reference");
      if (!existsSync(refSrc)) {
        throw new ConfigError("reference missing (local overlay required)");
      }
      const tmp = mkdtempSync(join(tmpdir(), `aob-task-ref-${id}-`));
      cpSync(taskDir, tmp, { recursive: true });
      try {
        overlayReference(join(tmp, "workspace"), join(tmp, "reference"));
        rmSync(join(tmp, "workspace", "__pycache__"), { recursive: true, force: true });
        const passes: number[] = [];
        for (let i = 0; i < 5; i++) passes.push(runVerify(tmp));
        requireStableExitCodes(passes, (code) => code === 0, "reference verify");
      } finally {
        rmSync(tmp, { recursive: true, force: true });
      }
      results.push({ id, ok: true, detail: "reference-pass" });
    } catch (e) {
      results.push({ id, ok: false, detail: e instanceof Error ? e.message : String(e) });
    }
  }
  return results;
}

/** @deprecated use validatePristine (CI) or validateWithReference (local) */
export function validateSuite(suiteDir: string): ValidateResult[] {
  return validatePristine(suiteDir);
}

export function suiteRoot(): string {
  return join(new URL(".", import.meta.url).pathname, "../suite");
}
