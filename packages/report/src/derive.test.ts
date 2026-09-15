import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { deriveFromC1, deriveRun, harnessShare, iqr, projectToProxyClock } from "./derive.js";
import { unionDuration } from "./intervals.js";
import {
  assertNoHarnessShareForNone,
  renderHeadlineMarkdown,
  renderTaskMarkdown,
  type HeadlineRow,
  type TaskDetailRow,
} from "./render.js";
import { renderHtml } from "./aggregate.js";

const overlapPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../../contracts/fixtures/derivation/overlap.json",
);

describe("unionDuration", () => {
  it("merges overlap, keeps disjoint, handles nested and empty", () => {
    expect(unionDuration([])).toBe(0);
    expect(unionDuration([{ start: 0, end: 10 }])).toBe(10);
    expect(
      unionDuration([
        { start: 2500, end: 9000 },
        { start: 4000, end: 8000 },
      ]),
    ).toBe(6500);
    expect(
      unionDuration([
        { start: 0, end: 10 },
        { start: 20, end: 30 },
      ]),
    ).toBe(20);
    expect(
      unionDuration([
        { start: 0, end: 10 },
        { start: 2, end: 3 },
      ]),
    ).toBe(10);
  });
});

describe("iqr", () => {
  it("uses interpolated quartiles and is zero for one observation", () => {
    expect(iqr([1, 2, 3, 4])).toBe(1.5);
    expect(iqr([4])).toBeNull();
  });
});

describe("deriveRun overlap fixture", () => {
  const fx = JSON.parse(readFileSync(overlapPath, "utf8")) as {
    adapter: { tStart: number; tEnd: number };
    events: Array<{ t_req_start: number; t_last_byte: number }>;
    toolEvents: Array<{ tStart: number; tEnd: number }>;
    expected: {
      startup: number;
      model_time: number;
      sum_request_durations: number;
      parallelism: number;
      tool_time: number;
      harness_time: number;
    };
  };

  it("matches the worked example exactly", () => {
    const d = deriveRun({
      adapter: fx.adapter,
      events: fx.events,
      toolEvents: fx.toolEvents,
      toolVisibility: "full",
    });
    expect(d.startup).toBe(2500);
    expect(d.model_time).toBe(6500);
    expect(d.tool_time).toBe(1800);
    expect(d.harness_time).toBe(1700);
    expect(d.sum_request_durations).toBe(fx.expected.sum_request_durations);
    expect(d.parallelism).toBeCloseTo(fx.expected.parallelism, 3);
    expect(d.unreconciled).toBe(false);
  });

  it("projects distinct clock anchors onto proxy-relative time", () => {
    expect(projectToProxyClock(
      100_000,
      { wall_clock_iso: "2026-08-25T00:00:10.250Z", monotonic_zero: 100_000 },
      { wall_clock_iso: "2026-08-25T00:00:10.000Z", monotonic_zero: 50_000 },
    )).toBe(250);
  });

  it("derives the median first-byte latency from identifiable request intervals", () => {
    const d = deriveRun({
      adapter: { tStart: 0, tEnd: 10_000 },
      events: [
        { t_req_start: 1_000, t_first_byte: 1_100, t_last_byte: 2_000 },
        { t_req_start: 2_000, t_first_byte: 2_300, t_last_byte: 3_000 },
      ],
      toolEvents: [],
      toolVisibility: "none",
    });
    expect(d.first_byte_ms).toBe(200);
  });

  it("uses identifiable model attempts even when a provider attempt fails", () => {
    const d = deriveFromC1(
      { tStart: 0, tEnd: 10_000 },
      [
        {
          v: 1, run_id: "x", seq: 0, t_req_start: 1_000, t_req_body_end: 1_000,
          t_upstream_sent: 1_000, t_first_byte: 2_000, t_last_byte: 4_000, duration_ms: 3_000,
          method: "POST", path: "/v1/chat/completions", protocol: "openai_chat",
          model_requested: null, model_served: null, status: 200, streamed: false,
          usage: null, usage_source: "unavailable", error: null,
        },
        {
          v: 1, run_id: "x", seq: 1, t_req_start: 4_500, t_req_body_end: 4_500,
          t_upstream_sent: 4_500, t_first_byte: 5_000, t_last_byte: 6_500, duration_ms: 2_000,
          method: "POST", path: "/v1/chat/completions", protocol: "openai_chat",
          model_requested: "m", model_served: null, status: 429, streamed: false,
          usage: null, usage_source: "unavailable",
          error: { kind: "upstream_http", detail: "status 429" },
        },
        {
          v: 1, run_id: "x", seq: 2, t_req_start: 7_000, t_req_body_end: 7_000,
          t_upstream_sent: 7_000, t_first_byte: 7_100, t_last_byte: 8_000, duration_ms: 1_000,
          method: "GET", path: "/api/hello", protocol: "unknown",
          model_requested: null, model_served: null, status: 404, streamed: false,
          usage: null, usage_source: "unavailable", error: { kind: "upstream_http", detail: "status 404" },
        },
      ],
      [],
      "none",
    );
    expect(d.model_time).toBe(5_000);
    expect(d.startup).toBe(1_000);
  });

  it("keeps a network-failed model attempt in the timing union", () => {
    const d = deriveFromC1(
      { tStart: 0, tEnd: 5_000 },
      [{
        v: 1, run_id: "x", seq: 0, t_req_start: 1_000, t_req_body_end: 1_000,
        t_upstream_sent: 1_000, t_first_byte: 2_000, t_last_byte: 3_000, duration_ms: 2_000,
        method: "POST", path: "/v1/responses", protocol: "openai_responses",
        model_requested: "m", model_served: null, status: 0, streamed: false,
        usage: null, usage_source: "unavailable",
        error: { kind: "network", detail: "connection reset" },
      }],
      [],
      "none",
    );
    expect(d.model_time).toBe(2_000);
    expect(d.non_model_time).toBe(2_000);
    expect(d.first_byte_ms).toBeNull();
  });

  it("leaves tool_time and harness_time null when visibility is none", () => {
    const d = deriveRun({
      adapter: fx.adapter,
      events: fx.events,
      toolEvents: fx.toolEvents,
      toolVisibility: "none",
    });
    expect(d.tool_time).toBeNull();
    expect(d.harness_time).toBeNull();
    expect(d.non_model_time).toBe(3500);
    expect(harnessShare(d)).toBeNull();
  });

  it("leaves tool_time and harness_time null when visibility is partial", () => {
    const d = deriveRun({
      adapter: fx.adapter,
      events: fx.events,
      toolEvents: fx.toolEvents,
      toolVisibility: "partial",
    });
    expect(d.tool_time).toBeNull();
    expect(d.harness_time).toBeNull();
    expect(d.non_model_time).toBe(3500);
    expect(harnessShare(d)).toBeNull();
  });

  it("flags an unreconciled run", () => {
    const d = deriveRun({
      adapter: { tStart: 0, tEnd: 100 },
      events: [{ t_req_start: 0, t_last_byte: 10000 }],
      toolEvents: [{ tStart: 0, tEnd: 10000 }],
      toolVisibility: "full",
    });
    expect(d.unreconciled).toBe(true);
  });

  it("flags model intervals outside the adapter window", () => {
    const d = deriveRun({
      adapter: { tStart: 0, tEnd: 100 },
      events: [{ t_req_start: -10, t_last_byte: 10 }],
      toolEvents: [],
      toolVisibility: "none",
    });
    expect(d.unreconciled).toBe(true);
  });
});

describe("costUsd", () => {
  it("does not guess when usage is missing", async () => {
    const { costUsd } = await import("./aggregate.js");
    expect(costUsd(null, { input: 1, cached_input: 0, output: 2 })).toBeNull();
    expect(costUsd({ input: 10, cached_input: 4, output: 2 }, { input: 1, cached_input: 0.1, output: 2 })).toBe(
      6 * 1 + 4 * 0.1 + 2 * 2,
    );
  });
});

describe("iqr", () => {
  it("reports an unmeasurable spread as null, not zero", () => {
    // A single repetition has no measurable spread. Returning 0 published
    // "0ms" in the IQR column, which reads as "we measured zero variance"
    // rather than "variance is unmeasured".
    expect(iqr([])).toBeNull();
    expect(iqr([1000])).toBeNull();
    expect(iqr([1000, 2000])).not.toBeNull();
  });
});

describe("mixed-visibility headline", () => {
  it("leaves harness share blank for none and refuses a percentage", () => {
    const full = deriveRun({
      adapter: { tStart: 0, tEnd: 12500 },
      events: [
        { t_req_start: 2500, t_last_byte: 9000 },
        { t_req_start: 4000, t_last_byte: 8000 },
      ],
      toolEvents: [{ tStart: 9200, tEnd: 11000 }],
      toolVisibility: "full",
    });
    const none = deriveRun({
      adapter: { tStart: 0, tEnd: 12500 },
      events: [{ t_req_start: 2500, t_last_byte: 9000 }],
      toolEvents: [],
      toolVisibility: "none",
    });
    const rows: HeadlineRow[] = [
      {
        harness: "tool-a",
        version: "1.0.0",
        visibility: "full",
        derived: full,
        e2eIqr: 0,
        turns: 2,
        inputTokens: 20,
        outputTokens: 4,
        cachedPercent: 0,
        costUsd: 0.41,
        tokenFloorUsd: 0.37,
        success: "9/10",
      },
      {
        harness: "tool-b",
        version: "0.9.1",
        visibility: "none",
        derived: none,
        e2eIqr: 0,
        turns: 1,
        inputTokens: null,
        outputTokens: null,
        cachedPercent: null,
        costUsd: 1.18,
        tokenFloorUsd: 0.5,
        success: "9/10",
      },
    ];
    const md = renderHeadlineMarkdown(rows);
    expect(md).toContain("Parallelism");
    expect(md).toContain("Harness share (full only)");
    expect(md).toContain("Non-model share (fallback)");
    const [header, delimiter] = md.split("\n");
    expect(delimiter?.split("|").length).toBe(header?.split("|").length);
    for (const row of md.split("\n").slice(2)) {
      expect(row.split("|").length).toBe(header?.split("|").length);
    }
    const goldenPath = join(dirname(fileURLToPath(import.meta.url)), "../fixtures/headline.golden.md");
    // AOB_UPDATE_GOLDEN=1 rewrites the fixture after a deliberate rendering
    // change, so it never has to be hand-edited into agreement.
    if (process.env.AOB_UPDATE_GOLDEN === "1") writeFileSync(goldenPath, `${md}\n`);
    const golden = readFileSync(goldenPath, "utf8").trimEnd();
    expect(md).toBe(golden);
    expect(md).toContain("| none |");
    expect(md).toMatch(/tool-b.*—/);
    assertNoHarnessShareForNone(md);
    const bad = md.replace("| tool-b | 0.9.1 | none | — | 12.50s / 0ms | — | — (non-model 28%) | 2.50s |", "| tool-b | 0.9.1 | none | — | 12.50s / 0ms | 61% | — (non-model 28%) | 2.50s |");
    expect(() => assertNoHarnessShareForNone(bad)).toThrow();
  });

  it("formats durations and small costs for publication", () => {
    // A published table showed "8409.410499999998ms" and "$0.00": float noise
    // from averaging, and a cost rounded away to nothing because these cells
    // legitimately cost a tenth of a cent.
    const row: HeadlineRow = {
      harness: "t", version: "1", visibility: "partial",
      derived: {
        end_to_end: 8409.410499999998, startup: 302.56274999999994, model_time: 600,
        tool_time: 100, harness_time: 200, non_model_time: 300, parallelism: 1,
        sum_request_durations: 600, unreconciled: false, first_byte_ms: 1771.4394584999973,
      }, e2eIqr: 0, turns: 1, inputTokens: 10, outputTokens: 2,
      cachedPercent: 0, costUsd: 0.0013071, tokenFloorUsd: 0.0026, success: "1/1",
    };
    const md = renderHeadlineMarkdown([row]);
    expect(md).not.toMatch(/\d\.\d{6,}/);
    expect(md).toContain("8.41s");
    expect(md).toContain("303ms");
    expect(md).toContain("1.77s");
    expect(md).toContain("$0.0013");
    expect(md).not.toContain("$0.00 ");
  });

  it("keeps two decimals for costs at or above a cent", () => {
    const row: HeadlineRow = {
      harness: "t", version: "1", visibility: "none",
      derived: null, e2eIqr: null, turns: 0, inputTokens: null, outputTokens: null,
      cachedPercent: null, costUsd: 1.184, tokenFloorUsd: 0.5, success: "1/1",
    };
    expect(renderHeadlineMarkdown([row])).toContain("$1.18");
  });

  it("leaves harness share blank for partial visibility", () => {
    const row: HeadlineRow = {
      harness: "partial-tool", version: "1.0.0", visibility: "partial",
      derived: {
        end_to_end: 1000, startup: 100, model_time: 600, tool_time: 100,
        harness_time: 200, non_model_time: 300, parallelism: 1,
        sum_request_durations: 600, unreconciled: false,
        first_byte_ms: null,
      }, e2eIqr: 0, turns: 1, inputTokens: 1, outputTokens: 1,
      cachedPercent: 0, costUsd: 0, tokenFloorUsd: 0, success: "yes",
    };
    expect(renderHeadlineMarkdown([row])).toContain("| partial-tool | 1.0.0 | partial | — | 1.00s / 0ms | — |");
  });

  it("keeps task-detail rows aligned with their header", () => {
    const row: TaskDetailRow = {
      harness: "tool-a",
      taskId: "task-1",
      visibility: "partial",
      derived: deriveRun({
        adapter: { tStart: 0, tEnd: 1000 },
        events: [{ t_req_start: 100, t_first_byte: 150, t_last_byte: 700 }],
        toolEvents: [],
        toolVisibility: "partial",
      }),
      e2eIqr: 0,
      costUsd: null,
      success: "yes",
      rawPath: undefined,
    };
    const lines = renderTaskMarkdown([row]).split("\n");
    expect(lines[1]?.split("|").length).toBe(lines[0]?.split("|").length);
    expect(lines[2]?.split("|").length).toBe(lines[0]?.split("|").length);
    expect(lines[2]).toContain("50ms");
  });

  it("keeps the README table rectangular and consistent with the evidence ledger", () => {
    const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
    const readme = readFileSync(join(root, "README.md"), "utf8");
    expect(readme).toContain("Harness share (full only)");
    expect(readme).toContain("Non-model share (fallback)");

    const tables = readme.split(/\n\s*\n/)
      .map((block) => block.split("\n").filter((line) => line.startsWith("|")))
      .filter((lines) => lines.length > 0);
    for (const lines of tables) {
      expect(lines.length).toBeGreaterThanOrEqual(3);
      expect(new Set(lines.map((line) => line.split("|").length)).size).toBe(1);
    }
    // Coverage tables may coexist with the historical pilot headline. Bind
    // only the measurement headline to the release/pilot evidence ledger.
    const headlines = tables.filter((lines) => lines[0]?.startsWith("| Harness | vX.Y |"));
    expect(headlines).toHaveLength(1);
    const lines = headlines[0]!;

    // The table and the evidence ledger must agree about whether v1 shipped.
    const ledger = JSON.parse(readFileSync(join(root, "evidence/index.json"), "utf8"));
    const rows = lines.slice(2);
    if (ledger.status === "released" || ledger.status === "pilot") {
      expect(rows.length).toBeGreaterThanOrEqual(1);
      for (const row of rows) expect(row).not.toContain("*unpublished*");
    } else {
      expect(rows).toHaveLength(1);
      expect(rows[0]).toContain("*unpublished*");
    }
  });
});

describe("stackedBarSvg", () => {
  it("sizes rects from the shipped deriveRun buckets", async () => {
    const { stackedBarSvg } = await import("./aggregate.js");
    const d = deriveRun({
      adapter: { tStart: 0, tEnd: 12500 },
      events: [
        { t_req_start: 2500, t_last_byte: 9000 },
        { t_req_start: 4000, t_last_byte: 8000 },
      ],
      toolEvents: [{ tStart: 9200, tEnd: 11000 }],
      toolVisibility: "full",
    });
    const svg = stackedBarSvg(d, 1250, 24);
    expect(svg).toContain('data-e2e="12500"');
    expect(svg).toContain('aria-label="Timing breakdown"');
    const width = (key: string) => {
      const m = svg.match(new RegExp(`data-seg="${key}"[^>]*width="([0-9.]+)"`));
      return Number(m?.[1]);
    };
    expect(width("startup")).toBe(250);
    expect(width("model")).toBe(650);
    expect(width("tool")).toBe(180);
    expect(width("harness")).toBe(170);
    expect(svg).not.toMatch(/data-seg="tool"[^>]*fill="url\(#/);
    const escaped = stackedBarSvg(d, 100, 24, "hatch", "<tool & \"timing\">");
    expect(escaped).toContain('aria-label="&lt;tool &amp; &quot;timing&quot;&gt;"');
    expect(escaped).not.toContain('aria-label="<tool');
    const html = renderHtml("| Raw |\n|---|\n| [run.json](raw/run.json) |", [svg]);
    expect(html).toContain("<svg");
    expect(html).toContain("data-seg=\"startup\"");
    expect(html).toContain('<a href="raw/run.json">run.json</a>');
    expect(html).not.toContain("&lt;a href");
    expect(html).toContain('aria-label="Timing and cost charts"');
    expect(html).toContain("Hatched residual = non-model time");
    expect(html).not.toMatch(/<script|<link[^>]+href=/i);
  });

  it("uses a hatched non_model segment when visibility is none", async () => {
    const { stackedBarSvg } = await import("./aggregate.js");
    const d = deriveRun({
      adapter: { tStart: 0, tEnd: 12500 },
      events: [
        { t_req_start: 2500, t_last_byte: 9000 },
        { t_req_start: 4000, t_last_byte: 8000 },
      ],
      toolEvents: [],
      toolVisibility: "none",
    });
    const svg = stackedBarSvg(d, 1250, 24);
    expect(svg).toContain('data-seg="non_model"');
    expect(svg).not.toContain('data-seg="harness"');
    expect(svg).toMatch(/data-seg="non_model"[^>]*fill="url\(#hatch/);
    const m = svg.match(/data-seg="non_model"[^>]*width="([0-9.]+)"/);
    expect(Number(m?.[1])).toBe(350);
  });
});
