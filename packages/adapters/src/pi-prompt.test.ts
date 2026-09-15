import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { expect, it } from "vitest";
import { piAdapter } from "./pi.js";

it("passes leading-hyphen prompts literally through Pi stdin", () => {
  const root = mkdtempSync(join(tmpdir(), "aob-pi-prompt-"));
  try {
    const workspace = join(root, "workspace with spaces");
    mkdirSync(workspace);
    const prompt = '- Update `display` and $(literal)\n- Preserve "quotes" and $variables\n';
    const promptFile = join(root, "prompt.md");
    writeFileSync(promptFile, prompt);
    const invocation = piAdapter.containerInvocation!({ workspaceDir: workspace, promptFile, model: "mock", proxyUrl: "http://127.0.0.1:1234", condition: "pinned", timeoutS: 10, env: {} });
    expect(invocation.argv[0]).toBe("sh");
    expect(invocation.argv[4]).toBe(".aob-pi-home/prompt.txt");
    for (const file of invocation.setupFiles ?? []) {
      mkdirSync(dirname(file.path), { recursive: true });
      writeFileSync(file.path, file.contents);
    }
    const bin = join(root, "bin");
    mkdirSync(bin);
    writeFileSync(join(bin, "pi"), '#!/bin/sh\nprintf "%s\\n" "$@" > "$AOB_TEST_ARGS"\ncat\n', { mode: 0o755 });
    const output = execFileSync(invocation.argv[0]!, invocation.argv.slice(1), {
      cwd: workspace,
      encoding: "utf8", env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, AOB_TEST_ARGS: join(root, "args") },
    });
    expect(output).toBe(prompt.trimEnd());
    expect(readFileSync(join(root, "args"), "utf8")).toContain("--provider\naob\n--model\nmock\n");
    writeFileSync(promptFile, "Ordinary prompt\n");
    const ordinary = piAdapter.containerInvocation!({ workspaceDir: workspace, promptFile, model: "mock", proxyUrl: "http://127.0.0.1:1234", condition: "pinned", timeoutS: 10, env: {} });
    expect(ordinary.argv[0]).toBe("pi");
    expect(ordinary.argv.at(-1)).toBe("Ordinary prompt");
  } finally { rmSync(root, { recursive: true, force: true }); }
});
