import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ConfigError, validateC1Event } from "@aob/contracts";
import { describe, expect, it } from "vitest";
import { captureRequestConditions } from "./request-conditions.js";
import { startProxy } from "./proxy.js";

describe("request condition evidence", () => {
  it("captures only supported settings and distinguishes omitted, malformed and invalid values", () => {
    const result = captureRequestConditions(Buffer.from(JSON.stringify({ messages: [{ content: "private prompt" }], temperature: 0, max_tokens: 4096,
      reasoning: { effort: "high", max_tokens: 1024 }, thinking: { type: "enabled", budget_tokens: 512 }, top_p: "secret", output_config: { effort: "secret", format: { schema: "private schema" } }, provider: { only: ["deepseek"], allow_fallbacks: false } })));
    expect(result.status).toBe("captured");
    expect(result.parameters).toMatchObject({ temperature: 0, max_tokens: 4096, "reasoning.effort": "high", "reasoning.max_tokens": 1024, "thinking.budget_tokens": 512, "provider.only": ["deepseek"], "provider.allow_fallbacks": false });
    expect(result.invalid).toEqual(["top_p", "output_config.effort"]);
    expect(result.omitted).toContain("max_output_tokens");
    expect(JSON.stringify(result)).not.toMatch(/private|secret/);
    expect(captureRequestConditions(Buffer.from("{" )).status).toBe("unavailable");
    expect(captureRequestConditions(Buffer.from("{}"), false).status).toBe("unavailable");
    expect(captureRequestConditions(Buffer.alloc(16 * 1024 * 1024 + 1)).status).toBe("unavailable");
  });

  it.each([200, 400])("records post-routing wire settings, bound to C1, for HTTP %s", async status => {
    const root = await mkdtemp(join(tmpdir(), "aob-request-conditions-"));
    let forwarded = "";
    const upstream = createServer((req, res) => { req.on("data", chunk => { forwarded += String(chunk); }); req.on("end", () => {
      res.writeHead(status, { "content-type": "application/json" });
      res.end(JSON.stringify({ model: "fixture", usage: { prompt_tokens: 1, completion_tokens: 1 } }));
    }); });
    await new Promise<void>(resolve => upstream.listen(0, "127.0.0.1", resolve));
    const address = upstream.address();
    if (!address || typeof address === "string") throw new ConfigError("fixture did not bind");
    const outPath = join(root, "events.jsonl");
    const proxy = await startProxy({ run_id: "condition-fixture", upstream: `http://127.0.0.1:${address.port}`, outPath, onlyProvider: "deepseek", ignoredProviders: ["relace"] });
    try {
      const response = await fetch(`${proxy.baseUrl}/v1/chat/completions`, { method: "POST", body: JSON.stringify({ model: "fixture", temperature: 0.4, max_tokens: 2048, messages: [{ role: "user", content: "PRIVATE" }] }) });
      await response.text(); await proxy.flush();
      const raw = await readFile(outPath, "utf8");
      validateC1Event(JSON.parse(raw));
      const evidence = JSON.parse(await readFile(`${outPath}.upstream.jsonl`, "utf8"));
      expect(evidence.request_conditions.parameters).toMatchObject({ temperature: 0.4, max_tokens: 2048, "provider.only": ["deepseek"], "provider.allow_fallbacks": false, "provider.ignore": ["relace"] });
      expect(JSON.parse(forwarded).messages[0].content).toBe("PRIVATE");
      expect(JSON.stringify(evidence)).not.toContain("PRIVATE");
      expect(evidence.c1_sha256).toBe(createHash("sha256").update(raw).digest("hex"));
      expect(JSON.parse(raw)).not.toHaveProperty("request_conditions");
    } finally { await proxy.close(); await new Promise<void>(resolve => upstream.close(() => resolve())); await rm(root, { recursive: true, force: true }); }
  });
});
