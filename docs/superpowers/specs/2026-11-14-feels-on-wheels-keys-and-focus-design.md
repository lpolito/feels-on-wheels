# Feels on Wheels: keys turn the wheel, quiet focus after a tap, real links, and tap to close

Approved by Lucas on 2026-11-14. A short design for five small changes he asked for after using the About page rework. They ship together in one change.

## Intent

1. **External links on About open new tabs.** Today only the sign-off's name and the GitHub icon do.
2. **No blue ring after a tap.** Since the URL redesign (#9), About opens inside the app and moves focus for keyboard and screen reader users: onto its heading when it opens, and back to the toolbar's About button when it closes. Switching wheels from the start message moves focus onto the new message's link. iPhone Safari doesn't focus a link you tap, so it treats these focus moves as keyboard focus and draws a ring. Lucas sees it on About's heading, on the About button after Back or the heading link, and on the "Start from body sensations instead" link. He finds it ugly, and wants an alternative that stays accessible.
3. **The arrow keys turn the wheel while a word is only selected.** On the whole wheel, when the selection reaches the left half, → (outward) points left and ↑ ↓ point the wrong way, so the keys stop making sense. An opened word already stays at 3 o'clock while the wheel turns under it. Lucas's idea: do the same for a selected word, so the keys behave the same whether a word is selected or opened, and the code has one rule instead of two.
4. **Tap the opened word to close it** (roadmap idea, 2026-11-12).
5. **The card's feeling words become real links,** so ⌘-click, Ctrl-click and middle-click open a new tab, hovering shows where they go, and they offer Copy Link and the phone's link menu. Today every one is a button.

## Goals and non-goals

- Goal: the keys mean the same thing everywhere on the wheel: → outward, ← inward, ↑ ↓ around.
- Goal: focus still lands where it does today, for everyone. Only whether the ring is drawn changes.
- Non-goal: inverting or remapping keys by where the word sits.
- Non-goal: turning the wheel for taps, clicks or spins. A tapped word stays under your finger.
- Non-goal: links on the wheel itself. It's a canvas, so a wedge can't be a real link. ⌘-click and middle-click on a wedge could be handled in code, but without the hover address, Copy Link or the phone's link menu, and a middle press must never start a spin. Lucas chose card links only (2026-11-14).
- Non-goal: the card's fold/unfold toggle stays a button. It opens and closes both ways and says which to screen readers (`aria-expanded`), which a link can't do well.
- Anti-goal: a keyboard user ever focused somewhere with no ring.

## Approaches

Only the focus ring had more than one sensible way.

1. **Remember the last input (chosen).** The app notes whether the last input it saw was a pointer press (finger, mouse, pen) or a key. When the app itself moves focus and the last input was a pointer press, the element is marked so its ring is hidden; the mark clears on the next key press or when the element loses focus. Works the same in every browser and leaves focus where it is today. The same approach as the focus-visible polyfill browsers' own `:focus-visible` grew out of.
2. **The browser's `focus({ focusVisible: false })`.** Less code, but still needs to know a tap happened, and not every browser supports it, so some would keep the ring.
3. **Move focus only for keyboard users.** Ruled out: after a tap, leaving About would drop focus to the top of the page, changing where screen readers and switch users land, which is what those focus moves are for.

Lucas's worry with 1 (2026-11-14): tracking what the user did last can miss an interaction and break. The design answers it by failing safe:

| Input | Seen as | Ring after the app moves focus |
|---|---|---|
| Finger, mouse, pen | pointer press | hidden |
| Tab, arrows, Enter, any key | key | shown |
| The browser's Back swipe after a tap | last input was a tap | hidden |
| A browser Back shortcut after a mouse click | may not reach the page | hidden until the next key, as browsers already do after a click |
| Screen readers, Switch Control, Voice Control | either | they draw their own highlight |
| Anything not seen | nothing | shown, as today |

The ring is hidden only after a pointer press the page saw, and any key brings it back, so a missed interaction can only bring back today's ring, never take one away from a keyboard user.

For the other four there's one sensible way each, below.

## The design

### New tabs for every link that leaves the site

In `linkify` (`build/site.ts`), a link opens a new tab, with `target="_blank" rel="noopener"` and "(opens in a new tab)" for screen readers, when it leaves the site: every raw `https://` link and every `{key}` whose URL isn't a path on the site. Today that's the credits' links plus `{github}`, `{accessibility}`, `{contributing}` and `{author}`. `{home}`, `{about}`, the heading link and "Back to the wheel" stay in the same tab. `NEW_TAB_KEYS` goes; the rule follows the URL.

### Quiet focus after a tap

- A new module (`src/a11y/focus.ts`) listens on the document, in the capture phase, for `pointerdown` (last input: pointer) and `keydown` (last input: key; also clears any mark). It exports one function to move focus, which every focus move the app makes goes through: About's heading, the About button on leaving About, the start message's link, the card's toggle, and the accessible tree.
- After a pointer press, that function focuses the element and sets `data-quiet-focus` on it, removed on `blur` or the next `keydown`. CSS hides the ring on `[data-quiet-focus]`.
- About's heading never draws a ring: it isn't a control, and it takes focus only so screen readers read it out. Hidden for keyboard users too.
- A unit test fails if any `.focus(` call in `src/` bypasses the function, so a new focus move can't quietly skip it.

### Keys turn the wheel

- On the whole wheel, any selection made by a key turns the wheel so the selected word's middle sits at 3 o'clock, the place an opened word sits. In the whole-wheel view only keys dispatch `step`, `toChild` and `toParent` (a swipe there is a spin), plus `activate` with nothing selected, so the controller turns the wheel for exactly those actions. Taps (`select`), spins and Escape don't turn it.
- → while selected picks the middle child (`centerChild`), as it does while opened, instead of the first child. So `step`, `toChild` and `toParent` follow one rule whether a word is selected or opened; the only difference left is whether the result is opened.
- Tabbing into the wheel still selects the first core word without turning it (it's focus, not a move); the first arrow key turns it. *(My call.)*
- The whole wheel keeps whatever rotation the keys left it at, as it already keeps its rotation on close (v1.2 §3.3). The phone's half-wheel turns too, so the word you move to is always on screen. Reduced motion jumps instead of turning, as other camera moves do.
- History doesn't change: these keys already replace the entry (history rule spec).

### Tap the opened word to close it

- A tap or click on the opened word's wedge closes the card and leaves the word selected, the same as tapping off the wheel or Escape (`close`). Lucas, 2026-11-14.
- Tapping a moving wheel still only stops it, so the guard that keeps a tap on a moving wheel from closing applies to the opened word too.
- A double tap on the opened word closes it and opens it again, so it stays open (the double tap opens the word it hit). *(My call; not worth special-casing.)*
- On the phone's half-wheel, closing leaves the word at 3 o'clock on the half-wheel.
- Enter on an opened word stays a no-op; Escape and `−` close. *(My call.)*

### The card's feeling words are links

- Every card control that goes to a word becomes an `<a href>` to that word's path (`formatRoute`), styled as today (`fw-link`): the "Narrow it down" and "Could be feeling" rows, the breadcrumbs, the "Close to" and "Could also be feeling" words, the core-feeling link in the definition, and the jump to the feelings wheel. Areas and sensations on the body wheel too, since they have paths.
- A plain click does what it does today (the same action, focus and history), with the default prevented. Any click `inAppLink` (`src/router.ts`) already leaves to the browser, such as a modified or middle click, goes to the browser, which opens a new tab. The jump's plain click still switches wheels as it does now.
- Space no longer activates them, only Enter, as with any link; `routeKey` already leaves Enter and Space to a focused link.
- History doesn't change: the history rule already treats these as links that add an entry.

### Docs

- Roadmap: a Shipped row; delete the "Tap the opened word to close it" idea and its table row.
- ACCESSIBILITY.md and the roadmap's known issues: the first known limitation ("choosing a word with the keyboard or a screen reader on a phone-size screen can choose one … off screen") is fixed for the keyboard. Remove it, or narrow it to any screen reader path that still selects without turning the wheel.

### Tests

- Unit: `linkify` opens every external link in a new tab and keeps site paths in the same one; `toChild` while selected picks the center child; the controller turns the whole wheel to center the selection on `step`, `toChild`, `toParent` and `activate`, and not on `select`; a tap on the opened word closes it, and stops a moving wheel without closing; the focus module's mark, and the no-bypass check; each card word is a link with its word's path, a plain click dispatches what it did before, and a modified click is left alone.
- End-to-end, in all five browsers: a card word's `href` is its word's address, and a plain click stays in the app; after a tap or click, About's heading, the About button on leaving and the start message's link show no ring; after a key, the button and the link do; focus still lands in the same places; arrow keys leave the selection at 3 o'clock; tapping the opened word closes it.
- In the PR, say how it was checked: the tests, the keyboard in a browser, and which hand checks (a screen reader, a real iPhone) weren't done.

## Left to the builder

- How the controller learns an action came from a key, if not from its type as above.
- The exact CSS for the quiet mark, including the theme toggle's label rule, which reacts to `:focus-visible` too.
- Whether the accessible tree's own focus moves (when the selection changes inside it) need the mark, since the tree is visually hidden.
