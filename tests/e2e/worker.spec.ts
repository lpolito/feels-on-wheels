import { expect, test } from '@playwright/test';

// URL redesign spec §5, §10: the Worker, as Cloudflare runs it (`wrangler dev`), for first visits and crawlers.

const titleOf = (html: string): string | undefined => /<title>([^<]*)<\/title>/.exec(html)?.[1];

test.describe('statuses and titles', () => {
  for (const [path, status, title] of [
    ['/happy/playful', 200, 'Playful · Feels on Wheels'],
    ['/body', 200, 'Body sensations wheel · Feels on Wheels'],
    ['/about', 200, 'About Feels on Wheels'],
    ['/nope', 404, 'Not found · Feels on Wheels'],
  ] as const) {
    test(`${path} is ${status}, titled "${title}"`, async ({ request }) => {
      const res = await request.get(path);
      expect(res.status()).toBe(status);
      expect(res.headers()['content-type']).toMatch(/^text\/html/);
      expect(titleOf(await res.text())).toBe(title);
    });
  }

  for (const [path, location] of [
    ['/happy/', '/happy'],
    ['/about.html', '/about'],
  ] as const) {
    test(`${path} redirects to ${location} with a 301`, async ({ request }) => {
      const res = await request.get(path, { maxRedirects: 0 });
      expect(res.status()).toBe(301);
      expect(new URL(res.headers()['location']!).pathname).toBe(location);
    });
  }
});

test.describe('with JavaScript off', () => {
  test.use({ javaScriptEnabled: false });

  test('/about shows About, and the wheel stays hidden', async ({ page }) => {
    await page.goto('/about');
    await expect(page.locator('#about h1')).toBeVisible();
    await expect(page.locator('#about h1')).toHaveText('Feels on Wheels');
    await expect(page.locator('#app')).toBeHidden();
    // The noscript line is for the wheel; About works without JavaScript, so it doesn't show there. (Playwright's
    // text locators skip <noscript>, so these find its paragraph by tag.)
    await expect(page.locator('noscript p')).toHaveText(/needs JavaScript to draw the wheel/);
    await expect(page.locator('noscript p')).toBeHidden();
  });

  test('/ shows the noscript line', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('noscript p')).toBeVisible();
    await expect(page.locator('noscript p')).toHaveText(/needs JavaScript to draw the wheel/);
  });
});
