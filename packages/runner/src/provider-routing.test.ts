import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { startMockUpstream } from "@aob/mock-upstream";
import { validateC4Run } from "@aob/contracts";
import { runMatrix, type MatrixOptions } from "./matrix.js";

it("records one routing policy through a real mock cell and refuses changed-policy resumption", async () => {
  const dir = await mkdtemp(join(tmpdir(), "aob-routing-matrix-"));
  await mkdir(join(dir,"workspace"));
  await writeFile(join(dir,"prompt.md"),"solve\n");
  await writeFile(join(dir,"verify.sh"),"#!/bin/sh\nexit 0\n",{mode:0o755});
  const mock = await startMockUpstream();
  try {
    const out = join(dir,"out");
    const providerRouting = { ignored_providers: ["relace"], only_provider: "z-ai/fp8", allow_fallbacks: false as const };
    const opts: MatrixOptions = {resultsDir:join(out,"results"),statePath:join(out,"state.json"),
      tasks:[{id:"t",dir,source:"local-development",revision:"working-tree",regime:"short",timeoutS:5}],
      tools:["mock-agent"],conditions:["pinned"],reps:1,model:"mock",priceBook:"mock",upstream:mock.baseUrl,mode:"host",providerRouting};
    const state = await runMatrix(opts);
    expect(state.cells[0]?.status).toBe("done");
    expect(JSON.parse(state.definition_key!).providerRouting).toEqual(providerRouting);
    const run = validateC4Run(JSON.parse(await readFile(join(out,"results/pinned/mock-agent/t/rep-0/run.json"),"utf8")));
    expect(run.provider_routing).toEqual(providerRouting);
    await expect(runMatrix({...opts,providerRouting:{...providerRouting,only_provider:"gmicloud/fp8"}})).rejects.toThrow(/definition/);
  } finally { await mock.close(); }
});

it("binds Claude compatibility to resume identity and rejects other tools before execution", async () => {
  const dir = await mkdtemp(join(tmpdir(), "aob-tool-config-"));
  const opts: MatrixOptions = { resultsDir: join(dir,"results"), statePath: join(dir,"state.json"),
    tasks: [], tools: ["claude-code"], conditions: ["pinned"], reps: 1,
    model: "mock", priceBook: "mock", toolConfiguration: "claude-code-no-web-search" };
  const state = await runMatrix(opts);
  expect(JSON.parse(state.definition_key!).toolConfiguration).toBe("claude-code-no-web-search");
  const { toolConfiguration, ...normal } = opts;
  await expect(runMatrix(normal)).rejects.toThrow(/definition/);
  await expect(runMatrix({ ...opts, tools: ["codex"] })).rejects.toThrow(/Claude-only/);
});
