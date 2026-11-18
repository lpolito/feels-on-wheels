# Changes from the spec: known issues on phones, layout, and labels

What differs from [the spec](2026-11-18-feels-on-wheels-known-issues-design.md).

## Tests (§3, §4, §5)

- **Spec:** two new lines for the rest view (§3), no new test for the opened ring (§4), and a renderer test only if the fake canvas measured by weight (§5).
- **Now:** Lucas, 2026-11-18, while reviewing the plan: "test what needs to be tested." Each new rule got a test that would catch it breaking:
  - `tests/unit/controller.test.ts`: on a sideways phone, the feelings wheel rests and opens a core word at the shared side zoom, so opening never zooms out;
  - `tests/unit/camera.test.ts`: upright phones from 320 to 430 px wide fit every opened ring across the stage with 1rem clear, and at 280 × 653 no opened cell is under 24 px tall;
  - `tests/unit/wheel-render.test.ts`: every middle-ring word on the body wheel, opened at 390 × 844, is never smaller than unopened, and fits its lifted cell at bold unless even its unopened size can't. The fake canvas now measures bold about 5% wider.
- Expectations that changed with the rest view (§3): upright 1024 × 1366 rests on the half-wheel, `shouldStartZoomed`'s "false" example moved from 1440 × 900 to 2560 × 1440, and the side-view tap test taps Surprised instead of Fearful, which is off-screen at the shared side zoom. The viewport sweep needed no changes.

## Opened labels in thin cells (§5)

- **Spec:** short words still grow the full 1.15×.
- **Now:** the opened label is fitted like any label, so the cell's height bounds it too. In a thin cell, a short word may grow a little less than 1.15×.

## How the fixes were checked (§8)

- **Spec:** §1 checked over several turns in the iOS Simulator; the opened ring checked in a browser.
- **Now:** in this session the Simulator's Safari stayed in its tab overview, and turning the device had no effect. One sideways view with the card open showed normal-size text, and the session that found the cause checked the same rule over several turns. Turning the phone (§1, and a word staying clear of the card through a turn) is left for Lucas's phone, with the double-tap check (§2). Chromium covered every size in §4's table, the notched sideways iPhone, pinching in past the opened view, and the long labels.

## After review on the PR (Lucas, 2026-11-18)

Lucas tried the PR's preview at several phone sizes and asked for four more fixes on the same PR. The [round-two plan](../plans/2026-11-18-feels-on-wheels-known-issues-round-2.md) has the details.

- **The wheel keeps its axis while it turns.** With a word opened on a portrait phone, turning to another word (a spin, an arrow key, a tap on a neighbor) used to move the wheel vertically during the turn, because the new word's card is a different height. Now the axis stays still until the turn stops, then the word re-centers between the top and its new card. This removes the prediction added in 3fb060e ("a spin's vertical move joins the spin"); opening and closing still move it in one motion.
- **Portrait: a core word keeps the wheel where it rests.** On the half-wheel (portrait phones), opening a core word no longer slides the wheel right to center its ring: the wheel's center stays on the left edge, so the whole wedge stays in view. Middle and outer words stay centered, and so does a core word where the whole wheel rests: keeping the whole wheel centered there put the opened word under the toolbar in windows 260 px tall (found by the grid sweep).
- **Labels never disappear.** Spec v2.1 §5's minimum label sizes (8 px at rest, 10 or 12 px with a word opened) were readability choices; Lucas wants the labels as the look of the wheel. Labels now shrink as far as their cells need. This also fixes the body wheel resting unlabeled in tiny windows and on an iPhone SE, so that low-priority issue and its accessibility limitation are gone. There's no accessibility cost (the canvas is hidden from screen readers, and every word is in the tree and on the card). Drawing them costs some time while pinching; Lucas checks on his phone whether it's noticeable.
- **Opened labels keep clear of their outline**, 6 px inside it, as an unopened label is of its cell; never smaller than unopened. Checking it found that every label was measured too narrow: widths were scaled down from 100 px, but the system font adds tracking at small sizes (about 4% at 18 px, 12% at 9 px). Labels are now measured with that tracking, and the opened label exactly at its size.
- **Axe checks tap size.** axe 4.14 ships WCAG 2.2 AA's target-size rule turned off; every end-to-end axe run now turns it on. It covers the page's controls, not the wheel's canvas cells.
