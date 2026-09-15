import { closeSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { ConfigError } from "@aob/contracts";

export type CellStatus = "done" | "task_failed" | "failed" | "pending" | "staged" | "running" | "verifying" | "quarantined";

export type Cell = {
  id: string;
  tool: string;
  task_id: string;
  condition: "pinned" | "default";
  rep: number;
  status: CellStatus;
  retries: number;
  /** Docker container to remove if the runner was killed while this cell ran. */
  containerName?: string;
  /** Docker relay and network to remove if the runner was killed during setup or execution. */
  relayName?: string;
  networkName?: string;
  /** Spend from a partial events file already charged during crash recovery. */
  interruptedSpendUsd?: number | null;
};

export type MatrixState = {
  version: 1;
  seed: number;
  spentUsd: number;
  cells: Cell[];
  definition_key?: string;
  /** Provenance-only identity for the optional official run-window ledger. */
  run_window_session_id?: string;
  run_window_ledger?: string;
};

const TERMINAL: ReadonlySet<CellStatus> = new Set(["done", "task_failed", "quarantined"]);
const CELL_KEYS = new Set(["id", "tool", "task_id", "condition", "rep", "status", "retries", "containerName", "relayName", "networkName", "interruptedSpendUsd"]);
const STATE_KEYS = new Set(["version", "seed", "spentUsd", "cells", "definition_key", "run_window_session_id", "run_window_ledger"]);
const ALLOWED: Record<CellStatus, ReadonlySet<CellStatus>> = {
  pending: new Set(["staged"]),
  staged: new Set(["running"]),
  running: new Set(["verifying", "failed", "task_failed"]),
  verifying: new Set(["done", "failed", "task_failed"]),
  failed: new Set(["staged", "quarantined", "task_failed"]),
  done: new Set(),
  task_failed: new Set(),
  quarantined: new Set(),
};

function validCell(value: unknown): value is Cell {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const cell = value as Record<string, unknown>;
  if (Object.keys(cell).some((key) => !CELL_KEYS.has(key))) return false;
  return typeof cell.id === "string" && cell.id.length > 0 && typeof cell.tool === "string" && cell.tool.length > 0 &&
    typeof cell.task_id === "string" && cell.task_id.length > 0 &&
    (cell.condition === "pinned" || cell.condition === "default") && typeof cell.rep === "number" &&
    Number.isInteger(cell.rep) && cell.rep >= 0 && typeof cell.status === "string" && ALLOWED[cell.status as CellStatus] !== undefined &&
    typeof cell.retries === "number" && Number.isInteger(cell.retries) && cell.retries >= 0 &&
    (cell.containerName === undefined || (typeof cell.containerName === "string" && /^aob-(?:verify-)?[0-9]+-[0-9]+$/.test(cell.containerName))) &&
    (cell.relayName === undefined || (typeof cell.relayName === "string" && /^aob-relay-[0-9]+-[0-9]+$/.test(cell.relayName))) &&
    (cell.networkName === undefined || (typeof cell.networkName === "string" && /^aob-net-[0-9]+-[0-9]+$/.test(cell.networkName))) &&
    (cell.interruptedSpendUsd === undefined || cell.interruptedSpendUsd === null ||
      (typeof cell.interruptedSpendUsd === "number" && Number.isFinite(cell.interruptedSpendUsd) && cell.interruptedSpendUsd >= 0));
}

function validState(value: unknown): value is MatrixState {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const state = value as Record<string, unknown>;
  if (Object.keys(state).some((key) => !STATE_KEYS.has(key))) return false;
  if (!Array.isArray(state.cells) || new Set(state.cells.map((cell) => cell && typeof cell === "object" && "id" in cell ? cell.id : undefined)).size !== state.cells.length) return false;
  return state.version === 1 && typeof state.seed === "number" && Number.isFinite(state.seed) &&
    typeof state.spentUsd === "number" && Number.isFinite(state.spentUsd) && state.spentUsd >= 0 &&
    state.cells.every(validCell) &&
    (state.definition_key === undefined || (typeof state.definition_key === "string" && state.definition_key.length > 0)) &&
    (state.run_window_session_id === undefined || (typeof state.run_window_session_id === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]{2,127}$/.test(state.run_window_session_id))) &&
    (state.run_window_ledger === undefined || (typeof state.run_window_ledger === "string" && /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[^\0]+$/.test(state.run_window_ledger)));
}

export function createMatrixState(cells: Cell[], seed = 0): MatrixState {
  return { version: 1, seed, spentUsd: 0, cells: cells.map((cell) => ({ ...cell })) };
}

export function loadState(path: string): MatrixState {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return createMatrixState([]);
    throw new ConfigError(`cannot read matrix state: ${error instanceof Error ? error.message : String(error)}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new ConfigError(`matrix state is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!validState(parsed)) throw new ConfigError("matrix state has an invalid shape");
  return parsed;
}

export function saveState(path: string, state: MatrixState): void {
  if (!validState(state)) throw new ConfigError("refusing to save invalid matrix state");
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.tmp`;
  const fd = openSync(tmp, "w", 0o600);
  try {
    writeFileSync(fd, `${JSON.stringify(state, null, 2)}\n`, "utf8");
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  renameSync(tmp, path);
}

export function transitionCell(state: MatrixState, id: string, next: CellStatus): MatrixState {
  const index = state.cells.findIndex((cell) => cell.id === id);
  if (index < 0) throw new ConfigError(`unknown matrix cell ${id}`);
  const current = state.cells[index]!;
  if (!ALLOWED[current.status].has(next)) throw new ConfigError(`invalid cell transition ${current.status} -> ${next}`);
  if (current.status === "failed" && next === "staged" && current.retries >= 1) {
    throw new ConfigError(`cell ${id} has exhausted its retry`);
  }
  const cells = state.cells.map((cell, i) => i === index
    ? { ...cell, status: next, retries: current.status === "failed" && next === "staged" ? cell.retries + 1 : cell.retries }
    : { ...cell });
  return { ...state, cells };
}

export function pending(state: MatrixState): Cell[] {
  return state.cells.filter((cell) => cell.status === "pending" || (cell.status === "failed" && cell.retries < 1));
}

export function blockRandomize<T>(tools: T[], blocks: number, rng: () => number): T[][] {
  const out: T[][] = [];
  for (let b = 0; b < blocks; b++) {
    const block = [...tools];
    for (let i = block.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const t = block[i]!;
      block[i] = block[j]!;
      block[j] = t;
    }
    out.push(block);
  }
  return out;
}

export function isTerminal(status: CellStatus): boolean {
  return TERMINAL.has(status);
}

/** Execution completion for a selected CLI batch, including measured task failures. */
export function hasIncompleteCells(state: MatrixState, batchTool?: string): boolean {
  return state.cells.some((cell) => (batchTool === undefined || cell.tool === batchTool) &&
    cell.status !== "done" && cell.status !== "task_failed");
}
