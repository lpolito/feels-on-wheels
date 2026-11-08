import { nodeLabel } from '../i18n';
import type { Layout } from '../model/layout';
import { inWindow, viewWindow, type Camera, type Viewport, type ViewWindow } from '../model/geometry';
import type { FillTable, Palette } from './colors';
import { fitLabel, labelRotation, type Measure } from './labels';
import { LIFT_RADIAL_PX, LIFT_SIDE_PX, OUTLINE_INNER_PX, OUTLINE_PX } from './selection';
import type { SpriteCache } from './sprites';

export interface Frame {
  cam: Camera;
  vp: Viewport;
  lit: Uint8Array;
  prevLit: Uint8Array;
  /** 0..1 cross-fade progress from prevLit to lit. */
  fadeT: number;
  selected: number | null;
  /** The selection is opened: drawn lifted, with a shadow and a larger label. */
  opened: boolean;
  /** 0..1 progress of the open pulse (1 = done). */
  pulseT: number;
  mode: 'wheel' | 'ring';
  remPx: number;
  /** prefers-contrast: more → thicker gaps. */
  moreContrast?: boolean;
}

export interface WheelRenderer {
  resize(cssW: number, cssH: number, dpr: number): void;
  setColors(t: FillTable, p: Palette): void;
  draw(f: Frame): void;
  stats: { segmentsDrawn: number; labelsDrawn: number; labelFits: number };
}

const FONT_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
/** The regular label font, shared with the sprite cache. */
export const labelFont = (px: number): string => `600 ${px}px ${FONT_STACK}`;
const MEASURE_PX = 100;
const LABEL_PAD = 6;
const LINE_HEIGHT = 1.15;
const GAP_PX = 1.5;
const GAP_PX_MORE = 2.5;
/** Spec §4.2 selection treatments (sizes shared with the camera in ./selection). */
const LIFT_LABEL = 1.15;
const SHADOW = { blur: 12, color: 'rgba(0,0,0,.35)', offsetY: 3 } as const;
const PULSE_FROM = 0.96;
const CHEVRON_INSIDE_MIN_ARC = 22;
const CHEVRON_HALF = 4;
const CHEVRON_OFFSET = 9;
/** Label box px given up at the outer end to an inside chevron. */
const CHEVRON_ROOM = 14;
/** The selection's chevron fits inside the cell when the outer arc is long enough. */
const chevronInside = (width: number, outerR: number): boolean => width * outerR >= CHEVRON_INSIDE_MIN_ARC;
/** Label fits are reused while the box stays within this many px (pinch frames). */
const FIT_TOLERANCE = 1;
const WHITE = '#ffffff';

interface LabelCache { w: number; h: number; min: number; max: number; result: { lines: string[]; px: number } | null }

const easeOut = (t: number): number => 1 - (1 - t) ** 3;

/** `sprites`: optional label bitmap cache (spec §7); every label but the opened one is blitted from it. */
export function createWheelRenderer(
  canvas: HTMLCanvasElement, layout: Layout, ctx?: CanvasRenderingContext2D, sprites?: SpriteCache,
): WheelRenderer {
  const g = ctx ?? canvas.getContext('2d', { alpha: false })!;
  const texts = layout.segments.map((s) => nodeLabel(s.node));
  const widthAt100 = new Map<string, number>();
  const fonts = new Map<number, string>();
  const labelCache: (LabelCache | null)[] = layout.segments.map(() => null);
  const win: ViewWindow = { rMin: 0, rMax: 0, full: true, from: 0, to: 0 };
  let cssW = 0;
  let cssH = 0;
  let dpr = 1;
  let table: FillTable | null = null;
  let palette: Palette | null = null;
  const stats = { segmentsDrawn: 0, labelsDrawn: 0, labelFits: 0 };
  const boldFonts = new Map<number, string>();

  const font = (px: number, bold = false): string => {
    const cache = bold ? boldFonts : fonts;
    let f = cache.get(px);
    if (f === undefined) {
      f = bold ? `800 ${px}px ${FONT_STACK}` : labelFont(px);
      cache.set(px, f);
    }
    return f;
  };
  const measure: Measure = (text, px) => {
    let w = widthAt100.get(text);
    if (w === undefined) {
      g.font = font(MEASURE_PX);
      w = g.measureText(text).width;
      widthAt100.set(text, w);
    }
    return (w * px) / MEASURE_PX;
  };

  function sector(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): void {
    g.beginPath();
    g.arc(cx, cy, r1, a0, a1);
    g.arc(cx, cy, r0, a1, a0, true);
    g.closePath();
  }

  function fitted(i: number, w: number, h: number, min: number, max: number): LabelCache['result'] {
    const c = labelCache[i];
    if (c && Math.abs(c.w - w) <= FIT_TOLERANCE && Math.abs(c.h - h) <= FIT_TOLERANCE && c.min === min && c.max === max) {
      return c.result;
    }
    stats.labelFits++;
    const result = fitLabel(texts[i]!, measure, { width: w, height: h }, { min, max });
    labelCache[i] = { w, h, min, max, result };
    return result;
  }

  function drawLabel(lines: string[], px: number, bold: boolean, x: number, y: number, angle: number, scale: number, color: string): void {
    const rot = labelRotation(angle);
    // Forced colours draw live: system colours must resolve on the page canvas, and stay current on theme change.
    if (sprites && !bold && !palette?.forced) {
      // Each line's centre, offset along the label's rotated vertical axis.
      const lineGap = px * LINE_HEIGHT;
      const top = -((lines.length - 1) * lineGap) / 2;
      const ux = -Math.sin(rot);
      const uy = Math.cos(rot);
      for (let l = 0; l < lines.length; l++) {
        const dy = top + l * lineGap;
        sprites.draw(g, lines[l]!, px, color, x + ux * dy, y + uy * dy, rot);
      }
      stats.labelsDrawn++;
      return;
    }
    const cos = Math.cos(rot) * scale;
    const sin = Math.sin(rot) * scale;
    g.setTransform(dpr * cos, dpr * sin, -dpr * sin, dpr * cos, dpr * x, dpr * y);
    g.fillStyle = color;
    g.font = font(px, bold);
    const lineGap = px * LINE_HEIGHT;
    const top = -((lines.length - 1) * lineGap) / 2;
    for (let l = 0; l < lines.length; l++) g.fillText(lines[l]!, 0, top + l * lineGap);
    stats.labelsDrawn++;
  }

  /**
   * Two-tone outline: ink on the edge, a gap-coloured line just inside it. The line sits a fixed distance inside
   * every edge (spec v1.2 §4.4): each arc gets its own angular inset, distance / radius, so the sides stay
   * parallel to the cell's on every ring.
   */
  function outline(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number, ink: string, gap: string): void {
    sector(cx, cy, r0, r1, a0, a1);
    g.lineWidth = OUTLINE_PX;
    g.strokeStyle = ink;
    g.stroke();
    const inset = OUTLINE_PX / 2 + OUTLINE_INNER_PX / 2;
    const rIn = r0 + inset;
    const rOut = r1 - inset;
    if (rOut <= rIn) return;
    const daOut = inset / rOut;
    const daIn = inset / Math.max(rIn, 1);
    // Too narrow for the inner line at its inner arc: skip it rather than draw it crossed over.
    if (a1 - a0 <= 2 * daIn) return;
    g.beginPath();
    g.arc(cx, cy, rOut, a0 + daOut, a1 - daOut);
    g.arc(cx, cy, rIn, a1 - daIn, a0 + daIn, true);
    g.closePath();
    g.lineWidth = OUTLINE_INNER_PX;
    g.strokeStyle = gap;
    g.stroke();
  }

  /** A small outward-pointing chevron at radius r on the cell's mid angle (decoration only). */
  function chevron(cx: number, cy: number, r: number, angle: number, color: string): void {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const at = (dr: number, dt: number): [number, number] => [cx + (r + dr) * cos - dt * sin, cy + (r + dr) * sin + dt * cos];
    g.beginPath();
    g.moveTo(...at(-CHEVRON_HALF / 2, -CHEVRON_HALF));
    g.lineTo(...at(CHEVRON_HALF / 2, 0));
    g.lineTo(...at(-CHEVRON_HALF / 2, CHEVRON_HALF));
    g.lineWidth = 2;
    g.lineCap = 'round';
    g.strokeStyle = color;
    g.stroke();
  }

  return {
    stats,
    resize(w, h, ratio) {
      cssW = w;
      cssH = h;
      dpr = ratio;
      sprites?.setScale(ratio);
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);
    },
    setColors(t, p) {
      table = t;
      palette = p;
    },
    draw(f) {
      stats.segmentsDrawn = 0;
      stats.labelsDrawn = 0;
      stats.labelFits = 0;
      if (!table || !palette) return;
      const { cam, vp } = f;
      const R = vp.radius * cam.scale;
      const k = f.remPx / 16;
      const minPx = (f.mode === 'ring' ? 12 : 8) * k;
      // Quantised so pinch frames keep reusing label fits.
      const maxPx = Math.floor(Math.min(Math.max(16 * k * cam.scale, 16 * k), 24 * k) * 2) / 2;
      const lifted = f.opened ? f.selected : null;
      viewWindow(cam, vp, win);

      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.globalAlpha = 1;
      g.fillStyle = palette.bg;
      g.fillRect(0, 0, cssW, cssH);
      g.lineWidth = f.moreContrast ? GAP_PX_MORE : GAP_PX;
      g.strokeStyle = palette.gap;
      g.lineJoin = 'round';

      for (const s of layout.segments) {
        const ring = layout.rings[s.ring]!;
        if (s.index === lifted || !inWindow(s, ring, win)) continue;
        const a0 = s.start + cam.rotation;
        const a1 = s.end + cam.rotation;
        sector(cam.cx, cam.cy, ring.inner * R, ring.outer * R, a0, a1);
        const now = f.lit[s.index] === 1;
        const before = f.prevLit[s.index] === 1;
        if (now === before || f.fadeT >= 1) {
          g.fillStyle = table.fill(s.hue, s.ring, now);
          g.fill();
        } else {
          g.fillStyle = table.fill(s.hue, s.ring, before);
          g.fill();
          g.globalAlpha = f.fadeT;
          g.fillStyle = table.fill(s.hue, s.ring, now);
          g.fill();
          g.globalAlpha = 1;
        }
        g.stroke();
        stats.segmentsDrawn++;
      }

      g.textAlign = 'center';
      g.textBaseline = 'middle';
      for (const s of layout.segments) {
        const ring = layout.rings[s.ring]!;
        if (s.index === lifted || !inWindow(s, ring, win)) continue;
        let rMid = ((ring.inner + ring.outer) / 2) * R;
        const angle = s.mid + cam.rotation;
        let x = cam.cx + rMid * Math.cos(angle);
        let y = cam.cy + rMid * Math.sin(angle);
        if (x < -rMid || y < -rMid || x > cssW + rMid || y > cssH + rMid) continue;
        const boxLen = (ring.outer - ring.inner) * R - 2 * LABEL_PAD;
        let fit = fitted(s.index, boxLen, (s.end - s.start) * rMid, minPx, maxPx);
        if (!fit) continue;
        // A selected cell's inside chevron needs CHEVRON_ROOM px at the label box's outer end (spec v1.2 §4.4). The
        // label stays put unless its text reaches that room; only then does it move inward and refit.
        if (s.index === f.selected && !f.opened && chevronInside(s.end - s.start, ring.outer * R)) {
          const len = Math.max(...fit.lines.map((l) => measure(l, fit!.px)));
          if (len / 2 > boxLen / 2 - CHEVRON_ROOM) {
            rMid -= CHEVRON_ROOM / 2;
            fit = fitted(s.index, boxLen - CHEVRON_ROOM, (s.end - s.start) * rMid, minPx, maxPx);
            if (!fit) continue;
            x = cam.cx + rMid * Math.cos(angle);
            y = cam.cy + rMid * Math.sin(angle);
          }
        }
        const lit = f.fadeT >= 0.5 ? f.lit[s.index] === 1 : f.prevLit[s.index] === 1;
        drawLabel(fit.lines, fit.px, false, x, y, angle, 1, table.label(s.hue, s.ring, lit));
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (f.selected === null) return;
      const s = layout.segments[f.selected]!;
      const ring = layout.rings[s.ring]!;
      if (!inWindow(s, ring, win)) return;
      const ink = palette.outline;
      const a0 = s.start + cam.rotation;
      const a1 = s.end + cam.rotation;
      const angle = s.mid + cam.rotation;

      if (!f.opened) {
        outline(cam.cx, cam.cy, ring.inner * R, ring.outer * R, a0, a1, ink, palette.gap);
        if (chevronInside(s.end - s.start, ring.outer * R)) {
          chevron(cam.cx, cam.cy, ring.outer * R - CHEVRON_OFFSET, angle, palette.forced ? ink : WHITE);
        } else {
          chevron(cam.cx, cam.cy, ring.outer * R + CHEVRON_OFFSET, angle, ink);
        }
        return;
      }

      // Opened: lifted past its ring, with one shadow, pulsing in about its centre.
      const r0 = Math.max(0, ring.inner * R - LIFT_RADIAL_PX);
      const r1 = ring.outer * R + LIFT_RADIAL_PX;
      const rMid = ((ring.inner + ring.outer) / 2) * R;
      const side = LIFT_SIDE_PX / Math.max(rMid, 1);
      const p = PULSE_FROM + (1 - PULSE_FROM) * easeOut(Math.min(Math.max(f.pulseT, 0), 1));
      const x = cam.cx + rMid * Math.cos(angle);
      const y = cam.cy + rMid * Math.sin(angle);
      g.setTransform(dpr * p, 0, 0, dpr * p, dpr * (x - p * x), dpr * (y - p * y));
      sector(cam.cx, cam.cy, r0, r1, a0 - side, a1 + side);
      g.shadowColor = SHADOW.color;
      g.shadowBlur = SHADOW.blur;
      g.shadowOffsetY = SHADOW.offsetY;
      g.fillStyle = table.fill(s.hue, s.ring, true);
      g.fill();
      g.shadowBlur = 0;
      g.shadowOffsetY = 0;
      g.shadowColor = 'transparent';
      outline(cam.cx, cam.cy, r0, r1, a0 - side, a1 + side, ink, palette.gap);
      const fit = fitted(s.index, (ring.outer - ring.inner) * R - 2 * LABEL_PAD, (s.end - s.start) * rMid, minPx, maxPx);
      if (fit) drawLabel(fit.lines, fit.px * LIFT_LABEL, true, x, y, angle, p, table.label(s.hue, s.ring, true));
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
  };
}
