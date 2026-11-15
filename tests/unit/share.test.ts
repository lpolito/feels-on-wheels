// @vitest-environment happy-dom
import { describe, expect, test, vi } from 'vitest';
import { shareLink } from '../../src/ui/share';
import { infoIcon, shareIcon } from '../../src/ui/icons';

const data = { title: 'T', url: 'https://x/' };
const fakeNav = (share?: unknown, writeText?: unknown) =>
  ({
    ...(share ? { share } : {}),
    ...(writeText ? { clipboard: { writeText } } : {}),
  }) as unknown as Pick<Navigator, 'share' | 'clipboard'>;

describe('shareLink', () => {
  test('uses the share sheet with only title and url', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn();
    expect(await shareLink({ ...data, extra: 1 } as typeof data, fakeNav(share, writeText))).toBe('shared');
    expect(share).toHaveBeenCalledTimes(1);
    expect(share).toHaveBeenCalledWith({ title: 'T', url: 'https://x/' });
    expect(writeText).not.toHaveBeenCalled();
  });

  test('a canceled sheet does nothing', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('', 'AbortError'));
    const writeText = vi.fn();
    expect(await shareLink(data, fakeNav(share, writeText))).toBe('canceled');
    expect(writeText).not.toHaveBeenCalled();
  });

  test.each([new DOMException('', 'NotAllowedError'), new TypeError('x')])(
    'a refused sheet falls back to copying (%s)',
    async (err) => {
      const share = vi.fn().mockRejectedValue(err);
      const writeText = vi.fn().mockResolvedValue(undefined);
      expect(await shareLink(data, fakeNav(share, writeText))).toBe('copied');
      expect(writeText).toHaveBeenCalledWith('https://x/');
    },
  );

  test('no share sheet copies the link', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    expect(await shareLink(data, fakeNav(undefined, writeText))).toBe('copied');
    expect(writeText).toHaveBeenCalledWith('https://x/');
  });

  test('copying fails quietly', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('no'));
    expect(await shareLink(data, fakeNav(undefined, writeText))).toBe('failed');
    expect(await shareLink(data, fakeNav())).toBe('failed');
  });

  test('a second share while one is open is ignored', async () => {
    let finish!: () => void;
    const share = vi.fn().mockReturnValueOnce(new Promise<void>((r) => (finish = r)));
    const nav = fakeNav(share);
    const first = shareLink(data, nav);
    expect(await shareLink(data, nav)).toBe('busy');
    expect(share).toHaveBeenCalledTimes(1);
    finish();
    expect(await first).toBe('shared');
    share.mockResolvedValue(undefined);
    expect(await shareLink(data, nav)).toBe('shared');
    expect(share).toHaveBeenCalledTimes(2);
  });
});

describe('icons', () => {
  test('icons are hidden from assistive tech', () => {
    for (const icon of [infoIcon(), shareIcon()]) {
      expect(icon.getAttribute('aria-hidden')).toBe('true');
      expect(icon.getAttribute('viewBox')).toBe('0 0 24 24');
      expect(icon.getAttribute('class')).toBe('fw-icon');
    }
  });
});
