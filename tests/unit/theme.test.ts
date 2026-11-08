// @vitest-environment happy-dom
import { beforeAll, describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';
import { setLocale } from '../../src/i18n';
import { applyPref, nextTheme, readPref, resolvedTheme, safeStorage, themeName, writePref } from '../../src/ui/theme';

beforeAll(() => setLocale(loadData().locale));

const throwing = {
  getItem: () => { throw new Error('denied'); },
  setItem: () => { throw new Error('denied'); },
} as unknown as Storage;

describe('theme preference', () => {
  test('readPref with throwing storage → system', () => {
    expect(readPref(throwing)).toBe('system');
    expect(readPref(null)).toBe('system');
  });

  test('readPref with garbage value → system; valid values round-trip', () => {
    localStorage.setItem('fw.theme', 'purple');
    expect(readPref(localStorage)).toBe('system');
    writePref(localStorage, 'dark');
    expect(localStorage.getItem('fw.theme')).toBe('dark');
    expect(readPref(localStorage)).toBe('dark');
  });

  test('writePref with throwing storage does not throw', () => {
    expect(() => writePref(throwing, 'light')).not.toThrow();
  });

  test('applyPref sets or removes data-theme', () => {
    const root = document.documentElement;
    applyPref('dark', root);
    expect(root.dataset['theme']).toBe('dark');
    applyPref('system', root);
    expect(root.hasAttribute('data-theme')).toBe(false);
  });

  test('resolvedTheme follows the media query only for system', () => {
    expect(resolvedTheme('system', { matches: true })).toBe('dark');
    expect(resolvedTheme('system', { matches: false })).toBe('light');
    expect(resolvedTheme('light', { matches: true })).toBe('light');
  });

  test('safeStorage returns a storage or null, never throws', () => {
    expect(() => safeStorage()).not.toThrow();
  });
});

describe('theme toggle', () => {
  test('nextTheme cycles system → light → dark → system', () => {
    expect(nextTheme('system')).toBe('light');
    expect(nextTheme('light')).toBe('dark');
    expect(nextTheme('dark')).toBe('system');
  });

  test('themeName names each choice', () => {
    expect(['system', 'light', 'dark'].map((p) => themeName(p as 'system'))).toEqual(['Match system', 'Light', 'Dark']);
  });
});
