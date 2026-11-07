import type { Layout } from './model/layout';
import { normAngle, snapRotation, type Camera, type Viewport } from './model/geometry';

export interface CameraOpts {
  remPx: number;
  /** The stage is portrait (spec v1.2 §4.3: width < 720 or height ≥ width): ring views centre the ring. */
  portrait: boolean;
  /** The whole-wheel view is the half-wheel (spec v1.2 §3.2): phones, where the full wheel's labels would be too small. */
  half: boolean;
}

/** Spec §4.2 constants. */
const TARGET_SEGMENT_REM = 4.5;
const MAX_BAND_FRACTION = 0.6;
const MIN_TARGET_PX = 44;
const MIN_RING_SCALE = 1.25;
const START_ZOOMED_BELOW_PX = 12;
const LABEL_HEIGHT_RATIO = 0.55;
/** The opened cell's lift past its ring, its side lift and the outline outside its edge (render/wheel.ts). */
const LIFT_RADIAL_PX = 10;
const LIFT_SIDE_PX = 2;
const OUTLINE_OUTSIDE_PX = 2;
/** Spring stiffness (spec v1.2 §3.5): about 90% of a move done in 270ms. */
const OMEGA = 14;
const FLING_TAU = 0.325;
const MAX_DT = 1 / 30;

function typicalWidth(layout: Layout, ring: number): number {
  const widths = layout.rings[ring]!.segments
    .map((i) => layout.segments[i]!.end - layout.segments[i]!.start)
    .sort((a, b) => a - b);
  return widths[Math.floor(widths.length / 2)]!;
}

const ringMid = (layout: Layout, ring: number): number => (layout.rings[ring]!.inner + layout.rings[ring]!.outer) / 2;

export function overviewCamera(vp: Viewport, rotation: number): Camera {
  return { scale: 1, rotation, cx: vp.width / 2, cy: vp.height / 2 };
}

/** The half-wheel's outer edge reaches this fraction of the stage width. */
const HALF_REACH = 0.95;

/** The whole-wheel resting camera: centred in the stage, or the half-wheel when o.half. */
export function wheelCamera(vp: Viewport, rotation: number, o: CameraOpts): Camera {
  if (!o.half) return overviewCamera(vp, rotation);
  return { scale: (HALF_REACH * vp.width) / vp.radius, rotation, cx: 0, cy: vp.height / 2 };
}

/** Rotation that centres the first core word (Fearful) at 3 o'clock. */
export function halfRestRotation(layout: Layout): number {
  return -layout.segments[layout.rings[0]!.segments[0]!]!.mid;
}

export function ringFocusCamera(layout: Layout, ring: number, vp: Viewport, rotation: number, o: CameraOpts): Camera {
  const r = layout.rings[ring]!;
  const rMid = ringMid(layout, ring);
  const arcAtScale1 = typicalWidth(layout, ring) * rMid * vp.radius;
  const bandClamp = (MAX_BAND_FRACTION * vp.width) / ((r.outer - r.inner) * vp.radius);
  const scale = Math.max(
    Math.min((TARGET_SEGMENT_REM * o.remPx) / arcAtScale1, bandClamp),
    MIN_TARGET_PX / arcAtScale1,
    MIN_RING_SCALE,
  );
  const R = vp.radius * scale;
  // Spec v1.2 §4.1–§4.2: phones centre the ring's middle; elsewhere the wheel's outer edge meets the stage's right
  // edge (the card's column), unless that would start the opened cell (with its lift) within 1rem of the left.
  const cx = o.portrait
    ? 0.5 * vp.width - rMid * R
    : Math.max(vp.width - R, o.remPx - (r.inner * R - LIFT_RADIAL_PX));
  return { scale, rotation, cx, cy: vp.height / 2 };
}

/**
 * Half the opened cell's on-screen height in CSS px: its chord across the outer edge plus the 10px lift, the 2px
 * side lift and 2px of outline.
 */
export function openedHalfHeight(layout: Layout, index: number, vp: Viewport, o: CameraOpts): number {
  const seg = layout.segments[index]!;
  const r = layout.rings[seg.ring]!;
  const R = vp.radius * ringFocusCamera(layout, seg.ring, vp, 0, o).scale;
  const rOut = r.outer * R + LIFT_RADIAL_PX;
  const side = LIFT_SIDE_PX / (ringMid(layout, seg.ring) * R);
  const half = Math.min((seg.end - seg.start) / 2 + side, Math.PI / 2);
  return rOut * Math.sin(half) + OUTLINE_OUTSIDE_PX;
}

/** Spec §4.6: start zoomed when overview would draw outer labels under 12 CSS px. */
export function shouldStartZoomed(layout: Layout, vp: Viewport): boolean {
  const outer = layout.rings.length - 1;
  const arc = typicalWidth(layout, outer) * ringMid(layout, outer) * vp.radius;
  return arc * LABEL_HEIGHT_RATIO < START_ZOOMED_BELOW_PX;
}

export interface CameraController {
  readonly current: Camera;
  /** Where the spring is heading (a fling's destination); equal to `current` at rest. */
  readonly target: Camera;
  readonly moving: boolean;
  jump(c: Camera): void;
  animateTo(c: Partial<Camera>, velocity?: Partial<Camera>): void;
  fling(rotationVelocity: number, snapRing: number | null, layout: Layout): void;
  stop(): void;
  onFrame(fn: () => void): void;
  onSettle(fn: () => void): void;
}

type Key = keyof Camera;
const KEYS: readonly Key[] = ['scale', 'rotation', 'cx', 'cy'];
/** Rest thresholds per channel: position epsilon (velocity epsilon is 10×). */
const EPS: Record<Key, number> = { scale: 1e-4, rotation: 1e-4, cx: 0.05, cy: 0.05 };

export function createCameraController(deps: {
  now(): number;
  raf(cb: FrameRequestCallback): number;
  caf(id: number): void;
  reducedMotion(): boolean;
}): CameraController {
  const current: Camera = { scale: 1, rotation: 0, cx: 0, cy: 0 };
  const target: Camera = { ...current };
  const vel: Camera = { scale: 0, rotation: 0, cx: 0, cy: 0 };
  const frameSubs: (() => void)[] = [];
  const settleSubs: (() => void)[] = [];
  let rafId: number | null = null;
  let springing = false;
  let pendingSettle = false;
  let last = 0;

  const schedule = (): void => {
    if (rafId === null) {
      last = deps.now();
      rafId = deps.raf(tick);
    }
  };

  function atRest(): boolean {
    for (const k of KEYS) {
      if (Math.abs(current[k] - target[k]) > EPS[k] || Math.abs(vel[k]) > EPS[k] * 10) return false;
    }
    return true;
  }

  function settle(): void {
    for (const k of KEYS) {
      current[k] = target[k];
      vel[k] = 0;
    }
    const n = normAngle(current.rotation);
    current.rotation = n;
    target.rotation = n;
    springing = false;
  }

  function tick(t: number): void {
    rafId = null;
    if (springing) {
      const dt = Math.min(Math.max((t - last) / 1000, 0), MAX_DT);
      last = t;
      // Exact critically damped step: x(dt) = target + (c1 + c2·dt)·e^(−ω·dt).
      const decay = Math.exp(-OMEGA * dt);
      for (const k of KEYS) {
        const c1 = current[k] - target[k];
        const c2 = vel[k] + OMEGA * c1;
        current[k] = target[k] + (c1 + c2 * dt) * decay;
        vel[k] = (c2 - OMEGA * (c1 + c2 * dt)) * decay;
      }
      if (atRest()) settle();
    }
    for (const fn of frameSubs) fn();
    if (springing) {
      // Keep `last` at this frame's timestamp: resetting it to now() after the draw would make the next dt
      // "frame interval minus draw time", slowing the spring to a crawl when drawing is expensive.
      if (rafId === null) rafId = deps.raf(tick);
    } else if (pendingSettle) {
      pendingSettle = false;
      for (const fn of settleSubs) fn();
    }
  }

  function startSpring(): void {
    if (deps.reducedMotion()) {
      settle();
    } else {
      springing = true;
    }
    pendingSettle = true;
    schedule();
  }

  return {
    current,
    target,
    get moving() {
      return springing;
    },
    jump(c) {
      for (const k of KEYS) {
        current[k] = c[k];
        target[k] = c[k];
        vel[k] = 0;
      }
      springing = false;
      pendingSettle = false;
      schedule();
    },
    animateTo(c, velocity) {
      for (const k of KEYS) {
        const v = c[k];
        if (v !== undefined) target[k] = v;
        const dv = velocity?.[k];
        if (dv !== undefined) vel[k] = dv;
      }
      startSpring();
    },
    fling(rotationVelocity, snapRing, layout) {
      const projected = current.rotation + rotationVelocity * FLING_TAU;
      target.rotation = snapRing === null ? projected : snapRotation(layout, snapRing, projected).rotation;
      vel.rotation = rotationVelocity;
      startSpring();
    },
    stop() {
      for (const k of KEYS) {
        target[k] = current[k];
        vel[k] = 0;
      }
      springing = false;
      pendingSettle = false;
      if (rafId !== null) {
        deps.caf(rafId);
        rafId = null;
      }
    },
    onFrame(fn) {
      frameSubs.push(fn);
    },
    onSettle(fn) {
      settleSubs.push(fn);
    },
  };
}
