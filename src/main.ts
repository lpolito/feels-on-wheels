import { data } from './boot';
import { createAnnouncer } from './a11y/announce';
import { announceFor, createA11yTree } from './a11y/tree';
import { createCameraController, openedHalfHeight, useHalfWheel, type CameraOpts } from './camera';
import { createController } from './controller';
import { t } from './i18n';
import { attachGestures } from './input/gestures';
import { keyTarget, routeKey } from './input/route';
import { TAU, normAngle, overDisc, type Viewport } from './model/geometry';
import { buildLayout, litMask } from './model/layout';
import { buildFillTable, inkFor, readPalette } from './render/colors';
import { createSpriteCache } from './render/sprites';
import { createWheelRenderer, labelFont } from './render/wheel';
import { createStore, initialState, type Action, type State } from './state/store';
import { createHistoryWriter, historyOp } from './state/history';
import { fromHash, toHash } from './state/url';
import { cardModel, type FwCard } from './ui/card';
import type { FwHint } from './ui/hint';
import { applyPref, readPref, resolvedTheme, safeStorage, themeName, writePref, type ThemePref } from './ui/theme';
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
/** Every centre node's hue across all wheels (spec v2 §5.2). */
const hueNames = data.wheels.flatMap((w) => w.children.map((n) => n.hue!));

const app = $<HTMLElement>('#app');
const stage = $<HTMLElement>('#stage');
const float = $<HTMLElement>('#float');
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
  return { vp, opts: { remPx, portrait, half: useHalfWheel(layout, vp), openedY: null } };
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
// Function declarations below are hoisted; the predictor only runs on a fling, after start-up.
const controller = createController(layout, store, camera, vp, opts, (segment) => predictOpenedY(segment));

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
  const palette = readPalette(document.documentElement, hueNames);
  const theme = resolvedTheme(themePref, darkScheme);
  renderer.setColors(buildFillTable(palette, layout.rings.length, theme, { moreContrast: moreContrast.matches }), palette);
  // Spec v1.2 §5.2: hover ink per hue. Forced colours use the system's own link colours instead.
  card.inks = palette.forced
    ? {}
    : Object.fromEntries(Object.entries(palette.hues).map(([hue, base]) => [hue, inkFor(base, theme, palette.surface)]));
  // Spec §5.3: the browser chrome follows the resolved theme, including the manual override.
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  if (bg) themeMeta.content = bg;
  requestDraw();
}

for (const mq of [darkScheme, moreContrast, forcedColors]) mq.addEventListener('change', refreshColors);
toolbar.theme = themePref;
app.addEventListener('fw-theme', (e) => {
  themePref = (e as CustomEvent<ThemePref>).detail;
  toolbar.theme = themePref;
  writePref(storage, themePref);
  refreshColors();
  // Spec v1.3 §6.2: a changed button name isn't reliably read out, so announce the new choice.
  announce(themeName(themePref));
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

// Spec v1.3 §3.5: the grab cursor only over the wheel's disc. Dragging still spins from anywhere.
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'mouse') canvas.classList.toggle('fw-over-disc', overDisc(camera.current, vp, e.offsetX, e.offsetY));
});
canvas.addEventListener('pointerleave', () => canvas.classList.remove('fw-over-disc'));

// Spec v1.3 §3.4: a click on empty space in the card's column (desktop) is a tap outside the wheel. A click whose press
// started elsewhere (drag-selecting the card's text, a spin released over the column) lands on #app too, as the
// common ancestor, so the press must have been on empty space as well.
const isEmptySpace = (t: EventTarget | null): boolean => t === app || t === float;
let pressedOnEmpty = false;
app.addEventListener('pointerdown', (e) => { pressedOnEmpty = isEmptySpace(e.target); }, { capture: true });
app.addEventListener('click', (e) => {
  if (!pressedOnEmpty || !isEmptySpace(e.target)) return;
  const s = store.get();
  if (s.opened) dispatch({ type: 'close' });
  else if (s.selected !== null) dispatch({ type: 'clear' });
});

/** Spec v1.3 §3.1: the message shows exactly when nothing is selected. */
const hintText = (s: State): string | null => (s.selected === null ? t('hint') : null);

/** Spec v1.2 §4.2: the phone card's height cap keeps it below the opened cell. */
function setOpenedHalf(s: State): void {
  const half = s.opened && s.selected !== null ? openedHalfHeight(layout, s.selected, vp, opts) : 0;
  app.style.setProperty('--opened-half', `${half}px`);
}

/**
 * Spec v1.3 §4.2: on portrait stages, the stage y that centres the opened word between the top (below the safe area)
 * and the top of the card once fully unfolded. Null when nothing is opened or the stage isn't portrait.
 */
function openedYFor(s: State): number | null {
  if (!s.opened || !opts.portrait) return null;
  return openedYForHeight(card.unfoldedHeight());
}

/** The opened word's stage y for a card that unfolds to `unfolded` px (capped like the card itself). */
function openedYForHeight(unfolded: number): number {
  const stageTop = stage.getBoundingClientRect().top;
  const top = stageTop + (Number.parseFloat(getComputedStyle(app).paddingTop) || 0);
  const cap = Number.parseFloat(getComputedStyle(float).maxHeight);
  const height = Math.min(unfolded, Number.isFinite(cap) ? cap : Infinity);
  const cardTop = float.getBoundingClientRect().bottom - height;
  return (top + cardTop) / 2 - stageTop;
}

/** For a spin while opened: where the word it will land on should sit, measured from that word's card. */
function predictOpenedY(segment: number): number | null {
  const s = store.get();
  if (!s.opened || !opts.portrait) return null;
  return openedYForHeight(card.unfoldedHeightFor(cardModel(layout, feelings, { ...s, selected: segment })));
}

/** Re-measures the opened word's place after the card renders, and springs the camera to it. */
function placeOpened(s: State): void {
  const y = openedYFor(s);
  opts = { ...opts, openedY: y };
  controller.setOpenedY(y);
}

function renderUi(s: State): void {
  setOpenedHalf(s);
  card.model = cardModel(layout, feelings, s);
  hint.text = hintText(s);
  toolbar.selected = s.selected !== null;
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
  placeOpened(s);
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
  store.dispatch({ type: 'restore', state: restored });
});

// ── Input & resize ───────────────────────────────────────────────────────
attachGestures(canvas, (intents) => controller.handle(intents));

new ResizeObserver(() => {
  ({ vp, opts } = measure());
  renderer.resize(vp.width, vp.height, devicePixelRatio || 1);
  // The card's cap depends on --opened-half, and the opened word's place on the card: set both before the camera.
  setOpenedHalf(store.get());
  opts = { ...opts, openedY: openedYFor(store.get()) };
  controller.setViewport(vp, opts);
  drawNow();
}).observe(stage);

// ── First load ───────────────────────────────────────────────────────────
renderer.resize(vp.width, vp.height, devicePixelRatio || 1);
refreshColors();
renderUi(store.get());
// A deep link on a phone starts with the opened word already above its card.
opts = { ...opts, openedY: openedYFor(store.get()) };
controller.setViewport(vp, opts);
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

