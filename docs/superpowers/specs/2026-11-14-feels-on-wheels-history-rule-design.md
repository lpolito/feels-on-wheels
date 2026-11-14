# Feels on Wheels: history that follows where you chose to go

Approved by Lucas on 2026-11-14. A short design: it replaces §4 of the [URL redesign spec](2026-11-13-feels-on-wheels-urls-routing-design.md), before that work merges.

## Intent

Using the preview of the URL redesign, Lucas found its history rule (every change within a wheel replaces the entry) doesn't make sense going back and forth:

- Opening a word from the whole wheel adds no entry, so sometimes there's nothing to go back to.
- After a Back, opening a new word leaves Forward pointing at wherever you came back from, because only adding an entry clears the browser's Forward list.

His rule: anything that takes you to a word or a place you picked adds an entry. Moving by direction through the wheel replaces it. History follows what a move does, so the same move does the same thing with touch, a mouse, a trackpad or the keyboard (Lucas, 2026-11-14).

## The rule

| What you do | History |
|---|---|
| Any link: card rows, breadcrumbs, "Close to" and "Could also be feeling" words, the core-feeling link, the jump to the other wheel, the start message's link, About and "Back to the wheel" | Adds an entry (About's "Back to the wheel" still acts as Back when About was opened in the app) |
| Switching wheels | Adds an entry |
| Picking a word: a tap or double tap on the wheel (from the whole wheel or from another open word), Enter or `+` (the same key action), pinching in on a word, the card's toggle | Adds an entry |
| Moving by direction: a spin (drag, fling, mouse wheel, two-finger scroll, landing on whichever word it stops at), ↑ ↓, ← →, a swipe left or right on a ring (touch: the same as ← →; on a computer a drag spins), `−`, a small pinch out (the same as `−`) | Replaces the entry |
| Closing a word: Escape, tapping off the wheel, the card's toggle, Start over (Lucas, 2026-11-14: it's intentional navigation, so it builds up) | Adds an entry |
| The first change on "Feeling not found!" | Replaces the mistyped address, so Back never returns to it |
| A link to the place you're already on | Nothing |

What stays from §4:
- Pushes closer together than 250 ms merge, so a held key can't flood history. Pushes that carry state (About's) never merge.
- History API errors are swallowed.
- A first visit from a shared link has nothing behind it, so Back leaves the app.

Moving to a word's parent or child with ← →, a swipe or `−` replaces the entry, while the same move through a breadcrumb, a card row or a tap adds one. That's the rule working as intended: moving by direction versus picking.

Forward is cleared by everything but moving by direction. After a Back, a spin or an arrow to another word leaves Forward where it was, the browser's usual behavior, since you're still browsing from the same place. No extra rule for after a Back is needed (Lucas, 2026-11-14).

## Approaches

This rule is the one the app had before the URL redesign. It's `historyOp` on `main` (v1.3.1's change to the v1 spec's §3.6): moving between open words by `settled`, `step`, `toChild`, `toParent` or `stepOut` replaces, and every other change of address adds an entry. The action types already separate moving by direction from picking. Swipes and a small pinch out dispatch `toChild` or `toParent`. Taps, pinching in, card links and breadcrumbs dispatch `open`, `select` or `activate`. The redesign's §4 (replace everything within a wheel) is what broke Back and Forward.

1. **Restore `main`'s rule (chosen).** `historyOp` goes back to returning `push`, `replace` or `none` from its `MOVES` table, and `main.ts` writes pushes again. The not-found replace and About's pushes stay as the redesign built them. It's the smallest change, and `main`'s unit and end-to-end history tests are the starting point.
2. **Tag chosen actions.** A `via: 'choice'` on actions made by links and taps. Not needed: the action types already carry the distinction.
3. **Decide in each caller.** That would spread the rule across files and lose the single test table. Not chosen.

## Also in this change

- **Known issue, "Going back on phones":** recorded in full. Swiping back doesn't work at all on the wheel, because it takes every touch (`touch-action: none`), so the browser's Back button is the only way back. An app installed to the iPhone home screen has no Back at all.
- **Roadmap "Changes from the spec":** the URL redesign row says §4 was replaced by this design.
- **Tests:** `historyOp`'s unit table is rewritten for the rule above, and the end-to-end history tests follow it:
  - opening from the whole wheel, then Back, returns to the whole wheel;
  - Back after a card link returns to the word before;
  - Back, then tapping a new word, clears Forward;
  - spins, arrow keys and swipes keep `history.length`;
  - closing adds an entry.

## Left to the builder

Which of `main`'s history tests come back as they were, and which the redesign's changes (paths, About, not found) need adjusted.
