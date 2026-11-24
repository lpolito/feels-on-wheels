import { describe, expect, test } from 'vitest';
import { createSpriteCache } from '../../src/render/sprites';

interface FakeBitmap { width: number; height: number; text: string | undefined; closed: boolean; close(): void }
interface FakeCanvas {
  width: number; height: number; texts: string[]; fonts: string[]; ops: string[]; getContext(): unknown;
  transferToImageBitmap?: () => FakeBitmap;
}

/** `bitmaps`: the canvases hand their pixels over as ImageBitmaps, as an OffscreenCanvas does. */
function fakes(o: { noContext?: boolean; bitmaps?: boolean } = {}) {
  const made: FakeCanvas[] = [];
  const bitmaps: FakeBitmap[] = [];
  const makeCanvas = (w: number, h: number) => {
    const c: FakeCanvas = {
      width: w, height: h, texts: [], fonts: [], ops: [],
      getContext() {
        if (o.noContext) return null;
        const ctx = {
          font: '', fillStyle: '', textAlign: '', textBaseline: '',
          setTransform: () => { c.ops.push('setTransform'); },
          clearRect: (x: number, y: number, w2: number, h2: number) => { c.ops.push(`clearRect ${x} ${y} ${w2} ${h2}`); },
          scale() {},
          measureText: (t: string) => ({ width: t.length * 7 }),
          fillText: (t: string) => { c.texts.push(t); c.fonts.push(ctx.font); c.ops.push(`fillText ${t}`); },
        };
        return ctx;
      },
    };
    if (o.bitmaps) {
      c.transferToImageBitmap = () => {
        const b: FakeBitmap = { width: c.width, height: c.height, text: c.texts.at(-1), closed: false, close() { b.closed = true; } };
        bitmaps.push(b);
        return b;
      };
    }
    made.push(c);
    return c as unknown as HTMLCanvasElement;
  };
  const drawn: unknown[] = [];
  const g = {
    setTransform() {},
    drawImage: (img: unknown) => drawn.push(img),
  } as unknown as CanvasRenderingContext2D;
  return { made, makeCanvas, drawn, g, bitmaps };
}

const font = (px: number) => `600 ${px}px sans-serif`;

describe('sprite cache', () => {
  test('second draw of the same label reuses the bitmap', () => {
    const { made, makeCanvas, drawn, g } = fakes();
    const cache = createSpriteCache(makeCanvas, 600, font);
    cache.draw(g, 'Angry', 14, '#ffffff', 10, 10, 0);
    cache.draw(g, 'Angry', 14, '#ffffff', 50, 80, 1.2);
    expect(made).toHaveLength(1);
    expect(made[0]!.texts).toEqual(['Angry']);
    expect(drawn).toEqual([made[0], made[0]]);
    expect(cache.size).toBe(1);
  });

  test('a different color or text is a different sprite', () => {
    const { made, makeCanvas, g } = fakes();
    const cache = createSpriteCache(makeCanvas, 600, font);
    cache.draw(g, 'Angry', 14, '#ffffff', 0, 0, 0);
    cache.draw(g, 'Angry', 14, '#eeeeee', 0, 0, 0);
    cache.draw(g, 'Sad', 14, '#ffffff', 0, 0, 0);
    expect(made).toHaveLength(3);
  });

  test('px rounds to 0.5', () => {
    const { made, makeCanvas, g } = fakes();
    const cache = createSpriteCache(makeCanvas, 600, font);
    cache.draw(g, 'Angry', 14.1, '#ffffff', 0, 0, 0);
    cache.draw(g, 'Angry', 14.2, '#ffffff', 0, 0, 0);
    expect(made).toHaveLength(1);
    expect(made[0]!.fonts[0]).toBe(font(14));
    cache.draw(g, 'Angry', 14.3, '#ffffff', 0, 0, 0);
    expect(made).toHaveLength(2);
    expect(made[1]!.fonts[0]).toBe(font(14.5));
  });

  test('evicts least-recently-used beyond the limit', () => {
    const { makeCanvas, g } = fakes();
    let created = 0;
    const counting = (w: number, h: number) => { created++; return makeCanvas(w, h); };
    const cache = createSpriteCache(counting, 2, font);
    cache.draw(g, 'a', 14, '#fff', 0, 0, 0);
    cache.draw(g, 'b', 14, '#fff', 0, 0, 0);
    cache.draw(g, 'a', 14, '#fff', 0, 0, 0); // a is now most recent
    cache.draw(g, 'c', 14, '#fff', 0, 0, 0); // evicts b
    expect(cache.size).toBe(2);
    const before = created;
    cache.draw(g, 'a', 14, '#fff', 0, 0, 0);
    expect(created).toBe(before);
    cache.draw(g, 'b', 14, '#fff', 0, 0, 0);
    expect(cache.size).toBe(2);
  });

  test('a reused pooled canvas is cleared before drawing', () => {
    const { made, makeCanvas, g } = fakes();
    const cache = createSpriteCache(makeCanvas, 1, font);
    cache.draw(g, 'Angry', 14, '#fff', 0, 0, 0);
    cache.draw(g, 'Sad', 14, '#fff', 0, 0, 0); // evicts Angry; its canvas goes to the pool
    cache.draw(g, 'Disgusted', 14, '#fff', 0, 0, 0); // reuses it
    const reused = made.find((c) => c.texts.includes('Disgusted'))!;
    expect(reused.texts).toEqual(['Angry', 'Disgusted']);
    const ops = reused.ops.slice(reused.ops.indexOf('fillText Angry') + 1);
    // setTransform (device px), then a clear of the whole CSS-px box, then the text.
    expect(ops[0]).toBe('setTransform');
    expect(ops[1]).toMatch(/^clearRect 0 0 [\d.]+ [\d.]+$/);
    expect(ops[2]).toBe('fillText Disgusted');
    const [, , , w, h] = ops[1]!.split(' ').map(Number);
    expect(w).toBeCloseTo('Disgusted'.length * 7 + 4, 9);
    expect(h).toBeCloseTo(14 * 1.4 + 4, 9);
  });

  test('a canvas without a 2D context falls back to the fallback maker', () => {
    const broken = fakes({ noContext: true });
    const good = fakes();
    let fallbacks = 0;
    const fallback = (w: number, h: number) => { fallbacks++; return good.makeCanvas(w, h); };
    const cache = createSpriteCache(broken.makeCanvas, 600, font, { fallback });
    cache.draw(good.g, 'Angry', 14, '#fff', 0, 0, 0);
    cache.draw(good.g, 'Sad', 14, '#fff', 0, 0, 0);
    expect(broken.made).toHaveLength(1);
    expect(fallbacks).toBe(2);
    expect(good.made.map((c) => c.texts)).toEqual([['Angry'], ['Sad']]);
    expect(good.drawn).toEqual(good.made);
  });

  test('byte cap evicts least-recently-used sprites', () => {
    const { made, makeCanvas, g } = fakes();
    // 'a' at 14px is 11 × 23.6 CSS px → 11 × 24 device px → 1056 bytes; two fit in 2500.
    const cache = createSpriteCache(makeCanvas, 600, font, { maxBytes: 2500 });
    cache.draw(g, 'a', 14, '#fff', 0, 0, 0);
    cache.draw(g, 'b', 14, '#fff', 0, 0, 0);
    expect(cache.size).toBe(2);
    cache.draw(g, 'a', 14, '#fff', 0, 0, 0); // a is now most recent
    cache.draw(g, 'c', 14, '#fff', 0, 0, 0); // evicts b
    expect(cache.size).toBe(2);
    const before = made.length;
    cache.draw(g, 'a', 14, '#fff', 0, 0, 0);
    cache.draw(g, 'c', 14, '#fff', 0, 0, 0);
    expect(made.length).toBe(before);
    cache.draw(g, 'b', 14, '#fff', 0, 0, 0); // re-rendered: it was evicted
    expect(made.flatMap((c) => c.texts).filter((t) => t === 'b')).toHaveLength(2);
  });

  test('a single sprite larger than the byte cap is still drawn', () => {
    const { makeCanvas, drawn, g } = fakes();
    const cache = createSpriteCache(makeCanvas, 600, font, { maxBytes: 10 });
    cache.draw(g, 'Angry', 14, '#fff', 0, 0, 0);
    expect(drawn).toHaveLength(1);
    expect(cache.size).toBe(1);
  });

  test('setScale clears sprites rendered for another device pixel ratio', () => {
    const { made, makeCanvas, g } = fakes();
    const cache = createSpriteCache(makeCanvas, 600, font);
    cache.draw(g, 'Angry', 14, '#ffffff', 0, 0, 0);
    cache.setScale(2);
    expect(cache.size).toBe(0);
    cache.draw(g, 'Angry', 14, '#ffffff', 0, 0, 0);
    expect(made.at(-1)!.width).toBeGreaterThan(made[0]!.width);
  });

  test('an OffscreenCanvas label is drawn from an ImageBitmap, and its canvas goes back to the pool', () => {
    const { made, makeCanvas, drawn, g, bitmaps } = fakes({ bitmaps: true });
    const cache = createSpriteCache(makeCanvas, 600, font);
    cache.draw(g, 'Angry', 14, '#ffffff', 10, 10, 0);
    cache.draw(g, 'Angry', 14, '#ffffff', 50, 80, 1.2);
    cache.draw(g, 'Sad', 14, '#ffffff', 0, 0, 0);
    // One canvas renders both labels; the cache keeps only their bitmaps, the same one each time a label is drawn.
    expect(made).toHaveLength(1);
    expect(made[0]!.width).toBe(1);
    expect(bitmaps.map((b) => b.text)).toEqual(['Angry', 'Sad']);
    expect(drawn).toEqual([bitmaps[0], bitmaps[0], bitmaps[1]]);
  });

  test('evicted and rescaled ImageBitmaps are closed', () => {
    const { makeCanvas, g, bitmaps } = fakes({ bitmaps: true });
    const cache = createSpriteCache(makeCanvas, 2, font);
    cache.draw(g, 'Angry', 14, '#ffffff', 0, 0, 0);
    cache.draw(g, 'Sad', 14, '#ffffff', 0, 0, 0);
    cache.draw(g, 'Happy', 14, '#ffffff', 0, 0, 0);
    expect(bitmaps.map((b) => b.closed)).toEqual([true, false, false]);
    cache.setScale(2);
    expect(bitmaps.every((b) => b.closed)).toBe(true);
    expect(cache.size).toBe(0);
  });

  test('ImageBitmap bytes count toward the byte cap', () => {
    const { makeCanvas, g, bitmaps } = fakes({ bitmaps: true });
    const cache = createSpriteCache(makeCanvas, 600, font, { maxBytes: 1 });
    cache.draw(g, 'Angry', 14, '#ffffff', 0, 0, 0);
    cache.draw(g, 'Sad', 14, '#ffffff', 0, 0, 0);
    expect(cache.size).toBe(1);
    expect(bitmaps.map((b) => b.closed)).toEqual([true, false]);
  });
});
