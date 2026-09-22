import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { createHash } from 'node:crypto';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync, statSync, symlinkSync, chmodSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import { prepareContinuation, ContinuationError } from './s2-codex-bridge-continuation.mjs';

const roots = [];
const evidence = new URL('../plans/s2-evidence/codex-bridge/live-qualification/', import.meta.url);
const bytes = name => readFileSync(new URL(name, evidence));
const sha = value => createHash('sha256').update(value).digest('hex');
const save = (path, value) => writeFileSync(path, JSON.stringify(value), { mode: 0o600 });
afterEach(() => { for (const path of roots.splice(0)) rmSync(path, { recursive: true, force: true }); });
function fixture() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'aob-continuation-'))); roots.push(root);
  const prior = join(root, 'prior'); const output = join(root, 'next');
  mkdirSync(prior, { mode: 0o700 }); mkdirSync(output, { mode: 0o700 }); mkdirSync(join(prior, 'codex'), { mode: 0o700 });
  const state = JSON.parse(bytes('initial-codex/state.json'));
  const events = bytes('initial-codex/codex/events.jsonl'); const observations = bytes('initial-codex/codex/observations.json');
  writeFileSync(join(prior, 'codex/events.jsonl'), events, { mode: 0o600 });
  writeFileSync(join(prior, 'codex/observations.json'), observations, { mode: 0o600 });
  const priorStatePath = join(prior, 'state.json'); save(priorStatePath, state);
  const mock = JSON.parse(bytes('mock/initial-passed-state.json')); const implementationHash = 'a'.repeat(64);
  mock.implementation_sha256 = implementationHash; const mockEvidencePath = join(root, 'mock.json'); save(mockEvidencePath, mock);
  const options = { priorStatePath, output, binaryHash: state.bridge_binary_sha256, implementationHash, mockEvidencePath };
  return { root, prior, state, mock, events, observations, options };
}
const reject = options => assert.throws(() => prepareContinuation(options), ContinuationError);

test('carries failed Codex evidence unchanged, reserves two requests and keeps public receipt path-free', () => {
  const f = fixture(); const before = readFileSync(f.options.priorStatePath);
  const { codexSlot, receipt } = prepareContinuation(f.options);
  assert.deepEqual(codexSlot, f.state.slots.codex); assert.equal(codexSlot.status, 'failed'); assert.equal(codexSlot.tokens, null);
  assert.equal(receipt.reserved_requests, 2); assert.equal(receipt.remaining_requests, 8);
  assert.equal(receipt.prior_state_sha256, sha(before)); assert.equal(receipt.prior_c1_sha256, sha(f.events));
  assert.equal(receipt.prior_observations_sha256, sha(f.observations));
  assert.equal(receipt.prior_implementation_sha256, f.state.implementation_sha256);
  assert.equal(receipt.implementation_sha256, f.options.implementationHash);
  assert.equal(receipt.mock_evidence_sha256, sha(readFileSync(f.options.mockEvidencePath)));
  assert.equal(JSON.stringify(receipt).includes(f.root), false);
  const carried = join(f.options.output, 'carried-codex');
  assert.equal(statSync(carried).mode & 0o777, 0o700);
  for (const [name, expected] of [['state.json', before], ['events.jsonl', f.events], ['observations.json', f.observations]]) {
    assert.deepEqual(readFileSync(join(carried, name)), expected); assert.equal(statSync(join(carried, name)).mode & 0o777, 0o600);
  }
  assert.deepEqual(readFileSync(f.options.priorStatePath), before);
  const claim = JSON.parse(readFileSync(join(f.prior, 'continuation-claim.json')));
  assert.equal(claim.destination, f.options.output); assert.equal(claim.source_state, f.options.priorStatePath);
  assert.equal(statSync(join(f.prior, 'continuation-claim.json')).mode & 0o777, 0o600);
});

test('one-use claim rejects both another destination and helper reinvocation at the same destination', () => {
  const f = fixture(); prepareContinuation(f.options); reject(f.options);
  const output = join(f.root, 'another'); mkdirSync(output, { mode: 0o700 }); reject({ ...f.options, output });
  assert.deepEqual(readdirSync(output), []);
});

test('a copy failure retains the one-use claim and cannot reopen the remaining allowance elsewhere', t => {
  const f = fixture(); const originalWrite = fs.writeFileSync; let writes = 0;
  t.mock.method(fs, 'writeFileSync', (...args) => { if (++writes === 2) throw new Error('synthetic private failure'); return originalWrite(...args); });
  syncBuiltinESMExports();
  try { reject(f.options); } finally { t.mock.restoreAll(); syncBuiltinESMExports(); }
  assert.equal(JSON.parse(readFileSync(join(f.prior, 'continuation-claim.json'))).reserved_requests, 2);
  const output = join(f.root, 'another'); mkdirSync(output, { mode: 0o700 }); reject({ ...f.options, output });
  assert.deepEqual(readdirSync(output), []);
});

test('rejects contradictory prior state, native result, image, cap and added slots before claiming', () => {
  const variants = [s => s.mode = 'mock', s => s.model = 'other', s => s.policy = 'other', s => s.halted = false,
    s => s.all_five_passed = true, s => s.max_total_requests = 12, s => s.max_requests_per_client = 3,
    s => s.slots.pi = {}, s => s.slots.codex.status = 'passed', s => s.slots.codex.exit = 1,
    s => s.slots.codex.marker_matches = false, s => s.slots.codex.tool_result_observed = false,
    s => s.slots.codex.image_id = `sha256:${'0'.repeat(64)}`, s => s.slots.codex.provider_requests = 3,
    s => s.slots.codex.served_models = ['other', null], s => s.slots.codex.usage_complete = true,
    s => s.slots.codex.tokens = { input: 0 }, s => s.slots.codex.halt = true];
  for (const mutate of variants) { const f = fixture(); mutate(f.state); save(f.options.priorStatePath, f.state); reject(f.options); assert.deepEqual(readdirSync(f.prior).sort(), ['codex', 'state.json']); }
});

test('rejects mismatched bytes and contradictory or additional provider attempts even with matching hashes', () => {
  const variants = [events => events.push({ ...events[1], seq: 2 }), events => events[0].status = 401,
    events => events[0].model_served = 'other', events => events[0].model_requested = 'other',
    events => events[0].error = { kind: 'proxy_refused' }, events => events[0].usage = { input: 0 },
    events => events[0].usage_source = 'provider', events => events[0].method = 'GET',
    events => events[0].protocol = 'openai_chat', events => events[1].seq = 0];
  for (const mutate of variants) {
    const f = fixture(); const events = f.events.toString().trim().split('\n').map(JSON.parse); mutate(events);
    const value = events.map(JSON.stringify).join('\n') + '\n'; writeFileSync(join(f.prior, 'codex/events.jsonl'), value);
    f.state.slots.codex.c1_sha256 = sha(value); save(f.options.priorStatePath, f.state); reject(f.options);
  }
  const f = fixture(); writeFileSync(join(f.prior, 'codex/events.jsonl'), f.events.toString() + '\n'); reject(f.options);
});

test('rejects missing or contradicted condition observations, including refusals', () => {
  for (const mutate of [o => o.requests.pop(), o => o.requests.push(o.requests[1]), o => o.gate_refused++, o => o.front_refused++,
    o => o.requests[0].effort_low = false, o => o.requests[1].accepted = false, o => o.requests[1].tool_result_observed = false]) {
    const f = fixture(); const o = JSON.parse(f.observations); mutate(o); const value = JSON.stringify(o);
    writeFileSync(join(f.prior, 'codex/observations.json'), value); f.state.slots.codex.condition_evidence_sha256 = sha(value);
    save(f.options.priorStatePath, f.state); reject(f.options);
  }
});

test('requires fresh all-five mock evidence with exact current binary, implementation, policy and images', () => {
  for (const mutate of [m => m.mode = 'live', m => m.all_five_passed = false, m => m.halted = true,
    m => m.implementation_sha256 = 'b'.repeat(64), m => m.bridge_binary_sha256 = 'b'.repeat(64),
    m => m.policy = 'other', m => delete m.slots.cline, m => m.slots.pi.status = 'failed',
    m => m.slots.codex.image_id = `sha256:${'b'.repeat(64)}`]) {
    const f = fixture(); mutate(f.mock); save(f.options.mockEvidencePath, f.mock); reject(f.options);
  }
});

test('rejects active source locks, symlink evidence, missing files, public output and preexisting carried data', () => {
  { const f = fixture(); writeFileSync(join(f.prior, 'runner.lock'), ''); reject(f.options); }
  { const f = fixture(); const file = join(f.prior, 'codex/events.jsonl'); rmSync(file); symlinkSync(f.options.mockEvidencePath, file); reject(f.options); }
  { const f = fixture(); rmSync(join(f.prior, 'codex/observations.json')); reject(f.options); }
  { const f = fixture(); chmodSync(f.options.output, 0o755); reject(f.options); }
  { const f = fixture(); mkdirSync(join(f.options.output, 'carried-codex')); reject(f.options); }
  { const f = fixture(); save(join(f.options.output, 'state.json'), {}); reject(f.options); }
});
