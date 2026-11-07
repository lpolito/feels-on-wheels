type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;
type Ctx2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export interface SpriteCache {
  /** Draws `text` centred at (x, y) in CSS px, rotated by `rot`, from a cached bitmap. */
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

/**
 * Spec §7: label text rendered once per (label, px, colour) and blitted with drawImage, because Firefox re-rasterises
 * rotated fillText on every frame. Keyed on px rounded to 0.5, limited to `limit` sprites (least recently used out).
 */
export function createSpriteCache(
  makeCanvas: (w: number, h: number) => AnyCanvas, limit = 600, font: (px: number) => string = (px) => `${px}px sans-serif`,
): SpriteCache {
  const sprites = new Map<string, Sprite>();
  const pool: AnyCanvas[] = [];
  let dpr = 1;

  function render(text: string, px: number, color: string): Sprite {
    let canvas = pool.pop() ?? makeCanvas(1, 1);
    let g = canvas.getContext('2d') as Ctx2D | null;
    if (!g) {
      canvas = makeCanvas(1, 1);
      g = canvas.getContext('2d') as Ctx2D;
    }
    g.font = font(px);
    const w = g.measureText(text).width + 2 * PAD;
    const h = px * HEIGHT + 2 * PAD;
    canvas.width = Math.max(1, Math.ceil(w * dpr));
    canvas.height = Math.max(1, Math.ceil(h * dpr));
    // Resizing resets the context state.
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.font = font(px);
    g.fillStyle = color;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(text, w / 2, h / 2);
    return { canvas, w, h };
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
    },
    draw(g, text, px, color, x, y, rot) {
      const q = Math.round(px / STEP) * STEP;
      const key = `${text}|${q}|${color}`;
      let s = sprites.get(key);
      if (s) {
        sprites.delete(key);
      } else {
        s = render(text, q, color);
        if (sprites.size >= limit) {
          const oldest = sprites.keys().next().value!;
          const evicted = sprites.get(oldest)!;
          sprites.delete(oldest);
          if (pool.length < POOL) pool.push(evicted.canvas);
        }
      }
      sprites.set(key, s);
      // Draw at the exact px: the bitmap was rendered at the rounded one.
      const k = px / q;
      const cos = Math.cos(rot) * k;
      const sin = Math.sin(rot) * k;
      g.setTransform(dpr * cos, dpr * sin, -dpr * sin, dpr * cos, dpr * x, dpr * y);
      g.drawImage(s.canvas, -s.w / 2, -s.h / 2, s.w, s.h);
    },
  };
}
