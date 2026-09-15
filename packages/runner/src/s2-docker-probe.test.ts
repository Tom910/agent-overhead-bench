import { spawn } from "node:child_process";
import { chmod, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

describe("S2 Docker probe cleanup", () => {
  it("uses the normalized OpenAI-compatible model in both OpenCode probe branches", async () => {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
    const script = await readFile(join(root, "images/incontainer-probe.sh"), "utf8");

    expect(script).toContain('run opencode run --model "$OPENAI_MODEL" "$PROMPT"');
    expect(script).toContain('run opencode --model "$OPENAI_MODEL" -p "$PROMPT"');
    expect(script).not.toContain('run opencode --model "$MODEL" -p "$PROMPT"');
  });

  it("does not throttle model quality or spend in the Claude and Codex probes", async () => {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
    const script = await readFile(join(root, "images/incontainer-probe.sh"), "utf8");

    expect(script).not.toContain("--effort low");
    expect(script).not.toContain("--max-budget-usd");
    expect(script).toContain("model_reasoning_effort = \"high\"");
    expect(script).not.toContain("model_reasoning_effort = \"low\"");
  });

  it("bounds the Docker daemon readiness check", async () => {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
    const script = await readFile(join(root, "scripts/s2-docker-probe.sh"), "utf8");

    expect(script).toContain('DOCKER_INFO_TIMEOUT_MS="${AOB_S2_DOCKER_INFO_TIMEOUT_MS:-10000}"');
    expect(script).toContain('node "$ROOT/scripts/command-timeout.mjs" "$DOCKER_INFO_TIMEOUT_MS" docker info >/dev/null');
    expect(script).not.toMatch(/^docker info \/dev\/null$/m);
  });

  it("removes the temporary key file when interrupted", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-s2-probe-test-"));
    const fakeBin = join(dir, "docker");
    const envSource = join(dir, "source.env");
    const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
    await writeFile(envSource, "OPENROUTER_API_KEY=sk-or-test\n");
    await writeFile(fakeBin, `#!/bin/sh
set -eu
case "$*" in
  info*) while :; do sleep 1; done ;;
esac
exit 0
`);
    await chmod(fakeBin, 0o700);
    const child = spawn("bash", [join(root, "scripts/s2-docker-probe.sh"), "codex"], {
      cwd: root,
      detached: true,
      env: { ...process.env, PATH: `${dir}:${process.env.PATH ?? ""}`, TMPDIR: dir, AOB_ENV_FILE: envSource, AOB_S2_SKIP_BUILD: "1", AOB_MODEL: "z-ai/glm-5.3-flash" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    try {
      let envFiles: string[] = [];
      for (let attempt = 0; attempt < 50; attempt += 1) {
        envFiles = (await readdir(dir)).filter((name) => name.startsWith("aob-s2-env."));
        if (envFiles.length > 0) break;
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      expect(envFiles.length).toBe(1);
      process.kill(-child.pid!, "SIGTERM");
      const result = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve) => {
        child.once("exit", (code, signal) => resolve({ code, signal }));
      });
      expect(result.code === 143 || result.signal === "SIGTERM").toBe(true);
      expect((await readdir(dir)).filter((name) => name.startsWith("aob-s2-env.")).length).toBe(0);
    } finally {
      try { process.kill(-child.pid!, "SIGKILL"); } catch { /* already exited */ }
      await rm(dir, { recursive: true, force: true });
    }
  }, 15_000);

  it("times out a wedged Docker readiness check and cleans its key file", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-s2-probe-timeout-test-"));
    const fakeBin = join(dir, "docker");
    const envSource = join(dir, "source.env");
    const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
    await writeFile(envSource, "OPENROUTER_API_KEY=sk-or-test\n");
    await writeFile(fakeBin, `#!/bin/sh
set -eu
case "$*" in
  info*) while :; do sleep 1; done ;;
esac
exit 0
`);
    await chmod(fakeBin, 0o700);
    const child = spawn("bash", [join(root, "scripts/s2-docker-probe.sh"), "codex"], {
      cwd: root,
      detached: true,
      env: { ...process.env, PATH: `${dir}:${process.env.PATH ?? ""}`, TMPDIR: dir, AOB_ENV_FILE: envSource, AOB_S2_SKIP_BUILD: "1", AOB_MODEL: "z-ai/glm-5.3-flash", AOB_S2_DOCKER_INFO_TIMEOUT_MS: "100" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    try {
      const result = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve, reject) => {
        child.once("error", reject);
        child.once("exit", (code, signal) => resolve({ code, signal }));
      });
      expect(result).toEqual({ code: 124, signal: null });
      expect((await readdir(dir)).filter((name) => name.startsWith("aob-s2-env.")).length).toBe(0);
    } finally {
      try { process.kill(-child.pid!, "SIGKILL"); } catch { /* already exited */ }
      await rm(dir, { recursive: true, force: true });
    }
  }, 5_000);
});
