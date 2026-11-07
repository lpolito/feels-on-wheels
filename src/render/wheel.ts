import { label } from '../i18n';
import type { Layout } from '../model/layout';
import { inWindow, viewWindow, type Camera, type Viewport, type ViewWindow } from '../model/geometry';
import type { FillTable, Palette } from './colors';
import { fitLabel, labelRotation, type Measure } from './labels';

export interface Frame {
  cam: Camera;
  vp: Viewport;
  lit: Uint8Array;
  prevLit: Uint8Array;
  /** 0..1 cross-fade progress from prevLit to lit. */
  fadeT: number;
  focused: number | null;
  showFocus: boolean;
  mode: 'overview' | 'ring';
  remPx: number;
  /** prefers-contrast: more → thicker gaps. */
  moreContrast?: boolean;
}

export interface WheelRenderer {
  resize(cssW: number, cssH: number, dpr: number): void;
  setColors(t: FillTable, p: Palette): void;
  draw(f: Frame): void;
  stats: { segmentsDrawn: number; labelsDrawn: number };
}

const FONT_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const MEASURE_PX = 100;
const LABEL_PAD = 6;
const LINE_HEIGHT = 1.15;
const GAP_PX = 1.5;
const GAP_PX_MORE = 2.5;
const FOCUS_PX = 1.5;
const FOCUS_RING_PX = 4;

interface LabelCache { w: number; h: number; min: number; max: number; result: { lines: string[]; px: number } | null }

export function createWheelRenderer(canvas: HTMLCanvasElement, layout: Layout, ctx?: CanvasRenderingContext2D): WheelRenderer {
  const g = ctx ?? canvas.getContext('2d', { alpha: false })!;
  const texts = layout.segments.map((s) => label(s.feelingId));
  const widthAt100 = new Map<string, number>();
  const fonts = new Map<number, string>();
  const labelCache: (LabelCache | null)[] = layout.segments.map(() => null);
  const win: ViewWindow = { rMin: 0, rMax: 0, full: true, from: 0, to: 0 };
  let cssW = 0;
  let cssH = 0;
  let dpr = 1;
  let table: FillTable | null = null;
  let palette: Palette | null = null;
  const stats = { segmentsDrawn: 0, labelsDrawn: 0 };

  const font = (px: number): string => {
    let f = fonts.get(px);
    if (f === undefined) {
      f = `600 ${px}px ${FONT_STACK}`;
      fonts.set(px, f);
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
    const qw = Math.round(w * 2) / 2;
    const qh = Math.round(h * 2) / 2;
    const c = labelCache[i];
    if (c && c.w === qw && c.h === qh && c.min === min && c.max === max) return c.result;
    const result = fitLabel(texts[i]!, measure, { width: qw, height: qh }, { min, max });
    labelCache[i] = { w: qw, h: qh, min, max, result };
    return result;
  }

  return {
    stats,
    resize(w, h, ratio) {
      cssW = w;
      cssH = h;
      dpr = ratio;
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
      if (!table || !palette) return;
      const { cam, vp } = f;
      const R = vp.radius * cam.scale;
      const k = f.remPx / 16;
      const minPx = (f.mode === 'ring' ? 12 : 8) * k;
      const maxPx = Math.min(Math.max(16 * k * cam.scale, 16 * k), 24 * k);
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
        if (!inWindow(s, ring, win)) continue;
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
        if (!inWindow(s, ring, win)) continue;
        const rMid = ((ring.inner + ring.outer) / 2) * R;
        const fit = fitted(s.index, (ring.outer - ring.inner) * R - 2 * LABEL_PAD, (s.end - s.start) * rMid, minPx, maxPx);
        if (!fit) continue;
        const angle = s.mid + cam.rotation;
        const x = cam.cx + rMid * Math.cos(angle);
        const y = cam.cy + rMid * Math.sin(angle);
        if (x < -rMid || y < -rMid || x > cssW + rMid || y > cssH + rMid) continue;
        const rot = labelRotation(angle);
        const cos = Math.cos(rot);
        const sin = Math.sin(rot);
        g.setTransform(dpr * cos, dpr * sin, -dpr * sin, dpr * cos, dpr * x, dpr * y);
        const lit = f.fadeT >= 0.5 ? f.lit[s.index] === 1 : f.prevLit[s.index] === 1;
        g.fillStyle = table.label(s.hue, s.ring, lit);
        g.font = font(fit.px);
        const lineGap = fit.px * LINE_HEIGHT;
        const top = -((fit.lines.length - 1) * lineGap) / 2;
        for (let l = 0; l < fit.lines.length; l++) g.fillText(fit.lines[l]!, 0, top + l * lineGap);
        stats.labelsDrawn++;
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (f.showFocus && f.focused !== null) {
        const s = layout.segments[f.focused]!;
        const ring = layout.rings[s.ring]!;
        if (inWindow(s, ring, win)) {
          const inset = FOCUS_RING_PX / 2;
          sector(cam.cx, cam.cy, ring.inner * R + inset, ring.outer * R - inset,
            s.start + cam.rotation + inset / (ring.outer * R), s.end + cam.rotation - inset / (ring.outer * R));
          // Two-tone ring: the segment's label color is ≥4.5:1 against its fill, so the indicator always
          // shows (WCAG 1.4.11); the thin --focus line on top keeps the familiar focus color.
          g.lineWidth = FOCUS_RING_PX;
          g.strokeStyle = table.label(s.hue, s.ring, true);
          g.stroke();
          g.lineWidth = FOCUS_PX;
          g.strokeStyle = palette.focus;
          g.stroke();
        }
      }
    },
  };
}
