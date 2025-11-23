import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const read = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8');

describe('SEC-303: XSS Vulnerability', () => {
  it('TransactionList does not use dangerouslySetInnerHTML', () => {
    const tl = read('components/TransactionList.tsx');
    expect(tl).not.toContain('dangerouslySetInnerHTML');
  });
});
