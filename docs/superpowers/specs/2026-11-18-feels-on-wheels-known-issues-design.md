# Known issues: phones, layout, and labels

Status: approved by Lucas, 2026-11-18. Covers the roadmap's Known issues groups "Phones: turning and zooming" and "Layout and labels" as they stood on main at 6e4d852 (after the [body wheel rework](2026-11-15-feels-on-wheels-body-wheel-rework-design.md)).

## Why

The known-issues list keeps growing, and most of it has been sitting with "No fix chosen yet." Lucas wants it shorter: investigate each issue, fix the ones worth fixing, and say plainly why the rest aren't being fixed. Issues that stay go under a new heading, so the list shows what is still open and what was looked at and set aside.

## Goals

- Fix the four issues Lucas chose: the card's text growing when the phone turns (§1), double-tap zoom on the toolbar's and the card's labels (§2), the two wheels resting and zooming differently in the same window, with the body wheel's opened ring running under the card (§3 at rest, §4 opened), and long opened labels spilling past their cell (§5).
- Sort the other five under a new "Low priority or not fixing" heading at the end of Known issues, each with what was found and why (§6).
- Keep the roadmap, ACCESSIBILITY.md and the known limitations in step (§7).

## Non-goals

- Fixing cells at rest that are smaller than WCAG 2.2 AA's 24 px tap target. It was found during this work, it is logged as a new known issue (§7.3), and it needs its own design.
- Any change to the wheels' content, colors, or layout outside the camera rules below.

## Anti-goals

- The two wheels resting in different views at the same window size: a different kind of view (whole wheel, half-wheel, or side view) or, in the side view, a different zoom. That is the problem being fixed. With a word opened, the two wheels may zoom differently (§4), but neither runs off the screen or under the card.
- Rules kept true by tests rather than by how the code is built. Lucas doesn't want convoluted tests: the rules hold because both wheels feed the same numbers to the camera.
- Blocking people's own zoom: `text-size-adjust` uses `100%`, never `none`; `touch-action: manipulation` keeps pinch zoom.

## Lucas's decisions

- The aim is fewer known issues. Issues not fixed stay listed under "Low priority or not fixing" with a note.
- Layout fixes are checked across a wide range of window sizes.
- The feelings wheel and the body wheel always rest in the same view at the same window size. Where they differ today, the half-wheel wins.
- Sideways phones rest on the side view at the same zoom on both wheels: the closer one, the body wheel's today (Lucas, after comparing screenshots at 852 × 393).
- Those rules hold by construction: shared numbers, worked out when the wheel list loads (not at build time, and not written by hand). Tests: two lines in `tests/unit/camera.test.ts`, plus updating only the viewport sweep expectations that change.
- Opening a word: each wheel keeps its own zoom, but the opened ring always fits on screen: across an upright phone, and left of the card when sideways (§4). Lucas chose this after comparing screenshots of four ways (Approaches, below). It's fine for the cell to drop below 44 px there: 44 px is WCAG's AAA level and Apple's guideline. WCAG's AA level, 24 px, is the floor.
- ACCESSIBILITY.md states only the lower bound for cell height.
- Fix: 1 to 5 above. Low priority or not fixing: taps landing on the wrong word, wide fallback fonts, the outer ring off the right edge in portrait, the body wheel unlabeled in tiny windows, and very short phones.

## Approaches (zoom when a word is opened)

Today `ringFocusCamera` (`src/camera.ts`) zooms until a typical cell in the opened ring is 4.5rem tall, clamped so the ring's band is at most 60% of the stage width, then raised to a 44 px floor (`MIN_TARGET_PX`). The body wheel's cells are thinner (126 outer cells against 82), so the floor zooms it further: on an upright iPhone its opened outer ring is wider than the screen, and on a sideways iPhone (59 px notch) it runs under the card.

Camera scale with a word opened, on main (core / middle / outer):

| Window | Feelings | Body |
|---|---|---|
| 390 × 844 | 1.90 / 4.17 / 3.79 | 2.70 / 4.17 / 5.83 |
| 852 × 393 | 1.89 / 5.30 / 4.28 | 2.68 / 5.42 / 5.78 |
| 1180 × 820 | 1.25 / 2.89 / 3.23 | 1.46 / 2.96 / 3.23 |
| 1440 × 900 | 1.25 / 2.26 / 2.62 | 1.25 / 2.32 / 3.43 |

Four ways, each built and screenshotted on both wheels at an upright and a sideways iPhone, a sideways iPad, and a laptop:

1. **Same zoom on both wheels, giving way to the card.** Both wheels zoom by the narrowest cell of any wheel. Identical views, but the feelings wheel zooms in further than it needs to everywhere (outer ring 3.79 → 5.83 on an upright iPhone, 2.62 → 3.43 on a laptop), and its opened cell runs across the whole phone too.
2. **Each wheel keeps its own zoom, giving way to the card.** Fixes the sideways iPhone only; the body wheel's opened ring is still wider than an upright phone.
3. **Leave it.** The overflow stays.
4. **Each wheel keeps its own zoom, and the opened ring always fits on screen** (chosen). The body wheel's opened outer ring fits across upright phones and stops left of the card sideways; its opened cells go from 44 px to 34 px (375 × 667), 36 px (390 × 844), and 40 px (430 × 932, and a sideways iPhone 15). The feelings wheel already fits from 360 px wide up; it changes only on narrower phones (§4). On iPads and computers nothing changes, since the 60% band clamp already keeps the ring narrower.

Lucas picked 4: he liked how the feelings wheel looks on an upright iPhone, where the whole opened wedge shows, and wanted the body wheel to look the same. The opened views at the same level aren't identical on the two wheels (the body wheel still zooms further to make its cells taller), but both now show the whole wedge, and neither runs under the card.

## §1 Turning the phone: text-size-adjust on every page

**Found:** reproduced in Safari on the iOS Simulator (iPhone 17, iOS 26.3). Sideways, Safari sometimes enlarges the card's list and headings; turned back upright, the text returns to normal. `app.css` sets `-webkit-text-size-adjust: 100%` only on About (`html[data-route="about"] body`).

**Change:** in `src/styles/app.css`, replace that rule with

```css
html { -webkit-text-size-adjust: 100%; text-size-adjust: 100%; }
```

`100%`, not `none`: `none` has blocked people's own text zoom in some browsers.

**Trade-off:** Chrome on Android follows it too, so its font boosting goes. The app sizes its own text, so nothing should depend on boosting.

**Checked by:** the iOS Simulator (several turns with a word open, text keeps its size). Playwright doesn't emulate text inflation, so there is no automated test.

## §2 Double-tap zoom on the labels

**Found:** not reproducible in the Simulator, whose taps are too slow to make a double-tap. The cause in the roadmap holds: the labels are plain text and get the browser's double-tap-to-zoom, and the wheel's `touch-action: none` takes every pinch, so there is no way to zoom back out.

**Change:** `touch-action: manipulation` on `.fw-theme-label` and `.fw-share-label` only. They're the only plain text in the toolbar and the card's bar. It turns off double-tap zoom there and keeps pinch zoom.

**Checked by:** Lucas on his phone.

## §3 One rest view for both wheels

**Found:** a Chromium sweep from 260 to 2000 px wide and 260 to 1400 px tall, in 40 px steps, on both wheels: every window taller than wide from 740 to 1060 px wide rests on the whole wheel for feelings and on the half-wheel for body. That includes upright iPads: 768 × 1024, 820 × 1180, 834 × 1194, and 1024 × 1366.

**Change:** `shouldStartZoomed` (the 12 px rest test: the outer cell's arc × 0.55 ≥ 12 px) stops reading the current wheel's layout. It reads one number shared by every wheel instead: the narrowest outer-cell arc of any wheel at radius 1.

- Every leaf is in the outer ring, and every outer cell on a wheel is the same width, so a wheel's number is 2π ÷ its outer-cell count × its outer ring's middle radius ((inner + outer) / 2, from the wheel's `rings`), all read from the wheel JSON.
- The shared number is the smallest across the wheels: the body wheel's today. It is worked out once, when the wheel list loads (`loadData().wheels`, in `main.ts` at startup), and passed to the camera in place of the layout: `shouldStartZoomed`, `useHalfWheel`, and `restView` take it instead of a `Layout`.
- A wheel added later (the [emoji wheel](../../ROADMAP.md#emoji-wheel), the [wheels for kids](../../ROADMAP.md#wheels-for-kids)) joins the rule just by being in the list.

**The side view's zoom.** Sideways windows under 480 px tall (sideways phones) rest on the side view: the core ring up close (`wheelCamera` with `rest: 'side'`, which is `ringFocusCamera` on ring 0). Today it zooms by each wheel's own typical core cell, so at 852 × 393 the feelings wheel rests at 1.89× and the body wheel at 2.68×. It gets a second shared number, worked out the same way and at the same time: the narrowest typical (median) core cell of any wheel. A core cell's width is its leaf count ÷ the wheel's leaf count × 2π, also read from the wheel JSON. Both wheels then rest at 2.68× there.

- In the side layout, opening a core word uses the same shared core width, so opening one never zooms out from the rest view. Without it, the feelings wheel would rest at 2.68× and zoom out to 1.89× when Happy opens. Opening a middle or outer word keeps each wheel's own zoom (§4). This is the builder's call, made here: it keeps the side view one view.
- Trade-off: on a sideways phone the feelings wheel rests closer in. Angry and Fearful drop out of view, and its outer ring tucks under the start message, as the body wheel's already does.

**Cost of the work:** profiling at phone size with the CPU slowed 4× puts first-load work on static data at about 10 ms. The rest of the first frame is label drawing (about 115 ms) and the intro spin (about 75 ms), so counting cells costs nothing noticeable.

**Trade-off:** the feelings wheel loses its whole-wheel rest on upright iPads and windows like them, and shows about half its core feelings at rest there, as the body wheel already does.

**Tests:** in `tests/unit/camera.test.ts`, two lines: at 820 × 1180, both wheels rest on the half-wheel. Update the side-view tests (`tests/unit/camera.test.ts`, and `sideCam` in `tests/unit/controller.test.ts`) to pass the shared core width. Update existing callers of `shouldStartZoomed`, `useHalfWheel`, and `restView` to the new arguments, and update only the viewport sweep expectations (`tests/e2e/viewports.spec.ts`) that change.

## §4 Opened words: the ring always fits

**Change:** in `ringFocusCamera`, after today's scale (4.5rem target, 60% band clamp, 44 px floor, 1.25 minimum), cap the scale so the opened ring, with the opened cell's 10 px lift (`LIFT_RADIAL_PX`) and 2 px outline (`OUTLINE_OUTSIDE_PX`), fits on screen:

- **Portrait** (the ring's middle is centered): the ring's band plus the lift and outline at both ends fits within the stage width with 1rem clear on each side:
  `scale ≤ (vp.width − 2·rem − 2·(LIFT_RADIAL_PX + OUTLINE_OUTSIDE_PX)) / ((outer − inner) · vp.radius)`.
- **Sideways:** the ring fits between 1rem after the left inset (the notch) and the aim width (left of the card), which is what the existing camera test checks:
  `scale ≤ (vp.width − insetLeft − rem − 2·LIFT_RADIAL_PX − OUTLINE_OUTSIDE_PX) / ((outer − inner) · vp.radius)`.
- Then raised to a 24 px floor (WCAG 2.2 AA's target size), which beats the cap: `scale ≥ 24 / (typical cell arc at scale 1)`. Only a folded Galaxy Fold (280 px wide) reaches it, where the body wheel's outer ring runs about 2 px past the screen's edges.
- Never below `MIN_RING_SCALE` (1.25).

So the order is: today's scale, capped to fit, raised to the 24 px floor and to 1.25. `openedHalfHeight`, the controller's maximum pinch scale, and the side rest view all go through `ringFocusCamera`, so they follow.

**Result,** checked by running main's `ringFocusCamera` and the new one on both wheels' layouts: only the outer ring changes, and only on phones. Scale, with the opened cell's height:

| Window | Feelings outer | Body outer |
|---|---|---|
| 280 × 653 | 5.37 → 4.47 (37 px) | 8.25 → 4.50 (24 px) |
| 320 × 568 | 4.66 → 4.57 (43 px) | 7.17 → 4.57 (28 px) |
| 360 × 640 | no change (44 px) | 6.33 → 4.65 (32 px) |
| 375 × 667 | no change | 6.07 → 4.68 (34 px) |
| 390 × 844 | no change | 5.83 → 4.70 (36 px) |
| 430 × 932 | no change | 5.26 → 4.75 (40 px) |
| sideways iPhone 15 (aim 476 × 393, 59 px notch) | no change | 5.78 → 5.29 (40 px) |
| sideways 667 × 375 (aim 400 × 375) | no change | 6.07 → 5.31 |

Upright iPads, sideways iPads, and computers: no change. The core and middle rings: no change.

**Tests:** in `tests/unit/camera.test.ts`, remove `OVERFLOWS` and its comment from "the opened cell starts 1rem after the inset and ends before the aim width"; every ring of both wheels now passes it as written. No new test.

## §5 Long opened labels fit their lifted cell

**Found:** on main, "Weight on shoulders" runs about 6 to 9 px past each end of its lifted cell at 390 × 844 ("Hollow chest" now fits). The renderer (`src/render/wheel.ts`, the opened branch) fits the label in the cell's normal box at weight 600, then draws it 1.15× larger (`LIFT_LABEL`) at weight 800, while the lifted cell grows only 10 px at each end.

**Change:** fit the opened label at its bold weight inside the lifted cell's box (its band plus the lift at both ends, minus the label padding; its arc plus the side lift), with the size capped at 1.15× the unopened label's size and never smaller than the unopened size. Short words still grow the full 1.15×; long words grow as much as fits, or not at all.

`measure` caches widths at the regular weight only. Bold widths need their own cache (or a cache keyed by weight).

**Trade-off:** long words grow less, or not at all, when opened.

**Tests:** a unit test in `tests/unit/wheel-render.test.ts` if the existing fake canvas measures by weight; otherwise checked in a browser (§8).

## §6 Low priority or not fixing

A new last heading under Known issues, `### Low priority or not fixing`, with one entry each:

- **Taps land on the wrong word after turning the phone.** Low priority. Not reproduced: after seven turns in the Simulator, taps hit the right word upright and sideways. `src/input/gestures.ts` reads the canvas's position on every touch-down, so a stale position isn't the cause. Most likely it was leftover page zoom from §1 and §2; watch for it once those ship.
- **Wide fallback fonts.** Not fixing. With Verdana standing in for Linux's DejaVu Sans, the switch and the toolbar overlap by 3 px at 280 px wide; from 300 px up there's room. Linux only, at one width. Whether the switch's third option fits gets settled when a third wheel is designed.
- **Portrait, inner tier opened: the outer ring runs off the right edge.** Not fixing. Reproduced: Inspired, Sensitive, and Thankful are cut off at 390 × 844 with Happy opened. The outer ring is only context there, and the card lists its words under "Narrow it down."
- **Tiny windows: the body wheel rests unlabeled.** Not fixing. Up to 540 × 340 (18 sizes in the sweep); the feelings wheel loses its core labels only at 260 px tall. Split screens and tiny windows, never phones. The viewport sweep keeps pinning it.
- **Very short phones: the opened word under the toolbar.** Not fixing. Only in portrait windows 420 px tall or shorter; at 360 × 380 it touches the switch. No phone held upright is that short.

## §7 Docs, in the same change

### §7.1 Roadmap (`docs/ROADMAP.md`)

- Remove the fixed issues: turning (card text), double-tap zoom, the two wheels resting and zooming differently, and long opened labels.
- Move the five in §6 under "Low priority or not fixing," the last heading in Known issues, with §6's notes.
- "Phones: turning and zooming" ends up empty and goes. "Layout and labels" keeps only the new issue in §7.3, so its anchor stays.
- Repoint the two links to the wide fallback fonts issue (`#layout-and-labels`, in [Emoji wheel](../../ROADMAP.md#emoji-wheel) and [Wheels for kids](../../ROADMAP.md#wheels-for-kids)) to `#low-priority-or-not-fixing`.
- Add a Shipped row for this change, with its spec and plan links.
- Already added on this branch: the idea Lucas raised during this work, [Snapshots across devices and window sizes](../../ROADMAP.md#snapshots-across-devices-and-window-sizes) under Ideas › Tests.

### §7.2 ACCESSIBILITY.md

- "Easy to read and tap": state only the lower bound. Draft for Lucas to edit: "on a phone the wheel zooms into the ring you're in so each word's cell is at least 24 px tall."
- Known limitations:
  - drop the double-tap item and the long-words item;
  - reword the turning item down to the taps only, as not reproduced;
  - drop the sideways-iPhone item (the body wheel's ring under the card);
  - add the new item from §7.3.

### §7.3 New known issue: cells at rest under 24 px

Found during this work, on main. At rest, tapping an outer cell selects that word, so each cell is a tap target, and at common sizes they're under WCAG 2.2 AA's 24 px (success criterion 2.5.8):

| Window | Feelings outer cell | Body outer cell |
|---|---|---|
| 390 × 844 (half-wheel) | 23.0 px | 15.0 px |
| 820 × 1180 | 25.0 px | 31.5 px |
| 1440 × 900 (whole wheel) | 27.4 px | 17.9 px |

The cells touch, so the spacing exception doesn't apply. The "equivalent control" exception might: tap the middle word first, and once the wheel zooms in, every outer cell is 31 px or taller. That's two steps, so it isn't safe to rely on. §3 changes the 820 × 1180 feelings row (it moves to the half-wheel, with bigger cells) and nothing else. Logged under "Layout and labels" in the roadmap and, in plain words, in ACCESSIBILITY.md's known limitations. No fix chosen yet: the cells are this small so the whole wheel fits, so a fix needs its own design.

## §8 How each fix is checked

For the PR's "What and why," per AGENTS.md and ACCESSIBILITY.md:

- §1: the iOS Simulator (iPhone 17, Safari, several turns with a word open). No automated test possible.
- §2: Lucas's phone (double-tapping the theme label and "Link copied").
- §3 and §4: the unit tests above, the viewport sweep, and a browser at the sweep's sizes, including the notched sideways iPhone (Chromium's safe-area override, both wheels at rest and opened) and upright phones from 280 px wide.
- §5: a browser at 390 × 844 with Shoulders › Weight on shoulders opened.
- Not done: a screen reader (no change to the tree), and keyboard (no change to keys).

## Left to the builder

- Where the shared-numbers function lives (`src/camera.ts` or `src/model/layout.ts`), its name, and how the two numbers reach the camera (arguments or `CameraOpts`).
- How the opened label's bold widths are cached.
- Exact wording of the roadmap and ACCESSIBILITY.md entries, within §6 and §7. Lucas edits drafts.
- The Shipped row's name and date.
