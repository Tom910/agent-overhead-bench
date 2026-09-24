#!/usr/bin/env node
import { createHash, randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { constants, closeSync, fstatSync, fsyncSync, lstatSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, readlinkSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
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
const TRANSPORT_PINS = Object.freeze({
  state: 'd2d2a14c1f04ce388dbb88287f0c395e3f4d8267ed433b47c12e44fbc045b400',
  implementation: '134b64915b9729d9f0e5915a3cdbeaf0a33c4e19c99b6deb7310c1f392ec6f15', session: '586921d27c1250c7',
  run: '42fa77792f9dffa91c9a8b876254ea8f2cdafb87faeb5d7ddd9ffcb984b746bc',
  events: '0bdb04130b5d1997a721499d7097f72d9d6ee9c94eadfc875ce5eb5c2b4413a7',
  observations: 'ef97501c470b978f92e32dc5296ca0600986cd407c227b084252c10f78917e5f',
  upstream: 'a046b517bb60e8e58d296946f91e578918a56e82aeaf9d882d83d75590bdf9dd',
  candidate_evidence: 'aaff7d25084176ad9eba713d8150f8717b7917ca730dc25d7c686bd85b6096e1',
  candidate_patch: 'e08ffb092688923ee5d060e678f0cc0fc5613db7afdc462828a7ffc21bd7539e',
  third_receipt: '05aaedbfe990723aa97b70edb761577ad62902939697ef732119bf81e769e728',
});
const TRANSPORT_BACKUP = 'transport-state.json';
const TRANSPORT_RECEIPT = 'transport-adjudication.json';
const NO_SOLUTION_BACKUP = 'no-solution-state.json';
const NO_SOLUTION_RECEIPT = 'no-solution-adjudication.json';
const REPEATED_BACKUP = 'repeated-metadata-state.json';
const REPEATED_RECEIPT = 'repeated-metadata-adjudication.json';
const LEGACY_BACKUP = 'legacy-metadata-state.json';
const LEGACY_RECEIPT = 'legacy-metadata-adjudication.json';
const ENVIRONMENT_BACKUP = 'environment-state.json';
const ENVIRONMENT_RECEIPT = 'environment-adjudication.json';
const RESTORATION_PROOF = 'environment-restoration-proof.json';
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
async function loadTasks({ taskRoot, manifestPins = { suite: SUITE_SHA, source: SOURCE_SHA.slice(7) } }) {
  const { validateLocalTaskManifest, validateSelectedLocalTaskManifest, validateDeepSWEReferencePolarity, sourceManifestSha256, loadTaskYaml, validateVerifierSpec } = await import('@aob/tasks');
  const { regimeForExpectedMinutes } = await import('../packages/tasks/src/regime.ts');
  const suiteBytes = regularBytes(join(taskRoot, 'suite-manifest.json')); const suite = JSON.parse(suiteBytes);
  const source = json(join(taskRoot, 'deepswe-source-manifest.json'));
  check(validHash(manifestPins.suite) && validHash(manifestPins.source) && sha(suiteBytes) === manifestPins.suite && sourceManifestSha256(source) === `sha256:${manifestPins.source}`);
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
  return { tasks, suiteSha256: sha(suiteBytes), sourceSha256: sourceManifestSha256(source).slice(7) };
}
let runtimeImagePromise;
/** Read-only Docker inspection; never pull or substitute an unavailable image. */
export async function preflightLunaImages({ tasks, slots }, runtime = {}) {
  try {
    if (slots.length === 0) return;
    runtimeImagePromise ??= (async () => { register('./ts-source-loader.mjs', import.meta.url); return import('./s5-luna-task-transport.mjs'); })();
    const { LUNA_BRIDGE_RUNTIME_IMAGE } = await runtimeImagePromise;
    check(typeof LUNA_BRIDGE_RUNTIME_IMAGE === 'string' && /^golang@sha256:[a-f0-9]{64}$/.test(LUNA_BRIDGE_RUNTIME_IMAGE));
    const required = new Map([[LUNA_BRIDGE_RUNTIME_IMAGE, null]]); const byId = new Map(tasks.map(t => [t.id, t]));
    for (const slot of slots) {
      const task = byId.get(slot.task); const agent = task?.environment.agent_images[slot.harness]; check(agent && task.verifier);
      for (const image of [agent, task.verifier]) { check(typeof image.image === 'string' && /^sha256:[a-f0-9]{64}$/.test(image.image_digest));
        if (required.has(image.image)) check(required.get(image.image) === image.image_digest); required.set(image.image, image.image_digest); }
    }
    const images = [...required.keys()];
    const inspect = runtime.inspect ?? (async names => JSON.parse(execFileSync('docker', ['image', 'inspect', ...names], { encoding: 'utf8', timeout: 30000, maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] })));
    const found = await inspect(images); check(Array.isArray(found) && found.length === images.length);
    for (let i = 0; i < images.length; i++) { const item = found[i]; const expected = required.get(images[i]);
      check(item && /^sha256:[a-f0-9]{64}$/.test(item.Id));
      if (expected === null) check(Array.isArray(item.RepoDigests) && item.RepoDigests.includes(LUNA_BRIDGE_RUNTIME_IMAGE));
      else check(item.Id === expected);
    }
  } catch { throw new CampaignError('Required pinned Docker images are unavailable or changed; no pending slot was consumed.'); }
}
const CLI_VERSIONS = { codex: '0.149.1', hermes: '0.20.5', cline: '3.0.61', pi: '0.73.1', qwen: '0.22.2' };
function treeHash(root, skipGit = false) {
  check(lstatSync(root).isDirectory() && !lstatSync(root).isSymbolicLink()); const entries = []; let bytes = 0;
  const visit = (path, depth) => {
    check(depth <= 64);
    for (const name of readdirSync(join(root, path)).sort()) {
      if (skipGit && name === '.git') continue;
      check(entries.length < 100000); const relativePath = path ? `${path}/${name}` : name; const file = join(root, relativePath); const info = lstatSync(file);
      if (info.isSymbolicLink()) { const target = readlinkSync(file, { encoding: 'buffer' }); bytes += target.length; entries.push([relativePath, 'link', target.toString('base64')]); }
      else if (info.isDirectory()) { entries.push([relativePath, 'dir']); visit(relativePath, depth + 1); }
      else { check(info.isFile()); bytes += info.size; entries.push([relativePath, 'file', info.mode & 0o111 ? 1 : 0, info.size, hashFile(file)]); }
      check(bytes <= 512 * 1024 * 1024);
    }
  };
  visit('', 0); return sha(JSON.stringify(entries));
}
const omit = (object, keys) => Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key)));
function conditionWithoutImages(task) {
  return { ...omit(task, ['taskDir']), environment: { ...task.environment, agent_images: Object.fromEntries(Object.entries(task.environment.agent_images).filter(([h]) => h !== 'claude-code').map(([h, image]) => [h, omit(image, ['image', 'image_digest'])])) }, verifier: omit(task.verifier, ['image', 'image_digest']) };
}
function normalizedSource(source) {
  return { ...source, tasks: source.tasks.map(t => ({ ...omit(t, ['environment_image', 'environment_image_digest', 'verifier_image', 'verifier_image_digest', 'reference_polarity_sha256', 'agent_images']),
    agent_images: Object.fromEntries(Object.entries(t.agent_images).filter(([h]) => h !== 'claude-code').map(([h, image]) => [h, omit(image, ['image', 'image_digest'])])) })) };
}
function normalizedSuite(suite) {
  return { ...suite, source_provenance: omit(suite.source_provenance, ['source_manifest_sha256']), tasks: suite.tasks.map(t => ({ ...omit(t, ['checksum', 'source_binding']), source_binding: t.source_binding })) };
}
/** Compare task semantics independently of the rebuilt image and checksum fields. */
export function comparePreparedGenerations({ oldRoot, newRoot, oldTasks, newTasks, cliVersions }) {
  try {
    check(isDeepStrictEqual(cliVersions, CLI_VERSIONS));
    const oldSource = normalizedSource(json(join(oldRoot, 'deepswe-source-manifest.json'))), nextSource = normalizedSource(json(join(newRoot, 'deepswe-source-manifest.json')));
    const oldSuite = normalizedSuite(json(join(oldRoot, 'suite-manifest.json'))), nextSuite = normalizedSuite(json(join(newRoot, 'suite-manifest.json')));
    check(isDeepStrictEqual(oldSource, nextSource) && isDeepStrictEqual(oldSuite, nextSuite));
    check(oldTasks.length === 8 && newTasks.length === 8 && oldTasks.every((t, i) => t.id === TASK_IDS[i] && newTasks[i].id === t.id));
    const tasks = oldTasks.map((task, i) => {
      const next = newTasks[i]; check(isDeepStrictEqual(conditionWithoutImages(task), conditionWithoutImages(next)));
      const oldDir = join(oldRoot, task.id), newDir = join(newRoot, task.id);
      const taskYaml = hashFile(join(oldDir, 'task.yaml')), prompt = hashFile(join(oldDir, 'prompt.md'));
      check(taskYaml === hashFile(join(newDir, 'task.yaml')) && prompt === hashFile(join(newDir, 'prompt.md')));
      const verifier = omit(json(join(oldDir, 'verifier.json')), ['image', 'image_digest']); check(isDeepStrictEqual(verifier, omit(json(join(newDir, 'verifier.json')), ['image', 'image_digest'])));
      const oldEnvironment = json(join(oldDir, 'environment.json')), nextEnvironment = json(join(newDir, 'environment.json'));
      const normalizeEnvironment = env => ({ ...omit(env, ['agent_images']), agent_images: Object.fromEntries(Object.entries(env.agent_images).filter(([h]) => h !== 'claude-code').map(([h, image]) => [h, omit(image, ['image', 'image_digest'])])) });
      check(isDeepStrictEqual(normalizeEnvironment(oldEnvironment), normalizeEnvironment(nextEnvironment)));
      const workspace = treeHash(join(oldDir, 'workspace'), true); check(workspace === treeHash(join(newDir, 'workspace'), true));
      const normalizePolarity = root => omit(json(join(root, 'reference-polarity', `${task.id}.json`)), ['verifier_image', 'verifier_image_digest', 'created_at', 'captured_at']);
      const polarity = normalizePolarity(oldRoot), nextPolarity = normalizePolarity(newRoot);
      check(isDeepStrictEqual(polarity, nextPolarity) && polarity.reference_passed === true && polarity.samples === 5 && polarity.exit_codes.length === 5 && polarity.exit_codes.every(exit => exit === 0));
      return { task_id: task.id, task_yaml_sha256: taskYaml, prompt_sha256: prompt, workspace_visible_sha256: workspace, verifier_conditions_sha256: sha(JSON.stringify(verifier)), source_checks_sha256: sha(JSON.stringify(polarity)) };
    });
    return { schema_version: 1, normalized_source_sha256: sha(JSON.stringify(oldSource)), normalized_suite_sha256: sha(JSON.stringify(oldSuite)), cli_versions: cliVersions, tasks };
  } catch { throw new CampaignError('Prepared generations differ beyond permitted image identities.'); }
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
const REQUEST_FLAGS = ['model_matches', 'effort_low', 'summary_auto', 'store_false', 'reasoning_replay_absent', 'continuation_absent'];
function interruptedStream(dir, run, events, attempts, observed, api) {
  const last = attempts.at(-1); const complete = e => api.isSuccessfulModelEvent(e) && e.protocol === 'openai_responses'
    && e.model_requested === LUNA_MODEL && e.model_served === LUNA_MODEL && e.usage !== null && e.usage_source !== 'unavailable';
  if (!last || events.at(-1) !== last || !attempts.slice(0, -1).every(complete)
    || last.protocol !== 'openai_responses' || last.method !== 'POST' || last.model_requested !== LUNA_MODEL
    || last.status !== 0 || last.streamed !== true || !Number.isFinite(last.t_upstream_sent) || last.error?.kind !== 'network'
    || last.model_served !== null || last.usage !== null || last.usage_source !== 'unavailable'
    || run.outcome !== 'adapter_error' || run.adapter_result.exitCode !== 1 || run.verification.exit !== 1 || run.verification.duration_ms !== 0
    || regularBytes(join(dir, 'verify.log')).length !== 0 || !allowedMetadata(observed, run.tool)
    || !Array.isArray(observed.requests) || observed.requests.length < attempts.length || observed.requests.length > 1040
    || observed.gate_refused !== observed.requests.length - attempts.length
    || !observed.requests.every((r, i) => r.accepted === (i < attempts.length) && REQUEST_FLAGS.every(k => r[k] === true))) return false;
  const path = join(dir, 'events.jsonl.upstream.jsonl'); if (!exists(path)) return false;
  const upstream = regularBytes(path).toString('utf8').trim().split('\n').filter(Boolean).map(JSON.parse);
  return upstream.length === events.length && upstream.every((u, i) => u.v === 1 && u.run_id === events[i].run_id && u.seq === events[i].seq
    && u.c1_sha256 === sha(`${JSON.stringify(events[i])}\n`)) && upstream.at(-1).upstream_status === 200 && upstream.at(-1).error === null;
}
function validateAdmissionOrder(state) {
  check(Array.isArray(state.admission_order) && new Set(state.admission_order).size === state.admission_order.length);
  const consumed = new Set(state.cells.filter(c => c.status !== 'pending').map(c => c.run_id));
  check(state.admission_order.length === consumed.size && state.admission_order.every(id => consumed.has(id)));
}
function transportFailureStreak(state) {
  const cells = new Map(state.cells.map(c => [c.run_id, c])); let count = 0;
  for (const id of [...state.admission_order].reverse()) { if (cells.get(id).status !== 'transport_failed') break; count++; }
  return count;
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
  const accountingComplete = attempts.every(e => api.isSuccessfulModelEvent(e) && e.protocol === 'openai_responses' && e.model_requested === LUNA_MODEL && e.model_served === LUNA_MODEL && e.usage !== null && e.usage_source !== 'unavailable');
  const transport = json(join(dir, 'transport.json')); const observed = json(join(dir, 'bridge-conditions.json'));
  check(transport.model === LUNA_MODEL && transport.policy === CONTROLLED_POLICY && transport.bridge_binary_sha256 === definition.bridge_binary_sha256
    && transport.refresh_token_imported === false && transport.subscription_usd === null && transport.timeout_s === 10800
    && transport.max_model_requests === 512 && transport.max_input_tokens === 100000000 && transport.max_output_tokens === 1000000);
  if (interruptedStream(dir, run, events, attempts, observed, api)) return { status: 'transport_failed', failure_reason: 'upstream_stream_interrupted', accounting: 'incomplete', hashes };
  check(accountingComplete);
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

async function campaignDefinition(options, deps, manifestPins) {
    const api = { ...await contracts(), ...await import('./s7-luna-no-solution.mjs') };
    const loaded = await (deps.loadTasks ?? loadTasks)({ taskRoot: realpathSync(options.taskRoot), manifestPins });
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

function manifestPins(definition) { return { suite: definition.suite_sha256, source: definition.source_sha256 }; }
async function campaignContext(options, deps, state) {
  if (!state?.environment_adjudication) return campaignDefinition(options, deps);
  const receiptBytes = regularBytes(join(options.output, ENVIRONMENT_RECEIPT)); check(sha(receiptBytes) === state.environment_adjudication);
  const receipt = JSON.parse(receiptBytes); check(realpathSync(options.taskRoot) === receipt.active_task_root);
  const context = await campaignDefinition(options, deps, receipt.active_manifest);
  const old = json(join(options.output, ENVIRONMENT_BACKUP));
  const previous = await campaignDefinition({ ...options, taskRoot: receipt.previous_task_root }, { ...deps, implementationHash: async () => old.definition.implementation_sha256 }, manifestPins(old.definition));
  check(isDeepStrictEqual(previous.definition, old.definition));
  return { ...context, previousGeneration: previous, generationReceipt: receipt };
}
function contextForCell(context, cell) {
  return context.generationReceipt?.preserved_run_ids.includes(cell.run_id) ? context.previousGeneration : context;
}
function setupTree(dir, task, cell) {
  const names = readdirSync(dir).sort();
  check(isDeepStrictEqual(names, ['bridge-conditions.json', 'events.jsonl', 'events.jsonl.upstream.jsonl', 'prompt.md', 'verifier.json', 'workspace'].sort()));
  check(regularBytes(join(dir, 'events.jsonl')).length === 0 && regularBytes(join(dir, 'events.jsonl.upstream.jsonl')).length === 0);
  const observed = json(join(dir, 'bridge-conditions.json'));
  check(observed.schema_version === 1 && Array.isArray(observed.requests) && observed.requests.length === 0 && observed.gate_refused === 0 && observed.front_refused === 0 && allowedMetadata(observed, cell.harness));
  check(hashFile(join(dir, 'prompt.md')) === hashFile(join(task.taskDir, 'prompt.md')) && isDeepStrictEqual(json(join(dir, 'verifier.json')), json(join(task.taskDir, 'verifier.json'))));
  const workspace = join(dir, 'workspace');
  check(!['.aob-home', '.aob-codex-home', '.aob-qwen-home', '.aob-pi-home', '.aob-cline-home', 'stdout.log', 'stderr.log', 'tool-events.jsonl'].some(name => exists(join(workspace, name))));
  return treeHash(dir);
}
function validateRestoration(proof, oldRoot, newRoot, oldContext, nextContext) {
  check(proof.status === 'verified' && realpathSync(proof.old_root) === oldRoot && realpathSync(proof.new_root) === newRoot);
  check(proof.old_suite_manifest_sha256 === hashFile(join(oldRoot, 'suite-manifest.json')) && proof.suite_manifest_sha256 === hashFile(join(newRoot, 'suite-manifest.json'))
    && proof.old_source_manifest_sha256 === hashFile(join(oldRoot, 'deepswe-source-manifest.json')) && proof.source_manifest_sha256 === hashFile(join(newRoot, 'deepswe-source-manifest.json'))
    && proof.old_canonical_source_manifest_sha256 === oldContext.definition.source_sha256 && proof.canonical_source_manifest_sha256 === nextContext.definition.source_sha256
    && proof.old_suite_manifest_sha256 === oldContext.definition.suite_sha256 && proof.suite_manifest_sha256 === nextContext.definition.suite_sha256);
  check(isDeepStrictEqual(proof.cli_versions, CLI_VERSIONS) && proof.cli_image_ids && HARNESS_ORDER.every(h => /^sha256:[a-f0-9]{64}$/.test(proof.cli_image_ids[h])) && validHash(proof.archive_sha256));
  const equivalence = comparePreparedGenerations({ oldRoot, newRoot, oldTasks: [...oldContext.tasks.values()], newTasks: [...nextContext.tasks.values()], cliVersions: proof.cli_versions });
  check(Array.isArray(proof.tasks) && proof.tasks.length === 8 && new Set(proof.tasks.map(t => t.task_id)).size === 8);
  const source = json(join(newRoot, 'deepswe-source-manifest.json'));
  for (const task of equivalence.tasks) {
    const report = proof.tasks.find(t => t.task_id === task.task_id), origin = source.tasks.find(t => t.id === task.task_id), prepared = nextContext.tasks.get(task.task_id);
    check(report && report.prompt_sha256 === task.prompt_sha256 && report.workspace_revision === prepared.baseRevision && report.upstream_revision === origin.upstream_revision
      && report.timeout_s === prepared.timeoutS && isDeepStrictEqual(report.expected_minutes, origin.expected_minutes) && report.verifier_behavior_unchanged === true
      && report.new_verifier_image === prepared.verifier.image_digest && report.old_verifier_image === oldContext.tasks.get(task.task_id).verifier.image_digest
      && report.reference_polarity_sha256 === hashFile(join(newRoot, 'reference-polarity', `${task.task_id}.json`)));
  }
  return equivalence;
}
function environmentEvidence(output, oldBytes, context, proofBytes, expectedStateHash, deps, setupDir) {
  const old = JSON.parse(oldBytes), previous = context.previousGeneration, receipt = context.generationReceipt;
  check(validHash(expectedStateHash) && sha(oldBytes) === expectedStateHash && isDeepStrictEqual(old.definition, previous.definition)
    && old.schema_version === 1 && old.official_release === false && old.collection === 'diagnostic' && old.halted === true && old.halt_reason === 'attempt-or-accounting-failed'
    && !old.environment_adjudication && old.definition.implementation_sha256 !== context.definition.implementation_sha256);
  check(typeof old.session === 'string' && /^[a-f0-9]{16}$/.test(old.session) && Array.isArray(old.cells) && old.cells.length === 200);
  const expectedSchedule = schedule(old.session);
  check(old.cells.every((cell, index) => ['harness', 'task', 'rep', 'run_id'].every(key => cell[key] === expectedSchedule[index][key])));
  check(validateAdjudication(output, old, previous, deps)); validateAdmissionOrder(old);
  const lastId = old.admission_order.at(-1), index = old.cells.findIndex(c => c.run_id === lastId), reset = old.cells[index];
  check(reset?.status === 'blocked' && old.cells.filter(c => ['blocked', 'started'].includes(c.status)).length === 1);
  const consumed = old.cells.filter(c => ['completed', 'task_failed', 'transport_failed'].includes(c.status));
  check(consumed.length === old.admission_order.length - 1 && old.cells.every(c => c === reset || c.status === 'pending' || consumed.includes(c)));
  const archiveHash = setupTree(setupDir, previous.tasks.get(reset.task), reset);
  for (const cell of consumed) {
    const checked = inspectAttempt(cellDirectory(output, cell), cell, previous.tasks.get(cell.task), previous.definition, previous.api, cell === old.cells[1]);
    check(checked.status === cell.status && checked.failure_reason === cell.failure_reason && checked.accounting === cell.accounting && isDeepStrictEqual(checked.hashes, cell.hashes));
  }
  const oldRoot = receipt.previous_task_root, newRoot = receipt.active_task_root;
  const proof = JSON.parse(proofBytes), equivalence = validateRestoration(proof, oldRoot, newRoot, previous, context);
  const oldConditions = omit(old.definition, ['implementation_sha256', 'source_sha256', 'suite_sha256', 'tasks']);
  const nextConditions = omit(context.definition, ['implementation_sha256', 'source_sha256', 'suite_sha256', 'tasks']); check(isDeepStrictEqual(oldConditions, nextConditions));
  const expected = { schema_version: 1, classification: 'unstarted-setup-and-equivalent-image-generation', previous_state_sha256: expectedStateHash,
    previous_implementation_sha256: old.definition.implementation_sha256, active_implementation_sha256: context.definition.implementation_sha256,
    previous_task_root: oldRoot, active_task_root: newRoot, active_manifest: manifestPins(context.definition), restoration_proof_sha256: sha(proofBytes),
    equivalence, equivalence_sha256: sha(JSON.stringify(equivalence)), setup_run_id: reset.run_id, setup_index: index,
    setup_archive: `setup-archives/${reset.run_id}`, setup_tree_sha256: archiveHash, preserved_run_ids: old.admission_order.slice(0, -1),
    prior_receipts: Object.fromEntries(Object.entries(old).filter(([k]) => k.endsWith('_adjudication'))) };
  return { old, expected, reset, index, consumed };
}
function validateEnvironmentAdjudication(output, state, context, deps) {
  const receiptBytes = regularBytes(join(output, ENVIRONMENT_RECEIPT)); check(sha(receiptBytes) === state.environment_adjudication);
  const receipt = JSON.parse(receiptBytes); check(isDeepStrictEqual(receipt, context.generationReceipt));
  const priorBytes = regularBytes(join(output, ENVIRONMENT_BACKUP)), proofBytes = regularBytes(join(output, RESTORATION_PROOF));
  check(receipt.setup_archive === `setup-archives/${receipt.setup_run_id}` && /^[A-Za-z0-9_-]{1,160}$/.test(receipt.setup_run_id));
  const result = environmentEvidence(output, priorBytes, context, proofBytes, receipt.previous_state_sha256, deps, join(output, receipt.setup_archive));
  check(isDeepStrictEqual(receipt, result.expected) && state.session === result.old.session && isDeepStrictEqual(state.admission_order.slice(0, receipt.preserved_run_ids.length), receipt.preserved_run_ids));
  for (const cell of result.consumed) check(isDeepStrictEqual(state.cells.find(c => c.run_id === cell.run_id), cell));
  for (const [key, value] of Object.entries(receipt.prior_receipts)) check(state[key] === value);
  for (const cell of state.cells) if (!receipt.preserved_run_ids.includes(cell.run_id) && cell.status !== 'pending') check(cell.environment_generation === state.environment_adjudication);
  return true;
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
  if (state.environment_adjudication) return validateEnvironmentAdjudication(output, state, context, deps);
  if (state.transport_adjudication) return validateTransportAdjudication(output, state, context, deps);
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
function transportEvidence(output, oldBytes, context, deps) {
  const pins = deps.transportPins ?? TRANSPORT_PINS; const old = JSON.parse(oldBytes); const { api, tasks, definition } = context;
  check(sha(oldBytes) === pins.state && old.schema_version === 1 && old.official_release === false && old.collection === 'diagnostic'
    && old.halted === true && old.halt_reason === 'attempt-or-accounting-failed' && old.session === pins.session
    && old.definition.implementation_sha256 === pins.implementation && definition.implementation_sha256 !== pins.implementation
    && isDeepStrictEqual({ ...old.definition, implementation_sha256: definition.implementation_sha256 }, definition)
    && !old.transport_adjudication && old.no_solution_adjudication === pins.third_receipt);
  check(Array.isArray(old.cells) && old.cells.length === 200);
  check(validateAdjudication(output, old, { ...context, definition: old.definition }, deps));
  const expected = schedule(old.session);
  for (let i = 0; i < expected.length; i++) check(['harness', 'task', 'rep', 'run_id'].every(k => old.cells[i][k] === expected[i][k])
    && old.cells[i].status === (i === 10 ? 'completed' : i < 20 ? 'task_failed' : i === 20 ? 'blocked' : 'pending'));
  const dir = cellDirectory(output, old.cells[20]);
  for (const [name, pin] of [['run.json', 'run'], ['events.jsonl', 'events'], ['bridge-conditions.json', 'observations'], ['events.jsonl.upstream.jsonl', 'upstream'], ['candidate-evidence.json', 'candidate_evidence']]) check(hashFile(join(dir, name)) === pins[pin]);
  check(pins.candidate_patch === null ? !exists(join(dir, 'candidate.patch')) : hashFile(join(dir, 'candidate.patch')) === pins.candidate_patch);
  const observed = json(join(dir, 'bridge-conditions.json')); check(observed.requests.length === 18 && observed.gate_refused === 1);
  const canonical = regularBytes(join(dir, 'events.jsonl')).toString('utf8').trim().split('\n').map(line => api.validateC1Event(JSON.parse(line)));
  check(canonical.filter(api.isModelRequestAttempt).length === 17);
  const checked = old.cells.slice(0, 21).map((cell, i) => inspectAttempt(cellDirectory(output, cell), cell, tasks.get(cell.task), definition, api, i === 1));
  check(checked.slice(0, 20).every((c, i) => c.status === old.cells[i].status && c.failure_reason === old.cells[i].failure_reason && c.accounting === old.cells[i].accounting && isDeepStrictEqual(c.hashes, old.cells[i].hashes))
    && checked[20].status === 'transport_failed' && checked[20].accounting === 'incomplete');
  const admissionOrder = old.cells.slice(0, 21).map(c => c.run_id);
  if (old.admission_order !== undefined) check(isDeepStrictEqual(old.admission_order, admissionOrder));
  const receipt = { schema_version: 1, classification: 'interrupted_upstream_stream', accounting: 'incomplete',
    old_state_sha256: pins.state, old_implementation_sha256: pins.implementation, new_implementation_sha256: definition.implementation_sha256,
    third_receipt_sha256: pins.third_receipt, session: old.session, admission_order: admissionOrder,
    preserved_cells: old.cells.slice(0, 21).map((c, i) => ({ run_id: c.run_id, hashes: checked[i].hashes, original_implementation_sha256: i < 9 ? c.original_implementation_sha256 : pins.implementation })) };
  const preserved = old.cells.slice(0, 21).map((c, i) => i < 9 ? c : ({ ...c, ...checked[i], original_implementation_sha256: pins.implementation,
    ...(i === 20 ? { transport_classification: 'observed', admission: 'funded-repetition' } : {}) }));
  return { old, receipt, preserved, admissionOrder };
}
function validateTransportAdjudication(output, state, context, deps) {
  const bytes = regularBytes(join(output, TRANSPORT_RECEIPT)); check(sha(bytes) === state.transport_adjudication);
  const expected = transportEvidence(output, regularBytes(join(output, TRANSPORT_BACKUP)), context, deps);
  check(isDeepStrictEqual(JSON.parse(bytes), expected.receipt) && state.session === expected.old.session
    && ['legacy_metadata_adjudication', 'repeated_metadata_adjudication', 'no_solution_adjudication'].every(k => state[k] === expected.old[k])
    && isDeepStrictEqual(state.cells.slice(0, 21), expected.preserved)
    && isDeepStrictEqual(state.admission_order.slice(0, 21), expected.admissionOrder)
    && state.cells.slice(21).every(c => c.legacy_metadata_classification === undefined && c.repeated_metadata_classification === undefined && c.no_solution_classification === undefined && c.transport_classification === undefined && c.original_implementation_sha256 === undefined));
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

/** Preserve one known interrupted attempt as unscored; never replay its requests. */
export async function repairLunaTransportStop(options, deps = {}) {
  let lockFd; let lockPath;
  try {
    check(options && ['taskRoot', 'output', 'privateRoot', 'authFile', 'bridgeBinary'].every(k => typeof options[k] === 'string' && isAbsolute(options[k])));
    check((deps.platform ?? process.platform) === 'linux'); const output = privateDirectory(options.output); const privateRoot = privateDirectory(options.privateRoot);
    check(!within(output, privateRoot) && !within(privateRoot, output));
    lockPath = join(output, 'campaign.lock'); lockFd = openSync(lockPath, 'wx', 0o600);
    const context = await campaignDefinition(options, deps); const path = join(output, 'state.json'); const oldBytes = regularBytes(path);
    const { old, receipt, preserved, admissionOrder } = transportEvidence(output, oldBytes, context, deps);
    check(!exists(join(output, TRANSPORT_BACKUP)) && !exists(join(output, TRANSPORT_RECEIPT)));
    exclusiveEvidence(join(output, TRANSPORT_BACKUP), oldBytes);
    const receiptBytes = Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`); exclusiveEvidence(join(output, TRANSPORT_RECEIPT), receiptBytes);
    const next = { ...old, definition: context.definition, halted: false, cells: [...preserved, ...old.cells.slice(21)], admission_order: admissionOrder, transport_adjudication: sha(receiptBytes) };
    delete next.halt_reason; saveState(path, next); return next;
  } catch (error) { throw error instanceof CampaignError ? error : new CampaignError(); }
  finally { if (lockFd !== undefined) { closeSync(lockFd); rmSync(lockPath); } }
}

/** Archive a proven pre-native setup failure and admit only equivalent rebuilt images. */
export async function repairLunaEnvironmentSetup(options, deps = {}) {
  let lockFd; let lockPath;
  try {
    check(options && ['taskRoot', 'previousTaskRoot', 'restorationProofPath', 'output', 'privateRoot', 'authFile', 'bridgeBinary'].every(k => typeof options[k] === 'string' && isAbsolute(options[k]))
      && validHash(options.expectedStateSha256) && validHash(options.expectedRestorationProofSha256));
    check((deps.platform ?? process.platform) === 'linux'); const output = privateDirectory(options.output); const privateRoot = privateDirectory(options.privateRoot);
    check(!within(output, privateRoot) && !within(privateRoot, output));
    lockPath = join(output, 'campaign.lock'); lockFd = openSync(lockPath, 'wx', 0o600);
    const path = join(output, 'state.json'), oldBytes = regularBytes(path); check(sha(oldBytes) === options.expectedStateSha256); const old = JSON.parse(oldBytes);
    const proofBytes = regularBytes(options.restorationProofPath); check(sha(proofBytes) === options.expectedRestorationProofSha256); const proof = JSON.parse(proofBytes);
    const oldRoot = realpathSync(options.previousTaskRoot), newRoot = realpathSync(options.taskRoot); check(oldRoot !== newRoot && realpathSync(proof.old_root) === oldRoot && realpathSync(proof.new_root) === newRoot);
    const active = await campaignDefinition(options, deps, { suite: proof.suite_manifest_sha256, source: proof.canonical_source_manifest_sha256 });
    const previous = await campaignDefinition({ ...options, taskRoot: oldRoot }, { ...deps, implementationHash: async () => old.definition.implementation_sha256 }, manifestPins(old.definition));
    const context = { ...active, previousGeneration: previous, generationReceipt: { previous_task_root: oldRoot, active_task_root: newRoot } };
    const reset = old.cells.find(c => c.run_id === old.admission_order?.at(-1)); check(reset);
    const setupDir = cellDirectory(output, reset);
    const evidence = environmentEvidence(output, oldBytes, context, proofBytes, options.expectedStateSha256, deps, setupDir);
    await (deps.preflightImages ?? preflightLunaImages)({ tasks: [...active.tasks.values()], slots: old.cells.filter(c => c.status === 'pending' || c === reset) });
    const archive = join(output, evidence.expected.setup_archive);
    check(!exists(archive) && [ENVIRONMENT_BACKUP, ENVIRONMENT_RECEIPT, RESTORATION_PROOF].every(name => !exists(join(output, name))));
    const archiveRoot = privateDirectory(join(output, 'setup-archives')); check(dirname(archive) === archiveRoot);
    const receiptBytes = Buffer.from(`${JSON.stringify(evidence.expected, null, 2)}\n`);
    // Exclusive immutable records precede the atomic state replacement. Any
    // interrupted transition remains halted; neither archive nor proof is overwritten.
    exclusiveEvidence(join(output, ENVIRONMENT_BACKUP), oldBytes); exclusiveEvidence(join(output, RESTORATION_PROOF), proofBytes);
    exclusiveEvidence(join(output, ENVIRONMENT_RECEIPT), receiptBytes); renameSync(setupDir, archive);
    const pending = schedule(old.session)[evidence.index];
    const next = { ...old, definition: active.definition, halted: false, preflight_blocked: false,
      cells: old.cells.map((cell, index) => index === evidence.index ? pending : cell), admission_order: old.admission_order.slice(0, -1), environment_adjudication: sha(receiptBytes) };
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
    const path = join(output, 'state.json');
    const context = await campaignContext(options, deps, exists(path) ? json(path) : null);
    const { api, tasks, definition } = context; let state;
    if (exists(path)) {
      state = json(path); check(state.schema_version === 1 && state.official_release === false && isDeepStrictEqual(state.definition, definition)
        && typeof state.session === 'string' && /^[a-f0-9]{16}$/.test(state.session) && Array.isArray(state.cells) && state.cells.length === 200 && typeof state.halted === 'boolean');
      const adjudicated = validateAdjudication(output, state, context, deps);
      const expected = schedule(state.session);
      for (let i = 0; i < expected.length; i++) {
        const cell = state.cells[i]; const e = expected[i]; check(cell && ['pending', 'started', 'completed', 'task_failed', 'transport_failed', 'blocked'].includes(cell.status)
          && ['harness', 'task', 'rep', 'run_id'].every(k => cell[k] === e[k]));
        if (['completed', 'task_failed', 'transport_failed'].includes(cell.status)) {
          const historical = contextForCell(context, cell);
          const checked = inspectAttempt(cellDirectory(output, cell), cell, historical.tasks.get(cell.task), historical.definition, api, adjudicated && i === 1);
          check(checked.status === cell.status && checked.failure_reason === cell.failure_reason && checked.accounting === cell.accounting && isDeepStrictEqual(checked.hashes, cell.hashes));
        }
        if (cell.status === 'started' || cell.status === 'blocked') { state.halted = true; state.halt_reason = 'consumed-attempt-requires-investigation'; }
      }
    } else {
      const session = randomBytes(8).toString('hex'); state = { schema_version: 1, official_release: false, collection: 'diagnostic', session, definition,
        created_at: new Date().toISOString(), halted: false, cells: schedule(session), admission_order: [] };
    }
    validateAdmissionOrder(state);
    if (transportFailureStreak(state) >= 2) { state.halted = true; state.halt_reason = 'consecutive-transport-failures'; }
    saveState(path, state); if (state.halted) return state;
    const execute = deps.runCell ?? (await import('@aob/runner')).runDockerCell;
    const factory = deps.createTransportFactory ?? (await import('./s5-luna-task-transport.mjs')).createLunaTaskTransportFactory;
    const preflight = async slots => {
      try { await (deps.preflightImages ?? preflightLunaImages)({ tasks: [...tasks.values()], slots }); state.preflight_blocked = false; }
      catch { state.preflight_blocked = true; saveState(path, state); return false; }
      return true;
    };
    if (!await preflight(state.cells.filter(c => c.status === 'pending' && selected.includes(c.harness)))) return state;
    for (const cell of state.cells) {
      if (cell.status !== 'pending' || !selected.includes(cell.harness)) continue;
      const task = tasks.get(cell.task); const dir = cellDirectory(output, cell);
      if (exists(dir)) { state.admission_order.push(cell.run_id); if (state.environment_adjudication) cell.environment_generation = state.environment_adjudication; cell.status = 'blocked'; state.halted = true; state.halt_reason = 'existing-attempt-directory'; saveState(path, state); break; }
      if (!await preflight([cell])) return state;
      state.admission_order.push(cell.run_id); if (state.environment_adjudication) cell.environment_generation = state.environment_adjudication; cell.status = 'started'; cell.started_at = new Date().toISOString(); saveState(path, state);
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
      if (transportFailureStreak(state) >= 2) { state.halted = true; state.halt_reason = 'consecutive-transport-failures'; }
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
  Promise.resolve().then(() => runCampaign(parseOptions(process.argv.slice(2)))).then(state => { if (state.halted || state.preflight_blocked) process.exitCode = 1; })
    .catch(() => { process.stderr.write('Luna campaign refused; inspect private state before any further execution.\n'); process.exitCode = 1; });
}
