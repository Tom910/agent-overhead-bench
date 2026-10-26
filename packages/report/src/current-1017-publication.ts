import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { CurrentCampaign } from "./current-campaign.js";
import { requireSnapshot, snapshotHash, snapshotJson } from "./current-1017-snapshot.js";
import { renderAnalysisMarkdown, overviewMarkdown, benchmarkTotalNote } from "./analysis-render.js";
import { CONFIDENCE_METHOD, pairwiseConfidence } from "./comparison-confidence.js";
import { comparisonMarkdown } from "./comparison-report.js";
import { buildDecisionSiteData } from "./validated-campaign-registry.js";
import { loadSnapshotPassAudit } from "./snapshot-pass-audit.js";
import { prepareSnapshotReport, snapshotScope, extraAttemptMarkdown, renderSnapshotDetails, REPORT_FILE, HISTORY, INTERPRETATION } from "./snapshot-report.js";
import { renderPublishedReport, reportOverviewRows, reportEstimateSummary, type PublishedReport } from "./report-document.js";

const START = "<!-- CURRENT-CAMPAIGN:START -->", END = "<!-- CURRENT-CAMPAIGN:END -->";
const countWord = (n: number) => ["zero", "one", "two", "three", "four", "five"][n] ?? String(n);

/** Report data is produced once; every presentation uses its prepared values. */
export function prepare1017Publication(campaign: CurrentCampaign, report: PublishedReport) {
  const facts = campaign.publication.snapshot;
  requireSnapshot(facts !== undefined, "validated snapshot required for publication");
  const { summary } = facts, data = campaign.analysis, group = campaign.groups[0]!, rates = group.rates!;
  const path = `evidence/${campaign.dataset}`;
  const presentation = { overviews: reportOverviewRows(report) }, scope = snapshotScope(campaign);
  const estimate = reportEstimateSummary(report), costs = `$${summary.selected_reference_cost_usd.toFixed(9)}`;
  const pairwise = pairwiseConfidence(data.attempts), evidence = campaign.evidence;
  const extraMd = extraAttemptMarkdown(campaign);
  const markdown = `${scope}\n\n${estimate}${renderAnalysisMarkdown(data, presentation)}<details>\n<summary>Recorded pass-rate comparisons</summary>\n\n${comparisonMarkdown(data.attempts, evidence)}\n</details>\n\n${extraMd}`;
  const html = renderSnapshotDetails(report, data), site = renderPublishedReport(report);
  const index = renderPublishedReport(report, { downloadPrefix: "" });
  const readme = `# Five-CLI descriptive snapshot\n\n${scope}\n\n${estimate}Selected reference estimates total ${costs}. Original C1/C4 hashes and native outcomes are unchanged. The source owner checks immutable inputs before generating the report.\n\n[Report data](${REPORT_FILE}) · [Interactive report](index.html) · [Detailed report](analysis.html) · [Canonical facts](analysis.json) · [Selection summary](summary.json) · [Extra attempts](extra-attempts.json) · [Cohorts and collection windows](cohorts.json) · [Native proof bindings](native-evidence.json) · [Collection ledger](collection-ledger.json) · [Diagnostics](diagnostics.json) · [Decision data](decision-cards.json) · [Comparison evidence](comparison.json) · [Provenance](provenance.json) · [Historical snapshot](${HISTORY})\n\nBuild report and page together, offline:\n\n\`\`\`sh\nnpm run report:build\n\`\`\`\n\nThe page reads the generated report.json. CI checks source bindings and report reproducibility without API keys or model calls. Source: DeepSWE, preserving its declared swe-bench-ultra lineage. Source-specific review and native verifier gates remain enabled. Delegated source review and native-outcome qualification do not establish official passing calibration or release.\n\n${extraMd}`;
  const view = report.panels[0]!.views[0]!;
  const tasks = report.panels[0]!.views.length - 1, repetitions = new Set(data.attempts.map(a => a.rep)).size;
  const block = `${START}\n## Linux results — report-generated descriptive snapshot\n\n**Model: \`${data.attempts[0]!.model}\` · one Linux host · ${summary.selected_slots}/${summary.expected_slots} attempts.**\n${tasks} tasks × ${countWord(repetitions)} repetitions per CLI: ${view.rows[0]!.selected} runs each. ${summary.native_passes} native passes and ${summary.native_failures} failures. Rows are alphabetical. This is not the frozen v1 dataset.\n\n${scope}\n\n${reportEstimateSummary(report, `${path}/`)}Each column has its own baseline. Higher pass/cache rates and lower costs/token usage score higher. Relative scores describe the displayed values.\n\n${overviewMarkdown(group.attempts, rates, true, presentation)}\n\n${benchmarkTotalNote(group.attempts, rates)}\n\n**Cost per task** averages each task's repetitions, then the tasks. **Whole benchmark** sums selected runs per CLI, including failures. Cache and tokens are medians per attempt; input includes cached tokens. **Reference cost:** selected reference estimates total **${costs}** using \`${group.reference_book}\`: $${rates.input * 1e6}/M uncached input, $${rates.cached_input * 1e6}/M cached input and $${rates.output * 1e6}/M output. These are estimates, not actual billing.\n\nThe ${facts.extras.length} extra attempts have $${summary.extra_known_reference_cost_lower_bound_usd.toFixed(9)} in known prefix reference estimates and unknown full costs. The ${summary.prerequisite_attempts} prerequisites have a known reference subtotal of $${summary.prerequisite_known_reference_cost_subtotal_usd.toFixed(9)}; full cost is unknown. Reserves are not charges. See [extra attempts](${path}/extra-attempts.json) and [cohorts and collection windows](${path}/cohorts.json).\n\n**Comparison confidence:** ${tasks} task clusters. Repeated runs are not independent tasks. Relative scores describe observed measurements; they do not establish causality or a universal winner. Recorded image and environment differences limit interpretation. Non-model time includes unobserved tools and harness work.\n\n[**Open the interactive website →**](https://tom910.github.io/agent-overhead-bench/) · [Report data](${path}/${REPORT_FILE}) · [Result interpretation](${INTERPRETATION}) · [Detailed report](${path}/analysis.html) · [Canonical data](${path}/analysis.json) · [Source and reproduction](${path}/README.md) · [Historical snapshot](evidence/linux-results-2026-09-19-r1/README.md) · [Earlier mixed-host snapshot](evidence/nonclaude-results-2026-09-14/README.md)\n\nThe current-campaign pointer selects the validated source. Original outcomes are unchanged. Collection is complete as of ${summary.as_of}; official release status remains false.\n\n\`\`\`sh\nnpm run report:build\nnpm run report:check\n\`\`\`\n${END}`;
  const outputs = new Map<string, string>([
    [REPORT_FILE, snapshotJson(report)], ["analysis.md", markdown], ["analysis.html", html], ["report.html", html], ["index.html", index], ["README.md", readme],
    ["diagnostics.json", snapshotJson(campaign.diagnostics)], ["decision-cards.json", snapshotJson(buildDecisionSiteData([campaign]))],
    ["comparison.json", snapshotJson({ schema_version: 1, dataset: campaign.dataset, analysis_sha256: campaign.analysis_sha256, evidence_hashes: {}, method: CONFIDENCE_METHOD, pairwise, ...evidence })],
  ]);
  const audit = report.estimate_evidence!;
  const artifacts: Record<string, unknown> = { ...campaign.publication.artifacts, "source.json": facts.source_sha256, [audit.file]: audit.sha256 };
  for (const [file, bytes] of outputs) artifacts[file] = snapshotHash(bytes);
  outputs.set("provenance.json", snapshotJson({ ...campaign.publication.provenance, source_sha256: facts.source_sha256, site_index_sha256: snapshotHash(site), artifacts }));
  return { outputs, site, block };
}

export function publish1017Snapshot(root: string, campaign: CurrentCampaign, check: boolean): void {
  const dir = join(root, "evidence", campaign.dataset);
  const report = prepareSnapshotReport(campaign, loadSnapshotPassAudit(dir));
  const { outputs, site, block } = prepare1017Publication(campaign, report);
  const readmePath = join(root, "README.md"), current = readFileSync(readmePath, "utf8");
  requireSnapshot(current.split(START).length === 2 && current.split(END).length === 2 && current.indexOf(START) < current.indexOf(END), "exactly one ordered pair of README markers required");
  const paths = new Map([...outputs].map(([file, bytes]) => [join(dir, file), bytes]));
  paths.set(readmePath, current.slice(0, current.indexOf(START)) + block + current.slice(current.indexOf(END) + END.length));
  paths.set(join(root, "site/index.html"), site);
  if (check) {
    for (const [file, bytes] of paths) requireSnapshot(existsSync(file) && readFileSync(file, "utf8") === bytes, `stale generated view: ${file}; run npm run report:refresh`);
  } else {
    mkdirSync(join(root, "site"), { recursive: true });
    for (const [file, bytes] of paths) writeFileSync(file, bytes);
  }
}
