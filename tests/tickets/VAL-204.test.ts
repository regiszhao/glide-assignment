import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const read = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8');

describe('VAL-204: Phone Number Format', () => {
  it('auth schema accepts international phone regex', () => {
    const auth = read('server/routers/auth.ts');
    expect(auth).toMatch(/\^\\\+\?\\d\{7,15\}\$/);
  });
});
