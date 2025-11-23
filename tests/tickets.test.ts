import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

function read(p: string) {
  const fp = path.join(process.cwd(), p);
  if (!existsSync(fp)) return '';
  return readFileSync(fp, 'utf8');
}

describe('Repository quick smoke checks for documented tickets', () => {
  it('UI-101: globals.css contains the quick-fix comments or dark-mode section', () => {
    const css = read('app/globals.css');
    // repo contains a quick-fix comment for UI-101 (dark mode temporarily disabled)
    expect(css).toContain('/* UI-101 */');
    // Either the media query is present or commented out — ensure the file mentions prefers-color-scheme
    expect(css).toMatch(/prefers-color-scheme/);
  });

  it('VAL-201: auth/signup contains email normalization and typo detection', () => {
    const auth = read('server/routers/auth.ts');
    expect(auth).toContain('toLowerCase()');
    expect(auth).toMatch(/domain\.endsWith\(/);
    expect(auth).toContain("Email domain looks incorrect");
  });

  it('VAL-202: signup enforces age >= 18 and <= 120', () => {
    const auth = read('server/routers/auth.ts');
    expect(auth).toContain('You must be at least 18 years old');
    expect(auth).toContain('Age must be 120 or less');
  });

  it('VAL-203: US states whitelist exists and signup validates state', () => {
    const constants = read('lib/constants.ts');
    expect(constants).toContain('US_STATES');
    const auth = read('server/routers/auth.ts');
    expect(auth).toContain('US_STATES');
  });

  it('VAL-204: phone regex accepts international numbers', () => {
    const auth = read('server/routers/auth.ts');
    expect(auth).toMatch(/\^\\\+\?\\d\{7,15\}\$/);
  });

  it('VAL-205: fundAccount requires amount >= 0.01', () => {
    const acct = read('server/routers/account.ts');
    expect(acct).toContain('.min(0.01');
  });

  it('VAL-206: Luhn utility exists', () => {
    const luhn = read('lib/utils/luhn.ts');
    expect(luhn).toContain('export function luhnCheck');
  });

  it('VAL-207: bank funding requires 9-digit routing number', () => {
    const acct = read('server/routers/account.ts');
    expect(acct).toContain('Routing number is required for bank transfers');
    expect(acct).toContain('\\d{9}');
  });

  it('VAL-208: strong password rules enforced server-side', () => {
    const auth = read('server/routers/auth.ts');
    expect(auth).toContain('Password must be at least 10 characters');
    expect(auth).toContain('Password must contain a lowercase');
  });

  it('VAL-209: amounts normalized to two decimals in account router', () => {
    const acct = read('server/routers/account.ts');
    expect(acct).toContain('.toFixed(2)');
  });

  it('VAL-210: card length and Luhn checks present', () => {
    const acct = read('server/routers/account.ts');
    expect(acct).toContain('\\d{13,19}');
    expect(acct).toContain('luhnCheck');
  });

  it('SEC-301: SSNs are HMACed using SSN_HASH_SECRET', () => {
    const auth = read('server/routers/auth.ts');
    expect(auth).toContain('SSN_HASH_SECRET');
    expect(auth).toContain('createHmac');
  });

  it('SEC-302: account numbers use crypto.randomInt', () => {
    const acct = read('server/routers/account.ts');
    expect(acct).toContain('crypto.randomInt');
  });

  it('SEC-303: TransactionList no longer uses dangerouslySetInnerHTML', () => {
    const tl = read('components/TransactionList.tsx');
    expect(tl).not.toContain('dangerouslySetInnerHTML');
  });

  it('SEC-304: signup/login invalidate other sessions', () => {
    const auth = read('server/routers/auth.ts');
    expect(auth).toContain('delete(sessions).where(eq(sessions.userId');
  });

  it('PERF-401: account creation uses db.transaction and retries', () => {
    const acct = read('server/routers/account.ts');
    expect(acct).toContain('db.transaction');
    expect(acct).toContain('Failed to create account after multiple attempts');
  });

  it('PERF-402: logout verifies cookie via cookies.get or header parsing', () => {
    const auth = read('server/routers/auth.ts');
    expect(auth).toContain("cookies.get('session')") || expect(auth).toContain('cookie');
  });

  it('PERF-403: session expiry buffer is configurable', () => {
    const trpc = read('server/trpc.ts');
    expect(trpc).toContain('SESSION_EXPIRY_BUFFER_MS');
  });

  it('PERF-404: transactions ordering uses desc(createdAt)', () => {
    const acct = read('server/routers/account.ts');
    expect(acct).toContain('orderBy(desc(transactions.createdAt)');
  });

  it('PERF-406: balance updates round to 2 decimals', () => {
    const acct = read('server/routers/account.ts');
    expect(acct).toContain("toFixed(2)");
  });

  it('PERF-407: perf test file exists', () => {
    const perf = read('tests/perf/perf-407.test.ts');
    expect(perf).toContain('PERF-407: Performance Degradation');
  });

  it('PERF-408: DB index consolidates connection and graceful shutdown exists', () => {
    const dbIndex = read('lib/db/index.ts');
    expect(dbIndex).toContain('SQLite connection closed');
  });
});
