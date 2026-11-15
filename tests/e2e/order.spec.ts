import { expect, test, type Page } from '@playwright/test';
import { aboutLink, focused, hint, idle, open, selectedPath, state, tabStops, tapPath } from './helpers';

const tabbableWord = (page: Page) => page.locator('#a11y-tree [role="treeitem"][tabindex="0"]');
/** The path of the tree's focused word, or null when focus is elsewhere. */
const focusedPath = (page: Page) => page.evaluate(() => {
  const el = document.activeElement;
  if (!(el instanceof HTMLElement) || el.getAttribute('role') !== 'treeitem') return null;
  return window.__fw.pathOf(Number(el.dataset['index']));
});
const offCenter = (page: Page, path: string) => page.evaluate((p) => window.__fw.offCenter(p), path);

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
  const message = await box('#message');
  await tapPath(page, 'angry');
  near(message, await box('#float'));
  // Resized with the page loaded and a word selected: both boxes follow the new layout together.
  await page.setViewportSize({ width: 390, height: 844 });
  await idle(page);
  near(await box('#message'), await box('#float'));
});

test('the h1 follows the URL', async ({ page }) => {
  const h1 = page.getByRole('heading', { level: 1 });
  await open(page, '/');
  await expect(h1).toHaveText('How are you feeling?');
  await open(page, '/plaful');
  await expect(h1).toHaveText('Feeling not found!');
  await open(page, '/');
  await tapPath(page, 'angry');
  await expect(h1).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 2, name: 'Angry' })).toBeVisible();
  await open(page, '/angry');
  await expect(h1).toHaveText('Angry');
  await expect(page.getByRole('heading', { level: 2, name: 'Narrow it down' })).toBeVisible();
});

test('Tab onto the wheel selects nothing and keeps the message and Share', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit skips links on Tab; the order itself is checked through tabStops');
  await open(page);
  for (let k = 0; k < 10 && (await focused(page)) !== 'LI'; k++) await page.keyboard.press('Tab');
  expect(await focused(page)).toBe('LI');
  expect((await state(page)).selected).toBeNull();
  await expect(hint(page)).toBeVisible();
  await expect(page.locator('fw-toolbar .fw-share')).toBeVisible();
  await page.keyboard.press('Tab');
  expect(await focusedPath(page)).toBeNull();
  expect((await state(page)).selected).toBeNull();
});

test("the first key selects the word at 3 o'clock and opens nothing", async ({ page, browserName }) => {
  for (const key of ['ArrowDown', 'ArrowRight', 'ArrowLeft', 'Enter']) {
    await open(page);
    await tabbableWord(page).focus();
    const path = (await focusedPath(page))!;
    expect(path, key).not.toBeNull();
    expect((await state(page)).selected, key).toBeNull();
    await page.keyboard.press(key);
    await idle(page);
    expect(await selectedPath(page), key).toBe(path);
    expect((await state(page)).opened, key).toBe(false);
    expect(await offCenter(page, path), key).toBeLessThan(1e-3);
  }
  // Enter again opens it, and the card is the next Tab stop.
  await page.keyboard.press('Enter');
  await idle(page);
  expect((await state(page)).opened).toBe(true);
  const stops = await tabStops(page);
  expect(stops[stops.indexOf('LI') + 1]).toBe('BUTTON.fw-card-toggle');
  // WebKit's Tab skips buttons by default.
  if (browserName === 'webkit') return;
  await page.keyboard.press('Tab');
  expect(await focused(page)).toBe('BUTTON.fw-card-toggle');
});

test("an arrow on the message's About link selects a word and keeps focus on the wheel", async ({ page }) => {
  await open(page);
  await aboutLink(page).focus();
  await page.keyboard.press('ArrowRight');
  await idle(page);
  const s = await state(page);
  expect(s.selected).not.toBeNull();
  await expect(hint(page)).toBeHidden();
  expect(await focusedPath(page)).toBe(await selectedPath(page));
});

test('Tab during the intro spin picks the word it lands on', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'the intro spin plays on phones');
  await page.goto('/');
  await page.waitForFunction(() => window.__fw !== undefined);
  await tabbableWord(page).focus();
  await idle(page);
  const path = (await focusedPath(page))!;
  expect(path).not.toBeNull();
  expect(await offCenter(page, path)).toBeLessThan(1e-3);
  await page.keyboard.press('ArrowDown');
  await idle(page);
  expect(await selectedPath(page)).toBe(path);
});

test("Start over leaves focus on the word at 3 o'clock with nothing selected", async ({ page }) => {
  await open(page);
  await tabbableWord(page).focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await idle(page);
  const path = (await selectedPath(page))!;
  expect(await offCenter(page, path)).toBeLessThan(1e-3);
  await page.getByRole('button', { name: 'Start over' }).focus();
  await page.keyboard.press('Enter');
  await idle(page);
  expect((await state(page)).selected).toBeNull();
  expect(await focusedPath(page)).toBe(path);
  await expect(tabbableWord(page)).toBeFocused();
});
