/** Wall/monotonic pair. Durations are always computed inside one process. */
export type ClockAnchor = {
  wall_clock_iso: string;
  monotonic_zero: number;
};
