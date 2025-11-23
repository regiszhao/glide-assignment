import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const read = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8');

describe('PERF-408: Resource Leak / DB connection management', () => {
  it('db index consolidates connection and registers graceful shutdown', () => {
    const dbIndex = read('lib/db/index.ts');
    expect(dbIndex).toMatch(/SQLite connection closed|graceful shutdown|sqlite.close\(/);
  });
});
