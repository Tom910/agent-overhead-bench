import { ConfigError } from "@aob/contracts";
import { harnessShare, type DerivedRun, type ToolVisibility } from "./derive.js";

export type HeadlineRow = {
  harness: string;
  version: string;
  visibility: ToolVisibility;
  sourceRegime?: string;
  derived: DerivedRun | null;
  e2eIqr: number | null;
  turns: number;
  inputTokens: number | null;
  outputTokens: number | null;
  cachedPercent: number | null;
  costUsd: number | null;
  tokenFloorUsd: number | null;
  success: string;
  rawPath?: string;
};

export type TaskDetailRow = {
  harness: string;
  taskId: string;
  visibility: ToolVisibility;
  derived: DerivedRun | null;
  e2eIqr: number | null;
  costUsd: number | null;
  success: string;
  rawPath: string | undefined;
};

function markdownCell(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/[\r\n]+/g, " ");
}

/**
 * Format a millisecond duration for publication. Averaged measurements carry
 * float noise ("8409.410499999998ms"), which is both unreadable and implies
 * far more precision than the measurement has.
 */
export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms)) return "—";
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`;
}

/**
 * Format a cost. Two decimals hide these cells entirely: a short fixture task
 * legitimately costs a tenth of a cent, and "$0.00" is not a measurement.
 */
export function formatUsd(usd: number): string {
  if (!Number.isFinite(usd)) return "—";
  if (usd === 0) return "$0.00";
  return usd < 0.01 ? `$${usd.toFixed(4)}` : `$${usd.toFixed(2)}`;
}

export function renderHeadlineMarkdown(rows: HeadlineRow[]): string {
  const header =
    "| Harness | vX.Y | Vis. | Source/regime | E2E (med / median task IQR) | Harness share (full only) | Non-model share (fallback) | Cold start | Parallelism | First byte (med) | Turns | Tokens in/out | Cached % | Cost/task | Cost vs. token floor | Success | Raw |\n" +
    "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|";
  const body = rows.map((r) => {
    const share = r.derived === null ? null : harnessShare(r.derived);
    const shareCell =
      r.visibility !== "full" || share === null
        ? "—"
        : `${(share * 100).toFixed(0)}%`;
    const nonModelShare = r.derived === null || r.derived.end_to_end === 0
      ? null
      : r.derived.non_model_time / r.derived.end_to_end;
    const nonModelCell =
      r.visibility === "full" || nonModelShare === null
        ? "—"
        : `— (non-model ${(nonModelShare * 100).toFixed(0)}%)`;
    if (r.visibility !== "full" && shareCell !== "—") {
      throw new ConfigError("harness share must be blank when visibility is not full");
    }
    const cost = r.costUsd === null ? "—" : formatUsd(r.costUsd);
    const floor =
      r.costUsd === null || r.tokenFloorUsd === null || r.tokenFloorUsd === 0
        ? "—"
        : `${(r.costUsd / r.tokenFloorUsd).toFixed(1)}×`;
    const tokens = r.inputTokens === null || r.outputTokens === null
      ? "—"
      : `${r.inputTokens}/${r.outputTokens}`;
    const cached = r.cachedPercent === null ? "—" : `${r.cachedPercent.toFixed(0)}%`;
    const e2e = r.derived === null ? "—" : `${formatDuration(r.derived.end_to_end)} / ${r.e2eIqr === null || r.e2eIqr === undefined ? "—" : formatDuration(r.e2eIqr)}`;
    const raw = r.rawPath === undefined ? "—" : `[run.json](${markdownCell(r.rawPath)})`;
    const startup = r.derived === null ? "—" : formatDuration(r.derived.startup);
    const parallelism = r.derived === null ? "—" : r.derived.parallelism.toFixed(2);
    const firstByte = r.derived === null || r.derived.first_byte_ms === null ? "—" : formatDuration(r.derived.first_byte_ms);
    return `| ${markdownCell(r.harness)} | ${markdownCell(r.version)} | ${markdownCell(r.visibility)} | ${markdownCell(r.sourceRegime ?? "—")} | ${e2e} | ${shareCell} | ${nonModelCell} | ${startup} | ${parallelism} | ${firstByte} | ${r.turns} | ${tokens} | ${cached} | ${cost} | ${floor} | ${markdownCell(r.success)} | ${raw} |`;
  });
  return [header, ...body].join("\n");
}

export function renderTaskMarkdown(rows: TaskDetailRow[]): string {
  const header =
    "| Harness | Task | Vis. | E2E (med/IQR) | Model (med) | Parallelism | First byte (med) | Non-model (med) | Harness share (full only) | Cost/task | Success | Raw |\n" +
    "|---|---|---|---|---|---|---|---|---|---|---|---|";
  const body = rows.map((r) => {
    const d = r.derived;
    const share = d === null || r.visibility !== "full" ? "—" : `${((harnessShare(d) ?? 0) * 100).toFixed(0)}%`;
    const e2e = d === null ? "—" : `${formatDuration(d.end_to_end)} / ${r.e2eIqr === null || r.e2eIqr === undefined ? "—" : formatDuration(r.e2eIqr)}`;
    const model = d === null ? "—" : formatDuration(d.model_time);
    const parallelism = d === null ? "—" : d.parallelism.toFixed(2);
    const firstByte = d === null || d.first_byte_ms === null ? "—" : formatDuration(d.first_byte_ms);
    const nonModel = d === null ? "—" : formatDuration(d.non_model_time);
    const cost = r.costUsd === null ? "—" : formatUsd(r.costUsd);
    const raw = r.rawPath === undefined ? "—" : `[run.json](${markdownCell(r.rawPath)})`;
    return `| ${markdownCell(r.harness)} | ${markdownCell(r.taskId)} | ${markdownCell(r.visibility)} | ${e2e} | ${model} | ${parallelism} | ${firstByte} | ${nonModel} | ${share} | ${cost} | ${markdownCell(r.success)} | ${raw} |`;
  });
  return [header, ...body].join("\n");
}

export function assertNoHarnessShareForNone(markdown: string): void {
  const lines = markdown.split("\n").slice(2);
  for (const line of lines) {
    const cols = line.split("|").map((c) => c.trim());
    // 0 empty, 1 harness, 2 ver, 3 vis, 4 source/regime, 5 e2e, 6 share
    if (cols[3] === "none" && cols[6] !== "—" && cols[6] !== "") {
      throw new ConfigError(`visibility none row has harness share ${cols[6]}`);
    }
  }
}
