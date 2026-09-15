import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(fileURLToPath(new URL("../../..", import.meta.url)));
const images = join(root, "images");

describe("selected image dependency locks", () => {
  it("hydrates and validates the digest-pinned route-smoke image", () => {
    const buildScript = readFileSync(join(root, "scripts/s5-build-images.sh"), "utf8");
    const routeSmoke = readFileSync(join(root, "packages/runner/src/docker-route-smoke.ts"), "utf8");
    const digest = "curlimages/curl:8.12.1@sha256:94e9e444bcba979c2ea12e27ae39bee4cd10bc7041a472c4727a558e213744e6";
    expect(routeSmoke).toContain(digest);
    expect(buildScript).toContain(`ROUTE_SMOKE_IMAGE=\"${digest}\"`);
    expect(buildScript).toContain('docker pull --quiet "$ROUTE_SMOKE_IMAGE"');
    expect(buildScript).toContain('inspect_image "$ROUTE_SMOKE_IMAGE"');
  });

  it("bakes the fixed-destination relay into the shared base image", () => {
    const dockerfile = readFileSync(join(images, "base.Dockerfile"), "utf8");
    expect(dockerfile).toContain("COPY proxy-relay.mjs /opt/aob/proxy-relay.mjs");
  });

  it("keeps every Node CLI installation on a checked-in npm lockfile", () => {
    const packages = [
      ["claude-code", "@anthropic-ai/claude-code", "2.1.246"],
      ["codex", "@openai/codex", "0.149.1"],
      ["opencode", "opencode-ai", "1.18.23"],
      ["qwen", "@qwen-code/qwen-code", "0.22.2"],
    ] as const;
    for (const [name, packageName, version] of packages) {
      const lockPath = join(images, "npm-locks", name, "package-lock.json");
      expect(existsSync(lockPath), lockPath).toBe(true);
      const lock = JSON.parse(readFileSync(lockPath, "utf8")) as {
        lockfileVersion?: number;
        packages?: Record<string, { version?: string }>;
      };
      expect(lock.lockfileVersion, lockPath).toBe(3);
      expect(lock.packages?.[""], lockPath).toBeDefined();
      expect(lock.packages?.[`node_modules/${packageName}`]?.version, lockPath).toBe(version);
      const dockerfile = readFileSync(join(images, `${name}.Dockerfile`), "utf8");
      expect(dockerfile, `${name}.Dockerfile`).toContain(`npm ci --prefix /opt/aob/npm/${name}`);
      expect(dockerfile, `${name}.Dockerfile`).toContain("npm cache clean --force");
    }
  });

  it("keeps Python CLI dependency graphs exact-version locked", () => {
    const locks = [
      ["aider", "aider-chat==0.86.2", "aider.Dockerfile"],
      ["hermes", "openai==2.24.0", "hermes.Dockerfile"],
    ] as const;
    for (const [name, requiredLine, dockerfileName] of locks) {
      const lockPath = join(images, "python-locks", `${name}.requirements.txt`);
      expect(existsSync(lockPath), lockPath).toBe(true);
      const lines = readFileSync(lockPath, "utf8").split(/\r?\n/).filter((line) => line.trim() !== "");
      expect(lines.every((line) => line.startsWith("#") || /^[A-Za-z0-9_.-]+==[^=\s]+(?:\s+--hash=sha256:[0-9a-f]{64})+$/.test(line)), lockPath).toBe(true);
      expect(lines.some((line) => line.startsWith(`${requiredLine} --hash=sha256:`)), lockPath).toBe(true);
      const dockerfile = readFileSync(join(images, dockerfileName), "utf8");
      expect(dockerfile, dockerfileName).toContain(`python-locks/${name}.requirements.txt`);
      expect(dockerfile, dockerfileName).toContain("--require-hashes");
      if (name === "hermes") expect(dockerfile, dockerfileName).toContain("--no-build-isolation -e .");
    }
  });

  it("fetches Hermes from a content-addressed commit archive", () => {
    const dockerfile = readFileSync(join(images, "hermes.Dockerfile"), "utf8");
    expect(dockerfile).toContain("HERMES_ARCHIVE_SHA256");
    expect(dockerfile).toContain("sha256sum -c -");
    expect(dockerfile).not.toContain("git clone");
  });

  it("lets the Docker full dry-run bootstrap only the shared base image", () => {
    const script = readFileSync(join(root, "scripts/s5-full-dry-run.sh"), "utf8");
    expect(script).toContain('docker image inspect "aob-base:s2"');
    expect(script).toContain('docker build -t aob-base:s2 -f "$ROOT/images/base.Dockerfile" "$ROOT/images"');
    expect(script).not.toContain("s5-build-images.sh");
  });
});
