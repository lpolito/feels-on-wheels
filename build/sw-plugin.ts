import { createHash } from 'node:crypto';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Plugin } from 'vite';

const SW_ENTRY = 'src/sw/sw.ts';
const SW_FILE = 'sw.js';

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

/** Emits src/sw/sw.ts as an unhashed /sw.js and injects the precache list and a version hash. */
export function swPlugin(): Plugin {
  let publicDir = '';
  return {
    name: 'fw-service-worker',
    apply: 'build',
    configResolved(config) {
      publicDir = config.publicDir;
    },
    buildStart() {
      this.emitFile({ type: 'chunk', id: SW_ENTRY, fileName: SW_FILE });
    },
    generateBundle(_options, bundle) {
      const sw = bundle[SW_FILE];
      if (!sw || sw.type !== 'chunk') this.error(`${SW_FILE} was not emitted`);
      const built = Object.keys(bundle).filter((f) => f !== SW_FILE && !f.endsWith('.map'));
      const fromPublic = publicDir ? listFiles(publicDir).map((f) => relative(publicDir, f).split('\\').join('/')) : [];
      const files = ['./', './index.html', ...[...built, ...fromPublic].filter((f) => !f.endsWith('.DS_Store') && f !== 'index.html').map((f) => `./${f}`)].sort();
      const version = createHash('sha256').update(files.join('\n')).digest('hex').slice(0, 12);
      sw.code = sw.code
        .replaceAll('__PRECACHE__', JSON.stringify(files))
        .replaceAll('__VERSION__', JSON.stringify(version));
    },
  };
}
