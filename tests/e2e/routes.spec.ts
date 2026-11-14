import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { aboutHeading, aboutLink, backToWheel, focused, hint, idle, open, selectedPath, settled, sideways, state, tapPath, title } from './helpers';

// URL redesign spec §1, §2, §6, §7: real paths, titles that follow the route, and not found.

const wheelId = (page: Page) => page.evaluate(() => window.__fw.wheel());
const hintTitle = (page: Page) => hint(page).locator('.fw-hint-title');
const hintText = (page: Page) => hint(page).locator('.fw-hint-text');
const notFound = (page: Page) => page.locator('fw-hint[data-variant="not-found"]');

test('deep links open their cells, with the cell in the title', async ({ page }) => {
  await open(page, '/happy/playful');
  expect(await wheelId(page)).toBe('core');
  expect(await selectedPath(page)).toBe('happy/playful');
  expect((await state(page)).opened).toBe(true);
  await expect(page).toHaveTitle('Playful · Feels on Wheels');
  await open(page, '/body/chest/tight-chest');
  expect(await wheelId(page)).toBe('body');
  expect(await selectedPath(page)).toBe('chest/tight-chest');
  await expect(title(page)).toHaveText('Tight chest');
  await expect(page).toHaveTitle('Tight chest · Feels on Wheels');
});

test('the title follows the route: a word, another wheel, then Back', async ({ page }) => {
  await open(page);
  await expect(page).toHaveTitle('Feels on Wheels: name what you feel');
  await tapPath(page, 'angry');
  await tapPath(page, 'angry');
  await expect(page).toHaveTitle('Angry · Feels on Wheels');
  await page.locator('fw-wheel-switch button', { hasText: 'Body' }).click();
  await idle(page);
  expect(new URL(page.url()).pathname).toBe('/body');
  await expect(page).toHaveTitle('Body sensations wheel · Feels on Wheels');
  await page.goBack();
  await idle(page);
  expect(new URL(page.url()).pathname).toBe('/angry');
  expect(await selectedPath(page)).toBe('angry');
  await expect(page).toHaveTitle('Angry · Feels on Wheels');
});

test('Review Focus 3: a query is ignored, and dropped on the first write', async ({ page }) => {
  await open(page, '/happy?fbclid=x');
  expect(await selectedPath(page)).toBe('happy');
  expect((await state(page)).opened).toBe(true);
  await expect(notFound(page)).toHaveCount(0);
  await page.keyboard.press('Escape');
  await idle(page);
  expect(new URL(page.url()).pathname).toBe('/');
  expect(new URL(page.url()).search).toBe('');
});

test('Review Focus 3: an old hash link shows the feelings wheel at rest', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await open(page, '/#/core/happy');
  expect(await wheelId(page)).toBe('core');
  expect((await state(page)).selected).toBeNull();
  await expect(hintTitle(page)).toHaveText('How are you feeling?');
  await expect(notFound(page)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('a misspelled word shows not found on the feelings wheel, and is announced', async ({ page }) => {
  await open(page, '/happy/plaful');
  expect(await wheelId(page)).toBe('core');
  expect((await state(page)).selected).toBeNull();
  await expect(notFound(page)).toBeVisible();
  await expect(hintTitle(page)).toHaveText('Feeling not found!');
  await expect(hintText(page)).toHaveText(
    'There\'s no “plaful” on the wheel. Tap or spin to explore, or start from body sensations instead.',
  );
  await expect(page).toHaveTitle('Not found · Feels on Wheels');
  await expect(page.locator('#announcer')).toContainText('Feeling not found!');
  // The address stays as typed until something changes.
  expect(new URL(page.url()).pathname).toBe('/happy/plaful');
});

test('a misspelled cell on the body wheel shows not found there', async ({ page }) => {
  await open(page, '/body/chest/tight-chst');
  expect(await wheelId(page)).toBe('body');
  await expect(notFound(page)).toBeVisible();
  await expect(hintTitle(page)).toHaveText('Feeling not found!');
  await expect(hintText(page)).toHaveText(
    'There\'s no “tight-chst” on the wheel. Tap or spin to explore, or start from feelings instead.',
  );
});

test('a typed {link} is shown as typed, with one link', async ({ page }) => {
  await open(page, '/%7Blink%7D');
  await expect(hintText(page)).toHaveText(
    'There\'s no “{link}” on the wheel. Tap or spin to explore, or start from body sensations instead.',
  );
  await expect(hintText(page).locator('a.fw-hint-link')).toHaveCount(1);
});

test('on not found, tapping a word opens it at its own path, and the message never comes back', async ({ page }) => {
  await open(page, '/happy/plaful');
  const entries = await page.evaluate(() => history.length);
  await tapPath(page, 'angry');
  await tapPath(page, 'angry');
  expect((await state(page)).opened).toBe(true);
  expect(new URL(page.url()).pathname).toBe('/angry');
  expect(await page.evaluate(() => history.length)).toBe(entries);
  await expect(page).toHaveTitle('Angry · Feels on Wheels');
  await page.locator('fw-toolbar .fw-start-over').click();
  await idle(page);
  expect((await state(page)).selected).toBeNull();
  expect(new URL(page.url()).pathname).toBe('/');
  await expect(hintTitle(page)).toHaveText('How are you feeling?');
  await expect(notFound(page)).toHaveCount(0);
  await expect(page).toHaveTitle('Feels on Wheels: name what you feel');
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`axe: not found (${colorScheme})`, async ({ page }) => {
    test.setTimeout(60_000);
    await page.emulateMedia({ colorScheme });
    await open(page, '/happy/plaful');
    await expect(notFound(page)).toBeVisible();
    await settled(page);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

// ── About and the router's links (URL redesign spec §2–§4) ───────────────
const marker = (page: Page) => page.evaluate(() => (window as unknown as { __noReload?: number }).__noReload);
const path = (page: Page) => new URL(page.url()).pathname;

test('no full reloads: wheel, word, body, About, Back, Back, Forward', async ({ page }) => {
  await open(page);
  await page.evaluate(() => { (window as unknown as { __noReload: number }).__noReload = 1; });
  const step = async (pathname: string, view: 'wheel' | 'about', docTitle: string, wheel?: string): Promise<void> => {
    await expect(page).toHaveURL((u) => u.pathname === pathname);
    await expect(page).toHaveTitle(docTitle);
    await expect(page.locator(view === 'about' ? '#about' : '#app')).toBeVisible();
    await expect(page.locator(view === 'about' ? '#app' : '#about')).toBeHidden();
    if (wheel) {
      await idle(page);
      expect(await wheelId(page)).toBe(wheel);
    }
    expect(await marker(page)).toBe(1);
  };
  await tapPath(page, 'angry');
  await tapPath(page, 'angry');
  await step('/angry', 'wheel', 'Angry · Feels on Wheels', 'core');
  await page.locator('fw-wheel-switch button', { hasText: 'Body' }).click();
  await step('/body', 'wheel', 'Body sensations wheel · Feels on Wheels', 'body');
  await aboutLink(page).click();
  await step('/about', 'about', 'About Feels on Wheels');
  await page.goBack();
  await step('/body', 'wheel', 'Body sensations wheel · Feels on Wheels', 'body');
  await page.goBack();
  await step('/angry', 'wheel', 'Angry · Feels on Wheels', 'core');
  expect(await selectedPath(page)).toBe('angry');
  await page.goForward();
  await step('/body', 'wheel', 'Body sensations wheel · Feels on Wheels', 'body');
});

test('Review Focus 1: a first load at /about, then the wheel, draws it at its full size', async ({ page }) => {
  await page.goto('/about');
  await page.waitForFunction(() => window.__fw !== undefined);
  await expect(aboutHeading(page)).toBeVisible();
  await backToWheel(page).click();
  await expect(page).toHaveURL((u) => u.pathname === '/');
  await page.waitForFunction(() => !window.__fw.moving(), null, { timeout: 1000 });
  const stage = (await page.locator('#stage').boundingBox())!;
  const vp = await page.evaluate(() => window.__fw.viewport());
  expect(vp.height).toBeCloseTo(stage.height, 0);
  expect(vp.drawWidth).toBeCloseTo(stage.width, 0);
  expect((await page.evaluate(() => window.__fw.labelsByRing()))[0]).toBeGreaterThan(0);
  // The same resting view as a fresh load of the wheel.
  const cam = await page.evaluate(() => window.__fw.camera());
  await open(page, '/');
  const fresh = await page.evaluate(() => window.__fw.camera());
  for (const k of ['scale', 'cx', 'cy'] as const) expect(cam[k], k).toBeCloseTo(fresh[k], 3);
  // The same angle; a phone's intro may end a whole turn away.
  const turn = 2 * Math.PI;
  const off = (((cam.rotation - fresh.rotation) % turn) + turn) % turn;
  expect(Math.min(off, turn - off), 'rotation').toBeLessThan(1e-3);
});

test('Review Focus 5: Back and Forward across About during a spin', async ({ page }) => {
  await sideways(page);
  // Opened, so the fling is a ring spin whose settle would pick a word.
  await open(page, '/fearful/scared');
  const box = (await page.locator('#wheel').boundingBox())!;
  const x = box.x + box.width * 0.4;
  await page.mouse.move(x, box.y + box.height * 0.2);
  await page.mouse.down();
  await page.mouse.move(x, box.y + box.height * 0.8, { steps: 4 });
  await page.mouse.up();
  await aboutLink(page).click();
  const onAbout = async (): Promise<void> => {
    await expect(page).toHaveURL((u) => u.pathname === '/about');
    await expect(page).toHaveTitle('About Feels on Wheels');
    await expect(aboutHeading(page)).toBeFocused();
  };
  const onWheel = async (): Promise<void> => {
    await expect(page.locator('#app')).toBeVisible();
    await idle(page);
    const s = await state(page);
    expect(s.opened).toBe(true);
    expect(path(page)).toBe(`/${await selectedPath(page)}`);
    await expect(page).toHaveTitle(`${await title(page).textContent()} · Feels on Wheels`);
    expect(await focused(page)).not.toBe('BODY');
  };
  await onAbout();
  await page.goBack();
  await onWheel();
  const left = path(page);
  await page.goForward();
  await onAbout();
  await page.goBack();
  await onWheel();
  expect(path(page)).toBe(left);
});

test('Back from About keeps a selected word on the same wheel', async ({ page }) => {
  await sideways(page);
  await open(page);
  await tapPath(page, 'angry');
  expect(await selectedPath(page)).toBe('angry');
  expect((await state(page)).opened).toBe(false);
  await aboutLink(page).click();
  await expect(aboutHeading(page)).toBeFocused();
  await page.goBack();
  await expect(page).toHaveURL((u) => u.pathname === '/');
  await idle(page);
  expect(await selectedPath(page)).toBe('angry');
  expect((await state(page)).opened).toBe(false);
  await expect(aboutLink(page)).toBeFocused();
});

test('the start message links to the other wheel by its real path', async ({ page }) => {
  await open(page);
  await expect(hint(page).locator('a.fw-hint-link')).toHaveAttribute('href', '/body');
  await open(page, '/body');
  await expect(hint(page).locator('a.fw-hint-link')).toHaveAttribute('href', '/');
});

test('a link to the address already showing adds no history entry', async ({ page }) => {
  await page.goto('/about');
  await page.waitForFunction(() => window.__fw !== undefined);
  const entries = await page.evaluate(() => history.length);
  // About's own text may link to {about}; clicking a link to where you are changes nothing.
  await page.evaluate(() => {
    const a = document.createElement('a');
    a.href = '/about';
    a.id = 'self-link';
    a.textContent = 'About';
    document.querySelector('#about')!.append(a);
  });
  await page.locator('#self-link').click();
  await expect(page).toHaveURL((u) => u.pathname === '/about');
  expect(await page.evaluate(() => history.length)).toBe(entries);
  await expect(aboutHeading(page)).toBeVisible();
});
