import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ConfigError } from "@aob/contracts";
import { startMockUpstream } from "@aob/mock-upstream";
import { startProxy } from "./proxy.js";

const WARMUP_ROUNDS = 10;

export type CalibrationReport = {
  delayMs: number;
  concurrency: number;
  rounds: number;
  sampleCount: number;
  streamed: boolean;
  p50: number;
  p99: number;
};

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx] ?? 0;
}

async function timeMany(url: string, n: number): Promise<number[]> {
  const times: number[] = [];
  await Promise.all(
    Array.from({ length: n }, async () => {
      const t0 = performance.now();
      const res = await fetch(url, { method: "POST", body: "{}" });
      await res.arrayBuffer();
      times.push(performance.now() - t0);
    }),
  );
  return times;
}

export function summarizeAddedLatency(direct: number[], via: number[]): { p50: number; p99: number; added: number[] } {
  const dSorted = [...direct].sort((a, b) => a - b);
  const vSorted = [...via].sort((a, b) => a - b);
  const count = Math.min(dSorted.length, vSorted.length);
  const added = Array.from({ length: count }, (_, index) => Math.max(0, (vSorted[index] ?? 0) - (dSorted[index] ?? 0)))
    .sort((a, b) => a - b);
  return {
    p50: percentile(added, 50),
    p99: percentile(added, 99),
    added,
  };
}

export async function calibrate(delayMs = 0, n = 10, rounds = 3): Promise<{ p50: number; p99: number; added: number[] }> {
  if (!Number.isInteger(delayMs) || delayMs < 0) throw new ConfigError("calibration delay must be a nonnegative integer");
  if (!Number.isInteger(n) || n < 1) throw new ConfigError("calibration concurrency must be a positive integer");
  if (!Number.isInteger(rounds) || rounds < 1) throw new ConfigError("calibration rounds must be a positive integer");

  let dir: string | undefined;
  let mock: Awaited<ReturnType<typeof startMockUpstream>> | undefined;
  let proxy: Awaited<ReturnType<typeof startProxy>> | undefined;
  let operationFailed = false;
  try {
    dir = await mkdtemp(join(tmpdir(), "aob-cal-"));
    mock = await startMockUpstream({
      delayMs,
      streamed: true,
      includeUsage: true,
      status: 200,
    });
    proxy = await startProxy({
      run_id: "cal",
      upstream: mock.baseUrl,
      outPath: join(dir, "events.jsonl"),
    });
    const directUrl = `${mock.baseUrl}/v1/chat/completions`;
    const viaUrl = `${proxy.baseUrl}/v1/chat/completions`;
    // Exercise both connection pools and runtime paths at measured concurrency.
    // A fixed warm-up excludes startup work without selecting favorable samples.
    for (let round = 0; round < WARMUP_ROUNDS; round++) {
      await timeMany(directUrl, n);
      await timeMany(viaUrl, n);
    }
    const direct: number[] = [];
    const via: number[] = [];
    for (let round = 0; round < rounds; round++) {
      direct.push(...(await timeMany(directUrl, n)));
      via.push(...(await timeMany(viaUrl, n)));
    }
    return summarizeAddedLatency(direct, via);
  } catch (error) {
    operationFailed = true;
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(`proxy calibration failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    let cleanupError: unknown;
    try {
      if (proxy) await proxy.close();
    } catch (error) {
      cleanupError = error;
    }
    try {
      if (mock) await mock.close();
    } catch (error) {
      cleanupError ??= error;
    }
    try {
      if (dir) await rm(dir, { recursive: true, force: true });
    } catch (error) {
      cleanupError ??= error;
    }
    if (cleanupError && !operationFailed) {
      throw new ConfigError(`proxy calibration cleanup failed: ${cleanupError instanceof Error ? cleanupError.message : String(cleanupError)}`);
    }
  }
}

export function formatCalibrationReport(report: CalibrationReport): string {
  return [
    "aob proxy calibration",
    `delay_ms=${report.delayMs}`,
    `concurrency=${report.concurrency}`,
    `warmup_rounds=${WARMUP_ROUNDS}`,
    `warmup_samples_per_path=${WARMUP_ROUNDS * report.concurrency}`,
    `rounds=${report.rounds}`,
    `samples=${report.sampleCount}`,
    `request_mode=${report.streamed ? "streamed" : "non-streamed"}`,
    `added_latency_p50_ms=${report.p50.toFixed(2)}`,
    `added_latency_p99_ms=${report.p99.toFixed(2)}`,
    "provider_requests=0",
    "",
  ].join("\n");
}
