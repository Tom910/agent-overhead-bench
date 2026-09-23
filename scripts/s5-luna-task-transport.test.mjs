import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { register } from 'node:module';
register('./ts-source-loader.mjs', import.meta.url);
const { createLunaTaskTransportFactory } = await import('./s5-luna-task-transport.mjs');

async function fixture(t, lifetime = 20000) {
  const root = await mkdtemp(join(tmpdir(), 'luna-transport-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const jwt = payload => `${Buffer.from('{}').toString('base64url')}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.synthetic`;
  const authFile = join(root, 'auth.json');
  await writeFile(authFile, JSON.stringify({ tokens: { id_token: jwt({}), access_token: jwt({ exp: Math.floor(Date.now()/1000) + lifetime }), account_id: 'fixture', refresh_token: 'must-not-copy' } }), { mode: 0o600 });
  const calls = []; const anchor = { wall_clock_iso: '2026-09-22T00:00:00.000Z', monotonic_zero: 1 };
  const options = { authFile, bridgeBinary: '/fixture/binary', privateRoot: root, timeoutS: 10800 };
  const runtime = {
    platform: 'linux', verifyBinary: async () => calls.push('verify'),
    startContainer: async (_binary, bundle) => {
      const auth = JSON.parse(await readFile(join(bundle, 'auth/codex.json'), 'utf8'));
      assert.equal(auth.refresh_token, undefined); calls.push('start'); return 'owned';
    },
    stopContainer: async name => { assert.equal(name, 'owned'); calls.push('stop'); },
    waitReady: async () => calls.push('ready'),
    startService: async (_spec, opts) => {
      assert.equal(opts.maxModelRequests, 512); assert.equal(opts.ingressAuthToken, 'a'.repeat(64));
      return { frontUrl: 'http://127.0.0.1:54321', anchor, flush: async () => calls.push('flush'), close: async () => calls.push('close') };
    },
  };
  return { root, authFile, calls, anchor, options, runtime, cell: { runId: 'fixture-run', eventsPath: join(root, 'events.jsonl'), authToken: 'a'.repeat(64) } };
}
test('private snapshot lifecycle preserves original and closes only owned resources once', async t => {
  const f = await fixture(t); const original = await readFile(f.authFile);
  const transport = await createLunaTaskTransportFactory(f.options, f.runtime)(f.cell);
  assert.equal(transport.port, 54321); assert.equal(transport.anchor, f.anchor);
  await transport.flush(); await transport.close(); await transport.close();
  assert.deepEqual(f.calls, ['verify', 'start', 'ready', 'flush', 'stop', 'close']);
  assert.deepEqual(await readFile(f.authFile), original);
  assert.equal((await readdir(f.root)).some(name => name.startsWith('bundle-')), false);
});
test('snapshot must survive whole task plus fifteen minutes before starting service', async t => {
  const f = await fixture(t, 3600);
  await assert.rejects(createLunaTaskTransportFactory(f.options, f.runtime)(f.cell));
  assert.deepEqual(f.calls, ['verify']);
  assert.equal((await readdir(f.root)).some(name => name.startsWith('bundle-')), false);
});
test('readiness failure removes private bundle and stops owned container', async t => {
  const f = await fixture(t); f.runtime.waitReady = async () => { throw new Error('fixture denied'); };
  await assert.rejects(createLunaTaskTransportFactory(f.options, f.runtime)(f.cell), /Luna task transport failed/);
  assert.deepEqual(f.calls, ['verify', 'start', 'stop', 'close']);
  assert.equal((await readdir(f.root)).some(name => name.startsWith('bundle-')), false);
});
test('unverified binary and non-Linux execution fail before snapshot creation', async t => {
  const f = await fixture(t); f.runtime.verifyBinary = async () => { throw new Error('wrong hash'); };
  await assert.rejects(createLunaTaskTransportFactory(f.options, f.runtime)(f.cell));
  assert.deepEqual(f.calls, []);
  f.runtime.platform = 'darwin';
  assert.throws(() => createLunaTaskTransportFactory(f.options, f.runtime));
});
test('partially launched container is owned and stopped even when docker client fails', async t => {
  const f = await fixture(t); let createdName;
  f.runtime.startContainer = async (_binary, _bundle, name) => { createdName = name; throw new Error('client timeout after daemon creation'); };
  f.runtime.stopContainer = async name => { assert.equal(name, createdName); f.calls.push('stop'); };
  await assert.rejects(createLunaTaskTransportFactory(f.options, f.runtime)(f.cell));
  assert.deepEqual(f.calls, ['verify', 'stop', 'close']);
  assert.equal((await readdir(f.root)).some(name => name.startsWith('bundle-')), false);
});
