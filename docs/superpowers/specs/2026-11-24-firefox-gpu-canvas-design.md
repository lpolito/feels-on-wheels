# Firefox: keep the wheel's canvas on the GPU

Lucas, 2026-11-24: spinning the wheel with the keyboard in Firefox on his 2019 MacBook Pro (Intel i7-9750H, Radeon Pro 5300M, 4096 × 2560 at 2×) is laggy. This is a bug fix, so this file is both the findings and the design; there's no separate plan.

## 1. What was going on

Firefox draws a 2D canvas on the GPU when it can (its "accelerated Canvas2D", `ACCELERATED_CANVAS2D` in `about:support`, on by default on macOS and Linux). For each canvas, it scores the first 10 frames drawn after the canvas is created. A frame fails if any draw call has to fall back to software, or if more than 66% of its draw calls miss the GPU's caches. If more than 30% of those frames fail, Firefox moves that canvas to software for as long as the page is open. Nothing tells the page this happened.

The wheel failed that check during its first spin, every time:

- **Cells.** Each cell was its own path: a fill and a stroke per cell, about 260 draw calls for the whole wheel. Firefox's GPU path cache only matches a path with the same points and the same rotation, and a turning wheel has new angles every frame, so every one of those calls missed.
- **Labels.** Each label was drawn from its own small `OffscreenCanvas` (the label cache, [v1.1 spec §7](2026-11-07-feelings-wheel-v1.1-design.md)). Firefox keeps canvases under 128 × 128 in software. Every time one was drawn onto the wheel, Firefox copied its pixels over to the GPU process again, even when nothing in it had changed, so every label draw was a miss too.

Once in software, Firefox repaints the whole Retina canvas on the CPU every frame. On Lucas's Mac, that's 40–55 ms per frame (about 20 fps), with the worst frames at 100–245 ms. On the GPU, the same frames take 1–3 ms to draw.

### How it was found

1. Firefox profiles of keyboard spins on Lucas's Mac. The first was in troubleshoot mode, which turns off all GPU use, so it was redone in normal mode. In both, the wheel was drawn by Skia on the CPU in the page's process, and the GPU process's canvas thread was idle.
2. `about:support` showed Canvas2D acceleration available, and the app never reads pixels back, so Firefox was turning acceleration down for this canvas in particular.
3. Firefox's source ([`DrawTargetWebgl.cpp`](https://github.com/mozilla-firefox/firefox/blob/main/dom/canvas/DrawTargetWebgl.cpp), `UsageProfile::EndFrame` and `RequiresRefresh`; [`CanvasRenderingContext2D.cpp`](https://github.com/mozilla-firefox/firefox/blob/main/dom/canvas/CanvasRenderingContext2D.cpp), `TryAcceleratedTarget`) gave the 10-frame check and its thresholds, the prefs `gfx.canvas.accelerated.profile-frames`, `profile-fallback-ratio` and `profile-cache-miss-ratio`. `PathCacheEntry::MatchesPath` showed why a turning cell never hits the path cache.
4. A profile taken across a hard refresh showed the switch happening: on the GPU for the first frames, then software from about the 12th frame, during the first spin, for good.
5. With `gfx.canvas.accelerated.profile-frames` set to `0` (which turns the check off), Lucas found it "way more responsive": 31–56 fps (median per stretch) on the GPU. That profile also showed each label's pixels being sent to the GPU process again every frame (`RecordedSourceSurfaceCreation` under `drawImage`).
6. A benchmark in headed Firefox (below) split the two causes, and tried fixes.

## 2. The fix

- **Cells are drawn in one fill per color and one stroke for every gap** (`src/render/wheel.ts`). A frame of a spin is now a few dozen draw calls instead of about 260, so the labels' cache hits keep the frame well under Firefox's limit. It looks the same: the cells don't overlap, and the gap color is opaque (`--gap`, or `CanvasText` with forced colors), so one stroke over every edge looks the same as stroking each cell after its fill. Mid-fade, each fading cell's old color is filled first, then its new color at the fade's alpha, as before.
- **The label cache keeps each label as an `ImageBitmap`** (`src/render/sprites.ts`). After a label is drawn into its `OffscreenCanvas`, `transferToImageBitmap()` hands the pixels to a bitmap and the canvas goes back to the pool, shrunk to 1 × 1. Firefox sends a bitmap's pixels to the GPU once and reuses them on every later draw. Bitmaps are closed when they're evicted or when the pixel ratio changes. Where there's no `OffscreenCanvas`, the cache still draws from a `<canvas>`, as before.

Nothing people see or do changes, so there's nothing new for keyboard, screen reader or forced-color users. The wheel looks and behaves the same, only faster in Firefox.

### Results

Headed Firefox 159 (Playwright's build) on Lucas's Mac, 1440 × 900 at 2×, six rounds of ten keyboard steps each, default prefs. "Canvas" is where Firefox draws the wheel after the spins, read from `gfx.canvas.accelerated.debug`, which paints a green square in the corner of every accelerated canvas.

| Build | Canvas after spins | Frame interval (median) | Draw time (median) |
|---|---|---|---|
| main | software | 33 ms | 30 ms |
| main, Firefox's check turned off | GPU | 17 ms | 3 ms |
| labels as `ImageBitmap`, cells as before | software | 33 ms | 31 ms |
| cells batched, labels as before | software | 33 ms | 30 ms |
| no label cache (text drawn every frame) | software | 100 ms | 95 ms |
| **this fix** | **GPU** | **17 ms** | **1 ms** |

Either cause alone was enough to lose the GPU: cells alone or labels alone, each drawn by itself, failed the check. The fix stayed on the GPU at 60 fps with 1–2 ms draws in every view tried: the whole wheel (130 labels), a word opened (about 50), a core word or a middle word opened (65–130), the body wheel (180), pinch zooming, and a 390 × 844 window at 3× with an outer word opened (34 labels, the fewest seen). With acceleration turned off (`gfx.canvas.accelerated` false), main and the fix both take about 30 ms a frame, so the software path is no slower.

The label cache stays. Without it, labels drawn as text every frame were the slowest of all, in software and on the GPU (84 ms a frame labels-only, and Firefox moved that canvas to software too).

## 3. What fell short

- **Our Firefox perf test couldn't see this.** `tests/perf/firefox.spec.ts` runs Playwright's Firefox headless, and headless Firefox always draws canvases in software (checked with the debug square: headless software, headed GPU, same build). At 1280 × 720 and 1×, it also had a sixth of the pixels of a full-screen Retina window. It measured the software path on a small window, which is why the label cache looked like a win and nothing caught the GPU loss.
- **We followed MDN's advice, and it's incomplete.** MDN's [Optimizing canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) says to pre-render repeated drawings onto a separate canvas and `drawImage` it each frame, with a `<canvas>` in its example. In Firefox's accelerated canvas, that's what moves a canvas to software: a small canvas is re-sent on every draw. It doesn't mention `ImageBitmap`, which is the type made for this. A draft MDN issue is in §5.
- **Firefox's 10-frame check is invisible and permanent.** It's documented only in its prefs and source. A page can't tell its canvas was moved, and it never moves back, even when the frames that failed were a cold start (the first spin fills the label cache) and later frames would pass.
- **Firefox re-sends an unchanged canvas on every draw.** Drawing the same `OffscreenCanvas` or `<canvas>` again, with nothing changed, copies its pixels to the GPU process again each time, where an `ImageBitmap` is sent once. That makes the advice MDN gives the slow path. A draft Firefox bug is in §4.

No existing Firefox bug covers this. The closest are [1794442](https://bugzilla.mozilla.org/show_bug.cgi?id=1794442) (fixed in 2022, Windows only: drawing to an `OffscreenCanvas` once slowed later `drawImage` calls) and [1762523](https://bugzilla.mozilla.org/show_bug.cgi?id=1762523), which added the 10-frame check.

## 4. Draft Firefox bug

File at <https://bugzilla.mozilla.org/enter_bug.cgi?product=Core&component=Graphics%3A%20Canvas2D>. Attach `repro.html` (in [this folder](2026-11-24-firefox-gpu-canvas/repro.html)) and the text from `about:support`'s "Copy text to clipboard", and share one of the profiles (Firefox Profiler → Upload) if they ask for one.

**Summary:** Drawing an unchanged OffscreenCanvas or `<canvas>` with drawImage re-sends its pixels on every call, and the accelerated canvas falls back to software for good

**Component:** Core :: Graphics: Canvas2D

**Steps to reproduce:**

1. In `about:config`, set `gfx.canvas.accelerated.debug` to `true`, so an accelerated canvas shows a green square in its top-right corner.
2. Open the attached `repro.html?src=offscreen`. It renders 150 short labels once, each into its own 120 × 28 `OffscreenCanvas`, then draws them rotated onto one full-window canvas every frame with `drawImage`. Nothing is drawn into the small canvases after the first frame.
3. Wait about 3 seconds for the median frame time to show, and look at the canvas's top-right corner.
4. Repeat with `?src=bitmap`, which draws the same labels from `ImageBitmap`s made with `transferToImageBitmap()`.

**Actual results:** With `?src=offscreen` (and `?src=canvas`, which uses `<canvas>` elements), the green square disappears after the first frames and the canvas is drawn in software for as long as the page is open: 33.3 ms median frames for both, on a 2× Retina window at 1440 × 900 in Playwright's Firefox 159. The profiler shows `RecordedSourceSurfaceCreation` and memory copies under every `drawImage`, and `PCanvas::Msg_AddBuffer` sending the pixels to the GPU process, though the source canvases haven't changed. With `?src=bitmap`, the canvas stays accelerated, at 16.7 ms (60 fps).

**Expected results:** Drawing an unchanged canvas again reuses the copy already sent, as with an `ImageBitmap`, so pre-rendering into a canvas (as [MDN advises](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)) doesn't move the destination canvas to software.

**Also seen:** the move to software is permanent, even when only the first frames fail. In a real app ([Feels on Wheels](https://github.com/lpolito/feels-on-wheels/pull/PRNUMBER)), the first spin after loading renders hundreds of new labels, and the canvas never comes back to the GPU after that, though later frames would pass. With `gfx.canvas.accelerated.profile-frames` set to `0`, it runs at 60 fps on the GPU instead of 20 fps in software on a 2019 MacBook Pro.

**Configuration:** Firefox 160.0 (release, build 20261116130455), macOS 15.8.3, MacBook Pro 16-inch 2019, Intel UHD 630 + AMD Radeon Pro 5300M, 4096 × 2560 at 2×. Also seen in Playwright's Firefox 159.

## 5. Draft MDN issue

File at <https://github.com/mdn/content/issues/new/choose> ("Content or feature request"):

**Title:** Optimizing canvas: recommend ImageBitmap for pre-rendered images

**Page:** https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas

**What's wrong:** "Pre-render similar primitives or repeating objects on an offscreen canvas" recommends rendering into a canvas and drawing that canvas each frame. In Firefox's accelerated Canvas2D, drawing a canvas copies its pixels to the GPU again every time, even when it hasn't changed, and a canvas whose frames are mostly such copies is moved to software for good (Firefox bug: add its number once it's filed). An `ImageBitmap` (from `createImageBitmap()` or `OffscreenCanvas.transferToImageBitmap()`) is uploaded once.

**Suggested change:** After pre-rendering into an `OffscreenCanvas`, call `transferToImageBitmap()` and draw the bitmap; mention closing bitmaps that are no longer needed.

## 6. Checking it again

`scripts/firefox-gpu-bench/` has the benchmark: it builds the test bundle, opens it in headed Firefox with the debug square on, spins with the keyboard, and prints frame times and whether the canvas is still on the GPU. It needs a computer with a GPU and a display, so it doesn't run in CI. The new unit tests keep the two causes from coming back where CI can see them: cells drawn in one fill per color and one stroke (`tests/unit/wheel-render.test.ts`), and labels drawn from `ImageBitmap`s (`tests/unit/sprites.test.ts`).

Also found while benchmarking: in about 3 of 30 runs, across builds with and without this fix, the camera never settled after ten quick keyboard steps (`__fw.moving()` stayed true). Listed in the roadmap's known issues.
