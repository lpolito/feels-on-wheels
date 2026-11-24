type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/** EXPLORATION: label-cache variants, picked at load from `globalThis.__lv` (bench builds only). */
export type LabelVariant = 'fix' | 'v1' | 'v12' | 'v123' | 'v4' | 'v5' | 'v12f' | 'v123f';
export const labelVariant = (): LabelVariant =>
  (globalThis as { __lv?: LabelVariant }).__lv ?? (import.meta.env['VITE_LV'] as LabelVariant | undefined) ?? 'fix';

export interface SpriteCache {
  /** Draws `text` centered at (x, y) in CSS px, rotated by `rot`, from a cached bitmap. */
  draw(g: CanvasRenderingContext2D, text: string, px: number, color: string, x: number, y: number, rot: number): void;
  /** In motion: draws from the nearest cached size of `text` (the smallest one at least `px`, else the largest). */
  drawNear(g: CanvasRenderingContext2D, text: string, px: number, color: string, x: number, y: number, rot: number): void;
  /** Option 4: draws from a mip chain (24 px and halvings), in motion and at rest. */
  drawMip(g: CanvasRenderingContext2D, text: string, px: number, color: string, x: number, y: number, rot: number): void;
  /** Renders these labels now, where missing: one bitmap each, or (`sheet`) all on shared sheets. Returns how many. */
  warm(items: readonly WarmItem[], sheet: boolean): number;
  has(text: string, px: number, color: string): boolean;
  /** Device pixel ratio the bitmaps are rendered at; changing it drops every sprite. */
  setScale(dpr: number): void;
  readonly size: number;
  readonly bytes: number;
}

export interface WarmItem { text: string; px: number; color: string; seg?: number; lines?: number }

/** `image` is an ImageBitmap where the canvas can hand one over, else the canvas itself. */
interface Sprite {
  image: ImageBitmap | AnyCanvas; w: number; h: number; bytes: number;
  /** On a shared sheet: the sub-rectangle, in device px, and the sheet's refcount. */
  sx?: number; sy?: number; sw?: number; sh?: number; sheet?: { refs: number };
}

const STEP = 0.5;
const PAD = 2;
const HEIGHT = 1.4;
const POOL = 64;
/** Spec v1.2 §7: the cache's total backing store (width × height × 4 bytes). */
const MAX_BYTES = 16 * 1024 * 1024;
const MIP_TOP = 24;
const SHEET_W = 2048;
const SHEET_MAX_H = 2048;
const GUTTER = 2;

const canvasElement = (w: number, h: number): AnyCanvas =>
  Object.assign(document.createElement('canvas'), { width: w, height: h });

/** EXPLORATION counters, read by the bench scripts. */
const bench = globalThis as unknown as {
  __renders: number; __draws: number; __near: number; __up: number; __upMax: number; __nearMiss: number;
  __warmed: number; __peakBytes: number; __sprites?: () => { size: number; bytes: number };
};
bench.__renders = 0; bench.__draws = 0; bench.__near = 0; bench.__up = 0; bench.__upMax = 1; bench.__nearMiss = 0;
bench.__warmed = 0; bench.__peakBytes = 0;

/**
 * Spec §7: label text rendered once per (label, px, color) and blitted with drawImage, because Firefox re-rasterises
 * rotated fillText on every frame. Each label is kept as an ImageBitmap where the canvas can make one: Firefox sends a
 * canvas's pixels to its GPU process again every time it's drawn, and a canvas whose draws are mostly new to the GPU
 * is moved to software for good. Keyed on px rounded to 0.5. Least recently used sprites go once there are more
 * than `limit` or their bitmaps pass `o.maxBytes`. When `makeCanvas` can't give a 2D context, every later sprite
 * uses `o.fallback` (a <canvas> element by default).
 */
export function createSpriteCache(
  makeCanvas: (w: number, h: number) => AnyCanvas,
  limit = 600,
  font: (px: number) => string = (px) => `${px}px sans-serif`,
  o: { maxBytes?: number; fallback?: (w: number, h: number) => AnyCanvas } = {},
): SpriteCache {
  const maxBytes = o.maxBytes ?? MAX_BYTES;
  const fallback = o.fallback ?? canvasElement;
  const sprites = new Map<string, Sprite>();
  /** `text|color` → the sizes cached for it (drawNear). */
  const sizes = new Map<string, number[]>();
  const pool: AnyCanvas[] = [];
  let bytes = 0;
  let dpr = 1;
  let make = makeCanvas;

  function context(): { canvas: AnyCanvas; g: Ctx2D } {
    const pooled = pool.pop();
    if (pooled) return { canvas: pooled, g: pooled.getContext('2d') as Ctx2D };
    const canvas = make(1, 1);
    const g = canvas.getContext('2d') as Ctx2D | null;
    if (g) return { canvas, g };
    make = fallback;
    const c = make(1, 1);
    return { canvas: c, g: c.getContext('2d') as Ctx2D };
  }

  function measureBox(g: Ctx2D, text: string, px: number): { w: number; h: number } {
    g.font = font(px);
    return { w: g.measureText(text).width + 2 * PAD, h: px * HEIGHT + 2 * PAD };
  }

  function render(text: string, px: number, color: string): Sprite {
    bench.__renders++;
    const { canvas, g } = context();
    const { w, h } = measureBox(g, text, px);
    canvas.width = Math.max(1, Math.ceil(w * dpr));
    canvas.height = Math.max(1, Math.ceil(h * dpr));
    // Resizing resets the context state (and usually the pixels, but not when the size is unchanged).
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    g.font = font(px);
    g.fillStyle = color;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2);
    const bytes = canvas.width * canvas.height * 4;
    if (!('transferToImageBitmap' in canvas)) return { image: canvas, w, h, bytes };
    const image = canvas.transferToImageBitmap();
    (bench as unknown as { __bitmaps: number }).__bitmaps = ((bench as unknown as { __bitmaps?: number }).__bitmaps ?? 0) + 1;
    release(canvas);
    return { image, w, h, bytes };
  }

  /** Option 3: many labels on one canvas, handed over as one bitmap. */
  function renderSheet(items: readonly WarmItem[]): [string, Sprite][] {
    const probe = context();
    const boxes = items.map((it) => {
      const { w, h } = measureBox(probe.g, it.text, it.px);
      return { it, w, h, dw: Math.max(1, Math.ceil(w * dpr)), dh: Math.max(1, Math.ceil(h * dpr)), x: 0, y: 0 };
    });
    release(probe.canvas);
    const out: [string, Sprite][] = [];
    let i = 0;
    while (i < boxes.length) {
      // Shelf-pack until the sheet is full.
      let x = 0, y = 0, shelf = 0, n = i;
      for (; n < boxes.length; n++) {
        const b = boxes[n]!;
        if (x + b.dw > SHEET_W) { x = 0; y += shelf + GUTTER; shelf = 0; }
        if (y + b.dh > SHEET_MAX_H) break;
        b.x = x; b.y = y; x += b.dw + GUTTER; shelf = Math.max(shelf, b.dh);
      }
      if (n === i) n = i + 1; // one label taller than a sheet: give it its own
      const height = Math.max(...boxes.slice(i, n).map((b) => b.y + b.dh));
      const width = Math.max(...boxes.slice(i, n).map((b) => b.x + b.dw));
      const { canvas, g } = context();
      canvas.width = width;
      canvas.height = height;
      g.clearRect(0, 0, width, height);
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      for (let k = i; k < n; k++) {
        const b = boxes[k]!;
        bench.__renders++;
        g.setTransform(dpr, 0, 0, dpr, b.x, b.y);
        g.font = font(b.it.px);
        g.fillStyle = b.it.color;
        g.fillText(b.it.text, b.w / 2, b.h / 2);
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
      const image = 'transferToImageBitmap' in canvas ? canvas.transferToImageBitmap() : canvas;
      (bench as unknown as { __bitmaps: number }).__bitmaps = ((bench as unknown as { __bitmaps?: number }).__bitmaps ?? 0) + 1;
      if ('transferToImageBitmap' in canvas) release(canvas);
      const sheet = { refs: n - i };
      for (let k = i; k < n; k++) {
        const b = boxes[k]!;
        out.push([keyOf(b.it.text, b.it.px, b.it.color), { image, w: b.w, h: b.h, bytes: b.dw * b.dh * 4, sx: b.x, sy: b.y, sw: b.dw, sh: b.dh, sheet }]);
      }
      i = n;
    }
    return out;
  }

  /** Back to the pool, shrunk so a pooled canvas holds no backing store of its own. */
  function release(canvas: AnyCanvas): void {
    if (pool.length >= POOL) return;
    canvas.width = 1;
    canvas.height = 1;
    pool.push(canvas);
  }

  function drop(s: Sprite): void {
    if (s.sheet) {
      if (--s.sheet.refs === 0 && 'close' in s.image) s.image.close();
      return;
    }
    if ('close' in s.image) s.image.close();
    else release(s.image);
  }

  const keyOf = (text: string, q: number, color: string): string => `${text}|${q}|${color}`;
  const tcOf = (key: string): [string, number] => {
    const a = key.lastIndexOf('|');
    const b = key.lastIndexOf('|', a - 1);
    return [`${key.slice(0, b)}|${key.slice(a + 1)}`, Number(key.slice(b + 1, a))];
  };

  /** Drop least recently used sprites while over either limit; the newest always stays. */
  function evict(): void {
    while (sprites.size > 1 && (sprites.size > limit || bytes > maxBytes)) {
      const oldest = sprites.keys().next().value!;
      const evicted = sprites.get(oldest)!;
      sprites.delete(oldest);
      bytes -= evicted.bytes;
      const [tc, q] = tcOf(oldest);
      const list = sizes.get(tc);
      if (list) {
        const at = list.indexOf(q);
        if (at >= 0) list.splice(at, 1);
        if (list.length === 0) sizes.delete(tc);
      }
      drop(evicted);
    }
  }

  function insert(key: string, s: Sprite): void {
    sprites.set(key, s);
    bytes += s.bytes;
    const [tc, q] = tcOf(key);
    const list = sizes.get(tc);
    if (list) list.push(q);
    else sizes.set(tc, [q]);
    if (bytes > bench.__peakBytes) bench.__peakBytes = bytes;
    evict();
  }

  function exact(text: string, q: number, color: string): Sprite {
    const key = keyOf(text, q, color);
    let s = sprites.get(key);
    if (s) {
      sprites.delete(key);
      sprites.set(key, s);
    } else {
      s = render(text, q, color);
      insert(key, s);
    }
    return s;
  }

  function blit(g: CanvasRenderingContext2D, s: Sprite, k: number, x: number, y: number, rot: number): void {
    bench.__draws++;
    const sd = s as Sprite & { drawn?: boolean };
    if (!sd.drawn) {
      sd.drawn = true;
      const b2 = bench as unknown as { __firstDraws: number };
      b2.__firstDraws = (b2.__firstDraws ?? 0) + 1;
    }
    const cos = Math.cos(rot) * k;
    const sin = Math.sin(rot) * k;
    g.setTransform(dpr * cos, dpr * sin, -dpr * sin, dpr * cos, dpr * x, dpr * y);
    if (s.sheet) g.drawImage(s.image, s.sx!, s.sy!, s.sw!, s.sh!, -s.w / 2, -s.h / 2, s.w, s.h);
    else g.drawImage(s.image, -s.w / 2, -s.h / 2, s.w, s.h);
  }

  const cache: SpriteCache = {
    get size() {
      return sprites.size;
    },
    get bytes() {
      return bytes;
    },
    setScale(next) {
      if (next === dpr) return;
      dpr = next;
      for (const s of sprites.values()) drop(s);
      sprites.clear();
      sizes.clear();
      pool.length = 0;
      bytes = 0;
    },
    has(text, px, color) {
      return sprites.has(keyOf(text, Math.round(px / STEP) * STEP, color));
    },
    draw(g, text, px, color, x, y, rot) {
      const q = Math.round(px / STEP) * STEP;
      if (!sprites.has(keyOf(text, q, color))) {
        const b2 = bench as unknown as { __restMiss: number; __restNear: number };
        b2.__restMiss = (b2.__restMiss ?? 0) + 1;
        const list = sizes.get(`${text}|${color}`);
        if (list && list.some((o) => Math.abs(o - q) <= 1)) b2.__restNear = (b2.__restNear ?? 0) + 1;
      }
      // Draw at the exact px: the bitmap was rendered at the rounded one.
      blit(g, exact(text, q, color), px / q, x, y, rot);
    },
    drawNear(g, text, px, color, x, y, rot) {
      const q0 = Math.round(px / STEP) * STEP;
      const key = keyOf(text, q0, color);
      if (sprites.has(key)) {
        blit(g, exact(text, q0, color), px / q0, x, y, rot);
        return;
      }
      const list = sizes.get(`${text}|${color}`);
      if (!list || list.length === 0) {
        bench.__nearMiss++;
        blit(g, exact(text, q0, color), px / q0, x, y, rot);
        return;
      }
      let up = Infinity;
      let down = -Infinity;
      for (const q of list) {
        if (q >= q0 && q < up) up = q;
        if (q < q0 && q > down) down = q;
      }
      const q = up !== Infinity ? up : down;
      bench.__near++;
      if (q < q0) {
        bench.__up++;
        bench.__upMax = Math.max(bench.__upMax, px / q);
      }
      blit(g, exact(text, q, color), px / q, x, y, rot);
    },
    drawMip(g, text, px, color, x, y, rot) {
      let q = MIP_TOP;
      if (px > MIP_TOP) q = Math.round(px / STEP) * STEP;
      else while (q / 2 >= px && q > 1.5) q /= 2;
      blit(g, exact(text, q, color), px / q, x, y, rot);
    },
    warm(items, sheet) {
      const todo: WarmItem[] = [];
      const seen = new Set<string>();
      for (const it of items) {
        const q = Math.round(it.px / STEP) * STEP;
        const key = keyOf(it.text, q, it.color);
        if (sprites.has(key) || seen.has(key)) continue;
        seen.add(key);
        todo.push({ text: it.text, px: q, color: it.color });
      }
      if (todo.length === 0) return 0;
      bench.__warmed += todo.length;
      if (sheet) {
        // Oldest first in the LRU, so the view on screen (drawn after) stays newest.
        for (const [key, s] of renderSheet(todo)) {
          const old = sprites.get(key);
          if (old) continue;
          // Insert at the front of the LRU order: re-inserting everything else would be costly, so append.
          insert(key, s);
        }
      } else {
        for (const it of todo) insert(keyOf(it.text, it.px, it.color), render(it.text, it.px, it.color));
      }
      return todo.length;
    },
  };
  bench.__sprites = () => ({ size: sprites.size, bytes });
  return cache;
}
