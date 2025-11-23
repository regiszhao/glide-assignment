import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const read = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8');

describe('PERF-404: Transaction Sorting', () => {
  it('account router orders transactions by createdAt desc', () => {
    const acct = read('server/routers/account.ts');
    expect(acct).toContain('orderBy(desc(transactions.createdAt)');
  });
});
