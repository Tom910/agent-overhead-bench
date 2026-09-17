import { expect, it } from "vitest";
import type { C1Event } from "@aob/contracts";
import { costUsd } from "./aggregate.js";
import { requestSeries, summarizeRequests } from "./request-analysis.js";

const rates = { input: 1.5e-7, cached_input: 3e-9, output: 6e-7 };

function event(partial: Partial<C1Event> & Pick<C1Event, "seq" | "t_req_start" | "t_first_byte" | "t_last_byte" | "status">): C1Event {
  return {
    v: 1, run_id: "run", duration_ms: partial.t_last_byte - partial.t_req_start,
    t_req_body_end: partial.t_req_start, t_upstream_sent: partial.t_req_start,
    method: "POST", path: "/chat/completions", protocol: "openai_chat",
    model_requested: "mock", model_served: "mock", streamed: true,
    usage: { input: 100, cached_input: 80, output: 10, reasoning_output: 0 },
    usage_source: "response_body", error: null, ...partial,
  };
}

it("keeps only model attempts and records wait, transfer, gaps and costs", () => {
  const chatter: C1Event = { ...event({ seq: 0, t_req_start: 0, t_first_byte: 1, t_last_byte: 2, status: 200 }), method: "GET", path: "/models", protocol: "unknown" };
  const requests = requestSeries([
    chatter,
    event({ seq: 1, t_req_start: 100, t_first_byte: 150, t_last_byte: 400, status: 200 }),
    event({ seq: 2, t_req_start: 500, t_first_byte: 540, t_last_byte: 700, status: 500, usage: null, error: { kind: "http", detail: "x" } }),
  ], 900, rates);
  expect(requests).toHaveLength(2);
  expect(JSON.stringify(requests)).not.toMatch(/chat\/completions|models|mock|http/);
  expect(requests[0]).toMatchObject({
    seq: 1, t_start_ms: 0, t_end_ms: 300, duration_ms: 300, wait_ms: 50, transfer_ms: 250,
    gap_before_ms: null, status: 200, successful: true, input_tokens: 100, cached_input_tokens: 80, output_tokens: 10,
  });
  expect(requests[0]!.cost_usd).toBe(costUsd({ input: 100, cached_input: 80, output: 10 }, rates));
  expect(requests[1]).toMatchObject({
    seq: 2, t_start_ms: 400, duration_ms: 200, wait_ms: 40, transfer_ms: 160,
    gap_before_ms: 100, status: 500, successful: false, input_tokens: null, cost_usd: null,
  });
});

it("summarizes more/shorter vs gaps and time after the last response", () => {
  const requests = requestSeries([
    event({ seq: 0, t_req_start: 0, t_first_byte: 10, t_last_byte: 100, status: 200 }),
    event({ seq: 1, t_req_start: 400, t_first_byte: 410, t_last_byte: 450, status: 200 }),
  ], 800, rates);
  const summary = summarizeRequests(requests, 800, 0);
  expect(summary.n).toBe(2);
  expect(summary.n_success).toBe(2);
  expect(summary.largest_gap_before_ms).toBe(300);
  expect(summary.largest_duration_ms).toBe(100);
  expect(summary.time_after_last_ms).toBe(350);
  expect(summary.median_duration_ms).toBe(75);
});

it("uses interval-union gaps and the latest response end for overlapping calls", () => {
  const requests = requestSeries([
    event({ seq: 1, t_req_start: 110, t_first_byte: 110, t_last_byte: 120, status: 200 }),
    event({ seq: 0, t_req_start: 100, t_first_byte: 100, t_last_byte: 200, status: 200 }),
    event({ seq: 2, t_req_start: 130, t_first_byte: 130, t_last_byte: 140, status: 200 }),
  ], 250, rates);
  expect(requests.map((r) => r.gap_before_ms)).toEqual([null, 0, 0]);
  expect(summarizeRequests(requests, 250, 100)).toMatchObject({
    largest_gap_before_ms: 0, time_after_last_ms: 50, share_after_last: 1 / 3, share_in_gaps: 0,
  });
});

it("orders request origins chronologically even when sequence IDs differ", () => {
  const requests = requestSeries([
    event({ seq: 0, t_req_start: 110, t_first_byte: 115, t_last_byte: 120, status: 200 }),
    event({ seq: 1, t_req_start: 100, t_first_byte: 105, t_last_byte: 108, status: 200 }),
  ], 150, rates);
  expect(requests.map((r) => [r.seq, r.t_start_ms, r.gap_before_ms])).toEqual([[1, 0, null], [0, 10, 2]]);
});

it("excludes network markers from byte timing while preserving attempt duration and successful usage", () => {
  const requests = requestSeries([
    event({ seq: 0, t_req_start: 0, t_first_byte: 10, t_last_byte: 100, status: 200 }),
    event({ seq: 1, t_req_start: 110, t_first_byte: 200, t_last_byte: 200, status: 0,
      usage: null, error: { kind: "network", detail: "connection reset" } }),
  ], 250, rates);
  expect(requests[1]).toMatchObject({ duration_ms: 90, wait_ms: null, transfer_ms: null });
  expect(summarizeRequests(requests, 250, 0)).toMatchObject({
    n: 2, n_error: 1, median_wait_ms: 10, median_transfer_ms: 90,
    cumulative_input: 100, cumulative_cached_input: 80, cumulative_output: 10, cumulative_cost_usd: null,
  });
});

it("does not invent adapter-relative tail or shares without reconciled timing", () => {
  const requests = requestSeries([event({ seq: 0, t_req_start: 0, t_first_byte: 10, t_last_byte: 100, status: 200 })], null, rates);
  expect(summarizeRequests(requests)).toMatchObject({ time_after_last_ms: null, share_after_last: null, share_in_gaps: null });
  expect(summarizeRequests(requests, 50, 0)).toMatchObject({ time_after_last_ms: null, share_after_last: null, share_in_gaps: null });
});
