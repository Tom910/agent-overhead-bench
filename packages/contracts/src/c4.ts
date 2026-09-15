import type { ClockAnchor } from "./clock.js";
import type { C3AdapterResult } from "./c3.js";

export type C4Outcome =
  | "completed"
  | "timeout"
  | "adapter_error"
  | "verify_error";

export type ToolConfiguration = "claude-code-no-web-search";

export type ToolVisibility = "none" | "partial" | "full";
export type ProviderRouting = { ignored_providers: string[]; only_provider?: string; allow_fallbacks?: false };

export type C4Run = {
  v: 1;
  run_id: string;
  tool: string;
  tool_version: string;
  task_id: string;
  task_source: string;
  task_revision: string;
  /** Optional source repository locator; required for source-specific prepared runs. */
  task_repository?: string;
  /** Optional for legacy/local tasks; emitted as null when no upstream base exists. */
  task_base_revision?: string | null;
  task_regime: "short" | "long" | "extended";
  condition: "pinned" | "default";
  rep: number;
  model: string;
  /** Raw, runner-enforced provider routing configuration; absent in legacy runs. */
  provider_routing?: ProviderRouting;
  /** Raw, explicitly selected CLI compatibility configuration. */
  tool_configuration?: ToolConfiguration;
  ori_version: string | null;
  /** Raw adapter capability metadata needed to keep partial visibility honest in S6. */
  tool_visibility: ToolVisibility;
  anchors: { adapter: ClockAnchor; proxy: ClockAnchor };
  adapter_result: C3AdapterResult;
  events_file: string;
  verification: { exit: number; duration_ms: number; logPath: string };
  container: { image_digest: string; verifier_image_digest: string; started_iso: string };
  task_environment: {
    kind: string;
    network: "disabled";
    /** The actual prepared agent image used for this cell, when declared. */
    agent_image?: string;
    agent_image_digest?: string;
  };
  host: { os: string; cpu: string; ram_gb: number };
  spend_usd_estimate: number | null;
  price_book: string;
  outcome: C4Outcome;
};

/** Stable identity for comparing a rerun/retry with its measured cell. */
export function c4MeasurementIdentity(run: C4Run): string {
  return JSON.stringify({
    tool: run.tool,
    tool_version: run.tool_version,
    task_id: run.task_id,
    task_source: run.task_source,
    task_repository: run.task_repository ?? "",
    task_revision: run.task_revision,
    task_base_revision: run.task_base_revision ?? "",
    task_regime: run.task_regime,
    condition: run.condition,
    rep: run.rep,
    model: run.model,
    ...(run.provider_routing === undefined ? {} : { provider_routing: run.provider_routing }),
    ...(run.tool_configuration === undefined ? {} : { tool_configuration: run.tool_configuration }),
    ori_version: run.ori_version ?? "",
    price_book: run.price_book,
    tool_visibility: run.tool_visibility,
    container: {
      image_digest: run.container.image_digest,
      verifier_image_digest: run.container.verifier_image_digest,
    },
    task_environment: {
      kind: run.task_environment.kind,
      network: run.task_environment.network,
      agent_image: run.task_environment.agent_image ?? "",
      agent_image_digest: run.task_environment.agent_image_digest ?? "",
    },
    host: run.host,
  });
}
