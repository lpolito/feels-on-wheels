import { overviewCamera, ringFocusCamera, type CameraController, type CameraOpts } from './camera';
import type { Intent } from './input/gestures';
import type { Layout } from './model/layout';
import {
  TAU, hitTest, normAngle, rotationToCenter, segmentAt, snapRotation, type Camera, type Viewport,
} from './model/geometry';
import { resolvePinch } from './model/pinch';
import type { State, Store } from './state/store';

export interface Controller {
  handle(intents: Intent[]): void;
  /** Re-targets the current resting state for a new viewport, keeping the intended word centred. */
  setViewport(vp: Viewport, o: CameraOpts): void;
  /** Phone start (spec §3.2): from the whole wheel, spin in to the core ring centred on the selection. */
  playIntro(): void;
  readonly camera: CameraController;
}

/** Default whole-wheel rotation: the first core segment starts at 12 o'clock, as in the reference wheel. */
export const DEFAULT_ROTATION = -Math.PI / 2;
const MIN_SCALE = 0.8;
const MAX_SCALE_HEADROOM = 1.2;
const WHEEL_SCROLL_RATE = 0.004;
const WHEEL_ZOOM_IDLE_MS = 150;
/** The intro spins in over about this many median core widths. */
const INTRO_SEGMENTS = 1.5;

export function createController(
  layout: Layout, store: Store, camera: CameraController, initialVp: Viewport, initialOpts: CameraOpts,
): Controller {
  let vp = initialVp;
  let opts = initialOpts;
  let dragAxis: 'x' | 'y' | null = null;
  let last = { x: 0, y: 0 };
  /**
   * The current pinch / ctrl-wheel gesture: the scale it started at, the camera and point it zooms about,
   * and its latest midpoint.
   */
  let zoom: { startScale: number; base: Camera; ax: number; ay: number; x: number; y: number } | null = null;
  let wheelZoomTimer: ReturnType<typeof setTimeout> | null = null;
  /** State before the most recent tap, so a double-tap acts from it. */
  let beforeLastTap: State | null = null;
  /** Whole-wheel rotation before the last open; closing returns to it. Null once the user rotates the wheel. */
  let savedRotation: number | null = null;
  /** A user spin is in flight in a ring view: its settle picks the word at 3 o'clock. */
  let userSpin = false;

  const cam = camera.current;
  const seg = (i: number) => layout.segments[i]!;
  const ringOf = (s: State): number | null => (s.view.mode === 'ring' ? s.view.ring : null);
  const radiusPx = (ring: number): number =>
    ((layout.rings[ring]!.inner + layout.rings[ring]!.outer) / 2) * vp.radius * cam.scale;
  const centered = (ring: number): number => segmentAt(layout, ring, normAngle(-cam.rotation));
  const maxScale = (): number =>
    Math.max(...layout.rings.map((r) => ringFocusCamera(layout, r.index, vp, 0, opts).scale)) * MAX_SCALE_HEADROOM;
  const clampScale = (s: number): number => Math.min(Math.max(s, MIN_SCALE), maxScale());

  /** The resting camera for a state (spec §3.1): the whole wheel, or the view ring centred on the selection. */
  function restingCamera(s: State): Camera {
    const ring = ringOf(s);
    if (ring === null) return overviewCamera(vp, savedRotation ?? cam.rotation);
    const sel = s.selected;
    const rotation = sel !== null && seg(sel).ring === ring
      ? rotationToCenter(seg(sel), cam.rotation)
      : snapRotation(layout, ring, cam.rotation).rotation;
    return ringFocusCamera(layout, ring, vp, rotation, opts);
  }

  const goToRest = (): void => camera.animateTo(restingCamera(store.get()));

  function dismissHint(): void {
    if (store.get().hinted) store.dispatch({ type: 'dismissHint' });
  }

  /** The user is about to rotate the camera directly. */
  function grab(): void {
    camera.stop();
    dismissHint();
    if (ringOf(store.get()) === null) savedRotation = null;
  }

  function zoomAbout(scale: number, x: number, y: number): void {
    const z = zoom!;
    const s = clampScale(scale);
    const k = s / z.base.scale;
    camera.jump({ scale: s, rotation: cam.rotation, cx: x - (z.ax - z.base.cx) * k, cy: y - (z.ay - z.base.cy) * k });
    z.x = x;
    z.y = y;
  }

  function startZoom(x: number, y: number): void {
    if (zoom) return;
    camera.stop();
    dismissHint();
    userSpin = false;
    zoom = { startScale: cam.scale, base: { ...cam }, ax: x, ay: y, x, y };
  }

  /** Spec §3.4: resolve the gesture to a word, its parent/child, the wheel, or nothing; then spring to rest. */
  function endZoom(): void {
    const z = zoom;
    zoom = null;
    if (!z) return;
    const hit = hitTest(layout, cam, vp, z.x, z.y);
    const a = resolvePinch(layout, store.get(), cam.scale / z.startScale, hit);
    if (a) store.dispatch(a);
    goToRest();
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

  function fling(v: number): void {
    const ring = ringOf(store.get());
    userSpin = ring !== null;
    camera.fling(v, ring, layout);
  }

  store.subscribe((s, prev, a) => {
    // Anything but the spin's own settle re-targets the camera, so a later settle from that spin is stale.
    if (a.type !== 'settled') userSpin = false;
    if (zoom) return; // endZoom springs to rest itself.
    const viewChanged = s.view.mode !== prev.view.mode || ringOf(s) !== ringOf(prev);
    if (viewChanged) {
      if (prev.view.mode === 'wheel') savedRotation = cam.rotation;
      goToRest();
      return;
    }
    const ring = ringOf(s);
    if (ring === null || dragAxis !== null || s.selected === null || a.type === 'settled') return;
    if (s.selected !== prev.selected || camera.moving) {
      camera.animateTo({ rotation: rotationToCenter(seg(s.selected), cam.rotation) });
    }
  });

  camera.onSettle(() => {
    const ring = ringOf(store.get());
    if (ring === null || !userSpin) return;
    userSpin = false;
    store.dispatch({ type: 'settled', segment: centered(ring) });
  });

  function handleOne(i: Intent): void {
    const s = store.get();
    const ring = ringOf(s);
    switch (i.type) {
      case 'tap': {
        const wasMoving = camera.moving;
        camera.stop();
        userSpin = false;
        if (ring === null && wasMoving) savedRotation = null;
        beforeLastTap = s;
        const hit = hitTest(layout, cam, vp, i.x, i.y);
        if (hit === null) {
          store.dispatch(s.opened ? { type: 'close' } : { type: 'clear' });
        } else if (wasMoving && !s.opened && hit === s.selected) {
          // Tapping a moving wheel means "stop here and pick this", never "open".
        } else {
          store.dispatch(s.opened ? { type: 'open', segment: hit } : { type: 'select', segment: hit });
        }
        if (ringOf(store.get()) !== null && !camera.moving) goToRest();
        return;
      }
      case 'doubleTap': {
        camera.stop();
        const before = beforeLastTap ?? s;
        beforeLastTap = null;
        const hit = hitTest(layout, cam, vp, i.x, i.y);
        if (hit !== null) store.dispatch({ type: 'open', segment: hit });
        else if (before.opened) store.dispatch({ type: 'close' });
        if (!camera.moving) goToRest();
        return;
      }
      case 'dragStart':
        grab();
        userSpin = false;
        dragAxis = i.axis;
        last = { x: i.x, y: i.y };
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
        if (ring === null) v = angularVelocity(i.vx, i.vy);
        else if (dragAxis === 'y') v = i.vy / radiusPx(ring);
        dragAxis = null;
        fling(v);
        return;
      }
      case 'swipe': {
        dragAxis = null;
        if (ring === null) {
          fling(angularVelocity(i.vx, i.vy));
          return;
        }
        const before = store.get();
        store.dispatch({ type: i.dir === 'left' ? 'toChild' : 'toParent' });
        if (store.get() === before) goToRest();
        return;
      }
      case 'pinch':
        startZoom(i.cx, i.cy);
        zoomAbout(zoom!.base.scale * i.scale, i.cx, i.cy);
        return;
      case 'pinchEnd':
        endZoom();
        return;
      case 'zoomWheel':
        startZoom(i.cx, i.cy);
        // Each wheel event zooms about its own point, from the live camera.
        Object.assign(zoom!, { base: { ...cam }, ax: i.cx, ay: i.cy });
        zoomAbout(cam.scale * i.factor, i.cx, i.cy);
        if (wheelZoomTimer !== null) clearTimeout(wheelZoomTimer);
        wheelZoomTimer = setTimeout(() => {
          wheelZoomTimer = null;
          endZoom();
        }, WHEEL_ZOOM_IDLE_MS);
        return;
      case 'scroll':
        grab();
        rotateBy(ring === null ? -i.dy * WHEEL_SCROLL_RATE : -i.dy / radiusPx(ring));
        return;
      case 'scrollEnd':
        fling(0);
        return;
    }
  }

  function setViewport(next: Viewport, o: CameraOpts): void {
    const unchanged = next.width === vp.width && next.height === vp.height && next.radius === vp.radius
      && o.remPx === opts.remPx && o.portrait === opts.portrait;
    if (unchanged) return;
    vp = next;
    opts = o;
    camera.jump(restingCamera(store.get()));
  }

  function playIntro(): void {
    const s = store.get();
    const ring = ringOf(s);
    if (ring === null || s.selected === null) return;
    const widths = layout.rings[0]!.segments.map((k) => seg(k).end - seg(k).start).sort((a, b) => a - b);
    const median = widths[Math.floor(widths.length / 2)]!;
    const rest = restingCamera(s);
    camera.jump(overviewCamera(vp, rest.rotation - INTRO_SEGMENTS * median));
    userSpin = false;
    camera.animateTo(rest);
  }

  // Initial resting state.
  camera.jump(overviewCamera(vp, DEFAULT_ROTATION));
  camera.jump(restingCamera(store.get()));

  return {
    camera,
    handle(intents) {
      for (const i of intents) handleOne(i);
    },
    setViewport,
    playIntro,
  };
}
