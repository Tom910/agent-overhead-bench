import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('independent harness scheduler preserves attempts and spending guards', () => {
  execFileSync('python3', [fileURLToPath(new URL('./independent_harnesses_test.py', import.meta.url))], {
    timeout: 30_000,
    stdio: 'pipe',
  });
});
