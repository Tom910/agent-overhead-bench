import type { C3AdapterResult, ToolConfiguration } from "@aob/contracts";

export type StructuredToolEventFormat = "codex-json" | "opencode-json";

export type ToolEventParser = {
  feed(chunk: Uint8Array, observedAt: number): void;
  finish(observedAt: number): C3AdapterResult["toolEvents"];
};

export type AdapterRunOpts = {
  toolConfiguration?: ToolConfiguration;
  workspaceDir: string;
  promptFile: string;
  model: string;
  proxyUrl: string;
  condition: "pinned" | "default";
  timeoutS: number;
  env: Record<string, string>;
};

export type ContainerInvocation = {
  image: string;
  /** Optional expected local image identity, supplied by a prepared task environment. */
  image_digest?: string;
  toolVersion?: string;
  versionArgv?: string[];
  argv: string[];
  env: Record<string, string>;
  workdir: string;
  /** Optional non-root uid:gid for CLIs that reject privileged execution. */
  user?: string;
  setupFiles?: Array<{ path: string; contents: string }>;
  /** Structured stdout format that the runner can timestamp and parse live. */
  toolEventFormat?: StructuredToolEventFormat;
};

export type Adapter = {
  name: string;
  /** Exact version string captured during the S2 feasibility spike, when pinned. */
  pinnedVersion?: string;
  capabilities: {
    headless: boolean;
    ori: boolean;
    baseUrlOverride: boolean;
    toolVisibility: "none" | "partial" | "full";
    containerOnly?: boolean;
  };
  version(): Promise<string>;
  containerInvocation?(opts: AdapterRunOpts): ContainerInvocation;
  run(opts: AdapterRunOpts): Promise<C3AdapterResult>;
};
