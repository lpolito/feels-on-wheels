// @vitest-environment happy-dom
import { describe, expect, test } from 'vitest';
import '../../src/ui/hint';
import type { FwHint } from '../../src/ui/hint';

describe('<fw-hint>', () => {
  test('hint hidden when text is null', () => {
    document.body.innerHTML = '<fw-hint></fw-hint>';
    const el = document.querySelector<FwHint>('fw-hint')!;
    el.text = 'Spin to explore.';
    expect(el.hidden).toBe(false);
    expect(el.textContent).toBe('Spin to explore.');
    expect(el.getAttribute('aria-live')).toBe('polite');
    el.text = null;
    expect(el.hidden).toBe(true);
  });
});
