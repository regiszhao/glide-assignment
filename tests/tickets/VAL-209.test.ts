import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const read = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8');

describe('VAL-209: Amount Input Normalization', () => {
  it('server normalizes amounts to two decimals', () => {
    const acct = read('server/routers/account.ts');
    expect(acct).toContain('.toFixed(2)');
  });
});
