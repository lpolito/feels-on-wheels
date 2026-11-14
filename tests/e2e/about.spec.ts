import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { aboutHeading, aboutLink, backToWheel, idle, open, selectedPath, sideways, state } from './helpers';

// Going-public spec §8 and URL redesign spec §3: About is a view in the one shell, with its theme and accessibility.

const saveTheme = (t: string): void => {
  localStorage.setItem('fw.theme', t);
};
const markPage = (): void => {
  (window as unknown as { __noReload: number }).__noReload = 1;
};
const notReloaded = (): number | undefined => (window as unknown as { __noReload?: number }).__noReload;

test('the toolbar link opens About in the app: no reload, its URL and title, focus on its heading', async ({ page }) => {
  await open(page);
  await page.evaluate(markPage);
  await aboutLink(page).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page).toHaveTitle('About Feels on Wheels');
  await expect(aboutHeading(page)).toBeVisible();
  await expect(aboutHeading(page)).toHaveText('Feels on Wheels');
  await expect(aboutHeading(page)).toBeFocused();
  await expect(page.locator('#app')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.dataset['route'])).toBe('about');
  expect(await page.evaluate(notReloaded)).toBe(1);
});

test('from a word on the body wheel, "Back to the wheel" lands on that word with no new entry, focus back on the About link', async ({ page }) => {
  await sideways(page);
  await open(page, '/body/chest/tight-chest');
  await page.evaluate(markPage);
  await aboutLink(page).click();
  await expect(aboutHeading(page)).toBeFocused();
  const entries = await page.evaluate(() => history.length);
  // Opening it in a new tab lands on the wheel as you left it.
  await expect(backToWheel(page)).toHaveAttribute('href', '/body/chest/tight-chest');
  await backToWheel(page).click();
  await expect(page).toHaveURL(/\/body\/chest\/tight-chest$/);
  await idle(page);
  expect(await page.evaluate(() => window.__fw.wheel())).toBe('body');
  expect(await selectedPath(page)).toBe('chest/tight-chest');
  expect((await state(page)).opened).toBe(true);
  await expect(page.locator('fw-card .fw-card-title')).toHaveText('Tight chest');
  await expect(page).toHaveTitle('Tight chest · Feels on Wheels');
  expect(await page.evaluate(() => history.length)).toBe(entries);
  await expect(aboutLink(page)).toBeFocused();
  await expect(page.locator('#about')).toBeHidden();
  expect(await page.evaluate(notReloaded)).toBe(1);
});

test('the keyboard path: Enter on the About link, then Enter on "Back to the wheel"', async ({ page }) => {
  await open(page);
  await aboutLink(page).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/about$/);
  await expect(aboutHeading(page)).toBeFocused();
  // Keys reach About, not the hidden wheel: Escape and the arrows leave the wheel and the address alone.
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/about$/);
  await backToWheel(page).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/$/);
  await expect(aboutLink(page)).toBeFocused();
  expect((await state(page)).selected).toBeNull();
});

test('Made by links the repo with the GitHub icon, named for screen readers, with a big enough target', async ({ page }) => {
  await page.goto('/about');
  await expect(aboutHeading(page)).toBeVisible();
  const github = page.getByRole('link', { name: 'Feels on Wheels on GitHub' });
  await expect(github).toHaveAttribute('href', 'https://github.com/lpolito/feels-on-wheels');
  const box = (await github.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(24);
  expect(box.height).toBeGreaterThanOrEqual(24);
  await expect(backToWheel(page)).toHaveAccessibleName('Back to the wheel');
});

test('the chevron sits on the same line as "Back to the wheel"', async ({ page }) => {
  await page.goto('/about');
  await expect(aboutHeading(page)).toBeVisible();
  const chevron = (await backToWheel(page).locator('svg').boundingBox())!;
  const text = (await page.locator('#about .about-back').boundingBox())!;
  // One line of text is under 2rem tall; a chevron on its own line makes the paragraph two.
  expect(text.height).toBeLessThan(32);
  expect(chevron.y).toBeGreaterThanOrEqual(text.y);
  expect(chevron.y + chevron.height).toBeLessThanOrEqual(text.y + text.height);
});

test('a fresh load of /about: "Back to the wheel" goes to /', async ({ page }) => {
  await page.goto('/about');
  await page.waitForFunction(() => window.__fw !== undefined);
  await expect(aboutHeading(page)).toBeVisible();
  await expect(page).toHaveTitle('About Feels on Wheels');
  // A first load doesn't move focus.
  await expect(aboutHeading(page)).not.toBeFocused();
  await expect(backToWheel(page)).toHaveAttribute('href', '/');
  await backToWheel(page).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#wheel')).toBeVisible();
  await expect(page).toHaveTitle('Feels on Wheels: name what you feel');
});

for (const [theme, bg] of [['dark', 'rgb(18, 17, 20)'], ['light', 'rgb(255, 255, 255)']] as const) {
  test(`About follows the saved theme: ${theme}`, async ({ page }) => {
    await page.addInitScript(saveTheme, theme);
    await page.goto('/about');
    expect(await page.evaluate(() => document.documentElement.dataset['theme'])).toBe(theme);
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(bg);
  });

  test(`About passes axe: ${theme}`, async ({ page }) => {
    await page.addInitScript(saveTheme, theme);
    await page.goto('/about');
    await expect(aboutHeading(page)).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test('on phones, About gives way to Start over while a word is selected', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/happy/content/joyful');
  await expect(page.locator('fw-toolbar .fw-start-over')).toBeVisible();
  await expect(page.locator('fw-toolbar .fw-about')).toBeHidden();
  await page.locator('fw-toolbar .fw-start-over').click();
  await expect(page.locator('fw-toolbar .fw-about')).toBeVisible();
});

test('on wide screens, About stays while a word is selected', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/happy/content/joyful');
  await expect(page.locator('fw-toolbar .fw-start-over')).toBeVisible();
  await expect(page.locator('fw-toolbar .fw-about')).toBeVisible();
});

test('About renders when storage throws (Review Focus 5)', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } });
  });
  await page.goto('/about');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Feels on Wheels');
  expect(await page.evaluate(() => document.documentElement.dataset['theme'] ?? null)).toBeNull();
  expect(errors).toEqual([]);
});
