import { isModelRequestAttempt, type C1Event, type C3ToolEvent, type ClockAnchor } from "@aob/contracts";
import { subtractOverlap, unionDuration, type Interval } from "./intervals.js";

export type ToolVisibility = "none" | "partial" | "full";

export type DerivedRun = {
  end_to_end: number;
  startup: number;
  model_time: number;
  tool_time: number | null;
  harness_time: number | null;
  non_model_time: number;
  parallelism: number;
  first_byte_ms: number | null;
  sum_request_durations: number;
  unreconciled: boolean;
};

const TOLERANCE = (e2e: number) => Math.max(e2e * 0.01, 500);

/**
 * Map an adapter-process timestamp onto the proxy-relative clock using wall
 * anchors. Proxy event timestamps are already measured from the proxy anchor,
 * so proxy.monotonic_zero is intentionally not added to the result; it would
 * move the value back into the proxy process's raw performance.now domain.
 */
export function projectToProxyClock(
  t: number,
  adapter: ClockAnchor,
  proxy: ClockAnchor,
): number {
  return Date.parse(adapter.wall_clock_iso) - Date.parse(proxy.wall_clock_iso) + (t - adapter.monotonic_zero);
}

export function deriveRun(input: {
  adapter: { tStart: number; tEnd: number };
  events: Array<{ t_req_start: number; t_first_byte?: number; t_last_byte: number }>;
  toolEvents: Array<{ tStart: number; tEnd: number }>;
  toolVisibility: ToolVisibility;
}): DerivedRun {
  const end_to_end = input.adapter.tEnd - input.adapter.tStart;
  const firstReq = input.events.reduce(
    (min, e) => Math.min(min, e.t_req_start),
    Number.POSITIVE_INFINITY,
  );
  const startup = Number.isFinite(firstReq) ? firstReq - input.adapter.tStart : end_to_end;
  const modelIntervals: Interval[] = input.events.map((e) => ({
    start: e.t_req_start,
    end: e.t_last_byte,
  }));
  const model_time = unionDuration(modelIntervals);
  const sum_request_durations = input.events.reduce(
    (s, e) => s + (e.t_last_byte - e.t_req_start),
    0,
  );
  const parallelism = model_time === 0 ? 1 : sum_request_durations / model_time;
  const firstByteSamples = input.events
    .map((event) => event.t_first_byte === undefined ? null : event.t_first_byte - event.t_req_start)
    .filter((value): value is number => value !== null && Number.isFinite(value) && value >= 0);
  const first_byte_ms = firstByteSamples.length === 0 ? null : median(firstByteSamples);
  const non_model_time = end_to_end - startup - model_time;

  if (input.toolVisibility !== "full") {
    const unreconciled =
      Math.abs(startup + model_time + non_model_time - end_to_end) > TOLERANCE(end_to_end) ||
      model_time > end_to_end + TOLERANCE(end_to_end) ||
      startup < 0 ||
      non_model_time < 0;
    return {
      end_to_end,
      startup,
      model_time,
      tool_time: null,
      harness_time: null,
      non_model_time,
      parallelism,
      first_byte_ms,
      sum_request_durations,
      unreconciled,
    };
  }

  const toolIntervals: Interval[] = input.toolEvents.map((e) => ({
    start: e.tStart,
    end: e.tEnd,
  }));
  const tool_time = subtractOverlap(toolIntervals, modelIntervals);
  const harness_time = end_to_end - startup - model_time - tool_time;
  const unreconciled =
    Math.abs(startup + model_time + tool_time + harness_time - end_to_end) > TOLERANCE(end_to_end) ||
    model_time > end_to_end + TOLERANCE(end_to_end) ||
    harness_time < 0 ||
    startup < 0 ||
    non_model_time < 0;
  return {
    end_to_end,
    startup,
    model_time,
    tool_time,
    harness_time,
    non_model_time,
    parallelism,
    first_byte_ms,
    sum_request_durations,
    unreconciled,
  };
}

export function deriveFromC1(
  adapter: { tStart: number; tEnd: number },
  events: C1Event[],
  toolEvents: C3ToolEvent[],
  visibility: ToolVisibility,
  anchors?: { adapter: ClockAnchor; proxy: ClockAnchor },
): DerivedRun {
  const projectedAdapter = anchors
    ? {
        tStart: projectToProxyClock(adapter.tStart, anchors.adapter, anchors.proxy),
        tEnd: projectToProxyClock(adapter.tEnd, anchors.adapter, anchors.proxy),
      }
    : adapter;
  const projectedTools = anchors
    ? toolEvents.map((e) => ({
        tStart: projectToProxyClock(e.tStart, anchors.adapter, anchors.proxy),
        tEnd: projectToProxyClock(e.tEnd, anchors.adapter, anchors.proxy),
        kind: e.kind,
      }))
    : toolEvents;
  return deriveRun({
    adapter: projectedAdapter,
    // Metadata probes (for example a CLI model-list request) are recorded for
    // auditability but are not model intervals in the measurement model.
    events: events.filter((e) => isModelRequestAttempt(e))
      .map((e) => {
        const base = { t_req_start: e.t_req_start, t_last_byte: e.t_last_byte };
        // The proxy closes a network-failed request by setting first/last byte
        // to the observation time even though no upstream byte was observed.
        // Keep the failed interval in model_time, but do not call that marker
        // a first-byte measurement.
        const firstByte = e.error?.kind === "network" ? undefined : e.t_first_byte;
        return firstByte === undefined ? base : { ...base, t_first_byte: firstByte };
      }),
    toolEvents: projectedTools,
    toolVisibility: visibility,
  });
}

export function harnessShare(d: DerivedRun): number | null {
  if (d.harness_time === null || d.end_to_end === 0) return null;
  return d.harness_time / d.end_to_end;
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  if (s.length % 2 === 1) return s[mid] ?? 0;
  return ((s[mid - 1] ?? 0) + (s[mid] ?? 0)) / 2;
}

/**
 * Interquartile range, or null when the spread is not measurable.
 *
 * A single repetition has no spread. Returning 0 published "0ms" in the IQR
 * column, which a reader takes as "we measured zero variance" rather than
 * "variance is unmeasured".
 */
export function iqr(values: number[]): number | null {
  if (values.length < 2) return null;
  const s = [...values].sort((a, b) => a - b);
  const quantile = (p: number): number => {
    const position = (s.length - 1) * p;
    const lower = Math.floor(position);
    const upper = Math.ceil(position);
    if (lower === upper) return s[lower] ?? 0;
    const fraction = position - lower;
    return (s[lower] ?? 0) + ((s[upper] ?? 0) - (s[lower] ?? 0)) * fraction;
  };
  return quantile(0.75) - quantile(0.25);
}
