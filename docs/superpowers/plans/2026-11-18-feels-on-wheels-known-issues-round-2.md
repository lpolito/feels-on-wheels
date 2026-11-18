# Known issues, round 2: from Lucas's review of the PR — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Four fixes Lucas asked for while reviewing PR #19, on the same branch: the spin keeps its axis, a core word keeps the rest view's horizontal position in portrait, labels never disappear, and opened labels keep clear of their outline.

**Architecture:** Camera rules stay in `src/camera.ts` (`ringFocusCamera`); the spin's vertical move goes away in `src/controller.ts` and `src/main.ts`; the label floors and the opened label's box are in `src/render/wheel.ts`. No new modules.

**Tech Stack:** TypeScript, Canvas 2D, Vite, Vitest, Playwright (end-to-end under `wrangler dev`, including the axe checks).

**Spec:** `docs/superpowers/specs/2026-11-18-feels-on-wheels-known-issues-design.md`. This round goes beyond it, as agreed with Lucas in the PR review conversation (2026-11-18); its design is written into `docs/superpowers/specs/2026-11-18-feels-on-wheels-known-issues-changes.md` (Task 5) and is binding here:

1. **Spin:** the axis (the camera's `cy`) stays still for the whole spin. Once the spin settles and the card has its new content and size, the word re-centers between the top and the card. This removes 3fb060e's prediction (`predictOpenedY`).
2. **Portrait, core word opened:** the camera keeps the rest view's horizontal position: `cx = 0` on the half-wheel, `vp.width / 2` on the whole wheel, but never closer than 1rem to the left for the opened cell (the existing rule). Zoom unchanged. Middle and outer levels stay centered. Sideways unchanged.
3. **Labels never disappear:** the 8 / 10 / 12 px minimums go; a label shrinks as far as it must (to a 1 px floor, only so the fitting loop ends).
4. **Opened labels:** the opened word stays 6 px clear of the inside of its outline (`LABEL_PAD` + `OUTLINE_INNER_PX` from the lifted cell's edges), never below its unopened size; if even that doesn't fit, it's drawn at that size.

## Global Constraints

- Everything in the first plan's Global Constraints still holds (`docs/superpowers/plans/2026-11-18-feels-on-wheels-known-issues.md`): US spelling, Oxford commas, no test-only code paths, no AI attribution in commits or the PR, never push to `main`.
- Test what needs testing: each change gets a test that would catch it breaking.
- Lucas, 2026-11-18: "test all of this across screen sizes. I don't want to accidentally break something else," and "make sure this all passes a11y checks." Task 5 sweeps a grid of window sizes against the build before this round, and runs the full end-to-end suite with its axe checks in all five browsers.

## Review Focus

- **A drag (not a fling) released while opened:** it also must not move `cy` until the spin settles. Task 1's controller test covers the fling; the e2e test in Task 1 uses a real drag-and-release.
- **Turning the phone or resizing mid-spin:** `remeasure` sets `openedY` from the current card; the spin's axis may move then, which is expected (the layout changed). Task 5's grid sweep covers resizes at rest and opened, not mid-spin.
- **Core word opened on a portrait stage that rests on the whole wheel** (wide portrait windows, such as 700 × 700): the wheel stays centered horizontally. Task 2's camera test covers both rest views.
- **Tiny labels:** drawing many 1–4 px labels must not break the sprite cache or contrast checks. Task 3's renderer test and the axe checks in Task 5. Perf is Lucas's phone check (he asked to be reminded).
- **The opened label in the core ring on narrow phones** ("The urge to…", "Head / face" at 393 × 852): Task 4's renderer test covers every core and middle cell of both wheels.

---

### Task 1: The spin keeps its axis; the word re-centers after it settles

**Files:**
- Modify: `src/controller.ts` (remove the `predictOpenedY` parameter and its use in `fling`), `src/main.ts` (remove `predictOpenedY` and the argument to `createController`), `src/ui/card.ts` (remove `unfoldedHeightFor` if nothing else uses it)
- Test: `tests/unit/controller.test.ts`, `tests/e2e/wheel.spec.ts`, and `tests/unit/card.test.ts` if it tests `unfoldedHeightFor`

**Interfaces:**
- Produces: `createController(layout, store, camera, vp, opts)` — five parameters; `setupPhone(initial)` in the controller tests loses its second parameter.

- [ ] **Step 1: Replace the two prediction tests** in `describe('phone: the opened word above the card')` with:

```ts
test('a fling while opened keeps cy still until the spin settles', () => {
  setupPhone(opened('fearful/scared'));
  step(2000);
  const cy = camera.current.cy;
  const p = phoneScreenOf(idx('fearful/scared'));
  ctl.handle([{ type: 'dragStart', x: p.x, y: p.y, axis: 'y' }, { type: 'dragEnd', vx: 0, vy: 2500 }]);
  expect(camera.target.cy).toBe(cy);
  for (let t = 0; t < 120 && camera.moving; t++) { step(16); expect(camera.current.cy).toBeCloseTo(cy, 9); }
  expect(store.get().selected).not.toBe(idx('fearful/scared'));
});
```

- [ ] **Step 2: Flip the e2e test** "phone: after a spin, the word doesn't slide once the spin stops" in `tests/e2e/wheel.spec.ts` to "phone: the axis stays still while the wheel spins, and the word re-centers once it stops": with the same recording, every frame before `restIdx` has `cy` within 1 px of the first frame's, and after settling the word is centered (`Math.abs(y - mid) <= 2`, as today).
- [ ] **Step 3: Run both to see them fail**

Run: `npx vitest run tests/unit/controller.test.ts -t "keeps cy still"` and `npx playwright test tests/e2e/wheel.spec.ts -g "axis stays still" --project=iphone`
Expected: FAIL (the target `cy` jumps to the predicted y at the fling).

- [ ] **Step 4: Implement:** remove the prediction (Files above). `placeOpened` already runs on every store change after `renderUi`, so the settle that picks the new word re-centers it after the card renders.
- [ ] **Step 5: Run the unit suite, the type check, and the e2e test**

Run: `npx vitest run && npm run build && npx playwright test tests/e2e/wheel.spec.ts --project=iphone --project=chromium`
Expected: PASS.

- [ ] **Step 6: Commit** — `git commit -m "The wheel keeps its axis while it spins; the word re-centers once it stops"`

### Task 2: A core word keeps the rest view's horizontal position (portrait)

**Files:**
- Modify: `src/camera.ts` (`ringFocusCamera`'s `cx`)
- Test: `tests/unit/camera.test.ts`

**Interfaces:** none new.

- [ ] **Step 1: Write the failing test** in `describe('resting cameras')`:

```ts
test("portrait, a core word keeps the rest view's horizontal position; deeper words stay centered", () => {
  const vp: Viewport = { width: 402, height: 600, radius: 193 };
  const half = { remPx: 16, portrait: true, rest: 'half' as const, openedY: null, sideCoreWidth: SHARED.coreWidth };
  for (const l of [layout, buildLayout(loadData().wheels.find((w) => w.id === 'body')!)]) {
    expect(ringFocusCamera(l, 0, vp, 0, half).cx, `${l.wheelId} half`).toBe(wheelCamera(l, vp, 0, half).cx);
    expect(ringFocusCamera(l, 0, vp, 0, { ...half, rest: 'whole' }).cx, `${l.wheelId} whole`).toBe(vp.width / 2);
    for (const ring of [1, 2]) {
      const cam = ringFocusCamera(l, ring, vp, 0, half);
      expect(cam.cx + ((l.rings[ring]!.inner + l.rings[ring]!.outer) / 2) * vp.radius * cam.scale, `${l.wheelId} ring ${ring} centered`).toBeCloseTo(vp.width / 2, 6);
    }
  }
});
```

- [ ] **Step 2: Run it to see it fail** — `npx vitest run tests/unit/camera.test.ts -t "rest view's horizontal"` → FAIL (`cx` is the centered value).
- [ ] **Step 3: Implement:** in portrait, for `ring === 0`, `cx = Math.max(o.rest === 'half' ? 0 : vp.width / 2, o.remPx - (r.inner * R - LIFT_RADIAL_PX))`; other rings as today.
- [ ] **Step 4: Run the unit suite and the sweep** — `npx vitest run && npx playwright test tests/e2e/viewports.spec.ts --project=chromium` → PASS (the upright-fit test from round 1 must still pass for ring 0).
- [ ] **Step 5: Commit** — `git commit -m "Portrait: opening a core word keeps the wheel where it rests"`

### Task 3: Labels never disappear

**Files:**
- Modify: `src/render/wheel.ts` (the `floor` function)
- Test: `tests/unit/wheel-render.test.ts` (the two floor tests), `tests/e2e/viewports.spec.ts` (`BODY_UNLABELLED`, and an every-ring check at rest)

- [ ] **Step 1: Replace the floor tests.** "ring view: 12 px floor…" becomes "labels draw on every ring at any size, below the old 8 / 10 / 12 px floors": at 375 × 667 on the half-wheel (`ringFocusCamera` not used; the rest camera `{ scale: 0.95 * 375 / radius, cx: 0 }`), the body wheel draws a label in every outer cell in view (`r.stats.labelsByRing[2] > 0`) and the smallest outer label is under 8 px. "the floors scale with remPx" is deleted (no floors).
- [ ] **Step 2: In the viewport sweep**, delete `BODY_UNLABELLED` and its branch, and at rest assert every ring draws labels: `expect(labels.every((n) => n > 0))`.
- [ ] **Step 3: Run them to see them fail** — the unit test and the sweep at 375 × 667 `/body` (outer ring 0 labels) → FAIL.
- [ ] **Step 4: Implement:** `floor` returns `1 * k` (a 1 px floor only so the fitting loop ends), with a comment: labels are the look of the wheel; they never disappear (Lucas, 2026-11-18).
- [ ] **Step 5: Run** — `npx vitest run && npx playwright test tests/e2e/viewports.spec.ts --project=chromium` → PASS.
- [ ] **Step 6: Commit** — `git commit -m "Labels never disappear"`

### Task 4: Opened labels keep clear of their outline

**Files:**
- Modify: `src/render/wheel.ts` (the opened branch's box), import `OUTLINE_INNER_PX`
- Test: `tests/unit/wheel-render.test.ts` (round 1's opened-label test)

- [ ] **Step 1: Widen round 1's test** to every core and middle cell of both wheels, at 393 × 852 (`radius: 188.5`), with `box = (ring.outer - ring.inner) * R + 2 * LIFT_RADIAL_PX - 2 * (6 + 2)`. Rename it "opened labels stay 6 px clear of their outline and never shrink". Keep the fallback assertion.
- [ ] **Step 2: Run it to see it fail** → FAIL on a core cell (e.g. `urges`).
- [ ] **Step 3: Implement:** the opened box width becomes `r1 - r0 - 2 * (LABEL_PAD + OUTLINE_INNER_PX)`.
- [ ] **Step 4: Run** — `npx vitest run` → PASS. Screenshot `/body/urges` and `/body/head` at 393 × 852 for the PR.
- [ ] **Step 5: Commit** — `git commit -m "Opened labels keep clear of their outline"`

### Task 5: Every size, a11y, docs, and the PR

**Files:**
- Modify: `docs/superpowers/specs/2026-11-18-feels-on-wheels-known-issues-changes.md`, `docs/ROADMAP.md`, `ACCESSIBILITY.md`

- [ ] **Step 1: Grid sweep against the round-1 build.** Build `ab3c48e`'s successor before this round (`e58ebc8`) and this round's HEAD as test builds. In Chromium, for every window from 260 to 2000 px wide and 260 to 1400 px tall in 40 px steps, on both wheels, at rest and with a core, a middle, and an outer word opened, check what the e2e sweep checks (switch and toolbar don't overlap and stay inside; card inside; the opened word inside the aim area and not under the card, switch, or toolbar) plus every ring drawing labels at rest. Expected: no size fails on HEAD that passed on `e58ebc8`. Any that does is a finding: fix it (test first) before going on.
- [ ] **Step 2: Docs.**
  - Changes file: a section "After review on the PR (Lucas, 2026-11-18)" with the four rules above and why.
  - Roadmap: delete "Tiny windows show the body wheel unlabeled at rest" from Low priority or not fixing.
  - ACCESSIBILITY.md: delete the "Small windows… without labels" limitation.
- [ ] **Step 3: Run everything** — `npx vitest run && npm run build && npm run size && npx playwright test tests/e2e` → all pass in five browsers, including the axe checks.
- [ ] **Step 4: Commit and push** — `git commit -m "Round two of the known issues: docs"`; `git push`.
- [ ] **Step 5: Update the PR body** (`gh pr edit 19 --body-file …`): add the round-two fixes and how each was checked, and in Lucas's phone checks add: "pinch in and out on both wheels to see whether drawing every label is noticeable."
