import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ConfigError } from "@aob/contracts";
import { analyzeAttempts, type AnalysisAttempt, type AnalysisExport } from "./analysis.js";
import { renderAnalysisHtml, renderAnalysisMarkdown } from "./analysis-render.js";
import { summarizeRequests, type AnalysisRequest } from "./request-analysis.js";

type RecordValue = Record<string, unknown>;
function requireValid(valid: boolean, label: string): asserts valid {
  if (!valid) throw new ConfigError(`invalid analysis export: ${label}`);
}
function shape(value: unknown, required: string[], label: string, optional: string[] = []): RecordValue {
  requireValid(typeof value === "object" && value !== null && !Array.isArray(value), label);
  const record = value as RecordValue;
  requireValid(required.every((key) => Object.hasOwn(record, key)), `${label} missing field`);
  requireValid(Object.keys(record).every((key) => required.includes(key) || optional.includes(key)), `${label} unknown field`);
  return record;
}
const string = (v: unknown): v is string => typeof v === "string";
const nullableString = (v: unknown): boolean => v === null || string(v);
const nonnegative = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v >= 0;
const integer = (v: unknown): boolean => nonnegative(v) && Number.isSafeInteger(v);
const nullableNumber = (v: unknown): boolean => v === null || nonnegative(v);
const oneOf = (v: unknown, choices: readonly unknown[]): boolean => choices.includes(v);
const near = (a: number, b: number): boolean => Math.abs(a - b) <= Math.max(1e-7, Math.abs(a) * 1e-10, Math.abs(b) * 1e-10);

function validateAttempt(value: unknown): AnalysisAttempt {
  const a = shape(value, [
    "run_id", "harness", "version", "task", "rep", "outcome", "host", "condition", "model", "price_book",
    "source", "regime", "routing", "configuration", "ori_version", "task_base_revision", "verifier_image",
    "environment", "started_iso", "visibility", "hashes", "timing", "timing_unavailable", "turns",
    "input_tokens", "output_tokens", "cached_percent", "usage_unavailable", "cost_usd", "token_floor_usd", "cost_unavailable",
    "requests", "request_summary",
  ], "attempt");
  for (const key of ["run_id", "harness", "version", "task", "price_book", "verifier_image", "environment", "started_iso"]) {
    requireValid(string(a[key]) && a[key].length > 0, key);
  }
  requireValid(string(a.model), "model");
  requireValid(integer(a.rep) && integer(a.turns), "rep/turns");
  requireValid(oneOf(a.outcome, ["completed", "timeout", "adapter_error", "verify_error"]), "outcome");
  requireValid(oneOf(a.condition, ["pinned", "default"]), "condition");
  requireValid(oneOf(a.regime, ["short", "long", "extended"]), "regime");
  requireValid(oneOf(a.visibility, ["none", "partial", "full"]), "visibility");
  requireValid(Number.isFinite(Date.parse(a.started_iso as string)), "started_iso");
  for (const key of ["configuration", "ori_version", "task_base_revision"]) requireValid(nullableString(a[key]), key);
  requireValid(a.configuration === null || a.configuration === "claude-code-no-web-search" && a.harness === "claude-code", "configuration");
  const host = shape(a.host, ["os", "cpu", "ram_gb"], "host");
  requireValid(string(host.os) && string(host.cpu) && nonnegative(host.ram_gb), "host values");
  const source = shape(a.source, ["repository", "name", "revision"], "source");
  requireValid(nullableString(source.repository) && string(source.name) && string(source.revision), "source values");
  const hashes = shape(a.hashes, ["run", "events"], "hashes");
  requireValid([hashes.run, hashes.events].every((v) => string(v) && /^sha256:[a-f0-9]{64}$/.test(v)), "hashes values");
  if (a.routing !== null) {
    const routing = shape(a.routing, ["ignored_providers"], "routing", ["only_provider", "allow_fallbacks"]);
    const ignored = routing.ignored_providers;
    const provider = (v: unknown): v is string => string(v) && /^[a-z0-9][a-z0-9/_-]*$/.test(v);
    requireValid(Array.isArray(ignored) && ignored.length > 0 && ignored.every(provider), "routing ignored_providers");
    requireValid(new Set(ignored).size === ignored.length && JSON.stringify([...ignored].sort()) === JSON.stringify(ignored), "routing provider ordering");
    if (Object.hasOwn(routing, "only_provider") || Object.hasOwn(routing, "allow_fallbacks")) {
      requireValid(provider(routing.only_provider) && routing.allow_fallbacks === false, "routing pin");
      requireValid(!ignored.some((id: string) => routing.only_provider === id || (routing.only_provider as string).startsWith(`${id}/`)), "routing excluded pin");
    }
  }
  requireValid(a.timing === null ? a.timing_unavailable === "unreconciled" : a.timing_unavailable === null, "timing availability reason");
  if (a.timing !== null) {
    const t = shape(a.timing, ["end_to_end", "startup", "model_time", "tool_time", "harness_time", "non_model_time", "parallelism", "first_byte_ms", "sum_request_durations", "unreconciled"], "timing");
    for (const key of ["end_to_end", "startup", "model_time", "non_model_time", "parallelism", "sum_request_durations"]) requireValid(nonnegative(t[key]), `timing ${key}`);
    for (const key of ["tool_time", "harness_time", "first_byte_ms"]) requireValid(nullableNumber(t[key]), `timing ${key}`);
    requireValid(t.unreconciled === false, "timing unreconciled");
    const timing = t as unknown as NonNullable<AnalysisAttempt["timing"]>;
    requireValid(near(timing.startup + timing.model_time + timing.non_model_time, timing.end_to_end), "timing decomposition");
    requireValid(timing.sum_request_durations + 1e-7 >= timing.model_time && near(timing.parallelism, timing.model_time === 0 ? 1 : timing.sum_request_durations / timing.model_time), "timing parallelism");
    if (a.visibility === "full") {
      requireValid(timing.tool_time !== null && timing.harness_time !== null && near(timing.tool_time + timing.harness_time, timing.non_model_time), "timing full visibility");
    } else requireValid(timing.tool_time === null && timing.harness_time === null, "timing partial visibility");
  }
  requireValid(oneOf(a.usage_unavailable, [null, "no-successful-usage", "incomplete-usage"]), "usage reason");
  for (const key of ["input_tokens", "output_tokens"]) requireValid(a[key] === null || integer(a[key]), key);
  requireValid(a.cached_percent === null || nonnegative(a.cached_percent) && a.cached_percent <= 100, "cached_percent");
  const usageValues = [a.input_tokens, a.output_tokens, a.cached_percent];
  requireValid(a.usage_unavailable === null ? usageValues.every((v) => v !== null) : usageValues.every((v) => v === null), "usage availability reason");
  requireValid(oneOf(a.cost_unavailable, [null, "unpriced-model", "incomplete-accounting", "incomplete-usage"]), "cost reason");
  requireValid(nullableNumber(a.cost_usd) && nullableNumber(a.token_floor_usd), "cost values");
  requireValid(a.cost_unavailable === null ? a.cost_usd !== null && a.token_floor_usd !== null : a.cost_usd === null && a.token_floor_usd === null, "cost availability reason");
  requireValid(Array.isArray(a.requests), "requests");
  const sequences = new Set<number>();
  let previousStart = 0;
  let latestEnd = 0;
  let unionDuration = 0;
  const requests = (a.requests as unknown[]).map((value, index): AnalysisRequest => {
    const request = shape(value, [
      "seq", "t_start_ms", "t_end_ms", "duration_ms", "wait_ms", "transfer_ms", "gap_before_ms",
      "status", "streamed", "successful", "input_tokens", "cached_input_tokens", "output_tokens", "cost_usd", "token_floor_usd",
    ], `request ${index}`);
    requireValid(integer(request.seq), "request sequence");
    requireValid(integer(request.status) && (request.status === 0 || (request.status as number) >= 100 && (request.status as number) <= 599), "request status");
    requireValid(nonnegative(request.t_start_ms) && nonnegative(request.t_end_ms) && nonnegative(request.duration_ms), "request times");
    requireValid(request.streamed === true || request.streamed === false, "request streamed");
    requireValid(request.successful === true || request.successful === false, "request successful");
    for (const key of ["wait_ms", "transfer_ms", "cost_usd", "token_floor_usd"]) {
      requireValid(nullableNumber(request[key]), `request ${key}`);
    }
    requireValid(request.gap_before_ms === null || (typeof request.gap_before_ms === "number" && Number.isFinite(request.gap_before_ms)), "request gap");
    for (const key of ["input_tokens", "cached_input_tokens", "output_tokens"]) {
      requireValid(request[key] === null || integer(request[key]), `request ${key}`);
    }
    const r = request as unknown as AnalysisRequest;
    requireValid(near(r.t_end_ms - r.t_start_ms, r.duration_ms), "request duration");
    requireValid(r.wait_ms === null ? r.transfer_ms === null : r.transfer_ms !== null && near(r.wait_ms + r.transfer_ms, r.duration_ms), "request wait/transfer");
    requireValid(!sequences.has(r.seq), "request sequence duplicate");
    sequences.add(r.seq);
    requireValid(index !== 0 || r.t_start_ms === 0, "request origin");
    requireValid(r.t_start_ms >= previousStart, "request chronological order");
    requireValid(index === 0 ? r.gap_before_ms === null : r.gap_before_ms !== null && near(r.gap_before_ms, Math.max(0, r.t_start_ms - latestEnd)), "request gap");
    unionDuration += Math.max(0, r.t_end_ms - Math.max(latestEnd, r.t_start_ms));
    previousStart = r.t_start_ms;
    latestEnd = Math.max(latestEnd, r.t_end_ms);
    requireValid(!r.successful || r.status >= 200 && r.status < 300, "request success status");
    const usage = [r.input_tokens, r.cached_input_tokens, r.output_tokens];
    requireValid(usage.every(v => v === null) || usage.every(v => v !== null), "request usage availability");
    requireValid(r.cached_input_tokens === null || r.input_tokens !== null && r.cached_input_tokens <= r.input_tokens, "request cached input");
    requireValid((r.cost_usd === null) === (r.token_floor_usd === null), "request cost availability");
    requireValid(r.cost_usd === null || r.input_tokens !== null, "request priced usage");
    requireValid(r.successful || [...usage, r.cost_usd, r.token_floor_usd].every(v => v === null), "request unsuccessful accounting");
    return r;
  });
  const summary = shape(a.request_summary, [
    "n", "n_success", "n_error", "median_duration_ms", "median_wait_ms", "median_transfer_ms", "median_gap_before_ms",
    "largest_duration_ms", "largest_gap_before_ms", "time_after_last_ms", "share_after_last", "share_in_gaps",
    "cumulative_input", "cumulative_cached_input", "cumulative_output", "cumulative_cost_usd",
  ], "request_summary");
  requireValid(integer(summary.n) && integer(summary.n_success) && integer(summary.n_error), "request summary counts");
  for (const [key, value] of Object.entries(summary)) {
    if (["n", "n_success", "n_error"].includes(key)) continue;
    requireValid(nullableNumber(value), `request summary ${key}`);
    if (key.startsWith("cumulative_") && key !== "cumulative_cost_usd") requireValid(value === null || integer(value), `request summary ${key}`);
    if (key.startsWith("share_")) requireValid(value === null || (value as number) <= 1, `request summary ${key}`);
  }
  const attempt = a as unknown as AnalysisAttempt;
  const timing = attempt.timing;
  const expected = summarizeRequests(requests, timing === null ? null : timing.end_to_end - timing.startup, timing === null ? null : 0);
  for (const [key, value] of Object.entries(expected)) {
    const supplied = summary[key];
    requireValid(value === null ? supplied === null : typeof supplied === "number" && near(value, supplied), `request summary ${key}`);
  }
  requireValid(requests.length === attempt.turns, "request turns");
  if (timing !== null) {
    requireValid(near(requests.reduce((sum, r) => sum + r.duration_ms, 0), timing.sum_request_durations), "request duration sum");
    requireValid(near(unionDuration, timing.model_time), "request interval union");
    requireValid(expected.median_wait_ms === null ? timing.first_byte_ms === null : timing.first_byte_ms !== null && near(expected.median_wait_ms, timing.first_byte_ms), "request first-byte median");
  }
  const expectedUsageReason = expected.n_success === 0 ? "no-successful-usage" : expected.cumulative_input === null ? "incomplete-usage" : null;
  requireValid(attempt.usage_unavailable === expectedUsageReason, "request usage availability reason");
  if (attempt.usage_unavailable === null) {
    requireValid(expected.cumulative_input !== null && expected.cumulative_output !== null && expected.cumulative_cached_input !== null &&
      near(expected.cumulative_input, attempt.input_tokens!) && near(expected.cumulative_output, attempt.output_tokens!) &&
      near(expected.cumulative_input === 0 ? 0 : expected.cumulative_cached_input / expected.cumulative_input * 100, attempt.cached_percent!), "request usage totals");
  }
  if (attempt.cost_usd !== null) {
    requireValid(requests.filter(r => r.successful).every(r => r.cost_usd !== null), "request cost availability");
    requireValid(near(requests.reduce((sum, r) => sum + (r.cost_usd ?? 0), 0), attempt.cost_usd), "request cost total");
    requireValid(near(requests.reduce((sum, r) => sum + (r.token_floor_usd ?? 0), 0), attempt.token_floor_usd!), "request token floor total");
  }
  return { ...attempt, requests, request_summary: expected };
}

/** Saved populations and notes are deliberately discarded and recomputed. */
export function replayAnalysis(value: unknown): AnalysisExport {
  const exported = shape(value, ["schema_version", "scope", "notes", "attempts", "populations", "annotated_runs"], "root");
  requireValid(exported.schema_version === 2 && exported.scope === "loaded-attempts", "schema/scope");
  requireValid(Array.isArray(exported.attempts), "attempts");
  return analyzeAttempts(exported.attempts.map(validateAttempt));
}

export function writeAnalysisReplay(inputPath: string, outDir: string): void {
  let input: unknown;
  try { input = JSON.parse(readFileSync(inputPath, "utf8")); }
  catch { throw new ConfigError("analysis input is unavailable or invalid JSON"); }
  const analysis = replayAnalysis(input);
  const markdown = renderAnalysisMarkdown(analysis);
  const html = renderAnalysisHtml(analysis);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "analysis.json"), `${JSON.stringify(analysis, null, 2)}\n`);
  writeFileSync(join(outDir, "analysis.md"), markdown);
  writeFileSync(join(outDir, "analysis.html"), html);
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const [inputPath, outDir, extra] = process.argv.slice(2);
    if (inputPath === undefined || outDir === undefined || extra !== undefined) throw new ConfigError("usage: node scripts/s6-analysis-replay.mjs <analysis.json> <output-dir>");
    writeAnalysisReplay(inputPath, outDir);
    process.stdout.write("Rebuilt analysis from validated public attempt facts.\n");
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
