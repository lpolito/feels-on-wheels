# Known issues, round 3: the opened wedge centers below the controls — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On portrait stages, the opened wedge's middle sits halfway between the bottom of the controls and the top of the fully unfolded card, instead of halfway between the top of the stage and the card.

**Architecture:** One measurement changes in `src/main.ts` (`openedYForHeight`): its top edge becomes the lower of the bottoms of `fw-wheel-switch` and `fw-toolbar`. The camera (`ringFocusCamera`'s `openedY`), the controller, and the card's height cap stay as they are.

**Tech Stack:** TypeScript, Vite, Playwright (end-to-end under `wrangler dev`, including the axe checks).

**Spec:** `docs/superpowers/specs/2026-11-18-feels-on-wheels-known-issues-changes.md`, section "After review on the PR, round three". It replaces v1.3 §4.2's placement rule (`docs/superpowers/specs/2026-11-07-feelings-wheel-v1.3-design.md`), which stays as written.

## Global Constraints

- Everything in the first plan's Global Constraints still holds (`docs/superpowers/plans/2026-11-18-feels-on-wheels-known-issues.md`): US spelling, Oxford commas, no test-only code paths, no AI attribution in commits or the PR, never push to `main`.
- The card's height cap (`.fw-float`'s `max-height` in `src/styles/app.css`, fed by `--opened-half`) doesn't change.
- Lucas, 2026-11-18: "who cares where the edges fall." The card or the controls may cover the wedge's edges on short phones; only the wedge's middle (its label) has a place to be.

## Review Focus

- **Very short portrait windows (420 px tall or less):** today the opened word can sit under the toolbar there (roadmap, Low priority; ACCESSIBILITY.md). Expected: with the new top edge, the word sits between the controls and the card. Task 1 adds a test at 360 × 380; Task 2 removes the known issue only if it passes.
- **Square windows that use the phone layout (900 × 900):** they center below the controls too. Covered by the existing test, through the shared `openedPlacement` helper Task 1 changes.
- **Turning to another word and resizing while opened:** both re-center through `openedYFor`, so they follow the new rule. Covered by the existing "moving to a word with a different card height" and "resize while opened" tests, through the same helper.
- **A larger text size** makes the controls taller. `openedYFor` measures them on each open, move, and resize; a text-size change alone re-centers on the next of those. Accepted, no test.
- **Sideways layouts:** `openedYFor` returns null there, so nothing changes. Covered by the existing sideways tests in the full run (Task 2).

---

### Task 1: Center the opened wedge between the controls and the card

**Files:**
- Modify: `src/main.ts` (`openedYFor`'s doc comment and `openedYForHeight`, around lines 281–298)
- Test: `tests/e2e/wheel.spec.ts` (`openedPlacement` helper around line 583; the phone test "the opened word is centered between the top and the unfolded card" around line 664; a new phone test beside it)

**Interfaces:**
- Consumes: `wheelSwitch` and `toolbar`, the elements `src/main.ts` already holds (`$<FwWheelSwitch>('fw-wheel-switch')`, `$<FwToolbar>('fw-toolbar')`).
- Produces: `openedPlacement(page, path)` returns `{ y, mid, cardTop, controlsBottom, half }`, where `controlsBottom` is the larger of the two controls' `boundingBox()` bottoms and `mid` is `(controlsBottom + cardTop) / 2`.

- [ ] **Step 1: Change the helper and the tests**

In `openedPlacement`, measure `fw-wheel-switch` and `fw-toolbar`, and return `controlsBottom` and the new `mid`. Rename the test to `phone: the opened wedge is centered between the controls and the unfolded card`, and replace its `y + half < cardTop` line (the edges may now fall under the card) with:

```ts
expect(y, path).toBeGreaterThan(controlsBottom);
expect(y, path).toBeLessThan(cardTop);
```

Add, in the same `phone` describe:

```ts
test('phone: in a very short window the opened word sits between the controls and the card', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 380 });
  for (const path of ['fearful', 'fearful/scared', 'fearful/scared/helpless']) {
    await open(page, `/${path}`);
    const { y, mid, cardTop, controlsBottom } = await openedPlacement(page, path);
    expect(Math.abs(y - mid), path).toBeLessThanOrEqual(2);
    expect(y, path).toBeGreaterThan(controlsBottom);
    expect(y, path).toBeLessThan(cardTop);
  }
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx playwright test tests/e2e/wheel.spec.ts --project=iphone --project=pixel -g "phone: the opened wedge|phone: in a very short|re-centers|keeps the word centered"` and `npx playwright test tests/e2e/wheel.spec.ts --project=chromium -g "square 900"`
Expected: FAIL on `Math.abs(y - mid)`, about 30 px off (half the controls' height).

- [ ] **Step 3: Measure from the controls in `openedYForHeight(unfolded: number): number`**

Replace `top` (the stage's top plus the app's top padding) with `Math.max(wheelSwitch.getBoundingClientRect().bottom, toolbar.getBoundingClientRect().bottom)`; the result stays in stage coordinates (`- stageTop`). Update `openedYFor`'s doc comment: halfway between the bottom of the controls and the top of the card once fully unfolded (known issues, round three, Lucas, 2026-11-18).

- [ ] **Step 4: Run them to see them pass**

Run the two commands from Step 2.
Expected: PASS. If only the very short window fails, keep the test's failure output for Task 2's decision, and remove that test.

- [ ] **Step 5: Commit**

```bash
git add src/main.ts tests/e2e/wheel.spec.ts
git commit -m "Portrait: the opened wedge centers between the controls and the card"
```

### Task 2: Docs, the full run, and the PR

**Files:**
- Modify: `docs/ROADMAP.md` (the Known issues Shipped row; Low priority's "Very short phones" entry), `ACCESSIBILITY.md` (known limitations, "On very short phones"), `docs/superpowers/specs/2026-11-18-feels-on-wheels-known-issues-changes.md` (round three: how it was checked, and the very short window)
- The PR description of lpolito/feels-on-wheels#19 (via `gh pr edit 19 --body-file`)

**Interfaces:**
- Consumes: Task 1's result for the 360 × 380 test.

- [ ] **Step 1: Run every check**

Run: `npm test`, `npx tsc --noEmit`, `npm run size`, and `npm run test:e2e` (all five browsers; run it in the background, it takes several minutes).
Expected: all pass.

- [ ] **Step 2: Check it in a browser**

In Chromium at 393 × 659 (an iPhone 15 in Safari), open `/body/urges`, `/body/whole-body`, `/sad`, and `/bad` and confirm the wedge's middle is within 2 px of halfway between the controls' bottom and the card's top; screenshot one for the PR.

- [ ] **Step 3: Update the docs**

- Roadmap Shipped row: add "an opened wedge centered below the controls" to the change's name and a [round-three plan](superpowers/plans/2026-11-18-feels-on-wheels-known-issues-round-3.md) link before *changes*.
- If Task 1's very short window test passed: delete the roadmap's "Very short phones" Low-priority entry and ACCESSIBILITY.md's "On very short phones" line, and say so in the changes file's round-three section. If it failed: leave both, and add to the roadmap entry what the test found.
- Changes file, round three: one line on how it was checked (the tests above and Step 2).
- Roadmap Ideas: a new group "Layout" with the idea "Half-wheel on tablets, card on the right" (and its table row). Lucas, 2026-11-18: rest on the half-wheel on much larger displays, like tablets, but keep the opened word's card on the right, as the desktop layout does today. He expects it to make the label jump below easier to fix. To decide when designing: which windows count, how the half-wheel and the opened view fit beside the card, and how it meets the rest-view rules in `src/camera.ts` (`restView`, `useHalfWheel`, `isPortrait`).
- Roadmap Known issues › Layout and labels: "Labels jump while a word opens." Found 2026-11-18 on Lucas's phone, also on `main`. When a word opens, the size where labels wrap to two lines switches from 8 to 12 px at once (it follows the app's mode), while the cells grow with the camera's zoom over about a second. Labels between those sizes wrap to two lines at about double their size, then go back to one line partway through the zoom ("Whole body" on the body wheel at 393 × 650: 9.5 px, then 20.5 px on two lines, then 12 px). Lucas set it aside for the half-wheel idea; link to it. No fix chosen yet.

- [ ] **Step 4: Commit and push**

```bash
git add docs/ROADMAP.md ACCESSIBILITY.md docs/superpowers/specs/2026-11-18-feels-on-wheels-known-issues-changes.md docs/superpowers/plans/2026-11-18-feels-on-wheels-known-issues-round-3.md
git commit -m "Round three of the known issues: docs"
git push
```

- [ ] **Step 5: Update the PR description**

Add a "Round three, from Lucas's phone" part to "What and why" (the wedge centers below the controls; edges may fall under the card or the controls on short phones; the label jump and the half-wheel idea logged in the roadmap), update "How it was checked", and move Lucas's confirmed phone checks (double-tap on the theme label, turning the phone, pinching) out of "Not done yet".
