import { describe, expect, test, vi } from 'vitest';
import { precacheManifest } from '../../build/sw-plugin';
import { canonicalPage, navigationResponse, navigationUrls, precacheResponse } from '../../src/sw/strategy';

describe('service worker navigation strategy', () => {
  test('serves the cached shell and never fetches or writes a newer index from the old worker', async () => {
    const cached = new Response('old shell');
    const cache = { match: vi.fn(async () => cached), put: vi.fn() };
    const network = vi.fn(async () => new Response('new shell'));
    const res = await navigationResponse(cache, ['https://x/'], network);
    expect(await res.text()).toBe('old shell');
    expect(network).not.toHaveBeenCalled();
    expect(cache.put).not.toHaveBeenCalled();
    expect(cache.match).toHaveBeenCalledWith('https://x/', { ignoreVary: true });
  });

  test('falls back to the network when nothing is cached, and to an error response offline', async () => {
    const empty = { match: vi.fn(async () => undefined) };
    expect(await (await navigationResponse(empty, ['u'], async () => new Response('net'))).text()).toBe('net');
    const offline = await navigationResponse(empty, ['u'], async () => { throw new TypeError('offline'); });
    expect(offline.type).toBe('error');
  });

  const site = { match: vi.fn(async (url: string) => (url === 'https://x/' ? new Response('shell') : undefined)) };

  test('every navigation, About and unknown paths included, gets the shell (URL redesign spec §7, §8)', async () => {
    const network = vi.fn(async () => new Response('net'));
    for (const page of ['https://x/', 'https://x/about?ref=a#b', 'https://x/happy/playful', 'https://x/body/chest', 'https://x/nope']) {
      const urls = navigationUrls(page, 'https://x/');
      expect(urls).toEqual(['https://x/']);
      expect(await (await navigationResponse(site, urls, network)).text()).toBe('shell');
    }
    expect(network).not.toHaveBeenCalled();
  });
});

describe('precache manifest', () => {
  const files = [
    { path: 'index.html', content: '<html>a</html>' },
    { path: 'assets/index-abc.js', content: 'console.log(1)' },
    { path: 'icons/icon.svg', content: '<svg/>' },
    { path: '.DS_Store', content: 'junk' },
  ];

  test('lists every file relative to the scope, root first, without junk or the worker itself', () => {
    const m = precacheManifest([...files, { path: 'sw.js', content: 'x' }]);
    expect(m.files).toEqual(['./', './assets/index-abc.js', './icons/icon.svg']);
  });

  test('the shell is ./ and no page address is precached: About is part of the shell now', () => {
    const m = precacheManifest(files);
    expect(m.files[0]).toBe('./');
    expect(m.files).not.toContain('./about');
    expect(m.files).not.toContain('./index.html');
  });

  test('the version changes when any file content changes, even with identical names', () => {
    const a = precacheManifest(files).version;
    const b = precacheManifest(files.map((f) => (f.path === 'index.html' ? { ...f, content: '<html>b</html>' } : f))).version;
    expect(a).not.toBe(b);
    expect(precacheManifest(files).version).toBe(a);
  });
});

describe('precache responses', () => {
  const redirected = (body: string): Response => {
    const res = new Response(body);
    Object.defineProperty(res, 'redirected', { value: true });
    return res;
  };

  test('a plain 200 is kept', async () => {
    const res = await precacheResponse('https://x/about', async () => new Response('about'));
    expect(await res.text()).toBe('about');
  });

  test('a response that followed a redirect is refused, so the install fails and the old worker keeps serving', async () => {
    await expect(precacheResponse('https://x/about.html', async () => redirected('about'))).rejects.toThrow('https://x/about.html');
  });

  test('an error status is refused', async () => {
    await expect(precacheResponse('https://x/gone', async () => new Response('', { status: 404 }))).rejects.toThrow('404');
  });
});

describe('canonical page addresses', () => {
  const scope = 'https://x/';

  test('a .html or trailing-slash address redirects to the clean one, keeping the query', () => {
    expect(canonicalPage('https://x/about.html', scope)).toBe('https://x/about');
    expect(canonicalPage('https://x/about/', scope)).toBe('https://x/about');
    expect(canonicalPage('https://x/about.html?ref=a#b', scope)).toBe('https://x/about?ref=a');
    expect(canonicalPage('https://x/index.html', scope)).toBe('https://x/');
  });

  test('clean addresses and the scope itself need no redirect', () => {
    expect(canonicalPage('https://x/', scope)).toBeNull();
    expect(canonicalPage('https://x/about', scope)).toBeNull();
    expect(canonicalPage('https://x/?ref=a#/core/happy', scope)).toBeNull();
  });

  test('a sub-path scope keeps its own trailing slash', () => {
    expect(canonicalPage('https://x/app/', 'https://x/app/')).toBeNull();
    expect(canonicalPage('https://x/app/index.html', 'https://x/app/')).toBe('https://x/app/');
    expect(canonicalPage('https://x/app/about.html', 'https://x/app/')).toBe('https://x/app/about');
  });
});
