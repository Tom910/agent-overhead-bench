import { ConfigError, type C2TaskYaml } from "@aob/contracts";

export type MeasurementRegime = "short" | "long" | "extended";

/**
 * Enforce the explicit execution regime without adding a second field to C2.
 * C2 stores the task's expected duration and timeout; the runner records the
 * normalized regime in C4.
 *
 * `extended` exists because the reviewed DeepSWE source declares a uniform
 * 10800-second agent budget per task; forcing that source into the bounded
 * short range produced timeout-only cells that carry no overhead signal. The
 * ceiling is the source's own declared budget, so the regime is still closed.
 */
export function validateTaskRegime(tasks: C2TaskYaml[], regime: MeasurementRegime): void {
  if (regime === "short" && tasks.some((task) => task.expected_minutes[1] > 5 || task.timeout_s > 300)) {
    throw new ConfigError("short regime requires tasks with expected maximum <= 5 minutes and timeout <= 300 seconds");
  }
  if (regime === "long" && tasks.some((task) => task.expected_minutes[0] < 6 || task.expected_minutes[1] > 15 || task.timeout_s <= 300 || task.timeout_s > 900)) {
    throw new ConfigError("long regime requires tasks with expected range [6, 15] minutes and timeout between 301 and 900 seconds");
  }
  if (regime === "extended" && tasks.some((task) => task.expected_minutes[0] < 16 || task.expected_minutes[1] > 180 || task.timeout_s <= 900 || task.timeout_s > 10800)) {
    throw new ConfigError("extended regime requires tasks with expected range [16, 180] minutes and timeout between 901 and 10800 seconds");
  }
  // The regime bounds above constrain the expected range and the timeout
  // independently, which allowed a task to declare up to five minutes and then
  // be killed after sixty seconds. Every cell slower than its own declared
  // expectation then times out, and a measurement that should read as tool
  // behavior reads as failure instead.
  const starved = tasks.find((task) => task.timeout_s < task.expected_minutes[1] * 60);
  if (starved !== undefined) {
    throw new ConfigError(
      `task ${starved.id} has timeout_s ${starved.timeout_s} below its declared expected maximum of ${starved.expected_minutes[1]} minutes`,
    );
  }
}

/**
 * Derive the regime label the runner records in C4 from the task's reviewed
 * expected duration. This is the single source of truth for that mapping:
 * deriving it inline elsewhere is how extended tasks came to be recorded as
 * `long` alongside an out-of-range timeout.
 */
export function regimeForExpectedMinutes(expectedMinutes: [number, number]): MeasurementRegime {
  if (expectedMinutes[1] <= 5) return "short";
  if (expectedMinutes[1] <= 15) return "long";
  return "extended";
}
