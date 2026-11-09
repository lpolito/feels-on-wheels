type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export interface SpriteCache {
  /** Draws `text` centered at (x, y) in CSS px, rotated by `rot`, from a cached bitmap. */
  draw(g: CanvasRenderingContext2D, text: string, px: number, color: string, x: number, y: number, rot: number): void;
  /** Device pixel ratio the bitmaps are rendered at; changing it drops every sprite. */
  setScale(dpr: number): void;
  readonly size: number;
}

interface Sprite { canvas: AnyCanvas; w: number; h: number }

const STEP = 0.5;
const PAD = 2;
const HEIGHT = 1.4;
const POOL = 64;
/** Spec v1.2 §7: the cache's total backing store (width × height × 4 bytes). */
const MAX_BYTES = 16 * 1024 * 1024;

const bytesOf = (c: AnyCanvas): number => c.width * c.height * 4;

const canvasElement = (w: number, h: number): AnyCanvas =>
  Object.assign(document.createElement('canvas'), { width: w, height: h });

/**
 * Spec §7: label text rendered once per (label, px, color) and blitted with drawImage, because Firefox re-rasterises
 * rotated fillText on every frame. Keyed on px rounded to 0.5. Least recently used sprites go once there are more
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
    return { canvas, w, h };
  }

  /** Drop least recently used sprites while over either limit; the newest always stays. */
  function evict(): void {
    while (sprites.size > 1 && (sprites.size > limit || bytes > maxBytes)) {
      const oldest = sprites.keys().next().value!;
      const evicted = sprites.get(oldest)!;
      sprites.delete(oldest);
      bytes -= bytesOf(evicted.canvas);
      if (pool.length < POOL) {
        // Shrink it so a pooled canvas holds no backing store of its own.
        evicted.canvas.width = 1;
        evicted.canvas.height = 1;
        pool.push(evicted.canvas);
      }
    }
  }

  return {
    get size() {
      return sprites.size;
    },
    setScale(next) {
      if (next === dpr) return;
      dpr = next;
      sprites.clear();
      pool.length = 0;
      bytes = 0;
    },
    draw(g, text, px, color, x, y, rot) {
      const q = Math.round(px / STEP) * STEP;
      const key = `${text}|${q}|${color}`;
      let s = sprites.get(key);
      if (s) {
        sprites.delete(key);
        sprites.set(key, s);
      } else {
        s = render(text, q, color);
        sprites.set(key, s);
        bytes += bytesOf(s.canvas);
        evict();
      }
      // Draw at the exact px: the bitmap was rendered at the rounded one.
      const k = px / q;
      const cos = Math.cos(rot) * k;
      const sin = Math.sin(rot) * k;
      g.setTransform(dpr * cos, dpr * sin, -dpr * sin, dpr * cos, dpr * x, dpr * y);
      g.drawImage(s.canvas, -s.w / 2, -s.h / 2, s.w, s.h);
    },
  };
}
