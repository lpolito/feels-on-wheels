import { describe, expect, test } from 'vitest';
import { createSpriteCache } from '../../src/render/sprites';

interface FakeCanvas { width: number; height: number; texts: string[]; fonts: string[]; getContext(): unknown }

function fakes() {
  const made: FakeCanvas[] = [];
  const makeCanvas = (w: number, h: number) => {
    const c: FakeCanvas = {
      width: w, height: h, texts: [], fonts: [],
      getContext() {
        const ctx = {
          font: '', fillStyle: '', textAlign: '', textBaseline: '',
          setTransform() {}, clearRect() {}, scale() {},
          measureText: (t: string) => ({ width: t.length * 7 }),
          fillText: (t: string) => { c.texts.push(t); c.fonts.push(ctx.font); },
        };
        return ctx;
      },
    };
    made.push(c);
    return c as unknown as HTMLCanvasElement;
  };
  const drawn: unknown[] = [];
  const g = {
    setTransform() {},
    drawImage: (img: unknown) => drawn.push(img),
  } as unknown as CanvasRenderingContext2D;
  return { made, makeCanvas, drawn, g };
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

  test('a different colour or text is a different sprite', () => {
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

  test('setScale clears sprites rendered for another device pixel ratio', () => {
    const { made, makeCanvas, g } = fakes();
    const cache = createSpriteCache(makeCanvas, 600, font);
    cache.draw(g, 'Angry', 14, '#ffffff', 0, 0, 0);
    cache.setScale(2);
    expect(cache.size).toBe(0);
    cache.draw(g, 'Angry', 14, '#ffffff', 0, 0, 0);
    expect(made.at(-1)!.width).toBeGreaterThan(made[0]!.width);
  });
});
