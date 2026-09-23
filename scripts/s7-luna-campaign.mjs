#!/usr/bin/env node
import { createHash, randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { constants, closeSync, fstatSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { register } from 'node:module';
import { isDeepStrictEqual } from 'node:util';
import { LUNA_MODEL, CONTROLLED_POLICY } from './s2-codex-bridge-prepare.mjs';

export const HARNESS_ORDER = ['codex', 'hermes', 'cline', 'pi', 'qwen'];
export const TASK_IDS = ['psd-tools-blend-range-api', 'cattrs-partial-structuring-recovery', 'textual-richlog-follow-state', 'tomlkit-toml-table-converters', 'ink-grid-box-layout', 'true-myth-iterable-collection-combinators', 'happy-dom-deterministic-intersectionobserver', 'superjson-error-stack-serialization'];
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PRICE_BOOK = 'codex-subscription-unpriced-2026-09-22';
const SOURCE_SHA = 'sha256:fb2f323c9e667f0433b5143269c7366c383fd1a3ce1ea37d9ce041e1848b297e';
const SUITE_SHA = '43ded7fd725fc9a10b820033339285bfb5f5863d2bbf10364c8547b4ef79fdbd';
const LEGACY_PINS = Object.freeze({
  state: '68a1905630de2908f354ac7ca5a59acdb4338b850b8c9afdf9f7f487a3d96feb',
  implementation: '5b9561bc48a5dbe53c2e2ea22c98412d4b7b9ab4dbf0dee9beb5a87258a28b41', session: '586921d27c1250c7',
  run: '176b3c70ebf4aa589e2282a1b0b286c951cd54cb232380640ae73ab942144056',
  events: 'da6e824c4e95f6877dc0e81132ac19bf50c6594b75bf6f277a90a91289dd331f',
  observations: '2d823abebb7e45d7269f65a48a5729378c831d5b270e36de0f985a6becd34e73',
  proof: 'c74c4efe03ab5e3845abfd38ad8b574ffc64ae7230171b1e097ffe2e8e1312a8',
  image: 'sha256:76f02c972b829dc60e4be7aea921bb98ffc847254121f5cc318125a2fb4631a5',
});
const REPEATED_PINS = Object.freeze({
  state: '864a39eaf0cfbe1399a7d2641015241f69b00efb8ead2b6151d4d214565309c0',
  implementation: 'd21e2622b816fba8a5bb6ad770d47be974022c47c2528b281f9a37a4f37a0bad', session: '586921d27c1250c7',
  run: 'ed364a088215e9734e7dc740799ff2502e077de0ab09c8606d95feafdacb5b84',
  events: '580444671bd10ce2a0adcb4da6202034a35d657de4f5886c80d3db4c3d140a28',
  observations: '6988ca961c9ca6ff20c26b0d20bd0e0094678b4fd94bcbe523e54b183cbd748d',
  first_receipt: '9a07dcf8cee593ae9237be01d07195c7350d94d51e71d3215ca4843e0c1f5ed0',
});
const NO_SOLUTION_PINS = Object.freeze({
  state: '7024cc027a601c7212ad8720fa38b2e9cf2c664f6802c4a786fc14e058dc2f92',
  implementation: 'd67b6a81cf8aa5a4bddff66536b472aac930686a0c382e80ffdadc981cbc8d7d', session: '586921d27c1250c7',
  run: '7e3338e4e90bf5886d6d207eb38e1350fbff23402272c3a810dee5ed3f887530',
  events: '719baf70839eacfe3dbfaa6a20e373a5a6e1b5669f83ecfdcd33f0e8347bcc66',
  observations: '8801a9ff6b0ae9aa1d5fc2f9f028b454ad652e475745ba032fe409ff1c2dcfe5',
  second_receipt: 'e8837eb27dcc3f90e27f14371368c15aca623574da7094b8919d4bd6c57f4b7c',
  candidate_evidence: 'b4297992f21fdb72a8286517994d442399c9244779a2686c791fd4c1dc6ecee4',
  candidate_patch: 'ae9eeab779e2fe319ba38f1bf04eaa1a046ef71c4965e0d864540588a79183e5',
});
const NO_SOLUTION_BACKUP = 'no-solution-state.json';
const NO_SOLUTION_RECEIPT = 'no-solution-adjudication.json';
const REPEATED_BACKUP = 'repeated-metadata-state.json';
const REPEATED_RECEIPT = 'repeated-metadata-adjudication.json';
const LEGACY_BACKUP = 'legacy-metadata-state.json';
const LEGACY_RECEIPT = 'legacy-metadata-adjudication.json';
const BOUND_FILES = ['run.json', 'events.jsonl', 'verify.log', 'execution-conditions.json', 'candidate-evidence.json', 'transport.json', 'bridge-conditions.json'];
export class CampaignError extends Error {
  constructor(message = 'Luna campaign refused; inspect private campaign state.') { super(message); this.name = 'CampaignError'; }
}
const check = value => { if (!value) throw new CampaignError(); };
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const validHash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
function exists(path) { try { lstatSync(path); return true; } catch (e) { if (e.code === 'ENOENT') return false; throw e; } }
function within(parent, child) { const rel = relative(parent, child); return rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel); }
function regularBytes(path, maxBytes = 32 * 1024 * 1024) {
  const before = lstatSync(path); check(before.isFile() && !before.isSymbolicLink() && before.size <= maxBytes);
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const start = fstatSync(fd); check(start.ino === before.ino && start.dev === before.dev && start.size === before.size);
    const bytes = Buffer.alloc(start.size + 1); let length = 0;
    while (length < bytes.length) { const n = readSync(fd, bytes, length, bytes.length - length, null); if (!n) break; length += n; }
    const after = fstatSync(fd); check(length === start.size && after.size === start.size && after.mtimeMs === start.mtimeMs && after.ctimeMs === start.ctimeMs);
    return bytes.subarray(0, length);
  } finally { closeSync(fd); }
}
function hashFile(path) {
  const info = lstatSync(path); check(info.isFile() && !info.isSymbolicLink());
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW); const h = createHash('sha256'); const buf = Buffer.alloc(65536);
  try { const before = fstatSync(fd); let total = 0; for (;;) { const n = readSync(fd, buf); if (!n) break; h.update(buf.subarray(0, n)); total += n; }
    const after = fstatSync(fd); check(total === before.size && before.size === after.size && before.mtimeMs === after.mtimeMs && before.ctimeMs === after.ctimeMs); return h.digest('hex');
  } finally { closeSync(fd); }
}
const json = path => JSON.parse(regularBytes(path).toString('utf8'));
function privateDirectory(path) {
  const requested = resolve(path); const destination = join(realpathSync(dirname(requested)), basename(requested));
  check(!within(ROOT, destination));
  if (!exists(destination)) mkdirSync(destination, { mode: 0o700 });
  const info = lstatSync(destination); check(info.isDirectory() && !info.isSymbolicLink() && (info.mode & 0o077) === 0);
  return destination;
}
function saveState(path, state) {
  const temporary = join(dirname(path), `.state-${randomBytes(10).toString('hex')}.tmp`);
  const fd = openSync(temporary, 'wx', 0o600);
  try { writeFileSync(fd, `${JSON.stringify(state, null, 2)}\n`); fsyncSync(fd); } finally { closeSync(fd); }
  try { renameSync(temporary, path); const directory = openSync(dirname(path), constants.O_RDONLY); try { fsyncSync(directory); } finally { closeSync(directory); } }
  finally { if (exists(temporary)) rmSync(temporary); }
}
function harnesses(value = HARNESS_ORDER) {
  check(Array.isArray(value) && value.length > 0 && new Set(value).size === value.length && value.every(h => HARNESS_ORDER.includes(h)));
  return HARNESS_ORDER.filter(h => value.includes(h));
}
function schedule(session) {
  return [HARNESS_ORDER.slice(0, 2), HARNESS_ORDER.slice(2)].flatMap(phase => Array.from({ length: 5 }, (_, rep) =>
    TASK_IDS.flatMap(task => phase.map(harness => ({ harness, task, rep, run_id: `luna-${harness}-${task}-${rep}-${session}`, status: 'pending' })))).flat());
}
async function contracts() {
  register('./ts-source-loader.mjs', import.meta.url);
  return import('@aob/contracts');
}
async function implementationHash() {
  const scripts = ['s7-luna-campaign.mjs', 's7-luna-no-solution.mjs', 's5-luna-task-transport.mjs', 's2-codex-bridge-service.mjs', 's2-codex-bridge-prepare.mjs', 'ts-source-loader.mjs'].map(f => `scripts/${f}`);
  const files = [...scripts, 'package-lock.json', ...['runner', 'proxy', 'adapters', 'contracts', 'tasks'].flatMap(p =>
    readdirSync(join(ROOT, 'packages', p, 'src'), { recursive: true }).filter(f => f.endsWith('.ts')).map(f => `packages/${p}/src/${f}`))].sort();
  return sha(files.map(f => `${f}:${hashFile(join(ROOT, f))}`).join('\n'));
}
async function hostFingerprint() {
  const machineId = regularBytes('/etc/machine-id', 128).toString('utf8').trim();
  check(/^[a-f0-9]{32}$/.test(machineId)); return sha(machineId);
}
function verifyWorkspace(taskDir, revision) {
  const workspace = join(taskDir, 'workspace');
  for (const path of [taskDir, workspace, join(workspace, '.git')]) { const info = lstatSync(path); check(info.isDirectory() && !info.isSymbolicLink()); }
  const git = args => execFileSync('git', ['-c', 'core.fsmonitor=false', '-c', 'core.untrackedCache=false', '-C', workspace, ...args],
    { encoding: 'utf8', env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' }, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  check(git(['rev-parse', 'HEAD']) === revision && git(['status', '--porcelain=v1', '--untracked-files=all']) === '');
}
async function loadTasks({ taskRoot }) {
  const { validateLocalTaskManifest, validateSelectedLocalTaskManifest, validateDeepSWEReferencePolarity, sourceManifestSha256, loadTaskYaml, validateVerifierSpec } = await import('@aob/tasks');
  const { regimeForExpectedMinutes } = await import('../packages/tasks/src/regime.ts');
  const suiteBytes = regularBytes(join(taskRoot, 'suite-manifest.json')); const suite = JSON.parse(suiteBytes);
  const source = json(join(taskRoot, 'deepswe-source-manifest.json'));
  check(sha(suiteBytes) === SUITE_SHA && sourceManifestSha256(source) === SOURCE_SHA);
  validateLocalTaskManifest(taskRoot, suite); validateSelectedLocalTaskManifest(taskRoot, suite, TASK_IDS, source);
  check(suite.tasks.length === 8 && TASK_IDS.every(id => suite.tasks.some(t => t.id === id)));
  for (const task of source.tasks) {
    const bytes = regularBytes(join(taskRoot, 'reference-polarity', `${task.id}.json`));
    check(`sha256:${sha(bytes)}` === task.reference_polarity_sha256); validateDeepSWEReferencePolarity(JSON.parse(bytes), task);
  }
  const tasks = [];
  for (const id of TASK_IDS) {
    // This source is already prepared and hash-validated above. The existing
    // cell lifecycle makes its one disposable copy at the funded attempt boundary.
    const taskDir = join(taskRoot, id); const yaml = loadTaskYaml(join(taskDir, 'task.yaml'));
    const task = { id, source: yaml.source, baseRevision: yaml.source.base_revision, timeoutS: yaml.timeout_s, regime: regimeForExpectedMinutes(yaml.expected_minutes),
      environment: { kind: 'prepared-local', network: 'disabled', agent_images: json(join(taskDir, 'environment.json')).agent_images },
      verifier: validateVerifierSpec(json(join(taskDir, 'verifier.json'))) };
    check(task.timeoutS === 10800 && task.regime === 'extended'); verifyWorkspace(taskDir, task.baseRevision); tasks.push({ ...task, taskDir });
  }
  return { tasks, suiteSha256: sha(suiteBytes), sourceSha256: SOURCE_SHA.slice(7) };
}
function genuineFailure(log) {
  const lines = log.split('\n').map(l => l.trim()).filter(Boolean); const markers = lines.filter(l => l.startsWith('[verifier] reward.json='));
  // Docker combines stdout then stderr; asynchronous stderr can follow the summary.
  if (markers.length !== 1) return false;
  try {
    const r = JSON.parse(markers[0].slice('[verifier] reward.json='.length));
    const values = [r.f2p_total, r.f2p_passed, r.p2p_total, r.p2p_passed];
    if (r.reward !== 0 || !values.every(n => Number.isSafeInteger(n) && n >= 0) || r.f2p_total <= 0 || r.p2p_total <= 0 || r.f2p_passed > r.f2p_total || r.p2p_passed > r.p2p_total || r.f2p_passed + r.p2p_passed >= r.f2p_total + r.p2p_total) return false;
    const close = (a, b) => typeof a === 'number' && Number.isFinite(a) && Math.abs(a - b) <= 1e-6;
    return close(r.f2p, r.f2p_passed / r.f2p_total) && close(r.p2p, r.p2p_passed / r.p2p_total) && close(r.partial, (r.f2p_passed + r.p2p_passed) / (r.f2p_total + r.p2p_total));
  } catch { return false; }
}
function cellDirectory(output, cell) { return join(output, 'results', cell.harness, cell.task, String(cell.rep)); }
const METADATA_ROUTES = ['api-models', 'model-detail', 'backend-tags', 'backend-properties', 'backend-version', 'backend-show'];
const nonnegativeInteger = value => Number.isSafeInteger(value) && value >= 0;
const safeMetadataRecord = r => r && r.reason === 'path' && r.status === 404 && r.query_present === false
  && r.method === (r.route === 'backend-show' ? 'POST' : 'GET') && METADATA_ROUTES.includes(r.route);
function allowedMetadata(observed, harness) {
  if (!nonnegativeInteger(observed.front_refused)) return false;
  const records = observed.front_rejections; const truncated = observed.front_rejections_truncated;
  if (observed.front_metadata_counts !== undefined || observed.front_unclassified_refused !== undefined) {
    const counts = observed.front_metadata_counts;
    if (!counts || typeof counts !== 'object' || Array.isArray(counts) || Object.keys(counts).length !== METADATA_ROUTES.length
      || !METADATA_ROUTES.every(k => Object.hasOwn(counts, k) && nonnegativeInteger(counts[k])) || observed.front_unclassified_refused !== 0
      || !Array.isArray(records) || records.length !== Math.min(128, observed.front_refused) || !nonnegativeInteger(truncated) || records.length + truncated !== observed.front_refused
      || !records.every(safeMetadataRecord)) return false;
    const total = METADATA_ROUTES.reduce((sum, k) => sum + counts[k], 0);
    return nonnegativeInteger(total) && total === observed.front_refused && (total === 0 || harness === 'hermes')
      && METADATA_ROUTES.every(k => records.filter(r => r.route === k).length <= counts[k]);
  }
  if (observed.front_refused === 0) return (records === undefined || (Array.isArray(records) && records.length === 0)) && (truncated === undefined || truncated === 0);
  return harness === 'hermes' && truncated === 0 && Array.isArray(records) && records.length <= 128 && records.length === observed.front_refused && records.every(safeMetadataRecord);
}
function inspectAttempt(dir, cell, task, definition, api, legacy = false, allowProofPreparation = false) {
  const hashes = Object.fromEntries(BOUND_FILES.map(name => [name, hashFile(join(dir, name))]));
  for (const name of ['candidate.patch', 'events.jsonl.upstream.jsonl', 'stdout.log', 'stderr.log', 'no-solution-proof.json']) if (exists(join(dir, name))) hashes[name] = hashFile(join(dir, name));
  const run = api.validateC4Run(json(join(dir, 'run.json')));
  const events = regularBytes(join(dir, 'events.jsonl')).toString('utf8').trim().split('\n').filter(Boolean).map(line => api.validateC1Event(JSON.parse(line)));
  const agent = task.environment.agent_images[cell.harness];
  check(run.run_id === cell.run_id && run.tool === cell.harness && run.task_id === cell.task && run.rep === cell.rep && run.model === LUNA_MODEL
    && run.condition === 'pinned' && run.task_source === task.source.kind && run.task_revision === task.source.revision && run.task_repository === task.source.repository
    && run.task_base_revision === task.baseRevision && run.task_regime === task.regime && run.container.image_digest === agent.image_digest
    && run.container.verifier_image_digest === task.verifier.image_digest && run.task_environment.agent_image_digest === agent.image_digest
    && run.host.os === 'linux' && run.price_book === PRICE_BOOK && run.spend_usd_estimate === null);
  let sequence = -1;
  for (const e of events) { check(e.run_id === cell.run_id && e.seq > sequence); sequence = e.seq; }
  const attempts = events.filter(api.isModelRequestAttempt);
  check(attempts.length > 0 && events.every(e => api.isModelRequestAttempt(e) || (e.method === 'GET' && e.model_requested === null && e.model_served === null)));
  check(attempts.every(e => api.isSuccessfulModelEvent(e) && e.protocol === 'openai_responses' && e.model_requested === LUNA_MODEL && e.model_served === LUNA_MODEL && e.usage !== null && e.usage_source !== 'unavailable'));
  const transport = json(join(dir, 'transport.json')); const observed = json(join(dir, 'bridge-conditions.json'));
  check(transport.model === LUNA_MODEL && transport.policy === CONTROLLED_POLICY && transport.bridge_binary_sha256 === definition.bridge_binary_sha256
    && transport.refresh_token_imported === false && transport.subscription_usd === null && transport.timeout_s === 10800
    && transport.max_model_requests === 512 && transport.max_input_tokens === 100000000 && transport.max_output_tokens === 1000000);
  check((allowedMetadata(observed, cell.harness) || (legacy && observed.front_refused === 7 && observed.front_rejections === undefined && observed.front_rejections_truncated === undefined && attempts.length === 47)) && observed.gate_refused === 0 && Array.isArray(observed.requests) && observed.requests.length === attempts.length
    && observed.requests.every(r => ['accepted', 'model_matches', 'effort_low', 'summary_auto', 'store_false', 'reasoning_replay_absent', 'continuation_absent'].every(k => r[k] === true)));
  check(run.adapter_result.exitCode === 0);
  if (run.outcome === 'completed' && run.verification.exit === 0) return { status: 'completed', hashes };
  if (run.outcome === 'verify_error' && run.verification.exit === 1 && genuineFailure(regularBytes(join(dir, 'verify.log')).toString('utf8'))) return { status: 'task_failed', hashes };
  if (run.outcome === 'verify_error' && run.verification.exit === 1 && regularBytes(join(dir, 'verify.log')).length === 0) {
    if (exists(join(dir, 'no-solution-proof.json'))) {
      api.validateNoSolutionProof({ cellDir: dir, taskDir: task.taskDir, proof: json(join(dir, 'no-solution-proof.json')) });
      return { status: 'task_failed', failure_reason: 'no_solution_produced', hashes };
    }
    if (allowProofPreparation) return { status: 'no_solution_proof_required', hashes };
  }
  throw new CampaignError();
}

async function campaignDefinition(options, deps) {
    const api = { ...await contracts(), ...await import('./s7-luna-no-solution.mjs') };
    const loaded = await (deps.loadTasks ?? loadTasks)({ taskRoot: realpathSync(options.taskRoot) });
    check(loaded.tasks.length === 8 && new Set(loaded.tasks.map(t => t.id)).size === 8 && TASK_IDS.every(id => loaded.tasks.some(t => t.id === id)));
    const tasks = new Map(loaded.tasks.map(t => [t.id, t]));
    const implementation = await (deps.implementationHash ?? implementationHash)(); check(validHash(implementation));
    const host = await (deps.hostFingerprint ?? hostFingerprint)(); check(validHash(host));
    const definition = { host_sha256: host, model: LUNA_MODEL, policy: CONTROLLED_POLICY, price_book: PRICE_BOOK, suite_sha256: loaded.suiteSha256, source_sha256: loaded.sourceSha256,
      bridge_binary_sha256: hashFile(options.bridgeBinary), implementation_sha256: implementation,
      tasks: TASK_IDS.map(id => { const t = tasks.get(id); return { id, source: t.source, baseRevision: t.baseRevision, regime: t.regime, timeoutS: t.timeoutS, environment: t.environment, verifier: t.verifier }; }),
      harnesses: HARNESS_ORDER, repetitions: 5, phases: [HARNESS_ORDER.slice(0, 2), HARNESS_ORDER.slice(2)], max_provider_requests_per_attempt: 512, max_input_tokens_per_attempt: 100000000, max_output_tokens_per_attempt: 1000000 };
    return { api, tasks, definition };
}

function legacyEvidence(output, oldBytes, context, deps) {
  const pins = deps.legacyPins ?? LEGACY_PINS; const old = JSON.parse(oldBytes); const { api, tasks, definition } = context;
  check(sha(oldBytes) === pins.state && old.schema_version === 1 && old.official_release === false && old.collection === 'diagnostic'
    && old.halted === true && old.halt_reason === 'attempt-or-accounting-failed' && old.session === pins.session
    && old.definition.implementation_sha256 === pins.implementation && definition.implementation_sha256 !== pins.implementation
    && isDeepStrictEqual({ ...old.definition, implementation_sha256: definition.implementation_sha256 }, definition));
  check(Array.isArray(old.cells) && old.cells.length === 200 && !old.legacy_metadata_adjudication);
  const expected = schedule(old.session);
  for (let i = 0; i < expected.length; i++) check(['harness', 'task', 'rep', 'run_id'].every(k => old.cells[i][k] === expected[i][k])
    && old.cells[i].status === (i === 0 ? 'task_failed' : i === 1 ? 'blocked' : 'pending'));
  check(tasks.get(TASK_IDS[0]).environment.agent_images.hermes.image_digest === pins.image);
  const proofPath = deps.legacyProofPath ?? join(ROOT, 'plans/s5-evidence/luna-task-transport/hermes-metadata-probes.json');
  check(hashFile(proofPath) === pins.proof);
  const dir = cellDirectory(output, old.cells[1]);
  check(hashFile(join(dir, 'run.json')) === pins.run && hashFile(join(dir, 'events.jsonl')) === pins.events && hashFile(join(dir, 'bridge-conditions.json')) === pins.observations);
  const checked = old.cells.slice(0, 2).map((cell, i) => inspectAttempt(cellDirectory(output, cell), cell, tasks.get(cell.task), definition, api, i === 1));
  check(checked.every(c => c.status === 'task_failed') && isDeepStrictEqual(checked[0].hashes, old.cells[0].hashes));
  const receipt = { schema_version: 1, classification: 'legacy_classification_inferred', reason: 'pinned-native-metadata-probe-proof',
    old_state_sha256: pins.state, old_implementation_sha256: pins.implementation, new_implementation_sha256: definition.implementation_sha256,
    proof_sha256: pins.proof, session: old.session, preserved_cells: old.cells.slice(0, 2).map((c, i) => ({ run_id: c.run_id, hashes: checked[i].hashes })) };
  const preserved = old.cells.slice(0, 2).map((c, i) => ({ ...c, ...checked[i], original_implementation_sha256: pins.implementation,
    ...(i === 1 ? { legacy_metadata_classification: 'inferred', admission: 'funded-first-repetition' } : {}) }));
  return { old, receipt, preserved };
}
function validateAdjudication(output, state, context, deps) {
  if (state.no_solution_adjudication) return validateNoSolutionAdjudication(output, state, context, deps);
  if (state.repeated_metadata_adjudication) return validateRepeatedAdjudication(output, state, context, deps);
  if (!state.legacy_metadata_adjudication) {
    check(state.cells.every(c => c.legacy_metadata_classification === undefined && c.original_implementation_sha256 === undefined)); return false;
  }
  const bytes = regularBytes(join(output, LEGACY_RECEIPT)); check(sha(bytes) === state.legacy_metadata_adjudication);
  const expected = legacyEvidence(output, regularBytes(join(output, LEGACY_BACKUP)), context, deps);
  check(isDeepStrictEqual(JSON.parse(bytes), expected.receipt) && state.session === expected.old.session
    && isDeepStrictEqual(state.cells.slice(0, 2), expected.preserved)
    && state.cells.slice(2).every(c => c.legacy_metadata_classification === undefined && c.original_implementation_sha256 === undefined));
  return true;
}
function repeatedEvidence(output, oldBytes, context, deps) {
  const pins = deps.repeatedPins ?? REPEATED_PINS; const old = JSON.parse(oldBytes); const { api, tasks, definition } = context;
  check(sha(oldBytes) === pins.state && old.schema_version === 1 && old.official_release === false && old.collection === 'diagnostic'
    && old.halted === true && old.halt_reason === 'attempt-or-accounting-failed' && old.session === pins.session
    && old.definition.implementation_sha256 === pins.implementation && definition.implementation_sha256 !== pins.implementation
    && isDeepStrictEqual({ ...old.definition, implementation_sha256: definition.implementation_sha256 }, definition)
    && !old.repeated_metadata_adjudication && old.legacy_metadata_adjudication === pins.first_receipt);
  check(Array.isArray(old.cells) && old.cells.length === 200);
  // Validate the first transition against its actual historical implementation epoch.
  const historicalContext = { ...context, definition: old.definition };
  check(validateAdjudication(output, old, historicalContext, deps));
  const expected = schedule(old.session);
  for (let i = 0; i < expected.length; i++) check(['harness', 'task', 'rep', 'run_id'].every(k => old.cells[i][k] === expected[i][k])
    && old.cells[i].status === (i < 5 ? 'task_failed' : i === 5 ? 'blocked' : 'pending'));
  const dir = cellDirectory(output, old.cells[5]);
  check(hashFile(join(dir, 'run.json')) === pins.run && hashFile(join(dir, 'events.jsonl')) === pins.events && hashFile(join(dir, 'bridge-conditions.json')) === pins.observations);
  const observations = json(join(dir, 'bridge-conditions.json'));
  check(observations.front_refused === 11 && observations.requests.length === 39 && observations.front_rejections.length === 11 && observations.front_rejections_truncated === 0);
  const checked = old.cells.slice(0, 6).map((cell, i) => inspectAttempt(cellDirectory(output, cell), cell, tasks.get(cell.task), definition, api, i === 1));
  check(checked.every(c => c.status === 'task_failed') && checked.slice(0, 5).every((c, i) => isDeepStrictEqual(c.hashes, old.cells[i].hashes)));
  const receipt = { schema_version: 1, classification: 'observed_repeated_metadata', reason: 'complete-safe-metadata-diagnostics',
    old_state_sha256: pins.state, old_implementation_sha256: pins.implementation, new_implementation_sha256: definition.implementation_sha256,
    first_receipt_sha256: pins.first_receipt, session: old.session,
    preserved_cells: old.cells.slice(0, 6).map((c, i) => ({ run_id: c.run_id, hashes: checked[i].hashes, original_implementation_sha256: i < 2 ? c.original_implementation_sha256 : pins.implementation })) };
  const preserved = old.cells.slice(0, 6).map((c, i) => i < 2 ? c : ({ ...c, ...checked[i], original_implementation_sha256: pins.implementation,
    ...(i === 5 ? { repeated_metadata_classification: 'observed', admission: 'funded-first-repetition' } : {}) }));
  return { old, receipt, preserved };
}
function validateRepeatedAdjudication(output, state, context, deps) {
  const bytes = regularBytes(join(output, REPEATED_RECEIPT)); check(sha(bytes) === state.repeated_metadata_adjudication);
  const expected = repeatedEvidence(output, regularBytes(join(output, REPEATED_BACKUP)), context, deps);
  check(isDeepStrictEqual(JSON.parse(bytes), expected.receipt) && state.session === expected.old.session
    && state.legacy_metadata_adjudication === expected.old.legacy_metadata_adjudication && isDeepStrictEqual(state.cells.slice(0, 6), expected.preserved)
    && state.cells.slice(6).every(c => c.legacy_metadata_classification === undefined && c.repeated_metadata_classification === undefined && c.original_implementation_sha256 === undefined));
  return true;
}
async function inspectOrProve(dir, cell, task, definition, api, deps, legacy = false) {
  const inspected = inspectAttempt(dir, cell, task, definition, api, legacy, true);
  if (inspected.status !== 'no_solution_proof_required') return inspected;
  const proof = await (deps.createNoSolutionProof ?? api.createNoSolutionProof)({ cellDir: dir, taskDir: task.taskDir });
  api.validateNoSolutionProof({ cellDir: dir, taskDir: task.taskDir, proof });
  exclusiveEvidence(join(dir, 'no-solution-proof.json'), Buffer.from(`${JSON.stringify(proof, null, 2)}\n`));
  return inspectAttempt(dir, cell, task, definition, api, legacy);
}
function noSolutionEvidence(output, oldBytes, context, deps, allowProofPreparation = false) {
  const pins = deps.noSolutionPins ?? NO_SOLUTION_PINS; const old = JSON.parse(oldBytes); const { api, tasks, definition } = context;
  check(sha(oldBytes) === pins.state && old.schema_version === 1 && old.official_release === false && old.collection === 'diagnostic'
    && old.halted === true && old.halt_reason === 'attempt-or-accounting-failed' && old.session === pins.session
    && old.definition.implementation_sha256 === pins.implementation && definition.implementation_sha256 !== pins.implementation
    && isDeepStrictEqual({ ...old.definition, implementation_sha256: definition.implementation_sha256 }, definition)
    && !old.no_solution_adjudication && old.repeated_metadata_adjudication === pins.second_receipt);
  check(Array.isArray(old.cells) && old.cells.length === 200);
  check(validateAdjudication(output, old, { ...context, definition: old.definition }, deps));
  const expected = schedule(old.session);
  for (let i = 0; i < expected.length; i++) check(['harness', 'task', 'rep', 'run_id'].every(k => old.cells[i][k] === expected[i][k])
    && old.cells[i].status === (i < 8 ? 'task_failed' : i === 8 ? 'blocked' : 'pending'));
  const dir = cellDirectory(output, old.cells[8]);
  check(hashFile(join(dir, 'candidate-evidence.json')) === pins.candidate_evidence && hashFile(join(dir, 'candidate.patch')) === pins.candidate_patch);
  check(hashFile(join(dir, 'run.json')) === pins.run && hashFile(join(dir, 'events.jsonl')) === pins.events && hashFile(join(dir, 'bridge-conditions.json')) === pins.observations);
  check(json(join(dir, 'bridge-conditions.json')).requests.length === 27);
  const checked = old.cells.slice(0, 9).map((cell, i) => inspectAttempt(cellDirectory(output, cell), cell, tasks.get(cell.task), definition, api, i === 1, allowProofPreparation && i === 8));
  check(checked.slice(0, 8).every((c, i) => c.status === 'task_failed' && isDeepStrictEqual(c.hashes, old.cells[i].hashes)));
  if (allowProofPreparation && checked[8].status === 'no_solution_proof_required') return { old, proofRequired: true };
  check(checked[8].status === 'task_failed' && checked[8].failure_reason === 'no_solution_produced');
  const receipt = { schema_version: 1, classification: 'verified_empty_verifier_patch', reason: 'no_solution_produced',
    old_state_sha256: pins.state, old_implementation_sha256: pins.implementation, new_implementation_sha256: definition.implementation_sha256,
    second_receipt_sha256: pins.second_receipt, no_solution_proof_sha256: checked[8].hashes['no-solution-proof.json'], session: old.session,
    preserved_cells: old.cells.slice(0, 9).map((c, i) => ({ run_id: c.run_id, hashes: checked[i].hashes, original_implementation_sha256: i < 6 ? c.original_implementation_sha256 : pins.implementation })) };
  const preserved = old.cells.slice(0, 9).map((c, i) => i < 6 ? c : ({ ...c, ...checked[i], original_implementation_sha256: pins.implementation,
    ...(i === 8 ? { no_solution_classification: 'verified', admission: 'funded-first-repetition' } : {}) }));
  return { old, receipt, preserved, proofRequired: false };
}
function validateNoSolutionAdjudication(output, state, context, deps) {
  const bytes = regularBytes(join(output, NO_SOLUTION_RECEIPT)); check(sha(bytes) === state.no_solution_adjudication);
  const expected = noSolutionEvidence(output, regularBytes(join(output, NO_SOLUTION_BACKUP)), context, deps);
  check(isDeepStrictEqual(JSON.parse(bytes), expected.receipt) && state.session === expected.old.session
    && state.legacy_metadata_adjudication === expected.old.legacy_metadata_adjudication && state.repeated_metadata_adjudication === expected.old.repeated_metadata_adjudication
    && isDeepStrictEqual(state.cells.slice(0, 9), expected.preserved)
    && state.cells.slice(9).every(c => c.legacy_metadata_classification === undefined && c.repeated_metadata_classification === undefined && c.no_solution_classification === undefined && c.original_implementation_sha256 === undefined));
  return true;
}
function exclusiveEvidence(path, bytes) {
  const fd = openSync(path, 'wx', 0o400);
  try { writeFileSync(fd, bytes); fsyncSync(fd); } finally { closeSync(fd); }
}
/** Single known historical transition. Test dependency seams are never exposed by CLI. */
export async function repairLunaMetadataStop(options, deps = {}) {
  let lockFd; let lockPath;
  try {
    check(options && ['taskRoot', 'output', 'privateRoot', 'authFile', 'bridgeBinary'].every(k => typeof options[k] === 'string' && isAbsolute(options[k])));
    check((deps.platform ?? process.platform) === 'linux'); const output = privateDirectory(options.output); const privateRoot = privateDirectory(options.privateRoot);
    check(!within(output, privateRoot) && !within(privateRoot, output));
    lockPath = join(output, 'campaign.lock'); lockFd = openSync(lockPath, 'wx', 0o600);
    const context = await campaignDefinition(options, deps); const path = join(output, 'state.json'); const oldBytes = regularBytes(path);
    const { old, receipt, preserved } = legacyEvidence(output, oldBytes, context, deps);
    check(!exists(join(output, LEGACY_BACKUP)) && !exists(join(output, LEGACY_RECEIPT)));
    // Both audit files are exclusive and durable before the scheduling transition.
    exclusiveEvidence(join(output, LEGACY_BACKUP), oldBytes);
    const receiptBytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`); exclusiveEvidence(join(output, LEGACY_RECEIPT), receiptBytes);
    const next = { ...old, definition: context.definition, halted: false, cells: [...preserved, ...old.cells.slice(2)], legacy_metadata_adjudication: sha(receiptBytes) };
    delete next.halt_reason; saveState(path, next); return next;
  } catch (error) { throw error instanceof CampaignError ? error : new CampaignError(); }
  finally { if (lockFd !== undefined) { closeSync(lockFd); rmSync(lockPath); } }
}

/** One exact observed stop, preserving the first audit chain and both consumed epochs. */
export async function repairLunaRepeatedMetadataStop(options, deps = {}) {
  let lockFd; let lockPath;
  try {
    check(options && ['taskRoot', 'output', 'privateRoot', 'authFile', 'bridgeBinary'].every(k => typeof options[k] === 'string' && isAbsolute(options[k])));
    check((deps.platform ?? process.platform) === 'linux'); const output = privateDirectory(options.output); const privateRoot = privateDirectory(options.privateRoot);
    check(!within(output, privateRoot) && !within(privateRoot, output));
    lockPath = join(output, 'campaign.lock'); lockFd = openSync(lockPath, 'wx', 0o600);
    const context = await campaignDefinition(options, deps); const path = join(output, 'state.json'); const oldBytes = regularBytes(path);
    const { old, receipt, preserved } = repeatedEvidence(output, oldBytes, context, deps);
    check(!exists(join(output, REPEATED_BACKUP)) && !exists(join(output, REPEATED_RECEIPT)));
    exclusiveEvidence(join(output, REPEATED_BACKUP), oldBytes);
    const receiptBytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`); exclusiveEvidence(join(output, REPEATED_RECEIPT), receiptBytes);
    const next = { ...old, definition: context.definition, halted: false, cells: [...preserved, ...old.cells.slice(6)], repeated_metadata_adjudication: sha(receiptBytes) };
    delete next.halt_reason; saveState(path, next); return next;
  } catch (error) { throw error instanceof CampaignError ? error : new CampaignError(); }
  finally { if (lockFd !== undefined) { closeSync(lockFd); rmSync(lockPath); } }
}

/** One exact no-solution stop; capture proof precedes all audit/state mutation. */
export async function repairLunaNoSolutionStop(options, deps = {}) {
  let lockFd; let lockPath;
  try {
    check(options && ['taskRoot', 'output', 'privateRoot', 'authFile', 'bridgeBinary'].every(k => typeof options[k] === 'string' && isAbsolute(options[k])));
    check((deps.platform ?? process.platform) === 'linux'); const output = privateDirectory(options.output); const privateRoot = privateDirectory(options.privateRoot);
    check(!within(output, privateRoot) && !within(privateRoot, output));
    lockPath = join(output, 'campaign.lock'); lockFd = openSync(lockPath, 'wx', 0o600);
    const context = await campaignDefinition(options, deps); const path = join(output, 'state.json'); const oldBytes = regularBytes(path);
    let evidence = noSolutionEvidence(output, oldBytes, context, deps, true);
    check(!exists(join(output, NO_SOLUTION_BACKUP)) && !exists(join(output, NO_SOLUTION_RECEIPT)));
    if (evidence.proofRequired) {
      const cell = evidence.old.cells[8];
      await inspectOrProve(cellDirectory(output, cell), cell, context.tasks.get(cell.task), context.definition, context.api, deps);
      evidence = noSolutionEvidence(output, oldBytes, context, deps);
    }
    const { old, receipt, preserved } = evidence;
    exclusiveEvidence(join(output, NO_SOLUTION_BACKUP), oldBytes);
    const receiptBytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`); exclusiveEvidence(join(output, NO_SOLUTION_RECEIPT), receiptBytes);
    const next = { ...old, definition: context.definition, halted: false, cells: [...preserved, ...old.cells.slice(9)], no_solution_adjudication: sha(receiptBytes) };
    delete next.halt_reason; saveState(path, next); return next;
  } catch (error) { throw error instanceof CampaignError ? error : new CampaignError(); }
  finally { if (lockFd !== undefined) { closeSync(lockFd); rmSync(lockPath); } }
}

/** Injected dependencies are for zero-spend tests; no runtime override is exposed by the CLI. */
export async function runCampaign(options, deps = {}) {
  let lockFd; let lockPath;
  try {
    check(options && ['taskRoot', 'output', 'privateRoot', 'authFile', 'bridgeBinary'].every(k => typeof options[k] === 'string' && isAbsolute(options[k])));
    check((deps.platform ?? process.platform) === 'linux'); const selected = harnesses(options.harnesses);
    const output = privateDirectory(options.output); const privateRoot = privateDirectory(options.privateRoot);
    check(!within(output, privateRoot) && !within(privateRoot, output));
    lockPath = join(output, 'campaign.lock'); lockFd = openSync(lockPath, 'wx', 0o600);
    const { api, tasks, definition } = await campaignDefinition(options, deps);
    const path = join(output, 'state.json'); let state;
    if (exists(path)) {
      state = json(path); check(state.schema_version === 1 && state.official_release === false && isDeepStrictEqual(state.definition, definition)
        && typeof state.session === 'string' && /^[a-f0-9]{16}$/.test(state.session) && Array.isArray(state.cells) && state.cells.length === 200 && typeof state.halted === 'boolean');
      const adjudicated = validateAdjudication(output, state, { api, tasks, definition }, deps);
      const expected = schedule(state.session);
      for (let i = 0; i < expected.length; i++) {
        const cell = state.cells[i]; const e = expected[i]; check(cell && ['pending', 'started', 'completed', 'task_failed', 'blocked'].includes(cell.status)
          && ['harness', 'task', 'rep', 'run_id'].every(k => cell[k] === e[k]));
        if (['completed', 'task_failed'].includes(cell.status)) {
          const checked = inspectAttempt(cellDirectory(output, cell), cell, tasks.get(cell.task), definition, api, adjudicated && i === 1);
          check(checked.status === cell.status && checked.failure_reason === cell.failure_reason && isDeepStrictEqual(checked.hashes, cell.hashes));
        }
        if (cell.status === 'started' || cell.status === 'blocked') { state.halted = true; state.halt_reason = 'consumed-attempt-requires-investigation'; }
      }
    } else {
      const session = randomBytes(8).toString('hex'); state = { schema_version: 1, official_release: false, collection: 'diagnostic', session, definition,
        created_at: new Date().toISOString(), halted: false, cells: schedule(session) };
    }
    saveState(path, state); if (state.halted) return state;
    const execute = deps.runCell ?? (await import('@aob/runner')).runDockerCell;
    const factory = deps.createTransportFactory ?? (await import('./s5-luna-task-transport.mjs')).createLunaTaskTransportFactory;
    for (const cell of state.cells) {
      if (cell.status !== 'pending' || !selected.includes(cell.harness)) continue;
      const task = tasks.get(cell.task); const dir = cellDirectory(output, cell);
      if (exists(dir)) { cell.status = 'blocked'; state.halted = true; state.halt_reason = 'existing-attempt-directory'; saveState(path, state); break; }
      cell.status = 'started'; cell.started_at = new Date().toISOString(); saveState(path, state);
      try {
        mkdirSync(dir, { recursive: true, mode: 0o700 });
        const transportFactory = await factory({ authFile: options.authFile, bridgeBinary: options.bridgeBinary, privateRoot, timeoutS: task.timeoutS });
        await execute({ dir, taskDir: task.taskDir, upstream: 'https://chatgpt.com/backend-api/codex', run_id: cell.run_id, tool: cell.harness,
          task_id: task.id, task_source: task.source.kind, task_revision: task.source.revision, task_repository: task.source.repository,
          task_base_revision: task.baseRevision, task_regime: task.regime, model: LUNA_MODEL, price_book: PRICE_BOOK,
          condition: 'pinned', rep: cell.rep, timeoutS: task.timeoutS, environment: task.environment, verifier: task.verifier, transportFactory });
        Object.assign(cell, await inspectOrProve(dir, cell, task, definition, api, deps), { finished_at: new Date().toISOString(), admission: cell.rep === 0 ? 'funded-first-repetition' : 'funded-repetition' });
      } catch {
        cell.status = 'blocked'; state.halted = true; state.halt_reason = 'attempt-or-accounting-failed';
      }
      saveState(path, state); (deps.progress ?? (message => process.stdout.write(`${message}\n`)))(`${cell.harness} ${cell.task} repetition ${cell.rep + 1}: ${cell.status}`);
      if (state.halted) break;
    }
    return state;
  } catch (error) { throw error instanceof CampaignError ? error : new CampaignError(); }
  finally { if (lockFd !== undefined) { closeSync(lockFd); rmSync(lockPath); } }
}
export function parseOptions(args) {
  const names = { '--task-root': 'taskRoot', '--output': 'output', '--auth-file': 'authFile', '--bridge-binary': 'bridgeBinary', '--private-root': 'privateRoot', '--harnesses': 'harnesses' };
  const options = {};
  for (let i = 0; i < args.length; i++) { const key = names[args[i]]; check(key && options[key] === undefined && args[i + 1] && !args[i + 1].startsWith('--')); options[key] = args[++i]; }
  check(['taskRoot', 'output', 'privateRoot', 'authFile', 'bridgeBinary'].every(k => typeof options[k] === 'string' && isAbsolute(options[k])));
  options.harnesses = harnesses(options.harnesses === undefined ? undefined : options.harnesses.split(',')); return options;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.umask(0o077);
  Promise.resolve().then(() => runCampaign(parseOptions(process.argv.slice(2)))).then(state => { if (state.halted) process.exitCode = 1; })
    .catch(() => { process.stderr.write('Luna campaign refused; inspect private state before any further execution.\n'); process.exitCode = 1; });
}
