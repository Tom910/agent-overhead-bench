import { describe, expect, it } from "vitest";
import { parseReportArgs } from "./cli.js";

describe("aob-report arguments", () => {
  it("uses the supplied positional results directory when --out is absent", () => {
    expect(parseReportArgs(["/tmp/archive/results"])).toEqual({ resultsDir: "/tmp/archive/results", outDir: "dist/report" });
  });

  it("does not treat the --out value as the results directory", () => {
    expect(parseReportArgs(["/tmp/archive/results", "--out", "/tmp/report"])).toEqual({ resultsDir: "/tmp/archive/results", outDir: "/tmp/report" });
  });
});
