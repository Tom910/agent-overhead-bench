import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { claudeCodeAdapter } from "./claude-code.js";
import { clineAdapter } from "./cline.js";

for (const adapter of [claudeCodeAdapter, clineAdapter]) {
  for (const condition of ["pinned", "default"] as const) {
    it.each(["- Update `display`\n--help\n café $(literal)\n  ", "--model=literal", "-", "Ordinary\n  "])(
      `${adapter.name} preserves literal prompt (${condition}): %j`, (prompt) => {
        const root = mkdtempSync(join(tmpdir(), "aob-literal-"));
        try {
          const promptFile = join(root, "prompt.md");
          writeFileSync(promptFile, prompt);
          const invocation = adapter.containerInvocation!({
            workspaceDir: root, promptFile, model: "mock", condition,
            proxyUrl: "http://127.0.0.1:9", timeoutS: 10, env: {},
          });
          const output = execFileSync(process.execPath, ["--input-type=module", "-e", `
            import { parseArgs } from "node:util";
            const parsed = parseArgs({ args: process.argv.slice(1), allowPositionals: true, options: {
              print: {type:"boolean",short:"p"}, "output-format": {type:"string"},
              "permission-mode": {type:"string"}, json: {type:"boolean"},
              "auto-approve": {type:"string"}, provider: {type:"string"}, model: {type:"string"},
            }});
            process.stdout.write(JSON.stringify(parsed));
          `, "--", ...invocation.argv.slice(1)], { encoding: "utf8", env: {}, timeout: 10000 });
          const parsed = JSON.parse(output) as { positionals: string[]; values: Record<string, unknown> };
          expect(parsed.positionals).toEqual([prompt]);
          if (adapter.name === "claude-code") {
            expect(parsed.values).toEqual({ print: true, "output-format": "json", "permission-mode": "bypassPermissions" });
          } else {
            expect(parsed.values).toEqual({ json: true, "auto-approve": "true",
              ...(condition === "pinned" ? { provider: "openai-compatible", model: "mock" } : {}) });
          }
        } finally { rmSync(root, { recursive: true, force: true }); }
      });
  }
}

 it("Claude compatibility excludes WebSearch while preserving the literal prompt", () => {
   const root = mkdtempSync(join(tmpdir(), "aob-no-search-"));
   try {
     const promptFile = join(root, "prompt.md");
     writeFileSync(promptFile, "--literal prompt");
     const invocation = claudeCodeAdapter.containerInvocation!({
       workspaceDir: root, promptFile, model: "mock", condition: "pinned",
       proxyUrl: "http://127.0.0.1:9", timeoutS: 10, env: {},
       toolConfiguration: "claude-code-no-web-search",
     });
     expect(invocation.argv.slice(-4)).toEqual(["--disallowedTools", "WebSearch", "--", "--literal prompt"]);
   } finally { rmSync(root, { recursive: true, force: true }); }
 });
