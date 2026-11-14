import { describe, expect, test } from 'vitest';
import { escapeHtml, type PageStrings } from '../../build/site';
import { site } from '../../site.config';
import { loadData } from '../../src/data/load';
import { page, titles } from '../../src/data/locales/en.json';
import { routeTable } from '../../src/state/url';
import { handle, replaceHead, type AssetsBinding, type WorkerContext } from '../../src/worker/handler';

// URL redesign spec §5, §6: the Worker answers paths with no file, from the built shell.

const SHELL = [
  '<!doctype html>',
  '<html lang="en" dir="ltr" data-route="wheel">',
  '<head>',
  '  <meta charset="utf-8">',
  '  <!--head-->',
  '  <title>Shell title</title>',
  '  <script type="application/ld+json">{}</script>',
  '  <!--/head-->',
  '</head>',
  '<body><div id="app"></div><main class="about" id="about"></main></body>',
  '</html>',
  '',
].join('\n');

const SHELL_HEADERS = {
  'content-type': 'text/html; charset=utf-8',
  'cache-control': 'public, max-age=0, must-revalidate',
  etag: '"x"',
  'content-length': String(new TextEncoder().encode(SHELL).length),
};

function fakeAssets(): AssetsBinding & { requested: string[] } {
  const requested: string[] = [];
  return {
    requested,
    async fetch(input) {
      requested.push(input instanceof Request ? input.url : String(input));
      return new Response(SHELL, { status: 200, headers: SHELL_HEADERS });
    },
  };
}

const data = loadData();
const ctx: WorkerContext = {
  table: routeTable(data.wheels),
  locale: data.locale,
  site,
  strings: { ...(page as unknown as Omit<PageStrings, 'titles'>), titles },
};

const ORIGIN = 'http://localhost:4173';

async function get(path: string, init?: RequestInit): Promise<{ res: Response; html: string; assets: ReturnType<typeof fakeAssets> }> {
  const assets = fakeAssets();
  const res = await handle(new Request(ORIGIN + path, init), assets, ctx);
  return { res, html: await res.text(), assets };
}

const titleOf = (html: string): string | undefined => /<title>([^<]*)<\/title>/.exec(html)?.[1];
const metaOf = (html: string, attr: string, key: string): string | undefined =>
  new RegExp(`<meta ${attr}="${key}" content="([^"]*)">`).exec(html)?.[1];
const canonicalOf = (html: string): string | undefined => /<link rel="canonical" href="([^"]*)">/.exec(html)?.[1];
const NOINDEX = '<meta name="robots" content="noindex">';

describe('real paths', () => {
  test('a word: its title, its definition, its canonical, noindex while the site is not indexable, and no JSON-LD', async () => {
    const { res, html, assets } = await get('/happy/playful');
    expect(res.status).toBe(200);
    expect(assets.requested).toEqual([`${ORIGIN}/`]);
    expect(html).toContain('<title>Playful · Feels on Wheels</title>');
    expect(html).not.toContain('Shell title');
    expect(metaOf(html, 'name', 'description')).toBe(escapeHtml(data.locale.feelings['playful']!.definition!));
    expect(canonicalOf(html)).toBe(`${site.url}happy/playful`);
    expect(metaOf(html, 'property', 'og:url')).toBe(`${site.url}happy/playful`);
    expect(html).toContain(NOINDEX);
    expect(html).not.toContain('application/ld+json');
    expect(html).toContain('data-route="wheel"');
    expect(html.match(/<!--head-->/g)).toHaveLength(1);
    expect(html.match(/<!--\/head-->/g)).toHaveLength(1);
  });

  test('the query is left out of the canonical', async () => {
    const { res, html } = await get('/happy/playful?fbclid=1');
    expect(res.status).toBe(200);
    expect(canonicalOf(html)).toBe(`${site.url}happy/playful`);
    expect(html).not.toContain('fbclid');
  });

  test('About: the About view and its title', async () => {
    const { res, html } = await get('/about');
    expect(res.status).toBe(200);
    expect(html).toContain('<html lang="en" dir="ltr" data-route="about">');
    expect(html).not.toContain('data-route="wheel"');
    expect(titleOf(html)).toBe(escapeHtml(titles.about));
    expect(metaOf(html, 'name', 'description')).toBe(escapeHtml(titles.aboutDescription));
    expect(canonicalOf(html)).toBe(`${site.url}about`);
  });

  test.each([
    ['/body', 'Body sensations wheel · Feels on Wheels', titles.wheelDescriptions.body],
    ['/body/chest/tight-chest', 'Tight chest · Feels on Wheels', 'Tight chest: the feelings it can come with, on the body sensations wheel.'],
    ['/body/chest', 'Chest · Feels on Wheels', 'Chest: what you might notice there, and the feelings it can come with.'],
  ])('%s has the §6 title and description', async (path, title, description) => {
    const { res, html } = await get(path);
    expect(res.status).toBe(200);
    expect(titleOf(html)).toBe(escapeHtml(title));
    expect(metaOf(html, 'name', 'description')).toBe(escapeHtml(description));
    expect(canonicalOf(html)).toBe(`${site.url}${path.slice(1)}`);
    expect(html).toContain('data-route="wheel"');
  });
});

describe('redirects', () => {
  test('a trailing slash redirects to the path without it', async () => {
    const { res, assets } = await get('/happy/');
    expect(res.status).toBe(301);
    expect(res.headers.get('location')).toBe(`${ORIGIN}/happy`);
    expect(assets.requested).toEqual([]);
  });

  test('/about.html redirects to /about, keeping the query', async () => {
    const { res } = await get('/about.html?x=1');
    expect(res.status).toBe(301);
    expect(res.headers.get('location')!.endsWith('/about?x=1')).toBe(true);
  });

  test('a non-canonical form of a path that is not real is a 404, not a redirect', async () => {
    const { res, html } = await get('/nope/');
    expect(res.status).toBe(404);
    expect(titleOf(html)).toBe('Not found · Feels on Wheels');
  });
});

describe('not found', () => {
  test.each([
    '/Happy',
    '/happy/nope',
    '/en/happy',
    '//happy',
    '/happy%2Fplayful',
    '/%E0%A4%A',
    `/${'a'.repeat(500)}`,
  ])('%s is a 404 with the not-found head, noindex, and the wheel view', async (path) => {
    const { res, html } = await get(path);
    expect(res.status).toBe(404);
    expect(titleOf(html)).toBe('Not found · Feels on Wheels');
    expect(html).toContain(NOINDEX);
    expect(html).not.toContain('application/ld+json');
    expect(html).toContain('data-route="wheel"');
  });

  test('noindex stays on a 404 even when the site is indexable', async () => {
    const res = await handle(new Request(`${ORIGIN}/nope`), fakeAssets(), { ...ctx, site: { ...site, indexable: true } });
    expect(res.status).toBe(404);
    expect(await res.text()).toContain(NOINDEX);
    const real = await handle(new Request(`${ORIGIN}/happy`), fakeAssets(), { ...ctx, site: { ...site, indexable: true } });
    expect(await real.text()).not.toContain(NOINDEX);
  });
});

describe('methods and headers', () => {
  test('HEAD answers like GET, with no body', async () => {
    const { res, html } = await get('/happy', { method: 'HEAD' });
    expect(res.status).toBe(200);
    expect(html).toBe('');
    expect(res.headers.get('content-type')).toMatch(/^text\/html/);
  });

  test.each(['POST', 'PUT', 'DELETE'])('%s is 405, allowing GET and HEAD', async (method) => {
    const { res, assets } = await get('/happy', { method });
    expect(res.status).toBe(405);
    expect(res.headers.get('allow')).toBe('GET, HEAD');
    expect(assets.requested).toEqual([]);
  });

  test.each(['/happy/playful', '/about', '/nope'])('%s keeps the shell\'s caching headers, but not its etag or length', async (path) => {
    const { res } = await get(path);
    expect([200, 404]).toContain(res.status);
    expect(res.headers.get('cache-control')).toBe('public, max-age=0, must-revalidate');
    expect(res.headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect(res.headers.get('etag')).toBeNull();
    expect(res.headers.get('content-length')).toBeNull();
  });
});

describe('replaceHead', () => {
  test('replaces everything between the markers, keeping the markers', () => {
    const out = replaceHead(SHELL, '<!--head-->\n  <title>New</title>\n  <!--/head-->');
    expect(out).toContain('<title>New</title>');
    expect(out).not.toContain('Shell title');
    expect(out.startsWith('<!doctype html>')).toBe(true);
    expect(out).toContain('<div id="app">');
  });

  test('throws when a marker is missing', () => {
    expect(() => replaceHead(SHELL.replace('<!--/head-->', ''), 'x')).toThrow();
    expect(() => replaceHead(SHELL.replace('<!--head-->', ''), 'x')).toThrow();
    expect(() => replaceHead('<html></html>', 'x')).toThrow();
  });
});
