import { describe, expect, test } from 'vitest';
import { headTags, robotsTxt, sitemapXml, webManifest, type PageStrings } from '../../build/site';
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
  title: 'Feels on Wheels: name what you feel',
  description: 'A free feelings wheel.',
  imageAlt: 'The wheel.',
  noscript: 'Needs JavaScript.',
  about: { title: 'About Feels on Wheels', description: 'About it.', heading: 'Feels on Wheels', summary: 's', back: 'Back', sections: [] },
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
    expect(h).toContain('<link rel="manifest" href="./manifest.webmanifest">');
  });

  test('the About page has its own canonical and title, and no JSON-LD', () => {
    const h = headTags('about', site, strings);
    expect(h).toContain('<link rel="canonical" href="https://lpolito.github.io/feels-on-wheels/about.html">');
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
    const h = headTags('index', site, { ...strings, title: 'A & B "C" <D>', description: 'it\'s </script>' });
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

  test('the sitemap lists the wheel and About', () => {
    const locs = [...sitemapXml(site).matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    expect(locs).toEqual(['https://lpolito.github.io/feels-on-wheels/', 'https://lpolito.github.io/feels-on-wheels/about.html']);
  });
});
