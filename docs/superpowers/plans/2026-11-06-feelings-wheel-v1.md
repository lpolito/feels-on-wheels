# Feelings Wheel v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the prototype with a fast, accessible, offline-capable feelings wheel. One `<canvas>` draws the wheel, and the app handles its own zoom, rotation and snapping, plus a definition panel.

**Architecture:** Vite + TypeScript, no framework. The data, layout, geometry, store, URL and camera math are pure modules with unit tests. A thin canvas renderer, gesture recognizer, accessible DOM tree and light-DOM custom elements subscribe to one tiny store. `main.ts` only wires them together.

**Tech Stack:** Vite 8.3.6, TypeScript 7.0.2, Vitest 5.1.0 (happy-dom 21.0.4 for DOM tests), Playwright 1.65.0 with @axe-core/playwright 4.14.0. Node 26, npm 11.

**Spec:** `docs/superpowers/specs/2026-11-06-feelings-wheel-v1-design.md`. Read it before starting any task; section numbers below (§) refer to it.

## Global Constraints

- No runtime dependencies. `dependencies` in package.json stays empty; everything is a devDependency.
- No UI framework, no shadow DOM, no slots. Custom elements render into the light DOM.
- No user-facing string in code. Every string goes through `t()` and comes from `src/data/locales/en.json`.
- No network requests other than the app's own static files. No analytics, no web fonts (system font stack only).
- Angles are radians. Wheel-space angle 0 = 3 o'clock, increasing clockwise (screen y points down). Screen angle = wheel angle + `camera.rotation`.
- Ring geometry, as fractions of R: `[{0.12,0.32},{0.32,0.62},{0.62,1.0}]`.
- Budgets: app JS ≤ 25 KB gzipped; first load (HTML + CSS + JS + en data) ≤ 60 KB gzipped; canvas bitmap ≤ viewport × devicePixelRatio; no `requestAnimationFrame` running while idle.
- Accessibility: WCAG 2.2 AA; axe-core reports zero violations; label contrast ≥ 4.5:1 lit and ≥ 3:1 faded; zoomed focused-ring segments ≥ 44 CSS px tall.
- Honor `prefers-reduced-motion` (no tweens, no intro), `prefers-contrast: more`, `forced-colors: active`.
- Storage keys: `fw.theme`, `fw.seenIntro`. Every storage access is wrapped in try/catch.
- Gesture thresholds: tap < 8 px movement and < 300 ms; double-tap = second tap within 300 ms and 24 px; swipe > 40 px with |dx| > 2|dy|; scroll-snap after 150 ms idle.
- Motion constants: spring ω = 16 rad/s, critically damped (settles in ≈ 300 ms); cross-fade 150 ms; intro ≈ 700 ms rotating 1.5 segment widths.
- Label sizes: overview min 8 px (hidden below), max 16 px; zoomed min 12 px, max 1.5 rem. Start zoomed if the overview's outer labels would be under 12 CSS px.
- Browser support: the last 2 versions of Chrome, Edge, Firefox and Safari; iOS Safari 16.4+.
- Repo is private: commit directly to `main`. Commit messages never include `Co-Authored-By` or any AI attribution trailer.

## Review Focus

1. **Resize or device rotation while zoomed** (or mid-spin): the camera must recompute the resting state and keep the centered segment exactly at angle 0. Test in Task 14.
2. **`pointercancel` mid-pinch or mid-drag** (an iOS system gesture, a third finger, lost pointer capture) must end the gesture cleanly with no stuck pinch. Test in Task 9.
3. **Tapping during momentum or a spring animation** must hit-test against the *live* animated camera, stop the motion and select what is under the finger. Test in Task 7 (`stop()` + live camera) and Task 14 (e2e).
4. **Large text settings** (root font 24 px or 200% browser zoom) with long labels ("Out of Control", "Disillusioned", "Disrespected"): labels wrap or shrink but are never truncated or overlapping. Test in Task 8.
5. **Hostile environment input:** a corrupt or unknown URL hash, `localStorage` throwing (private mode), or a rotation that has grown huge after many spins. The app starts with defaults and rotation stays normalized. Tests in Tasks 6, 7 and 12.

---

## File Map

| File | Responsibility | Task |
|---|---|---|
| `package.json`, `vite.config.ts`, `tsconfig.json`, `playwright.config.ts`, `.gitignore`, `index.html`, `src/styles/*.css` | Project scaffold, page shell | 1 |
| `src/data/types.ts`, `src/data/load.ts`, `src/data/wheels/core.json`, `src/data/feelings.json`, `src/data/locales/en.json`, `src/i18n.ts` | Data, validation, `t()` | 2, 3 |
| `src/model/layout.ts` | Wheel → segments, lit mask | 4 |
| `src/model/geometry.ts` | Camera/viewport math, hit-test, snap, view window | 5 |
| `src/state/store.ts`, `src/state/url.ts` | State transitions, hash ↔ state | 6 |
| `src/camera.ts` | Springs, fling, resting cameras, start-zoomed test | 7 |
| `src/render/colors.ts`, `src/render/labels.ts`, `src/render/wheel.ts` | Palette, label fitting, canvas drawing | 8, 10 |
| `src/input/gestures.ts`, `src/input/keyboard.ts` | Events → intents/actions | 9 |
| `src/a11y/tree.ts`, `src/a11y/announce.ts` | Accessible tree, live region | 11 |
| `src/ui/panel.ts`, `src/ui/toolbar.ts`, `src/ui/theme.ts` | Panel/path chips, toolbar, theme pref | 12 |
| `src/main.ts`, `src/controller.ts`, `src/styles/app.css` | Wiring, input→camera→store glue, layout | 13, 14 |
| `public/manifest.webmanifest`, `public/icons/*`, `src/sw/sw.ts`, `build/sw-plugin.ts` | Offline install | 15 |
| `scripts/check-size.mjs`, `tests/e2e/*`, `tests/perf/*` | Budgets, e2e, perf | 14–16 |

---

### Task 1: Housekeeping and scaffold

**Files:**
- Commit the existing prototype changes as they are first.
- Delete: `components/`, `main.js`, `styles.css`, old `index.html`
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest` config (inside `vite.config.ts`), `playwright.config.ts`, `.gitignore`, `index.html`, `src/main.ts` (placeholder), `src/styles/tokens.css`, `src/styles/app.css`, `tests/unit/smoke.test.ts`

**Interfaces:**
- Produces npm scripts: `dev`, `build` (`tsc --noEmit && vite build`), `build:test` (`vite build --mode test --outDir dist-test`), `preview`, `test` (`vitest run`), `test:e2e` (`playwright test`), `size` (`node scripts/check-size.mjs`, added in Task 16).
- `index.html` contains: `<main id="app">` with `<canvas id="wheel" aria-hidden="true">`, `<div id="a11y-tree">`, `<div id="announcer" aria-live="polite" class="visually-hidden">`, `<fw-path>`, `<fw-panel>`, `<fw-toolbar>`.
- `tokens.css` defines on `:root`: `--bg --fg --muted --gap --focus --surface` and `--hue-{fearful,angry,disgusted,sad,happy,surprised,bad}`, with dark values under `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {…} }` and `:root[data-theme="dark"]`. Starting hexes, light: fearful `#C2257F`, angry `#C62835`, disgusted `#A4532A`, sad `#3B3470`, happy `#D9730D`, surprised `#3E7B5E`, bad `#5E3A87`. Dark: fearful `#E0559E`, angry `#E0525C`, disgusted `#C77A4F`, sad `#7A70C2`, happy `#E8933A`, surprised `#5FA383`, bad `#8E6BC0`. Task 8's contrast test may tune them.

- [ ] **Step 1:** `git add -A components index.html && git commit -m "WIP prototype: CSS wedge math experiments"` (leave `.DS_Store` untracked).
- [ ] **Step 2:** Remove the prototype files. `npm init -y`, then `npm i -D vite@8.3.6 typescript@7.0.2 vitest@5.1.0 happy-dom@21.0.4 @playwright/test@1.65.0 @axe-core/playwright@4.14.0` and `npx playwright install`.
- [ ] **Step 3:** Write the configs. `tsconfig`: `strict`, `noUncheckedIndexedAccess`, `resolveJsonModule`, `moduleResolution: "bundler"`, `lib: ["ES2022","DOM","DOM.Iterable","WebWorker"]`. Vite: `build.rollupOptions.output.manualChunks` puts `src/data/**` in a `data` chunk; Vitest `environment: 'node'` by default, with `// @vitest-environment happy-dom` per DOM test file. Playwright: projects chromium, firefox, webkit and `Pixel 7` / `iPhone 15` devices; `webServer: npm run build:test && npx vite preview --outDir dist-test --port 4173`. `.gitignore`: `node_modules/ dist/ dist-test/ .DS_Store test-results/ playwright-report/`. CSS: carry over the reset from the old `styles.css` into `app.css`; system font stack; `.visually-hidden` utility; `html, body { height: 100%; overflow: hidden }`; `canvas { touch-action: none }`.
- [ ] **Step 4:** The smoke test `tests/unit/smoke.test.ts` asserts `1 + 1 === 2`. Run `npm test` → PASS; `npm run build` → creates `dist/`.
- [ ] **Step 5:** Commit `chore: replace prototype with Vite + TypeScript scaffold`.

---

### Task 2: Data types, wheel data, validation, i18n

**Files:**
- Create: `src/data/types.ts`, `src/data/load.ts`, `src/data/wheels/core.json`, `src/data/feelings.json`, `src/data/locales/en.json`, `src/i18n.ts`
- Test: `tests/unit/data.test.ts`

**Interfaces:**
- Produces (`types.ts`):
  ```ts
  export type FeelingId = string; export type SensationId = string;
  export type Strength = 'strong' | 'medium' | 'light';
  export interface Feeling { sensations: SensationId[]; strength?: Strength; emoji?: string }
  export type FeelingsDict = Record<FeelingId, Feeling>;
  export interface RingSpec { inner: number; outer: number }
  export interface WheelNode { feeling: FeelingId; hue?: string; children?: WheelNode[] }
  export interface Wheel { id: string; rings: RingSpec[]; children: WheelNode[] }
  export interface Locale {
    meta: { lang: string; dir: 'ltr' | 'rtl' };
    ui: Record<string, string>;
    feelings: Record<FeelingId, { label: string; definition: string }>;
    sensations: Record<SensationId, string>;
  }
  ```
- Produces (`load.ts`): `class DataError extends Error`; `validateWheel(w: unknown, dict: FeelingsDict): Wheel`; `validateLocale(l: unknown, dict: FeelingsDict, wheel: Wheel): Locale`; `loadData(): { wheel: Wheel; feelings: FeelingsDict; locale: Locale }` (static JSON imports, validated).
- Produces (`i18n.ts`): `setLocale(l: Locale): void` (also sets `<html lang dir>` when `document` exists); `t(key: string, vars?: Record<string,string>): string` reads `ui[key]` and replaces `{name}` placeholders; a missing key returns the key itself and logs `console.warn` once; `label(id: FeelingId): string`; `definition(id): string`; `sensationLabel(id): string`.

- [ ] **Step 1: Write failing tests** in `tests/unit/data.test.ts`:
  - `core wheel has 7 core, 41 middle, 82 outer positions` (count by depth).
  - `core order starts Fearful, Angry, Disgusted, Sad, Happy, Surprised, Bad` (so the default rotation −π/2 matches the reference look).
  - `every node feeling exists in feelings.json`.
  - `only depth-0 nodes declare hue and every core has one`.
  - `labels: Judgmental (not Judgemental), Optimistic without leading space`.
  - `duplicate words share one feeling id`: `overwhelmed`, `embarrassed`, `inferior` and `disappointed` each appear at two positions.
  - `validateWheel throws DataError on unknown feeling id` and `on rings not ascending/contiguous`.
  - `every feeling and every sensation id used has a locale label` (definitions are checked in Task 3).
  - `t replaces {name} vars and returns key for missing`.
- [ ] **Step 2:** `npx vitest run tests/unit/data.test.ts` → FAIL (modules missing).
- [ ] **Step 3:** Write the data. `core.json` uses the word set from the prototype (git history: `git show HEAD~1:index.html`), reordered as above, with the two label fixes. Feeling ids are lowercase kebab-case labels (`out-of-control`, `let-down`). `feelings.json` has `{ "sensations": [] }` for every id (content comes in Task 3). `en.json` has labels, `definition: ""`, and the `ui` strings `prompt`, `zoomIn`, `zoomOut`, `close`, `narrowDown`, `youMightNotice`, `closeTo`, `theme`, `themeSystem`, `themeLight`, `themeDark`, `wheelLabel` ("Feelings wheel"), `inPath` ("{label}. In {path}."). Then implement `load.ts` and `i18n.ts`.
- [ ] **Step 4:** Run the tests → PASS.
- [ ] **Step 5:** Commit `feat(data): wheel data, types, validation and i18n`.

---

### Task 3: Content: definitions and sensations

**Files:**
- Modify: `src/data/feelings.json`, `src/data/locales/en.json`
- Test: `tests/unit/content.test.ts`

**Interfaces:** Data only; no code changes.

- [ ] **Step 1: Write failing tests:**
  - `every feeling has a non-empty definition of 1–2 sentences` (split on `/[.!?](\s|$)/`, ≤ 2 non-empty parts, ≤ 220 chars).
  - `every feeling has 2–4 sensations, all present in en.sensations`.
  - `sensation vocabulary is 30–50 ids and every id is used at least once`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Write the content following §3.4: plain language, grade 6–8 reading level, describe rather than diagnose, original prose (common words for feelings and sensations are fine). The same feeling id gets one definition even when it appears in two places.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `content: definitions and body sensations for v1 wheel`.
- [ ] **Step 6: Human gate.** Produce `docs/content-review.md` listing each word with its definition and sensations, and ask Lucas to review it. Apply his edits in a follow-up commit. Later tasks don't depend on this gate, so continue while he reviews, but v1 is not done until he approves.

---

### Task 4: Layout model

**Files:**
- Create: `src/model/layout.ts`
- Test: `tests/unit/layout.test.ts`

**Interfaces:**
- Consumes: `Wheel` (Task 2).
- Produces:
  ```ts
  export type Path = string; // 'angry/aggressive/hostile'
  export interface Segment {
    index: number; path: Path; feelingId: FeelingId; ring: number;
    start: number; end: number; mid: number;   // wheel-space radians, [0, 2π]
    parent: number; children: number[]; hue: string; leafCount: number;
  }
  export interface Ring { index: number; inner: number; outer: number; segments: number[]; starts: Float64Array }
  export interface Layout { wheelId: string; segments: Segment[]; rings: Ring[]; byPath: Map<Path, number> }
  export function buildLayout(wheel: Wheel): Layout;
  export function litMask(layout: Layout, selected: number | null, out?: Uint8Array): Uint8Array; // 1 = lit; all 1 when selected is null
  export function siblings(layout: Layout, i: number): number[]; // same parent, excluding i
  export function ringNeighbor(layout: Layout, i: number, delta: 1 | -1): number; // wraps around the ring
  ```
  `parent` is −1 for core segments. `ring.segments` is ordered by `start`, and `starts[k]` is the start angle of `segments[k]`.

- [ ] **Step 1: Write failing tests:**
  - `segment angles in each ring tile [0, 2π) with no gaps` (sum of `end − start` is 2π within 1e-9, and each start equals the previous end).
  - `segment width is proportional to leafCount` (Angry = 16/82 × 2π).
  - `children lie within the parent's angle range`.
  - `paths are unique and byPath round-trips`.
  - `litMask(selected=aggressive)` lights exactly angry, aggressive, provoked, hostile.
  - `litMask(selected=angry)` lights all 25 Angry segments.
  - `litMask(null)` lights all.
  - `ringNeighbor wraps last→first`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement with a depth-first walk that counts leaves first, then assigns angles. `litMask` marks the selected node, walks up through parents and down through descendants, and reuses `out` when it is provided.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat(model): wheel layout and lit mask`.

---

### Task 5: Geometry

**Files:**
- Create: `src/model/geometry.ts`
- Test: `tests/unit/geometry.test.ts`

**Interfaces:**
- Consumes: `Layout`, `Segment`, `Ring` (Task 4).
- Produces:
  ```ts
  export interface Viewport { width: number; height: number; radius: number } // radius = R in CSS px at scale 1
  export interface Camera { scale: number; rotation: number; cx: number; cy: number } // cx, cy = wheel center on screen, CSS px
  export const TAU: number;
  export function normAngle(a: number): number;                       // → [0, 2π)
  export function toPolar(x: number, y: number, cam: Camera, vp: Viewport): { r: number; theta: number }; // r in R units, theta wheel-space
  export function ringAt(layout: Layout, r: number): number | null;
  export function segmentAt(layout: Layout, ring: number, theta: number): number; // binary search on ring.starts
  export function hitTest(layout: Layout, cam: Camera, vp: Viewport, x: number, y: number): number | null;
  export function snapRotation(layout: Layout, ring: number, rotation: number): { rotation: number; segment: number };
  export function rotationToCenter(seg: Segment, current: number): number; // rotation that puts seg.mid at screen angle 0, nearest to current
  export interface ViewWindow { rMin: number; rMax: number; full: boolean; from: number; to: number } // wheel-space angle interval when !full
  export function viewWindow(cam: Camera, vp: Viewport): ViewWindow;
  export function inWindow(seg: Segment, ring: Ring, w: ViewWindow): boolean;
  ```
  `snapRotation` finds the segment of `ring` under screen angle 0 (wheel angle `normAngle(-rotation)`) and returns `rotationToCenter` for it. The result is never more than half a segment away from `rotation`.

- [ ] **Step 1: Write failing tests:**
  - `hitTest round-trips`: for a grid of cameras (scale ∈ {1, 2.5, 6}, rotation ∈ {0, 1, −2.3, 40}) and each segment's (mid angle, mid radius) projected to the screen, `hitTest` returns that segment.
  - `hitTest returns null` in the hole (r < 0.12), beyond r = 1, and off-canvas.
  - `snapRotation lands exactly at a segment mid` (`normAngle(seg.mid + rotation) ≈ 0` within 1e-9), and `|Δrotation| ≤ half the segment width`.
  - `rotationToCenter picks the equivalent rotation nearest current` (current = 40 rad → result within π of 40).
  - `viewWindow is full in overview`.
  - `viewWindow in ring focus excludes segments on the far side` (inWindow false for a segment at π when the view shows only around 0).
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement. For `viewWindow`: if the wheel center is inside the viewport, `full = true` with `rMin = 0`. Otherwise compute the angles to the 4 viewport corners as seen from the center, take the smallest interval covering them, convert to wheel space, and set `rMin` / `rMax` from the nearest and farthest distance between the center and the rectangle (in R units).
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat(model): geometry, hit-testing and snapping`.

---

### Task 6: Store and URL state

**Files:**
- Create: `src/state/store.ts`, `src/state/url.ts`
- Test: `tests/unit/store.test.ts`, `tests/unit/url.test.ts`

**Interfaces:**
- Consumes: `Layout`, `ringNeighbor` (Task 4).
- Produces (`store.ts`):
  ```ts
  export type View = { mode: 'overview' } | { mode: 'ring'; ring: number };
  export interface State { selected: number | null; focused: number | null; view: View; interacted: boolean }
  export type Action =
    | { type: 'select'; segment: number }       // tap / Enter
    | { type: 'clear' }
    | { type: 'focus'; segment: number }        // tree focus / centered-word preview
    | { type: 'step'; delta: 1 | -1 }           // Up/Down
    | { type: 'toChild' } | { type: 'toParent' } // Right/Left
    | { type: 'setRing'; ring: number }         // swipe; camera settles then dispatches 'settled'
    | { type: 'settled'; segment: number }      // camera snapped in ring mode
    | { type: 'interact' }                      // first spin started
    | { type: 'zoomIn'; segment?: number } | { type: 'zoomOut' } | { type: 'escape' }
    | { type: 'restore'; state: State };
  export const initialState: State; // { selected: null, focused: null, view: { mode: 'overview' }, interacted: false }
  export function reduce(layout: Layout, s: State, a: Action): State; // returns the same object when nothing changes
  export interface Store { get(): State; dispatch(a: Action): void; subscribe(fn: (s: State, prev: State) => void): () => void }
  export function createStore(layout: Layout, initial?: State): Store;
  ```
- Produces (`url.ts`): `toHash(layout: Layout, s: State): string` (`''` for the initial state; otherwise `#/<wheelId>/<path>` plus `?ring=<n>` when in ring mode); `fromHash(layout: Layout, hash: string): State | null` (null for anything malformed or unknown; a valid path with an invalid ring gives the overview).

- [ ] **Step 1: Write failing store tests**, one per rule (spec §4.1, §4.3, §4.5):
  - `select in overview sets selected and focused`; `select same again clears`.
  - `select in ring mode sets interacted, moves view.ring to the segment's ring`.
  - `settled before interaction only moves focus`; `settled after interaction selects`.
  - `clear in ring mode resets interacted but keeps view and focus`.
  - `step in overview moves focus only, wrapping`; `step in ring mode selects the neighbor`.
  - `toChild from a leaf is a no-op`; `toChild in ring mode moves view.ring + 1`; `toParent from a core is a no-op`.
  - `zoomIn with segment selects it and uses its ring`; `zoomIn without one uses the selected ring, else 0`.
  - `escape in ring → overview with selection kept`; `escape in overview → clears`.
  - `reduce returns the same object for no-op actions`.
  - `subscribe fires with (state, prev) only on change`.
- [ ] **Step 2: Write failing URL tests:** round-trip for overview + selection and for ring + selection. Null for: `#/core/angry/nope`, `#/other/angry`, `#%%%`, `#/core/angry?ring=x` (→ overview, angry selected), and `?ring=9` (→ overview).
- [ ] **Step 3:** Run both → FAIL.
- [ ] **Step 4:** Implement both.
- [ ] **Step 5:** Run → PASS. Commit `feat(state): store transitions and URL hash`.

---

### Task 7: Camera controller

**Files:**
- Create: `src/camera.ts`
- Test: `tests/unit/camera.test.ts`

**Interfaces:**
- Consumes: `Camera`, `Viewport`, `snapRotation`, `normAngle` (Task 5); `Layout`.
- Produces:
  ```ts
  export interface CameraOpts { remPx: number; portrait: boolean }
  export function overviewCamera(vp: Viewport, rotation: number): Camera;
  export function ringFocusCamera(layout: Layout, ring: number, vp: Viewport, rotation: number, o: CameraOpts): Camera;
  export function shouldStartZoomed(layout: Layout, vp: Viewport): boolean;
  export function nearestRestingState(layout: Layout, cam: Camera, vp: Viewport, o: CameraOpts): { mode: 'overview' } | { mode: 'ring'; ring: number };
  export interface CameraController {
    readonly current: Camera;              // live, mutated in place; read each frame
    readonly moving: boolean;
    jump(c: Camera): void;                  // no animation
    animateTo(c: Partial<Camera>, velocity?: Partial<Camera>): void;
    fling(rotationVelocity: number, snapRing: number | null, layout: Layout): void; // projects rest = rotation + v·0.325, snaps, springs with v
    stop(): void;                           // freezes at current, cancels the loop
    onFrame(fn: () => void): void;          // called after each step
    onSettle(fn: () => void): void;         // called once when all channels rest
  }
  export function createCameraController(deps: { now(): number; raf(cb: FrameRequestCallback): number; caf(id: number): void; reducedMotion(): boolean }): CameraController;
  ```
  - **Resting cameras (§4.2):** `overviewCamera` uses `scale = 1` with the center at the middle of the viewport. `ringFocusCamera`:
    - `rMid = (inner + outer) / 2`
    - `typical` = median angular width of the ring's segments
    - `scale = (4.5 · remPx) / (typical · rMid · vp.radius)`, clamped so `(outer − inner) · vp.radius · scale ≤ 0.6 · vp.width`
    - `cx = (portrait ? 0.5 : 0.4) · vp.width − rMid · vp.radius · scale`
    - `cy = vp.height / 2`
  - **Spring:** per channel, semi-implicit Euler with dt capped at 1/30 s. Ω = 16. A channel is at rest when |x − target| < 1e-4 and |v| < 1e-3. Reduced motion: `animateTo` and `fling` jump straight to the target.
  - **Rotation:** normalized with `normAngle` on settle (keeping its target equivalence).

- [ ] **Step 1: Write failing tests** (a fake clock and fake raf that you step manually):
  - `ringFocusCamera puts ring mid-radius at 40% width (50% portrait)`.
  - `ringFocusCamera typical segment ≈ 4.5rem tall`, or that it is clamped by the 60% band rule on a narrow viewport.
  - `outer ring focus on a 375×667 viewport gives focused-ring segments ≥ 44px tall` (Global Constraints).
  - `shouldStartZoomed true for 375×667, false for 1440×900`.
  - `animateTo settles within 400ms simulated and calls onSettle once`.
  - `no raf is scheduled after settle` (the fake raf call count stops growing).
  - `fling lands exactly at a segment mid` (`normAngle(seg.mid + rot) ≈ 0`).
  - `stop() cancels and current stays where it was`.
  - `reducedMotion: animateTo jumps immediately, no raf`.
  - `rotation is normalized to [0, 2π) after settling from rotation 1000`.
  - `nearestRestingState picks overview below the midpoint scale, ring above`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run → PASS. Commit `feat(camera): spring camera, fling-to-snap, resting states`.

---

### Task 8: Colors and labels (pure parts)

**Files:**
- Create: `src/render/colors.ts`, `src/render/labels.ts`
- Modify: `src/styles/tokens.css` (tune hexes only if the contrast tests require it)
- Test: `tests/unit/colors.test.ts`, `tests/unit/labels.test.ts`

**Interfaces:**
- Produces (`colors.ts`):
  ```ts
  export interface Palette { bg: string; fg: string; gap: string; focus: string; hues: Record<string, string> }
  export function readPalette(el: Element): Palette;              // getComputedStyle; forced-colors → system colors
  export function contrast(a: string, b: string): number;         // WCAG ratio, hex inputs
  export function shade(hex: string, dL: number): string;         // OKLCH lightness shift, gamut-clamped, returns hex
  export function mix(a: string, b: string, t: number): string;   // sRGB lerp
  export interface FillTable { fill(hue: string, ring: number, lit: boolean): string; label(hue: string, ring: number, lit: boolean): string }
  export function buildFillTable(p: Palette, rings: number, theme: 'light' | 'dark', o?: { moreContrast: boolean }): FillTable; // precomputed strings; no allocation per call
  ```
  - **More contrast** (`prefers-contrast: more`): the faded fill becomes `mix(fill, bg, 0.55)` and the faded label is the lit label color unmixed. The renderer's gap width becomes 2.5 px.
  - **Ring shading:** light theme ring 0 = base, ring 1 = `shade(base, +0.06)`, ring 2 = `shade(base, +0.12)`. Dark theme: −0.05 and −0.10.
  - **Faded fill:** `mix(fill, bg, 0.75)`.
  - **Lit label:** whichever of `#ffffff` / `#111111` has the higher contrast against the fill.
  - **Faded label:** `mix(that label color, fadedFill, 0.4)`.
- Produces (`labels.ts`):
  ```ts
  export function labelRotation(screenAngle: number): number; // screenAngle, or + π when it falls in (π/2, 3π/2) after normalizing
  export type Measure = (text: string, px: number) => number;
  export function fitLabel(text: string, measure: Measure, box: { width: number; height: number }, size: { min: number; max: number }): { lines: string[]; px: number } | null;
  ```
  `fitLabel` tries one line at `min(max, 0.55 · box.height)`, then shrinks down to `min`. If it still doesn't fit, it tries 2 lines split at the space nearest the middle (needs `2 · 1.15 · px ≤ box.height`), shrinking down to `min`. Otherwise it returns `null`. It never truncates.

- [ ] **Step 1: Write failing tests:**
  - `contrast('#ffffff','#000000') ≈ 21`.
  - `moreContrast: faded label contrast ≥ 4.5 for every hue × ring × theme`.
  - `for both themes, every hue × ring: lit label ≥ 4.5 and faded label ≥ 3 against its fill` (`tests/unit/colors.test.ts` reads hexes from `tokens.css` with a regex, so CSS stays the single source of truth).
  - `labelRotation never yields an upside-down label` (sweep 0..2π in 1° steps: `cos(result)` ≥ 0 within 1e-9, except exactly at ±π/2).
  - `fitLabel` with a fake measure (`text.length · px · 0.6`): returns 1 line when it fits; wraps "Out of Control" to 2 lines in a narrow, tall box; returns null below min; at root 24 px (min 12 → 18 when scaled by rem/16) "Disillusioned" either fits or wraps and is never cut.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement. If the contrast tests fail, adjust the hue hexes in `tokens.css` (and the dark block) until they pass. Keep the hue family recognizable.
- [ ] **Step 4:** Run → PASS. Commit `feat(render): palette, contrast-checked ring shades, label fitting`.

---

### Task 9: Gestures and keyboard mapping

**Files:**
- Create: `src/input/gestures.ts`, `src/input/keyboard.ts`
- Test: `tests/unit/gestures.test.ts`, `tests/unit/keyboard.test.ts`

**Interfaces:**
- Produces (`gestures.ts`):
  ```ts
  export type GestureInput =
    | { kind: 'down' | 'move' | 'up' | 'cancel'; id: number; x: number; y: number; t: number }
    | { kind: 'wheel'; dx: number; dy: number; ctrl: boolean; x: number; y: number; t: number }
    | { kind: 'gesture'; phase: 'start' | 'change' | 'end'; scale: number; x: number; y: number; t: number }; // Safari
  export type Intent =
    | { type: 'tap' | 'doubleTap'; x: number; y: number }
    | { type: 'dragStart'; x: number; y: number; axis: 'x' | 'y' }
    | { type: 'drag'; x: number; y: number; dx: number; dy: number }
    | { type: 'dragEnd'; vx: number; vy: number }              // px/s from the last 100 ms of samples
    | { type: 'swipe'; dir: 'left' | 'right' }
    | { type: 'pinch'; scale: number; cx: number; cy: number }  // scale relative to the pinch start
    | { type: 'pinchEnd' }
    | { type: 'scroll'; dy: number } | { type: 'scrollEnd' }
    | { type: 'zoomWheel'; factor: number; cx: number; cy: number };
  export function createGestureRecognizer(timers: { set(fn: () => void, ms: number): number; clear(id: number): void }): { handle(e: GestureInput): Intent[] };
  export function attachGestures(el: HTMLElement, onIntents: (i: Intent[]) => void): () => void; // pointer/wheel/gesture listeners, setPointerCapture, preventDefault on wheel+gesture; returns detach
  ```
  - **Axis lock** happens at the first 8 px of movement.
  - **Swipe** is emitted on `up` instead of `dragEnd` when the axis is `x` and the thresholds in Global Constraints are met.
  - **A second pointer** ends any drag (emits `dragEnd` with v = 0) and starts a pinch.
  - **`cancel`** ends any active pinch or drag (`pinchEnd` / `dragEnd` with v = 0) and resets.
  - **Ctrl + wheel** → `zoomWheel` with `factor = exp(−dy · 0.01)`. Plain wheel → `scroll`, then `scrollEnd` after 150 ms idle.
  - **Double-tap:** the second tap emits `doubleTap` *instead of* `tap`.
- Produces (`keyboard.ts`): `keyToAction(key: string): Action | { type: 'zoomToggle' } | null`. Mapping: ArrowUp → step −1, ArrowDown → step +1, ArrowRight → toChild, ArrowLeft → toParent, Escape → escape, `+`/`=` → zoomToggle, `-` → zoomOut. Enter and Space are handled by the tree (they need the focused index).

- [ ] **Step 1: Write failing tests** (fake timers):
  - `tap: down/up within 5px and 200ms → [tap]`; `long press 400ms → no tap`.
  - `double tap within 300ms and 24px → [tap], then [doubleTap]`.
  - `vertical drag → dragStart axis y, drags, dragEnd with vy > 0`.
  - `horizontal 60px quick move → swipe left/right, no dragEnd`.
  - `second pointer mid-drag → dragEnd(v=0) then pinch with scale = distance ratio`.
  - `cancel mid-pinch → pinchEnd, and a following single-pointer move emits nothing`.
  - `ctrl wheel → zoomWheel`; `plain wheel → scroll …, scrollEnd after 150ms idle`.
  - `Safari gesture start/change/end → pinch/pinchEnd`.
  - `keyToAction` table test.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement. `attachGestures` is thin DOM glue and is covered by e2e in Task 14.
- [ ] **Step 4:** Run → PASS. Commit `feat(input): gesture recognizer and key mapping`.

---

### Task 10: Canvas renderer

**Files:**
- Create: `src/render/wheel.ts`
- Test: `tests/unit/wheel-render.test.ts` (a recording fake 2D context)

**Interfaces:**
- Consumes: `Layout`, `Camera`, `Viewport`, `viewWindow`, `inWindow` (Task 5); `FillTable`, `fitLabel`, `labelRotation` (Task 8); `label()` (Task 2).
- Produces:
  ```ts
  export interface Frame {
    cam: Camera; vp: Viewport;
    lit: Uint8Array; prevLit: Uint8Array; fadeT: number; // 0..1 cross-fade progress
    focused: number | null; showFocus: boolean;
    mode: 'overview' | 'ring'; remPx: number;
  }
  export interface WheelRenderer {
    resize(cssW: number, cssH: number, dpr: number): void; // sets canvas.width/height = round(css·dpr), never larger
    setColors(t: FillTable, p: Palette): void;
    draw(f: Frame): void;
    stats: { segmentsDrawn: number; labelsDrawn: number };  // for tests/perf
  }
  export function createWheelRenderer(canvas: HTMLCanvasElement, layout: Layout, ctx?: CanvasRenderingContext2D): WheelRenderer;
  ```
  - **Segment drawing:** each segment is an annular sector (`arc` outer, `arc` inner reversed, `closePath`), then fill. Gaps are drawn as strokes in `palette.gap` at a constant 1.5 CSS px (`lineWidth = 1.5 / scale` after the transform).
  - **Labels:** sizes are `{ min: 8, max: 16 }` in overview and `{ min: 12, max: 1.5·remPx }` for the focused ring in ring mode, both scaled by `remPx / 16`. The label box is the segment's radial band width × arc height at mid-radius, in screen px. Text measurements are cached in a `Map` keyed by `label|px`.
  - **Focus outline:** a 2 px `palette.focus` outline around `focused` when `showFocus`.
  - **Allocation:** no arrays or closures are created per segment per frame.

- [ ] **Step 1: Write failing tests:**
  - `overview draws all 130 segments`.
  - `ring focus on the outer ring at 375×667 draws fewer than 40 segments` (culling).
  - `canvas.width === round(cssW·dpr)` after resize.
  - `labels never drawn below 8px in overview` (fake measure; with a tiny viewport, `labelsDrawn` < 130).
  - `faded fill used for unlit segments` (the recorded `fillStyle` for an unlit segment equals `table.fill(h, r, false)` when `fadeT = 1`).
  - `focus outline only when showFocus`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement. During a cross-fade, an unlit/lit pair is drawn as the lit fill with `globalAlpha` blending of the faded fill. Use `prevLit` / `lit` / `fadeT`; no per-frame color strings.
- [ ] **Step 4:** Run → PASS. Commit `feat(render): culled canvas wheel renderer`.

---

### Task 11: Accessible tree and announcer

**Files:**
- Create: `src/a11y/tree.ts`, `src/a11y/announce.ts`
- Test: `tests/unit/a11y.test.ts` (`@vitest-environment happy-dom`)

**Interfaces:**
- Consumes: `Layout`, `State`, `Action`, `keyToAction` (Tasks 4, 6, 9); `label`, `t` (Task 2).
- Produces:
  ```ts
  export interface A11yTree { update(s: State): void; hasFocus(): boolean; onFocusChange(fn: (focused: boolean) => void): void }
  export function createA11yTree(root: HTMLElement, layout: Layout, dispatch: (a: Action | { type: 'zoomToggle' }) => void): A11yTree;
  export function describe(layout: Layout, i: number): string; // t('inPath', { label, path: 'Angry, Aggressive' }) → "Hostile. In Angry, Aggressive."
  export function createAnnouncer(el: HTMLElement): (text: string) => void; // clears then sets textContent on next frame so repeats are re-announced
  ```
  - **Structure:** `root` gets `role="tree"` and `aria-label=t('wheelLabel')`. Nested `<ul role="group">` contain `<li role="treeitem" id="fw-node-<index>" aria-level aria-selected aria-expanded(non-leaves)>`.
  - **Tab stop:** roving `tabindex`. 0 goes on `state.focused`, otherwise on the first core.
  - **Expansion:** `aria-expanded` is true on the ancestors of `focused` and `selected`.
  - **Keys:** keydown on `root` → Enter/Space dispatches `select(focused)`, and other keys go through `keyToAction`. Focus moves to the new treeitem after each update.

- [ ] **Step 1: Write failing tests:**
  - `renders 130 treeitems with correct aria-level`.
  - `exactly one tabindex=0`.
  - `ArrowDown dispatches step +1`.
  - `Enter dispatches select of focused`.
  - `update moves DOM focus to the focused item when tree has focus`.
  - `aria-selected only on selected`.
  - `describe(hostile) === "Hostile. In Angry, Aggressive."`.
  - `announcer re-announces identical text`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement. Add the visually-hidden styling (from `app.css`) to `root`.
- [ ] **Step 4:** Run → PASS. Commit `feat(a11y): accessible wheel tree and live announcer`.

---

### Task 12: Panel, path chips, toolbar, theme

**Files:**
- Create: `src/ui/panel.ts`, `src/ui/toolbar.ts`, `src/ui/theme.ts`
- Test: `tests/unit/panel.test.ts`, `tests/unit/theme.test.ts` (happy-dom)

**Interfaces:**
- Consumes: `Layout`, `siblings`, `State`, `Action`, `FeelingsDict`, `t`, `label`, `definition`, `sensationLabel`.
- Produces (`panel.ts`):
  ```ts
  export type PanelModel =
    | { kind: 'empty'; prompt: string }
    | { kind: 'feeling'; index: number; title: string; definition: string; sensations: string[];
        path: { index: number; label: string; hue: string }[];   // root → selected, inclusive
        children: { index: number; label: string }[];             // "Narrow it down"; empty for leaves
        closeTo: { index: number; label: string }[] };            // siblings; only for leaves, else []
  export function panelModel(layout: Layout, feelings: FeelingsDict, s: State): PanelModel;
  // <fw-panel>: set .model, emits 'fw-action' CustomEvent<Action> (select from chips/buttons, clear from ✕)
  // <fw-path>: set .model, renders path chips only, same event
  ```
- Produces (`theme.ts`): `type ThemePref = 'system' | 'light' | 'dark'`; `readPref(storage: Storage | null): ThemePref`; `writePref(storage: Storage | null, p: ThemePref): void`; `applyPref(p: ThemePref, root: HTMLElement): void` (sets or removes `data-theme`); `resolvedTheme(p: ThemePref, mql: { matches: boolean }): 'light' | 'dark'`; `safeStorage(): Storage | null` (returns null if accessing `localStorage` throws).
- Produces (`toolbar.ts`): `<fw-toolbar>` with a zoom toggle button (`aria-pressed` reflects ring mode; label `t('zoomIn')` / `t('zoomOut')`) and a theme `<select>` (System / Light / Dark). It emits `fw-action` (`{type:'zoomToggle'}`) and `fw-theme` (`CustomEvent<ThemePref>`).

- [ ] **Step 1: Write failing tests:**
  - `panelModel(null selection) → empty with t('prompt')`.
  - `angry → children are its 8 middles, closeTo empty`.
  - `hostile → children empty, closeTo [provoked], path angry→aggressive→hostile`.
  - `chip click emits select of that ancestor`.
  - `✕ emits clear`.
  - `readPref with throwing storage → 'system'`.
  - `readPref with garbage value → 'system'`.
  - `writePref with throwing storage does not throw`.
  - `applyPref('system') removes data-theme`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement. Section headings use `t('narrowDown')`, `t('youMightNotice')` and `t('closeTo')`; buttons are real `<button>`s.
- [ ] **Step 4:** Run → PASS. Commit `feat(ui): panel, path chips, toolbar, theme preference`.

---

### Task 13: Controller (input → camera → store glue)

**Files:**
- Create: `src/controller.ts`
- Test: `tests/unit/controller.test.ts` (fake renderer, fake raf, real store, camera, recognizer outputs)

**Interfaces:**
- Consumes: everything from Tasks 4–9.
- Produces:
  ```ts
  export interface Controller {
    handle(intents: Intent[]): void;
    setViewport(vp: Viewport, o: CameraOpts): void; // re-targets the current resting state, keeps the centered segment
    camera: CameraController;
  }
  export function createController(layout: Layout, store: Store, camera: CameraController, getVp: () => Viewport, getOpts: () => CameraOpts): Controller;
  ```
  Rules (from spec §4.2–4.4):
  - **`tap`:** `camera.stop()`, then `hitTest` against the *live* `camera.current`. Null → `clear`; otherwise `select`. In ring mode, after `select`, `animateTo` the `rotationToCenter` of that segment.
  - **`doubleTap`:** overview + hit → `zoomIn{segment}`; ring mode → `zoomOut`.
  - **`dragStart`:** `camera.stop()`. In ring mode, dispatch `interact`.
  - **`drag`:** in overview, rotate by the change in `atan2` around (cx, cy). In ring mode with axis y, `rotation += dy / (rMid · R · scale)`. Apply with `camera.jump`.
  - **`dragEnd`:** angular velocity → `camera.fling(v, snapRing)`. `snapRing` is the focused ring in ring mode, the selected segment's ring in overview, or null (no snap) when nothing is selected.
  - **`swipe`:** in ring mode, `setRing(ring ± 1)` clamped (left = inward).
  - **`pinch` / `zoomWheel`:** `camera.jump` with scale about the pinch point, clamped to [0.8, max ring scale × 1.2]. **`pinchEnd`:** `nearestRestingState`, then `zoomIn` / `zoomOut` accordingly.
  - **`scroll`:** in ring mode dispatch `interact` once, then rotate by `dy / (rMid · R · scale)`. **`scrollEnd`:** fling(0).
  - **Store subscription:** when `view` changes, `animateTo` the matching resting camera (keeping rotation). In ring mode, when `selected` or `focused` changes from the keyboard, `animateTo(rotationToCenter)`.
  - **Camera `onSettle` in ring mode:** dispatch `settled(segmentAt(ring, normAngle(−rotation)))`.

- [ ] **Step 1: Write failing tests:**
  - `tap on hostile in overview selects it, no rotation change`.
  - `tap in ring mode selects and rotation settles with hostile at angle 0`.
  - `tap during fling stops motion and selects the segment under the finger at the live camera` (Review Focus 3).
  - `drag then dragEnd in ring mode → settles exactly on a segment mid and store.selected equals it` (after interact).
  - `swipe left from ring 2 → view.ring 1, settled selects the segment at angle 0`.
  - `pinchEnd past the midpoint → ring mode`.
  - `setViewport while zoomed keeps the same segment centered at angle 0` (Review Focus 1).
  - `ArrowDown in ring mode rotates to the next segment`.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run → PASS. Commit `feat: controller tying gestures, camera and store`.

---

### Task 14: App wiring, layout, first load, URL, e2e

**Files:**
- Create: `src/main.ts` (replace the placeholder), `tests/e2e/wheel.spec.ts`
- Modify: `src/styles/app.css`, `index.html`

**Interfaces:**
- Consumes: everything above.
- `main.ts` wires:
  1. `loadData` + `setLocale` + `buildLayout`.
  2. Store, initialized from `fromHash(location.hash)` or `initialState`.
  3. Camera controller (real raf; `matchMedia('(prefers-reduced-motion: reduce)')`).
  4. Renderer.
  5. `ResizeObserver` on the canvas container → `renderer.resize` + `controller.setViewport`. `vp.radius = min(w, h)/2 − 8`; `portrait = w < 720 || h > w`; `remPx` = computed root font size.
  6. `attachGestures`.
  7. A11y tree + announcer: announce `describe(selected)` on `settled` / `select`.
  8. Panel, path and toolbar (`fw-action` → dispatch, `zoomToggle` → `zoomIn` / `zoomOut`).
  9. Theme: apply the preference; on preference or `prefers-color-scheme` change → `readPalette` + `buildFillTable` + redraw.
  10. URL: `history.pushState(toHash)` on selection or view change (a spin pushes only on settle, because selection only changes on settle); `popstate` → `restore`.
  11. Rendering: draw only from `camera.onFrame`, store changes and a 150 ms fade tween; one draw per raf at most. With reduced motion, `fadeT` = 1 immediately. Watch `prefers-contrast: more` and pass it to `buildFillTable`.
  12. Panel placement (§6.1): in the wide overview, if the selected segment's screen midpoint is in the bottom-right quadrant, set `#app[data-panel-side="left"]` so the card floats bottom-left instead.
  13. First load (§4.6): no hash and `shouldStartZoomed` → ring 0. If `fw.seenIntro` is unset and reduced motion is off, jump to `overviewCamera`, then `animateTo` the ring-0 camera with rotation offset +1.5 × the median core width, and set `fw.seenIntro`.
  14. `showFocus` = the tree has focus, or (ring mode and not interacted).
  15. When `import.meta.env.MODE === 'test'`, expose `window.__fw = { segmentScreenPoint(path): {x, y}, state(): State, camera(): Camera }` for e2e.
- `app.css` (§6.1): container queries on `#app`. Narrow: `fw-path` on top, canvas, `fw-panel` as a bottom sheet (`position: fixed; bottom: 0; max-height: 40dvh; overflow: auto`). Wide: canvas fills the area and `fw-panel` floats at the bottom right; in ring mode (`#app[data-mode="ring"]`) the panel is a right column at 40% width. Use `dvh` units and `env(safe-area-inset-*)` padding.

- [ ] **Step 1: Write failing e2e tests** in `tests/e2e/wheel.spec.ts` (all projects):
  - `tap Angry lights Angry subtree`: click `__fw.segmentScreenPoint('angry')`, then the panel heading is "Angry" and it has 8 "Narrow it down" buttons.
  - `narrow down via panel to Hostile` and `chip steps back to Aggressive`.
  - `clear via ✕, Escape, tap outside, tap selected again`.
  - `phone viewport first load is ring mode on ring 0, nothing selected, prompt visible` (Pixel 7 / iPhone 15 projects).
  - `keyboard only: Tab into tree, ArrowDown ×2, ArrowRight, Enter → panel shows a middle word`.
  - `back/forward restores selection`.
  - `resize while zoomed keeps centered segment flat` (`camera().rotation` + seg.mid ≡ 0).
  - `tap while spinning selects under finger` (Review Focus 3).
  - `axe: zero violations in overview and ring mode` (via `@axe-core/playwright`).
  - `wide overview: selecting a bottom-right segment moves the card to the left`.
  - `reduced motion: no intro animation` (`page.emulateMedia({ reducedMotion: 'reduce' })`; the camera is at rest right after load).
- [ ] **Step 2:** `npm run test:e2e` → FAIL.
- [ ] **Step 3:** Implement the wiring and CSS.
- [ ] **Step 4:** `npm run test:e2e` → PASS on all projects; `npm test` still passes.
- [ ] **Step 5:** Manual check with `npm run dev`: pinch on a trackpad, flick-spin, theme switch, light/dark. Commit `feat: wire up app shell, first load, URL state`.

---

### Task 15: Offline install (PWA)

**Files:**
- Create: `public/manifest.webmanifest`, `public/icons/icon.svg`, `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon.png`, `src/sw/sw.ts`, `build/sw-plugin.ts`, `scripts/make-icons.mjs`
- Modify: `vite.config.ts`, `index.html` (manifest link, theme-color metas for light and dark, apple-touch-icon), `src/main.ts` (register the service worker in production and test modes)
- Test: `tests/e2e/offline.spec.ts`

**Interfaces:**
- `build/sw-plugin.ts`: `export function swPlugin(): Plugin`. It compiles `src/sw/sw.ts` as an extra Rollup input emitted as `sw.js` at the root (unhashed). In `generateBundle` it replaces the literal `self.__PRECACHE__` with a JSON array of every emitted file plus `/`, `index.html`, the manifest and icons, and `self.__VERSION__` with a hash of that list.
- `sw.ts` behavior (§6.5):
  - **install:** `caches.open('fw-' + VERSION).addAll(PRECACHE)`.
  - **activate:** delete `fw-*` caches that aren't the current one.
  - **fetch:** navigation requests → serve the cached `index.html` while fetching a fresh copy in the background; requests for hashed `/assets/*` → cache first. No `skipWaiting` (updates apply on the next launch).
- Icons: `scripts/make-icons.mjs` renders `icon.svg` to PNG with Playwright's Chromium (`page.screenshot`), so no new dependency. Run it once and commit the PNGs.
- Manifest: `name` "Feelings Wheel", `short_name` "Feelings", `display: standalone`, `start_url: "./"`, `background_color` / `theme_color` from the light `--bg`, plus the icons, with `purpose: "maskable"` on the maskable one.

- [ ] **Step 1: Write the failing e2e test** `offline reload works`: load, wait for `navigator.serviceWorker.ready`, `context.setOffline(true)`, reload, and the tree has 130 treeitems.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement the plugin, service worker, manifest and icons.
- [ ] **Step 4:** Run → PASS (Chromium and Firefox; WebKit service-worker support in Playwright is limited, so mark that project `test.skip` for this file with a comment). `npm run build` → `dist/sw.js` contains no `__PRECACHE__` placeholder.
- [ ] **Step 5:** Commit `feat(pwa): manifest, icons, offline service worker`.

---

### Task 16: Budgets and performance verification

**Files:**
- Create: `scripts/check-size.mjs`, `tests/perf/spin.spec.ts`
- Modify: `package.json` (the `size` script; `"test:perf": "playwright test tests/perf"`)

**Interfaces:**
- `check-size.mjs`: gzips (zlib, level 9) every file in `dist/`. It fails (exit 1) when JS excluding the `data-*` chunk is > 25 KB, or when `index.html` + CSS + all JS is > 60 KB. It prints a table either way.
- `spin.spec.ts` (Chromium project only):
  - Zoom to ring 2.
  - Run 60 s of scripted vertical drags and flings with `page.mouse`.
  - Record raf frame deltas with an injected `requestAnimationFrame` probe.
  - Sample `performance.memory.usedJSHeapSize` every 5 s, with `--js-flags=--expose-gc` and `gc()` called before each sample.

- [ ] **Step 1: Write the perf tests:**
  - `p95 frame delta ≤ 16.7ms during spin`.
  - `heap after 60s ≤ heap at 5s × 1.1`.
  - `no raf callbacks for 2s after settle` (idle CPU).
  - `canvas.width ≤ innerWidth·dpr at max zoom`.
- [ ] **Step 2:** `npm run build && npm run size` and `npm run test:perf`. Fix anything over budget (likely culprits: per-frame allocation in the renderer, uncached text measurement).
- [ ] **Step 3: Manual Firefox check** (Lucas's machine): open the build in Firefox, then spin and pinch for 10 minutes while watching `about:memory` and Activity Monitor. Memory should stay flat and the machine shouldn't heat up. Record the result in the commit message.
- [ ] **Step 4:** Run every check: `npm test && npm run build && npm run size && npm run test:e2e && npm run test:perf`, all PASS.
- [ ] **Step 5:** Commit `test: size budgets and performance checks`.

---

## Spec coverage

| Spec § | Task |
|---|---|
| 2 decisions, 11 housekeeping | 1 |
| 3.1–3.3 data model, i18n | 2 |
| 3.4 content guidelines + review | 3 |
| 3.5 colors | 1 (tokens), 8 |
| 4.1 selection | 4 (lit mask), 6, 10 (fade), 12 (clear ✕), 13, 14 |
| 4.2 camera | 7, 13 |
| 4.3 rotation and snapping | 5, 7, 13 |
| 4.4 zoom inputs | 9, 13 |
| 4.5 keyboard | 9, 11, 13 |
| 4.6 first load | 7 (`shouldStartZoomed`), 14 |
| 5.1–5.4 rendering | 4, 5, 8, 10 |
| 6.1–6.4 shell, panel, URL, theme | 6, 12, 14 |
| 6.5 PWA | 15 |
| 6.6 browsers | 1 (Playwright projects), 14 |
| 7 architecture | file map |
| 8 accessibility | 8, 11, 14 (axe) |
| 9 budgets | 7 (idle), 10 (bitmap cap), 16 |
| 10 testing | every task |
| 12 acceptance | 14–16 + Task 3 human gate |
