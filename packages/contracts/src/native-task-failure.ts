import { closeSync, lstatSync, openSync, readSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { isPreInferenceRejection, isModelRequestAttempt, isSuccessfulModelEvent, modelIdentityMatches } from "./c1.js";
import type { C4Run } from "./c4.js";
import { ConfigError } from "./errors.js";
import { validateC1Event } from "./validate.js";

type Rates = { input: number; cached_input: number; output: number };
const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n) && n >= 0;
const close = (a: number, b: number): boolean => Math.abs(a - b) <= Math.max(1e-9, Math.abs(a) * 1e-6);

/** Bounded evidence reader. Oversized or nonlocal evidence cannot qualify. */
function* lines(root: string, name: string): Generator<string> {
  const path = resolve(root, name);
  const rel = relative(realpathSync(root), realpathSync(path));
  if (!rel || rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel) ||
      lstatSync(path).isSymbolicLink() || !lstatSync(path).isFile()) throw new ConfigError("invalid native outcome evidence path");
  const fd = openSync(path, "r");
  const chunk = Buffer.alloc(65536);
  let pending = Buffer.alloc(0);
  try {
    for (;;) {
      const count = readSync(fd, chunk);
      if (count === 0) break;
      pending = Buffer.concat([pending, chunk.subarray(0, count)]);
      let end: number;
      while ((end = pending.indexOf(10)) >= 0) {
        yield pending.subarray(0, end).toString("utf8");
        pending = pending.subarray(end + 1);
      }
      if (pending.length > 2 * 1024 * 1024) throw new ConfigError("native outcome evidence line exceeds limit");
    }
    if (pending.length) yield pending.toString("utf8");
  } finally { closeSync(fd); }
}

/** Classification only: never changes the recorded C4 failure or calibration. */
export function isCompletedNativeTaskFailure(run: C4Run, root: string, rates: Rates | undefined): boolean {
  if (run.task_source !== "public-task-pack" || run.task_repository !== "https://github.com/datacurve-ai/deep-swe.git" ||
      run.condition !== "pinned" || run.outcome !== "verify_error" || run.adapter_result.exitCode !== 0 ||
      run.verification.exit !== 1 || !finite(run.spend_usd_estimate) || rates === undefined ||
      !Object.values(rates).every(finite) || !finite(run.adapter_result.tStart) || !finite(run.adapter_result.tEnd) ||
      run.adapter_result.tEnd <= run.adapter_result.tStart || !finite(run.verification.duration_ms)) return false;
  try {
    let footer = "";
    let footers = 0;
    for (const line of lines(root, run.verification.logPath)) {
      if (line.trim()) footer = line.trim();
      if (line.startsWith("[verifier] reward.json=")) footers++;
    }
    if (footers !== 1 || !footer.startsWith("[verifier] reward.json=")) return false;
    const reward = JSON.parse(footer.slice("[verifier] reward.json=".length)) as Record<string, unknown>;
    if (!reward || reward.reward !== 0) return false;
    const counts = [reward.f2p_total, reward.f2p_passed, reward.p2p_total, reward.p2p_passed];
    if (!counts.every((n) => finite(n) && Number.isSafeInteger(n))) return false;
    const [ft, fp, pt, pp] = counts as [number, number, number, number];
    if (ft <= 0 || pt <= 0 || fp > ft || pp > pt || fp + pp >= ft + pt ||
        !finite(reward.f2p) || !close(reward.f2p, fp / ft) ||
        !finite(reward.p2p) || !close(reward.p2p, pp / pt) ||
        !finite(reward.partial) || !close(reward.partial, (fp + pp) / (ft + pt))) return false;
    let spent = 0;
    let attempts = 0;
    let seq = -1;
    for (const line of lines(root, run.events_file)) {
      if (!line.trim()) continue;
      const event = validateC1Event(JSON.parse(line));
      if (event.run_id !== run.run_id || event.seq <= seq) return false;
      seq = event.seq;
      if (!isModelRequestAttempt(event)) {
        if (event.model_requested !== null || event.model_served !== null ||
            (event.method === "POST" && /\/(?:messages|responses|chat\/completions)(?:\?|$)/.test(event.path))) return false;
        continue;
      }
      if (!modelIdentityMatches(event, run.model) || ![event.t_req_start, event.t_req_body_end, event.t_upstream_sent,
          event.t_first_byte, event.t_last_byte, event.duration_ms].every(finite)) return false;
      if (isPreInferenceRejection(event)) continue;
      if (!isSuccessfulModelEvent(event) || event.usage === null || event.usage_source === "unavailable") return false;
      attempts++;
      spent += (event.usage.input - event.usage.cached_input) * rates.input +
        event.usage.cached_input * rates.cached_input + event.usage.output * rates.output;
    }
    return attempts > 0 && finite(spent) && close(spent, run.spend_usd_estimate);
  } catch { return false; }
}
