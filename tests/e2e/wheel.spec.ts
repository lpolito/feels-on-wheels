import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { expectTitle, head, hint, idle, open, selectedPath, settled, state, tapPath, title } from './helpers';

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

  test('arrowing through opened words keeps one history entry: one Back returns to the whole wheel', async ({ page }) => {
    await open(page);
    await tapPath(page, 'angry');
    await tapPath(page, 'angry');
    const entries = await page.evaluate(() => history.length);
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('ArrowDown');
      // Past the 250ms burst window, so each press would have pushed before.
      await page.waitForTimeout(300);
    }
    await idle(page);
    const hash = await page.evaluate(() => location.hash);
    expect(hash).not.toBe('#/core/angry');
    expect(await page.evaluate(() => history.length)).toBe(entries);
    await page.goBack();
    await idle(page);
    expect(await page.evaluate(() => location.hash)).toBe('');
    expect(await state(page)).toMatchObject({ opened: false, view: { mode: 'wheel' } });
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

  test('close keeps the rotation', async ({ page }) => {
    await open(page);
    const p = await page.evaluate(() => window.__fw.segmentScreenPoint('sad'));
    await page.mouse.dblclick(p.x, p.y);
    await idle(page);
    expect((await state(page)).opened).toBe(true);
    const before = (await page.evaluate(() => window.__fw.camera())).rotation;
    // Close with the card's toggle: Start over would also clear the selection.
    await head(page).click();
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

  test('arrows work after a Close-to link', async ({ page }) => {
    await open(page, '#/core/angry/aggressive/hostile');
    await page.locator('fw-card .fw-close-to button', { hasText: 'Provoked' }).click();
    await idle(page);
    expect(await selectedPath(page)).toBe('angry/aggressive/provoked');
    await page.keyboard.press('ArrowDown');
    await idle(page);
    // Ring order: Provoked's next neighbour in the outer ring is Hostile.
    expect(await selectedPath(page)).toBe('angry/aggressive/hostile');
  });

  test('Enter on a focused row activates it, not the wheel', async ({ page }) => {
    await open(page, '#/core/angry');
    await page.locator('fw-card ul.fw-rows button').first().focus();
    await page.keyboard.press('Enter');
    await idle(page);
    expect(await page.evaluate(() => location.hash)).toBe('#/core/angry/let-down');
  });

  for (const key of ['Enter', ' '] as const) {
    const name = key === ' ' ? 'Space' : key;

    test(`${name} on a focused Start over clears the word and moves focus to the wheel`, async ({ page }) => {
      await open(page, '#/core/angry');
      await page.getByRole('button', { name: 'Start over' }).focus();
      await page.keyboard.press(key);
      await idle(page);
      expect(await state(page)).toEqual({ selected: null, opened: false, view: { mode: 'wheel' } });
      await expect(page.locator('[role="treeitem"][tabindex="0"]')).toBeFocused();
    });

    test(`${name} on a focused card row opens that row, not the wheel`, async ({ page }) => {
      await open(page, '#/core/angry');
      await page.locator('fw-card ul.fw-rows button', { hasText: 'Bitter' }).focus();
      await page.keyboard.press(key);
      await idle(page);
      expect(await page.evaluate(() => location.hash)).toBe('#/core/angry/bitter');
    });
  }

  test('Escape on a focused Start over closes, then clears and moves focus to the wheel', async ({ page }) => {
    await open(page, '#/core/angry');
    const startOver = page.getByRole('button', { name: 'Start over' });
    await startOver.focus();
    await page.keyboard.press('Escape');
    await idle(page);
    expect(await state(page)).toMatchObject({ selected: expect.any(Number), opened: false });
    await expect(startOver).toBeFocused();
    await page.keyboard.press('Escape');
    expect((await state(page)).selected).toBeNull();
    await expect(page.locator('[role="treeitem"][tabindex="0"]')).toBeFocused();
  });

  test('Start over from an opened word clears it, and Back returns to the word', async ({ page }) => {
    await open(page);
    await tapPath(page, 'angry');
    await tapPath(page, 'angry');
    await page.getByRole('button', { name: 'Start over' }).click();
    await idle(page);
    expect((await state(page)).selected).toBeNull();
    expect(await page.evaluate(() => location.hash)).toBe('');
    await expect(page.getByRole('button', { name: 'Start over' })).toBeHidden();
    await page.goBack();
    await idle(page);
    expect(await page.evaluate(() => location.hash)).toBe('#/core/angry');
    expect((await state(page)).opened).toBe(true);
  });


  test('+ and − work only with focus on the wheel, not from the page or a card button (WCAG 2.1.4)', async ({ page }) => {
    await open(page);
    await tapPath(page, 'angry');
    // A mouse click on the wheel puts focus in the tree, where + opens.
    await page.keyboard.press('+');
    await idle(page);
    expect((await state(page)).opened).toBe(true);
    await page.keyboard.press('-');
    await idle(page);
    expect((await state(page)).opened).toBe(false);
    // From a card button, the same keys do nothing.
    await head(page).focus();
    await page.keyboard.press('+');
    await page.keyboard.press('=');
    await idle(page);
    expect((await state(page)).opened).toBe(false);
  });

  test('the theme toggle cycles, labels its choice and keeps it after a reload', async ({ page }) => {
    await open(page);
    const toggle = page.locator('fw-toolbar .fw-theme-toggle');
    const label = page.locator('fw-toolbar .fw-theme-label');
    await expect(toggle).toHaveAttribute('aria-label', 'Theme: Match system');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-label', 'Theme: Light');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-label', 'Theme: Dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(label).toHaveText('Dark');
    await expect(label).toBeVisible();
    await page.mouse.move(2, 400); // away from the button, so hover doesn't keep it
    await expect(label).toBeHidden({ timeout: 2500 });
    await page.reload();
    await page.waitForFunction(() => window.__fw !== undefined);
    await expect(toggle).toHaveAttribute('aria-label', 'Theme: Dark');
    await tapPath(page, 'angry');
    await tapPath(page, 'angry');
    await page.keyboard.press('Escape');
    await idle(page);
    await expect(toggle).toHaveAttribute('aria-label', 'Theme: Dark');
  });


  test('the message comes back when the selection is cleared', async ({ page }) => {
    await open(page);
    await tapPath(page, 'angry');
    await expect(hint(page)).toBeHidden();
    await expect(page.locator('fw-card')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(hint(page)).toBeVisible();
    await expect(page.locator('fw-card')).toBeHidden();
  });

  test('the grab cursor shows only over the wheel', async ({ page }) => {
    await open(page);
    const cursor = () => page.evaluate(() => getComputedStyle(document.getElementById('wheel')!).cursor);
    const p = await page.evaluate(() => window.__fw.segmentScreenPoint('angry'));
    await page.mouse.move(p.x, p.y);
    await expect.poll(cursor).toBe('grab');
    const box = (await wheelBox(page))!;
    await page.mouse.move(box.x + 3, box.y + 3);
    await expect.poll(cursor).toBe('auto');
  });

  test('clicking empty space above the card closes, then clears', async ({ page }) => {
    await open(page, '#/core/angry');
    const card = (await page.locator('fw-card').boundingBox())!;
    const toolbar = (await page.locator('fw-toolbar').boundingBox())!;
    const x = card.x + card.width / 2;
    const y = toolbar.y + toolbar.height + 20;
    expect(y).toBeLessThan(card.y);
    await page.mouse.click(x, y);
    await idle(page);
    expect((await state(page)).opened).toBe(false);
    expect(await selectedPath(page)).toBe('angry');
    // v2.2 §3.1: the column is the wheel's canvas now, so a second click inside 300 ms would be a double tap.
    await page.waitForTimeout(320);
    await page.mouse.click(x, y);
    await idle(page);
    expect((await state(page)).selected).toBeNull();
  });

  test('a drag from the card, or from the wheel, released in empty space never dismisses', async ({ page }) => {
    await open(page, '#/core/angry');
    const def = (await page.locator('fw-card .fw-definition').boundingBox())!;
    const card = (await page.locator('fw-card').boundingBox())!;
    const toolbar = (await page.locator('fw-toolbar').boundingBox())!;
    const empty = { x: card.x + card.width / 2, y: toolbar.y + toolbar.height + 20 };
    // Drag-selecting the definition and overshooting the card.
    await page.mouse.move(def.x + 10, def.y + def.height / 2);
    await page.mouse.down();
    await page.mouse.move(empty.x, empty.y, { steps: 5 });
    await page.mouse.up();
    await idle(page);
    expect((await state(page)).opened).toBe(true);
    // A drag on the wheel released over the column. It's a swipe right, which opens the parent (on a core word it
    // would close, by design), so start on a middle word: whatever the swipe does, nothing may be dismissed.
    await open(page, '#/core/angry/aggressive');
    const p = await page.evaluate(() => window.__fw.segmentScreenPoint('angry/aggressive'));
    await page.mouse.move(p.x, p.y);
    await page.mouse.down();
    await page.mouse.move(empty.x, empty.y, { steps: 5 });
    await page.mouse.up();
    await idle(page);
    expect((await state(page)).opened).toBe(true);
  });

  test('a click on the theme label never dismisses', async ({ page }) => {
    await open(page, '#/core/angry');
    await page.locator('fw-toolbar .fw-theme-toggle').click();
    const label = page.locator('fw-toolbar .fw-theme-label');
    await expect(label).toBeVisible();
    const box = (await label.boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await idle(page);
    expect((await state(page)).opened).toBe(true);
  });

  test('clicks on the card, the message or the toolbar never dismiss', async ({ page }) => {
    await open(page, '#/core/angry');
    await page.locator('fw-card .fw-definition').click();
    await idle(page);
    expect((await state(page)).opened).toBe(true);
    await page.locator('fw-toolbar').click({ position: { x: 2, y: 2 } });
    expect((await state(page)).opened).toBe(true);
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await idle(page);
    expect(await state(page)).toEqual({ selected: null, opened: false, view: { mode: 'wheel' } });
    await page.locator('fw-hint').click();
    const box = (await page.locator('fw-hint').boundingBox())!;
    await page.mouse.click(box.x + box.width / 2, box.y - 40);
    await idle(page);
    expect(await state(page)).toEqual({ selected: null, opened: false, view: { mode: 'wheel' } });
  });

  test('the message sits where the card goes', async ({ page }) => {
    await open(page);
    const msg = (await hint(page).boundingBox())!;
    await tapPath(page, 'angry');
    await tapPath(page, 'angry');
    await settled(page);
    const card = (await page.locator('fw-card').boundingBox())!;
    expect(Math.abs(msg.x - card.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(msg.x + msg.width - (card.x + card.width))).toBeLessThanOrEqual(1);
  });

  test('the hint reads the same on desktop', async ({ page }) => {
    await open(page);
    expect((await state(page)).selected).toBeNull();
    await expect(hint(page).locator('.fw-hint-title')).toHaveText('How are you feeling?');
    await expect(hint(page).locator('.fw-hint-text')).toHaveText('Tap or spin to explore, or start from body sensations instead.');
  });

  test("desktop: opened view's wheel edge meets the column", async ({ page }) => {
    for (const path of ['angry', 'angry/aggressive', 'angry/aggressive/hostile']) {
      await open(page, `#/core/${path}`);
      const { cam, vp } = await page.evaluate(() => ({ cam: window.__fw.camera(), vp: window.__fw.viewport() }));
      // The opened cell's 10px lift and 2px of outline end exactly at the column.
      expect(Math.abs(cam.cx + vp.radius * cam.scale + 12 - vp.width), path).toBeLessThanOrEqual(1);
    }
  });

  test('desktop 1024×768: an opened core word is fully on screen', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    // The middle ring is where the 1rem safeguard takes over at this size.
    for (const [path, ring] of [['angry', [0.12, 0.32]], ['angry/aggressive', [0.32, 0.62]]] as const) {
      await open(page, `#/core/${path}`);
      const { p, cam, vp } = await page.evaluate((x) => ({
        p: window.__fw.segmentScreenPoint(x), cam: window.__fw.camera(), vp: window.__fw.viewport(),
      }), path);
      const band = (ring[1] - ring[0]) * vp.radius * cam.scale;
      // The cell's inner edge, less its 10px lift, is at least 1rem from the left.
      expect(p.x - band / 2 - 10, path).toBeGreaterThanOrEqual(15.5);
    }
  });

  test('square 900×900 window uses the phone layout and camera', async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 900 });
    await open(page, '#/core/angry');
    const card = (await page.locator('fw-card').boundingBox())!;
    expect(card.y + card.height).toBeGreaterThan(900 - 12 - 2);
    expect(card.x).toBeLessThan(20);
    const { y, mid } = await openedPlacement(page, 'angry');
    expect(Math.abs(y - mid)).toBeLessThanOrEqual(2);
    const p = await page.evaluate(() => window.__fw.segmentScreenPoint('angry'));
    expect(Math.abs(p.x - 450)).toBeLessThanOrEqual(2);
  });

  test('Escape on a focused row closes and leaves focus on the card toggle', async ({ page }) => {
    await open(page, '#/core/angry');
    await page.locator('fw-card ul.fw-rows button').first().focus();
    await page.keyboard.press('Escape');
    await idle(page);
    expect((await state(page)).opened).toBe(false);
    expect(await page.evaluate(() => document.activeElement?.className)).toBe('fw-card-toggle');
  });

  test('the dot, the first crumb and the body share one left edge', async ({ page }) => {
    await open(page, '#/core/angry/aggressive');
    await settled(page);
    const box = async (sel: string) => (await page.locator(sel).first().boundingBox())!;
    const dot = await box('fw-card .fw-card-toggle .fw-dot');
    const crumb = await box('fw-card nav.fw-crumbs button');
    const body = await box('fw-card .fw-definition');
    const title = await box('fw-card .fw-card-title');
    expect(Math.abs(crumb.x - dot.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(body.x - dot.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(title.x - (dot.x + dot.width) - 19.2)).toBeLessThanOrEqual(1);
  });

  test('folding an opened word leaves no space above its name', async ({ page }) => {
    await open(page, '#/core/angry/aggressive');
    await page.keyboard.press('Escape');
    await idle(page);
    await settled(page);
    const offset = () => page.evaluate(() => {
      const card = document.querySelector('fw-card')!;
      return card.querySelector('.fw-card-title')!.getBoundingClientRect().top - card.getBoundingClientRect().top;
    });
    const folded = await offset();
    expect(await page.locator('fw-card nav.fw-crumbs').count()).toBe(1);
    // A fresh card for the same word, never opened, has no crumbs at all.
    await page.reload();
    await page.waitForFunction(() => window.__fw !== undefined);
    await tapPath(page, 'angry/aggressive');
    await settled(page);
    expect(await page.locator('fw-card nav.fw-crumbs').count()).toBe(0);
    expect(Math.abs(folded - (await offset()))).toBeLessThanOrEqual(0.5);
  });

  test('the dot-and-name row sticks and the crumbs scroll away', async ({ page }) => {
    // Short enough that Aggressive's card (which has breadcrumbs) overflows.
    await page.setViewportSize({ width: 1280, height: 380 });
    await open(page, '#/core/angry/aggressive');
    await settled(page);
    const card = page.locator('fw-card');
    expect(await card.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
    await card.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    const c = (await card.boundingBox())!;
    const heading = (await page.locator('fw-card .fw-card-heading').boundingBox())!;
    const crumbs = (await page.locator('fw-card nav.fw-crumbs').boundingBox())!;
    expect(Math.abs(heading.y - c.y)).toBeLessThanOrEqual(1);
    expect(crumbs.y + crumbs.height).toBeLessThanOrEqual(c.y + 1);
  });

  test('a focused row is never under the sticky row', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 500 });
    await open(page, '#/core/angry');
    await settled(page);
    const card = page.locator('fw-card');
    await card.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    const rows = page.locator('fw-card ul.fw-rows button');
    // Walk focus up from the last row to the first, as Shift+Tab would.
    for (let k = (await rows.count()) - 1; k >= 0; k--) await rows.nth(k).focus();
    const first = (await rows.first().boundingBox())!;
    const heading = (await page.locator('fw-card .fw-card-heading').boundingBox())!;
    expect(first.y).toBeGreaterThanOrEqual(heading.y + heading.height - 1);
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

/** The opened word's y against the gap between the stage's top and the unfolded card's top (spec v1.3 §4.2). */
async function openedPlacement(page: Page, path: string) {
  await idle(page);
  await settled(page);
  const y = (await page.evaluate((p) => window.__fw.segmentScreenPoint(p), path)).y;
  const stage = (await wheelBox(page))!;
  const card = (await page.locator('fw-card').boundingBox())!;
  const half = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.getElementById('app')!).getPropertyValue('--opened-half')));
  return { y, mid: (stage.y + card.y) / 2, cardTop: card.y, half };
}

test.describe('phone', () => {
  test.beforeEach(({ isMobile }) => test.skip(!isMobile, 'phone-only behavior'));

  test('phone: base URL starts with nothing selected and the hint "How are you feeling? …"', async ({ page }) => {
    await open(page);
    const s = await state(page);
    expect(s.selected).toBeNull();
    expect(s.opened).toBe(false);
    expect(s.view.mode).toBe('wheel');
    expect(await page.evaluate(() => location.hash)).toBe('');
    await expect(hint(page)).toBeVisible();
    await expect(hint(page).locator('.fw-hint-title')).toHaveText('How are you feeling?');
    await expect(hint(page).locator('.fw-hint-text')).toHaveText('Tap or spin to explore, or start from body sensations instead.');
  });

  test("phone: the wheel's center is on the left edge", async ({ page }) => {
    await open(page);
    const cam = await page.evaluate(() => window.__fw.camera());
    expect(Math.abs(cam.cx)).toBeLessThanOrEqual(2);
    expect(await page.evaluate(() => window.__fw.offCenter('fearful'))).toBeLessThan(1e-6);
  });

  test('phone: deep link then Back lands on the half-wheel with the word selected and no intro', async ({ page }) => {
    // A base entry behind a fresh load of the deep link: as if someone opened a link to Angry, having been here before.
    await open(page);
    await page.evaluate(() => { location.hash = '#/core/angry'; });
    await page.reload();
    await page.waitForFunction(() => window.__fw !== undefined);
    await idle(page);
    expect((await state(page)).opened).toBe(true);
    await page.goBack();
    await idle(page);
    // Once the close has landed, nothing else (no intro) starts moving.
    for (let k = 0; k < 3; k++) {
      expect(await page.evaluate(() => window.__fw.moving())).toBe(false);
      await page.waitForTimeout(50);
    }
    expect(await page.evaluate(() => location.hash)).toBe('');
    expect(await selectedPath(page)).toBe('angry');
    expect((await state(page)).view).toEqual({ mode: 'wheel' });
    expect(Math.abs((await page.evaluate(() => window.__fw.camera())).cx)).toBeLessThanOrEqual(2);
  });

  test('phone: turned sideways with a word selected, the half-wheel becomes the side view (spec v2.1 §6.2)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await open(page);
    await tapPath(page, 'angry');
    const rot = (await page.evaluate(() => window.__fw.camera())).rotation;
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(200);
    await idle(page);
    const { cam, vp } = await page.evaluate(() => ({ cam: window.__fw.camera(), vp: window.__fw.viewport() }));
    // The side view: zoomed on the core ring, the wheel meeting the stage's right edge, the column beside it.
    expect(cam.scale).toBeGreaterThan(1.5);
    expect(cam.cx).toBeLessThan(vp.width / 2);
    expect(vp.width).toBeLessThan(667);
    expect(sameAngle(cam.rotation, rot)).toBeLessThan(1e-6);
    expect(await selectedPath(page)).toBe('angry');
    expect((await state(page)).opened).toBe(false);
  });

  test('phone: spinning keeps the message', async ({ page }) => {
    await open(page);
    const box = (await wheelBox(page))!;
    const x = box.x + box.width * 0.7;
    await page.mouse.move(x, box.y + box.height * 0.2);
    await page.mouse.down();
    await page.mouse.move(x, box.y + box.height * 0.3, { steps: 4 });
    await page.mouse.move(x, box.y + box.height * 0.4, { steps: 4 });
    await page.mouse.up();
    await idle(page);
    await expect(hint(page)).toBeVisible();
    expect(await page.evaluate(() => location.hash)).toBe('');
    expect((await state(page)).opened).toBe(false);
  });

  test('phone: the opened word is centered between the top and the unfolded card', async ({ page }) => {
    for (const path of ['fearful', 'fearful/scared', 'fearful/scared/helpless']) {
      await open(page, `#/core/${path}`);
      const { y, mid, cardTop, half } = await openedPlacement(page, path);
      expect(Math.abs(y - mid), path).toBeLessThanOrEqual(2);
      expect(half, path).toBeGreaterThan(20);
      expect(y + half, path).toBeLessThan(cardTop);
    }
  });

  test('phone: moving to a word with a different card height re-centers it', async ({ page }) => {
    // A middle word, then one of its outer words: their cards differ in height on every phone.
    await open(page, '#/core/fearful/scared');
    await settled(page);
    const before = (await page.locator('fw-card').boundingBox())!;
    await page.locator('fw-card ul.fw-rows button').first().click();
    const path = (await selectedPath(page))!;
    expect(path).toBe('fearful/scared/helpless');
    const { y, mid, cardTop } = await openedPlacement(page, path);
    expect(Math.abs(cardTop - before.y)).toBeGreaterThan(5);
    expect(Math.abs(y - mid)).toBeLessThanOrEqual(2);
  });

  test('phone: resize while opened keeps the word centered above the card', async ({ page }) => {
    await open(page, '#/core/fearful/scared');
    const size = page.viewportSize()!;
    await page.setViewportSize({ width: size.width, height: size.height + 100 });
    await page.waitForTimeout(200);
    const { y, mid } = await openedPlacement(page, 'fearful/scared');
    expect(Math.abs(y - mid)).toBeLessThanOrEqual(2);
  });

  test('phone: the theme label fades by itself after a tap', async ({ page }) => {
    await open(page);
    await page.locator('fw-toolbar .fw-theme-toggle').tap();
    const label = page.locator('fw-toolbar .fw-theme-label');
    await expect(label).toBeVisible();
    await expect(label).toBeHidden({ timeout: 3000 });
  });

  test("phone: after a spin, the word doesn't slide once the spin stops", async ({ page }) => {
    await open(page, '#/core/fearful/scared');
    await settled(page);
    // Record the camera on every frame from here on.
    await page.evaluate(() => {
      const rec: { cy: number; rotation: number }[] = [];
      (window as unknown as { __rec: typeof rec }).__rec = rec;
      const tick = () => {
        const c = window.__fw.camera();
        rec.push({ cy: c.cy, rotation: c.rotation });
        if (rec.length < 600) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    const p = await page.evaluate(() => window.__fw.segmentScreenPoint('fearful/scared'));
    await page.mouse.move(p.x, p.y);
    await page.mouse.down();
    await page.mouse.move(p.x, p.y + 60, { steps: 2 });
    await page.mouse.move(p.x, p.y + 160, { steps: 2 });
    await page.mouse.up();
    await idle(page);
    await settled(page);
    await page.waitForTimeout(300);
    expect(await selectedPath(page)).not.toBe('fearful/scared');
    const rec = await page.evaluate(() => (window as unknown as { __rec: { cy: number; rotation: number }[] }).__rec);
    const last = rec.at(-1)!;
    const TAU = Math.PI * 2;
    const off = (a: number) => { const d = (((a - last.rotation) % TAU) + TAU) % TAU; return Math.min(d, TAU - d); };
    // The frame where the rotation came to rest: from there on, cy must not travel.
    const restIdx = rec.findIndex((f, k) => k > 5 && rec.slice(k).every((g) => off(g.rotation) < 1e-3));
    expect(restIdx).toBeGreaterThan(0);
    expect(Math.abs(rec[restIdx]!.cy - last.cy)).toBeLessThanOrEqual(2);
    const path = (await selectedPath(page))!;
    const { y, mid } = await openedPlacement(page, path);
    expect(Math.abs(y - mid)).toBeLessThanOrEqual(2);
  });

  test('phone: on a short screen the opened cell still fits above the card', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 600 });
    await open(page, '#/core/fearful');
    const { y, cardTop, half } = await openedPlacement(page, 'fearful');
    expect(cardTop).toBeGreaterThanOrEqual(y + half + 12 - 1);
  });

  test('phone: Back from an opened word returns to the whole wheel with it selected', async ({ page }) => {
    await open(page);
    await tapPath(page, 'angry');
    await tapPath(page, 'angry');
    expect(await page.evaluate(() => location.hash)).toBe('#/core/angry');
    await page.goBack();
    await idle(page);
    const s = await state(page);
    expect(await selectedPath(page)).toBe('angry');
    expect(s.view).toEqual({ mode: 'wheel' });
    expect(s.opened).toBe(false);
  });

  test('reduced motion: no intro spin on a phone', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForFunction(() => window.__fw !== undefined);
    expect(await page.evaluate(() => window.__fw.moving())).toBe(false);
    expect((await state(page)).view).toEqual({ mode: 'wheel' });
  });
});

test('the message and the card never show together', async ({ page }) => {
  await open(page);
  await expect(hint(page)).toBeVisible();
  await expect(page.locator('fw-card')).toBeHidden();
  await tapPath(page, 'angry');
  await expect(hint(page)).toBeHidden();
  await expect(page.locator('fw-card')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(hint(page)).toBeVisible();
  await expect(page.locator('fw-card')).toBeHidden();
});

for (const colorScheme of ['light', 'dark'] as const) {
  // Axe is slow in Firefox, and these run several passes; under the full parallel suite 30 s isn't enough.
  test.describe(`axe (${colorScheme})`, () => {
    test.describe.configure({ timeout: 60_000 });

    test(`axe: no violations with nothing selected, selected, opened (${colorScheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await open(page, '#/core/angry/aggressive/hostile');
      // Let the unfold finish, so axe reads the settled colors.
      await settled(page);
      expect((await new AxeBuilder({ page }).analyze()).violations, 'opened').toEqual([]);
      await page.keyboard.press('Escape');
      await idle(page);
      await expect(title(page)).toHaveText('Hostile');
      await settled(page);
      expect((await new AxeBuilder({ page }).analyze()).violations, 'selected').toEqual([]);
      await page.keyboard.press('Escape');
      await expect(page.locator('fw-card')).toBeHidden();
      // The message fades in (150 ms); let it finish so axe reads its settled contrast.
      await settled(page);
      expect((await new AxeBuilder({ page }).analyze()).violations, 'nothing').toEqual([]);
    });

    test(`axe: no violations with the opened card scrolled (${colorScheme})`, async ({ page, isMobile }) => {
      await page.emulateMedia({ colorScheme });
      if (!isMobile) await page.setViewportSize({ width: 1280, height: 500 });
      await open(page, '#/core/angry');
      await settled(page);
      const card = page.locator('fw-card');
      expect(await card.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
      await card.evaluate((el) => { el.scrollTop = el.scrollHeight; });
      expect((await new AxeBuilder({ page }).analyze()).violations, 'opened and scrolled').toEqual([]);
    });
  });
}

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

test('a late stylesheet still gives the themed palette and the right start layout', async ({ page, isMobile }) => {
  // WebKit can run the module before the stylesheets apply when the machine is busy; force that order.
  await page.route('**/*.css', async (route) => {
    await new Promise((r) => setTimeout(r, 600));
    await route.continue();
  });
  await open(page);
  const corner = await page.evaluate(() => {
    const px = document.querySelector('canvas')!.getContext('2d')!.getImageData(2, 2, 1, 1).data;
    return [px[0], px[1], px[2]];
  });
  expect(corner).not.toEqual([0, 0, 0]);
  expect(await state(page)).toMatchObject({ selected: null, view: { mode: 'wheel' } });
  // Phones measure the stage once the styles apply, so they still get the half-wheel.
  const cx = (await page.evaluate(() => window.__fw.camera())).cx;
  if (isMobile) expect(Math.abs(cx)).toBeLessThanOrEqual(2);
  else expect(cx).toBeGreaterThan(100);
});

test.describe('v2.1: phones turned sideways', () => {
  test.beforeEach(({ isMobile }) => test.skip(Boolean(isMobile), 'sets its own viewport'));

  for (const [width, height] of [[851, 393], [667, 375]] as const) {
    for (const hash of ['', '#/body']) {
      test(`${width}×${height} ${hash || '#/'} at rest: the side view, labels on every ring, message beside the wheel`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await open(page, hash);
        expect((await state(page)).view.mode).toBe('wheel');
        expect((await page.evaluate(() => window.__fw.camera())).scale).toBeGreaterThan(1.5);
        for (const n of await page.evaluate(() => window.__fw.labelsByRing())) expect(n).toBeGreaterThan(0);
        // v2.2 §3.2: the wheel aims left of the column (the canvas itself now spans the app).
        const aim = (await page.evaluate(() => window.__fw.viewport())).width;
        const msg = (await hint(page).boundingBox())!;
        expect(msg.x).toBeGreaterThanOrEqual(aim - 1);
      });
    }
  }

  test('axe: sideways side view at rest and opened', async ({ page }) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 851, height: 393 });
    await open(page);
    await settled(page);
    expect((await new AxeBuilder({ page }).analyze()).violations, 'at rest').toEqual([]);
    await open(page, '#/body/head/headache');
    await settled(page);
    expect((await new AxeBuilder({ page }).analyze()).violations, 'opened').toEqual([]);
  });

  test('iPhone SE sideways, word opened: the card is in the column and the word is clear of the switch', async ({ page }) => {
    await page.setViewportSize({ width: 667, height: 375 });
    await open(page, '#/core/happy/content/joyful');
    const aim = (await page.evaluate(() => window.__fw.viewport())).width;
    const card = (await page.locator('fw-card').boundingBox())!;
    expect(card.x).toBeGreaterThanOrEqual(aim - 1);
    const p = await page.evaluate(() => window.__fw.segmentScreenPoint('happy/content/joyful'));
    const sw = (await page.locator('fw-wheel-switch').boundingBox())!;
    expect(p.y > sw.y + sw.height || p.x > sw.x + sw.width).toBe(true);
  });
});

test.describe('v2.1: the card', () => {
  test.beforeEach(({ isMobile }) => test.skip(Boolean(isMobile), 'desktop flows'));

  const dotAnimations = (page: Page) =>
    page.locator('fw-card .fw-dot').evaluate((el) =>
      el.getAnimations().map((a) => ({ name: (a as CSSAnimation).animationName, duration: a.effect?.getTiming().duration })));

  test('the opened dot glows, and is still with reduced motion', async ({ page }) => {
    await open(page, '#/core/happy');
    // Spec v2.2 §4.3: v1.2's halo, on a 2 s cycle.
    expect(await dotAnimations(page)).toEqual([{ name: 'fw-halo', duration: 2000 }]);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload();
    await page.waitForFunction(() => window.__fw !== undefined);
    expect(await dotAnimations(page)).toEqual([]);
  });
});

test.describe('v2.2: the wheel under the column', () => {
  test.beforeEach(({ isMobile }) => test.skip(Boolean(isMobile), 'sets its own viewport'));

  /**
   * Stands in for env(safe-area-inset-*), which Playwright can't set: the app's padding and the card's right margin, as
   * the stylesheet derives them. Put in <head> as soon as the parser makes it, before main.ts first measures.
   */
  const withInset = (page: Page, side: 'right' | 'left', px = 59) =>
    page.addInitScript(([s, n]) => {
      const style = document.createElement('style');
      style.textContent = s === 'right'
        ? `#app { padding-right: ${n}px !important } #float { right: max(1.5rem, ${n}px) !important }`
        : `#app { padding-left: ${n}px !important }`;
      const place = () => { if (document.head && !style.isConnected) document.head.append(style); };
      new MutationObserver(place).observe(document, { childList: true, subtree: true });
      place();
    }, [side, px] as const);

  const RING_OUTER = [0.32, 0.62, 1];
  /** The opened cell's right end at 3 o'clock: its outer edge, 10 px lift and 2 px of outline (spec v1.2 §4.1). */
  const opened = (page: Page) => page.evaluate(() => ({
    cam: window.__fw.camera(), vp: window.__fw.viewport(), ring: window.__fw.state().view.ring!,
  }));
  const box = async (page: Page, sel: string) => (await page.locator(sel).boundingBox())!;

  async function expectClearOfCard(page: Page, label: string): Promise<void> {
    const { cam, vp, ring } = await opened(page);
    const edge = cam.cx + RING_OUTER[ring]! * vp.radius * cam.scale + 12;
    const card = await box(page, 'fw-card');
    const app = await box(page, '#app');
    const rem = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize));
    expect(edge, `${label}: the opened word ends at the aim width`).toBeLessThanOrEqual(vp.width + 0.5);
    expect(vp.width + 1.5 * rem, `${label}: 1.5rem before the card`).toBeLessThanOrEqual(card.x + 1);
    expect(Math.abs((await box(page, '#stage')).width - app.width), `${label}: the stage is the whole app`).toBeLessThanOrEqual(1);
    expect(Math.abs(vp.drawWidth - app.width), `${label}: the canvas is the whole app`).toBeLessThanOrEqual(1);
  }

  for (const [w, h, inset] of [[852, 393, 'right'], [852, 393, null], [895, 470, null], [1280, 800, null]] as const) {
    test(`${w}×${h}${inset ? ` ${inset} inset` : ''}: the opened word ends 1.5rem before the card`, async ({ page }) => {
      if (inset) await withInset(page, inset);
      await page.setViewportSize({ width: w, height: h });
      for (const hash of ['#/core/happy/content/joyful', '#/core/happy/content', '#/body/head/wide-eyes']) {
        await open(page, hash);
        await settled(page);
        await expectClearOfCard(page, hash);
      }
    });
  }

  test('852×393 left inset: the aim width is unchanged', async ({ page, context }) => {
    await page.setViewportSize({ width: 852, height: 393 });
    await open(page, '#/core/happy/content/joyful');
    const plain = (await opened(page)).vp.width;
    const other = await context.newPage();
    await withInset(other, 'left');
    await other.setViewportSize({ width: 852, height: 393 });
    await open(other, '#/core/happy/content/joyful');
    expect((await opened(other)).vp.width).toBeCloseTo(plain, 3);
  });

  // v2.2.1: an iPhone sideways reports 59 px on both sides; the opened word clears the notch and the card.
  test('852×393, insets on both sides: the opened word starts 1rem after the left inset and ends before the card', async ({ page }) => {
    await withInset(page, 'left');
    await withInset(page, 'right');
    await page.setViewportSize({ width: 852, height: 393 });
    for (const hash of ['#/core/happy', '#/core/happy/content', '#/core/happy/content/joyful', '#/body/arms/sweaty-palms', '#/body/head/wide-eyes']) {
      await open(page, hash);
      await settled(page);
      const { cam, vp, ring } = await opened(page);
      const R = vp.radius * cam.scale;
      const inner = [0.12, 0.32, 0.62][ring]!;
      expect(cam.cx + inner * R - 10, `${hash}: clear of the notch`).toBeGreaterThanOrEqual(59 + 16 - 0.5);
      await expectClearOfCard(page, hash);
    }
  });

  test('852×393, the notch turning to the left after load: re-aims clear of it', async ({ page }) => {
    await page.setViewportSize({ width: 852, height: 393 });
    await open(page, '#/core/happy/content');
    await settled(page);
    await page.addStyleTag({ content: '#app { padding-left: 59px !important }' });
    await page.waitForTimeout(200);
    await idle(page);
    const { cam, vp } = await opened(page);
    expect(cam.cx + 0.32 * vp.radius * cam.scale - 10).toBeGreaterThanOrEqual(59 + 16 - 0.5);
  });

  test('resizing to sideways re-aims at the card', async ({ page }) => {
    await withInset(page, 'right');
    await page.setViewportSize({ width: 393, height: 852 });
    await open(page, '#/core/happy/content/joyful');
    await page.setViewportSize({ width: 852, height: 393 });
    await page.waitForTimeout(200);
    await idle(page);
    await settled(page);
    await expectClearOfCard(page, 'after resize');
  });

  // Final review #1: an inset or text-size change moves the card without resizing the stage.
  for (const [label, css] of [
    ['a right inset appearing (a phone turned 180°)', '#app { padding-right: 59px !important } #float { right: max(1.5rem, 59px) !important }'],
    ['a larger text size', 'html { font-size: 20px !important }'],
  ] as const) {
    test(`852×393, ${label} after load: re-aims at the card`, async ({ page }) => {
      await page.setViewportSize({ width: 852, height: 393 });
      await open(page, '#/core/happy/content/joyful');
      await settled(page);
      await page.addStyleTag({ content: css });
      await page.waitForTimeout(200);
      await idle(page);
      await settled(page);
      await expectClearOfCard(page, label);
    });
  }

  /** A point in the card's column on the outer ring, clear of the card and the toolbar. */
  async function columnPointOnWheel(page: Page): Promise<{ x: number; y: number }> {
    const { cam, vp } = await opened(page);
    const card = await box(page, 'fw-card');
    const toolbar = await box(page, 'fw-toolbar');
    const R = vp.radius * cam.scale;
    for (let y = toolbar.y + toolbar.height + 6; y < card.y - 6; y += 2) {
      for (let x = vp.width + 24; x < card.x + card.width; x += 2) {
        const r = Math.hypot(x - cam.cx, y - cam.cy) / R;
        if (r > 0.66 && r < 0.96) return { x, y };
      }
    }
    throw new Error('no point of the outer ring shows in the column');
  }

  test('a tap in the column on the wheel opens that word', async ({ page }) => {
    await page.setViewportSize({ width: 895, height: 470 });
    await open(page, '#/body/head/wide-eyes');
    await settled(page);
    const p = await columnPointOnWheel(page);
    await page.waitForTimeout(320);
    await page.mouse.click(p.x, p.y);
    await idle(page);
    const s = await state(page);
    expect(s.opened).toBe(true);
    expect((await page.evaluate((i) => window.__fw.pathOf(i), s.selected))!.split('/')).toHaveLength(3);
  });

  test('a drag starting in the column spins the wheel', async ({ page }) => {
    await page.setViewportSize({ width: 895, height: 470 });
    await open(page, '#/body/head/wide-eyes');
    await settled(page);
    const p = await columnPointOnWheel(page);
    const before = (await page.evaluate(() => window.__fw.camera())).rotation;
    await page.mouse.move(p.x, p.y);
    await page.mouse.down();
    await page.mouse.move(p.x, p.y + 80, { steps: 5 });
    await page.mouse.up();
    await idle(page);
    expect(sameAngle((await page.evaluate(() => window.__fw.camera())).rotation, before)).toBeGreaterThan(0.01);
  });
});
