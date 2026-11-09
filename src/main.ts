import { data } from './boot';
import { createAnnouncer } from './a11y/announce';
import { announceFor, createA11yTree, type A11yTree } from './a11y/tree';
import { createCameraController, isPortrait, openedHalfHeight, restView, type CameraController, type CameraOpts } from './camera';
import { createController, type Controller } from './controller';
import { wheelText } from './i18n';
import { attachGestures } from './input/gestures';
import { keyTarget, routeKey } from './input/route';
import { TAU, drawWidthOf, normAngle, overDisc, type Viewport } from './model/geometry';
import { buildLayout, homes, litMask, type Layout, type Path } from './model/layout';
import { buildFillTable, inkFor, readPalette } from './render/colors';
import { createSpriteCache } from './render/sprites';
import { createWheelRenderer, labelFont, type WheelRenderer } from './render/wheel';
import { createStore, initialState, type Action, type State, type Store } from './state/store';
import { createHistoryWriter, historyOp } from './state/history';
import { fromHash, hashWheel, toHash } from './state/url';
import { cardModel, type FwCard, type JumpContext } from './ui/card';
import type { FwHint, HintContent } from './ui/hint';
import { applyPref, readPref, resolvedTheme, safeStorage, themeName, writePref, type ThemePref } from './ui/theme';
import type { FwToolbar } from './ui/toolbar';
import type { FwWheelSwitch } from './ui/wheel-switch';
import './ui/card';
import './ui/hint';
import './ui/toolbar';
import './ui/wheel-switch';

const FADE_MS = 150;
const PULSE_MS = 180;

const $ = <T extends Element>(sel: string): T => document.querySelector<T>(sel)!;
const media = (q: string): MediaQueryList => matchMedia(q);

// ── Wheels (spec v2 §7) ──────────────────────────────────────────────────
const { feelings } = data;
const wheelIds = data.wheels.map((w) => w.id);
const firstId = wheelIds[0]!;
/** Each feeling's first place on the first wheel: its colour and jump target on other wheels (spec v2 §5.1, §6.2). */
const home = homes(buildLayout(data.wheels[0]!));
/** Every centre node's hue across all wheels (spec v2 §5.2). */
const hueNames = data.wheels.flatMap((w) => w.children.map((n) => n.hue!));
/** The first wheel keeps inheriting hues from its centre; later wheels colour feelings from their home (Task 2 ruling). */
const layoutFor = (id: string): Layout =>
  buildLayout(data.wheels.find((w) => w.id === id)!, id === firstId ? undefined : home);

const app = $<HTMLElement>('#app');
const stage = $<HTMLElement>('#stage');
const float = $<HTMLElement>('#float');
const canvas = $<HTMLCanvasElement>('#wheel');
const card = $<FwCard>('fw-card');
const hint = $<FwHint>('fw-hint');
const toolbar = $<FwToolbar>('fw-toolbar');
const wheelSwitch = $<FwWheelSwitch>('fw-wheel-switch');
wheelSwitch.wheels = data.wheels.map((w) => ({ id: w.id, label: wheelText(w.id).switch, name: wheelText(w.id).switchName }));
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

// ── The mounted wheel ────────────────────────────────────────────────────
// Only one wheel is live. mount() replaces all of these; everything else reaches them through these bindings, never
// by capturing an object, so a switched-away wheel can be collected (spec v2 §4.2, plan Review Focus 6).
let layout!: Layout;
let store!: Store;
let camera!: CameraController;
let controller!: Controller;
let renderer!: WheelRenderer;
let tree!: A11yTree;
let jump: JumpContext | undefined;
let allLit!: Uint8Array;
let lit!: Uint8Array;
let prevLit!: Uint8Array;
let fadeStart = -Infinity;
let pulseStart = -Infinity;

/** Spec v2.2 §3.2: in the sideways layout the camera's aim width ends this far left of the card. */
const CARD_GAP_REM = 1.5;

function measure(): { vp: Viewport; opts: CameraOpts } {
  const box = stage.getBoundingClientRect();
  const whole = app.getBoundingClientRect();
  const remPx = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  // Spec v2.1 §6.1: the one portrait rule, matching the stylesheet's container query.
  const portrait = isPortrait(whole);
  // Spec v2.2 §3.1–§3.2: the canvas is the whole stage; sideways, the camera aims left of the card itself, so a
  // safe-area inset that pushes the card left can't cover the opened word.
  const width = portrait ? box.width : Math.max(float.getBoundingClientRect().left - box.left - CARD_GAP_REM * remPx, 1);
  const { height } = box;
  const vp = { width, height, radius: Math.max(Math.min(width, height) / 2 - 8, 1), drawWidth: box.width };
  // v2.2.1: the app's left padding is env(safe-area-inset-left), a sideways phone's notch; the camera keeps clear of it.
  const insetLeft = Number.parseFloat(getComputedStyle(app).paddingLeft) || 0;
  return { vp, opts: { remPx, portrait, rest: restView(layout, vp, whole), openedY: null, insetLeft } };
}

let vp!: Viewport;
let opts!: CameraOpts;

// ── Rendering ────────────────────────────────────────────────────────────
const makeCanvas = (w: number, h: number): HTMLCanvasElement | OffscreenCanvas =>
  typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h });
/** Shared by every wheel: keyed on label, size and colour (spec v1.2 §7). */
const sprites = createSpriteCache(makeCanvas, 600, labelFont);
/** Spec §4.2: cells fade only while a word is opened. */
const litFor = (s: State): Uint8Array => (s.opened ? litMask(layout, s.selected) : allLit);
const openedKey = (s: State): number | null => (s.opened ? s.selected : null);
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
    mode: s.view.mode, ring: s.view.mode === 'ring' ? s.view.ring : null, remPx: opts.remPx, moreContrast: moreContrast.matches,
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

// Spec v2.2 §3.1: the card's column is the wheel's canvas now, so a click on its empty space is the wheel's own tap
// off the wheel (close, then clear), which replaces v1.3 §3.4's click handler on #app.

/** Spec v1.3 §3.1 and v2 §4.1: the message shows exactly when nothing is selected, with a link to another wheel. */
function hintContent(s: State): HintContent {
  if (s.selected !== null) return null;
  const text = wheelText(layout.wheelId);
  const wheel = data.suggests[layout.wheelId]!;
  // Spec v2.1 §6.3: the other wheel's own URL (v2 §4.3), so a new tab opens that wheel.
  const href = wheel === firstId ? location.pathname + location.search : `#/${wheel}`;
  return { title: text.hintTitle, text: text.hint, link: { label: text.hintLink, wheel, href } };
}

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
  return openedYForHeight(card.unfoldedHeightFor(cardModel(layout, feelings, { ...s, selected: segment }, jump)));
}

/** Re-measures the opened word's place after the card renders, and springs the camera to it. */
function placeOpened(s: State): void {
  const y = openedYFor(s);
  opts = { ...opts, openedY: y };
  controller.setOpenedY(y);
}

function renderUi(s: State): void {
  setOpenedHalf(s);
  card.model = cardModel(layout, feelings, s, jump);
  hint.content = hintContent(s);
  toolbar.selected = s.selected !== null;
  app.dataset['mode'] = s.view.mode;
  tree.update(s);
}

// ── URL & history (spec §3.6, v2 §4.3) ───────────────────────────────────
const writer = createHistoryWriter(history, () => performance.now());
const urlFor = (s: State): string => toHash(layout, s, layout.wheelId === firstId) || location.pathname + location.search;

function onState(s: State, prev: State, a: Action): void {
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
    if (op === 'push') writer.push(urlFor(s));
    else writer.replace(urlFor(s));
  }
}

/**
 * The wheel and state a URL names (spec v2 §4.3). A wheel other than the first needs its base hash or a word on it;
 * anything else, including an unknown wheel or path, is the first wheel (a bad path there gives its start view).
 */
function fromLocation(hash: string): { layout: Layout; state: State | null } {
  const id = hashWheel(hash, wheelIds);
  if (id !== null && id !== firstId) {
    const l = layoutFor(id);
    const s = fromHash(l, hash);
    if (s !== null || hash === `#/${id}`) return { layout: l, state: s };
  }
  const l = layoutFor(firstId);
  return { layout: l, state: fromHash(l, hash) };
}

// ── Mounting a wheel (spec v2 §4.2) ──────────────────────────────────────
const live: WeakRef<object>[] = [];

/** A fresh, empty tree root: the old one, and the listeners createA11yTree put on it, go with the old wheel. */
function freshTreeRoot(): HTMLElement {
  const old = $<HTMLElement>('#a11y-tree');
  const root = document.createElement('div');
  root.id = 'a11y-tree';
  old.replaceWith(root);
  return root;
}

/** Unsubscribes the mounted store from onState; a late dispatch to an old store (a pinch's end timer) then goes nowhere. */
let unsubscribe: () => void = () => {};

function mount(next: Layout, initial: State, intro: boolean): void {
  camera?.stop();
  unsubscribe();
  layout = next;
  jump = layout.wheelId === firstId ? undefined : { wheel: firstId, home };
  ({ vp, opts } = measure());
  store = createStore(layout, initial);
  camera = createCameraController({
    now: () => performance.now(),
    raf: (cb) => requestAnimationFrame(cb),
    caf: (id) => cancelAnimationFrame(id),
    reducedMotion: () => reducedMotion.matches,
  });
  camera.onFrame(() => {
    if (pendingDraw !== 0) cancelAnimationFrame(pendingDraw);
    frame();
  });
  controller = createController(layout, store, camera, vp, opts, (segment) => predictOpenedY(segment));
  renderer = createWheelRenderer(canvas, layout, undefined, sprites);
  allLit = litMask(layout, null);
  lit = litFor(store.get());
  prevLit = lit;
  fadeStart = -Infinity;
  pulseStart = -Infinity;
  tree = createA11yTree(freshTreeRoot(), layout, dispatch);
  unsubscribe = store.subscribe(onState);
  wheelSwitch.current = layout.wheelId;

  renderer.resize(drawWidthOf(vp), vp.height, devicePixelRatio || 1);
  refreshColors();
  renderUi(store.get());
  // A deep link on a phone starts with the opened word already above its card.
  opts = { ...opts, openedY: openedYFor(store.get()) };
  controller.setViewport(vp, opts);
  if (intro && opts.rest !== 'whole' && !reducedMotion.matches) controller.playIntro();
  drawNow();
  if (TEST) live.push(new WeakRef(layout), new WeakRef(store));}

/** Spec v2 §4.2: switching always starts fresh (or, from a jump link, opens that word) and pushes history. */
app.addEventListener('fw-wheel', (e) => {
  const { wheel: id, path } = (e as CustomEvent<{ wheel: string; path?: Path }>).detail;
  if (!wheelIds.includes(id) || (id === layout.wheelId && path === undefined)) return;
  const from = e.target;
  const next = layoutFor(id);
  const opened = path === undefined ? null : fromHash(next, `#/${id}/${path}`);
  mount(next, opened ?? initialState, opened === null);
  writer.push(urlFor(store.get()));
  announce(opened === null ? wheelText(id).name : announceFor(layout, initialState, store.get()) ?? wheelText(id).name);
  // Focus: the switch keeps its own button; the message's link and the card's jump are rebuilt, so focus follows.
  if (from === hint) hint.focusLink();
  else if (from === card && opened === null) tree.focusSelected();
});

addEventListener('popstate', () => {
  const found = fromLocation(location.hash);
  if (found.layout.wheelId !== layout.wheelId) {
    // The tree is rebuilt, so focus inside it would fall to <body> (WCAG 2.4.3); put it back on the new tree.
    const treeHadFocus = $<HTMLElement>('#a11y-tree').contains(document.activeElement);
    mount(found.layout, found.state ?? initialState, false);
    announce(wheelText(layout.wheelId).name);
    if (treeHadFocus) tree.focusSelected();
    return;
  }
  const cur = store.get();
  // Back to the base URL: the whole wheel, keeping the last selection (spec v1.2 §3.1).
  const restored = fromHash(layout, location.hash) ?? { ...cur, opened: false, view: { mode: 'wheel' } as const };
  store.dispatch({ type: 'restore', state: restored });
});

// ── Input & resize ───────────────────────────────────────────────────────
attachGestures(canvas, (intents) => controller.handle(intents));

/** `onlyIfChanged`: skip when the viewport and options measure the same (the card resizing as it unfolds). */
function remeasure(onlyIfChanged: boolean): void {
  const next = measure();
  if (onlyIfChanged && next.vp.width === vp.width && next.vp.height === vp.height && drawWidthOf(next.vp) === drawWidthOf(vp)
    && next.opts.remPx === opts.remPx && next.opts.portrait === opts.portrait && next.opts.rest === opts.rest
    && next.opts.insetLeft === opts.insetLeft) return;
  ({ vp, opts } = next);
  renderer.resize(drawWidthOf(vp), vp.height, devicePixelRatio || 1);
  // The card's cap depends on --opened-half, and the opened word's place on the card: set both before the camera.
  setOpenedHalf(store.get());
  opts = { ...opts, openedY: openedYFor(store.get()) };
  controller.setViewport(vp, opts);
  drawNow();
}

new ResizeObserver(() => remeasure(false)).observe(stage);
// Spec v2.2 §3.2 (final review #1): the aim width follows the card, which a safe-area inset (the app's padding) or a
// text-size change (the card's width) can move without resizing the stage.
const aimWatch = new ResizeObserver(() => remeasure(true));
aimWatch.observe(app);
aimWatch.observe(float);

// ── First load ───────────────────────────────────────────────────────────
{
  const start = fromLocation(location.hash);
  mount(start.layout, start.state ?? initialState, start.state === null);
}

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
      viewport: () => ({ ...vp, drawWidth: drawWidthOf(vp) }),
      moving: () => camera.moving,
      drawTimes: () => drawTimes.slice(),
      pathOf: (i: number | null) => (i === null ? null : layout.segments[i]!.path),
      offCenter: (path: string) => {
        const off = normAngle(layout.segments[layout.byPath.get(path)!]!.mid + camera.current.rotation);
        return Math.min(off, TAU - off);
      },
      wheel: () => layout.wheelId,
      liveWheels: () => live.filter((r) => r.deref() !== undefined).length,
      labelsByRing: () => renderer.stats.labelsByRing.slice(),
    },
  });
}
