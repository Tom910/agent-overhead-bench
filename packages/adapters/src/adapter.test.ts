import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { startMockUpstream } from "@aob/mock-upstream";
import { ConfigError, validateC3AdapterResult } from "@aob/contracts";
import { startProxy } from "@aob/proxy";
import { claudeCodeAdapter } from "./claude-code.js";
import { codexAdapter } from "./codex.js";
import { createCodexToolEventParser } from "./codex-events.js";
import { hermesAdapter } from "./hermes.js";
import { mockAgentAdapter } from "./mock-agent.js";
import { getAdapter } from "./registry.js";
import { redact } from "./redact.js";
import { spawnAdapter } from "./spawn.js";

const stub = join(dirname(fileURLToPath(import.meta.url)), "test-stubs/record.mjs");

describe("redact", () => {
  it("strips sk-or- and Bearer tokens", () => {
    expect(redact("key sk-or-abcdefghijklmnop end")).toContain("[redacted]");
    expect(redact("Bearer supersecretvalue")).not.toMatch(/supersecretvalue/);
  });
});
describe("spawnAdapter", () => {
  it("turns structured-output parse failure into a failed adapter result", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-parser-failure-"));
    const script = join(dir, "malformed.mjs");
    await writeFile(script, 'process.stdout.write(JSON.stringify({ type: "item.started", item: { id: "open", type: "command_execution" } }) + "\\n");\n');

    const result = await spawnAdapter({
      bin: script,
      argv: [],
      cwd: dir,
      env: process.env as Record<string, string>,
      timeoutS: 1,
      extraRedact: [],
      toolEventParser: createCodexToolEventParser(),
    });

    expect(result.exitCode).toBe(1);
    expect(result.toolEvents).toBeUndefined();
    validateC3AdapterResult(result);
  });

  it("terminates descendants that keep adapter output pipes open", async () => {
    if (process.platform === "win32") return;
    const dir = await mkdtemp(join(tmpdir(), "aob-process-tree-timeout-"));
    const script = join(dir, "parent.mjs");
    const pidFile = join(dir, "child.pid");
    await writeFile(script, [
      'import { spawn } from "node:child_process";',
      'import { writeFileSync } from "node:fs";',
      'const child = spawn(process.execPath, ["-e", "setTimeout(() => {}, 10000)"], { stdio: ["ignore", "inherit", "inherit"] });',
      'writeFileSync(process.env.AOB_CHILD_PID_FILE, String(child.pid));',
      'process.exit(0);',
      "",
    ].join("\n"));

    const result = await Promise.race([
      spawnAdapter({
        bin: script,
        argv: [],
        cwd: dir,
        env: { ...process.env, AOB_CHILD_PID_FILE: pidFile },
        timeoutS: 0.25,
        extraRedact: [],
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1_500)),
    ]);
    const childPid = existsSync(pidFile) ? Number(await readFile(pidFile, "utf8")) : 0;
    if (result === null) {
      if (Number.isInteger(childPid) && childPid > 0) process.kill(childPid, "SIGKILL");
      throw new Error("spawnAdapter did not settle after the adapter timeout");
    }
    expect(result.exitCode).toBe(124);
    expect(childPid).toBeGreaterThan(0);
    expect(() => process.kill(childPid, 0)).toThrow();
  });

  it("returns 124 on timeout, closes stdin, and redacts captured output", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-timeout-"));
    const script = join(dir, "sleep.mjs");
    // Keep the event loop alive with a timer: a bare unsettled top-level await
    // drains it and makes Node exit 13 before the adapter timeout can fire.
    await writeFile(script, 'process.stdout.write("sk-or-timeout-secret\\n"); setTimeout(() => {}, 10_000);\n');

    const result = await spawnAdapter({
      bin: script,
      argv: [],
      cwd: dir,
      env: { ...process.env, AOB_TIMEOUT_SECRET: "sk-or-timeout-secret" },
      timeoutS: 0.05,
      extraRedact: ["sk-or-timeout-secret"],
    });

    expect(result.exitCode).toBe(124);
    expect(result.tEnd).toBeGreaterThanOrEqual(result.tStart);
    validateC3AdapterResult(result);
    expect(await readFile(result.artifacts.stdoutPath, "utf8")).not.toContain("sk-or-timeout-secret");
  });

  it("returns a schema-valid nonzero result and redacts failed-command output", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-failure-"));
    const script = join(dir, "fail.mjs");
    await writeFile(script, 'process.stdout.write("failure sk-or-command-secret\\n"); process.exit(7);\n');

    const result = await spawnAdapter({
      bin: script,
      argv: [],
      cwd: dir,
      env: { ...process.env, AOB_FAILURE_SECRET: "sk-or-command-secret" },
      timeoutS: 5,
      extraRedact: ["sk-or-command-secret"],
    });

    expect(result.exitCode).toBe(7);
    validateC3AdapterResult(result);
    expect(await readFile(result.artifacts.stdoutPath, "utf8")).not.toContain("sk-or-command-secret");
  });
});

describe("mock-agent adapter", () => {
  it("calls the proxy and writes SOLVED without leaking secrets into artifacts", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-ad-"));
    const mock = await startMockUpstream({ delayMs: 0, streamed: false, includeUsage: true, status: 200 });
    const proxy = await startProxy({
      run_id: "ad",
      upstream: mock.baseUrl,
      outPath: join(dir, "events.jsonl"),
    });
    try {
      const result = await mockAgentAdapter.run({
        workspaceDir: dir,
        promptFile: "prompt.md",
        model: "mock",
        proxyUrl: proxy.baseUrl,
        condition: "pinned",
        timeoutS: 15,
        env: { OPENROUTER_API_KEY: "sk-or-testleakvalue999" },
      });
      expect(result.exitCode).toBe(0);
      const solved = await readFile(join(dir, "SOLVED"), "utf8");
      expect(solved.trim()).toBe("ok");
      const stdout = await readFile(result.artifacts.stdoutPath, "utf8");
      const stderr = await readFile(result.artifacts.stderrPath, "utf8");
      expect(stdout + stderr).not.toContain("sk-or-testleakvalue999");
    } finally {
      await proxy.close();
      await mock.close();
    }
  });

  it("returns 124 when the mock process exceeds its timeout", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-ad-timeout-"));
    const mock = await startMockUpstream({ delayMs: 1000, streamed: false, includeUsage: true, status: 200 });
    const proxy = await startProxy({ run_id: "ad-timeout", upstream: mock.baseUrl, outPath: join(dir, "events.jsonl") });
    try {
      const result = await mockAgentAdapter.run({
        workspaceDir: dir,
        promptFile: "prompt.md",
        model: "mock",
        proxyUrl: proxy.baseUrl,
        condition: "pinned",
        timeoutS: 0.01,
        env: {},
      });
      expect(result.exitCode).toBe(124);
    } finally {
      await proxy.close();
      await mock.close();
    }
  });
});

describe("S2 keep adapters", () => {
  async function setup() {
    const dir = await mkdtemp(join(tmpdir(), "aob-s2ad-"));
    const prompt = join(dir, "prompt.md");
    await writeFile(prompt, "Add a function that returns 2. Do not explain.\n");
    await writeFile(join(dir, "hello.ts"), "export const hello = 1;\n");
    return { dir, prompt };
  }

  it("getAdapter resolves keep tools and rejects unknown", () => {
    expect(getAdapter("claude-code").name).toBe("claude-code");
    expect(getAdapter("mock-agent-secondary").name).toBe("mock-agent-secondary");
    expect(getAdapter("codex").name).toBe("codex");
    expect(getAdapter("codex").capabilities).toMatchObject({ toolVisibility: "partial" });
    expect(getAdapter("hermes").name).toBe("hermes");
    expect(getAdapter("claude-code").containerInvocation).toBeDefined();
    expect(getAdapter("codex").containerInvocation).toBeDefined();
    expect(getAdapter("hermes").containerInvocation).toBeDefined();
    expect(getAdapter("aider").capabilities).toMatchObject({ toolVisibility: "none", containerOnly: true });
    expect(getAdapter("opencode").capabilities).toMatchObject({ toolVisibility: "partial", containerOnly: true });
    expect(getAdapter("qwen").capabilities).toMatchObject({ toolVisibility: "partial", containerOnly: true });
    expect(() => getAdapter("unknown-tool")).toThrow(/unknown adapter/);
  });

  it("provides a fresh-container recipe for the zero-spend mock", async () => {
    const { dir, prompt } = await setup();
    const invocation = getAdapter("mock-agent").containerInvocation?.({
      workspaceDir: dir, promptFile: prompt, model: "mock",
      proxyUrl: "http://host.docker.internal:43123", condition: "pinned", timeoutS: 10, env: {},
    });
    expect(invocation?.image).toBe("aob-base:s2");
    expect(invocation?.workdir).toBe(dir);
    expect(invocation?.argv).toEqual(["node", "/work/workspace/.aob-mock-agent-cli.mjs", "/work/workspace/prompt.md", "/work/workspace"]);
    expect(invocation?.setupFiles?.[0]?.path).toBe(join(dir, ".aob-mock-agent-cli.mjs"));
  });

  it("exposes exact container recipes and rejects accidental host execution", async () => {
    const { dir, prompt } = await setup();
    const opts = {
      workspaceDir: dir,
      promptFile: prompt,
      model: "openai/gpt-4.1-mini",
      proxyUrl: "http://host.docker.internal:43123",
      condition: "pinned" as const,
      timeoutS: 10,
      env: { OPENROUTER_API_KEY: "sk-or-testleakvalue999" },
    };

    const aider = getAdapter("aider");
    const aiderInvocation = aider.containerInvocation?.(opts);
    expect(aiderInvocation?.argv).toEqual([
      "aider",
      "--yes-always",
      "--no-git",
      "--openai-api-base",
      "http://host.docker.internal:43123/v1",
      "--model",
      "openai/gpt-4.1-mini",
      "hello.ts",
      "--message",
      "Add a function that returns 2. Do not explain.",
    ]);
    expect(aiderInvocation?.env).not.toHaveProperty("OPENROUTER_API_KEY");
    expect(aiderInvocation?.env.OPENAI_API_KEY).toBe("sk-or-testleakvalue999");
    expect(aiderInvocation?.env.OPENAI_API_BASE).toBe("http://host.docker.internal:43123/v1");
    expect(aiderInvocation?.env.HOME).toBe(join(dir, ".aob-home"));
    expect(aiderInvocation?.setupFiles?.[0]?.path).toContain(".aob-home");
    expect(aiderInvocation?.toolVersion).toBe("0.86.2");
    expect(aiderInvocation?.versionArgv).toEqual(["aider", "--version"]);

    const qwenInvocation = getAdapter("qwen").containerInvocation?.(opts);
    expect(qwenInvocation?.setupFiles?.[0]?.contents).toContain('"selectedType":"openai"');
    expect(qwenInvocation?.env.HOME).toContain(".aob-qwen-home");
    expect(qwenInvocation?.argv).toEqual([
      "qwen",
      "--prompt=Add a function that returns 2. Do not explain.\n",
      "--yolo",
      "-m",
      "openai/gpt-4.1-mini",
      "-o",
      "json",
    ]);
    expect(qwenInvocation?.env).not.toHaveProperty("OPENROUTER_API_KEY");
    expect(qwenInvocation?.env.OPENAI_API_KEY).toBe("sk-or-testleakvalue999");
    expect(qwenInvocation?.env.OPENAI_BASE_URL).toBe("http://host.docker.internal:43123/v1");

    const opencodeInvocation = getAdapter("opencode").containerInvocation?.(opts);
    expect(opencodeInvocation?.argv).toEqual([
      "opencode",
      "run",
      "--format",
      "json",
      "--model",
      "openai/gpt-4.1-mini",
      "--",
      "Add a function that returns 2. Do not explain.",
    ]);
    expect(opencodeInvocation?.toolEventFormat).toBe("opencode-json");
    expect(opencodeInvocation?.env.OPENROUTER_API_KEY).toBe("sk-or-testleakvalue999");
    expect(opencodeInvocation?.env.OPENAI_API_KEY).toBe("sk-or-testleakvalue999");
    expect(opencodeInvocation?.env.OPENAI_BASE_URL).toBe("http://host.docker.internal:43123/v1");

    const requestedModel = getAdapter("opencode").containerInvocation?.({ ...opts, model: "z-ai/glm-5.3-flash" });
    const opencodeConfig = requestedModel?.setupFiles?.find((file) => file.path.endsWith(".config/opencode/opencode.json"))?.contents ?? "";
    expect(opencodeConfig).toContain('"model": "openai/z-ai/glm-5.3-flash"');
    expect(opencodeConfig).toContain('"small_model": "openai/z-ai/glm-5.3-flash"');

    const defaultInvocation = getAdapter("opencode").containerInvocation?.({ ...opts, condition: "default" });
    const defaultConfig = JSON.parse(defaultInvocation?.setupFiles?.find((file) => file.path.endsWith(".config/opencode/opencode.json"))?.contents ?? "{}") as Record<string, unknown>;
    expect(defaultInvocation?.argv).not.toContain("--model");
    expect(defaultConfig.model).toBeUndefined();
    expect(defaultConfig.small_model).toBeUndefined();

    const claudeInvocation = getAdapter("claude-code").containerInvocation?.(opts);
    expect(claudeInvocation?.image).toBe("aob-claude-code:s2");
    expect(claudeInvocation?.toolVersion).toBe("2.1.246");
    expect(claudeInvocation?.env.ANTHROPIC_BASE_URL).toBe("http://host.docker.internal:43123");
    expect(claudeInvocation?.env.ANTHROPIC_AUTH_TOKEN).toBe("sk-or-testleakvalue999");
    expect(claudeInvocation?.argv).not.toContain("--model");
    expect(claudeInvocation?.env.ANTHROPIC_DEFAULT_SONNET_MODEL).toBe("openai/gpt-4.1-mini");
    expect(claudeInvocation?.env.ANTHROPIC_DEFAULT_HAIKU_MODEL).toBe("openai/gpt-4.1-mini");
    expect(claudeInvocation?.env.ANTHROPIC_DEFAULT_OPUS_MODEL).toBe("openai/gpt-4.1-mini");
    expect(claudeInvocation?.env.ANTHROPIC_MODEL).toBe("openai/gpt-4.1-mini");
    expect(claudeInvocation?.env.ANTHROPIC_SMALL_FAST_MODEL).toBe("openai/gpt-4.1-mini");
    expect(claudeInvocation?.env.CLAUDE_CODE_DISABLE_1M_CONTEXT).toBe("1");
    expect(claudeInvocation?.env.CLAUDE_CODE_DISABLE_UNKNOWN_MODEL_WINDOW_ENFORCEMENT).toBe("1");
    expect(claudeInvocation?.argv).not.toContain("--effort");
    expect(claudeInvocation?.argv).not.toContain("low");
    expect(claudeInvocation?.argv).not.toContain("--max-budget-usd");
    expect(claudeInvocation?.user).toMatch(/^[1-9][0-9]*:[0-9]+$/);

    const codexInvocation = getAdapter("codex").containerInvocation?.(opts);
    expect(codexInvocation?.image).toBe("aob-codex:s2");
    expect(codexInvocation?.toolVersion).toBe("codex-cli 0.149.1");
    expect(codexInvocation?.setupFiles?.[0]?.contents).toContain("host.docker.internal:43123/v1");
    expect(codexInvocation?.env.PATH).toContain("codex-resources");
    expect(codexInvocation?.argv).toContain("openai/gpt-4.1-mini");
    expect(codexInvocation?.argv).toContain("--dangerously-bypass-approvals-and-sandbox");
    for (const feature of ["apps", "browser_use", "browser_use_external", "computer_use", "image_generation", "tool_search"]) {
      const flag = codexInvocation?.argv.indexOf(feature);
      if (flag === undefined) throw new Error(`missing Codex feature flag: ${feature}`);
      expect(flag).toBeGreaterThan(0);
      expect(codexInvocation?.argv[flag - 1]).toBe("--disable");
    }
    expect(codexInvocation?.argv).not.toContain("workspace-write");
    expect(codexInvocation?.setupFiles?.[0]?.contents).toContain('model_reasoning_effort = "high"');
    expect(codexInvocation?.setupFiles?.[0]?.contents).toContain('web_search = "disabled"');

    const hermesInvocation = getAdapter("hermes").containerInvocation?.(opts);
    expect(hermesInvocation?.image).toBe("aob-hermes:s2");
    expect(hermesInvocation?.toolVersion).toBe("Hermes Agent v0.20.5");
    expect(hermesInvocation?.env.OPENROUTER_BASE_URL).toBe("http://host.docker.internal:43123/v1");
    expect(hermesInvocation?.setupFiles?.some((file) => file.path.endsWith(".aob-home/.hermes/config.yaml") && file.contents.includes("oneshot_completion_wait_seconds: 0"))).toBe(true);
    expect(hermesInvocation?.argv).toContain("openai/gpt-4.1-mini");

    await expect(aider.run(opts)).rejects.toBeInstanceOf(ConfigError);
    await expect(getAdapter("opencode").run(opts)).rejects.toBeInstanceOf(ConfigError);
    await expect(getAdapter("qwen").run(opts)).rejects.toBeInstanceOf(ConfigError);
    await expect(aider.version()).rejects.toBeInstanceOf(ConfigError);
    await expect(getAdapter("opencode").version()).rejects.toBeInstanceOf(ConfigError);
    await expect(getAdapter("qwen").version()).rejects.toBeInstanceOf(ConfigError);
  });

  it("passes the actual staged files to aider instead of the S2 probe filename", async () => {
    const { dir, prompt } = await setup();
    await rm(join(dir, "hello.ts"));
    await writeFile(join(dir, "clamp.py"), "def clamp(x): return x\n");
    await mkdir(join(dir, ".git"));
    await writeFile(join(dir, ".git", "config"), "[core]\n\trepositoryformatversion = 0\n");
    const invocation = getAdapter("aider").containerInvocation?.({
      workspaceDir: dir,
      promptFile: prompt,
      model: "openai/gpt-4.1-mini",
      proxyUrl: "http://host.docker.internal:43123",
      condition: "pinned",
      timeoutS: 10,
      env: { OPENROUTER_API_KEY: "sk-or-testleakvalue999" },
    });
    expect(invocation?.argv).toContain("clamp.py");
    expect(invocation?.argv).not.toContain("hello.ts");
    expect(invocation?.argv).not.toContain(".git/config");
  });

  it("keeps Aider context bounded and prioritizes source over repository noise", async () => {
    const { dir, prompt } = await setup();
    await writeFile(join(dir, "README.md"), "noise\n".repeat(200_000));
    await writeFile(join(dir, "package-lock.json"), "noise\n".repeat(200_000));
    await writeFile(join(dir, "src.ts"), "export const source = 1;\n");
    const invocation = getAdapter("aider").containerInvocation?.({
      workspaceDir: dir,
      promptFile: prompt,
      model: "openai/gpt-4.1-mini",
      proxyUrl: "http://host.docker.internal:43123",
      condition: "pinned",
      timeoutS: 10,
      env: { OPENROUTER_API_KEY: "sk-or-testleakvalue999" },
    });
    expect(invocation?.argv).toContain("hello.ts");
    expect(invocation?.argv).toContain("src.ts");
    expect(invocation?.argv).not.toContain("README.md");
    expect(invocation?.argv).not.toContain("package-lock.json");
  });

  it("fails closed when no useful Aider file fits its context budget", async () => {
    const { dir, prompt } = await setup();
    await writeFile(join(dir, "hello.ts"), "x".repeat(3_000_001));
    expect(() => getAdapter("aider").containerInvocation?.({
      workspaceDir: dir,
      promptFile: prompt,
      model: "openai/gpt-4.1-mini",
      proxyUrl: "http://host.docker.internal:43123",
      condition: "pinned",
      timeoutS: 10,
      env: { OPENROUTER_API_KEY: "sk-or-testleakvalue999" },
    })).toThrow(ConfigError);
  });

  it("adds the OpenAI-compatible provider prefix for non-OpenAI model IDs", async () => {
    const { dir, prompt } = await setup();
    const opts = {
      workspaceDir: dir,
      promptFile: prompt,
      model: "z-ai/glm-5.3-flash",
      proxyUrl: "http://host.docker.internal:43123",
      condition: "pinned" as const,
      timeoutS: 10,
      env: { OPENROUTER_API_KEY: "sk-or-testleakvalue999" },
    };
    expect(getAdapter("aider").containerInvocation?.(opts).argv).toContain("openai/z-ai/glm-5.3-flash");
    expect(getAdapter("opencode").containerInvocation?.(opts).argv).toContain("openai/z-ai/glm-5.3-flash");
  });

  it("does not reuse pinned model flags for the default condition", async () => {
    const { dir, prompt } = await setup();
    const opts = {
      workspaceDir: dir,
      promptFile: prompt,
      model: "openai/gpt-4.1-mini",
      proxyUrl: "http://host.docker.internal:43123",
      condition: "default" as const,
      timeoutS: 10,
      env: { OPENROUTER_API_KEY: "sk-or-testleakvalue999" },
    };
    process.env.AOB_CLAUDE_BIN = stub;
    const claude = await getAdapter("claude-code").run({ ...opts, env: opts.env });
    const claudeInvocation = JSON.parse(await readFile(join(dir, "stub-invoke.json"), "utf8")) as { argv: string[]; env: Record<string, string> };
    expect(claudeInvocation.argv).not.toContain("--model");
    expect(claudeInvocation.env.ANTHROPIC_DEFAULT_SONNET_MODEL).toBeUndefined();
    expect(claude.exitCode).toBe(0);
  });

  it("claude-code copies S2 argv and OpenRouter env, redacts secrets", async () => {
    const { dir, prompt } = await setup();
    process.env.AOB_CLAUDE_BIN = stub;
    process.env.AOB_UNDECLARED_SECRET = "host-only-secret";
    const result = await claudeCodeAdapter.run({
      workspaceDir: dir,
      promptFile: prompt,
      model: "anthropic/claude-haiku-4.5",
      proxyUrl: "http://127.0.0.1:9",
      condition: "pinned",
      timeoutS: 10,
      env: { OPENROUTER_API_KEY: "sk-or-testleakvalue999" },
    });
    expect(result.exitCode).toBe(0);
    const invoked = JSON.parse(await readFile(join(dir, "stub-invoke.json"), "utf8")) as {
      argv: string[];
      env: Record<string, string>;
    };
    expect(invoked.argv).toEqual([
      "-p",
      "--output-format",
      "json",
      "--permission-mode",
      "bypassPermissions",
      "--",
      "Add a function that returns 2. Do not explain.\n",
    ]);
    expect(invoked.env.ANTHROPIC_BASE_URL).toBe("http://127.0.0.1:9");
    expect(invoked.env.ANTHROPIC_API_KEY).toBe("");
    expect(invoked.env.ANTHROPIC_AUTH_TOKEN).toBe("sk-or-testleakvalue999");
    expect(invoked.env.ANTHROPIC_DEFAULT_SONNET_MODEL).toBe("anthropic/claude-haiku-4.5");
    expect(invoked.env.ANTHROPIC_DEFAULT_HAIKU_MODEL).toBe("anthropic/claude-haiku-4.5");
    expect(invoked.env.ANTHROPIC_DEFAULT_OPUS_MODEL).toBe("anthropic/claude-haiku-4.5");
    expect(invoked.env.ANTHROPIC_MODEL).toBe("anthropic/claude-haiku-4.5");
    expect(invoked.env.ANTHROPIC_SMALL_FAST_MODEL).toBe("anthropic/claude-haiku-4.5");
    expect(invoked.env.CLAUDE_CODE_DISABLE_1M_CONTEXT).toBe("1");
    expect(invoked.env.CLAUDE_CODE_DISABLE_UNKNOWN_MODEL_WINDOW_ENFORCEMENT).toBe("1");
    expect(invoked.env.HOME).toContain(".aob-home");
    expect(invoked.env.AOB_UNDECLARED_SECRET).toBeUndefined();
    const logs = (await readFile(result.artifacts.stdoutPath, "utf8")) + (await readFile(result.artifacts.stderrPath, "utf8"));
    expect(logs).not.toContain("sk-or-testleakvalue999");
    delete process.env.AOB_UNDECLARED_SECRET;
  });

  it("codex writes isolated CODEX_HOME and does not pass --ignore-user-config", async () => {
    const { dir, prompt } = await setup();
    process.env.AOB_CODEX_BIN = stub;
    const result = await codexAdapter.run({
      workspaceDir: dir,
      promptFile: prompt,
      model: "openai/gpt-4.1-mini",
      proxyUrl: "http://127.0.0.1:9",
      condition: "pinned",
      timeoutS: 10,
      env: { OPENROUTER_API_KEY: "sk-or-testleakvalue999" },
    });
    expect(result.exitCode).toBe(0);
    const invoked = JSON.parse(await readFile(join(dir, "stub-invoke.json"), "utf8")) as { argv: string[] };
    expect(invoked.argv).not.toContain("--ignore-user-config");
    expect(invoked.argv[0]).toBe("exec");
    expect(invoked.argv).toContain("--skip-git-repo-check");
    expect(invoked.argv).toContain("--ephemeral");
    expect(invoked.argv).toContain("--sandbox");
    expect(invoked.argv).toContain("workspace-write");
    expect(invoked.argv).toContain("-C");
    const toml = await readFile(join(dir, ".aob-codex-home/config.toml"), "utf8");
    expect(toml).toContain('base_url = "http://127.0.0.1:9/v1"');
    expect(toml).toContain('wire_api = "responses"');
    expect(toml).toContain('model_reasoning_effort = "high"');
    expect(toml).toContain('web_search = "disabled"');
    expect(result.toolEvents).toEqual([{ tStart: expect.any(Number), tEnd: expect.any(Number), kind: "command_execution" }]);
    expect(result.artifacts.toolLogPath).toBe(join(dir, "tool-events.jsonl"));
    expect(await readFile(result.artifacts.toolLogPath!, "utf8")).not.toContain("sk-or-testleakvalue999");
  });

  it("passes a leading-dash prompt after the Codex option terminator", async () => {
    const { dir, prompt } = await setup();
    await writeFile(prompt, "- Implement the requested change.\n");
    process.env.AOB_CODEX_BIN = stub;
    const result = await codexAdapter.run({
      workspaceDir: dir,
      promptFile: prompt,
      model: "openai/gpt-4.1-mini",
      proxyUrl: "http://127.0.0.1:9",
      condition: "pinned",
      timeoutS: 10,
      env: { OPENROUTER_API_KEY: "sk-or-testleakvalue999" },
    });
    expect(result.exitCode).toBe(0);
    const invoked = JSON.parse(await readFile(join(dir, "stub-invoke.json"), "utf8")) as { argv: string[] };
    expect(invoked.argv.at(-2)).toBe("--");
    expect(invoked.argv.at(-1)).toBe("- Implement the requested change.");
  });

  it("hermes sets OPENROUTER_BASE_URL to proxy /v1", async () => {
    const { dir, prompt } = await setup();
    process.env.AOB_HERMES_BIN = stub;
    const result = await hermesAdapter.run({
      workspaceDir: dir,
      promptFile: prompt,
      model: "openai/gpt-4.1-mini",
      proxyUrl: "http://127.0.0.1:9",
      condition: "pinned",
      timeoutS: 10,
      env: { OPENROUTER_API_KEY: "sk-or-testleakvalue999" },
    });
    expect(result.exitCode).toBe(0);
    const invoked = JSON.parse(await readFile(join(dir, "stub-invoke.json"), "utf8")) as {
      argv: string[];
      env: Record<string, string>;
    };
    expect(invoked.argv[0]).toBe("-z");
    expect(invoked.argv).toContain("--yolo");
    expect(invoked.argv).toContain("--provider");
    expect(invoked.env.OPENROUTER_BASE_URL).toBe("http://127.0.0.1:9/v1");
    expect(invoked.env.HOME).toContain(".aob-home");
    expect(await readFile(join(dir, ".aob-home/.hermes/config.yaml"), "utf8")).toContain("oneshot_completion_wait_seconds: 0");
  });
});
