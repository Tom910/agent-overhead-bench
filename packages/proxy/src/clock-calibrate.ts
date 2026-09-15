import { createInterface } from "node:readline";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { ConfigError } from "@aob/contracts";

export type ClockCalibrationSample = {
  roundTripMs: number;
  projectionErrorMs: number;
};

export type ClockCalibrationReport = {
  sampleCount: number;
  bestRoundTripMs: number;
  maxRoundTripMs: number;
  bestProjectionBoundMs: number;
  maxProjectionErrorMs: number;
  maxProjectionBoundMs: number;
};

type Anchor = { wall_clock_iso: string; monotonic_zero: number };

const CHILD_SOURCE = [
  "import { createInterface } from 'node:readline';",
  "const anchor = { wall_clock_iso: new Date().toISOString(), monotonic_zero: performance.now() };",
  "const input = createInterface({ input: process.stdin });",
  "process.stdout.write(JSON.stringify({ type: 'ready', anchor }) + '\\n');",
  "input.on('line', (line) => {",
  "  if (line === 'ping') process.stdout.write(JSON.stringify({ type: 'pong', t: performance.now() }) + '\\n');",
  "});",
].join("\n");

const MAX_SAMPLES = 100;
const MAX_TIMEOUT_MS = 2_000;

function createLineReader(child: ChildProcessWithoutNullStreams): {
  next(timeoutMs: number): Promise<string>;
  close(): void;
} {
  const readline = createInterface({ input: child.stdout });
  const iterator = readline[Symbol.asyncIterator]();
  const childFailure = new Promise<never>((_, reject) => {
    child.once("error", (error) => reject(new ConfigError(`clock calibration child failed: ${error.message}`)));
  });
  return {
    async next(timeoutMs: number): Promise<string> {
      let timer: NodeJS.Timeout | undefined;
      try {
        const timeout = new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new ConfigError(`clock calibration child timed out after ${timeoutMs}ms`)), timeoutMs);
        });
        const result = await Promise.race([iterator.next(), childFailure, timeout]);
        if (result.done) throw new ConfigError("clock calibration child closed before sending a line");
        return result.value;
      } finally {
        if (timer !== undefined) clearTimeout(timer);
      }
    },
    close(): void {
      readline.close();
    },
  };
}

async function stopChild(child: ChildProcessWithoutNullStreams): Promise<void> {
  if (!child.stdin.destroyed) child.stdin.end();
  if (child.exitCode !== null || child.signalCode !== null) return;
  await new Promise<void>((resolve) => {
    let timer: NodeJS.Timeout;
    const finish = (): void => {
      clearTimeout(timer);
      child.removeListener("close", onClose);
      child.removeListener("error", onError);
      resolve();
    };
    const onClose = (): void => finish();
    const onError = (): void => finish();
    timer = setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
      finish();
    }, 100);
    child.once("close", onClose);
    child.once("error", onError);
    child.kill("SIGTERM");
  });
}

function parseMessage(line: string, type: "ready" | "pong"): Record<string, unknown> {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch (error) {
    throw new ConfigError(`clock calibration child returned invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (typeof value !== "object" || value === null || Array.isArray(value) || (value as Record<string, unknown>).type !== type) {
    throw new ConfigError(`clock calibration child returned an unexpected ${type} message`);
  }
  return value as Record<string, unknown>;
}

function parseAnchor(value: unknown): Anchor {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new ConfigError("clock calibration child anchor is invalid");
  const record = value as Record<string, unknown>;
  if (typeof record.wall_clock_iso !== "string" || !Number.isFinite(Date.parse(record.wall_clock_iso)) ||
    typeof record.monotonic_zero !== "number" || !Number.isFinite(record.monotonic_zero) || record.monotonic_zero < 0) {
    throw new ConfigError("clock calibration child anchor is invalid");
  }
  return { wall_clock_iso: record.wall_clock_iso, monotonic_zero: record.monotonic_zero };
}

/** Summarize all samples; the worst projection error is intentionally retained. */
export function summarizeClockSamples(samples: ClockCalibrationSample[]): ClockCalibrationReport {
  if (samples.length === 0) throw new ConfigError("clock calibration produced no samples");
  if (samples.some((sample) => !Number.isFinite(sample.roundTripMs) || sample.roundTripMs < 0 ||
    !Number.isFinite(sample.projectionErrorMs) || sample.projectionErrorMs < 0)) {
    throw new ConfigError("clock calibration samples must contain finite nonnegative measurements");
  }
  const bestSample = samples.reduce((best, sample) => sample.roundTripMs < best.roundTripMs ? sample : best);
  return {
    sampleCount: samples.length,
    bestRoundTripMs: Math.min(...samples.map((sample) => sample.roundTripMs)),
    maxRoundTripMs: Math.max(...samples.map((sample) => sample.roundTripMs)),
    // Cristian-style clock projection uses the minimum-RTT exchange. A
    // scheduler pause inflates a sample's RTT but does not imply clock skew;
    // retain the all-sample maxima below for diagnostics.
    bestProjectionBoundMs: bestSample.roundTripMs / 2 + bestSample.projectionErrorMs,
    maxProjectionErrorMs: Math.max(...samples.map((sample) => sample.projectionErrorMs)),
    // Without an independent one-way transport measurement, half the observed
    // round trip is the conservative midpoint uncertainty. Retain the
    // residual too, so a low residual cannot hide a slow/asymmetric handshake.
    maxProjectionBoundMs: Math.max(...samples.map((sample) => sample.roundTripMs / 2 + sample.projectionErrorMs)),
  };
}

/** Measure a separate Node process against this process without network or provider traffic. */
export async function calibrateClock(samples = 20, timeoutMs = 1_000): Promise<ClockCalibrationReport> {
  if (!Number.isInteger(samples) || samples < 1 || samples > MAX_SAMPLES) throw new ConfigError(`clock calibration samples must be a positive integer at most ${MAX_SAMPLES}`);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > MAX_TIMEOUT_MS) throw new ConfigError(`clock calibration timeout must be a positive integer at most ${MAX_TIMEOUT_MS}ms`);

  const proxyAnchor: Anchor = { wall_clock_iso: new Date().toISOString(), monotonic_zero: performance.now() };
  const child = spawn(process.execPath, ["--input-type=module", "-e", CHILD_SOURCE], {
    stdio: ["pipe", "pipe", "pipe"],
  });
  const lines = createLineReader(child);
  try {
    const ready = parseMessage(await lines.next(timeoutMs), "ready");
    const childAnchor = parseAnchor(ready.anchor);
    const measured: ClockCalibrationSample[] = [];
    for (let index = 0; index < samples; index++) {
      const sent = performance.now();
      child.stdin.write("ping\n");
      const pong = parseMessage(await lines.next(timeoutMs), "pong");
      const received = performance.now();
      if (typeof pong.t !== "number" || !Number.isFinite(pong.t) || pong.t < childAnchor.monotonic_zero) {
        throw new ConfigError("clock calibration child returned an invalid monotonic timestamp");
      }
      const projected = Date.parse(childAnchor.wall_clock_iso) - Date.parse(proxyAnchor.wall_clock_iso) + (pong.t - childAnchor.monotonic_zero);
      const midpoint = ((sent + received) / 2) - proxyAnchor.monotonic_zero;
      measured.push({
        roundTripMs: received - sent,
        projectionErrorMs: Math.abs(projected - midpoint),
      });
    }
    return summarizeClockSamples(measured);
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(`clock calibration failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    lines.close();
    await stopChild(child);
  }
}

export function formatClockCalibrationReport(report: ClockCalibrationReport): string {
  return [
    "aob cross-process clock calibration",
    "method=two-process-stdio-handshake",
    `samples=${report.sampleCount}`,
    `best_round_trip_ms=${report.bestRoundTripMs.toFixed(2)}`,
    `max_round_trip_ms=${report.maxRoundTripMs.toFixed(2)}`,
    `best_projection_bound_ms=${report.bestProjectionBoundMs.toFixed(2)}`,
    `max_projection_residual_ms=${report.maxProjectionErrorMs.toFixed(2)}`,
    `max_projection_bound_ms=${report.maxProjectionBoundMs.toFixed(2)}`,
    "provider_requests=0",
    "",
  ].join("\n");
}
