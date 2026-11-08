// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest';
import '../../src/ui/hint';
import type { FwHint } from '../../src/ui/hint';

const mount = (): FwHint => {
  document.body.innerHTML = '<fw-hint></fw-hint>';
  return document.querySelector<FwHint>('fw-hint')!;
};
const content = { text: 'How are you feeling? Tap or spin to explore, or {link}.', link: { label: 'start from body sensations instead', wheel: 'body', href: '#/body' } };

describe('<fw-hint>', () => {
  test('null hides it', () => {
    const el = mount();
    el.content = { text: 'Spin to explore.' };
    expect(el.hidden).toBe(false);
    expect(el.textContent).toBe('Spin to explore.');
    el.content = null;
    expect(el.hidden).toBe(true);
  });

  test('the message is plain text, not a live region', () => {
    const el = mount();
    el.content = content;
    expect(el.getAttribute('aria-live')).toBeNull();
  });

  test('renders text around a link', () => {
    const el = mount();
    el.content = content;
    expect(el.textContent).toBe('How are you feeling? Tap or spin to explore, or start from body sensations instead.');
    const b = el.querySelector<HTMLAnchorElement>('a.fw-hint-link')!;
    expect(b.textContent).toBe('start from body sensations instead');
    expect(b.getAttribute('href')).toBe('#/body');
  });

  test('clicking the link dispatches fw-wheel with the target', () => {
    const el = mount();
    const got: unknown[] = [];
    document.body.addEventListener('fw-wheel', (e) => got.push((e as CustomEvent).detail));
    el.content = content;
    el.querySelector<HTMLAnchorElement>('a.fw-hint-link')!.click();
    expect(got).toEqual([{ wheel: 'body' }]);
  });

  test('focusLink focuses the link', () => {
    const el = mount();
    el.content = content;
    el.focusLink();
    expect(document.activeElement).toBe(el.querySelector('a.fw-hint-link'));
  });

  test('setting the same content again keeps the link (and its focus)', () => {
    const el = mount();
    el.content = content;
    const b = el.querySelector('a.fw-hint-link');
    el.content = { ...content, link: { ...content.link } };
    expect(el.querySelector('a.fw-hint-link')).toBe(b);
  });
  test("a plain click dispatches fw-wheel and prevents navigation", () => {
    const el = mount();
    const got: unknown[] = [];
    document.body.addEventListener('fw-wheel', (e) => got.push((e as CustomEvent).detail));
    el.content = content;
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    el.querySelector('a.fw-hint-link')!.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    expect(got).toEqual([{ wheel: 'body' }]);
  });

  test('a modified click is left to the browser', () => {
    const mods: MouseEventInit[] = [{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }];
    for (const mod of mods) {
      const el = mount();
      const got: unknown[] = [];
      const on = (e: Event) => got.push((e as CustomEvent).detail);
      document.body.addEventListener('fw-wheel', on);
      el.content = content;
      const ev = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...mod });
      el.querySelector('a.fw-hint-link')!.dispatchEvent(ev);
      document.body.removeEventListener('fw-wheel', on);
      expect(ev.defaultPrevented, JSON.stringify(mod)).toBe(false);
      expect(got, JSON.stringify(mod)).toEqual([]);
    }
  });

  test('a different href re-renders the link', () => {
    const el = mount();
    el.content = content;
    el.content = { ...content, link: { ...content.link, href: '/' } };
    expect(el.querySelector('a.fw-hint-link')!.getAttribute('href')).toBe('/');
  });
});
