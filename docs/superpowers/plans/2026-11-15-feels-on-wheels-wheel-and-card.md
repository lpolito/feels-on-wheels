# The wheel and the card Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Start each wheel on its own start word at 3 o'clock (Happy, Whole body), add a "Back to the body wheel" pill above the card after a jump, and give breadcrumbs their own feeling's ink.

**Architecture:** Each wheel file names its `start`. The layout carries it as a segment index, and every resting rotation (half, side, and whole views) centers it at 3 o'clock; the link previews read the same field, replacing `OG_BASE`. The pill is a small custom element in the card's column, shown by `main.ts` after a card's jump and cleared on any navigation; a plain click goes back in history through an entry the jump marks.

**Tech Stack:** TypeScript, Vite, custom elements, Vitest (happy-dom), Playwright under `wrangler dev`.

**Spec:** `docs/superpowers/specs/2026-11-15-feels-on-wheels-wheel-and-card-design.md`, with `docs/superpowers/specs/2026-11-15-feels-on-wheels-wheel-and-card-changes.md` (the pill says "Back to the body wheel", not "Back to {word}").

## Global Constraints

- No conditionals or mechanisms in the app that alter its behavior only for tests (no hooks, no `TEST`-flag branches, no URL options, no `Math.random`).
- US spelling everywhere, in code, comments, and docs.
- No text hard-coded: new strings go in `src/data/locales/en.json`.
- The opened-word and card-height math (`openedYForHeight`, `.fw-float`'s `max-height`) does not change.
- Don't run `scripts/make-og-image.mjs`; the images don't change.
- Work on the `wheel-and-card` branch; never push to `main`. Commit messages carry no AI attribution trailer.
- Unit tests: `npx vitest run`. Type check: `npm run build`. End-to-end: `npx playwright test tests/e2e` (five browsers; `--project=chromium` while iterating).

## Review Focus

- **Back, then Forward, after a jump:** the pill must not come back on the feelings word (Task 4, "Back then Forward leaves it hidden").
- **Jump, open About, come back:** the pill stays gone (Task 4, "About clears it").
- **⌘-click or middle-click on the pill:** left to the browser, the app doesn't move, and the pill stays (Task 4 unit test "a modified click is left to the browser").
- **Reduced motion on a phone:** starts on the start word at 3 o'clock with no spin (Task 3, "reduced motion starts at rest").
- **The core-feeling link in the definition is also a jump:** it shows the pill too, not only "See … on the feelings wheel" (Task 4, "the core-feeling link shows it too").

---

### Task 1: Breadcrumbs take their own feeling's ink

**Files:**
- Modify: `src/ui/card.ts:323` (`#crumbsNav`)
- Test: `tests/unit/card.test.ts`

**Interfaces:**
- Consumes: `FwCard.#inkedLink(r: Row, trailing?: string)` (exists).
- Produces: nothing new.

- [ ] **Step 1: Write the failing test** in the `describe` that holds "Could be rows each carry their own ink":

```ts
test('breadcrumbs carry their own ink, not the opened word\'s', () => {
  document.body.innerHTML = '<fw-card></fw-card>';
  const el = document.querySelector<FwCard>('fw-card')!;
  el.inks = { chest: '#111111', fearful: '#222222' };
  el.model = cardModel(body, feelings, bOpened('chest/racing-heart/scared'), jump);
  const crumbs = [...el.querySelectorAll<HTMLAnchorElement>('nav.fw-crumbs a')];
  expect(crumbs.map((a) => a.textContent)).toEqual(['Chest', 'Racing heart']);
  expect(crumbs.map((a) => a.style.getPropertyValue('--ink'))).toEqual(['#111111', '#111111']);
  expect(el.style.getPropertyValue('--ink')).toBe('#222222');
});
```

- [ ] **Step 2: Run it and see it fail**

Run: `npx vitest run tests/unit/card.test.ts -t "breadcrumbs carry"`
Expected: FAIL, the crumbs' `--ink` is `''`.

- [ ] **Step 3: In `#crumbsNav`, build each crumb with `this.#inkedLink(c)` instead of `this.#link(c)`.**

- [ ] **Step 4: Run the card tests**

Run: `npx vitest run tests/unit/card.test.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/ui/card.ts tests/unit/card.test.ts
git commit -m "Breadcrumbs light up in their own feeling's color"
```

---

### Task 2: Each wheel names its start

**Files:**
- Modify: `src/data/types.ts` (`Wheel`), `src/data/load.ts` (`validateWheel`), `src/data/wheels/core.json`, `src/data/wheels/body.json`, `src/model/layout.ts` (`Layout`, `buildLayout`), `src/state/store.ts:70` (`firstCore`), `src/state/url.ts` (`RouteTable`, `routeTable`), `src/og.ts` (remove `OG_BASE`, `ogWedge`)
- Test: `tests/unit/data.test.ts`, `tests/unit/layout.test.ts`, `tests/unit/og.test.ts`, `tests/unit/store.test.ts`

**Interfaces:**
- Produces:
  - `Wheel.start: string`, the id of one of the wheel's center nodes (required).
  - `Layout.start: number`, the segment index of the wheel's start (ring 0).
  - `RouteTable.starts: ReadonlyMap<string, string>`, wheel id to start id, filled by `routeTable(wheels)`.
  - `ogWedge(route, table)`: a wheel at rest shows `table.starts.get(route.wheel)`; a wheel with no entry falls back to the first wheel and its start, as `OG_BASE` did.

- [ ] **Step 1: Write the failing tests**

`tests/unit/data.test.ts`, in `validation`:

```ts
test('validateWheel needs start to name one of its center nodes', () => {
  for (const start of [undefined, 42, 'nope', 'aggressive']) {
    const bad = structuredClone(wheel) as unknown as Record<string, unknown>;
    bad['start'] = start;
    expect(() => validateWheel(bad, feelings, ids()), String(start)).toThrow(DataError);
  }
});

test('the feelings wheel starts on Happy and the body wheel on Whole body', () => {
  expect(wheels.map((w) => [w.id, w.start])).toEqual([['core', 'happy'], ['body', 'whole-body']]);
});
```

`tests/unit/layout.test.ts`:

```ts
test("layout.start is the wheel's start segment, on ring 0", () => {
  const s = layout.segments[layout.start]!;
  expect([s.path, s.ring]).toEqual(['happy', 0]);
});
```

`tests/unit/og.test.ts`: drop the `OG_BASE` import; the "no base wedge" test expects `{ wheel: table.first, wedge: 'happy' }`. The existing `/` → `og/core-happy.png` and `/body` → `og/body-whole-body.png` rows stay and must still pass.

`tests/unit/store.test.ts:75`, `:143`, `:259`: the fallback word for a key from nothing is now `layout.start`, so replace `layout.rings[0]!.segments[0]` with `layout.start` there.

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run tests/unit/data.test.ts tests/unit/layout.test.ts tests/unit/og.test.ts tests/unit/store.test.ts`
Expected: FAIL (no `start`, no `layout.start`, `OG_BASE` still exported).

- [ ] **Step 3: Implement**
  - `"start": "happy"` in `core.json` and `"start": "whole-body"` in `body.json`, right after `"id"`.
  - `validateWheel`: fail with `wheel ${id}: start must name one of its center nodes` unless `start` is a string matching some `nodeRef(child).id` of `w.children`.
  - `buildLayout`: `start: byPath.get(wheel.start)!`.
  - `store.ts`: `firstCore(layout)` returns `layout.start` (rename it `startCore`).
  - `routeTable`: `starts: new Map(wheels.map((w) => [w.id, w.start]))`.
  - `og.ts`: delete `OG_BASE`; `ogWedge` reads `table.starts`.

- [ ] **Step 4: Run the whole unit suite and the type check**

Run: `npx vitest run && npm run build`
Expected: all pass. Some other tests may build a `RouteTable` or `Wheel` by hand; give them the new field.

- [ ] **Step 5: Commit**

```bash
git add src tests/unit
git commit -m "Each wheel names its start word, and the link previews read it"
```

---

### Task 3: Every view rests with the start word at 3 o'clock

**Files:**
- Modify: `src/camera.ts:86-89` (`halfRestRotation` becomes `restRotation`), `src/controller.ts:27`, `:322`, `:330`
- Test: `tests/unit/camera.test.ts:145-185`, `tests/unit/controller.test.ts:7`, `:915-923`, `tests/e2e/wheel.spec.ts:608-613`, `tests/e2e/body.spec.ts`

**Interfaces:**
- Consumes: `Layout.start` (Task 2).
- Produces: `restRotation(layout: Layout): number`, the rotation that centers `layout.start` at 3 o'clock. `DEFAULT_ROTATION` is deleted.

- [ ] **Step 1: Write the failing tests**

`camera.test.ts`: rename the two tests to "restRotation centers the start word (Happy) at 3 o'clock" and "the side view is the core ring view, Happy at 3 o'clock", using `layout.byPath.get('happy')` and `restRotation`. Add:

```ts
test("restRotation centers Whole body at 3 o'clock on the body wheel", () => {
  const body = buildLayout(loadData().wheels.find((w) => w.id === 'body')!);
  const off = normAngle(body.segments[body.byPath.get('whole-body')!]!.mid + restRotation(body));
  expect(Math.min(off, TAU - off)).toBeLessThan(1e-12);
});
```

`controller.test.ts`, "coreAtThree is the core word at 3 o'clock…": the first assertion becomes `expect(ctl.coreAtThree()).toBe(layout.start)`, and `r` becomes `restRotation(layout) + 2`. Add, in the same file, for a controller made with a whole-wheel viewport (the file's desktop setup):

```ts
test("the whole wheel rests with the start word at 3 o'clock", () => {
  expect(sameAngle(camera.current.rotation, restRotation(layout))).toBeLessThan(1e-12);
});
```

`wheel.spec.ts:612`: `offCenter('happy')`. Then add a `describe('start word', …)` with these tests:
- desktop (1280 × 800): after `open(page)`, `offCenter('happy') < 1e-6` and `coreAtThree() === 'happy'`;
- phone (390 × 844): after `open(page)`, `offCenter('happy') < 1e-6`;
- **reduced motion starts at rest:** phone, `page.emulateMedia({ reducedMotion: 'reduce' })` before `open(page)`, `offCenter('happy') < 1e-6`, and `moving()` is false at once.

`body.spec.ts`: the same desktop and phone checks on `/body` with `'whole-body'`.

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run tests/unit/camera.test.ts tests/unit/controller.test.ts`
Expected: FAIL (`restRotation` doesn't exist).

- [ ] **Step 3: Implement**
  - `camera.ts`: `restRotation(layout)` returns `-layout.segments[layout.start]!.mid`; update its doc comment.
  - `controller.ts`: delete `DEFAULT_ROTATION`; `playIntro` uses `restRotation`; the initial jump is `wheelCamera(layout, vp, restRotation(layout), opts)` for every view.

- [ ] **Step 4: Run the unit suite and the type check**

Run: `npx vitest run && npm run build`
Expected: all pass.

- [ ] **Step 5: Run the end-to-end suite**

Run: `npx playwright test tests/e2e`
Expected: all pass. A test that fails because it expected Fearful at rest, or the old desktop rotation, gets updated to the new start. That includes a changed count in the viewport sweep (`tests/e2e/viewports.spec.ts`) that follows from different words resting in view: update it and say which in the commit message. Any other failure is a bug: stop and report it.

- [ ] **Step 6: Commit**

```bash
git add src tests
git commit -m "Start on Happy and Whole body at 3 o'clock, on phones and desktop"
```

---

### Task 4: Back to the body wheel

**Files:**
- Create: `src/ui/back-to.ts`, `tests/unit/back-to.test.ts`
- Modify: `index.html` (`#float`), `src/styles/app.css`, `src/data/types.ts` (`WheelText`), `src/data/load.ts` (`validateLocale`), `src/data/locales/en.json`, `src/ui/card.ts` (`focusToggle`), `src/main.ts` (`writeUrl`, `applyRoute`, `renderUi`, the `fw-wheel` handler, `showAbout`, popstate)
- Test: `tests/unit/data.test.ts`, `tests/e2e/body.spec.ts`

**Interfaces:**
- Produces:
  - `WheelText.backTo?: string`, required on every wheel but the first. `en.json`: `wheels.body.backTo` is `"Back to the body wheel"`.
  - `class FwBackTo extends HTMLElement` (`<fw-back-to>`) with `target: { href: string; label: string } | null`. Null hides it. Otherwise it holds one `<a class="fw-back-to" href>`, with a back chevron (`aria-hidden`) and the label. A plain click (`isPlainClick`) prevents the default and dispatches a bubbling `fw-back` event; any other click is left to the browser.
  - `FwCard.focusToggle(): void` moves focus to the toggle with `moveFocus`.

- [ ] **Step 1: Write the failing unit tests**

`tests/unit/back-to.test.ts` (`// @vitest-environment happy-dom`):
- "null hides it": `target = null` gives `hidden === true` and no `<a>`.
- "a target shows one link": `{ href: '/body/chest/racing-heart/scared', label: 'Back to the body wheel' }` gives a visible element whose `a.fw-back-to` has that `href` and `textContent` `'Back to the body wheel'`.
- "a plain click emits fw-back": a cancelable `button: 0` click is `defaultPrevented` and fires one `fw-back`.
- **"a modified click is left to the browser":** for `metaKey`, `ctrlKey`, `shiftKey`, `altKey`, and `button: 1`, not `defaultPrevented` and no `fw-back` (stop propagation as `card.test.ts` does, so happy-dom doesn't follow the link).

`tests/unit/data.test.ts`: deleting `wheels.body.backTo` from a copy of the locale makes `validateLocale` throw `DataError`. The first wheel needs none.

- [ ] **Step 2: Run them and see them fail**

Run: `npx vitest run tests/unit/back-to.test.ts tests/unit/data.test.ts`
Expected: FAIL (no module, no validation).

- [ ] **Step 3: Implement the element, the locale string, and its check**
  - `back-to.ts`: follow `card.ts`'s `h()` and `#anchor` patterns; the chevron is the card's `M6 3l5 5-5 5` path mirrored (`M10 3L5 8l5 5`), in a 16 × 16 view box.
  - `validateLocale`: for `wheels.slice(1)`, fail with `wheel "${id}" is missing "backTo"` when it's empty.

- [ ] **Step 4: Run the unit tests**

Run: `npx vitest run`
Expected: all pass.

- [ ] **Step 5: Write the failing end-to-end tests** in `body.spec.ts`, next to "the jump link opens Fearful › Scared…". Each starts from `/body/chest/racing-heart/scared`, focuses `fw-card .fw-jump`, presses Enter, and waits for `idle`. `pill` is `page.locator('fw-back-to a')`.
- "the jump shows Back to the body wheel above the card": `pill` is visible with text `Back to the body wheel` and `href` `/body/chest/racing-heart/scared`; its box's bottom is above `fw-card`'s top; focus is still on `fw-card .fw-card-toggle`.
- "Back to the body wheel returns to the card you came from": click `pill`, then `idle`. The wheel is `body`, the selected path is `chest/racing-heart/scared` and opened, the path is `/body/chest/racing-heart/scared`, `pill` is hidden, and `fw-card .fw-card-toggle` is focused. `page.goForward()` lands on `/fearful/scared`, which shows it was a Back.
- **"the core-feeling link shows it too":** the same, but jumping by clicking the definition's link (`fw-card .fw-definition a`).
- "moving on hides it": four cases, each after a fresh jump. Clicking the first breadcrumb (`fw-card nav.fw-crumbs a`, Fearful) opens a new word; `page.keyboard.press('Escape')` closes the card; a click on the wheel switch's Body button; a click on the toolbar's Start over. Each time `pill` is hidden.
- **"Back then Forward leaves it hidden":** `goBack`, `goForward`, `idle`; `pill` is hidden.
- **"About clears it":** click the toolbar's About link, then About's "Back to the wheel"; `pill` is hidden.
- "the theme button leaves it": click the toolbar's theme toggle; `pill` is still visible.

- [ ] **Step 6: Run them and see them fail**

Run: `npx playwright test tests/e2e/body.spec.ts --project=chromium`
Expected: the new tests FAIL (no pill).

- [ ] **Step 7: Wire it up**
  - `index.html`: `<fw-back-to hidden></fw-back-to>` before `<fw-card hidden>` in `#float`, so it comes first in focus order.
  - `app.css`: `fw-back-to { align-self: flex-start; flex: none; }` and `fw-back-to[hidden] { display: none; }`. `.fw-back-to` is a 44 px tall pill: `inline-flex`, `gap: 0.4rem`, `border-radius: 999px`, `padding: 0 0.9rem 0 0.6rem`, `font-size: 1rem`, no underline, `var(--surface)` and `var(--fg)`, with the card's shadow (`0 0 0 1px var(--panel-edge), 0 6px 30px rgb(0 0 0 / 0.15)`). Under `forced-colors: active`: `border: 1px solid ButtonText`, `color: ButtonText`, `background: ButtonFace`.
  - `main.ts`:
    - `const JUMP = { fwJump: true }`. `writeUrl(how, s, entry?: unknown)` passes `entry` to `writer.push`, and `applyRoute` takes an optional fourth `entry` that it passes to `writeUrl`. A pushed state entry is never coalesced (`history.ts`).
    - `let backTo: { origin: { wheel: string; path: Path }; at: { wheel: string; index: number } } | null`.
    - In the `fw-wheel` handler, when `from === card && opened`: record the origin (`layout.wheelId`, `pathOf(layout, store.get())`) before `applyRoute(…, 'push', undefined, JUMP)`, then set `at` from the new `layout.wheelId` and `store.get().selected`, and render the pill.
    - `renderBackTo(s)` is called at the end of `renderUi` and after setting `backTo`. It drops `backTo` unless `layout.wheelId === at.wheel && s.opened && s.selected === at.index`, then sets `backToEl.target` to `{ href: formatRoute(table, { kind: 'wheel', wheel: origin.wheel, path: origin.path }), label: wheelText(origin.wheel).backTo! }` or `null`.
    - `showAbout` and the popstate handler set `backTo = null` (popstate before `applyRoute`) and call `renderBackTo`.
    - On `fw-back`: set `focusCardAfterBack = true`. If `history.state?.fwJump`, call `history.back()`; otherwise `applyRoute` the origin with `'push'`, then `card.focusToggle()`. In the popstate handler, after `applyRoute`, a set `focusCardAfterBack` calls `card.focusToggle()` and is cleared.

- [ ] **Step 8: Run the end-to-end suite in every browser**

Run: `npx playwright test tests/e2e`
Expected: all pass.

- [ ] **Step 9: Check by hand in the browser** at 1280 × 800 and 375 × 667: the pill sits above the card and, at 375 × 667, doesn't cover the opened word. Tab order is the pill, then the card. Dark mode and forced colors look right. If the pill covers the opened word at the smallest size, add a known issue to `docs/ROADMAP.md` (Layout and labels) and to `ACCESSIBILITY.md`.

- [ ] **Step 10: Commit**

```bash
git add index.html src tests
git commit -m "Back to the body wheel: a pill above the card after a jump"
```

---

### Task 5: Docs and the pull request

**Files:**
- Modify: `docs/ROADMAP.md`, `ACCESSIBILITY.md`

- [ ] **Step 1: Roadmap.** In the Shipped row for this change, set the status to `Shipped 2026-11-15` (or the merge date) and add `[plan](superpowers/plans/2026-11-15-feels-on-wheels-wheel-and-card.md), [changes](superpowers/specs/2026-11-15-feels-on-wheels-wheel-and-card-changes.md)` after the spec. In "Going back on phones", drop "(in progress)" from the Back to pill's link.
- [ ] **Step 2: `ACCESSIBILITY.md` known limitations.** In the swiping-back line, add that after a jump from the body wheel to the feelings wheel, "Back to the body wheel" above the card goes back without the browser's Back.
- [ ] **Step 3: Run everything once more.**

Run: `npm run build && npx vitest run && npx playwright test tests/e2e`
Expected: all pass.

- [ ] **Step 4: Commit and push, and open the PR**

```bash
git add docs ACCESSIBILITY.md
git commit -m "Roadmap and accessibility notes: the wheel and the card shipped"
git push -u origin wheel-and-card
```

Open it with `gh pr create`. "What and why" covers the three changes and says how they were checked: the unit and end-to-end tests, the keyboard in a browser, and that a screen reader and a real phone weren't tried.
