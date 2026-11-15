import { expect, test } from '@playwright/test';
import { open, tabStops, tapPath } from './helpers';

test('the message comes first, then the switch, the toolbar, the wheel', async ({ page }) => {
  for (const path of ['/', '/body', '/plaful']) {
    await open(page, path);
    const stops = await tabStops(page);
    expect(stops.slice(0, 2), path).toEqual(['A.fw-hint-link', 'A.fw-hint-about-link']);
    const tree = stops.indexOf('LI');
    expect(tree, path).toBeGreaterThan(2);
    expect(stops.slice(2, tree), path).toContain('BUTTON.fw-share');
    expect(stops.slice(2, tree).every((s) => s.startsWith('BUTTON')), path).toBe(true);
    expect(stops.slice(tree), path).toEqual(['LI']);
  }
});

test('after selecting a word, the card comes right after the wheel', async ({ page }) => {
  await open(page);
  await tapPath(page, 'angry');
  const stops = await tabStops(page);
  expect(stops[stops.indexOf('LI') + 1]).toBe('BUTTON.fw-card-toggle');
});

test('the message sits where the card does', async ({ page }) => {
  await open(page);
  const box = (sel: string) => page.locator(sel).evaluate((e) => {
    const r = e.getBoundingClientRect();
    return { left: r.left, right: r.right, bottom: r.bottom };
  });
  const near = (a: { left: number; right: number; bottom: number }, b: typeof a) => {
    expect(Math.abs(a.left - b.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(a.right - b.right)).toBeLessThanOrEqual(1);
    expect(Math.abs(a.bottom - b.bottom)).toBeLessThanOrEqual(1);
  };
  for (const size of [null, { width: 390, height: 844 }]) {
    if (size) await page.setViewportSize(size);
    await open(page);
    const message = await box('#message');
    await tapPath(page, 'angry');
    near(message, await box('#float'));
  }
});
