import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { qwenAdapter } from "./qwen.js";

const prompts = [
  '- Update `display` and $(literal)\n- Preserve "quotes", café and $variables\n\t  ',
  "--help\n--model=literal-text\n",
  "-",
  "Ordinary prompt with trailing whitespace\n\n  ",
];

for (const condition of ["pinned", "default"] as const) {
  it.each(prompts)(`preserves exact Qwen prompt bytes and flags (${condition}): %j`, (prompt) => {
    const root = mkdtempSync(join(tmpdir(), "aob-qwen-prompt-"));
    try {
      const workspace = join(root, "workspace with spaces");
      mkdirSync(workspace);
      const promptFile = join(root, "prompt.md");
      writeFileSync(promptFile, prompt);
      const invocation = qwenAdapter.containerInvocation!({
        workspaceDir: workspace, promptFile, model: "mock",
        proxyUrl: "http://127.0.0.1:1234", condition, timeoutS: 10, env: {},
      });
      expect(invocation.argv[0]).toBe("qwen");
      // Exercise a real argv boundary and option-value parsing without a CLI,
      // Docker, provider credentials or a network dependency in CI. The pinned
      // Qwen parser's acceptance is separately proved in the S4 stage plan.
      const output = execFileSync(process.execPath, ["--input-type=module", "-e", `
        import { parseArgs } from "node:util";
        const { values } = parseArgs({ args: process.argv.slice(1), options: {
          prompt: { type: "string", short: "p" },
          model: { type: "string", short: "m" },
          yolo: { type: "boolean" },
          output: { type: "string", short: "o" },
        } });
        process.stdout.write(JSON.stringify(values));
      `, "--", ...invocation.argv.slice(1)], {
        cwd: workspace, encoding: "utf8", timeout: 10_000,
        env: {}, stdio: ["ignore", "pipe", "pipe"],
      });
      const parsed = JSON.parse(output) as { prompt: string; model?: string; yolo: boolean; output: string };
      expect(Buffer.from(parsed.prompt, "utf8")).toEqual(Buffer.from(prompt, "utf8"));
      expect(parsed.model).toBe(condition === "pinned" ? "mock" : undefined);
      expect(parsed.yolo).toBe(true);
      expect(parsed.output).toBe("json");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
}
