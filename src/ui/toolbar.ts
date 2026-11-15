import { t } from '../i18n';
import { shareIcon } from './icons';
import { nextTheme, themeName, type ThemePref } from './theme';

const SVG = 'http://www.w3.org/2000/svg';

const LABEL_MS = 1500;

/** The theme toggle's icons (spec v1.3 §6.2): half-filled circle, sun, moon. Only the current one shows. */
const THEME_ICONS: Record<ThemePref, string[]> = {
  system: ['M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16z', 'M12 4v16a8 8 0 0 0 0-16z'],
  light: ['M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8z', 'M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'],
  dark: ['M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z'],
};

function themeIcon(p: ThemePref): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'fw-icon');
  svg.dataset['theme'] = p;
  THEME_ICONS[p].forEach((d, i) => {
    const path = document.createElementNS(SVG, 'path');
    path.setAttribute('d', d);
    // The system icon's second path is the filled half.
    if (p === 'system' && i === 1) path.setAttribute('class', 'fw-icon-fill');
    svg.append(path);
  });
  return svg;
}

/** A circular arrow: "back to the start". */
function restartIcon(): SVGSVGElement {
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'fw-icon');
  const path = document.createElementNS(SVG, 'path');
  path.setAttribute('d', 'M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5');
  svg.append(path);
  return svg;
}

/**
 * "Start over" (while a word is selected), "Share" (while nothing is) and the theme control, last, in the corner. "Start over" emits
 * 'fw-action' ({type:'clear'}) then 'fw-focus-lost' (spec v1.3 §3.2); Share emits 'fw-share' ({what:'site'}); the theme control emits
 * 'fw-theme' (ThemePref).
 */
export class FwToolbar extends HTMLElement {
  #startOver: HTMLButtonElement | null = null;
  #themeButton: HTMLButtonElement | null = null;
  #label: HTMLSpanElement | null = null;
  #labelTimer: ReturnType<typeof setTimeout> | null = null;
  #share: HTMLButtonElement | null = null;
  #shareWrap: HTMLSpanElement | null = null;
  #shareLabel: HTMLSpanElement | null = null;
  #shareTimer: ReturnType<typeof setTimeout> | null = null;
  #selected = false;
  #theme: ThemePref = 'system';

  /** A word is selected (or opened): "Start over" shows. */
  set selected(v: boolean) {
    this.#selected = v;
    this.#sync();
  }

  set theme(p: ThemePref) {
    this.#theme = p;
    this.#sync();
  }

  connectedCallback(): void {
    if (this.#startOver) return;
    this.setAttribute('role', 'toolbar');
    const startOver = document.createElement('button');
    startOver.type = 'button';
    startOver.className = 'fw-start-over';
    const startLabel = document.createElement('span');
    startLabel.className = 'fw-start-over-label';
    startLabel.textContent = t('startOver');
    startOver.append(restartIcon(), startLabel);
    startOver.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('fw-action', { detail: { type: 'clear' }, bubbles: true }));
      // The button hides once nothing is selected, so focus goes to the wheel's tree, not <body>.
      this.dispatchEvent(new CustomEvent('fw-focus-lost', { bubbles: true }));
    });
    const theme = document.createElement('button');
    theme.type = 'button';
    theme.className = 'fw-theme-toggle';
    for (const p of ['system', 'light', 'dark'] as const) theme.append(themeIcon(p));
    const label = document.createElement('span');
    label.className = 'fw-theme-label';
    label.setAttribute('aria-hidden', 'true');
    theme.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent<ThemePref>('fw-theme', { detail: nextTheme(this.#theme), bubbles: true }));
      this.#showLabel();
    });
    const themeWrap = document.createElement('span');
    themeWrap.className = 'fw-theme';
    themeWrap.append(theme, label);
    this.#startOver = startOver;
    this.#themeButton = theme;
    this.#label = label;
    const share = document.createElement('button');
    share.type = 'button';
    share.className = 'fw-share';
    share.append(shareIcon());
    share.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('fw-share', { detail: { what: 'site' }, bubbles: true }));
    });
    const shareLabel = document.createElement('span');
    shareLabel.className = 'fw-share-label';
    shareLabel.setAttribute('aria-hidden', 'true');
    shareLabel.textContent = t('linkCopied');
    const shareWrap = document.createElement('span');
    shareWrap.className = 'fw-share-wrap';
    shareWrap.append(share, shareLabel);
    this.#share = share;
    this.#shareWrap = shareWrap;
    this.#shareLabel = shareLabel;
    this.append(startOver, shareWrap, themeWrap);
    this.#sync();
  }

  /** Spec v1.3 §6.2: after a tap the label names the choice for 1.5 s; each tap restarts the timer. */
  #showLabel(): void {
    this.#label!.setAttribute('data-show', '');
    if (this.#labelTimer !== null) clearTimeout(this.#labelTimer);
    this.#labelTimer = setTimeout(() => {
      this.#labelTimer = null;
      this.#label!.removeAttribute('data-show');
    }, LABEL_MS);
  }

  /** After Share copies the link (it had no share sheet to open): "Link copied" shows for 1.5 s. */
  showCopied(): void {
    if (!this.#shareLabel) return;
    this.#shareLabel.setAttribute('data-show', '');
    if (this.#shareTimer !== null) clearTimeout(this.#shareTimer);
    this.#shareTimer = setTimeout(() => {
      this.#shareTimer = null;
      this.#shareLabel!.removeAttribute('data-show');
    }, LABEL_MS);
  }

  #sync(): void {
    if (!this.#startOver || !this.#themeButton || !this.#label || !this.#share || !this.#shareWrap) return;
    // Hiding the focused button (Escape, Back, a tap on a word) would drop focus to <body>: hand it to the wheel instead.
    const active = document.activeElement;
    const hadFocus = (!this.#selected && !this.#startOver.hidden && active === this.#startOver) || (this.#selected && !this.#share.hidden && active === this.#share);
    this.#startOver.hidden = !this.#selected;
    this.#share.hidden = this.#selected;
    this.#shareWrap.hidden = this.#selected;
    this.#share.setAttribute('aria-label', t('shareSite'));
    this.#share.title = t('shareSite');
    if (hadFocus) this.dispatchEvent(new CustomEvent('fw-focus-lost', { bubbles: true }));
    this.#themeButton.setAttribute('aria-label', t('themeButton', { choice: themeName(this.#theme) }));
    for (const icon of this.#themeButton.querySelectorAll<SVGElement>('svg[data-theme]')) {
      icon.toggleAttribute('hidden', icon.dataset['theme'] !== this.#theme);
    }
    this.#label.textContent = themeName(this.#theme);
  }
}

if (!customElements.get('fw-toolbar')) customElements.define('fw-toolbar', FwToolbar);
