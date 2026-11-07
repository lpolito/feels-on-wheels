/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import { swPlugin } from './build/sw-plugin.ts';

export default defineConfig({
  // Relative URLs so the app works from any sub-path (e.g. GitHub Pages).
  base: './',
  plugins: [swPlugin()],
  build: {
    target: 'es2022',
    rollupOptions: {
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
