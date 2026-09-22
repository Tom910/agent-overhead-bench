import { createHash } from "node:crypto";
import { ConfigError } from "@aob/contracts";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export type TaskRevision = {
  instruction_sha256: string;
  test_patch_sha256: string;
  verifier_change: "none-prompt-clarification-only" | "class-based-event-subscriptions";
};

function replaceOnce(source: string, before: string, after: string): string {
  if (source.split(before).length !== 2) throw new ConfigError("task revision: expected exactly one reviewed replacement");
  return source.replace(before, after);
}

/** Correct listener assumptions without removing any behavioral assertions. */
export function reviseTextualTestPatch(patch: string): string {
  let revised = replaceOnce(patch, "+from textual.app import App, ComposeResult\n", "+from textual import on\n+from textual.app import App, ComposeResult\n");
  for (const [widget, name] of [["Log", "log"], ["RichLog", "rich"]] as const) {
    revised = replaceOnce(revised,
      `+    def on_${name === "rich" ? "rich_log" : "log"}_follow_changed(self, event: ${widget}.FollowChanged) -> None:\n+        self.${name}_events.append(event)`,
      `+    @on(${widget}.FollowChanged)\n+    def record_${name}_follow_changed(self, event: ${widget}.FollowChanged) -> None:\n+        if isinstance(event.widget, ${widget}):\n+            self.${name}_events.append(event)`);
  }
  // Recount edited unified-diff hunks, including offsets of subsequent hunks.
  const lines = revised.split("\n"); let offset = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]!.startsWith("diff --git ")) offset = 0;
    const header = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(.*)$/.exec(lines[i]!);
    if (!header) continue;
    let oldCount = 0; let newCount = 0;
    for (let j = i + 1; j < lines.length && !lines[j]!.startsWith("@@ ") && !lines[j]!.startsWith("diff --git "); j++) {
      const prefix = lines[j]![0];
      if (prefix === " " || prefix === "-") oldCount++;
      if (prefix === " " || prefix === "+") newCount++;
    }
    lines[i] = `@@ -${header[1]},${oldCount} +${Number(header[3]) + offset},${newCount} @@${header[5]}`;
    offset += newCount - Number(header[4] ?? 1);
  }
  return lines.join("\n");
}

export function applyTaskRevision(instruction: string, testPatch: string, revision: TaskRevision, addendum: string): { instruction: string; testPatch: string } {
  const hash = (s: string) => `sha256:${createHash("sha256").update(s).digest("hex")}`;
  if (hash(instruction) !== revision.instruction_sha256 || hash(testPatch) !== revision.test_patch_sha256) {
    throw new ConfigError("task revision: source hash mismatch; refuse unreviewed or already amended input");
  }
  if (!addendum.trim()) throw new ConfigError("task revision: empty clarification");
  if (!["none-prompt-clarification-only", "class-based-event-subscriptions"].includes(revision.verifier_change)) throw new ConfigError("task revision: unknown verifier change");
  return {
    instruction: `${instruction.trimEnd()}\n\n${addendum.trim()}\n`,
    testPatch: revision.verifier_change === "class-based-event-subscriptions" ? reviseTextualTestPatch(testPatch) : testPatch,
  };
}

/** A separate amendment artifact; never edits the reviewed source checkout. */
export function materializeTaskRevision(source: string, revisionDir: string, task: string, destination: string): void {
  try {
    if (existsSync(destination)) throw new ConfigError("task revision: destination exists");
    const manifestBytes = readFileSync(join(revisionDir, "manifest.json"));
    const manifest = JSON.parse(manifestBytes.toString()) as Record<string, unknown>;
    if (manifest.version !== 1 || typeof manifest.revision !== "string" || !Array.isArray(manifest.tasks)) throw new ConfigError("task revision: invalid manifest");
    const matches = manifest.tasks.filter((r: unknown) => typeof r === "object" && r !== null && (r as Record<string, unknown>).task === task) as Array<Record<string, unknown>>;
    const entry = matches[0];
    if (matches.length !== 1 || !entry || typeof entry.addendum !== "string" || !/^[a-z0-9._-]+\.md$/.test(entry.addendum)
      || typeof entry.instruction_sha256 !== "string" || typeof entry.test_patch_sha256 !== "string"
      || !["none-prompt-clarification-only", "class-based-event-subscriptions"].includes(String(entry.verifier_change))) throw new ConfigError("task revision: invalid or missing task amendment");
    const addendum = readFileSync(join(revisionDir, entry.addendum), "utf8");
    const output = applyTaskRevision(readFileSync(join(source, "instruction.md"), "utf8"), readFileSync(join(source, "tests/test.patch"), "utf8"), entry as TaskRevision, addendum);
    const hash = (s: string | Buffer) => `sha256:${createHash("sha256").update(s).digest("hex")}`;
    mkdirSync(destination);
    writeFileSync(join(destination, "instruction.md"), output.instruction);
    writeFileSync(join(destination, "test.patch"), output.testPatch);
    writeFileSync(join(destination, "revision.json"), `${JSON.stringify({
      version: 1, revision: manifest.revision, task,
      upstream_repository: manifest.upstream_repository, upstream_revision: manifest.upstream_revision,
      original_instruction_sha256: entry.instruction_sha256, original_test_patch_sha256: entry.test_patch_sha256,
      manifest_sha256: hash(manifestBytes), addendum_sha256: hash(addendum),
      verifier_change: entry.verifier_change, historical_results_replaced: false,
      artifacts: { "instruction.md": hash(output.instruction), "test.patch": hash(output.testPatch) },
    }, null, 2)}\n`);
  } catch (error) {
    if (error instanceof ConfigError) throw error;
    throw new ConfigError(`task revision: ${error instanceof Error ? error.message : String(error)}`);
  }
}
