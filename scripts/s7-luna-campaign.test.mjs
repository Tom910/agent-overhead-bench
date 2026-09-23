import assert from 'node:assert/strict';
import { test, afterEach } from 'node:test';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
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
    platform: 'linux', hostFingerprint: async () => 'd'.repeat(64), implementationHash: async () => 'a'.repeat(64),
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
      const context = { run, event, spec, index: calls.length - 1, footer: '' }; change?.(context);
      writeFileSync(join(spec.dir, 'events.jsonl'), JSON.stringify(event) + '\n');
      writeFileSync(join(spec.dir, 'verify.log'), context.footer);
      writeFileSync(join(spec.dir, 'run.json'), JSON.stringify(run));
      writeFileSync(join(spec.dir, 'execution-conditions.json'), '{}');
      writeFileSync(join(spec.dir, 'candidate-evidence.json'), '{}');
      writeFileSync(join(spec.dir, 'transport.json'), JSON.stringify({ model: spec.model, policy: 'luna-low-reasoning-replay-disabled',
        bridge_binary_sha256: createHash('sha256').update(readFileSync(options.bridgeBinary)).digest('hex'), refresh_token_imported: false,
        subscription_usd: null, timeout_s: 10800, max_model_requests: 512, max_input_tokens: 100000000, max_output_tokens: 1000000 }));
      writeFileSync(join(spec.dir, 'bridge-conditions.json'), JSON.stringify({ front_refused: 0, gate_refused: 0, requests: [{ accepted: true,
        model_matches: true, effort_low: true, summary_auto: true, store_false: true, reasoning_replay_absent: true, continuation_absent: true }] }));
      return run;
    },
    progress: () => {},
  };
  return { root, options, deps, calls, factories };
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
