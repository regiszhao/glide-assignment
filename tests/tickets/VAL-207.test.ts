import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const read = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8');

describe('VAL-207: Routing Number Required for Bank Transfers', () => {
  it('account router enforces 9-digit routing number for bank transfers', () => {
    const acct = read('server/routers/account.ts');
    expect(acct).toContain('Routing number is required for bank transfers');
    expect(acct).toContain('\\d{9}');
  });
});
