// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest';
import '../../src/ui/hint';
import type { FwHint } from '../../src/ui/hint';

const mount = (): FwHint => {
  document.body.innerHTML = '<fw-hint></fw-hint>';
  return document.querySelector<FwHint>('fw-hint')!;
};
const content = { text: 'How are you feeling? Tap or spin to explore, or {link}.', link: { label: 'start from body sensations instead', wheel: 'body' } };

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

  test('renders text around a link button', () => {
    const el = mount();
    el.content = content;
    expect(el.textContent).toBe('How are you feeling? Tap or spin to explore, or start from body sensations instead.');
    const b = el.querySelector<HTMLButtonElement>('button.fw-hint-link')!;
    expect(b.textContent).toBe('start from body sensations instead');
    expect(b.type).toBe('button');
  });

  test('clicking the link dispatches fw-wheel with the target', () => {
    const el = mount();
    const got: unknown[] = [];
    document.body.addEventListener('fw-wheel', (e) => got.push((e as CustomEvent).detail));
    el.content = content;
    el.querySelector<HTMLButtonElement>('button.fw-hint-link')!.click();
    expect(got).toEqual([{ wheel: 'body' }]);
  });

  test('focusLink focuses the button', () => {
    const el = mount();
    el.content = content;
    el.focusLink();
    expect(document.activeElement).toBe(el.querySelector('button.fw-hint-link'));
  });

  test('setting the same content again keeps the button (and its focus)', () => {
    const el = mount();
    el.content = content;
    const b = el.querySelector('button.fw-hint-link');
    el.content = { ...content, link: { ...content.link } };
    expect(el.querySelector('button.fw-hint-link')).toBe(b);
  });
});
