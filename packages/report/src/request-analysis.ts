import { isModelRequestAttempt, isSuccessfulModelEvent, type C1Event } from "@aob/contracts";
import { costUsd, tokenFloorUsd, type PriceRates } from "./aggregate.js";
import { median } from "./derive.js";

export type AnalysisRequest = {
  seq: number;
  t_start_ms: number;
  t_end_ms: number;
  duration_ms: number;
  wait_ms: number | null;
  transfer_ms: number | null;
  gap_before_ms: number | null;
  status: number;
  streamed: boolean;
  successful: boolean;
  input_tokens: number | null;
  cached_input_tokens: number | null;
  output_tokens: number | null;
  cost_usd: number | null;
  token_floor_usd: number | null;
};

export type RequestSummary = {
  n: number;
  n_success: number;
  n_error: number;
  median_duration_ms: number | null;
  median_wait_ms: number | null;
  median_transfer_ms: number | null;
  median_gap_before_ms: number | null;
  largest_duration_ms: number | null;
  largest_gap_before_ms: number | null;
  time_after_last_ms: number | null;
  share_after_last: number | null;
  share_in_gaps: number | null;
  cumulative_input: number | null;
  cumulative_cached_input: number | null;
  cumulative_output: number | null;
  cumulative_cost_usd: number | null;
};

function finiteNonneg(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function nullableMedian(values: Array<number | null>): number | null {
  const xs = values.filter((value): value is number => value !== null);
  return xs.length === 0 ? null : median(xs);
}

export function emptyRequestSummary(): RequestSummary {
  return summarizeRequests([]);
}

export function requestSeries(events: C1Event[], _adapterEndMs: number | null, rates: PriceRates | null): AnalysisRequest[] {
  const attempts = events.filter(isModelRequestAttempt).sort((a, b) => a.t_req_start - b.t_req_start || a.seq - b.seq);
  const origin = attempts[0]?.t_req_start;
  let latestEnd = Number.NEGATIVE_INFINITY;
  return attempts.map((event, index) => {
    const gap = index === 0 ? null : Math.max(0, event.t_req_start - latestEnd);
    latestEnd = Math.max(latestEnd, event.t_last_byte);
    const wait = event.t_first_byte - event.t_req_start;
    const transfer = event.t_last_byte - event.t_first_byte;
    const successful = isSuccessfulModelEvent(event);
    const usage = successful && event.usage !== null ? event.usage : null;
    // Match deriveFromC1: network-error timestamps may be closure markers,
    // not observed upstream bytes. Preserve their interval, not byte latency.
    const observedBytes = event.error?.kind !== "network" && finiteNonneg(wait) && finiteNonneg(transfer);
    return {
      seq: event.seq,
      t_start_ms: origin === undefined ? 0 : event.t_req_start - origin,
      t_end_ms: origin === undefined ? event.t_last_byte - event.t_req_start : event.t_last_byte - origin,
      duration_ms: event.t_last_byte - event.t_req_start,
      wait_ms: observedBytes ? wait : null,
      transfer_ms: observedBytes ? transfer : null,
      gap_before_ms: gap,
      status: event.status,
      streamed: event.streamed,
      successful,
      input_tokens: usage?.input ?? null,
      cached_input_tokens: usage?.cached_input ?? null,
      output_tokens: usage?.output ?? null,
      cost_usd: usage === null || rates === null ? null : costUsd(usage, rates),
      token_floor_usd: usage === null || rates === null ? null : tokenFloorUsd(usage, rates),
    };
  });
}

export function summarizeRequests(requests: AnalysisRequest[], adapterEndMs: number | null = null, originMs: number | null = null): RequestSummary {
  const chronological = [...requests].sort((a, b) => a.t_start_ms - b.t_start_ms || a.seq - b.seq);
  let latestEnd = Number.NEGATIVE_INFINITY;
  const gaps = chronological.map((request, index) => {
    const gap = index === 0 ? null : Math.max(0, request.t_start_ms - latestEnd);
    latestEnd = Math.max(latestEnd, request.t_end_ms);
    return gap;
  });
  const durations = requests.map((request) => request.duration_ms);
  const complete = (values: Array<number | null>): number | null =>
    values.some((value) => value === null) ? null : values.reduce<number>((sum, value) => sum + (value ?? 0), 0);
  const rawTail = requests.length === 0 || adapterEndMs === null || originMs === null
    ? null
    : adapterEndMs - originMs - latestEnd;
  const timeAfter = rawTail !== null && finiteNonneg(rawTail) ? rawTail : null;
  const gapSum = gaps.reduce<number>((sum, gap) => sum + (gap ?? 0), 0);
  const span = timeAfter === null ? null : latestEnd + timeAfter;
  const successes = requests.filter((request) => request.successful);
  const successfulTotal = (select: (request: AnalysisRequest) => number | null) => successes.length === 0 ? null : complete(successes.map(select));
  return {
    n: requests.length,
    n_success: requests.filter((request) => request.successful).length,
    n_error: requests.filter((request) => !request.successful).length,
    median_duration_ms: nullableMedian(durations),
    median_wait_ms: nullableMedian(requests.map((request) => request.wait_ms)),
    median_transfer_ms: nullableMedian(requests.map((request) => request.transfer_ms)),
    median_gap_before_ms: nullableMedian(gaps),
    largest_duration_ms: durations.length === 0 ? null : Math.max(...durations),
    largest_gap_before_ms: gaps.every((value) => value === null) ? null : Math.max(...gaps.filter((value): value is number => value !== null)),
    time_after_last_ms: timeAfter,
    share_after_last: span && span > 0 && timeAfter !== null ? timeAfter / span : null,
    share_in_gaps: span && span > 0 ? gapSum / span : null,
    cumulative_input: successfulTotal((request) => request.input_tokens),
    cumulative_cached_input: successfulTotal((request) => request.cached_input_tokens),
    cumulative_output: successfulTotal((request) => request.output_tokens),
    cumulative_cost_usd: complete(requests.map((request) => request.cost_usd)),
  };
}
