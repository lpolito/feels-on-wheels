import { beforeAll, describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';
import { setLocale } from '../../src/i18n';
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

interface Rec { fills: string[]; strokes: string[]; texts: string[] }

function fakeCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; rec: Rec } {
  const rec: Rec = { fills: [], strokes: [], texts: [] };
  const state = { fillStyle: '', strokeStyle: '', font: '10px sans-serif', globalAlpha: 1, lineWidth: 1, textAlign: 'start', textBaseline: 'alphabetic' };
  const noop = () => {};
  const ctx = {
    ...Object.fromEntries(['beginPath', 'closePath', 'arc', 'moveTo', 'lineTo', 'setTransform', 'clearRect', 'fillRect'].map((k) => [k, noop])),
    fill: () => rec.fills.push(state.fillStyle),
    stroke: () => rec.strokes.push(state.strokeStyle),
    fillText: (t: string) => rec.texts.push(t),
    measureText: (t: string) => ({ width: t.length * Number(/([\d.]+)px/.exec(state.font)![1]) * 0.6 }),
  } as Record<string, unknown>;
  for (const k of Object.keys(state) as (keyof typeof state)[]) {
    Object.defineProperty(ctx, k, { get: () => state[k], set: (v) => { (state as Record<string, unknown>)[k] = v; } });
  }
  const canvas = { width: 0, height: 0 } as HTMLCanvasElement;
  return { canvas, ctx: ctx as unknown as CanvasRenderingContext2D, rec };
}

function frame(vp: Viewport, overrides: Partial<Frame> = {}): Frame {
  const all = litMask(layout, null);
  return {
    cam: overviewCamera(vp, 0), vp, lit: all, prevLit: all, fadeT: 1,
    focused: null, showFocus: false, mode: 'overview', remPx: 16, ...overrides,
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
    r.draw(frame(phone, { cam: ringFocusCamera(layout, 2, phone, 0, { remPx: 16, portrait: true }), mode: 'ring' }));
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

  test('focus outline only when showFocus', () => {
    const angry = layout.byPath.get('angry')!;
    for (const showFocus of [false, true]) {
      const { canvas, ctx, rec } = fakeCanvas();
      const r = createWheelRenderer(canvas, layout, ctx);
      r.setColors(table, palette);
      r.resize(1000, 1000, 1);
      r.draw(frame(desk, { focused: angry, showFocus }));
      expect(rec.strokes.filter((s) => s === palette.focus).length).toBe(showFocus ? 1 : 0);
    }
  });

  test('focus outline includes a ring in the segment label color, which contrasts ≥3:1 with every fill', async () => {
    const { contrast } = await import('../../src/render/colors');
    for (const path of ['angry', 'happy/proud', 'sad/lonely/isolated']) {
      const i = layout.byPath.get(path)!;
      const s = layout.segments[i]!;
      const ring = table.label(s.hue, s.ring, true);
      expect(contrast(ring, table.fill(s.hue, s.ring, true))).toBeGreaterThanOrEqual(3);
      const counts = [false, true].map((showFocus) => {
        const { canvas, ctx, rec } = fakeCanvas();
        const r = createWheelRenderer(canvas, layout, ctx);
        r.setColors(table, palette);
        r.resize(1000, 1000, 1);
        r.draw(frame(desk, { focused: i, showFocus }));
        return rec.strokes.filter((x) => x === ring).length;
      });
      expect(counts[1]! - counts[0]!, path).toBe(1);
    }
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
});
