# Feelings Wheel v1.3: Design

Date: 2026-11-07
Status: approved in conversation, awaiting written-spec review
Builds on: `docs/superpowers/specs/2026-11-07-feelings-wheel-v1.2-design.md` (v1.2), which builds on v1.1 and v1. Everything in v1.2 still holds unless this document replaces it, including the changes made after the v1.2 spec that `docs/ROADMAP.md` records (keys from the card, `+ = −` only on the wheel, the 12 px desktop inset, sideways phones).

## 1. Why v1.3

Using v1.2 turned up layout, card and control issues. The full feedback is in `docs/ROADMAP.md` under v1.3.

**Fixes:**
- On phones, the opened word should be centred in the space above the open card, not in the whole screen.
- The card's breadcrumbs don't line up with its header.
- Tapping empty space above or below the card on desktop does nothing.
- Pinching in on an opened core or middle word drills down to its centre child.

**Changes:**
- The card's dot-and-name row sticks to the top when the card scrolls.
- The grab cursor shows only over the wheel.
- The "How are you feeling?" message fills the card's place whenever nothing is selected.
- The theme picker becomes a one-button icon toggle.
- "Zoom out" becomes "Start over", which clears the selection.

### Out of scope

- The keyboard selection that can land on the hidden half of the phone's half-wheel ("Known bugs after v1.2" in the roadmap). Lucas wants to try it first.
- The wording review (`docs/content-review.md`), and v2 and later features.

## 2. Decisions

| Topic | Decision |
|---|---|
| Message when nothing is selected | Shows wherever the card goes, on every screen, whenever nothing is selected. Spinning never hides it. §3.1 |
| "Zoom out" | Replaced by "Start over": closes and clears, keeps the rotation. §3.2 |
| Pinch in on the opened word | Does nothing. §3.3 |
| Taps beside the card (desktop) | Count as taps outside the wheel. §3.4 |
| Grab cursor | Only over the wheel's disc. Dragging still spins from anywhere. §3.5 |
| Phone opened word | Centred between the top and the top of the unfolded card; card capped at 55% of the screen. §4.2 |
| Card header | Breadcrumbs, dot and body on one left edge; a wider gap before the name; a sticky dot-and-name row. §5.1–§5.2 |
| Theme picker | One icon button cycling System → Light → Dark, with a short-lived label. §6.2 |

## 3. Interaction

### 3.1 The message

- The message ("How are you feeling? Tap a feeling or spin to explore.", `t('hint')`) shows **exactly when nothing is selected**, on desktop and phones.
- Spinning, scrolling, pinching and the intro never hide it. Selecting a word hides it; clearing (a tap outside, Escape, Start over, Back) brings it back.
- **State:** v1.2's `State.hinted` and the `dismissHint` action are removed. `hintText(s) = s.selected === null ? t('hint') : null`.
- It is plain text. It is no longer an `aria-live` region, so it isn't re-announced each time it comes back. Clearing the selection is already announced by the tree.

### 3.2 Start over

- **Replaces "Zoom out"** in the toolbar, with the label `t('startOver')` ("Start over") and a circular-arrow icon.
- **Shows** whenever a word is selected or opened (`selected !== null`).
- **Does:** dispatches `clear` (closes if opened, and clears the selection). The camera keeps its current rotation; on phones it lands on the half-wheel. The message comes back.
- **History:** like closing. Clearing from an opened word pushes the base URL, so Back returns to the word. Clearing from a selected word changes no URL.
- **Focus:** after use, focus moves to the wheel's accessible tree (`fw-focus-lost`), as v1.2's "Zoom out" did. Hiding the button while it has focus does the same.
- **Closing without clearing** stays on the card's header button and the first Escape.

### 3.3 Pinch

- Pinching in on the **opened word** does nothing; the camera springs back. v1.1 §3.4's "pinch in on the opened word goes to its centre child" is removed.
- Pinching in on **any other word**, including the opened word's children, opens the word under the fingers, as before.
- Every other pinch rule (thresholds from v1.2 §3.4, pinching out) stands.

### 3.4 Taps beside the card (desktop)

- A tap or click on empty space in the card's column counts as a tap outside the wheel: it closes an opened word, or clears a selection.
- "Empty space" means not on the card, the message, the toolbar or any of their children.
- Phones have no column (the stage is the whole screen), so nothing changes there.

### 3.5 Grab cursor

- The canvas shows `cursor: grab` (and `grabbing` while dragging) only while the pointer is over the wheel's disc: within the outer edge of the outer ring, including the centre hole. Elsewhere it shows the default cursor.
- Dragging, scrolling and pinching still work from anywhere on the stage, as in v1.2.

## 4. Layout

### 4.1 The message panel

- Styled like the card's header row: the card's width, surface, rounded corners and shadow, with the text on the card's left edge (§5.1).
- **Desktop:** vertically centred in the column, where the card goes.
- **Phones:** at the bottom, 12 px from the edges, where the card goes.
- **The message and the card never show together.** Selecting a word swaps the message for the card with a 150 ms fade; reduced motion swaps them instantly.
- **The desktop wheel** stays centred in the stage, as in v1.2. The column always holds either the message or the card.

### 4.2 Phone: the opened word

**Card cap:**
- The card is at most 55% of the screen tall (`55dvh`), minus the 12 px bottom margin and the bottom safe area. Longer content scrolls inside the card (§5.2).
- **Safeguard:** on a short screen the cap shrinks so the gap above the card always fits the opened cell plus 12 px above and below it. The cell size is v1.2's `openedHalfHeight`.
- `--opened-half` (v1.2 §4.2) keeps feeding this, and the cap becomes `min(55dvh − 12px − safe-bottom, 100dvh − 2 × --opened-half − 24px − 12px − safe-top − safe-bottom)`.

**Placement:**
- The opened word's centre sits halfway between the top of the stage (below the top safe area) and the top of the card **once it is fully unfolded**.
- `main.ts` measures the unfolded height as soon as the card renders: the header row, the breadcrumbs and the body at their natural heights, capped as above. It passes the free gap to the controller.
- The camera goes straight to the final position; it does not follow the card while it unfolds.
- **Moving to another word** (a link, a spin, a step): the new card is measured and the vertical move joins the rotation's spring, so it is one motion.
- The horizontal rule stays as v1.2: the ring's middle at 50% of the width.

**Unchanged:**
- A selected (not opened) word: the card shows only its header at the bottom, and the wheel doesn't move.
- The desktop opened view: as v1.2, with the 12 px inset recorded in the roadmap.

## 5. The card

### 5.1 Header layout

From Lucas's sketch:

```
Surprised › Amazed ›          ← breadcrumbs: small, muted, underlined links
●     Astonished          ⌄   ← dot, a wide gap, the name; chevron on the right
Greatly surprised, almost …   ← body
```

- **One left edge:** the first breadcrumb, the dot (at rest, not mid-pulse) and the body text start on the same vertical line.
- **The gap** between the dot and the name is 1.5rem, about twice the dot's width (v1.2: 0.6rem).
- **The breadcrumbs** stay outside the toggle button. The whole dot-and-name row is the toggle (`button.fw-card-toggle` in `h2.fw-card-heading`), as in v1.2.
- **Unfold and fold** stay as v1.2 §5.2: 220 ms, the breadcrumbs growing in above the name.

### 5.2 Sticky row

- When the card scrolls, **the breadcrumbs scroll away** with the content.
- **The dot-and-name row sticks** to the top of the card (`position: sticky; top: 0`). Its background (`--surface`) and padding cover what scrolls beneath it, so content disappears under the row's bottom edge.
- **DOM:** the row's sticky container must be the card itself, so the row can stay stuck for the card's full height. The header wrapper `div.fw-card-head` no longer boxes the row in: the breadcrumbs `nav` and the `h2` become children of the card, or the wrapper uses `display: contents`.
- **Focus not obscured (WCAG 2.4.11):** the card's `scroll-padding-top` equals the sticky row's height, so an element focused with Tab scrolls into view below the row, not under it.

## 6. The toolbar

### 6.1 Order

From the right edge: the theme toggle, then "Start over" when it shows.

### 6.2 Theme toggle

- **One round icon button**, 44 × 44 px like the other toolbar buttons. It replaces the `<select>`.
- **Each tap cycles** System → Light → Dark → System. The choice is saved and applied as before (`writePref`, `applyPref`).
- **The icon shows the current choice:** a half-filled circle (System), a sun (Light), a moon (Dark). Inline SVG in `currentColor`, `aria-hidden`.
- **The label:** a small label under the button naming the choice ("Match system", "Light", "Dark").
  - It shows after each tap and fades out after about 1.5 s (300 ms fade). With reduced motion it disappears without fading.
  - It also shows on hover and on keyboard focus (`:focus-visible`), for as long as either lasts.
  - It is visual only (`aria-hidden`).
- **Screen readers:** the button's name is `t('themeButton', { choice })`, e.g. "Theme: Dark". Each change is also announced through the app's announcer (the choice's name), because a changed button name isn't reliably read out.

### 6.3 Strings

| Change | Keys |
|---|---|
| Added | `startOver` ("Start over"), `themeButton` ("Theme: {choice}") |
| Changed | `themeSystem`: "System" → "Match system" |
| Removed | `zoomOut`, `theme` |

## 7. Accessibility

Everything in v1.2 §6 and the roadmap's post-v1.2 decisions stands.

**Additions:**
- Start over moves focus to the tree (§3.2).
- Focus is never obscured by the sticky row (§5.2).
- The theme toggle has a name with its current choice and announces changes (§6.2).
- The message is not a live region (§3.1).

**Axe:** zero violations, in both light and dark, in these states: nothing selected, selected, opened, and opened with the card scrolled.

## 8. Code impact

| Area | Change |
|---|---|
| `state/store.ts` | Remove `hinted` and `dismissHint`. |
| `state/history.ts`, `main.ts` popstate | Drop the `hinted` merging. |
| `model/pinch.ts` | Pinch in on the opened word returns null. |
| `camera.ts`, `controller.ts` | The phone ring camera takes the free gap above the card; the controller springs to it when it changes, and no longer calls `dismissHint`. |
| `main.ts` | Measure the unfolded card; set the cap and the gap; taps on empty column space; the canvas cursor; the hint rule; theme toggle wiring and announcement. |
| `ui/hint.ts` | Not a live region; styled as a panel. |
| `ui/card.ts` | Header DOM for the sticky row. |
| `ui/toolbar.ts` | "Start over"; the theme toggle and its label. |
| `styles/app.css` | Message panel, card header alignment and gap, sticky row, `scroll-padding-top`, phone card cap, toolbar buttons and label, cursor. |
| `data/locales/en.json` | §6.3. |

## 9. Testing

**Unit:**
- the store without `hinted`; the message rule;
- Start over clears from selected and from opened;
- pinch in on the opened word returns null; on its child, opens the child;
- the phone ring camera centres the word in a given gap; the cap safeguard on a short screen;
- the toolbar: Start over shows when something is selected, emits `clear` then `fw-focus-lost`; the theme toggle's cycle, name, icon and label timing;
- the card: the new header DOM, with the breadcrumbs outside the toggle and the row's sticky container being the card.

**End-to-end (all five projects):**
- the message shows at start, after a spin, and after Start over; never together with the card;
- desktop: a click above the card clears the selection and closes an opened word;
- the canvas cursor is `grab` over the disc and `auto` outside it;
- phones: the opened word's centre is within 2 px of halfway between the stage top and the unfolded card's top, for a core, a middle and an outer word;
- the sticky row stays at the card's top after scrolling while the breadcrumbs scroll away; a focused row below the fold isn't under the sticky row;
- the theme toggle cycles System → Light → Dark, its label appears and then goes, and the choice survives a reload;
- axe in the four states × two themes.

**Performance:** the Chromium and Firefox gates and the size budgets, as in v1.2.

## 10. Acceptance criteria

- [ ] On phones, an opened word is centred between the top and the open card, and the card never covers it.
- [ ] The breadcrumbs, dot and body share one left edge; the name sits 1.5rem after the dot.
- [ ] Scrolling a long card scrolls the breadcrumbs away and keeps the dot-and-name row at the top.
- [ ] The message shows whenever nothing is selected and is never hidden by spinning.
- [ ] "Start over" clears the selection and moves focus to the wheel.
- [ ] Pinching in on the opened word does nothing.
- [ ] Tapping empty space beside the card on desktop closes or clears.
- [ ] The grab cursor shows only over the wheel.
- [ ] The theme toggle cycles three choices, shows the current one as an icon, and names it briefly after each tap.
- [ ] Unit, end-to-end (five projects), axe, performance and size checks all pass.
