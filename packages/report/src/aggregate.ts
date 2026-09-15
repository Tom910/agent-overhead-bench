import { median, type DerivedRun } from "./derive.js";

export type PriceRates = { input: number; cached_input: number; output: number };

export function costUsd(
  usage: { input: number; cached_input: number; output: number } | null,
  rates: PriceRates,
): number | null {
  if (usage === null) return null;
  const uncached = Math.max(0, usage.input - usage.cached_input);
  return uncached * rates.input + usage.cached_input * rates.cached_input + usage.output * rates.output;
}

export function tokenFloorUsd(
  usage: { input: number; output: number } | null,
  rates: PriceRates,
): number | null {
  if (usage === null) return null;
  return usage.input * rates.input + usage.output * rates.output;
}

export function aggregateMedians(runs: DerivedRun[]): DerivedRun {
  const ok = runs.filter((r) => !r.unreconciled);
  const num = (sel: (r: DerivedRun) => number) => median(ok.map(sel));
  const nullable = (sel: (r: DerivedRun) => number | null): number | null => {
    const xs = ok.map(sel).filter((v): v is number => v !== null);
    return xs.length === 0 ? null : median(xs);
  };
  return {
    end_to_end: num((r) => r.end_to_end),
    startup: num((r) => r.startup),
    model_time: num((r) => r.model_time),
    tool_time: nullable((r) => r.tool_time),
    harness_time: nullable((r) => r.harness_time),
    non_model_time: num((r) => r.non_model_time),
    parallelism: num((r) => r.parallelism),
    first_byte_ms: nullable((r) => r.first_byte_ms),
    sum_request_durations: num((r) => r.sum_request_durations),
    unreconciled: false,
  };
}

export type BarSeg = { key: string; ms: number | null; color: string; pattern?: boolean };

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function stackedSegments(d: DerivedRun): BarSeg[] {
  if (d.harness_time === null || d.tool_time === null) {
    return [
      { key: "startup", ms: d.startup, color: "#888888" },
      { key: "model", ms: d.model_time, color: "#4a90d9" },
      { key: "non_model", ms: d.non_model_time, color: "#bbbbbb", pattern: true },
    ];
  }
  return [
    { key: "startup", ms: d.startup, color: "#888888" },
    { key: "model", ms: d.model_time, color: "#4a90d9" },
    { key: "harness", ms: d.harness_time, color: "#e6a817" },
    { key: "tool", ms: d.tool_time, color: "#3cb371" },
  ];
}

export function stackedBarSvg(d: DerivedRun, width = 400, height = 24, patternId = "hatch", label = "Timing breakdown"): string {
  const total = Math.max(d.end_to_end, 1);
  let x = 0;
  const rects: string[] = [
    `<pattern id="${patternId}" width="4" height="4" patternUnits="userSpaceOnUse"><path d="M0,4 L4,0" stroke="#999" stroke-width="1"/></pattern>`,
  ];
  for (const seg of stackedSegments(d)) {
    const px = ((seg.ms ?? 0) / total) * width;
    const fill = seg.pattern || seg.ms === null ? `url(#${patternId})` : seg.color;
    rects.push(
      `<rect data-seg="${seg.key}" data-ms="${seg.ms ?? "null"}" x="${x.toFixed(2)}" y="0" width="${px.toFixed(2)}" height="${height}" fill="${fill}"/>`,
    );
    x += px;
  }
  const accessibleLabel = escapeXml(label);
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${accessibleLabel}" width="${width}" height="${height}" data-e2e="${d.end_to_end}"><title>${accessibleLabel}</title>${rects.join("")}</svg>`;
}

export function costBarSvg(cost: number | null, floor: number | null, width = 400, height = 16, label = "Cost versus token floor"): string {
  const actual = cost ?? 0;
  const baseline = floor ?? 0;
  const total = Math.max(actual, baseline, 0.000001);
  const actualWidth = (actual / total) * width;
  const floorWidth = (baseline / total) * width;
  const accessibleLabel = escapeXml(label);
  return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${accessibleLabel}" width="${width}" height="${height}" data-chart="cost" data-cost="${cost ?? "null"}" data-floor="${floor ?? "null"}"><title>${accessibleLabel}</title><rect data-cost-segment="token-floor" x="0" y="0" width="${floorWidth.toFixed(2)}" height="${height}" fill="#bbbbbb"/><rect data-cost-segment="actual" x="0" y="0" width="${actualWidth.toFixed(2)}" height="${height}" fill="#4a90d9"/></svg>`;
}

export function renderHtml(markdownTable: string, svgs: string[] = []): string {
  const bars = svgs.length === 0 ? "" : `<section aria-label="Timing and cost charts"><h2>Timing and cost charts</h2><p class="legend"><span class="legend-swatch observed"></span>Observed bucket <span class="legend-swatch residual"></span>Hatched residual = non-model time when tool visibility is incomplete.</p><div class="charts">${svgs.map((svg, index) => `<figure class="chart" data-chart-index="${index + 1}">${svg}</figure>`).join("\n")}</div></section>`;
  const escaped = markdownTable.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const linked = escaped.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (whole, label: string, href: string) => {
    if (href.startsWith("/") || /^[A-Za-z][A-Za-z0-9+.-]*:/.test(href)) return whole;
    return `<a href="${href}">${label}</a>`;
  });
  const lines = linked.split("\n");
  const blocks: string[] = [];
  let pre: string[] = [];
  const flushPre = () => {
    if (pre.length > 0) {
      blocks.push(`<pre>${pre.join("\n")}</pre>`);
      pre = [];
    }
  };
  for (let index = 0; index < lines.length;) {
    if (lines[index]?.startsWith("|") && lines[index + 1]?.match(/^\|(?:\s*:?-+:?\s*\|)+$/)) {
      flushPre();
      const cells = (line: string) => line.split("|").slice(1, -1).map((cell) => cell.trim());
      const header = cells(lines[index]!);
      const body: string[][] = [];
      index += 2;
      while (index < lines.length && lines[index]?.startsWith("|")) body.push(cells(lines[index++]!));
      blocks.push(`<table><thead><tr>${header.map((cell) => `<th>${cell}</th>`).join("")}</tr></thead><tbody>${body.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("")}</tbody></table>`);
    } else {
      pre.push(lines[index++]!);
    }
  }
  flushPre();
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>agent-overhead-bench</title><style>body{font-family:system-ui,sans-serif;line-height:1.45;margin:2rem;max-width:100rem}table{border-collapse:collapse;display:block;overflow-x:auto}th,td{border:1px solid #ddd;padding:.35rem .55rem;text-align:left;white-space:nowrap}th{background:#f4f4f4}.charts{display:grid;gap:.75rem}.chart{margin:0;overflow-x:auto}.legend{color:#444;font-size:.9rem}.legend-swatch{display:inline-block;width:1rem;height:.8rem;margin:0 .25rem 0 .75rem;vertical-align:-.1rem;background:#4a90d9}.legend-swatch.residual{background:repeating-linear-gradient(135deg,#bbb 0,#bbb 2px,#fff 2px,#fff 4px)}</style></head>
<body>
${blocks.join("\n")}
${bars}
</body></html>
`;
}
