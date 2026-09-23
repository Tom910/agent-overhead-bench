import { createHash, randomBytes } from 'node:crypto';
import { constants, openSync, closeSync, fstatSync, readSync, lstatSync, mkdirSync } from 'node:fs';
import { join, isAbsolute } from 'node:path';
import { execFile, execFileSync } from 'node:child_process';
import { isDeepStrictEqual, promisify } from 'node:util';
import { register } from 'node:module';
register('./ts-source-loader.mjs', import.meta.url);
const { prepareCandidateBaseline, releaseCandidateBaseline } = await import('../packages/runner/src/candidate-evidence.ts');
const { loadTaskYaml } = await import('@aob/tasks');
const exec = promisify(execFile);
const HASH = /^sha256:[a-f0-9]{64}$/;
const sha = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
const HELPER_SHA = 'sha256:0e765789f08663ae455e14cf8a2db1186969310e59d5d55650b762e3d8789ddf';
const EMPTY_SHA = sha('');
export class NoSolutionProofError extends Error {
  constructor() { super('Cannot prove an empty verifier patch from retained evidence.'); this.name = 'NoSolutionProofError'; }
}
const check = value => { if (!value) throw new NoSolutionProofError(); };
function regular(path, limit = 1024 * 1024) {
  const fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
  try {
    const before = fstatSync(fd); check(before.isFile() && before.size <= limit);
    const buffer = Buffer.alloc(before.size + 1); let size = 0;
    while (size < buffer.length) { const n = readSync(fd, buffer, size, buffer.length - size, null); if (!n) break; size += n; }
    const after = fstatSync(fd); check(size === before.size && before.size === after.size && before.mtimeMs === after.mtimeMs && before.ctimeMs === after.ctimeMs);
    return buffer.subarray(0, size);
  } finally { closeSync(fd); }
}
function bindings({ cellDir, taskDir }) {
  for (const dir of [cellDir, taskDir]) { check(typeof dir === 'string' && isAbsolute(dir)); const info = lstatSync(dir); check(info.isDirectory() && !info.isSymbolicLink()); }
  const runBytes = regular(join(cellDir, 'run.json')), run = JSON.parse(runBytes);
  const log = regular(join(cellDir, 'verify.log'), 1);
  check(run.model === 'gpt-6-luna' && run.adapter_result?.exitCode === 0 && run.outcome === 'verify_error' && run.verification?.exit === 1 && log.length === 0);
  const candidateBytes = regular(join(cellDir, 'candidate-evidence.json')), candidate = JSON.parse(candidateBytes);
  const patch = regular(join(cellDir, 'candidate.patch'), 16 * 1024 * 1024);
  const taskBytes = regular(join(taskDir, 'task.yaml'));
  const yaml = loadTaskYaml(join(taskDir, 'task.yaml'));
  const verifierBytes = regular(join(taskDir, 'verifier.json')), verifier = JSON.parse(verifierBytes);
  const cellVerifierBytes = regular(join(cellDir, 'verifier.json'));
  const environment = JSON.parse(regular(join(taskDir, 'environment.json')));
  const agent = environment.agent_images?.[run.tool]?.image_digest;
  check(HASH.test(agent) && HASH.test(verifier.image_digest) && verifier.kind === 'docker-command' && verifier.network === 'none'
    && isDeepStrictEqual(JSON.parse(cellVerifierBytes), verifier));
  check(run.task_id === yaml.id && run.task_revision === yaml.source.revision && run.task_base_revision === yaml.source.base_revision
    && /^[a-f0-9]{40}$/.test(run.task_base_revision) && run.container?.verifier_image_digest === verifier.image_digest && run.task_environment?.agent_image_digest === agent);
  check(candidate.schema_version === 1 && candidate.status === 'captured' && candidate.reason === null && candidate.projection === 'prepared-visible-files-v1'
    && candidate.run_id === run.run_id && candidate.run_sha256 === sha(runBytes) && candidate.task_id === run.task_id
    && candidate.declared_base_revision === run.task_base_revision && candidate.task_revision === run.task_revision
    && candidate.agent_image_identity === agent && candidate.verifier_image_identity === verifier.image_digest
    && candidate.patch?.bytes === patch.length && candidate.patch.sha256 === sha(patch) && HASH.test(candidate.prepared_tree_sha256)
    && Array.isArray(candidate.excluded_root_paths));
  const proof = { schema_version: 1, kind: 'verifier-empty-patch-proof', run_id: run.run_id, task_id: run.task_id,
    task_revision: run.task_revision, declared_base_revision: run.task_base_revision,
    run_sha256: sha(runBytes), verify_log_sha256: sha(log), candidate_evidence_sha256: sha(candidateBytes),
    candidate_patch_sha256: sha(patch), candidate_patch_bytes: patch.length, prepared_tree_sha256: candidate.prepared_tree_sha256,
    prepared_task_sha256: sha(taskBytes), prepared_verifier_sha256: sha(verifierBytes), cell_verifier_sha256: sha(cellVerifierBytes),
    agent_image_digest: agent, verifier_image_digest: verifier.image_digest, capture_helper_sha256: HELPER_SHA,
    capture_exit: 0, model_patch_bytes: 0, model_patch_sha256: EMPTY_SHA, network: 'none', native_exit: 0, verifier_exit: 1 };
  return { proof, candidate, patch };
}

/** Receipt validation is read-only: no Docker, agent execution, or workspace reconstruction. */
export function validateNoSolutionProof({ cellDir, taskDir, proof }) {
  try { check(isDeepStrictEqual(proof, bindings({ cellDir, taskDir }).proof)); return proof; }
  catch { throw new NoSolutionProofError(); }
}
async function capture({ image, workspace, outputDir }) {
  const name = `aob-empty-proof-${randomBytes(10).toString('hex')}`;
  try {
    const result = await exec('docker', ['run', '--rm', '--pull=never', '--name', name, '--network', 'none', '--read-only',
      '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--cpus', '1', '--memory', '2g', '--pids-limit', '128',
      '--user', `${process.getuid()}:${process.getgid()}`, '--tmpfs', '/tmp:rw,exec,size=1g',
      '-e', 'GIT_CONFIG_COUNT=1', '-e', 'GIT_CONFIG_KEY_0=safe.directory', '-e', 'GIT_CONFIG_VALUE_0=/app',
      '-v', `${workspace}:/candidate:rw`, '-v', `${outputDir}:/proof:rw`, '--entrypoint', '/bin/sh', image, '-c',
      'set -eu; sha256sum /usr/local/bin/aob-capture-model-patch; git -C /app rev-parse HEAD; /usr/local/bin/aob-capture-model-patch /app /candidate /proof/model.patch'],
    { timeout: 90000, killSignal: 'SIGKILL', maxBuffer: 1024 * 1024 });
    const lines = result.stdout.trim().split('\n');
    check(lines.length === 2 && /^[a-f0-9]{64}  \/usr\/local\/bin\/aob-capture-model-patch$/.test(lines[0]));
    return { exitCode: 0, helperSha256: `sha256:${lines[0].split(' ', 1)[0]}`, baseRevision: lines[1] };
  } finally {
    await exec('docker', ['rm', '-f', name], { timeout: 15000, maxBuffer: 1024 * 1024 }).catch(() => {});
  }
}
/** Produces a receipt only; the caller exclusively persists it after its own C1 admission checks. */
export async function createNoSolutionProof({ cellDir, taskDir }, runtime = {}) {
  let baseline;
  try {
    const original = bindings({ cellDir, taskDir });
    baseline = prepareCandidateBaseline(join(taskDir, 'workspace'));
    check(baseline.status === 'ready' && baseline.tree_sha256 === original.candidate.prepared_tree_sha256
      && isDeepStrictEqual(baseline.excluded, original.candidate.excluded_root_paths));
    const workspace = join(baseline.directory, 'a'), outputDir = join(baseline.directory, 'capture'); mkdirSync(outputDir, { mode: 0o700 });
    if (original.patch.length > 0) {
      const options = { cwd: workspace, input: original.patch, timeout: 30000, maxBuffer: 1024 * 1024,
        env: { PATH: '/usr/bin:/bin', HOME: baseline.directory, LC_ALL: 'C', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null', GIT_ATTR_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0' } };
      execFileSync('git', ['apply', '--check', '--binary', '-p1', '-'], options);
      execFileSync('git', ['apply', '--binary', '-p1', '-'], options);
    }
    const result = await (runtime.capture ?? capture)({ image: original.proof.verifier_image_digest, workspace, outputDir });
    check(result.exitCode === 0 && result.helperSha256 === HELPER_SHA && result.baseRevision === original.proof.declared_base_revision);
    check(regular(join(outputDir, 'model.patch'), 1).length === 0);
    validateNoSolutionProof({ cellDir, taskDir, proof: original.proof });
    return original.proof;
  } catch { throw new NoSolutionProofError(); }
  finally { if (baseline) releaseCandidateBaseline(baseline); }
}
