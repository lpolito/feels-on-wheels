# Feelings Wheel v2.2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish from using v2.1: the wheel draws under the card's column and stops 1.5rem before the card, one-line breadcrumbs, "›" that never wraps alone, the halo dot back at 2 s, the core feeling named in body wheel definitions, a heading on the start message, and no chevron on the wheel's selected word.

**Architecture:** The canvas covers the whole app in every layout. `Viewport` gains `drawWidth` (the canvas) next to `width` (where the camera aims), so the cameras don't change and only drawing, culling and hit testing see the wider canvas. The card and message changes are model-first: `cardModel` and `HintContent` gain fields and the elements draw them. All new words live in the locale.

**Tech Stack:** TypeScript, Vite, Canvas 2D, custom elements, Vitest (happy-dom), Playwright (chromium, firefox, webkit, Pixel 7, iPhone 15), axe.

**Spec:** `docs/superpowers/specs/2026-11-08-feelings-wheel-v2.2-design.md`

## Global Constraints

- No text is hard-coded: every new word comes from `src/data/locales/en.json`, and nothing is lowercased or pluralised in code.
- Reduced motion turns off every new or changed animation; forced colours keep working (spec §4.3).
- Every interactive element keeps a 44 px minimum touch target where it has one today; nothing new is smaller than 24 px.
- Commit messages follow the repo's style (`feat(card): …`, `fix: …`, `test: …`, `docs: …`). No `Co-Authored-By` or other AI trailer (Lucas's global instruction).
- Run commands from the worktree root. Unit: `npx vitest run <file>`. Browser: `npx playwright test <file> --project=chromium` (the web server builds `build:test` itself).

## Review Focus

1. **A tap in the column on empty space after a word was just tapped** becomes a double tap (300 ms window) and only closes, where the old `#app` click handler closed then cleared. Expected: two clicks spaced more than 300 ms apart close, then clear. Pinned in Task 2's rewrite of "clicking empty space above the card".
2. **A safe-area inset only on the left** (phone turned the other way) must not move the camera's right edge. Expected: the aim width is unchanged from no inset. Pinned in Task 2, Step 1 (`inset: left` case).
3. **Resizing between portrait and sideways** must re-measure the aim width from `#float`'s new place, not a stale one. Expected: after 393 × 852 → 852 × 393 the opened word ends 1.5rem before the card. Pinned in Task 2, Step 1 (resize case).
4. **A focused, shortened crumb.** The focus ring must still show around the whole link, and the link must still open the parent. Pinned in Task 3, Step 1 (focus + click on the shortened crumb).
5. **The core-feeling link from the keyboard**: Enter on it must switch wheels, and focus must land on the new card's toggle, as the jump link does. Pinned in Task 4, Step 6.

---

### Task 1: Two widths in `Viewport`: draw and hit test to the canvas's edge

**Files:**
- Modify: `src/model/geometry.ts` (`Viewport`, `hitTest`, `viewWindow`)
- Modify: `src/render/wheel.ts` (`draw` passes the canvas width to `viewWindow`)
- Modify: `src/controller.ts:263-266` (`setViewport`'s unchanged check)
- Test: `tests/unit/geometry.test.ts`, `tests/unit/wheel-render.test.ts`, `tests/unit/controller.test.ts`

**Interfaces:**
- Produces: `Viewport { width; height; radius; drawWidth?: number }`. `drawWidth` is the canvas's CSS width, at least `width`; absent means `width`.
- Produces: `export function drawWidthOf(vp: Viewport): number` in `geometry.ts`, returning `vp.drawWidth ?? vp.width`.

- [ ] **Step 1: Write the failing tests**

In `tests/unit/geometry.test.ts`:

```ts
describe('drawWidth (spec v2.2 §3.1)', () => {
  const vp: Viewport = { width: 500, height: 400, radius: 192, drawWidth: 800 };
  test('hitTest accepts points between width and drawWidth, rejects past drawWidth', () => {
    const cam = { scale: 4, rotation: 0, cx: 100, cy: 200 };
    // On the outer ring at 3 o'clock: x = 100 + 0.81 * 192 * 4 ≈ 722.
    expect(hitTest(layout, cam, vp, 722, 200)).not.toBeNull();
    expect(hitTest(layout, cam, { ...vp, drawWidth: undefined }, 722, 200)).toBeNull();
    expect(hitTest(layout, cam, vp, 801, 200)).toBeNull();
  });
  test('viewWindow reaches the canvas corners, not the aim width', () => {
    const cam = { scale: 4, rotation: 0, cx: -300, cy: 200 };
    expect(viewWindow(cam, vp).rMax).toBeCloseTo(Math.hypot(800 + 300, 200) / (192 * 4), 6);
  });
});
```

In `tests/unit/wheel-render.test.ts`: `'draws labels in the column when drawWidth is wider'`. Use a ring-1 camera from `ringFocusCamera(layout, 1, vp, 0, opts)` on `vp = { width: 600, height: 500, radius: 242 }`. Draw once with `drawWidth` absent and once with `drawWidth: 1000`, with `r.resize(drawWidthOf(vp), vp.height, 1)`. Expect `stats.labelsByRing[2]` to be larger with the wider canvas.

In `tests/unit/controller.test.ts`: `'setViewport with only drawWidth changed still re-aims'`. The existing unchanged-check test's pattern: after `setViewport({ ...vp, drawWidth: vp.width + 300 }, opts)`, the controller's stored viewport (used by the next tap's `hitTest`) is the new one. Assert by tapping at a point between the two widths on a cell and expecting a selection.

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/unit/geometry.test.ts tests/unit/wheel-render.test.ts tests/unit/controller.test.ts`
Expected: the three new tests FAIL (hit test returns null at 722; labels unchanged; tap ignored).

- [ ] **Step 3: Implement**

- `geometry.ts`: add `drawWidth?: number` with a doc comment (spec v2.2 §3.1). Add `drawWidthOf`. In `hitTest`'s bounds check and in `viewWindow`'s corners, `inside` test, `nearX` clamp and `toRect` centre, use `drawWidthOf(vp)` in place of `vp.width`.
- `wheel.ts` needs no change beyond what `viewWindow` now does. Confirm nothing else in `draw` reads `vp.width`.
- `controller.ts` `setViewport`: include `drawWidthOf(next) === drawWidthOf(vp)` in `unchanged`.

- [ ] **Step 4: Run the unit suite**

Run: `npx vitest run`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/model/geometry.ts src/render/wheel.ts src/controller.ts tests/unit/geometry.test.ts tests/unit/wheel-render.test.ts tests/unit/controller.test.ts
git commit -m "feat(geometry): Viewport.drawWidth: draw, cull and hit test to the canvas's edge, not the camera's aim width"
```

### Task 2: The wheel under the column, stopping 1.5rem before the card

**Files:**
- Modify: `src/styles/app.css:225` (`#stage { inset: 0 var(--column) 0 0; }` → `inset: 0` for every layout; drop the portrait query's now-redundant `#stage { inset: 0; }`)
- Modify: `src/main.ts` (`measure()`, the ResizeObserver, `mount()`'s `renderer.resize`, the `isEmptySpace` click handler, the test hook's `viewport()`)
- Modify: `tests/fw-window.d.ts` (`viewport()` returns `drawWidth: number` too)
- Test: `tests/e2e/wheel.spec.ts`, `tests/e2e/viewports.spec.ts`

**Interfaces:**
- Consumes: `Viewport.drawWidth`, `drawWidthOf` (Task 1).
- Produces: `window.__fw.viewport()` returns `{ width, height, radius, drawWidth }`, where `width` is the camera's aim width.

- [ ] **Step 1: Write the failing browser tests**

In `tests/e2e/wheel.spec.ts`, a new `test.describe('v2.2: the wheel under the column', …)` (skip on `isMobile`; these tests set their own viewport).

Add a helper `withInset(page, side: 'right' | 'left', px = 59)` that calls `page.addInitScript`. On `DOMContentLoaded` the script appends a `<style>` reproducing what `env(safe-area-inset-*)` does, which Playwright can't set:
- `'right'`: `#app { padding-right: 59px !important } #float { right: max(1.5rem, 59px) !important }`.
- `'left'`: `#app { padding-left: 59px !important }`.

Add a helper `openedEdge(page)` that returns `cam.cx + ringOuter * vp.radius * cam.scale + 12` from `__fw.camera()`, `__fw.viewport()` and the opened ring's outer radius. Ring outers are `[0.32, 0.62, 1]`, and the ring comes from `__fw.state().view.ring`.

- `'${w}×${h} ${inset}: the opened word ends 1.5rem before the card'`
  - Cases: `[852, 393]` with `'right'` and with none, `[895, 470]` with none, `[1280, 800]` with none.
  - Paths: `#/core/happy/content/joyful`, `#/core/happy/content` and `#/body/head/wide-eyes`.
  - Expect `openedEdge <= vp.width + 0.5` and `vp.width + 24 <= card.x + 1` (card = `fw-card` box).
  - Expect `#stage`'s box width to equal `#app`'s (±1) and `vp.drawWidth` to equal it too.
- `'852×393 left inset: the aim width is unchanged'` (Review Focus 2): `vp.width` with `withInset(page, 'left')` equals `vp.width` without it.
- `'resizing to sideways re-aims at the card'` (Review Focus 3): open `#/core/happy/content/joyful` at 393 × 852, set the viewport to 852 × 393 with the right inset, `idle`, then make the same two assertions as above.
- `'a tap in the column on the wheel opens that word'`:
  - At 895 × 470, open `#/body/head/wide-eyes`.
  - Compute the screen point at angle 0 on the outer ring's mid radius: `x = cam.cx + 0.81 * vp.radius * cam.scale`, `y = cam.cy`.
  - Assert `x > vp.width + 24`, click it, `idle`. Expect `state().opened === true` and `pathOf(selected)` starts with `head/wide-eyes/`.
- `'a drag starting in the column spins the wheel'`: same page. Press at a column point off the card, move 80 px down in 5 steps, release, `idle`. Expect `camera().rotation` changed.

Rewrite `'clicking empty space above the card closes, then clears'` (Review Focus 1): keep the same point, but `await page.waitForTimeout(320)` before the second click.

In `tests/e2e/viewports.spec.ts`:
- At rest, sideways: replace `stage.x + stage.width` with `(await page.evaluate(() => window.__fw.viewport())).width`.
- At rest, every layout: expect `#stage` to be the whole app (±1).
- Opened: replace `'opened word on the stage'` with: the point's x ≤ `vp.width`, and its y within the app.

In `tests/e2e/wheel.spec.ts`, the two v2.1 sideways tests at lines ~757 and ~778 compare against `#stage`'s right edge. Make them compare against `__fw.viewport().width` instead.

- [ ] **Step 2: Run them to verify they fail**

Run: `npx playwright test tests/e2e/wheel.spec.ts -g "v2.2: the wheel under the column" --project=chromium`
Expected: FAIL. `#stage` is narrower than `#app`; with the right inset `vp.width + 24 > card.x`; the column tap hits `#app`, not the wheel.

- [ ] **Step 3: Implement**

- CSS: `#stage { inset: 0; }` in every layout. `#app { --column }` and `#float` are unchanged.
- `main.ts` `measure()`:
  - `drawWidth` is `#stage`'s width.
  - `width` (the aim width) is `drawWidth` when `isPortrait(whole)`. Otherwise it's `float.getBoundingClientRect().left - stageRect.left - 1.5 * remPx`, clamped to at least 1.
  - `radius` stays `Math.max(Math.min(width, height) / 2 - 8, 1)`, from the aim width.
  - Name the 1.5rem `CARD_GAP_REM = 1.5`, with a comment citing spec v2.2 §3.2.
- `renderer.resize(drawWidthOf(vp), vp.height, …)` in `mount()` and in the ResizeObserver.
- Delete `isEmptySpace`, `pressedOnEmpty` and the `#app` `pointerdown`/`click` listeners. Taps in the column now reach the canvas, whose tap already closes or clears off the wheel (spec §3.1). Leave a one-line comment where they were, citing the spec.
- Test hook: `viewport: () => ({ ...vp, drawWidth: drawWidthOf(vp) })`.

- [ ] **Step 4: Run the browser tests**

Run: `npx playwright test tests/e2e/wheel.spec.ts tests/e2e/viewports.spec.ts --project=chromium`
Expected: all PASS. Then run `npx playwright test tests/e2e --project=webkit --project=iphone`: all PASS.

- [ ] **Step 5: Run the perf tests with the larger canvas**

Run: `npm run test:perf`
Expected: PASS. The switch leak check is flaky about 1 run in 10 (roadmap known issue), so re-run it once if it alone fails, and report it if it fails twice.

- [ ] **Step 6: Commit**

```bash
git add src/styles/app.css src/main.ts tests/fw-window.d.ts tests/e2e/wheel.spec.ts tests/e2e/viewports.spec.ts
git commit -m "feat: the wheel draws under the card's column and stops 1.5rem before the card, so a notch inset can't cover the opened word"
```

### Task 3: The card's breadcrumbs, "›" and dot

**Files:**
- Modify: `src/styles/app.css` (`.fw-crumbs-row`, `.fw-crumbs-row .fw-link`, `@keyframes fw-heartbeat` → `fw-halo`, the dot's `animation`)
- Modify: `src/ui/card.ts` (`#inkedLink(r, ' ›')` and the jump's `` `${s.label} ›` ``)
- Test: `tests/unit/card.test.ts`, `tests/e2e/wheel.spec.ts`, `tests/e2e/body.spec.ts`

**Interfaces:** none new.

- [ ] **Step 1: Write the failing tests**

- In `tests/unit/card.test.ts`, change the expectations at ~452 and ~463 to `'See Scared on the feelings wheel ›'` and `['Scared ›', 'Mad ›', 'Excited ›']`. In `tests/e2e/body.spec.ts` ~149–161, do the same with ` ›`.
- `tests/e2e/body.spec.ts`, `'320 px: crumbs stay on one line; only the parent shortens'`:
  - At 320 × 568, open `#/body/posture/shrinking/insecure`.
  - Crumb links: `fw-card nav.fw-crumbs .fw-link`. All of them, and every `.fw-sep`, share one `y` (±1).
  - The first link ("Posture and urges") has `scrollWidth <= clientWidth + 1`. The last ("Urge to shrink or hide") has `scrollWidth > clientWidth`, and its `textContent` is the full label.
  - Review Focus 4: focus the last link with the keyboard and expect `outline-style` to be `solid` on it. Click it and expect the title "Urge to shrink or hide".
- `tests/e2e/body.spec.ts`, `'320 px: "›" never sits alone on a line'`:
  - Open `#/body/posture/shrinking/insecure` and get `.fw-jump`'s text node.
  - Using a `Range` over each character, collect each character's `getClientRects()[0].top`.
  - Expect the "›" to share its top with the character before the no-break space.
- `tests/e2e/wheel.spec.ts` `'the opened dot beats…'` becomes `'the opened dot glows, and is still with reduced motion'`, expecting `[{ name: 'fw-halo', duration: 2000 }]`.
- In `'the dot, the first crumb and the body share one left edge'`, delete the heartbeat comment and the line that pauses the animation (the halo doesn't scale the dot).

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/unit/card.test.ts && npx playwright test tests/e2e/body.spec.ts tests/e2e/wheel.spec.ts -g "crumbs|alone|dot" --project=chromium`
Expected: FAIL (plain space; crumbs wrap; `fw-heartbeat`).

- [ ] **Step 3: Implement**

- `card.ts`: `' ›'` in both places.
- CSS, `.fw-crumbs-row`: `flex-wrap: nowrap; min-width: 0`.
  - `.fw-crumbs-row > *` gets `flex: none; white-space: nowrap`.
  - `.fw-crumbs-row .fw-link:last-of-type` gets `flex: 0 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis`.
  - Comment: spec v2.2 §4.1, only the parent shortens.
- CSS, dot: replace the heartbeat block with `@keyframes fw-halo`.
  - `0%`: `box-shadow: 0 0 0 0` with `color-mix(in srgb, var(--dot-hue) 55%, transparent)`.
  - `70%, 100%`: `0 0 0 0.55rem` with `var(--dot-hue)` at 0%.
  - `fw-card[data-open] .fw-dot { animation: fw-halo 2s ease-out infinite; }`.
  - Comment cites spec v2.2 §4.3. The reduced-motion rule is unchanged.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run && npx playwright test tests/e2e --project=chromium --project=webkit`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ui/card.ts src/styles/app.css tests/unit/card.test.ts tests/e2e/body.spec.ts tests/e2e/wheel.spec.ts
git commit -m "feat(card): crumbs stay on one line with only the parent shortened; › never wraps alone; the halo dot is back, at 2s"
```

### Task 4: The core feeling in body wheel definitions

**Files:**
- Modify: `src/data/types.ts` (`Locale.feelings` values gain `kind?: string; kindLink?: string`)
- Modify: `src/data/locales/en.json` (the seven core feelings)
- Modify: `src/data/load.ts` (`validateLocale`)
- Modify: `src/i18n.ts` (new `coreKind`)
- Modify: `src/ui/card.ts` (`Section`'s `text`, `cardModel`, `#bodyFor`)
- Modify: `src/styles/app.css` (only if the link needs to sit inline in the paragraph; `.fw-link` is already inline)
- Test: `tests/unit/data.test.ts`, `tests/unit/card.test.ts`, `tests/e2e/body.spec.ts`

**Interfaces:**
- Produces: `coreKind(id: FeelingId): { before: string; label: string; after: string }` in `i18n.ts`. It splits `kind` on `{link}`; `label` is `kindLink`. A missing key goes through `missing()` as the other getters do.
- Produces: `Section` text variant `{ kind: 'text'; text: string; core?: { before: string; label: string; after: string; hue: string; wheel: string; path: Path } }`.

- [ ] **Step 1: Write the failing data tests**

In `tests/unit/data.test.ts`:
- `'every core feeling has kind with one {link} and a kindLink'`: for each `wheel.children` feeling id, `locale.feelings[id].kind` matches `/^[^{]*\{link\}[^{]*$/` and `kindLink` is non-empty.
- `'angry takes "An"'`: `locale.feelings.angry.kind === 'An {link} feeling.'`; `happy` is `'A {link} feeling.'`.
- `'validateLocale rejects a core feeling without kind'`: in the style of the existing `hintLink: ''` test (~164), delete `fearful.kind` and expect it to throw `/fearful.*kind/`.

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/unit/data.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement the data**

- `en.json`: add `"kind": "A {link} feeling."` to fearful, disgusted, sad, happy, surprised and bad, and `"kind": "An {link} feeling."` to angry. `kindLink` is each one's word in lower case as copy: `"fearful"`, `"angry"`, `"disgusted"`, `"sad"`, `"happy"`, `"surprised"`, `"bad"`.
- `types.ts`: the optional fields.
- `load.ts`: for each feeling at the first wheel's centre (`wheels[0].children`), fail with `` `locale ${lang}: core feeling "${id}" is missing "kind"` `` (or `"kindLink"`) when it's absent, or when `kind` doesn't hold exactly one `{link}`.

- [ ] **Step 4: Run the data tests**

Run: `npx vitest run tests/unit/data.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing card tests**

In `tests/unit/card.test.ts`, under `cardModel` (the file already has `body`, `jump`, `bOpened`):
- `'body wheel: a feeling names its core feeling after the definition'`: `cardModel(body, feelings, bOpened('head/wide-eyes/interested'), jump)`. The first section toEquals `{ kind: 'text', text: locale.feelings.interested.definition, core: { before: 'A ', label: 'happy', after: ' feeling.', hue: 'happy', wheel: 'core', path: 'happy' } }`.
- `'the article comes from the locale'`: find a body path whose home starts with `angry/` (e.g. `posture/shrinking/humiliated`, home `angry/humiliated`). `core.before` is `'An '`.
- `'no core sentence on a core feeling, a homeless feeling, or the feelings wheel'`:
  - Sad on the body wheel (find its first body path via `body.segments`) has no `core`.
  - Interested with `{ wheel: 'core', home: new Map() }` has no `core`.
  - `opened('happy/interested')` on `layout` without `jump` has no `core`.
- `'<fw-card> draws the sentence in the definition, its link dispatching fw-wheel'`:
  - Render the Interested model. `.fw-definition`'s `textContent` is the definition, then `' A happy feeling.'`.
  - The `button.fw-link` inside it has text `happy`.
  - Clicking it dispatches `fw-wheel` with `{ wheel: 'core', path: 'happy' }`.

- [ ] **Step 6: Write the failing browser test**

In `tests/e2e/body.spec.ts`, `'the core feeling link opens Happy on the feelings wheel; Enter works too'` (Review Focus 5):
- Open `#/body/head/wide-eyes/interested` and click `fw-card .fw-definition .fw-link`.
- Expect `__fw.wheel()` to be `'core'`, the title `'Happy'`, and the URL hash `#/core/happy`.
- Go back to the body wheel (`page.goBack()`), focus the link, press Enter. Expect the same, and `document.activeElement.className` to be `'fw-card-toggle'`.

Also `'axe: a body wheel definition with its core feeling link'`: open `#/body/head/wide-eyes/interested`, `settled`, and expect `new AxeBuilder({ page }).analyze()` to report no violations.

- [ ] **Step 7: Run them to verify they fail**

Run: `npx vitest run tests/unit/card.test.ts && npx playwright test tests/e2e/body.spec.ts -g "core feeling link" --project=chromium`
Expected: FAIL.

- [ ] **Step 8: Implement**

- `i18n.ts` `coreKind`.
- `cardModel`, feeling branch: `const h = jump?.home.get(id)`.
  - When `jump && h` and `h.path` has more than one segment, set `core` on the text section.
  - The core id is `h.path`'s first `/`-segment, and so is `path`. `hue` is `h.hue`; `wheel` is `jump.wheel`.
  - Use `coreKind(coreId)` for the words.
- `#bodyFor`: for a text section with `core`, the `p.fw-definition` holds the text, `' '`, `before`, the link, then `after`.
  - The link is `h('button', { type: 'button', className: 'fw-link' }, core.label)`.
  - It takes `--ink` from `this.#inks[core.hue]` (as `#inkedLink` does) and dispatches `fw-wheel` with `{ wheel, path }`, like the jump.

- [ ] **Step 9: Run the tests**

Run: `npx vitest run && npx playwright test tests/e2e/body.spec.ts --project=chromium`
Expected: all PASS.

- [ ] **Step 10: Commit**

```bash
git add src/data/types.ts src/data/locales/en.json src/data/load.ts src/i18n.ts src/ui/card.ts src/styles/app.css tests/unit/data.test.ts tests/unit/card.test.ts tests/e2e/body.spec.ts
git commit -m "feat(card): body wheel definitions end with their core feeling, linked to it on the feelings wheel"
```

### Task 5: The start message's heading

**Files:**
- Modify: `src/data/types.ts` (`WheelText` gains `hintTitle: string`)
- Modify: `src/data/locales/en.json` (`wheels.core`, `wheels.body`)
- Modify: `src/data/load.ts:74` (add `'hintTitle'` to the required keys)
- Modify: `src/i18n.ts` (`wheelText`'s fallback gains `hintTitle: key`)
- Modify: `src/ui/hint.ts` (`HintContent`, `same`, `#render`)
- Modify: `src/main.ts` (`hintContent` passes `title: text.hintTitle`)
- Modify: `src/styles/app.css` (`fw-hint`, new `.fw-hint-title`, `.fw-hint-text`)
- Test: `tests/unit/hint.test.ts`, `tests/unit/data.test.ts`, `tests/e2e/body.spec.ts`

**Interfaces:**
- Produces: `HintContent = { title: string; text: string; link?: { label: string; wheel: string; href: string } } | null`.

- [ ] **Step 1: Write the failing tests**

- `hint.test.ts`: `content` becomes `{ title: 'How are you feeling?', text: 'Tap or spin to explore, or {link}.', link: … }`.
  - `'renders a heading, then the text around the link'`: `h2.fw-hint-title` has the title; `p.fw-hint-text`'s `textContent` is `'Tap or spin to explore, or start from body sensations instead.'`; the link is inside the `p`.
  - Update `'null hides it'` to pass a `title`, and expect the heading plus the text.
- `data.test.ts`:
  - `wheels.core.hintTitle === 'How are you feeling?'`, and `wheels.body.hintTitle === 'What do you notice in your body?'`.
  - Both `hint` values are `'Tap or spin to explore, or {link}.'`.
  - A missing `hintTitle` throws `/hintTitle/` (copy the `hintLink: ''` test).
- `body.spec.ts`:
  - `'the message opens with its question as a heading'`: on `#/` the `fw-hint h2` reads "How are you feeling?"; on `#/body` it reads "What do you notice in your body?".
  - At 320 × 568 the body heading wraps to two lines (its height is more than 1.5× its line height) and stays inside `fw-hint`.
- Add `#/body` at rest to the existing axe tests' states, if they don't already cover it.

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/unit/hint.test.ts tests/unit/data.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

- Locale, types, validation and fallback as listed under Files.
- `hint.ts` `#render`: `replaceChildren(h2.fw-hint-title, p.fw-hint-text)`, the `p` holding `before`, the link and `after`, as the `span` does today. Without a link, the `p` holds the text alone. `same()` also compares `title`.
- CSS, `fw-hint`:
  - `display: block` (was flex); keep `min-height`, padding and radius.
  - Drop `font-weight: 600`.
  - `.fw-hint-title { font-size: 1.35rem; line-height: 1.2; font-weight: 700; margin-bottom: 0.25rem; }`.
  - `.fw-hint-text { font-size: 1rem; }`.
  - Comment cites spec v2.2 §5.

- [ ] **Step 4: Run the tests**

Run: `npx vitest run && npx playwright test tests/e2e --project=chromium`
Expected: all PASS. The viewport sweep's `'message inside viewport'` still holds at every size.

- [ ] **Step 5: Commit**

```bash
git add src/data/types.ts src/data/locales/en.json src/data/load.ts src/i18n.ts src/ui/hint.ts src/main.ts src/styles/app.css tests/unit/hint.test.ts tests/unit/data.test.ts tests/e2e/body.spec.ts
git commit -m "feat(ui): the start message opens with its question as a heading"
```

### Task 6: No chevron on the wheel's selected word

**Files:**
- Modify: `src/render/wheel.ts`
  - Delete `CHEVRON_INSIDE_MIN_ARC`, `CHEVRON_HALF`, `CHEVRON_OFFSET`, `CHEVRON_ROOM`, `chevronInside` and `chevron()`.
  - Delete the label's move-inward block (~262–273) and the chevron drawing in the selected branch (~291–295).
  - Drop `WHITE` if nothing else uses it.
- Test: `tests/unit/wheel-render.test.ts`

**Interfaces:** none.

- [ ] **Step 1: Change the tests**

- `'selected not opened: outline drawn in palette.outline, chevron drawn, no shadow'` becomes `'… no chevron, no shadow'`, with `sel.strokes.length - none.strokes.length` equal to `2` (the outline ring and the inner gap line).
- Replace `'selecting a word leaves its label put unless the label would reach the inside chevron'` with `'selecting a word never moves or resizes its label'`. For every segment drawn on one line both times, `after.centre` is close to `before.centre` (6 digits) and `after.px === before.px`. Reuse the existing `placed` helper, and drop `CLEAR` and the arc skip.
- Delete `'thin cell gets the chevron outside in the outline colour; wide cell gets it inside in white'`.

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/unit/wheel-render.test.ts`
Expected: FAIL (3 strokes; labels that move).

- [ ] **Step 3: Delete the chevron code**

As listed under Files.

- [ ] **Step 4: Run the tests and the type check**

Run: `npx vitest run && npm run build`
Expected: all PASS, with no unused-symbol errors.

- [ ] **Step 5: Commit**

```bash
git add src/render/wheel.ts tests/unit/wheel-render.test.ts
git commit -m "feat(render): no chevron on the wheel's selected word; its label never moves"
```

### Task 7: Ship v2.2

**Files:**
- Modify: `docs/ROADMAP.md` (the v2.2 row's status and plan link; "Still open after v2.1" → "after v2.2")

- [ ] **Step 1: Full verification**

Run: `npm run build && npx vitest run && npx playwright test tests/e2e && npm run test:perf && npm run size`
Expected: all PASS, on every Playwright project. Report any failure with its output; don't mark the task done over a failure.

- [ ] **Step 2: Update the roadmap**

- The v2.2 row: status `Shipped`, links `[spec](…v2.2-design.md), [plan](superpowers/plans/2026-11-08-feelings-wheel-v2.2.md)`, plus any change from the spec found while building, in the v2.1 row's style.
- The known-issues heading line says "after v2.2".

- [ ] **Step 3: Commit**

```bash
git add docs/ROADMAP.md
git commit -m "test: v2.2 end to end; docs: v2.2 shipped"
```
