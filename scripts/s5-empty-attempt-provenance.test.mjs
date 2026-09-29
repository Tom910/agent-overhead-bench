import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";
const root = fileURLToPath(new URL("..", import.meta.url));

test("setup failure resumes successfully and exports explicit unmeasured retry evidence", async () => {
  await promisify(execFile)(process.execPath, ["--experimental-strip-types", "--no-warnings", "--experimental-loader", join(root, "scripts/ts-source-loader.mjs"), "--input-type=module", "--eval", `
    import assert from 'node:assert/strict';
    import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
    import { tmpdir } from 'node:os';
    import { join } from 'node:path';
    import { ConfigError } from '@aob/contracts';
    import { runMatrix } from './packages/runner/src/matrix.ts';
    import { copySanitizedProvenance } from './packages/report/src/freeze.ts';
    const root = mkdtempSync(join(tmpdir(), 'aob-empty-retry-'));
    try {
      const run = JSON.parse(readFileSync('packages/contracts/fixtures/c4.run.valid.json', 'utf8'));
      const resultsDir = join(root, 'results'); const statePath = join(root, 'state.json');
      let calls = 0;
      const opts = { resultsDir, statePath, tools: [run.tool], conditions: [run.condition], reps: 1, model: run.model, priceBook: run.price_book,
        tasks: [{ id: run.task_id, dir: root, source: run.task_source, revision: run.task_revision, regime: run.task_regime, timeoutS: 1 }],
        executeCell: async (cell, task, dir) => {
          if (++calls === 1) throw new ConfigError('fixture setup failed before any observation');
          run.run_id = cell.id; run.rep = cell.rep;
          mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, 'run.json'), JSON.stringify(run));
          const event = JSON.parse(readFileSync('packages/contracts/fixtures/c1.event.valid.json', 'utf8')); event.run_id = cell.id; event.seq = 0;
          writeFileSync(join(dir, 'events.jsonl'), JSON.stringify(event) + String.fromCharCode(10)); return run;
        } };
      await assert.rejects(runMatrix(opts), /fixture setup failed/);
      assert.equal(JSON.parse(readFileSync(statePath)).cells[0].status, 'failed');
      const state = await runMatrix(opts);
      assert.equal(state.cells[0].status, 'done'); assert.equal(calls, 2);
      const dest = join(root, 'provenance'); copySanitizedProvenance(resultsDir, statePath, dest);
      const relativeCell = join(run.condition, run.tool, run.task_id, 'rep-0');
      const metadata = JSON.parse(readFileSync(join(dest, 'unmeasured-retries', relativeCell, 'attempt-0.json')));
      assert.equal(metadata.status, 'unmeasured'); assert.equal(metadata.spend_usd, null);
      assert.equal(metadata.included_in_measured_counts, false);
      assert.equal(existsSync(join(dest, 'retries')), false);
      assert.equal(existsSync(join(dest, 'unmeasured-retries', relativeCell, 'run.json')), false);
      const manifestPath = join(resultsDir, relativeCell, '.attempts', 'attempt-0', 'manifest.json');
      const originalManifest = readFileSync(manifestPath, 'utf8');
      const mutations = [
        m => { delete m.files['run.json']; }, m => { m.files = {}; },
        m => { m.files['run.json'] = { status: 'preserved', bytes: 0, sha256: 'sha256:' + '0'.repeat(64) }; },
        m => { m.files['run.json'].private = 'PRIVATE'; }, m => { m.files.extra = { status: 'missing' }; },
        m => { m.attempt = 1; }, m => { m.schema_version = 2; }, m => { m.private = 'PRIVATE'; },
      ];
      for (const [i, mutate] of mutations.entries()) {
        const changed = JSON.parse(originalManifest); mutate(changed); writeFileSync(manifestPath, JSON.stringify(changed));
        assert.throws(() => copySanitizedProvenance(resultsDir, statePath, join(root, 'invalid-' + i)), /retry|manifest/i);
      }
      writeFileSync(manifestPath, originalManifest);
      // A genuinely partial provider record cannot use the empty-evidence exception.
      writeFileSync(join(resultsDir, relativeCell, '.attempts', 'attempt-0', 'events.jsonl.upstream.jsonl'), 'PRIVATE_PROVIDER_EVIDENCE');
      assert.throws(() => copySanitizedProvenance(resultsDir, statePath, join(root, 'partial-export')), /retry|manifest/i);
    } finally { rmSync(root, { recursive: true, force: true }); }
  `], { cwd: root, timeout: 30_000 });
});
