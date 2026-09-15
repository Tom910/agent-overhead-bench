import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('recovery budgets retain highest usage and reject invalid metadata', () => {
  execFileSync('python3', [fileURLToPath(new URL('./recovery_budget_test.py', import.meta.url))], {
    timeout: 30_000,
    stdio: 'pipe',
  });
});
