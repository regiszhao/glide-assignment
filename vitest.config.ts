import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'), // adjust to project root
    },
  },
  test: {
    environment: 'node',
    globals: false,
    // increase timeout for longer perf tests
    testTimeout: 120000,
  },
});
