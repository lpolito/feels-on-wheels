import { describe, expect, test } from 'vitest';
import { aboutLinks, headTags, linkify, renderAbout, robotsTxt, sitemapXml, webManifest, type PageStrings } from '../../build/site';
import { routeTable, allPaths } from '../../src/state/url';
import { loadData } from '../../src/data/load';
import en from '../../src/data/locales/en.json';
import type { SiteConfig } from '../../site.config';

const site: SiteConfig = {
  url: 'https://lpolito.github.io/feels-on-wheels/',
  indexable: false,
  repo: 'https://github.com/lpolito/feels-on-wheels',
  author: { name: 'Lucas Polito', url: 'https://lucaspolito.dev/' },
};

const strings: PageStrings = {
  name: 'Feels on Wheels',
  shortName: 'Feels',
  imageAlt: 'The wheel.',
  noscript: 'Needs JavaScript.',
  titles: { home: 'Feels on Wheels: name what you feel', homeDescription: 'A free feelings wheel.', about: 'About Feels on Wheels', aboutDescription: 'About it.' },
  about: { heading: 'Feels on Wheels', summary: 's', back: 'Back', sections: [] },
};

const jsonLd = (html: string): Record<string, unknown> => {
  const m = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
  expect(m, 'JSON-LD block').not.toBeNull();
  return JSON.parse(m![1]!) as Record<string, unknown>;
};

describe('head tags', () => {
  test('the wheel page has its title, canonical, preview tags and manifest link', () => {
    const h = headTags('index', site, strings);
    expect(h).toContain('<title>Feels on Wheels: name what you feel</title>');
    expect(h).toContain('<link rel="canonical" href="https://lpolito.github.io/feels-on-wheels/">');
    expect(h).toContain('<meta property="og:url" content="https://lpolito.github.io/feels-on-wheels/">');
    expect(h).toContain('<meta property="og:image" content="https://lpolito.github.io/feels-on-wheels/og-image.png">');
    expect(h).toContain('<meta property="og:image:width" content="1200">');
    expect(h).toContain('<meta property="og:image:height" content="630">');
    expect(h).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(h).toContain('<link rel="manifest" href="/manifest.webmanifest">');
  });

  test('the head is wrapped in markers, each once', () => {
    for (const page of ['index', 'about'] as const) {
      const h = headTags(page, site, strings);
      expect(h.match(/<!--head-->/g)).toHaveLength(1);
      expect(h.match(/<!--\/head-->/g)).toHaveLength(1);
      expect(h.indexOf('<!--head-->')).toBeLessThan(h.indexOf('<title>'));
      expect(h.indexOf('<!--/head-->')).toBeGreaterThan(h.indexOf('rel="manifest"'));
    }
  });

  test('the About page has its own canonical and title, and no JSON-LD', () => {
    const h = headTags('about', site, strings);
    expect(h).toContain('<link rel="canonical" href="https://lpolito.github.io/feels-on-wheels/about">');
    expect(h).toContain('<title>About Feels on Wheels</title>');
    expect(h).not.toContain('application/ld+json');
  });

  test('noindex appears exactly when the site is not indexable', () => {
    const noindex = '<meta name="robots" content="noindex">';
    expect(headTags('index', site, strings)).toContain(noindex);
    expect(headTags('about', site, strings)).toContain(noindex);
    expect(headTags('index', { ...site, indexable: true }, strings)).not.toContain(noindex);
  });

  test('the wheel page describes itself as a free web app by Lucas Polito', () => {
    const ld = jsonLd(headTags('index', site, strings));
    expect(ld['@type']).toBe('WebApplication');
    expect(ld['isAccessibleForFree']).toBe(true);
    expect((ld['offers'] as Record<string, unknown>)['price']).toBe('0');
    expect((ld['author'] as Record<string, unknown>)['url']).toBe('https://lucaspolito.dev/');
    expect(ld['license']).toBe('https://github.com/lpolito/feels-on-wheels/blob/main/LICENSE');
  });

  test('special characters are escaped (Review Focus 3)', () => {
    const h = headTags('index', site, { ...strings, titles: { ...strings.titles, home: 'A & B "C" <D>', homeDescription: 'it\'s </script>' } });
    expect(h).toContain('A &amp; B &quot;C&quot; &lt;D&gt;');
    expect(h).not.toContain('"C"');
    expect(h.match(/<\/script>/g)?.length).toBe(1);
  });
});

describe('generated files', () => {
  test('the manifest takes its name and description from the strings', () => {
    const m = webManifest(strings);
    expect(m).toMatchObject({
      name: 'Feels on Wheels', short_name: 'Feels', description: 'A free feelings wheel.',
      id: './', start_url: './', scope: './', display: 'standalone',
    });
    expect((m['icons'] as { src: string }[]).map((i) => i.src)).toEqual([
      'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
    ]);
  });

  test('robots.txt allows everything and points at the sitemap', () => {
    expect(robotsTxt(site)).toBe('User-agent: *\nAllow: /\nSitemap: https://lpolito.github.io/feels-on-wheels/sitemap.xml\n');
  });

  test('the sitemap has one entry per path', () => {
    const paths = allPaths(routeTable(loadData().wheels));
    const locs = [...sitemapXml(site, paths).matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toHaveLength(paths.length);
    expect(new Set(locs).size).toBe(locs.length);
    for (const tail of ['', 'about', 'body', 'happy/playful']) expect(locs).toContain(`${site.url}${tail}`);
  });
});

describe('About page', () => {
  const links = aboutLinks(site);
  const about = (en as unknown as { page: PageStrings }).page.about;
  const html = renderAbout(about, site);

  test('the link map points at the repo, license, contributing guide, author and the wheel', () => {
    expect(links).toEqual({
      repo: 'https://github.com/lpolito/feels-on-wheels',
      license: 'https://github.com/lpolito/feels-on-wheels/blob/main/LICENSE',
      contributing: 'https://github.com/lpolito/feels-on-wheels/blob/main/CONTRIBUTING.md',
      author: 'https://lucaspolito.dev/',
      home: '/',
      about: '/about',
    });
  });

  test('the noscript message links to About (spec §7.2)', () => {
    const noscript = (en as unknown as { page: PageStrings }).page.noscript;
    expect(linkify(noscript, links)).toContain('<a href="/about">');
  });

  test('linkify escapes text and turns [label](target) into links', () => {
    expect(linkify('[Repo]({repo}) & co', links)).toBe('<a href="https://github.com/lpolito/feels-on-wheels">Repo</a> &amp; co');
    expect(linkify('see [this](https://example.com/a?b=1&c=2)', links)).toBe('see <a href="https://example.com/a?b=1&amp;c=2">this</a>');
  });

  test('linkify refuses unknown link keys', () => {
    expect(() => linkify('[x]({nope})', links)).toThrow(/nope/);
  });

  test('one h1, then the sections in order', () => {
    expect(html.match(/<h1[ >]/g)?.length).toBe(1);
    const ids = [...html.matchAll(/<section id="([^"]+)">\s*<h2>/g)].map((m) => m[1]);
    expect(ids).toEqual(['what', 'how', 'private', 'credits', 'made-by', 'source', 'translate']);
  });

  test('every credit links to its source', () => {
    const credits = /<section id="credits">([\s\S]*?)<\/section>/.exec(html)![1]!;
    const items = credits.match(/<li>[\s\S]*?<\/li>/g) ?? [];
    expect(items.length).toBeGreaterThanOrEqual(4);
    for (const li of items) expect(li).toContain('<a href="https://');
  });

  test('no placeholders or empty elements are left', () => {
    expect(html).not.toMatch(/[{}]/);
    expect(html).not.toMatch(/<(p|li)>\s*<\/\1>/);
  });

  test('it is the About view: its id, and a heading that takes focus from script (URL redesign spec §3)', () => {
    expect(html.startsWith('<main class="about" id="about">')).toBe(true);
    expect(html).toMatch(/<h1 tabindex="-1">Feels on Wheels<\/h1>/);
  });

  test('it ends with the way back to the wheel', () => {
    expect(html.trimEnd()).toMatch(/<a href="\/">Back to the wheel<\/a><\/p>\s*<\/main>$/);
  });

  test('the About head uses the About title', () => {
    expect(headTags('about', site, { ...(en as unknown as { page: PageStrings }).page, titles: en.titles })).toContain('<title>About Feels on Wheels</title>');
  });
});
