/** What `inAppLink` reads from a click (a `MouseEvent` has all of it). */
export interface ClickInfo { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; defaultPrevented: boolean }
/** What `inAppLink` reads from the clicked link (an `HTMLAnchorElement` has all of it, `download` as a string). */
export interface LinkInfo { href: string; target: string; download: boolean }

/**
 * URL redesign spec §2: the URL to handle in the app, or null to leave the click to the browser. The app takes a
 * plain left click on a same-origin link with no `target` and no `download`; a modifier key, another button, a click
 * already handled, another origin or scheme (`mailto:`) go to the browser, so "open in new tab" keeps working.
 */
export function inAppLink(click: ClickInfo, link: LinkInfo, pageOrigin: string): URL | null {
  if (click.defaultPrevented || click.button !== 0 || click.metaKey || click.ctrlKey || click.shiftKey || click.altKey) return null;
  if (link.download || (link.target !== '' && link.target !== '_self')) return null;
  let url: URL;
  try {
    url = new URL(link.href);
  } catch {
    return null;
  }
  return url.origin === pageOrigin ? url : null;
}
