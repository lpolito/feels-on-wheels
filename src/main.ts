import { data } from './boot';
import { createAnnouncer } from './a11y/announce';
import { announceFor, createA11yTree, type A11yTree } from './a11y/tree';
import { createCameraController, isPortrait, openedHalfHeight, restView, type CameraController, type CameraOpts } from './camera';
import { createController, type Controller } from './controller';
import { t, wheelText } from './i18n';
import { attachGestures } from './input/gestures';
import { keyTarget, routeKey } from './input/route';
import { TAU, drawWidthOf, normAngle, overDisc, type Viewport } from './model/geometry';
import { buildLayout, homes, litMask, type Layout, type Path } from './model/layout';
import { routeMeta } from './meta';
import { inAppLink } from './router';
import { buildFillTable, inkFor, readPalette } from './render/colors';
import { createSpriteCache } from './render/sprites';
import { createWheelRenderer, labelFont, type WheelRenderer } from './render/wheel';
import { createStore, initialState, type Action, type State, type Store } from './state/store';
import { createHistoryWriter, historyOp } from './state/history';
import { formatRoute, parsePath, pathOf, routeTable, stateFor, type Route } from './state/url';
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
/** Each feeling's first place on the first wheel: its color and jump target on other wheels (spec v2 §5.1, §6.2). */
const home = homes(buildLayout(data.wheels[0]!));
/** Every center node's hue across all wheels (spec v2 §5.2). */
const hueNames = data.wheels.flatMap((w) => w.children.map((n) => n.hue!));
/** The first wheel keeps inheriting hues from its center; later wheels color feelings from their home (Task 2 ruling). */
const layoutFor = (id: string): Layout =>
  buildLayout(data.wheels.find((w) => w.id === id)!, id === firstId ? undefined : home);
/** Every real path (URL redesign spec §1); the same table the build and the Worker use. */
const table = routeTable(data.wheels);

const root = document.documentElement;
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
/** URL redesign spec §3: About is showing. The wheel is hidden as it was, keeps its state and doesn't draw. */
let onAbout = false;
/** The wheel was mounted while About hid it (a first load at /about), so it measured nothing. */
let mountedHidden = false;

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
/** Shared by every wheel: keyed on label, size and color (spec v1.2 §7). */
const sprites = createSpriteCache(makeCanvas, 600, labelFont);
/** Spec §4.2: cells fade only while a word is opened. */
const litFor = (s: State): Uint8Array => (s.opened ? litMask(layout, s.selected) : allLit);
const openedKey = (s: State): number | null => (s.opened ? s.selected : null);
let pendingDraw = 0;
const TEST = import.meta.env.MODE === 'test';
const drawTimes: number[] = [];

function frame(): void {
  pendingDraw = 0;
  if (onAbout) return;
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
  // Spec v1.2 §5.2: hover ink per hue. Forced colors use the system's own link colors instead.
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
  // On About the keys are the page's (scrolling, links), not the hidden wheel's.
  if (e.defaultPrevented || onAbout) return;
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

/**
 * URL redesign spec §7: the word a not-found path named, shown in place of the start message until the state first
 * changes. Null otherwise.
 */
let notFound: { word: string } | null = null;

/** Spec v1.3 §3.1 and v2 §4.1: the message shows exactly when nothing is selected, with a link to another wheel. */
function hintContent(s: State): HintContent {
  if (s.selected !== null) return null;
  const text = wheelText(layout.wheelId);
  const wheel = data.suggests[layout.wheelId]!;
  // Spec v2.1 §6.3: the other wheel's own URL, so a new tab opens that wheel.
  const href = formatRoute(table, { kind: 'wheel', wheel, path: null });
  const usual = { title: text.hintTitle, text: text.hint, link: { label: text.hintLink, wheel, href } };
  if (notFound === null) return usual;
  return { ...usual, title: t('notFoundTitle'), lead: `${t('notFoundText', { word: notFound.word })} `, variant: 'notFound' };
}

/** Spec v1.2 §4.2: the phone card's height cap keeps it below the opened cell. */
function setOpenedHalf(s: State): void {
  const half = s.opened && s.selected !== null ? openedHalfHeight(layout, s.selected, vp, opts) : 0;
  app.style.setProperty('--opened-half', `${half}px`);
}

/**
 * Spec v1.3 §4.2: on portrait stages, the stage y that centers the opened word between the top (below the safe area)
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

// ── URL & history (URL redesign spec §1, §6; history rule spec 2026-11-14) ──────────────────────────
const writer = createHistoryWriter(history, () => performance.now());
const routeOf = (s: State): Extract<Route, { kind: 'wheel' }> => ({ kind: 'wheel', wheel: layout.wheelId, path: pathOf(layout, s) });
const urlFor = (s: State): string => formatRoute(table, routeOf(s));
const showTitle = (route: Route): void => {
  document.title = routeMeta(route, table, data.locale).title;
};

/** Writes the mounted wheel's URL for `s` (dropping any query) and its title. */
function writeUrl(how: 'push' | 'replace', s: State): void {
  writer[how](urlFor(s));
  showTitle(routeOf(s));
}

function onState(s: State, prev: State, a: Action): void {
  // Spec §7: the first change after not found ends it and replaces its address, even one that names no word.
  const leftNotFound = notFound !== null && a.type !== 'restore';
  if (leftNotFound) notFound = null;
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
  // Hidden behind About, the wheel never rewrites About's entry.
  if (onAbout) return;
  // History rule spec: the first change on not found replaces the mistyped address, whatever the rule says.
  const op = leftNotFound ? 'replace' : historyOp(prev, s, a);
  if (op !== 'none') writeUrl(op, s);
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
  mountedHidden = onAbout;
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

// ── Routes (URL redesign spec §2, §3) ────────────────────────────────────
const aboutHeading = $<HTMLElement>('#about h1');
const backLink = $<HTMLAnchorElement>('#about .about-back a');
/** About's history entry says it was opened from inside the app, so "Back to the wheel" can be a Back (spec §3). */
const IN_APP = { fwInApp: true };
/** The control that opened About; it gets focus back when About closes (WCAG 2.4.3). */
let opener: HTMLElement | null = null;

/**
 * About (spec §3): the wheel hides as it is, with any spin landed first so its URL is final, and the back link
 * points at it. Focus goes to the heading unless this is the first load.
 */
function showAbout(how: 'push' | 'replace' | 'none', from?: Element): void {
  const firstLoad = layout === undefined;
  const entering = !onAbout;
  if (entering && !firstLoad) {
    controller.setViewport(vp, opts);
    camera.stop();
    const active = from ?? document.activeElement;
    opener = active instanceof HTMLElement && app.contains(active) ? active : null;
  }
  onAbout = true;
  root.dataset['route'] = 'about';
  if (firstLoad) mount(layoutFor(firstId), initialState, false);
  backLink.href = urlFor(store.get());
  if (entering) {
    scrollTo(0, 0);
    if (!firstLoad) aboutHeading.focus();
  }
  const url = formatRoute(table, { kind: 'about' });
  if (how === 'push') writer.push(url, IN_APP);
  else if (how === 'replace') writer.replace(url);
  showTitle({ kind: 'about' });
}

/**
 * The one place a route is shown: mounts its wheel when another is showing (playing the intro on a first load or a
 * switch to a wheel at rest), else restores the state on this wheel; then writes the URL (`how`) and the title.
 * Not found is its wheel at rest with the not-found message, at the path as typed (`link.path` for a link).
 */
function applyRoute(route: Route, how: 'push' | 'replace' | 'none', link?: { path: string; from: Element }): void {
  if (route.kind === 'about') {
    showAbout(how, link?.from);
    return;
  }
  const firstLoad = layout === undefined;
  const leaving = onAbout;
  if (leaving) {
    onAbout = false;
    root.dataset['route'] = 'wheel';
    // Shown again at its size; mounted while hidden, it measured nothing, so it mounts again as it is.
    if (route.wheel === layout.wheelId) {
      if (mountedHidden) mount(layout, store.get(), false);
      else remeasure(false);
    }
  }
  const wheelPath = route.kind === 'wheel' ? route.path : null;
  notFound = route.kind === 'notFound' ? { word: route.word } : null;
  if (firstLoad || route.wheel !== layout.wheelId) {
    const next = layoutFor(route.wheel);
    const opened = wheelPath === null ? null : stateFor(next, wheelPath);
    mount(next, opened ?? initialState, opened === null && notFound === null && (firstLoad || how !== 'none'));
    if (!firstLoad && notFound === null) {
      announce(opened === null ? wheelText(route.wheel).name : announceFor(layout, initialState, opened) ?? wheelText(route.wheel).name);
    }
  } else {
    const cur = store.get();
    // Back to a wheel's base URL: the whole wheel, keeping the last selection (spec v1.2 §3.1).
    const restored = notFound !== null ? initialState
      : (wheelPath === null ? null : stateFor(layout, wheelPath)) ?? { ...cur, opened: false, view: { mode: 'wheel' } as const };
    store.dispatch({ type: 'restore', state: restored });
    renderUi(store.get());
  }
  if (notFound !== null) {
    const text = wheelText(layout.wheelId);
    announce(`${t('notFoundTitle')} ${t('notFoundText', { word: notFound.word })} ${text.hint.replace('{link}', text.hintLink)}`);
  }
  if (how === 'none') showTitle(route);
  else if (route.kind === 'wheel') writeUrl(how, store.get());
  else {
    writer[how](link?.path ?? location.pathname);
    showTitle(route);
  }
  if (leaving) {
    const back = opener;
    opener = null;
    back?.focus();
    if (!back || document.activeElement !== back) tree.focusSelected();
  }
}

/**
 * Spec §2: a plain click on a same-origin link is shown in the app (the hint's link already handles its own). A link
 * to the address already showing changes nothing, and "Back to the wheel" on an About opened in the app is a Back.
 */
document.addEventListener('click', (e) => {
  const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
  if (!(a instanceof HTMLAnchorElement)) return;
  const url = inAppLink(e, { href: a.href, target: a.target, download: a.hasAttribute('download') }, location.origin);
  if (!url) return;
  e.preventDefault();
  if (a === backLink && (history.state as { fwInApp?: unknown } | null)?.fwInApp) history.back();
  else if (url.pathname !== location.pathname) applyRoute(parsePath(table, url.pathname).route, 'push', { path: url.pathname, from: a });
});

/** Spec v2 §4.2: switching always starts fresh (or, from a jump link, opens that word) and pushes history (history rule spec), except from not found. */
app.addEventListener('fw-wheel', (e) => {
  const { wheel: id, path } = (e as CustomEvent<{ wheel: string; path?: Path }>).detail;
  if (!wheelIds.includes(id) || (id === layout.wheelId && path === undefined)) return;
  const from = e.target;
  const opened = path !== undefined && table.wheels.get(id)!.has(path);
  // History rule spec: on not found, the message's own link replaces the mistyped address, so Back never returns to it.
  applyRoute({ kind: 'wheel', wheel: id, path: opened ? path! : null }, notFound !== null ? 'replace' : 'push');
  // Focus: the switch keeps its own button; the message's link and the card's jump are rebuilt, so focus follows.
  if (from === hint) hint.focusLink();
  else if (from === card && !opened) tree.focusSelected();
});

addEventListener('popstate', () => {
  // A rebuilt tree drops focus to <body> (WCAG 2.4.3); put it back on the new tree.
  const treeHadFocus = $<HTMLElement>('#a11y-tree').contains(document.activeElement);
  applyRoute(parsePath(table, location.pathname).route, 'none');
  if (treeHadFocus && !$<HTMLElement>('#a11y-tree').contains(document.activeElement)) tree.focusSelected();
});

// ── Input & resize ───────────────────────────────────────────────────────
attachGestures(canvas, (intents) => controller.handle(intents));

/** `onlyIfChanged`: skip when the viewport and options measure the same (the card resizing as it unfolds). */
function remeasure(onlyIfChanged: boolean): void {
  // Hidden behind About, the stage measures 0: keep the last real size (spec §3).
  const box = stage.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) return;
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
applyRoute(parsePath(table, location.pathname).route, 'none');

// ── Offline support (spec §6.5) ─────────────────────────────────────────
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const register = (): void => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // Offline support is an enhancement; the app works without it.
    });
  };
  // The app may already have waited for load (the missing-tokens wait above), and a late load listener never fires.
  if (document.readyState === 'complete') register();
  else addEventListener('load', register, { once: true });
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
