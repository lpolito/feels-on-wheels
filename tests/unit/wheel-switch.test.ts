// @vitest-environment happy-dom
import { beforeAll, describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';
import { setLocale } from '../../src/i18n';
import '../../src/ui/wheel-switch';
import type { FwWheelSwitch } from '../../src/ui/wheel-switch';

beforeAll(() => setLocale(loadData().locale));

const WHEELS = [{ id: 'core', label: 'Feelings' }, { id: 'body', label: 'Body' }];
const mount = (): { el: FwWheelSwitch; got: unknown[] } => {
  document.body.innerHTML = '<fw-wheel-switch></fw-wheel-switch>';
  const el = document.querySelector<FwWheelSwitch>('fw-wheel-switch')!;
  const got: unknown[] = [];
  document.body.addEventListener('fw-wheel', (e) => got.push((e as CustomEvent).detail));
  el.wheels = WHEELS;
  el.current = 'core';
  return { el, got };
};
const buttons = (el: HTMLElement) => [...el.querySelectorAll<HTMLButtonElement>('button')];

describe('<fw-wheel-switch>', () => {
  test('one button per wheel, in order, with aria-pressed on the current one', () => {
    const { el } = mount();
    expect(el.getAttribute('role')).toBe('group');
    expect(el.getAttribute('aria-label')).toBe('Wheel');
    expect(buttons(el).map((b) => b.textContent)).toEqual(['Feelings', 'Body']);
    expect(buttons(el).map((b) => b.getAttribute('aria-pressed'))).toEqual(['true', 'false']);
  });

  test('clicking another wheel dispatches fw-wheel', () => {
    const { el, got } = mount();
    buttons(el)[1]!.click();
    expect(got).toEqual([{ wheel: 'body' }]);
  });

  test('clicking the current wheel dispatches nothing', () => {
    const { el, got } = mount();
    buttons(el)[0]!.click();
    expect(got).toEqual([]);
  });

  test('setting current moves aria-pressed without rebuilding the buttons', () => {
    const { el } = mount();
    const before = buttons(el);
    before[1]!.focus();
    el.current = 'body';
    expect(buttons(el)).toEqual(before);
    expect(before.map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'true']);
    expect(document.activeElement).toBe(before[1]);
  });
});
