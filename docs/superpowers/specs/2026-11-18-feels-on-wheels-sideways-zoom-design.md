# Sideways screens: the core word stays in view

Status: approved by Lucas, 2026-11-19. Builds on main at 14428c9 (the [known issues](2026-11-18-feels-on-wheels-known-issues-design.md) change).

## Why

On a tablet held sideways (Lucas found it on an iPad, 1180 × 820), opening a core word barely zooms (1.25×), and then opening one of its middle words zooms a lot (2.89×). The core word slides almost off the left edge, so you lose track of where you came from. Lucas wants the core word to stay visible with a middle word opened, and the first tap to zoom in a little more.

## Goals

- With a middle word opened, the whole core ring stays on screen.
- Opening a core word zooms in a little more than now, so the two taps feel like two similar steps.

## Non-goals

- Phones, upright or sideways, and upright tablets. Their zoom was tuned in the known-issues change, and they don't change here.
- The outer ring's view. With an outer word opened, the middle word already shows (Lucas's screenshot of Respected), so it stays as it is.
- The rest views.

## Anti-goals

- Undoing a recent decision: the side view's shared zoom on sideways phones (known issues §3), the half-wheel's core view on portrait phones (known issues, round two), the left margin counting from the notch (v2.2.1), opened rings that fit left of the card, and the 24 px floor (known issues §4).
- The two wheels resting differently. Each wheel still opens a word at its own zoom (known issues §4).

## Approaches

For the middle-word view there was one sensible rule: zoom only as far as keeps the whole core ring on screen.

For the core-word view, Lucas compared three amounts in the live app at 1180 × 820:

- **A.** Same as now. The first tap barely zooms, and the second does most of it.
- **B.** Halfway between the rest view and the middle-word view (the geometric mean). Two steps of about the same size. **Chosen by Lucas.**
- **C.** Three quarters of the way. The first tap does most of it, and the second barely zooms.

## The change

In `ringFocusCamera` (`src/camera.ts`), only where the layout is sideways and rests on the whole wheel (`!portrait && rest === 'whole'`). The rule goes by the window's shape and size, never the device: any window wider than tall and 480 px or taller, with the card beside the wheel. That's tablets of any make held sideways (iPads, Android tablets, Surface), foldables opened sideways, Chromebooks, laptops, desktops, and browser windows shaped like them. Phones turned sideways rest on the side view (under 480 px tall), and upright screens use the portrait layout, so neither is touched.

1. **Middle-word view:** today's scale, capped so the whole core ring (its inner edge) sits at least 1rem right of the notch inset. The wheel meets the aim width on the right (its outer edge plus the opened cell's lift and outline), so the cap is
   `scale ≤ (vp.width − LIFT_RADIAL_PX − OUTLINE_OUTSIDE_PX − insetLeft − rem) / ((1 − core.inner) · vp.radius)`.
   Then raised to the 24 px floor and to 1.25, as today.
2. **Core-word view:** at least the square root of the middle-word view's scale (halfway, on a log scale, between the rest view at 1× and the middle-word view). Never below today's core view.

Scale, core / middle / outer, now → new:

| Window | Feelings | Body |
|---|---|---|
| 1024 × 768 | 1.25 / 3.42 / 3.24 → 1.49 / 2.23 / 3.24 | 1.73 / 3.51 / 3.73 → 1.73 / 2.23 / 3.73 |
| 1180 × 820 | 1.25 / 2.89 / 3.23 → 1.49 / 2.23 / 3.23 | 1.46 / 2.96 / 3.23 → 1.49 / 2.23 / 3.23 |
| 1366 × 1024 | 1.25 / 2.15 / 2.49 → 1.47 / 2.15 / 2.49 | 1.25 / 2.20 / 3.21 → 1.48 / 2.20 / 3.21 |
| 1440 × 900 | 1.25 / 2.26 / 2.62 → 1.50 / 2.26 / 2.62 | 1.25 / 2.32 / 3.56 → 1.52 / 2.32 / 3.56 |
| 1920 × 1080 | 1.25 / 1.88 / 2.18 → 1.37 / 1.88 / 2.18 | 1.25 / 1.92 / 3.35 → 1.39 / 1.92 / 3.35 |
| Sideways phones, upright screens | no change | no change |

Where the core ring already fits (larger tablets like a 13″ iPad, laptops, and desktops), the middle-word view doesn't change, and only the core-word view zooms in a little more.

**Everything that reads the core-word view's zoom,** checked in the code, and what the new rule does to each:

- Opening a core word (tap, key, pinch, link): zooms to the new scale, as intended.
- Labels: their largest size grows with the zoom, up to 24 px (`src/render/wheel.ts`), so core-view labels get slightly bigger, as they would at any closer zoom.
- The side view (sideways phones) rests on, and opens a core word at, the core-word view with its shared zoom. It's left out by `rest === 'whole'`.
- The half-wheel and the portrait core view (round two) are left out by `!portrait`.
- The furthest you can pinch in: it takes the biggest ring view. The core-word view is at most the square root of the middle-word view, so it never becomes the biggest.
- The card's height cap and the opened word's position (`openedHalfHeight`, `openedYFor`) apply only in portrait.
- Where a wheel's own core view already zooms in further (the body wheel at 1024 × 768, 1.73), it keeps it: the rule only raises the zoom.

**What follows from it:**

- The furthest you can pinch in is the biggest ring view × headroom. It drops only where the middle-word view was the biggest: the feelings wheel at 1024 × 768, from 3.42 to 3.24.
- The known issue about cells under 24 px at rest says that opening a middle word makes every outer cell at least 24 px. That still holds: at 1180 × 820, the body wheel's outer cells are about 31 px with a middle word opened.

## Tests

In `tests/unit/camera.test.ts`: at 1180 × 820, a middle word's view keeps the whole core ring 1rem clear of the left (with and without a notch inset). The core-word view is the square root of the middle-word view. Update only the expectations that change.

## How it's checked

The unit tests, the viewport sweep, the full end-to-end run, and a browser at 1024 × 768, 1180 × 820, 1366 × 1024, and 1440 × 900 on both wheels. Also at a sideways phone and an upright tablet, to confirm they don't change. Not done: a screen reader (no change to the tree), keyboard (no change to keys), and a real tablet.

## Docs, in the same change

- `docs/ROADMAP.md`: a Shipped row linking this spec and its plan.
- `ACCESSIBILITY.md`: no change, since the 24 px floor and known limitations stay as they are.

## Left to the builder

- How the core-word view gets the middle-word view's scale (calling `ringFocusCamera` for ring 1, or a shared helper).
- The Shipped row's wording.
