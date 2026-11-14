import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { site } from '../site.config.ts';
import { loadData } from '../src/data/load.ts';
import { allPaths, reservedClash, routeTable } from '../src/state/url.ts';
import { aboutLinks, headTags, linkify, renderAbout, robotsTxt, sitemapXml, webManifest, type PageStrings } from './site.ts';

/**
 * Going-public spec §7–§8: fills the shell's head (<!--site:head-->), noscript text (<!--site:noscript-->) and About
 * view (<!--site:about-->, URL redesign spec §3) from site.config.ts and en.json's `page` strings, and emits
 * manifest.webmanifest, robots.txt and sitemap.xml. en.json is re-read on every use so dev picks up edits.
 */
export function sitePlugin(): Plugin {
  let root = process.cwd();
  let outDir = 'dist';
  const table = () => routeTable(loadData().wheels);
  const strings = (): PageStrings => {
    const en = JSON.parse(readFileSync(join(root, 'src/data/locales/en.json'), 'utf8')) as { page: Omit<PageStrings, 'titles'>; titles: PageStrings['titles'] };
    return { ...en.page, titles: en.titles };
  };
  const manifest = (): string => `${JSON.stringify(webManifest(strings()), null, 2)}\n`;

  return {
    name: 'fw-site',
    configResolved(config) {
      root = config.root;
      outDir = join(config.root, config.build.outDir);
    },
    transformIndexHtml(html) {
      const s = strings();
      return html
        .replace('<!--site:head-->', headTags('index', site, s))
        .replace('<!--site:noscript-->', linkify(s.noscript, aboutLinks(site)))
        .replace('<!--site:about-->', renderAbout(s.about, site));
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url?.split('?')[0]!.endsWith('/manifest.webmanifest')) return next();
        res.setHeader('Content-Type', 'application/manifest+json');
        res.end(manifest());
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: manifest() });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt(site) });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(site, allPaths(table())) });
    },
    writeBundle() {
      const locales = readdirSync(join(root, 'src/data/locales')).filter((f) => f.endsWith('.json')).map((f) => f.slice(0, -5));
      const clash = reservedClash(table(), readdirSync(outDir), locales);
      if (clash.length) this.error(`Top-level word(s) clash with a reserved path or output file: ${clash.join(', ')}`);
    },
  };
}
