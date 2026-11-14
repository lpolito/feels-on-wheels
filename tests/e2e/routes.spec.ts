import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { hint, idle, open, selectedPath, settled, state, tapPath, title } from './helpers';

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
