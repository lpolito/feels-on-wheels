# Wheel rendering: what we know (2026-11-24)

Everything learned while fixing the Firefox lag and then the iOS stutter the fix caused. Where the work stands and what to do next is in [handoff.md](handoff.md). The Firefox investigation itself, with its draft Firefox and MDN reports, is in the [Firefox GPU canvas spec](../superpowers/specs/2026-11-24-firefox-gpu-canvas-design.md). This file adds what came after it.

## Status

- **Parked on 2026-11-28** until Mozilla triages Lucas's Firefox bug. Only Firefox has a problem today, and a workaround adds a lot to the browsers that work. See the [roadmap](../ROADMAP.md#a-wheel-thats-fast-in-every-browser).
- **`ff-canvas-perf` must not merge as it is.** Its fix (cells batched by color, labels kept as `ImageBitmap`s) makes desktop Firefox spin at 60 fps on the GPU, but makes iOS browsers stutter when zooming and moving between rings. Lucas, 2026-11-24: "the performance on iOS FF is noticeably degraded with these changes. Seems specific to zooming in/out. or selecting outer wheel words and going to the inner wheel in any way. This same interaction is snappy on main."
- **Lucas wants one approach that works in every browser** that also keeps labels looking as they do today. He turned down a Gecko-only path (bitmaps only in Firefox's engine; [patch](patches/gecko-only-bitmaps.patch)).
- **Lucas leans to view-size label caching** (2026-11-24, after trying both contenders on his phone): "option one is probably what we're going to go with". Still open: whether to render the next views' labels ahead of time at all ([handoff.md](handoff.md#decisions-waiting-on-me-lucas)).
- **WebGL is out for now.** Lucas, trying it: without antialiasing it "looks like crap around words and around borders. Lots of artifacting. And with AA on its noticeably laggy." 

## Where the code is

Every branch is pushed. None has a PR, so none runs CI.

| What | Branch | Commit | Report |
|---|---|---|---|
| The Firefox fix, the spec, this folder | `ff-canvas-perf` | (this change) | [spec](../superpowers/specs/2026-11-24-firefox-gpu-canvas-design.md) |
| P1: labels drawn from their canvas first, made `ImageBitmap`s two frames later; and gaps drawn as fills, not strokes | none, a patch | | [patch](patches/p1-label-promotion-and-gap-fills.patch), below |
| P2: nearby cached sizes while moving | `claude/explore-p2-nearby-sizes-5d951c` | 35dd57b, 8f050cc | [p2-nearby-sizes.md](explorations/p2-nearby-sizes.md) |
| P3: label sizes in geometric steps | `claude/explore-p3-coarse-sizes-de0771` | 73b7e8c | [p3-coarse-sizes.md](explorations/p3-coarse-sizes.md) |
| View sizes: cache labels at the sizes they rest at, made ahead of time (options 1–5) | `claude/explore-view-size-labels-80d8e9` | 87e7593, 37f369b | [view-sizes.md](explorations/view-sizes.md) |
| A WebGL2 renderer | `claude/explore-webgl-renderer-b1f5e2` | f92c921, 89c346e | [webgl.md](explorations/webgl.md) |
| The change after the wheel stops: view sizes on today's wheel, with skip-at-rest and early-exact variants | `explore-sharpening` (not pushed yet) | 61c76b5 | [sharpening.md](explorations/sharpening.md) |

All exploration branches start from `ff-canvas-perf` at eae7723. Each one's `.bench/` folder holds its scripts and raw counts (committed with `git add -f`, since `.bench/` is ignored locally). The reports in [explorations/](explorations/) are copies; their absolute paths point at worktrees under `.claude/worktrees/` on Lucas's Mac, which may be gone. Use the branch instead. Screenshots weren't committed.

The variants are switched at build time:

- **View sizes:** `VITE_LV=v12f` (or `v1`, `v12`, `v123f`, `v4`, `v5`), or `globalThis.__lv` at runtime.
- **WebGL:** `VITE_WHEEL_GL=1`; `VITE_GL_AA=0` turns antialiasing off; `VITE_GL_LABELS=hybrid|scale|rerender`.
- **P2:** `VITE_P2_TOL=0.3 VITE_P2_BUDGET=16`.
- **P3:** `VITE_P3=1.15`.

Always build with `--mode test`, which adds the `__fw` hooks the benchmark needs.

## What we learned

### Every iOS browser is WebKit

Firefox, Chrome and every other browser on iOS use WebKit, as Apple requires. So the Firefox fix doesn't apply to Firefox on an iPhone, and anything that's slow in Safari is slow in all of them.

### In WebKit, `transferToImageBitmap()` copies the whole canvas

Read in WebKit's source (main at 29585000d7, 2026-11-24):

- `OffscreenCanvas::transferToImageBitmap()` calls `OffscreenCanvasRenderingContext2D::transferToImageBuffer()` (`Source/WebCore/html/canvas/OffscreenCanvasRenderingContext2D.cpp`). That calls `buffer->clone()`, then `clearCanvas()`. A comment there explains why: the context's state lives in the buffer's `GraphicsContext`, so WebKit copies rather than gives the buffer away.
- `ImageBuffer::clone()` (`Source/WebCore/platform/graphics/ImageBuffer.cpp`, `copyImageBuffer`) creates a new image buffer the size of the canvas and draws the old one into it with `CompositeOperator::Copy`.

So each "transfer" is a new buffer plus a full copy. Drawing a canvas directly skips both. The cost tracks pixels, not calls (measured below). Not yet checked: whether the copy runs in WebKit's GPU process (`Source/WebKit/WebProcess/GPU/graphics/RemoteImageBufferProxy.cpp`), which would explain why the cost shows up in frame times but not in the app's own draw timer.

### A zoom renders nearly every label anew, every frame

The label cache (`src/render/sprites.ts`) keys each bitmap on its size rounded to 0.5 px. During a zoom, every label's size changes each frame. So:

- **Ring changes render 55–80 labels in a frame.** About 700 in one step from a middle word to its core word at 390×844, 3× (counted with an instrumented build).
- **Spins render almost nothing.** Sizes don't change, so the labels cached on the first frame are reused.
- **At 3×, the cache's 16 MB cap holds only about 130 labels,** so revisiting a view renders everything again.
- **A pinch scales freely while the fingers move, but always resolves to a view on release** (`src/model/pinch.ts`). Ring changes animate between views. So at rest, each label only ever appears at a few known sizes per screen (Lucas's observation). This is what the view-size option builds on.

### Firefox needs bitmaps, and nothing else will do

The spec has the Firefox side. Measured since, with standalone pages ([labels.html](../../scripts/wheel-bench/pages/labels.html)) at 390×844, 3×, 150 labels drawn per frame:

| Labels re-rendered each frame | WebKit | Firefox | Chromium |
|---|---|---|---|
| drawn from their own canvas (main), 30 | 16 ms | 67 ms, software | 17 ms |
| drawn from their own canvas (main), 150 | 24 ms | 67 ms, software | 52 ms |
| one bitmap per label (the branch), 30 | 27 ms | 17 ms, GPU | 17 ms (p90 34) |
| one bitmap per label (the branch), 150 | 100 ms | 83 ms, software | 100 ms |
| one bitmap per frame for all its new labels, 150 | 65 ms | 33 ms, GPU | 17 ms |
| `createImageBitmap()`, canvas until it resolves, 150 | 104 ms | 83 ms, software | 84 ms |
| one large canvas holding every label (an atlas), 150 | 35 ms | 100 ms, software | 17 ms |

Median frame times.

- **In Firefox, any canvas used as a drawImage source is re-sent to the GPU on every draw,** even a large atlas that never changes, and the wheel's canvas goes to software. Only `ImageBitmap`s stay.
- **On the GPU, Firefox is still slower drawing from canvases:** 33 ms a frame against 17 ms from bitmaps (with `gfx.canvas.accelerated.profile-frames` set to 0, so the canvas can't leave the GPU).
- **In WebKit, drawing straight from canvases is the cheapest,** and making bitmaps costs per pixel.

So no single way of drawing labels wins everywhere. What can win everywhere is making far fewer new labels during motion.

### Stroking the gaps costs more than filling them, in every engine

Measured with [cells.html](../../scripts/wheel-bench/pages/cells.html): 178 cells in 21 colors, turning, the cell pass drawn 6 times a frame to make costs visible.

| How the cells and gaps are drawn | WebKit | Chromium | Firefox (software) |
|---|---|---|---|
| fill and stroke per cell (main) | 45 ms | 100 ms | 50 ms |
| fills by color, one stroke for every gap (the branch) | 35 ms | 50 ms | 50 ms |
| fills by color, a stroke per cell | 42 ms | 67 ms | 50 ms |
| fills by color, gaps as lines and arcs, each edge once | 28 ms | 50 ms | 50 ms |
| no stroke: each cell filled in the gap color grown by half a gap, then in its own color shrunk by half a gap | **17 ms** | **17 ms** | **17 ms** |

- **The no-stroke version draws the same picture,** since the gap color is opaque.
- **Main strokes every shared edge twice,** once per neighboring cell, and two antialiased strokes darken the edge pixels a little. Its gaps carry about 2% more gap-colored ink than the branch's single stroke. The fill version matches the branch within ±0.6%.
- **An earlier fill version used one big ring for the gap color,** and its outer edge came out up to a pixel off when zoomed in, because browsers approximate a whole circle with only a few curves. Growing each cell instead keeps every edge on the same short arcs.
- **In the app, the fill version didn't measurably help on its own.** WebKit ring changes dropped 15.9% of frames with P1 + fills, against 14.7% on main. Labels dominate. It's in the [P1 patch](patches/p1-label-promotion-and-gap-fills.patch) (`addInset` in `src/render/wheel.ts`) if the 2D canvas route needs it.

### Benchmarks must run one at a time

Four exploration sessions ran headed Playwright benchmarks on the same Mac at once (load average 13–19), which skewed every frame time; their reports leave timings out for that reason. The timings below were rerun one browser at a time, with nothing else running.

Other limits of these numbers:

- Playwright's browsers on a 2019 MacBook Pro are not an iPhone.
- Headless Firefox always draws canvases in software, so GPU checks need headed Firefox (the spec, §3).

### Timing, one at a time on a quiet machine

From [scripts/wheel-bench/matrix.sh](../../scripts/wheel-bench/matrix.sh), with ring changes at a person's pace (600 ms between steps). Each cell gives the dropped frames (over 25 ms), then the median of each round's slowest frame, and for Firefox's 2D builds, where the canvas ended up. One run each. Raw results: [results/quiet-timing-2026-11-24.jsonl](results/quiet-timing-2026-11-24.jsonl).

| Build | WebKit phone, ring changes | WebKit phone, pinch | WebKit phone, spin | Firefox desktop, spin | Firefox desktop, ring changes | Chromium phone, ring changes | WebKit desktop, ring changes | Firefox phone, ring changes |
|---|---|---|---|---|---|---|---|---|
| main | 14.7%, 91 ms | 1.9%, 81 ms | 0.0%, 20 ms | 84.5%, 50 ms, software | 30.7%, 82 ms, software | 11.7%, 102 ms | 7.9%, 92 ms | 26.7%, 68 ms, software |
| branch (eae7723) | 12.6%, 212 ms | 1.5%, 157 ms | 0.3%, 24 ms | 0.0%, 20 ms, GPU | 1.5%, 85 ms, GPU | 9.1%, 85 ms | 6.9%, 142 ms | 3.4%, 86 ms, GPU |
| P1 + gap fills | 15.9%, 94 ms | 3.6%, 115 ms | 0.0%, 20 ms | 0.0%, 20 ms, GPU | 3.8%, 119 ms, GPU | 9.1%, 83 ms | 9.0%, 109 ms | 5.1%, 84 ms, GPU |
| P2, 30%, spread | 10.2%, 134 ms | 1.1%, 145 ms | 0.3%, 20 ms | 0.0%, 19 ms, GPU | 0.8%, 33 ms, GPU | 7.8%, 84 ms | 7.7%, 82 ms | 4.6%, 150 ms, GPU |
| P3, 15% | 8.2%, 145 ms | 1.3%, 169 ms | 1.1%, 27 ms | 0.0%, 19 ms, GPU | 0.2%, 19 ms, GPU | 5.4%, 69 ms | 7.2%, 49 ms | 3.7%, 170 ms, GPU |
| View sizes 1+2 | 8.8%, 72 ms | 0.3%, 27 ms | 0.0%, 21 ms | 0.0%, 19 ms, GPU | 0.2%, 19 ms, GPU | 4.5%, 35 ms | 6.9%, 50 ms | 2.6%, 219 ms, GPU |
| View sizes 1+2+3 | 7.7%, 70 ms | 0.2%, 21 ms | 0.3%, 20 ms | 0.0%, 21 ms, GPU | 0.4%, 19 ms, GPU | 4.1%, 35 ms | 8.2%, 48 ms | 2.4%, 267 ms, GPU |
| WebGL | 13.2%, 59 ms | 7.1%, 47 ms | 2.5%, 33 ms | 0.8%, 21 ms | 5.8%, 83 ms | 21.5%, 51 ms | 36.1%, 76 ms | 8.3%, 120 ms |
| WebGL, no antialiasing | 3.2%, 55 ms | 0.7%, 37 ms | 0.0%, 20 ms | 0.0%, 21 ms | 0.4%, 19 ms | 0.0%, 20 ms | 5.3%, 47 ms | 0.0%, 18 ms |

What the live site runs at (Lucas asked, 2026-11-28). The benchmark doesn't record a frame rate, but each frame's draw time says it: 16.7 ms or less keeps up with a 60 Hz screen.

| Browser and action | Draw time per frame (median, 90th percentile) | Frames over 25 ms | Slowest frame |
|---|---|---|---|
| WebKit phone, spin | 1 ms, 1 ms | 0% | 20 ms |
| WebKit phone, pinch | 1 ms, 2 ms | 1.9% | 81 ms |
| WebKit phone, ring changes | 1 ms, 4 ms | 14.7% | 91 ms |
| WebKit desktop, ring changes | 1 ms, 2 ms | 7.9% | 92 ms |
| Chromium phone, ring changes | 0.6 ms, 12 ms | 11.7% | 102 ms |
| Firefox desktop, spin | 32 ms, 34 ms, software | 84.5% | 50 ms |

So Chrome and Safari run at the screen's full rate, with one or two short hitches per ring change or zoom, which nobody has noticed. Firefox takes about 32 ms per frame and can't get above about 30 fps. These are Playwright's engines on Lucas's Mac, not real Safari or an iPhone. Chrome on a computer wasn't measured.

What it shows:

- **Every 2D variant fixes the original Firefox lag:** desktop spins stay on the GPU with nothing dropped, against 84.5% dropped on main.
- **The branch's WebKit problem is its slowest frames:** 212 ms on phone ring changes and 157 ms in pinches, against 91 ms and 81 ms on main. That's the stutter Lucas saw.
- **View sizes (1+2) is the best 2D option:** fewer dropped frames than main everywhere, and the smallest slowest frames in WebKit and Chromium.
- **WebGL without antialiasing is the best everywhere.** With antialiasing (MSAA), WebKit and Chromium drop more frames than main, which is what worried the WebGL exploration. Antialiasing was the cause, not WebGL.
- **P1, P2 and P3 aren't worth pursuing:** no better than main in WebKit, with large slowest frames.

## Option verdicts

| Option | Verdict | Why |
|---|---|---|
| Gecko-only bitmaps | Turned down by Lucas | He wants one approach for every browser. Detection would have been `CSS.supports('-moz-orient', 'inline')`, true only in Gecko. |
| P1 + gap fills | Drop | Firefox on the GPU, but WebKit no better than main. |
| P2, nearby sizes while moving | Drop | Halves zoom-out renders, does nothing for zoom-in, and leaves the slowest frames. |
| P3, coarser size steps | Drop | Same story. Labels look the same to the eye, but every label shifts a fraction of a pixel. |
| View sizes, 1 alone | Drop | Moves all the renders into the frame the camera settles in (about 127 labels). |
| View sizes, **1+2** | **Contender** | No labels rendered during motion in any engine; pixel-identical to the branch at rest; Firefox on the GPU. |
| View sizes, 1+2+3 (one bitmap per view) | Only if needed | About the same timings as 1+2, with more complexity and coarser eviction. |
| View sizes, 4 (a few fixed sizes per label) | Drop | Text is visibly tighter at rest: scaled-down labels lose the letter spacing small text gets. |
| View sizes, 5 (budget by pixel density) | A supporting change | Alone it only helps revisits, at 140 MB on a phone. 1+2 needs about 32 MB from 2× up. |
| WebGL, no antialiasing | Out for now (Lucas, 2026-11-24) | Best timings, but visible artifacts around words and cell borders. With antialiasing on, it feels laggy. |

## Open problems

- **Firefox at phone size, ring changes:** the view-size builds drop the fewest frames (2.4–2.6%), but their slowest frame is 219–267 ms (max 354), against 86 ms on the branch. P2 and P3 show it too (150–170 ms). Not investigated. A Firefox profile of a ring change on a 3× window is the place to start.
- **View sizes, scaled-up labels:** while pinching in past a view (up to 2×), and for labels that come into view mid-move on a phone (up to 1.9×), labels are drawn scaled up and look soft. The report suggests rendering at a coarse step past about 1.15×, or making the pinch's bounds ahead of time too.
- **View sizes, resting size depends on the path:** see [handoff.md](handoff.md#decisions-waiting-on-me-lucas).
- **WebGL without antialiasing:** cell edges are jagged at 1×, and the outline's corners are sharp where 2D's are round. Edge smoothing would move into the shaders. Also missing:
  - recovering when the browser drops the GPU context (iOS does this in the background);
  - live system colors;
  - atlas eviction (the prototype clears the whole atlas when it's full);
  - making labels ahead of time.
- **WebKit's copy:** whether it runs in the GPU process (above).
- **Neither contender has been tried on a real iPhone.**
- **From the spec, still open:** the headless Firefox perf test can't see the GPU, and the camera sometimes never settles after quick keyboard steps (both in the roadmap's known issues).

## The draft reports, updated

The spec's §4 (Firefox bug) and §5 (MDN issue) were written before the WebKit findings. Spec text stays as written, so the corrections are here; file from these.

- **Firefox bug (§4):** still valid as drafted. It's stronger now: `ImageBitmap` isn't a portable workaround, because WebKit copies the whole canvas on every `transferToImageBitmap()`. So a page that pre-renders into canvases, as MDN advises, has no option that's fast in both Firefox and Safari. Add that under "Also seen".
- **MDN issue (§5):** don't simply recommend `transferToImageBitmap()`. Suggested change instead:
  - in Firefox, drawing a canvas re-sends its pixels each time, so pre-rendered images that are drawn many times should be `ImageBitmap`s;
  - in WebKit, making an `ImageBitmap` copies the canvas, so make bitmaps once and ahead of time, never per frame.
- **The repro page** ([repro.html](../superpowers/specs/2026-11-24-firefox-gpu-canvas/repro.html)) now has `&new=30`, which re-renders 30 labels each frame, to show WebKit's cost.

## Tools

In [scripts/wheel-bench/](../../scripts/wheel-bench/). Run them from the repo root against builds made with `npx vite build --mode test --outDir dist-bench/<name>`; serve a build with `node scripts/firefox-gpu-bench/serve.mjs <dir> <port>`.

- `wk.mjs`: one headed run of spins, ring changes or pinches, with dropped frames, the slowest frame, draw times, and Firefox's GPU state. Usage is in its header.
- `matrix.sh name=dir ...`: every build through the same eight runs, one browser at a time. It produced the table above.
- `count.mjs`: labels rendered per frame during ring changes, spins and pinches. Needs a build with temporary `globalThis.__renders` and `__draws` counters in `render()` and `draw()` of `sprites.ts`. Serve it on port 4300.
- `micro.mjs` with `pages/labels.html` and `pages/cells.html`: the standalone tests above. Serve `scripts/wheel-bench/pages` on port 4300, then `PAGE=labels.html node scripts/wheel-bench/micro.mjs webkit "mode=canvas&new=150" "mode=transfer&new=150"` (`PAGE=cells.html` with `mode=S1`…`S6&load=6`).
- `shots.mjs A B outDir`: the same views from two builds (served at A and B), with pixel diff counts. `crop.mjs` shows where two screenshots differ most; `ink.mjs` compares the total ink of two screenshots.
- `scripts/firefox-gpu-bench/`: the spec's Firefox benchmark.
