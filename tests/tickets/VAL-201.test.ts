import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const read = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8');

describe('VAL-201: Email Validation', () => {
  it('auth router contains normalization and TLD typo detection', () => {
    const auth = read('server/routers/auth.ts');
    expect(auth).toContain('toLowerCase()');
    expect(auth).toMatch(/domain\.endsWith\(/);
    expect(auth).toContain('Email domain looks incorrect');
  });
});
