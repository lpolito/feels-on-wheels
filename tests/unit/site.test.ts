import { describe, expect, test } from 'vitest';
import { aboutLinks, headTags, linkify, renderAbout, robotsTxt, sitemapXml, webManifest, type HeadMeta, type PageStrings } from '../../build/site';
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

const home: HeadMeta = { title: strings.titles.home, description: strings.titles.homeDescription, path: '', jsonLd: true, noindex: false };
const about: HeadMeta = { title: strings.titles.about, description: strings.titles.aboutDescription, path: 'about', jsonLd: false, noindex: false };

const jsonLd = (html: string): Record<string, unknown> => {
  const m = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(html);
  expect(m, 'JSON-LD block').not.toBeNull();
  return JSON.parse(m![1]!) as Record<string, unknown>;
};

describe('head tags', () => {
  test('the wheel page has its title, canonical, preview tags and manifest link', () => {
    const h = headTags(home, site, strings);
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
    for (const meta of [home, about]) {
      const h = headTags(meta, site, strings);
      expect(h.match(/<!--head-->/g)).toHaveLength(1);
      expect(h.match(/<!--\/head-->/g)).toHaveLength(1);
      expect(h.indexOf('<!--head-->')).toBeLessThan(h.indexOf('<title>'));
      expect(h.indexOf('<!--/head-->')).toBeGreaterThan(h.indexOf('rel="manifest"'));
    }
  });

  test('the About page has its own canonical and title, and no JSON-LD', () => {
    const h = headTags(about, site, strings);
    expect(h).toContain('<link rel="canonical" href="https://lpolito.github.io/feels-on-wheels/about">');
    expect(h).toContain('<title>About Feels on Wheels</title>');
    expect(h).not.toContain('application/ld+json');
  });

  test('noindex appears exactly when the site is not indexable', () => {
    const noindex = '<meta name="robots" content="noindex">';
    expect(headTags(home, site, strings)).toContain(noindex);
    expect(headTags(about, site, strings)).toContain(noindex);
    expect(headTags(home, { ...site, indexable: true }, strings)).not.toContain(noindex);
  });

  test('a route can ask for noindex even when the site is indexable, and leave out JSON-LD (URL redesign spec §5)', () => {
    const h = headTags({ ...home, title: 'Not found · Feels on Wheels', jsonLd: false, noindex: true }, { ...site, indexable: true }, strings);
    expect(h).toContain('<meta name="robots" content="noindex">');
    expect(h).not.toContain('application/ld+json');
  });

  test('a route\'s path makes its canonical and og:url, and its title and description are used as given', () => {
    const h = headTags({ title: 'Playful · Feels on Wheels', description: 'Fun & light.', path: 'happy/playful', jsonLd: false, noindex: false }, site, strings);
    expect(h).toContain('<link rel="canonical" href="https://lpolito.github.io/feels-on-wheels/happy/playful">');
    expect(h).toContain('<meta property="og:url" content="https://lpolito.github.io/feels-on-wheels/happy/playful">');
    expect(h).toContain('<title>Playful · Feels on Wheels</title>');
    expect(h).toContain('<meta property="og:title" content="Playful · Feels on Wheels">');
    expect(h).toContain('<meta name="description" content="Fun &amp; light.">');
    expect(h).not.toContain('application/ld+json');
  });

  test('the wheel page describes itself as a free web app by Lucas Polito', () => {
    const ld = jsonLd(headTags(home, site, strings));
    expect(ld['@type']).toBe('WebApplication');
    expect(ld['isAccessibleForFree']).toBe(true);
    expect((ld['offers'] as Record<string, unknown>)['price']).toBe('0');
    expect((ld['author'] as Record<string, unknown>)['url']).toBe('https://lucaspolito.dev/');
    expect(ld['license']).toBe('https://github.com/lpolito/feels-on-wheels/blob/main/LICENSE');
  });

  test('special characters are escaped (Review Focus 3)', () => {
    const s = { ...strings, titles: { ...strings.titles, homeDescription: 'it\'s </script>' } };
    const h = headTags({ ...home, title: 'A & B "C" <D>', description: s.titles.homeDescription }, site, s);
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

  test('the link map points at the repo, accessibility notes, contributing guide, author and the wheel', () => {
    expect(links).toEqual({
      github: 'https://github.com/lpolito/feels-on-wheels',
      accessibility: 'https://github.com/lpolito/feels-on-wheels/blob/main/ACCESSIBILITY.md',
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
    expect(linkify('[Guide]({contributing}) & co', links)).toBe('<a href="https://github.com/lpolito/feels-on-wheels/blob/main/CONTRIBUTING.md">Guide</a> &amp; co');
    expect(linkify('see [this](https://example.com/a?b=1&c=2)', links)).toBe('see <a href="https://example.com/a?b=1&amp;c=2">this</a>');
  });

  test('linkify draws {github} as the GitHub icon, named by its label', () => {
    const out = linkify('[Feels on Wheels on GitHub]({github})', links);
    expect(out.startsWith('<a class="about-icon" href="https://github.com/lpolito/feels-on-wheels" aria-label="Feels on Wheels on GitHub" title="Feels on Wheels on GitHub"><svg')).toBe(true);
    expect(out).toContain('aria-hidden="true"');
    expect(out).toContain('focusable="false"');
    expect(out).toContain('currentColor');
    expect(out.endsWith('</svg></a>')).toBe(true);
    expect(out.replace(/<[^>]+>/g, '')).toBe('');
  });

  test('an icon link label is escaped in its attributes', () => {
    expect(linkify('[A "q" & b]({github})', links)).toContain('aria-label="A &quot;q&quot; &amp; b"');
  });

  test('linkify refuses unknown link keys', () => {
    expect(() => linkify('[x]({nope})', links)).toThrow(/nope/);
  });

  test('one h1, then the sections in order', () => {
    expect(html.match(/<h1[ >]/g)?.length).toBe(1);
    const ids = [...html.matchAll(/<section id="([^"]+)">\s*<h2>/g)].map((m) => m[1]);
    expect(ids).toEqual(['what', 'how', 'install', 'why', 'credits', 'translate']);
  });

  const section = (id: string): string => new RegExp(`<section id="${id}">([\\s\\S]*?)</section>`).exec(html)![1]!;

  test('nothing about AI', () => {
    expect(html).not.toMatch(/Claude|Superpowers|\bAI\b/);
  });

  test('credits link each work by its title, and Roberts by the archive.org copy', () => {
    const items = section('credits').match(/<li>[\s\S]*?<\/li>/g) ?? [];
    for (const li of items) {
      if (li.startsWith('<li><a ')) expect(li).toContain('feelingswheel.com');
      else expect(li).toContain('“<a href="https://');
    }
    expect(html).not.toContain('href="https://imgur.com');
    expect(html).toContain('href="https://web.archive.org/web/20180505024944/https://imgur.com/tCWChf6"');
  });

  test('why it exists ends with the dedication, in its own paragraph', () => {
    const why = section('why');
    expect(why.match(/<p>[\s\S]*?<\/p>/g)!.at(-1)).toBe('<p>For A, E, and M.</p>');
    expect(why).toContain('accessible, beautiful, fast, and versatile');
  });

  test('why it exists signs off with the name and the GitHub icon, just before the dedication', () => {
    const signOff = section('why').match(/<p>[\s\S]*?<\/p>/g)!.at(-2)!;
    expect(signOff.startsWith('<p>— <a href="https://lucaspolito.dev/">Lucas Polito</a> <a class="about-icon"')).toBe(true);
    expect(signOff).toContain('aria-label="Feels on Wheels on GitHub"');
  });

  test('how to use it claims no more than was tested', () => {
    const how = section('how');
    expect(how).toContain('built for screen readers');
    expect(how).toContain('href="https://github.com/lpolito/feels-on-wheels/blob/main/ACCESSIBILITY.md"');
    expect(how).not.toContain('with a screen reader.');
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
    expect(html).toMatch(/<h1 tabindex="-1"><a class="about-home" href="\/">[\s\S]*?Feels on Wheels<\/a><\/h1>/);
  });

  test('the heading links home with the app icon, which is decorative and sized to hold its space', () => {
    const img = /<h1[^>]*><a class="about-home" href="\/">(<img [^>]*>)Feels on Wheels<\/a><\/h1>/.exec(html)![1]!;
    expect(img).toContain('src="/icons/icon.svg"');
    expect(img).toContain('alt=""');
    expect(img).toMatch(/width="\d+" height="\d+"/);
  });

  test('it ends with the way back to the wheel', () => {
    expect(html.trimEnd()).toMatch(/<a href="\/"><svg class="about-chevron"[^>]*aria-hidden="true"[\s\S]*?<\/svg>Back to the wheel<\/a><\/p>\s*<\/main>$/);
  });

});
