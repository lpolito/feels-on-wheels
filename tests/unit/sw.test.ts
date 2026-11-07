import { describe, expect, test, vi } from 'vitest';
import { precacheManifest } from '../../build/sw-plugin';
import { navigationResponse } from '../../src/sw/strategy';

describe('service worker navigation strategy', () => {
  test('serves the cached shell and never fetches or writes a newer index from the old worker', async () => {
    const cached = new Response('old shell');
    const cache = { match: vi.fn(async () => cached), put: vi.fn() };
    const network = vi.fn(async () => new Response('new shell'));
    const res = await navigationResponse(cache, 'https://x/index.html', network);
    expect(await res.text()).toBe('old shell');
    expect(network).not.toHaveBeenCalled();
    expect(cache.put).not.toHaveBeenCalled();
    expect(cache.match).toHaveBeenCalledWith('https://x/index.html', { ignoreVary: true });
  });

  test('falls back to the network when nothing is cached, and to an error response offline', async () => {
    const empty = { match: vi.fn(async () => undefined) };
    expect(await (await navigationResponse(empty, 'u', async () => new Response('net'))).text()).toBe('net');
    const offline = await navigationResponse(empty, 'u', async () => { throw new TypeError('offline'); });
    expect(offline.type).toBe('error');
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
    expect(m.files).toEqual(['./', './assets/index-abc.js', './icons/icon.svg', './index.html']);
  });

  test('the version changes when any file content changes, even with identical names', () => {
    const a = precacheManifest(files).version;
    const b = precacheManifest(files.map((f) => (f.path === 'index.html' ? { ...f, content: '<html>b</html>' } : f))).version;
    expect(a).not.toBe(b);
    expect(precacheManifest(files).version).toBe(a);
  });
});
