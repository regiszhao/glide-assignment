import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const read = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8');

describe('SEC-302: Insecure Random Numbers', () => {
  it('account number generation uses crypto.randomInt', () => {
    const acct = read('server/routers/account.ts');
    expect(acct).toContain('crypto.randomInt');
  });
});
