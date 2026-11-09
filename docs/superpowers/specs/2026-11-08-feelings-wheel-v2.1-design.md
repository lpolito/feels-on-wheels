# Feelings Wheel v2.1: Design

Date: 2026-11-08
Status: approved in conversation, awaiting written-spec review
Builds on: `docs/superpowers/specs/2026-11-08-feelings-wheel-v2-body-wheel-design.md` (v2), which builds on v1.3 and earlier. Everything in v2 still holds unless this document replaces it.

## 1. Why v2.1

Using v2 turned up these:

- The body wheel's card headings should say what the links are: feelings.
- The card's dot should beat like a heart.
- The Feelings/Body switch should animate, and be ready for a third option (the [emoji wheel](../../ROADMAP.md#emoji-wheel)).
- The body wheel's inner two tiers look like tropical Skittles.
- At some screen sizes the outer ring's labels disappear, mostly with an inner-tier word opened.
- Phones turned sideways are generally messed up: the switch sits on the wheel, the resting wheel is small with labels only on its inner ring, the start message's link breaks its line and leaves the full stop alone on its own line, and on an iPhone SE turned sideways the message covers the wheel.

### Why the outer labels disappear

A label shrinks to fit its cell, down to a minimum size; below that it isn't drawn (v1 §5.3). The minimum is 8 CSS px in the whole-wheel view and 12 px once something is opened, both scaled by the root font size. Neither is a platform limit; they're readability choices.

With an inner-tier word opened on a phone, the camera (v1.2 §4.2) sizes the inner ring for a 4.5rem cell, which puts the outer ring's labels at about 10.4 px on the body wheel (105 outer cells) and 12.1 px on the feelings wheel (82). The body wheel's fall under 12 px, so they vanish. Tablets and desktops have a larger minimum zoom (`MIN_RING_SCALE`), so they're unaffected.

### Out of scope

- The emoji wheel itself. v2.1 only readies the switch for it (§4.2).
- Moving the wheel left on portrait phones so the whole outer ring is on screen. With an inner tier opened the outer ring still runs past the right edge; Lucas wants to try §5 on its own first.
- The known issues in `docs/ROADMAP.md`.

## 2. Decisions

| Topic | Decision |
|---|---|
| Body wheel card headings | "Could be feeling" on a sensation; "Could also be feeling" on a feeling under a sensation. §3.1 |
| The card's dot | A heartbeat: a quick beat, then a longer one, then a rest. §3.2 |
| The wheel switch | A highlight slides to the pressed option. Works for any number of options. §4 |
| Third option | Each wheel can have a short visible label (one emoji) and a separate spoken name. Fits from 320 px. §4.2 |
| Outer labels with an inner tier opened | Rings outside the focused ring draw down to 10 px instead of 12 px. No camera change. §5 |
| Which screens are sideways | Wider than tall, and either at least 720 px wide or under 480 px tall. §6.1 |
| Sideways phones at rest | The zoomed side view: the opened-core-word view, with nothing selected. §6.2 |
| The switch on sideways phones | Stays top left, over the wheel, as on portrait phones. §6.2 |
| The start message's link | A real link, so it wraps with the sentence. §6.3 |
| Body wheel outer tier | Feelings there are drawn in the core ring's shade. §7.1 |
| Body wheel inner tiers | Today's eight hues, all 1.2× the chroma at the same lightness. §7.2 |

## 3. The card

### 3.1 Body wheel headings

- `couldBe` becomes "Could be feeling": the links on an opened sensation (v2 §6.2).
- `couldAlsoBe` becomes "Could also be feeling": the links on an opened feeling whose parent is a sensation.
- Only the two locale strings change. The feelings wheel never uses them.

### 3.2 The heartbeat

Replaces v1.2 §5.2's halo (`fw-halo`). While the card is opened, the dot beats on a 1.6 s cycle:

| Time in the cycle | What happens |
|---|---|
| 0–6% (0–96 ms) | **First beat:** the dot grows to 1.35× its size. |
| 6–12% (96–192 ms) | It shrinks back to 1×. |
| 12–18% | A short pause. |
| 18–30% (288–480 ms) | **Second beat, drawn out:** it grows to 1.2×, with a slower ease. |
| 30–44% (480–704 ms) | It shrinks back to 1×. |
| 18–60% | A soft halo grows to 0.55rem around the dot, as v1.2's did: the dot's colour (`--dot-hue`) at 55% opacity, fading to 0. |
| 44–100% | Rest. |

- The dot's size change is a `scale` transform, so it never moves the name beside it.
- Reduced motion: no animation, as today. Forced colours: unchanged.

## 4. The wheel switch

### 4.1 The sliding highlight

- The pressed option's fill (today `background: var(--fg)` on `[aria-pressed="true"]`) moves to one highlight element behind the buttons. On a change it slides to the newly pressed button and takes its width over 250 ms (ease-out). The text colours cross-fade over the same time.
- The highlight's position and width come from measuring the pressed button, so it works for any number of options and any label width. It re-measures when the switch's size changes (a `ResizeObserver`: text size, a font loading, a new wheel list).
- **No animation** on first render, when the wheel list changes, or with reduced motion: it jumps.
- The highlight is decorative (`aria-hidden`). The buttons, `aria-pressed`, focus and the `fw-wheel` event are unchanged (v2 §4.1).
- Forced colours: the highlight uses `Highlight`, the pressed text `HighlightText`, as today.

### 4.2 Ready for a third option

- A wheel's locale entry may add `switchName`. When it's there, its button shows `switch` (for the emoji wheel, a single emoji) and takes `switchName` as its accessible name (`aria-label`). Without it, as today, `switch` is both.
- Under 360 px wide, the switch's padding and the gap between it and the toolbar tighten as much as needed for "Feelings | Body | (emoji)" to fit beside Start over's icon and the theme button at 320 px, with every button keeping its 44 px minimum height.
- No third wheel ships in v2.1. A unit test renders the switch with three wheels, one of them with `switchName`, and a Playwright test at 320 × 568 adds a temporary third button to the switch and checks that nothing overlaps.

## 5. Labels on context rings

- In the ring view (`mode: 'ring'`), the focused ring and every ring inside it keep the 12 px minimum. **Rings outside the focused ring use 10 px.** Both still scale with the root font size (`× remPx / 16`).
- The whole-wheel view keeps 8 px for every ring.
- The renderer needs the focused ring, so `Frame` gains `ring: number | null` (the view ring in ring mode, null in wheel mode).
- Nothing about the camera changes. On phones, the body wheel's outer labels draw at about 10.4 px with an inner-tier word opened; the feelings wheel's at 12.1 px, as today.

## 6. Phones turned sideways

### 6.1 Which screens are sideways

- **Sideways layout** (the wheel on the left, the card's column on the right; v1.2 §4.1): the screen is wider than it is tall, **and** either at least 720 px wide or under 480 px tall.
- Everything else gets the portrait layout (the wheel fills the screen, the card floats at the bottom).
- This replaces v1.2 §4.3's rule (portrait when under 720 px wide or taller than wide). The change: a phone turned sideways under 720 px wide (iPhone SE: 667 × 375) now gets the sideways layout, so the message no longer covers the wheel. A narrow desktop window (under 720 px wide, 480 px tall or more) keeps the portrait layout.
- The stylesheet's container query and `main.ts`'s `portrait` flag use the same rule, as today.

### 6.2 The side view at rest

- When the layout is sideways and the screen is **under 480 px tall**, the resting whole-wheel camera is the **side view**: the same scale and centre `ringFocusCamera` gives the core ring in the sideways layout (the wheel meets the stage's right edge), with nothing selected.
- It rests with the first core word (Fearful) centred at 3 o'clock (`halfRestRotation`), and plays the half-wheel's intro spin.
- It behaves as the portrait half-wheel does: spinning, tapping to select, opening, Start over and closing return to it. Mode stays `'wheel'`, so its labels use the 8 px minimum.
- `CameraOpts.half: boolean` becomes `rest: 'whole' | 'half' | 'side'`. `wheelCamera` takes the layout, which the side view needs. A device turning between portrait and sideways switches between the half-wheel and the side view, as it does today between the half-wheel and the whole wheel.
- Tablets and desktops (sideways but 480 px tall or more) keep the whole wheel.
- **The switch and toolbar don't move.** The switch stays top left over the wheel, as it does over the portrait half-wheel; the toolbar stays top right.

### 6.3 The start message's link

- Today the link is a `<button>` inside the sentence. A button can't break across lines, so on a narrow panel it drops to its own line as one block and the full stop after it is left alone.
- It becomes an `<a>` whose `href` is the other wheel's URL (`#/<wheel id>`, or empty for the first wheel; v2 §4.3), so it wraps like the rest of the sentence.
- A plain click is handled in place: it prevents the navigation and dispatches `fw-wheel` as the button did, so history behaves as in v2. A modified click (new tab, new window) is left to the browser and opens that wheel there.
- Its look is unchanged (`.fw-hint-link`). `focusLink()` still focuses it.

## 7. Body wheel colours

### 7.1 Deeper outer feelings

- A feeling cell whose **parent isn't a feeling** is drawn in the **core ring's shade** (`RING_SHIFT[0]`, −0.07 OKLab L), lit and faded alike.
- On the body wheel that's the outer ring. On the feelings wheel every feeling's parent is a feeling (or it is a core feeling), so nothing changes there; a unit test pins that.
- `Segment` gains `shadeRing: number`, the ring whose shade it is drawn in: 0 for such feeling cells, its own ring otherwise. The renderer passes `shadeRing` to the fill table where it passes `ring` today. Labels keep their ring's sizes.

### 7.2 Richer inner tiers

- The eight area tokens (`--hue-head` … `--hue-posture`, v2 §5.2), light and dark (system and `data-theme`), are replaced by today's values with **1.2× the OKLab chroma at the same lightness and hue**. A colour that can't reach 1.2× and stay in sRGB goes as far as it can.
- The new values are computed once and written into `tokens.css`, with a comment saying how. `colors.ts` is unchanged: `fitWhite` and the ring shading still run on top, so labels keep their contrast (4.8:1 lit).
- **Distance guard:** a unit test checks that, in each theme, every area's core-ring fill is at least 0.055 (OKLab ΔE) from every feeling's fill at every ring shade. Today's closest pair is 0.057 (Breath and throat to Surprised, dark), and the 1.2× values clear it.
- Lucas sees the final swatches before v2.1 ships.

## 8. Testing

**Unit:**
- Card: an opened sensation's links are headed "Could be feeling"; an opened feeling under a sensation, "Could also be feeling"; the feelings wheel's headings are unchanged.
- Switch: with three wheels, one with `switchName`, each button's text and accessible name; `aria-pressed` moves; the highlight is `aria-hidden`.
- Labels: in ring mode, the minimum is 12 px for the focused ring and those inside it and 10 px outside it (scaled by `remPx`); 8 px in wheel mode.
- Sideways rule: 851 × 393 and 667 × 375 are sideways; 393 × 851 and 600 × 500 aren't; 1280 × 800 is.
- Side view: at 851 × 393 and 667 × 375 the resting camera matches `ringFocusCamera` on the core ring; at 1280 × 800 it's the whole wheel; a portrait phone still gets the half-wheel.
- Colours: `shadeRing` is 0 for every body outer cell and equals `ring` for every feelings-wheel cell; the distance guard (§7.2); the existing contrast tests pass with the new tokens.
- Hint: the link is an `<a>` with the other wheel's `href`; a plain click dispatches `fw-wheel` and doesn't navigate; a modified click does neither.

**Browser (Playwright):**
- 393 × 851, body wheel, "Head and eyes" opened: labels are drawn on the outer ring.
- 851 × 393 and 667 × 375, each wheel: the resting view is the side view, labels are drawn on all three rings, and the message doesn't overlap the wheel's stage.
- The switch: after a press, the highlight's box matches the pressed button's; with reduced motion it doesn't transition.
- The heartbeat runs while opened and doesn't with reduced motion.
- axe passes on the new states.

## 9. Docs

- `docs/ROADMAP.md`: a v2.1 row linking this spec and its plan, and, when it ships, the portrait outer ring running off the right edge as a known issue if it still bothers Lucas.
