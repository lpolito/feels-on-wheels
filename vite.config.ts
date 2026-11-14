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
      // The About page is a second, static page (going-public spec §8.1).
      input: { index: 'index.html', about: 'about.html' },
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
