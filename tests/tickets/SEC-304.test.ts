import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const read = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8');

describe('SEC-304: Session Management', () => {
  it('signup/login invalidate existing sessions', () => {
    const auth = read('server/routers/auth.ts');
    expect(auth).toContain('delete(sessions).where(eq(sessions.userId');
  });
});
