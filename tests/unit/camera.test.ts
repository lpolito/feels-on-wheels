import { beforeEach, describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';
import { buildLayout } from '../../src/model/layout';
import { TAU, normAngle, type Viewport } from '../../src/model/geometry';
import {
  createCameraController, nearestRestingState, overviewCamera, ringFocusCamera, shouldStartZoomed,
  type CameraController,
} from '../../src/camera';

const layout = buildLayout(loadData().wheel);
const phone: Viewport = { width: 375, height: 667, radius: 375 / 2 - 8 };
const desk: Viewport = { width: 1440, height: 900, radius: 900 / 2 - 8 };
const opts = { remPx: 16, portrait: false };

function segHeight(ring: number, vp: Viewport, scale: number): number {
  const r = layout.rings[ring]!;
  const widths = r.segments.map((i) => layout.segments[i]!.end - layout.segments[i]!.start).sort((a, b) => a - b);
  const typical = widths[Math.floor(widths.length / 2)]!;
  return typical * ((r.inner + r.outer) / 2) * vp.radius * scale;
}

describe('resting cameras', () => {
  test('overviewCamera centers the wheel at scale 1', () => {
    expect(overviewCamera(desk, 0.5)).toEqual({ scale: 1, rotation: 0.5, cx: 720, cy: 450 });
  });

  test('ringFocusCamera puts ring mid-radius at 40% width (50% portrait)', () => {
    for (const [o, frac] of [[opts, 0.4], [{ remPx: 16, portrait: true }, 0.5]] as const) {
      const cam = ringFocusCamera(layout, 1, desk, 0, o);
      const rMid = (0.32 + 0.62) / 2;
      expect(cam.cx + rMid * desk.radius * cam.scale).toBeCloseTo(frac * desk.width, 6);
      expect(cam.cy).toBe(desk.height / 2);
    }
  });

  test('ringFocusCamera typical segment ≈ 4.5rem tall on a roomy viewport', () => {
    const cam = ringFocusCamera(layout, 2, desk, 0, opts);
    expect(segHeight(2, desk, cam.scale)).toBeCloseTo(72, 6);
  });

  test('ringFocusCamera is clamped by the 60% band rule on a narrow viewport', () => {
    const narrow: Viewport = { width: 400, height: 1000, radius: 192 };
    const cam = ringFocusCamera(layout, 1, narrow, 0, opts);
    expect((0.62 - 0.32) * narrow.radius * cam.scale).toBeLessThanOrEqual(0.6 * narrow.width + 1e-9);
    expect(segHeight(1, narrow, cam.scale)).toBeLessThan(72);
  });

  test('outer ring focus on a 375×667 viewport gives focused-ring segments ≥ 44px tall', () => {
    const cam = ringFocusCamera(layout, 2, phone, 0, { remPx: 16, portrait: true });
    expect(segHeight(2, phone, cam.scale)).toBeGreaterThanOrEqual(44 - 1e-9);
  });

  test('shouldStartZoomed true for 375×667, false for 1440×900', () => {
    expect(shouldStartZoomed(layout, phone)).toBe(true);
    expect(shouldStartZoomed(layout, desk)).toBe(false);
  });

  test('nearestRestingState picks overview below the midpoint scale, ring above', () => {
    const ringCam = ringFocusCamera(layout, 0, desk, 0, opts);
    const mid = (1 + ringCam.scale) / 2;
    const at = (scale: number) => ({ ...ringCam, scale });
    expect(nearestRestingState(layout, at(mid * 0.9), desk, opts)).toEqual({ mode: 'overview' });
    expect(nearestRestingState(layout, ringCam, desk, opts)).toEqual({ mode: 'ring', ring: 0 });
    const outer = ringFocusCamera(layout, 2, desk, 0, opts);
    expect(nearestRestingState(layout, outer, desk, opts)).toEqual({ mode: 'ring', ring: 2 });
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

  test('animateTo approaches within 1% by 300ms and settles by 600ms, calling onSettle once', () => {
    cam.animateTo({ rotation: 0.2 });
    step(300);
    expect(Math.abs(cam.current.rotation - 0.2)).toBeLessThan(0.002);
    step(300);
    expect(cam.moving).toBe(false);
    expect(cam.current.rotation).toBe(0.2);
    expect(settles).toBe(1);
    expect(frames).toBeGreaterThan(10);
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
