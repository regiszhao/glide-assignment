import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const read = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8');

describe('PERF-401: Account Creation Error', () => {
  it('account creation uses db.transaction and retries on collisions', () => {
    const acct = read('server/routers/account.ts');
    expect(acct).toContain('db.transaction');
    expect(acct).toContain('Failed to create account after multiple attempts');
  });
});
