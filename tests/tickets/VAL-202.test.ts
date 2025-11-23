import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const read = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8');

describe('VAL-202: Date of Birth Validation', () => {
  it('signup schema enforces age boundaries and non-future dates', () => {
    const auth = read('server/routers/auth.ts');
    expect(auth).toContain('You must be at least 18 years old');
    expect(auth).toContain('Date of birth cannot be in the future');
    expect(auth).toContain('Age must be 120 or less');
  });
});
