import { expect, type Page } from '@playwright/test';

export async function open(page: Page, path = '/'): Promise<void> {
  await page.goto(path);
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
export const head = (page: Page) => page.locator('fw-card .fw-card-toggle');
export const title = (page: Page) => page.locator('fw-card .fw-card-title');
export const hint = (page: Page) => page.locator('fw-hint');

export async function expectTitle(page: Page, text: string): Promise<void> {
  await expect(title(page)).toHaveText(text);
}

/** Waits until no CSS transition is running (the card's unfold, fades), so checks read settled styles. */
export async function settled(page: Page): Promise<void> {
  await page.waitForFunction(() => !document.getAnimations().some((a) => a instanceof CSSTransition));
}

/**
 * On phones, About gives way to Start over while a word is selected (about.spec.ts). Turning a portrait phone
 * sideways keeps both, so a test can open About from a selected word on every project.
 */
export async function sideways(page: Page): Promise<void> {
  const vp = page.viewportSize();
  if (vp && vp.width < 480) await page.setViewportSize({ width: vp.height, height: vp.width });
}

export const aboutLink = (page: Page) => page.locator('fw-toolbar .fw-about');
export const backToWheel = (page: Page) => page.locator('#about .about-back a');
export const aboutHeading = (page: Page) => page.locator('#about h1');
/** The element with focus, as a short description ("BODY", "H1", "A.fw-about"). */
export const focused = (page: Page) => page.evaluate(() => {
  const el = document.activeElement;
  return el ? `${el.tagName}${el.classList.length ? `.${[...el.classList].join('.')}` : ''}` : 'none';
});
