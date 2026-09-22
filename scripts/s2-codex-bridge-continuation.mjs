import { createHash } from 'node:crypto';
import { constants, openSync, closeSync, readSync, fstatSync, lstatSync, realpathSync, readFileSync, writeFileSync, fsyncSync, mkdirSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, isAbsolute, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LUNA_MODEL, CONTROLLED_POLICY } from './s2-codex-bridge-prepare.mjs';

export class ContinuationError extends Error {
  constructor() { super('Continuation evidence or one-use admission is invalid; inspect private artifacts before proceeding.'); this.name = 'ContinuationError'; }
}
const requireTrue = value => { if (!value) throw new ContinuationError(); };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const hash = value => createHash('sha256').update(value).digest('hex');
const validHash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const pair = (value, expected) => Array.isArray(value) && value.length === 2 && value.every(v => v === expected);
function absent(path) {
  try { lstatSync(path); return false; } catch (error) { if (error.code === 'ENOENT') return true; throw error; }
}
function privateDirectory(path) {
  const info = lstatSync(path);
  requireTrue(info.isDirectory() && !info.isSymbolicLink() && (info.mode & 0o077) === 0);
  return realpathSync(path);
}
function readEvidence(path, limit = 1024 * 1024) {
  const info = lstatSync(path);
  requireTrue(info.isFile() && !info.isSymbolicLink() && info.size > 0 && info.size <= limit);
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const before = fstatSync(fd); requireTrue(before.isFile() && before.ino === info.ino && before.dev === info.dev && before.size === info.size);
    const buffer = Buffer.alloc(limit + 1); let size = 0;
    while (size < buffer.length) { const count = readSync(fd, buffer, size, buffer.length - size, null); if (!count) break; size += count; }
    const after = fstatSync(fd);
    requireTrue(size === before.size && size <= limit && before.size === after.size && before.mtimeMs === after.mtimeMs && before.ctimeMs === after.ctimeMs);
    return buffer.subarray(0, size);
  } finally { closeSync(fd); }
}
const parse = bytes => JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
function privateWrite(path, value) {
  const fd = openSync(path, 'wx', 0o600);
  try { writeFileSync(fd, value); fsyncSync(fd); } finally { closeSync(fd); }
}
function basicState(state, mode, binaryHash, implementationHash) {
  requireTrue(object(state) && state.schema_version === 1 && state.mode === mode && state.host === 'linux'
    && state.model === LUNA_MODEL && state.policy === CONTROLLED_POLICY && state.bridge_binary_sha256 === binaryHash
    && validHash(state.implementation_sha256) && (implementationHash === undefined || state.implementation_sha256 === implementationHash)
    && state.max_requests_per_client === 2 && state.max_total_requests === 10 && object(state.slots)
    && typeof state.completed_at === 'string' && Number.isFinite(Date.parse(state.completed_at)));
}
function commonSlot(slot, client) {
  requireTrue(object(slot) && slot.image_id === client.image_id && slot.version === client.version
    && slot.provider_requests === 2 && slot.meter_events === 2 && slot.exit === 0 && slot.marker_matches === true
    && slot.tool_result_observed === true && slot.halt === false && slot.subscription_cost_usd === null
    && pair(slot.statuses, 200) && validHash(slot.c1_sha256) && validHash(slot.condition_evidence_sha256)
    && validHash(slot.config_sha256) && !Object.hasOwn(slot, 'local_error'));
}

/** Offline admission only. Claims survive copy failures; retries never silently reset allowance. */
export function prepareContinuation({ priorStatePath, output, binaryHash, implementationHash, mockEvidencePath } = {}) {
  try {
    requireTrue([priorStatePath, output, mockEvidencePath].every(p => typeof p === 'string' && p.length > 0)
      && validHash(binaryHash) && validHash(implementationHash));
    const priorDir = privateDirectory(dirname(resolve(priorStatePath)));
    const sourceState = join(priorDir, basename(priorStatePath));
    requireTrue(basename(sourceState) === 'state.json');
    const destination = privateDirectory(resolve(output));
    const within = (parent, child) => { const rel = relative(parent, child); return rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel); };
    const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    requireTrue(!within(priorDir, destination) && !within(destination, priorDir) && !within(root, destination));
    requireTrue(absent(join(priorDir, 'runner.lock')) && absent(join(destination, 'state.json')) && absent(join(destination, 'carried-codex')));
    privateDirectory(join(priorDir, 'codex'));
    const stateBytes = readEvidence(sourceState, 64 * 1024);
    const c1Bytes = readEvidence(join(priorDir, 'codex/events.jsonl'));
    const obsBytes = readEvidence(join(priorDir, 'codex/observations.json'), 256 * 1024);
    const mockBytes = readEvidence(mockEvidencePath, 256 * 1024);
    const state = parse(stateBytes); const observations = parse(obsBytes); const mock = parse(mockBytes);
    const clients = parse(readFileSync(new URL('../plans/s2-evidence/codex-bridge/native-smoke/sanitized-summary.json', import.meta.url))).clients;
    requireTrue(Array.isArray(clients) && clients.length === 5 && new Set(clients.map(c => c.harness)).size === 5);
    const codex = clients.find(c => c.harness === 'codex'); requireTrue(codex !== undefined);
    basicState(state, 'live', binaryHash);
    requireTrue(state.halted === true && state.all_five_passed === false && Object.keys(state.slots).length === 1 && object(state.slots.codex));
    const slot = state.slots.codex; commonSlot(slot, codex);
    requireTrue(slot.status === 'failed' && slot.passed === false && slot.tokens === null && slot.usage_complete === false
      && pair(slot.served_models, null) && slot.c1_sha256 === hash(c1Bytes) && slot.condition_evidence_sha256 === hash(obsBytes));
    const events = new TextDecoder('utf-8', { fatal: true }).decode(c1Bytes).trim().split('\n').map(line => JSON.parse(line));
    requireTrue(events.length === 2 && events.every((event, index) => object(event) && event.v === 1
      && event.run_id === 's2-luna-codex' && event.seq === index && event.method === 'POST' && event.path === '/responses'
      && event.protocol === 'openai_responses' && event.status === 200 && event.error === null
      && event.model_requested === LUNA_MODEL && event.model_served === null && event.usage === null && event.usage_source === 'unavailable'));
    const conditions = ['accepted', 'model_matches', 'effort_low', 'summary_auto', 'store_false', 'reasoning_replay_absent', 'continuation_absent'];
    requireTrue(object(observations) && observations.schema_version === 1 && observations.front_refused === 0 && observations.gate_refused === 0
      && Array.isArray(observations.requests) && observations.requests.length === 2
      && observations.requests.every(item => object(item) && conditions.every(key => item[key] === true))
      && observations.requests[0].tool_result_observed === false && observations.requests[1].tool_result_observed === true);
    basicState(mock, 'mock', binaryHash, implementationHash);
    requireTrue(mock.halted === false && mock.all_five_passed === true && Object.keys(mock.slots).length === 5);
    for (const client of clients) {
      const tested = mock.slots[client.harness]; commonSlot(tested, client);
      requireTrue(tested.status === 'passed' && tested.passed === true && tested.usage_complete === true
        && pair(tested.served_models, LUNA_MODEL) && object(tested.tokens)
        && ['input', 'cached_input', 'output', 'reasoning_output'].every(key => Number.isSafeInteger(tested.tokens[key]) && tested.tokens[key] >= 0));
    }
    const receipt = { schema_version: 1, prior_state_sha256: hash(stateBytes), prior_c1_sha256: hash(c1Bytes),
      prior_observations_sha256: hash(obsBytes), prior_implementation_sha256: state.implementation_sha256,
      implementation_sha256: implementationHash, bridge_binary_sha256: binaryHash, mock_evidence_sha256: hash(mockBytes),
      reserved_requests: 2, remaining_requests: 8 };
    // Refuse changed evidence before irrevocably reserving this continuation. No source file is rewritten.
    requireTrue(absent(join(priorDir, 'runner.lock')) && hash(readEvidence(sourceState, 64 * 1024)) === receipt.prior_state_sha256
      && hash(readEvidence(join(priorDir, 'codex/events.jsonl'))) === receipt.prior_c1_sha256
      && hash(readEvidence(join(priorDir, 'codex/observations.json'), 256 * 1024)) === receipt.prior_observations_sha256);
    privateWrite(join(priorDir, 'continuation-claim.json'), `${JSON.stringify({ ...receipt, source_state: sourceState, destination })}\n`);
    const carried = join(destination, 'carried-codex'); mkdirSync(carried, { mode: 0o700 });
    privateWrite(join(carried, 'state.json'), stateBytes);
    privateWrite(join(carried, 'events.jsonl'), c1Bytes);
    privateWrite(join(carried, 'observations.json'), obsBytes);
    return { codexSlot: structuredClone(slot), receipt };
  } catch { throw new ContinuationError(); }
}
