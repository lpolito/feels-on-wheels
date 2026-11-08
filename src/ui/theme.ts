import { t } from '../i18n';

export type ThemePref = 'system' | 'light' | 'dark';

const KEY = 'fw.theme';
const PREFS: readonly ThemePref[] = ['system', 'light', 'dark'];

/** localStorage, or null when the browser refuses access (private mode, blocked site data). */
export function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function readPref(storage: Storage | null): ThemePref {
  try {
    const v = storage?.getItem(KEY);
    return PREFS.includes(v as ThemePref) ? (v as ThemePref) : 'system';
  } catch {
    return 'system';
  }
}

export function writePref(storage: Storage | null, p: ThemePref): void {
  try {
    storage?.setItem(KEY, p);
  } catch {
    // Storage unavailable: the preference lasts for this session only.
  }
}

/** System → Light → Dark → System (spec v1.3 §6.2). */
export function nextTheme(p: ThemePref): ThemePref {
  return PREFS[(PREFS.indexOf(p) + 1) % PREFS.length]!;
}

const NAME_KEYS: Record<ThemePref, string> = { system: 'themeSystem', light: 'themeLight', dark: 'themeDark' };

/** The choice's display name. */
export function themeName(p: ThemePref): string {
  return t(NAME_KEYS[p]);
}

export function applyPref(p: ThemePref, root: HTMLElement): void {
  if (p === 'system') root.removeAttribute('data-theme');
  else root.dataset['theme'] = p;
}

export function resolvedTheme(p: ThemePref, mql: { matches: boolean }): 'light' | 'dark' {
  if (p !== 'system') return p;
  return mql.matches ? 'dark' : 'light';
}
