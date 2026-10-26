import { ConfigError } from "@aob/contracts";

export type SuccessObservation = { harness: string; task: string; rep: number; outcome: string };
export type PairwiseConfidence = {
  left: string; right: string; difference_pp: number;
  tasks: number; attempts_per_harness: number;
  interval: [number, number] | null;
  interpretation: "inconclusive" | "directional" | "insufficient-tasks";
};
export const CONFIDENCE_METHOD = "Exploratory 95% percentile task-cluster bootstrap, 10,000 deterministic resamples. Each task and all its repetitions move together; harnesses are paired by task, not by random seed. Marginal intervals are not corrected for multiple comparisons or winner selection. Eight task clusters provide limited evidence about other coding tasks. These intervals do not remove configuration, environment or verifier confounding.";

/** Existing fixed sampler, shared by pass differences and secondary task means. */
export function taskClusterMeanBounds(values: readonly number[]): [number, number] | null {
  if (values.some(value => !Number.isFinite(value))) throw new ConfigError("confidence: invalid task-cluster value");
  if (values.length < 2) return null;
  let state = 0x6d2b79f5;
  const random = () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; };
  const samples = Array.from({ length: 10_000 }, () => {
    let total = 0;
    for (let t = 0; t < values.length; t++) total += values[Math.floor(random() * values.length)]!;
    return total / values.length;
  }).sort((a, b) => a - b);
  return [samples[249]!, samples[9749]!];
}

function comparisonGrid(observations: readonly SuccessObservation[]) {
  const grouped = new Map<string, Map<string, Map<number, boolean>>>();
  for (const item of observations) {
    if (!Number.isInteger(item.rep) || item.rep < 0) throw new ConfigError("confidence: invalid repetition");
    const harness = grouped.get(item.harness) ?? new Map<string, Map<number, boolean>>();
    const task = harness.get(item.task) ?? new Map<number, boolean>();
    if (task.has(item.rep)) throw new ConfigError("confidence: duplicate task/harness/repetition");
    task.set(item.rep, item.outcome === "completed"); harness.set(item.task, task); grouped.set(item.harness, harness);
  }
  const reference = grouped.values().next().value;
  if (reference) for (const tasks of grouped.values()) {
    if (tasks.size !== reference.size) throw new ConfigError("confidence: unmatched task coverage");
    for (const [key, repetitions] of reference) {
      const other = tasks.get(key);
      if (!other || other.size !== repetitions.size || [...repetitions.keys()].some(rep => !other.has(rep))) throw new ConfigError("confidence: unmatched repetition coverage");
    }
  }
  return grouped;
}

/** Validate the same matched-grid boundary without computing unused intervals. */
export function validateComparisonGrid(observations: readonly SuccessObservation[]): void { comparisonGrid(observations); }

/** Descriptive differences for a balanced task panel; no seed pairing assumption. */
export function pairwiseConfidence(observations: readonly SuccessObservation[]): PairwiseConfidence[] {
  const grouped = comparisonGrid(observations);
  const harnesses = [...grouped.keys()].sort(); const pairs: PairwiseConfidence[] = [];
  for (let i = 0; i < harnesses.length; i++) for (let j = i + 1; j < harnesses.length; j++) {
    const left = harnesses[i]!; const right = harnesses[j]!;
    const l = grouped.get(left)!; const r = grouped.get(right)!;
    const tasks = [...l.keys()].sort();
    if (tasks.length !== r.size) throw new ConfigError("confidence: unmatched task coverage");
    let attempts = 0;
    const differences = tasks.map(task => {
      const a = l.get(task)!; const b = r.get(task);
      if (!b || a.size !== b.size || [...a.keys()].some(rep => !b.has(rep))) throw new ConfigError("confidence: unmatched repetition coverage");
      attempts += a.size;
      const rate = (values: Map<number, boolean>) => [...values.values()].filter(Boolean).length / values.size;
      return 100 * (rate(a) - rate(b));
    });
    const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
    const difference_pp = mean(differences);
    const interval = taskClusterMeanBounds(differences);
    pairs.push({ left, right, difference_pp, tasks: tasks.length, attempts_per_harness: attempts, interval,
      interpretation: interval === null ? "insufficient-tasks" : interval[0] > 0 || interval[1] < 0 ? "directional" : "inconclusive" });
  }
  return pairs;
}
