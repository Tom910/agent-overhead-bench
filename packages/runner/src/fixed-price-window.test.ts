import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it, vi } from "vitest";
import { ConfigError } from "@aob/contracts";
import { compilePriceSchedule, matchingWindowEnd, validateLivePriceEndpoint, createFixedPriceGuard, assertPriceDeadline } from "./fixed-price-window.js";
import { runMatrix } from "./matrix.js";
import { loadState } from "./state.js";
const book = JSON.parse(readFileSync(new URL("../../report/price-books/deepseek-v41-low-2026-09-10.json", import.meta.url), "utf8"));
const rates = book.models["deepseek/deepseek-v4.1-flash"];
const live = () => ({ data: { id: "deepseek/deepseek-v4.1-flash", endpoints: [{ tag: "deepseek", model_id: "deepseek/deepseek-v4.1-flash", name: "DeepSeek | deepseek/deepseek-v4.1-flash-20260910", status: 0, pricing: { prompt: "0.00000015", completion: "0.0000006", input_cache_read: "0.000000003", discount: 0, overrides: structuredClone(book.pricing_condition.provider_schedule) } }] } });
describe("fixed provider price window", () => {
  it("requires the whole timeout and margin before the next price boundary", () => {
    const schedule = compilePriceSchedule(book.pricing_condition.provider_schedule, rates);
    const now = Date.parse("2026-09-10T21:54:59Z");
    expect(matchingWindowEnd(schedule, now, 11100)).toBe(Date.parse("2026-09-11T01:00:00Z"));
    expect(matchingWindowEnd(schedule, now + 1000, 11100)).toBeNull();
    expect(matchingWindowEnd(schedule, Date.parse("2026-09-11T04:00:00Z"), 11100)).toBeNull();
    expect(matchingWindowEnd(schedule, Date.parse("2026-09-11T01:00:00Z"), 60)).toBeNull();
    expect(matchingWindowEnd(schedule, Date.parse("2026-09-12T23:00:00Z"), 11100)).toBe(Date.parse("2026-09-14T01:00:00Z"));
  });
  it("rejects an admission whose setup consumed the reserved execution time", () => {
    const deadline = Date.parse("2026-09-11T01:00:00Z");
    expect(() => assertPriceDeadline(deadline, 10800, Date.parse("2026-09-10T21:54:59Z"))).not.toThrow();
    expect(() => assertPriceDeadline(deadline, 10800, Date.parse("2026-09-10T21:55:00Z"))).toThrow(ConfigError);
  });
  it("rejects gaps, overlaps and malformed UTC clocks", () => {
    const schedule = book.pricing_condition.provider_schedule;
    expect(() => compilePriceSchedule(schedule.slice(1), rates)).toThrow(ConfigError);
    expect(() => compilePriceSchedule([...schedule, schedule[0]], rates)).toThrow(ConfigError);
    expect(() => compilePriceSchedule([{ ...schedule[0], utc_start: 1260, utc_end: 1500 }, ...schedule.slice(1)], rates)).toThrow(ConfigError);
  });
  it("rejects provider/model/schedule/rate drift before admitting paid execution", () => {
    expect(() => validateLivePriceEndpoint(live(), book, rates)).not.toThrow();
    for (const mutate of [
      (v: ReturnType<typeof live>) => { v.data.endpoints[0]!.tag = "elsewhere"; },
      (v: ReturnType<typeof live>) => { v.data.endpoints[0]!.status = -5; },
      (v: ReturnType<typeof live>) => { v.data.endpoints[0]!.name = "DeepSeek | another-model"; },
      (v: ReturnType<typeof live>) => { v.data.endpoints[0]!.pricing.completion = "0.0000012"; },
      (v: ReturnType<typeof live>) => { v.data.endpoints[0]!.pricing.overrides.pop(); },
    ]) {
      const data = live(); mutate(data);
      expect(() => validateLivePriceEndpoint(data, book, rates)).toThrow(ConfigError);
    }
    expect(() => createFixedPriceGuard(book, { model: "deepseek/deepseek-v4.1-flash", upstream: "https://openrouter.ai/api", routing: { only_provider: "other", allow_fallbacks: false, ignored_providers: ["relace"] }, evidencePath: "/unused" })).toThrow(ConfigError);
  });
  it("records live admission evidence and returns an expiring execution check", async () => {
    const root = mkdtempSync(join(tmpdir(), "aob-live-admission-"));
    const now = vi.spyOn(Date, "now").mockReturnValue(Date.parse("2026-09-10T20:00:00Z"));
    vi.stubGlobal("fetch", async () => new Response(JSON.stringify(live()), { status: 200 }));
    try {
      const evidencePath = join(root, "provenance/admissions.jsonl");
      const options = { model: "deepseek/deepseek-v4.1-flash", upstream: "https://openrouter.ai/api", routing: { only_provider: "deepseek", allow_fallbacks: false as const, ignored_providers: ["relace"] }, evidencePath };
      const admit = createFixedPriceGuard(book, options);
      const executionCheck = await admit({ id: "cell-one" }, { timeoutS: 10800 });
      const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));
      expect(evidence.cell_id).toBe("cell-one");
      expect(evidence.valid_until).toBe("2026-09-11T01:00:00.000Z");
      expect(evidence.endpoint.tag).toBe("deepseek");
      expect(() => executionCheck()).not.toThrow();
      now.mockReturnValue(Date.parse("2026-09-10T21:55:00Z"));
      expect(() => executionCheck()).toThrow(ConfigError);
      expect(() => createFixedPriceGuard({ ...book, pricing_condition: undefined }, options)).toThrow(ConfigError);
      expect(() => createFixedPriceGuard({ ...book, pricing_condition: { kind: "unsupported" } }, options)).toThrow(ConfigError);
    } finally { now.mockRestore(); vi.unstubAllGlobals(); rmSync(root, { recursive: true, force: true }); }
  });
  it("quarantines an exhausted retry without waiting for admission", async () => {
    const root = mkdtempSync(join(tmpdir(), "aob-price-quarantine-"));
    const options = { resultsDir: join(root, "results"), statePath: join(root, "state.json"), tasks: [{ id: "one", dir: root, source: "local", revision: "abc", regime: "short" as const, timeoutS: 60 }], tools: ["mock-agent"], conditions: ["pinned" as const], reps: 1, model: "mock", priceBook: "mock", executeCell: async () => { throw new ConfigError("initial infrastructure failure"); } };
    try {
      await expect(runMatrix(options)).rejects.toThrow("initial infrastructure failure");
      const state = loadState(options.statePath)!;
      state.cells[0]!.retries = 1;
      writeFileSync(options.statePath, JSON.stringify(state));
      const result = await runMatrix({ ...options, beforeCell: async () => { throw new ConfigError("must not admit quarantine"); } });
      expect(result.cells[0]?.status).toBe("quarantined");
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
  it("leaves an unstarted cell pending if the admission check fails", async () => {
    const root = mkdtempSync(join(tmpdir(), "aob-price-admission-"));
    let executed = false;
    try {
      await expect(runMatrix({ resultsDir: join(root, "results"), statePath: join(root, "state.json"), tasks: [{ id: "one", dir: root, source: "local", revision: "abc", regime: "short", timeoutS: 60 }], tools: ["mock-agent"], conditions: ["pinned"], reps: 1, model: "mock", priceBook: "mock", beforeCell: async () => { throw new ConfigError("price not admitted"); }, executeCell: async () => { executed = true; throw new Error("must not execute"); } })).rejects.toThrow("price not admitted");
      expect(executed).toBe(false);
      expect(loadState(join(root, "state.json"))?.cells[0]?.status).toBe("pending");
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});
