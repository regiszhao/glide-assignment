import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const read = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8');

describe('PERF-403: Session Expiry Buffer', () => {
  it('server/trpc contains configurable SESSION_EXPIRY_BUFFER_MS', () => {
    const trpc = read('server/trpc.ts');
    expect(trpc).toContain('SESSION_EXPIRY_BUFFER_MS');
  });
});
