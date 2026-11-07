import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { expectTitle, head, hint, idle, open, selectedPath, state, tapPath, title } from './helpers';

const TAU = Math.PI * 2;
const sameAngle = (a: number, b: number) => {
  const d = (((a - b) % TAU) + TAU) % TAU;
  return Math.min(d, TAU - d);
};
const wheelBox = (page: Page) => page.locator('#wheel').boundingBox();

test.describe('desktop', () => {
  test.beforeEach(({ isMobile }) => test.skip(Boolean(isMobile), 'desktop flows'));

  test('tap selects: outline state, card collapsed, URL unchanged, nothing faded', async ({ page }) => {
    await open(page);
    await tapPath(page, 'angry');
    await expectTitle(page, 'Angry');
    await expect(head(page)).toHaveAttribute('aria-expanded', 'false');
    expect(await page.evaluate(() => location.hash)).toBe('');
    expect((await state(page)).opened).toBe(false);
    await expect(page.locator('fw-card .fw-card-body')).toHaveCount(0);
  });

  test('tap again opens: URL hash, card expanded with 8 rows, Back returns to selected-not-opened', async ({ page }) => {
    await open(page);
    await tapPath(page, 'angry');
    await tapPath(page, 'angry');
    await expect(head(page)).toHaveAttribute('aria-expanded', 'true');
    expect(await page.evaluate(() => location.hash)).toBe('#/core/angry');
    await expect(page.locator('fw-card ul.fw-rows button')).toHaveCount(8);
    await page.goBack();
    await idle(page);
    expect(await page.evaluate(() => location.hash)).toBe('');
    expect(await state(page)).toMatchObject({ opened: false, view: { mode: 'wheel' } });
    expect(await selectedPath(page)).toBe('angry');
  });

  test('narrow-it-down row opens Aggressive with an Angry crumb; crumb reopens Angry', async ({ page }) => {
    await open(page, '#/core/angry');
    await page.locator('fw-card ul.fw-rows button', { hasText: 'Aggressive' }).click();
    await expectTitle(page, 'Aggressive');
    const crumb = page.locator('fw-card .fw-crumbs button', { hasText: 'Angry' });
    await expect(crumb).toBeVisible();
    await crumb.click();
    await expectTitle(page, 'Angry');
    expect(await page.evaluate(() => location.hash)).toBe('#/core/angry');
  });

  test('Escape closes then clears', async ({ page }) => {
    await open(page, '#/core/sad');
    await page.keyboard.press('Escape');
    await idle(page);
    expect(await state(page)).toMatchObject({ opened: false, view: { mode: 'wheel' } });
    await expectTitle(page, 'Sad');
    await page.keyboard.press('Escape');
    expect((await state(page)).selected).toBeNull();
    await expect(page.locator('fw-card')).toBeHidden();
  });

  test('close restores the pre-open rotation', async ({ page }) => {
    await open(page);
    const before = (await page.evaluate(() => window.__fw.camera())).rotation;
    await tapPath(page, 'sad');
    await tapPath(page, 'sad');
    expect((await state(page)).opened).toBe(true);
    await page.getByRole('button', { name: 'Whole wheel' }).click();
    await idle(page);
    const after = await page.evaluate(() => window.__fw.camera());
    expect(after.scale).toBe(1);
    expect(sameAngle(after.rotation, before)).toBeLessThan(1e-6);
    expect(await selectedPath(page)).toBe('sad');
  });

  test('ctrl+wheel over Sad on the whole wheel opens Sad', async ({ page }) => {
    await open(page);
    const p = await page.evaluate(() => window.__fw.segmentScreenPoint('sad'));
    // One burst in one task, like a trackpad pinch: Playwright's Firefox delays its first wheel event past the
    // 150ms idle that ends a ctrl-wheel gesture, which would split it in two.
    await page.evaluate(({ x, y }) => {
      const wheel = document.getElementById('wheel')!;
      for (let k = 0; k < 6; k++) {
        wheel.dispatchEvent(new WheelEvent('wheel', { deltaY: -40, ctrlKey: true, clientX: x, clientY: y, bubbles: true, cancelable: true }));
      }
    }, p);
    await page.waitForTimeout(250);
    await idle(page);
    expect((await state(page)).opened).toBe(true);
    expect(await selectedPath(page)).toBe('sad');
  });

  test('arrow keys work after one click on the wheel', async ({ page }) => {
    await open(page);
    await tapPath(page, 'angry');
    await page.keyboard.press('ArrowDown');
    expect(await selectedPath(page)).toBe('disgusted');
    await expect(page.locator('[role="treeitem"][aria-selected="true"]')).toHaveAttribute('aria-label', 'Disgusted');
  });

  test('the card never moves the wheel', async ({ page }) => {
    await open(page);
    const none = await wheelBox(page);
    await tapPath(page, 'happy');
    const selected = await wheelBox(page);
    await tapPath(page, 'happy');
    const opened = await wheelBox(page);
    expect(selected).toEqual(none);
    expect(opened).toEqual(none);
  });

  test('resize while opened keeps the opened word flat', async ({ page }) => {
    await open(page, '#/core/angry/aggressive/hostile');
    expect(await page.evaluate(() => window.__fw.offCenter('angry/aggressive/hostile'))).toBeLessThan(1e-6);
    const size = page.viewportSize()!;
    await page.setViewportSize({ width: Math.round(size.width * 0.8), height: size.height + 100 });
    await page.waitForTimeout(200);
    await idle(page);
    expect(await page.evaluate(() => window.__fw.offCenter('angry/aggressive/hostile'))).toBeLessThan(1e-6);
  });
});

test.describe('phone', () => {
  test.beforeEach(({ isMobile }) => test.skip(!isMobile, 'phone-only behaviour'));

  test('phone: base URL spins to a random core word, selected, URL empty, hint "Spin to explore."', async ({ page }) => {
    await open(page);
    const s = await state(page);
    expect(s.view).toEqual({ mode: 'ring', ring: 0 });
    expect(s.opened).toBe(false);
    expect(s.selected).not.toBeNull();
    expect(s.selected).toBe((await page.evaluate(() => window.__fw.startState())).selected);
    expect(await page.evaluate(() => location.hash)).toBe('');
    await expect(hint(page)).toBeVisible();
    await expect(hint(page)).toHaveText('Spin to explore.');
    const path = (await selectedPath(page))!;
    expect(await page.evaluate((p) => window.__fw.offCenter(p), path)).toBeLessThan(1e-6);
  });

  test('phone: first drag hides the hint and keeps the URL', async ({ page }) => {
    await open(page);
    const box = (await wheelBox(page))!;
    const x = box.x + box.width * 0.7;
    await page.mouse.move(x, box.y + box.height * 0.2);
    await page.mouse.down();
    await page.mouse.move(x, box.y + box.height * 0.3, { steps: 4 });
    await page.mouse.move(x, box.y + box.height * 0.4, { steps: 4 });
    await page.mouse.up();
    await idle(page);
    await expect(hint(page)).toBeHidden();
    expect(await page.evaluate(() => location.hash)).toBe('');
    expect((await state(page)).opened).toBe(false);
  });

  test('phone: opened word sits above the card', async ({ page }) => {
    await open(page);
    const path = (await selectedPath(page))!;
    await tapPath(page, path);
    expect((await state(page)).opened).toBe(true);
    await expect(page.locator('fw-card .fw-card-body')).toBeVisible();
    const p = await page.evaluate((x) => window.__fw.segmentScreenPoint(x), path);
    const card = (await page.locator('fw-card').boundingBox())!;
    expect(p.y).toBeLessThan(card.y);
  });

  test('phone: Back to the base restores the same start word', async ({ page }) => {
    await open(page);
    const start = await page.evaluate(() => window.__fw.startState());
    const path = (await selectedPath(page))!;
    await tapPath(page, path);
    expect(await page.evaluate(() => location.hash)).toBe(`#/core/${path}`);
    await page.goBack();
    await idle(page);
    const s = await state(page);
    expect(s.selected).toBe(start.selected);
    expect(s.view).toEqual({ mode: 'ring', ring: 0 });
    expect(s.opened).toBe(false);
  });

  test('reduced motion: no intro spin on a phone', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForFunction(() => window.__fw !== undefined);
    expect(await page.evaluate(() => window.__fw.moving())).toBe(false);
    expect((await state(page)).view).toEqual({ mode: 'ring', ring: 0 });
  });
});

test('axe: no violations with nothing selected, selected, opened', async ({ page }) => {
  await open(page, '#/core/angry/aggressive/hostile');
  expect((await new AxeBuilder({ page }).analyze()).violations, 'opened').toEqual([]);
  await page.keyboard.press('Escape');
  await idle(page);
  await expect(title(page)).toHaveText('Hostile');
  expect((await new AxeBuilder({ page }).analyze()).violations, 'selected').toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.locator('fw-card')).toBeHidden();
  expect((await new AxeBuilder({ page }).analyze()).violations, 'nothing').toEqual([]);
});

test('resizing never paints a cleared (black) canvas frame', async ({ page }) => {
  await open(page);
  const corner = await page.evaluate(async () => {
    const stage = document.getElementById('stage')!;
    stage.style.right = '37px';
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => setTimeout(r, 0));
    const c = document.querySelector('canvas')!;
    const px = c.getContext('2d')!.getImageData(2, 2, 1, 1).data;
    return [px[0], px[1], px[2]];
  });
  expect(corner).not.toEqual([0, 0, 0]);
});
