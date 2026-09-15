import { execFile as execFileCallback } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import { calibrate, formatCalibrationReport, summarizeAddedLatency } from "./calibrate.js";

const execFile = promisify(execFileCallback);

describe("calibrate script", () => {
  it("warms both paths at measured concurrency without including warm-up samples", async () => {
    const bursts: number[] = [];
    let active = 0;
    let peak = 0;
    const fetch = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise<void>(resolve => setImmediate(resolve));
      active--;
      if (active === 0) { bursts.push(peak); peak = 0; }
      return new Response("{}");
    });
    try {
      const result = await calibrate(0, 7, 2);
      expect(bursts).toEqual(Array.from({ length: 24 }, () => 7));
      expect(result.added).toHaveLength(14);
    } finally {
      fetch.mockRestore();
    }
  });

  it("returns p50 and p99 for 10 concurrent streams", async () => {
    const r = await calibrate(0, 10);
    expect(r.added.length).toBeGreaterThanOrEqual(10);
    expect(r.p50).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(r.p50)).toBe(true);
    expect(Number.isFinite(r.p99)).toBe(true);
    expect(r.p99).toBeGreaterThanOrEqual(0);
  });

  it("formats a complete reproducible calibration report", () => {
    expect(formatCalibrationReport({
      delayMs: 25,
      concurrency: 10,
      rounds: 3,
      sampleCount: 30,
      streamed: true,
      p50: 1.234,
      p99: 4.567,
    })).toBe([
      "aob proxy calibration",
      "delay_ms=25",
      "concurrency=10",
      "warmup_rounds=10",
      "warmup_samples_per_path=100",
      "rounds=3",
      "samples=30",
      "request_mode=streamed",
      "added_latency_p50_ms=1.23",
      "added_latency_p99_ms=4.57",
      "provider_requests=0",
      "",
    ].join("\n"));
  });

  it("calculates reported percentiles from nonnegative added-latency samples", () => {
    expect(summarizeAddedLatency([20, 10, 30], [23, 13, 50])).toEqual({
      added: [3, 3, 20],
      p50: 3,
      p99: 20,
    });
  });

  it("rejects invalid calibration settings with a typed error", async () => {
    await expect(calibrate(-1, 10, 1)).rejects.toMatchObject({ kind: "ConfigError" });
    await expect(calibrate(0, 0, 1)).rejects.toMatchObject({ kind: "ConfigError" });
    await expect(calibrate(0, 10, 0)).rejects.toMatchObject({ kind: "ConfigError" });
  });

  it("runs the repository script with ten concurrent mock streams and a requested output path", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "aob-cal-script-test-"));
    const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
    const output = join(cwd, "calibration.txt");
    const legacy = join(cwd, "packages/proxy/calibration.txt");
    const legacyBefore = existsSync(legacy) ? await readFile(legacy) : undefined;
    try {
      const result = await execFile(join(root, "scripts/s1-calibrate.sh"), [output, "--rounds", "1"], { cwd });
      expect(result.stdout).toContain("concurrency=10");
      expect(result.stdout).toContain("request_mode=streamed");
      expect(result.stdout).toContain("provider_requests=0");
      expect(await readFile(output, "utf8")).toContain("samples=10");
      if (legacyBefore === undefined) {
        expect(existsSync(legacy)).toBe(false);
      } else {
        expect(await readFile(legacy)).toEqual(legacyBefore);
      }
    } finally {
      await rm(cwd, { recursive: true, force: true });
    }
  });
});
