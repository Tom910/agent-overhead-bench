import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { applyTaskRevision, materializeTaskRevision, reviseTextualTestPatch } from "./task-revisions.js";

const digest = (s: string) => `sha256:${createHash("sha256").update(s).digest("hex")}`;
describe("reviewed task amendments", () => {
  it("materializes a separate hash-bound amendment without overwriting source or destination", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-revision-files-"));
    try {
      mkdirSync(join(root, "source/tests"), { recursive: true });
      mkdirSync(join(root, "revision"));
      writeFileSync(join(root, "source/instruction.md"), "original\n");
      writeFileSync(join(root, "source/tests/test.patch"), "patch\n");
      writeFileSync(join(root, "revision/note.md"), "clarification\n");
      writeFileSync(join(root, "revision/manifest.json"), JSON.stringify({ version: 1, revision: "r1", upstream_repository: "reviewed", upstream_revision: "a".repeat(40), tasks: [{ task: "fixture", instruction_sha256: digest("original\n"), test_patch_sha256: digest("patch\n"), addendum: "note.md", verifier_change: "none-prompt-clarification-only" }] }));
      const args = [join(root, "source"), join(root, "revision"), "fixture", join(root, "output")] as const;
      materializeTaskRevision(...args);
      expect(readFileSync(join(root, "source/instruction.md"), "utf8")).toBe("original\n");
      expect(readFileSync(join(root, "output/instruction.md"), "utf8")).toBe("original\n\nclarification\n");
      const record = JSON.parse(readFileSync(join(root, "output/revision.json"), "utf8"));
      expect(record.artifacts["instruction.md"]).toBe(digest("original\n\nclarification\n"));
      expect(() => materializeTaskRevision(...args)).toThrow(/exists/);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
  it("rejects changed source bytes and duplicate application", () => {
    const revision = { instruction_sha256: digest("original\n"), test_patch_sha256: digest("patch\n"), verifier_change: "none-prompt-clarification-only" as const };
    const changed = applyTaskRevision("original\n", "patch\n", revision, "clarification");
    expect(changed.instruction).toBe("original\n\nclarification\n");
    expect(changed.testPatch).toBe("patch\n");
    expect(() => applyTaskRevision(changed.instruction, "patch\n", revision, "clarification")).toThrow(/hash/);
    expect(() => applyTaskRevision("original\n", "different patch", revision, "clarification")).toThrow(/hash/);
  });
  it("produces an applicable patch with corrected hunk lengths", () => {
    const root = mkdtempSync(join(tmpdir(), "aob-amendment-"));
    try {
      execFileSync("git", ["init", "--quiet", root]);
      const source = "from textual.app import App, ComposeResult\n" +
        "    def on_log_follow_changed(self, event: Log.FollowChanged) -> None:\n        self.log_events.append(event)\n\n" +
        "    def on_rich_log_follow_changed(self, event: RichLog.FollowChanged) -> None:\n        self.rich_events.append(event)\n";
      const patch = "diff --git a/test.py b/test.py\nnew file mode 100644\n--- /dev/null\n+++ b/test.py\n@@ -0,0 +1,6 @@\n" + source.split("\n").slice(0, -1).map(l => `+${l}\n`).join("");
      writeFileSync(join(root, "revision.patch"), reviseTextualTestPatch(patch));
      execFileSync("git", ["-C", root, "apply", "revision.patch"]);
      const output = readFileSync(join(root, "test.py"), "utf8");
      expect(output).toContain("@on(Log.FollowChanged)");
      expect(output).toContain("if isinstance(event.widget, RichLog):");
      expect(output).not.toContain("def on_log_follow_changed");
      expect(() => reviseTextualTestPatch("unreviewed patch")).toThrow(/expected/);
    } finally { rmSync(root, { recursive: true, force: true }); }
  });
});
