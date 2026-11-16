# Feels on Wheels: question first, and Tab onto the wheel selects nothing

Approved by Lucas on 2026-11-15. Designed with him that day, from the roadmap idea "Question first in page and Tab order". The choices below are his unless marked as Claude's call.

## Intent

Since the [share change](2026-11-15-feels-on-wheels-share-and-preview-design.md), a keyboard user moving forward with Tab never reaches About or Share at rest. Reaching the wheel selects its first word (`src/a11y/tree.ts`, on focus), which hides the start message, where About now lives, and swaps the toolbar's Share for Start over. Before the share change, the toolbar's About stayed reachable on computers, so this is a regression. The wheel page also has no `<h1>`, and a screen reader reaches its only heading, the message's question, after the whole wheel.

Two changes, shipped in one pull request:

1. **Question first.** The page's order becomes: the start message, the wheel switch, the toolbar, the wheel, the card. The question is the first thing a screen reader reads, and Tab reaches About and Share before the wheel. The `<h1>` follows the URL. This alone fixes the bug.
2. **Tab onto the wheel selects nothing.** Focus lands on the wheel and the page stays as it is: the message, About, and Share stay on screen. A word gets selected only when you act on it. While the wheel has keyboard focus and nothing is selected, a ring around the wheel shows where focus is. The message's instruction names the arrow keys on computers.

Lucas wants to try it on his iPhone before a pull request is opened (§11).

## Goals, non-goals, anti-goals

- Goal: moving forward with Tab from a fresh load reaches the message's links, the switch, Share, and the theme button before the wheel.
- Goal: the first thing a screen reader reads on the wheel page is the question (or, on not found, "Feeling not found!").
- Goal: after you pick a word, the card is the next stop forward with Tab, never behind you.
- Goal: wherever keyboard focus is on the wheel page, a sighted keyboard user can see it.
- Goal: the instruction in the start message is true for the device it's read on.
- Non-goal: moving focus anywhere on load. Focusing the message on load would disorient screen reader users and bring back the iPhone focus ring the [keys and focus change](2026-11-14-feels-on-wheels-keys-and-focus-design.md) removed.
- Non-goal: changing anything on screen in the layout. The message and the card stay in the same spot, one at a time, as today.
- Non-goal: a focus ring on the wheel while a word is selected or opened. The selection outline is the mark then, as today (Lucas).
- Non-goal: fixing phone screen readers' double-tap on the wheel's words (§10 logs it).
- Non-goal: a different word for the wheel to start on (the rest of the roadmap idea "A different word to start on").
- Anti-goal: Tab following the screen's top-to-bottom order at the cost of "question first". The accepted cost: a sighted keyboard user sees focus start at the message (at the bottom on phones), then jump to the top row. WCAG 2.4.3 asks for a meaningful order, not a strictly visual one.
- Anti-goal: anything a screen reader hears that doesn't match what's on screen, such as a heading that isn't shown.

## Approaches

**Page order.** (A) Split `#float` so the message comes before the wheel and the card after it; (B) move `#float` as a whole before the wheel; (C) put the switch and toolbar before the message. B was rejected because after you pick a word the card would be behind you, and you'd need Shift+Tab to reach the card you just opened. C contradicts "question first". Reordering with CSS (`order`, grid areas) changes neither Tab nor screen reader order, and `tabindex` values above 0 would leave the reading order wrong. Lucas chose **A**.

**The `<h1>`.** Considered: (A) the question becomes the `<h1>`; (B) a visually hidden `<h1>` ("Feels on Wheels") before the message; (C) whichever panel shows holds the `<h1>`, including the folded card of a word that's only selected. Lucas pointed out that selecting a word doesn't change the URL, so a heading for it would name a page that isn't there. Chosen: **the `<h1>` follows the URL.** The question at rest (or "Feeling not found!"), the word's name once it's opened, and no `<h1>` while a word is only selected. The alternative for that state, keeping the question as a visually hidden `<h1>`, was rejected because it's a heading a screen reader finds that isn't on screen. B was rejected because it puts the app's name ahead of the question.

**Tab onto the wheel.** Considered: (A) keep selecting the first core word; (B) select the core word at 3 o'clock, which is always on screen; (C) select nothing. Lucas chose **C**, with the word at 3 o'clock as the one the first key selects (§3).

**Showing keyboard focus with nothing selected.** The wheel draws only the selection outline, and the tree is visually hidden, so focus on an unselected word shows nothing today (this already happens after Start over). Considered: a focus ring on the word at 3 o'clock, or a ring around the whole wheel. Lucas chose **the ring around the wheel**, only while nothing is selected.

**Telling people how to use the wheel.** Considered: (A) a visually hidden sentence in the message for screen readers; (B) a description on the tree (`aria-describedby`), which screen readers read unevenly and some repeat; (C) visible text for everyone, worded by device. Lucas chose **C**. With it, A isn't needed. Ruled out: `aria-roledescription="wheel"` on the tree, which would hide the role "tree", the word that tells screen reader users the arrow keys work.

**The first key on a focused wheel.** Select the word at 3 o'clock, or open it. Chosen: **select** (Lucas agreed). You couldn't see which word you were on, so the first key shows you before anything opens. It also matches the app's rhythm, where a tap selects and a second tap opens. The cost: a screen reader user needs Enter twice to open.

**Shipping.** Lucas had no preference. *Claude's call:* one spec and one pull request, with change 1 (§1, §2) committed before change 2 (§3 to §5), so each is reviewable on its own.

## 1. Page order

Today, inside `<main id="app">`: `fw-wheel-switch`, `#stage` (the canvas and `#a11y-tree`), `#float` (`fw-hint` and `fw-card`), `fw-toolbar`, `#announcer`.

New:

1. **The message box**, holding `fw-hint`.
2. `fw-wheel-switch`.
3. `fw-toolbar`.
4. `#stage` (the canvas and the tree).
5. **The card box**, holding `fw-card`.
6. `#announcer`.

The message box and the card box take today's `#float` rules, so each sits where `#float` sits today, in every layout (side column, portrait, sideways phones, safe areas). Only one of their panels shows at a time, as today. Everything `main.ts` measures from `#float` (the camera's aim width, the phone card's height cap and top, the resize watch) is about the card, so it measures the card box. Nothing on screen moves, at any size, in either theme.

The switch and toolbar already sit above the stage (`z-index: 3`); the message box needs the same stacking `#float` has today, now that it comes before the stage in the page.

## 2. Headings

The `<h1>` follows the URL:

| State | URL | `<h1>` | Other headings |
|---|---|---|---|
| At rest | `/`, `/body` | The message's question ("How are you feeling?", "What do you notice in your body?") | None |
| Not found | as typed | "Feeling not found!" | None |
| A word selected, not opened | `/`, `/body` | None | The folded card's heading, the word's name, is an `<h2>` |
| A word opened | the word's address | The card's heading, the word's name | The card's sections ("You might notice", "Narrow it down", …) are `<h2>` |
| About | `/about` | About's own `<h1>` (unchanged) | Unchanged |

- The message's title (`.fw-hint-title`) becomes an `<h1>`.
- The card's heading (`.fw-card-heading`) is level 1 when the card is opened and level 2 when only selected. Its sections' headings go from `<h3>` to `<h2>`. The accordion pattern (the toggle button inside the heading) stays.
- *Claude's call:* the card's heading becomes an element with `role="heading"` and an `aria-level` that changes in place. When the same word goes from selected to opened, `FwCard` updates its DOM in place (`#update`, not `render()`) so focus stays on the toggle and the unfold animates; swapping an `<h2>` element for an `<h1>` around the focused toggle would mean refocusing it, and a screen reader would likely read the button again mid-open. Screen readers treat `role="heading"` with `aria-level` as a real heading; they don't announce a level change.
- They all look exactly as they do today: the styles move from element selectors to classes where needed (`.fw-card-content h3` today).
- Only one of the wheel page's headings and About's `<h1>` is ever shown, since the routes hide each other with `display: none`.

## 3. Tab onto the wheel selects nothing

This replaces, for the unselected state only, v1.1's rule that keyboard focus is the selection ([v1.1 spec](2026-11-07-feelings-wheel-v1.1-design.md), its keyboard and visible-focus notes). Once a word is selected, focus and selection are still the same thing, as today.

**"The word at 3 o'clock"** means the core word whose wedge crosses 3 o'clock on screen. *Claude's call:* it's measured where the wheel is headed (the camera's target rotation), so a key pressed during the intro spin, or a spin's settle, picks the word the wheel lands on, not one passing by. On a phone's half-wheel, 3 o'clock is the middle of the visible edge, so this word is always on screen.

**Reaching the wheel:**

- Tab (or Shift+Tab, or a screen reader's cursor) moving focus onto the tree selects nothing. The tree's focus handler that selects the first core word goes.
- With nothing selected, the tree's one tabbable word (its roving `tabindex`) is the word at 3 o'clock, not the first core word.
- A screen reader hears the tree's name and that word, unselected. Nothing else changes: the message, About, and Share stay, and the next Tab leaves the wheel as if you'd never been there.
- *Claude's call,* so what a screen reader hears always matches what a key does: with nothing selected, the tree never moves focus from one word to another on its own, with one exception. When the wheel comes to rest after a turn (a spin, the intro), if focus is on the word that was tabbable, it moves to the new word at 3 o'clock, which a screen reader announces once. During the turn it doesn't move, so nothing is read mid-spin. If a screen reader's cursor has put focus on another word, such as an inner word inside a collapsed group, focus stays there.

**The first key, with nothing selected:**

| Key | Today with nothing selected | New |
|---|---|---|
| Up, Down | Selects the first core word | Selects the word |
| Right, Left | Nothing | Selects the word |
| Enter, Space, `+`, `=` | Selects the first core word | Selects the word |
| `-`, Escape | Nothing | Nothing |

**"The word"** is the word with focus when focus is in the tree (normally the word at 3 o'clock; another word only if a screen reader's cursor put focus there), and the word at 3 o'clock when the key comes from anywhere else. *Claude's call:* a screen reader user who hears "Hostile" and presses Enter gets Hostile.

Selecting it works as any key selection does today: the wheel turns to center the word at 3 o'clock, it gets its outline, the folded card appears, the message hides, the toolbar's Share becomes Start over, and the announcer says the word. Nothing opens. The next key works as usual: Enter or Space opens it, and the arrows move from it.

**Where the keys act from** is unchanged (`routeKey`, specs v1.2 §3.6 and v2.1 §6.3): the tree, the page with focus on no control, and the arrows (not Enter or Space) from buttons and links, so the switch, the toolbar, and the message's links too. Two consequences, both *Claude's calls*:

- Left and Right, pressed on a button or link with nothing selected, now select the word at 3 o'clock, like Up and Down already do. The message tells computer users to use the arrow keys, and it's the first Tab stop, so an arrow pressed there should work.
- An arrow pressed on one of the message's links selects a word, which hides the message with focus inside it. Focus then goes to the selected word in the tree (§6), not `<body>`. This happens today with Up and Down too.

The reducer in `src/state/store.ts` stays pure, so the word has to reach it from outside; how is left to the builder.

**Pointers don't change:** a tap or click on a word selects it, and a mouse click on the wheel still puts focus quietly in the tree (no ring, §4).

**Clearing a selection** (Escape, Start over, Back to the base URL) while the tree has focus: focus moves to the tabbable word, which is now the word at 3 o'clock, with nothing selected, and the ring shows if the clearing came from the keyboard.

## 4. The ring around the wheel

- **When:** keyboard focus is in the tree, nothing is selected, and the focus is from the keyboard. That is, the focused word matches `:focus-visible` and isn't marked `data-quiet-focus` (`src/a11y/focus.ts`). So it shows after Tab, Shift+Tab, a keyboard Escape or Start over, and a keyboard-triggered return from About; it doesn't show after a tap or a click. The renderer redraws when any of these change: focus entering or leaving the tree, the quiet mark clearing on the next key, and the selection.
- **Look:** a circle just outside the wheel's outer edge, drawn on the canvas, in the focus color the app's other controls use (`palette.focus`, `--focus`, Highlight in forced colors), 3 px wide with a small gap from the wheel, like the buttons' `outline-offset`. It follows the wheel through zooms and turns, and is still with reduced motion (it never animates). *Claude's call,* to be judged when Lucas tries it.
- **Where:** on a computer it circles the whole wheel; on a phone at rest, it shows along the visible half-wheel's edge.
- The tree's own CSS outline stays (it's invisible, since the tree is visually hidden, but harmless).

## 5. The message's instruction, by device

The line under the question names what works on the device:

- **Touch screens** (phones, tablets, including an iPad with a keyboard): "Tap, spin, or zoom to explore, or {link}."
- **Mouse or trackpad:** "Click, spin, zoom, or use the arrow keys to explore, or {link}."

`{link}` stays the link to the other wheel. Trackpads zoom too, through pinches (`gestures.ts` handles `wheel` and Safari's `gesture*` events).

Which line shows follows the primary pointer: `(pointer: coarse)` is touch. *Claude's call:* the message picks it in code with `matchMedia` and renders only that one, re-rendering when the media query changes, so a screen reader, `focusLink()`, and the not-found announcement all use the line on screen. A touch laptop whose primary pointer is its trackpad gets the mouse line, and an iPad with a keyboard gets the touch line, which doesn't mention the keys; that's accepted.

Each wheel's locale entry holds both lines as whole sentences (for translators, who may need different word order), replacing today's single `hint`. Both wheels use the same wording today.

## 6. Focus handoffs

Each one keeps working with the new order, and the tests in §9 check them:

- **`fw-focus-lost`** (the focused Start over or card control hides) still goes to `tree.focusSelected()`. With nothing selected, that's the word at 3 o'clock, unselected.
- **New: the message hiding with focus inside it** (an arrow key on its link or About, §3) hands focus to the tree's selected word, the way `fw-focus-lost` does for the toolbar and the card.
- **Closing About** still returns focus to the control that opened it, usually the message's About link, which is shown again at rest.
- **The message's link to the other wheel** still hands focus to the new wheel's message link after switching (`hint.focusLink()`).
- **The wheel switch** keeps focus on its own button. The new wheel's name is announced, as today, and its question is one Shift+Tab back.
- **Back and Forward** still put focus back on the rebuilt tree when it had focus (`popstate`).
- **The card's jump** to the other wheel still goes to the tree when the word it lands on isn't opened.

## 7. What a screen reader hears

- **First load at `/`:** the page's title, then in reading order: "How are you feeling?" (heading level 1), the instruction with the link "start from body sensations instead", the link "About Feels on Wheels", the switch, "Share Feels on Wheels" and the theme button, then the tree, "Feelings wheel", and its words. The card is hidden. Nothing takes focus.
- **First load at `/body`:** the same, with "What do you notice in your body?", "start from feelings instead", and "Body sensations wheel".
- **Not found:** "Feeling not found!" (heading level 1), "There's no "plaful" on the wheel.", the instruction with its link, About, then the rest. The existing live announcement of the same text stays.
- **Tabbing onto the wheel:** the tree's name and the word at 3 o'clock, not selected. The first key: that word, selected.
- **After Start over:** focus on the word at 3 o'clock, nothing selected. Shift+Tab reaches the theme button, Share, the switch, About, and the link to the other wheel.
- **After selecting a word:** forward Tab goes from the wheel straight to the card.

## 8. Text

In `src/data/locales/en.json`, each wheel's `hint` is replaced by two sentences, one per device (§5). `src/data/load.ts` checks every wheel has both. No other text changes.

## 9. Tests

- **Unit:** the message's title is an `<h1>`; the card's heading has `aria-level` 1 when opened and 2 when selected, keeping the same element (and focus on its toggle) from one to the other, with `<h2>` sections; the tree selects nothing on focus, its tabbable word with nothing selected is the one passed as the word at 3 o'clock, and focus moves to a new one only when the wheel comes to rest and only from the old tabbable word; every key in §3's table, with nothing selected, selects the word (the focused one from the tree, the word at 3 o'clock from elsewhere) and opens nothing; Left and Right from a button or link with nothing selected select the word at 3 o'clock; the renderer draws the ring only when told the wheel has keyboard focus with nothing selected; the message renders the line for its pointer and switches on a media change; both lines are required in each wheel's locale.
- **End-to-end, in all five browsers:**
  - From a fresh load at `/`, `/body`, and a not-found address, forward Tab reaches, in order: the link to the other wheel, About, the switch, Share, the theme button, then a word in the tree, with nothing selected and the message and Share still shown. The next Tab leaves the wheel.
  - After that, the first arrow key, and separately Enter, select the word at 3 o'clock without opening it; a second Enter opens it, and the next forward Tab lands in the card.
  - The ring shows after Tab onto the wheel and after a keyboard Start over, and not after a tap or click (through a test hook on the renderer).
  - The heading levels in each state of §2 (by role and level, so the card's `role="heading"` counts).
  - The instruction's wording on the desktop and phone projects.
  - The handoffs in §6, including an arrow key on the message's About link, which selects the word at 3 o'clock and leaves focus on it in the tree.
  - axe still passes on both wheels and About, in both themes.
- **Update** the tests that assume Tab or a focus selects the first word, or today's order, across `wheel.spec.ts`, `body.spec.ts`, `about.spec.ts`, `routes.spec.ts`, and `share.spec.ts`, and the unit tests that check `h2.fw-hint-title`, `h2.fw-card-heading`, and the card's `h3`s.
- The viewport sweep (`viewports.spec.ts`) still passes, since nothing on screen moves.

## 10. Roadmap and docs, in the same change

- **Roadmap:** add a Shipped row with this spec and its plan. Delete the idea "Question first in page and Tab order" (its subsection and its table row). Delete the Navigation known issues "Tab selects a word on reaching the wheel" and "Tabbing into the phone's half-wheel", both fixed. Delete the bullet "The first word Tab lands on sits at 3 o'clock" from "A different word to start on", and repoint links to the removed headings.
- **New known issue, under Navigation:** phone screen readers probably can't open a word. VoiceOver on iPhone and TalkBack act on an item by double-tapping it, which sends a click, and the tree's words listen only for keys (`src/a11y/tree.ts` has no click handling). Not yet checked on a phone. No fix chosen yet.
- **ACCESSIBILITY.md known limitations:** remove the bullets about Tab selecting a word and about the half-wheel; add one, in plain words, that on a phone with VoiceOver or TalkBack, double-tapping a word on the wheel may not select it.
- **The pull request's "What and why"** says how it was checked: the tests, the keyboard in a browser, Lucas on his iPhone, and which hand checks weren't done (a screen reader).

## 11. Trying it before the pull request

Implementation stops with the work committed on the branch `question-first-order`, all tests passing, and nothing pushed. Lucas tries it on his iPhone through the dev server on his Wi-Fi (`npm run dev -- --host`, then the address it prints). Anything he wants changed is fixed on the branch before the pull request, and any difference from this spec goes in `2026-11-15-feels-on-wheels-question-first-changes.md`.

## Left to the builder

- How the word (focused or at 3 o'clock) reaches the reducer (for example a field on the action, or a function from the controller passed to the tree and `main.ts`), keeping the reducer pure.
- How the message tells `main.ts` it lost focus (an `fw-focus-lost` like the toolbar's and the card's, or `main.ts` checking after a selection).
- The two boxes' ids and class names, and how `main.ts` refers to the card box.
- How the renderer learns about keyboard focus (a frame field like `selected`, or a setter), and the redraw triggers.
- The ring's exact gap and how it meets the half-wheel and the screen's edges, within §4.
- The locale keys' names for the two instruction lines.
- The test hook for the ring.
