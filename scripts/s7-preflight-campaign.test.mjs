import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const script = join(root, "scripts/s7-preflight.sh");
const source = readFileSync(script, "utf8");
const scope = JSON.parse(readFileSync(join(root, "plans/s7-official-tool-scope.json"), "utf8"));
const baseEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith("AOB_")));
function preflight(env) {
  const result = spawnSync(script, ["/tmp/aob-preflight-campaign-unused", "z-ai/glm-5.3-flash", "openrouter-2026-08-27", scope.tools.join(",")], {
    cwd: root, encoding: "utf8", env: { ...baseEnv, ...env },
  });
  assert.notEqual(result.status, 0);
  return result.stdout + result.stderr;
}

test("batch campaigns require five repetitions while legacy retains four", () => {
  assert.match(preflight({ AOB_EXECUTION_PROTOCOL: "tool-batches-v1", AOB_REPS: "4" }), /at least five repetitions/);
  assert.match(preflight({ AOB_EXECUTION_PROTOCOL: "tool-batches-v1", AOB_REPS: "5" }), /AOB_TASKS is required/);
  assert.match(preflight({ AOB_REPS: "4" }), /AOB_TASKS is required/);
  assert.match(preflight({ AOB_REPS: "3" }), /at least four repetitions/);
  assert.match(preflight({ AOB_EXECUTION_PROTOCOL: "unknown" }), /execution protocol/);
});

test("diagnostic validation requires exactly one repetition and cannot be a batch campaign", () => {
  assert.match(preflight({ AOB_VALIDATION_ONLY: "1", AOB_REPS: "1" }), /AOB_TASKS is required/);
  for (const reps of ["0", "2", "5", "1.0", "no"]) {
    assert.match(preflight({ AOB_VALIDATION_ONLY: "1", AOB_REPS: reps }), /exactly one repetition/);
  }
  assert.match(preflight({ AOB_VALIDATION_ONLY: "1", AOB_REPS: "1", AOB_EXECUTION_PROTOCOL: "tool-batches-v1" }), /validation.*batch|batch.*validation/i);
  assert.match(preflight({ AOB_VALIDATION_ONLY: "yes" }), /AOB_VALIDATION_ONLY/);
});

// Run the inline review gate itself against real evidence bytes. The larger
// preflight's Docker checks are independent and cannot run in no-spend CI.
function reviewGate(validationOnly, mutate = () => {}) {
  const temp = mkdtempSync(join(tmpdir(), "aob-preflight-review-"));
  try {
    const review = { source_reviewed: false, reference_results_verified: false, calibration_complete: false, maintainer_signed_off: false,
      reviewer: "fixture", reviewed_at: "2026-09-05", evidence_file: "evidence.json", reviewed_task_ids: ["task-one"], calibration_adapters: [] };
    const manifest = { source_provenance: { repository: "https://example.com/source", revision: "a".repeat(40), review } };
    const evidence = { source_repository: manifest.source_provenance.repository, source_revision: manifest.source_provenance.revision,
      reviewer: review.reviewer, reviewed_at: review.reviewed_at, review: { ...review }, selected_task_ids: ["task-one"], calibration_adapters: [] };
    mutate({ manifest, evidence });
    const bytes = JSON.stringify(evidence);
    review.evidence_sha256 ??= `sha256:${createHash("sha256").update(bytes).digest("hex")}`;
    writeFileSync(join(temp, "evidence.json"), bytes);
    const start = source.indexOf("const review = manifest.source_provenance?.review;");
    const end = source.indexOf("const selectedIds = tasks.map", start);
    assert.ok(start >= 0 && end > start);
    const program = `const fs=require('node:fs'); const path=require('node:path'); const {createHash}=require('node:crypto');
      const root=${JSON.stringify(temp)}; const tasks=[path.join(root,'task-one')]; const validationOnly=${validationOnly};
      const manifest=${JSON.stringify(manifest)};\n${source.slice(start, end)}`;
    return spawnSync(process.execPath, ["-e", program], { encoding: "utf8" });
  } finally { rmSync(temp, { recursive: true, force: true }); }
}

test("diagnostic review permits pending flags; official review still rejects them", () => {
  const diagnostic = reviewGate(true);
  assert.equal(diagnostic.status, 0, diagnostic.stderr);
  assert.match(reviewGate(false).stderr, /review gates are incomplete/);
});

test("diagnostic review retains evidence hash, flags, provenance and selected-task bindings", () => {
  for (const mutate of [
    ({ manifest }) => { manifest.source_provenance.review.evidence_sha256 = `sha256:${"0".repeat(64)}`; },
    ({ evidence }) => { evidence.review.source_reviewed = true; },
    ({ evidence }) => { evidence.source_revision = "b".repeat(40); },
    ({ evidence }) => { evidence.selected_task_ids = ["another-task"]; },
    ({ evidence }) => { evidence.calibration_adapters = ["codex"]; },
  ]) {
    assert.notEqual(reviewGate(true, mutate).status, 0);
  }
});

test("only diagnostic validation skips the calibration attestation requirement", () => {
  const start = source.indexOf('if [ "$CALIBRATION_REQUIRED" = "1" ]');
  const end = source.indexOf('\ncase ",$TOOLS,"', start);
  assert.ok(start >= 0 && end > start);
  const program = 'set -eu\nfail() { printf "%s\\n" "$1" >&2; exit 1; }\n' + source.slice(start, end);
  for (const validation of ["0", "1"]) {
    const result = spawnSync("sh", ["-c", program], { encoding: "utf8", env: {
      ...baseEnv, VALIDATION_ONLY: validation, CALIBRATION_REQUIRED: "1", CALIBRATION_ATTESTATION: "",
    } });
    assert.equal(result.status, validation === "1" ? 0 : 1, result.stderr);
    if (validation === "0") assert.match(result.stderr, /requires AOB_CALIBRATION_ATTESTATION/);
  }
});

test("nonempty results are accepted only for batch preflight; symlinks remain rejected", () => {
  const temp = mkdtempSync(join(tmpdir(), "aob-preflight-results-"));
  try {
    writeFileSync(join(temp, "existing.json"), "{}");
    const start = source.indexOf('if [ -e "$RESULTS" ]');
    const end = source.indexOf('\nif [ "$OS" = "Darwin" ]', start);
    assert.ok(start >= 0 && end > start);
    const program = 'set -eu\nfail() { printf "%s\\n" "$1" >&2; exit 1; }\n' + source.slice(start, end);
    for (const protocol of ["", "tool-batches-v1"]) {
      const result = spawnSync("sh", ["-c", program], { encoding: "utf8", env: { ...baseEnv, RESULTS: temp, EXECUTION_PROTOCOL: protocol, VALIDATION_ONLY: "0" } });
      assert.equal(result.status, protocol ? 0 : 1, result.stderr);
    }
    const link = join(temp, "link");
    symlinkSync(temp, link);
    const result = spawnSync("sh", ["-c", program], { encoding: "utf8", env: {
      ...baseEnv, RESULTS: link, EXECUTION_PROTOCOL: "tool-batches-v1", VALIDATION_ONLY: "0",
    } });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /symlink/);
  } finally { rmSync(temp, { recursive: true, force: true }); }
});
