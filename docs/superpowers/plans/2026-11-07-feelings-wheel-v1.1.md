# Feelings Wheel v1.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace v1's independent select and zoom with two explicit states, **selected** and **opened**. Make every zoom gesture land on a predictable word. Restyle the wheel to white-on-deep with a lifted, outlined selection, and replace the panel with a floating accordion card plus a hint.

**Architecture:** Same layers as v1. The pure parts get their v1.1 semantics first, each with unit tests:
- `store.ts`: the new `State` and reducer
- `url.ts` / `history.ts`: URL and history rules
- `model/pinch.ts`: pinch resolution
- `colors.ts`: palette B

Then the stateful parts:
- `controller.ts`, `camera.ts`
- `render/wheel.ts`
- the `ui/` elements

`main.ts` rewires everything, and the e2e tests are rewritten around select, open, close and clear.

**Tech Stack:** unchanged from v1: Vite 8.3.6, TypeScript 7.0.2, Vitest 5.1.0 with happy-dom 21.0.4, Playwright 1.65.0 with @axe-core/playwright 4.14.0.

**Spec:** `docs/superpowers/specs/2026-11-07-feelings-wheel-v1.1-design.md` (v1.1), on top of `docs/superpowers/specs/2026-11-06-feelings-wheel-v1-design.md` (v1). Read §3–§8 of v1.1 before starting.

## Global Constraints

- Everything in the v1 plan's Global Constraints still holds: no runtime dependencies, no framework or shadow DOM, all strings through `t()`, no network requests, the budgets (app JS ≤ 25 KB gzipped, first load ≤ 60 KB gzipped), WCAG 2.2 AA, storage access always wrapped in try/catch, reduced motion honoured, and commits straight to `main` with no `Co-Authored-By` or AI trailer.
- **View mode names:** `{ mode: 'wheel' } | { mode: 'ring'; ring: number }`. v1's `'overview'` is renamed to `'wheel'` everywhere.
- **Pinch thresholds**, as the ratio of release scale to the scale at gesture start: `PINCH_IN = 1.15`, `PINCH_STEP_OUT = 0.87`, `PINCH_CLOSE = 0.6`.
- **Palette B:**
  - Lit fills: darken each base until white text reaches ≥ 4.8:1 (`fitWhite`), then shift per ring in OKLab L: core −0.07, middle −0.035, outer 0.
  - Faded fills: `mix(lit, grey, 0.72)`, with grey `#8d8a93` (light) or `#3a383e` (dark). Faded labels: `mix('#ffffff', faded, 0.2)`, at ≥ 3:1.
  - More contrast: faded labels are `#ffffff` (≥ 4.5:1).
  - Happy's base stays `#D9730D`.
- **Selection drawing:**
  - Outline: 4 px in the outline colour with a 2 px gap-coloured line inside. The outline colour is `#1c1b1f` light, `#ffffff` dark, `Highlight` in forced colours.
  - Chevron: white inside the cell's outer end when its outer arc is ≥ 22 px, otherwise just outside its outer edge in the outline colour.
  - Lift: 10 px past the ring's inner and outer edges, about 2 px past each side, one `shadowBlur: 12` / `rgba(0,0,0,.35)` / `shadowOffsetY: 3` shadow, and a 1.15× label at weight 800.
  - Pulse: scale 0.96 → 1 over 180 ms on open.
- **Phone start:** a uniformly random core word, selected (not opened), in `ring(0)` view, with the hint text `hintSpin`. The spin plays on every base-URL load (none with reduced motion), and the URL stays the base URL.
- **History:** only opened states have a hash (`#/core/<path>`). Opening pushes, a settle-while-opened replaces, closing pushes the base URL, and restore writes nothing.
- **Layout:**
  - Desktop reserves a right column of `min(24rem, 34vw)` that the stage never shares.
  - On phones the card is capped at `45dvh`, and the ring-view camera's vertical anchor is `0.275 × stage height`.
  - The card and hint never change the stage's size.
- **New locale strings:** `hintSpin` "Spin to explore.", `hintChoose` "How are you feeling? Tap a feeling.", `wholeWheel` "Whole wheel", `opened` "{label}, opened. In {path}.", `openedCore` "{label}, opened.", `closed` "{label}, closed.".
- **Removed:**
  - locale strings `prompt`, `zoomIn`, `zoomOut`, `close`
  - the storage key `fw.seenIntro`
  - `data-panel-side`
  - `<fw-panel>` and `<fw-path>`
  - store fields `focused` and `interacted`

## Review Focus

1. **Double-tap on a word that isn't selected** must open it directly. It must not select on the first tap and then do something else on the second. Test in Task 4.
2. **A pinch released over the centre hole, or outside the wheel, with nothing selected** must change nothing and spring back. Test in Task 3.
3. **Going "down a tier" from an opened leaf** (Right, swipe outward, pinch in on itself) must leave it opened and unchanged, with no error. Test in Tasks 2 and 3.
4. **Back or Forward during a fling or the phone intro spin:** the restored state wins. A late `settled` from the interrupted animation must not overwrite it. Test in Task 4.
5. **Rotating a phone to landscape (portrait → wide) while in the phone-start selected ring view** keeps the same word selected and centred, and does not open it. Test in Task 5.

---

## File Map

| File | Change | Task |
|---|---|---|
| `src/render/colors.ts`, `src/styles/tokens.css` | Palette B, `outline` token, forced-colours outline | 1 |
| `src/state/store.ts`, `src/input/keyboard.ts` | New State and actions; key map | 2 |
| `src/state/url.ts`, `src/state/history.ts` | Hash = opened only; `startState`; `historyOp` | 2 |
| `src/model/pinch.ts` (new) | `resolvePinch` | 3 |
| `src/controller.ts` | Rewritten interaction rules | 4 |
| `src/camera.ts` | `anchorY`, `target` | 5 |
| `src/render/wheel.ts` | Outline, chevron, lift, pulse, fading only when opened, pinch label reuse | 6 |
| `src/ui/card.ts`, `src/ui/hint.ts` (new), `src/ui/toolbar.ts`; delete `src/ui/panel.ts` | Accordion card, hint, Whole-wheel button | 7 |
| `src/a11y/tree.ts`, `src/main.ts`, `src/styles/app.css`, `index.html`, `src/data/locales/en.json`, `tests/e2e/*` | Wiring, layout, a11y, e2e | 8 |
| `tests/perf/firefox.spec.ts` (new), `playwright.config.ts`, `src/render/sprites.ts` (only if needed) | Firefox gate; optional sprite cache | 9 |

---

### Task 1: Palette B, one text colour

**Files:** Modify `src/render/colors.ts`, `src/styles/tokens.css`. Test: `tests/unit/colors.test.ts` (rewrite the contrast tests).

**Interfaces:**
- Produces:
  ```ts
  export interface Palette { bg; fg; gap; focus; outline: string; hues: Record<string,string>; forced?: boolean }
  export function fitWhite(base: string, min?: number /* default 4.8 */): string; // darken in 0.004 OKLab-L steps until contrast('#ffffff', x) ≥ min
  export function buildFillTable(p: Palette, rings: number, theme: 'light'|'dark', o?: { moreContrast: boolean }): FillTable;
  ```
- `FillTable` is unchanged: `fill(hue, ring, lit)` / `label(hue, ring, lit)`.
- `readPalette` reads the new `--outline` token. In forced colours, `outline` is `'Highlight'`.
- `bestText` is deleted.
- `tokens.css` adds `--outline: #1c1b1f` (light) and `#ffffff` (both dark blocks). The hue values are unchanged.

- [ ] **Step 1: Rewrite the floor tests in `colors.test.ts`.** For both themes, every hue × ring:
  - `label(h, r, true) === '#ffffff'` and contrast ≥ 4.5
  - faded label contrast ≥ 3
  - with `moreContrast`, `label(h, r, false) === '#ffffff'` and contrast ≥ 4.5

  Also add:
  - `fitWhite('#D9730D')` contrast with white is ≥ 4.8 and < 5.2, so it's darkened just enough
  - `ring 0 fill is darker than ring 2 fill` (lower luminance)
  - `forced palette: fill 'Canvas', label 'CanvasText'/'GrayText'`

  Keep the existing math tests (`contrast`, `mix`, `shade`, 3-digit hex).
- [ ] **Step 2:** `npx vitest run tests/unit/colors.test.ts` → FAIL (`label` isn't always white yet; `fitWhite` doesn't exist).
- [ ] **Step 3:** Implement per Global Constraints → Palette B. Add `--outline` to `tokens.css` and `readPalette`.
- [ ] **Step 4:** Run → PASS. `npm test` → the rest of the suite still passes; `wheel-render.test.ts` uses `table.label`, so update any hard-coded colour expectation there.
- [ ] **Step 5:** Commit `feat(colors): white text on deep colours (palette B)`.

---

### Task 2: State model, keys, URL and history

**Files:** Rewrite `src/state/store.ts`. Modify `src/input/keyboard.ts`, `src/state/url.ts`, `src/state/history.ts`. Tests: rewrite `tests/unit/store.test.ts`, `tests/unit/url.test.ts`, `tests/unit/history.test.ts`, `tests/unit/keyboard.test.ts`.

**Interfaces:**
- Produces (`store.ts`):
  ```ts
  export type View = { mode: 'wheel' } | { mode: 'ring'; ring: number };
  export interface State { selected: number | null; opened: boolean; view: View; hinted: boolean }
  export type Action =
    | { type: 'select'; segment: number }   // tap: opens instead when already opened, or when segment === selected
    | { type: 'open'; segment: number }
    | { type: 'close' } | { type: 'clear' }
    | { type: 'step'; delta: 1 | -1 } | { type: 'toChild' } | { type: 'toParent' }
    | { type: 'activate' }                   // Enter / Space / '+'
    | { type: 'escape' }
    | { type: 'settled'; segment: number }   // camera came to rest in a ring view
    | { type: 'dismissHint' }
    | { type: 'restore'; state: State };
  export const initialState: State; // { selected: null, opened: false, view: { mode: 'wheel' }, hinted: true }
  export function reduce(layout, s, a): State;            // identity for no-ops; enforces §3.1 invariants
  export interface Store { get(); dispatch(a); subscribe(fn: (s: State, prev: State, a: Action) => void): () => void }
  export function centerChild(layout: Layout, i: number): number | null; // child whose [start,end) contains segments[i].mid; null for leaves
  ```
- **Reducer rules** (§3.3, §3.5). Every action except `restore` and `settled` sets `hinted: false`.
  - `open(i)` → `{ selected: i, opened: true, view: ring(seg.ring) }`.
  - `select(i)`: if opened → `open(i)`. If `i === selected` → `open(i)`. Otherwise `selected = i` and `opened = false`, with the view unchanged.
  - `close`: only when opened → `{ opened: false, view: wheel }`, selection kept.
  - `clear`: `{ selected: null, opened: false, view: wheel }`.
  - `step(d)`: nothing → select the first core (`rings[0].segments[0]`); selected → select `ringNeighbor`; opened → open `ringNeighbor`.
  - `toChild`: selected → select the first child; opened → open `centerChild`; a leaf is a no-op.
  - `toParent`: selected → select the parent (no-op at the core); opened → open the parent, or `close` at the core.
  - `activate`: nothing → select the first core; selected → open; opened → no-op.
  - `escape`: opened → `close`; selected → `clear`.
  - `settled(i)`: opened → open `i` if it's in the opened ring; selected in a ring view → select `i`; otherwise no-op.
- Produces (`keyboard.ts`): `keyToAction(key: string): Action | null`:
  - ArrowUp → step −1; ArrowDown → step +1
  - ArrowRight → toChild; ArrowLeft → toParent
  - Enter, ' ', '+', '=' → activate
  - '-' → toParent
  - Escape → escape

  `KeyAction` / `zoomToggle` are removed.
- Produces (`url.ts`):
  - `toHash(layout, s)`: `'#/core/<path>'` when `s.opened`, else `''`.
  - `fromHash(layout, hash)`: a valid path → `{ selected, opened: true, view: ring(seg.ring), hinted: false }`; anything else → `null`. Any `?ring=` query is ignored.
- Produces (`history.ts`):
  - `startState(layout, vp, random: () => number): State`: phone (`shouldStartZoomed`) → `{ selected: rings[0].segments[floor(random()*7)], opened: false, view: ring(0), hinted: true }`; otherwise `initialState`. Replaces `defaultState`.
  - `historyOp(prev: State, next: State, a: Action): 'push' | 'replace' | 'none'`:
    - `'none'` when the hashes are equal or `a.type === 'restore'`
    - `'replace'` when `a.type === 'settled' && prev.opened && next.opened`
    - otherwise `'push'`
  - `createHistoryWriter(h, now, coalesceMs?)` is unchanged (`(url) => void` that pushes). Add `replace(url)`: `createHistoryWriter` now returns `{ push(url): void; replace(url): void }`, with the same coalescing and try/catch on `push`.

- [ ] **Step 1: Rewrite `store.test.ts`** with one test per rule above, named after the rule. Include:
  - `select same word opens it`
  - `select while opened opens the new word in its ring`
  - `close keeps the selection and returns to wheel`
  - `escape closes then clears`
  - `step with nothing selected selects the first core`
  - `toChild on an opened leaf is a no-op (same object)` (Review Focus 3)
  - `toParent on an opened core closes`
  - `centerChild(angry/aggressive) is hostile` (the second child: its start equals the parent's mid)
  - `settled in phone-start ring view selects without opening`
  - `settled on the wheel is a no-op`
  - `every user action clears hinted; restore and settled keep it`
  - `subscribe receives the action as third argument`
- [ ] **Step 2: Rewrite `url.test.ts`** with:
  - `selected-only state has empty hash`
  - `opened round-trip`
  - `legacy ?ring= query is ignored`
  - the v1 malformed-input cases → `null`
- [ ] **Step 3: Rewrite `history.test.ts`.** Keep the coalescing and throwing tests (adapted to `.push`). Add:
  - `startState: phone picks a core word via random(), selected not opened, ring 0` (with `random = () => 0.99` → the 7th core)
  - `startState: desktop is initialState`
  - `historyOp` table: select → none; open → push; settled while opened → replace; close → push; restore → none
  - `replace never throws`
- [ ] **Step 4: Update `keyboard.test.ts`** to the new table.
- [ ] **Step 5:** `npx vitest run tests/unit/{store,url,history,keyboard}.test.ts` → FAIL.
- [ ] **Step 6:** Implement. Type errors elsewhere (controller, main, panel, tree) are expected and fixed in Tasks 4–8. Run `npx vitest run` only on these four files until then.
- [ ] **Step 7:** Run → PASS. Commit `feat(state): selected/opened model, URL holds opened only, history ops`.

---

### Task 3: Pinch resolution

**Files:** Create `src/model/pinch.ts`. Test: `tests/unit/pinch.test.ts`.

**Interfaces:**
- Consumes: `State`, `Action`, `Layout`, `centerChild` (Task 2).
- Produces:
  ```ts
  export const PINCH_IN = 1.15, PINCH_STEP_OUT = 0.87, PINCH_CLOSE = 0.6;
  /** ratio = release scale / scale at gesture start; hit = segment under the pinch midpoint (null if none). */
  export function resolvePinch(layout: Layout, s: State, ratio: number, hit: number | null): Action | null;
  ```
- **The §3.4 table:**
  - **Pinch in** (`ratio > PINCH_IN`):
    - `hit === null` → null
    - opened and `hit === selected` → `toChild` (a leaf gives a no-op in the reducer)
    - otherwise → `open(hit)`
  - **Pinch out:**
    - `ratio < PINCH_CLOSE`: opened → `close`; phone-start ring view → `close`-equivalent (see below)
    - `ratio < PINCH_STEP_OUT`: opened → `toParent`; phone-start ring view → as above
  - **Anything else** → null.
- For the phone start (selected, not opened, ring view), both pinch-out bands return `{ type: 'restore', state: { ...s, view: { mode: 'wheel' } } }`, which keeps the selection.

- [ ] **Step 1: Write tests:**
  - `pinch in on the whole wheel opens the word under the fingers`
  - `pinch in over the hole or outside the wheel does nothing` (Review Focus 2)
  - `pinch in on the opened word goes to its centre child`
  - `pinch in on an opened leaf yields toChild, which the reducer ignores` (Review Focus 3: assert `reduce` returns the same object)
  - `small pinch out while opened opens the parent`
  - `big pinch out while opened closes`
  - `pinch out in phone-start view returns to the wheel keeping the selection`
  - `ratios between thresholds do nothing`
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS. **Step 5:** Commit `feat(model): pinch resolution`.

---

### Task 4: Controller rewrite

**Files:** Rewrite `src/controller.ts`. Test: rewrite `tests/unit/controller.test.ts` (keep its fake raf/clock harness).

**Interfaces:**
- Consumes: Tasks 2–3; `CameraController` (gains `target` in Task 5. Until then, read `camera.current` where `target` is mentioned and update it in Task 5).
- Produces:
  ```ts
  export interface Controller {
    handle(intents: Intent[]): void;
    setViewport(vp: Viewport, o: CameraOpts): void;
    playIntro(): void;   // phone start: jump to the wheel at rotation − 1.5 × median core width, then animate to the ring(0) camera centred on the selection
    readonly camera: CameraController;
  }
  export function createController(layout, store, camera, vp, opts): Controller;
  ```
- **Resting camera** for a state:
  - `view: wheel` → `overviewCamera(vp, savedRotation ?? current.rotation)`
  - `view: ring(r)` → `ringFocusCamera(layout, r, vp, rotationToCenter(selected), opts)`

  (`overviewCamera` keeps its name.)
- **Saved rotation:** on any transition from the `wheel` view to a `ring` view, save `camera.current.rotation` before animating. Closing animates the wheel camera to that saved rotation.
- **Intents:**
  - `tap`:
    - `camera.stop()`, then hit-test the live camera
    - a miss → `clear`, unless opened, in which case → `close`
    - a hit while the wheel was moving → `open(hit)` if opened, else `select(hit)`, never toggling
    - otherwise → `select(hit)`
  - `doubleTap`:
    - over a word → `open(hit)`
    - opened and no hit → `close`
    - Remember the state before the preceding `tap`. If that tap changed it, the doubleTap acts from the pre-tap state. A double-tap on an unselected word therefore opens it.
  - `dragStart`, `scroll`, `pinch`, `zoomWheel` → `dismissHint` (once), `camera.stop()`.
  - `drag` / `scroll`: rotate as in v1. In the `wheel` view there's no snap ring. In a `ring` view, snap to that ring.
  - `dragEnd` / `scrollEnd` → `fling(v, snapRing)`, where `snapRing` is the ring view's ring, or null on the wheel.
  - `swipe`:
    - in a ring view: `left` (outward) → `toChild`; `right` (toward the centre) → `toParent`
    - on the wheel → fling with its velocity (as in v1)
  - `pinch` → free zoom about the midpoint (as in v1). Remember the gesture's start scale and midpoint.
  - `pinchEnd` / zoom-wheel idle → hit-test the midpoint against the live camera → `resolvePinch(layout, s, current.scale / startScale, hit)`. Dispatch the result if there is one, then always animate to the resting camera of the (possibly new) state.
- **Store subscription:**
  - a view or selection change in a ring view → animate to the resting camera
  - a change to the `wheel` view → animate to the wheel camera at the saved rotation
- **`onSettle`:** in a ring view, dispatch `settled(segmentAt(ring, −rotation))`. Ignore it if the camera's target is stale: a `restore` in between has already re-targeted the camera, so compare the settled segment with the store's `selected`; a mismatch with no fling in progress means it's stale.

- [ ] **Step 1: Rewrite the controller tests**, keeping the harness. Tests:
  - `tap selects without moving the camera on the whole wheel`
  - `tap on the selected word opens it: ring view, centred at angle 0`
  - `tapping another word while opened opens it and centres it`
  - `tap outside while opened closes to the saved rotation, selection kept`
  - `tap outside while selected clears`
  - `double-tap on an unselected word opens it` (Review Focus 1)
  - `tap during a fling selects (or opens) the word under the finger, never clears`
  - `drag + dragEnd while opened settles exactly on a segment mid and opens it`
  - `swipe right while opened opens the parent; swipe left opens the centre child`
  - `ctrl-wheel zoom over Sad on the whole wheel opens Sad, not the word at 3 o'clock`. This is the user-reported bug: rotation 0 so another core word sits at 3 o'clock, `zoomWheel` events centred on Sad's screen point, then advance 150 ms.
  - `small pinch out on an opened outer word opens its parent`
  - `big pinch out closes`
  - `playIntro lands centred on the selected core word without dispatching anything but settled` (assert `store.get().selected` unchanged and `opened === false`)
  - `restore during a fling wins: the late settled is ignored` (Review Focus 4: fling, `restore` to another opened word, step 2 s, assert selected is the restored word and centred)
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS. **Step 5:** Commit `feat(controller): selected/opened interaction rules`.

---

### Task 5: Camera anchor, live target, resize rules

**Files:** Modify `src/camera.ts`, `src/controller.ts` (`setViewport`). Tests: `tests/unit/camera.test.ts`, `tests/unit/controller.test.ts`.

**Interfaces:**
- `CameraOpts` gains `anchorY: number` (a fraction of stage height): `0.275` when `portrait`, otherwise `0.5`. `ringFocusCamera` sets `cy = anchorY * vp.height`.
- `CameraController` gains `readonly target: Camera`, the spring's current target. It's equal to `current` at rest.
- `setViewport` in a ring view keeps `segmentAt(ring, −target.rotation)` when the camera is moving (the fling's destination), otherwise the selection. On the wheel it keeps the saved rotation.

- [ ] **Step 1: Tests:**
  - `portrait ring camera puts the ring's mid-radius row at 27.5% height`
  - `target equals the fling destination while moving and current at rest`
  - `resize mid-fling keeps the fling's destination centred`
  - `portrait → wide while in phone-start view keeps the same word selected, centred, not opened` (Review Focus 5)
- [ ] **Step 2:** FAIL → **Step 3:** implement → **Step 4:** PASS → **Step 5:** commit `feat(camera): phone anchor above the card, resize keeps the fling target`.

---

### Task 6: Renderer: outline, chevron, lift, pulse

**Files:** Modify `src/render/wheel.ts`. Test: `tests/unit/wheel-render.test.ts`.

**Interfaces:**
- `Frame` becomes:
  ```ts
  { cam; vp; lit; prevLit; fadeT; selected: number | null; opened: boolean; pulseT: number /* 0..1 */; mode: 'wheel' | 'ring'; remPx; moreContrast? }
  ```
  `focused` and `showFocus` are removed.
- `stats` gains `labelFits: number` (calls to `fitLabel` this frame).
- **Draw order:** segments → labels → selected treatment.
  - When `opened`, the selected segment is skipped in the main pass and drawn last: lifted, with its shadow, then the outline, then its label at 1.15× px and weight 800, scaled by `0.96 + 0.04 * easeOut(pulseT)` about its centre.
  - When selected but not opened: outline plus chevron, with no lift and no shadow.
- `lit` is supplied by `main.ts` (Task 8): `litMask(selected)` when opened, all-lit otherwise.

- [ ] **Step 1: Tests:**
  - `selected not opened: outline drawn in palette.outline, chevron drawn, no shadow`
  - `opened: shadowBlur set exactly once per frame` (count assignments of `shadowBlur > 0` via the fake context)
  - `opened label uses weight 800 and a larger px than its neighbours`
  - `thin cell gets the chevron outside in the outline colour; wide cell gets it inside in white` (record `strokeStyle` at the chevron's stroke)
  - `forced palette outlines in Highlight`
  - `pinch: redrawing at a scale 0.3% larger reuses label fits` (`labelFits === 0` on the second draw)
  - Remove the v1 `showFocus` tests.
- [ ] **Step 2:** FAIL → **Step 3:** implement. Label reuse: reuse a cached fit when `|w − cached.w| ≤ 1 && |h − cached.h| ≤ 1` with the same min/max. → **Step 4:** PASS → **Step 5:** commit `feat(render): selected outline and chevron, lifted opened cell with pulse`.

---

### Task 7: Accordion card, hint, toolbar

**Files:** Create `src/ui/card.ts`, `src/ui/hint.ts`. Modify `src/ui/toolbar.ts`. Delete `src/ui/panel.ts` and `tests/unit/panel.test.ts`. Tests: `tests/unit/card.test.ts`, `tests/unit/hint.test.ts`, update the toolbar test (move it into `card.test.ts`).

**Interfaces:**
- Produces (`card.ts`):
  ```ts
  type Row = { index: number; label: string };
  export type CardModel =
    | { kind: 'none' }
    | { kind: 'selected'; index: number; title: string; hue: string }
    | { kind: 'opened'; index: number; title: string; hue: string; crumbs: Row[] /* ancestors, root first */;
        definition: string; sensations: string[]; children: Row[]; closeTo: Row[] /* leaves only */ };
  export function cardModel(layout: Layout, feelings: FeelingsDict, s: State): CardModel;
  export class FwCard extends HTMLElement { model: CardModel }   // <fw-card>; emits 'fw-action' CustomEvent<Action>
  ```
- **DOM:**
  - `kind: 'none'` → `hidden`.
  - Otherwise: a header `<button class="fw-card-head" aria-expanded>` containing the hue dot, `<span class="fw-card-title">`, and an inline-SVG chevron (rotated 90° when opened; CSS transition skipped with reduced motion). Header click → `activate` when selected, `close` when opened.
  - Body (opened only):
    - `<nav class="fw-crumbs" aria-label=t('path')>`: buttons separated by "›", each emitting `open(index)`
    - definition `<p>`
    - "You might notice" `<ul>`
    - "Narrow it down" `<ul class="fw-rows">` of buttons, each emitting `open(index)`
    - "Close to" inline buttons, each emitting `open(index)`
  - Focus rules (spec §5.2): the same kind and index → no rebuild; a rebuild while focus was inside → focus the header button.
- Produces (`hint.ts`): `<fw-hint>` with `text: string | null`. Null → `hidden`. Its own `aria-live="polite"`.
- Produces (`toolbar.ts`): `FwToolbar` keeps `theme`. `zoomed` becomes `opened: boolean`: when true it shows the `t('wholeWheel')` button (no `aria-pressed`), which emits `fw-action { type: 'close' }`. When false the button is hidden.

- [ ] **Step 1: Tests:**
  - `cardModel: none / selected / opened`, with `angry/aggressive/hostile` crumbs Angry, Aggressive; children empty; closeTo Provoked
  - `header is a button with aria-expanded false when selected and true when opened`
  - `header click emits activate when selected and close when opened`
  - `crumb, row and close-to buttons emit open(index)`
  - `same model does not rebuild; rebuild with focus inside moves focus to the header`
  - `no pill classes remain` (no `.fw-chip`)
  - `hint hidden when text is null`
  - `toolbar shows Whole wheel only when opened and emits close`
- [ ] **Step 2:** FAIL → **Step 3:** implement, add the new locale strings, delete `panel.ts` → **Step 4:** PASS → **Step 5:** commit `feat(ui): accordion card, floating hint, whole-wheel button`.

---

### Task 8: Wiring, layout, accessibility, e2e

**Files:** Modify `src/main.ts`, `src/a11y/tree.ts`, `src/styles/app.css`, `index.html`, `src/data/locales/en.json`. Rewrite `tests/e2e/wheel.spec.ts` and `tests/e2e/helpers.ts`. Update `tests/fw-window.d.ts` and `tests/unit/a11y.test.ts`.

**Interfaces:**
- **`index.html`:** replace `<fw-path>` / `<fw-panel>` with `<div id="float"><fw-hint></fw-hint><fw-card></fw-card></div>`. Keep a single `<meta name="theme-color" id="theme-color">`.
- **`tree.ts`:**
  - `aria-selected` on the selected word; `aria-current="true"` added when it's opened
  - the roving tabindex follows `selected` (or the first core)
  - `focusSelected(): void` moves DOM focus into the tree with `preventScroll`
  - Its own Enter/Space handling and the `focus` dispatch on `focusin` are removed: keydown goes through `keyToAction` only (Enter/Space → `activate`), and tabbing into the tree doesn't change the selection
  - It dispatches `Action` (not the removed `KeyAction`)
  - `describe` is unchanged
  - Add `announceFor(layout, prev, next): string | null`, returning:
    - `'opened'` / `'openedCore'` when a word opens
    - `'closed'` when one closes
    - `describe(i)` when only the selection changes
    - null otherwise
- **`main.ts`:**
  - **Startup:**
    - `start = fromHash(location.hash) ?? startState(layout, vp, Math.random)`
    - if the hash was empty, `shouldStartZoomed` is true and reduced motion is off → `controller.playIntro()`
    - `fw.seenIntro` is removed
  - **The store subscription** receives `(s, prev, a)`:
    - `lit = s.opened ? litMask(s.selected) : allLit`, with the cross-fade only when `opened` changes or the opened word changes
    - `pulseStart` set when a word opens
    - `historyOp` → `writer.push` / `writer.replace`; closing pushes `location.pathname + location.search`
    - announcements via `announceFor`
    - the card, hint (`hinted ? (start was a phone start ? hintSpin : hintChoose) : null`) and toolbar update
  - **Popstate:**
    - `fromHash(...)`, else, if the page began at the base URL and the start state was a phone start, `start`
    - else `{ ...current, opened: false, view: wheel }`
    - dispatched as `restore`
  - **Global keys:**
    - `document` keydown → `keyToAction`, unless the target is inside `#float`, an `input`, a `select` or a `button`. Escape is always allowed.
    - mouse `pointerdown` on the canvas → `tree.focusSelected()`
  - **Theme colour:** `#theme-color` content = the `--bg` of the resolved theme, updated on every theme change.
- **`app.css`:**
  - **Desktop:**
    - `#stage { inset: 0 var(--column) 0 0 }` with `--column: min(24rem, 34vw)`
    - `#float` absolutely positioned in that column, vertically centred, `max-height: calc(100% - 4rem)`, `overflow: auto`
    - the card and hint use the surface colour, a radius, the v1 shadow, and size to their content
  - **Narrow / portrait** (the existing container query): `#stage { inset: 0 }`; `#float` at the bottom with a 12 px margin plus safe-area insets, `max-height: 45dvh`, scrolling inside.
  - **Removed:** the old `fw-panel` / `fw-path` / `.fw-chip` / `data-panel-side` rules.
  - **Measurement:** `measure()` gives `opts.anchorY = portrait ? 0.275 : 0.5`; the stage size no longer depends on the card.

- [ ] **Step 1: Rewrite the e2e helpers and spec.** `__fw` gains `startState()`. Tests (desktop projects unless noted):
  - `tap selects: outline state, card collapsed, URL unchanged, nothing faded` (assert `aria-expanded="false"`, `location.hash === ''`, `state.opened === false`)
  - `tap again opens: URL hash, card expanded with 8 rows, Back returns to selected-not-opened`
  - `narrow-it-down row opens Aggressive with an Angry crumb; crumb reopens Angry`
  - `Escape closes then clears`
  - `close restores the pre-open rotation` (compare `camera().rotation` before open and after close, mod 2π, < 1e-6)
  - `ctrl+wheel over Sad on the whole wheel opens Sad` (the user-reported bug)
  - `arrow keys work after one click on the wheel` (click Angry, press ArrowDown → Disgusted is selected)
  - `the card never moves the wheel` (the `#wheel` bounding box is identical in the none, selected and opened states)
  - **Phone (pixel/iphone):**
    - `phone: base URL spins to a random core word, selected, URL empty, hint "Spin to explore."` (assert `view.ring === 0`, `opened === false`, the hint is visible)
    - `phone: first drag hides the hint and keeps the URL`
    - `phone: opened word sits above the card` (the word's screen y < the card's top)
    - `phone: Back to the base restores the same start word`
  - `reduced motion: no intro spin on a phone`
  - `axe: no violations with nothing selected, selected, opened`
  - Keep `resizing never paints a cleared canvas frame` and `offline.spec.ts` unchanged.
- [ ] **Step 2:** `npm run test:e2e` → FAIL. **Step 3:** Implement the wiring and CSS; update `a11y.test.ts` for `aria-current` and `announceFor`. **Step 4:** `npx tsc --noEmit && npm test && npm run test:e2e` → PASS on all projects. **Step 5:** A manual look with `npm run dev` on desktop and a phone-sized window. Commit `feat: wire v1.1 interaction, floating card, layout and a11y`.

---

### Task 9: Firefox performance gate (and sprite cache if needed)

**Files:** Create `tests/perf/firefox.spec.ts`; modify the `test:perf` script to run `--project=chromium --project=firefox`. Conditionally create `src/render/sprites.ts` and a test `tests/unit/sprites.test.ts`.

**Interfaces (only if the cache is needed):**
```ts
export interface SpriteCache { draw(g: CanvasRenderingContext2D, text: string, px: number, color: string, x: number, y: number, rot: number): void; size: number }
export function createSpriteCache(makeCanvas: (w: number, h: number) => HTMLCanvasElement | OffscreenCanvas, limit?: number /* 600 */): SpriteCache;
```
It's keyed on `text|px(rounded to 0.5)|color`, with least-recently-used eviction beyond `limit`.

- [ ] **Step 1:** Write `firefox.spec.ts`: Firefox only, using `/#/core` on the wheel and `/#/core/angry/aggressive/hostile` opened. Reuse the Chromium spin script with a `requestAnimationFrame` probe. Assert `p95 frame delta ≤ 20 ms` in both states and log the numbers.
- [ ] **Step 2:** `npm run build && npm run test:perf`.
  - If both Firefox tests pass and Chromium draw p95 ≤ 4 ms → ledger a ruling "sprite cache not needed (numbers)" and go to Step 5.
  - Otherwise continue.
- [ ] **Step 3 (conditional):** Write the `sprites.test.ts` tests:
  - `second draw of the same label reuses the bitmap`
  - `px rounds to 0.5`
  - `evicts least-recently-used beyond the limit`

  Implement `sprites.ts`, and use it in `wheel.ts` for every label except the opened cell's (which pulses).
- [ ] **Step 4 (conditional):** `npm test && npm run test:perf` → PASS.
- [ ] **Step 5:** `npm test && npm run build && npm run size && npm run test:e2e && npm run test:perf` → all PASS. Commit `test(perf): Firefox frame-time gate` (plus `feat(render): label sprite cache` if added).

---

## Spec coverage

| v1.1 spec § | Task |
|---|---|
| §3.1 states | 2 |
| §3.2 opening the app | 2 (`startState`), 4 (`playIntro`), 8 (startup) |
| §3.3 walkthrough | 2 (reducer), 4 (gestures) |
| §3.4 pinch | 3, 4 |
| §3.5 keyboard | 2 (map, reducer), 8 (global routing, focus on click) |
| §3.6 URL and history | 2, 8 |
| §4.1 palette | 1 |
| §4.2 selection treatments | 6, 8 (`lit` / pulse inputs) |
| §5.1 card, hint, toolbar | 7 |
| §5.2 focus management | 7 |
| §5.3 layout, theme colour | 5 (anchor), 8 (CSS, meta) |
| §6 accessibility | 7, 8 |
| §7 performance | 6 (pinch label reuse), 9 |
| §8 leftovers | 1 (forced colours), 5 (resize mid-fling), 8 (theme colour) |
| §10 acceptance | 8, 9 |
