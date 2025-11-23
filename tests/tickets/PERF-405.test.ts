import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const read = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8');

describe('PERF-405: Missing Transactions (sanity)', () => {
  it('account router contains transaction insert and selection logic', () => {
    const acct = read('server/routers/account.ts');
    expect(acct).toContain('insert(transactions)');
    expect(acct).toContain('select().from(transactions)');
  });
});
