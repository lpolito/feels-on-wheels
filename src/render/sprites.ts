type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export interface SpriteCache {
  /** Draws `text` centered at (x, y) in CSS px, rotated by `rot`, from a cached bitmap. */
  draw(g: CanvasRenderingContext2D, text: string, px: number, color: string, x: number, y: number, rot: number): void;
  /** Device pixel ratio the bitmaps are rendered at; changing it drops every sprite. */
  setScale(dpr: number): void;
  /** P2: starts a frame; while `moving`, a label whose size isn't cached may be drawn from a nearby larger one. */
  frame(moving: boolean): void;
  /** P2: some label this frame was drawn from a nearby larger size; draw again so it gets its exact one. */
  readonly approximate: boolean;
  readonly size: number;
}

/** `image` is an ImageBitmap where the canvas can hand one over, else the canvas itself. */
interface Sprite { image: ImageBitmap | AnyCanvas; w: number; h: number; bytes: number }

const STEP = 0.5;
const PAD = 2;
const HEIGHT = 1.4;
const POOL = 64;
/** Spec v1.2 §7: the cache's total backing store (width × height × 4 bytes). */
const MAX_BYTES = 16 * 1024 * 1024;
/** P2: while moving, a size not cached may be drawn from a cached bitmap up to this much larger. */
const TOL = Number(import.meta.env.VITE_P2_TOL ?? 0.3);
/** P2 "ahead": while moving, a size with no larger neighbor is rendered this much larger (0 = exact). */
const AHEAD = Number(import.meta.env.VITE_P2_AHEAD ?? 0);
const COUNT = import.meta.env.VITE_COUNT === '1';
/** P2 "b": at rest, at most this many labels are rendered exact per frame; the rest keep standing in (0 = no limit). */
const BUDGET = Number(import.meta.env.VITE_P2_BUDGET ?? 0);

const canvasElement = (w: number, h: number): AnyCanvas =>
  Object.assign(document.createElement('canvas'), { width: w, height: h });

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
  const pool: AnyCanvas[] = [];
  let bytes = 0;
  let dpr = 1;
  let make = makeCanvas;
  let moving = false;
  let approximate = false;
  let budget = 0;

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

  function render(text: string, px: number, color: string): Sprite {
    if (COUNT) (globalThis as { __renders?: number }).__renders = ((globalThis as { __renders?: number }).__renders ?? 0) + 1;
    const { canvas, g } = context();
    g.font = font(px);
    const w = g.measureText(text).width + 2 * PAD;
    const h = px * HEIGHT + 2 * PAD;
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
    release(canvas);
    return { image, w, h, bytes };
  }

  /** Back to the pool, shrunk so a pooled canvas holds no backing store of its own. */
  function release(canvas: AnyCanvas): void {
    if (pool.length >= POOL) return;
    canvas.width = 1;
    canvas.height = 1;
    pool.push(canvas);
  }

  function drop(s: Sprite): void {
    if ('close' in s.image) s.image.close();
    else release(s.image);
  }

  /** Drop least recently used sprites while over either limit; the newest always stays. */
  function evict(): void {
    while (sprites.size > 1 && (sprites.size > limit || bytes > maxBytes)) {
      const oldest = sprites.keys().next().value!;
      const evicted = sprites.get(oldest)!;
      sprites.delete(oldest);
      bytes -= evicted.bytes;
      drop(evicted);
    }
  }

  return {
    get size() {
      return sprites.size;
    },
    get approximate() {
      return approximate;
    },
    frame(m) {
      moving = m;
      approximate = false;
      budget = BUDGET;
    },
    setScale(next) {
      if (next === dpr) return;
      dpr = next;
      for (const s of sprites.values()) if ('close' in s.image) s.image.close();
      sprites.clear();
      pool.length = 0;
      bytes = 0;
    },
    draw(g, text, px, color, x, y, rot) {
      if (COUNT) (globalThis as { __draws?: number }).__draws = ((globalThis as { __draws?: number }).__draws ?? 0) + 1;
      let q = Math.round(px / STEP) * STEP;
      const key = `${text}|${q}|${color}`;
      let s = sprites.get(key);
      let hitKey = key;
      if (!s && (moving || (BUDGET > 0 && budget <= 0))) {
        // Moving: a bitmap of the same label up to TOL larger stands in, scaled down.
        for (let n = q + STEP; n <= q * (1 + TOL); n += STEP) {
          const k2 = `${text}|${n}|${color}`;
          const t = sprites.get(k2);
          if (t) {
            s = t;
            hitKey = k2;
            q = n;
            break;
          }
        }
        if (COUNT && !s) {
          const G = globalThis as unknown as { __why?: Record<string, number> };
          G.__why ??= {};
          const pre = `${text}|`;
          let smaller = false;
          let any = false;
          for (const k3 of sprites.keys()) if (k3.startsWith(pre) && k3.endsWith(`|${color}`)) { any = true; if (Number(k3.split('|')[1]) < q) smaller = true; }
          const why = !any ? 'none' : smaller ? 'growing-or-gap' : 'larger-beyond-tol';
          G.__why[why] = (G.__why[why] ?? 0) + 1;
        }
        if (s) approximate = true;
        else if (AHEAD > 0) {
          // No larger neighbor: render ahead, so the frames after it (a growing label) can reuse it.
          const up = Math.ceil((q * (1 + AHEAD)) / STEP) * STEP;
          hitKey = `${text}|${up}|${color}`;
          q = up;
          s = sprites.get(hitKey);
          if (!s) {
            s = render(text, up, color);
            sprites.set(hitKey, s);
            bytes += s.bytes;
            evict();
          }
          approximate = true;
        }
      }
      if (s) {
        sprites.delete(hitKey);
        sprites.set(hitKey, s);
      } else {
        budget--;
        s = render(text, q, color);
        sprites.set(key, s);
        bytes += s.bytes;
        evict();
      }
      // Draw at the exact px: the bitmap was rendered at the rounded one.
      const k = px / q;
      const cos = Math.cos(rot) * k;
      const sin = Math.sin(rot) * k;
      g.setTransform(dpr * cos, dpr * sin, -dpr * sin, dpr * cos, dpr * x, dpr * y);
      g.drawImage(s.image, -s.w / 2, -s.h / 2, s.w, s.h);
    },
  };
}
