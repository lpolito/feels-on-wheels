# Changes from the spec: sideways zoom

What differs from [the spec](2026-11-18-feels-on-wheels-sideways-zoom-design.md).

## A middle word always zooms in (Lucas, 2026-11-19)

- **Spec:** a middle word's view is capped so the whole core ring stays on screen; the 24 px floor and 1.25 minimum still apply.
- **Found in review:** on small sideways windows, about 720 to 784 px wide (or 720 × 480 with a notch), a wheel's own core view already zooms in past that cap, because its cells need the room. Opening a middle word then zoomed *out*: the body wheel at 720 × 480 went 2.43× → 2.21× (before this change, 2.43× → 4.15×).
- **Now:** a middle word's view always zooms in at least 1.25× from its core word's own view, even if that puts part of the core ring off the left edge. It never zooms past where the middle view went before this change (its 4.5rem target, fitted to the screen), and the 24 px floor and 1.25 minimum still apply. Lucas compared keeping all, three quarters, or half of the core ring in view at 1180 × 820, and kept all of it. On that size and bigger, nothing changes from the spec's table: the step only decides on small windows. At 720 × 480 the body wheel now goes 2.43× → 3.03×.
- Those small windows are mostly laptop or desktop browser windows made small, and possibly some foldables or 7–8″ tablets held sideways. Phones and iPads don't reach them.

## Smaller corrections

- The spec says the core view "never becomes the biggest" ring view, and that the pinch limit drops only for the feelings wheel at 1024 × 768. With the step, a middle word's view is always bigger than its core view, so the first holds. The pinch limit also drops in other small windows where the middle view was the biggest, for example the feelings wheel at 720 × 480 (4.15 → about 3.4).
- The code splits each ring's own zoom (`ownScale`) from the sideways rules (`ringScale`) in `src/camera.ts`, so the middle view can read the core view's own zoom without calling back into itself.

## Tests

Beyond the plan:

- `tests/unit/camera.test.ts`: the second tap zooms in at least 1.25× on both wheels from 720 × 480 to 1440 × 900; the step wins on the body wheel at 720 × 480; the step never passes the old middle view; and the 24 px floor test moved to a 120 px aim width, the only kind of stage where the floor still decides.
- The "keeps the opened cell at least 1rem from the left" test no longer shows its safeguard biting on a sideways tablet, since the core-ring cap keeps the cell further in. And `tests/unit/controller.test.ts`'s "drawWidth changed" test moved to a 220 px aim width, where the opened view still runs past the aim width.
