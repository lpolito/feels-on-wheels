// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest';
import '../../src/ui/back-to';
import type { FwBackTo } from '../../src/ui/back-to';

const target = { href: '/body/chest/racing-heart/scared', label: 'Back to the body wheel' };

function mount(): { el: FwBackTo; backs: Event[] } {
  document.body.innerHTML = '<fw-back-to hidden></fw-back-to>';
  const el = document.querySelector<FwBackTo>('fw-back-to')!;
  const backs: Event[] = [];
  el.addEventListener('fw-back', (e) => backs.push(e));
  return { el, backs };
}

describe('<fw-back-to> (wheel and card spec §2)', () => {
  test('null hides it', () => {
    const { el } = mount();
    el.target = target;
    el.target = null;
    expect(el.hidden).toBe(true);
    expect(el.querySelector('a')).toBeNull();
  });

  test('a target shows one link', () => {
    const { el } = mount();
    el.target = target;
    expect(el.hidden).toBe(false);
    const links = el.querySelectorAll<HTMLAnchorElement>('a.fw-back-to');
    expect(links).toHaveLength(1);
    expect(links[0]!.getAttribute('href')).toBe('/body/chest/racing-heart/scared');
    expect(links[0]!.textContent).toBe('Back to the body wheel');
    expect(links[0]!.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  });

  test('the same target again keeps the link, and its focus', () => {
    const { el } = mount();
    el.target = target;
    const a = el.querySelector('a')!;
    a.focus();
    el.target = { ...target };
    expect(el.querySelector('a')).toBe(a);
    expect(document.activeElement).toBe(a);
  });

  test('a plain click emits fw-back', () => {
    const { el, backs } = mount();
    el.target = target;
    const click = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    el.querySelector('a')!.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(backs).toHaveLength(1);
    expect(backs[0]!.bubbles).toBe(true);
  });

  test('a modified click is left to the browser', () => {
    const { el, backs } = mount();
    el.target = target;
    const a = el.querySelector('a')!;
    for (const init of [{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }]) {
      const e = new MouseEvent('click', { bubbles: true, cancelable: true, ...init });
      // Stop it reaching the document, where happy-dom would follow the link.
      el.addEventListener('click', (ev) => ev.stopPropagation(), { once: true });
      a.dispatchEvent(e);
      expect(e.defaultPrevented, JSON.stringify(init)).toBe(false);
    }
    expect(backs).toEqual([]);
  });
});
