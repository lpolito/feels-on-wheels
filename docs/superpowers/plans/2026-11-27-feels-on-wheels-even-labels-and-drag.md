# Even label sizes and drag that follows the finger: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every label in a ring is drawn at one size, and with a word opened an up/down drag turns the wheel by the finger's angle.

**Architecture:** The renderer works out one size per ring (the smallest of its labels' own fits, over the whole ring) and fits each label with that as its max. The controller's drag and fling use the whole wheel's angle rule in a ring view too, for up/down drags.

**Tech Stack:** TypeScript, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-27-feels-on-wheels-even-labels-and-drag-design.md`

## Global Constraints

- One size per ring, worked out over the whole ring (not just cells on screen), so turning never changes it.
- Each label still picks one line or two for itself, at that size.
- Up/down drags with a word opened: turn by the finger's angle around the wheel's center; fling with the same angular speed. Left/right swipes, and mouse/trackpad scrolling, unchanged.
- Perf: spinning stays under the perf tests' 20 ms bar.
- US spelling.

## Review Focus

- Pinch and the open/close zoom: R changes every frame, so the ring size is recomputed every frame. Expect: still smooth (`npm run test:perf` or the perf specs under `tests/perf/`).
- A ring with one long two-line label (body wheel's "Throat / mouth" in a ring view): the existing wrap test must still pass.
- The opened (lifted) label grows from its unopened size, which is now the ring size: the existing "opened labels stay 6 px clear" test must still pass.
- A drag that started on the x axis in a ring view still swipes, never turns (existing tests).

---

### Task 1: Drag follows the finger's angle with a word opened

**Files:**
- Modify: `src/controller.ts` (`case 'drag'` and `case 'dragEnd'`, about lines 235-255)
- Test: `tests/unit/controller.test.ts` (`describe('spinning')`)

**Interfaces:** none new. `angularVelocity(vx, vy)` already exists in `src/controller.ts`.

- [ ] **Step 1: Write the failing tests**

In `describe('spinning')`:

- `test('with a word opened, the spot you grab stays under your finger, wherever you grab')`: `setup(opened('angry/annoyed'))`, `step(1000)`. Grab a point halfway between the wheel's center and the opened ring (in `screenOf` terms: center + 0.5 × (screenOf(opened) − center), offset up 40 px), then `drag` 30 px down (axis `'y'`). Expect `camera.current.rotation` changed by exactly `atan2` of the new point minus `atan2` of the old point around `(camera.current.cx, camera.current.cy)`, to 1e-9.
- `test('with a word opened, the same fling turns further when grabbed nearer the center')`: two runs from the same opened state; each `dragStart` + one 20 px `drag` + `dragEnd` with `vy: 900`, one grabbed at the opened ring's radius, one at half that radius. Expect the inner run's `camera.target.rotation` change (right after `dragEnd`) to be larger in magnitude.

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/unit/controller.test.ts -t "spinning"`
Expected: the two new tests FAIL; the rest pass.

- [ ] **Step 3: Implement**

In `case 'drag'`, use the existing angle branch when `ring === null || dragAxis === 'y'`. In `case 'dragEnd'`, `v = angularVelocity(i.vx, i.vy)` when `ring === null || dragAxis === 'y'`. `case 'scroll'` stays as it is.

- [ ] **Step 4: Run the controller tests**

Run: `npx vitest run tests/unit/controller.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

`git commit -m "With a word opened, dragging follows the finger wherever you grab"`

### Task 2: One label size per ring

**Files:**
- Modify: `src/render/wheel.ts` (`draw`, the label loop at about lines 296-312)
- Test: `tests/unit/wheel-render.test.ts` (`describe('label floors by ring (spec v2.1 §5)')`)

**Interfaces:** none new; `fitLabel` in `src/render/labels.ts` is unchanged.

- [ ] **Step 1: Write the failing tests**

- `test('every label in a ring is drawn at one size, on both wheels (even labels spec §1)')`: on `phone` (393 × 851, whole wheel, `frame(phone)`), for both wheels, map each drawn 600-weight text to its ring (a full label, or one line of a two-line label; skip texts that belong to labels in more than one ring), and expect one distinct px per ring.
- `test('turning the wheel never changes a ring\'s label size')`: feelings wheel, ring view on ring 1 (`ringFocusCamera` as in the opened-labels test, phone 393 × 600) at two rotations (centered on `scared/anxious` and on `sad/hurt`): the set of px per ring is the same in both draws.

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run tests/unit/wheel-render.test.ts`
Expected: the first new test FAILS (middle ring has 15.6 and 10.4 px); the second may pass already.

- [ ] **Step 3: Implement**

In `draw`, before the label loop, work out `ringPx[r]` for each ring: the smallest `px` of `fitLabel` over every segment in the ring (with the same box, floor, `maxPx` and `wrapAt(r)` the loop uses), skipping null fits; fall back to `maxPx` if all are null. Cache it per ring, keyed by the inputs that change it (R to within `FIT_TOLERANCE`, `maxPx`, `wrapAt`, `floor`), so still frames don't refit. In the loop, call `fitted(..., floor, ringPx[s.ring], wrapAt(s.ring))`. Update the comment above `wrapAt` to say labels share their ring's size (even labels spec, 2026-11-27).

- [ ] **Step 4: Run the unit tests**

Run: `npx vitest run`
Expected: all PASS. If a test counting `stats.labelFits` fails because the ring pass adds fits, keep those counts meaning what they did (count only the loop's fits) rather than loosening the test.

- [ ] **Step 5: Commit**

`git commit -m "Every label in a ring is drawn at one size"`

### Task 3: Docs, then the full checks

**Files:**
- Modify: `docs/ROADMAP.md` (Shipped table; remove the drag known issue under Navigation)
- Modify: `ACCESSIBILITY.md` only if it lists the drag issue (it doesn't today)

- [ ] **Step 1:** Add a Shipped row: "Even label sizes in each ring, and drag that follows the finger with a word opened", Shipped 2026-11-27, with spec and plan links. Delete the "With a word opened, dragging turns the wheel at the opened ring's speed" known issue.
- [ ] **Step 2:** Run `npm test`, `npx tsc --noEmit` (or the project's type-check script), `npm run build`, `npm run size`, and `npm run test:e2e`. Expected: all pass. Regenerate `public/og/` only if `scripts/make-og-image.mjs` uses the renderer's label sizing; it draws from the layout code, which this doesn't change.
- [ ] **Step 3:** Check in the browser on a 375 × 812 phone: whole wheel, a core selected, a word opened, both wheels; drag with a word opened from near the center and near the edge.
- [ ] **Step 4:** Commit.
