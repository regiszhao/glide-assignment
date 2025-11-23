import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const read = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8');

describe('PERF-406: Balance Calculation', () => {
  it('balance updates round to two decimals and no weird loops remain', () => {
    const acct = read('server/routers/account.ts');
    expect(acct).toContain('.toFixed(2)');
    expect(acct).not.toContain('for (let i = 0; i < 100; i++)');
  });
});
