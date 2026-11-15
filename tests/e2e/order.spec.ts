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
const coreAtThree = (page: Page) => page.evaluate(() => window.__fw.coreAtThree());

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
    return { left: r.left, right: r.right, bottom: r.bottom, middle: (r.top + r.bottom) / 2, anchor: getComputedStyle(e.parentElement!).justifyContent };
  });
  // Same left and right edges. Vertically both sit where #float put them: on the bottom edge when it anchors to the
  // bottom (portrait), else centered in the column, so their middles agree (the two have different heights).
  const near = (a: Awaited<ReturnType<typeof box>>, b: typeof a) => {
    expect(a.anchor).toBe(b.anchor);
    expect(Math.abs(a.left - b.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(a.right - b.right)).toBeLessThanOrEqual(1);
    const [x, y] = a.anchor === 'center' ? [a.middle, b.middle] : [a.bottom, b.bottom];
    expect(Math.abs(x - y)).toBeLessThanOrEqual(1);
  };
  const hintBox = await box('fw-hint');
  await tapPath(page, 'angry');
  near(hintBox, await box('fw-card'));
  // Resized with the page loaded and a word selected: the card follows the new layout, and so does the hint after it.
  await page.setViewportSize({ width: 390, height: 844 });
  await idle(page);
  const cardBox = await box('fw-card');
  await page.getByRole('button', { name: 'Start over' }).click();
  await idle(page);
  near(await box('fw-hint'), cardBox);
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
    expect(path, key).toBe(await coreAtThree(page));
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
  // Focus goes in mid-spin: the intro is still turning the wheel.
  const spinning = await page.evaluate(() => {
    document.querySelector<HTMLElement>('#a11y-tree [role="treeitem"][tabindex="0"]')!.focus();
    return window.__fw.moving();
  });
  expect(spinning).toBe(true);
  await idle(page);
  const path = (await focusedPath(page))!;
  expect(path).toBe(await coreAtThree(page));
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
  expect(await ringShown(page)).toBe(true);
});

test('a keyboard Start over from an inner word moves focus once, to the word at 3 o\'clock', async ({ page }) => {
  await open(page);
  await tabbableWord(page).focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await idle(page);
  expect((await selectedPath(page))!.split('/').length).toBeGreaterThan(1);
  await page.evaluate(() => {
    const seen: string[] = [];
    (window as unknown as { __seen: string[] }).__seen = seen;
    document.addEventListener('focusin', (e) => {
      const el = e.target as HTMLElement;
      if (el.getAttribute('role') === 'treeitem') seen.push(window.__fw.pathOf(Number(el.dataset['index'])) ?? '');
    }, true);
  });
  await page.getByRole('button', { name: 'Start over' }).focus();
  await page.keyboard.press('Enter');
  await idle(page);
  expect(await page.evaluate(() => (window as unknown as { __seen: string[] }).__seen)).toEqual([await coreAtThree(page)]);
});

test("a spin stopped by a tap off the wheel leaves the word at 3 o'clock tabbable", async ({ page }) => {
  await open(page);
  // An arc around the wheel's center through its core ring, then a point off the wheel that the canvas gets.
  const geo = await page.evaluate(() => {
    const fw = window.__fw;
    const rect = document.getElementById('wheel')!.getBoundingClientRect();
    const cam = fw.camera();
    const c = { x: rect.left + cam.cx, y: rect.top + cam.cy };
    const p = fw.segmentScreenPoint(fw.coreAtThree());
    const d = Math.hypot(p.x - c.x, p.y - c.y);
    const outside = fw.viewport().radius * cam.scale + 24;
    let off: { x: number; y: number } | null = null;
    for (let k = 0; k < 16 && !off; k++) {
      const a = (k / 16) * 2 * Math.PI;
      const q = { x: c.x + outside * Math.cos(a), y: c.y + outside * Math.sin(a) };
      if (document.elementFromPoint(q.x, q.y)?.id === 'wheel') off = q;
    }
    return { c, d, off };
  });
  expect(geo.off).not.toBeNull();
  const at = (deg: number) => ({ x: geo.c.x + geo.d * Math.cos((deg * Math.PI) / 180), y: geo.c.y + geo.d * Math.sin((deg * Math.PI) / 180) });
  // Whether the wheel was still spinning as the tap came, recorded as it lands, before the app handles it.
  await page.evaluate(() => {
    document.addEventListener('pointerup', () => { (window as unknown as { __spunAtTap: boolean }).__spunAtTap = window.__fw.moving(); }, true);
  });
  const tabbablePath = () => tabbableWord(page).evaluate((el) => window.__fw.pathOf(Number(el.dataset['index'])));
  // A busy machine can let the fling settle before the tap arrives; a settle would catch the tree up by itself, so
  // retry until the tap really stops a spin.
  let caught = false;
  let before = '';
  for (let attempt = 0; attempt < 5 && !caught; attempt++) {
    // Past the double-tap window, so this tap isn't a double tap with the last attempt's.
    if (attempt > 0) await page.waitForTimeout(320);
    await idle(page);
    before = (await tabbablePath())!;
    const start = at(-80);
    await page.mouse.move(start.x, start.y);
    await page.mouse.down();
    for (const deg of [-50, -20, 10, 40, 70]) await page.mouse.move(at(deg).x, at(deg).y);
    await page.mouse.up();
    await page.mouse.click(geo.off!.x, geo.off!.y);
    caught = await page.evaluate(() => (window as unknown as { __spunAtTap: boolean }).__spunAtTap);
  }
  expect(caught).toBe(true);
  expect(await page.evaluate(() => window.__fw.moving())).toBe(false);
  expect((await state(page)).selected).toBeNull();
  const now = await coreAtThree(page);
  expect(now).not.toBe(before);
  // The mouse put focus in the tree; it follows the tabbable word, which is the one at 3 o'clock.
  await expect(tabbableWord(page)).toHaveCount(1);
  expect(await tabbablePath()).toBe(now);
  expect(await focusedPath(page)).toBe(now);
});

const ringShown = async (page: Page) => {
  await page.evaluate(() => new Promise<void>((done) => requestAnimationFrame(() => requestAnimationFrame(() => done()))));
  return page.evaluate(() => window.__fw.focusRing());
};

test('the ring shows when Tab reaches the wheel, and goes when a word is selected', async ({ page }) => {
  await open(page);
  expect(await ringShown(page)).toBe(false);
  await page.keyboard.press('Tab');
  await tabbableWord(page).focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  expect(await focused(page)).toBe('LI');
  expect(await ringShown(page)).toBe(true);
  await page.keyboard.press('ArrowDown');
  await idle(page);
  expect(await selectedPath(page)).not.toBeNull();
  expect(await ringShown(page)).toBe(false);
});

test('a click or tap on the wheel brings focus without a ring', async ({ page }) => {
  await open(page);
  // An empty spot of the canvas, off the wheel's cells, so the click selects nothing.
  const off = await page.evaluate(() => {
    const rect = document.getElementById('wheel')!.getBoundingClientRect();
    const cam = window.__fw.camera();
    const r = window.__fw.viewport().radius * cam.scale + 24;
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * 2 * Math.PI;
      const q = { x: rect.left + cam.cx + r * Math.cos(a), y: rect.top + cam.cy + r * Math.sin(a) };
      if (document.elementFromPoint(q.x, q.y)?.id === 'wheel') return q;
    }
    return null;
  });
  expect(off).not.toBeNull();
  await page.mouse.click(off!.x, off!.y);
  await idle(page);
  expect((await state(page)).selected).toBeNull();
  expect(await focused(page)).toBe('LI');
  expect(await page.evaluate(() => document.activeElement!.hasAttribute('data-quiet-focus'))).toBe(true);
  expect(await ringShown(page)).toBe(false);
  // A key that selects nothing clears the quiet mark, and the ring appears.
  await page.keyboard.press('Shift');
  expect((await state(page)).selected).toBeNull();
  expect(await ringShown(page)).toBe(true);
});

test('tap a word, then Escape: the ring shows', async ({ page }) => {
  await open(page);
  await tapPath(page, 'angry');
  expect(await ringShown(page)).toBe(false);
  await page.keyboard.press('Escape');
  await idle(page);
  expect((await state(page)).selected).toBeNull();
  expect(await ringShown(page)).toBe(true);
});

test('the ring goes when focus leaves the wheel', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit skips links on Tab');
  await open(page);
  await tabbableWord(page).focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  expect(await ringShown(page)).toBe(true);
  await page.keyboard.press('Tab');
  expect(await focusedPath(page)).toBeNull();
  expect(await ringShown(page)).toBe(false);
});

test('the instruction names what works on the device', async ({ page }, info) => {
  await open(page);
  const phone = info.project.name === 'pixel' || info.project.name === 'iphone';
  expect(await page.evaluate(() => matchMedia('(pointer: coarse)').matches)).toBe(phone);
  await expect(hint(page).locator('.fw-hint-text')).toHaveText(phone
    ? 'Tap, spin, or zoom to explore, or start from body sensations instead.'
    : 'Click, spin, zoom, or use the arrow keys to explore, or start from body sensations instead.');
});
