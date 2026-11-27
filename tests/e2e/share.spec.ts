import { expect, test, type Page } from '@playwright/test';
import { idle, open } from './helpers';

// Share spec 2026-11-15 §1-3: Share in the toolbar shares the site's home page; an opened word's card shares that
// word's own address.

/** A share sheet that records what it was given. */
const stubShareSheet = (): void => {
  Object.defineProperty(navigator, 'share', {
    configurable: true,
    value: async (data: ShareData) => {
      window.__shared = { title: data.title ?? '', url: data.url ?? '' };
    },
  });
};

/** No share sheet: the link is copied to a clipboard that records it. */
const stubNoShareSheet = (): void => {
  delete (Navigator.prototype as { share?: unknown }).share;
  delete (navigator as { share?: unknown }).share;
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async (text: string) => {
        window.__copied = text;
      },
    },
  });
};

/** The document title of the home page, read now (the tagline is the content's, not the test's). */
async function homeTitle(page: Page): Promise<string> {
  await open(page, '/');
  return page.title();
}

const shared = (page: Page) => page.waitForFunction(() => window.__shared).then((h) => h.jsonValue());

test('Share at rest shares the home page', async ({ page }) => {
  await page.addInitScript(stubShareSheet);
  const title = await homeTitle(page);
  await page.locator('fw-toolbar .fw-share').click();
  const origin = new URL(page.url()).origin;
  expect(await shared(page)).toEqual({ title, url: `${origin}/` });
});

test('Share on the body wheel still shares the home page', async ({ page }) => {
  await page.addInitScript(stubShareSheet);
  const title = await homeTitle(page);
  await open(page, '/body');
  await page.locator('fw-toolbar .fw-share').click();
  const origin = new URL(page.url()).origin;
  expect(await shared(page)).toEqual({ title, url: `${origin}/` });
});

test("a word's share sends its own address and title", async ({ page }) => {
  await page.addInitScript(stubShareSheet);
  await open(page, '/love/attracted/aroused');
  await page.locator('fw-card .fw-card-share').click();
  const origin = new URL(page.url()).origin;
  expect(await shared(page)).toEqual({ title: 'Aroused · Feels on Wheels', url: `${origin}/love/attracted/aroused` });
});

test('without a share sheet the link is copied and said', async ({ page }) => {
  await page.addInitScript(stubNoShareSheet);
  await open(page, '/');
  await page.locator('fw-toolbar .fw-share').click();
  const origin = new URL(page.url()).origin;
  await page.waitForFunction(() => window.__copied !== undefined);
  expect(await page.evaluate(() => window.__copied)).toBe(`${origin}/`);
  const label = page.locator('fw-toolbar .fw-share-label');
  await expect(label).toBeVisible();
  await expect(label).toHaveText('Link copied');
  await expect(page.locator('#announcer')).toHaveText('Link copied');
});

test('Share and Start over swap; the theme button never moves', async ({ page }) => {
  await open(page, '/');
  const theme = page.locator('fw-toolbar .fw-theme-toggle');
  const share = page.locator('fw-toolbar .fw-share');
  const startOver = page.locator('fw-toolbar .fw-start-over');
  const atRest = await theme.boundingBox();
  await expect(share).toBeVisible();
  await expect(startOver).toBeHidden();
  await open(page, '/happy');
  expect(await theme.boundingBox()).toEqual(atRest);
  await expect(share).toBeHidden();
  await expect(startOver).toBeVisible();
  await startOver.click();
  await idle(page);
  expect(await theme.boundingBox()).toEqual(atRest);
  await expect(share).toBeVisible();
  await expect(startOver).toBeHidden();
});
