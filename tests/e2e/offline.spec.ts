import { expect, test, type Page } from '@playwright/test';

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

/** Visits once and reloads, so the service worker has cached the shell and controls the page. */
async function installed(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
}

test('About loads offline after the first visit (Review Focus 4)', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'Playwright WebKit does not support service worker offline emulation');
  await installed(page);
  await context.setOffline(true);
  await page.goto('/about?ref=x');
  await expect(page.locator('#about h1')).toBeVisible();
  await expect(page.locator('#about h1')).toHaveText('Feels on Wheels');
  await expect(page.locator('#app')).toBeHidden();
  await context.setOffline(false);
});

test('a word\'s path and a made-up path load offline after the first visit (URL redesign spec §7)', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'Playwright WebKit does not support service worker offline emulation');
  await installed(page);
  await context.setOffline(true);
  await page.goto('/happy/playful');
  await page.waitForFunction(() => window.__fw !== undefined);
  await expect(page.locator('fw-card .fw-card-title')).toHaveText('Playful');
  await page.goto('/nope');
  await page.waitForFunction(() => window.__fw !== undefined);
  await expect(page.locator('fw-hint[data-variant="not-found"]')).toBeVisible();
  await expect(page.locator('fw-hint .fw-hint-title')).toHaveText('Feeling not found!');
  await context.setOffline(false);
});

test('after the first visit, /about.html and /about/ redirect to /about (Cloudflare redirects them too)', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  for (const path of ['/about.html', '/about/']) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/about$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Feels on Wheels');
  }
});

test('manifest is linked and valid', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();
  const res = await request.get(new URL(href!, page.url()).toString());
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m.name).toBe('Feels on Wheels');
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

test('the service worker registers even when the app had to wait for the load event', async ({ page }) => {
  // Without the tokens stylesheet the app waits for load before starting (main.ts), the branch WebKit takes when it
  // runs the module before the stylesheets apply. Registration must still happen after that.
  await page.addInitScript(() => {
    const w = window as unknown as { __swRegistered: boolean };
    w.__swRegistered = false;
    const register = navigator.serviceWorker.register.bind(navigator.serviceWorker);
    navigator.serviceWorker.register = (...args: Parameters<typeof register>) => {
      w.__swRegistered = true;
      return register(...args);
    };
  });
  await page.route(/\/assets\/tokens-[^/]*\.css$/, (route) => route.abort());
  await page.goto('/');
  await page.waitForFunction(() => (window as unknown as { __swRegistered: boolean }).__swRegistered, null, { timeout: 5000 });
});
