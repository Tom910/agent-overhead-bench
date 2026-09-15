import { describe, expect, it } from "vitest";
import { ConfigError, type C2TaskYaml } from "@aob/contracts";
import { regimeForExpectedMinutes, validateTaskRegime } from "./regime.js";

function task(expectedMinutes: [number, number], timeoutS: number): C2TaskYaml {
  return {
    id: "task",
    source: { kind: "public-task-pack", repository: "https://example.invalid/source", revision: "revision", task_id: "task", license_notes: "test" },
    language: "python",
    size: "medium",
    shape: "feature",
    timeout_s: timeoutS,
    expected_minutes: expectedMinutes,
    description: "test task",
  };
}

describe("validateTaskRegime", () => {
  it("accepts the bounded short and long ranges", () => {
    expect(() => validateTaskRegime([task([1, 5], 300)], "short")).not.toThrow();
    expect(() => validateTaskRegime([task([6, 6], 360)], "long")).not.toThrow();
    expect(() => validateTaskRegime([task([6, 15], 900)], "long")).not.toThrow();
  });

  it("rejects long tasks in short mode", () => {
    expect(() => validateTaskRegime([task([6, 15], 900)], "short")).toThrow(ConfigError);
  });

  it("rejects short or overlong tasks in long mode", () => {
    expect(() => validateTaskRegime([task([1, 5], 300)], "long")).toThrow(/long regime/);
    expect(() => validateTaskRegime([task([6, 16], 900)], "long")).toThrow(/\[6, 15\]/);
    expect(() => validateTaskRegime([task([6, 15], 901)], "long")).toThrow(/301 and 900/);
  });

  it("rejects a timeout below the task's own declared expected maximum", () => {
    // A task declaring up to 5 minutes but killed at 60s is guaranteed to
    // produce spurious timeouts that look like tool failures. The two bounds
    // were validated independently and never against each other.
    expect(() => validateTaskRegime([task([1, 5], 60)], "short")).toThrow(/expected maximum/);
    expect(() => validateTaskRegime([task([6, 15], 600)], "long")).toThrow(/expected maximum/);
    expect(() => validateTaskRegime([task([16, 180], 1800)], "extended")).toThrow(/expected maximum/);
  });

  it("accepts a timeout that covers the declared expected maximum", () => {
    expect(() => validateTaskRegime([task([1, 5], 300)], "short")).not.toThrow();
    expect(() => validateTaskRegime([task([1, 1], 60)], "short")).not.toThrow();
    expect(() => validateTaskRegime([task([6, 15], 900)], "long")).not.toThrow();
  });

  it("accepts the bounded extended range up to the source agent budget", () => {
    expect(() => validateTaskRegime([task([16, 16], 960)], "extended")).not.toThrow();
    expect(() => validateTaskRegime([task([16, 180], 10800)], "extended")).not.toThrow();
    expect(() => validateTaskRegime([task([30, 60], 3600)], "extended")).not.toThrow();
  });

  it("rejects shorter or unbounded tasks in extended mode", () => {
    expect(() => validateTaskRegime([task([6, 15], 900)], "extended")).toThrow(/extended regime/);
    expect(() => validateTaskRegime([task([16, 181], 3600)], "extended")).toThrow(/\[16, 180\]/);
    expect(() => validateTaskRegime([task([16, 180], 10801)], "extended")).toThrow(/901 and 10800/);
  });

  it("keeps extended tasks out of the bounded regimes", () => {
    expect(() => validateTaskRegime([task([16, 180], 3600)], "short")).toThrow(ConfigError);
    expect(() => validateTaskRegime([task([16, 180], 3600)], "long")).toThrow(ConfigError);
  });
});

describe("regimeForExpectedMinutes", () => {
  it("labels each bounded range with its own regime", () => {
    expect(regimeForExpectedMinutes([1, 5])).toBe("short");
    expect(regimeForExpectedMinutes([6, 15])).toBe("long");
    expect(regimeForExpectedMinutes([16, 180])).toBe("extended");
    expect(regimeForExpectedMinutes([30, 60])).toBe("extended");
  });

  it("agrees with validateTaskRegime for every regime", () => {
    // A derived label that validateTaskRegime would reject means the runner
    // records a regime the gates never agreed to. Bind the two together.
    for (const [expectedMinutes, timeoutS] of [
      [[1, 5], 300],
      [[6, 15], 900],
      [[16, 60], 3600],
      [[16, 180], 10800],
    ] as [[number, number], number][]) {
      const derived = regimeForExpectedMinutes(expectedMinutes);
      expect(() => validateTaskRegime([task(expectedMinutes, timeoutS)], derived)).not.toThrow();
    }
  });
});
