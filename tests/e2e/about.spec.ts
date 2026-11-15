import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { aboutHeading, aboutLink, backToWheel, focused, idle, open, ring, selectedPath, state } from './helpers';

// Going-public spec §8 and URL redesign spec §3: About is a view in the one shell, with its theme and accessibility.

const saveTheme = (t: string): void => {
  localStorage.setItem('fw.theme', t);
};
const markPage = (): void => {
  (window as unknown as { __noReload: number }).__noReload = 1;
};
const notReloaded = (): number | undefined => (window as unknown as { __noReload?: number }).__noReload;

test('the message\'s About link opens About in the app: no reload, its URL and title, focus on its heading', async ({ page }) => {
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

test('from a word on the body wheel, Start over then About: "Back to the wheel" lands on the body wheel with no new entry, focus back on the About link', async ({ page }) => {
  await open(page, '/body/chest/tight-chest');
  await page.evaluate(markPage);
  // The message, and its About link, show once nothing is selected.
  await page.locator('fw-toolbar .fw-start-over').click();
  await aboutLink(page).click();
  await expect(aboutHeading(page)).toBeFocused();
  const entries = await page.evaluate(() => history.length);
  // Opening it in a new tab lands on the wheel as you left it.
  await expect(backToWheel(page)).toHaveAttribute('href', '/body');
  await backToWheel(page).click();
  await expect(page).toHaveURL(/\/body$/);
  await idle(page);
  expect(await page.evaluate(() => window.__fw.wheel())).toBe('body');
  expect((await state(page)).selected).toBeNull();
  await expect(page).toHaveTitle('Body sensations wheel · Feels on Wheels');
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

test('after a click, About\'s heading and the About link on leaving show no ring (keys and focus spec)', async ({ page }) => {
  await open(page);
  await aboutLink(page).click();
  await expect(aboutHeading(page)).toBeFocused();
  expect(await ring(aboutHeading(page))).toBe('none');
  await backToWheel(page).click();
  await expect(aboutLink(page)).toBeFocused();
  expect(await ring(aboutLink(page))).toBe('none');
});

test('by keyboard, the About link shows its ring on leaving', async ({ page }) => {
  await open(page);
  await aboutLink(page).focus();
  await page.keyboard.press('Enter');
  await expect(aboutHeading(page)).toBeFocused();
  expect(await ring(aboutHeading(page))).toBe('none');
  await backToWheel(page).focus();
  await page.keyboard.press('Enter');
  await expect(aboutLink(page)).toBeFocused();
  expect(await ring(aboutLink(page))).toBe('solid');
});

test('the heading links home, like a site title: a new entry, the wheel, focus back on the About link', async ({ page }) => {
  await open(page);
  await aboutLink(page).click();
  await expect(aboutHeading(page)).toBeFocused();
  const home = page.getByRole('heading', { level: 1 }).getByRole('link', { name: 'Feels on Wheels', exact: true });
  await expect(home).toHaveAttribute('href', '/');
  const entries = await page.evaluate(() => history.length);
  // Past the history writer's 250 ms merge window (a held arrow key), as a person's next click would be.
  await page.waitForTimeout(320);
  await home.click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page).toHaveTitle('Feels on Wheels: find the word for what you feel');
  await expect(page.locator('#wheel')).toBeVisible();
  await expect(aboutLink(page)).toBeFocused();
  expect(await page.evaluate(() => history.length)).toBe(entries + 1);
});

test('with a word selected behind About, the heading starts fresh: the whole wheel, nothing selected', async ({ page }) => {
  // About opens only from the message, with nothing selected; Back and Forward can still put it in front of a selected word.
  await open(page, '/happy/playful');
  await page.locator('fw-toolbar .fw-start-over').click();
  await idle(page);
  await aboutLink(page).click();
  await expect(aboutHeading(page)).toBeFocused();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/happy\/playful$/);
  await idle(page);
  expect((await state(page)).opened).toBe(true);
  // Forward to / closes the word and keeps it selected (spec v1.2 §3.1), then on to About.
  await page.goForward();
  await expect(page).toHaveURL(/\/$/);
  await page.goForward();
  await expect(page).toHaveURL(/\/about$/);
  await expect(aboutHeading(page)).toBeVisible();
  expect(await selectedPath(page)).toBe('happy/playful');
  await page.waitForTimeout(320);
  await page.getByRole('heading', { level: 1 }).getByRole('link', { name: 'Feels on Wheels', exact: true }).click();
  await expect(page).toHaveURL(/\/$/);
  await idle(page);
  expect((await state(page)).selected).toBeNull();
  expect((await state(page)).opened).toBe(false);
});

test('every link off the site opens a new tab and says so; the links home stay in this tab (keys and focus spec)', async ({ page }) => {
  await page.goto('/about');
  await expect(aboutHeading(page)).toBeVisible();
  const external = page.locator('#about a[href^="https://"]');
  expect(await external.count()).toBeGreaterThan(2);
  for (const a of await external.all()) {
    await expect(a).toHaveAttribute('target', '_blank');
    await expect(a).toHaveAccessibleName(/\(opens in a new tab\)$/);
  }
  await expect(page.locator('#about a[target]:not([href^="https://"])')).toHaveCount(0);
  await expect(page.locator('#about .about-home')).not.toHaveAttribute('target', /./);
  await expect(backToWheel(page)).not.toHaveAttribute('target', /./);
});

test('the sign-off links the repo with the GitHub icon, named for screen readers, with a big enough target', async ({ page }) => {
  await page.goto('/about');
  await expect(aboutHeading(page)).toBeVisible();
  const github = page.getByRole('link', { name: 'Feels on Wheels on GitHub' });
  await expect(github).toHaveAttribute('href', 'https://github.com/lpolito/feels-on-wheels');
  // Both sign-off links open a new tab and say so (WCAG G201).
  await expect(github).toHaveAccessibleName('Feels on Wheels on GitHub (opens in a new tab)');
  await expect(github).toHaveAttribute('target', '_blank');
  const name = page.getByRole('link', { name: 'Lucas Polito', exact: false });
  await expect(name).toHaveAccessibleName('Lucas Polito (opens in a new tab)');
  await expect(name).toHaveAttribute('target', '_blank');
  await expect(name).toHaveAttribute('rel', 'noopener');
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
  await expect(page).toHaveTitle('Feels on Wheels: find the word for what you feel');
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

for (const at of ['/', '/body']) {
  test(`the message's About link opens About; Back returns focus to it (${at})`, async ({ page }) => {
    await open(page, at);
    await aboutLink(page).click();
    await expect(page).toHaveURL(/\/about$/);
    await expect(aboutHeading(page)).toBeFocused();
    await page.evaluate(() => history.back());
    await expect(page).toHaveURL((u) => u.pathname === at);
    await expect.poll(() => focused(page)).toBe('A.fw-hint-about-link');
  });
}

test('the not-found message links to About', async ({ page }) => {
  await open(page, '/nope');
  await expect(aboutLink(page)).toBeVisible();
  await expect(aboutLink(page)).toHaveAttribute('href', '/about');
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
