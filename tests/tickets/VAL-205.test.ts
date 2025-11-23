import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const read = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8');

describe('VAL-205: Zero Amount Funding', () => {
  it('account router requires amount >= 0.01', () => {
    const acct = read('server/routers/account.ts');
    expect(acct).toContain('.min(0.01');
  });
});
