# Roadmap

The living list of what's built, what's next, and what's still an idea. Specs are frozen once approved; this file is not. Update it when a spec is approved, when a version ships, and whenever new or later work comes up, so nothing lives only in a chat.

**Aim:** every way to identify an emotion, in a fast, accessible, lightweight feelings wheel that works offline, installs as an app, and supports light and dark mode. Built for Lucas first and meant to go public later.

## Versions

Each version is used before the next one is designed. Point releases (v1.1) rework what's there after using it. Whole versions add a new way to identify an emotion.

| Version | Status | Spec and plan |
|---|---|---|
| v1: Core wheel | Shipped | [spec](superpowers/specs/2026-11-06-feelings-wheel-v1-design.md), [plan](superpowers/plans/2026-11-06-feelings-wheel-v1.md) |
| v1.1: Selected and opened states, card redesign | Shipped | [spec](superpowers/specs/2026-11-07-feelings-wheel-v1.1-design.md), [plan](superpowers/plans/2026-11-07-feelings-wheel-v1.1.md) |
| v1.2: Fixes and polish from using v1.1 | Shipped | [spec](superpowers/specs/2026-11-07-feelings-wheel-v1.2-design.md), [plan](superpowers/plans/2026-11-07-feelings-wheel-v1.2.md) |
| v1.3: Layout, card and controls polish from using v1.2 | Next: brainstorming | Not written yet |
| v2: Strength | Planned | Not designed yet |
| v3: Body sensations wheel | Planned | Not designed yet |
| v4: Emoji wheel | Planned | Not designed yet |
| v5: Languages | Planned | Not designed yet |

## Notes for later versions

These are what Lucas asked for. Each version's brainstorm starts here. The sources named below are described in [reference/](reference/README.md).

### v1.3: Layout, card and controls polish from using v1.2

Lucas's feedback from using v1.2 (2026-11-07):
- **Phone opened word placement.** v1.2 centres the opened word in the whole screen. Lucas meant centred in the space between the top of the screen and the top of the open card.
- **Breadcrumbs in the card header.** The crumbs above the name don't line up with the header. The left edge of the first crumb should line up with the left edge of the dot (at rest, not mid-pulse), as in this sketch: "Surprised › Amazed ›" on one line, then the dot and "Astonished" below, then the definition.
- **Pinching in on an opened word drills down.** Pinching on an opened core or middle word opens its centre child (v1.1 spec §3.4). Lucas wonders whether it should do nothing.
- **Sticky card header.** Scrolling a long card should scroll the breadcrumbs away, but the dot and name row should stick at the top, with the scrolled content passing under it (behind its background, below its padding).
- **Tapping beside the card doesn't dismiss.** Tapping empty space next to the wheel closes or clears, but tapping above or below the card does nothing. Cause: that strip is the card's reserved column, outside the wheel's stage, so the tap never reaches the wheel.
- **Grab cursor and spinning only on the wheel itself**, not the empty space around it.
- **Desktop wheel looks off-centre with nothing selected**, because the card's column is always reserved. Idea: the "How are you feeling?" message takes the card's place in the column, and isn't dismissed by the first spin or selection.
- **Theme picker as an icon toggle.** One button that cycles through the three choices (system, light, dark), its icon showing the current one. Each tap shows a short popover or tooltip naming the choice, which fades soon after.
- **Replace "Zoom out".** The name doesn't fit. It should say it takes you back to the start, with nothing selected. "Reset" is one idea; not decided.
- Still open from v1.2: on the phone's half-wheel, a word chosen by keyboard can be on the hidden half (see "Known bugs after v1.2" below).

### v1.2: Fixes and polish from using v1.1

Shipped 2026-11-07 ([spec](superpowers/specs/2026-11-07-feelings-wheel-v1.2-design.md), [plan](superpowers/plans/2026-11-07-feelings-wheel-v1.2.md)). Everything below was addressed in it.

Lucas's feedback from using v1.1 (2026-11-07, mostly in Firefox). The decisions are in the [v1.2 spec](superpowers/specs/2026-11-07-feelings-wheel-v1.2-design.md), which replaces some of the ideas below (for example, the starting message and the half-wheel rules).

**Bugs, with their causes:**
- **Keys stop working after a card link.** Clicking a "Close to" or "Narrow it down" link rebuilds the card and moves focus to its header button (v1.1 spec §5.2). The page's key handler ignores keys whose target is inside the card or any button (`src/main.ts`), so the arrows go nowhere until you click the wheel again.
- **The outline doesn't line up on the inner two rings.** The white inner line's sides are pulled in by a fixed *angle*, worked out at the cell's inner radius (`outline()` in `src/render/wheel.ts`). The opened cell's inner radius is small on the core and middle rings, so the angle is large and the line pulls far in toward the outer edge. The fill and the black outline are the right size; the white line is what looks wrong. It should be inset by a fixed distance instead.
- **The theme picker shows the wrong choice.** Picking a theme doesn't update the toolbar's stored value, so the next time the toolbar refreshes (on open or close), the picker jumps back to the value from page load.
- **Closing spins the wheel back.** This is v1.1 spec §3.3 as written: closing returns to the rotation from before you opened. Lucas wants the wheel to stay where it is when you zoom out.

**Desktop:**
- Too much empty space between the wheel and the card. Bring the card closer, and consider showing more of the whole wheel without making the opened word less clear.

**Phones:**
- No starting selection. Keep the slight spin in, and start with the wheel's centre at the left edge of the screen so about half the wheel shows, from the core to the outer ring.
- Centre the selected or opened word vertically. v1.1 puts it at 27.5% of the height so it stays above the card at its tallest (45% of the screen). The design needs to settle how a centred word and a tall card share the screen.

**Card:**
- Move the breadcrumbs into the card's header, above the word's name, with one coloured dot. When a word opens, the breadcrumbs animate in and the word slides down to become the title. This is closer to the mockups chosen for v1.1.
- Animate the card opening and closing.
- The dot on an opened word pulses slightly.
- Hover states on links (colour is enough for now).
- Rename "Whole wheel" to something clearer, such as "Zoom out".

**Motion and gestures:**
- Slower spins. Spins use a spring that is about 90% done in 150 ms. That speed is a feel choice, not an accessibility rule; reduced motion already turns spins off.
- Less eager pinches: opening from the whole wheel needs more pinch, and so does stepping out of an opened word. Today's thresholds are `PINCH_IN = 1.15` and `PINCH_STEP_OUT = 0.87` (`src/model/pinch.ts`).

**Small issues left open by the v1.1 review:**
- Close, quickly reopen, then close again can miss the rotation from before opening. This goes away if closing stops restoring the rotation.
- The "Whole wheel" button hides itself while it has focus, so focus drops to the page.
- The label image cache's memory isn't measured (roughly 30–60 MB at a phone's pixel ratio), and there's no Firefox speed test for pinching.
- The label image cache relies on resizing to clear a reused image, and its fallback for browsers without offscreen 2D drawing is broken.
- `−` while a word is only selected goes to its parent; the v1.1 spec says it should do nothing.
- In an exactly square window 720 px or wider, the layout and the camera disagree about portrait.
- Swiping outward on the phone start screen selects the first child, not the one at 3 o'clock.
- The selection chevron crowds core-word labels (its look is marked provisional).
- Spec question: on phones, Back to the start returns to the random start word. This goes away if phones stop starting with a selection.

**Known bugs after v1.2:**
- On the phone's half-wheel, choosing a word by keyboard or the accessible tree can select one on the hidden left half without turning the wheel to show it. Not pressing; Lucas wants to try it before deciding whether the wheel should turn to show it.

**Decisions and changes made after the v1.2 spec (2026-11-07):**
- **Keys from the card stay as built.** After a card link, focus stays on the card's header, and the arrows move through the wheel from any card or toolbar button. The first Escape closes the word; the second clears it and moves focus to the wheel. The arrows therefore don't scroll a long card; Tab (which scrolls each link into view) and PageUp/PageDown still do. Screen readers in reading mode (NVDA, JAWS) keep the arrows for reading, so this doesn't get in their way.
- **`+`, `=` and `−` only work with focus on the wheel** (WCAG 2.1.4, character key shortcuts), so speech input can't trigger them by accident. Before, they worked from anywhere on the page. The arrows, Enter, Space and Escape are unchanged.
- **Opened words on desktop aren't clipped.** The opened view puts the opened cell's lifted edge and outline (not the wheel's bare edge) on the card's column, 12 px further left than spec §4.1's formula.
- **Small phones turned sideways get the full wheel.** The half-wheel follows the stage's own orientation, so a 667×375 phone in landscape isn't kept on the half-wheel.

### v2: Strength

- A toggle for strong, medium and light, like Tom Drummond's [Vocabulary of Emotions](reference/drummond-vocabulary-of-emotions.md).
- The panel lists a feeling's words at each strength.
- **Open question:** Drummond's chart has 10 categories (Happiness, Caring, Depression, Inadequateness, Fear, Confusion, Hurt, Anger, Loneliness, Remorse) that don't match the wheel's 7 core feelings. The v2 design has to decide whether to map them onto the wheel, give them their own wheel, or only tag the wheel's existing words.
- **Data model:** the optional `Feeling.strength` field (one value per word) isn't enough. In Drummond's chart, 22 words have different strengths in different categories (*Resentful* is Anger medium and Anger light), so strength has to live on a word within a category or a wheel position.

### v3: Body sensations wheel

- Modelled on Lindsay Braman's [Emotion-Sensation Wheel](reference/braman-emotion-sensation-wheel.md): core feelings, then feelings, then an outer ring of body sensations.
- On her wheel each sensation belongs to one feeling. In our data, sensations are a shared list many feelings point to, so a sensations wheel needs one parent per outer cell.
- Uses the same renderer and gestures as the core wheel; only the wheel file is new.
- The wording follows the content rules below.

### v4: Emoji wheel

- Very simplified: core feelings and a few middle-ring ones, because there are only so many emoji.
- The data is ready: `Feeling.emoji` is already an optional field.

### v5: Languages

- Spanish first (the [reference site](reference/core-feelings-wheel.md#the-reference-site) had an Español toggle, and Braman publishes a Spanish wheel), plus a language switcher.
- Adding a language means adding one locale file; no text is hard-coded.

## Before going public

- Lucas reviews the definitions and sensations in [content-review.md](content-review.md). This was moved out of v1.1.
- A credits or thanks page in the app, crediting every source the content draws on. The draft text is in [reference/README.md](reference/README.md#credits). Confirm the unverified attributions there (Roberts, the reference site) first.

## Content rules

- There are only so many ways to describe a feeling or a body sensation, so overlap with existing wheels and word lists is unavoidable and fine.
- Don't copy any source verbatim, and don't reproduce a source's full layout or word list wholesale.
- Definitions are short, plain-language prose (see v1 spec §3.4).
- Credit every source we draw on, in [reference/](reference/README.md) and on the app's credits page, whether or not a licence requires it.
