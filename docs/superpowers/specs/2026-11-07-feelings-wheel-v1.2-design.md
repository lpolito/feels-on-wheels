# Feelings Wheel v1.2: Design

Date: 2026-11-07
Status: approved in conversation, awaiting written-spec review
Builds on: `docs/superpowers/specs/2026-11-07-feelings-wheel-v1.1-design.md` (v1.1), which builds on the v1 spec. Everything in v1.1 still holds unless this document replaces it.

## 1. Why v1.2

Using v1.1 (mostly in Firefox) turned up four bugs and a set of layout, card and motion changes. The full list of feedback is in `docs/ROADMAP.md` under v1.2.

**Bugs:**
- the arrow keys stop working after a card link;
- the white inner outline line is misaligned on the inner two rings;
- the theme picker jumps back to its old choice;
- closing a word spins the wheel back to where it was before opening.

**Changes:**
- **Desktop:** too much empty space between the wheel and the card.
- **Phones:**
  - start without a selection, on a half-wheel;
  - centre the opened word vertically.
- **Card:**
  - breadcrumbs move above the name;
  - the card opens and closes with an animation;
  - the dot pulses;
  - links get hover colours;
  - a clearer button name.
- **Motion:** slower spins and less eager pinches.

### Out of scope

- The wording review (`docs/content-review.md`), as in v1.1.
- v2 and later features.

## 2. Decisions

| Topic | Decision |
|---|---|
| Release | One release; the plan fixes the four bugs first. |
| Starting state | Nothing selected, everywhere. The phone's random start word is removed. §3.1 |
| Starting message | One message everywhere: "How are you feeling? Tap a feeling or spin to explore." §3.1 |
| Phone whole-wheel view | A half-wheel: the wheel's centre on the left edge. It's where phones start and where zooming out lands. §3.2 |
| Closing | Stays at the current rotation. §3.3 |
| Pinch thresholds | Open > 1.35×, step out < 0.8×, close < 0.55×. §3.4 |
| Motion | Slower spring: about 90% settled in 270 ms (was 150 ms). §3.5 |
| Desktop opened layout | Option A from the mockups: the wheel's outer edge sits against the card's column. §4.1 |
| Phone opened layout | Word at 50% height; the card's height is capped so it ends below the word. §4.2 |
| Card header | Option B from the mockups: one dot that stays beside the name, breadcrumbs above the name. §5.1 |
| Card motion | Animated open and close, pulsing dot, hover colours. §5.2 |

## 3. Interaction

### 3.1 Starting state

- **Every screen** starts at the base URL with nothing selected, in the whole-wheel view, with the hint showing.
- The hint text is `t('hint')`: "How are you feeling? Tap a feeling or spin to explore."
- A link to a feeling (`#/core/<path>`) still opens that feeling, as in v1.1.
- **Removed from v1.1:**
  - `startState` and the phone's random start word;
  - the "remembered start state";
  - the separate phone hint (`hintSpin`) and desktop hint (`hintChoose`).
- **Back to the base URL** restores the whole-wheel view with the last selection kept, on every screen (v1.1's desktop rule).

### 3.2 The phone's half-wheel

**When it applies.** The whole-wheel view is drawn as a half-wheel when the full wheel's outer labels would be under 12 CSS px. This is v1.1's `shouldStartZoomed` test. In practice that means phones; tablets keep the full wheel.

**Camera:**
- The wheel's centre is on the stage's left edge (plus the left safe-area inset), halfway down.
- The scale makes the outer edge reach 95% of the stage width.
- The resting rotation centres Fearful at 3 o'clock. Any later spin keeps its rotation.

**Gestures (the whole-wheel rules from v1.1, nothing new):**
- dragging and scrolling spin it freely, with no snapping and no selection;
- tapping selects (outlined, nothing moves);
- tapping again, double-tapping or pinching in on a word opens it;
- tapping outside clears.

**Coming back.** Closing ("Zoom out", a big pinch out, Escape, the card header, Back) lands on the half-wheel at the current rotation.

**Intro:**
- **When:** every phone visit to the base URL, unless reduced motion is on.
- **What:** the camera jumps to the half-wheel turned back by 1.5 median core widths, then springs to the resting rotation. It only spins; it doesn't zoom. It takes about one second.
- **No selection:** it never dispatches anything.

**Turning a phone sideways.** A phone turned to landscape on the half-wheel switches to the full wheel at the same rotation. Turning it back does the reverse.

### 3.3 Closing keeps the rotation

- Closing animates to the whole-wheel camera (full or half) at the camera's **current** rotation. The word you closed stays at 3 o'clock.
- v1.1's `savedRotation` (return to the pre-open rotation) is removed. With it goes the review issue where a quick close, reopen and close missed the pre-open rotation.

### 3.4 Pinch thresholds

`PINCH_IN = 1.35`, `PINCH_STEP_OUT = 0.8`, `PINCH_CLOSE = 0.55`, each relative to the scale when the gesture started. Every other rule in v1.1 §3.4 stands.

### 3.5 Motion

- The camera spring's `OMEGA` goes from 24 to 14. A spin, settle or zoom is then about 90% done in 270 ms instead of 150 ms. Flings keep their throw distance (`FLING_TAU`).
- Reduced motion still skips every animation.

### 3.6 Keyboard

v1.1 §3.5 stands, with two changes.

**`−` while selected does nothing.** It now matches the key table:
- add `{ type: 'stepOut' }`: when opened it behaves like `toParent`; otherwise it does nothing;
- `keyToAction('-')` returns `stepOut`;
- Left keeps `toParent`.

**Keys from the card and the toolbar** (fixes the "keys stop working after a card link" bug):
- When focus is on a button inside the card or the toolbar, the arrows, `+`, `=`, `−` and Escape go to the wheel.
- Enter and Space keep the button's own action.
- Inputs, selects (the theme picker) and textareas keep all their keys, except Escape, which works everywhere.
- After a card link, focus moves to the card's header (v1.1 §5.2), and the arrows work from there.

## 4. Layout

### 4.1 Desktop and landscape (the stage isn't portrait)

**Column:**
- The reserved right column is `--column: min(30rem, 40vw)`.
- The card is `min(27rem, var(--column) - 3rem)` wide.
- The stage is the window minus the column. The card never resizes or moves the stage.

**Whole wheel:** centred in the stage, as in v1.1.

**Opened word:**
- The camera uses the v1.1 ring zoom (opened words about 4.5rem tall).
- It turns the word to 3 o'clock and centres it vertically (`cy = 0.5 × stage height`).
- It places the wheel's outer edge on the stage's right edge: `cx = stageWidth − R·scale`.
- **Safeguard:** the opened cell, including its 10 px lift, never starts less than 1rem from the stage's left edge. If it would, `cx` moves right and the outer rings go under the column.
- This replaces v1.1's "opened ring's middle at 40% of the stage".

**Hint and card:** vertically centred in the column as in v1.1, with the hint above the card.

### 4.2 Phones (portrait stage)

**Stage:** the full screen.

**Opened word:** the ring's middle stays at 50% of the width, and the word sits at 50% of the height (`anchorY = 0.5`, was 0.275).

**Card height cap:**
- `main.ts` sets `--opened-half` on `#app` to half the opened cell's on-screen height (its chord across the outer edge, plus the lift and the outline), in CSS px.
- The floating area's maximum height is `calc(50dvh − var(--opened-half) − 24px − env(safe-area-inset-bottom))`. That's a 12 px gap above the card and the 12 px margin below it. Longer content scrolls inside the card.
- With nothing opened, `--opened-half` is `0px`.

**A selected word that isn't opened:** the card shows only its header at the bottom of the screen, as now.

### 4.3 One portrait rule

- `portrait = width < 720 || height >= width`.
- This one rule drives the CSS container query and the camera options (`measure()`). This fixes the square-window mismatch.

### 4.4 Rendering fixes

**The outline's inner line** (fixes the outline bug):
- The 2 px gap-coloured line inside the outline is inset by a fixed 3 px distance from every edge.
- On each arc, the angular inset is `3 / r` for that arc's own radius, so the sides run parallel to the cell's edges on every ring.
- This applies to both the selected outline and the opened (lifted) outline.

**The chevron and the label:**
- When a selected cell's chevron sits inside it (outer arc ≥ 22 px), the label's box loses 14 px at its outer end.
- The label's centre moves 7 px inward, so the chevron and the label no longer overlap.

## 5. The card and the toolbar

### 5.1 Header (option B)

**Layout:**
- **Selected:** the dot, the name and a chevron on one row.
- **Opened:** a breadcrumb line above the name, lined up with the name's text (not the dot). Each ancestor is a link, followed by "›". Core words have no breadcrumbs.
- The dot is the only coloured circle in the card. It always sits in front of the name and never moves.

**DOM:**
```
<div class="fw-card-head">
  <nav class="fw-crumbs" aria-label=t('path')> …links… </nav>   (opened, non-core only)
  <h2 class="fw-card-heading">
    <button class="fw-card-toggle" aria-expanded> dot · name · chevron </button>
  </h2>
</div>
```
The breadcrumb links sit outside the toggle button, because a link inside a button is invalid. Clicking the name row toggles; clicking a breadcrumb opens that ancestor.

**Other card rules:**
- The body no longer has a breadcrumb line.
- All other body content and every v1.1 §5.1 rule stand.
- The class `fw-card-head` names the header container; the button is `fw-card-toggle`.

### 5.2 Motion and hover

**Opening and closing animation:**
- **When it plays:** the same word going from selected to opened, or back.
- **What moves:**
  - the breadcrumbs grow from zero height and fade in above the name;
  - the name moves down with them;
  - the chevron turns 90°;
  - the body unfolds from zero height (a `grid-template-rows: 0fr → 1fr` transition).
- **Timing:** 220 ms ease-out, with closing the reverse.
- **No rebuild:** the card keeps its elements when only `kind` changes for the same `index`, so the transition can run and focus isn't disturbed.

**Switching to another word** (a link, a spin, a step): the content swaps without the unfold. The v1.1 focus rules apply: after a rebuild with focus inside, focus moves to the header's toggle.

**Dot pulse:** while opened, the dot has a soft halo in its own colour that grows and fades on a 2.4 s loop.

**Hover and focus:**
- Breadcrumb links, "Narrow it down" rows and "Close to" links take the feeling's ink colour on hover and `:focus-visible`.
- **Ink:** the feeling's base colour, darkened (light theme) or lightened (dark theme) in OKLab lightness until it reaches ≥ 4.5:1 against `--surface`. Computed in `colors.ts` and set as `--ink` on the card.
- Rows also get a faint background on hover.

**Reduced motion:** the unfold, the chevron turn and the pulse are all off, and changes are instant.

### 5.3 Size

- **Desktop:** the card is 27rem wide (§4.1).
- **Phones:** the full width minus the 12 px margins.

### 5.4 Toolbar

**The "Zoom out" button** (`t('zoomOut')`), formerly "Whole wheel":
- It shows only while a word is opened, and it closes the word.
- After it's used, focus moves to the wheel's accessible tree (`tree.focusSelected()`), not to `<body>`.

**The theme picker** (fixes the theme bug): choosing a theme sets `toolbar.theme`, so the picker keeps showing your choice.

### 5.5 Strings

| Change | Keys |
|---|---|
| Added | `hint` ("How are you feeling? Tap a feeling or spin to explore."), `zoomOut` ("Zoom out") |
| Removed | `hintSpin`, `hintChoose`, `wholeWheel` |

## 6. Accessibility

Everything in v1.1 §6 stands.

**Additions:**
- The breadcrumb `<nav>` sits outside the toggle button (§5.1).
- Hover and focus colours keep ≥ 4.5:1 (§5.2).
- Focus moves to the tree after "Zoom out" (§5.4).

**Axe:** zero violations in all three states (nothing selected, selected, opened), in both light and dark themes.

## 7. Performance

**Label image cache:**
- Reused (pooled) images are cleared with `clearRect` before drawing.
- If a canvas can't give a 2D context, the fallback builds a `<canvas>` element.
- The cache evicts least-recently-used images once their total backing store (width × height × 4 bytes) would pass 16 MB, as well as past the 600-image limit.

**Firefox gate:**
- `tests/perf/firefox.spec.ts` adds a pinch scenario on the whole wheel: ctrl+wheel bursts zooming in and out for 6 s.
- It is held to the same gate: p95 frame delta ≤ 20 ms.

The Chromium gates and the size budgets from v1 and v1.1 still apply.

## 8. Code impact

| Area | Change |
|---|---|
| `state/store.ts` | Add a `stepOut` action. |
| `state/history.ts` | Remove `startState`. The start state is `initialState`. |
| `input/keyboard.ts` | `-` maps to `stepOut`. |
| `model/pinch.ts` | New thresholds. |
| `camera.ts` | `OMEGA = 14`; a half-wheel camera (`wheelCamera(vp, rotation, opts)` choosing full or half); a ring camera with an edge anchor for desktop and `anchorY = 0.5` on phones. |
| `controller.ts` | Remove `savedRotation`; closing keeps the current rotation; `playIntro` only spins; the half-wheel is the wheel view on phones. |
| `render/wheel.ts` | Parallel-inset outline line; room for the chevron in the label box. |
| `render/sprites.ts` | Clear pooled images; `<canvas>` fallback; 16 MB cap. |
| `render/colors.ts` | `inkFor(hue, theme, surface)` for hover colours. |
| `ui/card.ts` | New header structure; animated selected ↔ opened without a rebuild; pulse; `--ink`. |
| `ui/toolbar.ts` | "Zoom out"; keep the theme in sync. |
| `main.ts` | Key routing (§3.6); `--opened-half`; one portrait rule; the toolbar's theme sync; focus after "Zoom out"; the intro on phones at the base URL; Back restores the whole wheel. |
| `styles/app.css` | Column and card width; the phone `#float` cap; header, crumbs, unfold, pulse and hover styles. |
| `data/locales/en.json` | §5.5. |
| Tests | As §9. |

## 9. Testing

**Unit:**
- the store:
  - `stepOut`
  - no phone start state
- `resolvePinch` at the new thresholds and values just either side
- the controller:
  - closing keeps the rotation
  - the half-wheel camera
  - the intro only spins and dispatches nothing
  - the desktop edge anchor and its 1rem safeguard
  - the phone at 50% height
  - the spring timing at `OMEGA = 14`
- the renderer:
  - the inner line's sides are parallel on all three rings (equal distance from the outer stroke at both ends of each side)
  - the chevron and the label don't overlap
- the sprite cache:
  - clearing
  - the fallback
  - the byte cap evicting least-recently-used images
- the card:
  - the breadcrumbs sit outside the toggle
  - selected → opened on the same index keeps the elements
  - hover ink contrast ≥ 4.5:1 for every hue and theme
- the toolbar:
  - "Zoom out" moves focus to the tree
  - the theme stays in sync

**End-to-end (all five projects):**
- the arrows work after a "Close to" link
- the theme picker keeps its choice after opening and closing
- a phone starts with no selection, on the half-wheel (the wheel's centre within 2 px of the stage's left edge), with the hint
- a phone's opened word is centred at 50% height (±2 px) and above the card's top edge
- on desktop, the opened view's wheel edge meets the column
- closing keeps the rotation
- axe in three states × two themes

**Performance:** the Chromium and Firefox gates, including the new Firefox pinch scenario, and the size budgets.

## 10. Acceptance criteria

- [ ] The four bugs from §1 are gone.
- [ ] Nothing is selected at start on any screen, and the hint reads "How are you feeling? Tap a feeling or spin to explore."
- [ ] Phones show the half-wheel at start and whenever zoomed out, with a short spin-only intro (none with reduced motion).
- [ ] Closing keeps the current rotation.
- [ ] Pinches open past 1.35×, step out below 0.8× and close below 0.55×.
- [ ] Spins and zooms use the slower spring.
- [ ] Desktop: an opened word's wheel edge meets the 27rem card's column; the card never moves the wheel.
- [ ] Phones: an opened word is centred vertically, and the card never covers it.
- [ ] The card header, its animation, the pulse, the hover colours and "Zoom out" behave as in §5.
- [ ] Unit, end-to-end (five projects), axe, performance and size checks all pass.
