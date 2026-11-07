import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Plugin } from 'vite';

const SW_ENTRY = 'src/sw/sw.ts';
const SW_FILE = 'sw.js';
const SKIP = /(^|\/)(\.DS_Store|sw\.js)$|\.map$/;

export interface BuiltFile { path: string; content: string | Uint8Array }

/** Precache list (relative to the worker's scope, root first) and a version derived from every file's content. */
export function precacheManifest(files: BuiltFile[]): { files: string[]; version: string } {
  const kept = files.filter((f) => !SKIP.test(f.path)).sort((a, b) => a.path.localeCompare(b.path));
  const hash = createHash('sha256');
  for (const f of kept) hash.update(f.path).update('\0').update(f.content).update('\0');
  return { files: ['./', ...kept.map((f) => `./${f.path}`)], version: hash.digest('hex').slice(0, 12) };
}

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

/**
 * Emits src/sw/sw.ts as an unhashed /sw.js. After the bundle is written (so index.html and public/
 * files exist), injects the precache list and a content-hash version into it.
 */
export function swPlugin(): Plugin {
  return {
    name: 'fw-service-worker',
    apply: 'build',
    buildStart() {
      this.emitFile({ type: 'chunk', id: SW_ENTRY, fileName: SW_FILE });
    },
    writeBundle(options) {
      const outDir = options.dir!;
      const files = listFiles(outDir).map((full) => ({
        path: relative(outDir, full).split('\\').join('/'),
        content: readFileSync(full),
      }));
      const { files: precache, version } = precacheManifest(files);
      const swPath = join(outDir, SW_FILE);
      const code = readFileSync(swPath, 'utf8');
      if (!code.includes('__PRECACHE__')) this.error(`${SW_FILE} has no __PRECACHE__ placeholder`);
      writeFileSync(swPath, code.replaceAll('__PRECACHE__', JSON.stringify(precache)).replaceAll('__VERSION__', JSON.stringify(version)));
    },
  };
}
