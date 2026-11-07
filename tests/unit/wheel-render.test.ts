import { beforeAll, describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';
import { label, setLocale } from '../../src/i18n';
import { buildLayout, litMask } from '../../src/model/layout';
import { overviewCamera, ringFocusCamera } from '../../src/camera';
import { buildFillTable, type Palette } from '../../src/render/colors';
import { createWheelRenderer, type Frame } from '../../src/render/wheel';
import type { Viewport } from '../../src/model/geometry';

const { wheel, locale } = loadData();
const layout = buildLayout(wheel);
beforeAll(() => setLocale(locale));

const palette: Palette = {
  bg: '#ffffff', fg: '#111111', gap: '#ffffff', focus: '#1a5fd0', outline: '#1c1b1f',
  hues: { fearful: '#c2257f', angry: '#c62835', disgusted: '#a4532a', sad: '#3b3470', happy: '#d9730d', surprised: '#3e7b5e', bad: '#5e3a87' },
};
const table = buildFillTable(palette, 3, 'light');

type Arc = { r: number; a0: number; a1: number };
/** One stroke call: its style, width and the arcs in its path. */
type StrokeRec = { style: string; lineWidth: number; arcs: Arc[] };

interface Rec {
  fills: string[]; strokes: string[]; texts: string[]; fonts: string[]; shadowSets: number;
  strokeLog: StrokeRec[];
  /** The transform's translation (e, f) at each fillText. */
  textAt: { text: string; e: number; f: number }[];
}

function fakeCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; rec: Rec } {
  const rec: Rec = { fills: [], strokes: [], texts: [], fonts: [], shadowSets: 0, strokeLog: [], textAt: [] };
  const state = {
    fillStyle: '', strokeStyle: '', font: '10px sans-serif', globalAlpha: 1, lineWidth: 1, textAlign: 'start', textBaseline: 'alphabetic',
    lineJoin: 'miter', lineCap: 'butt', shadowBlur: 0, shadowColor: 'transparent', shadowOffsetX: 0, shadowOffsetY: 0,
  };
  const noop = () => {};
  let path: Arc[] = [];
  let tf = { e: 0, f: 0 };
  const ctx = {
    ...Object.fromEntries(['closePath', 'moveTo', 'lineTo', 'clearRect', 'fillRect'].map((k) => [k, noop])),
    beginPath: () => { path = []; },
    arc: (_x: number, _y: number, r: number, a0: number, a1: number) => { path.push({ r, a0, a1 }); },
    setTransform: (_a: number, _b: number, _c: number, _d: number, e: number, f: number) => { tf = { e, f }; },
    fill: () => rec.fills.push(state.fillStyle),
    stroke: () => {
      rec.strokes.push(state.strokeStyle);
      rec.strokeLog.push({ style: state.strokeStyle, lineWidth: state.lineWidth, arcs: path.slice() });
    },
    fillText: (t: string) => { rec.texts.push(t); rec.fonts.push(state.font); rec.textAt.push({ text: t, ...tf }); },
    measureText: (t: string) => ({ width: t.length * Number(/([\d.]+)px/.exec(state.font)![1]) * 0.6 }),
  } as Record<string, unknown>;
  for (const k of Object.keys(state) as (keyof typeof state)[]) {
    Object.defineProperty(ctx, k, {
      get: () => state[k],
      set: (v) => {
        if (k === 'shadowBlur' && v > 0) rec.shadowSets++;
        (state as Record<string, unknown>)[k] = v;
      },
    });
  }
  const canvas = { width: 0, height: 0 } as HTMLCanvasElement;
  return { canvas, ctx: ctx as unknown as CanvasRenderingContext2D, rec };
}

function frame(vp: Viewport, overrides: Partial<Frame> = {}): Frame {
  const all = litMask(layout, null);
  return {
    cam: overviewCamera(vp, 0), vp, lit: all, prevLit: all, fadeT: 1,
    selected: null, opened: false, pulseT: 1, mode: 'wheel', remPx: 16, ...overrides,
  };
}

const desk: Viewport = { width: 1000, height: 1000, radius: 492 };

describe('wheel renderer', () => {
  test('overview draws all 130 segments', () => {
    const { canvas, ctx } = fakeCanvas();
    const r = createWheelRenderer(canvas, layout, ctx);
    r.setColors(table, palette);
    r.resize(1000, 1000, 2);
    r.draw(frame(desk));
    expect(r.stats.segmentsDrawn).toBe(130);
    expect(r.stats.labelsDrawn).toBeGreaterThan(100);
  });

  test('ring focus on the outer ring at 375×667 draws fewer than 40 segments', () => {
    const phone: Viewport = { width: 375, height: 667, radius: 179.5 };
    const { canvas, ctx } = fakeCanvas();
    const r = createWheelRenderer(canvas, layout, ctx);
    r.setColors(table, palette);
    r.resize(375, 667, 3);
    r.draw(frame(phone, { cam: ringFocusCamera(layout, 2, phone, 0, { remPx: 16, portrait: true, anchorY: 0.275 }), mode: 'ring' }));
    expect(r.stats.segmentsDrawn).toBeGreaterThan(0);
    expect(r.stats.segmentsDrawn).toBeLessThan(40);
  });

  test('canvas size equals round(css·dpr) after resize', () => {
    const { canvas, ctx } = fakeCanvas();
    const r = createWheelRenderer(canvas, layout, ctx);
    r.resize(333.3, 200.2, 2.625);
    expect(canvas.width).toBe(Math.round(333.3 * 2.625));
    expect(canvas.height).toBe(Math.round(200.2 * 2.625));
  });

  test('labels are never drawn below 8px in overview', () => {
    const tiny: Viewport = { width: 200, height: 200, radius: 92 };
    const { canvas, ctx } = fakeCanvas();
    const r = createWheelRenderer(canvas, layout, ctx);
    r.setColors(table, palette);
    r.resize(200, 200, 1);
    r.draw(frame(tiny));
    expect(r.stats.labelsDrawn).toBeLessThan(130);
  });

  test('faded fill used for unlit segments once the fade completes', () => {
    const { canvas, ctx, rec } = fakeCanvas();
    const r = createWheelRenderer(canvas, layout, ctx);
    r.setColors(table, palette);
    r.resize(1000, 1000, 1);
    const sel = layout.byPath.get('angry/aggressive')!;
    r.draw(frame(desk, { lit: litMask(layout, sel), prevLit: litMask(layout, sel), fadeT: 1 }));
    const fadedSad = table.fill('sad', 0, false);
    const litAngry = table.fill('angry', 0, true);
    expect(rec.fills).toContain(fadedSad);
    expect(rec.fills).toContain(litAngry);
    expect(rec.fills).not.toContain(table.fill('sad', 0, true));
  });

  const draw = (vp: Viewport, o: Partial<Frame>, pal: Palette = palette, tbl = table) => {
    const { canvas, ctx, rec } = fakeCanvas();
    const r = createWheelRenderer(canvas, layout, ctx);
    r.setColors(tbl, pal);
    r.resize(vp.width, vp.height, 1);
    r.draw(frame(vp, o));
    return { r, rec };
  };
  const pxOf = (font: string): number => Number(/([\d.]+)px/.exec(font)![1]);

  test('selected not opened: outline drawn in palette.outline, chevron drawn, no shadow', () => {
    const angry = layout.byPath.get('angry')!;
    const none = draw(desk, {}).rec;
    const sel = draw(desk, { selected: angry }).rec;
    expect(none.strokes).not.toContain(palette.outline);
    expect(sel.strokes.filter((x) => x === palette.outline).length).toBeGreaterThanOrEqual(1);
    // outline ring, inner gap line, chevron
    expect(sel.strokes.length - none.strokes.length).toBe(3);
    expect(sel.shadowSets).toBe(0);
  });

  test('opened: shadowBlur set exactly once per frame', () => {
    const hostile = layout.byPath.get('angry/aggressive/hostile')!;
    const sel = layout.segments[hostile]!;
    const cam = ringFocusCamera(layout, 2, desk, -sel.mid, { remPx: 16, portrait: false, anchorY: 0.5 });
    const lit = litMask(layout, hostile);
    const { rec } = draw(desk, { cam, mode: 'ring', selected: hostile, opened: true, lit, prevLit: lit, pulseT: 0.5 });
    expect(rec.shadowSets).toBe(1);
    expect(rec.strokes).toContain(palette.outline);
  });

  test('opened label uses weight 800 and a larger px than its neighbours', () => {
    const hostile = layout.byPath.get('angry/aggressive/hostile')!;
    const sel = layout.segments[hostile]!;
    const cam = ringFocusCamera(layout, 2, desk, -sel.mid, { remPx: 16, portrait: false, anchorY: 0.5 });
    const lit = litMask(layout, hostile);
    const { rec } = draw(desk, { cam, mode: 'ring', selected: hostile, opened: true, lit, prevLit: lit });
    const at = (t: string) => rec.fonts[rec.texts.lastIndexOf(t)]!;
    const hostileFont = at(label('hostile'));
    const provokedFont = at(label('provoked'));
    expect(hostileFont.startsWith('800 ')).toBe(true);
    expect(provokedFont.startsWith('600 ')).toBe(true);
    expect(pxOf(hostileFont)).toBeGreaterThan(pxOf(provokedFont));
  });

  /** Each inner-line arc against the outline's own arc: the angular inset times the inner arc's radius. */
  function insets(rec: Rec): { start: number; end: number }[] {
    const k = rec.strokeLog.findIndex((s) => s.style === palette.gap && s.lineWidth === 2 && s.arcs.length === 2);
    expect(k, 'inner line stroke').toBeGreaterThan(0);
    const cell = rec.strokeLog[k - 1]!;
    expect(cell.style).toBe(palette.outline);
    const lo = (a: Arc) => Math.min(a.a0, a.a1);
    const hi = (a: Arc) => Math.max(a.a0, a.a1);
    const c0 = lo(cell.arcs[0]!);
    const c1 = hi(cell.arcs[0]!);
    return rec.strokeLog[k]!.arcs.map((a) => ({ start: (lo(a) - c0) * a.r, end: (c1 - hi(a)) * a.r }));
  }

  test('inner outline line is a parallel 3px inset on every ring', () => {
    for (const path of ['angry', 'angry/aggressive', 'angry/aggressive/hostile']) {
      const { rec } = draw(desk, { selected: layout.byPath.get(path)! });
      const ins = insets(rec);
      expect(ins).toHaveLength(2);
      for (const { start, end } of ins) {
        expect(start, path).toBeCloseTo(3, 2);
        expect(end, path).toBeCloseTo(3, 2);
      }
    }
  });

  test('inner outline line is a parallel 3px inset on an opened (lifted) core cell', () => {
    const angry = layout.byPath.get('angry')!;
    const cam = ringFocusCamera(layout, 0, desk, -layout.segments[angry]!.mid, { remPx: 16, portrait: false, anchorY: 0.5 });
    const lit = litMask(layout, angry);
    const { rec } = draw(desk, { cam, mode: 'ring', selected: angry, opened: true, lit, prevLit: lit });
    for (const { start, end } of insets(rec)) {
      expect(start).toBeCloseTo(3, 2);
      expect(end).toBeCloseTo(3, 2);
    }
  });

  test('the label of a selected cell with an inside chevron moves 7px inward', () => {
    const angry = layout.byPath.get('angry')!;
    const dpr = 2;
    const centreDist = (o: Partial<Frame>) => {
      const { canvas, ctx, rec } = fakeCanvas();
      const r = createWheelRenderer(canvas, layout, ctx);
      r.setColors(table, palette);
      r.resize(desk.width, desk.height, dpr);
      const f = frame(desk, o);
      r.draw(f);
      const at = rec.textAt.find((x) => x.text === label('angry'))!;
      return Math.hypot(at.e / dpr - f.cam.cx, at.f / dpr - f.cam.cy);
    };
    expect(centreDist({}) - centreDist({ selected: angry })).toBeCloseTo(7, 2);
  });

  test('thin cell gets the chevron outside in the outline colour; wide cell gets it inside in white', () => {
    const wide = draw(desk, { selected: layout.byPath.get('angry')! }).rec;
    expect(wide.strokes.at(-1)).toBe('#ffffff');
    const small: Viewport = { width: 300, height: 300, radius: 140 };
    const thin = draw(small, { selected: layout.byPath.get('angry/aggressive/hostile')! }).rec;
    expect(thin.strokes.at(-1)).toBe(palette.outline);
  });

  test('forced palette outlines in Highlight', () => {
    const forced: Palette = { ...palette, bg: 'Canvas', fg: 'CanvasText', gap: 'CanvasText', focus: 'Highlight', outline: 'Highlight', forced: true };
    const tbl = buildFillTable(forced, 3, 'light');
    const { rec } = draw(desk, { selected: layout.byPath.get('angry')! }, forced, tbl);
    expect(rec.strokes).toContain('Highlight');
    expect(rec.strokes).not.toContain('#ffffff');
  });

  test('pinch: redrawing at a scale 0.3% larger reuses label fits', () => {
    const { canvas, ctx } = fakeCanvas();
    const r = createWheelRenderer(canvas, layout, ctx);
    r.setColors(table, palette);
    r.resize(1000, 1000, 1);
    r.draw(frame(desk));
    expect(r.stats.labelFits).toBeGreaterThan(100);
    const cam = { ...overviewCamera(desk, 0), scale: 1.003 };
    r.draw(frame(desk, { cam }));
    expect(r.stats.labelFits).toBe(0);
  });

  test('repeat draws at the same camera reuse label layouts', () => {
    const { canvas, ctx, rec } = fakeCanvas();
    const r = createWheelRenderer(canvas, layout, ctx);
    r.setColors(table, palette);
    r.resize(1000, 1000, 1);
    r.draw(frame(desk));
    const first = rec.texts.length;
    r.draw(frame(desk, { cam: overviewCamera(desk, 0.7) }));
    expect(rec.texts.length).toBe(first * 2);
  });

  test('with a sprite cache, labels are blitted from it except the opened (pulsing) one', () => {
    const hostile = layout.byPath.get('angry/aggressive/hostile')!;
    const sel = layout.segments[hostile]!;
    const cam = ringFocusCamera(layout, 2, desk, -sel.mid, { remPx: 16, portrait: false, anchorY: 0.5 });
    const lit = litMask(layout, hostile);
    const sprited: string[] = [];
    const scales: number[] = [];
    const sprites = { size: 0, setScale: (d: number) => scales.push(d), draw: (_g: unknown, text: string) => { sprited.push(text); } };
    const { canvas, ctx, rec } = fakeCanvas();
    const r = createWheelRenderer(canvas, layout, ctx, sprites);
    r.setColors(table, palette);
    r.resize(1000, 1000, 2);
    expect(scales).toEqual([2]);
    r.draw(frame(desk, { cam, mode: 'ring', selected: hostile, opened: true, lit, prevLit: lit }));
    expect(rec.texts).toEqual([label('hostile')]);
    expect(sprited).toContain(label('provoked'));
    expect(sprited).not.toContain(label('hostile'));
  });

  test('forced colours draw labels with fillText, never from sprite bitmaps', () => {
    const forced: Palette = { ...palette, bg: 'Canvas', fg: 'CanvasText', gap: 'CanvasText', focus: 'Highlight', outline: 'Highlight', forced: true };
    const sprited: string[] = [];
    const sprites = { size: 0, setScale: () => {}, draw: (_g: unknown, text: string) => { sprited.push(text); } };
    const { canvas, ctx, rec } = fakeCanvas();
    const r = createWheelRenderer(canvas, layout, ctx, sprites);
    r.setColors(buildFillTable(forced, 3, 'light'), forced);
    r.resize(1000, 1000, 1);
    r.draw(frame(desk));
    expect(sprited).toEqual([]);
    expect(rec.texts.length).toBeGreaterThan(100);
  });
});
