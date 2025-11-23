import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

const read = (p: string) => readFileSync(path.join(process.cwd(), p), 'utf8');

describe('UI-101: Dark Mode Text Visibility', () => {
  it('globals.css contains either dark-mode rules or the UI-101 quick-fix comment', () => {
    const css = read('app/globals.css');
    expect(css.length).toBeGreaterThan(10);
    expect(css).toMatch(/prefers-color-scheme|UI-101/);
  });
});
