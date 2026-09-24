import assert from 'node:assert/strict';
import { test, afterEach } from 'node:test';
import { chmodSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync, realpathSync, symlinkSync, cpSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import * as campaign from './s7-luna-campaign.mjs';
import { runCampaign, parseOptions, CampaignError, TASK_IDS, HARNESS_ORDER } from './s7-luna-campaign.mjs';

const roots = [];
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });
const read = path => JSON.parse(readFileSync(path, 'utf8'));
const baseRun = read(new URL('../packages/contracts/fixtures/c4.run.valid.json', import.meta.url));
const baseEvent = read(new URL('../packages/contracts/fixtures/c1.event.valid.json', import.meta.url));
const digest = `sha256:${'1'.repeat(64)}`;
function fixture(change) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'aob-luna-campaign-'))); roots.push(root);
  const options = { taskRoot: join(root, 'tasks'), output: join(root, 'output'), privateRoot: join(root, 'private'), authFile: join(root, 'not-read-auth.json'), bridgeBinary: join(root, 'bridge') };
  mkdirSync(options.taskRoot, { mode: 0o700 }); writeFileSync(options.bridgeBinary, 'synthetic bridge');
  const calls = []; const factories = [];
  const tasks = TASK_IDS.map(id => ({ id, taskDir: join(options.taskRoot, id), source: { kind: 'public-task-pack', repository: 'https://github.com/datacurve-ai/deep-swe.git', revision: '0b9fabbb63b9104d678fe965e1632f2dd9eaa2ea' },
    baseRevision: '2'.repeat(40), timeoutS: 10800, regime: 'extended', environment: { kind: 'prepared-local', network: 'disabled', agent_images: Object.fromEntries(HARNESS_ORDER.map(h => [h, { image: `fixture-${h}`, image_digest: digest }])) },
    verifier: { kind: 'docker-command', image: 'fixture-verifier', image_digest: digest, command: ['true'], workdir: '.', network: 'none' } }));
  const deps = {
    platform: 'linux', preflightImages: async () => {}, hostFingerprint: async () => 'd'.repeat(64), implementationHash: async () => 'a'.repeat(64),
    loadTasks: async () => ({ tasks, suiteSha256: 'b'.repeat(64), sourceSha256: 'c'.repeat(64) }),
    createTransportFactory: async options => { factories.push(options); return async () => {}; },
    runCell: async spec => {
      calls.push(spec); mkdirSync(spec.dir, { recursive: true, mode: 0o700 });
      const run = { ...structuredClone(baseRun), run_id: spec.run_id, tool: spec.tool, task_id: spec.task_id,
        task_source: spec.task_source, task_revision: spec.task_revision, task_repository: spec.task_repository,
        task_base_revision: spec.task_base_revision, task_regime: spec.task_regime, rep: spec.rep, model: spec.model,
        price_book: spec.price_book, spend_usd_estimate: null,
        container: { ...baseRun.container, image_digest: digest, verifier_image_digest: digest },
        task_environment: { kind: 'prepared-local', network: 'disabled', agent_image: `fixture-${spec.tool}`, agent_image_digest: digest } };
      const event = { ...structuredClone(baseEvent), run_id: spec.run_id, seq: 0, path: '/responses', protocol: 'openai_responses', model_requested: spec.model, model_served: spec.model };
      const context = { run, event, spec, index: calls.length - 1, footer: '', eventCount: 1, observed: { front_refused: 0, gate_refused: 0, requests: [] } }; change?.(context);
      context.observed.requests = context.observed.requests.length ? context.observed.requests : Array.from({ length: context.eventCount }, () => ({ accepted: true, model_matches: true, effort_low: true, summary_auto: true, store_false: true, reasoning_replay_absent: true, continuation_absent: true }));
      const emittedEvents = Array.from({ length: context.eventCount }, (_, seq) => ({ ...event, seq, ...(context.eventOverrides?.[seq] ?? {}) }));
      writeFileSync(join(spec.dir, 'events.jsonl'), emittedEvents.map(JSON.stringify).join('\n') + '\n');
      if (context.upstreamEvidence) { const rows = emittedEvents.map(e => ({ v: 1, run_id: e.run_id, seq: e.seq, c1_sha256: createHash('sha256').update(JSON.stringify(e) + '\n').digest('hex'), upstream_status: 200, error: null })); context.changeUpstream?.(rows); writeFileSync(join(spec.dir, 'events.jsonl.upstream.jsonl'), rows.map(JSON.stringify).join('\n') + '\n'); }
      writeFileSync(join(spec.dir, 'verify.log'), context.footer);
      writeFileSync(join(spec.dir, 'run.json'), JSON.stringify(run));
      writeFileSync(join(spec.dir, 'execution-conditions.json'), '{}');
      writeFileSync(join(spec.dir, 'candidate-evidence.json'), '{}');
      writeFileSync(join(spec.dir, 'transport.json'), JSON.stringify({ model: spec.model, policy: 'luna-low-reasoning-replay-disabled',
        bridge_binary_sha256: createHash('sha256').update(readFileSync(options.bridgeBinary)).digest('hex'), refresh_token_imported: false,
        subscription_usd: null, timeout_s: 10800, max_model_requests: 512, max_input_tokens: 100000000, max_output_tokens: 1000000 }));
      writeFileSync(join(spec.dir, 'bridge-conditions.json'), JSON.stringify(context.observed));
      return run;
    },
    progress: () => {},
  };
  return { root, options, deps, calls, factories, setChange: fn => { change = fn; } };
}

test('persists exactly 200 ordered slots and runs each funded cell once across harness subsets', async () => {
  const f = fixture(); const first = await runCampaign({ ...f.options, harnesses: ['codex', 'hermes'] }, f.deps);
  assert.equal(first.cells.length, 200); assert.equal(f.calls.length, 80);
  assert.deepEqual(f.calls.map(c => c.tool), Array.from({ length: 40 }, () => ['codex', 'hermes']).flat());
  assert.equal(first.cells.filter(c => c.status === 'pending').length, 120);
  assert.equal(first.official_release, false);
  for (const spec of f.calls) { assert.match(spec.run_id, /^[A-Za-z0-9_-]{1,160}$/); assert.equal(spec.model, 'gpt-6-luna'); assert.equal(spec.timeoutS, 10800); assert.equal(spec.priceRates, undefined); assert.equal(spec.price_book, 'codex-subscription-unpriced-2026-09-22'); assert.equal(typeof spec.transportFactory, 'function'); }
  const second = await runCampaign(f.options, f.deps);
  assert.equal(f.calls.length, 200); assert.equal(new Set(f.calls.map(c => c.run_id)).size, 200);
  assert.equal(second.cells.filter(c => c.status === 'completed').length, 200);
  await runCampaign(f.options, f.deps); assert.equal(f.calls.length, 200);
});

test('records started before execution and halts permanently on interrupted setup without retrying', async () => {
  const f = fixture(); let invoked = 0;
  f.deps.runCell = async spec => { invoked++; const state = read(join(f.options.output, 'state.json')); assert.equal(state.cells.find(c => c.run_id === spec.run_id).status, 'started'); throw new Error('private failure detail'); };
  const state = await runCampaign(f.options, f.deps); assert.equal(state.halted, true); assert.equal(invoked, 1);
  assert.equal(JSON.stringify(state).includes('private failure detail'), false);
  await runCampaign(f.options, f.deps); assert.equal(invoked, 1);
});

test('halts after provider denial or unknown canonical accounting regardless of native success', async () => {
  for (const change of [c => c.event.status = 429, c => c.event.model_served = null, c => { c.event.usage = null; c.event.usage_source = 'unavailable'; }, c => c.run.spend_usd_estimate = 0]) {
    const f = fixture(change); const state = await runCampaign(f.options, f.deps);
    assert.equal(state.halted, true); assert.equal(f.calls.length, 1); assert.equal(state.cells[0].status, 'blocked');
  }
});

test('continues terminal native reward-zero verification failures without rewriting their C4', async () => {
  const f = fixture(c => { if (c.index === 0) { c.run.outcome = 'verify_error'; c.run.verification.exit = 1; c.footer = '[verifier] reward.json=' + JSON.stringify({ reward: 0, f2p_total: 2, f2p_passed: 1, p2p_total: 2, p2p_passed: 2, f2p: .5, p2p: 1, partial: .75 }) + '\n'; } });
  const state = await runCampaign({ ...f.options, harnesses: ['codex'] }, f.deps);
  assert.equal(f.calls.length, 40); assert.equal(state.halted, false); assert.equal(state.cells[0].status, 'task_failed');
  assert.equal(read(join(f.calls[0].dir, 'run.json')).outcome, 'verify_error');
});

test('stops on verifier infrastructure errors, native process failures and timeouts', async () => {
  for (const change of [c => { c.run.outcome = 'verify_error'; c.run.verification.exit = 1; c.footer = 'verifier crashed\n'; }, c => c.run.adapter_result.exitCode = 1, c => c.run.outcome = 'timeout']) {
    const f = fixture(change); const state = await runCampaign(f.options, f.deps); assert.equal(state.halted, true); assert.equal(f.calls.length, 1);
  }
});

test('rejects lock contention and source/binary drift before another invocation', async () => {
  const f = fixture(); mkdirSync(f.options.output, { mode: 0o700 }); writeFileSync(join(f.options.output, 'campaign.lock'), '');
  await assert.rejects(runCampaign(f.options, f.deps), CampaignError); assert.equal(f.calls.length, 0); rmSync(join(f.options.output, 'campaign.lock'));
  await runCampaign({ ...f.options, harnesses: ['codex'] }, f.deps); writeFileSync(f.options.bridgeBinary, 'changed');
  await assert.rejects(runCampaign(f.options, f.deps), CampaignError); assert.equal(f.calls.length, 40);
});

test('refuses tampered consumed C4 and orphan pending directories without overwriting evidence', async () => {
  const f = fixture(); await runCampaign({ ...f.options, harnesses: ['codex'] }, f.deps);
  writeFileSync(join(f.calls[0].dir, 'run.json'), '{}'); await assert.rejects(runCampaign(f.options, f.deps), CampaignError); assert.equal(f.calls.length, 40);
  const g = fixture(); mkdirSync(join(g.options.output, 'results', 'codex', TASK_IDS[0], '0'), { recursive: true, mode: 0o700 });
  writeFileSync(join(g.options.output, 'results', 'codex', TASK_IDS[0], '0', 'keep'), 'original');
  const state = await runCampaign(g.options, g.deps); assert.equal(state.halted, true); assert.equal(g.calls.length, 0);
  assert.equal(readFileSync(join(g.options.output, 'results', 'codex', TASK_IDS[0], '0', 'keep'), 'utf8'), 'original');
});

test('CLI has explicit required paths and rejects unknown/duplicate harnesses and ambiguous options', () => {
  const args = ['--task-root', '/tasks', '--output', '/output', '--auth-file', '/auth', '--bridge-binary', '/bridge', '--private-root', '/private'];
  assert.deepEqual(parseOptions([...args, '--harnesses', 'hermes,codex']).harnesses, ['codex', 'hermes']);
  for (const extra of [['--harnesses', 'codex,codex'], ['--harnesses', 'unknown'], ['--output', '/second'], ['--unexpected', 'x']]) assert.throws(() => parseOptions([...args, ...extra]), CampaignError);
  assert.throws(() => parseOptions(args.slice(0, -2)), CampaignError);
});

test('binds one Linux host without retaining its machine identifier', async () => {
  const f = fixture(); const state = await runCampaign({ ...f.options, harnesses: ['codex'] }, f.deps);
  assert.equal(state.definition.host_sha256, 'd'.repeat(64));
  f.deps.hostFingerprint = async () => 'e'.repeat(64);
  await assert.rejects(runCampaign(f.options, f.deps), CampaignError); assert.equal(f.calls.length, 40);
});

const metadata = () => ['api-models', 'backend-tags', 'backend-properties', 'backend-properties', 'backend-version', 'model-detail', 'backend-show'].map(route => ({ reason: 'path', status: 404, method: route === 'backend-show' ? 'POST' : 'GET', route, query_present: false }));
const taskFailure = c => { c.run.outcome = 'verify_error'; c.run.verification.exit = 1; c.footer = '[verifier] reward.json=' + JSON.stringify({ reward: 0, f2p_total: 2, f2p_passed: 1, p2p_total: 2, p2p_passed: 2, f2p: .5, p2p: 1, partial: .75 }) + '\n'; };
test('allows only classified Hermes metadata refusals, with no relaxation for other routes or harnesses', async () => {
  const good = fixture(c => { c.observed.front_refused = 7; c.observed.front_rejections = metadata(); c.observed.front_rejections_truncated = 0; });
  const result = await runCampaign({ ...good.options, harnesses: ['hermes'] }, good.deps); assert.equal(result.halted, false); assert.equal(good.calls.length, 40);
  for (const mutate of [r => r[0].reason = 'auth', r => r[0].reason = 'body', r => r[0].route = 'responses', r => r[0].query_present = true, r => r[0].status = 401, r => r[0].method = 'POST']) {
    const bad = fixture(c => { const records = metadata(); mutate(records); Object.assign(c.observed, { front_refused: records.length, front_rejections: records, front_rejections_truncated: 0 }); });
    assert.equal((await runCampaign({ ...bad.options, harnesses: ['hermes'] }, bad.deps)).halted, true); assert.equal(bad.calls.length, 1);
  }
  for (const field of ['front_rejections_truncated', 'front_refused']) {
    const bad = fixture(c => Object.assign(c.observed, { front_refused: 7, front_rejections: metadata(), front_rejections_truncated: 0, [field]: 1 }));
    assert.equal((await runCampaign({ ...bad.options, harnesses: ['hermes'] }, bad.deps)).halted, true);
  }
  const other = fixture(c => Object.assign(c.observed, { front_refused: 7, front_rejections: metadata(), front_rejections_truncated: 0 }));
  assert.equal((await runCampaign({ ...other.options, harnesses: ['codex'] }, other.deps)).halted, true);
});
const fileHash = path => createHash('sha256').update(readFileSync(path)).digest('hex');
async function legacyFixture(existing) {
  const f = existing ?? fixture(); f.setChange(c => { taskFailure(c); if (c.spec.tool === 'hermes') { c.eventCount = 47; c.observed.front_refused = 7; } });
  const old = await runCampaign(f.options, f.deps); assert.equal(f.calls.length, 2); assert.equal(old.cells[0].status, 'task_failed'); assert.equal(old.cells[1].status, 'blocked');
  const proof = join(f.root, 'proof.json'); writeFileSync(proof, 'synthetic offline proof');
  f.deps.legacyPins = { state: fileHash(join(f.options.output, 'state.json')), implementation: old.definition.implementation_sha256, session: old.session,
    run: fileHash(join(f.calls[1].dir, 'run.json')), events: fileHash(join(f.calls[1].dir, 'events.jsonl')), observations: fileHash(join(f.calls[1].dir, 'bridge-conditions.json')), proof: fileHash(proof), image: digest };
  f.deps.legacyProofPath = proof; f.deps.implementationHash = async () => 'e'.repeat(64);
  return f;
}
test('one-off inferred adjudication preserves raw files and old state, then skips both consumed attempts', async () => {
  const f = await legacyFixture(); const raw = f.calls.map(c => Object.fromEntries(readdirSync(c.dir).map(name => [name, fileHash(join(c.dir, name))])));
  const result = await campaign.repairLunaMetadataStop(f.options, f.deps); assert.equal(result.halted, false); assert.equal(result.cells[1].status, 'task_failed'); assert.equal(result.cells.filter(c => c.status === 'pending').length, 198);
  assert.equal(fileHash(join(f.options.output, 'legacy-metadata-state.json')), f.deps.legacyPins.state);
  assert.equal(read(join(f.options.output, 'legacy-metadata-adjudication.json')).classification, 'legacy_classification_inferred');
  for (let i = 0; i < 2; i++) for (const [name, hash] of Object.entries(raw[i])) assert.equal(fileHash(join(f.calls[i].dir, name)), hash);
  const consumed = f.calls.map(c => c.run_id); f.deps.runCell = async spec => { assert.ok(!consumed.includes(spec.run_id)); throw new Error('stop synthetic continuation'); };
  const resumed = await runCampaign(f.options, f.deps); assert.equal(resumed.cells[2].status, 'blocked');
  await assert.rejects(campaign.repairLunaMetadataStop(f.options, f.deps), CampaignError);
});
test('legacy repair refuses hash drift, source changes, provider failure and receipt tampering', async () => {
  for (const mutation of ['state', 'source', 'provider']) {
    const f = await legacyFixture();
    if (mutation === 'state') writeFileSync(join(f.options.output, 'state.json'), readFileSync(join(f.options.output, 'state.json'), 'utf8') + ' ');
    if (mutation === 'source') { const load = f.deps.loadTasks; f.deps.loadTasks = async () => { const loaded = await load(); loaded.tasks[0].baseRevision = '9'.repeat(40); return loaded; }; }
    if (mutation === 'provider') { const path = join(f.calls[1].dir, 'events.jsonl'); const events = readFileSync(path, 'utf8').trim().split('\n').map(JSON.parse); events[0].status = 429; writeFileSync(path, events.map(JSON.stringify).join('\n') + '\n'); f.deps.legacyPins.events = fileHash(path); }
    await assert.rejects(campaign.repairLunaMetadataStop(f.options, f.deps), CampaignError); assert.equal(read(join(f.options.output, 'state.json')).halted, true);
  }
  const f = await legacyFixture(); await campaign.repairLunaMetadataStop(f.options, f.deps);
  const receipt = join(f.options.output, 'legacy-metadata-adjudication.json'); chmodSync(receipt, 0o600); writeFileSync(receipt, readFileSync(receipt, 'utf8') + ' ');
  await assert.rejects(runCampaign(f.options, f.deps), CampaignError); assert.equal(f.calls.length, 2);
});

test('production repair pins and preserved backup refuse arbitrary stops and evidence loss', async () => {
  const arbitrary = await legacyFixture(); const { legacyPins, ...productionPins } = arbitrary.deps;
  await assert.rejects(campaign.repairLunaMetadataStop(arbitrary.options, productionPins), CampaignError);
  for (const name of ['legacy-metadata-state.json', 'legacy-metadata-adjudication.json', 'bridge-conditions.json']) {
    const f = await legacyFixture(); await campaign.repairLunaMetadataStop(f.options, f.deps);
    const path = name === 'bridge-conditions.json' ? join(f.calls[1].dir, name) : join(f.options.output, name);
    rmSync(path); await assert.rejects(runCampaign(f.options, f.deps), CampaignError); assert.equal(f.calls.length, 2);
  }
});

const countsFor = records => {
  const counts = Object.fromEntries(['api-models', 'model-detail', 'backend-tags', 'backend-properties', 'backend-version', 'backend-show'].map(k => [k, 0]));
  for (const r of records) counts[r.route]++;
  return counts;
};
test('repeated known Hermes metadata is allowed with complete arrays or exact counters beyond sample capacity', async () => {
  for (const count of [11, 140]) {
    const good = fixture(c => {
      const records = Array.from({ length: count }, (_, i) => metadata()[i % 7]);
      Object.assign(c.observed, { front_refused: count, front_rejections: records.slice(0, 128), front_rejections_truncated: Math.max(0, count - 128) });
      if (count > 128) Object.assign(c.observed, { front_metadata_counts: countsFor(records), front_unclassified_refused: 0 });
    });
    const state = await runCampaign({ ...good.options, harnesses: ['hermes'] }, good.deps); assert.equal(state.halted, false); assert.equal(good.calls.length, 40);
  }
});
test('exact metadata counters reject unknowns, invalid totals, truncated legacy samples and contradicted samples', async () => {
  for (const mutate of [o => { o.front_unclassified_refused = 1; o.front_metadata_counts['api-models']--; }, o => o.front_metadata_counts['api-models']++, o => o.front_metadata_counts.extra = 0,
    o => o.front_metadata_counts['api-models'] = -1, o => o.front_metadata_counts['api-models'] = .5, o => delete o.front_metadata_counts['api-models'],
    o => { delete o.front_metadata_counts; delete o.front_unclassified_refused; }, o => o.front_rejections[0].reason = 'auth',
    o => { o.front_metadata_counts['api-models'] = 0; o.front_metadata_counts['backend-tags'] += 20; }, o => o.front_rejections_truncated++, o => { o.front_rejections = []; o.front_rejections_truncated = 140; }]) {
    const bad = fixture(c => { const records = Array.from({ length: 140 }, (_, i) => metadata()[i % 7]);
      Object.assign(c.observed, { front_refused: 140, front_rejections: records.slice(0, 128), front_rejections_truncated: 12, front_metadata_counts: countsFor(records), front_unclassified_refused: 0 }); mutate(c.observed); });
    assert.equal((await runCampaign({ ...bad.options, harnesses: ['hermes'] }, bad.deps)).halted, true); assert.equal(bad.calls.length, 1);
  }
});
async function repeatedFixture(existing) {
  const f = await legacyFixture(existing); await campaign.repairLunaMetadataStop(f.options, f.deps);
  f.setChange(c => { taskFailure(c); if (c.index === 5) { c.eventCount = 39; Object.assign(c.observed, { front_refused: 11, front_rejections: [...metadata(), ...metadata().slice(0, 4)], front_rejections_truncated: 0 }); } });
  const execute = f.deps.runCell;
  f.deps.runCell = async spec => { const result = await execute(spec); if (f.calls.length === 6) throw new Error('simulate original count-bound stop after raw evidence'); return result; };
  const old = await runCampaign(f.options, f.deps); assert.equal(f.calls.length, 6); assert.equal(old.cells[5].status, 'blocked');
  f.deps.repeatedPins = { first_receipt: old.legacy_metadata_adjudication, state: fileHash(join(f.options.output, 'state.json')), implementation: old.definition.implementation_sha256, session: old.session,
    run: fileHash(join(f.calls[5].dir, 'run.json')), events: fileHash(join(f.calls[5].dir, 'events.jsonl')), observations: fileHash(join(f.calls[5].dir, 'bridge-conditions.json')) };
  f.deps.implementationHash = async () => 'f'.repeat(64); return f;
}
test('second audited recovery preserves both epochs and raw evidence, then skips all six consumed cells', async () => {
  const f = await repeatedFixture(); const firstReceipt = fileHash(join(f.options.output, 'legacy-metadata-adjudication.json'));
  const raw = f.calls.map(c => Object.fromEntries(readdirSync(c.dir).map(name => [name, fileHash(join(c.dir, name))])));
  const state = await campaign.repairLunaRepeatedMetadataStop(f.options, f.deps); assert.equal(state.halted, false); assert.equal(state.cells.filter(c => c.status === 'pending').length, 194);
  assert.equal(fileHash(join(f.options.output, 'legacy-metadata-adjudication.json')), firstReceipt);
  assert.deepEqual(state.cells.slice(0, 6).map(c => c.original_implementation_sha256), ['a', 'a', 'e', 'e', 'e', 'e'].map(s => s.repeat(64)));
  assert.equal(fileHash(join(f.options.output, 'repeated-metadata-state.json')), f.deps.repeatedPins.state);
  for (let i = 0; i < 6; i++) for (const [name, hash] of Object.entries(raw[i])) assert.equal(fileHash(join(f.calls[i].dir, name)), hash);
  const consumed = f.calls.map(c => c.run_id); f.deps.runCell = async spec => { assert.ok(!consumed.includes(spec.run_id)); throw new Error('stop synthetic continuation'); };
  assert.equal((await runCampaign(f.options, f.deps)).cells[6].status, 'blocked');
  await assert.rejects(campaign.repairLunaRepeatedMetadataStop(f.options, f.deps), CampaignError);
});
test('second recovery refuses arbitrary pins, source/provider drift, and tampering anywhere in receipt chain', async () => {
  for (const mutation of ['production', 'source', 'provider', 'old-receipt']) {
    const f = await repeatedFixture();
    if (mutation === 'production') delete f.deps.repeatedPins;
    if (mutation === 'source') { const load = f.deps.loadTasks; f.deps.loadTasks = async () => { const loaded = await load(); loaded.tasks[2].baseRevision = '9'.repeat(40); return loaded; }; }
    if (mutation === 'provider') { const path = join(f.calls[5].dir, 'events.jsonl'); const rows = readFileSync(path, 'utf8').trim().split('\n').map(JSON.parse); rows[0].status = 429; writeFileSync(path, rows.map(JSON.stringify).join('\n') + '\n'); f.deps.repeatedPins.events = fileHash(path); }
    if (mutation === 'old-receipt') { const path = join(f.options.output, 'legacy-metadata-adjudication.json'); chmodSync(path, 0o600); writeFileSync(path, '{}'); }
    await assert.rejects(campaign.repairLunaRepeatedMetadataStop(f.options, f.deps), CampaignError); assert.equal(read(join(f.options.output, 'state.json')).halted, true);
  }
  for (const name of ['legacy-metadata-state.json', 'legacy-metadata-adjudication.json', 'repeated-metadata-state.json', 'repeated-metadata-adjudication.json']) {
    const f = await repeatedFixture(); await campaign.repairLunaRepeatedMetadataStop(f.options, f.deps); rmSync(join(f.options.output, name));
    await assert.rejects(runCampaign(f.options, f.deps), CampaignError); assert.equal(f.calls.length, 6);
  }
});

test('valid unique Textual reward summary survives asynchronous traceback appended to verifier output', async () => {
  const summary = '[verifier] reward.json={"reward": 0, "f2p_total": 20, "f2p_passed": 13, "p2p_total": 6, "p2p_passed": 6, "f2p": 0.65, "p2p": 1.0, "partial": 0.7307692307692307}';
  const suffix = '\nTask exception was never retrieved\nfuture: <Task finished name="message pump RichLog" exception=ValueError("too many values to unpack (expected 3)")>\nTraceback (most recent call last):\n  File "/work/workspace/src/textual/strip.py", line 40, in get_line_length\nValueError: too many values to unpack (expected 3)\n';
  const valid = fixture(c => { taskFailure(c); c.footer = summary + suffix; });
  const state = await runCampaign({ ...valid.options, harnesses: ['hermes'] }, valid.deps);
  assert.equal(state.halted, false); assert.equal(valid.calls.length, 40); assert.equal(state.cells.filter(c => c.status === 'task_failed').length, 40);
  for (const record of ['', summary + '\n' + summary, '[verifier] reward.json={broken}', summary.replace('"f2p_passed": 13', '"f2p_passed": 21'), summary.replace('"f2p": 0.65', '"f2p": 0.7')]) {
    const invalid = fixture(c => { taskFailure(c); c.footer = record + suffix; });
    assert.equal((await runCampaign({ ...invalid.options, harnesses: ['hermes'] }, invalid.deps)).halted, true); assert.equal(invalid.calls.length, 1);
  }
});

// No-solution proof fixtures are supplied by the real helper schema; the model
// and capture subprocess seams remain synthetic and never invoke Docker here.
test('empty verifier output alone cannot become a task failure', async () => {
  const f = fixture(c => { c.run.outcome = 'verify_error'; c.run.verification.exit = 1; });
  let captures = 0; f.deps.createNoSolutionProof = async () => { captures++; throw new Error('not proven'); };
  const state = await runCampaign(f.options, f.deps); assert.equal(state.halted, true); assert.equal(captures, 1); assert.equal(f.calls.length, 1);
});

async function noSolutionFixture(existing) {
  const f = await repeatedFixture(existing); await campaign.repairLunaRepeatedMetadataStop(f.options, f.deps);
  f.setChange(c => { taskFailure(c); if (c.index === 8) { c.eventCount = 27; c.footer = ''; } });
  const state = await runCampaign(f.options, { ...f.deps, createNoSolutionProof: async () => { throw new Error('historical proof not available'); } });
  assert.equal(f.calls.length, 9); assert.equal(state.cells[8].status, 'blocked');
  writeFileSync(join(f.calls[8].dir, 'candidate.patch'), '');
  f.deps.noSolutionPins = { candidate_evidence: fileHash(join(f.calls[8].dir, 'candidate-evidence.json')), candidate_patch: fileHash(join(f.calls[8].dir, 'candidate.patch')), state: fileHash(join(f.options.output, 'state.json')), implementation: state.definition.implementation_sha256, session: state.session,
    run: fileHash(join(f.calls[8].dir, 'run.json')), events: fileHash(join(f.calls[8].dir, 'events.jsonl')), observations: fileHash(join(f.calls[8].dir, 'bridge-conditions.json')), second_receipt: state.repeated_metadata_adjudication };
  f.deps.implementationHash = async () => '9'.repeat(64); return f;
}
test('third recovery refuses to alter scheduling without a valid independent no-solution proof', async () => {
  const f = await noSolutionFixture(); let attempted = 0;
  f.deps.createNoSolutionProof = async () => { attempted++; throw new Error('nonempty or unavailable verifier capture'); };
  const oldHash = fileHash(join(f.options.output, 'state.json'));
  await assert.rejects(campaign.repairLunaNoSolutionStop(f.options, f.deps), CampaignError);
  assert.equal(attempted, 1); assert.equal(fileHash(join(f.options.output, 'state.json')), oldHash);
  assert.equal(f.calls.length, 9); assert.equal(readdirSync(f.options.output).includes('no-solution-state.json'), false);
});

async function installSyntheticEmptyCapture(f, call) {
  const { prepareCandidateBaseline, releaseCandidateBaseline, captureCandidate, bindCandidateToRun } = await import('../packages/runner/src/candidate-evidence.ts');
  const taskDir = call.taskDir; const workspace = join(taskDir, 'workspace'); mkdirSync(workspace, { recursive: true });
  writeFileSync(join(workspace, 'source.txt'), 'unchanged source\n'); writeFileSync(join(workspace, '.gitignore'), 'node_modules/\n');
  writeFileSync(join(taskDir, 'task.yaml'), `id: ${call.task_id}\nsource:\n  kind: ${call.task_source}\n  repository: ${call.task_repository}\n  revision: ${call.task_revision}\n  task_id: ${call.task_id}\n  license_notes: fixture\n  base_revision: "${call.task_base_revision}"\nlanguage: typescript\nsize: small\nshape: feature\ntimeout_s: 10800\nexpected_minutes: [16, 180]\ndescription: fixture\n`);
  writeFileSync(join(taskDir, 'environment.json'), JSON.stringify({ agent_images: call.environment.agent_images }));
  const verifier = { ...call.verifier, command: ['sh', '-c', 'test -s /tmp/logs/artifacts/model.patch'] };
  for (const dir of [taskDir, call.dir]) writeFileSync(join(dir, 'verifier.json'), JSON.stringify(verifier));
  const baseline = prepareCandidateBaseline(workspace); assert.equal(baseline.status, 'ready');
  const candidate = join(f.root, 'synthetic-candidate'); mkdirSync(candidate); writeFileSync(join(candidate, 'source.txt'), 'unchanged source\n'); writeFileSync(join(candidate, '.gitignore'), 'node_modules/\n');
  mkdirSync(join(candidate, 'node_modules')); symlinkSync('/app/node_modules/example', join(candidate, 'node_modules/example'));
  rmSync(join(call.dir, 'candidate-evidence.json')); rmSync(join(call.dir, 'candidate.patch'), { force: true });
  const evidence = captureCandidate({ dir: call.dir, workspace: candidate, baseline, runId: call.run_id, taskId: call.task_id, baseRevision: call.task_base_revision, taskRevision: call.task_revision, agentImage: digest, verifierImage: digest });
  releaseCandidateBaseline(baseline); assert.equal(evidence.status, 'captured'); bindCandidateToRun(call.dir, evidence, readFileSync(join(call.dir, 'run.json')));
  if (f.deps.noSolutionPins) Object.assign(f.deps.noSolutionPins, { candidate_evidence: fileHash(join(call.dir, 'candidate-evidence.json')), candidate_patch: fileHash(join(call.dir, 'candidate.patch')) });
  let captures = 0;
  f.deps.createNoSolutionProof = async args => {
    const { createNoSolutionProof } = await import('./s7-luna-no-solution.mjs');
    return createNoSolutionProof(args, { capture: async ({ outputDir }) => { captures++; writeFileSync(join(outputDir, 'model.patch'), '');
      return { exitCode: 0, helperSha256: 'sha256:0e765789f08663ae455e14cf8a2db1186969310e59d5d55650b762e3d8789ddf', baseRevision: call.task_base_revision }; } });
  };
  return () => captures;
}
test('third recovery binds empty-verifier-patch proof and preserves all nine consumed cells and earlier receipt epochs', async () => {
  const f = await noSolutionFixture(); const captures = await installSyntheticEmptyCapture(f, f.calls[8]);
  const original = f.calls.map(c => Object.fromEntries(readdirSync(c.dir).filter(name => name !== 'workspace').map(name => [name, fileHash(join(c.dir, name))])));
  const earlier = ['legacy-metadata-state.json', 'legacy-metadata-adjudication.json', 'repeated-metadata-state.json', 'repeated-metadata-adjudication.json'].map(name => [name, fileHash(join(f.options.output, name))]);
  const state = await campaign.repairLunaNoSolutionStop(f.options, f.deps);
  assert.equal(state.halted, false); assert.equal(state.cells[8].failure_reason, 'no_solution_produced'); assert.equal(state.cells.filter(c => c.status === 'pending').length, 191); assert.equal(captures(), 1);
  assert.deepEqual(state.cells.slice(0, 9).map(c => c.original_implementation_sha256), ['a', 'a', 'e', 'e', 'e', 'e', 'f', 'f', 'f'].map(s => s.repeat(64)));
  for (const [name, hash] of earlier) assert.equal(fileHash(join(f.options.output, name)), hash);
  for (let i = 0; i < 9; i++) for (const [name, hash] of Object.entries(original[i])) assert.equal(fileHash(join(f.calls[i].dir, name)), hash);
  assert.equal(read(join(f.calls[8].dir, 'run.json')).outcome, 'verify_error');
  const consumed = f.calls.map(c => c.run_id); f.deps.runCell = async spec => { assert.ok(!consumed.includes(spec.run_id)); throw new Error('stop synthetic continuation'); };
  const resumed = await runCampaign(f.options, f.deps); assert.equal(resumed.cells[9].status, 'blocked'); assert.equal(captures(), 1);
  rmSync(join(f.calls[8].dir, 'no-solution-proof.json')); await assert.rejects(runCampaign(f.options, f.deps), CampaignError);
});
test('general no-solution admission requires complete C1 and validates proof on each resume', async () => {
  const f = fixture(c => { taskFailure(c); if (c.index === 0) c.footer = ''; }); const execute = f.deps.runCell; let captures;
  f.deps.runCell = async spec => { const result = await execute(spec); if (f.calls.length === 1) captures = await installSyntheticEmptyCapture(f, spec); return result; };
  const state = await runCampaign({ ...f.options, harnesses: ['codex'] }, f.deps); assert.equal(state.halted, false); assert.equal(f.calls.length, 40); assert.equal(captures(), 1);
  assert.equal(state.cells[0].failure_reason, 'no_solution_produced');
  await runCampaign({ ...f.options, harnesses: ['codex'] }, f.deps); assert.equal(captures(), 1); assert.equal(f.calls.length, 40);
  const path = join(f.calls[0].dir, 'no-solution-proof.json'); chmodSync(path, 0o600); const proof = read(path); proof.model_patch_bytes = 1; writeFileSync(path, JSON.stringify(proof));
  await assert.rejects(runCampaign(f.options, f.deps), CampaignError);
  const bad = fixture(c => { c.run.outcome = 'verify_error'; c.run.verification.exit = 1; c.event.usage = null; c.event.usage_source = 'unavailable'; });
  let attempted = 0; bad.deps.createNoSolutionProof = async () => { attempted++; throw new Error('should never capture'); };
  assert.equal((await runCampaign(bad.options, bad.deps)).halted, true); assert.equal(attempted, 0);
});

test('third recovery rejects arbitrary pins, bad accounting and loss anywhere in its receipt chain', async () => {
  for (const mutation of ['production', 'provider', 'source', 'candidate']) {
    const f = await noSolutionFixture(); let captures = 0; f.deps.createNoSolutionProof = async () => { captures++; throw new Error('not eligible'); };
    if (mutation === 'production') delete f.deps.noSolutionPins;
    if (mutation === 'candidate') writeFileSync(join(f.calls[8].dir, 'candidate.patch'), 'changed after historical capture');
    if (mutation === 'provider') { const path = join(f.calls[8].dir, 'events.jsonl'); const rows = readFileSync(path, 'utf8').trim().split('\n').map(JSON.parse); rows[0].status = 429; writeFileSync(path, rows.map(JSON.stringify).join('\n') + '\n'); f.deps.noSolutionPins.events = fileHash(path); }
    if (mutation === 'source') { const load = f.deps.loadTasks; f.deps.loadTasks = async () => { const loaded = await load(); loaded.tasks[4].baseRevision = '8'.repeat(40); return loaded; }; }
    await assert.rejects(campaign.repairLunaNoSolutionStop(f.options, f.deps), CampaignError); assert.equal(captures, 0); assert.equal(read(join(f.options.output, 'state.json')).halted, true);
  }
  for (const name of ['legacy-metadata-state.json', 'legacy-metadata-adjudication.json', 'repeated-metadata-state.json', 'repeated-metadata-adjudication.json', 'no-solution-state.json', 'no-solution-adjudication.json']) {
    const f = await noSolutionFixture(); await installSyntheticEmptyCapture(f, f.calls[8]); await campaign.repairLunaNoSolutionStop(f.options, f.deps);
    rmSync(join(f.options.output, name)); await assert.rejects(runCampaign(f.options, f.deps), CampaignError); assert.equal(f.calls.length, 9);
  }
});

function transportFailure(c, denied = 1, detail = 'other side closed') {
  c.upstreamEvidence = true; c.eventCount = 3; c.eventOverrides = { 2: { status: 0, model_served: null, usage: null, usage_source: 'unavailable', error: { kind: 'network', detail } } };
  c.run.outcome = 'adapter_error'; c.run.adapter_result.exitCode = 1; c.run.verification.exit = 1; c.run.verification.duration_ms = 0; c.footer = '';
  c.observed.gate_refused = denied; c.observed.requests = Array.from({ length: 3 + denied }, (_, i) => ({ accepted: i < 3, model_matches: true, effort_low: true, summary_auto: true, store_false: true, reasoning_replay_absent: true, continuation_absent: true }));
}
test('typed terminal stream failure is unscored transport_failed without rerun, including varied local retry counts', async () => {
  for (const denied of [0, 1, 3]) {
    const f = fixture(c => { if (c.index === 0) transportFailure(c, denied, 'socket reset by peer'); });
    const state = await runCampaign({ ...f.options, harnesses: ['codex'] }, f.deps);
    assert.equal(state.halted, false); assert.equal(f.calls.length, 40); assert.equal(state.cells[0].status, 'transport_failed'); assert.equal(state.cells[0].accounting, 'incomplete');
    const run = read(join(f.calls[0].dir, 'run.json')); assert.equal(run.outcome, 'adapter_error'); assert.equal(run.spend_usd_estimate, null);
    await runCampaign({ ...f.options, harnesses: ['codex'] }, f.deps); assert.equal(f.calls.length, 40);
  }
});
test('transport exception never admits provider auth/quota/model errors, unexplained accounting or another forwarded request', async () => {
  for (const mutate of [c => c.eventOverrides[2].status = 429, c => c.eventOverrides[2].status = 401,
    c => c.eventOverrides[2].error = null, c => c.eventOverrides[2].error.kind = 'proxy_refused', c => c.eventOverrides[2].streamed = false,
    c => c.eventOverrides[2].t_upstream_sent = null, c => c.eventOverrides[2].model_served = 'different-model',
    c => c.eventOverrides[0] = { status: 429 }, c => c.eventOverrides[0] = { model_served: 'different-model' },
    c => c.eventOverrides[1] = c.eventOverrides[2], c => { c.eventOverrides[1] = c.eventOverrides[2]; delete c.eventOverrides[2]; },
    c => c.observed.requests.at(-1).accepted = true, c => c.observed.requests.at(-1).effort_low = false,
    c => c.observed.gate_refused++, c => c.upstreamEvidence = false,
    c => c.changeUpstream = rows => rows.at(-1).upstream_status = 429, c => c.changeUpstream = rows => rows.at(-1).upstream_status = 401,
    c => c.changeUpstream = rows => rows.at(-1).c1_sha256 = '0'.repeat(64), c => c.changeUpstream = rows => rows.push(rows.at(-1)), c => c.changeUpstream = rows => rows.at(-1).error = 'upstream_error', c => c.observed.front_refused = 1, c => c.run.verification.duration_ms = 1, c => c.footer = 'unexpected verifier output']) {
    const f = fixture(c => { transportFailure(c); mutate(c); });
    const state = await runCampaign(f.options, f.deps); assert.equal(state.halted, true); assert.equal(f.calls.length, 1); assert.equal(state.cells[0].status, 'blocked');
  }
});
test('two consecutive transport failures halt, persist across resume, and use actual admission order across harness subsets', async () => {
  const consecutive = fixture(c => transportFailure(c));
  const stopped = await runCampaign(consecutive.options, consecutive.deps); assert.equal(stopped.halted, true); assert.equal(consecutive.calls.length, 2);
  assert.equal(stopped.halt_reason, 'consecutive-transport-failures'); assert.equal(stopped.cells.filter(c => c.status === 'transport_failed').length, 2);
  await runCampaign(consecutive.options, consecutive.deps); assert.equal(consecutive.calls.length, 2);
  const subsets = fixture(c => { if (c.index === 39 || c.index === 40) transportFailure(c); });
  const first = await runCampaign({ ...subsets.options, harnesses: ['codex'] }, subsets.deps); assert.equal(first.halted, false); assert.equal(subsets.calls.length, 40);
  const second = await runCampaign({ ...subsets.options, harnesses: ['hermes'] }, subsets.deps); assert.equal(second.halted, true); assert.equal(subsets.calls.length, 41);
  const broken = fixture(c => { if (c.index === 0 || c.index === 2) transportFailure(c); });
  assert.equal((await runCampaign({ ...broken.options, harnesses: ['codex'] }, broken.deps)).halted, false); assert.equal(broken.calls.length, 40);
});

async function transportStoppedFixture(existing) {
  const f = await noSolutionFixture(existing); await installSyntheticEmptyCapture(f, f.calls[8]); await campaign.repairLunaNoSolutionStop(f.options, f.deps);
  f.setChange(c => { if (c.index !== 10) taskFailure(c); if (c.index === 20) { transportFailure(c); c.eventCount = 17; c.eventOverrides = { 16: c.eventOverrides[2] }; c.observed.requests = Array.from({ length: 18 }, (_, i) => ({ accepted: i < 17, model_matches: true, effort_low: true, summary_auto: true, store_false: true, reasoning_replay_absent: true, continuation_absent: true })); } });
  const execute = f.deps.runCell; f.deps.runCell = async spec => { const result = await execute(spec); if (f.calls.length === 21) throw new Error('original interruption stop'); return result; };
  const old = await runCampaign(f.options, f.deps); assert.equal(f.calls.length, 21); assert.equal(old.cells[20].status, 'blocked');
  f.deps.transportPins = { state: fileHash(join(f.options.output, 'state.json')), implementation: old.definition.implementation_sha256, session: old.session,
    run: fileHash(join(f.calls[20].dir, 'run.json')), events: fileHash(join(f.calls[20].dir, 'events.jsonl')), observations: fileHash(join(f.calls[20].dir, 'bridge-conditions.json')),
    upstream: fileHash(join(f.calls[20].dir, 'events.jsonl.upstream.jsonl')), candidate_evidence: fileHash(join(f.calls[20].dir, 'candidate-evidence.json')),
    candidate_patch: null, third_receipt: old.no_solution_adjudication };
  f.deps.implementationHash = async () => '8'.repeat(64); return f;
}
test('transport recovery preserves21 consumed slots and prior epochs, continues179 pending and never replays the interrupted attempt', async () => {
  const f = await transportStoppedFixture(); const before = f.calls.map(c => Object.fromEntries(readdirSync(c.dir).map(name => [name, fileHash(join(c.dir, name))])));
  const receipts = readdirSync(f.options.output).filter(n => /(?:state|adjudication)\.json$/.test(n) && n !== 'state.json').map(n => [n, fileHash(join(f.options.output, n))]);
  const state = await campaign.repairLunaTransportStop(f.options, f.deps); assert.equal(state.halted, false);
  assert.equal(state.cells[20].status, 'transport_failed'); assert.equal(state.cells[20].accounting, 'incomplete'); assert.equal(state.cells.filter(c => c.status === 'pending').length, 179);
  assert.equal(state.cells.filter(c => c.status === 'completed').length, 1); assert.equal(state.cells.filter(c => c.status === 'task_failed').length, 19);
  assert.deepEqual(state.cells.slice(9, 21).map(c => c.original_implementation_sha256), Array(12).fill('9'.repeat(64)));
  assert.deepEqual(state.admission_order, state.cells.slice(0, 21).map(c => c.run_id));
  for (const [n, h] of receipts) assert.equal(fileHash(join(f.options.output, n)), h);
  for (let i = 0; i < 21; i++) for (const [n, h] of Object.entries(before[i])) assert.equal(fileHash(join(f.calls[i].dir, n)), h);
  const consumed = f.calls.map(c => c.run_id); f.deps.runCell = async spec => { assert.ok(!consumed.includes(spec.run_id)); throw new Error('stop synthetic continuation'); };
  assert.equal((await runCampaign(f.options, f.deps)).cells[21].status, 'blocked'); await assert.rejects(campaign.repairLunaTransportStop(f.options, f.deps), CampaignError);
});
test('transport recovery and resumes refuse arbitrary state, bad terminal HTTP evidence and receipt/order tampering', async () => {
  for (const mutation of ['production', 'upstream']) {
    const f = await transportStoppedFixture(); if (mutation === 'production') delete f.deps.transportPins;
    else { const p = join(f.calls[20].dir, 'events.jsonl.upstream.jsonl'); const rows = readFileSync(p, 'utf8').trim().split('\n').map(JSON.parse); rows.at(-1).upstream_status = 429; writeFileSync(p, rows.map(JSON.stringify).join('\n') + '\n'); f.deps.transportPins.upstream = fileHash(p); }
    await assert.rejects(campaign.repairLunaTransportStop(f.options, f.deps), CampaignError); assert.equal(read(join(f.options.output, 'state.json')).halted, true);
  }
  for (const name of ['transport-state.json', 'transport-adjudication.json', 'no-solution-state.json', 'no-solution-adjudication.json', 'legacy-metadata-adjudication.json', 'repeated-metadata-adjudication.json']) {
    const f = await transportStoppedFixture(); await campaign.repairLunaTransportStop(f.options, f.deps); rmSync(join(f.options.output, name));
    await assert.rejects(runCampaign(f.options, f.deps), CampaignError); assert.equal(f.calls.length, 21);
  }
  const f = fixture(); await runCampaign({ ...f.options, harnesses: ['codex'] }, f.deps); const p = join(f.options.output, 'state.json'); const s = read(p); s.admission_order.pop(); writeFileSync(p, JSON.stringify(s));
  await assert.rejects(runCampaign(f.options, f.deps), CampaignError); assert.equal(f.calls.length, 40);
});

test('missing local images pause before setup consumes a slot and can be rechecked without replay', async () => {
  const f = fixture(); f.deps.preflightImages = async () => { throw new Error('missing immutable image'); };
  const paused = await runCampaign(f.options, f.deps); assert.equal(paused.preflight_blocked, true); assert.equal(paused.halted, false);
  assert.equal(paused.cells.every(c => c.status === 'pending'), true); assert.equal(paused.admission_order.length, 0); assert.equal(f.calls.length, 0); assert.equal(f.factories.length, 0);
  let checks = 0; f.deps.preflightImages = async () => { if (++checks === 3) throw new Error('image disappeared after prior attempt'); };
  const later = await runCampaign({ ...f.options, harnesses: ['codex'] }, f.deps); assert.equal(later.preflight_blocked, true); assert.equal(f.calls.length, 1); assert.equal(later.admission_order.length, 1);
  f.deps.preflightImages = async () => {};
  const resumed = await runCampaign({ ...f.options, harnesses: ['codex'] }, f.deps); assert.equal(resumed.preflight_blocked, false); assert.equal(f.calls.length, 40);
});
test('Docker image preflight checks selected pending tag identities and pinned runtime without pulls', async () => {
  const f = fixture(); const { tasks } = await f.deps.loadTasks(); const slots = [{ task: TASK_IDS[0], harness: 'codex' }]; let requested;
  const inspect = async images => { requested = images; return images.map(image => ({ Id: digest, RepoDigests: image.includes('@sha256:') ? [image] : [] })); };
  await campaign.preflightLunaImages({ tasks, slots }, { inspect }); assert.equal(requested.length, 3); assert.ok(requested.some(i => i.startsWith('golang@sha256:')));
  await assert.rejects(campaign.preflightLunaImages({ tasks, slots }, { inspect: async images => (await inspect(images)).map((row, i) => i === 1 ? { ...row, Id: `sha256:${'8'.repeat(64)}` } : row) }), CampaignError);
  await assert.rejects(campaign.preflightLunaImages({ tasks, slots }, { inspect: async () => [] }), CampaignError);
});

const cliVersions = { codex: '0.149.1', hermes: '0.20.5', cline: '3.0.61', pi: '0.73.1', qwen: '0.22.2' };
async function generationFixture() {
  const f = fixture(); const { tasks } = await f.deps.loadTasks(); const newer = join(f.root, 'rebuilt'); mkdirSync(newer);
  for (const task of tasks) {
    mkdirSync(join(task.taskDir, 'workspace'), { recursive: true }); writeFileSync(join(task.taskDir, 'workspace', 'source.txt'), task.id);
    writeFileSync(join(task.taskDir, 'task.yaml'), `id: ${task.id}\n`); writeFileSync(join(task.taskDir, 'prompt.md'), `Solve ${task.id}\n`);
    writeFileSync(join(task.taskDir, 'environment.json'), JSON.stringify({ agent_images: task.environment.agent_images })); writeFileSync(join(task.taskDir, 'verifier.json'), JSON.stringify(task.verifier));
  }
  mkdirSync(join(f.options.taskRoot, 'reference-polarity')); for (const t of tasks) writeFileSync(join(f.options.taskRoot, 'reference-polarity', `${t.id}.json`), JSON.stringify({ task_id: t.id, samples: 5, exit_codes: [0,0,0,0,0], reference_passed: true }));
  const source = { version: 1, revision: 'same', review: { reviewed: false }, tasks: tasks.map(t => ({ id: t.id, path: `tasks/${t.id}`, source_task_id: t.id, language: 'python', timeout_s: 10800, expected_minutes: [16,180], checksum: 'old', reference_polarity_sha256: 'old', agent_images: t.environment.agent_images, environment_image: 'old', environment_image_digest: digest, verifier_image: t.verifier.image, verifier_image_digest: digest })) };
  const suite = { version: 1, source_provenance: { source_manifest_sha256: 'old', revision: 'same' }, tasks: tasks.map(t => ({ id: t.id, source: t.source, checksum: 'old', source_binding: { path: `tasks/${t.id}`, source_checksum: 'old' } })) };
  writeFileSync(join(f.options.taskRoot, 'deepswe-source-manifest.json'), JSON.stringify(source)); writeFileSync(join(f.options.taskRoot, 'suite-manifest.json'), JSON.stringify(suite));
  cpSync(f.options.taskRoot, newer, { recursive: true });
  const newTasks = tasks.map(t => ({ ...structuredClone(t), taskDir: join(newer, t.id), environment: { ...t.environment, agent_images: Object.fromEntries(HARNESS_ORDER.map(h => [h, { image: `rebuilt-${h}`, image_digest: `sha256:${'3'.repeat(64)}` }])) }, verifier: { ...t.verifier, image: 'rebuilt-verifier', image_digest: `sha256:${'3'.repeat(64)}` } }));
  for (const t of newTasks) { writeFileSync(join(t.taskDir, 'environment.json'), JSON.stringify({ agent_images: t.environment.agent_images })); writeFileSync(join(t.taskDir, 'verifier.json'), JSON.stringify(t.verifier)); }
  const newSource = structuredClone(source); for (const t of newSource.tasks) { const n = newTasks.find(x => x.id === t.id); Object.assign(t, { agent_images: n.environment.agent_images, environment_image: 'rebuilt-env', environment_image_digest: n.verifier.image_digest, verifier_image: n.verifier.image, verifier_image_digest: n.verifier.image_digest, reference_polarity_sha256: 'new' }); }
  const newSuite = structuredClone(suite); newSuite.source_provenance.source_manifest_sha256 = 'new'; for (const t of newSuite.tasks) { t.checksum = 'new'; }
  writeFileSync(join(newer, 'deepswe-source-manifest.json'), JSON.stringify(newSource)); writeFileSync(join(newer, 'suite-manifest.json'), JSON.stringify(newSuite));
  return { ...f, tasks, newTasks, newer };
}
test('prepared generation equivalence permits images only and rejects prompt, workspace, task and verifier semantic drift', async () => {
  const f = await generationFixture(); const args = { oldRoot: f.options.taskRoot, newRoot: f.newer, oldTasks: f.tasks, newTasks: f.newTasks, cliVersions };
  const proof = campaign.comparePreparedGenerations(args); assert.equal(proof.tasks.length, 8);
  for (const file of ['prompt.md', 'task.yaml', 'workspace/source.txt']) { const p = join(f.newer, TASK_IDS[0], file); const bytes = readFileSync(p); writeFileSync(p, 'changed'); assert.throws(() => campaign.comparePreparedGenerations(args), CampaignError); writeFileSync(p, bytes); }
  for (const [file, mutate] of [
    ['deepswe-source-manifest.json', value => value.tasks[0].checksum = 'different-upstream'],
    ['suite-manifest.json', value => value.tasks[0].source_binding.source_checksum = 'different-upstream'],
    [`reference-polarity/${TASK_IDS[0]}.json`, value => value.source_task_checksum = 'different-upstream'],
  ]) { const path = join(f.newer, file), bytes = readFileSync(path), value = read(path); mutate(value); writeFileSync(path, JSON.stringify(value)); assert.throws(() => campaign.comparePreparedGenerations(args), CampaignError); writeFileSync(path, bytes); }
  assert.throws(() => campaign.comparePreparedGenerations({ ...args, cliVersions: { ...cliVersions, codex: 'different' } }), CampaignError);
  const p = join(f.newer, TASK_IDS[0], 'verifier.json'); const v = read(p); v.command = ['changed']; writeFileSync(p, JSON.stringify(v)); assert.throws(() => campaign.comparePreparedGenerations(args), CampaignError);
});

async function environmentStoppedFixture() {
  const f = await generationFixture();
  const pins = root => ({ suiteSha256: fileHash(join(root, 'suite-manifest.json')), sourceSha256: fileHash(join(root, 'deepswe-source-manifest.json')) });
  f.deps.loadTasks = async ({ taskRoot }) => ({ tasks: taskRoot === f.newer ? f.newTasks : f.tasks, ...pins(taskRoot) });
  await transportStoppedFixture(f); await campaign.repairLunaTransportStop(f.options, f.deps);
  // Copy the finalized old prepared files, including the no-solution fixture's
  // source-owned capture command; only image identities change in the new tree.
  for (const t of f.tasks) {
    const target = f.newTasks.find(n => n.id === t.id); rmSync(target.taskDir, { recursive: true }); cpSync(t.taskDir, target.taskDir, { recursive: true });
    writeFileSync(join(target.taskDir, 'environment.json'), JSON.stringify({ agent_images: target.environment.agent_images }));
    writeFileSync(join(target.taskDir, 'verifier.json'), JSON.stringify({ ...read(join(t.taskDir, 'verifier.json')), image: target.verifier.image, image_digest: target.verifier.image_digest }));
  }
  f.deps.runCell = async spec => {
    cpSync(join(spec.taskDir, 'workspace'), join(spec.dir, 'workspace'), { recursive: true });
    for (const name of ['prompt.md', 'verifier.json']) cpSync(join(spec.taskDir, name), join(spec.dir, name));
    for (const name of ['events.jsonl', 'events.jsonl.upstream.jsonl']) writeFileSync(join(spec.dir, name), '');
    writeFileSync(join(spec.dir, 'bridge-conditions.json'), JSON.stringify({ schema_version: 1, requests: [], front_refused: 0, gate_refused: 0, front_rejections: [], front_rejections_truncated: 0, front_metadata_counts: countsFor([]), front_unclassified_refused: 0 }));
    throw new Error('missing image before factory returned');
  };
  const stopped = await runCampaign(f.options, f.deps); assert.equal(stopped.cells[21].status, 'blocked'); assert.equal(f.calls.length, 21);
  const oldRoot = f.options.taskRoot;
  const proof = { status: 'verified', old_root: oldRoot, new_root: f.newer, old_suite_manifest_sha256: pins(oldRoot).suiteSha256, suite_manifest_sha256: pins(f.newer).suiteSha256,
    old_source_manifest_sha256: pins(oldRoot).sourceSha256, source_manifest_sha256: pins(f.newer).sourceSha256,
    old_canonical_source_manifest_sha256: pins(oldRoot).sourceSha256, canonical_source_manifest_sha256: pins(f.newer).sourceSha256,
    archive_sha256: '7'.repeat(64), cli_versions: cliVersions, cli_image_ids: Object.fromEntries(HARNESS_ORDER.map(h => [h, digest])),
    tasks: f.tasks.map(t => ({ task_id: t.id, prompt_sha256: fileHash(join(t.taskDir, 'prompt.md')), workspace_revision: t.baseRevision, timeout_s: t.timeoutS, expected_minutes: [16,180], verifier_behavior_unchanged: true,
      old_verifier_image: t.verifier.image_digest, new_verifier_image: f.newTasks.find(n => n.id === t.id).verifier.image_digest, reference_polarity_sha256: fileHash(join(f.newer, 'reference-polarity', `${t.id}.json`)) })) };
  const proofPath = join(f.root, 'restoration.json'); writeFileSync(proofPath, JSON.stringify(proof));
  f.repairOptions = { ...f.options, taskRoot: f.newer, previousTaskRoot: oldRoot, restorationProofPath: proofPath, expectedRestorationProofSha256: fileHash(proofPath), expectedStateSha256: fileHash(join(f.options.output, 'state.json')) };
  f.deps.implementationHash = async () => '6'.repeat(64); return f;
}
test('image generation transition archives only zero-activity setup and preserves21 paid cells, old proof context and179 pending', async () => {
  const f = await environmentStoppedFixture(); const old = read(join(f.options.output, 'state.json'));
  const receipts = readdirSync(f.options.output).filter(n => /(?:state|adjudication)\.json$/.test(n) && n !== 'state.json').map(n => [n, fileHash(join(f.options.output, n))]);
  const next = await campaign.repairLunaEnvironmentSetup(f.repairOptions, f.deps);
  assert.deepEqual(next.cells.slice(0, 21), old.cells.slice(0, 21)); assert.equal(next.cells.filter(c => c.status === 'pending').length, 179);
  assert.equal(next.halted, false); assert.equal(next.admission_order.length, 21); assert.equal(f.calls.length, 21);
  assert.equal(fileHash(join(f.options.output, 'environment-state.json')), f.repairOptions.expectedStateSha256);
  for (const [n,h] of receipts) assert.equal(fileHash(join(f.options.output, n)), h);
  const receipt = read(join(f.options.output, 'environment-adjudication.json')); assert.equal(receipt.preserved_run_ids.length, 21);
  assert.equal(existsSync(join(f.options.output, 'results', 'hermes', TASK_IDS[2], '1')), false);
  assert.ok(existsSync(join(f.options.output, receipt.setup_archive, 'bridge-conditions.json')));
  let invoked = 0; f.deps.runCell = async spec => { invoked++; assert.equal(spec.run_id, old.cells[21].run_id); assert.equal(spec.taskDir, join(f.newer, TASK_IDS[2])); assert.equal(spec.verifier.image_digest, f.newTasks[2].verifier.image_digest); throw new Error('synthetic stop before inference'); };
  const resumed = await runCampaign(f.repairOptions, f.deps); assert.equal(invoked, 1); assert.equal(resumed.cells[21].environment_generation, next.environment_adjudication);
  await runCampaign(f.repairOptions, f.deps); assert.equal(invoked, 1);
  writeFileSync(join(f.options.output, receipt.setup_archive, 'events.jsonl'), '{}');
  await assert.rejects(runCampaign(f.repairOptions, f.deps), CampaignError);
});
test('environment recovery refuses unsafe setup, semantic/proof drift and missing images before any archive or reset', async () => {
  for (const mutation of ['activity', 'native', 'proof', 'state', 'root', 'semantic', 'images', 'schedule']) {
    const f = await environmentStoppedFixture(); const dir = join(f.options.output, 'results', 'hermes', TASK_IDS[2], '1');
    if (mutation === 'activity') writeFileSync(join(dir, 'events.jsonl'), '{}');
    if (mutation === 'native') writeFileSync(join(dir, 'transport.json'), '{}');
    if (mutation === 'proof') f.repairOptions.expectedRestorationProofSha256 = '0'.repeat(64);
    if (mutation === 'state') f.repairOptions.expectedStateSha256 = '0'.repeat(64);
    if (mutation === 'root') f.repairOptions.previousTaskRoot = f.newer;
    if (mutation === 'semantic') writeFileSync(join(f.newer, TASK_IDS[0], 'prompt.md'), 'changed');
    if (mutation === 'schedule') { const path = join(f.options.output, 'state.json'); const state = read(path); state.cells[199].rep = 6; writeFileSync(path, JSON.stringify(state)); f.repairOptions.expectedStateSha256 = fileHash(path); }
    const expectedState = fileHash(join(f.options.output, 'state.json'));
    if (mutation === 'images') f.deps.preflightImages = async () => { throw new Error('missing image'); };
    await assert.rejects(campaign.repairLunaEnvironmentSetup(f.repairOptions, f.deps), CampaignError);
    assert.equal(fileHash(join(f.options.output, 'state.json')), expectedState); assert.equal(existsSync(join(f.options.output, 'environment-state.json')), false); assert.equal(existsSync(dir), true); assert.equal(f.calls.length, 21);
  }
});

test('generation orphan admission is marked and receipt or archived-state loss remains fail closed', async () => {
  const f = await environmentStoppedFixture(); const next = await campaign.repairLunaEnvironmentSetup(f.repairOptions, f.deps);
  const dir = join(f.options.output, 'results', 'hermes', TASK_IDS[2], '1'); mkdirSync(dir); writeFileSync(join(dir, 'retained'), 'orphan');
  let calls = 0; f.deps.runCell = async () => { calls++; throw new Error('must not run'); };
  const halted = await runCampaign(f.repairOptions, f.deps); assert.equal(halted.cells[21].environment_generation, next.environment_adjudication); assert.equal(halted.halted, true); assert.equal(calls, 0);
  await runCampaign(f.repairOptions, f.deps); assert.equal(calls, 0); assert.equal(readFileSync(join(dir, 'retained'), 'utf8'), 'orphan');
  for (const name of ['environment-adjudication.json', 'environment-state.json', 'environment-restoration-proof.json', 'legacy-metadata-adjudication.json']) {
    const path = join(f.options.output, name), bytes = readFileSync(path); rmSync(path); await assert.rejects(runCampaign(f.repairOptions, f.deps)); writeFileSync(path, bytes, { mode: 0o400 });
  }
});
