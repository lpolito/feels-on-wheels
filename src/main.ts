import { data } from './boot';
import { createAnnouncer } from './a11y/announce';
import { announceFor, createA11yTree } from './a11y/tree';
import { createCameraController, openedHalfHeight, shouldStartZoomed, type CameraOpts } from './camera';
import { createController } from './controller';
import { t } from './i18n';
import { attachGestures } from './input/gestures';
import { keyTarget, routeKey } from './input/route';
import { TAU, normAngle, type Viewport } from './model/geometry';
import { buildLayout, litMask } from './model/layout';
import { buildFillTable, readPalette } from './render/colors';
import { createSpriteCache } from './render/sprites';
import { createWheelRenderer, labelFont } from './render/wheel';
import { createStore, initialState, type Action, type State } from './state/store';
import { createHistoryWriter, historyOp } from './state/history';
import { fromHash, toHash } from './state/url';
import { cardModel, type FwCard } from './ui/card';
import type { FwHint } from './ui/hint';
import { applyPref, readPref, resolvedTheme, safeStorage, writePref, type ThemePref } from './ui/theme';
import type { FwToolbar } from './ui/toolbar';
import './ui/card';
import './ui/hint';
import './ui/toolbar';

const FADE_MS = 150;
const PULSE_MS = 180;

const $ = <T extends Element>(sel: string): T => document.querySelector<T>(sel)!;
const media = (q: string): MediaQueryList => matchMedia(q);

const { wheel, feelings } = data;
const layout = buildLayout(wheel);

const app = $<HTMLElement>('#app');
const stage = $<HTMLElement>('#stage');
const canvas = $<HTMLCanvasElement>('#wheel');
const card = $<FwCard>('fw-card');
const hint = $<FwHint>('fw-hint');
const toolbar = $<FwToolbar>('fw-toolbar');
const themeMeta = $<HTMLMetaElement>('#theme-color');
const announce = createAnnouncer($<HTMLElement>('#announcer'));
const storage = safeStorage();

const reducedMotion = media('(prefers-reduced-motion: reduce)');
const darkScheme = media('(prefers-color-scheme: dark)');
const moreContrast = media('(prefers-contrast: more)');
const forcedColors = media('(forced-colors: active)');

// WebKit can run this module before the stylesheets apply (seen on a busy machine). The palette, the stage size
// and the phone/desktop start all read them, so wait for the page's load event when the tokens are missing.
if (!getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() && document.readyState !== 'complete') {
  await new Promise((resolve) => addEventListener('load', resolve, { once: true }));
}

function measure(): { vp: Viewport; opts: CameraOpts } {
  const { width, height } = stage.getBoundingClientRect();
  const whole = app.getBoundingClientRect();
  const remPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  // Spec v1.2 §4.3: the one portrait rule, matching the stylesheet's container query.
  const portrait = whole.width < 720 || whole.height >= whole.width;
  const vp = { width, height, radius: Math.max(Math.min(width, height) / 2 - 8, 1) };
  // Spec v1.2 §3.2: the half-wheel where the full wheel's labels would be too small; a phone turned sideways
  // (not portrait) gets the full wheel back.
  const half = portrait && shouldStartZoomed(layout, vp);
  return { vp, opts: { remPx, portrait, half } };
}

let { vp, opts } = measure();

// ── State (spec v1.2 §3.1: every screen starts with nothing selected) ────
const fromUrl = fromHash(layout, location.hash);
const beganAtBase = fromUrl === null;
const store = createStore(layout, fromUrl ?? initialState);

const camera = createCameraController({
  now: () => performance.now(),
  raf: (cb) => requestAnimationFrame(cb),
  caf: (id) => cancelAnimationFrame(id),
  reducedMotion: () => reducedMotion.matches,
});
const controller = createController(layout, store, camera, vp, opts);

// ── Rendering ────────────────────────────────────────────────────────────
const makeCanvas = (w: number, h: number): HTMLCanvasElement | OffscreenCanvas =>
  typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h });
const renderer = createWheelRenderer(canvas, layout, undefined, createSpriteCache(makeCanvas, 600, labelFont));
const allLit = litMask(layout, null);
/** Spec §4.2: cells fade only while a word is opened. */
const litFor = (s: State): Uint8Array => (s.opened ? litMask(layout, s.selected) : allLit);
const openedKey = (s: State): number | null => (s.opened ? s.selected : null);
let lit: Uint8Array = litFor(store.get());
let prevLit: Uint8Array = lit;
let fadeStart = -Infinity;
let pulseStart = -Infinity;
let pendingDraw = 0;
const TEST = import.meta.env.MODE === 'test';
const drawTimes: number[] = [];

function frame(): void {
  pendingDraw = 0;
  const s = store.get();
  const now = performance.now();
  const fadeT = reducedMotion.matches ? 1 : Math.min(1, (now - fadeStart) / FADE_MS);
  const pulseT = reducedMotion.matches ? 1 : Math.min(1, (now - pulseStart) / PULSE_MS);
  const t0 = TEST ? now : 0;
  renderer.draw({
    cam: camera.current, vp, lit, prevLit, fadeT, pulseT,
    selected: s.selected, opened: s.opened,
    mode: s.view.mode, remPx: opts.remPx, moreContrast: moreContrast.matches,
  });
  if (TEST) {
    drawTimes.push(performance.now() - t0);
    if (drawTimes.length > 5000) drawTimes.splice(0, 2500);
  }
  if (fadeT < 1 || pulseT < 1) requestDraw();
}

function requestDraw(): void {
  if (pendingDraw === 0) pendingDraw = requestAnimationFrame(frame);
}

/** Draw in this task: resizing clears the canvas, and waiting a frame would paint it blank. */
function drawNow(): void {
  if (pendingDraw !== 0) cancelAnimationFrame(pendingDraw);
  frame();
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
  // Spec §5.3: the browser chrome follows the resolved theme, including the manual override.
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  if (bg) themeMeta.content = bg;
  requestDraw();
}

for (const mq of [darkScheme, moreContrast, forcedColors]) mq.addEventListener('change', refreshColors);
toolbar.theme = themePref;
app.addEventListener('fw-theme', (e) => {
  themePref = (e as CustomEvent<ThemePref>).detail;
  // Spec v1.2 §5.4: the picker's own re-syncs (on every open and close) must show the new choice.
  toolbar.theme = themePref;
  writePref(storage, themePref);
  refreshColors();
});

// ── Accessible tree, card, hint, toolbar ─────────────────────────────────
const dispatch = (a: Action): void => store.dispatch(a);
const tree = createA11yTree($<HTMLElement>('#a11y-tree'), layout, dispatch);
app.addEventListener('fw-action', (e) => dispatch((e as CustomEvent<Action>).detail));
app.addEventListener('fw-focus-lost', () => tree.focusSelected());

// Spec v1.2 §3.6: keys work from the page, the wheel and the card's and toolbar's buttons. Buttons keep Enter and
// Space; inputs, selects and textareas keep everything but Escape.
document.addEventListener('keydown', (e) => {
  if (e.defaultPrevented) return;
  const action = routeKey(e.key, keyTarget(e.target as Element | null), e.metaKey || e.ctrlKey || e.altKey);
  if (!action) return;
  e.preventDefault();
  dispatch(action);
});

// A mouse click on the wheel puts keyboard focus in the tree, so the arrows work at once.
canvas.addEventListener('pointerup', (e) => {
  if (e.pointerType === 'mouse') tree.focusSelected();
});

const hintText = (s: State): string | null => (s.hinted ? t('hint') : null);

/** Spec v1.2 §4.2: the phone card's height cap keeps it below the opened cell. */
function setOpenedHalf(s: State): void {
  const half = s.opened && s.selected !== null ? openedHalfHeight(layout, s.selected, vp, opts) : 0;
  app.style.setProperty('--opened-half', `${half}px`);
}

function renderUi(s: State): void {
  setOpenedHalf(s);
  card.model = cardModel(layout, feelings, s);
  hint.text = hintText(s);
  toolbar.opened = s.opened;
  app.dataset['mode'] = s.view.mode;
  tree.update(s);
}

// ── URL & history (spec §3.6) ────────────────────────────────────────────
const writer = createHistoryWriter(history, () => performance.now());

store.subscribe((s, prev, a) => {
  if (openedKey(s) !== openedKey(prev)) {
    prevLit = lit;
    lit = litFor(s);
    fadeStart = performance.now();
    if (openedKey(s) !== null) pulseStart = fadeStart;
  }
  const message = announceFor(layout, prev, s);
  if (message) announce(message);
  renderUi(s);
  requestDraw();
  const op = historyOp(prev, s, a);
  if (op !== 'none') {
    const url = toHash(layout, s) || location.pathname + location.search;
    if (op === 'push') writer.push(url);
    else writer.replace(url);
  }
});

addEventListener('popstate', () => {
  const cur = store.get();
  // Back to the base URL: the whole wheel, keeping the last selection (spec v1.2 §3.1).
  const restored = fromHash(layout, location.hash) ?? { ...cur, opened: false, view: { mode: 'wheel' } as const };
  // The hint never comes back once dismissed.
  store.dispatch({ type: 'restore', state: { ...restored, hinted: cur.hinted && restored.hinted } });
});

// ── Input & resize ───────────────────────────────────────────────────────
attachGestures(canvas, (intents) => controller.handle(intents));

new ResizeObserver(() => {
  ({ vp, opts } = measure());
  renderer.resize(vp.width, vp.height, devicePixelRatio || 1);
  controller.setViewport(vp, opts);
  setOpenedHalf(store.get());
  drawNow();
}).observe(stage);

// ── First load ───────────────────────────────────────────────────────────
renderer.resize(vp.width, vp.height, devicePixelRatio || 1);
refreshColors();
renderUi(store.get());
if (beganAtBase && opts.half && !reducedMotion.matches) controller.playIntro();
drawNow();

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
      viewport: () => ({ ...vp }),
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

