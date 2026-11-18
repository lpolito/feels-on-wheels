# Known issues: phones, layout, and labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix four known issues (text inflating when the phone turns, double-tap zoom on labels, the wheels resting and zooming differently, long opened labels spilling), and sort the rest under "Low priority or not fixing."

**Architecture:** Two CSS rules in `app.css`. In `src/camera.ts`, two shared numbers are worked out from the wheel JSON when the wheel list loads, and the rest test and the side view read them instead of the current wheel's layout. `ringFocusCamera` gets a cap so the opened ring fits on screen, with a 24 px floor under it. The renderer's opened branch fits its label at bold inside the lifted cell.

**Tech Stack:** TypeScript, Canvas 2D, Vite, Vitest, Playwright (end-to-end under `wrangler dev`).

**Spec:** `docs/superpowers/specs/2026-11-18-feels-on-wheels-known-issues-design.md` (approved). Section numbers below (§1–§8) are the spec's.

## Global Constraints

- US spelling everywhere (color, center, gray, behavior); Oxford commas in prose.
- `text-size-adjust` is `100%`, never `none`.
- No test-only code paths: no hooks, flags, or optional parameters that only tests leave out.
- Rules that keep the two wheels' rest view the same hold by construction (shared numbers), not by extra tests. Lucas doesn't want convoluted tests.
- Commit messages: a sentence-case summary line, a short body. No `Co-Authored-By` or other AI attribution in commits or the PR (Lucas's global instructions).
- `main` is protected: work on `known-issues`, open a PR, never push to `main`.
- The approved spec is frozen. Where what ships differs from it, write `2026-11-18-feels-on-wheels-known-issues-changes.md` next to it (Task 5).

## Review Focus

Lucas asked for no extra tests beyond the spec's, so each of these is checked by hand in its owning task, not by a new test:

- **Sideways phone, tapping a core word from rest (feelings wheel):** the camera must not zoom out (rest and opened core both use the shared core width). Task 2, browser check at 852 × 393.
- **Turning the phone with a word opened:** the new camera (cap, inset, shared width) applies after the turn, and the opened ring stays clear of the card. Task 3, Simulator check.
- **A folded Galaxy Fold (280 × 653), body wheel, outer word opened:** cells stay at least 24 px tall; the ring may run about 2 px past the edges. Task 3, browser check.
- **Pinching in after opening a body outer word on an upright phone:** pinch still zooms past the opened view (the controller's maximum is the largest ring scale × its headroom, now 4.70 × headroom at 390 × 844). Task 3, browser check.
- **Long opened labels that split onto two lines, or that don't fit even at their unopened size:** never truncated, never smaller than unopened. Task 4, browser check of "Weight on shoulders" and the longest body sensations.

---

### Task 1: Text keeps its size, and labels don't double-tap zoom (§1, §2)

**Files:**
- Modify: `src/styles/app.css:39` (the About-only `-webkit-text-size-adjust` rule), and the `:is(.fw-theme-label, .fw-share-label)` block (around line 164)

**Interfaces:** none.

- [ ] **Step 1: Replace the About-only rule** at `app.css:39` with `html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }`, with a one-line comment: Safari on iOS enlarges text when the phone turns unless told not to; `100%`, not `none`, so people's own zoom still works.
- [ ] **Step 2: Add `touch-action: manipulation;`** to the `:is(.fw-theme-label, .fw-share-label)` block, with a comment: plain text gets double-tap-to-zoom, and the canvas takes every pinch, so there'd be no way back; `manipulation` keeps pinch zoom.
- [ ] **Step 3: Run the unit tests and the type check**

Run: `npx vitest run && npm run build`
Expected: all pass; build succeeds.

- [ ] **Step 4: Check §1 in the iOS Simulator.** Start the dev server (`.claude/launch.json`, "dev", port 5199), open `http://localhost:5199/happy` in Safari on the iPhone 17 Simulator, and turn the phone between upright and sideways at least five times with the card open. Expected: the card's text keeps its size every time. Screenshot upright and sideways for the PR.
- [ ] **Step 5: Commit**

```bash
git add src/styles/app.css
git commit -m "Text keeps its size when the phone turns, and labels don't double-tap zoom"
```

### Task 2: One rest view for both wheels (§3)

**Files:**
- Modify: `src/model/layout.ts` (export `leaves`)
- Modify: `src/camera.ts` (new `SharedSizes`, `sharedSizes`; new signatures for `shouldStartZoomed`, `useHalfWheel`, `restView`; `CameraOpts.sideCoreWidth`; `ringFocusCamera` reads it)
- Modify: `src/main.ts` (compute once at startup; pass to `restView` and into `opts`)
- Test: `tests/unit/camera.test.ts`, `tests/unit/controller.test.ts`, `tests/unit/wheel-render.test.ts` (opts literals gain `sideCoreWidth`)

**Interfaces:**
- Produces, in `src/camera.ts`:
  - `export interface SharedSizes { outerArc: number; coreWidth: number }`. `outerArc`: the narrowest outer cell of any wheel, as an arc at radius 1 (2π ÷ outer-cell count × the outer ring's middle radius). `coreWidth`: the narrowest typical (median) core cell of any wheel, in radians.
  - `export function sharedSizes(wheels: readonly Wheel[]): SharedSizes`
  - `export function shouldStartZoomed(outerArc: number, vp: Viewport): boolean`
  - `export function useHalfWheel(outerArc: number, vp: Viewport): boolean`
  - `export function restView(outerArc: number, vp: Viewport, app: { width: number; height: number }): RestView`
  - `CameraOpts.sideCoreWidth: number` (required): the core cell width `ringFocusCamera` uses for ring 0 when `rest === 'side'`.
- Produces, in `src/model/layout.ts`: `export function leaves(n: WheelNode): number` (already written, now exported).

- [ ] **Step 1: Write the failing test** in `tests/unit/camera.test.ts`, inside `describe('resting cameras')`, with `const SHARED = sharedSizes(loadData().wheels);` at the top of the file:

```ts
test('both wheels rest on the half-wheel on an upright iPad (820 × 1180)', () => {
  expect(restView(SHARED.outerArc, { width: 820, height: 1180, radius: 402 }, { width: 820, height: 1180 })).toBe('half');
  expect(SHARED.outerArc).toBe(Math.min(...loadData().wheels.map((w) => sharedSizes([w]).outerArc)));
});
```

And in the existing test "the side view is the core ring view, Happy at 3 o'clock", add a line asserting the side view's scale is the same on both wheels: `wheelCamera(body, vp, 0, sideOpts).scale` equals `wheelCamera(layout, vp, 0, sideOpts).scale`, where `sideOpts` carries `sideCoreWidth: SHARED.coreWidth`.

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/camera.test.ts`
Expected: FAIL, with `sharedSizes` not exported.

- [ ] **Step 3: Implement.**
  - Export `leaves` from `src/model/layout.ts`.
  - In `src/camera.ts`, add `sharedSizes`. For each wheel, count `leaves` over `wheel.children`. `outerArc` is `TAU / count × (outer.inner + outer.outer) / 2`, from the last of `wheel.rings`. The core width of each child is `leaves(child) / count × TAU`; the wheel's typical core width is the median as `typicalWidth` takes it (sorted, index `floor(n / 2)`). Return the minimum of each across wheels.
  - `shouldStartZoomed` becomes `outerArc × vp.radius × LABEL_HEIGHT_RATIO < START_ZOOMED_BELOW_PX`. `useHalfWheel` and `restView` pass `outerArc` through.
  - In `ringFocusCamera`, use `o.sideCoreWidth` in place of `typicalWidth(layout, 0)` when `ring === 0 && o.rest === 'side'`.
  - In `src/main.ts`, add `const shared = sharedSizes(data.wheels);` next to the other startup values (around line 43). In `measure()`, call `restView(shared.outerArc, vp, whole)` and put `sideCoreWidth: shared.coreWidth` in the returned opts.
- [ ] **Step 4: Update the existing tests that change.** Add `sideCoreWidth: SHARED.coreWidth` to every `CameraOpts` literal in the three test files, so `npm run build` type-checks. Change the calls to `useHalfWheel`, `restView`, and `shouldStartZoomed` to pass `SHARED.outerArc`. Then fix only the expectations that now differ:
  - `useHalfWheel(…, vp(1024, 1366))` becomes `true`: upright iPads rest on the half-wheel now.
  - `shouldStartZoomed(…, desk)` at 1440 × 900 becomes `true` with the body wheel's cells. Keep the test's intent by changing its "false" example to 2560 × 1440 (radius 712) and renaming it "…false for 2560 × 1440".
- [ ] **Step 5: Run the unit tests and the type check**

Run: `npx vitest run && npm run build`
Expected: all pass.

- [ ] **Step 6: Browser check.** `npm run build:test`, then `npx vite preview --outDir dist-test --port 4180`, then use Playwright's Chromium:
  - At 820 × 1180, 768 × 1024 and 1024 × 1366, both `/` and `/body` rest on the half-wheel (`__fw.camera().cx === 0`).
  - At 852 × 393, with the safe-area override (CDP `Emulation.setSafeAreaInsetsOverride`, insets left/right 59, bottom 21), both wheels rest at the same scale (2.68).
  - Tapping Happy from rest on the feelings wheel keeps the scale at 2.68 (Review Focus 1).
- [ ] **Step 7: Commit**

```bash
git add src/model/layout.ts src/camera.ts src/main.ts tests/unit
git commit -m "One rest view for both wheels, from numbers shared across the wheel list"
```

### Task 3: The opened ring fits the screen (§4)

**Files:**
- Modify: `src/camera.ts` (`ringFocusCamera`; new constant `MIN_CELL_PX = 24`)
- Modify: `tests/e2e/viewports.spec.ts` (only expectations that change)
- Test: `tests/unit/camera.test.ts`

**Interfaces:**
- Consumes: `CameraOpts.sideCoreWidth` (Task 2).
- Produces: nothing new. `ringFocusCamera`'s signature is unchanged.

- [ ] **Step 1: Make the existing test the failing test.** In `tests/unit/camera.test.ts`, delete `OVERFLOWS`, its comment, and the branch that uses it in "the opened cell starts 1rem after the inset and ends before the aim width, on every ring of both wheels", so every ring takes the `toBeLessThanOrEqual(notched.width + 1e-9)` assertion.
- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run tests/unit/camera.test.ts -t "starts 1rem after the inset"`
Expected: FAIL on "body ring 2 right".

- [ ] **Step 3: Implement the cap and floor in `ringFocusCamera`.** Rename today's result to `want`. Then:
  - `fit` in portrait: `(vp.width − 2·o.remPx − 2·(LIFT_RADIAL_PX + OUTLINE_OUTSIDE_PX)) / ((r.outer − r.inner) · vp.radius)`.
  - `fit` sideways: `(vp.width − (o.insetLeft ?? 0) − o.remPx − 2·LIFT_RADIAL_PX − OUTLINE_OUTSIDE_PX) / ((r.outer − r.inner) · vp.radius)`.
  - `scale = Math.max(Math.min(want, fit), MIN_CELL_PX / arcAtScale1, MIN_RING_SCALE)`.
  - Comment `MIN_CELL_PX`: WCAG 2.2 AA target size (2.5.8); it beats the fit.
- [ ] **Step 4: Run the unit tests**

Run: `npx vitest run`
Expected: all pass. If another expectation moves, check it against the spec's §4 table: only the outer ring changes, and only on phones.

- [ ] **Step 5: Run the viewport sweep**

Run: `npx playwright test tests/e2e/viewports.spec.ts --project=chromium`
Expected: pass. If a size fails because a view changed as the spec intends (for example, the feelings wheel resting on the half-wheel in a portrait window), update that expectation alone, with a comment naming the spec section. Don't add sizes.

- [ ] **Step 6: Browser check** (the Task 2 build, rebuilt). With an outer word opened (`/happy/content/joyful`, `/body/shoulders/weight-on-shoulders/pressured`):
  - `__fw.camera().scale` matches the spec's §4 table at 280 × 653, 320 × 568, 360 × 640, 375 × 667, 390 × 844, 430 × 932, and the notched 852 × 393.
  - Screenshot the body wheel at 390 × 844 and at the notched 852 × 393 for the PR: the whole wedge is on screen, clear of the card.
  - At 280 × 653, the body cell is about 24 px (Review Focus 3).
  - Pinching in on the body wheel at 390 × 844 still zooms past the opened view (Review Focus 4).
  - In the iOS Simulator (dev server, as in Task 1), open `/body/shoulders/weight-on-shoulders/pressured` and turn the phone several times. Expected: upright, the whole wedge is on screen; sideways, the ring stops before the card; taps still land on the word tapped (Review Focus 2).
- [ ] **Step 7: Commit**

```bash
git add src/camera.ts tests/unit/camera.test.ts tests/e2e/viewports.spec.ts
git commit -m "Opened rings fit the screen and stay clear of the card, never under 24 px"
```

### Task 4: Long opened labels fit their lifted cell (§5)

**Files:**
- Modify: `src/render/wheel.ts` (the opened branch of `draw`, around line 300; a bold `measure`)
- Test: `tests/unit/wheel-render.test.ts`

**Interfaces:**
- Consumes: `LIFT_RADIAL_PX`, `LIFT_SIDE_PX` from `src/render/selection.ts`; `fitLabel` from `src/render/labels.ts` (unchanged).
- Produces: nothing new outside the renderer.

- [ ] **Step 1: Make the fake canvas measure bold wider.** In `fakeCanvas()` in `tests/unit/wheel-render.test.ts`, multiply `measureText`'s width by 1.05 when `state.font` starts with `'800 '`, about the real difference between weights 600 and 800.
- [ ] **Step 2: Write the failing test**

```ts
test('a long opened label fits inside its lifted cell, at bold', () => {
  const body = buildLayout(loadData().wheels.find((w) => w.id === 'body')!);
  const i = body.byPath.get('shoulders/weight-on-shoulders')!;
  const s = body.segments[i]!;
  const vp: Viewport = { width: 390, height: 600, radius: 187 };
  const cam = ringFocusCamera(body, 1, vp, -s.mid, { remPx: 16, portrait: true, rest: 'half', openedY: null, sideCoreWidth: SHARED.coreWidth });
  // draw() with the body layout, opened on i, mode 'ring', ring 1 (the file's `draw` helper takes a layout, or add one that does)
  const ring = body.rings[1]!;
  const box = (ring.outer - ring.inner) * vp.radius * cam.scale + 2 * LIFT_RADIAL_PX - 2 * 6; // 6: the renderer's LABEL_PAD
  const bold = rec.texts.flatMap((t, k) => (rec.fonts[k]!.startsWith('800 ') ? [t.length * pxOf(rec.fonts[k]!) * 0.6 * 1.05] : []));
  expect(bold.length).toBeGreaterThan(0);
  for (const w of bold) expect(w).toBeLessThanOrEqual(box + 1e-6);
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run tests/unit/wheel-render.test.ts -t "long opened label"`
Expected: FAIL, the bold width exceeding `box`.

- [ ] **Step 4: Implement in `src/render/wheel.ts`.**
  - Add a bold `Measure` that caches widths at `font(MEASURE_PX, true)` in its own map.
  - In the opened branch, keep `fit` (the unopened fit, as today) and then fit again with the bold measure into the lifted box: width `(ring.outer − ring.inner)·R + 2·LIFT_RADIAL_PX − 2·LABEL_PAD`, height `(s.end − s.start + 2·side)·rMid`, size `{ min: fit.px, max: fit.px × LIFT_LABEL }`.
  - Draw that result. If it's `null`, draw `fit.lines` at `fit.px`, bold.
  - Cache the opened fit in a single entry keyed like `LabelCache`, so pinch frames reuse it.
- [ ] **Step 5: Run the unit tests**

Run: `npx vitest run`
Expected: all pass, including "opened label uses weight 800 and a larger px than its neighbours". Short words still grow.

- [ ] **Step 6: Browser check** at 390 × 844 (Review Focus 5): open `/body/shoulders/weight-on-shoulders` and two other long body sensations, and screenshot. Expected: the label sits inside the lifted cell, bold, never truncated.
- [ ] **Step 7: Commit**

```bash
git add src/render/wheel.ts tests/unit/wheel-render.test.ts
git commit -m "Long opened labels fit their lifted cell"
```

### Task 5: Roadmap, ACCESSIBILITY.md, and the PR (§6, §7, §8)

**Files:**
- Modify: `docs/ROADMAP.md`, `ACCESSIBILITY.md`
- Create, only if what shipped differs from the spec: `docs/superpowers/specs/2026-11-18-feels-on-wheels-known-issues-changes.md`

**Interfaces:** none.

- [ ] **Step 1: Roadmap Known issues** (spec §7.1):
  - Delete "Phones: turning and zooming" and its three issues.
  - Under "Layout and labels," delete the four fixed or moved issues. Keep the heading, holding only the new issue "At rest, outer cells are under WCAG AA's 24 px tap target," written from spec §7.3, with its table.
  - Add `### Low priority or not fixing` as the last heading in Known issues, with the five entries from spec §6.
  - Repoint both `#layout-and-labels` links (in Emoji wheel and Wheels for kids) to `#low-priority-or-not-fixing`.
- [ ] **Step 2: Roadmap Shipped row.** Set the row's status to "Shipped" with the date the PR opens, add the plan link, and add a *changes* link if Step 4 writes one.
- [ ] **Step 3: ACCESSIBILITY.md** (spec §7.2):
  - "Easy to read and tap" ends with "…so each word's cell is at least 24 px tall."
  - In Known limitations: delete the double-tap item, the long-words item, and the sideways-iPhone item. Reword the turning item down to taps landing on the wrong word, not reproduced. Add the cells-at-rest item, in plain words.
- [ ] **Step 4: Changes file.** If anything shipped differently from the spec, list each difference in `…-known-issues-changes.md`, named as AGENTS.md says.
- [ ] **Step 5: Run everything**

Run: `npx vitest run && npm run build && npx playwright test tests/e2e`
Expected: all pass, in all five browsers.

- [ ] **Step 6: Commit**

```bash
git add docs ACCESSIBILITY.md
git commit -m "Known issues: fixed ones removed, the rest under Low priority or not fixing"
```

- [ ] **Step 7: Push and open the PR.** Run `git push -u origin known-issues`, then `gh pr create`. Its "What and why" lists each fix and how it was checked:
  - §1 in the iOS Simulator;
  - §3, §4, and §5 with the unit tests, the viewport sweep, and Chromium at the sizes above, with the screenshots;
  - §2 not checked yet: Lucas checks it on his phone;
  - no screen reader or keyboard change.

  No AI attribution in the PR body.
