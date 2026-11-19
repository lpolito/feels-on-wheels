import { beforeEach, describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';
import { buildLayout, type Layout } from '../../src/model/layout';
import { TAU, normAngle, type Viewport } from '../../src/model/geometry';
import {
  createCameraController, restRotation, openedHalfHeight, overviewCamera, ringFocusCamera,
  isPortrait, restView, sharedSizes, shouldStartZoomed, useHalfWheel, wheelCamera, type CameraController,
} from '../../src/camera';

const layout = buildLayout(loadData().wheel);
const SHARED = sharedSizes(loadData().wheels);
const phone: Viewport = { width: 375, height: 667, radius: 375 / 2 - 8 };
const desk: Viewport = { width: 1440, height: 900, radius: 900 / 2 - 8 };
const opts = { remPx: 16, portrait: false, rest: 'whole' as const, openedY: null, sideCoreWidth: SHARED.coreWidth };

function segHeight(l: Layout, ring: number, vp: Viewport, scale: number): number {
  const r = l.rings[ring]!;
  const widths = r.segments.map((i) => l.segments[i]!.end - l.segments[i]!.start).sort((a, b) => a - b);
  const typical = widths[Math.floor(widths.length / 2)]!;
  return typical * ((r.inner + r.outer) / 2) * vp.radius * scale;
}

describe('v2.2.1: the left safe-area inset', () => {
  // An iPhone 15 sideways with its 59 px insets: the aim width ends 1.5rem before the card (spec v2.2 §3.2).
  const notched: Viewport = { width: 476, height: 393, radius: 188.5 };
  const wheels = loadData().wheels.map((w, i) => (i === 0 ? layout : buildLayout(w)));

  test('the opened cell starts 1rem after the inset and ends before the aim width, on every ring of both wheels', () => {
    for (const l of wheels) {
      for (const ring of [0, 1, 2]) {
        const r = l.rings[ring]!;
        const cam = ringFocusCamera(l, ring, notched, 0, { ...opts, insetLeft: 59 });
        const R = notched.radius * cam.scale;
        const name = `${l.wheelId} ring ${ring}`;
        expect(cam.cx + r.inner * R - 10, `${name} left`).toBeGreaterThanOrEqual(59 + 16 - 1e-9);
        expect(cam.cx + r.outer * R + 12, `${name} right`).toBeLessThanOrEqual(notched.width + 1e-9);
      }
    }
  });

  test('upright, the opened ring fits across the stage with 1rem clear, on every ring of both wheels', () => {
    const o = { remPx: 16, portrait: true, rest: 'half' as const, openedY: null, sideCoreWidth: SHARED.coreWidth };
    for (const [w, h] of [[320, 568], [360, 640], [375, 667], [390, 844], [430, 932]] as const) {
      const vp: Viewport = { width: w, height: h, radius: w / 2 - 8 };
      for (const l of wheels) {
        for (const ring of [0, 1, 2]) {
          const r = l.rings[ring]!;
          const cam = ringFocusCamera(l, ring, vp, 0, o);
          const R = vp.radius * cam.scale;
          const name = `${l.wheelId} ring ${ring} at ${w}×${h}`;
          // The opened cell's 10 px lift and 2 px outline at both ends.
          expect(cam.cx + r.inner * R - 10 - 2, `${name} left`).toBeGreaterThanOrEqual(16 - 1e-9);
          expect(cam.cx + r.outer * R + 10 + 2, `${name} right`).toBeLessThanOrEqual(w - 16 + 1e-9);
        }
      }
    }
  });

  test('an opened cell is never under 24 px tall, even where the ring cannot fit (a folded Galaxy Fold)', () => {
    const vp: Viewport = { width: 280, height: 653, radius: 132 };
    const o = { remPx: 16, portrait: true, rest: 'half' as const, openedY: null, sideCoreWidth: SHARED.coreWidth };
    for (const l of wheels) {
      for (const ring of [0, 1, 2]) {
        expect(segHeight(l, ring, vp, ringFocusCamera(l, ring, vp, 0, o).scale), `${l.wheelId} ring ${ring}`).toBeGreaterThanOrEqual(24 - 1e-9);
      }
    }
  });

  test('no inset leaves every camera as it was', () => {
    for (const ring of [0, 1, 2]) {
      expect(ringFocusCamera(layout, ring, notched, 0, { ...opts, insetLeft: 0 })).toEqual(ringFocusCamera(layout, ring, notched, 0, opts));
    }
  });
});

describe('resting cameras', () => {
  test('overviewCamera centers the wheel at scale 1', () => {
    expect(overviewCamera(desk, 0.5)).toEqual({ scale: 1, rotation: 0.5, cx: 720, cy: 450 });
  });

  test("desktop ring camera puts the opened cell's lifted outer edge and outline on the stage's right edge", () => {
    const vp: Viewport = { width: 900, height: 900, radius: 442 };
    for (const ring of [0, 1, 2]) {
      const cam = ringFocusCamera(layout, ring, vp, 0, opts);
      // The wheel's edge, plus the opened cell's 10px lift and 2px of outline, so nothing is clipped.
      expect(cam.cx + vp.radius * cam.scale + 10 + 2, `ring ${ring}`).toBeCloseTo(vp.width, 6);
      expect(cam.cy).toBe(vp.height / 2);
    }
  });

  test('desktop ring camera keeps the opened cell at least 1rem from the left', () => {
    const narrow: Viewport = { width: 500, height: 768, radius: 242 };
    const innerX = (ring: number, c: { cx: number; scale: number }): number =>
      c.cx + layout.rings[ring]!.inner * narrow.radius * c.scale - 10;
    for (const ring of [0, 1, 2]) {
      expect(innerX(ring, ringFocusCamera(layout, ring, narrow, 0, opts)), `ring ${ring}`).toBeGreaterThanOrEqual(16 - 1e-9);
    }
    // Sideways zoom spec: here the middle ring's core-ring cap keeps its cell well clear, so this safeguard now bites
    // only where that cap doesn't apply: the notched side view (see the safe-area inset tests above).
  });

  test('portrait ring camera centers the middle and outer rings horizontally, and the word vertically', () => {
    // The core ring keeps the rest view's horizontal position (known issues, round two).
    for (const ring of [1, 2]) {
      const cam = ringFocusCamera(layout, ring, phone, 0, { remPx: 16, portrait: true, rest: 'half' as const, openedY: null, sideCoreWidth: SHARED.coreWidth });
      const r = layout.rings[ring]!;
      expect(cam.cx + ((r.inner + r.outer) / 2) * phone.radius * cam.scale).toBeCloseTo(0.5 * phone.width, 6);
      expect(cam.cy).toBe(0.5 * phone.height);
    }
  });

  test('portrait ring camera puts the opened word at openedY', () => {
    const base = ringFocusCamera(layout, 1, phone, 0.4, { remPx: 16, portrait: true, rest: 'half' as const, openedY: null, sideCoreWidth: SHARED.coreWidth });
    const cam = ringFocusCamera(layout, 1, phone, 0.4, { remPx: 16, portrait: true, rest: 'half' as const, openedY: 200, sideCoreWidth: SHARED.coreWidth });
    expect(cam.cy).toBe(200);
    expect(cam.cx).toBe(base.cx);
    expect(cam.scale).toBe(base.scale);
    expect(cam.rotation).toBe(0.4);
  });

  test('openedY null keeps the stage center', () => {
    expect(ringFocusCamera(layout, 2, phone, 0, { remPx: 16, portrait: true, rest: 'half' as const, openedY: null, sideCoreWidth: SHARED.coreWidth }).cy).toBe(phone.height / 2);
  });

  test('desktop ignores openedY', () => {
    expect(ringFocusCamera(layout, 2, desk, 0, { ...opts, openedY: 200, sideCoreWidth: SHARED.coreWidth }).cy).toBe(desk.height / 2);
  });

  test('openedHalfHeight is larger for a core word than an outer word on a phone', () => {
    const o = { remPx: 16, portrait: true, rest: 'half' as const, openedY: null, sideCoreWidth: SHARED.coreWidth };
    const hostile = layout.byPath.get('angry/aggressive/hostile')!;
    const core = openedHalfHeight(layout, layout.byPath.get('angry')!, phone, o);
    const outer = openedHalfHeight(layout, hostile, phone, o);
    expect(core).toBeGreaterThan(outer);
    // Half of the lifted outer chord, 2·(outer·R·scale + 10)·sin(width/2 + side), plus 2px of outline.
    const seg = layout.segments[hostile]!;
    const r = layout.rings[2]!;
    const scale = ringFocusCamera(layout, 2, phone, 0, o).scale;
    const rOut = r.outer * phone.radius * scale + 10;
    const side = 2 / (((r.inner + r.outer) / 2) * phone.radius * scale);
    expect(outer).toBeCloseTo(rOut * Math.sin((seg.end - seg.start) / 2 + side) + 2, 6);
  });

  test('ringFocusCamera typical segment ≈ 4.5rem tall on a roomy viewport', () => {
    const cam = ringFocusCamera(layout, 2, desk, 0, opts);
    expect(segHeight(layout, 2, desk, cam.scale)).toBeCloseTo(72, 6);
  });

  test('ringFocusCamera is clamped by the 60% band rule on a narrow viewport', () => {
    const narrow: Viewport = { width: 400, height: 1000, radius: 192 };
    const cam = ringFocusCamera(layout, 1, narrow, 0, opts);
    expect((0.62 - 0.32) * narrow.radius * cam.scale).toBeLessThanOrEqual(0.6 * narrow.width + 1e-9);
    expect(segHeight(layout, 1, narrow, cam.scale)).toBeLessThan(72);
  });

  test('outer ring focus on a 375×667 viewport gives focused-ring segments ≥ 44px tall', () => {
    const cam = ringFocusCamera(layout, 2, phone, 0, { remPx: 16, portrait: true, rest: 'whole' as const, openedY: null, sideCoreWidth: SHARED.coreWidth });
    expect(segHeight(layout, 2, phone, cam.scale)).toBeGreaterThanOrEqual(44 - 1e-9);
  });

  test('half wheelCamera puts the center on the left edge, halfway down, outer edge at 95% width', () => {
    const c = wheelCamera(layout, phone, 0.3, { remPx: 16, portrait: true, rest: 'half' as const, openedY: null, sideCoreWidth: SHARED.coreWidth });
    expect(c.cx).toBe(0);
    expect(c.cy).toBe(phone.height / 2);
    expect(c.rotation).toBe(0.3);
    expect(phone.radius * c.scale).toBeCloseTo(0.95 * phone.width, 9);
  });

  test('full wheelCamera equals overviewCamera', () => {
    expect(wheelCamera(layout, desk, 0.5, opts)).toEqual(overviewCamera(desk, 0.5));
    expect(wheelCamera(layout, phone, 0.5, { ...opts, portrait: true })).toEqual(overviewCamera(phone, 0.5));
  });

  test("restRotation centers the start word (Happy) at 3 o'clock", () => {
    const happy = layout.segments[layout.byPath.get('happy')!]!;
    const off = normAngle(happy.mid + restRotation(layout));
    expect(Math.min(off, TAU - off)).toBeLessThan(1e-12);
  });

  test("restRotation centers Whole body at 3 o'clock on the body wheel", () => {
    const body = buildLayout(loadData().wheels.find((w) => w.id === 'body')!);
    const off = normAngle(body.segments[body.byPath.get('whole-body')!]!.mid + restRotation(body));
    expect(Math.min(off, TAU - off)).toBeLessThan(1e-12);
  });

  test('useHalfWheel: portrait phones only; a phone turned sideways, even under 720px wide, gets the full wheel', () => {
    const vp = (width: number, height: number): Viewport => ({ width, height, radius: Math.min(width, height) / 2 - 8 });
    expect(useHalfWheel(SHARED.outerArc, vp(375, 667))).toBe(true);
    expect(useHalfWheel(SHARED.outerArc, vp(390, 844))).toBe(true);
    expect(useHalfWheel(SHARED.outerArc, vp(667, 375))).toBe(false);
    expect(useHalfWheel(SHARED.outerArc, vp(640, 360))).toBe(false);
    expect(useHalfWheel(SHARED.outerArc, vp(700, 500))).toBe(false);
    // Known-issues spec §3: upright iPads rest on the half-wheel on both wheels.
    expect(useHalfWheel(SHARED.outerArc, vp(1024, 1366))).toBe(true);
  });

  test('isPortrait (spec v2.1 §6.1)', () => {
    for (const [w, h] of [[393, 851], [600, 500], [700, 700]] as const) expect(isPortrait({ width: w, height: h }), `${w}×${h}`).toBe(true);
    for (const [w, h] of [[851, 393], [667, 375], [1280, 800], [568, 320], [560, 320]] as const) expect(isPortrait({ width: w, height: h }), `${w}×${h}`).toBe(false);
    // Final review #3: small near-square windows (split screen) keep the portrait layout; the column would be too thin.
    for (const [w, h] of [[400, 350], [470, 460], [360, 340], [559, 320]] as const) expect(isPortrait({ width: w, height: h }), `${w}×${h}`).toBe(true);
  });

  test('restView (spec v2.1 §6.2)', () => {
    const vp = (width: number, height: number): Viewport => ({ width, height, radius: Math.min(width, height) / 2 - 8 });
    expect(restView(SHARED.outerArc, vp(393, 851), { width: 393, height: 851 })).toBe('half');
    expect(restView(SHARED.outerArc, vp(511, 393), { width: 851, height: 393 })).toBe('side');
    expect(restView(SHARED.outerArc, vp(400, 375), { width: 667, height: 375 })).toBe('side');
    expect(restView(SHARED.outerArc, vp(800, 800), { width: 1280, height: 800 })).toBe('whole');
  });

  test("the side view is the core ring view, Happy at 3 o'clock", () => {
    const vp: Viewport = { width: 511, height: 393, radius: 393 / 2 - 8 };
    const r = restRotation(layout);
    const sideOpts = { remPx: 16, portrait: false, rest: 'side' as const, openedY: null, sideCoreWidth: SHARED.coreWidth };
    expect(wheelCamera(layout, vp, r, sideOpts)).toEqual(ringFocusCamera(layout, 0, vp, r, sideOpts));
    const body = buildLayout(loadData().wheels.find((w) => w.id === 'body')!);
    expect(wheelCamera(body, vp, 0, sideOpts).scale, 'same side zoom on both wheels').toBe(wheelCamera(layout, vp, 0, sideOpts).scale);
  });

  test("portrait half-wheel: a core word keeps the rest view's horizontal position; otherwise rings stay centered", () => {
    const vp: Viewport = { width: 402, height: 600, radius: 193 };
    const half = { remPx: 16, portrait: true, rest: 'half' as const, openedY: null, sideCoreWidth: SHARED.coreWidth };
    const middle = (l: Layout, ring: number) => ((l.rings[ring]!.inner + l.rings[ring]!.outer) / 2) * vp.radius;
    for (const l of [layout, buildLayout(loadData().wheels.find((w) => w.id === 'body')!)]) {
      expect(ringFocusCamera(l, 0, vp, 0, half).cx, `${l.wheelId} half`).toBe(wheelCamera(l, vp, 0, half).cx);
      // Where the whole wheel rests (short or squarish portrait windows), the core ring stays centered as before.
      const whole = ringFocusCamera(l, 0, vp, 0, { ...half, rest: 'whole' });
      expect(whole.cx + middle(l, 0) * whole.scale, `${l.wheelId} whole`).toBeCloseTo(vp.width / 2, 6);
      for (const ring of [1, 2]) {
        const cam = ringFocusCamera(l, ring, vp, 0, half);
        const mid = ((l.rings[ring]!.inner + l.rings[ring]!.outer) / 2) * vp.radius * cam.scale;
        expect(cam.cx + mid, `${l.wheelId} ring ${ring} centered`).toBeCloseTo(vp.width / 2, 6);
      }
    }
  });

  test('portrait half-wheel: opening a core word never zooms out from the rest view (an upright iPad)', () => {
    const vp: Viewport = { width: 820, height: 1000, radius: 402 };
    const half = { remPx: 16, portrait: true, rest: 'half' as const, openedY: null, sideCoreWidth: SHARED.coreWidth };
    for (const l of [layout, buildLayout(loadData().wheels.find((w) => w.id === 'body')!)]) {
      const rest = wheelCamera(l, vp, 0, half);
      const core = ringFocusCamera(l, 0, vp, 0, half);
      expect(core.scale, l.wheelId).toBeGreaterThanOrEqual(rest.scale - 1e-9);
      expect(core.cx, l.wheelId).toBe(0);
    }
  });

  test('both wheels rest on the half-wheel on an upright iPad (820 × 1180)', () => {
    expect(restView(SHARED.outerArc, { width: 820, height: 1180, radius: 402 }, { width: 820, height: 1180 })).toBe('half');
    expect(SHARED.outerArc).toBe(Math.min(...loadData().wheels.map((w) => sharedSizes([w]).outerArc)));
  });

  test('shouldStartZoomed true for 375×667, false for 2560×1440', () => {
    expect(shouldStartZoomed(SHARED.outerArc, phone)).toBe(true);
    expect(shouldStartZoomed(SHARED.outerArc, { width: 2560, height: 1440, radius: 712 })).toBe(false);
  });
});

describe('sideways zoom spec: the core word stays in view', () => {
  // A sideways 1180 × 820 tablet: the aim width ends 1.5rem before the card.
  const tablet: Viewport = { width: 708, height: 820, radius: 346 };
  const wheels = loadData().wheels.map((w, i) => (i === 0 ? layout : buildLayout(w)));

  test('a middle word keeps the whole core ring 1rem clear of the left, on both wheels', () => {
    for (const l of wheels) {
      for (const insetLeft of [0, 59]) {
        const cam = ringFocusCamera(l, 1, tablet, 0, { ...opts, insetLeft });
        const R = tablet.radius * cam.scale;
        const name = `${l.wheelId} inset ${insetLeft}`;
        expect(cam.cx + l.rings[0]!.inner * R, name).toBeGreaterThanOrEqual(insetLeft + 16 - 1e-9);
        expect(cam.cx + R + 12, name).toBeCloseTo(tablet.width, 6);
      }
    }
  });

  test('the cap brings 1180 × 820 from 2.89 to 2.23', () => {
    expect(ringFocusCamera(layout, 1, tablet, 0, opts).scale).toBeCloseTo(2.23, 2);
  });

  test('where the core ring already fits, the middle view is unchanged', () => {
    expect(ringFocusCamera(layout, 1, { width: 996, height: 900, radius: 442 }, 0, opts).scale).toBeCloseTo(2.26, 2);
  });

  test('a core word zooms to the square root of the middle view', () => {
    const core = ringFocusCamera(layout, 0, tablet, 0, opts).scale;
    expect(core).toBeCloseTo(Math.sqrt(ringFocusCamera(layout, 1, tablet, 0, opts).scale), 6);
    expect(core).toBeCloseTo(1.49, 2);
  });

  test('a core view that already zooms further keeps its own zoom', () => {
    const body = wheels.find((l) => l.wheelId === 'body')!;
    expect(ringFocusCamera(body, 0, { width: 600, height: 768, radius: 292 }, 0, opts).scale).toBeCloseTo(1.73, 2);
  });

  test('the side view is unchanged', () => {
    const side = { ...opts, rest: 'side' as const };
    for (const l of wheels) {
      expect(ringFocusCamera(l, 0, { width: 476, height: 393, radius: 188.5 }, 0, side).scale, l.wheelId).toBeCloseTo(2.68, 2);
    }
  });

  test('the 24 px floor beats the cap', () => {
    // A tiny aim width, where keeping the core ring in view would leave middle cells under 24 px.
    const narrow: Viewport = { width: 220, height: 480, radius: 102 };
    const cap = (narrow.width - 12 - 16) / ((1 - layout.rings[0]!.inner) * narrow.radius);
    for (const l of wheels) {
      const scale = ringFocusCamera(l, 1, narrow, 0, opts).scale;
      expect(scale, l.wheelId).toBeGreaterThan(cap);
      expect(segHeight(l, 1, narrow, scale), l.wheelId).toBeCloseTo(24, 6);
    }
  });
});

describe('camera controller', () => {
  let now = 0;
  let queue: Map<number, FrameRequestCallback>;
  let nextId = 1;
  let rafCalls = 0;
  let reduced = false;
  let cam: CameraController;
  let settles = 0;
  let frames = 0;

  const step = (ms: number): void => {
    const end = now + ms;
    while (now < end) {
      now = Math.min(end, now + 1000 / 60);
      const cbs = [...queue.values()];
      queue.clear();
      for (const cb of cbs) cb(now);
    }
  };

  beforeEach(() => {
    now = 0; queue = new Map(); nextId = 1; rafCalls = 0; reduced = false; settles = 0; frames = 0;
    cam = createCameraController({
      now: () => now,
      raf: (cb) => { rafCalls++; const id = nextId++; queue.set(id, cb); return id; },
      caf: (id) => { queue.delete(id); },
      reducedMotion: () => reduced,
    });
    cam.onSettle(() => settles++);
    cam.onFrame(() => frames++);
    cam.jump({ scale: 1, rotation: 0, cx: 0, cy: 0 });
    step(20);
  });

  test('animateTo at OMEGA 14: about 90% done by 280ms, within 1% by 500ms, settled by 1000ms', () => {
    cam.animateTo({ rotation: 0.2 });
    step(200);
    expect(Math.abs(cam.current.rotation - 0.2)).toBeGreaterThan(0.03);
    step(80);
    expect(Math.abs(cam.current.rotation - 0.2)).toBeLessThanOrEqual(0.02);
    step(220);
    expect(Math.abs(cam.current.rotation - 0.2)).toBeLessThanOrEqual(0.002);
    expect(settles).toBe(0);
    step(500);
    expect(cam.moving).toBe(false);
    expect(cam.current.rotation).toBe(0.2);
    expect(settles).toBe(1);
    expect(frames).toBeGreaterThan(10);
  });

  test('target equals the fling destination while moving and current at rest', () => {
    cam.fling(3, 1, layout);
    step(30);
    expect(cam.moving).toBe(true);
    const dest = { ...cam.target };
    expect(dest.rotation).not.toBeCloseTo(cam.current.rotation, 3);
    step(2000);
    expect(cam.moving).toBe(false);
    expect(cam.target).toEqual(cam.current);
    expect(cam.current.rotation).toBeCloseTo(normAngle(dest.rotation), 9);
  });

  test('expensive frames do not slow the animation down (dt is measured frame to frame)', () => {
    cam.onFrame(() => { now += 15; }); // each draw takes 15 ms of the 16.7 ms frame
    cam.animateTo({ rotation: 0.2 });
    let t = now;
    for (let k = 0; k < 70; k++) {
      t += 1000 / 60;
      now = t;
      const cbs = [...queue.values()];
      queue.clear();
      for (const cb of cbs) cb(t);
    }
    expect(cam.moving).toBe(false);
    expect(cam.current.rotation).toBe(0.2);
  });

  test('no raf is scheduled after settle', () => {
    cam.animateTo({ scale: 2 });
    step(1000);
    const calls = rafCalls;
    step(1000);
    expect(rafCalls).toBe(calls);
    expect(queue.size).toBe(0);
  });

  test('fling lands exactly at a segment mid', () => {
    cam.fling(3, 2, layout);
    step(1500);
    expect(cam.moving).toBe(false);
    const hits = layout.rings[2]!.segments.map((i) => {
      const off = normAngle(layout.segments[i]!.mid + cam.current.rotation);
      return Math.min(off, TAU - off);
    });
    expect(Math.min(...hits)).toBeLessThan(1e-9);
    expect(settles).toBe(1);
  });

  test('fling with no snap ring coasts and stops', () => {
    cam.fling(2, null, layout);
    step(1500);
    expect(cam.moving).toBe(false);
    expect(cam.current.rotation).toBeCloseTo(0.65, 6);
  });

  test('stop() cancels and current stays where it was', () => {
    cam.animateTo({ rotation: 1 });
    step(100);
    const r = cam.current.rotation;
    cam.stop();
    expect(cam.moving).toBe(false);
    step(500);
    expect(cam.current.rotation).toBe(r);
    expect(queue.size).toBe(0);
  });

  test('jump never fires onSettle', () => {
    cam.jump({ scale: 1, rotation: 0.4, cx: 0, cy: 0 });
    step(100);
    expect(settles).toBe(0);
    expect(cam.current.rotation).toBe(0.4);
  });

  test('reducedMotion: animateTo jumps immediately and still settles once', () => {
    reduced = true;
    cam.animateTo({ rotation: 1.5, scale: 3 });
    expect(cam.current.rotation).toBe(1.5);
    expect(cam.current.scale).toBe(3);
    step(50);
    expect(settles).toBe(1);
    expect(cam.moving).toBe(false);
  });

  test('rotation is normalized to [0, 2π) after settling from rotation 1000', () => {
    cam.jump({ scale: 1, rotation: 1000, cx: 0, cy: 0 });
    cam.animateTo({ rotation: 1000.1 });
    step(1000);
    expect(cam.current.rotation).toBeGreaterThanOrEqual(0);
    expect(cam.current.rotation).toBeLessThan(TAU);
    expect(cam.current.rotation).toBeCloseTo(normAngle(1000.1), 9);
  });
});
