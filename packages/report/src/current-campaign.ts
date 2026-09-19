import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ConfigError } from "@aob/contracts";
import { replayAnalysis } from "./analysis-replay.js";
import { overviewMarkdown, renderAnalysisHtml, renderAnalysisMarkdown } from "./analysis-render.js";
import { comparisonGroups, REFERENCE_BOOK } from "./comparison-overview.js";

const START = "<!-- CURRENT-CAMPAIGN:START -->";
const END = "<!-- CURRENT-CAMPAIGN:END -->";
const harnesses = ["cline", "codex", "hermes", "pi", "qwen"];
const digest = (bytes: string | Buffer): string => `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
function requireValid(valid: boolean, message: string): asserts valid {
  if (!valid) throw new ConfigError(`current campaign: ${message}`);
}
function json(path: string): Record<string, unknown> {
  try {
    const value: unknown = JSON.parse(readFileSync(path, "utf8"));
    requireValid(typeof value === "object" && value !== null && !Array.isArray(value), "JSON object required");
    return value as Record<string, unknown>;
  } catch (error) { throw new ConfigError(`current campaign: cannot read ${path}: ${error instanceof Error ? error.message : String(error)}`); }
}

/** One canonical attempt export drives all current presentation; check never writes. */
export function publishCurrentCampaign(root: string, check = false): void {
  const pointer = json(join(root, "evidence/current-campaign.json"));
  requireValid(typeof pointer.dataset === "string" && /^linux-results-\d{4}-\d{2}-\d{2}$/.test(pointer.dataset), "invalid dataset pointer");
  const dir = join(root, "evidence", pointer.dataset);
  const source = readFileSync(join(dir, "analysis.json"));
  const summaryBytes = readFileSync(join(dir, "summary.json"));
  const provenance = json(join(dir, "provenance.json"));
  const artifacts = provenance.artifacts as Record<string, unknown> | undefined;
  requireValid(artifacts !== undefined && artifacts !== null && artifacts["analysis.json"] === digest(source), "source hash mismatch");
  requireValid(provenance.summary_sha256 === digest(summaryBytes), "selection hash mismatch");
  const data = replayAnalysis(JSON.parse(source.toString()) as unknown);
  const summary = json(join(dir, "summary.json"));
  requireValid(summary.status === "completed" && summary.official_release === false && summary.expected_slots === 200 && summary.selected_slots === 200 && data.attempts.length === 200, "completed 200-attempt matrix required");
  requireValid(typeof summary.as_of === "string" && Number.isFinite(Date.parse(summary.as_of)), "invalid snapshot time");
  requireValid(provenance.as_of === summary.as_of && provenance.selected_attempt_count === 200 && provenance.official_release === false, "provenance metadata mismatch");
  requireValid(Array.isArray(summary.slots) && summary.slots.length === 200, "200 bound slots required");
  const slots = new Map<string, Record<string, unknown>>();
  for (const value of summary.slots) {
    requireValid(typeof value === "object" && value !== null && !Array.isArray(value), "invalid slot");
    const slot = value as Record<string, unknown>;
    requireValid(typeof slot.run_id === "string" && !slots.has(slot.run_id), "duplicate or invalid slot");
    slots.set(slot.run_id, slot);
  }
  const keys = new Set<string>(); const tasks = new Set<string>();
  const versions = new Map<string, Set<string>>();
  for (const attempt of data.attempts) {
    const slot = slots.get(attempt.run_id);
    requireValid(slot !== undefined && slot.harness === attempt.harness && slot.task === attempt.task && slot.rep === attempt.rep && slot.outcome === attempt.outcome && slot.host === attempt.host.os && slot.price_book === attempt.price_book && slot.run_sha256 === attempt.hashes.run && slot.events_sha256 === attempt.hashes.events, "selection binding mismatch");
    requireValid(attempt.host.os === "linux" && attempt.model === "deepseek/deepseek-v4.1-flash" && attempt.model === summary.model && attempt.regime === "extended" && attempt.regime === summary.regime && harnesses.includes(attempt.harness), "Linux/model/harness boundary mismatch");
    requireValid(attempt.condition === "pinned" && attempt.routing?.only_provider === "deepseek" && attempt.routing.allow_fallbacks === false && attempt.routing.ignored_providers.includes("relace"), "pinned provider routing required");
    requireValid(attempt.rep >= 0 && attempt.rep < 5 && ["completed", "verify_error"].includes(attempt.outcome), "invalid repetition or unfinished outcome");
    const key = JSON.stringify([attempt.harness, attempt.task, attempt.rep]);
    requireValid(!keys.has(key), "duplicate matrix slot"); keys.add(key); tasks.add(attempt.task);
    const found = versions.get(attempt.harness) ?? new Set<string>(); found.add(attempt.version); versions.set(attempt.harness, found);
  }
  requireValid(tasks.size === 8 && versions.size === 5 && [...versions.values()].every(v => v.size === 1), "5 harnesses × 8 tasks × 5 repetitions required");
  const groups = comparisonGroups(data);
  requireValid(groups.length === 1 && groups[0]!.rates !== null, "one reference-price comparison group required");
  const group = groups[0]!;
  const passes = data.attempts.filter(a => a.outcome === "completed").length;
  const path = `evidence/${pointer.dataset}`;
  const rates = group.rates!;
  const block = `${START}
## Linux results — completed campaign

**Model: \`deepseek/deepseek-v4.1-flash\` · one Linux host · ${data.attempts.length}/200 attempts.**
Eight tasks × five repetitions per harness. ${passes} passes and ${data.attempts.length - passes} verification failures.
Collection is complete; Claude CLI is excluded. Rows are alphabetical.

Actual measurements come first; **bold percentages compare each metric with its
observed best (100%)**. Each column has its own baseline. Higher pass/cache rates
score higher; lower cost/token usage scores higher.

${overviewMarkdown(group.attempts, rates, true)}

Cost, cache and tokens are medians per measured attempt, including failed outcomes.
Pass rate is native verifier passes / all 40 attempts. Incomplete measurements are
**unscored** and excluded from best-baseline selection, even when their known median
looks better. Lower token usage alone does not establish better task performance.

**Reference cost:** $${rates.input * 1e6}/M uncached input + $${rates.cached_input * 1e6}/M cached input +
$${rates.output * 1e6}/M output, from \`${REFERENCE_BOOK}\`. Exact request tokens are priced
per attempt, then summarized by median. These are reference estimates, not
actual billing. Input includes cached tokens. Cache rate is the median per-attempt
cached input percentage. K = 1,000; M = 1,000,000.

[Interactive report](${path}/analysis.html) · [Detailed tables](${path}/analysis.md) ·
[Canonical data](${path}/analysis.json) · [Provenance and reproduction](${path}/README.md)

<details>
<summary>Conditions, provenance and how to refresh</summary>

All 200 unique slots are from the same Linux host: 104 retained attempts and 96
previously missing slots. Completed attempts were not rerun. Model routing is
pinned to DeepSeek through OpenRouter, with fallbacks disabled and Relace excluded.
Original accounting books remain provenance; they do not split this model overview.

Retained and rebuilt verifier images occur in this dataset. Detailed comparisons
preserve their identities; the overview is not an image-matched controlled
experiment. Tool visibility is partial, so non-model time is not pure harness
overhead. This is not the frozen v1 dataset or a capabilities leaderboard.

One pointer, [current-campaign.json](evidence/current-campaign.json), selects the
canonical export. This table and both detailed views are generated from its
validated attempt facts. The selection summary binds raw evidence hashes.
Snapshot exported at ${new Date(summary.as_of).toISOString()}.

Refresh every current view offline, without API keys or model calls:

\`\`\`bash
npm run report:refresh
npm run report:check
\`\`\`

The check fails when any generated view is stale. Earlier
[partial Linux](evidence/linux-results-2026-09-18/README.md) and
[mixed-host](evidence/nonclaude-results-2026-09-14/README.md) snapshots remain historical.

</details>
${END}`;
  const readmePath = join(root, "README.md"); const readme = readFileSync(readmePath, "utf8");
  requireValid(readme.split(START).length === 2 && readme.split(END).length === 2 && readme.indexOf(START) < readme.indexOf(END), "exactly one ordered pair of README markers required");
  const updatedReadme = readme.slice(0, readme.indexOf(START)) + block + readme.slice(readme.indexOf(END) + END.length);
  const markdown = renderAnalysisMarkdown(data); const html = renderAnalysisHtml(data);
  const updatedProvenance = { ...provenance, artifacts: { ...artifacts, "analysis.md": digest(markdown), "analysis.html": digest(html) } };
  const outputs = new Map([
    [readmePath, updatedReadme], [join(dir, "analysis.md"), markdown], [join(dir, "analysis.html"), html],
    [join(dir, "provenance.json"), `${JSON.stringify(updatedProvenance, null, 2)}\n`],
  ]);
  if (check) {
    for (const [path, bytes] of outputs) requireValid(readFileSync(path, "utf8") === bytes, `stale generated view: ${path}; run npm run report:refresh`);
  } else {
    for (const [path, bytes] of outputs) writeFileSync(path, bytes);
  }
}

if (process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    requireValid(args.length === 0 || args.length === 1 && args[0] === "--check", "usage: npm run report:refresh | npm run report:check");
    publishCurrentCampaign(fileURLToPath(new URL("../../../", import.meta.url)), args[0] === "--check");
    process.stdout.write(args[0] === "--check" ? "Current campaign views match the canonical data.\n" : "Updated current campaign views from canonical data.\n");
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`); process.exitCode = 1;
  }
}
