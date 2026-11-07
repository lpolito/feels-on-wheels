import { expect, type Page } from '@playwright/test';

declare global {
  interface Window {
    __fw: {
      segmentScreenPoint(path: string): { x: number; y: number };
      state(): { selected: number | null; focused: number | null; view: { mode: string; ring?: number }; interacted: boolean };
      camera(): { scale: number; rotation: number; cx: number; cy: number };
      moving(): boolean;
      pathOf(i: number | null): string | null;
      offCenter(path: string): number;
    };
  }
}

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

export const title = (page: Page) => page.locator('fw-panel h2');
export const prompt = (page: Page) => page.locator('fw-panel .fw-prompt');

export async function expectTitle(page: Page, text: string): Promise<void> {
  await expect(title(page)).toHaveText(text);
}
