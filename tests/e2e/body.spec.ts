import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { hint, idle, open, selectedPath, settled, state, tapPath, title } from './helpers';

const AREAS = /^(head|face|chest|breath|stomach|arms|whole-body|posture)$/;
const wheelId = (page: Page) => page.evaluate(() => window.__fw.wheel());
const switchButton = (page: Page, label: string) => page.locator('fw-wheel-switch button', { hasText: label });
const hintLink = (page: Page) => page.locator('fw-hint .fw-hint-link');

test.describe('switching wheels (desktop)', () => {
  test.beforeEach(({ isMobile }) => test.skip(Boolean(isMobile), 'desktop flows'));

  test('switch to Body: nothing selected, body message, URL #/body, focus stays on the Body button', async ({ page }) => {
    await open(page);
    // From the keyboard: Safari doesn't focus a button on click, so focus is only there to keep when it was put there.
    await switchButton(page, 'Body').focus();
    await page.keyboard.press('Enter');
    await idle(page);
    expect(await wheelId(page)).toBe('body');
    expect((await state(page)).selected).toBeNull();
    expect(new URL(page.url()).hash).toBe('#/body');
    await expect(hint(page)).toHaveText('What do you notice in your body? Tap or spin to explore, or start from feelings instead.');
    await expect(switchButton(page, 'Body')).toBeFocused();
    await expect(switchButton(page, 'Body')).toHaveAttribute('aria-pressed', 'true');
    await expect(switchButton(page, 'Feelings')).toHaveAttribute('aria-pressed', 'false');
  });

  test('the message link switches to Body and back', async ({ page }) => {
    await open(page);
    await hintLink(page).click();
    await idle(page);
    expect(await wheelId(page)).toBe('body');
    await expect(hintLink(page)).toBeFocused();
    await expect(hintLink(page)).toHaveText('start from feelings instead');
    await hintLink(page).click();
    await idle(page);
    expect(await wheelId(page)).toBe('core');
    expect(new URL(page.url()).hash).toBe('');
  });

  test('Review Focus 1: Back and Forward across wheels', async ({ page }) => {
    await open(page, '#/body/chest/racing-heart');
    await switchButton(page, 'Feelings').click();
    await idle(page);
    expect(await wheelId(page)).toBe('core');
    await page.goBack();
    await idle(page);
    expect(await wheelId(page)).toBe('body');
    expect(await selectedPath(page)).toBe('chest/racing-heart');
    expect((await state(page)).opened).toBe(true);
    await page.goForward();
    await idle(page);
    expect(await wheelId(page)).toBe('core');
    expect((await state(page)).selected).toBeNull();
  });

  test('Review Focus 2: fling then switch: the body wheel stays unselected', async ({ page }) => {
    // Opened, so the fling is a ring spin whose settle would dispatch `settled` (final review #4).
    await open(page, '#/core/fearful/scared');
    const box = (await page.locator('#wheel').boundingBox())!;
    const x = box.x + box.width * 0.4;
    await page.mouse.move(x, box.y + box.height * 0.2);
    await page.mouse.down();
    await page.mouse.move(x, box.y + box.height * 0.8, { steps: 4 });
    await page.mouse.up();
    await switchButton(page, 'Body').click();
    await page.waitForTimeout(1500);
    await idle(page);
    expect(await wheelId(page)).toBe('body');
    expect((await state(page)).selected).toBeNull();
    expect(new URL(page.url()).hash).toBe('#/body');
  });

  test('final review #2: Back across wheels keeps keyboard focus in the tree', async ({ page }) => {
    await open(page, '#/body/chest/racing-heart');
    await switchButton(page, 'Feelings').click();
    await idle(page);
    await page.locator('#a11y-tree [role="treeitem"][tabindex="0"]').focus();
    await page.goBack();
    await idle(page);
    expect(await wheelId(page)).toBe('body');
    await expect(page.locator('#a11y-tree [role="treeitem"]:focus')).toHaveCount(1);
  });

  test('final review #3: a pinch just before a switch never reaches the new wheel', async ({ page, browserName }) => {
    test.skip(browserName === 'firefox', 'Firefox ctrl+wheel needs synthetic events (see wheel.spec)');
    await open(page, '#/body/chest/racing-heart');
    const box = (await page.locator('#wheel').boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    // A strong pinch out on the opened word, which ends (150 ms later) by stepping out to its parent.
    await page.keyboard.down('Control');
    for (let i = 0; i < 4; i++) await page.mouse.wheel(0, 200);
    await page.keyboard.up('Control');
    await switchButton(page, 'Feelings').click();
    // The old controller's ctrl-wheel timer ends its zoom 150 ms later.
    await page.waitForTimeout(400);
    await idle(page);
    expect(await wheelId(page)).toBe('core');
    expect((await state(page)).selected).toBeNull();
    await expect(page.locator('fw-card')).toBeHidden();
    expect(new URL(page.url()).hash).toBe('');
  });

  test('Review Focus 3: Tab from the switch reaches the tree; arrows move through areas', async ({ page }) => {
    await open(page);
    await switchButton(page, 'Body').click();
    await idle(page);
    await page.keyboard.press('Tab');
    await expect(page.locator('#a11y-tree [role="treeitem"]:focus')).toHaveCount(1);
    await page.keyboard.press('ArrowDown');
    await idle(page);
    expect(await selectedPath(page)).toMatch(AREAS);
  });

  test('Review Focus 4: theme toggled on the body wheel', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(e.message));
    await open(page, '#/body');
    expect(await wheelId(page)).toBe('body');
    const before = (await page.evaluate(() => window.__fw.drawTimes())).length;
    for (let i = 0; i < 3; i++) await page.locator('.fw-theme-toggle').click();
    await page.waitForTimeout(200);
    expect((await page.evaluate(() => window.__fw.drawTimes())).length).toBeGreaterThan(before);
    expect(errors).toEqual([]);
  });

  for (const bad of ['#/body/nowhere', '#/nowhere']) {
    test(`Review Focus 5: ${bad} loads the feelings wheel's start view`, async ({ page }) => {
      await open(page, bad);
      expect(await wheelId(page)).toBe('core');
      expect((await state(page)).selected).toBeNull();
      await expect(hint(page)).toContainText('How are you feeling?');
    });
  }
});

test.describe('body wheel cards (desktop)', () => {
  test.beforeEach(({ isMobile }) => test.skip(Boolean(isMobile), 'desktop flows'));
  const headings = (page: Page) => page.locator('fw-card .fw-card-body h3');
  const rowsText = (page: Page) => page.locator('fw-card ul.fw-rows button').allTextContents();

  test('Chest → Racing heart → Scared by taps shows the cards in spec §6.2', async ({ page }) => {
    await open(page, '#/body');
    await tapPath(page, 'chest');
    await tapPath(page, 'chest');
    await expect(title(page)).toHaveText('Chest');
    await expect(headings(page)).toHaveText(['Narrow it down']);
    expect(await rowsText(page)).toEqual(['Racing heart ›', 'Tight chest ›', 'Hollow feeling in your chest ›', 'Warmth in your chest ›']);

    await tapPath(page, 'chest/racing-heart');
    await expect(title(page)).toHaveText('Racing heart');
    await expect(headings(page)).toHaveText(['Could be feeling']);
    expect(await rowsText(page)).toEqual(['Scared ›', 'Mad ›', 'Excited ›']);

    await tapPath(page, 'chest/racing-heart/scared');
    await expect(title(page)).toHaveText('Scared');
    await expect(page.locator('fw-card .fw-definition')).not.toBeEmpty();
    await expect(headings(page)).toHaveText(['You might notice', 'Could also be feeling']);
    await expect(page.locator('fw-card .fw-close-to button')).toHaveText(['Mad', 'Excited']);
    await expect(page.locator('fw-card .fw-jump')).toHaveText('See Scared on the feelings wheel ›');
    await expect(page.locator('fw-card nav.fw-crumbs button')).toHaveText(['Chest', 'Racing heart']);
  });

  test('the jump link opens Fearful › Scared on the feelings wheel; Back returns to the body wheel', async ({ page }) => {
    await open(page, '#/body/chest/racing-heart/scared');
    // From the keyboard, so focus is on the link in every browser (Safari doesn't focus buttons on click).
    await page.locator('fw-card .fw-jump').focus();
    await page.keyboard.press('Enter');
    await idle(page);
    expect(await wheelId(page)).toBe('core');
    expect(await selectedPath(page)).toBe('fearful/scared');
    expect((await state(page)).opened).toBe(true);
    expect(new URL(page.url()).hash).toBe('#/core/fearful/scared');
    await expect(page.locator('fw-card .fw-card-toggle')).toBeFocused();
    await page.goBack();
    await idle(page);
    expect(await wheelId(page)).toBe('body');
    expect(await selectedPath(page)).toBe('chest/racing-heart/scared');
  });
});

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`axe on the body wheel (${colorScheme})`, () => {
    test.describe.configure({ timeout: 60_000 });

    test(`axe: body wheel with nothing selected, an area selected, Scared opened (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await open(page, '#/body/chest/racing-heart/scared');
      await settled(page);
      expect((await new AxeBuilder({ page }).analyze()).violations, 'opened').toEqual([]);
      await page.keyboard.press('Escape');
      await idle(page);
      await page.keyboard.press('Escape');
      await expect(page.locator('fw-card')).toBeHidden();
      await settled(page);
      expect((await new AxeBuilder({ page }).analyze()).violations, 'nothing').toEqual([]);
      await tapPath(page, 'chest');
      await expect(title(page)).toHaveText('Chest');
      await settled(page);
      expect((await new AxeBuilder({ page }).analyze()).violations, 'area selected').toEqual([]);
    });
  });
}

test.describe('narrow phones (360 px)', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('the switch never overlaps Start over or the theme toggle', async ({ page }) => {
    await open(page, '#/body/chest');
    const sw = (await page.locator('fw-wheel-switch').boundingBox())!;
    const startOver = page.locator('fw-toolbar .fw-start-over');
    await expect(startOver).toBeVisible();
    const tb = (await startOver.boundingBox())!;
    expect(sw.x + sw.width).toBeLessThanOrEqual(tb.x);
    await expect(startOver).toHaveAccessibleName('Start over');
  });
});

test.describe('v2.1: the wheel switch', () => {
  test.beforeEach(({ isMobile }) => test.skip(Boolean(isMobile), 'desktop flows'));

  const thumb = (page: Page) => page.locator('fw-wheel-switch .fw-switch-thumb');
  async function expectUnder(page: Page, label: string): Promise<void> {
    const t = (await thumb(page).boundingBox())!;
    const b = (await switchButton(page, label).boundingBox())!;
    expect(Math.abs(t.x - b.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(t.width - b.width)).toBeLessThanOrEqual(1);
  }

  test('the switch highlight slides under the pressed button', async ({ page }) => {
    await open(page);
    await expectUnder(page, 'Feelings');
    await switchButton(page, 'Body').click();
    await idle(page);
    await settled(page);
    await expectUnder(page, 'Body');
  });

  test('quick presses end under the last pressed button', async ({ page }) => {
    await open(page);
    await switchButton(page, 'Body').click();
    await switchButton(page, 'Feelings').click();
    await idle(page);
    await settled(page);
    expect(await wheelId(page)).toBe('core');
    await expectUnder(page, 'Feelings');
  });

  test('no slide with reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page);
    await switchButton(page, 'Body').click();
    expect(await thumb(page).evaluate((el) => el.getAnimations().length)).toBe(0);
    await expectUnder(page, 'Body');
  });

  test('forced colours: the pressed option stands out', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'forced-colors emulation is Chromium-only');
    await page.emulateMedia({ forcedColors: 'active' });
    await open(page);
    const bg = (sel: string) => page.locator(sel).evaluate((el) => getComputedStyle(el).backgroundColor);
    const color = (label: string) => switchButton(page, label).evaluate((el) => getComputedStyle(el).color);
    expect(await bg('fw-wheel-switch .fw-switch-thumb')).not.toBe(await bg('fw-wheel-switch'));
    expect(await color('Feelings')).not.toBe(await color('Body'));
  });

  test('three options fit at 320 px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await open(page);
    await tapPath(page, 'fearful');
    await expect(page.locator('fw-toolbar .fw-start-over')).toBeVisible();
    await page.evaluate(() => {
      const sw = document.querySelector('fw-wheel-switch') as HTMLElement & { wheels: unknown; current: string };
      sw.wheels = [{ id: 'core', label: 'Feelings' }, { id: 'body', label: 'Body' }, { id: 'emoji', label: '🙂', name: 'Emoji' }];
      sw.current = 'core';
    });
    const sw = (await page.locator('fw-wheel-switch').boundingBox())!;
    const tb = (await page.locator('fw-toolbar').boundingBox())!;
    expect(sw.x).toBeGreaterThanOrEqual(0);
    expect(sw.x + sw.width).toBeLessThanOrEqual(tb.x);
    expect(tb.x + tb.width).toBeLessThanOrEqual(320);
    for (const b of await page.locator('fw-wheel-switch button').all()) {
      expect((await b.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('v2.1: the message link', () => {
  test.beforeEach(({ isMobile }) => test.skip(Boolean(isMobile), 'desktop flows'));

  test('Enter on the message link switches in place', async ({ page }) => {
    await open(page);
    const before = await page.evaluate(() => history.length);
    await hintLink(page).focus();
    await page.keyboard.press('Enter');
    await idle(page);
    expect(await wheelId(page)).toBe('body');
    expect(new URL(page.url()).hash).toBe('#/body');
    expect(await page.evaluate(() => history.length)).toBe(before + 1);
  });

  test('the link wraps with the sentence', async ({ page }) => {
    await page.setViewportSize({ width: 851, height: 393 });
    await open(page);
    const { rects, stop } = await hintLink(page).evaluate((a) => {
      const rects = [...a.getClientRects()].map((r) => ({ top: r.top }));
      const after = a.nextSibling!;
      const range = document.createRange();
      range.selectNodeContents(after);
      return { rects, stop: range.getBoundingClientRect().top };
    });
    expect(rects.length).toBeGreaterThan(1);
    expect(Math.abs(stop - rects[rects.length - 1]!.top)).toBeLessThanOrEqual(2);
  });
});

test.describe('v2.1: context rings', () => {
  test.beforeEach(({ isMobile }) => test.skip(Boolean(isMobile), 'sets its own viewport'));
  test.use({ viewport: { width: 393, height: 851 } });

  test('portrait phone, Head and eyes opened: the outer ring has labels', async ({ page }) => {
    await open(page, '#/body/head');
    expect((await page.evaluate(() => window.__fw.labelsByRing()))[2]).toBeGreaterThan(0);
  });
});

test.describe('body wheel deep link (phone)', () => {
  test.beforeEach(({ isMobile }) => test.skip(!isMobile, 'phone layout'));

  test('deep link #/body/chest/racing-heart/scared opens it on load, above the card', async ({ page }) => {
    await open(page, '#/body/chest/racing-heart/scared');
    expect(await wheelId(page)).toBe('body');
    expect(await selectedPath(page)).toBe('chest/racing-heart/scared');
    await expect(title(page)).toHaveText('Scared');
    const p = await page.evaluate(() => window.__fw.segmentScreenPoint('chest/racing-heart/scared'));
    const card = (await page.locator('fw-card').boundingBox())!;
    expect(p.y).toBeLessThan(card.y);
  });
});
