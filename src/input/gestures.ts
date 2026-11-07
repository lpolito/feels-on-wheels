export type GestureInput =
  | { kind: 'down' | 'move' | 'up' | 'cancel'; id: number; x: number; y: number; t: number }
  | { kind: 'wheel'; dx: number; dy: number; ctrl: boolean; x: number; y: number; t: number }
  | { kind: 'gesture'; phase: 'start' | 'change' | 'end'; scale: number; x: number; y: number; t: number };

export type Intent =
  | { type: 'tap' | 'doubleTap'; x: number; y: number }
  | { type: 'dragStart'; x: number; y: number; axis: 'x' | 'y' }
  | { type: 'drag'; x: number; y: number; dx: number; dy: number }
  | { type: 'dragEnd'; vx: number; vy: number }
  | { type: 'swipe'; dir: 'left' | 'right' }
  | { type: 'pinch'; scale: number; cx: number; cy: number }
  | { type: 'pinchEnd' }
  | { type: 'scroll'; dy: number }
  | { type: 'scrollEnd' }
  | { type: 'zoomWheel'; factor: number; cx: number; cy: number };

export interface Timers {
  set(fn: () => Intent[], ms: number): number;
  clear(id: number): void;
}

/** Spec §4.4 / plan Global Constraints. */
const TAP_SLOP = 8;
const TAP_MS = 300;
const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_SLOP = 24;
const SWIPE_MIN = 40;
const VELOCITY_WINDOW_MS = 100;
const SCROLL_IDLE_MS = 150;
const WHEEL_ZOOM_RATE = 0.01;

interface Pointer { x: number; y: number }
interface Sample { x: number; y: number; t: number }

export function createGestureRecognizer(timers: Timers): { handle(e: GestureInput): Intent[] } {
  const pointers = new Map<number, Pointer>();
  let mode: 'idle' | 'pending' | 'drag' | 'pinch' | 'ended' = 'idle';
  let start: Sample = { x: 0, y: 0, t: 0 };
  let prev: Pointer = { x: 0, y: 0 };
  let axis: 'x' | 'y' = 'y';
  let samples: Sample[] = [];
  let pinchStartDist = 1;
  let lastTap: Sample | null = null;
  let scrollTimer: number | null = null;

  const twoPointers = (): [Pointer, Pointer] => {
    const [a, b] = [...pointers.values()];
    return [a!, b!];
  };

  function velocity(now: number): { vx: number; vy: number } {
    const recent = samples.filter((s) => now - s.t <= VELOCITY_WINDOW_MS);
    if (recent.length < 2) return { vx: 0, vy: 0 };
    const a = recent[0]!;
    const b = recent[recent.length - 1]!;
    const dt = (b.t - a.t) / 1000;
    return dt > 0 ? { vx: (b.x - a.x) / dt, vy: (b.y - a.y) / dt } : { vx: 0, vy: 0 };
  }

  function endGesture(): Intent[] {
    const out: Intent[] = mode === 'drag' ? [{ type: 'dragEnd', vx: 0, vy: 0 }] : mode === 'pinch' ? [{ type: 'pinchEnd' }] : [];
    mode = pointers.size > 0 ? 'ended' : 'idle';
    return out;
  }

  function pointer(e: Extract<GestureInput, { id: number }>): Intent[] {
    const known = pointers.get(e.id);
    switch (e.kind) {
      case 'down': {
        if (mode === 'ended') return [];
        pointers.set(e.id, { x: e.x, y: e.y });
        if (pointers.size === 1) {
          mode = 'pending';
          start = { x: e.x, y: e.y, t: e.t };
          prev = { x: e.x, y: e.y };
          samples = [{ ...start }];
          return [];
        }
        if (pointers.size === 2) {
          const out: Intent[] = mode === 'drag' ? [{ type: 'dragEnd', vx: 0, vy: 0 }] : [];
          const [a, b] = twoPointers();
          pinchStartDist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
          mode = 'pinch';
          return out;
        }
        return [];
      }
      case 'move': {
        if (!known) return [];
        known.x = e.x;
        known.y = e.y;
        if (mode === 'pending') {
          const dx = e.x - start.x;
          const dy = e.y - start.y;
          if (Math.hypot(dx, dy) < TAP_SLOP) return [];
          mode = 'drag';
          axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
          prev = { x: start.x, y: start.y };
          const begin: Intent = { type: 'dragStart', x: start.x, y: start.y, axis };
          return [begin, drag(e)];
        }
        if (mode === 'drag') return [drag(e)];
        if (mode === 'pinch') {
          const [a, b] = twoPointers();
          return [{ type: 'pinch', scale: Math.hypot(a.x - b.x, a.y - b.y) / pinchStartDist, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 }];
        }
        return [];
      }
      case 'up': {
        if (!known) return [];
        pointers.delete(e.id);
        if (mode === 'pending') {
          mode = 'idle';
          if (e.t - start.t >= TAP_MS) return [];
          if (lastTap && e.t - lastTap.t <= DOUBLE_TAP_MS && Math.hypot(e.x - lastTap.x, e.y - lastTap.y) <= DOUBLE_TAP_SLOP) {
            lastTap = null;
            return [{ type: 'doubleTap', x: e.x, y: e.y }];
          }
          lastTap = { x: e.x, y: e.y, t: e.t };
          return [{ type: 'tap', x: e.x, y: e.y }];
        }
        if (mode === 'drag') {
          mode = 'idle';
          samples.push({ x: e.x, y: e.y, t: e.t });
          const dx = e.x - start.x;
          const dy = e.y - start.y;
          if (axis === 'x' && Math.abs(dx) > SWIPE_MIN && Math.abs(dx) > 2 * Math.abs(dy)) {
            return [{ type: 'swipe', dir: dx < 0 ? 'left' : 'right' }];
          }
          return [{ type: 'dragEnd', ...velocity(e.t) }];
        }
        if (mode === 'pinch') return endGesture();
        if (pointers.size === 0) mode = 'idle';
        return [];
      }
      case 'cancel': {
        if (!known) return [];
        pointers.clear();
        return endGesture();
      }
    }
  }

  function drag(e: { x: number; y: number; t: number }): Intent {
    const out: Intent = { type: 'drag', x: e.x, y: e.y, dx: e.x - prev.x, dy: e.y - prev.y };
    prev = { x: e.x, y: e.y };
    samples.push({ x: e.x, y: e.y, t: e.t });
    if (samples.length > 32) samples.splice(0, samples.length - 32);
    return out;
  }

  return {
    handle(e) {
      switch (e.kind) {
        case 'wheel':
          if (e.ctrl) return [{ type: 'zoomWheel', factor: Math.exp(-e.dy * WHEEL_ZOOM_RATE), cx: e.x, cy: e.y }];
          if (scrollTimer !== null) timers.clear(scrollTimer);
          scrollTimer = timers.set(() => {
            scrollTimer = null;
            return [{ type: 'scrollEnd' }];
          }, SCROLL_IDLE_MS);
          return [{ type: 'scroll', dy: e.dy }];
        case 'gesture':
          if (e.phase === 'start') return [];
          if (e.phase === 'change') return [{ type: 'pinch', scale: e.scale, cx: e.x, cy: e.y }];
          return [{ type: 'pinchEnd' }];
        default:
          return pointer(e);
      }
    },
  };
}

/** Wires DOM pointer, wheel and Safari gesture events on `el` to a recognizer. Returns detach. */
export function attachGestures(el: HTMLElement, onIntents: (i: Intent[]) => void): () => void {
  const rec = createGestureRecognizer({
    set: (fn, ms) => window.setTimeout(() => onIntents(fn()), ms),
    clear: (id) => window.clearTimeout(id),
  });
  let rect = el.getBoundingClientRect();
  const emit = (i: Intent[]) => {
    if (i.length > 0) onIntents(i);
  };
  const local = (e: { clientX: number; clientY: number }) => ({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  const kindOf: Record<string, 'down' | 'move' | 'up' | 'cancel'> = {
    pointerdown: 'down', pointermove: 'move', pointerup: 'up', pointercancel: 'cancel', lostpointercapture: 'cancel',
  };

  const onPointer = (e: PointerEvent) => {
    if (e.type === 'pointerdown') {
      rect = el.getBoundingClientRect();
      el.setPointerCapture(e.pointerId);
    }
    if (e.type === 'lostpointercapture' && e.buttons === 0) return; // normal release already sent 'up'
    emit(rec.handle({ kind: kindOf[e.type]!, id: e.pointerId, ...local(e), t: e.timeStamp }));
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    rect = el.getBoundingClientRect();
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * rect.height : e.deltaY;
    emit(rec.handle({ kind: 'wheel', dx: e.deltaX, dy, ctrl: e.ctrlKey, ...local(e), t: e.timeStamp }));
  };
  type SafariGesture = UIEvent & { scale: number; clientX: number; clientY: number };
  const onGesture = (e: Event) => {
    e.preventDefault();
    const g = e as SafariGesture;
    const phase = e.type === 'gesturestart' ? 'start' : e.type === 'gesturechange' ? 'change' : 'end';
    emit(rec.handle({ kind: 'gesture', phase, scale: g.scale, ...local(g), t: e.timeStamp }));
  };

  const pointerTypes = Object.keys(kindOf);
  for (const type of pointerTypes) el.addEventListener(type, onPointer as EventListener);
  el.addEventListener('wheel', onWheel, { passive: false });
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) el.addEventListener(type, onGesture);
  return () => {
    for (const type of pointerTypes) el.removeEventListener(type, onPointer as EventListener);
    el.removeEventListener('wheel', onWheel);
    for (const type of ['gesturestart', 'gesturechange', 'gestureend']) el.removeEventListener(type, onGesture);
  };
}
