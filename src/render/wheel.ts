import { wheelCellLabel } from '../i18n';
import type { Layout, Segment } from '../model/layout';
import { inWindow, TAU, viewWindow, type Camera, type Viewport, type ViewWindow } from '../model/geometry';
import type { FillTable, Palette } from './colors';
import { fitLabel, labelRotation, type Measure } from './labels';
import { LIFT_RADIAL_PX, LIFT_SIDE_PX, OUTLINE_INNER_PX, OUTLINE_PX } from './selection';
import { labelVariant, type SpriteCache, type WarmItem } from './sprites';

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
  /** The view ring in ring mode, else null: rings outside it get the smaller label floor (spec v2.1 §5). */
  ring: number | null;
  remPx: number;
  /** prefers-contrast: more → thicker gaps. */
  moreContrast?: boolean;
  /**
   * The tree has keyboard focus: with nothing selected, ring the wheel; with a selection, draw its outline in the focus
   * color instead of the usual outline color.
   */
  keyboardFocus: boolean;
  /** EXPLORATION: false while the camera moves or a pinch is held (labels may come from a nearby cached size). */
  exact?: boolean;
}

export interface WheelRenderer {
  resize(cssW: number, cssH: number, dpr: number): void;
  setColors(t: FillTable, p: Palette): void;
  draw(f: Frame): void;
  /** EXPLORATION: the (text, px, color) of every label `f` would draw, without drawing. */
  collect(f: Frame): WarmItem[];
  stats: { segmentsDrawn: number; labelsDrawn: number; labelFits: number; /** Labels drawn per ring this frame. */ labelsByRing: number[]; /** Whether the focus ring was drawn this frame. */ focusRing: boolean; /** Whether the selection's outline was drawn in the focus color this frame. */ focusOutline: boolean };
}

const FONT_STACK = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
/** The regular label font, shared with the sprite cache. */
export const labelFont = (px: number): string => `600 ${px}px ${FONT_STACK}`;
const LABEL_PAD = 6;
const MEASURE_PX = 100;
/** The word each size's extra tracking is read from. */
const TRACK_REF = 'Hamburgefonstiv';
/** Opened-label widths kept before the cache starts over. */
const MEASURE_CACHE_MAX = 4000;
const LINE_HEIGHT = 1.15;
const GAP_PX = 1.5;
const GAP_PX_MORE = 2.5;
/** Spec §4.2 selection treatments (sizes shared with the camera in ./selection). */
const LIFT_LABEL = 1.15;
const SHADOW = { blur: 12, color: 'rgba(0,0,0,.35)', offsetY: 3 } as const;
/** The keyboard-focus ring around the wheel: width, and the gap between it and the outer edge. */
const FOCUS_RING_PX = 3;
const FOCUS_GAP_PX = 2;
const PULSE_FROM = 0.96;
/** Label fits are reused while the box stays within this many px (pinch frames). */
const FIT_TOLERANCE = 1;

interface LabelCache { w: number; h: number; min: number; max: number; wrapAt: number; result: { lines: string[]; px: number } | null }

const easeOut = (t: number): number => 1 - (1 - t) ** 3;

/** `sprites`: optional label bitmap cache (spec §7); every label but the opened one is blitted from it. */
export function createWheelRenderer(
  canvas: HTMLCanvasElement, layout: Layout, ctx?: CanvasRenderingContext2D, sprites?: SpriteCache,
): WheelRenderer {
  const g = ctx ?? canvas.getContext('2d', { alpha: false })!;
  const variant = labelVariant();
  let exactFrame = true;
  const texts = layout.segments.map((s) => wheelCellLabel(s.node));
  const fonts = new Map<number, string>();
  const labelCache: (LabelCache | null)[] = layout.segments.map(() => null);
  const ringCache: ({ R: number; floor: number; max: number; wrapAt: number; px: number } | null)[] =
    layout.rings.map(() => null);
  const win: ViewWindow = { rMin: 0, rMax: 0, full: true, from: 0, to: 0 };
  let cssW = 0;
  let cssH = 0;
  let dpr = 1;
  let table: FillTable | null = null;
  let palette: Palette | null = null;
  const stats = { segmentsDrawn: 0, labelsDrawn: 0, labelFits: 0, labelsByRing: layout.rings.map(() => 0), focusRing: false, focusOutline: false };
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
  /**
   * Known issues, round two: the system font is wider at small sizes than a scale-down from one size predicts (it adds
   * tracking for small text): about 4% at 18 px and 12% at 9 px. Every label's width is its width at 100 px scaled
   * down, plus that size's extra tracking per character, read once per size from a reference word (within about 2%,
   * 3% at worst). The opened label is measured exactly at its size (below), since its clearance is what's seen.
   */
  const widthAt100 = [new Map<string, number>(), new Map<string, number>()];
  const trackAt = [new Map<number, number>(), new Map<number, number>()];
  const at100 = (text: string, bold: boolean): number => {
    const cache = widthAt100[bold ? 1 : 0]!;
    let w = cache.get(text);
    if (w === undefined) {
      g.font = font(MEASURE_PX, bold);
      w = g.measureText(text).width;
      cache.set(text, w);
    }
    return w;
  };
  const track = (px: number, bold: boolean): number => {
    const size = Math.round(px * 4) / 4;
    const cache = trackAt[bold ? 1 : 0]!;
    let t = cache.get(size);
    if (t === undefined) {
      g.font = font(size, bold);
      t = (g.measureText(TRACK_REF).width - (at100(TRACK_REF, bold) * size) / MEASURE_PX) / TRACK_REF.length;
      cache.set(size, t);
    }
    return t;
  };
  const measure: Measure = (text, px) => (at100(text, false) * px) / MEASURE_PX + text.length * track(px, false);
  /** Known-issues spec §5: the opened label is fitted at its own weight, 800, measured exactly at each size. */
  const boldAt = new Map<string, number>();
  const measureBold: Measure = (text, px) => {
    const key = `${px}|${text}`;
    let w = boldAt.get(key);
    if (w === undefined) {
      // A long pinch fits at many sizes: start over rather than grow without end.
      if (boldAt.size >= MEASURE_CACHE_MAX) boldAt.clear();
      g.font = font(px, true);
      w = g.measureText(text).width;
      boldAt.set(key, w);
    }
    return w;
  };
  let openedFit: (LabelCache & { i: number }) | null = null;

  function sector(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): void {
    g.beginPath();
    addSector(cx, cy, r0, r1, a0, a1);
  }

  /** Adds a cell to the current path, as its own closed subpath. */
  function addSector(cx: number, cy: number, r0: number, r1: number, a0: number, a1: number): void {
    g.moveTo(cx + r1 * Math.cos(a0), cy + r1 * Math.sin(a0));
    g.arc(cx, cy, r1, a0, a1);
    g.arc(cx, cy, r0, a1, a0, true);
    g.closePath();
  }

  function fitted(i: number, w: number, h: number, min: number, max: number, wrapAt: number): LabelCache['result'] {
    const c = labelCache[i];
    // EXPLORATION (v12f, v123f): at rest, a fresh fit, so the size doesn't depend on the path the camera took.
    const tol = exactFrame && variant.includes('f') ? 0 : FIT_TOLERANCE;
    if (c && Math.abs(c.w - w) <= tol && Math.abs(c.h - h) <= tol && c.min === min && c.max === max
      && c.wrapAt === wrapAt) {
      return c.result;
    }
    stats.labelFits++;
    const result = fitLabel(texts[i]!, measure, { width: w, height: h }, { min, max, wrapAt });
    labelCache[i] = { w, h, min, max, wrapAt, result };
    return result;
  }

  /**
   * Even labels spec §1 (Lucas, 2026-11-27): every label in a ring is drawn at one size, the biggest that every label
   * in the ring fits at, so no cell's text looks emphasized. Worked out over the whole ring, not just what's on screen,
   * so turning the wheel never changes it; on the 0.5 px grid, so each label fits at exactly that size.
   */
  function ringSize(ringIndex: number, R: number, floor: number, max: number, wrapAt: number): number {
    const c = ringCache[ringIndex];
    // EXPLORATION (v12f): at rest, a fresh size, so it doesn't depend on the path the camera took.
    const tol = exactFrame && variant.includes('f') ? 0 : FIT_TOLERANCE;
    // Reused only while the wheel is as big or a little bigger, so the label that set the size still fits at it.
    if (c && R >= c.R && R - c.R <= tol && c.floor === floor && c.max === max && c.wrapAt === wrapAt) return c.px;
    const px = freshRingSize(ringIndex, R, floor, max, wrapAt);
    // EXPLORATION (sharpening): a fresh fit at rest that gave a size the tolerant reuse wouldn't have.
    if (c && tol === 0 && R >= c.R && R - c.R <= FIT_TOLERANCE && c.floor === floor && c.max === max && c.wrapAt === wrapAt && c.px !== px) {
      const tr = globalThis as unknown as { __freshRing?: number };
      tr.__freshRing = (tr.__freshRing ?? 0) + 1;
    }
    ringCache[ringIndex] = { R, floor, max, wrapAt, px };
    return px;
  }

  function freshRingSize(ringIndex: number, R: number, floor: number, max: number, wrapAt: number): number {
    const ring = layout.rings[ringIndex]!;
    const rMid = ((ring.inner + ring.outer) / 2) * R;
    const boxLen = (ring.outer - ring.inner) * R - 2 * LABEL_PAD;
    let px = max;
    for (const i of ring.segments) {
      const s = layout.segments[i]!;
      const fit = fitLabel(texts[i]!, measure, { width: boxLen, height: (s.end - s.start) * rMid }, { min: floor, max, wrapAt });
      if (fit) px = Math.min(px, fit.px);
    }
    return Math.max(Math.floor(px * 2) / 2, floor);
  }

  /**
   * Known-issues spec §5: the opened label, at bold, inside the lifted cell's box, grown up to LIFT_LABEL× its unopened
   * size `fit` and never below it. When even the unopened size doesn't fit, it's drawn at that size.
   */
  function openedLabel(i: number, w: number, h: number, fit: { lines: string[]; px: number }): { lines: string[]; px: number } {
    const min = fit.px;
    const max = fit.px * LIFT_LABEL;
    const c = openedFit;
    if (c && c.i === i && Math.abs(c.w - w) <= FIT_TOLERANCE && Math.abs(c.h - h) <= FIT_TOLERANCE && c.min === min && c.max === max) {
      return c.result ?? fit;
    }
    const result = fitLabel(texts[i]!, measureBold, { width: w, height: h }, { min, max });
    openedFit = { i, w, h, min, max, wrapAt: min, result };
    return result ?? fit;
  }

  function drawLabel(lines: string[], px: number, bold: boolean, x: number, y: number, angle: number, scale: number, color: string): void {
    const rot = labelRotation(angle);
    // Forced colors draw live: system colors must resolve on the page canvas, and stay current on theme change.
    if (sprites && !bold && !palette?.forced) {
      // Each line's center, offset along the label's rotated vertical axis.
      const lineGap = px * LINE_HEIGHT;
      const top = -((lines.length - 1) * lineGap) / 2;
      const ux = -Math.sin(rot);
      const uy = Math.cos(rot);
      for (let l = 0; l < lines.length; l++) {
        const dy = top + l * lineGap;
        const lx = x + ux * dy;
        const ly = y + uy * dy;
        if (variant === 'v4') sprites.drawMip(g, lines[l]!, px, color, lx, ly, rot);
        else if ((!exactFrame || variant.endsWith('s')) && variant.startsWith('v1')) sprites.drawNear(g, lines[l]!, px, color, lx, ly, rot);
        else sprites.draw(g, lines[l]!, px, color, lx, ly, rot);
      }
      stats.labelsDrawn++;
      return;
    }
    const cos = Math.cos(rot) * scale;
    const sin = Math.sin(rot) * scale;
    (globalThis as unknown as { __boldLog?: string[] }).__boldLog?.push(JSON.stringify({ lines, px, x, y, rot, scale, bold }));
    g.setTransform(dpr * cos, dpr * sin, -dpr * sin, dpr * cos, dpr * x, dpr * y);
    g.fillStyle = color;
    g.font = font(px, bold);
    const lineGap = px * LINE_HEIGHT;
    const top = -((lines.length - 1) * lineGap) / 2;
    for (let l = 0; l < lines.length; l++) g.fillText(lines[l]!, 0, top + l * lineGap);
    stats.labelsDrawn++;
  }

  /**
   * Two-tone outline: ink on the edge, a gap-colored line just inside it. The line sits a fixed distance inside
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
    collect(f) {
      const out: WarmItem[] = [];
      if (!table || !palette || palette.forced) return out;
      const { cam, vp } = f;
      const R = vp.radius * cam.scale;
      const k = f.remPx / 16;
      const wrapAt = (ring: number): number => (f.mode !== 'ring' ? 8 : f.ring !== null && ring > f.ring ? 10 : 12) * k;
      const floor = 1 * k;
      const maxPx = Math.floor(Math.min(Math.max(16 * k * cam.scale, 16 * k), 24 * k) * 2) / 2;
      const lifted = f.opened ? f.selected : null;
      const w = viewWindow(cam, vp);
      for (const s of layout.segments) {
        const ring = layout.rings[s.ring]!;
        if (s.index === lifted || !inWindow(s, ring, w)) continue;
        const rMid = ((ring.inner + ring.outer) / 2) * R;
        const angle = s.mid + cam.rotation;
        const x = cam.cx + rMid * Math.cos(angle);
        const y = cam.cy + rMid * Math.sin(angle);
        if (x < -rMid || y < -rMid || x > cssW + rMid || y > cssH + rMid) continue;
        const boxLen = (ring.outer - ring.inner) * R - 2 * LABEL_PAD;
        const size = freshRingSize(s.ring, R, floor, maxPx, wrapAt(s.ring));
        const fit = fitLabel(texts[s.index]!, measure, { width: boxLen, height: (s.end - s.start) * rMid }, { min: floor, max: size, wrapAt: wrapAt(s.ring) });
        if (!fit) continue;
        const color = table.label(s.hue, s.ring, f.lit[s.index] === 1);
        for (const line of fit.lines) out.push({ text: line, px: fit.px, color, seg: s.index, lines: fit.lines.length });
      }
      return out;
    },
    draw(f) {
      exactFrame = f.exact !== false;
      stats.segmentsDrawn = 0;
      stats.labelsDrawn = 0;
      stats.labelFits = 0;
      stats.labelsByRing.fill(0);
      stats.focusRing = false;
      stats.focusOutline = false;
      if (!table || !palette) return;
      const { cam, vp } = f;
      const R = vp.radius * cam.scale;
      const k = f.remPx / 16;
      // Known issues, round two (Lucas, 2026-11-18): labels are the look of the wheel, so they never disappear. Spec
      // v2.1 §5's sizes (8 px in the whole-wheel view; in a ring view 12 px on the view ring and inside it, 10 px
      // outside) are now where a label wraps to two lines rather than shrink further; below them it shrinks as far as
      // its cell needs (the 1 px floor only lets the fitting loop end). They were readability choices, not
      // accessibility ones: the canvas is hidden from screen readers. Every label in a ring shares one size (ringSize).
      const wrapAt = (ring: number): number => (f.mode !== 'ring' ? 8 : f.ring !== null && ring > f.ring ? 10 : 12) * k;
      const floor = 1 * k;
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

      // One path per fill color and one for every gap, so a turning wheel is a few dozen draw calls rather than two
      // per cell (Firefox moves a canvas to software when most of a frame's paths are new to its GPU cache).
      const fills = new Map<string, Segment[]>();
      const fades = new Map<string, Segment[]>();
      const cells: Segment[] = [];
      const into = (m: Map<string, Segment[]>, color: string, s: Segment): void => {
        const group = m.get(color);
        if (group) group.push(s);
        else m.set(color, [s]);
      };
      for (const s of layout.segments) {
        const ring = layout.rings[s.ring]!;
        if (s.index === lifted || !inWindow(s, ring, win)) continue;
        const now = f.lit[s.index] === 1;
        const before = f.prevLit[s.index] === 1;
        const fading = now !== before && f.fadeT < 1;
        into(fills, table.fill(s.hue, s.ring, fading ? before : now), s);
        if (fading) into(fades, table.fill(s.hue, s.ring, now), s);
        cells.push(s);
        stats.segmentsDrawn++;
      }
      const cellPath = (group: Segment[]): void => {
        g.beginPath();
        for (const s of group) {
          const ring = layout.rings[s.ring]!;
          addSector(cam.cx, cam.cy, ring.inner * R, ring.outer * R, s.start + cam.rotation, s.end + cam.rotation);
        }
      };
      for (const [color, group] of fills) {
        g.fillStyle = color;
        cellPath(group);
        g.fill();
      }
      if (fades.size > 0) {
        g.globalAlpha = f.fadeT;
        for (const [color, group] of fades) {
          g.fillStyle = color;
          cellPath(group);
          g.fill();
        }
        g.globalAlpha = 1;
      }
      // The gap color is opaque, so one stroke over every edge looks the same as stroking each cell after its fill.
      cellPath(cells);
      g.stroke();

      g.textAlign = 'center';
      g.textBaseline = 'middle';
      for (const s of layout.segments) {
        const ring = layout.rings[s.ring]!;
        if (s.index === lifted || !inWindow(s, ring, win)) continue;
        const rMid = ((ring.inner + ring.outer) / 2) * R;
        const angle = s.mid + cam.rotation;
        const x = cam.cx + rMid * Math.cos(angle);
        const y = cam.cy + rMid * Math.sin(angle);
        if (x < -rMid || y < -rMid || x > cssW + rMid || y > cssH + rMid) continue;
        const boxLen = (ring.outer - ring.inner) * R - 2 * LABEL_PAD;
        const size = ringSize(s.ring, R, floor, maxPx, wrapAt(s.ring));
        const fit = fitted(s.index, boxLen, (s.end - s.start) * rMid, floor, size, wrapAt(s.ring));
        if (!fit) continue;
        const lit = f.fadeT >= 0.5 ? f.lit[s.index] === 1 : f.prevLit[s.index] === 1;
        drawLabel(fit.lines, fit.px, false, x, y, angle, 1, table.label(s.hue, s.ring, lit));
        stats.labelsByRing[s.ring]!++;
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (f.keyboardFocus && f.selected === null) {
        g.beginPath();
        g.arc(cam.cx, cam.cy, R * layout.rings[layout.rings.length - 1]!.outer + FOCUS_GAP_PX + FOCUS_RING_PX / 2, 0, TAU);
        g.lineWidth = FOCUS_RING_PX;
        g.strokeStyle = palette.focus;
        g.stroke();
        stats.focusRing = true;
      }

      if (f.selected === null) return;
      const s = layout.segments[f.selected]!;
      const ring = layout.rings[s.ring]!;
      if (!inWindow(s, ring, win)) return;
      // Keyboard focus on the selected word: its outline takes the focus color, as the app's other controls' rings do.
      const ink = f.keyboardFocus ? palette.focus : palette.outline;
      stats.focusOutline = f.keyboardFocus;
      const a0 = s.start + cam.rotation;
      const a1 = s.end + cam.rotation;
      const angle = s.mid + cam.rotation;

      if (!f.opened) {
        // Spec v2.2 §6: a selected word is outlined, with no chevron.
        outline(cam.cx, cam.cy, ring.inner * R, ring.outer * R, a0, a1, ink, palette.gap);
        return;
      }

      // Opened: lifted past its ring, with one shadow, pulsing in about its center.
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
      // The opened word is sized to its own cell, not its ring, so it stands out (Lucas, 2026-11-27): with an area
      // opened, the ring's size is set by its tightest label ("Head / face"), half of what "Chest" fits.
      const fit = fitted(s.index, (ring.outer - ring.inner) * R - 2 * LABEL_PAD, (s.end - s.start) * rMid, floor, maxPx, wrapAt(s.ring));
      if (fit) {
        // Round two: as clear of the outline (its inner half is inside the cell) as an unopened label is of its cell.
        const lifted = openedLabel(s.index, r1 - r0 - 2 * (LABEL_PAD + OUTLINE_INNER_PX), (s.end - s.start + 2 * side) * rMid, fit);
        drawLabel(lifted.lines, lifted.px, true, x, y, angle, p, table.label(s.hue, s.ring, true));
        stats.labelsByRing[s.ring]!++;
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
  };
}
