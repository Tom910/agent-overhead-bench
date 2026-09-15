import { execFile as execFileCallback } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { ConfigError } from "@aob/contracts";
import { assertProviderCredentials } from "./config.js";

const execFile = promisify(execFileCallback);

describe("provider credential preflight", () => {
  it("allows the default mock and loopback upstreams without a key", () => {
    expect(() => assertProviderCredentials(undefined, {})).not.toThrow();
    expect(() => assertProviderCredentials("http://127.0.0.1:8080/api", {})).not.toThrow();
    expect(() => assertProviderCredentials("http://localhost:8080/api", {})).not.toThrow();
    expect(() => assertProviderCredentials("http://[::1]:8080/api", {})).not.toThrow();
  });

  it("rejects a remote upstream without a usable key", () => {
    expect(() => assertProviderCredentials("https://openrouter.ai/api", {})).toThrow(ConfigError);
    expect(() => assertProviderCredentials("https://openrouter.ai/api", { OPENROUTER_API_KEY: "   " })).toThrow(ConfigError);
  });

  it("accepts a remote upstream with a key", () => {
    expect(() => assertProviderCredentials("https://openrouter.ai/api", { OPENROUTER_API_KEY: "present" })).not.toThrow();
  });

  it("rejects a credentialed custom remote unless explicitly opted in", () => {
    expect(() => assertProviderCredentials("https://example.invalid/api", { OPENROUTER_API_KEY: "present" })).toThrow(/custom remote upstream/);
    expect(() => assertProviderCredentials("https://example.invalid/api", {
      OPENROUTER_API_KEY: "present", AOB_ALLOW_CUSTOM_UPSTREAM: "1",
    })).not.toThrow();
  });

  it("runs before task preparation in the CLI", async () => {
    const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
    const loader = join(root, "scripts/ts-source-loader.mjs");
    const cli = join(root, "packages/runner/src/cli.ts");
    await expect(execFile(process.execPath, [
      "--experimental-strip-types", "--no-warnings", "--experimental-loader", loader, cli,
      "--upstream", "https://openrouter.ai/api", "--tasks", "missing-task",
    ], { cwd: root, env: { ...process.env, OPENROUTER_API_KEY: "" } })).rejects.toThrow(/remote upstream requires OPENROUTER_API_KEY/);
  });
});
