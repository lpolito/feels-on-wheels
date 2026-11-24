# WebGL wheel renderer: exploration report

Worktree: `/Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-webgl-renderer-b1f5e2` (branch `claude/explore-webgl-renderer-b1f5e2`, based on `ff-canvas-perf`'s last commit; `ff-canvas-perf` itself untouched).

## What I built

A WebGL2 renderer wired into the app in place of `createWheelRenderer`, behind a build-time switch. It is not a standalone page.

- `src/render/wheel-gl.ts` (about 735 lines, about 120 of them copied label-fitting code) implements the same `WheelRenderer` interface, `stats` included, so `__fw.labelsByRing()`, `focusRing()`, and `focusOutline()` keep working.
- `src/main.ts`: with `VITE_WHEEL_GL=1` at build time it uses the GL renderer. If `getContext('webgl2')` returns null, it falls back to the 2D renderer.
- **Cells:** uploaded once per wheel as triangles in wheel space (radius and angle per vertex, tessellated every 0.01 rad). The vertex shader applies the camera (rotation, scale, center). The gaps come from two draws of the same mesh: one in the gap color, half a gap larger, then the cells half a gap smaller. Fills and fades come from a per-cell color texture (N×2 texels), re-uploaded only when a color changes.
- **Labels:** the CPU fits labels exactly as the 2D renderer does. Each label block is drawn white on black in a CPU 2D canvas (`willReadFrequently`), and its red channel is uploaded into a 4096² single-channel (R8) atlas (16 MB). All labels are one instanced draw: each instance holds its wheel-space position and atlas rectangle, and the shader computes the position and the upside-down flip from the camera. The color is tinted in the shader.
- **Selection effects:** the outline, the opened word's lift, shadow, and pulse, and the focus ring are each drawn by a fragment shader, limited by scissor to a box around the shape. The opened word's bold label is an atlas entry drawn last.
- **Three label policies for zooming**, set by `VITE_GL_LABELS` or `globalThis.__glLabels`:
  - `rerender`: every label at its exact size (rounded to 0.5 px), as the 2D sprite cache does now;
  - `scale`: render once, then scale the texture, re-rendering only past 2× or ½×;
  - `hybrid` (default): scale while a label's size is changing (up to 1.5×), re-render at most 12 a frame beyond that, then re-render at the exact size once the size holds for a frame. That last step uses a redraw the renderer schedules itself.

Not done: context loss, live system colors (they're resolved to RGB once per `setColors`), round corners on the outline, deleting old atlas entries (the whole atlas clears when full), and pre-rendering labels before they're needed.

## Work per frame (load-independent)

Measured with `.bench/count.mjs` (headless Chromium; the counts don't depend on load). It runs the same steps as the shared `count.mjs`: from `/angry/aggressive/hostile`, two ring changes out and two in, twice; ten spin steps; and a 2.5 s ctrl-wheel pinch. The main and branch figures come from P3's instrumented builds (`explore-p3-coarse-sizes-de0771/dist-bench/{main,fix}-count`).

"Renders" are label rasterizations: a sprite per line in 2D, an atlas upload per label block in GL. Each figure is the total for the step, with the most in any one frame in parentheses.

### Phone (390×844 at 3x)

| Step | main | branch (fix) | GL rerender | GL scale | GL hybrid |
|---|---|---|---|---|---|
| Out a ring, first time | 677 (64) | 697 (66) | 752 (153) | 81 (61) | 235 (60) |
| Out a ring, again | 674 (66) | 692 (66) | 586 (97) | 0 | 39 (12) |
| In a ring, first time | 362 (79) | 354 (85) | 325 (63) | 2 | 35 (12) |
| In a ring, again | 344 (79) | 361 (79) | 348 (76) | 0 | 37 (12) |
| Spin, 10 steps | 25 (4) | 25 (4) | 19 (3) | 10 (1) | 19 (3) |
| Pinch, 2.5 s | 0 | 0 | 1 | 37 (22) | 26 (13) |

### Desktop (1440×900 at 2x)

| Step | main | branch (fix) | GL rerender | GL scale | GL hybrid |
|---|---|---|---|---|---|
| Out a ring, first time | 332 (84) | 332 (84) | 302 (79) | 65 (63) | 192 (64) |
| Out a ring, again | 260 (82) | 178 (82) | 0 | 0 | 19 (12) |
| In a ring | 104 (103) | 104 (103) | 0 | 0 | 12 (12) then 0 |
| Spin, 10 steps | 15 (3) | 15 (3) | 10 (1) | 10 (1) | 10 (1) |
| Pinch, 2.5 s | 46 (46) | 274 (125) | 158 (62) | 0 | 46 (12) |

- **Draw calls:** GL makes 7 per frame whatever the view: 2 cell draws, 1 instanced label draw, up to 3 effect passes, and the bold label. Frames that show 14 are two app draws landing in one animation frame. The 2D branch makes one fill per color group plus one stroke, then one `drawImage` per label line: 35–130 per frame here.
- **Upload size:** GL hybrid uploads at most 0.7 MB per frame on the phone and 0.9 MB on desktop (single-channel). GL rerender peaks at 2.7 MB.
- **Hybrid** cuts label renders during ring changes from 64–103 a frame to 12 or fewer, except once per session: the first time a ring's labels appear at any size (about 60 in one frame). Pre-rendering the next view's labels at idle would remove that spike.
- **The single-channel atlas** holds four times as many labels as the 2D cache's 16 MB RGBA budget. That's why GL rerender on desktop repeats ring changes with no re-renders, while main and the branch still render 178–332.
- **The labels themselves cost about the same.** GL still draws text with a CPU 2D canvas and then copies it (`getImageData`, `texSubImage2D`). What it saves is the number of renders, plus WebKit's `transferToImageBitmap` copy. The same scale-while-moving, sharpen-at-rest policy could be tried in the 2D renderer too (by scaling a cached sprite in `drawImage`), which is close to what P2 and P3 are exploring.

## How it looks

These screenshots are in the worktree's `.bench/shots/`, phone size unless noted.

- `gl-chromium_.png`, `gl-chromium_angry_aggressive_hostile.png`: Chromium, at rest and with a word opened. Side by side with `2d-chromium_*.png` they look the same to me: same cells, gaps, labels, outline, shadow, and lift.
- `gl-webkit_*.png`, `gl-firefox_*.png`: WebKit and Firefox render the same. Close crops: `crop-gl.png` (GL), `crop-2d.png` (2D), `crop-gl-webkit.png`, and `crop-gl-firefox.png`.
  - **Outline corners:** the outline's corners are sharp; 2D strokes them round. That's fixable in the shader.
- `small-gl-chromium-dark.png`: dark mode is correct.
- `small-gl-chromium-forced.png` beside `small-2d-chromium-forced.png`: forced colors work: system colors are resolved to RGB through a 1×1 canvas and labels are tinted.
  - **Shadow in forced colors:** GL draws the opened word's shadow, which the 2D canvas doesn't show in forced colors.
  - **Outline color:** the outline's Highlight comes out a slightly different shade.
- **Zoom sharpness**, in `zoom/`. These are crops at rest after zooming from the whole wheel into a ring:
  - `crop-gl-scale-step3-rest.png`: labels upscaled up to 2× are visibly soft;
  - `crop-gl-hybrid-step3-rest.png`: re-rendered at rest, as sharp as 2D (`crop-fix-2d-step3-rest.png`).

  Mid-zoom frames (`*-mid.png`) were captured near the end of the animation, so they don't show the in-motion softness well. Hybrid allows up to 1.5× scaling while moving, which is less than the softness in the scale-mode crop.

## Frame times: provisional and unreliable

Four sessions were running headed browsers on this Mac at the same time (load average 13–19), so please don't rank anything on these numbers. One pattern is worth re-checking on a quiet machine.

In Playwright's WebKit at phone size, the GL build dropped more frames than main, even on spins with no uploads and about 1 ms of CPU per draw. Dropped frames are frames over 25 ms:

- with antialiasing: 13–58% dropped;
- without antialiasing: 5–14% dropped;
- main: 0–2% dropped.

A minimal page that only clears a WebGL2 canvas (`.bench/micro/gl.html`) also dropped 11–31% of frames in WebKit, against 0% for a 2D canvas. At desktop size with antialiasing it dropped 96%. Chromium and Firefox showed some of the same pattern under that load. If a quiet run confirms this, the WebGL canvas's presentation itself is costly in WebKit (at least in Playwright's build), and that must be checked in Safari on a real iPhone before going further.

## Ready-to-run benchmark (for the main session, with nothing else running)

The builds (all `--mode test` with `VITE_WHEEL_GL=1`) are in `/Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-webgl-renderer-b1f5e2/dist-bench/`:

| Build | What it is |
|---|---|
| `gl` | hybrid labels, antialiasing on |
| `gl-noaa` | hybrid labels, antialiasing off |
| `gl-scale` | scale-only labels |
| `gl-rerender` | exact-size labels, like the 2D sprite cache |

The label mode and antialiasing are baked into each build, so the shared `wk.mjs` works unchanged. Each build also counts uploads and draw calls in `globalThis.__renders`, `__draws`, `__glCalls`, and `__uploadBytes`.

Start the servers from the worktree:

```bash
cd /Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-webgl-renderer-b1f5e2
```
```bash
node scripts/firefox-gpu-bench/serve.mjs dist-bench/gl 4910 &
node scripts/firefox-gpu-bench/serve.mjs dist-bench/gl-noaa 4917 &
node scripts/firefox-gpu-bench/serve.mjs dist-bench/gl-scale 4918 &
node scripts/firefox-gpu-bench/serve.mjs dist-bench/gl-rerender 4919 &
```

Run each one alone. Phone size:

```bash
ENGINE=webkit VW=390 VH=844 DPR=3 node /Users/lucas/dev/feels-on-wheels/.bench/explore/wk.mjs http://localhost:4910 gl inout 6
```

Use `ENGINE=chromium` or `firefox`, the modes `spin`, `inout`, and `pinch`, and `VW=1440 VH=900 DPR=2` for desktop. The Firefox "GPU/sw" column in `wk.mjs` reads the 2D canvas's debug overlay, so ignore it for GL builds.

The minimal WebGL presentation check runs headed, on port 4914:

```bash
node scripts/firefox-gpu-bench/serve.mjs .bench/micro 4914 &
```
```bash
node .bench/micro.mjs webkit gl.html "kind=2d" "kind=gl&aa=1" "kind=gl&aa=0" "kind=gl&aa=1&draw=0"
```

Work counts (any time; headless and load-independent):

```bash
GLMODE=hybrid node .bench/count.mjs http://localhost:4910
```

`.bench/wk.mjs` in this worktree is a copy of the shared one that also takes `GLMODE`, `GLAA=0`, and `GLSKIP=labels|cells|all`, and prints uploads per round.

## WebGPU

As of my training data, not re-checked today: WebGPU ships in Chrome and Edge (desktop since 113, Android since 121), in Safari 26 on macOS, iOS, and iPadOS, and in Firefox on Windows (141) and Apple-silicon Macs (145). It's still off on Linux and Android Firefox. That's not enough for a single path yet, and it wouldn't change the label problem: text would still be drawn by a 2D canvas and uploaded.

## What a real WebGL renderer would need

1. **Sharp text across zoom levels.** Use the hybrid policy, plus pre-rendering a transition's target labels before or at its start, and least-recently-used eviction instead of clearing the whole atlas. SDF or MSDF text would scale cleanly, but it needs a bundled font and generated glyph atlases, which loses the system font and breaks with locales and scripts the font doesn't cover. A canvas-rendered atlas keeps `system-ui`, shaping, and every script.
2. **Forced colors and theme colors.** Resolve palette strings to RGB through a canvas (done here). Re-resolve whenever system colors or the theme change, since 2D gets live system colors for free. Skip the shadow in forced colors, as 2D effectively does.
3. **The opened word's shadow and pulse.** Done here as distance-field shaders. They need round outline corners and a closer match to the canvas's Gaussian `shadowBlur`.
4. **Focus rings.** Done (the wheel ring, and the focus-colored outline).
5. **Context loss.** Handle `webglcontextlost` and `webglcontextrestored` (iOS drops contexts in the background and under memory pressure). Rebuild programs, buffers, and the color texture, invalidate the whole atlas, and redraw. None of that is in the prototype.
6. **A fallback when WebGL2 is missing or blocklisted.** Keep the 2D renderer, as the prototype does. That means two renderers to maintain, test, and keep looking the same, plus a rule for when to fall back (context creation fails, or `failIfMajorPerformanceCaveat` reports a software renderer).
7. **Bundle size.** The production `index` chunk grows from 63.3 kB (22.70 kB gzip) to 80.8 kB (28.97 kB gzip): +17.5 kB, about +6.3 kB gzip, with the 2D renderer kept as the fallback. Sharing the fitting code with `wheel.ts` would save about 2 kB.
8. **GPU memory.** The 16 MB atlas plus the drawing buffer: about 12 MB at 3x on a phone, and about 4× that with antialiasing (MSAA). Antialiasing is probably unnecessary at 2x or above, or can be done in the shaders, which would also avoid the cost WebKit seems to show.
9. **Tests and screenshots.** The `__fw` hooks are preserved. Chromatic baselines would shift slightly on all 19 devices. CI's headless browsers need WebGL2 (they have it, through software renderers), or the tests run the fallback instead.
10. **Rough size of the rewrite.** Turning this into production code — shared fitting, context loss, fallback rules, label pre-rendering and eviction, shader polish, tests, `ACCESSIBILITY.md` updates — is about 1–2 weeks of focused work, plus checks on a real iPhone (Safari), Android (Chrome), and Firefox. The open risk is the one in the frame-time section: whether WebGL presentation in WebKit costs more than the 2D canvas it replaces.
