# Feelings Wheel v1: Design

Date: 2026-11-06
Status: approved in conversation, awaiting written-spec review

## 1. Purpose

A fast, accessible, lightweight feelings wheel that helps a person name what they feel. It is built for Lucas's own use first (check-ins, therapy) and is meant to become a public site later, so all prose content is original from day one.

The project is built in versions. Each version is used before the next one is designed. This spec covers **v1 only** and sets up the data model and architecture so that v2 to v5 mostly add data and small UI.

### Success criteria

- Smooth pinch, zoom and spin on phones, tablets and desktops. No heat, no memory growth, no crashes in Firefox, which crashes on the reference site.
- Every interaction works by touch, mouse, trackpad and keyboard, and with a screen reader (WCAG 2.2 AA).
- Small: under 60 KB gzipped transferred for the first load (HTML, CSS, JS and English data, excluding icons).
- Installable and fully usable offline after the first visit.
- Light and dark mode, with all user-facing text in a locale file.

### Roadmap (for context; only v1 is specified here)

| Version | Scope |
|---|---|
| **v1: Core wheel** | This spec. |
| v2: Strength | Strong / medium / light toggle; words tagged by strength; the panel lists a feeling's words at each strength. |
| v3: Body sensations wheel | A second wheel whose outer ring is sensations. Same renderer, different data. |
| v4: Emoji wheel | A simplified wheel with emoji labels. |
| v5: Languages | A second language (Spanish first) and a language switcher. |

### Out of scope for v1

Strength tagging, other wheels, translations, accounts or sync, journaling or history, analytics. The app makes no network requests except for its own static files.

## 2. Key decisions

| Decision | Choice | Why |
|---|---|---|
| Rendering | One `<canvas>` for the wheel, plus a real accessible HTML tree | Constant memory and smooth zoom and rotation; the canvas bitmap is never larger than viewport × pixel density. A single SVG zoomed with CSS transforms either redraws at full size or blurs in Firefox and Safari. The prototype's 130 clipped and rotated HTML layers are the most expensive option. |
| Tooling | Vite + TypeScript, no UI framework | Typed, testable, minified output; the result is plain static files. |
| Zoom | The wheel handles its own zoom (camera) instead of browser pinch-zoom | Page code cannot set or snap native pinch-zoom, and native zoom would push the panel off screen. Browser zoom (Cmd +) still works and scales the text. |
| UI chrome | Small custom elements in the light DOM (no shadow DOM, no slots) styled by plain CSS | Simple, and theming stays in one place. |
| Content | Common feeling and sensation words are fine to use; definitions are our own writing | Words aren't ownable; prose and Lindsay Braman's specific wheel layout are. |

## 3. Data model

Content is split three ways so that later versions only add files.

### 3.1 Feelings dictionary: `src/data/feelings.json`

One entry per **word**, independent of any wheel, holding only facts that don't depend on language.

```json
{
  "hostile": { "sensations": ["clenched-jaw", "hot-face", "tight-chest"] },
  "angry":   { "sensations": ["hot-face", "clenched-fists", "racing-heart"] }
}
```

v2 adds `"strength": "strong" | "medium" | "light"` and related-word lists. v4 adds `"emoji"`. In v1 the TypeScript type declares these as optional fields so the shape is settled now.

### 3.2 Wheels: `src/data/wheels/core.json`

A tree of feeling ids, plus ring geometry as fractions of the wheel radius `R`.

```json
{
  "id": "core",
  "rings": [
    { "inner": 0.12, "outer": 0.32 },
    { "inner": 0.32, "outer": 0.62 },
    { "inner": 0.62, "outer": 1.0 }
  ],
  "children": [
    { "feeling": "angry", "hue": "angry", "children": [
      { "feeling": "aggressive", "children": [
        { "feeling": "provoked" }, { "feeling": "hostile" }
      ]}
    ]}
  ]
}
```

- Only core nodes declare `hue`; descendants inherit it.
- A node's **identity is its path** (`angry/aggressive/hostile`), not its feeling id. Some words appear in more than one place (Overwhelmed under Stressed and under Anxious; Embarrassed under Disapproving and under Hurt; Inferior under Insecure and under Depressed; Disappointed as a Disgusted middle word and as a Hurt outer word). Each position is a separate node; both point to the same dictionary entry.
- The v1 word set is the prototype's 7 core, 41 middle and 82 outer words, with two fixes: "Judgemental" becomes "Judgmental" and the stray space in " Optimistic" is removed. That is 130 positions and about 126 unique words.

### 3.3 Locale: `src/data/locales/en.json`

```json
{
  "meta": { "lang": "en", "dir": "ltr" },
  "ui": { "prompt": "How are you feeling? Spin to explore, tap to choose.", "zoomIn": "Zoom in" },
  "feelings": { "hostile": { "label": "Hostile", "definition": "…" } },
  "sensations": { "clenched-jaw": "Clenched jaw" }
}
```

`t(key)` reads from the active locale. `<html lang>` and `dir` are set from `meta`. No user-facing string lives in code.

### 3.4 Content guidelines

- **Definitions:** 1 to 2 plain sentences, about a grade 6 to 8 reading level, describing the feeling rather than diagnosing it. Original writing.
- **Sensations:** 2 to 4 per word, drawn from a shared list of roughly 40 sensation ids so wording stays consistent.
- Claude drafts all v1 content and Lucas reviews it before release.

### 3.5 Colors

- Each core feeling has a hue token (`--hue-angry`, etc.) with light and dark values.
- Ring shades are derived per ring: the core ring is the base color, and outer rings step in lightness. The exact step values are chosen in implementation and checked with a contrast check.
- Label contrast is at least 4.5:1 on lit segments and at least 3:1 on faded segments. Faded words can still be tapped, so they must stay readable.

## 4. Interaction

### 4.1 Selection (works the same on every ring)

- Tapping a segment selects it. **The lit set is the selected node, its ancestors and its descendants.** Everything else fades: the fill is mixed toward the background and the label is dimmed, within the contrast floor in §3.5.
  - Selecting Angry lights all of Angry.
  - Selecting Aggressive lights Angry, Aggressive, Provoked and Hostile.
  - Selecting Hostile lights only the path to Hostile.
- **Clearing the selection**, in both views (there is no center button and the center hole stays empty):
  - tap the selected segment again
  - tap outside the wheel
  - press the panel's ✕
  - press Escape (see §4.5 for how Escape behaves when zoomed)
- Lit and faded states cross-fade over about 150 ms; with `prefers-reduced-motion` the change is instant.

### 4.2 Camera

The camera has three values: `scale`, `rotation` (radians) and `focusRing` (a ring index, or none). The renderer draws from the camera and the selection only.

- **Overview:** `scale = 1`, which means the wheel's diameter fits the wheel area with a small margin.
- **Ring focus (zoomed):** the wheel center sits off-screen to the left. The focused ring runs top to bottom through the view, and the centered segment sits at 3 o'clock (angle 0), so its label is exactly horizontal.
  - The ring's mid-radius sits at 40% of the wheel area's width on wide layouts and 50% on portrait layouts.
  - The scale is chosen so that a typical segment in the focused ring is about 4.5 rem tall at mid-radius, limited so the ring's radial width is at most 60% of the wheel area's width.
- Overview and ring focus are the two **resting states**. While pinching, the scale moves freely between them. On release, the camera springs to whichever resting state is closer. If that is ring focus, it picks the ring nearest the view's horizontal center.
- All camera movement uses a critically damped spring that settles in about 300 ms. `requestAnimationFrame` runs **only while something is moving**, so an idle page uses no CPU.

### 4.3 Rotation and snapping

- **How you spin:**
  - **Overview:** a one-finger or mouse drag rotates the wheel by the change in the pointer's angle around the wheel center.
  - **Zoomed:** a vertical drag rotates by `Δθ = Δy / r_mid(focusRing)`, so the word under your finger moves with your finger.
  - **Mouse wheel / trackpad scroll** (without Ctrl): `deltaY` rotates the wheel; it snaps after 150 ms with no more scroll events.
  - **Up / Down keys:** move to the previous or next segment in the current ring (see §4.5).
- **Momentum and snap:** on release, velocity is estimated from the last 100 ms of pointer samples and decays with friction. The camera works out where the wheel would come to rest, then picks the segment of the snap ring nearest 3 o'clock at that resting angle. The spring settles with that segment's center at exactly angle 0.
- **Snap ring:** the focused ring when zoomed. In overview it is the selected node's ring, or no snapping when nothing is selected.
- **Zoomed picker behavior:** when zoomed and after the user's first spin or tap, **the centered segment is the selection**.
  - The selection, panel and live-region announcement update when a spin settles, not during it.
  - Tapping a segment selects it and rotates it to center.
  - Tapping a segment in a neighboring ring also makes that ring the focused ring.
  - Clearing the selection while zoomed returns to the unselected state: a focus outline on the centered word, nothing faded, the prompt in the panel. The next spin selects again.
- **Changing ring when zoomed:**
  - a horizontal swipe (> 40 px, mostly horizontal)
  - the Left / Right keys
  - tapping a word in another ring

  Moving inward goes toward the core. The camera slides radially to the new ring and snaps to the segment nearest 3 o'clock.
- **Zooming back out** keeps the current rotation. Labels follow the readability rule in §5.3 at every rotation.

### 4.4 Zoom inputs

| Input | Effect |
|---|---|
| Two-finger pinch (Pointer Events) | Free scale around the pinch midpoint, then spring to the nearest resting state |
| Trackpad pinch: `wheel` with `ctrlKey` (Chrome, Firefox, Edge); `gesturechange` (Safari) | Same as pinch |
| Double-tap / double-click on a segment (overview) | Zoom to that segment's ring with it centered and selected |
| Double-tap / double-click (zoomed) | Zoom out to overview |
| Toolbar zoom button, `+` / `-` keys | Toggle between overview and ring focus (on the selection's ring, otherwise the core ring) |

The canvas has `touch-action: none`. The page itself never scrolls; only the panel or bottom sheet scrolls.

A pointer movement under 8 px that lasts under 300 ms counts as a tap; anything else is a drag.

### 4.5 Keyboard

| Key | Action |
|---|---|
| Tab | Moves focus into the wheel (one tab stop), then on to the panel and toolbar |
| Up / Down | Previous / next segment in the same ring (rotates the wheel when zoomed) |
| Right | Move out to the first child. When zoomed, this also changes the focused ring |
| Left | Move in to the parent |
| Enter / Space | Select the focused segment (or clear it if it is already selected) |
| Escape | When zoomed: zoom out and keep the selection. In overview: clear the selection |
| `+` / `-` | Zoom in / out |

When zoomed, keyboard focus and selection are the same thing, consistent with the picker behavior.

### 4.6 First load

- **Start zoomed when the outer words wouldn't fit.** On load, if overview would draw outer-ring labels smaller than 12 CSS px, the app starts in ring focus on the **core ring**. This is based on the actual space available, not the type of device: it covers phones, small windows and split-screen tablets.
- **Opening move (first visit only, unless reduced motion is on):** draw the overview, then spend about 700 ms zooming in while rotating about 1.5 segments, and spring into place on a core word. This shows that the wheel spins. Later visits open straight to the resting state.
- **No selection at first:** the centered word only gets a focus outline, nothing is faded, and the panel shows the prompt.
- A URL that carries state (§6.3) overrides all of the above.

## 5. Rendering

### 5.1 Layout model: `model/layout.ts`

- Pure function: wheel JSON → a flat array of segments `{ path, feelingId, ring, start, end, parent, children, hue }`.
- A segment's angle is proportional to the number of outer words below it, so every outer word gets an equal share of the circle.
- Each ring's segments are also kept as a sorted list of start angles, so hit-testing and snapping can use binary search.

### 5.2 Drawing: `render/wheel.ts`

- The canvas fills the wheel area. Its bitmap is `cssSize × devicePixelRatio`, capped there however far you zoom.
- Redraws happen only when something is dirty: the camera moved, the selection changed, the theme changed or the canvas was resized.
- **Culling:** skip rings whose radius range is outside the view, and segments whose angle range is outside the view.
- Each segment is drawn as an annular sector (`arc` / `arc` / `closePath`), with gaps drawn as background-colored strokes at a constant CSS-pixel width.
- No per-frame memory allocation in the draw loop: reuse arrays and cache text measurements per (label, font size).
- Colors come from CSS custom properties read once per theme change (`getComputedStyle`).
- In Windows high-contrast mode (`forced-colors: active`), segments use `Canvas` / `CanvasText` / `Highlight` system colors.

### 5.3 Labels: `render/labels.ts`

- Labels are drawn radially along each segment's center angle.
- **Readability rule:** if the label's angle on screen is between 90° and 270°, it is rotated 180° so it is never upside down. At 3 o'clock a radial label is horizontal, which is what makes the zoomed view flat.
- The font size scales with the camera scale and the root font size, so browser zoom and system text-size settings apply.
- If a label is too wide for its band, it shrinks to a minimum size, then wraps to two lines at a space. Labels are never truncated with "…".
- In overview, labels below 8 CSS px are not drawn; they appear as you zoom in.
- The focused segment gets a 2 px focus outline in `--focus` color.

### 5.4 Hit-testing: `model/geometry.ts`

- Map the pointer to wheel coordinates with the inverse camera transform, then to polar `(r, θ)`.
- Find the ring by radius, then the segment by binary search on the angle.
- A tap in the center hole, beyond the outer radius or outside the canvas returns `null`.

## 6. App shell

### 6.1 Layout

| | Overview | Zoomed |
|---|---|---|
| **Portrait / narrow** | Wheel fills the width; path chips sit above it; the card is a bottom sheet that peeks with the word and definition and can be pulled up | The ring band takes the top ~60%; the bottom sheet holds the panel |
| **Wide** | Wheel centered; the card floats bottom-right and is moved so it never covers the selected segment | The ring band is on the left; the panel takes the right side |

The breakpoint between the two layouts is decided by aspect ratio and width in CSS (container queries on the app root). The toolbar (zoom, theme) leaves room for the v2 to v4 toggles.

### 6.2 Panel: `ui/panel.ts`

- **Header:** the word and path chips (each chip uses its node's color and can be tapped to select that ancestor).
- **Definition.**
- **"You might notice":** body sensations.
- **"Narrow it down":** buttons for the children (not shown for outer words).
- **"Close to":** sibling words (outer words only).
- **Empty state:** the prompt.
- v2 adds a "By strength" section.

### 6.3 URL and history: `state/url.ts`

- The hash holds the state: `#/core/angry/aggressive/hostile?ring=2`. The path is the selection; `ring` is present only when zoomed.
- Each selection change pushes a history entry. Spinning pushes one entry when it settles, not one per segment passed.
- Back and Forward restore the state.
- Any part of the URL that doesn't match the data (an unknown path or ring) is ignored, and the app falls back to the default state.

### 6.4 Theme: `ui/theme.ts`

- System preference by default, with a 3-way override (System / Light / Dark) saved in `localStorage["fw.theme"]`.
- All storage access is wrapped in try/catch. If storage is unavailable, the app runs with defaults.
- The first-visit flag is stored as `fw.seenIntro`.
- Tokens are defined on `:root`, overridden in `@media (prefers-color-scheme: dark)` and in `[data-theme]` attributes.
- Fonts: the system font stack only (no web fonts). The canvas uses the same stack.

### 6.5 Offline install (PWA)

- `manifest.webmanifest` with a name, theme colors, `display: standalone` and icons: 192, 512, a maskable 512 and an Apple touch icon at 180. The icons come from one SVG wheel mark.
- **Hand-written service worker** (about 50 lines):
  - A small Vite plugin injects the list of hashed build files and a version string at build time.
  - **Install:** cache all build files.
  - **Fetch:** serve hashed files from the cache first; serve `index.html` from the cache while fetching a fresh copy in the background.
  - **Activate:** delete old caches.
  - Updates take effect on the next launch, with no prompt.
- Works offline after the first visit. It can be installed on iOS (Add to Home Screen), Android and desktop Chromium.

### 6.6 Browser support

The last two versions of Chrome, Edge, Firefox and Safari; iOS Safari 16.4+; Firefox and Chrome on iOS.

## 7. Architecture

```
index.html
public/                     icons, manifest.webmanifest
src/
  main.ts                   wiring only
  i18n.ts                   locale loading, t()
  data/
    types.ts                Feeling, Wheel, Locale types
    load.ts                 load + validate JSON
    feelings.json
    wheels/core.json
    locales/en.json
  model/
    layout.ts               wheel tree → segments (pure)
    geometry.ts             hit-test, snap target, visibility (pure)
  state/
    store.ts                tiny observable store (pure transitions)
    url.ts                  hash <-> state
  camera.ts                 springs, momentum, resting states
  render/
    wheel.ts                canvas drawing
    labels.ts               label placement / fitting (pure parts tested)
    colors.ts               read tokens, derive ring shades
  input/
    gestures.ts             pointer / wheel / gesture events → actions
    keyboard.ts             key bindings → actions
  a11y/
    tree.ts                 role=tree mirror of the wheel
    announce.ts             live region
  ui/
    panel.ts  breadcrumb.ts  toolbar.ts  theme.ts
  styles/
    tokens.css  app.css
  sw/
    sw.ts
build/
  sw-plugin.ts              injects the build file list into sw.js
tests/
  unit/                     Vitest
  e2e/                      Playwright
```

**How data flows:** an input handler (gestures, keyboard, a11y tree, panel buttons, URL) dispatches an action → `store` updates the state → subscribers react: `camera` sets new targets, `render` marks itself dirty, `a11y/tree` updates its `aria-*` attributes, `ui/panel` re-renders and `url` writes the hash.

The renderer and camera never change the state directly. Camera settle events are dispatched as actions like everything else.

## 8. Accessibility

- **Screen readers:**
  - `a11y/tree.ts` builds a `role="tree"` with nested `role="group"` / `role="treeitem"` nodes that mirror the wheel, with `aria-selected`, `aria-expanded` and `aria-level`.
  - Only one item is tabbable at a time (roving tabindex).
  - The tree is visually hidden, but each item's focus is reflected on the canvas (§5.3).
  - Keys are as in §4.5.
- **Live region:** announces, for example, "Hostile. In Angry, Aggressive." when a selection settles.
- **Hiding the canvas from screen readers:** the canvas gets `aria-hidden="true"`, because the tree is the accessible version of the wheel.
- **Touch targets:** in zoomed view, segments in the focused ring are at least 44 CSS px tall.
- Respects `prefers-reduced-motion`, `prefers-contrast: more` (stronger gap lines and faded contrast) and `forced-colors`.
- Target: WCAG 2.2 AA. axe-core reports zero violations.

## 9. Performance budgets

| Metric | Budget |
|---|---|
| App JS | ≤ 25 KB gzipped |
| First load (HTML + CSS + JS + en data) | ≤ 60 KB gzipped |
| Frame time during pinch / spin | ≤ 16 ms on a mid-range phone; no dropped frames on 120 Hz desktops in normal use |
| Idle CPU | 0 (no animation loop running) |
| Memory over a 10-minute scripted spin (Firefox) | Flat (no growth beyond normal garbage-collection ups and downs) |
| Canvas bitmap | ≤ viewport × devicePixelRatio |

## 10. Testing

- **Unit tests (Vitest):**
  - layout angles add up to 2π and each segment's share matches its number of outer words
  - every path is unique
  - hit-testing at every combination of zoom, rotation and pixel density (property-style tests on a grid of points)
  - the snap target always lands on a segment center at angle 0
  - the readability rule never produces an upside-down label
  - store transitions, including the zoomed picker behavior and clearing
  - URL round-trips, and unknown paths are ignored
  - locale completeness: every feeling id and sensation id has a label, and every feeling has a definition
- **End-to-end tests (Playwright, Chromium, Firefox and WebKit, desktop and phone screen sizes):**
  - tap to select and narrow down
  - chips step back out
  - ways to clear the selection
  - keyboard-only walk-through
  - first load starts zoomed on a phone screen size
  - Back / Forward restore the state
  - axe-core scan in overview and zoomed views
  - reloading while offline works
- **Performance:** a Playwright script spins and pinches while recording frame timing and JS heap size; the results are compared with §9. Plus a manual check in Lucas's Firefox.

## 11. Repo housekeeping

1. Commit the current uncommitted prototype changes as they are, so nothing is lost.
2. Replace the prototype with the Vite project in one commit; the prototype remains in git history.
3. Add a `.gitignore` covering `.DS_Store`, `node_modules/` and `dist/`.

Hosting: any static host; the build output is `dist/`.

## 12. v1 acceptance criteria

- [ ] All 130 positions render with correct proportions, colors and readable, never upside-down labels in both themes.
- [ ] Tapping any ring narrows the lit set as described in §4.1. All four ways of clearing work. There is no center button.
- [ ] Pinch, trackpad pinch, double-tap, the button and the keys all zoom; spinning has momentum and snaps exactly flat at 3 o'clock; changing ring works when zoomed.
- [ ] When zoomed, the centered segment is the selection after the first interaction; the panel updates when a spin settles.
- [ ] A phone-sized first load starts zoomed on the core ring with the first-visit opening move; reduced motion skips it.
- [ ] The panel shows the definition, sensations, "Narrow it down" and "Close to" as specified; it is a card or bottom sheet in overview and a side panel or sheet when zoomed.
- [ ] The URL hash restores the state; Back and Forward work.
- [ ] The full keyboard and screen-reader flow works; axe-core reports zero violations.
- [ ] The theme follows the system, with the override saved.
- [ ] Installable; works offline after the first visit.
- [ ] Every budget in §9 is met.
- [ ] All definitions and sensations have been reviewed by Lucas.
