import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';
import { site } from '../site.config.ts';
import { aboutLinks, headTags, linkify, renderAbout, robotsTxt, sitemapXml, webManifest, type PageId, type PageStrings } from './site.ts';

/**
 * Going-public spec §7–§8: fills each page's head (<!--site:head-->) and noscript text (<!--site:noscript-->) from
 * site.config.ts and en.json's `page` strings, and emits manifest.webmanifest, robots.txt and sitemap.xml.
 * en.json is re-read on every use so dev picks up edits.
 */
export function sitePlugin(): Plugin {
  let root = process.cwd();
  const strings = (): PageStrings =>
    (JSON.parse(readFileSync(join(root, 'src/data/locales/en.json'), 'utf8')) as { page: PageStrings }).page;
  const pageOf = (path: string): PageId => (path.split('?')[0]!.endsWith('/about.html') ? 'about' : 'index');
  const manifest = (): string => `${JSON.stringify(webManifest(strings()), null, 2)}\n`;

  return {
    name: 'fw-site',
    configResolved(config) {
      root = config.root;
    },
    transformIndexHtml(html, ctx) {
      const s = strings();
      return html
        .replace('<!--site:head-->', headTags(pageOf(ctx.path), site, s))
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
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(site) });
    },
  };
}
