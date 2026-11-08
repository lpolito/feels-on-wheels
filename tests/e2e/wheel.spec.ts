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
    await page.mouse.click(x, y);
    await idle(page);
    expect((await state(page)).selected).toBeNull();
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
    await expect(hint(page)).toHaveText('How are you feeling? Tap a feeling or spin to explore.');
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
    const p = await page.evaluate(() => window.__fw.segmentScreenPoint('angry'));
    expect(Math.abs(p.y - 450)).toBeLessThanOrEqual(2);
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

  test('phone: base URL starts with nothing selected and the hint "How are you feeling? Tap a feeling or spin to explore."', async ({ page }) => {
    await open(page);
    const s = await state(page);
    expect(s.selected).toBeNull();
    expect(s.opened).toBe(false);
    expect(s.view.mode).toBe('wheel');
    expect(await page.evaluate(() => location.hash)).toBe('');
    await expect(hint(page)).toBeVisible();
    await expect(hint(page)).toHaveText('How are you feeling? Tap a feeling or spin to explore.');
  });

  test("phone: the wheel's centre is on the left edge", async ({ page }) => {
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

  test('phone: turned sideways with a word selected, the half-wheel becomes the full wheel', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await open(page);
    await tapPath(page, 'angry');
    const rot = (await page.evaluate(() => window.__fw.camera())).rotation;
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(200);
    await idle(page);
    const { cam, vp } = await page.evaluate(() => ({ cam: window.__fw.camera(), vp: window.__fw.viewport() }));
    expect(cam.scale).toBe(1);
    expect(Math.abs(cam.cx - vp.width / 2)).toBeLessThanOrEqual(1);
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

  test('phone: opened word is centred vertically and above the card', async ({ page }) => {
    await open(page);
    await tapPath(page, 'angry');
    await tapPath(page, 'angry');
    expect((await state(page)).opened).toBe(true);
    await expect(page.locator('fw-card .fw-card-body')).toBeVisible();
    const p = await page.evaluate(() => window.__fw.segmentScreenPoint('angry'));
    const stage = (await wheelBox(page))!;
    expect(Math.abs(p.y - (stage.y + stage.height / 2))).toBeLessThanOrEqual(2);
    const half = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.getElementById('app')!).getPropertyValue('--opened-half')));
    expect(half).toBeGreaterThan(20);
    const card = (await page.locator('fw-card').boundingBox())!;
    expect(p.y + half).toBeLessThan(card.y);
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
  test(`axe: no violations with nothing selected, selected, opened (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await open(page, '#/core/angry/aggressive/hostile');
    // Let the unfold finish, so axe reads the settled colours.
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
