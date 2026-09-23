import { createHash, randomBytes } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { lstat, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { prepareCodexBridge, BRIDGE_COMMIT, LUNA_MODEL, CONTROLLED_POLICY } from './s2-codex-bridge-prepare.mjs';
import { startBridgeService } from './s2-codex-bridge-service.mjs';

export const LUNA_BRIDGE_BINARY_SHA256 = '6ac16cf587b39083b15616fea2ed3e276fa85b3ef95d8ba4084f8166408fa58e';
const GO_IMAGE = 'golang@sha256:2a0ba12e116687098780d3ce700f9ce3cb340783779646aafbabed748fa6677c';
const exec = promisify(execFile);
export class LunaTransportError extends Error {
  constructor() { super('Luna task transport failed; inspect sanitized campaign state.'); this.name = 'LunaTransportError'; }
}
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
async function docker(args) {
  try { return (await exec('docker', args, { timeout: 60000, maxBuffer: 1024 * 1024 })).stdout.trim(); }
  catch { throw new LunaTransportError(); }
}
const defaults = {
  platform: process.platform,
  async verifyBinary(path) {
    const stat = await lstat(path);
    if (!stat.isFile() || stat.isSymbolicLink() || sha(await readFile(path)) !== LUNA_BRIDGE_BINARY_SHA256) throw new LunaTransportError();
  },
  async startContainer(binary, bundle, name) {
    await docker(['run', '-d', '--pull=never', '--name', name, '--network', 'host',
      '--user', `${process.getuid()}:${process.getgid()}`, '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges',
      '-v', `${binary}:/bridge:ro`, '-v', `${bundle}:${bundle}:ro`, GO_IMAGE, '/bridge', '-config', join(bundle, 'config.json')]);
    return name;
  },
  stopContainer: name => docker(['rm', '-f', name]),
  async waitReady(service, authToken) {
    for (let attempt = 0; attempt < 60; attempt++) {
      try {
        const response = await fetch(`${service.frontUrl}/v1/models`, { headers: { 'x-aob-proxy-token': authToken }, signal: AbortSignal.timeout(1500) });
        if (response.ok && (await response.json()).data?.some(model => model.id === LUNA_MODEL)) return;
      } catch { /* Readiness requests contain no prompts and use no model allowance. */ }
      await sleep(250);
    }
    throw new LunaTransportError();
  },
  startService: startBridgeService,
};

/** A lifecycle adapter for canonical Docker cells, not a second measurement writer.
 * runtime is dependency injection for offline tests; the campaign exposes no override.
 */
export function createLunaTaskTransportFactory(options, runtime = {}) {
  const impl = { ...defaults, ...runtime };
  if (impl.platform !== 'linux' || !options || !['authFile', 'bridgeBinary', 'privateRoot'].every(key => typeof options[key] === 'string' && isAbsolute(options[key]))
    || !Number.isSafeInteger(options.timeoutS) || options.timeoutS < 1 || options.timeoutS > 10800) throw new LunaTransportError();
  return async ({ runId, eventsPath, authToken }) => {
    const bundle = join(options.privateRoot, `bundle-${randomBytes(12).toString('hex')}`);
    const name = `aob-luna-task-${randomBytes(10).toString('hex')}`;
    let service; let container; let created = false; let closePromise;
    const close = () => closePromise ??= (async () => {
      let failed = false;
      try { if (container) await impl.stopContainer(container); } catch { failed = true; }
      try { await service?.close(); } catch { failed = true; }
      try { if (created) await rm(bundle, { recursive: true, force: true }); } catch { failed = true; }
      if (failed) throw new LunaTransportError();
    })();
    try {
      const parent = await lstat(options.privateRoot);
      if (!parent.isDirectory() || parent.isSymbolicLink() || (parent.mode & 0o077) !== 0) throw new LunaTransportError();
      await impl.verifyBinary(options.bridgeBinary);
      // Moving the minimum-lifetime check forward by the task deadline enforces
      // timeout + the preparer's fifteen-minute margin without retaining JWT data.
      prepareCodexBridge({ authFile: options.authFile, output: bundle, accessTokenSnapshot: true,
        meterUrl: 'http://127.0.0.1:3211', nowMs: Date.now() + options.timeoutS * 1000 });
      created = true;
      const bridgeKey = (await readFile(join(bundle, 'bridge-key'), 'utf8')).trim();
      const meterKey = (await readFile(join(bundle, 'meter-key'), 'utf8')).trim();
      service = await impl.startService({ upstream: 'https://chatgpt.com/backend-api/codex', outPath: eventsPath,
        observationsPath: join(dirname(eventsPath), 'bridge-conditions.json'), meterKey, bridgeKey,
        marker: 'task-route', runId }, { frontPort: 0, gatePort: 3211, meterPort: 3212,
        ingressAuthToken: authToken, maxModelRequests: 512, maxInputTokens: 100000000, maxOutputTokens: 1000000 });
      // Docker can create the named container even when the client subsequently
      // times out. Own its name before invoking Docker so failure still cleans it.
      container = name;
      container = await impl.startContainer(options.bridgeBinary, bundle, name);
      await impl.waitReady(service, authToken);
      await writeFile(join(dirname(eventsPath), 'transport.json'), `${JSON.stringify({ schema_version: 1,
        model: LUNA_MODEL, policy: CONTROLLED_POLICY, source_commit: BRIDGE_COMMIT,
        bridge_binary_sha256: LUNA_BRIDGE_BINARY_SHA256, runtime_image: GO_IMAGE,
        auth_mode: 'access-token-snapshot', refresh_token_imported: false, subscription_usd: null,
        max_model_requests: 512, max_input_tokens: 100000000, max_output_tokens: 1000000,
        timeout_s: options.timeoutS, reasoning_replay: false, response_encoding_requested: 'identity',
      }, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
      return { port: Number(new URL(service.frontUrl).port), anchor: service.anchor, flush: service.flush, close };
    } catch {
      await close().catch(() => {});
      throw new LunaTransportError();
    }
  };
}
