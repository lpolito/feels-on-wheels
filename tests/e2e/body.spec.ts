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
    await expect(headings(page)).toHaveText(['Could be']);
    expect(await rowsText(page)).toEqual(['Scared ›', 'Mad ›', 'Excited ›']);

    await tapPath(page, 'chest/racing-heart/scared');
    await expect(title(page)).toHaveText('Scared');
    await expect(page.locator('fw-card .fw-definition')).not.toBeEmpty();
    await expect(headings(page)).toHaveText(['You might notice', 'Could also be']);
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
