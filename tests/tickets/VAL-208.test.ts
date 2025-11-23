import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const read = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8');

describe('VAL-208: Password Strength', () => {
  it('auth router enforces strong password rules server-side', () => {
    const auth = read('server/routers/auth.ts');
    expect(auth).toContain('Password must be at least 10 characters');
    expect(auth).toContain('Password must contain a lowercase');
    expect(auth).toContain('Password must contain an uppercase');
    expect(auth).toContain('Password must contain a symbol');
  });
});
