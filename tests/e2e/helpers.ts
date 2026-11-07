import { expect, type Page } from '@playwright/test';

export async function open(page: Page, hash = ''): Promise<void> {
  await page.goto(`/${hash}`);
  await page.waitForFunction(() => window.__fw !== undefined);
  await idle(page);
}

export async function idle(page: Page): Promise<void> {
  await page.waitForFunction(() => !window.__fw.moving());
}

/** Taps a segment. Waits out the 300ms double-tap window first so consecutive taps stay single taps. */
export async function tapPath(page: Page, path: string): Promise<void> {
  await page.waitForTimeout(320);
  const p = await page.evaluate((x) => window.__fw.segmentScreenPoint(x), path);
  await page.mouse.click(p.x, p.y);
  await idle(page);
}

export const state = (page: Page) => page.evaluate(() => window.__fw.state());
export const selectedPath = (page: Page) => page.evaluate(() => window.__fw.pathOf(window.__fw.state().selected));
export const head = (page: Page) => page.locator('fw-card .fw-card-head');
export const title = (page: Page) => page.locator('fw-card .fw-card-title');
export const hint = (page: Page) => page.locator('fw-hint');

export async function expectTitle(page: Page, text: string): Promise<void> {
  await expect(title(page)).toHaveText(text);
}
