# Keys turn the wheel, quiet focus, card links, new tabs and tap to close: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Five small changes: the arrow keys turn the whole wheel so the selection sits at 3 o'clock; no focus ring after the app moves focus following a tap; the card's feeling words become real links; every external About link opens a new tab; tapping the opened word closes it.

**Architecture:** The controller turns the whole wheel for the action types only keys produce there. A new `src/a11y/focus.ts` remembers the last input and is the one way the app moves focus. The card builds `<a href>` from a `hrefFor` it's given, keeping today's actions on a plain click. `linkify` decides new tabs by whether the URL leaves the site.

**Tech Stack:** TypeScript, Vite, custom elements, Vitest (happy-dom), Playwright (chromium, firefox, webkit, pixel, iphone).

**Spec:** [2026-11-14-feels-on-wheels-keys-and-focus-design.md](../specs/2026-11-14-feels-on-wheels-keys-and-focus-design.md)

## Global Constraints

- US spelling in code, comments and docs.
- Focus lands where it does today for everyone; only whether the ring is drawn changes.
- A keyboard user is never focused somewhere with no ring (except About's heading, which never draws one).
- Taps, clicks and spins never turn the whole wheel; only `step`, `toChild`, `toParent` and `activate` on the whole wheel do.
- History doesn't change.
- Commit messages follow the repo's style ("Area: what it does"), with no AI attribution trailer.
- Run unit tests with `npx vitest run <file>`; end-to-end with `npm run build:test` first, then `npx playwright test <file>`.

## Review Focus

1. A key pressed while the whole wheel is still turning (a fling, or the last key's turn) still leaves the new selection at 3 o'clock. Pinned in Task 1.
2. Resizing after the keys turned the wheel keeps that rotation. Pinned in Task 1.
3. Tapping the opened word while the wheel is moving only stops it; it doesn't close. Pinned in Task 2.
4. After a quiet focus, Tab away and back (or any key) shows the ring; a programmatic focus after a key shows it too. Pinned in Task 3.
5. A ⌘-click or middle-click on a card word neither opens it in this tab nor is swallowed: no `fw-action`, default not prevented. Pinned in Task 4.

---

### Task 1: Keys turn the whole wheel; → picks the center child

**Files:**
- Modify: `src/state/store.ts` (`toChild` while selected)
- Modify: `src/controller.ts` (the `store.subscribe` block)
- Test: `tests/unit/store.test.ts`, `tests/unit/controller.test.ts`, `tests/e2e/wheel.spec.ts`

**Interfaces:**
- Produces: nothing new; behavior only.

- [ ] **Step 1: Change the store test** at `tests/unit/store.test.ts:91` to `'toChild while selected selects the center child'`: `expect(run(selected('angry/aggressive'), { type: 'toChild' })).toEqual(selected('angry/aggressive/hostile'))`.

- [ ] **Step 2: Write the controller tests** in a new `describe('keys turn the whole wheel')` in `tests/unit/controller.test.ts`, using `setup()` (desktop, `rest: 'whole'`) and `offCenter`:
  - `'ArrowDown (step) on the whole wheel turns the new selection to 3 o\'clock'`: `store.dispatch({ type: 'select', segment: idx('angry') })`, `step(500)`, dispatch `{ type: 'step', delta: 1 }`, `step(2000)`; expect `view.mode === 'wheel'`, `opened === false`, `offCenter(store.get().selected!) < 1e-6`, `camera.current.scale === 1`.
  - Same for `toChild` (from `angry`) and `toParent` (from `angry/aggressive`), and `activate` from `initialState` (selects the first core word).
  - `'a tap on the whole wheel still never turns it'`: keep the existing `tap selects without moving the camera` test passing (no change needed; run it).
  - `'a key during a fling still ends with the selection at 3 o\'clock'` (Review Focus 1): select `angry`, `ctl.handle([{ type: 'dragStart', x: 600, y: 200, axis: 'x' }, { type: 'drag', x: 700, y: 250, dx: 100, dy: 50 }, { type: 'dragEnd', vx: 2000, vy: 0 }])`, `step(50)`, dispatch `step +1`, `step(3000)`; expect `offCenter(selected) < 1e-6`. (Match the `drag` intent's actual fields in `src/input/gestures.ts`.)
  - `'resizing after the keys turned the wheel keeps the rotation'` (Review Focus 2): after a `step`, `step(2000)`, `ctl.setViewport({ width: 1000, height: 800, radius: 380 }, opts)`; expect `offCenter(selected) < 1e-6`.

- [ ] **Step 3: Run them to see them fail**: `npx vitest run tests/unit/store.test.ts tests/unit/controller.test.ts`. Expected: the new tests fail (the selection isn't turned; `toChild` gives the first child).

- [ ] **Step 4: Implement.**
  - `store.ts` `toChild`, not opened: use `centerChild(layout, sel)`, the same as when opened.
  - `controller.ts`: a module constant `KEY_MOVES = new Set<Action['type']>(['step', 'toChild', 'toParent', 'activate'])`, with a comment that on the whole wheel only keys dispatch these (a swipe there is a spin; pinches only act while opened). In the subscriber, when `ring === null`, `dragAxis === null`, `s.selected !== null`, `s.selected !== prev.selected` and `KEY_MOVES.has(a.type)`: `camera.animateTo({ rotation: rotationToCenter(seg(s.selected), camera.target.rotation) })`, then return. The other whole-wheel cases still return as today.

- [ ] **Step 5: Run the unit tests**: `npx vitest run`. Expected: all pass.

- [ ] **Step 6: Write the end-to-end test** in `tests/e2e/wheel.spec.ts`, next to `'arrow keys work after one click on the wheel'`: `'arrow keys turn the whole wheel so the selection sits at 3 o\'clock'`. Open `/`, `tapPath(page, 'angry')`, press `ArrowDown` four times and `ArrowRight` once, `idle`; expect `await page.evaluate((p) => window.__fw.offCenter(p), await selectedPath(page))` `< 1e-3`, and `state(page)` has `opened: false`. Runs on every project, including the phone's half-wheel.

- [ ] **Step 7: Run it**: `npm run build:test && npx playwright test tests/e2e/wheel.spec.ts`. Expected: pass in all five projects; the rest of the file still passes.

- [ ] **Step 8: Commit**: `git commit -am "Wheel: the arrow keys turn the whole wheel so the selection sits at 3 o'clock, and → picks the center child"`

### Task 2: Tap the opened word to close it

**Files:**
- Modify: `src/controller.ts` (the `tap` case)
- Test: `tests/unit/controller.test.ts`, `tests/e2e/wheel.spec.ts`

- [ ] **Step 1: Write the tests** in the `describe('taps')` block:
  - `'tapping the opened word closes it and keeps it selected'`: `setup(opened('angry/aggressive/hostile'))`, `step(1000)`, tap `screenOf(hostile)`, `step(2000)`; expect `{ selected: hostile, opened: false, view: { mode: 'wheel' } }` and the rotation unchanged (`sameAngle`).
  - `'tapping the opened word while the wheel moves only stops it'` (Review Focus 3): from opened, start a fling (`dragStart`/`dragEnd` with `vy: 2500`, as in `'close after spinning while opened'`), `step(30)`, tap the word under `screenOf(store.get().selected!)`; expect `opened === true`.
  - `'double-tap on the opened word leaves it opened'`: from opened, `handle([{ type: 'tap', ...p }, { type: 'doubleTap', ...p }])`, `step(2000)`; expect `opened === true` and `selected === hostile`.

- [ ] **Step 2: Run them to see them fail**: `npx vitest run tests/unit/controller.test.ts`. Expected: the first fails (it stays opened).

- [ ] **Step 3: Implement** in the `tap` case: the "stop here" guard becomes `wasMoving && (hit === null || hit === s.selected)` (opened or not); a new branch before the last, `s.opened && hit === s.selected` → `store.dispatch({ type: 'close' })`.

- [ ] **Step 4: Run the unit tests**: `npx vitest run`. Expected: all pass.

- [ ] **Step 5: End-to-end** in `tests/e2e/wheel.spec.ts`: `'tapping the opened word closes it, leaving it selected'`: open `/angry`, `tapPath(page, 'angry')`; expect `state` `{ opened: false, view: { mode: 'wheel' } }` with `selectedPath` `'angry'`, and `head(page)` `aria-expanded="false"`. Run `npm run build:test && npx playwright test tests/e2e/wheel.spec.ts`. Expected: pass everywhere.

- [ ] **Step 6: Commit**: `git commit -am "Wheel: tapping the opened word closes it and keeps it selected"`

### Task 3: Quiet focus after a tap

**Files:**
- Create: `src/a11y/focus.ts`
- Modify: `src/main.ts` (install, About's two focus moves), `src/ui/hint.ts` (`focusLink`), `src/ui/card.ts` (the two `#toggle` focus calls), `src/a11y/tree.ts` (both focus calls), `src/styles/app.css`
- Test: `tests/unit/focus.test.ts`, `tests/e2e/about.spec.ts`, `tests/e2e/body.spec.ts` or `wheel.spec.ts` (the message's link)

**Interfaces:**
- Produces:
  - `installFocusTracking(doc: Document = document): void`: capture-phase `pointerdown` sets the last input to pointer; capture-phase `keydown` sets it to key and removes `data-quiet-focus` from any element. Idempotent per document.
  - `moveFocus(el: HTMLElement, opts?: FocusOptions): void`: `el.focus(opts)`; if focus landed on `el` and the last input was a pointer press, set `data-quiet-focus` on it, removed on its next `blur`. With no input seen yet, no mark (fail safe).

- [ ] **Step 1: Write `tests/unit/focus.test.ts`** (`// @vitest-environment happy-dom`), each test with a fresh button in `document.body` and `installFocusTracking(document)`:
  - `'after a pointer press, moveFocus focuses and marks the element'`: dispatch `new PointerEvent('pointerdown', { bubbles: true })` on body, `moveFocus(btn)`; expect `document.activeElement === btn` and `btn.hasAttribute('data-quiet-focus')`.
  - `'after a key, moveFocus does not mark'`: dispatch `new KeyboardEvent('keydown', { key: 'Tab', bubbles: true })`; expect no attribute.
  - `'with no input seen, moveFocus does not mark'` (fail safe).
  - `'a key clears the mark'` and `'blur clears the mark'` (Review Focus 4).
  - `'no .focus( call in src bypasses moveFocus'`: read every `.ts` file under `src/` (`node:fs` `readdirSync` recursive), strip `//` and `/* */` comments, and expect no match of `/\.focus\(/` outside `src/a11y/focus.ts`.

- [ ] **Step 2: Run it to see it fail**: `npx vitest run tests/unit/focus.test.ts`. Expected: fails (no module).

- [ ] **Step 3: Implement** `src/a11y/focus.ts` per the interface. Then replace every `.focus(` in `src/` with `moveFocus(…)` (keeping `{ preventScroll: true }` where it's passed): `main.ts` About's heading and `back`, `hint.ts` `focusLink`, `card.ts` lines 137 and 242, `tree.ts` lines 128 and 135. Call `installFocusTracking()` once near the top of `main.ts`.

- [ ] **Step 4: CSS** in `src/styles/app.css`, after the generic `:focus-visible` rule: `[data-quiet-focus]:focus { outline: none !important; }` (comment: the app moved focus after a tap; `!important` so no more specific ring wins) and `#about h1:focus { outline: none; }` (comment: not a control; it takes focus only so screen readers read it).

- [ ] **Step 5: Run the unit tests**: `npx vitest run`. Expected: all pass, including the bypass check.

- [ ] **Step 6: End-to-end.** A helper in `tests/e2e/helpers.ts`: `ring = (l: Locator) => l.evaluate((e) => getComputedStyle(e).outlineStyle)`. Tests:
  - `about.spec.ts` `'after a click, About\'s heading and the About link on leaving show no ring'`: `aboutLink(page).click()`; expect focused and `ring(aboutHeading)` `'none'`; `backToWheel(page).click()`; expect `aboutLink` focused and `ring` `'none'`. On the touch projects use `.tap()` (`isMobile`).
  - `about.spec.ts` `'by keyboard, the About link shows its ring on leaving'`: `aboutLink(page).focus()`, `page.keyboard.press('Enter')`, then `backToWheel(page).focus()`, `press('Enter')`; expect `aboutLink` focused and `ring` `'solid'`.
  - The message's link, in the spec file that already switches wheels from the message: after a click it has no ring; after `focus()` + `Enter` it shows `'solid'`.

- [ ] **Step 7: Run**: `npm run build:test && npx playwright test`. Expected: all pass in five projects. Existing tests that assert focus (`toBeFocused`) still pass unchanged.

- [ ] **Step 8: Commit**: `git commit -am "Focus: no ring when the app moves focus after a tap or click; any key brings it back"`

### Task 4: The card's feeling words are links

**Files:**
- Modify: `src/router.ts` (`isPlainClick`), `src/ui/hint.ts` (use it), `src/ui/card.ts` (`Row.path`, `hrefFor`, anchors), `src/main.ts` (set `card.hrefFor`), `src/styles/app.css` (`.fw-link` as an anchor)
- Test: `tests/unit/card.test.ts`, `tests/unit/router.test.ts`, `tests/e2e/wheel.spec.ts`, `tests/e2e/body.spec.ts`

**Interfaces:**
- Produces:
  - `isPlainClick(c: ClickInfo): boolean` in `src/router.ts`: not `defaultPrevented`, `button === 0`, no meta, ctrl, shift or alt. `inAppLink` uses it.
  - `Row` gains `path: Path` (the segment's path, filled by `cardModel` for rows and crumbs).
  - `FwCard.hrefFor: (wheel: string, path: Path) => string`, default `() => '#'`; `main.ts` sets it before the first mount to `(wheel, path) => formatRoute(table, { kind: 'wheel', wheel, path })`.

- [ ] **Step 1: Write the tests.**
  - `router.test.ts`: `isPlainClick` true for a plain left click; false for each modifier, `button: 1`, and `defaultPrevented`.
  - `card.test.ts`: the `row()` helper gains `path: p`. Rename `'crumb, row and close-to buttons emit open(index)'` to `'crumb, row and close-to links emit open(index) on a plain click'`, with the card's `hrefFor = (w, p) => \`/${w}/${p}\``; each is an `HTMLAnchorElement` with `href` ending in its path, and a plain `click()` emits `open` with `defaultPrevented === true`.
  - `card.test.ts` `'a modified or middle click on a card link is left to the browser'` (Review Focus 5): `dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true }))` and `{ button: 1 }`; no `fw-action`, `defaultPrevented === false`.
  - `card.test.ts` body-wheel block: the jump and the core-feeling link are anchors with their `hrefFor(wheel, path)` and still dispatch `fw-wheel` on a plain click.
  - The toggle test stays: the header is still a `button`.

- [ ] **Step 2: Run them to see them fail**: `npx vitest run tests/unit/card.test.ts tests/unit/router.test.ts`.

- [ ] **Step 3: Implement.** `#link`, the core-feeling link and the jump become `h('a', { className, href })` with a click listener that returns unless `isPlainClick(e)`, then `preventDefault()` and the same event it emits today. The hint's own check becomes `isPlainClick`. CSS: `.fw-link` gains `display: inline-block` and `cursor: pointer` so anchors size like the buttons did (the rows already set `display: block`); check that `.fw-crumbs-row > .fw-link:last-of-type` still picks the last crumb.

- [ ] **Step 4: Run the unit tests**: `npx vitest run`. Expected: all pass.

- [ ] **Step 5: Update and add end-to-end tests.**
  - `wheel.spec.ts`: `fw-card ul.fw-rows button` becomes `fw-card ul.fw-rows a`. The `Enter`/`Space` loop's `'… on a focused card row opens that row'` keeps Enter only; add `'Space on a focused card row leaves the wheel as it is'` (path stays `/angry`).
  - `wheel.spec.ts` `'card words link to their own address'`: open `/angry`; the Bitter row's `href` attribute is `/angry/bitter`; a plain click opens it with no reload (`notReloaded`-style marker, as in `about.spec.ts`).
  - On chromium only, `'⌘/Ctrl-click on a card word opens a new tab'`: `context.waitForEvent('page')` while clicking with `modifiers: ['ControlOrMeta']`; the new page's URL ends `/angry/bitter`, and this page is still `/angry`.
  - Visual check: the opened card on `/angry/aggressive` at desktop and on `iphone` looks as before (row heights 44px, crumbs on one line, `body.spec.ts`'s 320px test passes).

- [ ] **Step 6: Run**: `npm run build:test && npx playwright test`. Expected: all pass, including axe.

- [ ] **Step 7: Commit**: `git commit -am "Card: feeling words are real links, so ⌘-click and middle-click open a new tab"`

### Task 5: Every link that leaves the site opens a new tab

**Files:**
- Modify: `build/site.ts` (`linkify`, drop `NEW_TAB_KEYS`)
- Test: `tests/unit/site.test.ts`, `tests/e2e/about.spec.ts`

- [ ] **Step 1: Write the tests** in `site.test.ts`:
  - `'every link off the site opens a new tab and says so'`: `linkify('[a](https://example.org/) [b]({accessibility}) [c]({home})', aboutLinks(site), '(opens in a new tab)')` gives `a` and `b` with `target="_blank" rel="noopener"` and the visually hidden text, and `c` with neither.
  - Update the count at line 171/173 to the number of external links in the rendered About (every `https://` and `{github}`, `{accessibility}`, `{contributing}`, `{author}` use in `en.json`); assert instead that every `<a` whose `href` starts with `https://` has `target="_blank"` and no other `<a` does.
  - Without `newTab`, any external link throws.

- [ ] **Step 2: Run to see them fail**: `npx vitest run tests/unit/site.test.ts`.

- [ ] **Step 3: Implement**: a link opens a new tab when its final `href` starts with `https://` (raw targets, and keys whose URL does); `{home}` and `{about}` are paths and stay. Update the doc comment.

- [ ] **Step 4: Run**: `npx vitest run`. Expected: pass.

- [ ] **Step 5: End-to-end** in `about.spec.ts`: extend the test around line 106: every `#about a[href^="https://"]` has `target="_blank"`; `#about .about-home` and `.about-back a` have none. `npm run build:test && npx playwright test tests/e2e/about.spec.ts`.

- [ ] **Step 6: Commit**: `git commit -am "About: every link off the site opens a new tab and says so"`

### Task 6: Docs, then the PR

**Files:**
- Modify: `docs/ROADMAP.md`, `ACCESSIBILITY.md`
- Create (only if what shipped differs from the spec): `docs/superpowers/specs/2026-11-14-feels-on-wheels-keys-and-focus-changes.md`

- [ ] **Step 1: Roadmap.** The row added with the spec: status `Shipped 2026-11-14`, links `[spec]`, `[plan]` (this file), and `[changes]` if any. Delete the "Tap the opened word to close it" subsection and its Ideas table row, and repoint any link to `#tap-the-opened-word-to-close-it` (keep an `<a id>` on the Shipped row if a frozen spec links to it: `grep -rn "tap-the-opened-word" docs`). Update the "Feeling links underlined" idea's text that says feeling links are buttons, if it does.
- [ ] **Step 2: Known limitations.** The first one in `ACCESSIBILITY.md` ("Choosing a word with the keyboard or a screen reader on a phone-size screen …") and its roadmap known issue: remove the keyboard half; keep a screen-reader line only if a screen-reader path still selects a word without turning the wheel (the tree's focus-in selects the first core word, which the half-wheel already rests on).
- [ ] **Step 3: Full check**: `npm run build && npx vitest run && npm run build:test && npx playwright test`. Expected: all pass.
- [ ] **Step 4: Commit** `"Docs: roadmap and accessibility notes for keys, focus, links and tap to close"`, push the branch with `git push -u origin keys-and-focus`, and open the PR with `gh pr create`. In "What and why", say how it was checked: the unit and end-to-end tests in five browsers, the keyboard in a browser, and that a screen reader and a real iPhone weren't checked by hand.
