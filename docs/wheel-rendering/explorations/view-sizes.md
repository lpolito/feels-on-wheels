> Copied 2026-11-24 from the exploration's report. Its code, scripts and raw counts are on branch `claude/explore-view-size-labels-80d8e9` (`.bench/`). Absolute paths below point at worktrees on Lucas's Mac that may be gone. Frame times in it were taken under load; use the quiet timings in [findings.md](../findings.md#timing-one-at-a-time-on-a-quiet-machine).

# Label caches built on rest views: five options

Branch `claude/explore-view-size-labels-80d8e9`, commit `87e7593` (prototype, bench builds only; `ff-canvas-perf` untouched). Every variant is in `src/render/sprites.ts`, `src/render/wheel.ts` and `src/main.ts`, chosen by `globalThis.__lv` or `VITE_LV` at build time.

**Frame times are left out of this report.** Four sessions ran headed benchmarks on the same Mac at once, so the ranking rests only on things load doesn't change: labels rendered and bitmaps created per frame, memory, Firefox's GPU state, and screenshots. Ready-to-run timing commands are at the end.

## Ranking

1. **1+2, with a fresh fit at rest (`v12f`): push this one.** In all three setups it rendered 0 labels in frames during ring changes, pinches and spins. All rendering moved to idle time after the wheel settles: about 115 labels after one step and 47 after the next on a phone, in slices of 6 ms or less. The cache peaks at 24 MB at 3x (21 MB at 2x). At rest it is pixel-identical to the branch. Firefox stayed on the GPU.
2. **1+2+3, sheets (`v123f`).** Same render counts as `v12f`, with 3–7 bitmaps per step instead of 47–115. But each view's sheet is drawn in one idle task rather than in slices. A sheet also stays in memory until every label on it is evicted, and the code is more complex. Worth it only if quiet timing shows WebKit's cost is the number of bitmaps rather than their pixels.
3. **1 alone (`v1`).** Cuts the renders per step by 4 to 10 times, but moves them all into the frame where the camera settles: 121–127 labels in one frame on a phone, against 64–85 today. It needs 2.
4. **5, byte budget × dpr² (`v5`).** It changes nothing while moving (still 60–127 labels per frame) and only helps revisits: going out to the core view a second time renders 239 labels instead of 652. The cache grows to 138–142 MB at 3x. On its own it isn't worth it; 1+2 only needs a modest raise.
5. **4, mip chain (`v4`).** Fails "exactly as today at rest": a label scaled down from 24 px loses the extra letter spacing small text gets, so it is visibly tighter (screenshots below). At 3x it also overflows the 16 MB cache, because each level is up to 2× wider and 2× taller than needed: 6,710 renders in a 10-step spin of the whole wheel, and 3,743 in a 2.5 s pinch.

## Labels rendered in frames (load-independent)

From `.bench/count3.mjs` (headless). It works like `count.mjs`, but counts idle prewarm renders separately. Each cell is renders over the whole action, with the most in any one frame in brackets. The ring changes start at `/angry/aggressive/hostile`. "Out again" repeats the first change to show what the cache keeps.

**Chromium, 390×844 @3x**

| variant | out to core | in to middle | out again | pinch out + back | pinch wobble | spin | idle renders | cache max |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| branch (today) | 695 (66) | 344 (79) | 652 (66) | 554 (63) | 1836 (127) | 0 (0) | 0 | 16 MB |
| 1 rest sizes | 167 (127) | 36 (18) | 63 (63) | 164 (126) | 2 (2) | 0 (0) | 0 | 16 MB |
| 1+2 prewarm | 23 (23) | 0 (0) | 0 (0) | 0 (0) | 36 (36) | 0 (0) | 310 | 27.3 MB |
| 1+2, fresh fit at rest | 0 (0) | 0 (0) | 0 (0) | 0 (0) | 0 (0) | 0 (0) | 310 | 24 MB |
| 1+2+3 sheets | 0 (0) | 0 (0) | 0 (0) | 0 (0) | 0 (0) | 0 (0) | 310 | 24 MB |
| 4 mip chain | 103 (63) | 215 (194) | 63 (63) | 167 (63) | 3743 (126) | 6710 (244) | 0 | 16 MB |
| 5 budget × dpr² | 677 (64) | 221 (78) | 239 (63) | 475 (63) | 1183 (127) | 0 (0) | 0 | 137.7 MB |

**WebKit, 390×844 @3x**

| variant | out to core | in to middle | out again | pinch out + back | pinch wobble | spin | idle renders | cache max |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| branch (today) | 692 (64) | 373 (85) | 676 (64) | 539 (63) | 1711 (127) | 0 (0) | 0 | 16 MB |
| 1 rest sizes | 167 (127) | 42 (21) | 121 (121) | 163 (125) | 2 (2) | 0 (0) | 0 | 16 MB |
| 1+2 prewarm | 2 (2) | 0 (0) | 0 (0) | 0 (0) | 2 (2) | 0 (0) | 310 | 24.3 MB |
| 1+2, fresh fit at rest | 0 (0) | 0 (0) | 0 (0) | 0 (0) | 0 (0) | 0 (0) | 310 | 24 MB |
| 1+2+3 sheets | 0 (0) | 0 (0) | 0 (0) | 0 (0) | 0 (0) | 0 (0) | 310 | 24 MB |
| 4 mip chain | 104 (63) | 215 (194) | 64 (63) | 167 (63) | 3743 (126) | 4270 (244) | 0 | 16 MB |
| 5 budget × dpr² | 714 (64) | 207 (78) | 210 (60) | 460 (63) | 1330 (127) | 0 (0) | 0 | 141.7 MB |

**Chromium, 1440×900 @2x**

| variant | out to core | in to middle | out again | pinch out + back | pinch wobble | spin | idle renders | cache max |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| branch (today) | 332 (82) | 104 (103) | 260 (82) | 918 (182) | 1339 (127) | 0 (0) | 0 | 16 MB |
| 1 rest sizes | 168 (84) | 0 (0) | 0 (0) | 224 (123) | 0 (0) | 0 (0) | 0 | 16 MB |
| 1+2 prewarm | 0 (0) | 0 (0) | 0 (0) | 0 (0) | 0 (0) | 0 (0) | 398 | 21.3 MB |
| 1+2, fresh fit at rest | 0 (0) | 0 (0) | 0 (0) | 0 (0) | 0 (0) | 0 (0) | 398 | 21.3 MB |
| 1+2+3 sheets | 0 (0) | 0 (0) | 0 (0) | 0 (0) | 0 (0) | 0 (0) | 398 | 21.3 MB |
| 4 mip chain | 86 (64) | 0 (0) | 0 (0) | 101 (66) | 2 (2) | 0 (0) | 0 | 14.8 MB |
| 5 budget × dpr² | 332 (82) | 14 (14) | 0 (0) | 966 (124) | 1103 (127) | 0 (0) | 0 | 64 MB |

With sheets, the same idle renders make 36 bitmaps instead of 181 at load, and 3 to 6 per step. The prewarm counts assume a pause of 1.2 s after each settle (a person reading). With no pause, prewarm can't finish before the next step.

## Memory of prewarmed bitmaps

From `.bench/analyze.mjs`. For each state it measures the current view plus every view reachable next: parent, center child, other children, siblings, whole wheel, and from the whole wheel every core word.

| | current view only | with next views prewarmed | labels |
|---|---|---|---|
| phone @3x (11 states) | 4.2–7.3 MB | 12.4–23.7 MB | 181–345 |
| desktop @2x (11 states) | 2.4–7.0 MB | 7.5–17.9 MB | 196–389 |

Today's 16 MB cap is too small at 3x: prewarm would evict the view on screen. About 32 MB at 3x (16 MB × dpr²/4.5, or simply 32 MB from 2x up) holds a view and its neighbors, far below `v5`'s 144 MB. The biggest states are the core views: on a phone, a core view prewarms 11–12 next views.

## Firefox: GPU or software (provisional, one run each)

Every variant stayed on the GPU at both sizes, after ring changes and pinches: `v12f` and `v123f` in a short check of their own, and `fix`, `v1`, `v12`, `v123`, `v4` and `v5` in the matrix run. Each was seen once.

## Screenshots

From `.bench/shots2.mjs`, in `.bench/shots/`. The wheel is first moved out and back so caches hold nearby sizes. "Mid-pinch" is a ctrl-wheel zoom held open: the 150 ms timer that ends it is disabled in the bench page.

- **At rest:** `v1`, `v12`, `v123` and `v5` match the branch build. The largest channel difference is 0–3 in Chromium, WebKit and Firefox on a phone, and 0–3 in Chromium on desktop. Firefox and WebKit desktop show the same small noise (max 10–32, nothing over 64) that `fix` shows against the reference `fix` build.
- **At rest, `v4`:** 110k–207k pixels differ by more than 8, many by 255. Text is visibly tighter. Compare `crop-chromium-phone-rest-v4.png` with `crop-chromium-phone-rest-fixref.png`.
- **Mid-pinch, scaling down (pinching out):** next to today's build it is nearly indistinguishable, a touch narrower.
- **Mid-pinch, scaling up (pinching in past the view):** visibly soft and slightly wider. Compare `crop-chromium-phone-pinchIn-v12.png` with `...-fixref.png`.

## Risks of 1+2

- **Labels scaled up while moving.** This is the real one. Upscaling happens:
  - When pinching in past a view: up to 2.0× on a phone, 1.55–1.7× on desktop. This is the soft text in the screenshot.
  - In ring changes on a phone, for labels that come into view mid-move and only have the destination's smaller size: up to 1.9×.
  
  On a phone, about 20% of nearby-size draws in a ring change were upscaled, by up to 1.9×. On desktop up to 65% were, but by at most 1.07×. In a pinch up to 80% were. Fixes: when a label would be upscaled by more than about 1.15×, render it at a coarse step (P3's idea, applied only to that range). Or prewarm the pinch bounds too (each view's scale × 1.35, where a pinch opens the word).
- **Line breaks that differ between views.** None in English at the default text size: in about 13,000 pairs of a label in a view and a neighbor, no label changed its line count, and no label is two lines. With a 24 px root font, the body wheel's "Head / face" and "Throat / mouth" wrap in the whole-wheel view only. In motion they miss the cache and render once (one render per label per move), which is cheap. `drawNear` handles it, because lines are looked up per line of text.
- **A resting size that depends on the path.** This is an existing quirk the prototype exposed. `fitted()` reuses a fit while the box stays within 1 px (`FIT_TOLERANCE`), so the frame that settles can keep a size fitted mid-motion. Then a resting label's size can be 0.5 px off what a fresh load of that URL draws. Under 1+2 this caused up to 23 renders in the settle frame, because prewarm predicted the fresh size. Refitting fresh in resting frames (`v12f`) brings this to 0. The trade-off is that a label resting at a path-dependent size today would rest at its fresh-load size instead.
- **Memory on a 3x phone:** 12–24 MB of prewarmed bitmaps (see above). Core views are the worst case, because of their many children and siblings.
- **Idle time.** Prewarm needs a few tens of ms after each settle. A person who taps again within that time gets today's behavior for the labels that weren't ready yet. Safari has no `requestIdleCallback`, so the prototype uses `setTimeout` slices of 6 ms.

## What `v12f` would need to become real

- Replace the temporary switch with a real API: the renderer lists the labels of a view (`collect()` in the prototype, which duplicates the label loop and should share it), the cache gets `drawNear` and `warm`, and main prewarms on settle from `nextStates()`.
- A byte budget of about 32 MB from 2x up. Prewarmed sprites should be evicted before the sprites on screen (today they go in as the newest).
- Fresh fits in resting frames (the decision above).
- A cap on upscaling: render at a coarse step past about 1.15×, or prewarm the pinch bounds.
- Order the candidates (center child and parent first) and stop when input starts. Re-prewarm after a theme change or a `devicePixelRatio` change (both drop the bitmaps or change their keys).
- Tests: the choice of size in `drawNear`, rest-equals-fresh-load screenshots, the memory cap. Also fix the two `SpriteCache` test stubs in `tests/unit/wheel-render.test.ts`, which no longer type-check against the wider interface.
- Timing on a quiet machine (below) and on a real iPhone.

## Benchmark, ready to run

Builds (each has its variant baked in): `/Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-view-size-labels-80d8e9/dist-bench/vs-{fix,v1,v12,v12f,v123f,v4,v5}`. `vs-fix` is the branch plus the bench counters.

To time all of them one after another, with nothing else running (it serves them on ports 4600–4606 and writes `.bench/time-all.log`):

```bash
/Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-view-size-labels-80d8e9/.bench/time-all.sh 6
```

Or one at a time with the shared `wk.mjs`:

```bash
node /Users/lucas/dev/feels-on-wheels/.claude/worktrees/ff-canvas-perf/scripts/firefox-gpu-bench/serve.mjs /Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-view-size-labels-80d8e9/dist-bench/vs-v12f 4603
```

```bash
ENGINE=webkit VW=390 VH=844 DPR=3 node /Users/lucas/dev/feels-on-wheels/.bench/explore/wk.mjs http://localhost:4603 vs-v12f inout 6
```

Use `pinch` or `spin` in place of `inout`, and `VW=1440 VH=900 DPR=2` for desktop. `wk.mjs` presses the ring-change keys back to back, which gives prewarm no idle time: the worst case for 1+2. For a human pace, the copy `.bench/wk2.mjs` takes `WAIT=600` (ms between steps) and `LV=<variant>` (runtime switch on `dist-bench/vs2`).

To recount the load-independent numbers:

```bash
ENGINE=webkit VW=390 VH=844 DPR=3 node /Users/lucas/dev/feels-on-wheels/.claude/worktrees/explore-view-size-labels-80d8e9/.bench/count3.mjs http://localhost:4564
```

That command needs `dist-bench/vs2` served on port 4564.

The earlier timing matrix, run under load, is in `.bench/results.jsonl`. It is provisional and should not be used for decisions.
