# Sideways zoom: the core word stays in view — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On sideways whole-wheel layouts, a middle word's view keeps the whole core ring on screen, and a core word's view zooms halfway (geometric mean) between the rest view and the middle word's view.

**Architecture:** Two extra rules at the end of `ringFocusCamera` in `src/camera.ts`, gated on `!o.portrait && o.rest === 'whole'`. Everything else that reads ring views (controller, pinch limit, side view) goes through `ringFocusCamera` unchanged.

**Tech Stack:** TypeScript, Vitest (unit), Playwright under `wrangler dev` (e2e).

**Spec:** `docs/superpowers/specs/2026-11-18-feels-on-wheels-sideways-zoom-design.md`

## Global Constraints

- Only where `!o.portrait && o.rest === 'whole'`. The side view (`rest === 'side'`), the half-wheel, and every portrait camera return exactly what they return on main.
- Middle-word cap: `scale ≤ (vp.width − LIFT_RADIAL_PX − OUTLINE_OUTSIDE_PX − insetLeft − rem) / ((1 − core.inner) · vp.radius)`, where `core` is `layout.rings[0]`. Then raised to the 24 px floor (`MIN_CELL_PX / arcAtScale1`) and `MIN_RING_SCALE` (1.25), as today.
- Core-word view: `max(today's core scale, √(middle-word scale))`, the middle-word scale being the capped one. It only raises.
- The outer ring's view doesn't change.
- No device or size thresholds; no test-only code paths.
- US spelling, serial commas in docs.

## Review Focus

1. A notched sideways window (`insetLeft > 0`) on a whole-wheel layout: the core ring clears the inset by 1rem. → Task 1 test with `insetLeft: 59`.
2. A narrow sideways whole-wheel stage where the cap would push middle cells under 24 px: the floor wins. → Task 1 test at `{ width: 500, height: 768, radius: 242 }` asserts cells ≥ 24 px.
3. Where the core ring already fits (1440 × 900 aim `{ width: 996, height: 900, radius: 442 }`): the middle view is unchanged. → Task 1 test.
4. The side view and portrait views unchanged. → Task 2 test comparing against today's numbers.
5. The body wheel's core view at 1024 × 768 (own 1.73 > √2.23) keeps its own zoom. → Task 2 test.

---

### Task 1: Middle-word view keeps the core ring on screen

**Files:**
- Modify: `src/camera.ts` (`ringFocusCamera`; remove the `SPIKE` code first: `git checkout src/camera.ts`)
- Test: `tests/unit/camera.test.ts`

**Interfaces:**
- Produces: `ringFocusCamera(layout, 1, vp, rotation, o)` returns the capped middle-word scale when `!o.portrait && o.rest === 'whole'`. Task 2 calls it for the core view.

- [ ] **Step 1: Write the failing tests** in a new `describe('sideways: the core word stays in view', …)`, with `const ipad: Viewport = { width: 708, height: 820, radius: 346 }` (1180 × 820's aim width):
  - `'a middle word keeps the whole core ring 1rem clear of the left, on both wheels'`: for each wheel and `insetLeft` in `[0, 59]`, `cam.cx + l.rings[0].inner * ipad.radius * cam.scale >= insetLeft + 16 - 1e-9`, and the right edge rule still holds (`cam.cx + R + 12 ≈ ipad.width`).
  - `'the cap brings 1180 × 820 from 2.89 to 2.23'`: feelings ring 1 scale `toBeCloseTo(2.23, 2)` (was 2.89).
  - `'where the core ring already fits, the middle view is unchanged'`: at `{ width: 996, height: 900, radius: 442 }`, feelings ring 1 scale `toBeCloseTo(2.26, 2)`.
  - `'the 24 px floor beats the cap'`: at `{ width: 500, height: 768, radius: 242 }`, the body wheel's typical middle cell (median width × ring-1 middle radius × radius × scale) ≥ 24 − 1e-9.
- [ ] **Step 2: Run** `npx vitest run tests/unit/camera.test.ts` — expect the new tests to fail (2.89 ≠ 2.23, core ring off-screen).
- [ ] **Step 3: Implement.** In `ringFocusCamera`, for `ring === 1` under the gate, take `min` of `want`/`fit` with the cap from Global Constraints before the existing `Math.max(…, MIN_CELL_PX / arcAtScale1, MIN_RING_SCALE, restScale)`. Comment it with the spec name and Lucas's 2026-11-18 report.
- [ ] **Step 4: Run** `npx vitest run tests/unit/camera.test.ts`. The new tests pass. `'desktop ring camera keeps the opened cell at least 1rem from the left'` will now fail on `expect(innerX(1, mid)).toBeCloseTo(16, 6)`: the core-ring cap now sets the middle cell further right. Update that test's final assertion to `toBeGreaterThan(16)` and its comment to say the core-ring cap keeps it further in; keep the "edge rule alone would put it off the left edge" assertion.
- [ ] **Step 5: Commit** `src/camera.ts tests/unit/camera.test.ts`: "Sideways: a middle word keeps the core ring on screen".

### Task 2: Core-word view zooms halfway to the middle view

**Files:**
- Modify: `src/camera.ts` (`ringFocusCamera`)
- Test: `tests/unit/camera.test.ts`

**Interfaces:**
- Consumes: `ringFocusCamera(layout, 1, vp, rotation, o).scale` from Task 1.

- [ ] **Step 1: Write the failing tests** in the same `describe`:
  - `'a core word zooms to the square root of the middle view'`: on `ipad`, for the feelings wheel, `ring0.scale toBeCloseTo(Math.sqrt(ring1.scale), 6)` (≈ 1.49).
  - `'a core view that already zooms further keeps its own zoom'`: body wheel at 1024 × 768's aim `{ width: 600, height: 768, radius: 292 }`: ring 0 scale `toBeCloseTo(1.73, 2)`.
  - `'the side view and portrait cameras are unchanged'`: at 852 × 393 (`{ width: 476, height: 393, radius: 188.5 }`, `rest: 'side'`) ring 0 scale `toBeCloseTo(2.68, 2)` on both wheels, and the existing portrait half-wheel tests still pass untouched.
- [ ] **Step 2: Run** `npx vitest run tests/unit/camera.test.ts` — the square-root test fails (1.25 ≠ 1.49).
- [ ] **Step 3: Implement.** For `ring === 0` under the gate, raise `scale` to `Math.sqrt(ringFocusCamera(layout, 1, vp, rotation, o).scale)`. No recursion risk: ring 1 doesn't call ring 0.
- [ ] **Step 4: Run** `npm test`. All unit tests pass; update only expectations that changed because of the spec's table (core views at 1.25 on sideways whole-wheel stages), naming the spec in each changed comment.
- [ ] **Step 5: Commit** `src/camera.ts tests/unit/camera.test.ts`: "Sideways: a core word zooms halfway to the middle view".

### Task 3: End-to-end, browser check, and docs

**Files:**
- Modify: `tests/e2e/viewports.spec.ts` (only if expectations change), `docs/ROADMAP.md`
- Create (only if what shipped differs): `docs/superpowers/specs/2026-11-18-feels-on-wheels-sideways-zoom-changes.md`

- [ ] **Step 1: Run** `npm run test:e2e` (all five browsers). Expected: pass; fix only sweep expectations the spec's table predicts.
- [ ] **Step 2: Browser check** (dev server `dev` in `.claude/launch.json`): at 1024 × 768, 1180 × 820, 1366 × 1024, and 1440 × 900, open Happy then Accepted on the feelings wheel and Whole body then a middle word on the body wheel; the core ring stays in view. At 852 × 393 and 820 × 1180, the views match main.
- [ ] **Step 3: Docs.** Add a Shipped row to `docs/ROADMAP.md` after the known-issues row: "Sideways tablets and computers: the core word stays in view with a middle word open, and opening a core word zooms in a little more", linking spec and plan. `ACCESSIBILITY.md`: no change.
- [ ] **Step 4: Commit** the docs (and any sweep changes): "Sideways zoom: roadmap".
