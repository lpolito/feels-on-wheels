# Labels that change after the wheel stops (2026-11-28)

Lucas noticed labels visibly changing or sharpening a moment after the wheel stops, while trying the view-size build `v12f`. This report works out where that comes from and what skipping the exact-size render at rest would cost. That's [decision 1 in the handoff](../handoff.md#decisions-waiting-on-me-lucas).

The code is on branch `explore-sharpening` (commit 61c76b5): the view-size prototype rebased onto today's wheel (162 words, one label size per ring), with its `collect()` using the ring sizes. The scripts and raw results are in its `.bench/`. Everything here was counted headless at phone size (390 × 844 at 3×) in Chromium and WebKit, not timed, and not tried on a real iPhone.

## What was compared

| Build | While moving | At rest | Next views made ahead of time |
|---|---|---|---|
| `fix` | exact size | exact size | no (today's drawing, on this branch) |
| `v1` | nearest cached size | exact size | no |
| `v12f` | nearest cached size | exact size, fitted fresh | yes |
| `v1s`, `v12s` | nearest cached size | nearest cached size (the exact render is skipped) | `v12s` only |
| `v1e`, `v12fe` | nearest cached size | exact size from when what's left of the move is under 0.5 CSS px | `v12fe` only |

Each ran the same 13 moves: out and in between an outer word, its middle word and its core, twice; two quick moves 150 ms apart; and two taps on middle words that prewarm didn't predict, the second one in another core. For each move, the trace records when the motion stopped being visible, when the camera settled, which labels were drawn from a size other than their own, what the settle frame changed on screen, and how the resting wheel differs from `fix` after the same moves.

## Where the change after stopping comes from

### 1. The opened word, in today's drawing too

The settle frame changes the opened word in `fix`, so it happens on the live site as well, with or without label caching. The opened word is drawn live with `fillText` in bold, not from the label cache. Two things change it:

- **In WebKit (every iPhone browser), its rotation goes from 0 to 2π.** When the camera settles, `settle()` in `src/camera.ts` wraps the rotation into one turn, so an opened word that was drawn at exactly 0 while moving is drawn at 6.283185307179586 in the settle frame. `labelRotation()` passes that through. 2π has a sine of about −2.4e-16 rather than 0, and WebKit draws text at any rotation other than exactly 0 differently: the word's letters land up to about a device pixel apart, so the whole word visibly redraws. A standalone test of "Annoyed" at 27.6 px: 818 pixels change by more than 64 in WebKit between 0 and 2π, and none in Chromium or Firefox. Cached labels drawn with `drawImage` don't change at 2π in any engine. In the app, the first "out to middle" changed 1,654 pixels in the settle frame in WebKit, nearly all on the opened word. It happens whenever settling wraps the rotation, which depends on the move.
- **In every engine, the opened word can be refitted smaller.** `openedLabel()` reuses its fit while the cell's box stays within 1 px (`FIT_TOLERANCE`). The camera's last step to its target can push the box just past that, so the settle frame refits the word. Going out to a core, "Angry" went from 25.875 px to 25.3 px (1,617 pixels changed in Chromium, 1,540 in WebKit). This is the path-dependent resting size from decision 2, showing on the opened word.

### 2. Labels drawn from another size, when caching missed

While moving, the view-size builds draw each label from the nearest size already cached. If the size it rests at isn't cached, the settle frame renders it and draws it at its own size. A label scaled from another size has different letter widths and spacing, so it jumps in width and position, not just sharpness.

- **Without prewarm (`v1`), this happens on every first visit to a view.** Going out to a core, 81 labels were drawn from sizes up to 2.3× off, and the settle frame rendered 161 labels and changed about 66,000 pixels. Later visits hit the cache.
- **With prewarm (`v12f`), it almost never happened.** In 12 of the 13 moves, no label was drawn from another size in the last moving frame, nothing was rendered at settle, and the settle frame changed about what `fix` changed (within a few hundred pixels, at cell edges). The quick moves were covered too, because earlier moves had cached their sizes.
- **Even label sizes help prewarm.** Every middle-word view of one wheel has the same ring sizes, so the sizes are shared between views. The first tap on a middle word that prewarm didn't predict still found every size cached. Only the tap into another core missed: 9 labels drawn from up to 2.3× off, all off screen at this size.

### 3. Why it's "a moment after"

The camera counts as settled only when scale and rotation are within 1e-4 of the target and the center within 0.05 px. A point on the wheel's edge stops moving more than 0.5 CSS px per frame about 300 ms before that, and more than 0.1 px per frame 150–250 ms before. So whatever the settle frame changes shows up after the wheel already looks still.

Switching to exact sizes when the motion stops being visible (`v1e`, `v12fe`) moves the change 230–290 ms earlier, about 20 ms after the last frame that moved more than 0.1 px. It doesn't make the change any smaller: going out to a core, `v1e` changed as many pixels as `v1`.

## What skipping the exact-size render at rest costs

- **Without prewarm, labels stay at the wrong size.** `v1s` rested with labels drawn from sizes up to 2.4× off. Going out to a core, about 49,600 pixels differed strongly from `fix`; a middle word's view about 5,500. They look softer and wider than today.
- **With prewarm, it saves nothing.** `v12s` rested identical to `fix` everywhere prewarm reached, because the exact sizes were already cached. But `v12f` renders nothing at settle when prewarm reached the view either, so skipping only matters for the misses. On those, a skipped render leaves the labels scaled until the next move, while `v12f` gives one visible jump.

## What this means for decision 1

- What Lucas noticed most likely includes the opened word, which changes after the wheel stops in today's drawing: in WebKit when settling wraps the rotation, and in every engine when its fit is reused past 1 px. Prewarm doesn't cause it and skipping won't fix it. Two small fixes would:
  - draw labels at exactly 0 when their angle is a whole number of turns (in `labelRotation()`, or by keeping the settled rotation from wrapping by 2π);
  - refit the opened word fresh at rest, which is decision 2.
- Prewarm is what keeps view-size caching from adding a bigger jump on every first visit to a view. Without it, `v1`'s jump comes back. With it, the exact-size render at rest has almost nothing left to do.
- Not measured here: prewarm's idle time and memory on today's wheel (the [view-size report](view-sizes.md) measured them on the old one), any timing, and a real iPhone.
