import { defineConfig } from 'vitest/config';

export default defineConfig({
  css: false,
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],
    globals: true,
    environment: 'node',
    env: {
      NODE_ENV: 'test',
    },
  },
});
