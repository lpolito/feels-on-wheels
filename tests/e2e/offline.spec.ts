import { expect, test } from '@playwright/test';

test('offline reload works after the first visit', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'Playwright WebKit does not support service worker offline emulation');
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // The first load may not be controlled yet; wait until the worker has cached everything and claimed nothing extra.
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('[role="treeitem"]')).toHaveCount(130);
  await expect(page.locator('#wheel')).toBeVisible();
  await context.setOffline(false);
});

test('manifest is linked and valid', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  const res = await request.get(new URL(href!, page.url()).toString());
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m.name).toBe('Feelings Wheel');
  expect(m.display).toBe('standalone');
  expect(m.icons.some((i: { purpose?: string }) => i.purpose === 'maskable')).toBe(true);
  for (const icon of m.icons as { src: string }[]) {
    expect((await request.get(new URL(icon.src, new URL(href!, page.url())).toString())).ok(), icon.src).toBe(true);
  }
});

test('the service worker registers even when the app waited for a late stylesheet', async ({ page }) => {
  await page.route('**/*.css', async (route) => {
    await new Promise((r) => setTimeout(r, 600));
    await route.continue();
  });
  await page.goto('/');
  await page.waitForFunction(() => window.__fw !== undefined);
  await page.waitForFunction(async () => (await navigator.serviceWorker.getRegistration()) !== undefined, null, { timeout: 5000 });
});
