import { renderResultsSite } from "./results-site.js";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { summarizeBenchmarkCosts } from "./benchmark-cost.js";
import { ConfigError } from "@aob/contracts";
import { replayAnalysis } from "./analysis-replay.js";
import { benchmarkTotalNote, overviewMarkdown, renderAnalysisHtml, renderAnalysisMarkdown } from "./analysis-render.js";
import { comparisonGroups, referenceCost, REFERENCE_BOOK } from "./comparison-overview.js";
import { assessComparisonConditions } from "./comparison-conditions.js";
import { validateTaskAudit } from "./task-audit.js";
import { CONFIDENCE_METHOD, pairwiseConfidence } from "./comparison-confidence.js";
import { comparisonMarkdown, confidenceTable, evidenceHtml, type ComparisonEvidence } from "./comparison-report.js";

const DATASET = /^linux-results-\d{4}-\d{2}-\d{2}(?:-r[1-9]\d*)?$/;
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
  requireValid(typeof pointer.dataset === "string" && DATASET.test(pointer.dataset), "invalid dataset pointer");
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
  const evidence: ComparisonEvidence = { conditions: null, audit: null, conditions_dataset: null, audit_dataset: null };
  const evidenceHashes: Record<string, string> = {};
  for (const [key, filename, pattern] of [
    ["conditions_dataset", "conditions.json", /^linux-conditions-\d{4}-\d{2}-\d{2}$/],
    ["audit_dataset", "audit.json", /^task-verification-\d{4}-\d{2}-\d{2}$/],
  ] as const) {
    const dataset = pointer[key];
    if (dataset === undefined) continue;
    requireValid(typeof dataset === "string" && pattern.test(dataset), `invalid ${key}`);
    const bytes = readFileSync(join(root, "evidence", dataset, filename));
    const binding = json(join(root, "evidence", dataset, "provenance.json"));
    requireValid((binding.artifacts as Record<string, unknown>)?.[filename] === digest(bytes), `${filename} hash mismatch`);
    const document = json(join(root, "evidence", dataset, filename));
    requireValid(document.dataset === pointer.dataset && document.analysis_sha256 === digest(source), `${filename} source binding mismatch`);
    evidence[key] = dataset; evidenceHashes[filename] = digest(bytes);
    if (key === "conditions_dataset") evidence.conditions = assessComparisonConditions(data.attempts, document);
    else {
      requireValid(typeof document.amendment_files === "object" && document.amendment_files !== null, "audit amendment bindings missing");
      for (const [name, hash] of Object.entries(document.amendment_files)) {
        requireValid(/^[A-Za-z0-9._-]+$/.test(name) && !name.startsWith("."), "unsafe amendment filename");
        requireValid(digest(readFileSync(join(root, "task-revisions", dataset.slice("task-verification-".length), name))) === hash, "audit amendment hash mismatch");
      }
      const amendment = json(join(root, "task-revisions", dataset.slice("task-verification-".length), "manifest.json"));
      requireValid(Array.isArray(amendment.tasks), "amendment task bindings missing");
      const hashes: Record<string, string> = {};
      for (const task of amendment.tasks) {
        requireValid(typeof task === "object" && task !== null && typeof task.task === "string" && typeof task.amended_test_patch_sha256 === "string", "invalid amended verifier hash");
        hashes[task.task] = task.amended_test_patch_sha256;
      }
      evidence.audit = validateTaskAudit(data.attempts, document, hashes);
    }
  }
  const pairwise = pairwiseConfidence(data.attempts);
  let replacementNote = "";
  let collectionNote = "All 200 unique slots are from the same Linux host: 104 retained attempts and 96 previously missing slots. Completed attempts were not rerun.";
  if (summary.replacements !== undefined) {
    requireValid(typeof summary.prior_dataset === "string" && DATASET.test(summary.prior_dataset) && summary.prior_dataset !== pointer.dataset, "invalid prior dataset");
    requireValid(Array.isArray(summary.replacements) && summary.replacements.length === 4, "exactly four authorized replacements required");
    const priorDir = join(root, "evidence", summary.prior_dataset);
    const priorBytes = readFileSync(join(priorDir, "analysis.json"));
    const priorProvenance = json(join(priorDir, "provenance.json"));
    requireValid((priorProvenance.artifacts as Record<string, unknown>)?.["analysis.json"] === digest(priorBytes), "prior source hash mismatch");
    const prior = replayAnalysis(JSON.parse(priorBytes.toString()) as unknown);
    const oldById = new Map(prior.attempts.map(a => [a.run_id, a]));
    const newById = new Map(data.attempts.map(a => [a.run_id, a]));
    const replaced = new Set<string>(); const replacements = new Set<string>();
    const oldAttempts = [];
    for (const value of summary.replacements) {
      requireValid(typeof value === "object" && value !== null, "invalid replacement mapping");
      const mapping = value as Record<string, unknown>;
      requireValid(typeof mapping.original_run_id === "string" && typeof mapping.replacement_run_id === "string", "replacement IDs required");
      const old = oldById.get(mapping.original_run_id); const next = newById.get(mapping.replacement_run_id);
      requireValid(old !== undefined && next !== undefined && !replaced.has(old.run_id) && !replacements.has(next.run_id) && !newById.has(old.run_id) && !oldById.has(next.run_id), "invalid replacement membership");
      requireValid(old.harness === next.harness && old.task === next.task && old.rep === next.rep && old.version === next.version && old.model === next.model && old.task_base_revision === next.task_base_revision, "replacement slot mismatch");
      requireValid(referenceCost(old, group.rates!) === null && referenceCost(next, group.rates!) !== null, "replacement must fix incomplete accounting");
      replaced.add(old.run_id); replacements.add(next.run_id); oldAttempts.push(old);
    }
    requireValid(prior.attempts.length === 200, "prior completed matrix required");
    for (const old of prior.attempts.filter(a => !replaced.has(a.run_id))) {
      const next = newById.get(old.run_id);
      requireValid(next !== undefined && JSON.stringify(next) === JSON.stringify(old), "unselected attempt changed during replacement");
    }
    const extra = summarizeBenchmarkCosts(oldAttempts, group.rates);
    const subtotal = extra.reduce((sum, h) => sum + (h.known_usd ?? 0), 0);
    replacementNote = `Four user-authorized replacements repaired incomplete accounting. The benchmark columns cover the selected 200 runs. The four superseded runs consumed **at least $${subtotal.toFixed(3)}** in additional reference cost (${extra.map(h => `${h.harness}: ≥ $${(h.known_usd ?? 0).toFixed(3)}`).join("; ")}), excluded from those columns. Their full costs remain unknown. [Original measurements](evidence/${summary.prior_dataset}/analysis.json) and [replacement mapping](evidence/${pointer.dataset}/summary.json) remain available. Replacements are selected for complete accounting, regardless of pass/fail outcome.\n\n`;
    if (summary.interrupted_recovery_note !== undefined) {
      requireValid(typeof summary.interrupted_recovery_note === "string", "invalid interrupted recovery note");
      replacementNote += "One additional Hermes recovery startup was interrupted by a model-metadata capture issue. Its extra spend is also outside the selected benchmark columns and is not included in the lower bound above; its raw evidence is retained on Linux.\n\n";
    }
    collectionNote = "All 200 selected slots are from the same Linux host. The original collection reused 104 attempts and filled 96 missing slots. Four incomplete-measurement slots were subsequently rerun with explicit user authorization; all other slots are unchanged.";
  }
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

${benchmarkTotalNote(group.attempts, rates)}

**Cost per task** is the average across each task’s five runs, then across the eight
tasks. **Whole benchmark** sums all 40 runs per harness, including failures.
Cache and tokens are medians per attempt; input includes cached tokens.
Costs use shared token-based reference prices, not actual billing.

**Comparison confidence:** eight task clusters; repeated runs are not 40 independent tasks.
“Best = 100%” describes the observed result, not statistical certainty.
${evidence.conditions ? "Recorded model/provider facts match, but request settings, enforced resource/network controls and cache policy are incomplete; verifier images differ.\n" : ""}${evidence.audit ? `The [separate verification audit](evidence/${evidence.audit_dataset}/README.md) finds ${evidence.audit.changes.length} Textual false negatives. Original outcomes above remain unchanged.\n` : ""}

[**Explore the interactive website →**](https://tom910.github.io/agent-overhead-bench/) ·
[Detailed tables](${path}/analysis.md) · [Canonical data](${path}/analysis.json)

<details>
<summary>Conditions, provenance and how to refresh</summary>

${replacementNote}**Reference cost:** $${rates.input * 1e6}/M uncached input + $${rates.cached_input * 1e6}/M cached input + $${rates.output * 1e6}/M output, from \`${REFERENCE_BOOK}\`. Exact request tokens are priced across all selected requests. Lower token usage alone does not establish better task performance. K = 1,000; M = 1,000,000.

[Full interactive report](${path}/analysis.html) · [Provenance and reproduction](${path}/README.md)

${collectionNote}
Model routing is
pinned to DeepSeek through OpenRouter, with fallbacks disabled and Relace excluded.
Original accounting books remain provenance; they do not split this model overview.

Retained and rebuilt verifier images occur in this dataset. Detailed comparisons
preserve their identities; the overview is not an image-matched controlled
experiment. Tool visibility is partial, so non-model time is not pure harness
overhead. This is not the frozen v1 dataset or a capabilities leaderboard.

One pointer, [current-campaign.json](evidence/current-campaign.json), selects the
canonical export. This table, the website and both detailed views are generated from its
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
  const markdown = renderAnalysisMarkdown(data) + comparisonMarkdown(data.attempts, evidence);
  const baseline = [...new Set(data.attempts.map(a => a.harness))].sort().at(-1)!;
  const html = renderAnalysisHtml(data).replace("</main>", `<section><h2>How convincing are the differences?</h2>${confidenceTable(pairwise, baseline)}<p>${CONFIDENCE_METHOD}</p></section>${evidenceHtml(evidence)}</main>`);
  const comparison = `${JSON.stringify({ schema_version: 1, dataset: pointer.dataset, analysis_sha256: digest(source), evidence_hashes: evidenceHashes, method: CONFIDENCE_METHOD, pairwise, ...evidence }, null, 2)}\n`;
  const updatedProvenance = { ...provenance, artifacts: { ...artifacts, "analysis.md": digest(markdown), "analysis.html": digest(html), "comparison.json": digest(comparison) } };
  const outputs = new Map([
    [join(root, "site/index.html"), renderResultsSite(data, pointer.dataset, new Date(summary.as_of).toISOString(), replacementNote, evidence)],
    [readmePath, updatedReadme], [join(dir, "analysis.md"), markdown], [join(dir, "analysis.html"), html],
    [join(dir, "provenance.json"), `${JSON.stringify(updatedProvenance, null, 2)}\n`],
    [join(dir, "comparison.json"), comparison],
  ]);
  if (check) {
    for (const [path, bytes] of outputs) requireValid(existsSync(path) && readFileSync(path, "utf8") === bytes, `stale generated view: ${path}; run npm run report:refresh`);
  } else {
    mkdirSync(join(root, "site"), { recursive: true });
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
