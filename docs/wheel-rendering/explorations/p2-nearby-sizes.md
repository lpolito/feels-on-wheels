> Copied 2026-11-24 from the exploration's report. Its code, scripts and raw counts are on branch `claude/explore-p2-nearby-sizes-5d951c` (`.bench/`). Absolute paths below point at worktrees on Lucas's Mac that may be gone. Frame times in it were taken under load; use the quiet timings in [findings.md](../findings.md#timing-one-at-a-time-on-a-quiet-machine).

# P2: reuse a nearby larger label while the wheel moves

Exploration only. The code is in this worktree (branch `claude/explore-p2-nearby-sizes-5d951c`, one local commit, not pushed), and also as a patch on top of the `ff-canvas-perf` branch at `/Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-p2-nearby-sizes-5d951c/.bench/p2.patch`.

**Frame times are not in this report.** Four sessions were running headed benchmarks on the same Mac at once, so, per Lucas, everything below comes from things load doesn't change: labels rendered per frame (`count.mjs`), Firefox's GPU-or-software state, and screenshots. The runbook at the end has the exact commands to time every variant later, with nothing else running.

## What I built

Labels stay ImageBitmaps (the branch's approach). Changes on top of the branch:

- `sprites.ts`: `frame(moving)` starts each wheel draw. While `moving`, a label whose exact size (rounded to 0.5 px) isn't cached is drawn from a cached bitmap of the same text and color up to TOL larger, scaled down. With no such neighbor, it's rendered at its exact size, as today. The cache reports `approximate` when any label in the frame was a stand-in.
- `main.ts`: frames the camera draws (spring ticks, and pinch/drag `jump`s) are `moving`. 50 ms after the last frame that drew any stand-in, if the camera isn't springing, one still frame draws every label at its exact size.
- Variant **budget**: that exact pass renders at most 16 labels per frame, and the rest keep standing in for a few more frames, so the pass doesn't come as one burst.

Builds (Vite env vars; `--mode test`):

| Variant | TOL | Exact-pass budget | Build |
|---|---|---|---|
| P2 15% | 0.15 | none | `/Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-p2-nearby-sizes-5d951c/dist-bench/p2-15` |
| P2 30% | 0.30 | none | `/Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-p2-nearby-sizes-5d951c/dist-bench/p2-30` |
| P2 30% + budget | 0.30 | 16 labels/frame | `/Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-p2-nearby-sizes-5d951c/dist-bench/p2-30b` |

The count builds (with `__renders` / `__draws` counters) are next to them, under `dist-bench/count-*`, including `count-main` and `count-fix`.

Two things I tried and dropped:

- **"A size seen two frames in a row gets rendered exactly"** (no moving flag). Near the end of a spring, sizes repeat once they're rounded to 0.5 px, so most stand-ins became exact renders while the wheel was still moving: 319 of 475 renders in a middle-to-core step. My first redraw request also ran in the same animation frame as the camera's draw, which doubled draws.
- **Render ahead** (a growing label with no larger neighbor is rendered 30% larger, so later frames can reuse it). Zoom-in barely improved, and zoom-out got worse (500 to 650 renders): at 3x the bigger bitmaps crowd the 16 MB cap, which holds only about 130 labels. It also had a bug where the rounded-up key collided with a cached one and the new bitmap was evicted and closed in the same call, which I fixed before measuring.

## Results

"Labels rendered" counts `render()` calls. On the branch and in P2, each one is a new ImageBitmap (`transferToImageBitmap`), which is the WebKit cost. On main it's a canvas. `count.mjs` runs each ring change twice: "run 1 / run 2". "Most in one frame" is the single worst frame across both runs, with the 90th-percentile frame in parentheses. Each count is from one run.

### Chromium, 390x844 at 3x

| | main | branch | P2 15% | P2 30% | P2 30% + budget |
|---|---|---|---|---|---|
| Middle → core (zoom out): labels rendered, run 1 / run 2 | 680 / 709 | 680 / 675 | 340 / 404 | 276 / 292 | 265 / 286 |
| … most in one frame (p90 frame) | 66 (61) | 66 (63) | 65 (55) | 66 (54) | 61 (20) |
| Core → middle (zoom in): labels rendered, run 1 / run 2 | 345 / 374 | 312 / 349 | 379 / 389 | 393 / 413 | 366 / 281 |
| … most in one frame (p90 frame) | 81 (52) | 81 (33) | 103 (52) | 84 (54) | 66 (52) |
| Spin, 10 steps: labels rendered | 24 | 22 | 25 | 23 | 25 |
| Pinch, 2.5 s: labels rendered | 0 | 0 | 0 | 0 | 0 |
| Dropped frames, worst frame | not measured | not measured | not measured | not measured | not measured |

### Chromium, 1440x900 at 2x

| | main | branch | P2 15% | P2 30% | P2 30% + budget |
|---|---|---|---|---|---|
| Middle → core (zoom out): labels rendered, run 1 / run 2 | 250 / 246 | 332 / 164 | 168 / 82 | 86 / 82 | 168 / 0 |
| … most in one frame (p90 frame) | 82 (63) | 82 (63) | 82 (1) | 82 (0) | 64 (16) |
| Core → middle (zoom in): labels rendered, run 1 / run 2 | 104 / 104 | 186 / 186 | 185 / 145 | 96 / 104 | 16 / 53 |
| … most in one frame (p90 frame) | 82 (0) | 82 (21) | 123 (0) | 82 (0) | 21 (0) |
| Spin, 10 steps: labels rendered | 9 | 9 | 9 | 9 | 5 |
| Pinch, 2.5 s: labels rendered | 46 | 46 | 46 | 46 | 46 |
| Dropped frames, worst frame | not measured | not measured | not measured | not measured | not measured |

### Firefox, 390x844 at 3x

| | main | branch | P2 15% | P2 30% | P2 30% + budget |
|---|---|---|---|---|---|
| Middle → core (zoom out): labels rendered, run 1 / run 2 | 694 / 678 | 698 / 729 | 375 / 449 | 261 / 327 | 298 / 237 |
| … most in one frame (p90 frame) | 66 (64) | 64 (61) | 66 (56) | 66 (36) | 61 (21) |
| Core → middle (zoom in): labels rendered, run 1 / run 2 | 346 / 296 | 333 / 356 | 358 / 382 | 368 / 413 | 303 / 308 |
| … most in one frame (p90 frame) | 59 (53) | 80 (35) | 101 (34) | 119 (52) | 72 (34) |
| Spin, 10 steps: labels rendered | 25 | 25 | 25 | 23 | 25 |
| Pinch, 2.5 s: labels rendered | 0 | 0 | 0 | 0 | 0 |
| Canvas after spin, ring changes and pinch | sw | GPU | GPU | GPU | GPU |
| Dropped frames, worst frame | not measured | not measured | not measured | not measured | not measured |

### Firefox, 1440x900 at 2x

| | main | branch | P2 15% | P2 30% | P2 30% + budget |
|---|---|---|---|---|---|
| Middle → core (zoom out): labels rendered, run 1 / run 2 | 332 / 260 | 332 / 246 | 168 / 32 | 168 / 0 | 168 / 0 |
| … most in one frame (p90 frame) | 82 (82) | 82 (21) | 82 (0) | 82 (0) | 64 (16) |
| Core → middle (zoom in): labels rendered, run 1 / run 2 | 104 / 104 | 104 / 104 | 96 / 172 | 0 / 0 | 16 / 16 |
| … most in one frame (p90 frame) | 103 (0) | 82 (0) | 150 (0) | 0 (0) | 16 (0) |
| Spin, 10 steps: labels rendered | 15 | 8 | 9 | 8 | 9 |
| Pinch, 2.5 s: labels rendered | 46 | 46 | 46 | 46 | 46 |
| Canvas after spin, ring changes and pinch | sw | GPU | GPU | GPU | GPU |
| Dropped frames, worst frame | not measured | not measured | not measured | not measured | not measured |

### Webkit, 390x844 at 3x

| | main | branch | P2 15% | P2 30% | P2 30% + budget |
|---|---|---|---|---|---|
| Middle → core (zoom out): labels rendered, run 1 / run 2 | 679 / 653 | 657 / 710 | 325 / 339 | 245 / 259 | 239 / 244 |
| … most in one frame (p90 frame) | 66 (64) | 65 (64) | 61 (40) | 61 (35) | 61 (20) |
| Core → middle (zoom in): labels rendered, run 1 / run 2 | 318 / 333 | 387 / 391 | 368 / 452 | 410 / 336 | 330 / 328 |
| … most in one frame (p90 frame) | 79 (33) | 100 (52) | 117 (52) | 96 (53) | 69 (52) |
| Spin, 10 steps: labels rendered | 23 | 25 | 25 | 25 | 25 |
| Pinch, 2.5 s: labels rendered | 0 | 0 | 0 | 0 | 0 |
| Dropped frames, worst frame | not measured | not measured | not measured | not measured | not measured |

### Webkit, 1440x900 at 2x

| | main | branch | P2 15% | P2 30% | P2 30% + budget |
|---|---|---|---|---|---|
| Middle → core (zoom out): labels rendered, run 1 / run 2 | 332 / 246 | 332 / 164 | 168 / 82 | 168 / 82 | 150 / 0 |
| … most in one frame (p90 frame) | 82 (63) | 82 (65) | 82 (0) | 82 (0) | 85 (16) |
| Core → middle (zoom in): labels rendered, run 1 / run 2 | 104 / 104 | 186 / 104 | 185 / 145 | 185 / 145 | 34 / 16 |
| … most in one frame (p90 frame) | 82 (0) | 82 (0) | 103 (0) | 103 (0) | 16 (0) |
| Spin, 10 steps: labels rendered | 9 | 9 | 9 | 9 | 9 |
| Pinch, 2.5 s: labels rendered | 46 | 46 | 46 | 46 | 46 |
| Dropped frames, worst frame | not measured | not measured | not measured | not measured | not measured |

### Reading the counts

- **Phone, zooming out (middle word to core word), the step that was 700 renders:** P2 halves the total or better (about 680–730 down to 245–330 at 30%, 325–450 at 15%) in all three engines. The worst single frame doesn't move (about 61–66 in every build). That frame is the one where the opened word changes and many labels switch color (`table.label(hue, ring, lit)`); a stand-in has to be the same color, so P2 can't cover it. The budget variant also brings the 90th-percentile frame down from about 61 to about 20.
- **Phone, zooming in (core to middle):** no gain. Growing labels never have a larger cached size to scale down from. Without the budget, the exact pass at rest makes it slightly worse (totals 330–450 against 310–390, and single frames up to 94–119 against about 80). With the budget the totals are about the branch's and the worst frame is lower (54–72).
- **Desktop (2x):** few labels change size during a ring change, because most sit at the 24 px cap, and run 2 starts with a warm cache (2x fits far more labels in 16 MB), so the numbers jump around. P2 cuts totals, and the budget variant is the only one that removes the 82-render frame. Treat desktop as "fine either way".
- **Spin and pinch:** unchanged. Spins don't change label sizes. The `count.mjs` pinch (oscillating ctrl+wheel around the resting view) renders 0 labels at phone size and 46 at desktop in every build, so it doesn't exercise P2. A pinch that crosses a real zoom range would need its own script.
- **Firefox:** the canvas stays on the GPU with every P2 variant, at both sizes, after spin, ring changes and pinch (main goes to software, as before). This is from one short run per case (2 rounds each), so it's provisional, though the check counts cache misses, not time.

## How labels look while moving

I froze `requestAnimationFrame` partway through a ring change (`midshots.mjs`). An instrumented build reported how many labels in the frozen frame were stand-ins, and how far each was scaled down. At 300 ms into the phone zoom-out, 56–62 of 59–64 labels were stand-ins, drawn at 0.80–0.83× their bitmap with TOL 30% (0.89–0.90× at 15%). That's near the worst case.

**At 3x I can't see any softness.** Native-resolution crops of the outer ring, frozen P2 30% next to the branch at about the same moment, look equally crisp in Chromium, Firefox and WebKit:

- `/Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-p2-nearby-sizes-5d951c/.bench/shots/crops/{chromium,firefox,webkit}-phone-out-{fix,p2-15,p2-30}-crop.png`
- full frames: `/Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-p2-nearby-sizes-5d951c/.bench/shots/{engine}-{phone,desktop}-{out,in}-{fix,p2-15,p2-30}.png`

At desktop 2x, the frozen frames had no stand-ins (labels at the cap don't change size), so I have no 2x or 1x softness evidence. At 1x a 0.8× bilinear downscale is the case most likely to show softness, and it's worth a look before choosing 30% over 15%.

## What P2 would need to become real

1. **A real "moving" signal.** Here it's "the camera drew this frame" plus a 50 ms timer, because a pinch moves the camera with `jump`, which never reports `moving`. A real version would have the controller say when a gesture or spring is in progress, and the renderer ask for the exact pass when it ends.
2. **The exact pass spread over frames** (the budget variant) or done when idle. Otherwise every zoom ends with one frame that renders every label on screen, which is the cost we're trying to avoid.
3. **Something for zoom-in.** Scaling down only helps shrinking labels. Options: allow a small scale-up (for example up to 10%) while moving, which is blurrier; or pre-render the next ring view's sizes before the spring starts. Render-ahead didn't work at 3x.
4. **The color-change frame**, which is now the worst frame on phones: about 60 labels re-rendered when the opened word changes. Two possible fixes: render label bitmaps once as white-on-transparent and tint them with a composite, or postpone the color swap's renders. Either is a change of its own.
5. **Tests.** Unit tests for the stand-in rule, the exact pass and the budget, and an e2e check that a resting wheel ends with only exact labels. The `wheel-render` test mocks need `frame` and `approximate`. No test-only paths: the moving flag and the exact pass are real behavior.
6. **Softness checks at 1x and 2x**, and a call on TOL: 30% saves more than 15% (about 280 against 380 renders), and at 3x both looked the same.
7. **Timing**, run alone (runbook below), to see whether halving the zoom-out renders moves WebKit's worst frames, given that the color-change frame stays.

## Runbook: timing every variant later

Serve each build on its own port (the server is the branch's):

```bash
FF=/Users/lucas/dev/feels-on-wheels/.claude/worktrees/ff-canvas-perf
W=/Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-p2-nearby-sizes-5d951c
node $FF/scripts/firefox-gpu-bench/serve.mjs $FF/dist-bench/main 4500 &
node $FF/scripts/firefox-gpu-bench/serve.mjs $FF/dist-bench/fix 4501 &
node $FF/scripts/firefox-gpu-bench/serve.mjs $W/dist-bench/p2-15 4502 &
node $FF/scripts/firefox-gpu-bench/serve.mjs $W/dist-bench/p2-30 4503 &
node $FF/scripts/firefox-gpu-bench/serve.mjs $W/dist-bench/p2-30b 4505 &
```

Then, for each engine (`chromium`, `firefox`, `webkit`), size (`VW=390 VH=844 DPR=3` and `VW=1440 VH=900 DPR=2`), mode (`spin`, `inout`, `pinch`) and port (4500 main, 4501 branch, 4502 P2 15%, 4503 P2 30%, 4505 P2 30% + budget):

```bash
ENGINE=webkit VW=390 VH=844 DPR=3 node /Users/lucas/dev/feels-on-wheels/.bench/explore/wk.mjs http://localhost:4503 p2-30 inout 6
```

Or all of it, one run after another: `/Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-p2-nearby-sizes-5d951c/.bench/matrix.sh` (set `NOCOUNT=1` to skip the counts afterward; `ENGINES="webkit"` to limit engines; `ROUNDS` defaults to 6). To recount labels: `/Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-p2-nearby-sizes-5d951c/.bench/counts.sh`, which needs the count builds served on ports 4510–4515 (`/Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-p2-nearby-sizes-5d951c/.bench/serve-all.sh` serves every build).

To rebuild a variant from the patch: apply `/Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-p2-nearby-sizes-5d951c/.bench/p2.patch` on `ff-canvas-perf`, then `VITE_P2_TOL=0.3 VITE_P2_BUDGET=16 npx vite build --mode test --outDir dist-bench/p2-30b` (add `VITE_COUNT=1` for a count build).
