import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { expectTitle, idle, open, prompt, tapPath } from './helpers';

const narrow = (isMobile: boolean | undefined) => Boolean(isMobile);

test('tap Angry lights the Angry subtree and offers 8 ways to narrow it down', async ({ page }) => {
  await open(page, '#/core');
  await tapPath(page, 'angry');
  await expectTitle(page, 'Angry');
  await expect(page.locator('fw-panel h3', { hasText: 'Narrow it down' })).toBeVisible();
  await expect(page.locator('fw-panel .fw-options').first().locator('button')).toHaveCount(8);
});

test('narrow down via the panel to Hostile, then a chip steps back to Aggressive', async ({ page }) => {
  await open(page, '#/core');
  await tapPath(page, 'angry');
  await page.locator('fw-panel button', { hasText: 'Aggressive' }).click();
  await expectTitle(page, 'Aggressive');
  await page.locator('fw-panel .fw-options button', { hasText: 'Hostile' }).click();
  await expectTitle(page, 'Hostile');
  await expect(page.locator('fw-panel h3', { hasText: 'Close to' })).toBeVisible();
  await page.locator('.fw-chip:visible', { hasText: 'Aggressive' }).click();
  await expectTitle(page, 'Aggressive');
});

test('selection clears via ✕, Escape, tapping outside and tapping it again', async ({ page }) => {
  await open(page, '#/core');
  for (const how of ['close', 'escape', 'outside', 'again'] as const) {
    await tapPath(page, 'sad');
    await expectTitle(page, 'Sad');
    if (how === 'close') await page.getByRole('button', { name: 'Clear selection' }).click();
    if (how === 'escape') await page.keyboard.press('Escape');
    if (how === 'outside') {
      const box = (await page.locator('#wheel').boundingBox())!;
      await page.mouse.click(box.x + 3, box.y + 3);
    }
    if (how === 'again') await tapPath(page, 'sad');
    await expect(prompt(page), how).toBeVisible();
  }
});

test('phone first load starts zoomed on the core ring with nothing selected', async ({ page, isMobile }) => {
  test.skip(!narrow(isMobile), 'phone-only behaviour');
  await open(page);
  const s = await page.evaluate(() => window.__fw.state());
  expect(s.view).toEqual({ mode: 'ring', ring: 0 });
  expect(s.selected).toBeNull();
  await expect(prompt(page)).toBeVisible();
});

test('keyboard only: Tab into the tree, arrows, Enter selects a middle word', async ({ page, isMobile }) => {
  test.skip(narrow(isMobile), 'desktop keyboard flow');
  await open(page, '#/core');
  await page.keyboard.press('Tab');
  await expect(page.locator('[role="treeitem"]:focus')).toHaveAttribute('aria-label', 'Fearful');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  await expectTitle(page, 'Disapproving');
  await expect(page.locator('[role="treeitem"][aria-selected="true"]')).toHaveAttribute('aria-label', 'Disapproving');
});

test('Back and Forward restore the selection', async ({ page }) => {
  await open(page, '#/core');
  await tapPath(page, 'angry');
  await tapPath(page, 'sad');
  await expectTitle(page, 'Sad');
  await page.goBack();
  await expectTitle(page, 'Angry');
  await page.goForward();
  await expectTitle(page, 'Sad');
});

test('resize while zoomed keeps the centered segment flat', async ({ page }) => {
  await open(page, '#/core/angry/aggressive/hostile?ring=2');
  expect(await page.evaluate(() => window.__fw.offCenter('angry/aggressive/hostile'))).toBeLessThan(1e-6);
  const size = page.viewportSize()!;
  await page.setViewportSize({ width: Math.round(size.width * 0.7), height: size.height + 100 });
  await page.waitForTimeout(200);
  await idle(page);
  expect(await page.evaluate(() => window.__fw.offCenter('angry/aggressive/hostile'))).toBeLessThan(1e-6);
});

test('tapping while the wheel spins stops it and selects what is under the finger', async ({ page }) => {
  await open(page, '#/core?ring=2');
  const box = (await page.locator('#wheel').boundingBox())!;
  const centered = await page.evaluate(() => window.__fw.segmentScreenPoint(window.__fw.pathOf(window.__fw.state().focused)!));
  await page.mouse.move(centered.x, box.y + box.height * 0.3);
  await page.mouse.down();
  await page.mouse.move(centered.x, box.y + box.height * 0.5, { steps: 2 });
  await page.mouse.move(centered.x, box.y + box.height * 0.7, { steps: 2 });
  await page.mouse.up();
  expect(await page.evaluate(() => window.__fw.moving())).toBe(true);
  await page.mouse.click(centered.x, box.y + box.height * 0.4);
  await idle(page);
  const s = await page.evaluate(() => window.__fw.state());
  expect(s.selected).not.toBeNull();
  const path = await page.evaluate((i) => window.__fw.pathOf(i), s.selected);
  expect(await page.evaluate((p) => window.__fw.offCenter(p!), path)).toBeLessThan(1e-6);
});

test('wide overview: the card moves left when it would cover the selected segment', async ({ page, isMobile }) => {
  test.skip(narrow(isMobile), 'wide layout only');
  await open(page, '#/core/disgusted/disapproving/judgmental');
  await expect(page.locator('#app')).toHaveAttribute('data-panel-side', 'left');
  await open(page, '#/core/bad/tired/sleepy');
  await expect(page.locator('#app')).not.toHaveAttribute('data-panel-side', 'left');
});

test('reduced motion: no intro animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.waitForFunction(() => window.__fw !== undefined);
  expect(await page.evaluate(() => window.__fw.moving())).toBe(false);
});

test('axe: no accessibility violations in overview and zoomed views', async ({ page }) => {
  await open(page, '#/core/angry');
  const overview = await new AxeBuilder({ page }).analyze();
  expect(overview.violations).toEqual([]);
  await open(page, '#/core/angry/aggressive/hostile?ring=2');
  const zoomed = await new AxeBuilder({ page }).analyze();
  expect(zoomed.violations).toEqual([]);
});
