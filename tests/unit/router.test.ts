import { describe, expect, test } from 'vitest';
import { inAppLink, type ClickInfo, type LinkInfo } from '../../src/router';

// URL redesign spec §2: which link clicks the app handles, and which it leaves to the browser (Review Focus 4).

const origin = 'https://feels.example';
const plain: ClickInfo = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, defaultPrevented: false };
const about: LinkInfo = { href: `${origin}/about`, target: '', download: false };

describe('inAppLink', () => {
  test('a plain left click on a same-origin link is handled in the app', () => {
    const url = inAppLink(plain, about, origin);
    expect(url).toBeInstanceOf(URL);
    expect(url!.href).toBe(`${origin}/about`);
    expect(inAppLink(plain, { ...about, href: `${origin}/body/chest/tight-chest?x=1` }, origin)!.pathname).toBe('/body/chest/tight-chest');
    expect(inAppLink(plain, { ...about, target: '_self' }, origin)).not.toBeNull();
  });

  test.each([
    ['⌘', { metaKey: true }],
    ['Ctrl', { ctrlKey: true }],
    ['Shift', { shiftKey: true }],
    ['Alt', { altKey: true }],
    ['a middle click', { button: 1 }],
    ['a right click', { button: 2 }],
    ['an already handled click', { defaultPrevented: true }],
  ] as const)('%s goes to the browser', (_, change) => {
    expect(inAppLink({ ...plain, ...change }, about, origin)).toBeNull();
  });

  test.each([
    ['target="_blank"', { target: '_blank' }],
    ['a named target', { target: 'other' }],
    ['download', { download: true }],
    ['another origin', { href: 'https://github.com/lpolito/feels-on-wheels' }],
    ['the same host on another scheme', { href: 'http://feels.example/about' }],
    ['a mailto: link', { href: 'mailto:someone@example.com' }],
    ['an unparseable href', { href: 'https://[' }],
  ] as const)('%s goes to the browser', (_, change) => {
    expect(inAppLink(plain, { ...about, ...change }, origin)).toBeNull();
  });
});
