/**
 * Pure builders for everything the site needs beyond the app (going-public spec §7, §8): each route's head tags,
 * the web manifest, robots.txt and the sitemap. All absolute URLs come from site.config.ts; all text from en.json's
 * `page` and `titles` strings. build/site-plugin.ts wires these into Vite, and the Worker (src/worker) uses headTags
 * for every path with no file (URL redesign spec §5).
 */
import type { SiteConfig } from '../site.config';
import type { Titles } from '../src/data/types.ts';

export interface AboutSection { id: string; heading: string; body: string[]; items?: string[] }
export interface AboutStrings {
  heading: string; summary: string; back: string; sections: AboutSection[];
}

export interface PageStrings {
  name: string; shortName: string; imageAlt: string; noscript: string;
  about: AboutStrings;
  /** From en.json's `titles` group; site-plugin.ts adds it to `page`. */
  titles: Pick<Titles, 'home' | 'homeDescription' | 'about' | 'aboutDescription'>;
}

const OG_IMAGE = { path: 'og-image.png', width: 1200, height: 630 };

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** One route's head (URL redesign spec §5, §6). */
export interface HeadMeta {
  title: string;
  description: string;
  /** The route's path without its leading "/": '' for the wheel at rest, 'happy/playful', 'about'. */
  path: string;
  /** The WebApplication JSON-LD: on `/` only. */
  jsonLd: boolean;
  /** noindex whatever site.indexable says (not found). */
  noindex: boolean;
}

const tag = (attr: 'name' | 'property', key: string, value: string | number): string =>
  `<meta ${attr}="${key}" content="${escapeHtml(String(value))}">`;

function jsonLd(site: SiteConfig, strings: PageStrings): string {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: strings.name,
    url: site.url,
    description: strings.titles.homeDescription,
    inLanguage: 'en',
    applicationCategory: 'LifestyleApplication',
    operatingSystem: 'Any',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    author: { '@type': 'Person', name: site.author.name, url: site.author.url },
    license: `${site.repo}/blob/main/LICENSE`,
  };
  // "<" escaped so no string can close the script element early.
  return `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
}

export function headTags(meta: HeadMeta, site: SiteConfig, strings: PageStrings): string {
  const { title, description } = meta;
  const url = site.url + meta.path;
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    tag('name', 'description', description),
    `<link rel="canonical" href="${escapeHtml(url)}">`,
    ...(site.indexable && !meta.noindex ? [] : [tag('name', 'robots', 'noindex')]),
    tag('property', 'og:type', 'website'),
    tag('property', 'og:site_name', strings.name),
    tag('property', 'og:title', title),
    tag('property', 'og:description', description),
    tag('property', 'og:url', url),
    tag('property', 'og:locale', 'en_US'),
    tag('property', 'og:image', `${site.url}${OG_IMAGE.path}`),
    tag('property', 'og:image:width', OG_IMAGE.width),
    tag('property', 'og:image:height', OG_IMAGE.height),
    tag('property', 'og:image:alt', strings.imageAlt),
    tag('name', 'twitter:card', 'summary_large_image'),
    tag('name', 'twitter:image:alt', strings.imageAlt),
    '<link rel="manifest" href="/manifest.webmanifest">',
    ...(meta.jsonLd ? [jsonLd(site, strings)] : []),
  ];
  return ['<!--head-->', ...tags, '<!--/head-->'].join('\n  ');
}

export function webManifest(strings: PageStrings): Record<string, unknown> {
  return {
    name: strings.name,
    short_name: strings.shortName,
    description: strings.titles.homeDescription,
    id: './',
    start_url: './',
    scope: './',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      { src: 'icons/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

/** The `{key}` link targets the About strings may use. */
export function aboutLinks(site: SiteConfig): Record<string, string> {
  return {
    repo: site.repo,
    license: `${site.repo}/blob/main/LICENSE`,
    contributing: `${site.repo}/blob/main/CONTRIBUTING.md`,
    author: site.author.url,
    home: '/',
    about: '/about',
  };
}

/** Escapes `text`, then turns `[label](https://…)` and `[label]({key})` into links. Unknown keys throw. */
export function linkify(text: string, links: Record<string, string>): string {
  return escapeHtml(text).replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label: string, target: string) => {
    const key = /^\{(\w[\w-]*)\}$/.exec(target)?.[1];
    if (key !== undefined && links[key] === undefined) throw new Error(`about: unknown link key {${key}}`);
    // `target` is already escaped; a known key's URL is escaped here.
    const href = key !== undefined ? escapeHtml(links[key]!) : target;
    if (key === undefined && !href.startsWith('https://')) throw new Error(`about: link target must be https:// or {key}: ${target}`);
    return `<a href="${href}">${label}</a>`;
  });
}

/**
 * The About view's <main>, rendered at build time from en.json's `page.about` (going-public spec §8.2) into the one
 * shell (URL redesign spec §3). Its heading takes focus when the app opens About.
 */
export function renderAbout(about: AboutStrings, site: SiteConfig): string {
  const links = aboutLinks(site);
  const text = (s: string): string => linkify(s, links);
  const sections = about.sections.map((sec) => [
    `  <section id="${escapeHtml(sec.id)}">`,
    `    <h2>${escapeHtml(sec.heading)}</h2>`,
    ...sec.body.map((p) => `    <p>${text(p)}</p>`),
    ...(sec.items?.length ? ['    <ul>', ...sec.items.map((li) => `      <li>${text(li)}</li>`), '    </ul>'] : []),
    '  </section>',
  ].join('\n'));
  return [
    '<main class="about" id="about">',
    `  <h1 tabindex="-1">${escapeHtml(about.heading)}</h1>`,
    `  <p class="about-summary">${text(about.summary)}</p>`,
    ...sections,
    `  <p class="about-back"><a href="/">${escapeHtml(about.back)}</a></p>`,
    '</main>',
  ].join('\n');
}

export function robotsTxt(site: SiteConfig): string {
  return `User-agent: *\nAllow: /\nSitemap: ${site.url}sitemap.xml\n`;
}

/** One `<loc>` per path: the site URL plus the path without its leading "/". */
export function sitemapXml(site: SiteConfig, paths: readonly string[]): string {
  const urls = paths.map((p) => `  <url><loc>${escapeHtml(site.url + p.slice(1))}</loc></url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}
