# Feelings Wheel v2.2: Design

Date: 2026-11-08
Status: approved in conversation, awaiting written-spec review
Builds on: `docs/superpowers/specs/2026-11-08-feelings-wheel-v2.1-design.md` (v2.1), which builds on v2 and earlier. Everything in v2.1 still holds unless this document replaces it.

## 1. Why v2.2

Using v2.1 turned up these:

- Long breadcrumbs wrap onto a second line.
- The link to the feelings wheel at the bottom of a body wheel card ("See Skeptical on the feelings wheel ›") wraps, and sometimes leaves "›" alone on its own line.
- Lucas doesn't like the heartbeat dot. The old halo was better, if slightly faster.
- On the body wheel, nothing says which core feeling a word belongs to.
- In the sideways layout there's a black background behind the card: the wheel stops at the card's column with a hard edge.
- On an iPhone 15 turned sideways (Safari and Firefox), the right end of an opened outer word is cut off.
- The start message should open with the question as a heading.
- The chevron drawn on the selected word on the wheel should go.
- Going back on a phone is awkward: swiping back steps through earlier words on a wheel that is itself swiped to navigate.

### Why the black background and the cut-off word

- **The black background.** Since v1.1 the wheel's canvas has ended at the card's column (`#stage { inset: 0 var(--column) 0 0 }`), and the column shows the page background. Since v1.2 the zoomed camera puts the wheel's edge on the column (v1.2 §4.1), so the outer ring stops in a straight line there. v2.1 made more screens rest on that zoomed view (sideways phones and short windows, v2.1 §6.2), so the edge is now on screen much more often.
- **The cut-off word.** The page runs under the notch (`viewport-fit=cover`). On a phone turned sideways the right safe-area inset (about 59 px on an iPhone 15) is larger than the card's 1.5rem right margin, so it pushes the card left. At 852 px wide, the column starts at 511 px and the card at 500 px. The camera puts an opened outer word's lifted edge and outline exactly on the column's edge (511 px), so the card covers the word's last 11 px, outline included.

### Out of scope

- **Going back on phones.** No change; it's added to the roadmap's known issues (§8).
- The notch's left inset over the wheel on sideways phones. The camera's 1rem left margin (v1.2 §4.1) doesn't count it. Nobody has reported it.
- The other known issues in `docs/ROADMAP.md`.

## 2. Decisions

| Topic | Decision |
|---|---|
| The card's column | The wheel draws under it, as it already does under the card on portrait phones. §3.1 |
| Where the zoomed wheel stops | 1.5rem left of the card itself, not the column's edge, so a safe-area inset can't push the card over the opened word. §3.2 |
| Breadcrumbs | One line. Only the nearest parent shortens, with "…". §4.1 |
| "›" after a link | Joined to the word before it, so it never wraps alone. §4.2 |
| The card's dot | Back to v1.2's halo, on a 2 s cycle instead of 2.4 s. The heartbeat is removed. §4.3 |
| Core feeling on the body wheel | A sentence after the definition: "A *happy* feeling.", the core word linking to it on the feelings wheel. §4.4 |
| The start message | A heading with the question, then the instruction. §5 |
| The wheel's selection chevron | Removed, with the room it reserved. The card's chevron stays. §6 |
| Going back on phones | No change in v2.2; a known issue. §8 |

## 3. The wheel and the card's column

### 3.1 The wheel draws under the column

- In the sideways layout, the canvas covers the whole app, as it does in the portrait layout. The card, the message, the switch and the toolbar float over it.
- **Two widths.** `Viewport` gains `drawWidth`: the canvas's width in CSS px. `width` stays the width the camera aims within (§3.2). In the portrait layout they're equal. `height` and `radius` are unchanged: `radius` still comes from `width` and `height`, so the wheel's size doesn't change.
- The canvas's size, clearing, label culling (`viewWindow`) and hit testing (`hitTest`'s bounds) use `drawWidth`. The cameras (`wheelCamera`, `ringFocusCamera`, `openedHalfHeight`, `useHalfWheel`, `shouldStartZoomed`, `restView`) keep using `width`, so every view sits where it does today, apart from §3.2.
- **Taps and drags in the column** now reach the wheel. A drag spins it. A tap on a cell selects or opens it. A tap off the wheel closes or clears, which is what a click on the column's empty space does today (v1.3 §3.4). That click handler on `#app` can no longer be reached, so it's removed. The card, the message and the toolbar still take their own clicks.
- At rest on a desktop the whole wheel is centred left of the column, as today, so nothing reaches into the column.

### 3.2 Where the zoomed wheel stops

- In the sideways layout, the camera's aim width (`Viewport.width`) ends **1.5rem left of the card's left edge** (`#float`'s left edge): `width = floatLeft − 1.5rem`, measured from the canvas's left edge.
- With no safe-area inset that's the column's edge, exactly as today (the card sits 1.5rem inside its column, v1.2 §4.1). With the iPhone 15's 59 px inset it's about 35 px further left, so the opened word ends 1.5rem before the card.
- The portrait layout's aim width stays the whole stage.

## 4. The card

### 4.1 Breadcrumbs on one line

- The crumbs row doesn't wrap.
- **Only the nearest parent shortens.** When the row doesn't fit, the last crumb (the word's parent) ends in "…" (`text-overflow: ellipsis`). Every other crumb, the core feeling or area included, and every "›" keeps its full width.
- The shortened crumb is still the whole link and keeps its full text, so its accessible name is the full word.
- A row that still doesn't fit with the parent reduced to "…" is clipped at the card's padding. The browser test at 320 px (§7) checks that the longest paths don't get there.

### 4.2 "›" stays with its link

- The "›" after a link is joined to the link's last word with a no-break space (U+00A0) instead of a plain space: the "See … on the feelings wheel ›" link and the row links ("Interested ›").
- The breadcrumbs' separators are their own elements, so §4.1 covers them.

### 4.3 The dot

- Replaces v2.1 §3.2's heartbeat with v1.2 §5.2's halo, unchanged except for the timing: while the card is opened, a soft halo in the dot's colour (`--dot-hue` at 55% opacity) grows from the dot to 0.55rem and fades to nothing over the first 70% of a **2 s** cycle (v1.2: 2.4 s), ease-out, then rests.
- The dot doesn't change size.
- Reduced motion: no animation. Forced colours: unchanged.

### 4.4 The core feeling on the body wheel

- On a wheel other than the first, an opened **feeling** card adds a sentence after its definition, in the same paragraph, naming its core feeling on the feelings wheel. For "Interested": "Wanting to know more about something. A *happy* feeling."
- **The link.** The core word (*happy*) is a link (`.fw-link`, in the core feeling's ink). It opens that core feeling on the feelings wheel, the way the "See … on the feelings wheel" jump does (v2 §6.2): it dispatches `fw-wheel` with the core feeling's path.
- **Which core feeling.** The first segment of the feeling's home path on the first wheel (the `home` map behind the jump, v2 §5.1).
- **No sentence** when the feeling is itself a core feeling (its home path is one segment long, like Sad), when it isn't on the feelings wheel (no home), or on the feelings wheel itself, where the breadcrumbs already start at the core feeling.
- **The words come from the locale, per core feeling.** Each core feeling's locale entry gains `kind`, the sentence with `{link}` where the link goes, and `kindLink`, the link's text: `"kind": "A {link} feeling."`, `"kindLink": "happy"`; Angry gets `"An {link} feeling."`. So the article and the word's form are per language, and nothing is lowercased in code.
- **Model.** The `text` section gains an optional `core: { before: string; label: string; after: string; hue: string; wheel: string; path: Path }`. `cardModel` fills it; the card draws the definition, a space, `before`, the link, then `after`.
- The "See … on the feelings wheel ›" jump stays. It opens the word itself, not its core feeling.
- Selected (not opened) cards don't change: the sentence is part of the definition, which only shows when opened.

## 5. The start message

- The message gets a heading with the question, then the instruction below it:
  - **Feelings wheel:** "How are you feeling?", then "Tap or spin to explore, or *start from body sensations instead*."
  - **Body wheel:** "What do you notice in your body?", then "Tap or spin to explore, or *start from feelings instead*."
- On a narrow phone the body wheel's heading wraps onto two lines, balanced (`text-wrap: balance`, already set for headings).
- **Locale.** Each wheel's text gains `hintTitle`, the heading. `hint` loses the question: "Tap or spin to explore, or {link}." `hintLink` is unchanged.
- **Markup.** The heading is an `h2` (`.fw-hint-title`), like the card's name. The instruction is a `p`, with its link as today (v2.1 §6.3). `HintContent` gains `title: string`.
- **Look.** The heading uses the card name's size and weight (1.35rem, 700). The instruction drops from 600 to normal weight at 1rem, its link styled as today. The panel's padding and left edge are unchanged; the heading and instruction sit 0.25rem apart.

## 6. The wheel's selection chevron

- The chevron drawn on a selected (not opened) word on the wheel (v1.2 §4.4) is removed: its drawing, the label's room for it (`CHEVRON_ROOM`, and the label moving inward to make that room), `chevronInside` and its constants.
- A selected word keeps its outline. Its label stays where it is.
- The card's chevron (the accordion's toggle) stays.

## 7. Testing

**Unit:**
- Geometry: `hitTest` accepts a point between `width` and `drawWidth` and rejects one past `drawWidth`; `viewWindow` covers the canvas up to `drawWidth`.
- Cameras: at 852 × 393 with a 59 px right inset, the opened outer word's lifted edge and outline end 1.5rem left of the card; with no inset the cameras are unchanged.
- Card model:
  - Body wheel, Interested opened: the text section's `core` is happy's (`before` "A ", label "happy", `after` " feeling.", the happy path).
  - The article comes from the locale (an Angry feeling).
  - No `core` on a body wheel core feeling (Sad), on a feeling with no home, or on the feelings wheel.
- Card: the sentence's link dispatches `fw-wheel` with the core feeling's path. The jump and row links end in a no-break space before "›". The crumbs row has the nearest parent as its only shrinking crumb.
- Hint: the heading is an `h2` with the wheel's `hintTitle`; the instruction keeps its link.
- Renderer: a selected word draws its outline and no chevron; its label doesn't move when selected.
- Locale: every core feeling has `kind` with one `{link}` and a `kindLink`; every wheel has `hintTitle`.

**Browser (Playwright):**
- 852 × 393 (with a simulated 59 px right safe-area inset, and without), 895 × 470 and 1280 × 800, each wheel, an outer word opened: the opened word's outline is fully drawn, and the card doesn't overlap it.
- In the sideways layout the canvas covers the whole app, and the wheel draws pixels in the column when zoomed.
- A drag starting in the column, off the card, spins the wheel; a tap there off the wheel closes an opened word.
- A body wheel word with a long path at 320 px wide: the crumbs stay on one line, and only the nearest parent is shortened.
- "See … on the feelings wheel ›" at 320 px: "›" never sits alone on a line.
- The halo runs while opened, on a 2 s cycle, and doesn't with reduced motion.
- The core feeling link opens that core feeling on the feelings wheel.
- The viewport sweep (`tests/e2e/viewports.spec.ts`) changes its sideways invariant: the stage is the whole app; the message and card sit right of the camera's aim width instead of the stage.
- axe passes on the new states (the message's heading, the definition's link).
- Perf: the spin and switch perf tests pass with the larger canvas.

## 8. Docs

- `docs/ROADMAP.md`: a v2.2 row linking this spec and its plan.
- Known issues gains **going back on phones**: swiping back steps through earlier words, which doesn't fit a wheel that's itself swiped to navigate. No fix chosen yet.
