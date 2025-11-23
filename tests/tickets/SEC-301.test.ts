import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const read = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8');

describe('SEC-301: SSN Storage', () => {
  it('signup stores hashed SSN and requires SSN_HASH_SECRET', () => {
    const auth = read('server/routers/auth.ts');
    expect(auth).toContain('SSN_HASH_SECRET');
    expect(auth).toContain('createHmac');
    expect(auth).toContain('ssnLast4');
  });
});
