/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { sitePlugin } from './build/site-plugin.ts';
import { swPlugin } from './build/sw-plugin.ts';

export default defineConfig({
  // Root-relative URLs: real paths like /happy/playful would break relative ones.
  base: '/',
  plugins: [sitePlugin(), swPlugin()],
  build: {
    target: 'es2022',
    rollupOptions: {
      // One page: About is a view in index.html (URL redesign spec §3).
      input: { index: 'index.html' },
      output: {
        manualChunks(id) {
          if (id.includes('/src/data/')) return 'data';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
  },
});
