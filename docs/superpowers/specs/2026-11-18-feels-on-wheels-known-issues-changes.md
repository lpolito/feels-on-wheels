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
