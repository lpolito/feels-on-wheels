import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Going-public spec §8: the About page, its toolbar link, its theme and its accessibility.

const saveTheme = (t: string): void => {
  localStorage.setItem('fw.theme', t);
};

test('toolbar link opens About and Back returns', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'About Feels on Wheels' }).click();
  await expect(page).toHaveURL(/\/about$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Feels on Wheels');
  await page.getByRole('link', { name: 'Back to the wheel' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('#wheel')).toBeVisible();
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
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  });
}

test('on phones, About gives way to Start over while a word is selected', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/#/core/happy/content/joyful');
  await expect(page.locator('fw-toolbar .fw-start-over')).toBeVisible();
  await expect(page.locator('fw-toolbar .fw-about')).toBeHidden();
  await page.locator('fw-toolbar .fw-start-over').click();
  await expect(page.locator('fw-toolbar .fw-about')).toBeVisible();
});

test('on wide screens, About stays while a word is selected', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/#/core/happy/content/joyful');
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
