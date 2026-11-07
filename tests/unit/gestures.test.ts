import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { createGestureRecognizer, type GestureInput, type Intent } from '../../src/input/gestures';

let rec: ReturnType<typeof createGestureRecognizer>;
let t = 0;
const types = (is: Intent[]) => is.map((i) => i.type);

beforeEach(() => {
  vi.useFakeTimers();
  t = 0;
  rec = createGestureRecognizer({ set: (fn, ms) => setTimeout(fn, ms) as unknown as number, clear: (id) => clearTimeout(id) });
});
afterEach(() => vi.useRealTimers());

const ev = (kind: 'down' | 'move' | 'up' | 'cancel', x: number, y: number, id = 1, dt = 16): Intent[] => {
  t += dt;
  return rec.handle({ kind, id, x, y, t } as GestureInput);
};

describe('taps', () => {
  test('down/up within 5px and 200ms → tap', () => {
    ev('down', 100, 100);
    ev('move', 103, 102);
    expect(ev('up', 104, 103, 1, 150)).toEqual([{ type: 'tap', x: 104, y: 103 }]);
  });

  test('a slow still press (800ms) is still a tap', () => {
    ev('down', 100, 100);
    expect(ev('up', 100, 100, 1, 800)).toEqual([{ type: 'tap', x: 100, y: 100 }]);
  });

  test('double tap within 300ms and 24px → tap, then doubleTap', () => {
    ev('down', 100, 100);
    expect(types(ev('up', 100, 100))).toEqual(['tap']);
    ev('down', 110, 105, 2, 100);
    expect(ev('up', 110, 105, 2)).toEqual([{ type: 'doubleTap', x: 110, y: 105 }]);
    ev('down', 110, 105, 3, 100);
    expect(types(ev('up', 110, 105, 3))).toEqual(['tap']);
  });

  test('two taps far apart are two taps', () => {
    ev('down', 100, 100);
    ev('up', 100, 100);
    ev('down', 200, 200, 2, 100);
    expect(types(ev('up', 200, 200, 2))).toEqual(['tap']);
  });
});

describe('drags and swipes', () => {
  test('vertical drag → dragStart axis y, drags, dragEnd with vy > 0', () => {
    ev('down', 100, 100);
    const start = ev('move', 101, 112);
    expect(start[0]).toEqual({ type: 'dragStart', x: 100, y: 100, axis: 'y' });
    expect(start[1]).toMatchObject({ type: 'drag', x: 101, y: 112, dx: 1, dy: 12 });
    expect(ev('move', 101, 140)[0]).toMatchObject({ type: 'drag', dy: 28 });
    const end = ev('up', 101, 160);
    expect(end).toHaveLength(1);
    expect(end[0]!.type).toBe('dragEnd');
    expect((end[0] as { vy: number }).vy).toBeGreaterThan(0);
  });

  test('horizontal 60px quick move → swipe, no dragEnd', () => {
    ev('down', 200, 100);
    ev('move', 180, 102);
    ev('move', 150, 103);
    expect(ev('up', 140, 103)).toEqual([{ type: 'swipe', dir: 'left' }]);
    ev('down', 100, 100, 2, 500);
    ev('move', 130, 101, 2);
    expect(ev('up', 170, 101, 2)).toEqual([{ type: 'swipe', dir: 'right' }]);
  });

  test('short horizontal drag ends as dragEnd, not swipe', () => {
    ev('down', 100, 100);
    ev('move', 120, 100);
    expect(types(ev('up', 125, 100))).toEqual(['dragEnd']);
  });

  test('velocity only uses the last 100ms of samples', () => {
    ev('down', 100, 100);
    ev('move', 100, 120);
    ev('move', 100, 200, 1, 16);
    const end = ev("up", 100, 200, 1, 300) as unknown as [{ type: "dragEnd"; vy: number }];
    expect(end[0].vy).toBe(0);
  });
});

describe('pinch', () => {
  test('second pointer mid-drag → dragEnd(v=0) then pinch with scale = distance ratio', () => {
    ev('down', 100, 100, 1);
    ev('move', 100, 120, 1);
    expect(ev('down', 200, 120, 2)).toEqual([{ type: 'dragEnd', vx: 0, vy: 0 }]);
    expect(ev('move', 300, 120, 2)).toEqual([{ type: 'pinch', scale: 2, cx: 200, cy: 120 }]);
    expect(types(ev('up', 300, 120, 2))).toEqual(['pinchEnd']);
    expect(ev('move', 150, 150, 1)).toEqual([]);
    expect(ev('up', 150, 150, 1)).toEqual([]);
  });

  test('cancel mid-pinch → pinchEnd, and a following single-pointer move emits nothing', () => {
    ev('down', 100, 100, 1);
    ev('down', 200, 100, 2);
    ev('move', 250, 100, 2);
    expect(ev('cancel', 250, 100, 2)).toEqual([{ type: 'pinchEnd' }]);
    expect(ev('move', 120, 140, 1)).toEqual([]);
    expect(ev('up', 120, 140, 1)).toEqual([]);
    ev('down', 50, 50, 3, 500);
    expect(types(ev('up', 50, 50, 3))).toEqual(['tap']);
  });

  test('cancel mid-drag → dragEnd with zero velocity', () => {
    ev('down', 100, 100);
    ev('move', 100, 150);
    expect(ev('cancel', 100, 150)).toEqual([{ type: 'dragEnd', vx: 0, vy: 0 }]);
  });

  test('Safari gesture start/change/end → pinch/pinchEnd', () => {
    expect(rec.handle({ kind: 'gesture', phase: 'start', scale: 1, x: 10, y: 20, t: 0 })).toEqual([]);
    expect(rec.handle({ kind: 'gesture', phase: 'change', scale: 1.5, x: 10, y: 20, t: 16 }))
      .toEqual([{ type: 'pinch', scale: 1.5, cx: 10, cy: 20 }]);
    expect(rec.handle({ kind: 'gesture', phase: 'end', scale: 1.5, x: 10, y: 20, t: 32 })).toEqual([{ type: 'pinchEnd' }]);
  });
});

describe('wheel', () => {
  test('ctrl wheel → zoomWheel', () => {
    const out = rec.handle({ kind: 'wheel', dx: 0, dy: -10, ctrl: true, x: 5, y: 6, t: 0 });
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ type: 'zoomWheel', cx: 5, cy: 6 });
    expect((out[0] as { factor: number }).factor).toBeCloseTo(Math.exp(0.1), 9);
  });

  test('plain wheel → scroll …, scrollEnd after 150ms idle', () => {
    const emitted: Intent[] = [];
    rec = createGestureRecognizer({
      set: (fn, ms) => setTimeout(() => emitted.push(...fn()), ms) as unknown as number,
      clear: (id) => clearTimeout(id),
    });
    expect(rec.handle({ kind: 'wheel', dx: 0, dy: 4, ctrl: false, x: 0, y: 0, t: 0 })).toEqual([{ type: 'scroll', dy: 4 }]);
    vi.advanceTimersByTime(100);
    rec.handle({ kind: 'wheel', dx: 0, dy: 6, ctrl: false, x: 0, y: 0, t: 100 });
    vi.advanceTimersByTime(149);
    expect(emitted).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(emitted).toEqual([{ type: 'scrollEnd' }]);
  });
});
