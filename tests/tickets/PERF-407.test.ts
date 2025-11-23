import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

describe('PERF-407: Performance Degradation test presence', () => {
  it('perf test file exists and contains iterations', () => {
    const fp = path.join(process.cwd(), 'tests/perf/perf-407.test.ts');
    expect(existsSync(fp)).toBeTruthy();
    const content = readFileSync(fp, 'utf8');
    expect(content).toContain('iterations');
  });
});
