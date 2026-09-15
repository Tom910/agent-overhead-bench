import { execFile as execFileCallback } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFile = promisify(execFileCallback);

describe("S2 Docker environment preparation", () => {
  it("writes only the OpenRouter key to the temporary env file", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-s2-env-test-"));
    const source = join(dir, ".env");
    const destination = join(dir, "container.env");
    const root = resolve(dirname(new URL(import.meta.url).pathname), "../../..");
    try {
      await writeFile(source, "# comments are allowed\nOPENROUTER_API_KEY=sk-or-test\n");
      await expect(execFile("sh", [join(root, "scripts/s2-docker-env.sh"), source, destination])).resolves.toBeDefined();
      expect(await readFile(destination, "utf8")).toBe("OPENROUTER_API_KEY=sk-or-test\n");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("rejects an env file containing an unrelated variable", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-s2-env-test-"));
    const source = join(dir, ".env");
    const destination = join(dir, "container.env");
    const root = resolve(dirname(new URL(import.meta.url).pathname), "../../..");
    try {
      await writeFile(source, "OPENROUTER_API_KEY=sk-or-test\nUNRELATED_SECRET=do-not-forward\n");
      await expect(execFile("sh", [join(root, "scripts/s2-docker-env.sh"), source, destination])).rejects.toThrow(/only OPENROUTER_API_KEY/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("normalizes a quoted OpenRouter key without forwarding the quotes", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aob-s2-env-test-"));
    const source = join(dir, ".env");
    const destination = join(dir, "container.env");
    const root = resolve(dirname(new URL(import.meta.url).pathname), "../../..");
    try {
      await writeFile(source, 'OPENROUTER_API_KEY="sk-or-test"\n');
      await expect(execFile("sh", [join(root, "scripts/s2-docker-env.sh"), source, destination])).resolves.toBeDefined();
      expect(await readFile(destination, "utf8")).toBe("OPENROUTER_API_KEY=sk-or-test\n");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
