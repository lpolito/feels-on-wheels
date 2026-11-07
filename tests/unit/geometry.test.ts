import { describe, expect, test } from 'vitest';
import { loadData } from '../../src/data/load';
import { buildLayout } from '../../src/model/layout';
import {
  TAU, hitTest, inWindow, normAngle, ringAt, rotationToCenter, segmentAt, snapRotation, toPolar, viewWindow,
  type Camera, type Viewport,
} from '../../src/model/geometry';

const layout = buildLayout(loadData().wheel);
const vp: Viewport = { width: 1200, height: 900, radius: 400 };
const centered = (scale: number, rotation: number): Camera => ({ scale, rotation, cx: vp.width / 2, cy: vp.height / 2 });

function project(cam: Camera, r: number, theta: number): { x: number; y: number } {
  const d = r * vp.radius * cam.scale;
  return { x: cam.cx + d * Math.cos(theta + cam.rotation), y: cam.cy + d * Math.sin(theta + cam.rotation) };
}

describe('angles', () => {
  test('normAngle maps into [0, 2π)', () => {
    for (const a of [-7, -TAU, 0, 1, TAU, 40, 1000]) {
      const n = normAngle(a);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(TAU);
      expect(Math.cos(n)).toBeCloseTo(Math.cos(a), 9);
    }
  });
});

describe('hit testing', () => {
  test('hitTest round-trips every segment mid across zoom and rotation', () => {
    let checked = 0;
    for (const scale of [1, 2.5, 6]) {
      for (const rotation of [0, 1, -2.3, 40]) {
        const cam = centered(scale, rotation);
        for (const s of layout.segments) {
          const ring = layout.rings[s.ring]!;
          const p = project(cam, (ring.inner + ring.outer) / 2, s.mid);
          if (p.x < 0 || p.y < 0 || p.x > vp.width || p.y > vp.height) continue;
          expect(hitTest(layout, cam, vp, p.x, p.y), `${s.path} @${scale},${rotation}`).toBe(s.index);
          checked++;
        }
      }
    }
    expect(checked).toBeGreaterThan(400);
  });

  test('toPolar inverts the camera', () => {
    const cam = centered(2, 0.7);
    const p = project(cam, 0.5, 1.2);
    const polar = toPolar(p.x, p.y, cam, vp);
    expect(polar.r).toBeCloseTo(0.5, 9);
    expect(polar.theta).toBeCloseTo(1.2, 9);
  });

  test('hitTest returns null in the hole, beyond the rim, and off-canvas', () => {
    const cam = centered(1, 0);
    expect(hitTest(layout, cam, vp, vp.width / 2 + 0.05 * vp.radius, vp.height / 2)).toBeNull();
    expect(hitTest(layout, cam, vp, vp.width / 2 + 1.05 * vp.radius, vp.height / 2)).toBeNull();
    const big = centered(6, 0);
    expect(hitTest(layout, big, vp, -10, vp.height / 2)).toBeNull();
    expect(hitTest(layout, big, vp, vp.width + 10, vp.height / 2)).toBeNull();
  });

  test('ringAt and segmentAt agree with the layout', () => {
    expect(ringAt(layout, 0.05)).toBeNull();
    expect(ringAt(layout, 0.2)).toBe(0);
    expect(ringAt(layout, 0.5)).toBe(1);
    expect(ringAt(layout, 0.9)).toBe(2);
    expect(ringAt(layout, 1.2)).toBeNull();
    for (const s of layout.segments) expect(segmentAt(layout, s.ring, s.mid)).toBe(s.index);
    expect(segmentAt(layout, 0, 0)).toBe(layout.rings[0]!.segments[0]);
  });
});

describe('snapping', () => {
  test('snapRotation lands exactly at a segment mid within half a segment', () => {
    for (const ring of [0, 1, 2]) {
      for (let rot = -10; rot < 10; rot += 0.137) {
        const { rotation, segment } = snapRotation(layout, ring, rot);
        const s = layout.segments[segment]!;
        expect(s.ring).toBe(ring);
        const off = normAngle(s.mid + rotation);
        expect(Math.min(off, TAU - off)).toBeLessThan(1e-9);
        expect(Math.abs(rotation - rot)).toBeLessThanOrEqual((s.end - s.start) / 2 + 1e-9);
      }
    }
  });

  test('rotationToCenter picks the equivalent rotation nearest current', () => {
    const s = layout.segments[layout.byPath.get('angry/aggressive/hostile')!]!;
    const r = rotationToCenter(s, 40);
    expect(Math.abs(r - 40)).toBeLessThanOrEqual(Math.PI);
    const off = normAngle(s.mid + r);
    expect(Math.min(off, TAU - off)).toBeLessThan(1e-9);
  });
});

describe('view window', () => {
  test('viewWindow is full in overview', () => {
    const w = viewWindow(centered(1, 0), vp);
    expect(w.full).toBe(true);
    expect(w.rMin).toBe(0);
    for (const s of layout.segments) expect(inWindow(s, layout.rings[s.ring]!, w)).toBe(true);
  });

  test('viewWindow in ring focus excludes segments on the far side', () => {
    const scale = 6;
    const rMid = 0.81;
    const cam: Camera = { scale, rotation: 0, cx: 0.4 * vp.width - rMid * vp.radius * scale, cy: vp.height / 2 };
    const w = viewWindow(cam, vp);
    expect(w.full).toBe(false);
    const atAngle = (theta: number) => layout.segments[segmentAt(layout, 2, theta)]!;
    expect(inWindow(atAngle(0.001), layout.rings[2]!, w)).toBe(true);
    expect(inWindow(atAngle(TAU - 0.001), layout.rings[2]!, w)).toBe(true);
    expect(inWindow(atAngle(Math.PI), layout.rings[2]!, w)).toBe(false);
    // The core ring sits entirely off-screen to the left at this zoom.
    expect(inWindow(layout.segments[layout.rings[0]!.segments[0]!]!, layout.rings[0]!, w)).toBe(false);
    const visible = layout.segments.filter((s) => inWindow(s, layout.rings[s.ring]!, w)).length;
    expect(visible).toBeLessThan(40);
  });
});
