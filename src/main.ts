import { data } from './boot';
import { createAnnouncer } from './a11y/announce';
import { createA11yTree, describe } from './a11y/tree';
import {
  createCameraController, overviewCamera, ringFocusCamera, shouldStartZoomed, type CameraOpts,
} from './camera';
import { createController } from './controller';
import { attachGestures } from './input/gestures';
import { keyToAction, type KeyAction } from './input/keyboard';
import { TAU, normAngle, type Viewport } from './model/geometry';
import { buildLayout, litMask } from './model/layout';
import { buildFillTable, readPalette } from './render/colors';
import { createWheelRenderer } from './render/wheel';
import { createStore, type Action, type State } from './state/store';
import { createHistoryWriter, defaultState } from './state/history';
import { fromHash, toHash } from './state/url';
import { panelModel, type FwPanel, type FwPath } from './ui/panel';
import { applyPref, readPref, resolvedTheme, safeStorage, writePref, type ThemePref } from './ui/theme';
import type { FwToolbar } from './ui/toolbar';
import './ui/toolbar';

const FADE_MS = 150;
const SEEN_INTRO_KEY = 'fw.seenIntro';
const INTRO_SEGMENTS = 1.5;

const $ = <T extends Element>(sel: string): T => document.querySelector<T>(sel)!;
const media = (q: string): MediaQueryList => matchMedia(q);

const { wheel, feelings } = data;
const layout = buildLayout(wheel);

const app = $<HTMLElement>('#app');
const stage = $<HTMLElement>('#stage');
const canvas = $<HTMLCanvasElement>('#wheel');
const panel = $<FwPanel>('fw-panel');
const pathEl = $<FwPath>('fw-path');
const toolbar = $<FwToolbar>('fw-toolbar');
const announce = createAnnouncer($<HTMLElement>('#announcer'));
const storage = safeStorage();

const reducedMotion = media('(prefers-reduced-motion: reduce)');
const darkScheme = media('(prefers-color-scheme: dark)');
const moreContrast = media('(prefers-contrast: more)');
const forcedColors = media('(forced-colors: active)');

function measure(): { vp: Viewport; opts: CameraOpts } {
  const { width, height } = stage.getBoundingClientRect();
  const whole = app.getBoundingClientRect();
  const remPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  return {
    vp: { width, height, radius: Math.max(Math.min(width, height) / 2 - 8, 1) },
    opts: { remPx, portrait: whole.width < 720 || whole.height > whole.width },
  };
}

let { vp, opts } = measure();

// ── State ────────────────────────────────────────────────────────────────
const fromUrl = fromHash(layout, location.hash);
const startZoomed = fromUrl === null && shouldStartZoomed(layout, vp);
const store = createStore(layout, fromUrl ?? defaultState(layout, vp));

const camera = createCameraController({
  now: () => performance.now(),
  raf: (cb) => requestAnimationFrame(cb),
  caf: (id) => cancelAnimationFrame(id),
  reducedMotion: () => reducedMotion.matches,
});
const controller = createController(layout, store, camera, vp, opts);

// ── Rendering ────────────────────────────────────────────────────────────
const renderer = createWheelRenderer(canvas, layout);
let lit: Uint8Array = litMask(layout, store.get().selected);
let prevLit: Uint8Array = lit.slice();
let fadeStart = -Infinity;
let pendingDraw = 0;
const TEST = import.meta.env.MODE === 'test';
const drawTimes: number[] = [];

function frame(): void {
  pendingDraw = 0;
  const s = store.get();
  const fadeT = reducedMotion.matches ? 1 : Math.min(1, (performance.now() - fadeStart) / FADE_MS);
  const t0 = TEST ? performance.now() : 0;
  renderer.draw({
    cam: camera.current, vp, lit, prevLit, fadeT,
    focused: s.focused,
    showFocus: tree.hasFocus() || (s.view.mode === 'ring' && !s.interacted),
    mode: s.view.mode, remPx: opts.remPx, moreContrast: moreContrast.matches,
  });
  if (TEST) {
    drawTimes.push(performance.now() - t0);
    if (drawTimes.length > 5000) drawTimes.splice(0, 2500);
  }
  if (fadeT < 1) requestDraw();
}

function requestDraw(): void {
  if (pendingDraw === 0) pendingDraw = requestAnimationFrame(frame);
}

camera.onFrame(() => {
  if (pendingDraw !== 0) cancelAnimationFrame(pendingDraw);
  frame();
});

// ── Theme ────────────────────────────────────────────────────────────────
let themePref: ThemePref = readPref(storage);

function refreshColors(): void {
  applyPref(themePref, document.documentElement);
  const palette = readPalette(document.documentElement);
  renderer.setColors(
    buildFillTable(palette, layout.rings.length, resolvedTheme(themePref, darkScheme), { moreContrast: moreContrast.matches }),
    palette,
  );
  requestDraw();
}

for (const mq of [darkScheme, moreContrast, forcedColors]) mq.addEventListener('change', refreshColors);
toolbar.theme = themePref;
app.addEventListener('fw-theme', (e) => {
  themePref = (e as CustomEvent<ThemePref>).detail;
  writePref(storage, themePref);
  refreshColors();
});

// ── Accessible tree, panel, toolbar ──────────────────────────────────────
function dispatch(a: KeyAction): void {
  if (a.type === 'zoomToggle') {
    store.dispatch({ type: store.get().view.mode === 'overview' ? 'zoomIn' : 'zoomOut' });
  } else {
    store.dispatch(a);
  }
}

const tree = createA11yTree($<HTMLElement>('#a11y-tree'), layout, dispatch);
tree.onFocusChange(requestDraw);
app.addEventListener('fw-action', (e) => dispatch((e as CustomEvent<Action | KeyAction>).detail));

document.addEventListener('keydown', (e) => {
  const target = e.target as HTMLElement | null;
  if (target?.closest('[role="tree"], input, select, textarea')) return;
  if (e.key !== 'Escape' && e.key !== '+' && e.key !== '=' && e.key !== '-') return;
  const action = keyToAction(e.key);
  if (action) {
    e.preventDefault();
    dispatch(action);
  }
});

/** Spec §6.1: in the wide overview the card never covers the selected segment. */
function placePanel(s: State): void {
  let left = false;
  if (s.view.mode === 'overview' && s.selected !== null && !opts.portrait) {
    const seg = layout.segments[s.selected]!;
    const ring = layout.rings[seg.ring]!;
    const c = camera.current;
    const r = panel.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    // The card's rectangle when docked right (mirror it if it currently sits left).
    const docked = app.dataset['panelSide'] === 'left'
      ? { left: stageRect.width - (r.right - stageRect.left), right: stageRect.width - (r.left - stageRect.left) }
      : { left: r.left - stageRect.left, right: r.right - stageRect.left };
    const top = r.top - stageRect.top;
    const bottom = r.bottom - stageRect.top;
    for (const frac of [0, 0.5, 1]) {
      for (const rad of [ring.inner, (ring.inner + ring.outer) / 2, ring.outer]) {
        const a = seg.start + (seg.end - seg.start) * frac + c.rotation;
        const x = c.cx + rad * vp.radius * c.scale * Math.cos(a);
        const y = c.cy + rad * vp.radius * c.scale * Math.sin(a);
        if (x >= docked.left && x <= docked.right && y >= top && y <= bottom) left = true;
      }
    }
  }
  if (left) app.dataset['panelSide'] = 'left';
  else delete app.dataset['panelSide'];
}

function renderUi(s: State): void {
  const model = panelModel(layout, feelings, s);
  panel.model = model;
  pathEl.model = model;
  toolbar.zoomed = s.view.mode === 'ring';
  app.dataset['mode'] = s.view.mode;
  tree.update(s);
  placePanel(s);
}

// ── URL & history ────────────────────────────────────────────────────────
let restoring = false;
const writeHistory = createHistoryWriter(history, () => performance.now());

store.subscribe((s, prev) => {
  if (s.selected !== prev.selected) {
    prevLit = lit;
    lit = litMask(layout, s.selected);
    fadeStart = performance.now();
    if (s.selected !== null) announce(describe(layout, s.selected));
  }
  renderUi(s);
  requestDraw();
  if (!restoring) {
    const hash = toHash(layout, s);
    if (hash !== location.hash && !(hash === '' && location.hash === '')) {
      writeHistory(hash === '' ? location.pathname + location.search : hash);
    }
  }
});

addEventListener('popstate', () => {
  restoring = true;
  store.dispatch({ type: 'restore', state: fromHash(layout, location.hash) ?? defaultState(layout, vp) });
  restoring = false;
});

// ── Input & resize ───────────────────────────────────────────────────────
attachGestures(canvas, (intents) => controller.handle(intents));

new ResizeObserver(() => {
  ({ vp, opts } = measure());
  renderer.resize(vp.width, vp.height, devicePixelRatio || 1);
  controller.setViewport(vp, opts);
  placePanel(store.get());
  requestDraw();
}).observe(stage);

// ── First load (spec §4.6) ───────────────────────────────────────────────
renderer.resize(vp.width, vp.height, devicePixelRatio || 1);
refreshColors();
renderUi(store.get());

let seenIntro = false;
try {
  seenIntro = storage?.getItem(SEEN_INTRO_KEY) === '1';
} catch {
  seenIntro = true;
}
if (startZoomed && !seenIntro && !reducedMotion.matches) {
  const target = { ...camera.current };
  const core = layout.rings[0]!.segments.map((i) => layout.segments[i]!.end - layout.segments[i]!.start).sort((a, b) => a - b);
  const offset = INTRO_SEGMENTS * core[Math.floor(core.length / 2)]!;
  camera.jump(overviewCamera(vp, target.rotation - offset));
  camera.animateTo(ringFocusCamera(layout, 0, vp, target.rotation, opts));
  try {
    storage?.setItem(SEEN_INTRO_KEY, '1');
  } catch {
    // Storage unavailable: the intro may play again next visit.
  }
}
requestDraw();

// ── Offline support (spec §6.5) ─────────────────────────────────────────
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // Offline support is an enhancement; the app works without it.
    });
  });
}

// ── Test hook (build:test only) ──────────────────────────────────────────
if (TEST) {
  const pointOf = (path: string) => {
    const i = layout.byPath.get(path);
    if (i === undefined) throw new Error(`unknown path ${path}`);
    const seg = layout.segments[i]!;
    const ring = layout.rings[seg.ring]!;
    const c = camera.current;
    const d = ((ring.inner + ring.outer) / 2) * vp.radius * c.scale;
    const rect = canvas.getBoundingClientRect();
    return { x: rect.left + c.cx + d * Math.cos(seg.mid + c.rotation), y: rect.top + c.cy + d * Math.sin(seg.mid + c.rotation) };
  };
  Object.assign(window, {
    __fw: {
      segmentScreenPoint: pointOf,
      state: () => store.get(),
      camera: () => ({ ...camera.current }),
      moving: () => camera.moving,
      drawTimes: () => drawTimes.slice(),
      pathOf: (i: number | null) => (i === null ? null : layout.segments[i]!.path),
      offCenter: (path: string) => {
        const off = normAngle(layout.segments[layout.byPath.get(path)!]!.mid + camera.current.rotation);
        return Math.min(off, TAU - off);
      },
    },
  });
}

