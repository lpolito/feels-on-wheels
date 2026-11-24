# P3: coarser geometric label sizes (exploration)

P3 changes the label cache (`src/render/sprites.ts`) so label sizes come in geometric steps 10%, 15%, or 20% apart instead of 0.5 px apart. Each label renders at the next step up and is drawn scaled down to its exact size, both at rest and in motion. Labels stay ImageBitmaps, as on the branch. Patch: `.bench/p3.patch` (uncommitted in this worktree, on top of eae7723). `VITE_P3=<ratio>` picks the step; when it's unset, the cache keeps the branch's 0.5 px steps.

Frame times aren't in this report. Four sessions were running headed benchmarks on the same Mac, so I stopped my timing run. The only results here are ones that load doesn't change: labels rendered, Firefox GPU or software, and screenshots.

## Labels rendered per ring change

Measured in Chromium with `count.mjs`. Render counts come from the cache's own hits and misses, so they're the same in every engine apart from small `measureText` differences. Starting at `/angry/aggressive/hostile`, the run went out two rings and in two rings, twice. Each cell gives the total renders for the step in the first and second rounds, and the most renders in any one frame, also per round.

**Phone 390×844 at 3x** (about 50–70 labels drawn per frame)

| step | main | branch | P3 10% | P3 15% | P3 20% |
|---|---|---|---|---|---|
| outer → middle | 18 / 0 | 18 / 0 | 18 / 0 | 18 / 0 | 18 / 0 |
| middle → core (the big one) | **730 / 697**, max 64 / 64 | 679 / 727, max 64 / 66 | 468 / 428, max 61 / 61 | **313 / 286**, max 64 / 61 | 315 / 309, max 61 / 61 |
| core → middle | 409 / 372, max 63 / 79 | 365 / 373, max 79 / 79 | 261 / 276, max 78 / 78 | 165 / 166, max 77 / 77 | 167 / 151, max 77 / 39 |
| middle → outer | 2 / 2 | 2 / 2 | 2 / 2 | 2 / 2 | 2 / 2 |
| spin, 10 steps | 25 | 22 | 25 | 25 | 25 |
| pinch, 2.5 s | 0 | 0 | 0 | 0 | 0 |

**Desktop 1440×900 at 2x** (about 50–130 labels drawn per frame)

| step | main | branch | P3 10% | P3 15% | P3 20% |
|---|---|---|---|---|---|
| outer → middle | 16 / 0 | 16 / 0 | 16 / 0 | 16 / 0 | 16 / 0 |
| middle → core | 332 / 164, max 82 / 82 | 250 / 164, max 82 / 82 | 168 / **0**, max 82 / 0 | 86 / **0**, max 64 / 0 | 86 / **0**, max 65 / 0 |
| core → middle | 186 / 186, max 82 / 82 | 104 / 186, max 82 / 82 | **0 / 0** | **0 / 0** | **0 / 0** |
| middle → outer | 2 / 2 | 2 / 2 | 0 / 0 | 0 / 0 | 0 / 0 |
| spin, 10 steps | 9 | 9 | 9 | 9 | 9 |
| pinch, 2.5 s | 46, max 46 | 46, max 46 | 46, max 46 | 46, max 46 | 46, max 46 |

What the numbers say:

- **Desktop:** once the cache is warm, P3 renders nothing on ring changes at any of the three steps. Every size a ring change goes through fits in the cache.
- **Phone:** the big step goes from about 700 renders to about 450 at 10% and about 300 at 15% or 20%. That's 1.6× fewer at 10% and 2.3× fewer at 15%. 20% cuts no more than 15%.
- **The worst frame keeps its burst.** At every step size, the most renders in one frame stays around 61–79 on phone and 64–82 on desktop's first round. Those come in the first frames of a ring change, when a ring's worth of labels appears at sizes that aren't in the cache yet. P3 removes the long tail of re-renders as labels grow, but not that first burst.
- **The phone's byte cap is part of the cost.** At 3x, the 16 MB cap thrashes during ring changes, and P3 makes it a little worse because each bitmap is rendered up to one step larger. A diagnostic build at 15% counted 134 evictions on middle → core and 285 on core → middle. With a 64 MB cap there were no evictions, and core → middle dropped from 187 renders to 78. Middle → core stayed at 312, so those renders are genuinely new sizes or new labels. The branch at 64 MB still rendered about 730 on that step, so with 0.5 px steps the cap isn't what limits it; the steps are.
- **Spin** renders hardly anything in any build. **Pinch** at phone size rendered 0 in every build, so `wk.mjs`'s pinch apparently doesn't change label sizes from that view, and it tells us nothing there.

## Firefox: GPU or software

`wk.mjs` in headed Firefox, 2 rounds each of spin and ring changes. I saw each result once, so these are provisional. The check counts cache misses, not time.

| size | main | branch | P3 10% | P3 15% | P3 20% |
|---|---|---|---|---|---|
| phone, spin | software | GPU | GPU | GPU | GPU |
| phone, ring changes | software | GPU | GPU | GPU | GPU |
| desktop, spin | software | GPU | GPU | GPU | GPU |
| desktop, ring changes | software | GPU | GPU | GPU | GPU |

At every step size, P3 keeps Firefox on the GPU, like the branch. Frame times from these runs are in `.bench/ff-gpu.txt`. They're unreliable because other benchmarks were running, so don't read anything into them.

## How labels look at rest

The screenshots are headless, of `/`, `/angry/aggressive/hostile`, and `/body`, at phone 3x, desktop 2x, and 800×600 at 1x, in Chromium, WebKit, and Firefox. Every build's full wheel is in `.bench/shots/<engine>-<size>-<view>-<build>.png`, and `-SHEET.png` puts crops of all five builds side by side. Pixel diff counts are in `.bench/shots.txt`.

Side-by-sides at 1x, magnified 3x (left to right: main, branch, P3 10%, P3 15%, P3 20%):

- `.bench/crop-{chromium,webkit,firefox}-small-outer-open.png`: outer labels next to the opened word
- `.bench/crop-{chromium,webkit,firefox}-small-body.png`: the body wheel's smallest labels, about 5 px
- `.bench/crop-ch-small-wheel-z6.png`: the whole wheel's outer ring, magnified 6x (main and the three P3 steps)

My read:

- **At normal size,** I can't tell any P3 step from main at 1x, 2x, or 3x, in any engine. Text weight, size, and position look the same.
- **Magnified,** P3's glyphs on the tiniest labels (the body wheel at 1x) are a touch fuzzier, most visibly in Firefox. I see no consistent difference between 10%, 15%, and 20%. On the 1x outer ring, "Violated", "Respected", and "Courageous" look the same at every step.
- **Pixel counts:** P3 differs from main in 1–10% of pixels by more than 8 levels, against 0.3–5% for the branch, which is mostly its new cell fills. Each label is rendered at a slightly larger size and scaled down, so glyph hinting and positions shift by a fraction of a pixel. That's a sub-pixel difference, which I haven't chased, as asked.

So **all three steps look the same as main to me.** I'd pick 15%: it cuts as many renders as 20% and scales labels down less.

## What P3 would need to become real

1. **Something for the first-frame burst.** P3 removes about half the phone renders on a ring change, but not the 60–80 renders in the change's first frames, which are probably what the slowest frame comes from on WebKit. It would need pairing with P1 (drawn from the canvas first, turned into an ImageBitmap 2 frames later), with spreading the new labels over several frames, or with rendering the next ring's labels at rest.
2. **A byte cap that fits 3x.** 16 MB holds about 130 labels at 3x, and rendering a step up makes each label bigger. Either raise the cap, perhaps scaled by DPR², and weigh it against iOS memory limits, or cap by count on phones.
3. **A decision on the step,** probably 15%, with the font sizes rounded to tidier numbers. Right now the font strings come out like `14.2317…px`.
4. **Spec and tests.** The v1.1 spec (`docs/superpowers/specs/2026-11-07-feelings-wheel-v1.1-design.md`, line 241) keys the cache on 0.5 px steps, and two tests in `tests/unit/sprites.test.ts` assert that ("px rounds to 0.5" and "a reused pooled canvas is cleared before drawing"). Both fail with P3 on.
5. **Real devices and a Chromatic run.** The shifts are a fraction of a pixel, but they touch every label, so they'll show up as changes in every screenshot.
6. **Timing.** Every frame time in this exploration came while other sessions were benchmarking. P3 needs timing on an idle machine, at least WebKit ring changes at phone size against main and the branch.

## Ready-to-run benchmarks

The builds are in `/Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-p3-coarse-sizes-de0771/dist-bench/`:

| build | what it is |
|---|---|
| `p3-10`, `p3-15`, `p3-20` | P3 at that step (for timing) |
| `p3-10-count`, `p3-15-count`, `p3-20-count`, `main-count`, `fix-count` | the same with the `__renders` and `__draws` counters, for `count.mjs` |
| `p3-15-mb16-count`, `p3-15-mb64-count`, `fix-mb64-count` | eviction counter, with a 16 MB or 64 MB cap |
| `main`, `fix` | symlinks to the reference builds in `ff-canvas-perf/dist-bench/` |

To time one variant (from the worktree):

```bash
cd /Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-p3-coarse-sizes-de0771
```

```bash
node scripts/firefox-gpu-bench/serve.mjs dist-bench/p3-15 4712 &
```

```bash
ENGINE=webkit VW=390 VH=844 DPR=3 node /Users/lucas/dev/feels-on-wheels/.bench/explore/wk.mjs http://localhost:4712 p3-15 inout 6
```

Change `ENGINE` (`webkit`, `firefox`, or `chromium`), the mode (`spin`, `inout`, or `pinch`), and the size (`VW=1440 VH=900 DPR=2` for desktop).

To time the whole grid (5 builds × 3 engines × 3 modes × 2 sizes, about 45 minutes; it serves on ports 4710–4714, with the builds side by side for each engine and mode):

```bash
/Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-p3-coarse-sizes-de0771/.bench/run.sh "main fix p3-10 p3-15 p3-20" "webkit firefox chromium" "inout spin pinch" "phone desktop" 6
```

To count labels rendered (`.bench/count.mjs` is a copy of the shared one that takes the base URL):

```bash
node scripts/firefox-gpu-bench/serve.mjs dist-bench/p3-15-count 4723 &
```

```bash
VW=390 VH=844 DPR=3 node .bench/count.mjs http://localhost:4723
```
