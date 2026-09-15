import type { ClockAnchor } from "./clock.js";

export type C3ToolEvent = {
  tStart: number;
  tEnd: number;
  kind: string;
};

export type C3AdapterResult = {
  exitCode: number;
  tStart: number;
  tEnd: number;
  /** Captured by the same process that measured tStart/tEnd. */
  anchor: ClockAnchor;
  startupProbe?: number;
  toolEvents?: C3ToolEvent[];
  artifacts: {
    stdoutPath: string;
    stderrPath: string;
    toolLogPath?: string;
  };
};
