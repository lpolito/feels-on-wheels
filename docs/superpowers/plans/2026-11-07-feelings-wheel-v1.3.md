# Feelings Wheel v1.3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the layout, the card and the controls after using v1.2:
- the message fills the card's place whenever nothing is selected;
- "Start over" replaces "Zoom out";
- pinching in on the opened word does nothing;
- taps beside the card dismiss, and the grab cursor shows only over the wheel;
- the card header is realigned, with a sticky dot-and-name row;
- the theme picker becomes an icon toggle;
- on phones, the opened word is centred above the unfolded card.

**Architecture:** Same layers as v1.2. State first (Task 1), then the small rules (2–3), the toolbar (4–5), the message (6), the card (7) and the phone camera that depends on the card's measured height (8), then a final sweep (9).

**Tech Stack:** unchanged. Vite 8.3.6, TypeScript 7.0.2, Vitest 5.1.0 with happy-dom 21.0.4, Playwright 1.65.0 with @axe-core/playwright 4.14.0.

**Spec:** `docs/superpowers/specs/2026-11-07-feelings-wheel-v1.3-design.md`. It builds on v1.2 and the post-v1.2 decisions in `docs/ROADMAP.md`. Read v1.3 §3–§6 before starting.

## Global Constraints

**Carried over:**
- no runtime dependencies, no framework, no shadow DOM;
- every string through `t()`;
- WCAG 2.2 AA; reduced motion honoured;
- storage access in try/catch;
- size budgets: app JS ≤ 25 KB gzipped, first load ≤ 60 KB gzipped;
- commits straight to `main`, with no `Co-Authored-By` or AI trailer.

**Do not undo (from v1.1 and v1.2):**
- labels go through `src/render/sprites.ts`, except the opened label and forced colours;
- `camera.ts` `tick()` keeps `last` at the frame's timestamp;
- `main.ts` awaits `load` when `--bg` is empty, before `measure()`;
- `controller.ts`: only user spins dispatch `settled`; a double-tap uses `lastTapHit`; a tap on a moving wheel only stops it;
- `+`, `=`, `−` only work with focus on the wheel (`route.ts`, `CHARACTER_KEYS`);
- Firefox ctrl+wheel bursts in e2e are synthetic `WheelEvent`s in one `page.evaluate`.

**Strings** (`en.json` `ui`):
- added: `startOver` = "Start over", `themeButton` = "Theme: {choice}";
- changed: `themeSystem` = "Match system";
- removed: `zoomOut`, `theme`.

**Values:**
- message/card swap fade: 150 ms (fade-in only, `@starting-style`);
- theme label: shown 1500 ms after a tap, then a 300 ms fade;
- card left edge: 1.1rem (`--edge`), shared by the first breadcrumb, the dot and the body text, and by the message panel's text;
- dot-to-name gap: 1.5rem;
- phone card cap: `min(55dvh − 12px − safe-bottom, 100dvh − 2 × var(--opened-half) − 36px − safe-top − safe-bottom)`.

## Review Focus

1. **Phone: moving between opened words with different card heights** (a core word, then one of its rows). The word re-centres in the new gap, as one spring motion; it never sits in the first card's gap. Test in Task 8.
2. **Phone: resizing or turning while a word is opened.** The gap is re-measured for the new viewport, and the word stays centred above the card. Test in Task 8.
3. **Desktop: clicks in the column that are not on empty space.** Clicks on the message panel, the card, the toolbar or the theme label never close or clear; a click on empty column space with nothing selected does nothing. Test in Task 6.
4. **Theme toggle tapped quickly several times.** The theme ends on the last choice, the label names the last choice, and its 1.5 s timer restarts on each tap. Test in Task 5.
5. **A scrolled card switching to another word** (a link or a spin while scrolled down). The new word's card starts at the top, with its breadcrumbs showing. Test in Task 7.

---

## File Map

| File | Change | Task |
|---|---|---|
| `src/state/store.ts`, `src/state/url.ts`, `src/controller.ts`, `src/main.ts` | Remove `hinted` and `dismissHint`; the message rule | 1 |
| `src/model/pinch.ts` | Pinch in on the opened word does nothing | 2 |
| `src/model/geometry.ts`, `src/main.ts`, `src/styles/app.css` | `overDisc`, the canvas cursor, taps on empty column space | 3 |
| `src/ui/toolbar.ts`, `src/data/locales/en.json`, `src/styles/app.css` | "Start over" | 4 |
| `src/ui/theme.ts`, `src/ui/toolbar.ts`, `src/main.ts`, `src/data/locales/en.json`, `src/styles/app.css` | Theme toggle, label, announcement | 5 |
| `src/ui/hint.ts`, `src/styles/app.css` | The message panel; swap fade | 6 |
| `src/ui/card.ts`, `src/styles/app.css` | Header alignment, sticky row, scroll padding, scroll reset | 7 |
| `src/camera.ts`, `src/controller.ts`, `src/main.ts`, `src/styles/app.css` | Phone opened word above the measured card; card cap | 8 |
| `tests/e2e/wheel.spec.ts`, `docs/ROADMAP.md` | Axe states, gates, roadmap | 9 |

---

### Task 1: The message shows exactly when nothing is selected

**Files:**
- Modify:
  - `src/state/store.ts`: remove `State.hinted`, the `dismissHint` action and the hint-clearing line in `reduce`;
  - `src/state/url.ts`: `fromHash` no longer sets `hinted`;
  - `src/controller.ts`: remove `dismissHint()` and its two calls;
  - `src/main.ts`: `hintText`, and the popstate `restore` no longer merges `hinted`.
- Tests: `tests/unit/store.test.ts`, `url.test.ts`, `history.test.ts`, `a11y.test.ts`, `card.test.ts`, `pinch.test.ts`, `controller.test.ts`; `tests/fw-window.d.ts`; `tests/e2e/wheel.spec.ts`.

**Interfaces:**
- Produces: `State` is `{ selected: number | null; opened: boolean; view: View }`. `Action` has no `dismissHint`. `initialState` is `{ selected: null, opened: false, view: { mode: 'wheel' } }`.
- `main.ts`: `hintText(s) = s.selected === null ? t('hint') : null`.

- [ ] **Step 1: Tests.**
  - `store.test.ts`:
    - `initial state` expects the three-field `initialState`;
    - remove `every user action clears hinted…` and `dismissHint twice is a no-op…`;
    - remove `hinted` from every state literal and from the reachable-states walk's action list;
    - `stepOut while only selected is a no-op` asserts `reduce(...)` returns the same object.
  - `controller.test.ts`: `pinch in over the hole with nothing selected changes nothing and springs back` expects no actions (`[]`, not `['dismissHint']`).
  - Every other unit test: drop `hinted` from state literals.
  - **E2E:**
    - replace `phone: first drag hides the hint and keeps the URL` with `phone: spinning keeps the message`: the message is still visible after the drag, and the URL is empty;
    - add `the message comes back when the selection is cleared` (desktop): tap Angry, the message is hidden and the card shows; press Escape; the message is visible and the card is hidden.
- [ ] **Step 2:** `npx tsc --noEmit` → errors where `hinted` is still used; `npx vitest run` → FAIL.
- [ ] **Step 3:** Implement. `historyOp` and `announceFor` need no change.
- [ ] **Step 4:** `npx tsc --noEmit && npm test` → PASS. Then `npm run test:e2e -- -g "message|hint"` → PASS.
- [ ] **Step 5:** Commit `feat: the message shows whenever nothing is selected`.

---

### Task 2: Pinching in on the opened word does nothing

**Files:** Modify `src/model/pinch.ts`. Test `tests/unit/pinch.test.ts`, `tests/unit/controller.test.ts`.

**Interfaces:** `resolvePinch(layout, s, ratio, hit)`: when `ratio > PINCH_IN && s.opened && hit === s.selected`, it returns `null` (was `toChild`). Nothing else changes.

- [ ] **Step 1: Tests.**
  - `pinch.test.ts`:
    - replace `pinch in on the opened word goes to its centre child` and `pinch in on an opened leaf yields toChild…` with `pinch in on the opened word does nothing`, for `angry`, `angry/aggressive` and `angry/aggressive/hostile`;
    - add `pinch in on a child of the opened word opens that child`: opened `angry`, hit `angry/aggressive`, returns `open angry/aggressive`.
  - `controller.test.ts`: replace `pinch in on an opened leaf leaves it opened and centred` with `pinch in on the opened word leaves it opened and centred`, for `angry/aggressive` (a middle word, which used to drill down).
- [ ] **Step 2:** `npx vitest run tests/unit/pinch.test.ts tests/unit/controller.test.ts` → FAIL.
- [ ] **Step 3:** Implement. Update the doc comment (v1.3 §3.3).
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** Commit `feat: pinching in on the opened word does nothing`.

---

### Task 3: Grab cursor over the disc; taps beside the card dismiss

**Files:**
- Modify:
  - `src/model/geometry.ts`: add `overDisc`;
  - `src/main.ts`: a `pointermove` listener on the canvas sets the cursor class; a `click` listener on `#app` handles empty column space;
  - `src/styles/app.css`: `#wheel` loses `cursor: grab`; `#wheel.fw-over-disc { cursor: grab }`; `#wheel:active` keeps `grabbing`.
- Tests: `tests/unit/geometry.test.ts`, `tests/e2e/wheel.spec.ts`.

**Interfaces:**
```ts
/** The point (canvas CSS px) is within the wheel's outer edge, the centre hole included. */
export function overDisc(cam: Camera, vp: Viewport, x: number, y: number): boolean;
```
- The disc's radius is `vp.radius * cam.scale` (the outer ring's outer edge is 1.0).
- Cursor: on `pointermove` with `pointerType === 'mouse'`, toggle `fw-over-disc` on the canvas from `overDisc(camera.current, vp, e.offsetX, e.offsetY)`. On `pointerleave`, remove it.
- Empty column space: a `click` on `#app` whose `target` is `#app` or `#float` itself dispatches `close` when opened, or `clear` when a word is selected. Otherwise it does nothing.

- [ ] **Step 1: Tests.**
  - `geometry.test.ts`: `overDisc is true inside the outer edge and in the hole, false outside`. With an overview camera at the centre of `{ width: 1000, height: 1000, radius: 492 }`, check:
    - the centre → true;
    - (cx + 491, cy) → true;
    - (cx + 493, cy) → false;
    - a corner → false.
  - **E2E (desktop):**
    - `the grab cursor shows only over the wheel`: move the mouse over Angry, and the canvas's computed `cursor` is `grab`; move it to the canvas's top-left corner, and it's `auto`.
    - `clicking empty space above the card closes, then clears`: open `#/core/angry`; click at the column's horizontal centre, 20 px below the toolbar's bottom; `opened` is false and Angry is still selected. Click there again; `selected` is null.
    - Review Focus 3, `clicks on the card, the message or the toolbar never dismiss`. Open `#/core/angry`, click the card's definition text, and it stays opened. Press Escape twice; with nothing selected, click the message panel and then empty column space; the state stays `initialState`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test && npm run test:e2e -- -g "grab cursor|empty space|never dismiss"` → PASS.
- [ ] **Step 5:** Commit `feat: grab cursor only over the wheel; taps beside the card dismiss`.

---

### Task 4: "Start over"

**Files:**
- Modify:
  - `src/ui/toolbar.ts`: the "Zoom out" button becomes "Start over";
  - `src/main.ts`: `renderUi` sets `toolbar.selected`;
  - `src/data/locales/en.json`: add `startOver`, remove `zoomOut`;
  - `src/styles/app.css`: `.fw-zoom-out` → `.fw-start-over`, with an icon gap.
- Tests: `tests/unit/card.test.ts` (the toolbar tests), `tests/e2e/wheel.spec.ts`.

**Interfaces:**
- `FwToolbar`:
  - `set selected(v: boolean)` replaces `set opened`.
  - The button is `button.fw-start-over`: an `aria-hidden` circular-arrow SVG, then the text `t('startOver')`. It is hidden unless `selected`.
  - A click emits `fw-action` `{ type: 'clear' }`, then `fw-focus-lost`.
  - Hiding the button while it has focus emits `fw-focus-lost` (as v1.2's follow-up did).

- [ ] **Step 1: Tests.**
  - `card.test.ts`:
    - rename and rewrite the toolbar tests to `toolbar shows Start over only when something is selected, emits clear then fw-focus-lost`;
    - `hiding Start over while it has focus emits fw-focus-lost`.
  - **E2E:**
    - every "Zoom out" button lookup becomes "Start over";
    - `close keeps the rotation` closes with the card's toggle (`head(page).click()`), not the toolbar, and still expects Sad to stay selected;
    - `Enter/Space on a focused Start over…` and `Escape on a focused…`: after the key, `selected` is null, and focus is on the tree item with `tabindex="0"`;
    - add `Start over from an opened word clears it, and Back returns to the word`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npx tsc --noEmit && npm test && npm run test:e2e` → PASS.
- [ ] **Step 5:** Commit `feat: Start over replaces Zoom out`.

---

### Task 5: Theme toggle

**Files:**
- Modify:
  - `src/ui/theme.ts`: add `nextTheme`;
  - `src/ui/toolbar.ts`: the `<select>` becomes a toggle button and its label;
  - `src/main.ts`: the `fw-theme` listener announces the choice;
  - `src/data/locales/en.json`: add `themeButton`, change `themeSystem`, remove `theme`;
  - `src/styles/app.css`: the round icon button and the label.
- Tests: `tests/unit/theme.test.ts`, `tests/unit/card.test.ts` (the toolbar tests), `tests/e2e/wheel.spec.ts`.

**Interfaces:**
```ts
/** System → Light → Dark → System (spec v1.3 §6.2). */
export function nextTheme(p: ThemePref): ThemePref;
/** The choice's display name: t('themeSystem' | 'themeLight' | 'themeDark'). */
export function themeName(p: ThemePref): string;
```
- **The button:**
  - `button.fw-theme-toggle`, 44 × 44 px, holding three `aria-hidden` SVG icons: half-filled circle (System), sun (Light), moon (Dark). Only the current one shows (`hidden` on the others).
  - `aria-label = t('themeButton', { choice: themeName(theme) })`.
  - A click emits `fw-theme` with `nextTheme(theme)`.
- **The label:**
  - `span.fw-theme-label[aria-hidden="true"]`, under the button, holding `themeName(theme)`.
  - After each click it gets `data-show` for 1500 ms; a click restarts that timer. When `data-show` goes, CSS fades it out over 300 ms.
  - It also shows while the button is `:hover` or `:focus-visible`.
  - Under reduced motion there's no fade.
- **`main.ts`:** after applying a new preference, it calls `announce(themeName(themePref))`.

- [ ] **Step 1: Tests.**
  - `theme.test.ts`:
    - `nextTheme cycles system → light → dark → system`;
    - `themeName names each choice`, giving "Match system", "Light" and "Dark".
  - `card.test.ts` (fake timers):
    - `theme toggle shows the current choice as its icon and name`;
    - `clicking the theme toggle emits the next choice and shows the label for 1.5 s`;
    - Review Focus 4, `clicking quickly restarts the label's timer`: three clicks 1 s apart; the label is still shown 1.4 s after the last click and gone at 1.6 s.
  - **E2E:** replace `the theme picker keeps its choice` with `the theme toggle cycles, labels its choice and keeps it after a reload`:
    - click the toggle once and the button's name is "Theme: Light"; click again and it's "Theme: Dark", and `<html>` has `data-theme="dark"`;
    - the label is visible straight after a click and hidden 2 s later;
    - after a reload the name is still "Theme: Dark";
    - after opening and closing a word it's still "Theme: Dark".
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npx tsc --noEmit && npm test && npm run test:e2e -- -g "theme"` → PASS.
- [ ] **Step 5:** Commit `feat(ui): theme picker becomes an icon toggle with a short-lived label`.

---

### Task 6: The message panel

**Files:** Modify `src/ui/hint.ts` and `src/styles/app.css`. Test `tests/unit/hint.test.ts` and `tests/e2e/wheel.spec.ts`.

**Interfaces:**
- `FwHint` sets no `aria-live`; its text is plain.
- **CSS:**
  - `fw-hint` is styled as a panel: the card's width (`width: 100%` of `#float`), `--surface`, 1rem radius, the card's shadow, `min-height: 56px`, padding `0.75rem 1rem 0.75rem var(--edge)`, text left-aligned, 1rem font.
  - `fw-hint` and `fw-card` fade in over 150 ms using `@starting-style { opacity: 0 }`. There's no fade under reduced motion.
  - `--edge: 1.1rem` is defined on `#float`.

- [ ] **Step 1: Tests.**
  - `hint.test.ts`: `the message is plain text, not a live region`, i.e. `aria-live` is null.
  - **E2E:**
    - `the message and the card never show together` (all projects): at start the message is visible and the card hidden; after tapping Angry the reverse; after Escape twice the message is back.
    - Desktop: `the message sits where the card goes`: its box's left and right edges equal the card's (±1 px) once you select Angry.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test && npm run test:e2e -- -g "message"` → PASS.
- [ ] **Step 5:** Commit `feat(ui): the message takes the card's place as a panel`.

---

### Task 7: Card header alignment and the sticky row

**Files:** Modify `src/ui/card.ts` and `src/styles/app.css`. Test `tests/unit/card.test.ts` and `tests/e2e/wheel.spec.ts`.

**Interfaces:**
- **DOM:** unchanged from v1.2. `div.fw-card-head` gets `display: contents`, so the containing block of the sticky `h2.fw-card-heading` is `fw-card`, the scroll container.
- **CSS (`fw-card`):**
  - `.fw-card-heading` is `position: sticky; top: 0; z-index: 1; background: var(--surface)`;
  - the toggle's padding-left is `var(--edge)`, and the dot-to-title gap is `1.5rem`;
  - `.fw-crumbs-inner` has padding-left `var(--edge)`, and `.fw-card-content` has padding-inline-start `var(--edge)`;
  - remove `--name-inset`.
- **`FwCard`:**
  - keeps `style.scrollPaddingTop` equal to the toggle row's height, using a `ResizeObserver` on the heading;
  - sets `scrollTop = 0` on every rebuild (another word), not on an in-place selected ↔ opened update.

- [ ] **Step 1: Tests.**
  - `card.test.ts`:
    - Review Focus 5, `a rebuild for another word scrolls the card back to the top`: set `scrollTop = 120` on opened Angry, render opened Sad, and `scrollTop` is 0;
    - `an in-place close keeps the scroll position`.
  - **E2E (desktop, 1280 × 500 so the card overflows):** open `#/core/angry`.
    - `the dot, the first crumb and the body share one left edge`: on `#/core/angry/aggressive`, the dot's left equals the first crumb button's left and the definition's left (±1 px), and the title's left minus the dot's right is 24 px (±1).
    - `the dot-and-name row sticks and the crumbs scroll away`: scroll the card to the bottom. The heading's top equals the card's top (±1), and the crumbs' bottom is above the card's top.
    - `a focused row is never under the sticky row`: Tab to the last row. Its top is at least the heading's bottom (WCAG 2.4.11).
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test && npm run test:e2e` → PASS.
- [ ] **Step 5:** Commit `feat(ui): card header shares one left edge; the dot-and-name row sticks`.

---

### Task 8: Phone: the opened word sits above the unfolded card

**Files:**
- Modify:
  - `src/camera.ts`: `CameraOpts.openedY`; `ringFocusCamera`;
  - `src/controller.ts`: `setOpenedY`;
  - `src/ui/card.ts`: `unfoldedHeight`;
  - `src/main.ts`: measure the gap, pass `openedY` in `measure()` and after each render;
  - `src/styles/app.css`: the phone `#float` cap.
- Tests: `tests/unit/camera.test.ts`, `tests/unit/controller.test.ts`, `tests/unit/card.test.ts`, `tests/e2e/wheel.spec.ts`.

**Interfaces:**
```ts
// camera.ts
export interface CameraOpts { remPx: number; portrait: boolean; half: boolean;
  /** Portrait ring views: the stage y (CSS px) for the opened word's centre; null centres it in the stage. */
  openedY: number | null }
// ringFocusCamera: cy = o.portrait && o.openedY !== null ? o.openedY : vp.height / 2. cx and scale unchanged.

// controller.ts (Controller)
/** Re-targets cy with the camera's spring (joining any rotation already in flight). No-op outside ring views. */
setOpenedY(y: number | null): void;
// setViewport's "unchanged" check includes openedY.

// card.ts (FwCard)
/** The card's height once fully unfolded: the heading, the crumbs' and the body's natural heights. 0 when hidden. */
unfoldedHeight(): number;
```
- **`main.ts`** (portrait only; otherwise `openedY` is null):
  - `openedYFor(s)`: null unless `s.opened`.
  - The card's top is `float.getBoundingClientRect().bottom − min(card.unfoldedHeight(), parseFloat(getComputedStyle(float).maxHeight))`.
  - The gap's top is the stage's top plus `#app`'s computed `padding-top` (the top safe area).
  - `openedY` is the midpoint of the gap's top and the card's top, relative to the stage.
  - Call `controller.setOpenedY(openedYFor(s))` after `renderUi(s)`; `measure()` includes `openedY: openedYFor(store.get())`.
- **CSS:** the phone `#float` `max-height` is the Global Constraints cap. `--opened-half` is set as in v1.2.

- [ ] **Step 1: Tests.**
  - Add `openedY: null` to every existing `CameraOpts` literal in `camera.test.ts`, `controller.test.ts` and `wheel-render.test.ts`.
  - `camera.test.ts`:
    - `portrait ring camera puts the opened word at openedY` (`cy` equals the given y; `cx` and `scale` unchanged);
    - `openedY null keeps the stage centre`;
    - `desktop ignores openedY`.
  - `controller.test.ts` (phone viewport, opened):
    - `setOpenedY springs cy without moving rotation or scale`: after step(2000), `cy` is the new y, and rotation and scale are unchanged;
    - `setOpenedY during a settle joins it`: start a step to the next word, call setOpenedY 50 ms in, step(2000); the word is centred at angle 0 and at the new y.
  - `card.test.ts`: `unfoldedHeight is the heading plus the crumbs' and body's natural heights`. Stub `offsetHeight`/`scrollHeight` on the three parts.
  - **E2E (phones):**
    - Replace `phone: opened word is centred vertically and above the card`. For `fearful`, `fearful/scared` and `fearful/scared/helpless`: open; wait for idle and `settled`; the word's y is within 2 px of `(stageTop + cardTop) / 2`; and y + `--opened-half` is above the card's top.
    - Review Focus 1, `moving to a word with a different card height re-centres it`: open `fearful`, click the first "Narrow it down" row, then check the same midpoint against the new card.
    - Review Focus 2, `resize while opened keeps the word centred above the card`: open `fearful/scared`, set the viewport 100 px taller, wait, then check the midpoint.
    - `on a short phone the opened cell still fits above the card`: at 375 × 600, open `fearful`; the card's top is at least `y + --opened-half + 12`.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npx tsc --noEmit && npm test && npm run test:e2e` → PASS.
- [ ] **Step 5:** Commit `feat: on phones the opened word sits centred above the unfolded card`.

---

### Task 9: Final sweep

**Files:** Modify `tests/e2e/wheel.spec.ts` (axe) and `docs/ROADMAP.md`.

- [ ] **Step 1:** Extend the axe test with a fourth state, `opened and scrolled`: open `#/core/angry` at 1280 × 500 and scroll the card to the bottom. Run all four states in both `light` and `dark`.
- [ ] **Step 2:** `npx tsc --noEmit && npm test && npm run build && npm run size && npm run test:e2e && npm run test:perf` → all PASS.
- [ ] **Step 3:** Visual check with `npm run dev`, desktop and phone-sized, both themes. Look at:
  - the message panel and the swap fade;
  - Start over;
  - the theme toggle and its label;
  - header alignment and the sticky row;
  - the phone's opened word on each ring.
- [ ] **Step 4:** In `docs/ROADMAP.md`, set v1.3 to "Shipped", link this plan next to the spec, and move anything deferred into a "Known bugs after v1.3" list.
- [ ] **Step 5:** Commit `test: axe with a scrolled card; docs: v1.3 shipped`.

---

## Spec coverage

| v1.3 spec § | Task |
|---|---|
| §3.1 the message | 1, 6 |
| §3.2 Start over | 4 |
| §3.3 pinch | 2 |
| §3.4 taps beside the card | 3 |
| §3.5 grab cursor | 3 |
| §4.1 message panel | 6 |
| §4.2 phone opened word, card cap | 8 |
| §5.1 header layout | 7 |
| §5.2 sticky row | 7 |
| §6.1–§6.3 toolbar, theme toggle, strings | 4, 5 |
| §7 accessibility | 4, 5, 6, 7, 9 |
| §9–§10 testing, acceptance | every task, 9 |
