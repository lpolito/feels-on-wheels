# Feelings Wheel v2.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish from using v2: body wheel card headings, a heartbeat dot, a sliding wheel switch ready for a third option, outer labels that stop vanishing, a proper layout for phones turned sideways, and richer body wheel colours.

**Architecture:** Mostly local changes to existing units: locale strings and CSS for the card; `FwWheelSwitch` gains a measured highlight; the renderer's label minimum learns the focused ring; `camera.ts` replaces the half-wheel flag with a resting-view kind that adds the side view; `FwHint`'s link becomes an `<a>`; `buildLayout` gives feeling cells a shade ring, and the eight area tokens are re-saturated.

**Tech Stack:** TypeScript, Vite, Canvas 2D, custom elements, Vitest (happy-dom), Playwright.

**Spec:** `docs/superpowers/specs/2026-11-08-feelings-wheel-v2.1-design.md`

## Global Constraints

- Card headings: `couldBe` = "Could be feeling", `couldAlsoBe` = "Could also be feeling".
- Heartbeat cycle 1.6 s; beats 1.35× (0–6–12%) and 1.2× (18–30–44%); halo 18–60% to 0.55rem from `--dot-hue` at 55%; none with reduced motion.
- Switch highlight slides over 250 ms ease-out; no animation on first render, list change, resize or reduced motion.
- Under 360 px: three switch options fit beside Start over's icon and the theme button at 320 px; buttons keep 44 px min height.
- Label minimums: whole-wheel view 8 px; ring view 12 px for the focused ring and inside it, **10 px for rings outside it**; all × `remPx / 16`.
- Portrait layout iff `height ≥ width` or (`width < 720` and `height ≥ 480`), measured on `#app`. Side view at rest iff not portrait and `#app` height `< 480`.
- A feeling cell whose parent isn't a feeling is shaded as ring 0 (`RING_SHIFT[0]` = −0.07).
- Area tokens = v2 values × 1.2 OKLab chroma (values in Task 6). Guard: every area's ring-0 fill ≥ 0.055 OKLab ΔE from every feeling fill at every ring, per theme.
- Commit messages carry no AI attribution trailer.

## Review Focus

1. **Turning the phone** between portrait (half-wheel) and sideways (side view), with nothing selected and with a word opened: the camera should land on the new resting view or the opened word's ring view, never keep the old view's scale. Test in Task 4.
2. **Pressing switch options quickly**, before the slide ends: the highlight must end under the last pressed button. Test in Task 2.
3. **The message link from the keyboard and with modifier keys:** Enter switches in place like a click; Cmd/Ctrl/Shift-click and middle-click are left to the browser. Test in Task 5.
4. **Forced colours (Windows high contrast):** the pressed switch option must still be visibly different once its fill moves to the highlight. Test in Task 2.
5. **An iPhone SE turned sideways with a word opened:** the card sits in the column without covering the wheel, and the opened word isn't under the switch. Test in Task 4.

---

### Task 1: Card headings and the heartbeat

**Files:**
- Modify: `src/data/locales/en.json` (`ui.couldBe`, `ui.couldAlsoBe`)
- Modify: `src/styles/app.css` (replace `@keyframes fw-halo` and its rule, ~lines 248–256)
- Test: `tests/unit/card.test.ts`, `tests/e2e/body.spec.ts`, `tests/e2e/wheel.spec.ts`

**Interfaces:** none new.

- [ ] **Step 1: Update the failing tests.** In `tests/unit/card.test.ts` change the expected headings at lines 71, 85, 457 and 474 to `'Could be feeling'` / `'Could also be feeling'`; in `tests/e2e/body.spec.ts` lines 153 and 159 the same. Add to `card.test.ts`: `test('the feelings wheel keeps Narrow it down and Close to')`, asserting an opened middle feeling on the core wheel has a `'Narrow it down'` section and an opened outer feeling a `'Close to'` section.
- [ ] **Step 2: Run** `npx vitest run tests/unit/card.test.ts`. Expected: the renamed headings FAIL.
- [ ] **Step 3: Change the two locale strings.**
- [ ] **Step 4: Run** `npx vitest run tests/unit/card.test.ts`. Expected: PASS.
- [ ] **Step 5: Write the heartbeat e2e test** in `tests/e2e/wheel.spec.ts`: `test('the opened dot beats, and is still with reduced motion')`: open `#/core/happy`, expect `.fw-dot`'s `getAnimations()` to include an animation named `fw-heartbeat` with duration 1600; then `page.emulateMedia({ reducedMotion: 'reduce' })`, reload, expect no animations on `.fw-dot`.
- [ ] **Step 6: Replace `fw-halo` with `@keyframes fw-heartbeat`** using the spec §3.2 table (`scale` for the beats, `box-shadow` for the halo) and `fw-card[data-open] .fw-dot { animation: fw-heartbeat 1.6s infinite; }`. Set the timing per keyframe: `ease-out` into each peak, `ease-in` back to 1× after the first beat, and `cubic-bezier(0.3, 0, 0.2, 1)` for the second beat's rise and fall, so it reads slower. Keep the reduced-motion rule (it names the selector, not the keyframes).
- [ ] **Step 7: Run** `npm run test:e2e -- tests/e2e/wheel.spec.ts -g "dot beats" --project=chromium`. Expected: PASS.
- [ ] **Step 8: Commit** `feat(card): body wheel headings say "feeling"; the dot beats like a heart`.

### Task 2: The sliding wheel switch, ready for three

**Files:**
- Modify: `src/ui/wheel-switch.ts`, `src/styles/app.css` (the `fw-wheel-switch` rules), `src/data/types.ts` (`WheelText`), `src/data/load.ts:74`, `src/main.ts:53`
- Test: `tests/unit/wheel-switch.test.ts`, `tests/unit/data.test.ts`, `tests/e2e/body.spec.ts`

**Interfaces:**
- Produces: `FwWheelSwitch.wheels: { id: string; label: string; name?: string }[]`; `WheelText.switchName?: string`. The highlight is `span.fw-switch-thumb[aria-hidden="true"]`, the switch's first child.

- [ ] **Step 1: Write failing unit tests** in `wheel-switch.test.ts`:
  - `test('three wheels: text and accessible names')`: wheels `[{id:'core',label:'Feelings'},{id:'body',label:'Body'},{id:'emoji',label:'🙂',name:'Emoji'}]`; button texts `['Feelings','Body','🙂']`; the third has `aria-label="Emoji"`, the first two have no `aria-label`.
  - `test('the highlight is one aria-hidden span before the buttons')`: the first child is `.fw-switch-thumb` with `aria-hidden="true"`; it survives `current` changes and is still the only one after `wheels` is set twice.
  - In `data.test.ts`: `validateLocale` accepts a wheel text with `switchName`, and rejects `switchName: ''` with `'switchName'` in the message.
- [ ] **Step 2: Run** `npx vitest run tests/unit/wheel-switch.test.ts tests/unit/data.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - `WheelText` gets `switchName?: string`; `validateLocale` fails on a present but empty `switchName`.
  - `main.ts:53` passes `name: wheelText(w.id).switchName`.
  - `FwWheelSwitch`: `#thumb` span created once; `wheels` re-renders as `[thumb, ...buttons]`, setting `aria-label` only when `name` is given; `#place(animate: boolean)` sets the thumb's `translate` to the pressed button's `offsetLeft` and its `width` to its `offsetWidth`.
  - Without animation it sets `data-instant` on the switch, places, forces a reflow, then removes `data-instant` on the next frame.
  - `current` places with animation unless it's the first placement; `wheels` and a `ResizeObserver` (connected in `connectedCallback`, disconnected in `disconnectedCallback`) place without.
- [ ] **Step 4: CSS.**
  - The switch gets `position: relative; isolation: isolate`.
  - The thumb: `position: absolute; inset-block: 3px; left: 0; z-index: -1; border-radius: 999px; background: var(--fg); transition: translate 250ms ease-out, width 250ms ease-out`.
  - Buttons: `background: transparent`. The pressed one keeps `color: var(--bg); font-weight: 600`, and every button gets `transition: color 250ms ease-out`.
  - `fw-wheel-switch[data-instant] :is(.fw-switch-thumb, button)` and `prefers-reduced-motion: reduce` both get `transition: none`.
  - Forced colours: the thumb is `background: Highlight; forced-color-adjust: none`; the pressed button is `color: HighlightText; forced-color-adjust: none`.
  - `@media (max-width: 359.98px)`: switch buttons `padding: 0 0.6rem`; `fw-toolbar` `gap: 0.35rem`; switch and toolbar inset `max(0.75rem, env(safe-area-inset-*))`.
- [ ] **Step 5: Run** the unit tests from Step 2. Expected: PASS.
- [ ] **Step 6: Write the e2e tests** in `body.spec.ts` (skip on `isMobile`):
  - `test('the switch highlight slides under the pressed button')`: press Body, wait `settled`, the thumb's bounding box equals Body's within 1 px (x and width).
  - `test('quick presses end under the last pressed button')` (Review Focus 2): press Body, then Feelings with no wait, then wait `settled`; the thumb's box equals Feelings's within 1 px.
  - `test('no slide with reduced motion')`: emulate reduced motion, press Body; immediately the thumb has no running `CSSTransition` and its box already matches Body's.
  - `test('forced colours: the pressed option stands out')` (Review Focus 4): `emulateMedia({ forcedColors: 'active' })`; the thumb's computed background differs from the switch's own computed background, and the pressed button's computed `color` differs from the other button's.
  - `test('three options fit at 320 px')`: viewport 320×568; tap any segment so Start over shows; in `page.evaluate`, set the switch's `wheels` to three entries (third `{ id: 'emoji', label: '🙂', name: 'Emoji' }`) and its `current` to `'core'`; the switch's right edge ≤ the toolbar's left edge, the toolbar's right edge ≤ 320, and every switch button is ≥ 44 px tall.
- [ ] **Step 7: Run** `npm run test:e2e -- tests/e2e/body.spec.ts --project=chromium --project=webkit`. Expected: PASS.
- [ ] **Step 8: Commit** `feat(ui): the wheel switch slides, and takes a short label with a spoken name`.

### Task 3: Smaller labels on context rings

**Files:**
- Modify: `src/render/wheel.ts` (`Frame`, `stats`, the label loop ~line 205), `src/main.ts` (`frame()`, the test hook), `tests/fw-window.d.ts`
- Test: `tests/unit/wheel-render.test.ts`, `tests/e2e/body.spec.ts`

**Interfaces:**
- Produces: `Frame.ring: number | null` (the view ring in ring mode, else null); `WheelRenderer.stats.labelsByRing: number[]` (labels drawn per ring, reset each draw); `window.__fw.labelsByRing(): number[]`.

- [ ] **Step 1: Write failing unit tests** in `wheel-render.test.ts` (each draws with the fake canvas; read the px out of `rec.fonts`):
  - `test('ring view: 12 px floor on the focused ring and inside it, 10 px outside it')`: draw with `mode: 'ring', ring: 0` on a camera where the outer ring's fitted size is between 10 and 12 px. Use `ringFocusCamera(layout, 0, { width: 393, height: 851, radius: 188.5 }, 0, …)` on the **body** layout. Assert that outer-ring labels are drawn (`stats.labelsByRing[2] > 0`), none of them is below 10 px, and no ring-0 label is below 12 px.
  - `test('the floors scale with remPx')`: the same frame with `remPx: 20` draws no outer label below 12.5 px.
  - `test('whole-wheel view keeps 8 px for every ring')`: the existing overview test, asserting `labelsByRing` sums to `labelsDrawn`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/wheel-render.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** `minPx` becomes per segment: `8·k` in wheel mode; in ring mode `(f.ring !== null && s.ring > f.ring ? 10 : 12)·k`. Increment `stats.labelsByRing[s.ring]` wherever a label is drawn (including the opened one). `main.ts` passes `ring: s.view.mode === 'ring' ? s.view.ring : null` and exposes `labelsByRing: () => renderer.stats.labelsByRing.slice()`. Add it to `fw-window.d.ts`.
- [ ] **Step 4: Run** `npx vitest run tests/unit/wheel-render.test.ts`. Expected: PASS.
- [ ] **Step 5: Write the e2e test** in `body.spec.ts`: `test('portrait phone, Head and eyes opened: the outer ring has labels')`: viewport 393×851 (skip `isMobile`), `open(page, '#/body/head')`, `labelsByRing()[2] > 0`.
- [ ] **Step 6: Run** it on chromium. Expected: PASS.
- [ ] **Step 7: Commit** `feat(render): rings outside the focused one draw labels down to 10px`.

### Task 4: Phones turned sideways: the rule and the side view

**Files:**
- Modify: `src/camera.ts` (`CameraOpts`, `wheelCamera`, new `isPortrait`, `restView`), `src/controller.ts` (lines 19, 64–76, 265, 273–300), `src/main.ts` (`measure()`, line 349), `src/styles/app.css` (the container query, ~line 333)
- Test: `tests/unit/camera.test.ts`, `tests/unit/controller.test.ts`, `tests/e2e/wheel.spec.ts`

**Interfaces:**
- Produces:
  - `type RestView = 'whole' | 'half' | 'side'`
  - `CameraOpts.rest: RestView` (replaces `half`)
  - `isPortrait(app: { width: number; height: number }): boolean`
  - `restView(layout: Layout, vp: Viewport, app: { width: number; height: number }): RestView`
  - `wheelCamera(layout: Layout, vp: Viewport, rotation: number, o: CameraOpts): Camera`
- `useHalfWheel` and `halfRestRotation` stay.

- [ ] **Step 1: Write failing unit tests** in `camera.test.ts`:
  - `test('isPortrait')`: true for 393×851, 600×500 and 700×700; false for 851×393, 667×375 and 1280×800.
  - `test('restView')`: 393×851 on core → `'half'`; stage 511×393 with app 851×393 → `'side'`; stage 400×375 with app 667×375 → `'side'`; stage 800×800 with app 1280×800 → `'whole'`, on both core and body layouts.
  - `test('the side view is the core ring view, Fearful at 3 o\'clock')`: `wheelCamera(layout, vp, r, { …, portrait: false, rest: 'side' })` equals `ringFocusCamera(layout, 0, vp, r, { …, portrait: false, openedY: null })`.
  - Update every existing `half: true/false` option to `rest: 'half'/'whole'`, and every `wheelCamera(vp, …)` call to the new signature.
- [ ] **Step 2: Write failing controller tests** in `controller.test.ts`, in a new `describe('side view (sideways phone)')` with `vp = { width: 511, height: 393, radius: 188.5 }` and `rest: 'side'`, `portrait: false`:
  - starts on the side view with Fearful at 3 o'clock;
  - `playIntro` only spins;
  - a tap selects without moving the camera;
  - closing an opened word lands on the side view;
  - Review Focus 1: `setViewport` from the phone's half-wheel to the side view with nothing selected jumps to the side camera; with a word opened it jumps to that ring's `ringFocusCamera` for the sideways opts; and back to portrait lands on the half-wheel.
- [ ] **Step 3: Run** `npx vitest run tests/unit/camera.test.ts tests/unit/controller.test.ts`. Expected: FAIL.
- [ ] **Step 4: Implement.**
  - `wheelCamera` per `o.rest`: `'whole'` is `overviewCamera`; `'half'` is today's half-wheel; `'side'` is `ringFocusCamera(layout, 0, vp, rotation, { ...o, openedY: null })`.
  - `restView` returns `'half'` when `isPortrait(app) && useHalfWheel(layout, vp)`, `'side'` when `!isPortrait(app) && app.height < 480`, and `'whole'` otherwise.
  - In the controller, replace `opts.half` with `opts.rest !== 'whole'` (start rotation, `playIntro`) and `o.rest === opts.rest` (the `setViewport` comparison).
  - `measure()` uses `isPortrait(whole)` and `rest: restView(layout, vp, whole)`.
  - `main.ts:349` plays the intro when `opts.rest !== 'whole'`.
- [ ] **Step 5: Change the container query** to `@container app (orientation: portrait) or ((max-width: 719.98px) and (min-height: 480px))`, and update its comment to cite spec v2.1 §6.1.
- [ ] **Step 6: Run** `npx vitest run`. Expected: all PASS.
- [ ] **Step 7: Write e2e tests** in `wheel.spec.ts` (skip `isMobile`), for each of 851×393 and 667×375, on `#/` and `#/body`:
  - `test('sideways phone at rest: the side view, labels on every ring, message beside the wheel')`:
    - `state().view.mode === 'wheel'`;
    - `camera().scale > 1.5`;
    - every entry of `labelsByRing()` > 0;
    - `fw-hint`'s box left ≥ `#stage`'s box right.
  - `test('iPhone SE sideways, word opened: the card is in the column and the word is clear of the switch')` (Review Focus 5): 667×375, `open(page, '#/core/happy/joyful')`:
    - `fw-card`'s left ≥ `#stage`'s right;
    - the opened word's `segmentScreenPoint` is below `fw-wheel-switch`'s bottom or right of its right edge.
- [ ] **Step 8: Run** `npm run test:e2e -- tests/e2e/wheel.spec.ts --project=chromium --project=webkit`. Expected: PASS.
- [ ] **Step 9: Commit** `feat: phones turned sideways rest on the zoomed side view; iPhone SE sideways gets the sideways layout`.

### Task 5: The message's link wraps like text

**Files:**
- Modify: `src/ui/hint.ts`, `src/main.ts:208-212`, `src/styles/app.css` (`.fw-hint-link`)
- Test: `tests/unit/hint.test.ts`, `tests/e2e/body.spec.ts`

**Interfaces:**
- Produces: `HintContent = { text: string; link?: { label: string; wheel: string; href: string } } | null`.

- [ ] **Step 1: Write failing unit tests** in `hint.test.ts` (add `href: '#/body'` to `content`):
  - `test('the link is an <a> with the other wheel\'s href')`.
  - `test('a plain click dispatches fw-wheel and prevents navigation')`: dispatch a `MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })` and expect `defaultPrevented` plus one `{ wheel: 'body' }` event.
  - `test('a modified click is left to the browser')` (Review Focus 3): for each of `metaKey`, `ctrlKey`, `shiftKey`, `altKey` and `button: 1`, expect no event and `defaultPrevented === false`.
  - Update the existing "renders text around a link button" test to expect an `<a>`. `same()` compares `href` too.
- [ ] **Step 2: Run** `npx vitest run tests/unit/hint.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
  - The link is an `<a class="fw-hint-link" href>`.
  - Its click handler returns early on `e.button !== 0` or any modifier; otherwise it calls `preventDefault()` and dispatches `fw-wheel`.
  - `hintContent` sets `href` to `#/<wheel>` for a wheel other than the first, and to `location.pathname + location.search` for the first.
  - In CSS, drop the button-only properties from `.fw-hint-link` (`padding`, `border`, `background`, `font`, `text-align`) and keep `color: inherit` and the underline.
- [ ] **Step 4: Run** `npx vitest run tests/unit/hint.test.ts`. Expected: PASS.
- [ ] **Step 5: Write e2e tests** in `body.spec.ts`:
  - `test('Enter on the message link switches in place')` (Review Focus 3): focus the link, press Enter, `wheel()` is `'body'`, history length grew by one.
  - `test('the link wraps with the sentence')`: viewport 851×393. The link's `getClientRects()` has more than one rect (it breaks across lines), and the full stop is on the same line as the link's last rect: the hint's last text node's range rect `top` equals the link's last rect's `top` within 2 px.
- [ ] **Step 6: Run** `npm run test:e2e -- tests/e2e/body.spec.ts --project=chromium --project=webkit --project=firefox`. Expected: PASS.
- [ ] **Step 7: Commit** `fix(ui): the message's link is a real link, so it wraps with the sentence`.

### Task 6: Body wheel colours

**Files:**
- Modify: `src/model/layout.ts` (`Segment`, `buildLayout`), `src/render/wheel.ts` (the four `table.fill`/`table.label` calls at ~230–237, 270, 306, plus the opened label), `src/styles/tokens.css` (the area tokens in all three blocks)
- Test: `tests/unit/layout.test.ts`, `tests/unit/colors.test.ts`, `tests/unit/wheel-render.test.ts`

**Interfaces:**
- Produces: `Segment.shadeRing: number`. It is 0 when `node.kind === 'feeling'` and the parent's `node.kind !== 'feeling'`, and `ring` otherwise.

- [ ] **Step 1: Write failing tests:**
  - `layout.test.ts`: `test('shadeRing: body outer feelings shade as the core ring; feelings wheel cells shade as their own ring')`.
  - `wheel-render.test.ts`: `test('a body outer cell is filled with the ring-0 shade of its hue')`. Overview of the body layout; the fill recorded for a known outer cell equals `table.fill(hue, 0, true)`.
  - `colors.test.ts`: `test('every area core-ring fill is ≥ 0.055 OKLab from every feeling fill at every ring')`. Per theme, compare `shade(fitWhite(area), -0.07)` against `shade(fitWhite(feeling), s)` for `s` in `[-0.07, -0.035, 0]`. Reuse the file's `oklab`/`dist` helpers.
- [ ] **Step 2: Run** `npx vitest run tests/unit/layout.test.ts tests/unit/wheel-render.test.ts tests/unit/colors.test.ts`. Expected: the shadeRing and fill tests FAIL. The distance test may already pass on v2's values; that's fine, it's a guard.
- [ ] **Step 3: Implement `shadeRing`** in `buildLayout`. The renderer passes `s.shadeRing` where it passes `s.ring` to `table.fill` and `table.label`. Label sizes stay keyed on `s.ring`.
- [ ] **Step 4: Replace the area tokens.** Use the same light values in `:root`, and the same dark values in both dark blocks. Add a comment above each group: `/* v2.1: the v2 values at 1.2× OKLab chroma, same L and hue (spec v2.1 §7.2); stomach (light) was already at the sRGB edge. */`

| Token | Light | Dark |
|---|---|---|
| `--hue-head` | `#821538` | `#B0435E` |
| `--hue-face` | `#604016` | `#89683E` |
| `--hue-chest` | `#7E7406` | `#AA9F2A` |
| `--hue-breath` | `#29727C` | `#569CA6` |
| `--hue-stomach` | `#0179A3` | `#1FA6DB` |
| `--hue-arms` | `#51618D` | `#798BB8` |
| `--hue-whole-body` | `#83327B` | `#B05BA6` |
| `--hue-posture` | `#7B4D65` | `#A7758E` |

- [ ] **Step 5: Run** `npx vitest run`. Expected: all PASS, including the existing contrast and area-distinctness tests.
- [ ] **Step 6: Put the swatches in front of Lucas.** Push a visual companion screen with the dark and light body wheels drawn from the new tokens through `buildFillTable`. Lucas asked for the work to run through without stopping, so this doesn't block; any change he asks for later is a token edit plus Step 5.
- [ ] **Step 7: Commit** `feat(colors): body wheel feelings take the core shade; areas 1.2x richer`.

### Task 7: The viewport sweep

Lucas's ask: existing desktop and phone views mustn't break, and every odd viewport is accounted for. One parametrised test pins layout invariants across a matrix, at rest and with a word opened, on both wheels.

**Files:**
- Create: `tests/e2e/viewports.spec.ts`

- [ ] **Step 1: Write the sweep.** Run it on chromium only (`test.skip(browserName !== 'chromium')`); the other projects already cover engines.

The matrix (width × height):

| Group | Sizes |
|---|---|
| Portrait phones | 320×568, 360×640, 375×667, 390×844, 393×851, 430×932 |
| Sideways phones | 568×320, 640×360, 667×375, 740×360, 844×390, 851×393, 896×414, 932×430 |
| Tablets | 768×1024, 1024×768, 820×1180, 1180×820 |
| Desktops | 1280×800, 1440×900, 1920×1080 |
| Edges of the rules | 600×500, 700×700, 719×480, 720×479, 1000×400, 500×300 |

For each size, for `#/` and `#/body`, at rest:
- `fw-wheel-switch` and `fw-toolbar` don't overlap, and both lie inside the viewport.
- `fw-hint` lies inside the viewport.
- `labelsByRing()[0] > 0`.
- The layout matches the rule:
  - portrait (spec §6.1) means `#stage` is as wide as `#app`;
  - otherwise `fw-hint`'s left ≥ `#stage`'s right.
- `state().view.mode === 'wheel'`.
- `camera()` is the side view exactly when not portrait and height < 480; check it with `scale > 1.5`, and `scale ≤ 1.5` otherwise on non-portrait sizes.

For each size, opened (`#/core/happy/joyful` and `#/body/head/headache`):
- `fw-card` lies inside the viewport.
- The opened word's `segmentScreenPoint` is inside `#stage`, outside `fw-card`'s box, and outside `fw-wheel-switch`'s and `fw-toolbar`'s boxes.

- [ ] **Step 2: Run** `npm run test:e2e -- tests/e2e/viewports.spec.ts --project=chromium`. Expected: PASS. A failure is a real layout bug at that size: fix it in the task that owns the code, or, if it was already broken on main, record it under Known issues and in the final report.
- [ ] **Step 3: Commit** `test: a viewport sweep pins layout invariants from 320px phones to 1920px desktops`.

### Task 8: Whole-branch check and docs

**Files:**
- Modify: `docs/ROADMAP.md`

- [ ] **Step 1: Run** `npm run build && npm test && npm run size && npm run test:e2e`. Expected: everything passes, and the size check stays under its budget.
- [ ] **Step 2: Run axe** on the new states: add `test('axe: sideways side view and the three-option switch')` to `wheel.spec.ts` (851×393, at rest and with a word opened). Expected: no violations.
- [ ] **Step 3: Update the roadmap.**
  - The v2.1 row becomes "Shipped".
  - Under Known issues, add: "**Portrait phones, inner tier opened:** the outer ring runs past the right edge, so some outer labels are cut off at the edge (v2.1 §1, out of scope)."
- [ ] **Step 4: Commit** `test: v2.1 end to end; docs: v2.1 shipped`.
