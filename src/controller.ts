import {
  nearestRestingState, overviewCamera, ringFocusCamera, type CameraController, type CameraOpts,
} from './camera';
import type { Intent } from './input/gestures';
import type { Layout } from './model/layout';
import {
  TAU, hitTest, normAngle, rotationToCenter, segmentAt, snapRotation, type Camera, type Viewport,
} from './model/geometry';
import type { State, Store } from './state/store';

export interface Controller {
  handle(intents: Intent[]): void;
  /** Re-targets the current resting state for a new viewport, keeping the centered segment. */
  setViewport(vp: Viewport, o: CameraOpts): void;
  readonly camera: CameraController;
}

/** Default overview rotation: the first core segment starts at 12 o'clock, as in the reference wheel. */
export const DEFAULT_ROTATION = -Math.PI / 2;
const MIN_SCALE = 0.8;
const MAX_SCALE_HEADROOM = 1.2;
const OVERVIEW_SCROLL_RATE = 0.004;
const WHEEL_ZOOM_IDLE_MS = 150;

export function createController(
  layout: Layout, store: Store, camera: CameraController, initialVp: Viewport, initialOpts: CameraOpts,
): Controller {
  let vp = initialVp;
  let opts = initialOpts;
  let dragAxis: 'x' | 'y' | null = null;
  let last = { x: 0, y: 0 };
  let pinchBase: { cam: Camera; x: number; y: number } | null = null;
  let wheelZoomTimer: ReturnType<typeof setTimeout> | null = null;
  /** State before the most recent tap, so a double-tap can undo the first tap's toggle. */
  let beforeLastTap: State | null = null;

  const cam = camera.current;
  const ringOf = (s: State): number | null => (s.view.mode === 'ring' ? s.view.ring : null);
  const radiusPx = (ring: number): number =>
    ((layout.rings[ring]!.inner + layout.rings[ring]!.outer) / 2) * vp.radius * cam.scale;
  const centered = (ring: number): number => segmentAt(layout, ring, normAngle(-cam.rotation));
  const maxScale = (): number =>
    Math.max(...layout.rings.map((r) => ringFocusCamera(layout, r.index, vp, 0, opts).scale)) * MAX_SCALE_HEADROOM;
  const clampScale = (s: number): number => Math.min(Math.max(s, MIN_SCALE), maxScale());
  const snapRing = (): number | null => {
    const s = store.get();
    const ring = ringOf(s);
    if (ring !== null) return ring;
    return s.selected === null ? null : layout.segments[s.selected]!.ring;
  };

  /** The resting camera for a view, rotated to center the selection/focus (or the nearest segment). */
  function restingCamera(s: State): Camera {
    const ring = ringOf(s);
    if (ring === null) return overviewCamera(vp, cam.rotation);
    const inRing = [s.selected, s.focused].find((i) => i !== null && layout.segments[i]!.ring === ring);
    const rotation = inRing === undefined || inRing === null
      ? snapRotation(layout, ring, cam.rotation).rotation
      : rotationToCenter(layout.segments[inRing]!, cam.rotation);
    return ringFocusCamera(layout, ring, vp, rotation, opts);
  }

  const goToView = (): void => camera.animateTo(restingCamera(store.get()));

  function resolveZoom(): void {
    const rest = nearestRestingState(layout, cam, vp, opts);
    const s = store.get();
    if (rest.mode === 'overview') {
      if (s.view.mode === 'ring') store.dispatch({ type: 'zoomOut' });
    } else {
      if (s.view.mode === 'overview') store.dispatch({ type: 'zoomIn' });
      store.dispatch({ type: 'setRing', ring: rest.ring });
    }
    goToView();
  }

  function zoomAbout(scale: number, x: number, y: number, base: Camera, ax: number, ay: number): void {
    const s = clampScale(scale);
    const k = s / base.scale;
    camera.jump({ scale: s, rotation: cam.rotation, cx: x - (ax - base.cx) * k, cy: y - (ay - base.cy) * k });
  }

  function rotateBy(delta: number): void {
    camera.jump({ ...cam, rotation: cam.rotation + delta });
  }

  /** Pointer velocity (px/s) at the last drag point → angular velocity around the wheel center (rad/s). */
  function angularVelocity(vx: number, vy: number): number {
    const rx = last.x - cam.cx;
    const ry = last.y - cam.cy;
    const r2 = rx * rx + ry * ry;
    return r2 > 0 ? (rx * vy - ry * vx) / r2 : 0;
  }

  function interact(): void {
    if (store.get().view.mode === 'ring') store.dispatch({ type: 'interact' });
  }

  store.subscribe((s, prev) => {
    const viewChanged = s.view.mode !== prev.view.mode || ringOf(s) !== ringOf(prev);
    if (viewChanged) {
      goToView();
      return;
    }
    const ring = ringOf(s);
    if (ring === null || dragAxis !== null) return;
    const want = s.selected ?? s.focused;
    if (want === null || layout.segments[want]!.ring !== ring) return;
    const off = normAngle(layout.segments[want]!.mid + camera.current.rotation);
    if (Math.min(off, TAU - off) > 1e-9 || camera.moving) {
      camera.animateTo({ rotation: rotationToCenter(layout.segments[want]!, cam.rotation) });
    }
  });

  camera.onSettle(() => {
    const ring = ringOf(store.get());
    if (ring !== null) store.dispatch({ type: 'settled', segment: centered(ring) });
  });

  function handleOne(i: Intent): void {
    const s = store.get();
    const ring = ringOf(s);
    switch (i.type) {
      case 'tap': {
        const wasMoving = camera.moving;
        camera.stop();
        beforeLastTap = s;
        const hit = hitTest(layout, cam, vp, i.x, i.y);
        // Tapping a moving wheel means "stop here and pick this": never toggle the selection off.
        if (!(wasMoving && hit !== null && hit === s.selected)) {
          store.dispatch(hit === null ? { type: 'clear' } : { type: 'select', segment: hit });
        }
        if (store.get().view.mode === 'ring' && !camera.moving) goToView();
        return;
      }
      case 'doubleTap': {
        if (ring !== null) {
          // The first tap of the pair toggled the selection off; zoom out with it restored.
          const before = beforeLastTap;
          if (before && before.selected !== null && s.selected === null) {
            store.dispatch({ type: 'restore', state: { ...before, view: { mode: 'overview' } } });
          } else {
            store.dispatch({ type: 'zoomOut' });
          }
          return;
        }
        camera.stop();
        const hit = hitTest(layout, cam, vp, i.x, i.y);
        if (hit !== null) store.dispatch({ type: 'zoomIn', segment: hit });
        return;
      }
      case 'dragStart':
        camera.stop();
        dragAxis = i.axis;
        last = { x: i.x, y: i.y };
        interact();
        return;
      case 'drag': {
        if (ring === null) {
          const a0 = Math.atan2(last.y - cam.cy, last.x - cam.cx);
          const a1 = Math.atan2(i.y - cam.cy, i.x - cam.cx);
          let d = a1 - a0;
          if (d > Math.PI) d -= TAU;
          if (d < -Math.PI) d += TAU;
          rotateBy(d);
        } else if (dragAxis === 'y') {
          rotateBy(i.dy / radiusPx(ring));
        }
        last = { x: i.x, y: i.y };
        return;
      }
      case 'dragEnd': {
        let v = 0;
        if (ring === null) {
          v = angularVelocity(i.vx, i.vy);
        } else if (dragAxis === 'y') {
          v = i.vy / radiusPx(ring);
        }
        dragAxis = null;
        camera.fling(v, snapRing(), layout);
        return;
      }
      case 'swipe': {
        dragAxis = null;
        if (ring === null) {
          camera.fling(angularVelocity(i.vx, i.vy), snapRing(), layout);
          return;
        }
        interact();
        const next = ring + (i.dir === 'left' ? 1 : -1);
        if (next >= 0 && next < layout.rings.length) store.dispatch({ type: 'setRing', ring: next });
        else goToView();
        return;
      }
      case 'pinch':
        if (!pinchBase) {
          camera.stop();
          pinchBase = { cam: { ...cam }, x: i.cx, y: i.cy };
        }
        zoomAbout(pinchBase.cam.scale * i.scale, i.cx, i.cy, pinchBase.cam, pinchBase.x, pinchBase.y);
        return;
      case 'pinchEnd':
        pinchBase = null;
        resolveZoom();
        return;
      case 'zoomWheel':
        camera.stop();
        zoomAbout(cam.scale * i.factor, i.cx, i.cy, { ...cam }, i.cx, i.cy);
        if (wheelZoomTimer !== null) clearTimeout(wheelZoomTimer);
        wheelZoomTimer = setTimeout(() => {
          wheelZoomTimer = null;
          resolveZoom();
        }, WHEEL_ZOOM_IDLE_MS);
        return;
      case 'scroll':
        if (camera.moving) camera.stop();
        interact();
        rotateBy(ring === null ? -i.dy * OVERVIEW_SCROLL_RATE : -i.dy / radiusPx(ring));
        return;
      case 'scrollEnd':
        camera.fling(0, snapRing(), layout);
        return;
    }
  }

  function setViewport(next: Viewport, o: CameraOpts): void {
    const unchanged = next.width === vp.width && next.height === vp.height && next.radius === vp.radius
      && o.remPx === opts.remPx && o.portrait === opts.portrait;
    if (unchanged) return;
    const s = store.get();
    const ring = ringOf(s);
    vp = next;
    opts = o;
    if (ring === null) {
      camera.jump(restingCamera(s));
      return;
    }
    // Keep the segment the user intends (focus/selection), not whatever a running animation passes through.
    const intended = [s.selected, s.focused].find((i) => i !== null && layout.segments[i]!.ring === ring);
    const keep = intended ?? centered(ring);
    camera.jump(ringFocusCamera(layout, ring, vp, rotationToCenter(layout.segments[keep]!, cam.rotation), opts));
    store.dispatch({ type: 'settled', segment: keep });
  }

  // Initial resting state.
  camera.jump({ ...overviewCamera(vp, DEFAULT_ROTATION) });
  camera.jump(restingCamera(store.get()));
  const startRing = ringOf(store.get());
  if (startRing !== null) store.dispatch({ type: 'settled', segment: centered(startRing) });

  return {
    camera,
    handle(intents) {
      for (const i of intents) handleOne(i);
    },
    setViewport,
  };
}
