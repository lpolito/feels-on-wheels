# Feelings Wheel v1.1: Design

Date: 2026-11-07
Status: approved in conversation, awaiting written-spec review
Builds on: `docs/superpowers/specs/2026-11-06-feelings-wheel-v1-design.md` (v1). Everything in v1 still holds unless this document replaces it.

## 1. Why v1.1

Using v1 surfaced problems that come from one design choice: **selection and zoom were independent.** Zooming picked whatever word sat at 3 o'clock, so it selected things you never pointed at:
- pinching or ctrl-scrolling in selected the word at 3 o'clock, not your selection or the word under your fingers;
- zooming out landed on a "random" parent, and zooming back in on a "random" child;
- deselecting after a double-tap zoom left you zoomed in.

Other problems:
- the selected cell didn't stand out from the rest of its path;
- the arrow keys only worked after Tab;
- the panel jumped between a floating card and a full-height column, and flipped sides;
- the path showed as large pills with no sense of nesting;
- labels mixed black and white text;
- Firefox may lag.

v1.1 replaces the interaction model with two explicit states, **selected** and **opened**, redesigns the card, and fixes the rest.

### Out of scope

- **Wording review.** Lucas's review of definitions and sensations (`docs/content-review.md`) moves to a later step, before the app goes public. It no longer gates v1.1.
- **v2 and later features** (strength, sensations wheel, emoji wheel, other languages).

## 2. Decisions

| Topic | Decision |
|---|---|
| Interaction | Two states: **selected** (picked, nothing moves) and **opened** (zoomed in, full entry, in the URL). §3 |
| Zoom gestures | Always resolve to a specific word: the word under your fingers, the selection's parent or child, or the whole wheel. Never "whatever is at 3 o'clock". §3.4 |
| Phone start | Every visit to the base URL spins in, zoomed on the core ring, and lands on a random core feeling, **selected**. The URL is untouched. §3.2 |
| Text colour | One colour: white text on deep colours in both themes. Happy keeps its orange. §4.1 |
| Selected look | Outline ring plus a small chevron hint. No fading, and the wheel doesn't move. §4.2 |
| Opened look | Zoomed, with the cell lifted and outlined, everything off its path faded, and a brief pulse on open. §4.2 |
| Card | A floating accordion sized to its content. Breadcrumb line above the title, list rows instead of pills. A separate floating hint shows above it. §5 |
| Layout | The card never moves the wheel: desktop reserves a right column, and phones keep the opened word above the card's maximum height. §5.3 |
| Firefox | Measure first with a Firefox frame-time test; if it fails, render labels from a cached sprite instead of `fillText` each frame. §7 |

## 3. Interaction

### 3.1 States

```
State = {
  selected: number | null       // segment index
  opened:   boolean             // true only when selected !== null
  view:     { mode: 'wheel' } | { mode: 'ring', ring: number }
  hinted:   boolean             // the floating hint is still showing
}
```

**Invariants:**
- If `opened` is true, then `selected` is set and `view` is `ring(selected.ring)`.
- `selected` with `opened: false` and a `ring` view happens in one case only: a phone's start (and spinning from there, §3.2). Every other selected-but-not-opened state is on the whole wheel.
- There is no separate "keyboard focus" segment. Keyboard focus moves the selection, so the v1 `focused` field and the `interacted` flag go away.

### 3.2 Opening the app

- **Large screen** (when `shouldStartZoomed` is false), at the base URL: the whole wheel, nothing selected. The hint reads "How are you feeling? Tap a feeling."
- **Phone** (when `shouldStartZoomed` is true), at the base URL, on **every visit**:
  - The wheel draws as the whole wheel, then zooms to the core ring while rotating about 1.5 segments (about 700 ms). It lands on a **uniformly random core feeling**, which is **selected**, not opened.
  - The hint reads "Spin to explore."
  - The URL stays the base URL.
  - With reduced motion there is no spin; it opens directly in that state.
  - That starting state is remembered, so Back to the base URL restores the same feeling.
- **A link to a feeling** (`#/core/<path>`) opens that feeling, **opened**. There's no spin.
- `fw.seenIntro` is no longer read or written.

### 3.3 Walkthrough

**Selecting**
- Tap a word: it becomes **selected**. Tapping another word moves the selection.
- On a phone's starting zoom, spinning moves the selection to the word that settles at 3 o'clock. It stays selected, not opened.
- Spinning the whole wheel (desktop) only rotates it; the selection doesn't change.

**Opening.** Any of these opens the selected word:
- tap it again
- tap the card's header
- press Enter, Space or `+`

Two shortcuts open a word directly from any state:
- double-tap it
- pinch in on it (§3.4)

**While opened** (each of these opens the new word):
- **Another word:** tap it. The wheel moves to that word's ring and centres it.
- **Spin:** the word that settles at 3 o'clock opens.
- **Up a tier:** a small pinch out, a swipe toward the centre, `−` or Left, or a tap on a breadcrumb.
- **Down a tier:** a swipe outward, Right, a tap on a "Narrow it down" row, or a pinch in on the opened word. Swiping or Right opens the child at 3 o'clock.
- **Core words at the top tier:** "up a tier" from a core word closes the feeling (see Closing).

**Closing** (opened → selected). Any of these:
- a big pinch out
- Escape
- tapping the card header
- the "Whole wheel" button
- Back

The wheel animates back to the whole wheel **at the rotation it had before you opened**. The word stays **selected**, and the URL returns to the base.

**Clearing** (selected → nothing). Either of these:
- tap outside the wheel
- Escape while only selected

There's no ✕ button, which keeps the card a plain accordion.

The card collapses away, leaving only the hint.

**Tapping a moving wheel** stops it and selects (or, while opened, opens) the word under your finger. It never clears or toggles off.

### 3.4 Pinch and zoom gestures

All pinch-style inputs resolve when they end: touch pinch, trackpad pinch (ctrl+wheel), and Safari `gesture*` events.

| Starting state | Pinch in (scale > 1.15 when released) | Pinch out a little (0.6–0.87) | Pinch out a lot (< 0.6) |
|---|---|---|---|
| Nothing / selected, whole wheel | Open the word under the pinch midpoint (nothing happens if the midpoint isn't over a word) | Snap back | Snap back |
| Selected, phone start (ring view) | Open the word under the midpoint | Whole wheel, selection kept | Whole wheel, selection kept |
| Opened | Open the word under the midpoint; if that's the opened word, open its child at 3 o'clock (a leaf stays put) | Open the parent (a core word closes instead) | Close |

During the gesture the camera follows your fingers freely. On release it springs to the resolved state's camera. If nothing changed, it springs back.

**Constants:** `PINCH_IN = 1.15`, `PINCH_STEP_OUT = 0.87`, `PINCH_CLOSE = 0.6`, all relative to the scale when the gesture started.

### 3.5 Keyboard

Keys work once the wheel has been clicked, and whenever focus is on the page body or the wheel. They're ignored in inputs, selects and the card's buttons, except Escape, which works everywhere.

| Key | Nothing selected | Selected | Opened |
|---|---|---|---|
| Up / Down | Select the first core word | Select the previous/next word in the same ring | Open the previous/next word in the ring (spins) |
| Right | — | Select the first child | Open the child at 3 o'clock |
| Left | — | Select the parent | Open the parent (a core word closes) |
| Enter / Space / `+` | Select the first core word | Open | — |
| `−` | — | — | Same as Left |
| Escape | — | Clear | Close |

Clicking or tapping the canvas with a mouse moves DOM focus into the accessible tree (`focus({ preventScroll: true })`), so the arrows work immediately. Touch taps don't move focus.

### 3.6 URL and history

- Only **opened** states are in the URL: `#/core/<path>`. Selected and nothing-selected states use the base URL.
- **Opening** a word pushes an entry: a tap, a key, a tier step, a breadcrumb, a "Narrow it down" row or a pinch.
  - Exception: a **spin settling while opened** *replaces* the current entry, so Back closes the feeling instead of stepping back through every word you spun past.
- **Closing** pushes the base URL, so Back reopens what you closed.
- The v1 history writer's 250 ms coalescing and its error guard stay.
- Popstate restores:
  - an opened hash → that word, opened;
  - the base URL → the remembered start state (§3.2) if this page load began there, otherwise the whole wheel with the last selection kept;
  - an unknown hash → the base state.

## 4. Visual

### 4.1 Palette: white text on deep colours

- **Lit fills:** every lit fill, in every ring and theme, carries white text at ≥4.5:1.
  - Each base hue is darkened just enough for 4.8:1 (the `fit` function from the mockups).
  - Then per ring: core −0.07, middle −0.035, outer 0, in OKLab lightness.
  - Happy keeps its orange base `#D9730D`, which comes out at about `#b85500`.
- **Faded fills:** `mix(lit, grey, 0.72)`, with grey `#8d8a93` in light mode and `#3a383e` in dark. Labels are `mix(white, faded, 0.2)` and must reach ≥3:1.
- **More contrast:** faded labels are plain white (≥4.5:1). Gaps widen to 2.5 px, as in v1.
- **Forced colours:** fills are `Canvas` and labels `CanvasText`. The selected/opened outline uses `Highlight`.
- The black/white picking (`bestText`) is removed. `FillTable.label()` returns white (or the faded mix) for every hue.
- The contrast tests assert all of this for every hue × ring × theme.

### 4.2 Selection treatments (drawn on the canvas)

- **Selected:**
  - An outline ring: 4 px ink (`#1c1b1f` in light, `#ffffff` in dark), with a 2 px gap-coloured line inside it.
  - A **small chevron hint** pointing outward:
    - inside the cell's outer end in white when the cell's outer arc is ≥ 22 px;
    - otherwise just outside its outer edge in ink.
  - The chevron is decoration only; tapping anywhere on the cell opens it. *The chevron's look is provisional and may be restyled later.*
- **Opened:**
  - The cell is drawn **lifted**: it extends 10 px past its ring's inner and outer edges and about 2 px past each side, has a soft drop shadow (one `shadowBlur` for this cell only), and a 1.15× larger, bolder label.
  - It carries the outline ring.
  - Everything off its path is faded.
- **Pulse:** when a word opens, the lifted cell scales from 0.96 to 1 over 180 ms. Skipped with reduced motion.
- **Fading:** off-path cells fade only while a word is opened. With nothing opened, every cell is lit. The cross-fade stays 150 ms.

## 5. The card

### 5.1 Pieces

- **Hint:** a small floating pill in the same style as the card (surface colour, radius, shadow), shown **above** the card.
  - Its text is `t('hintSpin')` "Spin to explore." on a phone's start, otherwise `t('hintChoose')` "How are you feeling? Tap a feeling."
  - It disappears on the first spin, selection or keypress (`hinted: false`) and doesn't return during that page load.
- **Accordion card** (`<fw-card>`, replacing `<fw-panel>` and `<fw-path>`):
  - **Header:** a single full-width `<button aria-expanded>` holding the hue dot, the feeling's name, and a chevron that rotates ▸ → ▾ (rotation skipped with reduced motion). Tapping it opens or closes the feeling.
  - **Body** (opened only):
    - **Breadcrumb line:** the hue dot, then each ancestor as a link separated by "›", e.g. "● Angry › Aggressive ›".
    - Definition.
    - "You might notice": a list of body sensations.
    - "Narrow it down": two-column list rows, each a link with a trailing "›".
    - "Close to": inline links (outer words only).
  - **States:** no card with nothing selected (only the hint); the header only when selected; header and body when opened.
- **Pills are gone everywhere.** All links are real `<button>`s styled as text links.
- **Toolbar:** the zoom toggle becomes a **"Whole wheel"** button (`t('wholeWheel')`), shown only while a word is opened; it closes the word. There's no `aria-pressed`. The theme select stays.

### 5.2 Focus management (carried over from v1's review fixes)

- If the card rebuilds while a button inside it had focus, focus moves to the header button. A card that disappears moves focus to the tree.
- A model for the same feeling in the same state doesn't rebuild the card.

### 5.3 Layout

- **Desktop (wide):**
  - The wheel's stage is the window minus a **reserved right column** of `min(24rem, 34vw)`. The column is never resized by the card, so the wheel never shifts.
  - The hint and card float in that column, vertically centred, sized to their content, and scroll inside at `max-height: calc(100% - 4rem)`.
  - The opened-ring anchor is 40% of the *stage* width, now excluding the column.
- **Phone (narrow or portrait):**
  - The stage is the full screen.
  - The hint and card float at the bottom with a 12 px margin and safe-area insets, sized to their content, capped at **45% of the viewport height** (`45dvh`), scrolling inside past that.
  - The camera's vertical anchor is the centre of the area above that cap (27.5% of the height). The opened word therefore never sits under the card, and the card's size changes never move the wheel.
- **Removed:** the v1 flip of the card to the other side (`data-panel-side`).
- **Theme colour:** `<meta name="theme-color">` follows the resolved theme, including the manual override.

## 6. Accessibility

- **Tree:**
  - `aria-selected="true"` marks the selected word.
  - `aria-current="true"` marks the opened word, in addition to `aria-selected`.
  - The roving tabindex follows the selection, or the first core word when nothing is selected.
- **Announcements:**
  - Selecting: "Hostile. In Angry, Aggressive." (as in v1).
  - Opening: `t('opened', …)` → "Hostile, opened. In Angry, Aggressive."
  - Closing: `t('closed', …)` → "Hostile, closed."
- **Visible keyboard focus:** keyboard focus *is* the selection, so the outline ring is the focus indicator, with ≥3:1 contrast against every fill by construction (ink or white on a deep fill).
- The card header is a real button with `aria-expanded`, and the hint is plain text in an `aria-live="polite"` region (it's announced once).
- axe-core reports zero violations on the whole wheel, the selected state and the opened state.

## 7. Performance and Firefox

- **New `tests/perf/firefox.spec.ts`** (Firefox project): the same scripted spin as the Chromium perf test, measuring frame deltas with a `requestAnimationFrame` probe.
  - **Gate:** p95 frame delta ≤ 20 ms on the whole wheel and while opened.
  - Heap can't be measured in Firefox through Playwright; the 10-minute manual Firefox check stays a human step.
- **If the gate fails, or Chromium draw p95 rises above 4 ms:** add a **label sprite cache**. Each label's text is rendered once per (label, px, colour) into an `OffscreenCanvas` (or a `<canvas>` fallback), and frames draw it with `drawImage`. The cache is keyed on quantised px (0.5 px steps) and limited to 600 entries (LRU), so pinching can't grow it without bound.
- **The lifted cell's shadow** is drawn once per frame, for that single cell only.
- **During pinch,** label fitting reuses the last fit while the box size is within ±1 px. This fixes v1's per-frame allocation while pinching.

## 8. Leftovers from the v1 review included here

- **Resizing mid-fling:** `setViewport` keeps the fling's *target* segment, not the pre-fling selection. On the whole wheel it re-snaps if a snap ring applies.
- **Theme colour meta** follows the override (§5.3).
- **Forced colours** use `Highlight` for the selected and opened outline (§4.1).
- **Resolved by the redesign:** the zoom button announcing "Zoom out, pressed", the wide ring-mode anchor, and the hash/ring mismatch. In v1.1 the URL holds only a path and is always consistent.
- **Not included:** the "peeking" bottom sheet. The floating card replaces it.

## 9. Code impact

| Area | Change |
|---|---|
| `state/store.ts` | New `State` (§3.1) and actions: `select`, `open`, `close`, `clear`, `step`, `toParent`, `toChild`, `settled`, `restore`, `dismissHint`. `reduce` keeps identity for no-ops and enforces the §3.1 invariants. |
| `state/url.ts`, `state/history.ts` | The URL holds opened states only; push/replace rules from §3.6; the remembered start state. |
| `controller.ts` | Pinch resolution (§3.4), tap/double-tap and swipe rules, a remembered whole-wheel rotation for closing, and the phone-start spin with random selection. |
| `camera.ts` | The phone anchor uses the area above the card's maximum height (§5.3). |
| `render/colors.ts` | Palette B (§4.1); `bestText` removed. |
| `render/wheel.ts` | Selected outline + chevron, opened lift + shadow + pulse, fading only when opened; optional label sprite cache (§7). |
| `ui/card.ts` (new), `ui/hint.ts` (new) | Replace `ui/panel.ts` (`<fw-panel>`, `<fw-path>`). |
| `ui/toolbar.ts` | "Whole wheel" button. |
| `a11y/tree.ts`, `input/keyboard.ts` | `aria-current`; the key table from §3.5; global key routing; focus on mouse click. |
| `main.ts` | Wiring; the theme-colour meta; removes `data-panel-side` and `fw.seenIntro`. |
| `locales/en.json` | Adds `hintSpin`, `hintChoose`, `wholeWheel`, `opened`, `closed`. Drops `prompt`, `zoomIn`, `zoomOut`, `close`. |
| Tests | Store, controller and panel unit tests are rewritten for the new model. E2E tests are rewritten around select/open/close/clear. New Firefox perf spec. |

## 10. Acceptance criteria

- [ ] Every action in §3.3–§3.5 behaves as written. In particular, no zoom gesture ever selects or opens anything other than the word under the fingers, the selection's parent/child, or nothing.
- [ ] Closing returns to the whole wheel at the pre-open rotation, with the word still selected.
- [ ] A phone at the base URL spins to a random core feeling, selected, every visit, with the URL unchanged. Reduced motion skips the spin. Back to the base restores the same feeling.
- [ ] Only opened states change the URL. A spin while opened replaces the history entry; other opens push one.
- [ ] Every label in every ring, theme and state is white (or its faded mix) and meets the §4.1 contrast floors.
- [ ] The selected state shows the outline and chevron with nothing faded. The opened state shows the lifted, outlined cell with everything off its path faded, and a pulse on open.
- [ ] The card is an accordion that rebuilds without losing focus. The hint floats above it and disappears for good on the first interaction.
- [ ] Neither the card nor the hint ever moves the wheel on any screen size.
- [ ] The arrow keys work after a single click on the wheel, with no Tab needed.
- [ ] axe-core reports zero violations in all three states.
- [ ] The Firefox perf gate passes, with the sprite cache added if needed. Chromium perf and the size budgets from v1 still pass.
