import { beforeEach, describe, expect, test, vi } from 'vitest';
import { loadData } from '../../src/data/load';
import { buildLayout } from '../../src/model/layout';
import { TAU, normAngle, type Camera, type Viewport } from '../../src/model/geometry';
import { createCameraController, type CameraController } from '../../src/camera';
import { createStore, initialState, type Store } from '../../src/state/store';
import { createController, type Controller } from '../../src/controller';

const layout = buildLayout(loadData().wheel);
const idx = (p: string): number => layout.byPath.get(p)!;
const desk: Viewport = { width: 1200, height: 900, radius: 442 };
const opts = { remPx: 16, portrait: false };

let now = 0;
let queue: Map<number, FrameRequestCallback>;
let nextId = 1;
let store: Store;
let camera: CameraController;
let ctl: Controller;

const step = (ms: number): void => {
  const end = now + ms;
  while (now < end) {
    now = Math.min(end, now + 1000 / 60);
    const cbs = [...queue.values()];
    queue.clear();
    for (const cb of cbs) cb(now);
  }
};

function screenOf(i: number, cam: Camera = camera.current): { x: number; y: number } {
  const s = layout.segments[i]!;
  const ring = layout.rings[s.ring]!;
  const d = ((ring.inner + ring.outer) / 2) * desk.radius * cam.scale;
  return { x: cam.cx + d * Math.cos(s.mid + cam.rotation), y: cam.cy + d * Math.sin(s.mid + cam.rotation) };
}

const offCenter = (i: number): number => {
  const off = normAngle(layout.segments[i]!.mid + camera.current.rotation);
  return Math.min(off, TAU - off);
};

function setup(initial = initialState): void {
  now = 0; queue = new Map(); nextId = 1;
  store = createStore(layout, initial);
  camera = createCameraController({
    now: () => now,
    raf: (cb) => { const id = nextId++; queue.set(id, cb); return id; },
    caf: (id) => { queue.delete(id); },
    reducedMotion: () => false,
  });
  ctl = createController(layout, store, camera, desk, opts);
  step(50);
}

beforeEach(() => setup());

describe('taps', () => {
  test('tap on hostile in overview selects it, no rotation change', () => {
    const p = screenOf(idx('angry/aggressive/hostile'));
    const before = camera.current.rotation;
    ctl.handle([{ type: 'tap', ...p }]);
    step(500);
    expect(store.get().selected).toBe(idx('angry/aggressive/hostile'));
    expect(camera.current.rotation).toBe(before);
  });

  test('tap outside the wheel clears', () => {
    ctl.handle([{ type: 'tap', ...screenOf(idx('sad')) }]);
    ctl.handle([{ type: 'tap', x: 2, y: 2 }]);
    expect(store.get().selected).toBeNull();
  });

  test('tap in ring mode selects and rotation settles with it at angle 0', () => {
    setup({ ...initialState, view: { mode: 'ring', ring: 2 } });
    step(1000);
    const target = layout.rings[2]!.segments.find((i) => {
      const p = screenOf(i);
      return p.y > 50 && p.y < desk.height / 2 - 100 && p.x > 0 && p.x < desk.width;
    })!;
    ctl.handle([{ type: 'tap', ...screenOf(target) }]);
    step(1000);
    expect(store.get().selected).toBe(target);
    expect(offCenter(target)).toBeLessThan(1e-9);
  });

  test('tap during fling stops motion and selects the segment under the finger at the live camera', () => {
    setup({ ...initialState, view: { mode: 'ring', ring: 2 } });
    step(1000);
    ctl.handle([{ type: 'dragStart', x: 500, y: 450, axis: 'y' }, { type: 'dragEnd', vx: 0, vy: 2500 }]);
    step(80);
    expect(camera.moving).toBe(true);
    const live = { ...camera.current };
    const onRight = layout.rings[2]!.segments.filter((i) => screenOf(i, live).x > live.cx);
    const dist = (i: number) => Math.abs(screenOf(i, live).y - desk.height / 2);
    const target = onRight.reduce((a, b) => (dist(b) < dist(a) ? b : a));
    ctl.handle([{ type: 'tap', ...screenOf(target, live) }]);
    expect(store.get().selected).toBe(target);
    step(1000);
    expect(offCenter(target)).toBeLessThan(1e-9);
  });

  test('double tap in overview zooms into that ring with it selected', () => {
    const hostile = idx('angry/aggressive/hostile');
    ctl.handle([{ type: 'doubleTap', ...screenOf(hostile) }]);
    step(1000);
    expect(store.get().view).toEqual({ mode: 'ring', ring: 2 });
    expect(store.get().selected).toBe(hostile);
    expect(offCenter(hostile)).toBeLessThan(1e-9);
    ctl.handle([{ type: 'doubleTap', x: 600, y: 450 }]);
    expect(store.get().view).toEqual({ mode: 'overview' });
  });
});

describe('spinning', () => {
  test('drag then dragEnd in ring mode settles exactly on a segment mid and selects it', () => {
    setup({ ...initialState, view: { mode: 'ring', ring: 1 } });
    step(1000);
    ctl.handle([
      { type: 'dragStart', x: 500, y: 400, axis: 'y' },
      { type: 'drag', x: 500, y: 430, dx: 0, dy: 30 },
      { type: 'drag', x: 500, y: 470, dx: 0, dy: 40 },
      { type: 'dragEnd', vx: 0, vy: 900 },
    ]);
    step(1500);
    const s = store.get();
    expect(s.interacted).toBe(true);
    expect(s.selected).not.toBeNull();
    expect(layout.segments[s.selected!]!.ring).toBe(1);
    expect(offCenter(s.selected!)).toBeLessThan(1e-9);
  });

  test('scroll in ring mode rotates and snaps after scrollEnd', () => {
    setup({ ...initialState, view: { mode: 'ring', ring: 2 } });
    step(1000);
    ctl.handle([{ type: 'scroll', dy: 40 }, { type: 'scroll', dy: 40 }, { type: 'scrollEnd' }]);
    step(1000);
    expect(store.get().selected).not.toBeNull();
    expect(offCenter(store.get().selected!)).toBeLessThan(1e-9);
  });

  test('ArrowDown (step) in ring mode rotates to the next segment', () => {
    setup({ ...initialState, view: { mode: 'ring', ring: 0 } });
    step(1000);
    const centered = store.get().focused!;
    store.dispatch({ type: 'step', delta: 1 });
    step(1000);
    const next = layout.rings[0]!.segments[(layout.rings[0]!.segments.indexOf(centered) + 1) % 7]!;
    expect(store.get().selected).toBe(next);
    expect(offCenter(next)).toBeLessThan(1e-9);
  });
});

describe('rings and zoom', () => {
  test('swipe right from ring 2 → ring 1, and the settled segment is selected', () => {
    setup({ ...initialState, view: { mode: 'ring', ring: 2 } });
    step(1000);
    ctl.handle([{ type: 'swipe', dir: 'right' }]);
    step(1000);
    const s = store.get();
    expect(s.view).toEqual({ mode: 'ring', ring: 1 });
    expect(layout.segments[s.selected!]!.ring).toBe(1);
    expect(offCenter(s.selected!)).toBeLessThan(1e-9);
  });

  test('pinchEnd past the midpoint → ring mode; below it → overview', () => {
    ctl.handle([{ type: 'pinch', scale: 3, cx: 900, cy: 450 }, { type: 'pinchEnd' }]);
    step(1000);
    expect(store.get().view.mode).toBe('ring');
    ctl.handle([{ type: 'pinch', scale: 0.3, cx: 600, cy: 450 }, { type: 'pinchEnd' }]);
    step(1000);
    expect(store.get().view).toEqual({ mode: 'overview' });
    expect(camera.current.scale).toBe(1);
  });

  test('ctrl-wheel zoom resolves to a resting state after 150ms', () => {
    vi.useFakeTimers();
    try {
      for (let k = 0; k < 10; k++) ctl.handle([{ type: 'zoomWheel', factor: 1.2, cx: 900, cy: 450 }]);
      vi.advanceTimersByTime(200);
      step(1000);
      expect(store.get().view.mode).toBe('ring');
    } finally {
      vi.useRealTimers();
    }
  });

  test('setViewport while zoomed keeps the same segment centered at angle 0', () => {
    setup({ ...initialState, view: { mode: 'ring', ring: 2 } });
    step(1000);
    const centered = store.get().focused!;
    ctl.setViewport({ width: 700, height: 1000, radius: 342 }, { remPx: 16, portrait: true });
    step(1000);
    expect(offCenter(centered)).toBeLessThan(1e-9);
    expect(camera.current.cx + 0.81 * 342 * camera.current.scale).toBeCloseTo(350, 6);
  });

  test('setViewport with an unchanged viewport does not interrupt motion', () => {
    setup({ ...initialState, view: { mode: 'ring', ring: 0 } });
    step(1000);
    camera.animateTo({ rotation: camera.current.rotation + 1 });
    step(50);
    ctl.setViewport({ ...desk }, { ...opts });
    expect(camera.moving).toBe(true);
  });

  test('setViewport mid-animation centers the intended segment and keeps focus in sync', () => {
    setup({ ...initialState, view: { mode: 'ring', ring: 0 } });
    step(1000);
    const intended = store.get().focused!;
    camera.jump({ ...camera.current, rotation: camera.current.rotation - 2 });
    camera.animateTo({ rotation: camera.current.rotation + 2 });
    step(50);
    ctl.setViewport({ width: 900, height: 900, radius: 442 }, opts);
    step(1000);
    expect(offCenter(intended)).toBeLessThan(1e-9);
    expect(store.get().focused).toBe(intended);
  });

  test('zoom out via store returns the camera to overview', () => {
    setup({ ...initialState, view: { mode: 'ring', ring: 1 } });
    step(1000);
    store.dispatch({ type: 'zoomOut' });
    step(1000);
    expect(camera.current.scale).toBe(1);
    expect(camera.current.cx).toBe(600);
  });
});
