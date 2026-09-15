import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test from "node:test";

const execFileAsync = promisify(execFile);
const root = fileURLToPath(new URL("..", import.meta.url));
const validator = join(root, "scripts", "s7-model-eligibility.mjs");
const model = "z-ai/glm-5.3-flash";
const upstream = "https://openrouter.ai/api";
const tools = ["claude-code", "codex", "hermes", "aider", "opencode", "qwen"];

function manifest(overrides = {}) {
  return {
    version: 1,
    upstream,
    model,
    reviewed_at: "2026-08-31T00:00:00.000Z",
    evidence: "plans/s2-evidence/",
    tools: tools.map((tool) => ({ tool, protocol: "openai_chat", reviewed: true, eligible: true, reason: "fixture evidence" })),
    ...overrides,
  };
}

async function run(manifestPath, selectedModel = model, selectedUpstream = upstream, selectedTools = tools.join(",")) {
  return execFileAsync(process.execPath, [validator, manifestPath, selectedModel, selectedUpstream, selectedTools], { cwd: root }).then(
    (result) => ({ status: 0, output: `${result.stdout}\n${result.stderr}` }),
    (error) => ({ status: error.code ?? 1, output: `${error.stdout ?? ""}\n${error.stderr ?? ""}` }),
  );
}

test("eligibility validator accepts an exact reviewed eligible manifest", async () => {
  const temp = await mkdtemp(join(tmpdir(), "aob-eligibility-"));
  try {
    const path = join(temp, "manifest.json");
    await writeFile(path, `${JSON.stringify(manifest())}\n`);
    const result = await run(path);
    assert.equal(result.status, 0, result.output);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test("eligibility validator rejects missing, duplicate, mismatched, unreviewed, and ineligible evidence", async () => {
  const temp = await mkdtemp(join(tmpdir(), "aob-eligibility-invalid-"));
  try {
    const cases = [
      ["missing tool", { tools: tools.slice(0, -1).map((tool) => ({ tool, protocol: "openai_chat", reviewed: true, eligible: true, reason: "fixture" })) }, /exactly one record/],
      ["duplicate tool", { tools: [...manifest().tools.slice(0, 5), manifest().tools[0]] }, /duplicate tool/],
      ["model mismatch", {}, /model mismatch/],
      ["upstream mismatch", {}, /upstream mismatch/],
      ["protocol mismatch", { tools: manifest().tools.map((entry) => ({ ...entry, protocol: "other" })) }, /protocol/],
      ["unreviewed", { tools: manifest().tools.map((entry) => ({ ...entry, reviewed: false })) }, /not reviewed/],
      ["explicitly ineligible", { tools: manifest().tools.map((entry) => entry.tool === "codex" ? { ...entry, eligible: false, reason: "unsupported" } : entry) }, /ineligible/],
    ];
    for (const [name, overrides, expected] of cases) {
      const path = join(temp, `${name.replaceAll(" ", "-")}.json`);
      const value = name === "model mismatch" ? manifest() : name === "upstream mismatch" ? manifest() : manifest(overrides);
      await writeFile(path, `${JSON.stringify(value)}\n`);
      const result = await run(path, name === "model mismatch" ? "different-model" : model, name === "upstream mismatch" ? "https://other.invalid/api" : upstream);
      assert.notEqual(result.status, 0, name);
      assert.match(result.output, expected, name);
    }
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test("retained S2 evidence still fails closed on the incompatibility it recorded", async () => {
  // plans/s2-eligibility.json is the retained August record, when OpenRouter
  // returned 404 unrecognized_model for the pinned model on Anthropic
  // Messages. That route now answers 200 and claude-code is in the official
  // profile, but the historic manifest must keep failing closed on its own
  // terms - it is evidence of what was observed, not a current claim.
  const result = await run(join(root, "plans", "s2-eligibility.json"));
  assert.notEqual(result.status, 0);
  assert.match(result.output, /claude-code.*ineligible|Anthropic.*ineligible/i);
});

test("checked-in official Flash scope contains only eligible tools", async () => {
  const scope = JSON.parse(await readFile(join(root, "plans", "s7-official-tool-scope.json"), "utf8"));
  const official = JSON.parse(await readFile(join(root, "plans", "s7-official-eligibility.json"), "utf8"));
  // Pinned deliberately: scope changes should be an explicit edit here, not a
  // silent drift. aider is excluded because the adapter hands it the workspace
  // file list, so it never performs the discovery the others are measured doing.
  assert.deepEqual(scope.tools, ["claude-code", "cline", "codex", "hermes", "pi", "qwen"]);
  assert.ok(!scope.tools.includes("aider"), "aider is not comparable in this matrix");
  const excluded = scope.excluded.map((entry) => entry.tool);
  assert.ok(excluded.includes("aider"), "aider's exclusion must be recorded with a reason");
  for (const entry of scope.excluded) assert.ok((entry.reason ?? "").length > 20, `${entry.tool} needs a real reason`);
  for (const entry of official.tools) assert.equal(entry.eligible, true, `${entry.tool} must be eligible`);
  assert.deepEqual(official.tools.map((entry) => entry.tool), scope.tools);
  const result = await run(join(root, "plans", "s7-official-eligibility.json"), model, upstream, scope.tools.join(","));
  assert.equal(result.status, 0, result.output);
});

test("official scope rejects ambiguous tool identifiers", async () => {
  const temp = await mkdtemp(join(tmpdir(), "aob-scope-"));
  try {
    const path = join(temp, "scope.json");
    const scope = JSON.parse(await readFile(join(root, "plans", "s7-official-tool-scope.json"), "utf8"));
    scope.tools[0] = "codex,hermes";
    await writeFile(path, `${JSON.stringify(scope)}\n`);
    const result = await execFileAsync(process.execPath, [join(root, "scripts", "s7-official-scope.mjs"), path], { cwd: root }).then(
      (value) => ({ status: 0, output: `${value.stdout}\n${value.stderr}` }),
      (error) => ({ status: error.code ?? 1, output: `${error.stdout ?? ""}\n${error.stderr ?? ""}` }),
    );
    assert.notEqual(result.status, 0);
    assert.match(result.output, /scope is malformed/i);
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});

test("S7 preflight rejects the superseded six-tool profile before credential or Docker checks", async () => {
  const result = await execFileAsync("sh", [join(root, "scripts", "s7-preflight.sh"), "/tmp/aob-eligibility-preflight", model, "openrouter-2026-08-27", tools.join(","), "pinned", "placeholder-task", "placeholder-task-manifest", join(root, "plans", "s2-eligibility.json")], { cwd: root }).then(
    (value) => ({ status: 0, output: `${value.stdout}\n${value.stderr}` }),
    (error) => ({ status: error.code ?? 1, output: `${error.stdout ?? ""}\n${error.stderr ?? ""}` }),
  );
  assert.notEqual(result.status, 0);
  assert.match(result.output, /configured pinned tool scope/i);
  assert.doesNotMatch(result.output, /OPENROUTER_API_KEY|Docker daemon|Docker-to-host/i);
});
