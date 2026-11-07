import { beforeEach, describe, expect, test, vi } from 'vitest';
import { loadData } from '../../src/data/load';
import { buildLayout } from '../../src/model/layout';
import { TAU, hitTest, normAngle, segmentAt, type Camera, type Viewport } from '../../src/model/geometry';
import { createCameraController, type CameraController } from '../../src/camera';
import { createStore, initialState, type Action, type State, type Store } from '../../src/state/store';
import { createController, type Controller } from '../../src/controller';

const layout = buildLayout(loadData().wheel);
const idx = (p: string): number => layout.byPath.get(p)!;
const desk: Viewport = { width: 1200, height: 900, radius: 442 };
const opts = { remPx: 16, portrait: false, anchorY: 0.5 };

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

const opened = (p: string): State => ({ selected: idx(p), opened: true, view: { mode: 'ring', ring: layout.segments[idx(p)]!.ring }, hinted: false });
const phoneStart = (p: string): State => ({ selected: idx(p), opened: false, view: { mode: 'ring', ring: 0 }, hinted: true });

/** A screen point over no word (outside the wheel or in the hole). */
function missPoint(): { x: number; y: number } {
  for (let y = 5; y < desk.height; y += 20) {
    for (let x = 5; x < desk.width; x += 20) {
      if (hitTest(layout, camera.current, desk, x, y) === null) return { x, y };
    }
  }
  throw new Error('no miss point');
}

/** A word of `ring` fully on screen, other than `not`. */
function visibleIn(ring: number, not: number): number {
  return layout.rings[ring]!.segments.find((i) => {
    if (i === not) return false;
    const p = screenOf(i);
    return p.x > 40 && p.x < desk.width - 40 && p.y > 40 && p.y < desk.height - 40 && hitTest(layout, camera.current, desk, p.x, p.y) === i;
  })!;
}

const sameAngle = (a: number, b: number): number => {
  const d = normAngle(a - b);
  return Math.min(d, TAU - d);
};


describe('taps', () => {
  test('tap selects without moving the camera on the whole wheel', () => {
    const p = screenOf(idx('angry/aggressive/hostile'));
    const before = { ...camera.current };
    ctl.handle([{ type: 'tap', ...p }]);
    step(500);
    expect(store.get()).toMatchObject({ selected: idx('angry/aggressive/hostile'), opened: false, view: { mode: 'wheel' } });
    expect(camera.current).toEqual(before);
  });

  test('tap on the selected word opens it: ring view, centred at angle 0', () => {
    const hostile = idx('angry/aggressive/hostile');
    ctl.handle([{ type: 'tap', ...screenOf(hostile) }]);
    step(500);
    ctl.handle([{ type: 'tap', ...screenOf(hostile) }]);
    step(1000);
    expect(store.get()).toEqual(opened('angry/aggressive/hostile'));
    expect(offCenter(hostile)).toBeLessThan(1e-9);
  });

  test('tapping another word while opened opens it and centres it', () => {
    setup(opened('angry/aggressive/hostile'));
    step(1000);
    const other = visibleIn(2, idx('angry/aggressive/hostile'));
    ctl.handle([{ type: 'tap', ...screenOf(other) }]);
    step(1000);
    expect(store.get().selected).toBe(other);
    expect(store.get().opened).toBe(true);
    expect(offCenter(other)).toBeLessThan(1e-9);
  });

  test('tap outside while opened closes to the saved rotation, selection kept', () => {
    const hostile = idx('angry/aggressive/hostile');
    const rot0 = camera.current.rotation;
    ctl.handle([{ type: 'tap', ...screenOf(hostile) }]);
    ctl.handle([{ type: 'tap', ...screenOf(hostile) }]);
    step(1000);
    expect(store.get().opened).toBe(true);
    ctl.handle([{ type: 'tap', ...missPoint() }]);
    step(1000);
    expect(store.get()).toMatchObject({ selected: hostile, opened: false, view: { mode: 'wheel' } });
    expect(camera.current.scale).toBe(1);
    expect(sameAngle(camera.current.rotation, rot0)).toBeLessThan(1e-6);
  });

  test('tap outside while selected clears', () => {
    ctl.handle([{ type: 'tap', ...screenOf(idx('sad')) }]);
    ctl.handle([{ type: 'tap', x: 2, y: 2 }]);
    expect(store.get().selected).toBeNull();
  });

  test('double-tap on an unselected word opens it', () => {
    const hostile = idx('angry/aggressive/hostile');
    store.dispatch({ type: 'select', segment: idx('sad') });
    const p = screenOf(hostile);
    ctl.handle([{ type: 'tap', ...p }]);
    ctl.handle([{ type: 'doubleTap', ...p }]);
    step(1000);
    expect(store.get()).toEqual(opened('angry/aggressive/hostile'));
    expect(offCenter(hostile)).toBeLessThan(1e-9);
  });

  test('double-tap on the selected word opens it even though the first tap starts the zoom', () => {
    const sad = idx('sad');
    store.dispatch({ type: 'select', segment: sad });
    const p = screenOf(sad);
    ctl.handle([{ type: 'tap', ...p }]);
    step(150);
    ctl.handle([{ type: 'doubleTap', ...p }]);
    step(1000);
    expect(store.get()).toEqual(opened('sad'));
  });

  test('double-tap on a neighbour in phone-start view opens that neighbour, not what the camera moved under the finger', () => {
    setup(phoneStart('angry'));
    step(1000);
    const target = idx('disgusted');
    const p = screenOf(target);
    expect(hitTest(layout, camera.current, desk, p.x, p.y)).toBe(target);
    ctl.handle([{ type: 'tap', ...p }]);
    step(150);
    ctl.handle([{ type: 'doubleTap', ...p }]);
    step(1000);
    expect(store.get()).toEqual(opened('disgusted'));
  });

  test('double-tap on another word while opened opens that word', () => {
    setup(opened('angry/aggressive/hostile'));
    step(1000);
    const other = visibleIn(2, idx('angry/aggressive/hostile'));
    const p = screenOf(other);
    ctl.handle([{ type: 'tap', ...p }]);
    step(200);
    ctl.handle([{ type: 'doubleTap', ...p }]);
    step(1000);
    expect(store.get()).toEqual(opened(layout.segments[other]!.path));
  });

  test('double-tap outside while opened closes and opens nothing, even as the wheel zooms out under the finger', () => {
    setup(opened('angry/aggressive/hostile'));
    step(1000);
    const p = missPoint();
    ctl.handle([{ type: 'tap', ...p }]);
    step(200);
    ctl.handle([{ type: 'doubleTap', ...p }]);
    step(1000);
    expect(store.get()).toMatchObject({ selected: idx('angry/aggressive/hostile'), opened: false, view: { mode: 'wheel' } });
  });

  test('tapping the hole to stop a spin keeps the opened word', () => {
    setup(opened('angry/aggressive/hostile'));
    step(1000);
    ctl.handle([{ type: 'dragStart', x: 500, y: 450, axis: 'y' }, { type: 'dragEnd', vx: 0, vy: 2500 }]);
    step(60);
    expect(camera.moving).toBe(true);
    ctl.handle([{ type: 'tap', ...missPoint() }]);
    expect(store.get().opened).toBe(true);
    step(1000);
    expect(store.get().opened).toBe(true);
    expect(offCenter(store.get().selected!)).toBeLessThan(1e-9);
  });

  test('tapping outside to stop a whole-wheel spin keeps the selection', () => {
    store.dispatch({ type: 'select', segment: idx('sad') });
    const top = { x: desk.width / 2, y: desk.height / 2 - 300 };
    ctl.handle([{ type: 'dragStart', ...top, axis: 'x' }, { type: 'dragEnd', vx: 800, vy: 0 }]);
    step(30);
    expect(camera.moving).toBe(true);
    ctl.handle([{ type: 'tap', x: 2, y: 2 }]);
    expect(store.get().selected).toBe(idx('sad'));
  });

  test('double-tap outside while opened closes', () => {
    setup(opened('angry'));
    step(1000);
    const p = missPoint();
    ctl.handle([{ type: 'tap', ...p }]);
    ctl.handle([{ type: 'doubleTap', ...p }]);
    step(1000);
    expect(store.get()).toMatchObject({ selected: idx('angry'), opened: false, view: { mode: 'wheel' } });
  });

  test('tap during a fling selects (or opens) the word under the finger, never clears', () => {
    setup(opened('angry/aggressive/hostile'));
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
    expect(store.get().opened).toBe(true);
    step(1000);
    expect(store.get().selected).toBe(target);
    expect(offCenter(target)).toBeLessThan(1e-9);
  });

  test('tapping the selected word while the wheel spins keeps it selected and does not open it', () => {
    const sad = idx('sad');
    store.dispatch({ type: 'select', segment: sad });
    const top = { x: desk.width / 2, y: desk.height / 2 - 300 };
    ctl.handle([{ type: 'dragStart', ...top, axis: 'x' }, { type: 'dragEnd', vx: 800, vy: 0 }]);
    step(30);
    expect(camera.moving).toBe(true);
    ctl.handle([{ type: 'tap', ...screenOf(sad, { ...camera.current }) }]);
    expect(store.get()).toMatchObject({ selected: sad, opened: false });
  });
});

describe('spinning', () => {
  test('drag + dragEnd while opened settles exactly on a segment mid and opens it', () => {
    setup(opened('angry/aggressive'));
    step(1000);
    ctl.handle([
      { type: 'dragStart', x: 500, y: 400, axis: 'y' },
      { type: 'drag', x: 500, y: 430, dx: 0, dy: 30 },
      { type: 'drag', x: 500, y: 470, dx: 0, dy: 40 },
      { type: 'dragEnd', vx: 0, vy: 900 },
    ]);
    step(1500);
    const s = store.get();
    expect(s.opened).toBe(true);
    expect(s.selected).not.toBe(idx('angry/aggressive'));
    expect(layout.segments[s.selected!]!.ring).toBe(1);
    expect(offCenter(s.selected!)).toBeLessThan(1e-9);
  });

  test('spinning the whole wheel only rotates; the selection does not change', () => {
    store.dispatch({ type: 'select', segment: idx('sad') });
    const top = { x: desk.width / 2, y: desk.height / 2 - 300 };
    const before = camera.current.rotation;
    ctl.handle([{ type: 'dragStart', ...top, axis: 'x' }, { type: 'drag', x: top.x + 80, y: top.y, dx: 80, dy: 0 }, { type: 'dragEnd', vx: 900, vy: 0 }]);
    step(1500);
    expect(store.get()).toMatchObject({ selected: idx('sad'), opened: false, view: { mode: 'wheel' } });
    expect(sameAngle(camera.current.rotation, before)).toBeGreaterThan(0.1);
  });

  test('spinning in phone-start view selects the settled word without opening it', () => {
    setup(phoneStart('angry'));
    step(1000);
    ctl.handle([
      { type: 'dragStart', x: 500, y: 400, axis: 'y' },
      { type: 'drag', x: 500, y: 500, dx: 0, dy: 100 },
      { type: 'dragEnd', vx: 0, vy: 1500 },
    ]);
    step(1500);
    const s = store.get();
    expect(s.opened).toBe(false);
    expect(s.hinted).toBe(false);
    expect(s.selected).not.toBe(idx('angry'));
    expect(layout.segments[s.selected!]!.ring).toBe(0);
    expect(offCenter(s.selected!)).toBeLessThan(1e-9);
  });

  test('scroll while opened rotates and snaps after scrollEnd', () => {
    setup(opened('angry/aggressive/hostile'));
    step(1000);
    ctl.handle([{ type: 'scroll', dy: 40 }, { type: 'scroll', dy: 40 }, { type: 'scrollEnd' }]);
    step(1000);
    expect(store.get().opened).toBe(true);
    expect(offCenter(store.get().selected!)).toBeLessThan(1e-9);
  });

  test('swipe right while opened opens the parent; swipe left opens the centre child', () => {
    setup(opened('angry/aggressive'));
    step(1000);
    ctl.handle([{ type: 'swipe', dir: 'left', vx: -900, vy: 0 }]);
    step(1000);
    expect(store.get()).toEqual(opened('angry/aggressive/hostile'));
    expect(offCenter(idx('angry/aggressive/hostile'))).toBeLessThan(1e-9);
    ctl.handle([{ type: 'swipe', dir: 'right', vx: 900, vy: 0 }]);
    step(1000);
    expect(store.get()).toEqual(opened('angry/aggressive'));
    expect(offCenter(idx('angry/aggressive'))).toBeLessThan(1e-9);
  });

  test('swipe left on an opened leaf leaves it opened and centred', () => {
    setup(opened('angry/aggressive/hostile'));
    step(1000);
    ctl.handle([{ type: 'swipe', dir: 'left', vx: -900, vy: 0 }]);
    step(1000);
    expect(store.get()).toEqual(opened('angry/aggressive/hostile'));
    expect(offCenter(idx('angry/aggressive/hostile'))).toBeLessThan(1e-9);
  });

  test('ArrowDown (step) while opened opens and centres the next word', () => {
    setup(opened('angry'));
    step(1000);
    store.dispatch({ type: 'step', delta: 1 });
    step(1000);
    expect(store.get()).toEqual(opened('disgusted'));
    expect(offCenter(idx('disgusted'))).toBeLessThan(1e-9);
  });
});

describe('pinch and zoom', () => {
  test("ctrl-wheel zoom over Sad on the whole wheel opens Sad, not the word at 3 o'clock", () => {
    vi.useFakeTimers();
    try {
      const sad = idx('sad');
      expect(segmentAt(layout, 0, normAngle(-camera.current.rotation))).not.toBe(sad);
      const p = screenOf(sad);
      for (let k = 0; k < 5; k++) ctl.handle([{ type: 'zoomWheel', factor: 1.2, cx: p.x, cy: p.y }]);
      vi.advanceTimersByTime(150);
      step(1000);
      expect(store.get()).toEqual(opened('sad'));
      expect(offCenter(sad)).toBeLessThan(1e-9);
    } finally {
      vi.useRealTimers();
    }
  });

  test('pinch in on the whole wheel opens the word under the midpoint', () => {
    const p = screenOf(idx('happy'));
    ctl.handle([{ type: 'pinch', scale: 1.5, cx: p.x, cy: p.y }, { type: 'pinchEnd' }]);
    step(1000);
    expect(store.get()).toEqual(opened('happy'));
  });

  test('pinch in over the hole with nothing selected changes nothing and springs back', () => {
    const before = { ...camera.current };
    const seen: Action[] = [];
    store.subscribe((_s, _p, a) => seen.push(a));
    ctl.handle([{ type: 'pinch', scale: 2, cx: desk.width / 2, cy: desk.height / 2 }, { type: 'pinchEnd' }]);
    step(1000);
    expect(store.get().selected).toBeNull();
    expect(store.get().opened).toBe(false);
    expect(seen.map((a) => a.type)).toEqual(['dismissHint']);
    expect(camera.current.scale).toBeCloseTo(before.scale, 6);
    expect(camera.current.cx).toBeCloseTo(before.cx, 3);
  });

  test('small pinch out on an opened outer word opens its parent', () => {
    setup(opened('angry/aggressive/hostile'));
    step(1000);
    ctl.handle([{ type: 'pinch', scale: 0.8, cx: 500, cy: 450 }, { type: 'pinchEnd' }]);
    step(1000);
    expect(store.get()).toEqual(opened('angry/aggressive'));
    expect(offCenter(idx('angry/aggressive'))).toBeLessThan(1e-9);
  });

  test('big pinch out closes', () => {
    setup(opened('angry/aggressive/hostile'));
    step(1000);
    ctl.handle([{ type: 'pinch', scale: 0.4, cx: 500, cy: 450 }, { type: 'pinchEnd' }]);
    step(1000);
    expect(store.get()).toMatchObject({ selected: idx('angry/aggressive/hostile'), opened: false, view: { mode: 'wheel' } });
    expect(camera.current.scale).toBe(1);
  });

  test('pinch in on an opened leaf leaves it opened and centred', () => {
    setup(opened('angry/aggressive/hostile'));
    step(1000);
    const p = screenOf(idx('angry/aggressive/hostile'));
    ctl.handle([{ type: 'pinch', scale: 1.4, cx: p.x, cy: p.y }, { type: 'pinchEnd' }]);
    step(1000);
    expect(store.get()).toEqual(opened('angry/aggressive/hostile'));
    expect(offCenter(idx('angry/aggressive/hostile'))).toBeLessThan(1e-9);
  });

  test('pinch out in phone-start view goes to the whole wheel, selection kept', () => {
    setup(phoneStart('happy'));
    step(1000);
    ctl.handle([{ type: 'pinch', scale: 0.5, cx: 500, cy: 450 }, { type: 'pinchEnd' }]);
    step(1000);
    expect(store.get()).toMatchObject({ selected: idx('happy'), opened: false, view: { mode: 'wheel' } });
    expect(camera.current.scale).toBe(1);
  });
});

describe('intro and restore', () => {
  test('playIntro lands centred on the selected core word without dispatching anything but settled', () => {
    setup(phoneStart('sad'));
    const seen: Action[] = [];
    store.subscribe((_s, _p, a) => seen.push(a));
    ctl.playIntro();
    step(16);
    expect(camera.current.scale).toBeLessThan(1.2);
    step(2000);
    expect(store.get()).toEqual(phoneStart('sad'));
    expect(seen.every((a) => a.type === 'settled')).toBe(true);
    expect(offCenter(idx('sad'))).toBeLessThan(1e-9);
  });

  test('restore during a fling wins: the late settled is ignored', () => {
    setup(opened('angry/aggressive/hostile'));
    step(1000);
    ctl.handle([{ type: 'dragStart', x: 500, y: 450, axis: 'y' }, { type: 'dragEnd', vx: 0, vy: 2500 }]);
    step(80);
    expect(camera.moving).toBe(true);
    const target = opened('sad/hurt/embarrassed');
    store.dispatch({ type: 'restore', state: target });
    step(2000);
    expect(store.get()).toEqual(target);
    expect(offCenter(idx('sad/hurt/embarrassed'))).toBeLessThan(1e-9);
  });

  test('restore during the phone intro wins', () => {
    setup(phoneStart('sad'));
    ctl.playIntro();
    step(80);
    const target = opened('angry/aggressive');
    store.dispatch({ type: 'restore', state: target });
    step(2000);
    expect(store.get()).toEqual(target);
    expect(offCenter(idx('angry/aggressive'))).toBeLessThan(1e-9);
  });

  test('close via the store returns the camera to the whole wheel', () => {
    setup(opened('angry/aggressive'));
    step(1000);
    store.dispatch({ type: 'close' });
    step(1000);
    expect(camera.current.scale).toBe(1);
    expect(camera.current.cx).toBe(600);
  });
});

describe('viewport', () => {
  test('setViewport while opened keeps the same word centred at angle 0', () => {
    setup(opened('angry/aggressive/hostile'));
    step(1000);
    ctl.setViewport({ width: 700, height: 1000, radius: 342 }, { remPx: 16, portrait: true, anchorY: 0.275 });
    step(1000);
    expect(offCenter(idx('angry/aggressive/hostile'))).toBeLessThan(1e-9);
    expect(camera.current.cx + 0.81 * 342 * camera.current.scale).toBeCloseTo(350, 6);
  });

  test('setViewport with an unchanged viewport does not interrupt motion', () => {
    setup(opened('angry'));
    step(1000);
    camera.animateTo({ rotation: camera.current.rotation + 1 });
    step(50);
    ctl.setViewport({ ...desk }, { ...opts });
    expect(camera.moving).toBe(true);
  });

  test("resize mid-fling keeps the fling's destination centred", () => {
    setup(opened('angry/aggressive/hostile'));
    step(1000);
    ctl.handle([{ type: 'dragStart', x: 500, y: 450, axis: 'y' }, { type: 'dragEnd', vx: 0, vy: 2500 }]);
    step(50);
    expect(camera.moving).toBe(true);
    const dest = segmentAt(layout, 2, normAngle(-camera.target.rotation));
    expect(dest).not.toBe(idx('angry/aggressive/hostile'));
    ctl.setViewport({ width: 900, height: 900, radius: 442 }, opts);
    step(1000);
    expect(store.get()).toEqual(opened(layout.segments[dest]!.path));
    expect(offCenter(dest)).toBeLessThan(1e-9);
  });

  test('portrait → wide while in phone-start view keeps the same word selected, centred, not opened', () => {
    const phone: Viewport = { width: 390, height: 844, radius: 187 };
    now = 0; queue = new Map(); nextId = 1;
    store = createStore(layout, phoneStart('surprised'));
    camera = createCameraController({
      now: () => now,
      raf: (cb) => { const id = nextId++; queue.set(id, cb); return id; },
      caf: (id) => { queue.delete(id); },
      reducedMotion: () => false,
    });
    ctl = createController(layout, store, camera, phone, { remPx: 16, portrait: true, anchorY: 0.275 });
    step(1000);
    expect(camera.current.cy).toBeCloseTo(0.275 * 844, 6);
    ctl.setViewport({ width: 844, height: 390, radius: 187 }, { remPx: 16, portrait: false, anchorY: 0.5 });
    step(1000);
    expect(store.get()).toEqual(phoneStart('surprised'));
    expect(offCenter(idx('surprised'))).toBeLessThan(1e-9);
    expect(camera.current.cy).toBeCloseTo(195, 6);
  });

  test('resize on the whole wheel mid-close keeps the saved rotation', () => {
    const hostile = idx('angry/aggressive/hostile');
    const rot0 = camera.current.rotation;
    store.dispatch({ type: 'open', segment: hostile });
    step(1000);
    store.dispatch({ type: 'close' });
    step(30);
    ctl.setViewport({ width: 900, height: 900, radius: 442 }, opts);
    step(1000);
    expect(sameAngle(camera.current.rotation, rot0)).toBeLessThan(1e-6);
    expect(camera.current.scale).toBe(1);
  });
});
