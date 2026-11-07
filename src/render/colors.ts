export interface Palette {
  bg: string;
  fg: string;
  gap: string;
  focus: string;
  /** Selection outline colour: ink in light, white in dark, Highlight in forced colours. */
  outline: string;
  /** The card's background (--surface); 'Canvas' in forced colours. */
  surface: string;
  hues: Record<string, string>;
  /** Windows high-contrast mode: values are CSS system color keywords, not hex. */
  forced?: boolean;
}

const HUE_PREFIX = '--hue-';
const HUE_NAMES = ['fearful', 'angry', 'disgusted', 'sad', 'happy', 'surprised', 'bad'];

export function readPalette(el: Element): Palette {
  if (typeof matchMedia !== 'undefined' && matchMedia('(forced-colors: active)').matches) {
    return {
      bg: 'Canvas', fg: 'CanvasText', gap: 'CanvasText', focus: 'Highlight', outline: 'Highlight', surface: 'Canvas',
      forced: true,
      hues: Object.fromEntries(HUE_NAMES.map((h) => [h, 'Canvas'])),
    };
  }
  const cs = getComputedStyle(el);
  const v = (name: string) => cs.getPropertyValue(name).trim().toLowerCase();
  return {
    bg: v('--bg'), fg: v('--fg'), gap: v('--gap'), focus: v('--focus'), outline: v('--outline'), surface: v('--surface'),
    hues: Object.fromEntries(HUE_NAMES.map((h) => [h, v(HUE_PREFIX + h)])),
  };
}

type RGB = [number, number, number];

function parseHex(hex: string): RGB {
  const digits = hex.trim().slice(1);
  const full = digits.length === 3 ? [...digits].map((d) => d + d).join('') : digits;
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: RGB): string {
  const c = (x: number) => Math.round(Math.min(255, Math.max(0, x))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

const toLinear = (c: number): number => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (l: number): number => {
  const c = Math.min(1, Math.max(0, l));
  return 255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);
};

function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map(toLinear) as RGB;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2 contrast ratio. */
export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Shift OKLab lightness by dL (≈ OKLCH L), clamping back into sRGB. */
export function shade(hex: string, dL: number): string {
  if (dL === 0) return toHex(parseHex(hex));
  const [r, g, b] = parseHex(hex).map(toLinear) as RGB;
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s + dL;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const l2 = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m2 = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s2 = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return toHex([
    fromLinear(4.0767416621 * l2 - 3.3077115913 * m2 + 0.2309699292 * s2),
    fromLinear(-1.2684380046 * l2 + 2.6097574011 * m2 - 0.3413193965 * s2),
    fromLinear(-0.0041960863 * l2 - 0.7034186147 * m2 + 1.707614701 * s2),
  ]);
}

/** Linear interpolation in sRGB: t=0 → a, t=1 → b. */
export function mix(a: string, b: string, t: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  return toHex([0, 1, 2].map((i) => ca[i]! + (cb[i]! - ca[i]!) * t) as RGB);
}

export interface FillTable {
  fill(hue: string, ring: number, lit: boolean): string;
  label(hue: string, ring: number, lit: boolean): string;
}

const WHITE = '#ffffff';

/** Darken `base` in OKLab-L steps until white text on it reaches `min` (spec §4.1). */
export function fitWhite(base: string, min = 4.8): string {
  let c = shade(base, 0);
  for (let dL = 0; contrast(WHITE, c) < min && dL > -1; ) {
    dL -= 0.004;
    c = shade(base, dL);
  }
  return c;
}

/** Card hover ink (spec v1.2 §5.2): rows tint their hover background with this much of the ink. */
const ROW_TINT = 0.08;
const INK_MIN = 4.5;

/**
 * Text colour for a feeling on the card surface: the base hue shifted in OKLab L (darker in light, lighter in dark)
 * until ≥ 4.5:1 against `surface`, and against a hovered row's faint tint of itself.
 */
export function inkFor(base: string, theme: 'light' | 'dark', surface: string): string {
  const step = theme === 'light' ? -0.004 : 0.004;
  const ok = (c: string): boolean => contrast(c, surface) >= INK_MIN && contrast(c, mix(surface, c, ROW_TINT)) >= INK_MIN;
  let c = shade(base, 0);
  for (let dL = 0; !ok(c) && Math.abs(dL) < 1; ) {
    dL += step;
    c = shade(base, dL);
  }
  return c;
}

/** Per-ring OKLab-L shift after fitting (core, middle, outer). */
const RING_SHIFT = [-0.07, -0.035, 0];
const FADE_GREY = { light: '#8d8a93', dark: '#3a383e' } as const;
const FADE = 0.72;

export function buildFillTable(
  p: Palette, rings: number, theme: 'light' | 'dark', o: { moreContrast: boolean } = { moreContrast: false },
): FillTable {
  if (p.forced) {
    return {
      fill: () => 'Canvas',
      label: (_h, _r, lit) => (lit ? 'CanvasText' : 'GrayText'),
    };
  }
  // Per hue: [ring*2 + (lit ? 1 : 0)] → precomputed string.
  const fills = new Map<string, string[]>();
  const labels = new Map<string, string[]>();
  for (const [hue, base] of Object.entries(p.hues)) {
    const fitted = fitWhite(base);
    const f: string[] = [];
    const l: string[] = [];
    for (let ring = 0; ring < rings; ring++) {
      const lit = shade(fitted, RING_SHIFT[Math.min(ring, RING_SHIFT.length - 1)]!);
      const mixed = mix(lit, FADE_GREY[theme], FADE);
      // More contrast: faded labels are plain white, so the faded fill is darkened just enough for 4.5:1.
      const faded = o.moreContrast ? fitWhite(mixed, 4.5) : mixed;
      f[ring * 2] = faded;
      f[ring * 2 + 1] = lit;
      l[ring * 2] = o.moreContrast ? WHITE : mix(WHITE, faded, 0.2);
      l[ring * 2 + 1] = WHITE;
    }
    fills.set(hue, f);
    labels.set(hue, l);
  }
  return {
    fill: (hue, ring, lit) => fills.get(hue)![ring * 2 + (lit ? 1 : 0)]!,
    label: (hue, ring, lit) => labels.get(hue)![ring * 2 + (lit ? 1 : 0)]!,
  };
}
