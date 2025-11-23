import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const read = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8');

describe('PERF-402: Logout Issues', () => {
  it('logout reads cookies.get or header and deletes sessions', () => {
    const auth = read('server/routers/auth.ts');
    expect(auth).toMatch(/cookies\.get\('session'\)|cookieHeader/);
    expect(auth).toContain('delete(sessions).where(eq(sessions.token');
  });
});
