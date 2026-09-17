import { ConfigError } from "@aob/contracts";
import { describe, expect, it } from "vitest";
import { aggregateMedians, aggregateTimingMeans, costBarSvg, stackedBarSvg } from "./aggregate.js";
import type { DerivedRun } from "./derive.js";

function run(startup: number, model: number, residual: number, extra: Partial<DerivedRun> = {}): DerivedRun {
  return {
    end_to_end: startup + model + residual, startup, model_time: model,
    non_model_time: residual, tool_time: null, harness_time: null,
    sum_request_durations: model, parallelism: 1, first_byte_ms: null,
    unreconciled: false, ...extra,
  };
}

describe("arithmetic timing means", () => {
  it("preserves additive buckets where independently selected medians do not", () => {
    const runs = [run(10, 80, 10), run(80, 10, 10), run(10, 10, 80)];
    expect(() => stackedBarSvg(aggregateMedians(runs))).toThrow(ConfigError);
    const mean = aggregateTimingMeans(runs)!;
    expect(mean).toMatchObject({ end_to_end: 100, startup: 100 / 3, model_time: 100 / 3, non_model_time: 100 / 3 });
    const svg = stackedBarSvg(mean, 300);
    const widths = [...svg.matchAll(/<rect[^>]*width="([\d.]+)"/g)].map((match) => Number(match[1]));
    expect(widths).toEqual([100, 100, 100]);
  });

  it("allows equal task weights despite unequal repetition counts", () => {
    const taskA = aggregateTimingMeans([run(10, 20, 30), run(10, 20, 30), run(10, 20, 30)])!;
    const taskB = aggregateTimingMeans([run(30, 60, 90)])!;
    expect(aggregateTimingMeans([taskA, taskB])).toMatchObject({ end_to_end: 120, startup: 20, model_time: 40, non_model_time: 60 });
  });

  it("filters unreconciled runs, averages observed latency and derives parallelism from duration totals", () => {
    const result = aggregateTimingMeans([
      run(10, 20, 30, { sum_request_durations: 60, parallelism: 3, first_byte_ms: 4 }),
      run(20, 80, 60, { first_byte_ms: 8 }),
      run(0, 50, 0),
      run(1, 9000, 2, { unreconciled: true, first_byte_ms: 1000 }),
    ])!;
    expect(result.sum_request_durations).toBeCloseTo(190 / 3);
    expect(result.model_time).toBe(50);
    expect(result.parallelism).toBeCloseTo(190 / 150);
    expect(result.first_byte_ms).toBe(6);
  });

  it("keeps full-visibility buckets only when every contributing run has both", () => {
    const full = run(10, 20, 30, { tool_time: 12, harness_time: 18 });
    expect(aggregateTimingMeans([full, full])).toMatchObject({ tool_time: 12, harness_time: 18 });
    expect(aggregateTimingMeans([full, run(10, 20, 30)])).toMatchObject({ tool_time: null, harness_time: null });
    expect(aggregateTimingMeans([full, { ...full, harness_time: null }])).toMatchObject({ tool_time: null, harness_time: null });
  });

  it("keeps absent timing unavailable and uses the existing no-request parallelism convention", () => {
    expect(aggregateTimingMeans([])).toBeNull();
    expect(aggregateTimingMeans([run(1, 2, 3, { unreconciled: true })])).toBeNull();
    expect(aggregateTimingMeans([run(10, 0, 0)])).toMatchObject({ parallelism: 1, first_byte_ms: null });
  });
});

describe("truthful chart geometry", () => {
  it.each([99, 101, 100.0001])("rejects a nonadditive total %s", (end_to_end) => {
    expect(() => stackedBarSvg(run(10, 80, 10, { end_to_end }))).toThrow(ConfigError);
  });

  it("accepts floating point roundoff and fills sub-millisecond bars", () => {
    const svg = stackedBarSvg(run(0.1, 0.2, 0, { end_to_end: 0.3 }), 300);
    expect(svg).toMatch(/data-seg="startup"[^>]*width="100.00"/);
    expect(svg).toMatch(/data-seg="model"[^>]*width="200.00"/);
  });

  it("rejects inconsistent full-visibility decompositions", () => {
    expect(() => stackedBarSvg(run(10, 80, 10, { tool_time: 9, harness_time: 9 }))).toThrow(ConfigError);
  });

  it.each([null, 0.5])("shows unknown actual cost as unavailable even with floor %s", (floor) => {
    const svg = costBarSvg(null, floor);
    expect(svg).toMatch(/<text[^>]*>[^<]*[Uu]navailable/);
    expect(svg).not.toContain('data-cost-segment="actual"');
  });

  it("distinguishes a missing token floor from known zero cost", () => {
    expect(costBarSvg(0.5, null)).toMatch(/<text[^>]*>[^<]*[Uu]navailable/);
    expect(costBarSvg(0.5, null)).not.toContain('data-cost-segment="token-floor"');
    expect(costBarSvg(0, 0)).toContain('data-cost-segment="actual"');
    expect(costBarSvg(0, 0)).not.toContain("unavailable");
  });
});
