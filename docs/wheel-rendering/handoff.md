# Handoff: a wheel that's fast in every browser

The prompt for the next session on [wheel rendering](../ROADMAP.md#a-wheel-thats-fast-in-every-browser). Paste everything below the line.

---

We're making the Feels on Wheels wheel fast in every browser. Desktop Firefox spun the wheel at about 20 fps. The fix on branch `ff-canvas-perf` (cells batched by color, labels kept as `ImageBitmap`s) brought it to 60 fps, but made every iPhone browser stutter when zooming or moving between rings, because WebKit copies the whole canvas each time a label becomes a bitmap. So that branch must not merge as it is. Four approaches were explored on 2026-11-24, then timed one at a time on a quiet machine. After trying the two best on my phone, I'm going with view-size label caching. WebGL looked bad without antialiasing and felt laggy with it.

Start by reading, in this order:

1. `docs/wheel-rendering/findings.md`: everything learned, the timing table, every option's verdict, the open problems, and the corrections to the draft Firefox and MDN reports.
2. `docs/superpowers/specs/2026-11-24-firefox-gpu-canvas-design.md`: the Firefox investigation (its 10-frame GPU check, and why labels must be bitmaps there). Its §2 fix is the one that broke WebKit.
3. The two contenders' reports: `docs/wheel-rendering/explorations/view-sizes.md` and `docs/wheel-rendering/explorations/webgl.md`. P2 and P3 are in the same folder, both dropped.
4. `src/render/wheel.ts`, `src/render/sprites.ts`, `src/model/pinch.ts`, `src/model/geometry.ts`, and where `src/main.ts` creates the renderer and the sprite cache.

Work on `ff-canvas-perf`, which carries the findings. The contenders' code is on their own pushed branches, listed in the findings' "Where the code is" table.

## Since the explorations (2026-11-28)

`ff-canvas-perf` was rebased onto the [opinionated wheel](../ROADMAP.md#an-opinionated-feelings-wheel) and even label sizes (#31). Its tests pass and its end-to-end tests pass in Chromium and Firefox. Three things changed under the explorations:

- **The prototype branches still show the old wheel**, 130 cells with labels sized one by one. Their counts (labels rendered per step, 12–24 MB of bitmaps) were taken there. Today's wheel has 162 words, so rebase the winner before trusting its numbers or trying it.
- **Every label in a ring now has one size** (`ringSize()` in `src/render/wheel.ts`), always on the 0.5 px grid the sprite cache is keyed on. A view has a few label sizes instead of one per label, which may make caching and prewarm cheaper, and may change the sharpening in decision 1. Look again before deciding.
- **Decision 2 now has two places.** `ringSize()` also keeps a ring's size while the wheel grows by up to 1 px (`FIT_TOLERANCE`), so a resting size can still depend on the path there, as well as in `fitted()`. A fresh fit at rest would have to redo both.

## Decisions waiting on me (Lucas)

Ask me these one at a time, the first one first.

1. **Whether to render the next views' labels ahead of time (option 2).** View-size caching (1) keeps bitmaps only at the sizes labels rest at and draws from the nearest one while moving. Option 2 adds rendering the next views' labels in idle time after the wheel stops. I notice that happening in practice, and it assumes I'll even go to the "next" view. What I notice is labels visibly changing or sharpening a moment after the wheel stops. It feels unnecessary: they didn't look bad before it, so maybe labels never need re-rendering at their exact size at rest. Work out where the sharpening comes from (prewarm not finished, or the fresh fit at rest) and what skipping it costs, before deciding. I also wondered (2026-11-24) about caching the whole wheel's labels up front at a higher resolution and drawing them scaled down.
2. **The size a label rests at.** Today a label that comes to rest can keep a size it was fitted to mid-move (`fitted()` reuses a fit within 1 px, `FIT_TOLERANCE`), half a pixel off what a fresh load of that view draws. The view-size prototype's `v12f` refits fresh once the wheel settles, which removes the last renders on settling, but those labels then no longer exactly match today. Is that fine?

I can try both contenders myself. Build them from their branches:

- view sizes: `VITE_LV=v12f npx vite build --mode test --outDir dist-bench/v12f` on `claude/explore-view-size-labels-80d8e9`;
- WebGL: `VITE_WHEEL_GL=1 VITE_GL_AA=0 npx vite build --mode test --outDir dist-bench/gl-noaa` on `claude/explore-webgl-renderer-b1f5e2`.

Then serve each with `node scripts/firefox-gpu-bench/serve.mjs <dir> <port>`, and open it on the Mac or on a phone on the same Wi-Fi (the Mac's LAN address).

## Then

- **Whichever wins, before anything else:**
  - try it on a real iPhone (me, in Safari and Firefox) and in desktop Firefox;
  - look into the Firefox phone stall on ring changes in the findings' "Open problems" (view-size builds had a 219–267 ms slowest frame there, against 86 ms on the branch).
- **For view sizes:**
  - the report's "What `v12f` would need to become real";
  - a fix for scaled-up labels while pinching in, past about 1.15×;
  - a byte budget of about 32 MB from 2× up.
- **For WebGL:**
  - the report's "What a real WebGL renderer would need";
  - edge smoothing in the shaders, since it runs without antialiasing.
- **Then a spec** (brainstorming skill), a plan, and the usual PR. Replace the branch's §2 fix rather than build on it.
- **Before filing the Firefox bug and the MDN issue,** read the corrections in the findings.

## How I want to work

- **Answer my questions first.** When I ask something, answer it before running more commands, and keep turns short. On 2026-11-24 I couldn't see answers written in the middle of a long turn.
- **One decision per message,** with only the context it needs, in plain words.
- **Never take a dismissed question as an answer,** and never pick an option for me. A go-ahead covers work, not open decisions.
- **Benchmark one at a time, with nothing else running.** Parallel sessions running Playwright skew each other's timings. Explorations in parallel are fine if they only count work (labels rendered, bitmaps made) and leave timing to one quiet pass at the end.
- **Test every option you list.** Don't quietly set some aside.
- **Don't add the Chromatic `screenshots` label or run Chromatic** unless I ask.
