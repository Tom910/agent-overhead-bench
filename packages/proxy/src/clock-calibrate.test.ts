import { describe, expect, it } from "vitest";
import { calibrateClock, formatClockCalibrationReport, summarizeClockSamples } from "./clock-calibrate.js";

describe("cross-process clock calibration", () => {
  it("summarizes projection samples without hiding the worst error", () => {
    expect(summarizeClockSamples([
      { roundTripMs: 4, projectionErrorMs: 1.25 },
      { roundTripMs: 2, projectionErrorMs: 0.5 },
      { roundTripMs: 8, projectionErrorMs: 2.75 },
    ])).toEqual({
      sampleCount: 3,
      bestRoundTripMs: 2,
      maxRoundTripMs: 8,
      bestProjectionBoundMs: 1.5,
      maxProjectionErrorMs: 2.75,
      maxProjectionBoundMs: 6.75,
    });
  });

  it("performs a bounded zero-spend handshake between two processes", async () => {
    const report = await calibrateClock(3);
    expect(report.sampleCount).toBe(3);
    expect(report.bestRoundTripMs).toBeGreaterThanOrEqual(0);
    expect(report.maxRoundTripMs).toBeGreaterThanOrEqual(report.bestRoundTripMs);
    expect(report.maxProjectionErrorMs).toBeGreaterThanOrEqual(0);
    expect(report.maxProjectionBoundMs).toBeGreaterThanOrEqual(report.maxProjectionErrorMs);
  });

  it("rejects an unbounded sample request", async () => {
    await expect(calibrateClock(101)).rejects.toThrow(/at most 100/);
  });

  it("rejects malformed samples instead of emitting a misleading report", () => {
    expect(() => summarizeClockSamples([{ roundTripMs: Number.NaN, projectionErrorMs: 0 }])).toThrow(/finite nonnegative/);
    expect(() => summarizeClockSamples([{ roundTripMs: 1, projectionErrorMs: -1 }])).toThrow(/finite nonnegative/);
  });

  it("formats an auditable report", () => {
    expect(formatClockCalibrationReport({
      sampleCount: 3,
      bestRoundTripMs: 1.234,
      maxRoundTripMs: 4.567,
      bestProjectionBoundMs: 1.962,
      maxProjectionErrorMs: 2.345,
      maxProjectionBoundMs: 4.6285,
    })).toBe([
      "aob cross-process clock calibration",
      "method=two-process-stdio-handshake",
      "samples=3",
      "best_round_trip_ms=1.23",
      "max_round_trip_ms=4.57",
      "best_projection_bound_ms=1.96",
      "max_projection_residual_ms=2.35",
      "max_projection_bound_ms=4.63",
      "provider_requests=0",
      "",
    ].join("\n"));
  });
});
