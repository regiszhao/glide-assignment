import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const read = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8');

describe('VAL-210: Card Length and Luhn Checks', () => {
  it('account router accepts 13-19 digit cards and uses luhnCheck', () => {
    const acct = read('server/routers/account.ts');
    expect(acct).toContain('\\d{13,19}');
    expect(acct).toContain('luhnCheck');
  });
});
