import { describe, expect, it } from "vitest";
import { pairwiseConfidence, type SuccessObservation } from "./comparison-confidence.js";

function fixture(differences: number[]): SuccessObservation[] {
  return differences.flatMap((d, task) => Array.from({ length: 5 }, (_, rep) => [
    { harness: "a", task: `task-${task}`, rep, outcome: rep < d ? "completed" : "verify_error" },
    { harness: "b", task: `task-${task}`, rep, outcome: "verify_error" },
  ]).flat());
}
describe("paired task-cluster confidence", () => {
  it("weights tasks equally and preserves task-level variation rather than treating repetitions as tasks", () => {
    const observations = fixture([5, 0, 0, 0]);
    const [pair] = pairwiseConfidence(observations);
    expect(pair).toMatchObject({ left: "a", right: "b", difference_pp: 25, tasks: 4, attempts_per_harness: 20 });
    expect(pair!.interval).toEqual([0, 75]);
    expect(pair!.interpretation).toBe("inconclusive");
    expect(pairwiseConfidence([...observations].reverse())).toEqual([pair]);
  });
  it("keeps zero differences exact and refuses singleton uncertainty", () => {
    expect(pairwiseConfidence(fixture([0, 0, 0, 0]))[0]!.interval).toEqual([0, 0]);
    const [single] = pairwiseConfidence(fixture([5]));
    expect(single!.difference_pp).toBe(100);
    expect(single!.interval).toBeNull();
    expect(single!.interpretation).toBe("insufficient-tasks");
  });
  it("rejects duplicate and unmatched repetitions instead of silently changing the population", () => {
    const values = fixture([1, 2, 3]);
    expect(() => pairwiseConfidence([...values, values[0]!])).toThrow(/duplicate/);
    expect(() => pairwiseConfidence(values.slice(1))).toThrow(/coverage/);
    expect(pairwiseConfidence(values.filter(v => v.harness === "a"))).toEqual([]);
  });
});
