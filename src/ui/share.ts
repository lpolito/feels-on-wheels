export type ShareResult = 'shared' | 'copied' | 'canceled' | 'failed' | 'busy';

let inFlight = false;

/**
 * Opens the device share sheet with a title and link, or copies the link when there is no sheet
 * (or the browser refuses it). A second call while the first is still open is ignored.
 */
export async function shareLink(
  data: { title: string; url: string },
  nav: Pick<Navigator, 'share' | 'clipboard'> = navigator,
): Promise<ShareResult> {
  if (inFlight) return 'busy';
  inFlight = true;
  try {
    if (typeof nav.share === 'function') {
      try {
        await nav.share({ title: data.title, url: data.url });
        return 'shared';
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return 'canceled';
        // Refused or unsupported: fall through to copying.
      }
    }
    try {
      await nav.clipboard.writeText(data.url);
      return 'copied';
    } catch {
      return 'failed';
    }
  } finally {
    inFlight = false;
  }
}
