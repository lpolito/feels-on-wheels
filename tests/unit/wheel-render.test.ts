import { beforeAll, describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';
import { label, nodeLabel, setLocale, wheelCellLabel } from '../../src/i18n';
import { buildLayout, homes, litMask } from '../../src/model/layout';
import { overviewCamera, ringFocusCamera, sharedSizes } from '../../src/camera';
import { buildFillTable, type Palette } from '../../src/render/colors';
import { createWheelRenderer, type Frame } from '../../src/render/wheel';
import { drawWidthOf, type Viewport } from '../../src/model/geometry';
import { LIFT_RADIAL_PX } from '../../src/render/selection';

const { wheel, locale } = loadData();
const SHARED = sharedSizes(loadData().wheels);
const layout = buildLayout(wheel);
beforeAll(() => setLocale(locale));

const palette: Palette = {
  bg: '#ffffff', fg: '#111111', gap: '#ffffff', focus: '#1a5fd0', outline: '#1c1b1f', surface: '#f6f5f8',
  hues: { happy: '#d9730d', angry: '#c62835', love: '#c2257f', sad: '#3b3470', bad: '#005a69', scared: '#3e7b5e' },
};
const table = buildFillTable(palette, 3, 'light');

type Arc = { r: number; a0: number; a1: number };
/** One stroke call: its style, width and the arcs in its path. */
type StrokeRec = { style: string; lineWidth: number; arcs: Arc[] };
/** One fill call: its style and the arcs in its path. */
type FillRec = { style: string; arcs: Arc[] };

interface Rec {
  fills: string[]; strokes: string[]; texts: string[]; fonts: string[]; shadowSets: number;
  strokeLog: StrokeRec[];
  fillLog: FillRec[];
  /** The transform's translation (e, f) at each fillText. */
  textAt: { text: string; e: number; f: number }[];
}

/**
 * The fake font's width. Like the app's system font: bold (800) is about 5% wider than the regular 600, and text under
 * 20 px is about 6% wider than a straight scale-down predicts (its optical size for small text).
 */
function fakeWidth(text: string, font: string): number {
  const px = Number(/([\d.]+)px/.exec(font)![1]);
  return text.length * px * 0.6 * (font.startsWith('800 ') ? 1.05 : 1) * (px < 20 ? 1.06 : 1);
}

function fakeCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; rec: Rec } {
  const rec: Rec = { fills: [], strokes: [], texts: [], fonts: [], shadowSets: 0, strokeLog: [], fillLog: [], textAt: [] };
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
    fill: () => {
      rec.fills.push(state.fillStyle);
      rec.fillLog.push({ style: state.fillStyle, arcs: path.slice() });
    },
    stroke: () => {
      rec.strokes.push(state.strokeStyle);
      rec.strokeLog.push({ style: state.strokeStyle, lineWidth: state.lineWidth, arcs: path.slice() });
    },
    fillText: (t: string) => { rec.texts.push(t); rec.fonts.push(state.font); rec.textAt.push({ text: t, ...tf }); },
    measureText: (t: string) => ({ width: fakeWidth(t, state.font) }),
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
    selected: null, opened: false, pulseT: 1, mode: 'wheel', ring: null, remPx: 16, keyboardFocus: false, ...overrides,
  };
}

const desk: Viewport = { width: 1000, height: 1000, radius: 492 };

describe('label floors by ring (spec v2.1 §5)', () => {
  const bodyWheel = loadData().wheels.find((w) => w.id === 'body')!;
  const body = buildLayout(bodyWheel);
  const bodyPalette: Palette = {
    ...palette,
    hues: { ...palette.hues, head: '#7a243b', throat: '#387078', shoulders: '#5c4221', hands: '#546286', chest: '#7d7413', stomach: '#0179a3', 'whole-body': '#7d3b75', urges: '#775064' },
  };
  const bodyTable = buildFillTable(bodyPalette, 3, 'light');
  const phone: Viewport = { width: 393, height: 851, radius: 188.5 };
  const pxOf = (font: string) => Number(/([\d.]+)px/.exec(font)![1]);

  test('opened labels stay 6 px clear of their outline at bold, and never shrink (core and middle rings, both wheels)', () => {
    const vp: Viewport = { width: 393, height: 600, radius: 188.5 };
    const o = { remPx: 16, portrait: true, rest: 'half' as const, openedY: null, sideCoreWidth: SHARED.coreWidth };
    const CLEAR = 6 + 2; // 6 px clear of the outline, whose inner half is 2 px inside the lifted cell
    for (const [l, tbl, pal] of [[layout, table, palette], [body, bodyTable, bodyPalette]] as const) {
      for (const ringIndex of [0, 1]) {
        const ring = l.rings[ringIndex]!;
        const drawn = (i: number, opened: boolean) => {
          const { canvas, ctx, rec } = fakeCanvas();
          const r = createWheelRenderer(canvas, l, ctx);
          r.setColors(tbl, pal);
          r.resize(vp.width, vp.height, 1);
          const cam = ringFocusCamera(l, ringIndex, vp, -l.segments[i]!.mid, o);
          const lit = litMask(l, i);
          r.draw({ cam, vp, lit, prevLit: lit, fadeT: 1, selected: i, opened, pulseT: 1, mode: 'ring', ring: ringIndex, remPx: 16, keyboardFocus: false });
          return { rec, R: vp.radius * cam.scale };
        };
        for (const i of ring.segments) {
          const s = l.segments[i]!;
          const text = wheelCellLabel(s.node);
          const isLine = (t: string) => t === text || text.startsWith(`${t} `) || text.endsWith(` ${t}`);
          const before = drawn(i, false).rec;
          const unopened = Math.max(...before.texts.flatMap((t, k) => (isLine(t) && before.fonts[k]!.startsWith('600 ') ? [pxOf(before.fonts[k]!)] : [])));
          const { rec, R } = drawn(i, true);
          const opened = rec.texts.flatMap((t, k) => (rec.fonts[k]!.startsWith('800 ') ? [{ text: t, px: pxOf(rec.fonts[k]!) }] : []));
          const name = `${l.wheelId} ${s.path}`;
          expect(opened.length, name).toBeGreaterThan(0);
          for (const line of opened) expect(line.px, name).toBeGreaterThanOrEqual(unopened - 1e-9);
          const box = (ring.outer - ring.inner) * R + 2 * LIFT_RADIAL_PX - 2 * CLEAR;
          const fits = opened.every((x) => fakeWidth(x.text, `800 ${x.px}px`) <= box + 1e-6);
          if (s.path === 'shoulders/weight-on-shoulders') expect(fits, 'Weight on shoulders fits its lifted cell').toBe(true);
          // It fits, unless it can't even at its unopened size: then it's drawn at exactly that size.
          if (!fits) for (const line of opened) expect(line.px, `${name} falls back to its unopened size`).toBeCloseTo(unopened, 9);
        }
      }
    }
  });

  /** Each ring's distinct label sizes in one draw: drawn 600-weight lines mapped to the ring of the label they're from. */
  function sizesByRing(l: typeof layout, rec: Rec): Map<number, Set<number>> {
    const ringsOf = new Map<string, Set<number>>();
    for (const s of l.segments) {
      const text = wheelCellLabel(s.node);
      const words = text.split(' ');
      const lines = [text, ...words.slice(1).map((_, k) => [words.slice(0, k + 1).join(' '), words.slice(k + 1).join(' ')]).flat()];
      for (const t of lines) (ringsOf.get(t) ?? ringsOf.set(t, new Set()).get(t)!).add(s.ring);
    }
    const out = new Map<number, Set<number>>();
    rec.texts.forEach((t, k) => {
      const rings = ringsOf.get(t);
      if (!rings || rings.size !== 1 || !rec.fonts[k]!.startsWith('600 ')) return;
      const ring = [...rings][0]!;
      (out.get(ring) ?? out.set(ring, new Set()).get(ring)!).add(pxOf(rec.fonts[k]!));
    });
    return out;
  }

  test('every label in a ring is drawn at one size, on both wheels (even labels and drag spec §1)', () => {
    for (const [l, tbl, pal] of [[layout, table, palette], [body, bodyTable, bodyPalette]] as const) {
      const { canvas, ctx, rec } = fakeCanvas();
      const r = createWheelRenderer(canvas, l, ctx);
      r.setColors(tbl, pal);
      r.resize(phone.width, phone.height, 1);
      const all = litMask(l, null);
      r.draw({ ...frame(phone), lit: all, prevLit: all });
      const sizes = sizesByRing(l, rec);
      expect(sizes.size, l.wheelId).toBe(l.rings.length);
      for (const [ring, px] of sizes) expect([...px], `${l.wheelId} ring ${ring}`).toHaveLength(1);
    }
  });

  test('turning the wheel never changes a ring\'s label size (even labels and drag spec §1)', () => {
    const vp: Viewport = { width: 393, height: 600, radius: 188.5 };
    const o = { remPx: 16, portrait: true, rest: 'half' as const, openedY: null, sideCoreWidth: SHARED.coreWidth };
    const at = (path: string) => {
      const { canvas, ctx, rec } = fakeCanvas();
      const r = createWheelRenderer(canvas, layout, ctx);
      r.setColors(table, palette);
      r.resize(vp.width, vp.height, 1);
      const i = layout.byPath.get(path)!;
      const all = litMask(layout, null);
      r.draw({ cam: ringFocusCamera(layout, 1, vp, -layout.segments[i]!.mid, o), vp, lit: all, prevLit: all, fadeT: 1, selected: null, opened: false, pulseT: 1, mode: 'ring', ring: 1, remPx: 16, keyboardFocus: false });
      return new Map([...sizesByRing(layout, rec)].map(([ring, px]) => [ring, [...px].sort()]));
    };
    const a = at('scared/anxious');
    const b = at('sad/hurt');
    const both = [...a.keys()].filter((ring) => b.has(ring));
    expect(both.length).toBeGreaterThanOrEqual(2);
    for (const ring of both) expect(a.get(ring), `ring ${ring}`).toEqual(b.get(ring));
  });

  test('the opened word\'s label is sized to its own cell, not its ring (Lucas, 2026-11-27)', () => {
    const vp: Viewport = { width: 393, height: 650, radius: 188.5 };
    const o = { remPx: 16, portrait: true, rest: 'half' as const, openedY: null, sideCoreWidth: SHARED.coreWidth };
    const { canvas, ctx, rec } = fakeCanvas();
    const r = createWheelRenderer(canvas, body, ctx);
    r.setColors(bodyTable, bodyPalette);
    r.resize(vp.width, vp.height, 1);
    const chest = body.byPath.get('chest')!;
    const lit = litMask(body, chest);
    r.draw({ cam: ringFocusCamera(body, 0, vp, -body.segments[chest]!.mid, o), vp, lit, prevLit: lit, fadeT: 1, selected: chest, opened: true, pulseT: 1, mode: 'ring', ring: 0, remPx: 16, keyboardFocus: false });
    const opened = rec.texts.flatMap((t, k) => (t === 'Chest' && rec.fonts[k]!.startsWith('800 ') ? [pxOf(rec.fonts[k]!)] : []));
    const areas = [...sizesByRing(body, rec).get(0)!];
    expect(areas).toHaveLength(1);
    expect(opened).toHaveLength(1);
    expect(opened[0]!).toBeGreaterThan(1.5 * areas[0]!);
  });

  test('a long core label wraps to two lines in a ring view, as before the floors went (known issues, round two)', () => {
    const vp: Viewport = { width: 393, height: 600, radius: 188.5 };
    const { canvas, ctx, rec } = fakeCanvas();
    const r = createWheelRenderer(canvas, body, ctx);
    r.setColors(bodyTable, bodyPalette);
    r.resize(vp.width, vp.height, 1);
    const throat = body.byPath.get('throat')!;
    const cam = ringFocusCamera(body, 0, vp, -body.segments[throat]!.mid, { remPx: 16, portrait: true, rest: 'half' as const, openedY: null, sideCoreWidth: SHARED.coreWidth });
    const all = litMask(body, null);
    r.draw({ cam, vp, lit: all, prevLit: all, fadeT: 1, selected: null, opened: false, pulseT: 1, mode: 'ring', ring: 0, remPx: 16, keyboardFocus: false });
    expect(rec.texts).not.toContain('Throat / mouth');
    expect(rec.texts).toContain('Throat');
    expect(rec.texts).toContain('/ mouth');
  });

  test('a body outer cell is filled with its own ring\'s shade, like the feelings wheel (rework changes)', () => {
    const homed = buildLayout(bodyWheel, homes(layout));
    const { canvas, ctx, rec } = fakeCanvas();
    const r = createWheelRenderer(canvas, homed, ctx);
    r.setColors(bodyTable, bodyPalette);
    r.resize(1000, 1000, 1);
    r.draw(frame(desk));
    // The fill whose path holds the outer cell's outer arc.
    const outer = homed.segments.find((s) => s.ring === 2)!;
    const { cam } = frame(desk);
    const radius = homed.rings[2]!.outer * desk.radius * cam.scale;
    const filled = rec.fillLog.filter((x) => x.arcs.some((a) => Math.abs(a.r - radius) < 1e-6
      && Math.abs(a.a0 - (outer.start + cam.rotation)) < 1e-9 && Math.abs(a.a1 - (outer.end + cam.rotation)) < 1e-9));
    expect(filled.map((x) => x.style)).toEqual([bodyTable.fill(outer.hue, 2, true)]);
  });

  test('the drawn wheel says "The urge to…" where everything else says "Urges"', () => {
    const { canvas, ctx, rec } = fakeCanvas();
    const r = createWheelRenderer(canvas, body, ctx);
    r.setColors(bodyTable, bodyPalette);
    r.resize(1000, 1000, 1);
    r.draw(frame(desk));
    expect(rec.texts).toContain('The urge to…');
    expect(rec.texts).not.toContain('Urges');
    expect(nodeLabel({ kind: 'area', id: 'urges' })).toBe('Urges');
  });

  test('labels never disappear: a tiny whole wheel draws every label on both wheels, and labelsByRing adds up', () => {
    const tiny: Viewport = { width: 300, height: 300, radius: 142 };
    for (const [l, tbl, pal] of [[layout, table, palette], [body, bodyTable, bodyPalette]] as const) {
      const { canvas, ctx, rec } = fakeCanvas();
      const r = createWheelRenderer(canvas, l, ctx);
      r.setColors(tbl, pal);
      r.resize(300, 300, 1);
      const all = litMask(l, null);
      r.draw({ ...frame(tiny), lit: all, prevLit: all });
      expect(r.stats.labelsDrawn, l.wheelId).toBe(l.segments.length);
      expect(Math.min(...rec.fonts.map(pxOf)), `${l.wheelId}: some labels under the old 8 px floor`).toBeLessThan(8);
      expect(r.stats.labelsByRing.reduce((a, b) => a + b, 0)).toBe(r.stats.labelsDrawn);
    }
  });
});

describe('wheel renderer', () => {
  test('overview draws all 162 segments', () => {
    const { canvas, ctx } = fakeCanvas();
    const r = createWheelRenderer(canvas, layout, ctx);
    r.setColors(table, palette);
    r.resize(1000, 1000, 2);
    r.draw(frame(desk));
    expect(r.stats.segmentsDrawn).toBe(162);
    expect(r.stats.labelsDrawn).toBeGreaterThan(100);
  });

  test('cells are drawn with one fill per color and one stroke for every gap', () => {
    // Firefox moves a canvas to software when most of a frame's draws are new to its GPU caches, and a turning cell is
    // a new path every frame: two calls per cell kept the wheel there for good.
    const { canvas, ctx, rec } = fakeCanvas();
    const r = createWheelRenderer(canvas, layout, ctx);
    r.setColors(table, palette);
    r.resize(1000, 1000, 2);
    const sel = layout.byPath.get('angry/annoyed')!;
    r.draw(frame(desk, { lit: litMask(layout, sel), prevLit: litMask(layout, null), fadeT: 0.5 }));
    const cellFills = rec.fillLog.filter((x) => x.arcs.length > 0);
    const colors = new Set(layout.segments.flatMap((s) => [table.fill(s.hue, s.ring, true), table.fill(s.hue, s.ring, false)]));
    // Mid-fade: every cell's old color, then the new color of each cell that changes.
    expect(cellFills.length).toBeLessThanOrEqual(colors.size * 2);
    expect(cellFills.reduce((n, x) => n + x.arcs.length, 0)).toBe(2 * (layout.segments.length + layout.segments.filter((s) => litMask(layout, sel)[s.index] !== 1).length));
    const gaps = rec.strokeLog.filter((x) => x.style === palette.gap);
    expect(gaps).toHaveLength(1);
    expect(gaps[0]!.arcs).toHaveLength(2 * layout.segments.length);
  });

  test('ring focus on the outer ring at 375×667 draws fewer than 40 segments', () => {
    const phone: Viewport = { width: 375, height: 667, radius: 179.5 };
    const { canvas, ctx } = fakeCanvas();
    const r = createWheelRenderer(canvas, layout, ctx);
    r.setColors(table, palette);
    r.resize(375, 667, 3);
    r.draw(frame(phone, { cam: ringFocusCamera(layout, 2, phone, 0, { remPx: 16, portrait: true, rest: 'whole' as const, openedY: null, sideCoreWidth: SHARED.coreWidth }), mode: 'ring' }));
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

  test('faded fill used for unlit segments once the fade completes', () => {
    const { canvas, ctx, rec } = fakeCanvas();
    const r = createWheelRenderer(canvas, layout, ctx);
    r.setColors(table, palette);
    r.resize(1000, 1000, 1);
    const sel = layout.byPath.get('angry/annoyed')!;
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

  test('selected not opened: outline drawn in palette.outline, no chevron, no shadow', () => {
    const angry = layout.byPath.get('angry')!;
    const none = draw(desk, {}).rec;
    const sel = draw(desk, { selected: angry }).rec;
    expect(none.strokes).not.toContain(palette.outline);
    expect(sel.strokes.filter((x) => x === palette.outline).length).toBeGreaterThanOrEqual(1);
    // Spec v2.2 §6: the outline ring and the inner gap line; no chevron.
    expect(sel.strokes.length - none.strokes.length).toBe(2);
    expect(sel.shadowSets).toBe(0);
  });

  test('keyboard focus with nothing selected draws one 3px circle in the focus color just outside the wheel', () => {
    const { r, rec } = draw(desk, { keyboardFocus: true });
    const cam = overviewCamera(desk, 0);
    const radius = desk.radius * cam.scale * layout.rings[layout.rings.length - 1]!.outer + 2 + 3 / 2;
    const ringStrokes = rec.strokeLog.filter((x) => x.style === palette.focus);
    expect(ringStrokes).toHaveLength(1);
    expect(ringStrokes[0]!.lineWidth).toBe(3);
    expect(ringStrokes[0]!.arcs).toHaveLength(1);
    const arc = ringStrokes[0]!.arcs[0]!;
    expect(arc.r).toBeCloseTo(radius, 6);
    expect(arc.a1 - arc.a0).toBeCloseTo(Math.PI * 2, 9);
    expect(r.stats.focusRing).toBe(true);
  });

  test('no ring without keyboard focus', () => {
    const { r, rec } = draw(desk, {});
    expect(rec.strokes).not.toContain(palette.focus);
    expect(r.stats.focusRing).toBe(false);
  });

  test('keyboard focus on a selected word: its outline takes the focus color, and no ring', () => {
    const angry = layout.byPath.get('angry')!;
    const { r, rec } = draw(desk, { selected: angry, keyboardFocus: true });
    expect(rec.strokes).toContain(palette.focus);
    expect(rec.strokes).not.toContain(palette.outline);
    // Still the outline ring and its inner gap line, not the wheel's ring.
    expect(rec.strokeLog.filter((x) => x.style === palette.focus && x.arcs.length === 1 && x.arcs[0]!.a1 - x.arcs[0]!.a0 > 6)).toHaveLength(0);
    expect(r.stats.focusRing).toBe(false);
    expect(r.stats.focusOutline).toBe(true);
  });

  test('an opened word with keyboard focus is outlined in the focus color too', () => {
    const irritable = layout.byPath.get('angry/annoyed/irritable')!;
    const { r, rec } = draw(desk, { selected: irritable, opened: true, mode: 'ring', ring: 2, keyboardFocus: true });
    expect(rec.strokes).toContain(palette.focus);
    expect(rec.strokes).not.toContain(palette.outline);
    expect(r.stats.focusOutline).toBe(true);
  });

  test('without keyboard focus a selected word keeps the usual outline color', () => {
    const angry = layout.byPath.get('angry')!;
    const { r, rec } = draw(desk, { selected: angry });
    expect(rec.strokes).toContain(palette.outline);
    expect(rec.strokes).not.toContain(palette.focus);
    expect(r.stats.focusOutline).toBe(false);
  });

  test('opened: shadowBlur set exactly once per frame', () => {
    const irritable = layout.byPath.get('angry/annoyed/irritable')!;
    const sel = layout.segments[irritable]!;
    const cam = ringFocusCamera(layout, 2, desk, -sel.mid, { remPx: 16, portrait: false, rest: 'whole' as const, openedY: null, sideCoreWidth: SHARED.coreWidth });
    const lit = litMask(layout, irritable);
    const { rec } = draw(desk, { cam, mode: 'ring', selected: irritable, opened: true, lit, prevLit: lit, pulseT: 0.5 });
    expect(rec.shadowSets).toBe(1);
    expect(rec.strokes).toContain(palette.outline);
  });

  test('opened label uses weight 800 and a larger px than its neighbours', () => {
    const irritable = layout.byPath.get('angry/annoyed/irritable')!;
    const sel = layout.segments[irritable]!;
    const cam = ringFocusCamera(layout, 2, desk, -sel.mid, { remPx: 16, portrait: false, rest: 'whole' as const, openedY: null, sideCoreWidth: SHARED.coreWidth });
    const lit = litMask(layout, irritable);
    const { rec } = draw(desk, { cam, mode: 'ring', selected: irritable, opened: true, lit, prevLit: lit });
    const at = (t: string) => rec.fonts[rec.texts.lastIndexOf(t)]!;
    const irritableFont = at(label('irritable'));
    const provokedFont = at(label('provoked'));
    expect(irritableFont.startsWith('800 ')).toBe(true);
    expect(provokedFont.startsWith('600 ')).toBe(true);
    expect(pxOf(irritableFont)).toBeGreaterThan(pxOf(provokedFont));
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
    for (const path of ['angry', 'angry/annoyed', 'angry/annoyed/irritable']) {
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
    const cam = ringFocusCamera(layout, 0, desk, -layout.segments[angry]!.mid, { remPx: 16, portrait: false, rest: 'whole' as const, openedY: null, sideCoreWidth: SHARED.coreWidth });
    const lit = litMask(layout, angry);
    const { rec } = draw(desk, { cam, mode: 'ring', selected: angry, opened: true, lit, prevLit: lit });
    for (const { start, end } of insets(rec)) {
      expect(start).toBeCloseTo(3, 2);
      expect(end).toBeCloseTo(3, 2);
    }
  });

  test('selecting a word never moves or resizes its label (spec v2.2 §6)', () => {
    /** The single-line label's radial center and size, or null when it isn't drawn on one line. */
    const placed = (i: number, o: Partial<Frame>) => {
      const s = layout.segments[i]!;
      const { canvas, ctx, rec } = fakeCanvas();
      const r = createWheelRenderer(canvas, layout, ctx);
      r.setColors(table, palette);
      r.resize(desk.width, desk.height, 1);
      const f = frame(desk, o);
      r.draw(f);
      const k = rec.textAt.findIndex((x) => x.text === nodeLabel(s.node));
      if (k < 0) return null;
      const angle = s.mid + f.cam.rotation;
      const center = (rec.textAt[k]!.e - f.cam.cx) * Math.cos(angle) + (rec.textAt[k]!.f - f.cam.cy) * Math.sin(angle);
      return { center, px: pxOf(rec.fonts[k]!) };
    };
    let checked = 0;
    for (const s of layout.segments) {
      const before = placed(s.index, {});
      const after = placed(s.index, { selected: s.index });
      if (!before || !after) continue;
      expect(after.center, nodeLabel(s.node)).toBeCloseTo(before.center, 6);
      expect(after.px, nodeLabel(s.node)).toBe(before.px);
      checked++;
    }
    expect(checked).toBeGreaterThan(50);
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
    const irritable = layout.byPath.get('angry/annoyed/irritable')!;
    const sel = layout.segments[irritable]!;
    const cam = ringFocusCamera(layout, 2, desk, -sel.mid, { remPx: 16, portrait: false, rest: 'whole' as const, openedY: null, sideCoreWidth: SHARED.coreWidth });
    const lit = litMask(layout, irritable);
    const sprited: string[] = [];
    const scales: number[] = [];
    const sprites = { size: 0, setScale: (d: number) => scales.push(d), draw: (_g: unknown, text: string) => { sprited.push(text); } };
    const { canvas, ctx, rec } = fakeCanvas();
    const r = createWheelRenderer(canvas, layout, ctx, sprites);
    r.setColors(table, palette);
    r.resize(1000, 1000, 2);
    expect(scales).toEqual([2]);
    r.draw(frame(desk, { cam, mode: 'ring', selected: irritable, opened: true, lit, prevLit: lit }));
    expect(rec.texts).toEqual([label('irritable')]);
    expect(sprited).toContain(label('provoked'));
    expect(sprited).not.toContain(label('irritable'));
  });

  test('forced colors draw labels with fillText, never from sprite bitmaps', () => {
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

describe('the canvas under the column (spec v2.2 §3.1)', () => {
  test('draws labels in the column when drawWidth is wider', () => {
    // The outer ring starts at x = 100 + 0.62 × 192 × 4 ≈ 576: past the aim width, inside the canvas.
    const vp: Viewport = { width: 500, height: 400, radius: 192 };
    const cam = { scale: 4, rotation: 0, cx: 100, cy: 200 };
    const outerLabels = (v: Viewport) => {
      const { canvas, ctx } = fakeCanvas();
      const r = createWheelRenderer(canvas, layout, ctx);
      r.setColors(table, palette);
      r.resize(drawWidthOf(v), v.height, 1);
      r.draw(frame(v, { cam, mode: 'ring', ring: 1 }));
      return r.stats.labelsByRing[2]!;
    };
    expect(outerLabels({ ...vp, drawWidth: 1000 })).toBeGreaterThan(outerLabels(vp));
  });
});
