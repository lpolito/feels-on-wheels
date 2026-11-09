import type { Layout, Ring, Segment } from './layout';

export interface Viewport {
  width: number;
  height: number;
  /** Wheel radius R in CSS px at scale 1. */
  radius: number;
  /**
   * Spec v2.2 §3.1: the canvas's CSS width, at least `width`. The cameras aim within `width`; drawing, culling and hit
   * testing reach `drawWidth` (the wheel draws under the card's column). Absent means `width`.
   */
  drawWidth?: number;
}

export const drawWidthOf = (vp: Viewport): number => vp.drawWidth ?? vp.width;

export interface Camera {
  scale: number;
  /** Added to wheel-space angles to get screen angles. */
  rotation: number;
  /** Wheel center on screen, CSS px. */
  cx: number;
  cy: number;
}

export const TAU = Math.PI * 2;

export function normAngle(a: number): number {
  const n = a % TAU;
  return n < 0 ? n + TAU : n;
}

/** Signed difference a − b wrapped to (−π, π]. */
function angleDiff(a: number, b: number): number {
  const d = normAngle(a - b);
  return d > Math.PI ? d - TAU : d;
}

/** The point (canvas CSS px) is within the wheel's outer edge, the centre hole included (spec v1.3 §3.5). */
export function overDisc(cam: Camera, vp: Viewport, x: number, y: number): boolean {
  return Math.hypot(x - cam.cx, y - cam.cy) <= vp.radius * cam.scale;
}

export function toPolar(x: number, y: number, cam: Camera, vp: Viewport): { r: number; theta: number } {
  const dx = x - cam.cx;
  const dy = y - cam.cy;
  return { r: Math.hypot(dx, dy) / (vp.radius * cam.scale), theta: normAngle(Math.atan2(dy, dx) - cam.rotation) };
}

export function ringAt(layout: Layout, r: number): number | null {
  for (const ring of layout.rings) if (r >= ring.inner && r < ring.outer) return ring.index;
  return null;
}

export function segmentAt(layout: Layout, ring: number, theta: number): number {
  const { starts, segments } = layout.rings[ring]!;
  const t = normAngle(theta);
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const m = (lo + hi + 1) >> 1;
    if (starts[m]! <= t) lo = m;
    else hi = m - 1;
  }
  return segments[lo]!;
}

export function hitTest(layout: Layout, cam: Camera, vp: Viewport, x: number, y: number): number | null {
  if (x < 0 || y < 0 || x > drawWidthOf(vp) || y > vp.height) return null;
  const { r, theta } = toPolar(x, y, cam, vp);
  const ring = ringAt(layout, r);
  return ring === null ? null : segmentAt(layout, ring, theta);
}

/** The rotation that puts seg.mid at screen angle 0, choosing the equivalent nearest to current. */
export function rotationToCenter(seg: Segment, current: number): number {
  return current + angleDiff(-seg.mid, current);
}

export function snapRotation(layout: Layout, ring: number, rotation: number): { rotation: number; segment: number } {
  const segment = segmentAt(layout, ring, -rotation);
  return { rotation: rotationToCenter(layout.segments[segment]!, rotation), segment };
}

export interface ViewWindow {
  /** Radial range visible, in R units. */
  rMin: number;
  rMax: number;
  /** True when every angle is visible (wheel center on screen). */
  full: boolean;
  /** Wheel-space angle interval when !full; `to` may exceed 2π. */
  from: number;
  to: number;
}

const CORNER_X = [0, 1, 1, 0];
const CORNER_Y = [0, 0, 1, 1];

export function viewWindow(cam: Camera, vp: Viewport, out?: ViewWindow): ViewWindow {
  const w = out ?? { rMin: 0, rMax: 0, full: true, from: 0, to: TAU };
  const unit = vp.radius * cam.scale;
  const width = drawWidthOf(vp);
  let maxDist = 0;
  for (let k = 0; k < 4; k++) {
    maxDist = Math.max(maxDist, Math.hypot(CORNER_X[k]! * width - cam.cx, CORNER_Y[k]! * vp.height - cam.cy));
  }
  w.rMax = maxDist / unit;
  const inside = cam.cx >= 0 && cam.cx <= width && cam.cy >= 0 && cam.cy <= vp.height;
  if (inside) {
    w.rMin = 0; w.full = true; w.from = 0; w.to = TAU;
    return w;
  }
  const nearX = Math.min(Math.max(cam.cx, 0), width);
  const nearY = Math.min(Math.max(cam.cy, 0), vp.height);
  w.rMin = Math.hypot(nearX - cam.cx, nearY - cam.cy) / unit;
  // The rectangle is convex and excludes the center, so it spans < π as seen from the center.
  const toRect = Math.atan2(vp.height / 2 - cam.cy, width / 2 - cam.cx);
  let lo = 0;
  let hi = 0;
  for (let k = 0; k < 4; k++) {
    const d = angleDiff(Math.atan2(CORNER_Y[k]! * vp.height - cam.cy, CORNER_X[k]! * width - cam.cx), toRect);
    lo = Math.min(lo, d);
    hi = Math.max(hi, d);
  }
  w.full = false;
  w.from = normAngle(toRect + lo - cam.rotation);
  w.to = w.from + (hi - lo);
  return w;
}

export function inWindow(seg: Segment, ring: Ring, w: ViewWindow): boolean {
  if (ring.outer < w.rMin || ring.inner > w.rMax) return false;
  if (w.full) return true;
  return (
    (seg.start <= w.to && seg.end >= w.from) ||
    (seg.start + TAU <= w.to && seg.end + TAU >= w.from) ||
    (seg.start - TAU <= w.to && seg.end - TAU >= w.from)
  );
}
