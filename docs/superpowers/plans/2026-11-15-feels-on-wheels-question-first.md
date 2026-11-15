# Question first, and Tab onto the wheel selects nothing: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The start message comes first in the page (before the switch, toolbar, wheel, and card), the `<h1>` follows the URL, Tab onto the wheel selects nothing and shows a ring around the wheel, and the message's instruction is worded by device.

**Architecture:** `index.html` splits `#float` into a message box before the switch and the card box (`#float`, kept) after the stage; both share one CSS class. The key actions that select from nothing (`step`, `toChild`, `toParent`, `activate`) carry an optional `from` segment, filled by the tree (the focused word) or `main.ts` (the controller's word at 3 o'clock), so the reducer stays pure. The renderer's `Frame` gets a `focusRing` flag that `main.ts` computes from the tree's focus.

**Tech Stack:** TypeScript, custom elements, canvas 2D, Vite 8, Vitest 5 + happy-dom, Playwright 1.65 (chromium, firefox, webkit, pixel, iphone).

**Spec:** `docs/superpowers/specs/2026-11-15-feels-on-wheels-question-first-design.md`

## Global Constraints

- Branch `question-first-order`; never push to `main`. **Nothing is pushed in this plan:** it ends with everything committed and Lucas trying it on his iPhone (Task 7).
- US spelling everywhere (AGENTS.md). Commit messages have no AI attribution trailer (Lucas's global instructions).
- No text in code: every visible or spoken string lives in `src/data/locales/en.json`.
- Nothing on screen moves: the message and the card sit exactly where `#float` puts them today, at every size, in both themes.
- No focus moves on load.
- The instruction lines, verbatim: touch "Tap, spin, or zoom to explore, or {link}."; mouse or trackpad "Click, spin, zoom, or use the arrow keys to explore, or {link}." Touch is `(pointer: coarse)`.
- The ring: `palette.focus`, 3 px wide, a small gap outside the wheel's outer edge, never animated, drawn only while the tree has keyboard focus (`:focus-visible` and no `data-quiet-focus`) and nothing is selected.
- `npm test`, `npm run build`, and `npm run test:e2e` pass at the end of every task.

## Review Focus

1. **An arrow key pressed on the message's About link** (the first Tab stop, and the message says "use the arrow keys"): the word at 3 o'clock is selected, the message hides, and focus lands on that word in the tree, not `<body>`. Test in Task 4.
2. **Tab onto the wheel during the phone's intro spin:** the tabbable word, and what the first key selects, is the word the wheel lands on, which is on screen. Test in Task 4.
3. **Tap a word, then Escape clears it from the keyboard:** the ring shows (the clear came from a key), and focus is on the word at 3 o'clock. A tap alone never shows it. Test in Task 5.
4. **Opening a word from the folded card with Enter on its toggle:** the heading goes from level 2 to 1 and focus stays on the toggle (no re-render). Test in Task 2.
5. **Rotating a phone or resizing the window** between portrait and the side column with the message showing: the message box follows `#float`'s rules, so it stays where the card would be. Test in Task 1.

---

### Task 1: Page order

**Files:**
- Modify: `index.html:19-26`, `src/styles/app.css:215-236` and `:473` (the portrait `#float` rule)
- Test: `tests/e2e/order.spec.ts` (new), `tests/e2e/helpers.ts`

**Interfaces:**
- Produces: `<div id="message" class="fw-float">` holding `fw-hint`, then `fw-wheel-switch`, `fw-toolbar`, `#stage`, `<div id="float" class="fw-float">` holding `fw-card`, `#announcer`. `main.ts` keeps measuring `#float` (now the card box) unchanged.
- Produces in `helpers.ts`: `tabStops(page): Promise<string[]>`, the focusable, rendered elements in document order with `tabIndex >= 0`, described like `focused()` (`"A.fw-hint-link"`, `"BUTTON.fw-share"`, `"LI"` for a tree item). It tests order without relying on each browser's Tab-to-links setting.

- [ ] **Step 1: Write the failing tests** in `tests/e2e/order.spec.ts`:
  - `'the message comes first, then the switch, the toolbar, the wheel'`: at `/`, `/body`, and `/plaful`, `tabStops` starts `['A.fw-hint-link', 'A.fw-hint-about-link']`, then the switch's buttons, then the toolbar's Share and theme buttons, then `'LI'`, and ends there (the card is hidden).
  - `'after selecting a word, the card comes right after the wheel'`: after `tapPath(page, 'angry')`, the stop after `'LI'` is `'BUTTON.fw-card-toggle'`.
  - `'the message sits where the card does'`: at `/`, the message box's bounding box equals the one `#float` had before (capture `#message` at rest and `#float` after `tapPath(page, 'angry')`: same `left`, `right`, and `bottom` within 1 px), in the desktop and phone projects. Repeat after `page.setViewportSize` from 1280 × 800 to 390 × 844 (Review Focus 5).
- [ ] **Step 2: Run** `npx playwright test tests/e2e/order.spec.ts --project=chromium`. Expected: FAIL (the message comes after the tree).
- [ ] **Step 3: Implement.** Reorder `index.html` as in Interfaces. In `app.css`, change the `#float` and `#float > *` selectors (and the portrait one) to `.fw-float`; the message box needs the same `z-index: 2`, now that it comes before `#stage`.
- [ ] **Step 4: Run** `npm test && npm run build && npm run test:e2e`. Expected: PASS. Fix existing tests that assumed the old order (in `wheel.spec.ts:924` the `#float` override still targets the card box and stays).
- [ ] **Step 5: Commit** `git commit -m "Page order: the start message first, the card after the wheel"`.

### Task 2: Headings

**Files:**
- Modify: `src/ui/hint.ts:64`, `src/ui/card.ts:303` (`#setOpen`), `:342-344` (section headings), `:373` (the heading), `src/styles/app.css:315` and `:417`
- Test: `tests/unit/hint.test.ts`, `tests/unit/card.test.ts`, `tests/e2e/order.spec.ts`; update `tests/e2e/body.spec.ts:155`, `:374-387`

**Interfaces:**
- Produces: the message title is `h1.fw-hint-title`. The card's heading is `div.fw-card-heading[role="heading"]`, with `aria-level` `"1"` when opened and `"2"` when selected, set in `#setOpen`. Section headings are `h2`.

- [ ] **Step 1: Write the failing unit tests.**
  - `hint.test.ts`: change the three `h2.fw-hint-title` checks to `h1.fw-hint-title`.
  - `card.test.ts`: `'the heading is level 2 when selected and level 1 when opened'`: a `selected` model gives `[role="heading"][aria-level="2"]`. Setting the `opened` model for the same word gives `aria-level="1"`, and it's the same element (`toBe`), with `document.activeElement` still the toggle when it was focused first (Review Focus 4). Closing again gives `"2"`.
  - `card.test.ts`: change `:345-351` to `.fw-card-head > .fw-card-bar > [role="heading"].fw-card-heading`, `:135` and `:184` to `closest('[role="heading"]')`, and `:668` and `:733` to `h2`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/hint.test.ts tests/unit/card.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** `h2` becomes `h1` in `hint.ts`. In `card.ts`, the heading is a `div` with `role="heading"`, holding a reference so `#setOpen` sets `aria-level`. Section `h3`s become `h2`. In `app.css`, `.fw-card-heading` gets `font-weight: bold` (the `<h2>`'s browser default it loses), and `.fw-card-content h3` becomes `.fw-card-content h2`.
- [ ] **Step 4: Add the e2e test** to `order.spec.ts`, `'the h1 follows the URL'`: at `/`, `getByRole('heading', { level: 1 })` is "How are you feeling?"; at `/plaful` it's "Feeling not found!"; after `tapPath(page, 'angry')` there's no level-1 heading and the card's is level 2 "Angry"; at `/angry` the level-1 heading is "Angry" and "Narrow it down" is level 2. Update `body.spec.ts:155` to `h2` and `:374-387` to `fw-hint h1`.
- [ ] **Step 5: Run** `npm test && npm run build && npm run test:e2e`. Expected: PASS, with the viewport sweep unchanged (same look).
- [ ] **Step 6: Commit** `git commit -m "Headings: the question is the h1 at rest, the opened word's name once opened"`.

### Task 3: The word the first key selects

**Files:**
- Modify: `src/state/store.ts:15-31` (actions), `:84-110` (the nothing-selected cases), `src/controller.ts:10` (`Controller`), `:331`
- Test: `tests/unit/store.test.ts`, `tests/unit/controller.test.ts`

**Interfaces:**
- Produces in `store.ts`: `step`, `toChild`, `toParent`, and `activate` take an optional `from?: number`, the word to select when nothing is selected. With nothing selected, all four return `selectOnly(s, a.from ?? firstCore(layout))`. With something selected, `from` is ignored.
- Produces in `store.ts`: `export function withFrom(a: Action, from: number): Action` adds `from` to those four types and returns any other action unchanged.
- Produces on `Controller`: `coreAtThree(): number`, the core segment at 3 o'clock at the camera's target rotation: `segmentAt(layout, 0, normAngle(-camera.target.rotation))`.

- [ ] **Step 1: Write the failing tests.**
  - `store.test.ts`: `'with nothing selected, each key move selects its from word and opens nothing'`: for each of `step` (both deltas), `toChild`, `toParent`, and `activate` with `from` set to Sad's index, the result is `selected: sad, opened: false, view: wheel`. `'from is ignored once something is selected'`: `step` from Angry with `from: sad` moves to Angry's neighbor. `'toChild and toParent with nothing selected and no from select the first core'` (they returned `s` before). `withFrom` adds `from` to the four and leaves `escape` and `select` unchanged.
  - `controller.test.ts`: `'coreAtThree is the core word at 3 o'clock where the wheel is headed'`: at `DEFAULT_ROTATION` it's the core segment whose span contains angle `normAngle(-DEFAULT_ROTATION)`; after `camera.animateTo({ rotation: r })` with the camera still moving, it uses `r`.
  - `controller.test.ts`: `'a key selection from nothing turns the wheel to center it'`: dispatching `{ type: 'step', delta: 1, from: x }` animates the rotation to `rotationToCenter(seg(x), …)`. This works already through `KEY_MOVES`; the test pins it.
- [ ] **Step 2: Run** `npx vitest run tests/unit/store.test.ts tests/unit/controller.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the actions' `from`, the four cases, `withFrom`, and `coreAtThree` as in Interfaces.
- [ ] **Step 4: Run** `npm test && npm run build`. Expected: PASS. (Nothing passes `from` yet, so the e2e tests don't change.)
- [ ] **Step 5: Commit** `git commit -m "Key moves from nothing select a given word; the controller names the word at 3 o'clock"`.

### Task 4: Tab onto the wheel selects nothing

**Files:**
- Modify: `src/a11y/tree.ts` (all of `createA11yTree`), `src/main.ts:196-206` (keydown), `:369` (mount), `src/ui/hint.ts`
- Test: `tests/unit/a11y.test.ts`, `tests/unit/hint.test.ts`, `tests/e2e/order.spec.ts`; update `tests/e2e/wheel.spec.ts`, `body.spec.ts:122`, `about.spec.ts`, `routes.spec.ts`, `share.spec.ts` wherever they rely on Tab or focus selecting the first word

**Interfaces:**
- Consumes: `withFrom`, `Controller.coreAtThree()` (Task 3).
- Produces: `createA11yTree(root, layout, dispatch, startWord: () => number): A11yTree`. `A11yTree` gains `rest(): void`.
  - No `focusin` handler: focus never selects.
  - `update(s)`: with something selected, as today. With nothing selected: if the last state had a selection, or on the first call, the tabbable word becomes `startWord()`, and focus moves to it if the tree had focus. If the last state already had nothing selected, it changes neither the tabbable word nor focus.
  - `rest()`: with nothing selected, makes `startWord()` tabbable, and moves focus to it (with `moveFocus`, `preventScroll`) only if focus was on the old tabbable word.
  - keydown: `withFrom(action, i)`, where `i` is the `data-index` of the focused `li` (`e.target`).
- Produces in `main.ts`: `createA11yTree(…, () => controller.coreAtThree())`; `camera.onSettle(() => tree.rest())` in `mount`; the document keydown dispatches `withFrom(action, controller.coreAtThree())`.
- Produces in `hint.ts`: setting `content = null` while focus is inside dispatches `fw-focus-lost` (bubbling), as `FwCard` does.

- [ ] **Step 1: Write the failing unit tests** in `a11y.test.ts`, passing a `startWord` stub that returns a variable:
  - Replace `:74` with `'focusing the tree selects nothing'`: `focus()` on the tabbable `li` dispatches nothing.
  - Replace `:42` with `'one tabindex=0: the selection, or else startWord()'`.
  - `'with nothing selected, update never moves focus between words'`: focus an inner `li` (not tabbable), change the stub, call `update(initialState)`: focus stays.
  - `'rest moves focus to the new word at 3 o'clock only from the old one'`: with focus on the tabbable word, change the stub and call `rest()`: focus and `tabindex=0` move. With focus on another word, `rest()` moves `tabindex=0` but not focus.
  - `'clearing with focus in the tree moves focus to startWord()'`: `update(sel('angry'))` with focus, then `update(initialState)`: the focused `li` is `startWord()`'s.
  - `'keys with nothing selected carry the focused word'`: Down on a focused inner `li` dispatches `{ type: 'step', delta: 1, from: <its index> }`.
  - In `hint.test.ts`: `'hiding with focus inside emits fw-focus-lost'`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/a11y.test.ts tests/unit/hint.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the tree, `main.ts` wiring, and the hint's event as in Interfaces. `main.ts` already handles `fw-focus-lost` by calling `tree.focusSelected()`; the hint's event fires before `tree.update` in `renderUi`, and `update` then moves focus to the selected word.
- [ ] **Step 4: Write the e2e tests** in `order.spec.ts`:
  - `'Tab onto the wheel selects nothing and keeps the message and Share'` (chromium and firefox, which Tab to links by default; skip webkit and iphone for the link stops): from a fresh load, press Tab until a `[role="treeitem"]` is focused. `state.selected` is null, `fw-hint` is visible, Share is visible, and the next Tab leaves the tree.
  - `'the first key selects the word at 3 o'clock and opens nothing'`: focus the tabbable treeitem, then press Down: `selectedPath` is that item's path, `opened` is false, and `offCenter` is ≈ 0 once idle. Repeat with Right, Left, and Enter. Then Enter opens it, and Tab lands on the card's toggle.
  - `'an arrow on the message's About link selects a word and keeps focus on the wheel'` (Review Focus 1): focus `aboutLink`, press Right: a word is selected, the hint is hidden, and focus is the selected treeitem.
  - `'Tab during the intro spin picks the word it lands on'` (pixel and iphone, Review Focus 2): right after `page.goto('/')`, before idle, focus the tabbable treeitem; once idle, the focused item's word sits at 3 o'clock (`offCenter` ≈ 0 for its path); Down selects that word.
  - `'Start over leaves focus on the word at 3 o'clock with nothing selected'`.
- [ ] **Step 5: Run** `npm test && npm run build && npm run test:e2e`. Update the existing tests that expected Tab or focus to select the first core word. Expected: PASS in all five projects.
- [ ] **Step 6: Commit** `git commit -m "Tab onto the wheel selects nothing; the first key selects the word at 3 o'clock"`.

### Task 5: The ring around the wheel

**Files:**
- Modify: `src/render/wheel.ts:9-27` (`Frame`, `stats`), `:185-` (draw), `src/main.ts:134-150` (`frame`) and the input listeners, `src/main.ts:591` (test hook)
- Test: `tests/unit/wheel-render.test.ts`, `tests/e2e/order.spec.ts`

**Interfaces:**
- Produces: `Frame.focusRing: boolean`. When true, the renderer strokes a circle centered on `cam.cx, cam.cy` with radius `R * layout.rings.at(-1).outer + FOCUS_GAP_PX + FOCUS_RING_PX / 2` (`R = vp.radius * cam.scale`), `lineWidth = FOCUS_RING_PX` (3), `FOCUS_GAP_PX = 2`, in `palette.focus`. `stats.focusRing: boolean` records whether it was drawn this frame.
- Produces in `main.ts`: `treeFocusVisible(): boolean`, true when `document.activeElement` is inside `#a11y-tree`, matches `:focus-visible`, and has no `data-quiet-focus`. `frame()` passes `focusRing: s.selected === null && treeFocusVisible()`. Document `focusin`, `focusout`, and `keydown` (capture) call `requestDraw()`. The test hook gains `focusRing: () => renderer.stats.focusRing`.

- [ ] **Step 1: Write the failing unit tests** in `wheel-render.test.ts` with the recording context the file already uses: `'focusRing draws one 3px circle in the focus color just outside the wheel'` (an `arc` of the computed radius over 0 to TAU, stroked with `palette.focus` and lineWidth 3). `'no ring without focusRing'`.
- [ ] **Step 2: Run** `npx vitest run tests/unit/wheel-render.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** the renderer as in Interfaces, drawing the ring after the cells and labels and before the selection outline (which can't coexist with it).
- [ ] **Step 4: Wire `main.ts`** as in Interfaces.
- [ ] **Step 5: Write the e2e tests** in `order.spec.ts`, reading `window.__fw.focusRing()` after a frame (`requestAnimationFrame` twice):
  - `'the ring shows when Tab reaches the wheel, and goes when a word is selected'`.
  - `'a click or tap on the wheel brings focus without a ring'`.
  - `'tap a word, then Escape: the ring shows'` (Review Focus 3).
  - `'the ring goes when focus leaves the wheel'` (Tab on to the next stop).
- [ ] **Step 6: Run** `npm test && npm run build && npm run test:e2e`. Expected: PASS.
- [ ] **Step 7: Commit** `git commit -m "A ring around the wheel while it has keyboard focus and nothing is selected"`.

### Task 6: The instruction by device

**Files:**
- Modify: `src/data/types.ts:22-23`, `src/data/locales/en.json:609` and `:616`, `src/data/load.ts:92`, `src/i18n.ts:61`, `src/main.ts:233-245` (`hintContent`) and `:462` (the not-found announcement)
- Test: `tests/unit/data.test.ts`, `tests/e2e/order.spec.ts`

**Interfaces:**
- Produces: `WheelText.hint` is replaced by `hintTouch: string` and `hintPointer: string`, each containing `{link}`. `en.json` sets both wheels to the lines in Global Constraints.
- Produces in `main.ts`: `const coarse = matchMedia('(pointer: coarse)')`. `hintContent` uses `coarse.matches ? text.hintTouch : text.hintPointer`, and so does the not-found announcement. A `change` listener on `coarse` calls `renderUi(store.get())`.

- [ ] **Step 1: Write the failing tests.** In `data.test.ts`, `'every wheel has both instruction lines, each with {link}'`, and that a wheel missing `hintTouch` fails to load. In `order.spec.ts`, `'the instruction names what works on the device'`: on chromium it reads "Click, spin, zoom, or use the arrow keys to explore, or start from body sensations instead."; on pixel and iphone, "Tap, spin, or zoom to explore, or start from body sensations instead." (If a phone project doesn't report `pointer: coarse`, set `hasTouch: true, isMobile: true` for it rather than changing the rule.)
- [ ] **Step 2: Run** `npx vitest run tests/unit/data.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** as in Interfaces.
- [ ] **Step 4: Run** `npm test && npm run build && npm run test:e2e`. Expected: PASS. Update any test that matched "Tap or spin to explore".
- [ ] **Step 5: Commit** `git commit -m "The start message's instruction is worded for touch or for a mouse and keyboard"`.

### Task 7: Docs, then Lucas tries it

**Files:**
- Modify: `docs/ROADMAP.md`, `ACCESSIBILITY.md`

- [ ] **Step 1: Roadmap.** Add the Shipped row: "Question first in page order, Tab onto the wheel selects nothing, a ring around the focused wheel, and the instruction by device", status "Shipped" with the date it merges, linking the spec and this plan. Delete the idea's subsection and table row. Delete the Navigation known issues "Tab selects a word on reaching the wheel…" and "Tabbing into the phone's half-wheel". Delete the "first word Tab lands on" bullet from "A different word to start on". Repoint any link to `#question-first-in-page-and-tab-order`. Add the Navigation known issue from spec §10 (phone screen readers' double-tap).
- [ ] **Step 2: ACCESSIBILITY.md known limitations.** Remove the first two bullets (Tab selecting a word, the half-wheel). Add: "**On a phone with VoiceOver or TalkBack, double-tapping a word on the wheel may not select it.** This hasn't been checked on a phone yet."
- [ ] **Step 3: Run** `npm test && npm run build && npm run test:e2e`. Expected: PASS.
- [ ] **Step 4: Commit** `git commit -m "Roadmap and accessibility notes: question first shipped; phone screen readers' double-tap logged"`.
- [ ] **Step 5: Stop for Lucas.** Don't push or open a PR. He runs `npm run dev -- --host` and opens the printed network address on his iPhone. Changes he asks for are fixed on the branch, with any difference from the spec written in `docs/superpowers/specs/2026-11-15-feels-on-wheels-question-first-changes.md` and linked from the Shipped row as *changes*.
