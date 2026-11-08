import { expect, test, type Page } from '@playwright/test';
import { hint, idle, open, selectedPath, state, title } from './helpers';

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
    await open(page);
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
