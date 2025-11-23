import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const read = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8');

describe('VAL-203: State Code Validation', () => {
  it('constants and auth use US_STATES whitelist', () => {
    const constants = read('lib/constants.ts');
    expect(constants).toContain('US_STATES');
    const auth = read('server/routers/auth.ts');
    expect(auth).toContain('US_STATES');
  });
});
