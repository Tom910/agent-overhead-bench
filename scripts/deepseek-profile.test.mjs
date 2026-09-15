import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
const root = fileURLToPath(new URL('..', import.meta.url));
const run = (...args) => execFileSync(process.execPath, args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
test('DeepSeek scope is explicitly selected and agrees with its approved model', () => {
  const path = run('scripts/s7-profile.mjs', 'deepseek-v4.1-flash-openrouter', 'scope');
  assert.equal(run('scripts/s7-official-scope.mjs', path, 'deepseek/deepseek-v4.1-flash', 'https://openrouter.ai/api'), 'claude-code,cline,codex,hermes,pi,qwen');
  assert.throws(() => run('scripts/s7-official-scope.mjs', path, 'z-ai/glm-5.3-flash'));
  const eligibility = run('scripts/s7-profile.mjs', 'deepseek-v4.1-flash-openrouter', 'eligibility');
  assert.match(run('scripts/s7-model-eligibility.mjs', eligibility, 'deepseek/deepseek-v4.1-flash', 'https://openrouter.ai/api', 'claude-code,cline,codex,hermes,pi,qwen'), /6 reviewed/);
});
test('profile registry preserves GLM default and refuses arbitrary profile paths', () => {
  const path = run('scripts/s7-profile.mjs', '', 'scope');
  assert.equal(JSON.parse(readFileSync(path)).model, 'z-ai/glm-5.3-flash');
  assert.throws(() => run('scripts/s7-profile.mjs', '../other', 'scope'));
  assert.throws(() => run('scripts/s7-profile.mjs', 'deepseek-v4.1-flash-openrouter', '../other'));
});

test('DeepSeek approval binds its provider, fallback policy and price book', async () => {
  const { assertProfileConditions } = await import('./official-profiles.mjs');
  const routing = { only_provider: 'deepseek', allow_fallbacks: false, ignored_providers: ['relace'] };
  const check = (book = 'deepseek-v41-low-2026-09-10', policy = routing) => assertProfileConditions('deepseek-v4.1-flash-openrouter', 'deepseek/deepseek-v4.1-flash', book, policy);
  assert.doesNotThrow(() => check());
  assert.throws(() => check('other-book'));
  for (const policy of [null, {}, { ...routing, only_provider: 'other' }, { ...routing, allow_fallbacks: true }, { ...routing, ignored_providers: [] }]) assert.throws(() => check(undefined, policy));
});

test('preflight applies DeepSeek approved conditions before credentials or Docker', () => {
  for (const [provider, book] of [['', 'deepseek-v41-low-2026-09-10'], ['other', 'deepseek-v41-low-2026-09-10'], ['deepseek', 'other-book']]) {
    let failure;
    try {
      execFileSync('sh', ['scripts/s7-preflight.sh', '/tmp/aob-no-run', 'deepseek/deepseek-v4.1-flash', book, 'claude-code,cline,codex,hermes,pi,qwen', 'pinned', 'missing-task', 'missing-manifest', 'missing-source'],
        { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, OPENROUTER_API_KEY: '', AOB_OFFICIAL_PROFILE: 'deepseek-v4.1-flash-openrouter', AOB_ONLY_PROVIDER: provider, AOB_IGNORED_PROVIDERS: 'relace' } });
    } catch (error) { failure = error; }
    assert.ok(failure);
    assert.match(failure.stderr, /requested conditions differ from approved profile/);
    assert.doesNotMatch(failure.stderr, /OPENROUTER_API_KEY|Docker daemon/);
  }
});
