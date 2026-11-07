# Feelings Wheel v1.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the four v1.1 bugs, then apply v1.2's layout, card and motion changes:
- phones start with no selection, on a half-wheel;
- closing keeps the rotation;
- the desktop wheel sits against the card's column, and the phone's opened word is centred;
- the card gets a new header with animation;
- motion is slower and pinches are less eager.

**Architecture:** Same layers as v1.1. Bugs first (Tasks 1–3), then the start state (4), cameras (5–6), card (7), the sprite cache (8) and a final sweep (9).
- **Pure logic:** the key routing gets a new module, `src/input/route.ts`.
- **Camera:** gains a half-wheel resting camera and an edge-anchored opened camera.
- **Card:** updates in place for selected ↔ opened, so CSS transitions can run.

**Tech Stack:** unchanged from v1.1. Vite 8.3.6, TypeScript 7.0.2, Vitest 5.1.0 with happy-dom 21.0.4, Playwright 1.65.0 with @axe-core/playwright 4.14.0.

**Spec:** `docs/superpowers/specs/2026-11-07-feelings-wheel-v1.2-design.md`. It builds on the v1.1 spec (`…-v1.1-design.md`) and v1. Read v1.2 §3–§7 before starting.

## Global Constraints

**Carried over from v1 and v1.1:**
- no runtime dependencies, no framework, no shadow DOM;
- every string through `t()`;
- WCAG 2.2 AA; reduced motion honoured;
- storage access in try/catch;
- size budgets: app JS ≤ 25 KB gzipped, first load ≤ 60 KB gzipped;
- commits straight to `main`, with no `Co-Authored-By` or AI trailer.

**Hint:** one string, `hint` = "How are you feeling? Tap a feeling or spin to explore."

**Toolbar:** `zoomOut` = "Zoom out".

**Removed strings:** `hintSpin`, `hintChoose`, `wholeWheel`.

**Pinch thresholds:** `PINCH_IN = 1.35`, `PINCH_STEP_OUT = 0.8`, `PINCH_CLOSE = 0.55`.

**Camera spring:** `OMEGA = 14` (was 24). `FLING_TAU` is unchanged.

**Half-wheel:**
- **When:** used for the whole-wheel view when `shouldStartZoomed(layout, vp)` is true.
- **Camera:** `cx = 0`, `cy = vp.height / 2`, `scale = 0.95 * vp.width / vp.radius`.
- **Resting rotation:** Fearful centred at 3 o'clock.
- **Intro:** spin only, from 1.5 median core widths back.

**Desktop opened camera:**
- v1.1 ring scale;
- `cy = vp.height / 2`;
- `cx = vp.width − R·scale`, so the outer edge sits on the stage's right edge;
- safeguard: the opened cell's inner edge minus the 10 px lift stays ≥ `remPx` from the left.

**Phone opened camera:** the ring's middle at `0.5 × width`, and `cy = 0.5 × height`.

**Portrait rule:** `width < 720 || height >= width`.

**CSS:**
- `--column: min(30rem, 40vw)`;
- card width `min(27rem, var(--column) - 3rem)`;
- phone `#float` `max-height: calc(50dvh - var(--opened-half, 0px) - 24px - env(safe-area-inset-bottom))`.

**Card:**
- **Header DOM:** `div.fw-card-head` > `nav.fw-crumbs` (opened, non-core only) + `h2.fw-card-heading` > `button.fw-card-toggle[aria-expanded]` holding the dot, `.fw-card-title` and the chevron.
- **Unfold:** 220 ms ease-out.
- **Dot pulse:** a 2.4 s loop.
- **Hover ink:** ≥ 4.5:1 against `--surface`.

**Sprite cache:** limits of 600 images and 16 MB (w × h × 4 bytes).

**Outline inner line:**
- a 3 px fixed-distance inset, with angular inset `3 / r` per arc;
- the chevron-inside label loses 14 px at its outer end, and its centre moves 7 px inward.

## Review Focus

1. **Phone turned to landscape while a word is selected on the half-wheel.** The selection stays, and the view becomes the full wheel at the same rotation, not opened. Test in Task 5.
2. **Phone opened from a deep link, then Back.** It lands on the half-wheel with that word selected, and no intro plays. Test in Task 5.
3. **Enter or Space on a focused card link or the "Zoom out" button.** It activates that button and is not routed to the wheel. Test in Task 1.
4. **Toggling the card header twice quickly** (open, then close before the unfold finishes). `data-open` and `aria-expanded` match the store, with no stale body left visible. Test in Task 7.
5. **Opening a core word in a narrow desktop window** (1024×768). The opened cell is fully on screen, at least 1rem from the left edge. Test in Task 6.

---

## File Map

| File | Change | Task |
|---|---|---|
| `src/input/route.ts` (new), `src/input/keyboard.ts`, `src/state/store.ts`, `src/main.ts` | Key routing, `stepOut`, theme sync | 1 |
| `src/render/wheel.ts` | Parallel inset line; chevron label room | 2 |
| `src/controller.ts`, `src/camera.ts`, `src/model/pinch.ts` | Close keeps rotation, spring, thresholds | 3 |
| `src/state/history.ts`, `src/main.ts`, `src/model/pinch.ts`, `src/ui/toolbar.ts`, `src/data/locales/en.json` | No start selection, one hint, Back rule, "Zoom out" | 4 |
| `src/camera.ts`, `src/controller.ts`, `src/main.ts` | Half-wheel, spin-only intro | 5 |
| `src/camera.ts`, `src/main.ts`, `src/styles/app.css` | Opened cameras, `--opened-half`, column, portrait rule | 6 |
| `src/ui/card.ts`, `src/render/colors.ts`, `src/main.ts`, `src/styles/app.css` | Card header, unfold, pulse, hover ink | 7 |
| `src/render/sprites.ts`, `tests/perf/firefox.spec.ts` | Clear, fallback, byte cap; pinch gate | 8 |
| `tests/e2e/*`, `docs/ROADMAP.md` | Axe in both themes, full gates, roadmap | 9 |

---

### Task 1: Keys from the card and toolbar, `−` as stepOut, theme picker sync

**Files:**
- Create `src/input/route.ts`.
- Modify `src/input/keyboard.ts`, `src/state/store.ts` and `src/main.ts`. In `main.ts`, the document `keydown` handler and the `fw-theme` listener change.
- Tests:
  - new `tests/unit/route.test.ts`;
  - `tests/unit/keyboard.test.ts`;
  - `tests/unit/store.test.ts`;
  - `tests/e2e/wheel.spec.ts`.

**Interfaces:**
- Produces (`store.ts`): `Action` gains `{ type: 'stepOut' }`. When opened it behaves like `toParent`; otherwise it does nothing (it still clears `hinted`, like every user action).
- Produces (`keyboard.ts`): `keyToAction('-')` returns `{ type: 'stepOut' }`. Everything else is unchanged.
- Produces (`route.ts`):
  ```ts
  export type KeyTarget = 'field' | 'button' | 'other';
  /** 'field': input, select, textarea. 'button': any <button> (card, toolbar). */
  export function keyTarget(el: Element | null): KeyTarget;
  /** The action for a document-level keydown, or null to leave it to the browser. */
  export function routeKey(key: string, where: KeyTarget, modified: boolean): Action | null;
  ```
  The rules:
  - `modified` → null;
  - `field` → only Escape is routed;
  - `button` → Enter and Space return null (the button keeps them); arrows, `+`, `=`, `-` and Escape are routed;
  - `other` → `keyToAction(key)`.
- `main.ts`: the document `keydown` handler becomes `routeKey(e.key, keyTarget(e.target as Element), e.metaKey || e.ctrlKey || e.altKey)`, with `preventDefault` and dispatch when it isn't null. The `#float`/`fw-toolbar` exclusion goes. The `fw-theme` listener also sets `toolbar.theme = themePref`.

- [ ] **Step 1: Tests.**
  - `route.test.ts`:
    - `button target: ArrowDown routes to step +1`
    - `button target: Enter and Space are left to the button`
    - `field target: only Escape routes`
    - `modified keys are never routed`
    - `keyTarget classifies input/select/textarea as field, button as button, li/body as other`
  - `keyboard.test.ts`: `'-'` → `{ type: 'stepOut' }`.
  - `store.test.ts`:
    - `stepOut while opened opens the parent; on an opened core it closes`
    - `stepOut while only selected is a no-op apart from hinted`
  - **E2E** (desktop projects):
    - `arrows work after a Close-to link`: open `#/core/angry/aggressive/hostile`, click the "Provoked" link, press ArrowDown, and the selection becomes the ring neighbour of `angry/aggressive/provoked`.
    - `Enter on a focused row activates it, not the wheel`: on `#/core/angry`, focus the first `ul.fw-rows button` and press Enter; the hash becomes `#/core/angry/let-down`.
    - `the theme picker keeps its choice`: select `dark`, open a word, press Escape, and the select's value is still `dark`.
- [ ] **Step 2:** `npx vitest run tests/unit/{route,keyboard,store}.test.ts` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run the unit tests → PASS. Then `npm run test:e2e -- -g "Close-to|Enter on a focused|keeps its choice"` → PASS.
- [ ] **Step 5:** Commit `fix: keys work from the card and toolbar, − does nothing while selected, theme picker keeps its choice`.

---

### Task 2: Outline inner line and chevron label room

**Files:** Modify `src/render/wheel.ts`, specifically `outline()` and the label pass for the selected cell. Test `tests/unit/wheel-render.test.ts`.

**Interfaces:**
- No exported changes.
- `outline()` draws its inner gap line with a fixed 3 px inset: on an arc of radius `r`, the angular inset is `3 / r`.
- When the selection isn't opened and its chevron sits inside (outer arc ≥ 22 px), the selected cell's label is fitted to a width 14 px smaller, and its centre moves 7 px toward the wheel's centre.

- [ ] **Step 1: Tests.** Extend the fake context so `arc(x, y, r, a0, a1)` calls are recorded.
  - `inner outline line is a parallel 3px inset on every ring`. For one cell each in rings 0, 1 and 2, select it (not opened) and draw. Find the inner-line sector: the two arcs drawn right before the stroke whose `strokeStyle` is `palette.gap` and whose `lineWidth` is 2. For each of its two arcs, assert `(a0_inner − a0_cell) * r ≈ 3` (±0.01) and `(a1_cell − a1_inner) * r ≈ 3`.
  - Also for an opened (lifted) cell in ring 0.
  - `the label of a selected cell with an inside chevron moves 7px inward`. Record the translation (`e`, `f` from `setTransform`) at `fillText`. Draw `angry` unselected, then selected, and assert the label centre's distance from `cam.cx, cam.cy` shrinks by 7 (±0.01, divided by dpr).
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npx vitest run tests/unit/wheel-render.test.ts` → PASS.
- [ ] **Step 5:** Commit `fix(render): outline inner line runs parallel to the cell on every ring; chevron no longer crowds the label`.

---

### Task 3: Closing keeps the rotation; slower spring; new pinch thresholds

**Files:**
- Modify:
  - `src/controller.ts`: remove `savedRotation` and every use of it;
  - `src/camera.ts`: `OMEGA = 14`;
  - `src/model/pinch.ts`: the constants.
- Tests:
  - `tests/unit/controller.test.ts`;
  - `tests/unit/camera.test.ts`;
  - `tests/unit/pinch.test.ts`;
  - `tests/e2e/wheel.spec.ts`.

**Interfaces:** No signature changes. `restingCamera` for the wheel view uses the camera's current rotation, or `camera.target.rotation` when the camera is moving.

- [ ] **Step 1: Tests.**
  - **Controller:**
    - Replace `tap outside while opened closes to the saved rotation` with `closing keeps the current rotation`: open hostile from the wheel, step(2000), note `camera.current.rotation`, close, step(2000), and assert the same rotation (mod 2π, < 1e-6) and scale 1.
    - Also `close after spinning while opened keeps the spun rotation`.
    - Remove `resize on the whole wheel mid-close keeps the saved rotation`. Replace it with `resize mid-close keeps the closing camera's target rotation`.
  - **Camera:** replace the `animateTo approaches within 1%…` test with `animateTo at OMEGA 14: about 90% done by 280ms, within 1% by 500ms, settled by 1000ms`. For a 0.2 rad move, assert remaining error ≤ 0.02 at 280 ms, > 0.03 at 200 ms, ≤ 0.002 at 500 ms, and settled with `onSettle` called once by 1000 ms.
  - **Pinch:**
    - the thresholds are `[1.35, 0.8, 0.55]`;
    - `ratios between thresholds do nothing` uses `[0.8, 0.95, 1, 1.2, 1.35]`;
    - small pinch out at 0.7 → `toParent`; at 0.55 → `toParent`; at 0.54 → `close`;
    - pinch in at 1.34 → null; at 1.36 → open.
  - **E2E:** replace `close restores the pre-open rotation` with `close keeps the rotation`: open by double-tap, then click "Zoom out"; the rotation before and after closing is equal (mod 2π). Until Task 4 the button is still labelled "Whole wheel".
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implement.
  - With the slower spring, existing controller tests that `step(1000)` and then expect a settled camera may not have settled. Raise those steps to `step(2000)`. Never loosen an assertion.
  - The controller's small-pinch-out tests use scale 0.8; change them to 0.7.
- [ ] **Step 4:** `npm test` → PASS. Then `npm run test:e2e -- -g "keeps the rotation"` → PASS.
- [ ] **Step 5:** Commit `fix: closing keeps the rotation; slower spring; less eager pinches`.

---

### Task 4: No starting selection, one hint, Back rule, "Zoom out"

**Files:**
- Modify:
  - `src/state/history.ts`: remove `startState`;
  - `src/main.ts`: startup, `hintText`, popstate, the test hook;
  - `src/model/pinch.ts`: remove the phone-start branch;
  - `src/ui/toolbar.ts`;
  - `src/data/locales/en.json`.
- Tests:
  - `tests/unit/history.test.ts`;
  - `tests/unit/pinch.test.ts`;
  - `tests/unit/card.test.ts` (the toolbar test);
  - `tests/e2e/wheel.spec.ts` and `helpers.ts`;
  - `tests/fw-window.d.ts`.

**Interfaces:**
- `history.ts` no longer exports `startState`.
- **Startup** (`main.ts`):
  - the start state is `fromHash(...) ?? initialState`;
  - the intro plays when the hash was empty, `opts.half` is true (Task 5 adds `half`; until then, `shouldStartZoomed(layout, vp)`) and reduced motion is off.
- **Hint:** `hintText(s) = s.hinted ? t('hint') : null`.
- **Popstate:** `fromHash(...) ?? { ...cur, opened: false, view: { mode: 'wheel' } }`, with `hinted` kept as in v1.1.
- **Test hook:** `__fw.startState` is removed.
- **`resolvePinch`:** pinch out on the wheel view is always null. The ring-view-not-opened branch is removed, since those states no longer occur at start.
- **Toolbar:**
  - The button text is `t('zoomOut')`, with class `fw-zoom-out`.
  - After its click emits `close`, the toolbar emits `new CustomEvent('fw-focus-lost', { bubbles: true })`. `main.ts` already moves focus to the tree on that event.
- **Locale:**
  - add `hint` and `zoomOut`;
  - remove `hintSpin`, `hintChoose` and `wholeWheel`.

- [ ] **Step 1: Tests.**
  - **History:** remove the `startState` tests.
  - **Pinch:** remove the phone-start test, and add `pinch out on the whole wheel with a selection does nothing`.
  - **Toolbar:** `toolbar shows Zoom out only when opened, emits close then fw-focus-lost`.
  - **E2E (phones):**
    - Replace the v1.1 phone tests with `phone: base URL starts with nothing selected and the hint "How are you feeling? Tap a feeling or spin to explore."`. Assert `state.selected === null`, `view.mode === 'wheel'` and an empty hash.
    - Keep `phone: first drag hides the hint and keeps the URL`.
    - Replace `phone: Back to the base restores the same start word` with `Back from an opened word returns to the whole wheel with it selected`.
  - **E2E (desktop):** `the hint reads the same on desktop`.
  - **E2E (all):** update every test that clicked "Whole wheel" to click "Zoom out".
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npx tsc --noEmit && npm test && npm run test:e2e` → PASS.
- [ ] **Step 5:** Commit `feat: start with nothing selected, one hint everywhere, Zoom out button`.

---

### Task 5: The phone's half-wheel and a spin-only intro

**Files:**
- Modify:
  - `src/camera.ts`: `CameraOpts`, `wheelCamera`;
  - `src/controller.ts`: `restingCamera`, `setViewport`, `playIntro`, the initial camera;
  - `src/main.ts`: `measure()` sets `half`.
- Tests:
  - `tests/unit/camera.test.ts`;
  - `tests/unit/controller.test.ts`;
  - `tests/e2e/wheel.spec.ts`.

**Interfaces:**
- Produces (`camera.ts`):
  ```ts
  export interface CameraOpts { remPx: number; portrait: boolean; anchorY: number; half: boolean } // Task 6 removes anchorY
  /** The whole-wheel resting camera: centred in the stage, or the half-wheel when o.half. */
  export function wheelCamera(vp: Viewport, rotation: number, o: CameraOpts): Camera;
  /** Rotation that centres the first core word (Fearful) at 3 o'clock. */
  export function halfRestRotation(layout: Layout): number; // −segments[rings[0].segments[0]].mid
  ```
  - With `half`: `{ scale: 0.95 * vp.width / vp.radius, rotation, cx: 0, cy: vp.height / 2 }`.
  - Otherwise: `overviewCamera(vp, rotation)`.
- `main.ts` `measure()`: `half: shouldStartZoomed(layout, vp)`.
- **Controller:**
  - The wheel view's resting camera is `wheelCamera(vp, current or target rotation, opts)`.
  - Initial rotation: `opts.half ? halfRestRotation(layout) : DEFAULT_ROTATION`.
  - `playIntro()`: only when the view is the wheel and `opts.half`. It jumps to `wheelCamera(vp, rest − 1.5 × median core width, opts)` and animates to `wheelCamera(vp, rest, opts)`, without dispatching anything.
  - `setViewport` on the wheel jumps to `wheelCamera(vp, camera.target.rotation, opts)`. That covers half ↔ full when turning the device.

- [ ] **Step 1: Tests.**
  - **Camera:**
    - `half wheelCamera puts the centre on the left edge, halfway down, outer edge at 95% width` (cx 0, cy h/2, `R·scale = 0.95 w`);
    - `full wheelCamera equals overviewCamera`.
  - **Controller** (a phone viewport `{ width: 390, height: 844, radius: 187 }` with `half: true`):
    - `phone starts on the half-wheel with Fearful at 3 o'clock`;
    - `playIntro only spins: scale and centre stay those of the half-wheel, nothing is dispatched`;
    - `tap selects on the half-wheel without moving the camera`;
    - `closing an opened word lands on the half-wheel at the current rotation`;
    - `setViewport portrait→landscape on the half-wheel with a selection keeps the selection, not opened, full wheel at the same rotation` (Review Focus 1).
  - **E2E (phones):**
    - `phone: the wheel's centre is on the left edge` (`__fw.camera().cx` within 2 px of 0);
    - `phone: deep link then Back lands on the half-wheel with the word selected and no intro` (Review Focus 2: after Back, `moving()` is false within 100 ms and the selection is the deep-linked word).
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test && npm run test:e2e` → PASS.
- [ ] **Step 5:** Commit `feat: phones zoom out to a half-wheel with a spin-only intro`.

---

### Task 6: Opened cameras, the column, the phone card cap and one portrait rule

**Files:**
- Modify:
  - `src/camera.ts`: `ringFocusCamera`; remove `anchorY`; add `openedHalfHeight`;
  - `src/controller.ts`;
  - `src/main.ts`: `measure()`, `--opened-half`, the test hook `__fw.viewport()`;
  - `src/styles/app.css`.
- Tests:
  - `tests/unit/camera.test.ts`;
  - `tests/unit/controller.test.ts`;
  - `tests/e2e/wheel.spec.ts`.

**Interfaces:**
- **`ringFocusCamera`** (signature unchanged):
  - `cy = vp.height / 2` always.
  - **Portrait:** `cx = 0.5 * vp.width − rMid·R·scale` (as v1.1).
  - **Otherwise:** `cx = vp.width − R·scale`, then `cx = Math.max(cx, o.remPx − (inner·R·scale − 10))`.
- **`CameraOpts`** becomes `{ remPx; portrait; half }`; `PHONE_ANCHOR_Y` is removed.
- Produces:
  ```ts
  /** Half the opened cell's on-screen height in CSS px: its chord across the outer edge plus the 10px lift, the 2px side lift and 2px of outline. */
  export function openedHalfHeight(layout: Layout, index: number, vp: Viewport, o: CameraOpts): number;
  ```
- **`main.ts`:**
  - `portrait = whole.width < 720 || whole.height >= whole.width`.
  - On every store change and resize, set `app.style.setProperty('--opened-half', s.opened ? `${openedHalfHeight(...)}px` : '0px')`.
  - Add `__fw.viewport()` to the test hook, returning `{ ...vp }`.
- **`app.css`:**
  - `#app { --column: min(30rem, 40vw) }`;
  - `#float` is `min(27rem, calc(var(--column) - 3rem))` wide, with `right: 1.5rem`;
  - the phone `#float` uses the Global Constraints `max-height`.

- [ ] **Step 1: Tests.**
  - **Camera:**
    - `desktop ring camera puts the wheel's outer edge on the stage's right edge` (for rings 0–2 on `{ width: 900, height: 900, radius: 442 }`);
    - `desktop ring camera keeps the opened cell at least 1rem from the left` (a narrow `{ width: 500, height: 768, radius: 242 }`);
    - `portrait ring camera centres the ring middle horizontally and the word vertically`;
    - `openedHalfHeight is larger for a core word than an outer word on a phone`.
  - **Controller:** update the tests that assumed 0.4-width or 0.275-height anchors.
  - **E2E:**
    - `desktop: opened view's wheel edge meets the column`: `cx + viewport().radius × scale ≈ viewport().width` (±1) for core, middle and outer words;
    - `desktop 1024×768: an opened core word is fully on screen` (Review Focus 5: its segment point's x − half the band > 16);
    - `phone: opened word is centred vertically and above the card` (y within 2 px of half the stage height; y + half the cell < the card's top);
    - `square 900×900 window uses the phone layout and camera` (the card is at the bottom; the opened word's y is within 2 px of 450);
    - keep `the card never moves the wheel`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test && npm run test:e2e` → PASS.
- [ ] **Step 5:** Commit `feat: desktop wheel meets the card's column, phone word centred above a capped card`.

---

### Task 7: Card header, unfold, pulse and hover ink

**Files:**
- Modify:
  - `src/ui/card.ts`;
  - `src/render/colors.ts`;
  - `src/main.ts`: set `card.inks` in `refreshColors`;
  - `src/styles/app.css`.
- Tests:
  - `tests/unit/card.test.ts`;
  - `tests/unit/colors.test.ts`;
  - `tests/e2e/helpers.ts`: `head` becomes `.fw-card-toggle`.

**Interfaces:**
- Produces (`colors.ts`):
  ```ts
  /** Text colour for a feeling on the card surface: the base hue shifted in OKLab L (darker in light, lighter in dark) until ≥ 4.5:1 against `surface`. */
  export function inkFor(base: string, theme: 'light' | 'dark', surface: string): string;
  ```
  `readPalette` also reads `--surface` into `Palette.surface: string`. In forced colours it is `'Canvas'`, and `inkFor` is not used there. Add `surface` to the palettes built in `colors.test.ts` and `wheel-render.test.ts`.
- Produces (`card.ts`):
  - `FwCard` gains `inks: Record<string, string>`, the hue → ink map. The card sets `--ink` from `inks[model.hue]`.
  - The header DOM is as in Global Constraints.
- **Update in place.** When the new model has the same `index` as the previous one and only `kind` changes, the card keeps `div.fw-card-head`, the toggle button, the dot and the title. It fills or keeps the crumbs and the body, and toggles the `data-open` attribute and `aria-expanded`. The toggle button is the same element.
  - On opened → selected, the body's content stays (so it can fold away) until the next different-word render.
  - Any other change rebuilds, and the v1.1 focus rules apply to `.fw-card-toggle`.
- **CSS:**
  - `.fw-crumbs-wrap` and `.fw-card-body` use `display: grid; grid-template-rows: 0fr`, transitioning to `1fr` under `fw-card[data-open]` over 220 ms ease-out. Their inner element has `min-height: 0; overflow: hidden`.
  - The chevron turns 90°.
  - `fw-card[data-open] .fw-dot` runs a 2.4 s halo keyframe.
  - `.fw-link:is(:hover, :focus-visible) { color: var(--ink) }`, and rows get a `color-mix(in srgb, var(--ink) 8%, transparent)` background.
  - All transitions and animations are off under `prefers-reduced-motion: reduce`.

- [ ] **Step 1: Tests.**
  - **Colors:** `inkFor reaches ≥ 4.5:1 on --surface for every hue in both themes` (using the tokens.css surface values).
  - **Card:**
    - `breadcrumb links sit outside the toggle button` (`toggle.querySelector('button, a')` is null; `.fw-card-head > nav.fw-crumbs` has the Angry and Aggressive buttons);
    - `toggle is a button with aria-expanded inside an h2`;
    - `selected → opened on the same word keeps the toggle element and sets data-open`;
    - `opened → selected on the same word keeps the body until another word renders`;
    - `rapid open/close/open leaves data-open and aria-expanded matching the last model` (Review Focus 4);
    - `--ink is set from inks[hue]`;
    - update the existing header, crumb, row and focus tests to `.fw-card-toggle`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test && npm run test:e2e` → PASS. Update `helpers.ts` `head` and any e2e that used `.fw-card-head` as the button.
- [ ] **Step 5:** Commit `feat(ui): breadcrumbs in the card header, animated unfold, pulsing dot, hover colours`.

---

### Task 8: Sprite cache robustness and the Firefox pinch gate

**Files:** Modify `src/render/sprites.ts` and `tests/perf/firefox.spec.ts`. Test `tests/unit/sprites.test.ts`.

**Interfaces:**
```ts
export function createSpriteCache(
  makeCanvas: (w: number, h: number) => HTMLCanvasElement | OffscreenCanvas,
  limit?: number,                           // 600
  font?: (px: number) => string,
  o?: { maxBytes?: number;                  // 16 * 1024 * 1024
        fallback?: (w: number, h: number) => HTMLCanvasElement | OffscreenCanvas }, // default: a <canvas> element
): SpriteCache;
```
- Every render calls `clearRect(0, 0, w, h)` after `setTransform`.
- If `getContext('2d')` returns null, the cache uses `o.fallback` instead of calling `makeCanvas` again.
- Eviction (least recently used first) runs while `size > limit` or the total bytes exceed `maxBytes`.

- [ ] **Step 1: Tests** (`sprites.test.ts`):
  - `a reused pooled canvas is cleared before drawing` (the fake context records `clearRect`);
  - `a canvas without a 2D context falls back to the fallback maker`;
  - `byte cap evicts least-recently-used sprites` (with a tiny `maxBytes`).
  - **Perf:** add `Firefox: pinching the whole wheel keeps frame delta p95 ≤ 20 ms`. In one task, dispatch ctrl+wheel bursts at the wheel's centre, alternating 8 × `deltaY: -30` and 8 × `deltaY: 30` every 120 ms for 6 s, as synthetic `WheelEvent`s (see the ctrl+wheel e2e). Measure with the rAF probe as the existing Firefox tests do.
- [ ] **Step 2:** FAIL (unit).
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test && npm run build && npm run test:perf` → PASS.
- [ ] **Step 5:** Commit `fix(render): sprite cache clears reused canvases, falls back to <canvas>, caps memory; Firefox pinch gate`.

---

### Task 9: Final sweep

**Files:** Modify `tests/e2e/wheel.spec.ts` (axe) and `docs/ROADMAP.md`.

- [ ] **Step 1:** Extend the axe test to run its three states in both `light` and `dark` (`page.emulateMedia({ colorScheme })` before `open`).
- [ ] **Step 2:** `npx tsc --noEmit && npm test && npm run build && npm run size && npm run test:e2e && npm run test:perf` → all PASS.
- [ ] **Step 3:** Run `npm run dev` and look at desktop and a phone-sized window in both themes. Check the unfold, the pulse, hover, the half-wheel intro and opened tiers on each ring.
- [ ] **Step 4:** In `docs/ROADMAP.md`, set v1.2 to "Shipped" and link this plan next to the spec.
- [ ] **Step 5:** Commit `test: axe in both themes; docs: v1.2 shipped`.

---

## Spec coverage

| v1.2 spec § | Task |
|---|---|
| §3.1 starting state, hint, Back | 4 |
| §3.2 half-wheel, intro, device rotation | 5 |
| §3.3 closing keeps rotation | 3 |
| §3.4 pinch thresholds | 3 |
| §3.5 motion | 3 |
| §3.6 keyboard, `stepOut` | 1 |
| §4.1 desktop column and opened camera | 6 |
| §4.2 phone opened camera, card cap | 6 |
| §4.3 portrait rule | 6 |
| §4.4 outline line, chevron room | 2 |
| §5.1–§5.3 card | 7 |
| §5.4 toolbar, theme sync | 1 (theme), 4 (Zoom out) |
| §5.5 strings | 4 |
| §6 accessibility | 1, 4, 7, 9 |
| §7 performance | 8 |
| §10 acceptance | 9 |
